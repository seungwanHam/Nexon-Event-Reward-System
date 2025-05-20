export class ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  static success<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
    };
  }

  static error(code: string, message: string, details?: any): ApiResponse<null> {
    return {
      success: false,
      error: { code, message, details },
    };
  }
} 