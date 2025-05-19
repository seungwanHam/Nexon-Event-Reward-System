import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { authGrpcClientProvider, eventGrpcClientProvider, grpcOptionsProvider } from './providers';
import { AUTH_GRPC_CLIENT, EVENT_GRPC_CLIENT } from './constants';

@Module({})
export class GrpcModule {
  /**
   * Auth 서비스 gRPC 클라이언트를 등록합니다.
   */
  static registerAuthClient(): DynamicModule {
    return {
      module: GrpcModule,
      imports: [ConfigModule],
      providers: [
        grpcOptionsProvider,
        authGrpcClientProvider,
      ],
      exports: [
        AUTH_GRPC_CLIENT,
      ],
    };
  }
  
  /**
   * Event 서비스 gRPC 클라이언트를 등록합니다.
   */
  static registerEventClient(): DynamicModule {
    return {
      module: GrpcModule,
      imports: [ConfigModule],
      providers: [
        grpcOptionsProvider,
        eventGrpcClientProvider,
      ],
      exports: [
        EVENT_GRPC_CLIENT,
      ],
    };
  }
  
  /**
   * 모든 gRPC 클라이언트를 등록합니다.
   */
  static registerAll(): DynamicModule {
    return {
      module: GrpcModule,
      imports: [ConfigModule],
      providers: [
        grpcOptionsProvider,
        authGrpcClientProvider,
        eventGrpcClientProvider,
      ],
      exports: [
        AUTH_GRPC_CLIENT,
        EVENT_GRPC_CLIENT,
      ],
    };
  }
} 