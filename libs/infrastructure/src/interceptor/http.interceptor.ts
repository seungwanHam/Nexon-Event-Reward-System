import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WinstonLoggerService } from '../logger';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * HTTP 요청/응답 인터셉터
 * 
 * 모든 HTTP 요청과 응답을 가로채어 자세한 로깅을 제공합니다.
 * 이 인터셉터는 다음과 같은 기능을 제공합니다:
 * 
 * - 요청 및 응답 상세 정보 로깅
 * - 요청 처리 시간 측정
 * - 고유 요청 ID를 통한 요청 추적
 * - 에러 응답에 대한 구조화된 로깅
 */
@Injectable()
export class HttpInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpInterceptor.name);
  
  /**
   * HTTP 인터셉터 생성자
   * 
   * @param loggerService - 로깅 서비스
   */
  constructor(private readonly loggerService: WinstonLoggerService) {
    this.loggerService.setContext('HttpInterceptor');
  }

  /**
   * HTTP 요청을 인터셉트하여 로깅합니다.
   * 
   * @param context - 실행 컨텍스트
   * @param next - 다음 핸들러
   * @returns 처리된 응답 Observable
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    // UUID 기반 요청 ID 생성 (보다 안전한 고유 식별자)
    const requestId = request.headers['x-request-id'] as string || this.generateRequestId();
    
    // 요청 헤더에 요청 ID 추가 (추적 목적)
    request.headers['x-request-id'] = requestId;

    // 요청 로깅
    this.logRequest(request, requestId);

    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = ctx.getResponse<Response>();
          // 응답 헤더에 요청 ID 추가 (클라이언트 추적 가능)
          response.setHeader('X-Request-ID', requestId);
          
          // 성공 응답 로깅
          this.logSuccessResponse(request, response, requestId, now, data);
        },
        error: (error) => {
          // 에러 응답 로깅
          this.logErrorResponse(request, error, requestId, now);
        },
      }),
    );
  }
  
  /**
   * 고유한 요청 ID를 생성합니다.
   * 
   * @returns 고유 UUID
   * @private
   */
  private generateRequestId(): string {
    try {
      return uuidv4(); // UUID v4 사용
    } catch (error) {
      // UUID 라이브러리를 사용할 수 없는 경우 대체 방법
      return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    }
  }
  
  /**
   * HTTP 요청 정보를 로깅합니다.
   * 
   * @param request - HTTP 요청 객체
   * @param requestId - 요청 ID
   * @private
   */
  private logRequest(request: Request, requestId: string): void {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'unknown';
    
    this.loggerService.log(
      `[HTTP] [${requestId}] → ${method} ${url} - ${ip} - ${userAgent}`,
      {
        requestId,
        method,
        url,
        ip,
        userAgent,
        // 민감한 정보를 제외한 헤더 로깅
        headers: this.sanitizeHeaders(headers)
      }
    );
  }
  
  /**
   * HTTP 성공 응답을 로깅합니다.
   * 
   * @param request - HTTP 요청 객체
   * @param response - HTTP 응답 객체
   * @param requestId - 요청 ID
   * @param startTime - 요청 시작 시간
   * @param responseData - 응답 데이터 (선택)
   * @private
   */
  private logSuccessResponse(
    request: Request, 
    response: Response, 
    requestId: string, 
    startTime: number,
    responseData?: any
  ): void {
    const { method, url } = request;
    const duration = Date.now() - startTime;
    const statusCode = response.statusCode;
    
    this.loggerService.log(
      `[HTTP] [${requestId}] ← ${method} ${url} - ${statusCode} - ${duration}ms`,
      {
        requestId,
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        // 프로덕션 환경에서는 응답 데이터 로깅을 제한할 수 있음
        ...(process.env.NODE_ENV !== 'production' && responseData ? { 
          responseSize: this.getApproximateSize(responseData) 
        } : {})
      }
    );
  }
  
  /**
   * HTTP 에러 응답을 로깅합니다.
   * 
   * @param request - HTTP 요청 객체
   * @param error - 발생한 에러
   * @param requestId - 요청 ID
   * @param startTime - 요청 시작 시간
   * @private
   */
  private logErrorResponse(request: Request, error: any, requestId: string, startTime: number): void {
    const { method, url } = request;
    const duration = Date.now() - startTime;
    const statusCode = error.status || error.statusCode || 500;
    const errorResponse = error.response;
    
    // 에러 정보 구성
    const logInfo = {
      requestId,
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      error: {
        code: errorResponse?.error?.code || 'UNKNOWN_ERROR',
        message: errorResponse?.message || error.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
      }
    };

    // 에러 로깅 - 기본 정보는 로그 메시지에, 상세 정보는 메타데이터로
    this.loggerService.error(
      `[HTTP] [${requestId}] ← ${method} ${url} - ${statusCode} Error(${logInfo.error.code}) - ${duration}ms`,
      { error: logInfo.error }
    );
  }
  
  /**
   * 헤더에서 민감한 정보를 제거합니다.
   * 
   * @param headers - 요청 헤더
   * @returns 정제된 헤더
   * @private
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    
    // 민감한 헤더 제거 또는 마스킹
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];
    for (const header of sensitiveHeaders) {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  /**
   * 객체의 대략적인 크기를 계산합니다.
   * 
   * @param obj - 크기를 계산할 객체
   * @returns 객체 크기 문자열 (KB 단위)
   * @private
   */
  private getApproximateSize(obj: any): string {
    try {
      const jsonString = JSON.stringify(obj);
      const bytes = new TextEncoder().encode(jsonString).length;
      return `${(bytes / 1024).toFixed(2)} KB`;
    } catch (error) {
      return 'unknown size';
    }
  }
} 