import { DynamicModule, Module } from '@nestjs/common';
import { LockType } from '../../../common/src/enum';
import { LockManagerOptions } from './interface';
import { createLockServiceProvider } from './provider';
import { CacheModule } from '../cache';

/**
 * 분산 락 관리를 위한 모듈
 * 
 * 여러 서비스 인스턴스 간 리소스 동기화를 위한 분산 락 메커니즘을 제공합니다.
 * Redis, MongoDB 등 다양한 백엔드 구현체를 지원하며, 모듈 설정을 통해
 * 적절한 구현체를 선택할 수 있습니다.
 */
@Module({})
export class LockModule {
  /**
   * 락 모듈을 등록합니다.
   * 
   * @param options - 락 매니저 설정 옵션 (호스트, 포트, 비밀번호 등)
   * @param type - 락 구현체 타입 (기본값: Redis)
   * @returns 동적 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     LockModule.register({
   *       host: 'localhost',
   *       port: 6379,
   *       retryCount: 3,
   *       retryDelay: 200,
   *       lockTTL: 30000,
   *     }, LockType.REDIS),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static register(options: LockManagerOptions, type: LockType = LockType.REDIS): DynamicModule {
    // 락 서비스 프로바이더 생성
    const lockServiceProviders = createLockServiceProvider('LOCK_SERVICE', type, options);

    // 기본 옵션 설정
    const defaultOptions = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: options.password || process.env.REDIS_PASSWORD,
      retryCount: options.retryCount || 3,
      retryDelay: options.retryDelay || 200,
      lockTTL: options.lockTTL || 30000,
    };

    return {
      module: LockModule,
      imports: [
        // 캐시 모듈 추가 (RedisLockService는 CacheManager를 주입받음)
        CacheModule.register({
          type: 'redis',
          host: defaultOptions.host,
          port: defaultOptions.port,
          password: defaultOptions.password,
        }),
      ],
      providers: [
        ...lockServiceProviders,
      ],
      exports: ['LOCK_SERVICE'],
      global: true,
    };
  }

  /**
   * 테스트 환경을 위한 락 모듈을 등록합니다.
   * 
   * @returns 테스트용 동적 모듈
   */
  static forTest(): DynamicModule {
    return this.register({
      host: 'localhost',
      port: 6379,
      retryCount: 1,
      retryDelay: 50,
      lockTTL: 5000,
    }, LockType.MEMORY);
  }
} 