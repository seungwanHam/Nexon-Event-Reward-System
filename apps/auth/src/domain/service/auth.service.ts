import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LockService } from '../../../../../libs/infrastructure/src/lock-manager';
import { TokenBlacklistRepository } from '../../domain/repository';

// DTO
import {
  RegisterRequestDto,
  RefreshTokenRequestDto,
  LogoutRequestDto,
  LoginRequestDto,
  UpdateUserRequestDto,
  AuthResponseDto,
  TokenResponseDto
} from '../../presentation/dto';

// Service
import { UserService } from '../../domain/service';

// Entity
import { UserEntity } from '../../domain/entity';

// Exception
import { InvalidTokenException, TokenBlacklistedException } from '../../../../../libs/common/src/exception';

/**
 * 인증 서비스
 * 
 * 사용자 인증, 토큰 관리, 인증 관련 비즈니스 로직을 처리하는 도메인 서비스입니다.
 * JWT 토큰 생성, 검증, 리프레시, 블랙리스트 관리 등의 기능을 담당합니다.
 */
@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY: string;
  private readonly REFRESH_TOKEN_EXPIRY: string;

  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('LOCK_SERVICE')
    private readonly lockManager: LockService,
    @Inject('TOKEN_BLACKLIST_REPOSITORY')
    private readonly tokenBlacklistRepository: TokenBlacklistRepository,
  ) {
    // 설정 값을 ConfigService에서 로드
    this.ACCESS_TOKEN_SECRET = this.configService.get<string>('JWT_ACCESS_SECRET') || 'nexon-access-secret';
    this.REFRESH_TOKEN_SECRET = this.configService.get<string>('JWT_REFRESH_SECRET') || 'nexon-refresh-secret';
    this.ACCESS_TOKEN_EXPIRY = this.configService.get<string>('JWT_ACCESS_EXPIRY') || '5m';
    this.REFRESH_TOKEN_EXPIRY = this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d';
  }

  /**
   * 새로운 사용자를 등록합니다.
   * 
   * 사용자 서비스를 통해 사용자를 생성하고, JWT 토큰을 발급합니다.
   * 
   * @param registerDto - 사용자 등록 정보가 담긴 DTO
   * @returns 생성된 사용자 정보와 인증 토큰
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
   * 
   * 이메일과 비밀번호를 검증하고, 로그인 정보를 업데이트한 후 JWT 토큰을 발급합니다.
   * 
   * @param loginDto - 로그인 정보가 담긴 DTO
   * @returns 사용자 정보와 인증 토큰
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
   * 
   * 분산 락을 사용하여 동시 요청 시 하나의 요청만 처리되도록 합니다.
   * 
   * @param refreshTokenDto - 리프레시 토큰 정보가 담긴 DTO
   * @returns 새로 발급된 액세스 토큰과 리프레시 토큰
   */
  async refreshTokens(refreshTokenDto: RefreshTokenRequestDto): Promise<TokenResponseDto> {
    const { userId, refreshToken } = refreshTokenDto;
    const lockKey = `refresh:${userId}`;
    
    // 분산 락 획득
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
      // 락 해제
      await release();
    }
  }

  /**
   * 로그아웃 처리를 수행합니다.
   * 
   * 사용자의 리프레시 토큰을 무효화하고 액세스 토큰을 블랙리스트에 추가합니다.
   * 
   * @param dto - 로그아웃 정보가 담긴 DTO
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
   * 
   * 액세스 토큰 또는 리프레시 토큰의 유효성을 검사합니다.
   * 블랙리스트에 등록된 토큰은 유효하지 않은 것으로 처리합니다.
   * 
   * @param token - 검증할 JWT 토큰
   * @param isRefreshToken - 리프레시 토큰 여부
   * @returns 토큰의 페이로드
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
   * 
   * 사용자 서비스를 통해 정보를 업데이트하고, 새로운 JWT 토큰을 발급합니다.
   * 
   * @param userId - 업데이트할 사용자 ID
   * @param updateUserDto - 업데이트할 정보가 담긴 DTO
   * @returns 업데이트된 사용자 정보와 인증 토큰
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
   * 
   * 사용자 정보를 기반으로 JWT 페이로드를 구성하고, 
   * 설정된 비밀키와 만료 시간으로 토큰을 발급합니다.
   * 
   * @param user - 토큰에 포함될 사용자 정보
   * @returns 액세스 토큰과 리프레시 토큰
   * @private
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
   * 
   * 사용자 정보와 토큰을 결합하여 클라이언트에 반환할 응답 객체를 생성합니다.
   * 
   * @param user - 사용자 정보
   * @param tokens - 액세스 토큰과 리프레시 토큰
   * @returns 인증 응답 객체
   * @private
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
   * 
   * 로그아웃 시 기존 액세스 토큰을 무효화하기 위해 블랙리스트에 추가합니다.
   * 토큰의 남은 유효 시간만큼 블랙리스트에 유지됩니다.
   * 
   * @param accessToken - 블랙리스트에 추가할 액세스 토큰
   * @private
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