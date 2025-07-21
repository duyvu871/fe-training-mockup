/**
 * Kiểu dữ liệu API responses và requests chung
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  meta?: ResponseMeta;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  version: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchRequest extends PaginationRequest {
  search?: string;
  filters?: Record<string, any>;
}

export interface ListResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: string;
    stack?: string; // Only in development
  };
  timestamp: string;
  path: string;
}

export interface HealthCheckResponse {
  status: 'OK' | 'DEGRADED' | 'ERROR';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  responseTime?: string;
  services: {
    api: ServiceHealth;
    database: ServiceHealth;
  };
  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      used: string;
      total: string;
    };
    pid: number;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: string;
  details?: any;
}

export interface BulkOperationRequest {
  ids: string[];
  action: string;
  data?: Record<string, any>;
}

export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

export interface FileUploadResponse {
  success: boolean;
  data: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    url: string;
  };
}

export interface ExportRequest {
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, any>;
  columns?: string[];
}

export interface ExportResponse {
  success: boolean;
  data: {
    downloadUrl: string;
    filename: string;
    expiresAt: string;
  };
}

// Common API status codes
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// Request context
export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}
