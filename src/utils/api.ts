/**
 * API Client
 * Backend (Supabase Edge Functions) ile iletişim için merkezi utility
 * 
 * Updated: 2025-11-17 - Fixed Supabase import path
 * Updated: 2025-01-12 - Added connection resilience
 */

import { projectId, publicAnonKey } from '../lib/supabase/info';
import { connectionManager } from './connectionManager';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1`;
const SERVER_PREFIX = '/make-server-9ec5bbb3';

/**
 * API Configuration
 */
interface ApiConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  useAuth?: boolean;
  timeout?: number;
  retryCount?: number;
  showErrorToast?: boolean;
}

/**
 * API Response
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make API request to backend with connection resilience
 */
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
    error: error.message || 'Network error',
  }));
};

/**
 * API Methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T = any>(endpoint: string, useAuth = false, options?: Partial<ApiConfig>) =>
    apiRequest<T>(endpoint, { method: 'GET', useAuth, ...options }),

  /**
   * POST request
   */
  post: <T = any>(endpoint: string, body: any, useAuth = false, options?: Partial<ApiConfig>) =>
    apiRequest<T>(endpoint, { method: 'POST', body, useAuth, ...options }),

  /**
   * PUT request
   */
  put: <T = any>(endpoint: string, body: any, useAuth = false, options?: Partial<ApiConfig>) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, useAuth, ...options }),

  /**
   * DELETE request
   */
  delete: <T = any>(endpoint: string, useAuth = false, options?: Partial<ApiConfig>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', useAuth, ...options }),

  /**
   * Health check
   */
  healthCheck: () => api.get('/health'),
};

/**
 * Example Usage:
 * 
 * // Simple GET
 * const { success, data, error } = await api.get('/customers');
 * 
 * // POST with body
 * const result = await api.post('/customers', {
 *   name: 'Acme Corp',
 *   email: 'contact@acme.com'
 * });
 * 
 * // Protected endpoint (requires auth)
 * const result = await api.get('/protected-data', true);
 * 
 * // Custom request
 * const result = await apiRequest('/custom', {
 *   method: 'POST',
 *   body: { ... },
 *   useAuth: true,
 *   headers: { 'X-Custom-Header': 'value' }
 * });
 */
