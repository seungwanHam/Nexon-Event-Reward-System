import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import { AuthModule } from './auth.module';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';
// import { HttpInterceptor, HttpErrorInterceptor } from '@app/libs/infrastructure/interceptor';

/**
 * Auth 마이크로서비스 부트스트랩 함수
 */
async function bootstrap() {
  try {
    // 로거 설정
    const logger = new WinstonLoggerService();

    // NestJS 애플리케이션 생성
    const app = await NestFactory.create(AuthModule, {
      logger,
    });
    const configService = app.get(ConfigService);

    // HTTP 서버 포트 설정
    const httpPort = parseInt(process.env.AUTH_HTTP_PORT, 10) || 3001;

    // API 경로 접두사 설정
    app.setGlobalPrefix('api/v1');

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

    // Swagger 문서 설정
    const config = new DocumentBuilder()
      .setTitle('인증 API')
      .setDescription('사용자 등록, 인증, 토큰 관리, 프로필 관리를 위한 API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // 인터셉터 설정
    // app.useGlobalInterceptors(
    //   new HttpInterceptor(),
    //   new HttpErrorInterceptor(logger)
    // );

    // HTTP 서버 시작
    await app.listen(httpPort);
    logger.log(`Auth HTTP API is running on port ${httpPort}`);
  } catch (error) {
    console.error('Failed to start Auth service:', error);
    process.exit(1);
  }
}

// 애플리케이션 시작
bootstrap(); 