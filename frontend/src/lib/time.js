export function relativeTime(timestamp) {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();

  if (diff < 60 * 1000) return 'hace segundos';
  if (diff < 60 * 60 * 1000) return `hace ${Math.floor(diff / (60 * 1000))} min`;
  if (diff < 24 * 60 * 60 * 1000) return `hace ${Math.floor(diff / (60 * 60 * 1000))} h`;
  return `hace ${Math.floor(diff / (24 * 60 * 60 * 1000))} d`;
}

export function absoluteTime(timestamp, includeSeconds = true) {
  return new Date(timestamp).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
  });
}

export function inTimeWindow(timestamp, windowKey) {
  if (windowKey === 'ALL') return true;

  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (windowKey === '15M') return ageMs <= 15 * 60 * 1000;
  if (windowKey === '1H') return ageMs <= 60 * 60 * 1000;
  if (windowKey === '24H') return ageMs <= 24 * 60 * 60 * 1000;
  if (windowKey === '7D') return ageMs <= 7 * 24 * 60 * 60 * 1000;
  if (windowKey === '30D') return ageMs <= 30 * 24 * 60 * 60 * 1000;

  return true;
}
