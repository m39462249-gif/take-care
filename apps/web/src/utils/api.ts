/**
 * API client configuration helper for Take Care (Eje Platform).
 * 
 * In production (Railway), VITE_API_URL can be configured to point to the backend service:
 * e.g. VITE_API_URL="https://ejeapi-production.up.railway.app"
 * 
 * If not set, it defaults to the known Railway API domain in production or empty string in local development (using Vite proxy).
 */

export const API_BASE_URL: string = (
  ((import.meta as any).env?.VITE_API_URL as string | undefined) ||
  ((import.meta as any).env?.PROD ? "https://ejeapi-production.up.railway.app" : "")
).replace(/\/+$/, "");

/**
 * Helper to construct an absolute or proxied API URL.
 * e.g. apiUrl('/api/auth/login') -> 'https://ejeapi-production.up.railway.app/api/auth/login'
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
