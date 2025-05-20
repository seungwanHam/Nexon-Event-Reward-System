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
    .setDescription(`
## 이벤트 보상 시스템 API 문서

이 문서는 이벤트 생성, 보상 관리, 청구 처리를 위한 API를 제공합니다.

### 주요 기능

- **인증/인가**: JWT 기반 사용자 인증 및 역할 기반 접근 제어
- **이벤트 관리**: 이벤트 생성, 조회, 수정, 삭제
- **보상 관리**: 보상 정의, 조회, 청구
- **청구 처리**: 보상 청구, 승인, 거부, 조회
- **감사**: 보상 지급 내역 및 로그 조회

### 사용자 역할

- **USER**: 일반 사용자. 이벤트 참여 및 보상 청구 가능
- **OPERATOR**: 운영자. 보상 청구 승인/거부 처리 가능
- **AUDITOR**: 감사자. 지급 내역 조회만 가능
- **ADMIN**: 관리자. 모든 기능 접근 가능

### 응답 형식

모든 API 응답은 다음과 같은 표준 형식을 따릅니다:

\`\`\`json
{
  "success": true|false,
  "message": "응답 메시지",
  "data": { ... } // 응답 데이터 (성공 시)
  "error": { ... } // 오류 정보 (실패 시)
}
\`\`\`

### 오류 응답

- **401 Unauthorized**: 인증되지 않은 사용자
- **403 Forbidden**: 접근 권한 없음
- **404 Not Found**: 리소스를 찾을 수 없음
- **422 Unprocessable Entity**: 유효성 검사 실패
- **500 Internal Server Error**: 서버 내부 오류
    `)
    .setVersion('1.0')
    .addTag('인증', '사용자 인증 및 계정 관리 API')
    .addTag('이벤트 API', '이벤트 관리 관련 API')
    .addTag('보상 API', '보상 정의 및 관리 API')
    .addTag('청구 API', '보상 청구 및 승인 처리 API')
    .addTag('감사 API', '지급 내역 조회 및 감사 API')
    .addServer('http://localhost:3001', '로컬 개발 서버')
    .addServer('http://api.event-rewards.example.com', '프로덕션 서버 (예시)')
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

  // Swagger UI 테마 및 옵션 설정
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: '넥슨 이벤트 보상 시스템 API 문서',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 3,
      displayRequestDuration: true,
    },
  });

  // 서버 시작
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Gateway HTTP API is running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
