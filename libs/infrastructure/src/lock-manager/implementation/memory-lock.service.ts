import { Injectable, Logger } from '@nestjs/common';
import { ILockManager, LockOptions } from '@app/libs/infrastructure/lock-manager/interface';

interface Lock {
  value: string;
  expireAt: number;
}

/**
 * 단순 인메모리 분산 락 서비스 구현체
 * 단일 서버 환경이나 테스트용으로 적합합니다.
 */
@Injectable()
export class MemoryLockService implements ILockManager {
  private readonly logger = new Logger(MemoryLockService.name);
  private readonly locks: Map<string, Lock> = new Map();
  private readonly defaultOptions = {
    lockTTL: 30,
    retryCount: 3,
    retryDelay: 200,
  };

  /**
   * 키에 대한 락을 획득합니다.
   * 
   * @param key 락 키
   * @param options 락 획득 옵션
   * @returns 락 획득 성공 여부와 락 해제 함수
   */
  async acquireLock(
    key: string,
    options?: LockOptions,
  ): Promise<{ success: boolean; release: () => Promise<void> }> {
    const lockKey = `lock:${key}`;
    const lockValue = Date.now().toString();

    const lockTTL = options?.lockTTL || this.defaultOptions.lockTTL;
    const retryCount = options?.retryCount || this.defaultOptions.retryCount;
    const retryDelay = options?.retryDelay || this.defaultOptions.retryDelay;

    // 만료된 락 정리
    this.cleanupExpiredLocks();

    // 락 해제 함수
    const release = async (): Promise<void> => {
      try {
        const lock = this.locks.get(lockKey);

        // 본인의 락만 해제 가능
        if (lock && lock.value === lockValue) {
          this.locks.delete(lockKey);
          this.logger.debug(`Lock released: ${lockKey}`);
        }
      } catch (error) {
        this.logger.error(`Failed to release lock: ${lockKey}`, error);
      }
    };

    // 락 획득 시도
    for (let i = 0; i <= retryCount; i++) {
      try {
        const existingLock = this.locks.get(lockKey);

        // 락이 없거나 만료된 경우
        if (!existingLock) {
          this.locks.set(lockKey, {
            value: lockValue,
            expireAt: Date.now() + (lockTTL * 1000)
          });

          this.logger.debug(`Lock acquired: ${lockKey}`);
          return { success: true, release };
        }

        // 최대 재시도 횟수에 도달하지 않았으면 대기 후 재시도
        if (i < retryCount) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          this.cleanupExpiredLocks(); // 재시도 전 만료된 락 정리
        }
      } catch (error) {
        this.logger.error(`Error acquiring lock: ${lockKey}`, error);

        // 에러가 발생해도 계속 재시도
        if (i < retryCount) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    this.logger.warn(`Failed to acquire lock after ${retryCount} retries: ${lockKey}`);
    return { success: false, release };
  }

  /**
   * 분산 락을 사용하여 함수를 실행합니다.
   * 
   * @param key 락 키
   * @param fn 락 획득 후 실행할 함수
   * @param options 락 옵션
   * @returns 함수 실행 결과 또는 null(락 획득 실패 시)
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    options?: LockOptions,
  ): Promise<T | null> {
    const { success, release } = await this.acquireLock(key, options);

    if (!success) {
      return null;
    }

    try {
      return await fn();
    } finally {
      await release();
    }
  }

  /**
   * 만료된 락을 정리합니다.
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();

    for (const [key, lock] of this.locks.entries()) {
      if (lock.expireAt <= now) {
        this.locks.delete(key);
        this.logger.debug(`Expired lock removed: ${key}`);
      }
    }
  }
} 