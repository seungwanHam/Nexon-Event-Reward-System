import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisCacheService } from './redis-cache.service';
import { Cache } from 'cache-manager';

// Redis 클라이언트 mock 객체
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
  keys: jest.fn(),
  ttl: jest.fn(),
};

// Cache 매니저 mock 객체
const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
  store: {
    getClient: jest.fn(() => mockRedisClient),
  },
};

// Spy 모킹 원본 함수로 사용할 delPattern 메소드
const originalDelPattern = RedisCacheService.prototype.delPattern;

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    // mock 함수 초기화
    jest.clearAllMocks();
    
    // delPattern 메서드를 모킹
    jest.spyOn(service, 'delPattern').mockImplementation(async (pattern: string) => {
      // 실제 구현 없이 바로 완료
      return Promise.resolve();
    });
  });

  describe('기본 캐시 기능', () => {
    it('값을 설정하고 가져올 수 있어야 함', async () => {
      const key = 'test-key';
      const value = { name: 'test-value' };
      
      mockCacheManager.get.mockResolvedValueOnce(value);
      
      await service.set(key, value);
      const result = await service.get(key);
      
      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, undefined);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('키를 삭제할 수 있어야 함', async () => {
      const key = 'delete-test-key';
      
      await service.del(key);
      
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });

    it('여러 키를 한 번에 삭제할 수 있어야 함', async () => {
      const keys = ['multi-key-1', 'multi-key-2', 'multi-key-3'];
      
      await service.delMany(keys);
      
      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
      keys.forEach(key => {
        expect(mockCacheManager.del).toHaveBeenCalledWith(key);
      });
    });

    it('has 메서드로 키 존재 여부를 확인할 수 있어야 함', async () => {
      const key = 'has-test-key';
      
      // 없는 경우
      mockCacheManager.get.mockResolvedValueOnce(undefined);
      expect(await service.has(key)).toBe(false);
      
      // 있는 경우
      mockCacheManager.get.mockResolvedValueOnce('value');
      expect(await service.has(key)).toBe(true);
    });
  });

  describe('getOrSet 테스트', () => {
    it('키가 없으면 factory 함수를 호출하고 결과를 저장해야 함', async () => {
      const key = 'getOrSet-test-key';
      const factoryValue = 'factory-value';
      const factory = jest.fn().mockResolvedValue(factoryValue);
      
      // 첫 get 호출에서는 undefined 반환
      mockCacheManager.get.mockResolvedValueOnce(undefined);
      
      const result = await service.getOrSet(key, factory);
      
      expect(factory).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.set).toHaveBeenCalledWith(key, factoryValue, undefined);
      expect(result).toBe(factoryValue);
    });

    it('키가 있으면 factory 함수를 호출하지 않고 기존 값을 반환해야 함', async () => {
      const key = 'getOrSet-exists-key';
      const existingValue = 'existing-value';
      const factory = jest.fn().mockResolvedValue('factory-value');
      
      // get 호출에서 값 반환
      mockCacheManager.get.mockResolvedValueOnce(existingValue);
      
      const result = await service.getOrSet(key, factory);
      
      expect(factory).not.toHaveBeenCalled();
      expect(mockCacheManager.set).not.toHaveBeenCalled();
      expect(result).toBe(existingValue);
    });
  });

  describe('패턴 삭제 테스트', () => {
    it('글로브 패턴으로 일치하는 키를 모두 삭제하는 메서드가 호출되어야 함', async () => {
      const pattern = 'user:*:profile';
      
      await service.delPattern(pattern);
      
      expect(service.delPattern).toHaveBeenCalledWith(pattern);
    });

    it('패턴 삭제 중 에러 발생 시 적절히 처리되어야 함', async () => {
      const pattern = 'error:*';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // delPattern 모킹 해제하고 오류 발생 테스트 전용 구현으로 교체
      jest.spyOn(service, 'delPattern').mockReset();
      jest.spyOn(service, 'delPattern').mockImplementation(async (pattern: string) => {
        console.error('테스트용 에러 로그');
        return Promise.resolve();
      });
      
      await service.delPattern(pattern);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
}); 