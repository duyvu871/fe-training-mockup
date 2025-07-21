/**
 * Handlebars Helpers
 */

import { HelperOptions } from 'handlebars';

export const handlebarsHelpers = {
  /**
   * Equality helper - so sánh bằng
   * Usage: {{#if (eq value1 value2)}}...{{/if}}
   */
  eq: function(a: any, b: any): boolean {
    return a === b;
  },

  /**
   * Not equal helper - so sánh khác
   * Usage: {{#if (ne value1 value2)}}...{{/if}}
   */
  ne: function(a: any, b: any): boolean {
    return a !== b;
  },

  /**
   * Greater than helper - lớn hơn
   * Usage: {{#if (gt value1 value2)}}...{{/if}}
   */
  gt: function(a: number, b: number): boolean {
    return a > b;
  },

  /**
   * Less than helper - nhỏ hơn
   * Usage: {{#if (lt value1 value2)}}...{{/if}}
   */
  lt: function(a: number, b: number): boolean {
    return a < b;
  },

  /**
   * Greater than or equal helper - lớn hơn hoặc bằng
   * Usage: {{#if (gte value1 value2)}}...{{/if}}
   */
  gte: function(a: number, b: number): boolean {
    return a >= b;
  },

  /**
   * Less than or equal helper - nhỏ hơn hoặc bằng
   * Usage: {{#if (lte value1 value2)}}...{{/if}}
   */
  lte: function(a: number, b: number): boolean {
    return a <= b;
  },

  /**
   * Or helper - điều kiện hoặc
   * Usage: {{#if (or condition1 condition2)}}...{{/if}}
   */
  or: function(...args: any[]): boolean {
    // Loại bỏ options object cuối cùng
    const conditions = args.slice(0, -1);
    return conditions.some(condition => !!condition);
  },

  /**
   * And helper - điều kiện và
   * Usage: {{#if (and condition1 condition2)}}...{{/if}}
   */
  and: function(...args: any[]): boolean {
    // Loại bỏ options object cuối cùng
    const conditions = args.slice(0, -1);
    return conditions.every(condition => !!condition);
  },

  /**
   * Not helper - điều kiện phủ định
   * Usage: {{#if (not condition)}}...{{/if}}
   */
  not: function(condition: any): boolean {
    return !condition;
  },

  /**
   * JSON stringify helper - chuyển object thành JSON string
   * Usage: {{json object}}
   */
  json: function(context: any): string {
    return JSON.stringify(context);
  },

  /**
   * Lowercase helper - chuyển thành chữ thường
   * Usage: {{lowercase string}}
   */
  lowercase: function(str: string): string {
    return str ? str.toLowerCase() : '';
  },

  /**
   * Uppercase helper - chuyển thành chữ hoa
   * Usage: {{uppercase string}}
   */
  uppercase: function(str: string): string {
    return str ? str.toUpperCase() : '';
  },

  /**
   * Capitalize helper - viết hoa chữ cái đầu
   * Usage: {{capitalize string}}
   */
  capitalize: function(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  /**
   * Format currency helper - định dạng tiền tệ VND
   * Usage: {{currency amount}}
   */
  currency: function(amount: number): string {
    if (typeof amount !== 'number') return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  /**
   * Format number helper - định dạng số
   * Usage: {{number value}}
   */
  number: function(value: number): string {
    if (typeof value !== 'number') return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
  },

  /**
   * Format date helper - định dạng ngày tháng
   * Usage: {{date dateValue "dd/MM/yyyy"}}
   */
  date: function(date: string | Date, format?: string): string {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    // Default format: dd/MM/yyyy HH:mm
    if (!format) {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    }
    
    // Simple format implementation
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return format
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year.toString())
      .replace('HH', hours)
      .replace('mm', minutes);
  },

  /**
   * Truncate helper - cắt ngắn chuỗi
   * Usage: {{truncate string 50}}
   */
  truncate: function(str: string, length: number): string {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  /**
   * Default helper - giá trị mặc định
   * Usage: {{default value "Không có"}}
   */
  default: function(value: any, defaultValue: any): any {
    return value || defaultValue;
  },

  /**
   * Times helper - lặp một số lần nhất định
   * Usage: {{#times 5}}{{@index}}{{/times}}
   */
  times: function(n: number, options: HelperOptions): string {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += options.fn({ ...this, index: i });
    }
    return result;
  },

  /**
   * Range helper - tạo dãy số
   * Usage: {{#range 1 10}}{{this}}{{/range}}
   */
  range: function(start: number, end: number, options: HelperOptions): string {
    let result = '';
    for (let i = start; i <= end; i++) {
      result += options.fn(i);
    }
    return result;
  },

  /**
   * Length helper - lấy độ dài của mảng hoặc string
   * Usage: {{length array}}
   */
  length: function(value: any): number {
    if (!value) return 0;
    if (Array.isArray(value) || typeof value === 'string') {
      return value.length;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length;
    }
    return 0;
  },

  /**
   * First helper - lấy phần tử đầu tiên
   * Usage: {{first array}}
   */
  first: function(array: any[]): any {
    return Array.isArray(array) && array.length > 0 ? array[0] : null;
  },

  /**
   * Last helper - lấy phần tử cuối cùng
   * Usage: {{last array}}
   */
  last: function(array: any[]): any {
    return Array.isArray(array) && array.length > 0 ? array[array.length - 1] : null;
  },

  /**
   * Join helper - nối mảng thành string
   * Usage: {{join array ", "}}
   */
  join: function(array: any[], separator: string): string {
    if (!Array.isArray(array)) return '';
    return array.join(separator || ', ');
  }
};
