/**
 * API Module - Handles all API communications
 */

import { showToast, showLoading, hideLoading } from './notifications.js';
import { getAuthToken, isAuthenticated, logout } from './auth.js';

class ApiClient {
    constructor() {
        this.baseURL = window.APP_CONFIG?.apiBaseUrl || '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Get headers with authentication
     */
    getHeaders(customHeaders = {}) {
        const headers = { ...this.defaultHeaders, ...customHeaders };
        
        if (isAuthenticated()) {
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        let data = null;
        if (isJson) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
                showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                logout();
                return Promise.reject(new Error('Unauthorized'));
            }
            
            // Handle other errors
            const errorMessage = data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        return data;
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.headers),
            ...options,
        };

        try {
            if (options.showLoading !== false) {
                showLoading();
            }

            const response = await fetch(url, config);
            const data = await this.handleResponse(response);
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            
            if (options.showError !== false) {
                showToast(error.message || 'Có lỗi xảy ra khi gọi API', 'error');
            }
            
            throw error;
        } finally {
            if (options.showLoading !== false) {
                hideLoading();
            }
        }
    }

    /**
     * GET request
     */
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options,
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options,
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options,
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options,
        });
    }

    /**
     * Upload file
     */
    async upload(endpoint, file, options = {}) {
        const formData = new FormData();
        formData.append('file', file);

        return this.request(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // Don't set Content-Type for FormData, let browser set it
                ...options.headers,
            },
            ...options,
        });
    }
}

// Create singleton instance
const api = new ApiClient();

// Export specific API methods
export const apiGet = api.get.bind(api);
export const apiPost = api.post.bind(api);
export const apiPut = api.put.bind(api);
export const apiDelete = api.delete.bind(api);
export const apiUpload = api.upload.bind(api);

// Export the instance
export default api;

// API endpoint constants
export const API_ENDPOINTS = {
    // Auth endpoints
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
    },
    
    // User endpoints
    USERS: {
        LIST: '/users',
        CREATE: '/users',
        GET: (id) => `/users/${id}`,
        UPDATE: (id) => `/users/${id}`,
        DELETE: (id) => `/users/${id}`,
        RESET_PASSWORD: (id) => `/users/${id}/reset-password`,
    },
    
    // Product endpoints
    PRODUCTS: {
        LIST: '/products',
        CREATE: '/products',
        GET: (id) => `/products/${id}`,
        UPDATE: (id) => `/products/${id}`,
        DELETE: (id) => `/products/${id}`,
        SEARCH: '/products/search',
    },
    
    // Category endpoints
    CATEGORIES: {
        LIST: '/categories',
        CREATE: '/categories',
        GET: (id) => `/categories/${id}`,
        UPDATE: (id) => `/categories/${id}`,
        DELETE: (id) => `/categories/${id}`,
    },
    
    // Order endpoints
    ORDERS: {
        LIST: '/orders',
        CREATE: '/orders',
        GET: (id) => `/orders/${id}`,
        UPDATE: (id) => `/orders/${id}`,
        UPDATE_STATUS: (id) => `/orders/${id}/status`,
        DELETE: (id) => `/orders/${id}`,
        RECEIPT: (id) => `/orders/${id}/receipt`,
    },
    
    // Stock endpoints
    STOCK: {
        MOVEMENTS: '/stock/movements',
        ADJUST: '/stock/adjust',
        ALERTS: '/stock/alerts',
        REPORTS: '/stock/reports',
    },
    
    // Dashboard endpoints
    DASHBOARD: {
        STATS: '/dashboard/stats',
        TOP_PRODUCTS: '/dashboard/top-products',
        RECENT_ACTIVITY: '/dashboard/recent-activity',
    },
    
    // Health endpoints
    HEALTH: {
        CHECK: '/health',
        DATABASE: '/health/database',
    },
};
