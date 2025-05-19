import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayModule } from './gateway.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

async function bootstrap() {
  try {
    // 로거 설정
    const logger = new WinstonLoggerService();

    // HTTP 서버 생성
    const app = await NestFactory.create(GatewayModule);
    const configService = app.get(ConfigService);

    // 전역 설정
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));

    // CORS 설정
    if (process.env.NODE_ENV !== 'production') {
      app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
      });
    }

    // Swagger 설정
    const config = new DocumentBuilder()
      .setTitle('Nexon Gateway API')
      .setDescription('Nexon 이벤트 보상 시스템 Gateway API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // HTTP 포트 설정
    const httpPort = configService.get<number>('GATEWAY_HTTP_PORT') || 3001;

    // 서버 시작
    await app.listen(httpPort);

    logger.log(`Gateway HTTP API is running on port ${httpPort}`);
    logger.log(`Swagger docs available at http://localhost:${httpPort}/api/docs`);
  } catch (error) {
    console.error('Failed to start Gateway service:', error);
    process.exit(1);
  }
}

bootstrap();
