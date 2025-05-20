/**
 * 데이터베이스 연결 설정 인터페이스
 * 
 * MongoDB 데이터베이스 연결에 필요한 설정 옵션들을 정의합니다.
 * mongoose 라이브러리의 일반적인 옵션들을 포함합니다.
 */
export interface DatabaseConfigOptions {
  /**
   * 연결 URI (필수)
   * 
   * 형식: mongodb://[username:password@]host[:port]/database
   */
  uri: string;

  /**
   * 데이터베이스 이름
   * 
   * URI에 지정되지 않은 경우 사용됩니다.
   */
  dbName?: string;

  /**
   * 사용자 이름
   * 
   * URI에 지정되지 않은 경우 사용됩니다.
   */
  username?: string;

  /**
   * 비밀번호
   * 
   * URI에 지정되지 않은 경우 사용됩니다.
   */
  password?: string;

  /**
   * 연결 타임아웃 (ms)
   * 
   * 기본값: 30000 (30초)
   */
  connectionTimeout?: number;

  /**
   * 최대 재시도 횟수
   * 
   * 기본값: 3
   */
  maxRetries?: number;

  /**
   * 재시도 간격 (ms)
   * 
   * 기본값: 1000 (1초)
   */
  retryDelay?: number;

  /**
   * 자동 인덱스 생성 여부
   * 
   * 프로덕션 환경에서는 false로 설정하는 것이 권장됩니다.
   * 기본값: true
   */
  autoIndex?: boolean;

  /**
   * 디버그 모드 활성화 여부
   * 
   * mongoose 디버그 로그를 활성화합니다.
   * 기본값: false
   */
  debug?: boolean;
  
  /**
   * 새 URL 파서 사용 여부
   * 
   * 기본값: true
   */
  useNewUrlParser?: boolean;
  
  /**
   * 통합 토폴로지 사용 여부
   * 
   * 새로운 서버 검색 및 모니터링 엔진을 사용합니다.
   * 기본값: true
   */
  useUnifiedTopology?: boolean;
  
  /**
   * 최대 연결 풀 크기
   * 
   * 기본값: 5
   */
  poolSize?: number;
  
  /**
   * 서버 선택 타임아웃 (ms)
   * 
   * 기본값: 30000 (30초)
   */
  serverSelectionTimeoutMS?: number;
  
  /**
   * 소켓 타임아웃 (ms)
   * 
   * 기본값: 360000 (6분)
   */
  socketTimeoutMS?: number;
  
  /**
   * 유휴 시간 (ms)
   * 
   * 연결이 닫히기 전 유휴 상태로 남아있을 수 있는 시간
   * 기본값: 30000 (30초)
   */
  connectTimeoutMS?: number;
} 