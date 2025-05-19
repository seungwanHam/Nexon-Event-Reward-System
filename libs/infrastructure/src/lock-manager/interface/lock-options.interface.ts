/**
 * 락 획득 옵션
 */
export interface LockOptions {
  /**
   * 락 획득 시도 횟수
   */
  retryCount?: number;
  
  /**
   * 락 획득 재시도 간격 (ms)
   */
  retryDelay?: number;
  
  /**
   * 락 TTL (초)
   */
  lockTTL?: number;
} 