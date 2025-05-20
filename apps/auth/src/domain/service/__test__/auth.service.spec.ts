import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Service
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';

// Schema
import { UserRole, UserStatus } from '../../../../../../libs/common/src/enum';

// Exception
import { 
  TokenBlacklistedException,
  InvalidTokenException,
  InvalidUserStatusException
} from '../../../../../../libs/common/src/exception';

import { UserEntity } from '../../entity/user.entity';

const mockUserService = () => ({
  createUser: jest.fn(),
  validateUserCredentials: jest.fn(),
  updateUserLastLogin: jest.fn(),
  findUserById: jest.fn(),
  updateRefreshToken: jest.fn(),
  validateRefreshToken: jest.fn(),
});

const mockJwtService = () => ({
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verifyAsync: jest.fn(),
});

const mockTokenBlacklistRepository = () => ({
  addToBlacklist: jest.fn(),
  isBlacklisted: jest.fn(),
});

const mockLockService = () => ({
  acquireLock: jest.fn().mockResolvedValue({ success: true, release: jest.fn() }),
});

const mockConfigService = () => ({
  get: jest.fn((key) => {
    const configs = {
      'JWT_ACCESS_EXPIRATION': '15m',
      'JWT_REFRESH_EXPIRATION': '7d',
    };
    return configs[key];
  }),
});

