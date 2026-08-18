import axios, { AxiosError } from "axios";

export const API_BASE_URL = "https://tokendinerestaurent.vercel.app";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string }>) => {
    const message =
      err.response?.data?.error ||
      err.message ||
      "Network error. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default api;
