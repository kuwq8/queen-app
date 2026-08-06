export const API_URL = ''; // Deprecated, migrating to Supabase

export function getToken() {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    return null;
  }
}
