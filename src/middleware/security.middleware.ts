/**
 * Security middleware - Headers, CORS, Rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { HTTP_STATUS } from '../utils/constants';
import { createErrorResponse } from '../utils/helpers';
import { AppError, ValidationError } from '../utils/errors';

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // For better compatibility
});

/**
 * CORS configuration
 */
export const corsConfig = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:3000',
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS: Origin not allowed', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
});

/**
 * General rate limiting
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: true,
    message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    
    const rateLimitError = new AppError(
      'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED'
    );
    res.status(rateLimitError.statusCode).json(
      createErrorResponse(rateLimitError.message, rateLimitError.code)
    );
  }
});

/**
 * Strict rate limiting for auth endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 auth requests per windowMs
  message: {
    error: true,
    message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    
    const rateLimitError = new AppError(
      'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'AUTH_RATE_LIMIT_EXCEEDED'
    );
    res.status(rateLimitError.statusCode).json(
      createErrorResponse(rateLimitError.message, rateLimitError.code)
    );
  }
});

/**
 * API rate limiting for authenticated endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 API requests per minute
  message: {
    error: true,
    message: 'Quá nhiều yêu cầu API, vui lòng thử lại sau',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      userId: req.user?.userId
    });
    
    const rateLimitError = new AppError(
      'Quá nhiều yêu cầu API, vui lòng thử lại sau',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'API_RATE_LIMIT_EXCEEDED'
    );
    res.status(rateLimitError.statusCode).json(
      createErrorResponse(rateLimitError.message, rateLimitError.code)
    );
  }
});

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentLength: req.get('Content-Length'),
    userId: req.user?.userId
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
      userId: req.user?.userId
    });
  });

  next();
}

/**
 * Content type validation middleware
 */
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const validationError = new ValidationError('Content-Type phải là application/json');
      res.status(validationError.statusCode).json(
        createErrorResponse(validationError.message, validationError.code)
      );
      return;
    }
  }
  
  next();
}

/**
 * Request size limiting middleware
 */
export function requestSizeLimit(req: Request, res: Response, next: NextFunction): void {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    logger.warn('Request size limit exceeded', {
      contentLength,
      maxSize,
      ip: req.ip,
      url: req.url
    });
    
    const payloadError = new AppError(
      'Kích thước yêu cầu quá lớn',
      HTTP_STATUS.PAYLOAD_TOO_LARGE,
      'PAYLOAD_TOO_LARGE'
    );
    res.status(payloadError.statusCode).json(
      createErrorResponse(payloadError.message, payloadError.code)
    );
    return;
  }
  
  next();
}
