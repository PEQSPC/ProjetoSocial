export const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
  tokenKey: import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY as string,
};
