/**
 * 캐시 서비스 설정 옵션 인터페이스
 * 
 * 다양한 캐시 구현체에 대한 설정 옵션을 정의합니다.
 */
export interface CacheConfigOptions {
  /** 사용할 캐시 타입 */
  type: 'redis' | 'memory';

  /** 캐시 서버 호스트 */
  host?: string;

  /** 캐시 서버 포트 */
  port?: number;

  /** 캐시 서버 비밀번호 */
  password?: string;

  /** 캐시 유효 기간 (초 단위) */
  ttl?: number;

  /** Redis Sentinel 마스터 이름 */
  sentinelName?: string;

  /** 최대 캐시 크기 */
  max?: number;
  
  /** Redis 데이터베이스 인덱스 (0-15) */
  db?: number;
  
  /** 연결 제한 시간 (밀리초) */
  timeout?: number;
  
  /** 모듈을 전역으로 등록할지 여부 */
  isGlobal?: boolean;
} 