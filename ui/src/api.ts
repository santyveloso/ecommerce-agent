// ── API helper — wraps fetch with API key auth ──────────────────
const API = 'http://localhost:7777'

let _apiKey: string = ''

export function setApiKey(key: string) {
  _apiKey = key
}

export function getApiKey(): string {
  return _apiKey
}

export function getApiUrl(): string {
  return API
}

// Standard fetch wrapper — adds X-API-Key to all requests
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }
  // Only add auth header for non-public endpoints
  if (_apiKey) {
    headers['X-API-Key'] = _apiKey
  }
  return fetch(`${API}${path}`, {
    ...options,
    headers,
  })
}
