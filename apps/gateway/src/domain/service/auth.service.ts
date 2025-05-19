import { Injectable, Inject } from '@nestjs/common';
import { Logger, LoggerFactory } from '@app/libs/infrastructure/logger';
import { AuthFacade } from '@app/gateway/application/facade';
import { IAuthService } from '../interface/auth.interface';
import {
  GrpcAuthResponse,
  GrpcTokenResponse,
  GrpcLogoutResponse,
  GrpcProfileResponse
} from '@app/libs/infrastructure/grpc/proto/auth';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger: Logger;

  constructor(
    private readonly authFacade: AuthFacade,
    @Inject('LOGGER_FACTORY') private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.createLogger('AuthService');
  }

  /**
   * 회원가입
   */
  async register(email: string, password: string, nickname: string, roles: string[] = []): Promise<GrpcAuthResponse> {
    this.logger.debug(`회원가입 요청 처리: ${email}`);
    return this.authFacade.register({ email, password, nickname, roles });
  }

  /**
   * 로그인
   */
  async login(email: string, password: string): Promise<GrpcAuthResponse> {
    this.logger.debug(`로그인 요청 처리: ${email}`);
    return this.authFacade.login(email, password);
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(userId: string, refreshToken: string): Promise<GrpcTokenResponse> {
    this.logger.debug(`토큰 갱신 요청 처리: ${userId}`);
    return this.authFacade.refreshToken(userId, refreshToken);
  }

  /**
   * 로그아웃
   */
  async logout(userId: string): Promise<GrpcLogoutResponse> {
    this.logger.debug(`로그아웃 요청 처리: ${userId}`);
    return this.authFacade.logout(userId);
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(userId: string): Promise<GrpcProfileResponse> {
    this.logger.debug(`프로필 조회 요청 처리: ${userId}`);
    return this.authFacade.getUserProfile(userId);
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(
    userId: string,
    updates: {
      nickname?: string;
      email?: string;
      password?: string;
      roles?: string[];
      status?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<GrpcAuthResponse> {
    this.logger.debug(`사용자 정보 수정 요청 처리: ${userId}`);
    return this.authFacade.updateUser({
      userId,
      ...updates,
      roles: updates.roles || [],
      metadata: updates.metadata || {}
    });
  }
} 