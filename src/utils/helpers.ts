// Generate unique order number
export const generateOrderNumber = (): string => {
  const prefix = 'ORD';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Generate SKU
export const generateSKU = (categoryCode: string, productName: string): string => {
  const nameCode = productName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 4)
    .toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${categoryCode}-${nameCode}-${random}`;
};

// Format currency (VND)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Format number with thousand separator
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Vietnam format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(84|0[3|5|7|8|9])+([0-9]{8})$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Generate random string
export const generateRandomString = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Sleep utility for testing
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove undefined values from object
export const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key as keyof T] = value;
    }
  }
  return result;
};

// Calculate pagination
export const calculatePagination = (page: number, pageSize: number, total: number) => {
  const totalPages = Math.ceil(total / pageSize);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext,
    hasPrev,
    offset: (page - 1) * pageSize,
  };
};

// Convert string to slug
export const toSlug = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Pick specific properties from object
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

// Omit specific properties from object
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

// Generate unique receipt number
export const generateReceiptNumber = (): string => {
  const prefix = 'RCP';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Format date to Vietnamese format
export const formatDate = (date: Date | string, format: string = 'DD/MM/YYYY'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'DD/MM/YYYY HH:mm') {
    return dateObj.toLocaleString('vi-VN');
  }
  return dateObj.toLocaleDateString('vi-VN');
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};

// Calculate discount amount
export const calculateDiscount = (price: number, discountPercent: number): number => {
  return Math.round(price * (discountPercent / 100) * 100) / 100;
};

// Calculate tax amount
export const calculateTax = (amount: number, taxRate: number = 0.1): number => {
  return Math.round(amount * taxRate * 100) / 100;
};

// Calculate order total with tax and discount
export const calculateOrderTotal = (
  subtotal: number,
  taxRate: number = 0.1,
  discountAmount: number = 0
) => {
  const tax = calculateTax(subtotal, taxRate);
  const total = subtotal + tax - discountAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

// Mask sensitive string
export const maskSensitiveString = (str: string, visibleChars: number = 4): string => {
  if (str.length <= visibleChars * 2) {
    return '*'.repeat(str.length);
  }
  
  const start = str.substring(0, visibleChars);
  const end = str.substring(str.length - visibleChars);
  const middle = '*'.repeat(str.length - visibleChars * 2);
  
  return `${start}${middle}${end}`;
};

// Create error response
export const createErrorResponse = (
  message: string,
  code?: string,
  details?: any
) => {
  return {
    success: false,
    message,
    error: {
      code: code || 'UNKNOWN_ERROR',
      details
    },
    timestamp: new Date().toISOString()
  };
};

// Create success response
export const createSuccessResponse = <T>(
  data: T,
  message: string = 'Thành công',
  meta?: any
) => {
  return {
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  };
};

// Retry operation with exponential backoff
export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError!;
};

// Check if value is empty
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};
