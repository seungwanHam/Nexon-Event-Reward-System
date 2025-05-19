import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';
import { GrpcClient } from '../interfaces';
import { AUTH_GRPC_CLIENT, EVENT_GRPC_CLIENT, EVENT_SERVICE_NAME, GRPC_OPTIONS } from '../constants';
import { AUTH_SERVICE_NAME } from '../proto/auth';

/**
 * 기본 gRPC 클라이언트 구현
 */
export class DefaultGrpcClient implements GrpcClient {
  private client: ClientGrpc;
  private service: any;

  constructor(
    private readonly options: any,
    private readonly serviceName: string
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        url: `${options.host}:${options.port}`,
        package: options.package,
        protoPath: options.protoPath,
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
        ...options.options,
      },
    });

    this.service = this.client.getService(serviceName);
  }

  call<TRequest, TResponse>(
    service: string,
    method: string,
    data: TRequest
  ): Observable<TResponse> {
    if (!this.service[method]) {
      throw new Error(`Method ${method} does not exist on ${service} service`);
    }
    return this.service[method](data);
  }

  async healthCheck(): Promise<boolean> {
    try {
      // 여기서는 간단히 서비스가 있는지만 확인
      return !!this.service;
    } catch (error) {
      return false;
    }
  }

  close(): void {
    // ClientGrpc 인터페이스에 close가 없어 타입 캐스팅 사용
    (this.client as any)?.close?.();
  }
}

/**
 * Auth 서비스 gRPC 클라이언트 프로바이더
 */
export const authGrpcClientProvider: Provider = {
  provide: AUTH_GRPC_CLIENT,
  useFactory: (configService: ConfigService, grpcOptions: any) => {
    const options = grpcOptions.createGrpcOptions(configService, AUTH_SERVICE_NAME);
    return new DefaultGrpcClient(options, options.serviceName);
  },
  inject: [ConfigService, GRPC_OPTIONS],
};

/**
 * Event 서비스 gRPC 클라이언트 프로바이더
 */
export const eventGrpcClientProvider: Provider = {
  provide: EVENT_GRPC_CLIENT,
  useFactory: (configService: ConfigService, grpcOptions: any) => {
    const options = grpcOptions.createGrpcOptions(configService, EVENT_SERVICE_NAME);
    return new DefaultGrpcClient(options, options.serviceName);
  },
  inject: [ConfigService, GRPC_OPTIONS],
}; 