/**
 * Password utilities - hashing, validation, and security
 */

import bcrypt from 'bcryptjs';
import { config } from '../config/environment';
import { logger } from './logger';

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = config.security.bcryptRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password', { error });
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    logger.error('Error comparing password', { error });
    throw new Error('Failed to compare password');
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  // Minimum length check
  if (password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  } else if (password.length >= 8) {
    score += 1;
  }

  // Maximum length check
  if (password.length > 100) {
    errors.push('Mật khẩu không được vượt quá 100 ký tự');
  }

  // Contains lowercase
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Mật khẩu phải chứa ít nhất 1 chữ cái thường');
  }

  // Contains uppercase
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Mật khẩu phải chứa ít nhất 1 chữ cái hoa');
  }

  // Contains numbers
  if (/\d/.test(password)) {
    score += 1;
  } else {
    errors.push('Mật khẩu phải chứa ít nhất 1 số');
  }

  // Contains special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    errors.push('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt');
  }

  // No common patterns
  const commonPatterns = [
    '123456',
    'password',
    'qwerty',
    'abc123',
    '12345678',
    'admin',
    'user',
    'test'
  ];

  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Mật khẩu không được chứa các mẫu phổ biến');
    score -= 1;
  }

  // No sequential characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Mật khẩu không được chứa ký tự lặp lại liên tiếp');
    score -= 1;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.max(0, Math.min(5, score))
  };
}

/**
 * Generate random password
 */
export function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Ensure password contains at least one character from each set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password is compromised (basic check)
 */
export function isPasswordCompromised(password: string): boolean {
  // Basic check against common compromised passwords
  const compromisedPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
    'dragon',
    'rockyou',
    'iloveyou',
    'password123',
    'password1',
    'sunshine'
  ];
  
  return compromisedPasswords.includes(password.toLowerCase());
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

/**
 * Get password strength description
 */
export function getPasswordStrengthDescription(score: number): {
  level: string;
  color: string;
  description: string;
} {
  switch (score) {
    case 0:
    case 1:
      return {
        level: 'Rất yếu',
        color: 'red',
        description: 'Mật khẩu rất dễ bị tấn công'
      };
    case 2:
      return {
        level: 'Yếu',
        color: 'orange',
        description: 'Mật khẩu có thể bị tấn công'
      };
    case 3:
      return {
        level: 'Trung bình',
        color: 'yellow',
        description: 'Mật khẩu có độ bảo mật trung bình'
      };
    case 4:
      return {
        level: 'Mạnh',
        color: 'blue',
        description: 'Mật khẩu có độ bảo mật tốt'
      };
    case 5:
      return {
        level: 'Rất mạnh',
        color: 'green',
        description: 'Mật khẩu có độ bảo mật cao'
      };
    default:
      return {
        level: 'Không xác định',
        color: 'gray',
        description: 'Không thể đánh giá độ mạnh của mật khẩu'
      };
  }
}

/**
 * Password utilities for testing
 */
export const passwordTestUtils = {
  /**
   * Generate test password with known hash
   */
  async generateTestPassword(): Promise<{ password: string; hash: string }> {
    const password = 'TestPassword123!';
    const hash = await hashPassword(password);
    return { password, hash };
  },

  /**
   * Generate weak password for testing
   */
  generateWeakPassword(): string {
    return '123456';
  },

  /**
   * Generate strong password for testing
   */
  generateStrongPassword(): string {
    return 'StrongP@ssw0rd2024!';
  }
};
