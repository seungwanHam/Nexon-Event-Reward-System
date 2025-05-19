import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseInterceptors, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, JwtRefreshGuard, Roles, RolesGuard } from '../../../../../libs/auth/src/index';
import { UserRole } from '@app/libs/common/schema';

// DTO
import { AuthResponseDto, TokenResponseDto, RegisterRequestDto, LoginRequestDto, UpdateUserRequestDto, ProfileResponseDto } from '@app/auth/presentation/dto';

// Facade
import { AuthFacade } from '@app/auth/application/facade/auth.facade';

// Interceptor
import { HttpInterceptor } from '@app/libs/infrastructure/interceptor';

// Exception
import { EmailAlreadyExistsException, InvalidCredentialsException, UserNotFoundException, InvalidTokenException } from '@app/libs/common/exception';

@Controller('auth')
@UseInterceptors(HttpInterceptor)
export class AuthHttpController {
  constructor(private readonly authFacade: AuthFacade) { }

  @Post('register')
  async register(@Body() registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authFacade.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authFacade.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req): Promise<TokenResponseDto> {
    const { userId, refreshToken } = req.user;
    return this.authFacade.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req): Promise<void> {
    const { userId } = req.user;
    const token = req.headers.authorization?.split(' ')[1];
    await this.authFacade.logout(userId, token);
  }

  @Get('profile/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER)
  async getProfile(@Param('userId') userId: string): Promise<ProfileResponseDto> {
    const profile = await this.authFacade.getProfile(userId);
    return {
      ...profile,
      lastLoginAt: profile.lastLoginAt ? new Date(profile.lastLoginAt).toISOString() : null,
      createdAt: new Date(profile.createdAt).toISOString(),
      updatedAt: new Date(profile.updatedAt).toISOString()
    };
  }

  @Put('users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateUserRequestDto
  ): Promise<AuthResponseDto> {
    return this.authFacade.updateUser(userId, updateDto);
  }
} 