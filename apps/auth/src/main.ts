import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as path from 'path';
import { AuthModule } from './auth.module';
import { createLogger, setTempLoggerFactory } from '@app/libs/common/logger';
import { WinstonLoggerFactory } from '@app/libs/infrastructure/logger';
import { HttpInterceptor, GrpcInterceptor } from '@app/libs/infrastructure/interceptor';

/**
 * Auth 마이크로서비스 부트스트랩 함수
 */
async function bootstrap() {
  try {
    // 임시 로거 설정
    const tempFactory = new WinstonLoggerFactory();
    setTempLoggerFactory(tempFactory);
    const logger = createLogger('AuthService');

    // NestJS 애플리케이션 생성
    const app = await NestFactory.create(AuthModule);
    const configService = app.get(ConfigService);

    // HTTP API 서버 설정 (개발 환경에서만 활성화)
    const httpPort = parseInt(process.env.AUTH_HTTP_PORT, 10) || 3002;
    const grpcPort = parseInt(process.env.AUTH_MICROSERVICE_PORT, 10) || 5002;
    const protoPath = path.join(__dirname, '../../../proto/auth.proto');

    // gRPC 마이크로서비스 설정
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath,
        url: `0.0.0.0:${grpcPort}`,
      }
    });

    // 글로벌 파이프 설정
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // CORS 설정 (개발 환경에서만 모든 도메인 허용)
    if (process.env.NODE_ENV !== 'production') {
      app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
      });
    }

    // 인터셉터 설정
    app.useGlobalInterceptors(
      new HttpInterceptor(),
      new GrpcInterceptor()
    );

    // 마이크로서비스 시작
    await app.startAllMicroservices();
    logger.log(`Auth Microservice is running on port ${grpcPort} (gRPC)`);

    // HTTP API 서버 시작 (개발 환경에서)
    await app.listen(httpPort);
    logger.log(`Auth HTTP API is running on port ${httpPort} (HTTP)`);
  } catch (error) {
    console.error('Failed to start Auth service:', error);
    process.exit(1);
  }
}

// 애플리케이션 시작
bootstrap(); 