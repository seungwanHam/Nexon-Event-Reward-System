import { Inject } from '@nestjs/common';
import { Logger, LoggerFactory, LOGGER_FACTORY } from './logger.interface';

/**
 * NestJS 외부에서 로거 인스턴스 생성을 위한 임시 팩토리
 * 
 * 애플리케이션이 초기화 되기 전에 로거가 필요한 경우에 사용합니다.
 * 주로 main.ts나 독립적인 스크립트에서 사용됩니다.
 */
let tempLoggerFactory: LoggerFactory | null = null;

/**
 * 임시 로거 팩토리를 설정합니다.
 * 
 * @param factory - 사용할 로거 팩토리 인스턴스
 */
export function setTempLoggerFactory(factory: LoggerFactory): void {
  tempLoggerFactory = factory;
}

/**
 * 지정된 컨텍스트에 대한 로거 인스턴스를 생성합니다.
 * 
 * @param context - 로깅 컨텍스트 이름
 * @returns 생성된 로거 인스턴스
 */
export function createLogger(context: string): Logger {
  if (!tempLoggerFactory) {
    // 로거 팩토리가 설정되지 않은 경우, 기본 콘솔 로거 사용
    return createConsoleLogger(context);
  }
  
  return tempLoggerFactory.createLogger(context);
}

/**
 * 간단한 콘솔 로거를 생성합니다.
 * 
 * @param context - 로깅 컨텍스트 이름
 * @returns 콘솔 기반 로거 인스턴스
 * @private
 */
function createConsoleLogger(context: string): Logger {
  const timestamp = () => new Date().toISOString();
  
  return {
    log: (message: string, metadata?: Record<string, any>) => 
      console.log(`[${timestamp()}] [INFO] [${context}] ${message}`, metadata || ''),
    
    error: (message: string, metadata?: Record<string, any> | Error | string) => {
      if (metadata instanceof Error) {
        console.error(`[${timestamp()}] [ERROR] [${context}] ${message}`, {
          name: metadata.name,
          message: metadata.message,
          stack: metadata.stack
        });
      } else {
        console.error(`[${timestamp()}] [ERROR] [${context}] ${message}`, metadata || '');
      }
    },
    
    warn: (message: string, metadata?: Record<string, any>) => 
      console.warn(`[${timestamp()}] [WARN] [${context}] ${message}`, metadata || ''),
    
    debug: (message: string, metadata?: Record<string, any>) => 
      console.debug(`[${timestamp()}] [DEBUG] [${context}] ${message}`, metadata || ''),
    
    verbose: (message: string, metadata?: Record<string, any>) => 
      console.log(`[${timestamp()}] [VERBOSE] [${context}] ${message}`, metadata || ''),
      
    setContext: (newContext: string) => createConsoleLogger(newContext)
  };
}

/**
 * NestJS 프로바이더에서 로거 팩토리를 주입받기 위한 데코레이터
 * 
 * @returns Inject 데코레이터 (LOGGER_FACTORY 토큰 사용)
 */
export const InjectLoggerFactory = () => Inject(LOGGER_FACTORY); 