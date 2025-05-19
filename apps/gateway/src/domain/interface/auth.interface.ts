import { GrpcAuthResponse, GrpcTokenResponse, GrpcLogoutResponse, GrpcProfileResponse } from '@app/libs/infrastructure/grpc/proto/auth';

/**
 * Auth 서비스의 비즈니스 로직을 정의하는 인터페이스
 */
export interface IAuthService {
  /**
   * 회원가입
   */
  register(email: string, password: string, nickname: string, roles?: string[]): Promise<GrpcAuthResponse>;

  /**
   * 로그인
   */
  login(email: string, password: string): Promise<GrpcAuthResponse>;

  /**
   * 토큰 갱신
   */
  refreshToken(userId: string, refreshToken: string): Promise<GrpcTokenResponse>;

  /**
   * 로그아웃
   */
  logout(userId: string): Promise<GrpcLogoutResponse>;

  /**
   * 사용자 프로필 조회
   */
  getUserProfile(userId: string): Promise<GrpcProfileResponse>;

  /**
   * 사용자 정보 수정
   */
  updateUser(
    userId: string,
    updates: {
      nickname?: string;
      email?: string;
      password?: string;
      roles?: string[];
      status?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<GrpcAuthResponse>;
} 