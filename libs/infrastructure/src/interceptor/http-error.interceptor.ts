import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { WinstonLoggerService } from '../logger';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { SystemErrorCodes, GatewayErrorCodes, ErrorCode } from '@app/libs/common/exception/error-codes';

/**
 * HTTP 응답에서 에러 정보를 포함할 표준 포맷
 */
interface ErrorResponse {
  /** 요청 성공 여부 (항상 false) */
  success: boolean;
  
  /** 사용자 친화적인 에러 메시지 */
  message: string;
  
  /** 에러 상세 정보 */
  error: {
    /** 에러 코드 (식별자) */
    code: string;
    
    /** 추가 에러 상세 정보 (개발 환경에서만 포함) */
    details?: any;
  };
}

/**
 * HTTP 요청/응답 인터셉터
 * 
 * 모든 HTTP 요청과 응답을 가로채어 로깅하고, 에러를 표준화된 형식으로 처리합니다.
 * 이 인터셉터는 다음과 같은 기능을 제공합니다:
 * 
 * - 요청 및 응답 시간 측정 및 로깅
 * - 마이크로서비스 간 응답 오류 포맷 통합
 * - 개발/프로덕션 환경에 따른 에러 상세 정보 제어
 * - 고유 요청 ID를 통한 요청 추적
 */
@Injectable()
export class HttpErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpErrorInterceptor.name);
  
  /**
   * HTTP 에러 인터셉터 생성자
   * 
   * @param loggerService - 로깅 서비스
   */
  constructor(private readonly loggerService: WinstonLoggerService) { 
    this.loggerService.setContext('HttpErrorInterceptor');
  }

  /**
   * HTTP 요청을 인터셉트하여 응답과 에러를 처리합니다.
   * 
   * @param context - 실행 컨텍스트
   * @param next - 다음 핸들러
   * @returns 처리된 응답 Observable
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const requestId = this.generateRequestId();
    const now = Date.now();

    // 요청 로깅
    this.loggerService.log(`[HTTP] [${requestId}] → ${request.method} ${request.url} - ${request.ip} - ${request.get('user-agent')}`);

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse<Response>();
        // 성공 응답 로깅
        this.loggerService.log(
          `[HTTP] [${requestId}] ← ${request.method} ${request.url} - ${response.statusCode} - ${Date.now() - now}ms`
        );
      }),
      catchError((error) => {
        const response = ctx.getResponse<Response>();
        const duration = `${Date.now() - now}ms`;

        // 마이크로서비스 에러 응답 처리 (AxiosError 등)
        if (error.response?.data) {
          return this.handleExternalServiceError(error, request, requestId, duration);
        }

        // 애플리케이션 내부 에러 처리
        return this.handleInternalError(error, request, requestId, duration);
      }),
    );
  }
  
  /**
   * 고유한 요청 ID를 생성합니다.
   * 
   * @returns 고유 요청 ID (16진수)
   * @private
   */
  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
  
  /**
   * 내부 애플리케이션 에러를 처리합니다.
   * 
   * @param error - 발생한 에러
   * @param request - HTTP 요청 객체
   * @param requestId - 요청 ID
   * @param duration - 요청 처리 시간
   * @returns 에러 Observable
   * @private
   */
  private handleInternalError(error: any, request: Request, requestId: string, duration: string): Observable<never> {
    const isDev = process.env.NODE_ENV !== 'production';
    
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: ErrorCode = SystemErrorCodes.SYSTEM_ERROR;
    let errorMessage = '서버 내부 오류가 발생했습니다';
    let errorDetails = undefined;
    
    if (error instanceof HttpException) {
      statusCode = error.getStatus();
      errorCode = this.getErrorCode(error);
      
      // 에러 응답 형식 확인
      const errorResponse = error.getResponse();
      if (typeof errorResponse === 'object') {
        errorMessage = errorResponse['message'] || errorMessage;
        
        // 개발 환경에서만 상세 정보 포함
        if (isDev) {
          errorDetails = errorResponse['details'] || undefined;
        }
      } else if (typeof errorResponse === 'string') {
        errorMessage = errorResponse;
      }
    } else {
      // 기타 예외 처리 (개발 환경에서만 스택 트레이스 포함)
      if (isDev) {
        errorDetails = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      }
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: errorMessage,
      error: {
        code: errorCode,
        details: errorDetails
      }
    };
    
    this.loggerService.error(
      `[HTTP] [${requestId}] ← ${request.method} ${request.url} - ${statusCode} Error(${errorCode}) - ${duration}`,
      { error: errorResponse.error }
    );
    
    return throwError(() => new HttpException(errorResponse, statusCode));
  }
  
  /**
   * 외부 서비스(마이크로서비스)의 에러 응답을 처리합니다.
   * 
   * @param error - 발생한 에러
   * @param request - HTTP 요청 객체
   * @param requestId - 요청 ID
   * @param duration - 요청 처리 시간
   * @returns 에러 Observable
   * @private
   */
  private handleExternalServiceError(error: any, request: Request, requestId: string, duration: string): Observable<never> {
    const errorData = error.response.data;
    const errorCode = errorData.error?.code || GatewayErrorCodes.GATEWAY_INVALID_RESPONSE;
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: errorData.message || '서비스 처리 중 오류가 발생했습니다',
      error: {
        code: errorCode,
        details: errorData.error?.details
      }
    };

    this.loggerService.error(
      `[HTTP] [${requestId}] ← ${request.method} ${request.url} - ${error.response.status} Error(${errorResponse.error.code}) - ${duration}`,
      { error: errorResponse.error }
    );

    return throwError(() => new HttpException(errorResponse, error.response.status || HttpStatus.BAD_GATEWAY));
  }
  
  /**
   * HttpException에서 에러 코드를 추출합니다.
   * 
   * @param error - HttpException 객체
   * @returns 에러 코드 문자열
   * @private
   */
  private getErrorCode(error: HttpException): ErrorCode {
    const response = error.getResponse();
    if (typeof response === 'object' && response !== null && 'error' in response) {
      if (response['error'] && typeof response['error'] === 'object' && 'code' in response['error']) {
        return response['error']['code'] as ErrorCode;
      }
      const errorCode = response['error'];
      return typeof errorCode === 'string' ? errorCode : SystemErrorCodes.SYSTEM_ERROR;
    }
    
    // 기본 HTTP 상태 코드를 기반으로 에러 코드 생성
    const status = error.getStatus();
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return SystemErrorCodes.INVALID_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return SystemErrorCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return SystemErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return SystemErrorCodes.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return SystemErrorCodes.VALIDATION_ERROR;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return SystemErrorCodes.VALIDATION_ERROR;
      case HttpStatus.TOO_MANY_REQUESTS:
        return SystemErrorCodes.RATE_LIMIT_EXCEEDED;
      case HttpStatus.GATEWAY_TIMEOUT:
        return GatewayErrorCodes.GATEWAY_REQUEST_TIMEOUT;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return SystemErrorCodes.SERVICE_UNAVAILABLE;
      default:
        return SystemErrorCodes.SYSTEM_ERROR;
    }
  }
} 