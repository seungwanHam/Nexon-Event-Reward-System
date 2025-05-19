import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisCacheService } from './implementation/redis/redis-cache.service';
import { MemoryCacheService } from './implementation/memory/memory-cache.service';
import { CACHE_SERVICE } from './interface/cache.constants';
import { CacheConfigOptions } from './interface/cache-config-options.interface';
import { WinstonLoggerService } from '../logger/winston-logger.service';
import { LoggerModule } from '../logger/logger.module';

@Module({})
export class CacheModule {
  static register(options: CacheConfigOptions): DynamicModule {
    const cacheProvider = {
      provide: CACHE_SERVICE,
      useFactory: (configService: ConfigService, logger: WinstonLoggerService) => {
        const cacheType = options.type;
        
        switch (cacheType) {
          case 'redis':
            return new RedisCacheService(
              {
                host: options.host || process.env.REDIS_HOST || 'localhost',
                port: options.port || parseInt(process.env.REDIS_PORT, 10) || 6380,
                password: options.password || process.env.REDIS_PASSWORD || 'redis-password',
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
      module: CacheModule,
      imports: [ConfigModule, LoggerModule],
      providers: [cacheProvider],
      exports: [CACHE_SERVICE],
    };
  }
} 