export interface LockManagerOptions {
  /**
   * Redis 호스트
   */
  host?: string;
  
  /**
   * Redis 포트
   */
  port?: number;
  
  /**
   * Redis 비밀번호
   */
  password?: string;
  
  /**
   * 락 TTL (초) - 락이 자동으로 해제되는 시간
   */
  lockTTL?: number;
  
  /**
   * 락 획득 시도 횟수
   */
  retryCount?: number;
  
  /**
   * 락 획득 재시도 간격 (ms)
   */
  retryDelay?: number;
} 