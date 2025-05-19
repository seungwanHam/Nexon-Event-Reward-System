import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseException, ErrorResponse } from '@app/libs/common/exception';

@Injectable()
export class GrpcInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GrpcInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'rpc') {
      return next.handle(); // gRPC 요청이 아니면 처리하지 않음
    }

    const data = context.switchToRpc().getData();
    const ctx = context.switchToRpc().getContext();

    const targetClass = context.getClass().name;
    const targetHandler = context.getHandler().name;

    // 메타데이터 안전하게 접근
    let traceId = 'unknown';
    let clientInfo = 'unknown';

    // gRPC 메타데이터에 접근 (ctx.metadata 또는 다른 방식으로)
    if (ctx) {
      // ctx의 구조에 따라 적절히 접근
      if (ctx.metadata) {
        traceId = ctx.metadata['trace-id'] || 'grpc-req';
        clientInfo = ctx.metadata['client-service'] || 'unknown-client';
      } else if (typeof ctx.get === 'function') {
        traceId = ctx.get('trace-id') || 'grpc-req';
        clientInfo = ctx.get('client-service') || 'unknown-client';
      }
    }

    this.logger.log(`gRPC Call: ${targetClass}.${targetHandler} - traceId: ${traceId} - client: ${clientInfo}`);

    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.debug(
          `${targetClass}.${targetHandler} - ${JSON.stringify(data)} - ${duration}ms`
        );
      }),
      catchError(error => {
        let errorResponse: ErrorResponse;

        if (error instanceof BaseException) {
          errorResponse = error.toErrorResponse(targetHandler);
          this.logger.warn(`${targetClass}.${targetHandler} - ${error.code}: ${error.message}`);
        } else {
          errorResponse = {
            code: 'INTERNAL_ERROR',
            message: '내부 서버 오류가 발생했습니다',
            timestamp: new Date().toISOString(),
            path: targetHandler,
            details: process.env.NODE_ENV === 'development' ? {
              error: error.message,
              stack: error.stack
            } : undefined
          };
          this.logger.error(`${targetClass}.${targetHandler} - Unhandled error: ${error.message}`, error.stack);
        }

        return throwError(() => ({
          code: status.INTERNAL,
          message: JSON.stringify(errorResponse)
        }));
      })
    );
  }
}