/**
 * 데이터베이스 연결 설정 인터페이스
 */
export interface DatabaseConfigOptions {
  /**
   * 연결 URI
   */
  uri: string;

  /**
   * 데이터베이스 이름
   */
  dbName?: string;

  /**
   * 사용자 이름
   */
  username?: string;

  /**
   * 비밀번호
   */
  password?: string;

  /**
   * 연결 타임아웃 (ms)
   */
  connectionTimeout?: number;

  /**
   * 최대 재시도 횟수
   */
  maxRetries?: number;

  /**
   * 재시도 간격 (ms)
   */
  retryDelay?: number;

  /**
   * 자동 인덱스 생성 여부
   */
  autoIndex?: boolean;

  /**
   * 디버그 모드 활성화 여부
   */
  debug?: boolean;
} 