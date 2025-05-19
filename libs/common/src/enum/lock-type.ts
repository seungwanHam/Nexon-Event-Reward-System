/**
 * 락 서비스 타입 열거형
 */
export enum LockType {
  // Redis 기반 분산 락
  REDIS = 'redis',

  // 메모리 기반 락 (단일 서버 환경용)
  MEMORY = 'memory',
} 