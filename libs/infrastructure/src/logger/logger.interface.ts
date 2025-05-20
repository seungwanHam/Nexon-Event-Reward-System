/**
 * 애플리케이션 전체에서 사용할 로거 인터페이스
 * 
 * 모든 로거 구현체는 이 인터페이스를 준수해야 합니다.
 * 여러 로그 레벨을 지원하며, 각 로그 메서드는 추가 메타데이터를 허용합니다.
 */
export interface Logger {
  /**
   * 정보 수준 로그를 기록합니다.
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터
   */
  log(message: string, metadata?: Record<string, any>): void;
  
  /**
   * 오류 수준 로그를 기록합니다.
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터
   */
  error(message: string, metadata?: Record<string, any> | Error | string): void;
  
  /**
   * 경고 수준 로그를 기록합니다.
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터
   */
  warn(message: string, metadata?: Record<string, any>): void;
  
  /**
   * 디버그 수준 로그를 기록합니다.
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터
   */
  debug(message: string, metadata?: Record<string, any>): void;
  
  /**
   * 상세 정보 수준 로그를 기록합니다.
   * 
   * @param message - 로그 메시지
   * @param metadata - 추가 메타데이터
   */
  verbose(message: string, metadata?: Record<string, any>): void;
  
  /**
   * 로깅 컨텍스트를 설정합니다.
   * 
   * @param context - 로깅 컨텍스트 이름
   * @returns 현재 로거 인스턴스
   */
  setContext?(context: string): Logger;
}

/**
 * 로거 팩토리 인터페이스
 * 
 * 서비스나 컴포넌트별로 독립된 로거 인스턴스를 생성하는 팩토리입니다.
 */
export interface LoggerFactory {
  /**
   * 해당 서비스/컨텍스트에 맞는 로거 인스턴스를 생성합니다.
   * 
   * @param context - 로깅 컨텍스트 이름 (서비스/컴포넌트 이름)
   * @returns 새로운 로거 인스턴스
   */
  createLogger(context: string): Logger;
}

/**
 * 의존성 주입을 위한 토큰
 * 
 * NestJS의 DI 컨테이너에서 로거 팩토리를 식별하는 토큰입니다.
 */
export const LOGGER_FACTORY = 'LOGGER_FACTORY';