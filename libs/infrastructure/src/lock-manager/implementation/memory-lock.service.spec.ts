import { Test, TestingModule } from '@nestjs/testing';
import { MemoryLockService } from './memory-lock.service';

describe('MemoryLockService', () => {
  let service: MemoryLockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryLockService,
      ],
    }).compile();

    service = module.get<MemoryLockService>(MemoryLockService);
  });

  describe('acquireLock', () => {
    it('락을 획득할 수 있어야 함', async () => {
      const key = 'test-lock';
      
      const { success, release } = await service.acquireLock(key);
      
      expect(success).toBe(true);
      expect(typeof release).toBe('function');
    });

    it('이미 획득된 락은 획득할 수 없어야 함', async () => {
      const key = 'test-lock';
      
      // 첫 번째 락 획득
      const firstLock = await service.acquireLock(key);
      expect(firstLock.success).toBe(true);
      
      // 두 번째 락 획득 시도 (실패해야 함)
      const secondLock = await service.acquireLock(key);
      expect(secondLock.success).toBe(false);
    });

    it('락 해제 후 다시 획득할 수 있어야 함', async () => {
      const key = 'test-lock';
      
      // 첫 번째 락 획득
      const firstLock = await service.acquireLock(key);
      expect(firstLock.success).toBe(true);
      
      // 락 해제
      await firstLock.release();
      
      // 두 번째 락 획득 시도 (성공해야 함)
      const secondLock = await service.acquireLock(key);
      expect(secondLock.success).toBe(true);
    });

    it('TTL이 지난 후 락이 자동으로 해제되어야 함', async () => {
      const key = 'ttl-lock';
      
      // 락을 1초 TTL로 획득
      const options = { lockTTL: 1 };
      const firstLock = await service.acquireLock(key, options);
      expect(firstLock.success).toBe(true);
      
      // 1.1초 대기
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // TTL이 지난 후 다시 락 획득 시도 (성공해야 함)
      const secondLock = await service.acquireLock(key);
      expect(secondLock.success).toBe(true);
    });
  });

  describe('withLock', () => {
    it('락 획득 후 함수를 실행해야 함', async () => {
      const key = 'test-function-lock';
      const fn = jest.fn().mockResolvedValue('result');
      
      const result = await service.withLock(key, fn);
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('락 획득 실패 시 함수를 실행하지 않고 null을 반환해야 함', async () => {
      const key = 'test-function-lock';
      const fn = jest.fn().mockResolvedValue('result');
      
      // 첫 번째 락 획득
      const firstLock = await service.acquireLock(key);
      expect(firstLock.success).toBe(true);
      
      // 두 번째 락으로 함수 실행 시도 (실패해야 함)
      const result = await service.withLock(key, fn);
      
      expect(fn).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('함수 실행 후 락이 해제되어야 함', async () => {
      const key = 'test-release-lock';
      const fn = jest.fn().mockResolvedValue('result');
      
      // 함수 실행으로 락 획득 및 실행
      await service.withLock(key, fn);
      
      // 락이 해제되어 다시 획득할 수 있어야 함
      const secondLock = await service.acquireLock(key);
      expect(secondLock.success).toBe(true);
    });

    it('함수 실행 중 예외가 발생해도 락이 해제되어야 함', async () => {
      const key = 'test-error-lock';
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);
      
      // 함수 실행으로 락 획득 및 실행 (에러 발생)
      await expect(service.withLock(key, fn)).rejects.toThrow(error);
      
      // 락이 해제되어 다시 획득할 수 있어야 함
      const secondLock = await service.acquireLock(key);
      expect(secondLock.success).toBe(true);
    });
  });
}); 