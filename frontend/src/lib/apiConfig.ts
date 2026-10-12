/**
 * Centralized API configuration for LAWgic AI.
 * Supports configurable API base URL (via VITE_API_BASE_URL),
 * defaulting to same-origin relative URLs in production and dev proxies.
 */
export const API_BASE_URL: string = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || ''
).replace(/\/+$/, '');

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
}
