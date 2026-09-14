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
    let settings = await prisma.settings.findUnique({
      where: { id: "global" },
      select: { homeCurrency: true, aiCustomInstructions: true, aiFinancialGoal: true, aiAuditTone: true, aiMinBufferMonths: true }
    }).catch(() => null);
    const homeCurrency = settings?.homeCurrency || "CAD";
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

    // Query ALL transactions from DB for complete multi-year history
    const allTransactions = await prisma.transaction.findMany({
      include: { category: true, account: true },
      orderBy: { date: 'desc' }
    });

    const now = new Date();
    const totalTxCount = allTransactions.length;
    let firstTxDate: Date | null = null;
    let lastTxDate: Date | null = null;

    if (totalTxCount > 0) {
      firstTxDate = allTransactions[allTransactions.length - 1].date;
      lastTxDate = allTransactions[0].date;
    }

    const past30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const past180DaysStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const past365DaysStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    let allTimeIncome = 0;
    let allTimeExpense = 0;

    let income365 = 0;
    let expense365 = 0;

    let income180 = 0;
    let expense180 = 0;

    let income30 = 0;
    let expense30 = 0;

    const categoryExpense365 = new Map<string, number>();
    const recentTxList: string[] = [];

    for (const tx of allTransactions) {
      if (tx.isTransfer) continue;
      const convertedAmt = convertAmount(tx.amount, tx.account.currency, homeCurrency, rates);

      if (convertedAmt > 0) {
        allTimeIncome += convertedAmt;
        if (tx.date >= past365DaysStart) income365 += convertedAmt;
        if (tx.date >= past180DaysStart) income180 += convertedAmt;
        if (tx.date >= past30DaysStart) income30 += convertedAmt;
      } else {
        const val = Math.abs(convertedAmt);
        allTimeExpense += val;
        if (tx.date >= past365DaysStart) {
          expense365 += val;
          const catName = tx.category ? tx.category.name : 'Без категории';
          categoryExpense365.set(catName, (categoryExpense365.get(catName) || 0) + val);
        }
        if (tx.date >= past180DaysStart) expense180 += val;
        if (tx.date >= past30DaysStart) expense30 += val;
      }

      if (recentTxList.length < 40) {
        const dateStr = new Date(tx.date).toISOString().split('T')[0];
        const catName = tx.category ? tx.category.name : 'Без категории';
        const sign = convertedAmt > 0 ? '+' : '';
        recentTxList.push(`${dateStr} | ${tx.merchant || tx.description || 'Операция'} | ${sign}${convertedAmt.toFixed(2)} ${homeCurrency} | Категория: ${catName}`);
      }
    }

    let historyMonthsSpan = 1;
    if (firstTxDate) {
      const diffMs = Math.max(0, now.getTime() - firstTxDate.getTime());
      historyMonthsSpan = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
    }

    const monthsFor12M = Math.min(12, historyMonthsSpan);
    const avgMonthlyIncome12M = income365 / monthsFor12M;
    const avgMonthlyExpense12M = expense365 / monthsFor12M;
    const emergencyBuffer12M = avgMonthlyExpense12M * 3;

    const avgMonthlyIncomeAllTime = allTimeIncome / historyMonthsSpan;
    const avgMonthlyExpenseAllTime = allTimeExpense / historyMonthsSpan;

    const topCategoriesSummary12M = Array.from(categoryExpense365.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([cat, amt]) => `- ${cat}: ${amt.toFixed(2)} ${homeCurrency} (среднее ${(amt / monthsFor12M).toFixed(2)} ${homeCurrency}/мес)`)
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

    // Compute custom user settings for AI
    const minBufferMonths = settings.aiMinBufferMonths ?? 3;
    const customGoal = settings.aiFinancialGoal || "balanced";
    const customTone = settings.aiAuditTone || "strict";
    const customInstructions = settings.aiCustomInstructions || "";

    const userBufferTarget = avgMonthlyExpense12M * minBufferMonths;

    // 2. Build AI Context Prompt
    const systemPrompt = `
Вы — персональный ИИ-Финансовый Советник в приложении CashFlow.
У ВАС ЕСТЬ ПОЛНЫЙ ДОСТУП КО ВСЕЙ БАЗЕ ДАННЫХ CASHFLOW И ВСЕЙ ИСТОРИИ ОПЕРАЦИЙ ПОЛЬЗОВАТЕЛЯ ИЗ БАЗЫ!
Никогда не утверждайте, что у вас нет доступа к годовым данным или истории! Вся статистика за все время, за 12 месяцев, 6 месяцев и 30 дней приведена ниже.

ВАЖНЕЙШИЕ ПОЛЬЗОВАТЕЛЬСКИЕ НАСТРОЙКИ И ПРАВИЛА ИИ:
- Целевая подушка безопасности: **${minBufferMonths} месяцев** расходов (Цель = $${userBufferTarget.toFixed(2)} ${homeCurrency}).
- Финансовая цель пользователя: **${customGoal}**
- Тональность аудита/анализа: **${customTone}**
${customInstructions ? `- СПЕЦИАЛЬНЫЕ ИНСТРУКЦИИ И ПРАВИЛА ПОЛЬЗОВАТЕЛЯ:\n  "${customInstructions}"` : ''}

ВАЛЮТА ПО УМОЛЧАНИЮ: ${homeCurrency}

АКТУАЛЬНЫЕ ФИНАНСОВЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ИЗ БАЗЫ PRISMA:

1. СЧЕТА И БАЛАНСЫ:
- Общий ликвидный баланс: ${totalBalance.toFixed(2)} ${homeCurrency}
Счета:
${accountsSummary || 'Нет активных счетов'}

2. ИСТОРИЯ ЗА ВСЕ ВРЕМЯ (Всего операций в базе: ${totalTxCount}, с ${firstTxDate ? firstTxDate.toISOString().split('T')[0] : 'начала'}, всего месяцев: ${historyMonthsSpan}):
- Всего получено доходов за все время: +${allTimeIncome.toFixed(2)} ${homeCurrency} (в среднем ${avgMonthlyIncomeAllTime.toFixed(2)} ${homeCurrency}/мес)
- Всего потрачено за все время: -${allTimeExpense.toFixed(2)} ${homeCurrency} (в среднем ${avgMonthlyExpenseAllTime.toFixed(2)} ${homeCurrency}/мес)

3. АНАЛИЗ ЗА ПОСЛЕДНИЕ 12 МЕСЯЦЕВ (Годовые данные):
- Общий доход за 12 мес: +${income365.toFixed(2)} ${homeCurrency} (среднемесячный: +${avgMonthlyIncome12M.toFixed(2)} ${homeCurrency}/мес)
- Общие расходы за 12 мес: -${expense365.toFixed(2)} ${homeCurrency} (среднемесячный: -${avgMonthlyExpense12M.toFixed(2)} ${homeCurrency}/мес)
- Чистый годовой Cash Flow: ${(income365 - expense365).toFixed(2)} ${homeCurrency}
- **Расчитанная подушка безопасности на ${minBufferMonths} мес: ${userBufferTarget.toFixed(2)} ${homeCurrency}**

4. АНАЛИЗ ЗА ПОСЛЕДНИЕ 30 ДНЕЙ (Текущий месяц):
- Доход за 30 дней: +${income30.toFixed(2)} ${homeCurrency}
- Расходы за 30 дней: -${expense30.toFixed(2)} ${homeCurrency}
- Чистый остаток за 30 дней: ${(income30 - expense30).toFixed(2)} ${homeCurrency}

5. РАСПРЕДЕЛЕНИЕ РАСХОДОВ ПО КАТЕГОРИЯМ ЗА 12 МЕСЯЦЕВ:
${topCategoriesSummary12M || 'Нет данных по категориям'}

6. АКТИВНЫЕ БЮДЖЕТЫ:
${budgetsSummary || 'Бюджеты не настроены'}

7. ЗАПЛАНИРОВАННЫЕ РЕГУЛЯРНЫЕ ПЛАТЕЖИ:
${scheduledSummary || 'Нет запланированных платежей'}

8. СЦЕНАРИИ СИМУЛЯЦИИ:
${scenariosSummary || 'Сценарии не созданы'}

9. ПОСЛЕДНИЕ ОПЕРАЦИИ ИЗ БАЗЫ DEDICATED (до 40 операций):
${recentTxList.join('\n') || 'Нет операций'}

ПРАВИЛА И СТИЛЬ ОТВЕТА:
- Отвечайте на русском языке в тоне, соответствующем настройке (${customTone}).
- Используйте форматирование Markdown (жирный текст, маркированные списки, смайлики-эмодзи).
- Базируйте свои выводы и рекомендации СТРОГО на приведенных выше реальных данных из базы данных CashFlow.
- При вопросах о покупках или экономии всегда учитывайте ${minBufferMonths}-месячную подушку безопасности ($${userBufferTarget.toFixed(0)}) и индивидуальную цель (${customGoal}).
- Если пользователь задал специальные инструкции (${customInstructions}), неукоснительно придерживайтесь их.
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
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
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
      replyText = `🤖 **ИИ-Финансовый Советник CashFlow**\n\n**Ваш текущий баланс:** ${totalBalance.toFixed(2)} ${homeCurrency}\n**Доходы за 30 дней:** +${income30.toFixed(2)} ${homeCurrency}\n**Расходы за 30 дней:** -${expense30.toFixed(2)} ${homeCurrency}\n**Чистый доход:** ${(income30 - expense30).toFixed(2)} ${homeCurrency}\n**Целевая подушка (${minBufferMonths} мес):** ${userBufferTarget.toFixed(2)} ${homeCurrency}\n\n💡 *Примечание: Внешний ИИ-сервер временно загружен. Автоматически сформирована оперативная финансовая аналитика по вашим данным.*`;
    }

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json({ error: error?.message || String(error) || "Failed to communicate with AI Assistant" }, { status: 500 });
  }
}
