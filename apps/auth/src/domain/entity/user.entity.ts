import { UserRole, UserStatus } from '@app/libs/common/schema';
import { InvalidStatusTransitionException, InvalidRoleAssignmentException } from '@app/libs/common/exception';

export class UserEntity {
  readonly id: string;
  email: string;
  passwordHash: string;
  nickname: string;
  roles: UserRole[];
  status: UserStatus;
  lastLoginAt?: Date;
  refreshToken?: string;
  inviteCode?: string;
  invitedBy?: string;
  metadata: Record<string, any>;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: Partial<UserEntity>) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.nickname = props.nickname;
    this.roles = props.roles || [UserRole.USER];
    this.status = props.status || UserStatus.ACTIVE;
    this.lastLoginAt = props.lastLoginAt;
    this.refreshToken = props.refreshToken;
    this.inviteCode = props.inviteCode;
    this.invitedBy = props.invitedBy;
    this.metadata = props.metadata || {};
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * 새로운 사용자 엔티티를 생성합니다.
   */
  static create(props: Partial<UserEntity>): UserEntity {
    return new UserEntity(props);
  }

  /**
   * 사용자의 로그인 정보를 업데이트합니다.
   */
  updateLoginInfo(): void {
    if (!this.isActive()) {
      throw new InvalidStatusTransitionException('비활성화된 사용자는 로그인할 수 없습니다.');
    }
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 리프레시 토큰을 업데이트합니다.
   */
  setRefreshToken(hashedToken: string | null): void {
    this.refreshToken = hashedToken;
    this.updatedAt = new Date();
  }

  /**
   * 사용자 상태를 변경합니다.
   */
  changeStatus(newStatus: UserStatus): void {
    // 상태 전이 규칙 검증
    if (!this.isValidStatusTransition(newStatus)) {
      throw new InvalidStatusTransitionException('잘못된 상태 전이입니다.');
    }
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  /**
   * 사용자 역할을 업데이트합니다.
   */
  updateRoles(newRoles: UserRole[]): void {
    // 역할 검증
    if (!this.isValidRoleAssignment(newRoles)) {
      throw new InvalidRoleAssignmentException('잘못된 역할 할당입니다.');
    }
    this.roles = newRoles;
    this.updatedAt = new Date();
  }

  /**
   * 사용자 정보를 업데이트합니다.
   */
  update(props: Partial<Omit<UserEntity, 'id' | 'createdAt'>>): void {
    if (props.email) this.email = props.email;
    if (props.nickname) this.nickname = props.nickname;
    if (props.passwordHash) this.passwordHash = props.passwordHash;
    if (props.metadata) this.metadata = { ...this.metadata, ...props.metadata };
    this.updatedAt = new Date();
  }

  /**
   * 초대 코드를 생성합니다.
   */
  generateInviteCode(): string {
    if (!this.isActive()) {
      throw new InvalidStatusTransitionException('비활성화된 사용자는 초대 코드를 생성할 수 없습니다.');
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let inviteCode = '';
    for (let i = 0; i < 6; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.inviteCode = inviteCode;
    this.updatedAt = new Date();
    return inviteCode;
  }

  /**
   * 메타데이터를 업데이트합니다.
   */
  updateMetadata(key: string, value: any): void {
    this.metadata = { ...this.metadata, [key]: value };
    this.updatedAt = new Date();
  }

  // 상태 검증 메서드들
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  hasRole(role: UserRole): boolean {
    return this.roles.includes(role);
  }

  private isValidStatusTransition(newStatus: UserStatus): boolean {
    // 상태 전이 규칙 정의
    const validTransitions = {
      [UserStatus.PENDING]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
      [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
      [UserStatus.INACTIVE]: [UserStatus.ACTIVE],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
    };

    return validTransitions[this.status]?.includes(newStatus) ?? false;
  }

  private isValidRoleAssignment(roles: UserRole[]): boolean {
    // 역할 할당 규칙 정의
    const hasAdmin = roles.includes(UserRole.ADMIN);
    const hasUser = roles.includes(UserRole.USER);

    // 기본 규칙: 모든 사용자는 USER 역할을 가져야 함
    if (!hasUser) return false;

    // ADMIN 역할은 다른 특수 역할과 함께 할당될 수 없음
    if (hasAdmin && roles.length > 2) return false;

    return true;
  }
} 