import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AUTH_GRPC_CLIENT } from '@app/libs/infrastructure/grpc/constants';
import { Logger, LoggerFactory } from '@app/libs/infrastructure/logger';
import {
  AuthServiceClient,
  GrpcRegisterRequest,
  GrpcLoginRequest,
  GrpcRefreshTokenRequest,
  GrpcLogoutRequest,
  GrpcProfileRequest,
  GrpcUpdateUserRequest,
  GrpcAuthResponse,
  GrpcTokenResponse,
  GrpcLogoutResponse,
  GrpcProfileResponse,
} from '@app/libs/infrastructure/grpc/proto/auth';

@Injectable()
export class AuthFacade implements OnModuleInit {
  private readonly logger: Logger;
  private authService: AuthServiceClient;

  constructor(
    @Inject(AUTH_GRPC_CLIENT) private readonly authClient: ClientGrpc,
    @Inject('LOGGER_FACTORY') private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.createLogger('AuthFacade');
  }

  onModuleInit() {
    this.authService = this.authClient.getService<AuthServiceClient>('AuthService');
    this.logger.log('Auth gRPC 서비스 초기화 완료');
  }

  /**
   * 회원가입 처리
   */
  async register(request: GrpcRegisterRequest): Promise<GrpcAuthResponse> {
    this.logger.debug(`회원가입 요청: ${request.email}`);

    try {
      return await firstValueFrom(
        this.authService.register(request)
      );
    } catch (error) {
      this.logger.error(`회원가입 처리 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 로그인 처리
   */
  async login(email: string, password: string): Promise<GrpcAuthResponse> {
    this.logger.debug(`로그인 요청: ${email}`);

    try {
      return await firstValueFrom(
        this.authService.login({ email, password })
      );
    } catch (error) {
      this.logger.error(`로그인 처리 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 토큰 갱신 처리
   */
  async refreshToken(userId: string, refreshToken: string): Promise<GrpcTokenResponse> {
    this.logger.debug(`토큰 갱신 요청: ${userId}`);

    try {
      return await firstValueFrom(
        this.authService.refreshToken({ userId, refreshToken })
      );
    } catch (error) {
      this.logger.error(`토큰 갱신 처리 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 로그아웃 처리
   */
  async logout(userId: string): Promise<GrpcLogoutResponse> {
    this.logger.debug(`로그아웃 요청: ${userId}`);

    try {
      return await firstValueFrom(
        this.authService.logout({ userId })
      );
    } catch (error) {
      this.logger.error(`로그아웃 처리 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(userId: string): Promise<GrpcProfileResponse> {
    this.logger.debug(`프로필 조회 요청: ${userId}`);

    try {
      return await firstValueFrom(
        this.authService.getProfile({ userId })
      );
    } catch (error) {
      this.logger.error(`프로필 조회 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 사용자 정보 수정
   */
  async updateUser(request: GrpcUpdateUserRequest): Promise<GrpcAuthResponse> {
    this.logger.debug(`사용자 정보 수정 요청: ${request.userId}`);

    try {
      return await firstValueFrom(
        this.authService.updateUser(request)
      );
    } catch (error) {
      this.logger.error(`사용자 정보 수정 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }
} 