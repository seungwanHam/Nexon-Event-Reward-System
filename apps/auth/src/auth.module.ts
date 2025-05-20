import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule as LibAuthModule } from '../../../libs/auth/src';
import { CacheModule } from '@app/libs/infrastructure/cache';
import { LockModule } from '@app/libs/infrastructure/lock-manager';
import { LoggerModule } from '@app/libs/infrastructure/logger';
import { LockType } from '@app/libs/common/enum';
import { MongoModule, MongoSchemaModule } from '@app/libs/infrastructure/database';
import * as path from 'path';
import { HttpModule } from '@nestjs/axios';

// Controllers
import { AuthHttpController, HealthController } from './presentation/controller';

// Facades
import { AuthFacade } from './application/facade/auth.facade';

// Services
import { AuthService, UserService } from './domain/service';

// Infrastructure
import { UserRepositoryImpl, TokenBlacklistRepositoryImpl } from './infrastructure/repository';

// Repository Providers
import { USER_REPOSITORY, TOKEN_BLACKLIST_REPOSITORY } from './domain/repository';

/**
 * Auth 모듈
 * 
 * 인증 및 사용자 관리를 담당하는 모듈입니다.
 * 사용자 등록, 로그인, 로그아웃, 토큰 갱신 등의 기능을 제공합니다.
 * Event 서비스와 통합하여 사용자 행동(로그인, 회원가입 등)을 이벤트로 기록합니다.
 */
@Module({
  imports: [
    // 설정 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
        path.resolve(process.cwd(), '.env'),
      ],
    }),

    // MongoDB 연결
    MongoModule.forRoot({
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexon-event-system',
      debug: process.env.NODE_ENV === 'development',
    }),

    // 로거 모듈
    LoggerModule,

    // 인증 모듈
    LibAuthModule.register({
      accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'nexon-access-secret',
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'nexon-refresh-secret',
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    }),

    // 데이터베이스 스키마 설정
    MongoSchemaModule.forUser(),

    // HTTP 모듈 (이벤트 서비스 통신용)
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

    // 캐시 설정 (Redis)
    CacheModule.register({
      type: 'redis',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD,
      ttl: 60,
    }),

    // 분산 락 설정 (Redis)
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
    AuthHttpController, 
    HealthController
  ],
  providers: [
    // 파사드
    AuthFacade,
    
    // 서비스
    AuthService,
    UserService,
    
    // 레포지토리 구현체
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
    {
      provide: TOKEN_BLACKLIST_REPOSITORY,
      useClass: TokenBlacklistRepositoryImpl,
    }
  ],
  exports: [AuthFacade],
})
export class AuthModule { }