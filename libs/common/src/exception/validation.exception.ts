import { BaseException } from './base.exception';

/**
 * 유효성 검증 오류 예외 클래스
 */
export class ValidationException extends BaseException {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, details);
  }
} 