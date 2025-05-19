import { RpcException } from '@nestjs/microservices';

export interface ErrorResponse {
  code: string;
  message: string;
  timestamp: string;
  path?: string;
  details?: Record<string, any>;
}

export class BaseException extends RpcException {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super({
      code,
      message,
      timestamp: new Date().toISOString(),
      details
    });
  }

  public toErrorResponse(path?: string): ErrorResponse {
    const error = this.getError() as ErrorResponse;
    return {
      ...error,
      path
    };
  }
} 