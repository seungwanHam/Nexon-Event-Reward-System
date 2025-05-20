import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayModule } from './gateway.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

/**
 * 애플리케이션 부트스트래핑 함수
 * NestJS 애플리케이션을 초기화하고 필요한 미들웨어와 인터셉터를 설정합니다.
 */
async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // 로거 서비스 초기화
  const logger = app.get(WinstonLoggerService);
  logger.setContext('Gateway');

  // CORS 설정
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 전역 접두사 설정
  app.setGlobalPrefix('api/v1');

  // 전역 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger 문서 설정
  const config = new DocumentBuilder()
    .setTitle('넥슨 이벤트 보상 시스템 API')
    .setDescription('넥슨 이벤트 보상 시스템의 API 문서입니다')
    .setVersion('1.0')
    .addTag('Auth', '인증 및 사용자 관련 API')
    .addTag('Events', '이벤트 관리 API')
    .addTag('Rewards', '보상 관리 API')
    .addTag('Claims', '보상 청구 API')
    .addTag('Audit', '감사 관련 API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT 액세스 토큰을 입력하세요',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // 서버 시작
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`Gateway HTTP API is running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
