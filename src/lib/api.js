import axios from 'axios';

const TOKEN_STORAGE_KEY = 'ballerleague.auth.token';
const USER_STORAGE_KEY = 'ballerleague.auth.user';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthSession(token, user) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  window.dispatchEvent(new Event('auth:changed'));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(new Event('auth:changed'));
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_URL;

  if (configuredBaseUrl && configuredBaseUrl.trim()) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  // Keep Vite proxy behavior in local development.
  if (import.meta.env.DEV) {
    return '/api';
  }

  // Safe production fallback when env vars are not configured.
  return 'https://ballerleague-server.onrender.com/api';
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
