/**
 * Authentication Module - Handles user authentication
 */

import { showToast } from './notifications.js';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

/**
 * Get access token from localStorage
 */
export function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get auth token (alias for getAccessToken)
 */
export function getAuthToken() {
    return getAccessToken();
}

/**
 * Set tokens in localStorage
 */
export function setTokens(accessToken, refreshToken) {
    if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
}

/**
 * Clear all tokens and user data
 */
export function clearAuthData() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
}

/**
 * Get user data from localStorage
 */
export function getUserData() {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Set user data in localStorage
 */
export function setUserData(userData) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    const token = getAccessToken();
    return token && token !== 'null' && token !== 'undefined';
}

/**
 * Check if user has specific role
 */
export function hasRole(role) {
    const userData = getUserData();
    return userData && userData.role === role;
}

/**
 * Check if user is admin
 */
export function isAdmin() {
    return hasRole('admin');
}

/**
 * Check if user is cashier
 */
export function isCashier() {
    return hasRole('cashier');
}

/**
 * Decode JWT token (simple decode without verification)
 */
export function decodeToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token) {
    if (!token) return true;
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
}

/**
 * Login user with credentials
 */
export async function login(credentials) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Đăng nhập thất bại');
        }

        // Store tokens and user data
        if (data.data.accessToken) {
            setTokens(data.data.accessToken, data.data.refreshToken);
        }
        
        if (data.data.user) {
            setUserData(data.data.user);
        }

        showToast('Đăng nhập thành công!', 'success');
        
        return data.data;
    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Có lỗi xảy ra khi đăng nhập', 'error');
        throw error;
    }
}

/**
 * Logout user
 */
export async function logout() {
    try {
        // Call logout API if authenticated
        if (isAuthenticated()) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAccessToken()}`,
                    'Content-Type': 'application/json',
                },
            });
        }
    } catch (error) {
        console.error('Logout API error:', error);
        // Continue with local logout even if API fails
    } finally {
        // Clear local auth data
        clearAuthData();
        
        // Redirect to login page
        window.location.href = '/login';
    }
}

/**
 * Refresh access token
 */
export async function refreshToken() {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
        logout();
        return null;
    }

    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Không thể làm mới token');
        }

        // Update tokens
        if (data.data.accessToken) {
            setTokens(data.data.accessToken, data.data.refreshToken || refreshToken);
        }

        return data.data.accessToken;
    } catch (error) {
        console.error('Refresh token error:', error);
        logout();
        return null;
    }
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Không thể lấy thông tin người dùng');
        }

        // Update user data
        if (data.data) {
            setUserData(data.data);
        }

        return data.data;
    } catch (error) {
        console.error('Get current user error:', error);
        throw error;
    }
}

/**
 * Initialize auth state on page load
 */
export function initAuth() {
    // Check if token exists and is valid
    const token = getAccessToken();
    
    if (token && isTokenExpired(token)) {
        // Try to refresh if token is expired
        refreshToken();
    }
    
    // Set up automatic token refresh
    setInterval(() => {
        const currentToken = getAccessToken();
        if (currentToken && isTokenExpired(currentToken)) {
            refreshToken();
        }
    }, 60000); // Check every minute
}

/**
 * Protect route - redirect to login if not authenticated
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

/**
 * Require admin role
 */
export function requireAdmin() {
    if (!requireAuth()) return false;
    
    if (!isAdmin()) {
        showToast('Bạn không có quyền truy cập trang này', 'error');
        window.location.href = '/dashboard';
        return false;
    }
    
    return true;
}

// Initialize auth when module loads
if (typeof window !== 'undefined') {
    initAuth();
}
