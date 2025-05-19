import { Provider } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { createCache } from 'cache-manager';
import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';
import Redis from 'ioredis';

import { CacheType } from '@app/libs/common/enum';
import { CacheConfigOptions } from '@app/libs/infrastructure/cache/interface';
import { MemoryCacheService, RedisCacheService } from '@app/libs/infrastructure/cache/implementation';

/**
 * 캐시 타입에 따라 적절한 캐시 서비스 구현체를 생성하는 팩토리 함수
 */
export function createCacheServiceProvider(
  provide: string = 'CACHE_SERVICE',
  type: CacheType = CacheType.REDIS,
  options: CacheConfigOptions
): Provider[] {
  switch (type) {
    case CacheType.REDIS:
      return [
        {
          provide: CACHE_MANAGER,
          useFactory: async () => {
            let redisClient;

            // Redis Sentinel 설정 확인
            const sentinelName = process.env.REDIS_SENTINEL_NAME || options.sentinelName;

            if (sentinelName) {
              // Sentinel 모드 사용
              const sentinelHost = options.host || process.env.REDIS_HOST || 'redis-sentinel';
              const sentinelPort = options.port || parseInt(process.env.REDIS_PORT, 10) || 26379;
              const password = options.password || process.env.REDIS_PASSWORD || 'redis-password';

              console.log(`[Redis] Connecting to Redis Sentinel: ${sentinelHost}:${sentinelPort}, master: ${sentinelName}`);

              // Sentinel 클라이언트 생성
              redisClient = new Redis(Object.assign({
                sentinels: [
                  { host: sentinelHost, port: sentinelPort },
                  { host: sentinelHost, port: sentinelPort + 1 },
                  { host: sentinelHost, port: sentinelPort + 2 }
                ],
                name: sentinelName,
                password: password,
                sentinelPassword: password,
                enableOfflineQueue: true,
                readOnly: false, // 마스터에만 쓰기 작업 수행
                retryStrategy: (times) => {
                  return Math.min(times * 100, 3000); // 최대 3초 지연
                }
              }));

              // 연결 이벤트 처리
              redisClient.on('ready', () => {
                console.log('[Redis] Sentinel connection established');
              });

              redisClient.on('error', (err) => {
                console.error('[Redis] Sentinel connection error:', err);
              });

              redisClient.on('reconnecting', () => {
                console.log('[Redis] Sentinel reconnecting...');
              });

              redisClient.on('end', () => {
                console.log('[Redis] Sentinel connection ended');
              });
            } else {
              // 일반 Redis 연결 문자열 생성
              const redisUri = `redis://${options.password ? options.password + '@' : ''}${options.host || process.env.REDIS_HOST || 'localhost'}:${options.port || parseInt(process.env.REDIS_PORT, 10) || 6379}`;

              // Redis 스토어 생성
              const redisStore = new KeyvRedis(redisUri);

              // Keyv 인스턴스 생성
              const keyv = new Keyv({
                store: redisStore,
                namespace: 'cache',
                ttl: options.ttl ? options.ttl * 1000 : undefined, // 밀리초 단위로 변환
              });

              // cache-manager 생성
              return createCache({
                stores: [keyv]
              });
            }

            // 직접 Redis 클라이언트 설정 후 Keyv에 연결
            const keyv = new Keyv({
              store: {
                get: async (key) => {
                  return await redisClient.get(key);
                },
                set: async (key, value, ttl) => {
                  if (ttl !== undefined) {
                    return await redisClient.set(key, value, 'PX', ttl);
                  }
                  return await redisClient.set(key, value);
                },
                delete: async (key) => {
                  return await redisClient.del(key) === 1;
                },
                clear: async () => {
                  return await redisClient.flushdb();
                },
                has: async (key) => {
                  return await redisClient.exists(key) === 1;
                }
              },
              namespace: 'cache',
              ttl: options.ttl ? options.ttl * 1000 : undefined, // 밀리초 단위로 변환
            });

            // cache-manager 생성
            return createCache({
              stores: [keyv]
            });
          },
        },
        {
          provide,
          useClass: RedisCacheService,
        },
      ];

    case CacheType.MEMORY:
      return [
        {
          provide: CACHE_MANAGER,
          useFactory: async () => {
            // 인메모리 Keyv 인스턴스 생성
            const keyv = new Keyv({
              ttl: options.ttl ? options.ttl * 1000 : undefined, // 밀리초 단위로 변환
              namespace: 'cache',
            });

            // cache-manager 생성
            return createCache({
              stores: [keyv]
            });
          },
        },
        {
          provide,
          useClass: MemoryCacheService,
        },
      ];

    default:
      throw new Error(`Unsupported cache type: ${type}`);
  }
} 