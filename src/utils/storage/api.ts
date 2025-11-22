/*COMMENT*/

import { projectId, publicAnonKey } from './supabase/info';
import { connectionManager } from './connectionManager';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1`;
const SERVER_PREFIX = '/make-server-9ec5bbb3';

/*COMMENT*/
interface ApiConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  useAuth?: boolean;
  timeout?: number;
  retryCount?: number;
  showErrorToast?: boolean;
}

/*COMMENT*/
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/*COMMENT*/
export const apiRequest = async <T = any>(
  endpoint: string,
  config: ApiConfig = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    body,
    headers = {},
    useAuth = false,
    timeout = 15000,
    retryCount = 3,
    showErrorToast = true,
  } = config;

  // Execute with connection manager (auto-retry + timeout)
  return connectionManager.executeWithCheck(
    async () => {
      // Get auth token if needed
      let authHeaders = {};
      if (useAuth) {
        const token = localStorage.getItem('access_token');
        if (token) {
          authHeaders = { Authorization: `Bearer ${token}` };
        }
      } else {
        // Use public anon key
        authHeaders = { Authorization: `Bearer ${publicAnonKey}` };
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), timeout);

      try {
        // Make request
        const response = await fetch(`${BASE_URL}${SERVER_PREFIX}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        window.clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        if (!response.ok) {
          console.error(`API Error [${endpoint}]:`, data);
          return {
            success: false,
            error: data.error || data.message || 'Request failed',
          };
        }

        return {
          success: true,
          data: data.data || data,
        };
      } catch (error: any) {
        window.clearTimeout(timeoutId);
        
        // Handle abort
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }

        console.error(`API Request Error [${endpoint}]:`, error);
        throw error;
      }
    },
    {
      showErrorToast,
      retryCount,
      timeoutMs: timeout,
    }
  ).then(data => data).catch(error => ({
    success: false,
    error: error?.message || 'Network error',
  }));
};

/*COMMENT*/
export const api = {
  /*COMMENT*/
  get: <T = any>(endpoint: string, useAuth = false, options?: Partial<ApiConfig>) =>
    apiRequest<T>(endpoint, { method: 'GET', useAuth, ...options }),

  /*COMMENT*/
  post: <T = any>(endpoint: string, body: any, useAuth = false, options?: Partial<ApiConfig>) =>
    apiRequest<T>(endpoint, { method: 'POST', body, useAuth, ...options }),

  /*COMMENT*/
  put: <T = any>(endpoint: string, body: any, useAuth = false, options?: Partial<ApiConfig>) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, useAuth, ...options }),

  /*COMMENT*/
  delete: <T = any>(endpoint: string, useAuth = false, options?: Partial<ApiConfig>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', useAuth, ...options }),

  /*COMMENT*/
  healthCheck: () => api.get('/health'),
};

/*COMMENT*/


