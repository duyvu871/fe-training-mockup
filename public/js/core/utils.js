/**
 * Core Utility Functions
 */

// Format currency to Vietnamese format
export function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0₫';
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format date to Vietnamese format
export function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    
    return new Date(date).toLocaleDateString('vi-VN', formatOptions);
}

// Format short date
export function formatShortDate(date) {
    return formatDate(date, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Format time only
export function formatTime(date) {
    return formatDate(date, {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Generate random ID
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Copy text to clipboard
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (fallbackErr) {
            document.body.removeChild(textArea);
            throw fallbackErr;
        }
    }
}

// Validate email format
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone format (Vietnamese)
export function isValidPhone(phone) {
    const phoneRegex = /^(\+84|0)[3-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Get element by ID with error handling
export function getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}

// Add event listener with error handling
export function addEventListener(element, event, handler) {
    if (!element) {
        console.warn('Cannot add event listener to null element');
        return;
    }
    element.addEventListener(event, handler);
}

// Remove event listener
export function removeEventListener(element, event, handler) {
    if (!element) {
        console.warn('Cannot remove event listener from null element');
        return;
    }
    element.removeEventListener(event, handler);
}

// Show/hide elements
export function show(element) {
    if (element) {
        element.style.display = '';
        element.classList.remove('hidden');
    }
}

export function hide(element) {
    if (element) {
        element.style.display = 'none';
        element.classList.add('hidden');
    }
}

// Toggle element visibility
export function toggle(element) {
    if (!element) return;
    
    if (element.style.display === 'none' || element.classList.contains('hidden')) {
        show(element);
    } else {
        hide(element);
    }
}

// Local storage helpers
export const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    },
    
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    }
};

// Session storage helpers
export const sessionStorage = {
    set(key, value) {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to sessionStorage:', error);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from sessionStorage:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            window.sessionStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from sessionStorage:', error);
        }
    }
};

// URL helpers
export function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

export function setQueryParam(param, value) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set(param, value);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    history.replaceState(null, '', newUrl);
}

// Sleep function
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Truncate text
export function truncate(text, length = 50, suffix = '...') {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + suffix;
}

// Capitalize first letter
export function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Convert to title case
export function titleCase(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}
