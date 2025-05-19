import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

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
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3002';
  }

  async register(registerDto: RegisterRequestDto) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/register`, registerDto)
    );
    return data;
  }

  async login(loginDto: LoginRequestDto) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/login`, { ...loginDto })
    );
    return data;
  }

  async refreshToken(refreshTokenDto: RefreshTokenRequestDto) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/refresh`, { ...refreshTokenDto })
    );
    return data;
  }

  async logout(logoutDto: LogoutRequestDto) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authServiceUrl}/auth/logout`, { ...logoutDto })
    );
    return data;
  }

  async getUserProfile(userId: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.authServiceUrl}/auth/profile/${userId}`)
    );
    return data;
  }

  async updateUser(userId: string, updateUserDto: UpdateUserRequestDto) {
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.authServiceUrl}/auth/users/${userId}`, updateUserDto)
    );
    return data;
  }
} 