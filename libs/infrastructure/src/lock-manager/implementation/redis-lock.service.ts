import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ICacheService, CACHE_SERVICE } from '../../cache';
import Redis from 'ioredis';

import { LockService } from '../lock.service';
import { LockOptions } from '../interface';

/**
 * Redis 기반 분산 락 구현체
 */
@Injectable()
export class RedisLockService extends LockService implements OnModuleInit {
  private redisClient: Redis;
  private readonly lockPrefix = 'lock:';
  private readonly defaultTTL = 30000; // 기본 락 타임아웃 30초
  private readonly retryCount = 3;     // 기본 재시도 횟수
  private readonly retryDelay = 100;   // 기본 재시도 간격 (ms)

  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {
    super();
  }

  /**
   * 모듈 초기화 시 Redis 클라이언트를 설정합니다.
   */
  async onModuleInit() {
    try {
      console.log('[RedisLock] Initializing Redis client');

      // 환경 변수에서 Redis 설정 가져오기
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = parseInt(process.env.REDIS_PORT, 10) || 6379;
      const redisPassword = process.env.REDIS_PASSWORD || 'redis-password';

      // 직접 Redis 클라이언트 생성
      this.redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        retryStrategy: (times) => {
          const delay = Math.min(times * 100, 3000);
          console.log(`[RedisLock] Retrying connection (${times}) in ${delay}ms`);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      // 연결 테스트
      await this.redisClient.ping();
      console.log(`[RedisLock] Successfully connected to Redis at ${redisHost}:${redisPort}`);
    } catch (error) {
      console.error(`[RedisLock] Error initializing Redis client: ${error.message}`);
      console.error(error);
    }
  }

  /**
   * 지정된 키에 대한 락을 획득합니다.
   * 락을 획득하지 못한 경우 false를 반환합니다.
   */
  override async acquire(key: string, options: LockOptions): Promise<boolean> {
    const lockKey = this.getLockKey(key);
    const retryCount = options.retryCount || this.retryCount;
    const retryDelay = options.retryDelay || this.retryDelay;
    const lockTTL = options.lockTTL || this.defaultTTL;

    for (let i = 0; i < retryCount; i++) {
      const acquired = await this.tryAcquire(lockKey, lockTTL);
      if (acquired) return true;

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    return false;
  }

  /**
   * 지정된 키에 대한 락을 해제합니다.
   */
  override async release(key: string): Promise<boolean> {
    // Redis 클라이언트가 없는 경우
    if (!this.redisClient) {
      console.error('[RedisLock] Redis client is not initialized');
      return false;
    }

    try {
      const lockKey = this.getLockKey(key);
      await this.redisClient.del(lockKey);
      console.log(`Lock released: ${lockKey}`);
      return true;
    } catch (error) {
      console.error(`락 해제 실패: ${error.message}`);
      return false;
    }
  }

  /**
   * 락 키 생성 헬퍼 메소드
   */
  private getLockKey(key: string): string {
    return `${this.lockPrefix}${key}`;
  }

  private async tryAcquire(key: string, ttl: number): Promise<boolean> {
    const result = await this.cacheService.set(key, 'locked', ttl);
    return result !== null;
  }
} 