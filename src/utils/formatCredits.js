export function formatCredits(value, { maximumFractionDigits = 0 } = {}) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}
