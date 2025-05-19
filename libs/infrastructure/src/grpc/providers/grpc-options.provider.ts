import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { GrpcOptions } from '../interfaces';
import { EVENT_SERVICE_NAME, GRPC_OPTIONS } from '../constants';
import { AUTH_SERVICE_NAME } from '../proto/auth';

/**
 * gRPC 옵션 팩토리 함수
 */
export const createGrpcOptions = (
  configService: ConfigService,
  serviceName: string,
): GrpcOptions => {
  const baseProtoPath = join(process.cwd(), 'proto');

  // 서비스별 옵션 설정
  switch (serviceName) {
    case AUTH_SERVICE_NAME:
      return {
        host: configService.get<string>('AUTH_SERVICE_HOST') || 'localhost',
        port: configService.get<number>('AUTH_SERVICE_PORT') || 3001,
        package: 'auth',
        protoPath: join(baseProtoPath, 'auth.proto'),
        serviceName: 'AuthService',
        options: {
          'grpc.max_receive_message_length': 1024 * 1024 * 10, // 10MB
        },
      };

    case EVENT_SERVICE_NAME:
      return {
        host: configService.get<string>('EVENT_SERVICE_HOST') || 'localhost',
        port: configService.get<number>('EVENT_SERVICE_PORT') || 3002,
        package: 'event',
        protoPath: join(baseProtoPath, 'event.proto'),
        serviceName: 'EventService',
        options: {
          'grpc.max_receive_message_length': 1024 * 1024 * 10, // 10MB
        },
      };

    default:
      throw new Error(`Unknown gRPC service: ${serviceName}`);
  }
};

/**
 * gRPC 옵션 프로바이더
 */
export const grpcOptionsProvider: Provider = {
  provide: GRPC_OPTIONS,
  useFactory: (configService: ConfigService) => ({
    createGrpcOptions,
  }),
  inject: [ConfigService],
}; 