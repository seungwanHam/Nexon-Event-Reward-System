import { Inject } from '@nestjs/common';
import { Logger, LoggerFactory, LOGGER_FACTORY } from './logger.interface';

/**
 * NestJS 외부에서 로거 인스턴스 생성을 위한 임시 팩토리
 * 애플리케이션이 초기화 되기 전에 로거가 필요한 경우에 사용
 * 주로 main.ts에서 사용됨
 */
let tempLoggerFactory: LoggerFactory | null = null;

export function setTempLoggerFactory(factory: LoggerFactory): void {
  tempLoggerFactory = factory;
}

/**
 * 로거 인스턴스를 생성하는 헬퍼 함수
 */
export function createLogger(context: string): Logger {
  if (!tempLoggerFactory) {
    // fallback: 로거 팩토리가 설정되지 않은 경우 콘솔에 출력
    return {
      log: (message: string, metadata?: Record<string, any>) => 
        console.log(`[${context}] ${message}`, metadata || ''),
      error: (message: string, metadata?: Record<string, any>) => 
        console.error(`[${context}] ${message}`, metadata || ''),
      warn: (message: string, metadata?: Record<string, any>) => 
        console.warn(`[${context}] ${message}`, metadata || ''),
      debug: (message: string, metadata?: Record<string, any>) => 
        console.debug(`[${context}] ${message}`, metadata || ''),
      verbose: (message: string, metadata?: Record<string, any>) => 
        console.log(`[${context}] VERBOSE: ${message}`, metadata || ''),
    };
  }
  
  return tempLoggerFactory.createLogger(context);
}

/**
 * NestJS 프로바이더에서 로거 팩토리를 주입받기 위한 데코레이터
 */
export const InjectLoggerFactory = () => Inject(LOGGER_FACTORY); 