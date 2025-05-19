import { LockOptions } from './lock-options.interface';

export interface LockService {
  /**
   * 지정된 키에 대한 락을 획득합니다.
   * @param key 락을 획득할 키
   * @param options 락 옵션 (TTL, 재시도 횟수 등)
   * @returns 락 획득 성공 여부
   */
  acquire(key: string, options: LockOptions): Promise<boolean>;

  /**
   * 지정된 키에 대한 락을 해제합니다.
   * @param key 락을 해제할 키
   */
  release(key: string): Promise<void>;
} 