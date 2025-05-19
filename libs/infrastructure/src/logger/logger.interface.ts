/**
 * 애플리케이션 전체에서 사용할 로거 인터페이스
 */
export interface Logger {
  log(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
  verbose(message: string, metadata?: Record<string, any>): void;
}

/**
 * 로거 팩토리 인터페이스
 */
export interface LoggerFactory {
  /**
   * 해당 서비스/컨텍스트에 맞는 로거 인스턴스 생성
   */
  createLogger(context: string): Logger;
}

/**
 * 의존성 주입을 위한 토큰
 */
export const LOGGER_FACTORY = 'LOGGER_FACTORY';