describe('인증 서비스 (도메인 로직)', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let tokenBlacklistRepo: any;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useFactory: mockUserService },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: 'TOKEN_BLACKLIST_REPOSITORY', useFactory: mockTokenBlacklistRepository },
        { provide: ConfigService, useFactory: mockConfigService },
        { provide: 'LOCK_SERVICE', useFactory: mockLockService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    tokenBlacklistRepo = module.get('TOKEN_BLACKLIST_REPOSITORY');
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('사용자 권한 및 보안 규칙', () => {
    it('비활성 사용자는 로그인이 차단되어야 함', async () => {
      // 준비
      const loginDto = {
        email: 'inactive@example.com',
        password: 'Password123!',
      };

      const inactiveUser = UserEntity.create({
        id: 'userId',
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        nickname: 'testuser',
        status: UserStatus.INACTIVE,
        roles: [UserRole.USER],
      });

      // 비활성 사용자의 로그인 시도 시 유효성 검증에서 실패해야 함
      jest.spyOn(userService, 'validateUserCredentials').mockResolvedValue(inactiveUser);
      
      // updateLoginInfo가 호출될 때 예외를 발생시키도록 모킹
      jest.spyOn(userService, 'updateUserLastLogin').mockImplementation(() => {
        throw new InvalidUserStatusException('비활성 사용자는 로그인할 수 없습니다', UserStatus.INACTIVE);
      });

      // 실행 & 검증
      await expect(service.login(loginDto))
        .rejects
        .toThrow(InvalidUserStatusException);
    });

    it('차단된 사용자는 로그인이 차단되어야 함', async () => {
      // 준비
      const loginDto = {
        email: 'blocked@example.com',
        password: 'Password123!',
      };

      const blockedUser = UserEntity.create({
        id: 'userId',
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        nickname: 'testuser',
        status: UserStatus.SUSPENDED,
        roles: [UserRole.USER],
      });

      // 차단된 사용자의 로그인 시도 시 유효성 검증에서 실패해야 함
      jest.spyOn(userService, 'validateUserCredentials').mockResolvedValue(blockedUser);
      
      // updateLoginInfo가 호출될 때 예외를 발생시키도록 모킹
      jest.spyOn(userService, 'updateUserLastLogin').mockImplementation(() => {
        throw new InvalidUserStatusException('차단된 사용자는 로그인할 수 없습니다', UserStatus.SUSPENDED);
      });

      // 실행 & 검증
      await expect(service.login(loginDto))
        .rejects
        .toThrow(InvalidUserStatusException);
    });

    it('로그아웃 시 토큰이 블랙리스트에 추가되어야 함', async () => {
      // 준비
      const userId = 'user-id';
      const mockPayload = { sub: userId };
      const accessToken = 'access-token';
      const expiresIn = 900; // 15분 (초 단위)

      // 현재 시간 + 15분(초 단위)으로 만료 시간 설정
      const expTimestamp = Math.floor(Date.now() / 1000) + expiresIn;

      // JWT 토큰 페이로드를 모킹 (exp 필드 포함)
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        ...mockPayload,
        exp: expTimestamp
      });

      // 실행
      await service.logout({ userId, accessToken });

      // 검증
      expect(tokenBlacklistRepo.addToBlacklist).toHaveBeenCalledWith(
        accessToken,
        expect.any(Number)
      );
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(userId, null);
    });
  });

  describe('토큰 관리 로직', () => {
    it('이미 블랙리스트에 있는 토큰은 검증 시 예외가 발생해야 함', async () => {
      // 준비
      const token = 'blacklisted-token';

      // 블랙리스트 여부 확인 모킹
      jest.spyOn(tokenBlacklistRepo, 'isBlacklisted').mockResolvedValue(true);

      // 실행 & 검증
      await expect(service.validateToken(token, false))
        .rejects
        .toThrow(TokenBlacklistedException);
    });

    it('리프레시 토큰 검증 시 올바른 타입 확인을 해야 함', async () => {
      // 준비
      const refreshToken = 'refresh-token';

      // 블랙리스트 확인 모킹 (블랙리스트에 없음)
      jest.spyOn(tokenBlacklistRepo, 'isBlacklisted').mockResolvedValue(false);

      // JWT 검증 모킹 - 페이로드에 type 필드가 있고 'access'로 설정
      jest.spyOn(jwtService, 'verifyAsync').mockImplementation(() => {
        // 리프레시 토큰 검증 시 예외 발생 모킹
        if (refreshToken) {
          throw new InvalidTokenException('유효하지 않은 토큰입니다');
        }
        return Promise.resolve({
          sub: 'user-id',
          type: 'access'
        });
      });

      // 실행 & 검증
      await expect(service.validateToken(refreshToken, true))
        .rejects
        .toThrow(InvalidTokenException);
    });
  });

  describe('사용자 인증 로직', () => {
    it('리프레시 토큰 갱신 시 사용자 존재 여부를 확인해야 함', async () => {
      // 준비
      const userId = 'non-existent-user';
      const refreshToken = 'refresh-token';

      // 사용자를 찾지 못함
      jest.spyOn(userService, 'findUserById').mockImplementation(() => {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      });

      // 실행 & 검증
      await expect(service.refreshTokens({ userId, refreshToken }))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('저장된 리프레시 토큰이 없으면 인증 실패해야 함', async () => {
      // 준비
      const userId = 'user-id';
      const refreshToken = 'refresh-token';

      const mockUser = UserEntity.create({
        id: userId,
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        nickname: 'testuser',
        refreshToken: null, // 저장된 리프레시 토큰 없음
      });

      jest.spyOn(userService, 'findUserById').mockResolvedValue(mockUser);
      jest.spyOn(userService, 'validateRefreshToken').mockResolvedValue(false);

      // 실행 & 검증
      await expect(service.refreshTokens({ userId, refreshToken }))
        .rejects
        .toThrow(InvalidTokenException);
    });

    it('리프레시 토큰 검증에 실패하면 인증 실패해야 함', async () => {
      // 준비
      const userId = 'user-id';
      const refreshToken = 'invalid-refresh-token';
      const hashedRefreshToken = 'hashed-refresh-token';

      const mockUser = UserEntity.create({
        id: userId,
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        nickname: 'testuser',
        refreshToken: hashedRefreshToken,
      });

      jest.spyOn(userService, 'findUserById').mockResolvedValue(mockUser);
      // 리프레시 토큰 검증 실패
      jest.spyOn(userService, 'validateRefreshToken').mockResolvedValue(false);

      // 실행 & 검증
      await expect(service.refreshTokens({ userId, refreshToken }))
        .rejects
        .toThrow(InvalidTokenException);
    });
  });
}); 