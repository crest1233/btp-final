let authToken: string | null = null;

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE_URL || '';

function resolveUrl(path: string): string {
  // If path is already absolute (http/https), return as-is
  if (/^https?:\/\//i.test(path)) return path;
  if (API_BASE) {
    const base = String(API_BASE).replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }
  return path; // relative to current origin
}

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('inverso_token', token);
  else localStorage.removeItem('inverso_token');
}

export function getToken(): string | null {
  if (authToken) return authToken;
  const t = localStorage.getItem('inverso_token');
  authToken = t;
  return t;
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = resolveUrl(path);
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function get<T = any>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export async function post<T = any>(path: string, body: any): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function put<T = any>(path: string, body: any): Promise<T> {
  return apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) });
}

export async function del<T = any>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}

// Multipart upload helper for Cloudinary uploads endpoint
export async function upload<T = any>(path: string, file: File, extraFields?: Record<string, string>): Promise<T> {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  if (extraFields) {
    for (const [k, v] of Object.entries(extraFields)) form.append(k, v);
  }
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = resolveUrl(path);
  const res = await fetch(url, { method: 'POST', body: form, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Upload failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}