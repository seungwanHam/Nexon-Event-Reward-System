import { DynamicModule, Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { CacheConfigOptions } from '@app/libs/infrastructure/cache/interface';
import { CacheService } from '@app/libs/infrastructure/cache/cache.service';

@Module({})
export class CacheModule {
  static register(options: CacheConfigOptions = {}): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        NestCacheModule.register({
          store: redisStore,
          host: options.host || process.env.REDIS_HOST || 'localhost',
          port: options.port || parseInt(process.env.REDIS_PORT, 10) || 6379,
          password: options.password || process.env.REDIS_PASSWORD,
          ttl: options.ttl || parseInt(process.env.REDIS_TTL, 10) || 60, // 기본 TTL: 60초
          max: options.max || parseInt(process.env.REDIS_MAX_ITEMS, 10) || 100, // 최대 항목 수
        }),
      ],
      providers: [CacheService],
      exports: [CacheService, NestCacheModule],
    };
  }
} 