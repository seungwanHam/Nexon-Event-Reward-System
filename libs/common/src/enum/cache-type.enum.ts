/**
 * 캐시 서비스 타입 열거형
 */
export enum CacheType {
  // Redis 기반 분산 캐시
  REDIS = 'redis',

  // 메모리 기반 캐시 (단일 서버 환경용)
  MEMORY = 'memory',
} 