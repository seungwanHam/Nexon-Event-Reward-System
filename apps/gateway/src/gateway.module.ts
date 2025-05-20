import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@app/libs/infrastructure/logger';
import { AuthModule, JwtStrategy, JwtRefreshStrategy } from '../../../libs/auth/src';
import * as path from 'path';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Controllers
import { AuthController } from './presentation/controller/auth.controller';
import { HealthController } from './presentation/controller/health.controller';
import { EventController } from './presentation/controller/event.controller';
import { ClaimController } from './presentation/controller/claim.controller';
import { RewardController } from './presentation/controller/reward.controller';
import { AuditController } from './presentation/controller/audit.controller';

// Facades
import { AuthFacade } from './application/facade/auth.facade';
import { EventFacade } from './application/facade/event.facade';

// Clients
import { AuthHttpClient } from './infrastructure/client/auth.http.client';
import { EventHttpClient } from './infrastructure/client/event.http.client';

// Interceptors
import { HttpErrorInterceptor } from '@app/libs/infrastructure/interceptor';

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

    // HTTP 모듈
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),

    // 로거 모듈
    LoggerModule,

    // Auth 모듈
    AuthModule.register({
      accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'nexon-access-secret',
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'nexon-refresh-secret',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    }),
  ],
  controllers: [
    AuthController,
    HealthController,
    EventController,
    ClaimController,
    RewardController,
    AuditController
  ],
  providers: [
    // Facade
    AuthFacade,
    EventFacade,

    // HTTP Clients
    AuthHttpClient,
    EventHttpClient,

    // Auth
    JwtStrategy,
    JwtRefreshStrategy,

    // Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpErrorInterceptor,
    }
  ],
})
export class GatewayModule { } 