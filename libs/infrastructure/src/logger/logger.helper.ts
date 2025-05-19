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
      log: (message: string) => console.log(`[${context}] ${message}`),
      error: (message: string, trace?: string) => console.error(`[${context}] ${message}`, trace || ''),
      warn: (message: string) => console.warn(`[${context}] ${message}`),
      debug: (message: string) => console.debug(`[${context}] ${message}`),
      verbose: (message: string) => console.log(`[${context}] VERBOSE: ${message}`),
    };
  }
  
  return tempLoggerFactory.createLogger(context);
}

/**
 * NestJS 프로바이더에서 로거 팩토리를 주입받기 위한 데코레이터
 */
export const InjectLoggerFactory = () => Inject(LOGGER_FACTORY); 