import { Injectable } from '@nestjs/common';
import { AuthFacade } from '@app/gateway/application/facade/auth.facade';
import { RegisterRequestDto } from '@app/gateway/presentation/dto/request/register.request.dto';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';
import { UserRole } from '@app/libs/common/enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly authFacade: AuthFacade,
    private readonly logger: WinstonLoggerService,
  ) { }

  /**
   * 회원가입 처리
   */
  async register(email: string, password: string, nickname: string, roles: string[] = []) {
    this.logger.debug(`회원가입 요청 처리: ${email}`);

    const registerDto: RegisterRequestDto = {
      email,
      password,
      nickname,
      roles: roles.map(role => role as UserRole),
    };

    return this.authFacade.register(registerDto);
  }

  /**
   * 로그인 처리
   */
  async login(email: string, password: string) {
    this.logger.debug(`로그인 요청 처리: ${email}`);
    return this.authFacade.login(email, password);
  }

  /**
   * 토큰 갱신
   */
  async refreshToken(userId: string, refreshToken: string) {
    this.logger.debug(`토큰 갱신 요청 처리: ${userId}`);
    return this.authFacade.refreshToken(userId, refreshToken);
  }

  /**
   * 로그아웃
   */
  async logout(userId: string) {
    this.logger.debug(`로그아웃 요청 처리: ${userId}`);
    return this.authFacade.logout(userId);
  }

  /**
   * 사용자 프로필 조회
   */
  async getUserProfile(userId: string) {
    this.logger.debug(`프로필 조회 요청 처리: ${userId}`);
    return this.authFacade.getUserProfile(userId);
  }
} 