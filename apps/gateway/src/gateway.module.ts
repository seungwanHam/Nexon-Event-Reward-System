import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

// 공통 모듈
import { HttpModule } from '@app/libs/infrastructure/http';
import { LoggerModule } from '@app/libs/infrastructure/logger';
import { AUTH_GRPC_CLIENT, EVENT_GRPC_CLIENT } from '@app/libs/infrastructure/grpc/constants';

// Facades
import { ProxyFacade, AuthFacade, EventFacade } from './application/facade'

// Services
import { ProxyService, AuthService, EventService } from './domain/service'

// Controllers
import { GatewayController } from './presentation/controller/gateway.controller';
import { HealthController } from './presentation/controller/health.controller';

@Module({
  imports: [
    // 공통 모듈
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    HttpModule,

    // gRPC 클라이언트
    ClientsModule.registerAsync([
      {
        name: AUTH_GRPC_CLIENT,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: join(process.cwd(), 'proto/auth.proto'),
            url: `${configService.get('AUTH_SERVICE_HOST') || 'localhost'}:${configService.get('AUTH_SERVICE_PORT') || 5002}`,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: EVENT_GRPC_CLIENT,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'event',
            protoPath: join(process.cwd(), 'proto/event.proto'),
            url: `${configService.get('EVENT_SERVICE_HOST') || 'localhost'}:${configService.get('EVENT_SERVICE_PORT') || 5003}`,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    GatewayController,
    HealthController,
  ],
  providers: [
    // Facades
    ProxyFacade,
    AuthFacade,
    EventFacade,

    // Services
    AuthService,
    EventService,
    ProxyService,
  ],
})
export class GatewayModule { } 