import { Injectable } from '@nestjs/common';
import { LockOptions } from './interface';

/**
 * 분산 락 서비스 추상 클래스
 */
@Injectable()
export abstract class LockService {
  /**
   * 지정된 키에 대한 락을 획득합니다.
   * @param key 락을 획득할 키
   * @param options 락 옵션 (TTL, 재시도 횟수 등)
   * @returns 락 획득 성공 여부
   */
  abstract acquire(key: string, options: LockOptions): Promise<boolean>;

  /**
   * 지정된 키에 대한 락을 해제합니다.
   * @param key 해제할 락의 키
   * @returns 락 해제 성공 여부
   */
  abstract release(key: string): Promise<boolean>;

  /**
   * 키에 대한 분산 락을 획득합니다.
   * 
   * @param key 락 키
   * @param options 락 획득 옵션
   * @returns 락 획득 성공 여부와 락 해제 함수
   */
  async acquireLock(
    key: string,
    options?: LockOptions,
  ): Promise<{ success: boolean; release: () => Promise<void> }> {
    const success = await this.acquire(key, options || {});
    
    const release = async (): Promise<void> => {
      await this.release(key);
    };
    
    const noopRelease = async (): Promise<void> => {
      // 아무 작업 없음
    };
    
    return {
      success,
      release: success ? release : noopRelease
    };
  }

  /**
   * 락을 획득한 후 작업을 수행하고 자동으로 락을 해제합니다.
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
   * 새로운 API 형태로 락을 획득한 후 작업을 수행하고 자동으로 락을 해제합니다.
   * @param key 락을 획득할 키
   * @param callback 락 획득 후 실행할 콜백 함수
   * @param ttl 락 타임아웃 (밀리초)
   * @returns 콜백 함수의 결과
   */
  async withLockNew<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    const acquired = await this.acquire(key, { lockTTL: ttl });
    if (!acquired) {
      throw new Error(`Failed to acquire lock for key: ${key}`);
    }

    try {
      return await callback();
    } finally {
      await this.release(key);
    }
  }
} 