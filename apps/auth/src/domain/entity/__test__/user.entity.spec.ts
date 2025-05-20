import { UserEntity } from '../user.entity';
import { UserRole, UserStatus } from '../../../../../../libs/common/src/enum';
import { 
  ValidationException, 
  InvalidStatusTransitionException,
  InvalidRoleAssignmentException
} from '../../../../../../libs/common/src/exception';

describe('UserEntity 테스트', () => {
  let user: UserEntity;

  beforeEach(() => {
    // static create 메서드를 사용하여 사용자 엔티티 생성
    user = UserEntity.create({
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
      const now = new Date();
      const userData = {
        id: 'test-id',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'tester',
        roles: [UserRole.USER],
        status: UserStatus.ACTIVE,
        lastLoginAt: now,
        refreshToken: 'refresh_token',
        inviteCode: 'INVITE',
        invitedBy: 'inviter-id',
        metadata: { key: 'value' },
        createdAt: now,
        updatedAt: now,
        publicId: 'public-id',
        statusChangedAt: now,
      };

      const user = UserEntity.create(userData);

      expect(user.id).toBe(userData.id);
      expect(user.email).toBe(userData.email);
      expect(user.passwordHash).toBe(userData.passwordHash);
      expect(user.nickname).toBe(userData.nickname);
      expect(user.roles).toEqual(userData.roles);
      expect(user.status).toBe(userData.status);
      expect(user.lastLoginAt).toBe(userData.lastLoginAt);
      expect(user.refreshToken).toBe(userData.refreshToken);
      expect(user.inviteCode).toBe(userData.inviteCode);
      expect(user.invitedBy).toBe(userData.invitedBy);
      expect(user.metadata).toEqual(userData.metadata);
      expect(user.createdAt).toBe(userData.createdAt);
      expect(user.updatedAt).toBe(userData.updatedAt);
      expect(user.publicId).toBe(userData.publicId);
      expect(user.statusChangedAt).toBe(userData.statusChangedAt);
    });

    it('필수 속성만으로 사용자 엔티티를 생성해야 함', () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'tester',
      };

      const user = UserEntity.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.passwordHash).toBe(userData.passwordHash);
      expect(user.nickname).toBe(userData.nickname);
      expect(user.roles).toEqual([UserRole.USER]);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.metadata).toEqual({});
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('유효하지 않은 이메일로 생성 시 예외를 발생시켜야 함', () => {
      const userData = {
        email: 'invalid-email',
        passwordHash: 'hashed_password',
        nickname: 'tester',
      };

      expect(() => UserEntity.create(userData)).toThrow(ValidationException);
    });

    it('유효하지 않은 닉네임 길이로 생성 시 예외를 발생시켜야 함', () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'a', // 2자 미만
      };

      expect(() => UserEntity.create(userData)).toThrow(ValidationException);
    });
  });

  describe('updateLoginInfo 메서드', () => {
    it('로그인 정보를 올바르게 업데이트해야 함', () => {
      const user = UserEntity.create({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'tester',
      });

      const beforeUpdate = user.updatedAt;
      user.updateLoginInfo();

      expect(user.lastLoginAt).toBeDefined();
      expect(user.updatedAt).not.toBe(beforeUpdate);
    });

    it('비활성 사용자의 로그인 시도 시 예외를 발생시켜야 함', () => {
      const user = UserEntity.create({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'tester',
        status: UserStatus.INACTIVE,
      });

      expect(() => user.updateLoginInfo()).toThrow(InvalidStatusTransitionException);
    });
  });

  describe('setRefreshToken 메서드', () => {
    it('리프레시 토큰을 설정해야 함', () => {
      // 실행
      user.setRefreshToken('new-refresh-token');

      // 검증
      expect(user.refreshToken).toBe('new-refresh-token');
    });

    it('리프레시 토큰을 null로 설정할 수 있어야 함', () => {
      // 준비
      user.setRefreshToken('existing-token');

      // 실행
      user.setRefreshToken(null);

      // 검증
      expect(user.refreshToken).toBeNull();
    });
  });

  describe('changeStatus 메서드', () => {
    it('유효한 상태 전이를 허용해야 함', () => {
      const user = UserEntity.create({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'tester',
      });

      const beforeUpdate = user.updatedAt;
      user.changeStatus(UserStatus.INACTIVE);

      expect(user.status).toBe(UserStatus.INACTIVE);
      expect(user.statusChangedAt).toBeDefined();
      expect(user.updatedAt).not.toBe(beforeUpdate);
    });

    it('유효하지 않은 상태 전이에 대해 예외를 발생시켜야 함', () => {
      const user = UserEntity.create({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'tester',
        status: UserStatus.ACTIVE,
      });

      expect(() => user.changeStatus(UserStatus.PENDING)).toThrow(InvalidStatusTransitionException);
    });
  });

  describe('hasRole 메서드', () => {
    it('사용자가 특정 역할을 가지고 있는 경우 true를 반환해야 함', () => {
      // 준비
      user = UserEntity.create({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        nickname: 'testuser',
        roles: [UserRole.USER, UserRole.ADMIN]
      });

      // 실행 & 검증
      expect(user.hasRole(UserRole.ADMIN)).toBe(true);
    });

    it('사용자가 특정 역할을 가지고 있지 않은 경우 false를 반환해야 함', () => {
      // 실행 & 검증
      expect(user.hasRole(UserRole.ADMIN)).toBe(false);
    });
  });

  describe('isActive 메서드', () => {
    it('사용자 상태가 활성인 경우 true를 반환해야 함', () => {
      // 실행 & 검증
      expect(user.isActive()).toBe(true);
    });

    it('사용자 상태가 비활성인 경우 false를 반환해야 함', () => {
      // 준비
      user.changeStatus(UserStatus.INACTIVE);

      // 실행 & 검증
      expect(user.isActive()).toBe(false);
    });
  });

  describe('generateInviteCode 메서드', () => {
    it('초대 코드를 올바르게 생성해야 함', () => {
      const user = UserEntity.create({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'tester',
      });

      const inviteCode = user.generateInviteCode();

      expect(inviteCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(user.inviteCode).toBe(inviteCode);
    });

    it('비활성 사용자의 초대 코드 생성 시도 시 예외를 발생시켜야 함', () => {
      const user = UserEntity.create({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        nickname: 'tester',
        status: UserStatus.INACTIVE,
      });

      expect(() => user.generateInviteCode()).toThrow(InvalidStatusTransitionException);
    });
  });

  describe('updateMetadata 메서드', () => {
    it('새 메타데이터를 추가해야 함', () => {
      // 실행
      user.updateMetadata('testKey', 'testValue');

      // 검증
      expect(user.metadata.testKey).toBe('testValue');
    });

    it('기존 메타데이터를 업데이트해야 함', () => {
      // 준비
      user.updateMetadata('existingKey', 'originalValue');

      // 실행
      user.updateMetadata('existingKey', 'updatedValue');

      // 검증
      expect(user.metadata.existingKey).toBe('updatedValue');
    });

    it('null 값으로 메타데이터를 설정해도 해당 키는 유지됨', () => {
      // 준비
      user.updateMetadata('keyToSet', 'someValue');
      
      // 실행
      user.updateMetadata('keyToSet', null);
      
      // 검증
      expect(user.metadata.keyToSet).toBe(null);
    });
  });

  describe('updateRoles 메서드', () => {
    it('새로운 역할을 추가해야 함', () => {
      // 실행
      user.updateRoles([...user.roles, UserRole.ADMIN]);

      // 검증
      expect(user.roles).toContain(UserRole.ADMIN);
    });

    it('이미 가지고 있는 역할을 중복 추가해도 정상적으로 설정되어야 함', () => {
      // 준비
      user.updateRoles([...user.roles, UserRole.ADMIN]);
      
      // 실행
      const newRoles = [...user.roles];
      user.updateRoles(newRoles);
      
      // 검증
      expect(user.roles).toEqual(newRoles);
    });

    it('비활성 사용자의 역할 변경 시 예외 발생 여부 확인', () => {
      // 준비
      user = UserEntity.create({
        id: 'user-id-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        nickname: 'testuser',
        roles: [UserRole.USER],
        status: UserStatus.INACTIVE,
      });

      const newRoles = [UserRole.USER, UserRole.ADMIN];

      // 실행 & 검증 - updateRoles 메서드는 isActive를 확인하지 않으므로 예외가 발생하지 않아야 함
      user.updateRoles(newRoles);
      expect(user.roles).toEqual(newRoles);
    });
  });

  describe('update 메서드', () => {
    it('사용자 정보를 업데이트해야 함', () => {
      // 실행
      user.update({
        nickname: 'newNickname',
        passwordHash: 'new-password-hash'
      });

      // 검증
      expect(user.nickname).toBe('newNickname');
      expect(user.passwordHash).toBe('new-password-hash');
    });

    it('유효하지 않은 닉네임 길이로 업데이트 시 예외를 발생시켜야 함', () => {
      // 실행 & 검증
      expect(() => user.update({ nickname: 'a' })).toThrow(ValidationException);
    });
  });
}); 