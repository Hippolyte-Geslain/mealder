const formatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

export function formatEUR(value: number): string {
  return formatter.format(value);
}
