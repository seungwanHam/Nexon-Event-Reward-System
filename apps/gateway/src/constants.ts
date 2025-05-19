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