const DEFAULT_API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

export function getApiUrl(rawBase = DEFAULT_API_BASE) {
  const base = stripTrailingSlash(rawBase);
  return base.endsWith('/api') ? base : `${base}/api`;
}

export function getSocketUrl(rawBase = DEFAULT_API_BASE) {
  const base = stripTrailingSlash(rawBase);
  return base.endsWith('/api') ? base.slice(0, -4) : base;
}

export function buildAuthHeaders(token, extraHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}
