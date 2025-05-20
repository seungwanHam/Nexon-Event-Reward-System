import { Injectable, LogLevel, Inject, Optional } from '@nestjs/common';
import { Logger } from './logger.interface';
import * as winston from 'winston';
import * as path from 'path';

/**
 * Winston 기반 로거 구현체
 * 
 * NestJS 애플리케이션에서 구조화된 로깅을 제공합니다.
 * 개발 및 프로덕션 환경에 맞게 로그 레벨과 형식을 조정합니다.
 */
@Injectable()
export class WinstonLoggerService implements Logger {
  private readonly logger: winston.Logger;
  private context?: string;

  /**
   * Winston 로거 서비스 생성자
   * 
   * @param context - 로깅 컨텍스트 (선택 사항)
   */
  constructor(@Optional() @Inject('LOGGER_CONTEXT') context?: string) {
    this.context = context;

    // 로그 레벨 설정 (개발 환경에서는 더 자세한 로그)
    const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

    // 로그 파일 경로 설정 (프로덕션 환경에서만 파일 로깅)
    const logDir = process.env.LOG_DIR || 'logs';

    // 로거 인스턴스 생성
    this.logger = winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: context ? { context } : {},
      transports: [
        // 콘솔 출력 설정
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(this.formatLogMessage.bind(this))
          ),
        }),

        // 프로덕션 환경에서는 파일에도 로깅
        ...(process.env.NODE_ENV === 'production' ? [
          new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error'
          }),
          new winston.transports.File({
            filename: path.join(logDir, 'combined.log')
          })
        ] : [])
      ],
    });
  }

  /**
   * 로그 메시지 포맷 설정
   * 
   * @param info - 로그 정보 객체
   * @returns 포맷팅된 로그 문자열
   * @private
   */
  private formatLogMessage(info: winston.Logform.TransformableInfo): string {
    const { level, message, timestamp, context, ...metadata } = info;
    const contextStr = context || this.context ? `[${context || this.context}]` : '';

    let metadataStr = '';
    if (Object.keys(metadata).length > 0) {
      // 스택 트레이스는 별도로 처리 (가독성 향상)
      if (metadata.stack) {
        metadataStr = `\n${metadata.stack}`;
        delete metadata.stack;
      }

      // 숫자 키로 구성된 객체는 문자열 배열로 간주하고 제외
      const isCharArray = Object.keys(metadata).every(key =>
        !isNaN(Number(key)) && typeof metadata[key] === 'string' && metadata[key].length === 1
      );

      // 일반 메타데이터만 처리 (문자 배열이 아닌 경우)
      if (Object.keys(metadata).length > 0 && !isCharArray) {
        metadataStr += `\n${JSON.stringify(metadata, null, 2)}`;
      }
    }

    return `[${timestamp}] ${level.padEnd(7)}: ${contextStr} ${message} ${metadataStr}`;
  }

  /**
   * 컨텍스트 설정
   * 
   * @param context - 로깅 컨텍스트 이름
   * @returns 현재 로거 인스턴스
   */
  setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * 정보 수준 로그 기록
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터
   */
  log(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, metadata);
  }

  /**
   * 오류 수준 로그 기록
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터 (Error 객체 포함 가능)
   */
  error(message: string, metadata?: Record<string, any> | Error | string): void {
    if (metadata instanceof Error) {
      this.logger.error(message, {
        stack: metadata.stack,
        message: metadata.message,
        name: metadata.name
      });
    } else {
      this.logger.error(message, metadata);
    }
  }

  /**
   * 경고 수준 로그 기록
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, metadata);
  }

  /**
   * 디버그 수준 로그 기록
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, metadata);
  }

  /**
   * 상세 정보 수준 로그 기록
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터
   */
  verbose(message: string, metadata?: Record<string, any>): void {
    this.logger.verbose(message, metadata);
  }

  info(message: string) {
    this.logger.info(this.formatMessage(message));
  }

  private formatMessage(message: string): string {
    return this.context ? `[${this.context}] ${message}` : message;
  }
} 