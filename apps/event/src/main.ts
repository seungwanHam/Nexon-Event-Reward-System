import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { EventModule } from './event.module';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

async function bootstrap() {
  // 애플리케이션 생성
  const app = await NestFactory.create(EventModule, {
    logger: new WinstonLoggerService(),
  });

  // HTTP 보안 헤더 설정
  app.use(helmet());

  // CORS 설정
  app.enableCors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 전역 접두사 설정
  app.setGlobalPrefix('api/v1');

  // 유효성 검증 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger 문서 설정
  const config = new DocumentBuilder()
    .setTitle('이벤트 및 보상 API')
    .setDescription('이벤트 생성, 보상 정의, 보상 청구 및 관리를 위한 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 서버 시작
  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`Event Service is running on: ${await app.getUrl()}`);
}

bootstrap(); 