import { Injectable, Logger } from '@nestjs/common';

// DTO
import {
  RegisterRequestDto,
  RefreshTokenRequestDto,
  LoginRequestDto,
  LogoutRequestDto,
  UpdateUserRequestDto,
  AuthResponseDto,
  TokenResponseDto,
  ProfileResponseDto
} from '@app/auth/presentation/dto';

// Service
import { AuthService, UserService } from '@app/auth/domain/service';

/**
 * Auth 파사드 클래스
 * 
 * 책임:
 * 1. 프레젠테이션 계층과 도메인 계층 사이의 중간 계층
 * 2. 도메인 서비스들의 조합과 오케스트레이션
 * 3. 외부 시스템과의 통합 처리
 * 4. 트랜잭션 관리
 * 5. 간단한 데이터 변환 및 매핑
 */
@Injectable()
export class AuthFacade {
  private readonly logger = new Logger(AuthFacade.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) { }

  /**
   * 회원가입 처리
   * RegisterRequestDto를 받아 인증 서비스로 전달하고 결과를 반환
   */
  async register(registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    this.logger.debug(`회원가입 요청 처리: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  /**
   * 로그인 처리
   * 인증 서비스에 위임하여 로그인 처리 후 결과 반환
   */
  async login(loginDto: LoginRequestDto): Promise<AuthResponseDto> {
    this.logger.debug(`로그인 요청 처리: ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  /**
   * 토큰 갱신
   * 리프레시 토큰을 사용하여 새로운 액세스 토큰 발급
   */
  async refreshTokens(refreshTokenDto: RefreshTokenRequestDto): Promise<TokenResponseDto> {
    this.logger.debug(`토큰 갱신 요청 처리: ${refreshTokenDto.userId}`);
    return this.authService.refreshTokens(refreshTokenDto);
  }

  /**
   * 로그아웃
   * 사용자의 리프레시 토큰을 무효화
   */
  async logout(dto: LogoutRequestDto): Promise<void> {
    this.logger.debug(`로그아웃 요청 처리: ${dto.userId}`);
    await this.authService.logout({ ...dto });
  }

  /**
   * 프로필 조회
   * 사용자 서비스를 통해 프로필 정보를 조회하고 DTO로 변환
   */
  async getProfile(userId: string): Promise<ProfileResponseDto> {
    this.logger.debug(`프로필 조회 요청 처리: ${userId}`);
    return this.userService.getUserProfile(userId);
  }

  /**
   * 사용자 정보 업데이트
   * 변경된 사용자 정보를 검증하고 업데이트
   */
  async updateUser(userId: string, updateUserDto: UpdateUserRequestDto): Promise<AuthResponseDto> {
    this.logger.debug(`사용자 정보 업데이트 요청 처리: ${userId}`);
    return this.authService.updateUser(userId, updateUserDto);
  }

  /**
   * 토큰 검증
   * JWT 토큰의 유효성을 검사하고 페이로드 반환
   */
  async validateToken(token: string, isRefreshToken = false): Promise<any> {
    return this.authService.validateToken(token, isRefreshToken);
  }

  async getAllUsers(): Promise<ProfileResponseDto[]> {
    // 모든 사용자 조회 로직 구현
    const users = await this.userService.findAllUsers();
    return users.map(user => ({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      roles: user.roles,
      status: user.status,
      metadata: user.metadata,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
  }
} 