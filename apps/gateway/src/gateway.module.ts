import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '@app/libs/infrastructure/logger';
import { AuthModule, JwtStrategy, JwtRefreshStrategy } from '../../../libs/auth/src';
import * as path from 'path';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Controllers
import { GatewayController } from './presentation/controller/gateway.controller';
import { HealthController } from './presentation/controller/health.controller';

// Facades
import { AuthFacade } from './application/facade/auth.facade';

// Clients
import { AuthHttpClient } from './infrastructure/client/auth.http.client';

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
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'nexon-refresh-secret',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    }),
  ],
  controllers: [GatewayController, HealthController],
  providers: [
    AuthFacade,
    AuthHttpClient,
    JwtStrategy,
    JwtRefreshStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpErrorInterceptor,
    }
  ],
})
export class GatewayModule { } 