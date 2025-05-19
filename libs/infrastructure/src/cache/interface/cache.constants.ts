/**
 * 캐시 서비스 의존성 주입 토큰
 */
export const CACHE_SERVICE = 'CACHE_SERVICE';

/**
 * 캐시 타입 상수
 */
export const CACHE_TYPES = {
  REDIS: 'redis',
  MEMORY: 'memory',
} as const;

export type CacheType = typeof CACHE_TYPES[keyof typeof CACHE_TYPES]; 