import { UserEntity } from './user.entity';

// Schema
import { UserRole, UserStatus } from '@app/infrastructure/database/schema';

describe('UserEntity 테스트', () => {
  let user: UserEntity;

  beforeEach(() => {
    user = new UserEntity({
      id: 'user-id-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      nickname: 'testuser',
      roles: [UserRole.USER],
      status: UserStatus.ACTIVE,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    });
  });

  describe('생성자', () => {
    it('모든 속성으로 사용자 엔티티를 올바르게 생성해야 함', () => {
      // 준비
      const now = new Date();
      const fullUser = new UserEntity({
        id: 'user-id-456',
        email: 'full@example.com',
        passwordHash: 'full-hash',
        nickname: 'fulluser',
        roles: [UserRole.ADMIN],
        status: UserStatus.INACTIVE,
        lastLoginAt: now,
        refreshToken: 'refresh-token',
        inviteCode: 'INVITE123',
        invitedBy: 'user-id-123',
        metadata: { key: 'value' },
        createdAt: now,
        updatedAt: now,
      });

      // 검증
      expect(fullUser.id).toBe('user-id-456');
      expect(fullUser.email).toBe('full@example.com');
      expect(fullUser.passwordHash).toBe('full-hash');
      expect(fullUser.nickname).toBe('fulluser');
      expect(fullUser.roles).toEqual([UserRole.ADMIN]);
      expect(fullUser.status).toBe(UserStatus.INACTIVE);
      expect(fullUser.lastLoginAt).toBe(now);
      expect(fullUser.refreshToken).toBe('refresh-token');
      expect(fullUser.inviteCode).toBe('INVITE123');
      expect(fullUser.invitedBy).toBe('user-id-123');
      expect(fullUser.metadata).toEqual({ key: 'value' });
      expect(fullUser.createdAt).toBe(now);
      expect(fullUser.updatedAt).toBe(now);
    });

    it('기본값이 제대로 설정되어야 함', () => {
      // 준비
      const minimalUser = new UserEntity({
        email: 'minimal@example.com',
        passwordHash: 'minimal-hash',
        nickname: 'minimaluser',
      });

      // 검증
      expect(minimalUser.roles).toEqual([UserRole.USER]);
      expect(minimalUser.status).toBe(UserStatus.ACTIVE);
      expect(minimalUser.metadata).toEqual({});
      expect(minimalUser.createdAt).toBeInstanceOf(Date);
      expect(minimalUser.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateLoginInfo 메서드', () => {
    it('마지막 로그인 시간을 현재 시간으로 업데이트해야 함', () => {
      // 준비
      const beforeUpdate = user.lastLoginAt;
      const mockDate = new Date('2023-02-01');
      jest.spyOn(global, 'Date').mockImplementationOnce(() => mockDate);

      // 실행
      user.updateLoginInfo();

      // 검증
      expect(user.lastLoginAt).toEqual(mockDate);
      expect(user.lastLoginAt).not.toBe(beforeUpdate);

      // 정리
      jest.restoreAllMocks();
    });
  });

  describe('setRefreshToken 메서드', () => {
    it('리프레시 토큰을 설정해야 함', () => {
      // 실행
      user.setRefreshToken('new-refresh-token');

      // 검증
      expect(user.refreshToken).toBe('new-refresh-token');
    });
  });

  describe('removeRefreshToken 메서드', () => {
    it('리프레시 토큰을 제거해야 함', () => {
      // 준비
      user.refreshToken = 'existing-token';

      // 실행
      user.removeRefreshToken();

      // 검증
      expect(user.refreshToken).toBeNull();
    });
  });

  describe('changeStatus 메서드', () => {
    it('사용자 상태를 변경해야 함', () => {
      // 실행
      user.changeStatus(UserStatus.INACTIVE);

      // 검증
      expect(user.status).toBe(UserStatus.INACTIVE);
    });
  });

  describe('hasRole 메서드', () => {
    it('사용자가 특정 역할을 가지고 있는 경우 true를 반환해야 함', () => {
      // 준비
      user.roles = [UserRole.USER, UserRole.ADMIN];

      // 실행 & 검증
      expect(user.hasRole(UserRole.ADMIN)).toBe(true);
    });

    it('사용자가 특정 역할을 가지고 있지 않은 경우 false를 반환해야 함', () => {
      // 준비
      user.roles = [UserRole.USER];

      // 실행 & 검증
      expect(user.hasRole(UserRole.ADMIN)).toBe(false);
    });
  });

  describe('isActive 메서드', () => {
    it('사용자 상태가 활성인 경우 true를 반환해야 함', () => {
      // 준비
      user.status = UserStatus.ACTIVE;

      // 실행 & 검증
      expect(user.isActive()).toBe(true);
    });

    it('사용자 상태가 비활성인 경우 false를 반환해야 함', () => {
      // 준비
      user.status = UserStatus.INACTIVE;

      // 실행 & 검증
      expect(user.isActive()).toBe(false);
    });
  });

  describe('generateInviteCode 메서드', () => {
    it('6자리 초대 코드를 생성하고 반환해야 함', () => {
      // 실행
      const code = user.generateInviteCode();

      // 검증
      expect(code).toBe(user.inviteCode);
      expect(code.length).toBe(6);
      expect(/^[A-HJ-NP-Z2-9]{6}$/.test(code)).toBe(true);
    });

    it('새 코드를 생성할 때마다 다른 코드가 생성되어야 함', () => {
      // 준비
      jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.4)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.3);

      // 실행
      const code1 = user.generateInviteCode();

      jest.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.4);

      const code2 = user.generateInviteCode();

      // 검증
      expect(code1).not.toBe(code2);

      // 정리
      jest.restoreAllMocks();
    });
  });

  describe('updateMetadata 메서드', () => {
    it('새로운 메타데이터를 추가해야 함', () => {
      // 준비
      user.metadata = { existing: 'value' };

      // 실행
      user.updateMetadata('newKey', 'newValue');

      // 검증
      expect(user.metadata).toEqual({
        existing: 'value',
        newKey: 'newValue',
      });
    });

    it('기존 메타데이터를 업데이트해야 함', () => {
      // 준비
      user.metadata = { key: 'old-value' };

      // 실행
      user.updateMetadata('key', 'new-value');

      // 검증
      expect(user.metadata).toEqual({ key: 'new-value' });
    });
  });
}); 