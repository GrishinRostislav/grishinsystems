export function formatCurrency(value: number, currencyCode: string = 'CAD'): string {
  if (isNaN(value)) return '$0.00';
  
  try {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}

export function formatDate(dateInput: string | Date): string {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  return date.toLocaleDateString(undefined, { timeZone: 'UTC' });
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.toLowerCase().split(/\s+/).map(word => {
    if (word.length === 0) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}
