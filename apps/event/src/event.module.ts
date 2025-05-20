import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

// 공통 라이브러리
import { AuthModule } from '@app/libs/auth';
import { CacheModule } from '@app/libs/infrastructure/cache';
import { LockModule } from '@app/libs/infrastructure/lock-manager';
import { LoggerModule } from '@app/libs/infrastructure/logger';
import { LockType } from '@app/libs/common/enum';
import { MongoModule, MongoSchemaModule } from '@app/libs/infrastructure/database';

// 프레젠테이션 계층 - 컨트롤러
import {
  EventController,
  RewardController,
  ClaimController,
  HealthController,
  UserEventController
} from './presentation/controller';

// 애플리케이션 계층 - 파사드
import { EventFacade } from './application/facade';

// 도메인 계층 - 서비스
import {
  EventService,
  RewardService,
  ClaimService,
  EventValidatorService,
  LoginEventValidator,
  InviteEventValidator,
  UserEventService
} from './domain/service';

// 도메인 계층 - 리포지토리 인터페이스
import {
  EVENT_REPOSITORY,
  REWARD_REPOSITORY,
  REWARD_CLAIM_REPOSITORY,
  USER_EVENT_REPOSITORY
} from './domain/repository';

// 도메인 계층 - 규칙 엔진 인터페이스
import { RULE_ENGINE } from './domain/service/rule-engine.interface';

// 인프라 계층 - 리포지토리 구현체
import {
  EventRepositoryImpl,
  RewardRepositoryImpl,
  RewardClaimRepositoryImpl
} from './infrastructure/repository';
import { UserEventRepositoryImpl } from './infrastructure/repository/user-event.repository.impl';

// 인프라 계층 - 규칙 엔진 구현체
import { RuleEngineImpl } from './engine/rule-engine.impl';

/**
 * Event 모듈
 * 
 * 이벤트 관리, 보상 관리, 청구 관리, 사용자 행동 이벤트 기록 기능을 제공하는 마이크로서비스입니다.
 * 
 * - 프레젠테이션 계층: 컨트롤러와 DTO (외부 요청 처리)
 * - 애플리케이션 계층: 파사드 (다른 서비스와 통신)
 * - 도메인 계층: 엔티티, 서비스, 리포지토리 인터페이스 (비즈니스 로직)
 * - 인프라 계층: 리포지토리 구현체, 스키마, 규칙 엔진 (외부 의존성)
 */
@Module({
  imports: [
    // 환경 설정 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
        path.resolve(process.cwd(), '.env'),
      ],
    }),

    // 데이터베이스 모듈
    MongoModule.forRoot({
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexon-event-system',
      debug: process.env.NODE_ENV === 'development',
    }),
    MongoSchemaModule.forEvent(),

    // 공통 인프라 모듈
    LoggerModule,
    AuthModule.register({
      accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'nexon-access-secret',
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'nexon-refresh-secret',
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    }),

    // 캐시 모듈 (Redis)
    CacheModule.register({
      type: 'redis',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD,
      ttl: 60,
    }),

    // 분산 락 모듈 (Redis)
    LockModule.register({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD,
      lockTTL: 30,
      retryCount: 5,
      retryDelay: 200,
    }, LockType.REDIS),
  ],
  controllers: [
    // 프레젠테이션 계층 - 컨트롤러
    EventController,
    RewardController,
    ClaimController,
    HealthController,
    UserEventController
  ],
  providers: [
    // 애플리케이션 계층 - 파사드
    EventFacade,
    
    // 도메인 계층 - 서비스
    EventService,
    RewardService,
    ClaimService,
    EventValidatorService,
    LoginEventValidator,
    InviteEventValidator,
    UserEventService,
    
    // 도메인 계층 - 규칙 엔진 프로바이더
    {
      provide: RULE_ENGINE,
      useClass: RuleEngineImpl,
    },

    // 인프라 계층 - 리포지토리 프로바이더
    {
      provide: EVENT_REPOSITORY,
      useClass: EventRepositoryImpl,
    },
    {
      provide: REWARD_REPOSITORY,
      useClass: RewardRepositoryImpl,
    },
    {
      provide: REWARD_CLAIM_REPOSITORY,
      useClass: RewardClaimRepositoryImpl,
    },
    {
      provide: USER_EVENT_REPOSITORY,
      useClass: UserEventRepositoryImpl,
    }
  ],
  exports: [
    // 다른 모듈에서 사용할 수 있도록 내보내는 서비스
    EventFacade,
    UserEventService
  ],
})
export class EventModule {} 