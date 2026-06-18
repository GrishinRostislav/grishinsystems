export let cachedRates: Record<string, number> = {};
export let lastFetchTime = 0;
export let currentBase = "CAD";

export async function getExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  const now = Date.now();
  // Cache for 1 hour (3600000 ms)
  if (baseCurrency === currentBase && Object.keys(cachedRates).length > 0 && (now - lastFetchTime) < 3600000) {
    return cachedRates;
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (!res.ok) throw new Error("Failed to fetch rates");
    const data = await res.json();
    cachedRates = data.rates;
    currentBase = baseCurrency;
    lastFetchTime = now;
    return cachedRates;
  } catch (err) {
    console.error("Exchange rate fetch error, falling back to 1:1", err);
    // Fallback if API fails
    return {};
  }
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): number {
  if (fromCurrency === toCurrency) return amount;
  
  const rate = rates[fromCurrency];
  if (!rate) return amount; // fallback if rate missing
  
  return amount / rate;
}

export async function getHistoricalExchangeRates(baseCurrency: string, targetCurrency: string, startDate: Date, endDate: Date): Promise<Record<string, number>> {
  if (baseCurrency === targetCurrency) return {};

  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  try {
    const res = await fetch(`https://api.frankfurter.app/${startStr}..${endStr}?from=${baseCurrency}&to=${targetCurrency}`);
    if (!res.ok) throw new Error("Failed to fetch historical rates");
    const data = await res.json();
    
    const flatRates: Record<string, number> = {};
    let lastKnownRate = 1;

    const currDate = new Date(startDate);
    while (currDate <= endDate) {
      const dStr = currDate.toISOString().slice(0, 10);
      if (data.rates && data.rates[dStr] && data.rates[dStr][targetCurrency]) {
        lastKnownRate = data.rates[dStr][targetCurrency];
      }
      flatRates[dStr] = lastKnownRate;
      currDate.setDate(currDate.getDate() + 1);
    }
    
    if (lastKnownRate === 1 && data.rates) {
      const firstAvailable = Object.values(data.rates)[0] as any;
      if (firstAvailable && firstAvailable[targetCurrency]) {
        const firstRate = firstAvailable[targetCurrency];
        for (const key in flatRates) {
          if (flatRates[key] === 1) flatRates[key] = firstRate;
          else break;
        }
      }
    }

    return flatRates;
  } catch (err) {
    console.error("Historical exchange rate fetch error, falling back", err);
    try {
      const current = await getExchangeRates(baseCurrency);
      const rate = current[targetCurrency] || 1;
      const flatRates: Record<string, number> = {};
      const currDate = new Date(startDate);
      while (currDate <= endDate) {
        flatRates[currDate.toISOString().slice(0, 10)] = rate;
        currDate.setDate(currDate.getDate() + 1);
      }
      return flatRates;
    } catch {
      return {};
    }
  }
}

