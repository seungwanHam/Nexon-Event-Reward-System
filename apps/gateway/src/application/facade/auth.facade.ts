import { Injectable } from '@nestjs/common';
import { AuthHttpClient } from '@app/gateway/infrastructure/client/auth.http.client';
import { RegisterRequestDto, LoginRequestDto, RefreshTokenRequestDto, UpdateUserRequestDto, LogoutRequestDto } from '@app/gateway/presentation/dto';

@Injectable()
export class AuthFacade {
  constructor(private readonly authClient: AuthHttpClient) { }

  async register(registerDto: RegisterRequestDto) {
    return this.authClient.register({ ...registerDto });
  }

  async login(loginDto: LoginRequestDto) {
    return this.authClient.login({ ...loginDto });
  }

  async refreshToken(refreshTokenDto: RefreshTokenRequestDto) {
    return this.authClient.refreshToken({ ...refreshTokenDto });
  }

  async logout(logoutDto: LogoutRequestDto) {
    return this.authClient.logout({ ...logoutDto });
  }

  async getUserProfile(userId: string) {
    return this.authClient.getUserProfile(userId);
  }

  async updateUser(userId: string, updateUserDto: UpdateUserRequestDto) {
    return this.authClient.updateUser(userId, { ...updateUserDto });
  }
} 