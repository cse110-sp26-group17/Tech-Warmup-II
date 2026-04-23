/**
 * Formats a numeric credit value as a locale-aware string.
 * @param {number} value - The credit amount to format.
 * @param {{maximumFractionDigits?: number}} [options={}]
 * @returns {string} Formatted number string (e.g. "1,250").
 */
export function formatCredits(value, { maximumFractionDigits = 0 } = {}) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}
