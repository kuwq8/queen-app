export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://queen-app.onrender.com';

export function getToken() {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    return null;
  }
}
