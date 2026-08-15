export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function getToken() {
  try {
    // 1. Try legacy token first
    const legacyToken = localStorage.getItem('token');
    if (legacyToken) return legacyToken;

    // 2. Try Supabase token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          return parsed.access_token || null;
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}
