import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisCacheService } from './implementation/redis/redis-cache.service';
import { MemoryCacheService } from './implementation/memory/memory-cache.service';
import { CACHE_SERVICE } from './interface/cache.constants';
import { CacheConfigOptions } from './interface/cache-config-options.interface';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import { LoggerModule } from '../logger/logger.module';

/**
 * 애플리케이션 전체에서 사용되는 캐싱 기능을 제공하는 모듈
 * 
 * 다양한 캐시 구현체(Redis, 메모리 등)를 지원하며,
 * 동적 모듈 패턴을 사용하여 환경에 맞는 캐시 서비스를 주입합니다.
 */
@Module({})
export class CacheModule {
  /**
   * 설정 옵션에 따라 캐시 모듈을 등록합니다.
   * 
   * @param options - 캐시 구성 옵션
   * @returns 동적 모듈 설정
   * 
   * @example
   * ```typescript
   * // Redis 캐시 사용
   * imports: [
   *   CacheModule.register({
   *     type: 'redis',
   *     host: 'localhost',
   *     port: 6379,
   *     ttl: 3600,
   *   }),
   * ]
   * 
   * // 메모리 캐시 사용
   * imports: [
   *   CacheModule.register({
   *     type: 'memory',
   *     ttl: 300,
   *   }),
   * ]
   * ```
   */
  static register(options: CacheConfigOptions): DynamicModule {
    const cacheProvider = {
      provide: CACHE_SERVICE,
      useFactory: (configService: ConfigService, logger: WinstonLoggerService) => {
        const cacheType = options.type || 'memory';

        switch (cacheType) {
          case 'redis':
            return new RedisCacheService(
              {
                host: options.host || process.env.REDIS_HOST || 'localhost',
                port: options.port || parseInt(process.env.REDIS_PORT, 10) || 6379,
                password: options.password || process.env.REDIS_PASSWORD,
                db: options.db || 0,
                connectTimeout: options.timeout || 5000,
              },
              logger
            );
          case 'memory':
          default:
            return new MemoryCacheService();
        }
      },
      inject: [ConfigService, WinstonLoggerService],
    };

    return {
      global: options.isGlobal === undefined ? true : options.isGlobal,
      module: CacheModule,
      imports: [ConfigModule, LoggerModule],
      providers: [cacheProvider],
      exports: [CACHE_SERVICE],
    };
  }
} 