export const API_URL = '/api';

export function getToken() {
  try {
    return localStorage.getItem('token');
  } catch (e) {
    return null;
  }
}
