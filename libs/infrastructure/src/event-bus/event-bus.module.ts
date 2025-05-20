import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EVENT_BUS } from './index';
import { eventBusProvider } from './provider/event-bus.provider';

/**
 * 이벤트 버스 모듈
 * 
 * 마이크로서비스 간 비동기 통신을 위한 이벤트 기반 메시징 시스템을 제공합니다.
 * 단일 서버 환경에서는 인메모리 구현체를, 분산 환경에서는 Redis 기반 구현체를
 * 사용할 수 있도록 동적 모듈 패턴을 제공합니다.
 * 
 * 이 모듈은 클린 아키텍처 원칙에 따라 도메인 이벤트의 전파와 구독을 추상화하여
 * 시스템 컴포넌트 간의 결합도를 낮춥니다.
 */
@Module({})
export class EventBusModule {
  /**
   * 인메모리 이벤트 버스를 등록합니다.
   * 
   * 단일 서버 환경이나 개발/테스트 환경에서 사용합니다.
   * 메모리 내에서 이벤트를 처리하므로 서버 재시작 시 이벤트가 유실됩니다.
   * 
   * @returns 인메모리 이벤트 버스 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     EventBusModule.registerInMemory(),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static registerInMemory(): DynamicModule {
    return {
      module: EventBusModule,
      providers: [
        {
          provide: 'EVENT_BUS_TYPE',
          useValue: 'in-memory',
        },
        eventBusProvider,
      ],
      exports: [EVENT_BUS],
      global: true,
    };
  }

  /**
   * Redis 기반 이벤트 버스를 등록합니다.
   * 
   * 분산 환경에서 여러 서비스 인스턴스 간 이벤트를 동기화할 때 사용합니다.
   * Redis의 Pub/Sub 기능을 활용해 이벤트를 분산합니다.
   * 
   * @param options - Redis 연결 옵션 (선택적)
   * @returns Redis 이벤트 버스 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     EventBusModule.registerRedis({
   *       host: 'localhost',
   *       port: 6379,
   *       prefix: 'app:events',
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static registerRedis(options?: {
    host?: string;
    port?: number;
    password?: string;
    prefix?: string;
  }): DynamicModule {
    return {
      module: EventBusModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'EVENT_BUS_TYPE',
          useValue: 'redis',
        },
        {
          provide: 'EVENT_BUS_OPTIONS',
          useValue: options || {},
        },
        eventBusProvider,
      ],
      exports: [EVENT_BUS],
      global: true,
    };
  }

  /**
   * 환경에 따라 적절한 이벤트 버스를 등록합니다.
   * 
   * NODE_ENV 환경변수에 따라 적절한 이벤트 버스 구현체를 선택합니다:
   * - production: Redis 기반 이벤트 버스
   * - 그 외: 인메모리 이벤트 버스
   * 
   * @returns 환경에 적합한 이벤트 버스 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     EventBusModule.register(),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static register(options?: {
    host?: string;
    port?: number;
    password?: string;
    prefix?: string;
  }): DynamicModule {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction 
      ? this.registerRedis(options)
      : this.registerInMemory();
  }
} 