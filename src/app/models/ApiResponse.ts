export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  statusCode?: number;
  timestamp?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError {
  type: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'server_error' | 'network_error';
  message: string;
  details?: ValidationError[];
  statusCode?: number;
  timestamp?: string;
}

export interface HttpOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials?: boolean;
} 