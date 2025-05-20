import { UserRole } from '@app/libs/common/enum';

/**
 * JWT 토큰 페이로드 인터페이스
 * 
 * JWT 토큰에 저장되는 사용자 정보와 토큰 메타데이터를 정의합니다.
 */
export interface JwtPayload {
  /** 사용자 ID */
  userId: string;

  /** 사용자 이메일 */
  email: string;

  /** 사용자 역할 목록 */
  roles: UserRole[];

  /** 토큰 발행 시간 (Issued At) */
  iat?: number;

  /** 토큰 만료 시간 (Expiration Time) */
  exp?: number;
} 