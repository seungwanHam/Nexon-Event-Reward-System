import { LockOptions } from '@app/libs/infrastructure/lock-manager/interface';

/**
 * 분산 락 매니저 인터페이스
 * 모든 분산 락 구현체는 이 인터페이스를 준수해야 합니다.
 */
export interface ILockManager {
  /**
   * 키에 대한 분산 락을 획득합니다.
   * 
   * @param key 락 키
   * @param options 락 획득 옵션
   * @returns 락 획득 성공 여부와 락 해제 함수
   */
  acquireLock(
    key: string,
    options?: LockOptions,
  ): Promise<{ success: boolean; release: () => Promise<void> }>;

  /**
   * 분산 락을 사용하여 함수를 실행합니다.
   * 
   * @param key 락 키
   * @param fn 락 획득 후 실행할 함수
   * @param options 락 옵션
   * @returns 함수 실행 결과 또는 null(락 획득 실패 시)
   */
  withLock<T>(
    key: string,
    fn: () => Promise<T>,
    options?: LockOptions,
  ): Promise<T | null>;
} 