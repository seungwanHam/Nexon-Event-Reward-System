import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule as LibAuthModule } from '../../../libs/auth/src/index';
import { CacheModule } from '@app/libs/infrastructure/cache';
import { LockModule } from '@app/libs/infrastructure/lock-manager';
import { LoggerModule } from '@app/libs/infrastructure/logger';
import { LockType } from '@app/libs/common/enum';
import { MongoModule, MongoSchemaModule } from '@app/libs/infrastructure/database';
import * as path from 'path';

// Controllers
import { AuthHttpController, AuthGrpcController, HealthController } from '@app/auth/presentation/controller';

// Facades
import { AuthFacade } from '@app/auth/application/facade/auth.facade';

// Services
import { AuthService, UserService } from '@app/auth/domain/service';

// Infrastructure
import { UserRepositoryImpl, TokenBlacklistRepositoryImpl } from '@app/auth/infrastructure/repository';

// Repository Providers
import { USER_REPOSITORY, TOKEN_BLACKLIST_REPOSITORY } from '@app/auth/domain/repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
        path.resolve(process.cwd(), '.env'),
      ],
    }),

    MongoModule.forRoot({
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexon-event-system',
      debug: process.env.NODE_ENV === 'development',
    }),

    LibAuthModule.register({
      accessTokenSecret: process.env.JWT_ACCESS_SECRET,
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '5m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    }),
    // 로거 모듈
    LoggerModule,

    // 데이터베이스 설정 (인프라 계층 사용)
    MongoSchemaModule.forUser(),

    // 캐시 설정 (Redis)
    CacheModule.register({
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
  controllers: [AuthHttpController, AuthGrpcController, HealthController],
  providers: [
    AuthFacade,
    AuthService,
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
    {
      provide: TOKEN_BLACKLIST_REPOSITORY,
      useClass: TokenBlacklistRepositoryImpl,
    },
  ],
  exports: [AuthFacade],
})
export class AuthModule { } 