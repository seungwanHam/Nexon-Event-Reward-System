import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

// DTOs
import {
  RegisterRequestDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
  UpdateUserRequestDto,
  LogoutRequestDto
} from '@app/gateway/presentation/dto';

@Injectable()
export class AuthHttpClient {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('AuthHttpClient');
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3001';
    this.logger.log(`Auth service URL: ${this.authServiceUrl}`);
  }

  async register(registerDto: RegisterRequestDto) {
    this.logger.debug('회원가입 요청', { email: registerDto.email });
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/api/v1/auth/register`, registerDto)
    );
    return data;
  }

  async login(loginDto: LoginRequestDto) {
    this.logger.debug('로그인 요청', { email: loginDto.email });
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/api/v1/auth/login`, { ...loginDto })
    );
    return data;
  }

  async refreshToken(refreshTokenDto: RefreshTokenRequestDto) {
    this.logger.debug('토큰 갱신 요청', { userId: refreshTokenDto.userId });
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/api/v1/auth/refresh`, { ...refreshTokenDto })
    );
    return data;
  }

  async logout(logoutDto: LogoutRequestDto) {
    this.logger.debug('로그아웃 요청', { userId: logoutDto.userId });
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/api/v1/auth/logout`, { ...logoutDto })
    );
    return data;
  }

  async getUserProfile(userId: string) {
    this.logger.debug('사용자 프로필 조회 요청', { userId });
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.authServiceUrl}/api/v1/auth/profile/${userId}`)
    );
    return data;
  }

  async updateUser(userId: string, updateUserDto: UpdateUserRequestDto) {
    this.logger.debug('사용자 정보 업데이트 요청', { userId });
    
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.authServiceUrl}/api/v1/auth/users/${userId}`, updateUserDto)
    );
    return data;
  }
} 