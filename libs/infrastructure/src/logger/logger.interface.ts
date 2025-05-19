/**
 * 애플리케이션 전체에서 사용할 로거 인터페이스
 */
export interface Logger {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  verbose(message: string, context?: string): void;
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