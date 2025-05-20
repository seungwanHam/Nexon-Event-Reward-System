/**
 * JWT 관련 상수 모음
 * 
 * 토큰 만료 시간 및 기본 시크릿 키를 정의합니다.
 */
export const JWT_CONSTANTS = {
  /** 액세스 토큰 만료 시간: 1시간 */
  ACCESS_TOKEN_EXPIRY: '1h',

  /** 리프레시 토큰 만료 시간: 7일 */
  REFRESH_TOKEN_EXPIRY: '7d',

  /** 기본 액세스 토큰 시크릿 (환경 변수 없을 때 사용) */
  DEFAULT_ACCESS_SECRET: 'nexon-access-secret',

  /** 기본 리프레시 토큰 시크릿 (환경 변수 없을 때 사용) */
  DEFAULT_REFRESH_SECRET: 'nexon-refresh-secret',
} as const;

/**
 * JWT 환경 변수 키 모음
 * 
 * 환경 변수에서 시크릿 키를 가져올 때 사용하는 키를 정의합니다.
 */
export const JWT_CONFIG_KEYS = {
  /** 액세스 토큰 시크릿 환경 변수 키 */
  ACCESS_SECRET: 'JWT_ACCESS_SECRET',

  /** 리프레시 토큰 시크릿 환경 변수 키 */
  REFRESH_SECRET: 'JWT_REFRESH_SECRET',
} as const; 