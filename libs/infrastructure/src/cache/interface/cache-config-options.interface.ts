/**
 * 캐시 서비스 설정 옵션 인터페이스
 */
export interface CacheConfigOptions {
  type: 'redis' | 'memory';

  /**
   * 캐시 서버 호스트
   */
  host?: string;

  /**
   * 캐시 서버 포트
   */
  port?: number;

  /**
   * 캐시 서버 비밀번호
   */
  password?: string;

  /**
   * 캐시 유효 기간 (초 단위)
   */
  ttl?: number;

  /**
   * Redis Sentinel 마스터 이름
   */
  sentinelName?: string;

  /**
   * 최대 캐시 크기
   */
  max?: number;
} 