import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function callOpenAI(apiKey: string, systemPrompt: string, history: any[], message: string, preferredModel?: string) {
  const messages: any[] = [{ role: "system", content: systemPrompt }];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.role && h.content) {
        messages.push({
          role: h.role === "user" ? "user" : "assistant",
          content: h.content
        });
      }
    }
  }
  messages.push({ role: "user", content: message });

  const defaultModels = ["gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol", "gpt-6-astra", "gpt-4o-mini", "gpt-4o"];
  const models = preferredModel && preferredModel.trim()
    ? Array.from(new Set([preferredModel.trim(), ...defaultModels]))
    : defaultModels;

  let lastError: any = null;

  for (const model of models) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `OpenAI API error (${res.status})`);
      }

      const text = data?.choices?.[0]?.message?.content;
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: any) {
      console.warn(`OpenAI model ${model} error:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to call OpenAI API");
}

async function callGemini(apiKey: string, systemPrompt: string, history: any[], message: string, preferredModel?: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const defaultModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];
  const modelsToTry = preferredModel && preferredModel.trim()
    ? Array.from(new Set([preferredModel.trim(), ...defaultModels]))
    : defaultModels;

  const contents: any[] = [];
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

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      console.warn(`Gemini model ${modelName} error:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to call Gemini API");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: "Message string is required." }, { status: 400 });
    }

    // 1. Gather comprehensive financial context from Prisma DB
    let settings = await prisma.settings.findUnique({
      where: { id: "global" },
      select: { homeCurrency: true, openaiApiKey: true, geminiApiKey: true, aiModel: true, aiCustomInstructions: true, aiFinancialGoal: true, aiAuditTone: true, aiMinBufferMonths: true }
    }).catch(() => null);
    const homeCurrency = settings?.homeCurrency || "CAD";
    const rates = await getExchangeRates(homeCurrency);

    const isGeminiFormat = (k: string) => k.startsWith("AIza") || k.startsWith("AQ.") || k.startsWith("AQ");
    const isOpenAIFormat = (k: string) => k.startsWith("sk-");

    let openaiKey = (settings?.openaiApiKey || "").trim().replace(/^['"\\]+|['"\\]+$/g, '');
    let geminiKey = (settings?.geminiApiKey || "").trim().replace(/^['"\\]+|['"\\]+$/g, '');

    if (openaiKey && isGeminiFormat(openaiKey) && !geminiKey) {
      geminiKey = openaiKey;
      openaiKey = "";
    } else if (geminiKey && isOpenAIFormat(geminiKey) && !openaiKey) {
      openaiKey = geminiKey;
      geminiKey = "";
    }

    if (!openaiKey) openaiKey = (process.env.OPENAI_API_KEY || "").trim().replace(/^['"\\]+|['"\\]+$/g, '');
    if (!geminiKey) geminiKey = (process.env.GEMINI_API_KEY || "").trim().replace(/^['"\\]+|['"\\]+$/g, '');
    const selectedModel = settings?.aiModel || "gpt-5.6-luna";

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

    const monthlyMap = new Map<string, { income: number; expense: number }>();

    for (const tx of allTransactions) {
      if (tx.isTransfer) continue;
      const convertedAmt = convertAmount(tx.amount, tx.account.currency, homeCurrency, rates);

      const d = new Date(tx.date);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(yearMonth)) {
        monthlyMap.set(yearMonth, { income: 0, expense: 0 });
      }
      const mData = monthlyMap.get(yearMonth)!;

      if (convertedAmt > 0) {
        allTimeIncome += convertedAmt;
        mData.income += convertedAmt;
        if (tx.date >= past365DaysStart) income365 += convertedAmt;
        if (tx.date >= past180DaysStart) income180 += convertedAmt;
        if (tx.date >= past30DaysStart) income30 += convertedAmt;
      } else {
        const val = Math.abs(convertedAmt);
        allTimeExpense += val;
        mData.expense += val;
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

    const sortedMonths = Array.from(monthlyMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    const activeMonthsCount = Math.max(1, sortedMonths.length);
    const realAvgMonthlyExpense = allTimeExpense / activeMonthsCount;
    const realAvgMonthlyIncome = allTimeIncome / activeMonthsCount;

    const monthlyBreakdownText = sortedMonths.map(([m, data]) => 
      `- Месяц ${m}: Доход +${data.income.toFixed(2)} ${homeCurrency} | Расход -${data.expense.toFixed(2)} ${homeCurrency} | Чистый остаток: ${(data.income - data.expense).toFixed(2)} ${homeCurrency}`
    ).join('\n');

    let historyMonthsSpan = activeMonthsCount;
    if (firstTxDate) {
      const diffMs = Math.max(0, now.getTime() - firstTxDate.getTime());
      historyMonthsSpan = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
    }

    const topCategoriesSummary = Array.from(categoryExpense365.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([cat, amt]) => `- ${cat}: всего ${amt.toFixed(2)} ${homeCurrency} (среднее ${(amt / activeMonthsCount).toFixed(2)} ${homeCurrency}/мес)`)
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
    const minBufferMonths = settings?.aiMinBufferMonths ?? 3;
    const customTone = settings?.aiAuditTone || "strict";
    const customInstructionsRaw = settings?.aiCustomInstructions || "";
    let customInstructionsFormatted = "";

    if (customInstructionsRaw.trim()) {
      try {
        const parsed = JSON.parse(customInstructionsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          customInstructionsFormatted = parsed
            .map((item: any, idx: number) => {
              const str = typeof item === 'string' ? item : item?.text || String(item);
              return `  ${idx + 1}. ${str}`;
            })
            .join('\n');
        }
      } catch {
        customInstructionsFormatted = customInstructionsRaw
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean)
          .map((line, idx) => `  ${idx + 1}. ${line}`)
          .join('\n');
      }
    }

    const toneLabels: Record<string, string> = {
      strict: "Строгая (критика трат, прямой жесткий аудит)",
      supportive: "Поддерживающая (мягкие советы и похвала)",
      analytical: "Аналитическая (только сухие факты, цифры и расчёты)"
    };
    const toneText = toneLabels[customTone] || customTone;

    const userBufferTarget = realAvgMonthlyExpense * minBufferMonths;

    // 2. Build AI Context Prompt
    const systemPrompt = `
Вы — персональный ИИ-Финансовый Советник в приложении CashFlow.

🚨 КРИТИЧЕСКИ ВАЖНЫЕ ПЕРСОНАЛЬНЫЕ ПРАВИЛА ПОЛЬЗОВАТЕЛЯ (ВЫ ДОЛЖНЫ НЕУКОСНИТЕЛЬНО СЛЕДОВАТЬ ИМ В КАЖДОМ ОТВЕТЕ):
${customInstructionsFormatted ? customInstructionsFormatted : '  (Персональные правила пока не заданы)'}

ПРИОРИТЕТНЫЕ НАСТРОЙКИ АНАЛИЗА:
- Тональность общения и аудита: **${toneText}**
- Расчетная подушка безопасности на **${minBufferMonths} месяцев**: ${userBufferTarget.toFixed(2)} ${homeCurrency} (из расчета реальных расходов ${realAvgMonthlyExpense.toFixed(2)} ${homeCurrency}/мес)
- Основная валюта: **${homeCurrency}**

У ВАС ЕСТЬ ПОЛНЫЙ ДОСТУП КО ВСЕЙ БАЗЕ ДАННЫХ CASHFLOW И ВСЕЙ ИСТОРИИ ОПЕРАЦИЙ ПОЛЬЗОВАТЕЛЯ!
Никогда не утверждайте, что у вас нет доступа к данным. Все данные из базы приведены ниже по каждому месяцу.

АКТУАЛЬНЫЕ ФИНАНСОВЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ИЗ БАЗЫ PRISMA:

1. СЧЕТА И БАЛАНСЫ:
- Общий ликвидный баланс: ${totalBalance.toFixed(2)} ${homeCurrency}
Счета:
${accountsSummary || 'Нет активных счетов'}

2. ПОМЕСЯЧНАЯ ДЕТАЛИЗАЦИЯ (АКТИВНЫХ МЕСЯЦЕВ В БАЗЕ: ${activeMonthsCount}):
${monthlyBreakdownText || 'Нет данных по месяцах'}

3. ОБЩАЯ ИСТОРИЯ И СРЕДНИЕ ПОКАЗАТЕЛИ (Всего операций в базе: ${totalTxCount}):
- Всего доходов за все время: +${allTimeIncome.toFixed(2)} ${homeCurrency} (реальное среднее: +${realAvgMonthlyIncome.toFixed(2)} ${homeCurrency}/мес за ${activeMonthsCount} активных мес.)
- Всего расходов за все время: -${allTimeExpense.toFixed(2)} ${homeCurrency} (реальное среднее: -${realAvgMonthlyExpense.toFixed(2)} ${homeCurrency}/мес за ${activeMonthsCount} активных мес.)
- **Расчитанная подушка безопасности на ${minBufferMonths} мес: ${userBufferTarget.toFixed(2)} ${homeCurrency}**

4. ПОСЛЕДНИЕ 30 ДНЕЙ:
- Доход за 30 дней: +${income30.toFixed(2)} ${homeCurrency}
- Расходы за 30 дней: -${expense30.toFixed(2)} ${homeCurrency}
- Чистый остаток за 30 дней: ${(income30 - expense30).toFixed(2)} ${homeCurrency}

5. РАСПРЕДЕЛЕНИЕ РАСХОДОВ ПО КАТЕГОРИЯМ:
${topCategoriesSummary || 'Нет данных по категориям'}

6. АКТИВНЫЕ БЮДЖЕТЫ:
${budgetsSummary || 'Бюджеты не настроены'}

7. ЗАПЛАНИРОВАННЫЕ РЕГУЛЯРНЫЕ ПЛАТЕЖИ:
${scheduledSummary || 'Нет запланированных платежей'}

8. СЦЕНАРИИ СИМУЛЯЦИИ:
${scenariosSummary || 'Сценарии не созданы'}

9. ПОСЛЕДНИЕ ОПЕРАЦИИ ИЗ БАЗЫ (до 40 операций):
${recentTxList.join('\n') || 'Нет операций'}

ПРАВИЛА И СТИЛЬ ОТВЕТА ИИ:
- Отвечайте строго на русском языке в заданном тоне: "${toneText}".
- СТРОГО И НЕУКОСНИТЕЛЬНО соблюдайте персональные правила пользователя:
${customInstructionsFormatted ? customInstructionsFormatted : '  (Нет дополнительных ограничений)'}
- ВАЖНО: Не берите "слепое деление на 12 месяцев", если операции велись меньше 12 месяцев! Смотрите на конкретные помесячные цифры выше.
- Если пользователь спрашивает про свои правила, инструкции или условия, перечислите ВСЕ СПЕЦИАЛЬНЫЕ ИНСТРУКЦИИ выше ДОСЛОВНО пунктами.
- Базируйте свои выводы и рекомендации СТРОГО на приведенных выше реальных данных из базы данных CashFlow.
- При вопросах о покупках или экономии всегда учитывайте ${minBufferMonths}-месячную подушку безопасности (${userBufferTarget.toFixed(0)} ${homeCurrency}).
- Ответы должны быть лаконичными, практичными и содержать конкретные цифры и шаги.
`;

    const isGeminiModel = selectedModel.startsWith("gemini") || (geminiKey && !openaiKey);
    const activeKey = isGeminiModel ? (geminiKey || openaiKey) : (openaiKey || geminiKey);

    // Fallback response if no API key is provided
    if (!activeKey) {
      return NextResponse.json({
        reply: `🤖 **ИИ-Ассистент CashFlow (Демо-режим)**\n\n**Ваш текущий баланс:** ${totalBalance.toFixed(2)} ${homeCurrency}\n**Расходы за 30 дней:** -${expense30.toFixed(2)} ${homeCurrency}\n**Рекомендуемая подушка:** ${userBufferTarget.toFixed(2)} ${homeCurrency}\n\n💡 *Для активации полноценного диалогового ИИ добавьте OpenAI API Key или Gemini API Key в Настройках.*`
      });
    }

    let replyText = "";
    let lastError: any = null;

    if (isGeminiModel && geminiKey) {
      try {
        replyText = await callGemini(geminiKey, systemPrompt, history, message, selectedModel);
      } catch (err) {
        lastError = err;
        if (openaiKey) {
          try {
            replyText = await callOpenAI(openaiKey, systemPrompt, history, message, selectedModel);
          } catch (oErr) {
            // Keep Gemini error as primary
          }
        }
      }
    } else if (openaiKey) {
      try {
        replyText = await callOpenAI(openaiKey, systemPrompt, history, message, selectedModel);
      } catch (err) {
        lastError = err;
        if (geminiKey) {
          try {
            replyText = await callGemini(geminiKey, systemPrompt, history, message, selectedModel);
          } catch (gErr) {
            // Keep OpenAI error as primary
          }
        }
      }
    } else if (geminiKey) {
      try {
        replyText = await callGemini(geminiKey, systemPrompt, history, message, selectedModel);
      } catch (err) {
        lastError = err;
      }
    }

    if (!replyText) {
      const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
      if (isGeminiModel) {
        replyText = `⚠️ **Ошибка Google Gemini API Key**\n\nКлюч Gemini API недействителен (ошибка: \`${errMsg}\`).\n\nПроверьте ваш ключ на [Google AI Studio](https://aistudio.google.com/app/apikey) или используйте ключ OpenAI (\`sk-...\`) в Настройках приложения.`;
      } else {
        replyText = `⚠️ **Ошибка OpenAI (ChatGPT) API Key**\n\nПроизошла ошибка при обращении к OpenAI API:\n\`${errMsg}\`\n\nПроверьте ваш API-ключ в Настройках приложения (откройте ⚙️ Настройки -> вставьте новый ключ OpenAI) и убедитесь в наличии средств на балансе OpenAI.`;
      }
    }

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json({ error: error?.message || String(error) || "Failed to communicate with AI Assistant" }, { status: 500 });
  }
}
