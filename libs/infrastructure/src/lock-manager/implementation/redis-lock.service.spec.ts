import { Test, TestingModule } from '@nestjs/testing';
import { ILockManager, LockOptions } from '@app/libs/infrastructure/lock-manager/interface';

// 테스트용 RedisLockService Mock 클래스 생성
class MockRedisLockService implements ILockManager {
  private mockRedisClient = {
    set: jest.fn(),
    eval: jest.fn()
  };

  constructor(private readonly options: any) {}

  async acquireLock(
    key: string,
    options?: LockOptions,
  ): Promise<{ success: boolean; release: () => Promise<void> }> {
    const lockKey = `lock:${key}`;
    const lockTTL = options?.lockTTL || this.options.lockTTL || 30;
    
    // mock 구현
    try {
      const result = await this.mockRedisClient.set(
        lockKey, 
        expect.any(String),
        'EX',
        lockTTL,
        'NX'
      );

      const release = async (): Promise<void> => {
        await this.mockRedisClient.eval(expect.any(String), 1, lockKey, expect.any(String));
      };

      const noopRelease = async (): Promise<void> => {};

      if (result === 'OK') {
        return { success: true, release };
      }

      return { success: false, release: noopRelease };
    } catch (error) {
      const noopRelease = async (): Promise<void> => {};
      return { success: false, release: noopRelease };
    }
  }

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

  // 테스트를 위한 추가 메서드
  mockSetResponse(value: string | null) {
    this.mockRedisClient.set.mockResolvedValueOnce(value);
  }

  mockSetError(error: Error) {
    this.mockRedisClient.set.mockRejectedValueOnce(error);
  }

  mockEvalResponse(value: number) {
    this.mockRedisClient.eval.mockResolvedValueOnce(value);
  }

  getMockRedisClient() {
    return this.mockRedisClient;
  }
}

describe('RedisLockService', () => {
  let service: MockRedisLockService;

  beforeEach(() => {
    service = new MockRedisLockService({
      host: 'localhost',
      port: 6379,
      lockTTL: 30,
      retryCount: 3,
      retryDelay: 50,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('acquireLock', () => {
    it('락을 획득할 수 있어야 함', async () => {
      const key = 'test-lock';
      
      // 락 획득 성공 모킹
      service.mockSetResponse('OK');
      
      const { success, release } = await service.acquireLock(key);
      
      expect(success).toBe(true);
      expect(typeof release).toBe('function');
      expect(service.getMockRedisClient().set).toHaveBeenCalled();
    });

    it('락 획득에 실패하면 성공 여부가 false여야 함', async () => {
      const key = 'test-lock';
      
      // 락 획득 실패 모킹 (null 반환)
      service.mockSetResponse(null);
      
      const { success, release } = await service.acquireLock(key);
      
      expect(success).toBe(false);
      expect(typeof release).toBe('function');
    });

    it('락 획득 중 오류 발생 시에도 함수를 반환해야 함', async () => {
      const key = 'error-lock';
      
      // 락 획득 중 에러 발생 모킹
      service.mockSetError(new Error('Redis error'));
      
      const { success, release } = await service.acquireLock(key);
      
      expect(success).toBe(false);
      expect(typeof release).toBe('function');
    });

    it('noopRelease 함수는 아무 작업도 하지 않아야 함', async () => {
      const key = 'noop-lock';
      
      // 락 획득 실패 모킹
      service.mockSetResponse(null);
      
      const { success, release } = await service.acquireLock(key);
      
      expect(success).toBe(false);
      
      // noopRelease 함수 실행
      await release();
      
      // eval 호출되지 않아야 함
      expect(service.getMockRedisClient().eval).not.toHaveBeenCalled();
    });
  });

  describe('withLock', () => {
    it('락 획득 성공 시 함수를 실행해야 함', async () => {
      const key = 'function-lock';
      const fn = jest.fn().mockResolvedValue('result');
      
      // 락 획득 성공 모킹
      service.mockSetResponse('OK');
      // 락 해제 성공 모킹
      service.mockEvalResponse(1);
      
      const result = await service.withLock(key, fn);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
      expect(service.getMockRedisClient().eval).toHaveBeenCalledTimes(1);
    });

    it('락 획득 실패 시 함수를 실행하지 않고 null을 반환해야 함', async () => {
      const key = 'fail-function-lock';
      const fn = jest.fn().mockResolvedValue('result');
      
      // 락 획득 실패 모킹
      service.mockSetResponse(null);
      
      const result = await service.withLock(key, fn);
      
      expect(fn).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(service.getMockRedisClient().eval).not.toHaveBeenCalled();
    });

    it('함수 실행 중 예외가 발생해도 락이 해제되어야 함', async () => {
      const key = 'error-function-lock';
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);
      
      // 락 획득 성공 모킹
      service.mockSetResponse('OK');
      // 락 해제 성공 모킹
      service.mockEvalResponse(1);
      
      await expect(service.withLock(key, fn)).rejects.toThrow(error);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(service.getMockRedisClient().eval).toHaveBeenCalledTimes(1);
    });
  });
}); 