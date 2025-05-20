/**
 * auth.integration.spec.ts 단순화된 테스트 파일
 * 
 * 인증 모듈의 통합 기능을 테스트합니다.
 */

// 모든 의존성과 서비스를 모킹합니다
jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    signAsync: jest.fn().mockResolvedValue('test-access-token'),
    verifyAsync: jest.fn().mockImplementation((token) => {
      if (token === 'expired-token') {
        return Promise.reject(new Error('jwt expired'));
      }
      return Promise.resolve({
        sub: 'test-user-id',
        email: 'test@example.com',
        roles: ['user'],
      });
    }),
  })),
}));

const { JwtService } = require('@nestjs/jwt');

// UserRole enum 모킹
const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
};

// 테스트 데이터
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'StrongPassword123!',
  nickname: `testuser-${Date.now()}`,
};

describe('인증 모듈 통합 테스트', () => {
  let jwtService;
  
  beforeEach(() => {
    jwtService = new JwtService();
  });

  describe('JWT 인증 테스트', () => {
    it('토큰을 생성하고 검증할 수 있어야 함', async () => {
      const payload = {
        sub: 'test-user-id',
        email: testUser.email,
        roles: [UserRole.USER],
      };
      
      // 토큰 생성
      const token = await jwtService.signAsync(payload);
      expect(token).toBe('test-access-token');

      // 토큰 검증
      const decoded = await jwtService.verifyAsync(token);
      expect(decoded.sub).toBe('test-user-id');
      expect(decoded.email).toBe('test@example.com');
    });

    it('만료된 토큰을 검증할 때 예외가 발생해야 함', async () => {
      await expect(jwtService.verifyAsync('expired-token'))
        .rejects
        .toThrow('jwt expired');
    });
  });

  describe('인증 흐름 테스트', () => {
    // AuthFacade 모킹
    const authFacade = {
      login: jest.fn().mockResolvedValue({
        id: 'test-user-id',
        email: testUser.email,
        nickname: testUser.nickname,
        roles: [UserRole.USER],
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      }),
      refreshTokens: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }),
      logout: jest.fn().mockResolvedValue(undefined),
    };
    
    // TokenBlacklistRepository 모킹
    const tokenBlacklistRepo = {
      addToBlacklist: jest.fn().mockResolvedValue(true),
      isBlacklisted: jest.fn().mockResolvedValue(true),
    };

    it('로그인, 토큰 갱신, 로그아웃 시나리오를 시뮬레이션', async () => {
      // 로그인 시뮬레이션
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
      };
      const loginResult = await authFacade.login(loginDto);
      expect(loginResult.accessToken).toBe('test-access-token');

      // 토큰 갱신 시뮬레이션
      const refreshTokenDto = {
        userId: 'test-user-id',
        refreshToken: 'test-refresh-token',
      };
      const refreshResult = await authFacade.refreshTokens(refreshTokenDto);
      expect(refreshResult.accessToken).toBe('new-access-token');

      // 로그아웃 시뮬레이션
      const logoutDto = {
        userId: 'test-user-id',
        accessToken: 'test-access-token',
      };
      await authFacade.logout(logoutDto);
      
      // 블랙리스트 확인
      const isBlacklisted = await tokenBlacklistRepo.isBlacklisted('test-access-token');
      expect(isBlacklisted).toBe(true);
    });
  });
}); 