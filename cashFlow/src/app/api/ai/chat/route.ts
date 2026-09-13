import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60; // Allow 60s for Gemini financial audit analysis

export async function POST(request: Request) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message string is required." }, { status: 400 });
    }

    // 1. Gather comprehensive financial context from Prisma DB
    let settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "global", homeCurrency: "CAD" } });
    }
    const homeCurrency = settings.homeCurrency;
    const rates = await getExchangeRates(homeCurrency);

    // Accounts & balances
    const accounts = await prisma.account.findMany({
      where: { isArchived: false }
    });
    const totalBalance = accounts
      .filter(a => a.includeInTotal)
      .reduce((acc, a) => acc + convertAmount(a.balance, a.currency, homeCurrency, rates), 0);

    const accountsSummary = accounts.map(a => 
      `- ${a.name} (${a.currency}): ${a.balance.toFixed(2)} [В общем балансе: ${a.includeInTotal ? 'Да' : 'Нет'}]`
    ).join('\n');

    // Recent 30 days & 90 days date bounds
    const now = new Date();
    const past30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const past90DaysStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: past90DaysStart } },
      include: { category: true, account: true },
      orderBy: { date: 'desc' }
    });

    let totalIncome30 = 0;
    let totalExpense30 = 0;
    const categoryExpenseMap = new Map<string, number>();

    const recentTxList: string[] = [];

    for (const tx of transactions) {
      if (tx.isTransfer) continue;
      const convertedAmt = convertAmount(tx.amount, tx.account.currency, homeCurrency, rates);

      if (tx.date >= past30DaysStart) {
        if (convertedAmt > 0) {
          totalIncome30 += convertedAmt;
        } else {
          const expenseVal = Math.abs(convertedAmt);
          totalExpense30 += expenseVal;
          const catName = tx.category ? tx.category.name : 'Без категории';
          categoryExpenseMap.set(catName, (categoryExpenseMap.get(catName) || 0) + expenseVal);
        }
      }

      if (recentTxList.length < 30) {
        const dateStr = new Date(tx.date).toISOString().split('T')[0];
        const catName = tx.category ? tx.category.name : 'Без категории';
        const sign = convertedAmt > 0 ? '+' : '';
        recentTxList.push(`${dateStr} | ${tx.merchant || tx.description || 'Транзакция'} | ${sign}${convertedAmt.toFixed(2)} ${homeCurrency} | Категория: ${catName}`);
      }
    }

    const netMonthlyCashflow30 = totalIncome30 - totalExpense30;
    const emergencyBuffer3M = totalExpense30 * 3; // 3 months of expenses

    const topCategoriesSummary = Array.from(categoryExpenseMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat, amt]) => `- ${cat}: ${amt.toFixed(2)} ${homeCurrency}`)
      .join('\n');

    // Budgets
    const budgets = await prisma.budget.findMany({ include: { categories: true } });
    const budgetsSummary = budgets.map(b => 
      `- Бюджет "${b.name}": Лимит ${b.amount} ${homeCurrency} (${b.period}, ${b.isGlobal ? 'Глобальный' : 'По категориям: ' + b.categories.map(c => c.name).join(', ')})`
    ).join('\n');

    // Scheduled Payments
    const scheduled = await prisma.scheduledTransaction.findMany({ where: { isActive: true } });
    const scheduledSummary = scheduled.map(s => 
      `- ${s.name || 'Платеж'}: ${s.amount} (${s.frequency}) | Следующий запуск: ${new Date(s.nextRunDate).toISOString().split('T')[0]}`
    ).join('\n');

    // Active Scenarios
    const scenarios = await prisma.forecastScenario.findMany({ include: { items: true } });
    const scenariosSummary = scenarios.map(s => 
      `- Сценарий "${s.name}" [Активен: ${s.isActive ? 'Да' : 'Нет'}]: ${s.items.length} элементов`
    ).join('\n');

    // 2. Build AI Context Prompt
    const systemPrompt = `
Вы — персональный ИИ-Финансовый Советник в приложении CashFlow.
Ваша цель — давать четкие, объективные, профессиональные и доброжелательные финансовые советы, проводить аудит расходов, помогать экономить и отвечать на любые вопросы пользователя по его финансовому состоянию.

ВАЛЮТА ПО УМОЛЧАНИЮ: ${homeCurrency}

АКТУАЛЬНЫЕ ФИНАНСОВЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ИЗ БАЗЫ DEDICATED PRISMA:

1. ТЕКУЩИЙ ОБЩИЙ БАЛАНС СЧЕТОВ: ${totalBalance.toFixed(2)} ${homeCurrency}
Счета:
${accountsSummary || 'Нет активных счетов'}

2. АКТИВНОСТЬ ЗА ПОСЛЕДНИЕ 30 ДНЕЙ:
- Общий доход: +${totalIncome30.toFixed(2)} ${homeCurrency}
- Общие расходы: -${totalExpense30.toFixed(2)} ${homeCurrency}
- Чистый остаток (Cash Flow): ${netMonthlyCashflow30.toFixed(2)} ${homeCurrency}
- 3-месячная Подушка Безопасности (3x расходы): ${emergencyBuffer3M.toFixed(2)} ${homeCurrency}

ТОП КАТЕГОРИЙ РАСХОДОВ ЗА 30 ДНЕЙ:
${topCategoriesSummary || 'Нет расходов за 30 дней'}

3. АКТИВНЫЕ БЮДЖЕТЫ:
${budgetsSummary || 'Бюджеты не настроены'}

4. ЗАПЛАНИРОВАННЫЕ РЕГУЛЯРНЫЕ ПЛАТЕЖИ:
${scheduledSummary || 'Нет запланированных платежей'}

5. СЦЕНАРИИ СИМУЛЯЦИИ:
${scenariosSummary || 'Сценарии не созданы'}

6. ПОСЛЕДНИЕ 30 ОПЕРАЦИЙ ИЗ БАЗЫ:
${recentTxList.join('\n') || 'Нет операций'}

ПРАВИЛА И СТИЛЬ ОТВЕТА:
- Отвечайте на русском языке в вежливом, уверенном и экспертном тоне.
- Используйте форматирование Markdown (жирный текст, маркированные списки, смайлики-эмодзи).
- Базируйте свои выводы и рекомендации СТРОГО на приведенных выше реальных данных из базы данных CashFlow.
- При вопросах о покупках или экономии всегда учитывайте 3-месячную подушку безопасности ($${emergencyBuffer3M.toFixed(0)}) и текущий чистый доход ($${netMonthlyCashflow30.toFixed(0)}/мес).
- Ответы должны быть лаконичными, практичными и содержать конкретные цифры и шаги.
`;

    // Fallback response if GEMINI_API_KEY is not set
    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        reply: `🤖 **ИИ-Ассистент CashFlow (Демо-режим)**\n\n**Ваш текущий баланс:** ${totalBalance.toFixed(2)} ${homeCurrency}\n**Расходы за месяц:** ${totalExpense30.toFixed(2)} ${homeCurrency}\n**Рекомендуемая подушка:** ${emergencyBuffer3M.toFixed(2)} ${homeCurrency}\n\n💡 *Для активации полноценного диалогового ИИ добавьте GEMINI_API_KEY в окружение.*`
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash-lite'
    ];

    let replyText = "";
    let lastError = null;

    // Convert conversation history if present
    const contents: any[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Здравствуйте! Я ваш персональный финансовый ассистент CashFlow. Чем я могу помочь вам прямо сейчас?" }] }
    ];

    if (Array.isArray(history)) {
      for (const h of history) {
        if (h.role && h.content) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({ contents });
        const response = await result.response;
        replyText = response.text();
        if (replyText && replyText.trim().length > 0) {
          break;
        }
      } catch (err) {
        console.warn(`Model ${modelName} error in chat API:`, err);
        lastError = err;
      }
    }

    if (!replyText) {
      throw lastError || new Error("Failed to generate AI chat response");
    }

    return NextResponse.json({ reply: replyText });
  } catch (error) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json({ error: "Failed to communicate with AI Assistant" }, { status: 500 });
  }
}
