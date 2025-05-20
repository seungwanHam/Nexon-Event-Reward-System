import { Injectable, Logger } from '@nestjs/common';
import { LockOptions } from './interface';

/**
 * 분산 락 서비스 추상 클래스
 * 
 * 여러 노드 또는 인스턴스에서 공유 리소스에 대한 배타적 접근을 제어하는 
 * 분산 락 메커니즘을 구현하는 기본 클래스입니다.
 * 
 * 이 서비스는 다양한 백엔드(Redis, MongoDB 등)에서 구현될 수 있는
 * 일관된 인터페이스를 제공합니다.
 */
@Injectable()
export abstract class LockService {
  protected readonly logger = new Logger(LockService.name);

  /**
   * 지정된 키에 대한 락을 획득합니다.
   * 
   * @param key - 락을 획득할 고유 키
   * @param options - 락 획득 옵션 (TTL, 재시도 횟수 등)
   * @returns 락 획득 성공 여부를 나타내는 불리언 값
   */
  abstract acquire(key: string, options: LockOptions): Promise<boolean>;

  /**
   * 지정된 키에 대한 락을 해제합니다.
   * 
   * @param key - 해제할 락의 고유 키
   * @returns 락 해제 성공 여부를 나타내는 불리언 값
   */
  abstract release(key: string): Promise<boolean>;

  /**
   * 키에 대한 분산 락을 획득하고 해제 함수를 반환합니다.
   * 
   * @param key - 락을 획득할 고유 키
   * @param options - 락 획득 옵션
   * @returns 락 획득 성공 여부와 락 해제 함수가 포함된 객체
   * 
   * @example
   * ```typescript
   * const { success, release } = await lockService.acquireLock('user:123');
   * if (success) {
   *   try {
   *     // 임계 영역 코드 실행
   *   } finally {
   *     await release();
   *   }
   * }
   * ```
   */
  async acquireLock(
    key: string,
    options?: LockOptions,
  ): Promise<{ success: boolean; release: () => Promise<void> }> {
    this.logger.debug(`Acquiring lock for key: ${key}`);
    const success = await this.acquire(key, options || {});

    if (success) {
      this.logger.debug(`Successfully acquired lock for key: ${key}`);
    } else {
      this.logger.debug(`Failed to acquire lock for key: ${key}`);
    }

    const release = async (): Promise<void> => {
      this.logger.debug(`Releasing lock for key: ${key}`);
      await this.release(key);
    };

    const noopRelease = async (): Promise<void> => {
      this.logger.debug(`No lock to release for key: ${key}`);
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
   * @param key - 락을 획득할 고유 키
   * @param fn - 락 획득 후 실행할 비동기 함수
   * @param options - 락 획득 옵션
   * @returns 함수 실행 결과 또는 null(락 획득 실패 시)
   * 
   * @example
   * ```typescript
   * const result = await lockService.withLock('user:123', async () => {
   *   // 락이 획득된 상태에서 실행할 코드
   *   return 'some result';
   * });
   * 
   * if (result === null) {
   *   // 락 획득 실패 처리
   * }
   * ```
   */
  async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    options?: LockOptions,
  ): Promise<T | null> {
    const { success, release } = await this.acquireLock(key, options);

    if (!success) {
      this.logger.warn(`Could not acquire lock for key: ${key}, skipping operation`);
      return null;
    }

    try {
      this.logger.debug(`Executing function with lock for key: ${key}`);
      return await fn();
    } catch (error) {
      this.logger.error(`Error in function execution with lock for key: ${key}`, error);
      throw error;
    } finally {
      await release();
    }
  }

  /**
   * 락을 획득한 후 작업을 수행하고 자동으로 락을 해제합니다.
   * 락 획득에 실패하면 예외를 발생시킵니다.
   * 
   * @param key - 락을 획득할 고유 키
   * @param callback - 락 획득 후 실행할 비동기 함수
   * @param ttl - 락 유효 시간(밀리초)
   * @returns 콜백 함수의 결과
   * @throws 락 획득 실패 시 예외 발생
   * 
   * @example
   * ```typescript
   * try {
   *   const result = await lockService.executeWithLock('user:123', async () => {
   *     // 락이 획득된 상태에서 실행할 코드
   *     return 'some result';
   *   });
   * } catch (error) {
   *   // 락 획득 실패 또는 실행 중 오류 처리
   * }
   * ```
   */
  async executeWithLock<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    this.logger.debug(`Trying to acquire lock for key: ${key} with TTL: ${ttl || 'default'}`);
    const acquired = await this.acquire(key, { lockTTL: ttl });

    if (!acquired) {
      const errorMsg = `Failed to acquire lock for key: ${key}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      this.logger.debug(`Lock acquired for key: ${key}, executing callback`);
      return await callback();
    } catch (error) {
      this.logger.error(`Error while executing callback with lock for key: ${key}`, error);
      throw error;
    } finally {
      this.logger.debug(`Releasing lock for key: ${key}`);
      await this.release(key);
    }
  }

  /**
   * @deprecated Use executeWithLock instead
   */
  async withLockNew<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    return this.executeWithLock(key, callback, ttl);
  }
} 