import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayModule } from './gateway.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  try {
    // HTTP 서버 생성
    const app = await NestFactory.create(GatewayModule);
    const configService = app.get(ConfigService);

    // 전역 설정
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    app.enableCors();

    // Swagger 설정
    const config = new DocumentBuilder()
      .setTitle('Nexon Gateway API')
      .setDescription('Nexon 이벤트 보상 시스템 Gateway API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // 포트 설정
    const httpPort = configService.get<number>('GATEWAY_HTTP_PORT') || 3001;
    const grpcPort = configService.get<number>('GATEWAY_GRPC_PORT') || 5001;

    // gRPC 마이크로서비스 설정
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.GRPC,
      options: {
        package: 'gateway',
        protoPath: join(process.cwd(), 'proto/gateway.proto'),
        url: `0.0.0.0:${grpcPort}`,
      },
    });

    // 서버 시작
    await app.startAllMicroservices();
    await app.listen(httpPort);

    console.log(`Gateway HTTP API is running on port ${httpPort}`);
    console.log(`Gateway gRPC service is running on port ${grpcPort}`);
    console.log(`Swagger docs available at http://localhost:${httpPort}/api/docs`);
  } catch (error) {
    console.error('Failed to start Gateway service:', error);
    process.exit(1);
  }
}

bootstrap();
