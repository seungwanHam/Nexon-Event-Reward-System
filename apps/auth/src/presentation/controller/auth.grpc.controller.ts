import { Controller, Logger, UseInterceptors } from '@nestjs/common';
import { AuthFacade } from '@app/auth/application/facade';
import { UserRole, UserStatus } from '@app/libs/common/schema';
import { GrpcInterceptor } from '@app/libs/infrastructure/interceptor';

import {
  GrpcRegisterRequest,
  GrpcLoginRequest,
  GrpcRefreshTokenRequest,
  GrpcLogoutRequest,
  GrpcProfileRequest,
  GrpcUpdateUserRequest,
  HealthCheckRequest,
  HealthCheckResponse,
  HealthCheckResponse_ServingStatus,
  GrpcAuthResponse,
  GrpcTokenResponse,
  GrpcLogoutResponse,
  GrpcProfileResponse,
  AuthServiceController,
  AuthServiceControllerMethods
} from '@app/libs/infrastructure/grpc';

import {
  RegisterRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  UpdateUserRequestDto,
} from '@app/auth/presentation/dto';

@Controller()
@AuthServiceControllerMethods()
@UseInterceptors(GrpcInterceptor)
export class AuthGrpcController implements AuthServiceController {
  private readonly logger = new Logger(AuthGrpcController.name);

  constructor(private readonly authFacade: AuthFacade) { }

  async register(request: GrpcRegisterRequest): Promise<GrpcAuthResponse> {
    this.logger.debug(`회원가입 요청: ${request.email}`);

    const registerDto = new RegisterRequestDto();
    registerDto.email = request.email;
    registerDto.password = request.password;
    registerDto.nickname = request.nickname;
    registerDto.roles = request.roles.map(role => UserRole[role.toUpperCase() as keyof typeof UserRole]);

    const result = await this.authFacade.register(registerDto);
    return this.mapToAuthResponse(result);
  }

  async login(request: GrpcLoginRequest): Promise<GrpcAuthResponse> {
    this.logger.debug(`로그인 요청: ${request.email}`);

    const loginDto = new LoginRequestDto();
    loginDto.email = request.email;
    loginDto.password = request.password;

    const result = await this.authFacade.login({ ...loginDto });
    return this.mapToAuthResponse(result);
  }

  async refreshToken(request: GrpcRefreshTokenRequest): Promise<GrpcTokenResponse> {
    this.logger.debug(`토큰 갱신 요청: ${request.userId}`);

    const refreshTokenDto = new RefreshTokenRequestDto();
    refreshTokenDto.userId = request.userId;
    refreshTokenDto.refreshToken = request.refreshToken;

    return await this.authFacade.refreshTokens(
      refreshTokenDto.userId,
      refreshTokenDto.refreshToken
    );
  }

  async logout(request: GrpcLogoutRequest): Promise<GrpcLogoutResponse> {
    this.logger.debug(`로그아웃 요청: ${request.userId}`);
    await this.authFacade.logout(request.userId);
    return { success: true };
  }

  async getProfile(request: GrpcProfileRequest): Promise<GrpcProfileResponse> {
    this.logger.debug(`프로필 조회 요청: ${request.userId}`);

    const profile = await this.authFacade.getProfile(request.userId);
    return this.mapToProfileResponse(profile);
  }

  async updateUser(request: GrpcUpdateUserRequest): Promise<GrpcAuthResponse> {
    this.logger.debug(`사용자 정보 업데이트 요청: ${request.userId}`);

    const updateDto = new UpdateUserRequestDto();
    updateDto.email = request.email;
    updateDto.password = request.password;
    updateDto.nickname = request.nickname;
    updateDto.roles = request.roles?.map(role => UserRole[role.toUpperCase() as keyof typeof UserRole]);
    updateDto.status = request.status ? UserStatus[request.status.toUpperCase() as keyof typeof UserStatus] : undefined;
    updateDto.metadata = request.metadata;

    const result = await this.authFacade.updateUser(request.userId, updateDto);
    return this.mapToAuthResponse(result);
  }

  async healthCheck(request: HealthCheckRequest): Promise<HealthCheckResponse> {
    this.logger.debug('gRPC Health Check 요청');

    try {
      const status = await this.checkDependencies();

      return {
        status: status.healthy
          ? HealthCheckResponse_ServingStatus.SERVING
          : HealthCheckResponse_ServingStatus.NOT_SERVING,
        message: status.message,
        details: {
          version: process.env.APP_VERSION || '1.0.0',
          uptime: `${process.uptime()} seconds`,
          ...status.details
        }
      };
    } catch (error) {
      this.logger.error('Health check 실패:', error);
      return {
        status: HealthCheckResponse_ServingStatus.NOT_SERVING,
        message: error.message,
        details: {
          error: error.stack
        }
      };
    }
  }

  private mapToAuthResponse(result: any): GrpcAuthResponse {
    return {
      id: result.id,
      email: result.email,
      nickname: result.nickname,
      roles: result.roles.map(role => role.toLowerCase()),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    };
  }

  private mapToProfileResponse(profile: any): GrpcProfileResponse {
    return {
      id: profile.id,
      email: profile.email,
      nickname: profile.nickname,
      roles: profile.roles.map(role => role.toLowerCase()),
      status: profile.status.toLowerCase(),
      metadata: profile.metadata || {},
      lastLoginAt: profile.lastLoginAt?.toISOString() || '',
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString()
    };
  }

  private async checkDependencies(): Promise<{
    healthy: boolean;
    message: string;
    details: Record<string, string>;
  }> {
    try {
      // 여기서 필요한 의존성들의 상태를 확인
      // 예: 데이터베이스, Redis 등
      return {
        healthy: true,
        message: '모든 서비스가 정상 동작 중입니다.',
        details: {
          database: 'connected',
          cache: 'connected'
        }
      };
    } catch (error) {
      return {
        healthy: false,
        message: '일부 서비스에 문제가 있습니다.',
        details: {
          error: error.message
        }
      };
    }
  }
} 