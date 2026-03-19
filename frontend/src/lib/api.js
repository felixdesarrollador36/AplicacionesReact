import axios from 'axios';

export const AUTH_STORAGE_KEY = 'finanzas_auth_v1';

const isCapacitorAndroid =
  typeof window !== 'undefined' && window.Capacitor?.getPlatform?.() === 'android';

const resolveBaseURL = () => {
  const rawURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const androidURL = import.meta.env.VITE_ANDROID_API_URL;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroidEmulator = /sdk_gphone|emulator|simulator|genymotion/i.test(userAgent);

  if (isCapacitorAndroid && androidURL) {
    return androidURL;
  }

  // Android emulator cannot reach host machine via localhost.
  if (isCapacitorAndroid && isAndroidEmulator) {
    return rawURL.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return rawURL;
};

const baseURL = resolveBaseURL();

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};
