export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatCurrencyCompact = (amount: number): string =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('nl-NL').format(value);
