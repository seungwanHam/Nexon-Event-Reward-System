import { Test, TestingModule } from '@nestjs/testing';
import { MemoryCacheService } from './memory-cache.service';

describe('MemoryCacheService', () => {
  let service: MemoryCacheService;

  beforeEach(async () => {
    service = new MemoryCacheService();
  });

  afterEach(async () => {
    await service.clear();
  });

  describe('기본 캐시 기능', () => {
    it('값을 설정하고 가져올 수 있어야 함', async () => {
      const key = 'test-key';
      const value = { name: 'test-value' };
      
      await service.set(key, value);
      const result = await service.get(key);
      
      expect(result).toEqual(value);
    });

    it('존재하지 않는 키를 가져오면 undefined를 반환해야 함', async () => {
      const result = await service.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    it('키를 삭제할 수 있어야 함', async () => {
      const key = 'delete-test-key';
      await service.set(key, 'value');
      
      await service.del(key);
      const result = await service.get(key);
      
      expect(result).toBeUndefined();
    });

    it('여러 키를 한 번에 삭제할 수 있어야 함', async () => {
      const keys = ['multi-key-1', 'multi-key-2', 'multi-key-3'];
      
      for (const key of keys) {
        await service.set(key, 'value');
      }
      
      await service.delMany(keys);
      
      for (const key of keys) {
        const result = await service.get(key);
        expect(result).toBeUndefined();
      }
    });

    it('has 메서드로 키 존재 여부를 확인할 수 있어야 함', async () => {
      const key = 'has-test-key';
      
      expect(await service.has(key)).toBe(false);
      
      await service.set(key, 'value');
      
      expect(await service.has(key)).toBe(true);
    });
  });

  describe('TTL 테스트', () => {
    it('TTL이 지나면 값이 만료되어야 함', async () => {
      const key = 'ttl-test-key';
      
      // 값을 1초 TTL로 설정
      await service.set(key, 'value', 1);
      
      // 설정 직후에는 값이 있어야 함
      expect(await service.get(key)).toBe('value');
      
      // 1.1초 대기
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // TTL이 지난 후에는 값이 없어야 함
      expect(await service.get(key)).toBeUndefined();
    });
  });

  describe('getOrSet 테스트', () => {
    it('키가 없으면 factory 함수를 호출하고 결과를 저장해야 함', async () => {
      const key = 'getOrSet-test-key';
      const factory = jest.fn().mockResolvedValue('factory-value');
      
      const result = await service.getOrSet(key, factory);
      
      expect(result).toBe('factory-value');
      expect(factory).toHaveBeenCalledTimes(1);
      expect(await service.get(key)).toBe('factory-value');
    });

    it('키가 있으면 factory 함수를 호출하지 않고 기존 값을 반환해야 함', async () => {
      const key = 'getOrSet-exists-key';
      await service.set(key, 'existing-value');
      
      const factory = jest.fn().mockResolvedValue('factory-value');
      
      const result = await service.getOrSet(key, factory);
      
      expect(result).toBe('existing-value');
      expect(factory).not.toHaveBeenCalled();
    });
  });

  describe('패턴 삭제 테스트', () => {
    it('글로브 패턴으로 일치하는 키를 모두 삭제해야 함', async () => {
      // 테스트 데이터 설정
      await service.set('user:1:profile', 'profile1');
      await service.set('user:2:profile', 'profile2');
      await service.set('user:1:settings', 'settings1');
      await service.set('user:2:settings', 'settings2');
      await service.set('post:1', 'post1');
      
      // user:*:profile 패턴으로 삭제
      await service.delPattern('user:*:profile');
      
      // 삭제된 키 확인
      expect(await service.get('user:1:profile')).toBeUndefined();
      expect(await service.get('user:2:profile')).toBeUndefined();
      
      // 삭제되지 않은 키 확인
      expect(await service.get('user:1:settings')).toBe('settings1');
      expect(await service.get('user:2:settings')).toBe('settings2');
      expect(await service.get('post:1')).toBe('post1');
    });
  });

  describe('cleanup 테스트', () => {
    it('만료된 항목을 정리해야 함', async () => {
      // 일부 항목을 짧은 TTL로 설정
      await service.set('expired-key-1', 'value1', 1);
      await service.set('expired-key-2', 'value2', 1);
      await service.set('valid-key', 'value3', 30);
      
      // 1.1초 대기하여 일부 항목이 만료되도록 함
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // cleanup 호출
      await service.cleanup();
      
      // 만료된 항목은 없어야 함
      expect(await service.get('expired-key-1')).toBeUndefined();
      expect(await service.get('expired-key-2')).toBeUndefined();
      
      // 유효한 항목은 여전히 있어야 함
      expect(await service.get('valid-key')).toBe('value3');
    });
  });
}); 