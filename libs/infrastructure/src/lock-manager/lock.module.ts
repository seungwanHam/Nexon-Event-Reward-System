import { DynamicModule, Module } from '@nestjs/common';
import { LockType } from '@app/libs/common/enum';
import { LockManagerOptions } from '@app/libs/infrastructure/lock-manager/interface';
import { createLockServiceProvider } from '@app/libs/infrastructure/lock-manager/provider';
import { CacheModule } from '@app/libs/infrastructure/cache';

@Module({})
export class LockModule {
  /**
   * 락 모듈 등록
   * 
   * @param options 락 설정 옵션
   * @param type 락 타입
   * @returns 동적 모듈
   */
  static register(options: LockManagerOptions, type: LockType = LockType.REDIS): DynamicModule {
    // 락 서비스 프로바이더 생성
    const lockServiceProviders = createLockServiceProvider('LOCK_SERVICE', type, options);

    return {
      module: LockModule,
      imports: [
        // 캐시 모듈 추가 (RedisLockService는 CacheManager를 주입받음)
        CacheModule.register({
          type: 'redis',
          host: options.host || process.env.REDIS_HOST || 'localhost',
          port: options.port || parseInt(process.env.REDIS_PORT, 10) || 6379,
          password: options.password || process.env.REDIS_PASSWORD,
        }),
      ],
      providers: [
        ...lockServiceProviders,
      ],
      exports: ['LOCK_SERVICE'],
      global: true,
    };
  }
} 