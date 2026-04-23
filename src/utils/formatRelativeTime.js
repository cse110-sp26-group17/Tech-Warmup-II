export function formatRelativeTime(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return 'just now';
  }

  const elapsedMs = timestamp - Date.now();
  const elapsedMinutes = Math.round(elapsedMs / 60000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(elapsedMinutes) < 60) {
    return formatter.format(elapsedMinutes, 'minute');
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (Math.abs(elapsedHours) < 24) {
    return formatter.format(elapsedHours, 'hour');
  }

  const elapsedDays = Math.round(elapsedHours / 24);
  return formatter.format(elapsedDays, 'day');
}
