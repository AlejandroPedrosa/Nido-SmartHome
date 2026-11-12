import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthSession,
} from '@/lib/auth-session';
import type { AuthSession, NestErrorBody } from '@/types';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly messages: string[];
  readonly missing?: NestErrorBody['missing'];

  constructor(body: NestErrorBody) {
    const messages = Array.isArray(body.message) ? body.message : [body.message];
    super(messages[0] ?? body.error ?? 'Error de API');
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.error = body.error;
    this.messages = messages;
    this.missing = body.missing;
  }
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<AuthSession> | null = null;

async function refreshAccessToken(): Promise<AuthSession> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    throw new ApiError({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Sesión expirada',
    });
  }

  // Sin el interceptor de la instancia principal: evita bucles de refresh.
  const { data } = await axios.post<AuthSession>(
    `${baseURL}/auth/refresh`,
    { refresh_token },
    { headers: { 'Content-Type': 'application/json' } },
  );
  setAuthSession(data);
  return data;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<NestErrorBody>;
    const data = axiosError.response?.data;
    if (data && typeof data === 'object' && 'statusCode' in data) {
      return new ApiError({
        statusCode: data.statusCode,
        error: data.error ?? axiosError.response?.statusText ?? 'Error',
        message: data.message ?? axiosError.message,
        missing: data.missing,
      });
    }
    return new ApiError({
      statusCode: axiosError.response?.status ?? 0,
      error: axiosError.response?.statusText ?? 'Network Error',
      message: axiosError.message || 'No se pudo contactar al servidor',
    });
  }

  return new ApiError({
    statusCode: 0,
    error: 'Unknown',
    message: error instanceof Error ? error.message : 'Error desconocido',
  });
}

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(toApiError(error));
    }

    const config = error.config as RetriableConfig;
    const status = error.response?.status;
    const isRefreshCall = config.url?.includes('/auth/refresh');
    const isLoginOrRegister =
      config.url?.includes('/auth/login') || config.url?.includes('/auth/register');

    if (status !== 401 || config._retry || isRefreshCall || isLoginOrRegister) {
      return Promise.reject(toApiError(error));
    }

    config._retry = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const session = await refreshPromise;
      config.headers.Authorization = `Bearer ${session.access_token}`;
      return api.request(config);
    } catch (refreshError) {
      clearAuthSession();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
      return Promise.reject(toApiError(refreshError));
    }
  },
);

/** Helpers tipados usados por los services. */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<T>(url, config);
  return data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.post<T>(url, body, config);
  return data;
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}

export async function apiDelete(url: string, config?: AxiosRequestConfig): Promise<void> {
  await api.delete(url, config);
}
