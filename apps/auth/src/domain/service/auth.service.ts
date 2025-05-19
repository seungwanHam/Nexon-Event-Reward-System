import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LockService } from '@app/libs/infrastructure/lock-manager';
import { TokenBlacklistRepository } from '@app/auth/domain/repository';

// DTO
import {
  RegisterRequestDto,
  RefreshTokenRequestDto,
  LogoutRequestDto,
  LoginRequestDto,
  UpdateUserRequestDto,
  AuthResponseDto,
  TokenResponseDto
} from '@app/auth/presentation/dto';

// Service
import { UserService } from '@app/auth/domain/service';

// Entity
import { UserEntity } from '@app/auth/domain/entity';

// Exception
import { InvalidTokenException, TokenBlacklistedException } from '@app/libs/common/exception';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'nexon-access-secret';
  private readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'nexon-refresh-secret';
  private readonly ACCESS_TOKEN_EXPIRY = '5m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject('LOCK_SERVICE')
    private readonly lockManager: LockService,
    @Inject('TOKEN_BLACKLIST_REPOSITORY')
    private readonly tokenBlacklistRepository: TokenBlacklistRepository,
  ) { }

  /**
   * 새로운 사용자를 등록합니다.
   */
  async register(registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    // 사용자 생성
    const newUser = await this.userService.createUser(registerDto);

    // 토큰 생성
    const tokens = await this.generateTokens(newUser);

    // 리프레시 토큰 저장
    await this.userService.updateRefreshToken(newUser.id, tokens.refreshToken);

    return this.createAuthResponse(newUser, tokens);
  }

  /**
   * 사용자 로그인을 처리합니다.
   */
  async login(loginDto: LoginRequestDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // 인증 정보 검증
    const user = await this.userService.validateUserCredentials(email, password);

    // 로그인 정보 업데이트
    const updatedUser = await this.userService.updateUserLastLogin(user.id);

    // 토큰 생성
    const tokens = await this.generateTokens(updatedUser);

    // 리프레시 토큰 저장
    await this.userService.updateRefreshToken(updatedUser.id, tokens.refreshToken);

    return this.createAuthResponse(updatedUser, tokens);
  }

  /**
   * 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.
   */
  async refreshTokens(refreshTokenDto: RefreshTokenRequestDto): Promise<TokenResponseDto> {
    const { userId, refreshToken } = refreshTokenDto;
    const lockKey = `refresh:${userId}`;
    const { success, release } = await this.lockManager.acquireLock(lockKey, {
      retryCount: 3,
      lockTTL: 10,
    });

    if (!success) {
      throw new UnauthorizedException('토큰 갱신 작업이 이미 진행 중입니다');
    }

    try {
      const user = await this.userService.findUserById(userId);

      // 리프레시 토큰 검증
      const isRefreshTokenValid = await this.userService.validateRefreshToken(
        refreshToken,
        user.refreshToken
      );

      if (!isRefreshTokenValid) {
        throw new InvalidTokenException('유효하지 않은 리프레시 토큰입니다');
      }

      // 새로운 토큰 생성
      const tokens = await this.generateTokens(user);

      // 새로운 리프레시 토큰 저장
      await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } finally {
      await release();
    }
  }

  /**
   * 로그아웃 처리를 수행합니다.
   */
  async logout(dto: LogoutRequestDto): Promise<void> {
    // 리프레시 토큰 제거
    await this.userService.updateRefreshToken(dto.userId, null);

    // 액세스 토큰 블랙리스트 처리
    if (dto.accessToken) {
      await this.blacklistAccessToken(dto.accessToken);
    }
  }

  /**
   * 토큰을 검증하고 페이로드를 반환합니다.
   */
  async validateToken(token: string, isRefreshToken = false): Promise<any> {
    try {
      // 블랙리스트 확인
      const isBlacklisted = await this.tokenBlacklistRepository.isBlacklisted(token);
      if (isBlacklisted) {
        throw new TokenBlacklistedException('로그아웃된 토큰입니다');
      }

      const secret = isRefreshToken ? this.REFRESH_TOKEN_SECRET : this.ACCESS_TOKEN_SECRET;
      return await this.jwtService.verifyAsync(token, { secret });
    } catch (error) {
      if (error instanceof TokenBlacklistedException) {
        throw error;
      }
      throw new InvalidTokenException('유효하지 않은 토큰입니다');
    }
  }

  /**
   * 사용자 정보를 업데이트합니다.
   */
  async updateUser(userId: string, updateUserDto: UpdateUserRequestDto): Promise<AuthResponseDto> {
    // 사용자 정보 업데이트
    const updatedUser = await this.userService.updateUser(userId, updateUserDto);

    // 토큰 재발급
    const tokens = await this.generateTokens(updatedUser);

    // 리프레시 토큰 저장
    await this.userService.updateRefreshToken(updatedUser.id, tokens.refreshToken);

    return this.createAuthResponse(updatedUser, tokens);
  }

  /**
   * 액세스 토큰과 리프레시 토큰을 생성합니다.
   */
  private async generateTokens(user: UserEntity): Promise<TokenResponseDto> {
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        secret: this.ACCESS_TOKEN_SECRET,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        secret: this.REFRESH_TOKEN_SECRET,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * 인증 응답 객체를 생성합니다.
   */
  private createAuthResponse(user: UserEntity, tokens: TokenResponseDto): AuthResponseDto {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      roles: user.roles,
      ...tokens,
    };
  }

  /**
   * 액세스 토큰을 블랙리스트에 추가합니다.
   */
  private async blacklistAccessToken(accessToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: this.ACCESS_TOKEN_SECRET,
      });

      const expiryTime = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      const timeToExpiry = expiryTime - now;

      if (timeToExpiry > 0) {
        await this.tokenBlacklistRepository.addToBlacklist(
          accessToken,
          timeToExpiry
        );
      }
    } catch (error) {
      // 잘못된 토큰은 무시
    }
  }
} 