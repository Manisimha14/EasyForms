/**
 * Core API Client
 * Features:
 * - Bearer auth injection
 * - ETag extraction & If-Match passing
 * - Transparent 401 silent refresh & single replay
 * - GET-only retry logic
 * - Normalized ApiError parsing
 */

import { tokenStore } from '../auth/tokenStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  constructor({ status, code, message, details = [], requestId, retryAfter }) {
    super(message || 'An error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
  }
}

/**
 * Main HTTP request runner
 */
export async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    ifMatch,
    timeout = 30000,
    retryCount = 0,
    isAuthRequest = false,
  } = options;

  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const requestHeaders = new Headers(headers);

  // Content type
  if (body && !(body instanceof FormData) && !(body instanceof Blob)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  // Auth header if token exists and not explicitly public
  const token = tokenStore.getAccessToken();
  if (token && !options.skipAuth) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  // Optimistic concurrency ETag
  if (ifMatch) {
    requestHeaders.set('If-Match', ifMatch);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)
        ? JSON.stringify(body)
        : body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Read ETag header if available
    const etag = res.headers.get('ETag');
    const retryAfter = res.headers.get('Retry-After');
    const requestId = res.headers.get('X-Request-Id');

    // 204 No Content
    if (res.status === 204) {
      return { success: true, data: null, etag, requestId };
    }

    // Check if CSV download
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('text/csv')) {
      const blob = await res.blob();
      return { blob, etag, requestId };
    }

    let json;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    // Handle 401 Unauthorized with silent refresh
    if (res.status === 401 && !isAuthRequest && !options._isRetry) {
      try {
        await tokenStore.refreshToken(async (rt) => {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt }),
          });
          const refreshJson = await refreshRes.json();
          if (!refreshRes.ok || !refreshJson.success) {
            throw new Error('Refresh failed');
          }
          return refreshJson.data;
        });

        // Replay once
        return request(endpoint, {
          ...options,
          _isRetry: true,
        });
      } catch (refreshErr) {
        tokenStore.clear();
        throw new ApiError({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Session expired. Please log in again.',
          requestId,
        });
      }
    }

    if (!res.ok) {
      const errorData = json?.error || {};
      throw new ApiError({
        status: res.status,
        code: errorData.code || (res.status === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR'),
        message: errorData.message || res.statusText,
        details: errorData.details || [],
        requestId: errorData.requestId || requestId,
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : null,
      });
    }

    return {
      success: json?.success ?? true,
      data: json?.data ?? null,
      pagination: json?.pagination ?? null,
      warnings: json?.warnings ?? [],
      etag,
      requestId,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new ApiError({
        status: 408,
        code: 'TIMEOUT',
        message: 'Request timed out. The server might be waking up.',
      });
    }

    if (err instanceof ApiError) {
      throw err;
    }

    // GET-only retry twice on network errors
    if (method === 'GET' && retryCount < 2) {
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      return request(endpoint, { ...options, retryCount: retryCount + 1 });
    }

    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the server.',
    });
  }
}

// ----------------- Specific Resource APIs -----------------

export const healthApi = {
  check: () => request('/health', { skipAuth: true }),
  ready: () => request('/health/ready', { skipAuth: true }),
};

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, skipAuth: true, isAuthRequest: true }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, skipAuth: true, isAuthRequest: true }),
  logout: (refreshToken) => request('/auth/logout', { method: 'POST', body: { refreshToken }, isAuthRequest: true }),
  getMe: () => request('/auth/me'),
  updateMe: (name) => request('/auth/me', { method: 'PATCH', body: { name } }),
  changePassword: (payload) => request('/auth/change-password', { method: 'POST', body: payload }),
  deleteAccount: (password) => request('/auth/me', { method: 'DELETE', body: { password } }),
};

export const formsApi = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', params.page);
    if (params.limit) q.set('limit', params.limit);
    if (params.status) q.set('status', params.status);
    if (params.search) q.set('search', params.search);
    if (params.sortBy) q.set('sortBy', params.sortBy);
    if (params.order) q.set('order', params.order);
    const qs = q.toString();
    return request(`/forms${qs ? `?${qs}` : ''}`);
  },
  create: (payload) => request('/forms', { method: 'POST', body: payload }),
  getById: (id) => request(`/forms/${id}`),
  updateMetadata: (id, payload, ifMatch) => request(`/forms/${id}`, { method: 'PATCH', body: payload, ifMatch }),
  delete: (id) => request(`/forms/${id}`, { method: 'DELETE' }),
  saveFields: (id, fields, ifMatch) => request(`/forms/${id}/fields`, { method: 'PUT', body: { fields }, ifMatch }),
  saveTheme: (id, theme, ifMatch) => request(`/forms/${id}/theme`, { method: 'PUT', body: theme, ifMatch }),
  publish: (id) => request(`/forms/${id}/publish`, { method: 'POST' }),
  unpublish: (id) => request(`/forms/${id}/unpublish`, { method: 'POST' }),
};

export const responsesApi = {
  list: (formId, params = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', params.page);
    if (params.limit) q.set('limit', params.limit);
    if (params.order) q.set('order', params.order);
    else if (params.sort) q.set('order', params.sort);
    if (params.sortBy) q.set('sortBy', params.sortBy);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    const qs = q.toString();
    return request(`/forms/${formId}/responses${qs ? `?${qs}` : ''}`);
  },
  getById: (formId, responseId) => request(`/forms/${formId}/responses/${responseId}`),
  delete: (formId, responseId) => request(`/forms/${formId}/responses/${responseId}`, { method: 'DELETE' }),
  exportCsv: (formId) => request(`/forms/${formId}/responses/export`),
};

export const analyticsApi = {
  getStats: () => request('/dashboard/stats'),
  getFormAnalytics: (formId) => request(`/forms/${formId}/analytics`),
  getTrends: (formId, range = '7d') => request(`/forms/${formId}/analytics/trends?range=${range}`),
};

export const publicApi = {
  getForm: (slug) => request(`/public/forms/${slug}`, { skipAuth: true }),
  submitResponse: (slug, answers) => request(`/public/forms/${slug}/responses`, { method: 'POST', body: { answers }, skipAuth: true }),
};

export const aiApi = {
  generateForm: (prompt) => request('/ai/generate-form', { method: 'POST', body: { prompt } }),
  chatResponses: (formId, messages) => request(`/ai/forms/${formId}/chat`, { method: 'POST', body: { messages } }),
};
