// 서비스 이름 상수
export const SERVICE_AUTH = 'SERVICE_AUTH';
export const SERVICE_EVENT = 'SERVICE_EVENT';

// 역할 관련 상수
export enum UserRole {
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN',
}

// 의존성 주입 토큰
export const HTTP_CLIENT = 'HTTP_CLIENT';

export const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';
export const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://localhost:3002';

export const DEFAULT_TIMEOUT = 5000;
export const DEFAULT_MAX_REDIRECTS = 5; 