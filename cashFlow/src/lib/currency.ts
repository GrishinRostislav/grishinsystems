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
