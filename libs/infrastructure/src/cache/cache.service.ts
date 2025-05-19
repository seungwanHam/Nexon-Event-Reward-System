import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ICacheService } from './interface/cache.interface';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements ICacheService, OnModuleInit {
  private redisClient: Redis;

  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
  ) {}

  /**
   * 모듈 초기화 시 Redis 클라이언트를 설정합니다.
   */
  async onModuleInit() {
    try {
      console.log('[CacheService] Initializing Redis client');
      
      // 환경 변수에서 Redis 설정 가져오기
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT, 10) || 6379;
      const redisPassword = process.env.REDIS_PASSWORD || undefined;
      
      // 직접 Redis 클라이언트 생성
      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
      });
      
      // 연결 테스트
      await this.redisClient.ping();
      console.log(`[CacheService] Successfully connected to Redis at ${redisHost}:${redisPort}`);
    } catch (error) {
      console.error(`[CacheService] Error initializing Redis client: ${error.message}`);
      console.error(error);
    }
  }

  /**
   * 캐시에서 값을 가져옵니다.
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * 값을 캐시에 저장합니다.
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * 키를 캐시에서 삭제합니다.
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * 여러 키를 캐시에서 삭제합니다.
   */
  async delMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }

  /**
   * 캐시에서 특정 패턴의 모든 키를 삭제합니다.
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // Redis 클라이언트 확인
      if (!this.redisClient) {
        console.error('[CacheService] Redis client is not initialized for pattern deletion');
        return;
      }
      
      // Redis SCAN 명령어 사용
      let cursor = '0';
      let totalDeleted = 0;
      
      do {
        const result = await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
        cursor = result[0];
        const keys = result[1];
        
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== '0');
      
      console.log(`[CacheService] Deleted ${totalDeleted} keys matching pattern: ${pattern}`);
    } catch (error) {
      console.error(`[CacheService] Error in delPattern: ${error.message}`);
    }
  }

  /**
   * 캐시가 특정 키를 가지고 있는지 확인합니다.
   */
  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  /**
   * 캐시에서 값을 가져오거나, 없으면 생성하여 저장합니다.
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const value = await this.get<T>(key);
    if (value !== undefined) {
      return value;
    }

    const newValue = await factory();
    await this.set(key, newValue, ttl);
    return newValue;
  }
} 