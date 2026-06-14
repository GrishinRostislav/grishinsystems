export function formatCurrency(value: number): string {
  if (isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateInput: string | Date): string {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  return date.toLocaleDateString(undefined, { timeZone: 'UTC' });
}
