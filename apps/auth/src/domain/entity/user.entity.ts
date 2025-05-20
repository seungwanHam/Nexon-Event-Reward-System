import { UserRole, UserStatus } from '../../../../../libs/common/src/enum';
import { 
  InvalidStatusTransitionException, 
  InvalidRoleAssignmentException, 
  ValidationException 
} from '../../../../../libs/common/src/exception';

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
  publicId?: string;
  statusChangedAt?: Date;

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
    this.publicId = props.publicId;
    this.statusChangedAt = props.statusChangedAt;
  }

  /**
   * 새로운 사용자 엔티티를 생성합니다.
   * @throws {ValidationException} 유효성 검증에 실패한 경우
   */
  static create(props: Partial<UserEntity>): UserEntity {
    const user = new UserEntity(props);
    user.validate();
    return user;
  }

  /**
   * 사용자 엔티티의 유효성을 검증합니다.
   * @throws {ValidationException} 유효성 검증에 실패한 경우
   */
  private validate(): void {
    // 필수 필드 검증
    if (!this.email) {
      throw new ValidationException('이메일은 필수 입력 사항입니다.');
    }

    if (!this.nickname) {
      throw new ValidationException('닉네임은 필수 입력 사항입니다.');
    }

    // 이메일 형식 검증
    if (!this.isValidEmail(this.email)) {
      throw new ValidationException('유효하지 않은 이메일 형식입니다.');
    }

    // 닉네임 길이 검증
    if (this.nickname.length < 2 || this.nickname.length > 20) {
      throw new ValidationException('닉네임은 2자 이상 20자 이하여야 합니다.');
    }

    // 역할 검증
    if (!this.roles || this.roles.length === 0) {
      throw new ValidationException('최소 하나 이상의 역할이 필요합니다.');
    }

    // 역할 할당 규칙 검증
    if (!this.isValidRoleAssignment(this.roles)) {
      throw new ValidationException('유효하지 않은 역할 할당입니다.');
    }
  }

  /**
   * 이메일 형식이 유효한지 검증합니다.
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * 사용자의 로그인 정보를 업데이트합니다.
   * @throws {InvalidStatusTransitionException} 비활성화된 사용자인 경우
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
   * @throws {InvalidStatusTransitionException} 유효하지 않은 상태 전이인 경우
   */
  changeStatus(newStatus: UserStatus): void {
    // 상태 전이 규칙 검증
    if (!this.isValidStatusTransition(newStatus)) {
      throw new InvalidStatusTransitionException('잘못된 상태 전이입니다.');
    }
    this.status = newStatus;
    this.statusChangedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 사용자 역할을 업데이트합니다.
   * @throws {InvalidRoleAssignmentException} 유효하지 않은 역할 할당인 경우
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
   * @throws {ValidationException} 유효성 검증에 실패한 경우
   */
  update(props: Partial<Omit<UserEntity, 'id' | 'createdAt'>>): void {
    const oldEmail = this.email;
    const oldNickname = this.nickname;

    if (props.email) this.email = props.email;
    if (props.nickname) this.nickname = props.nickname;
    if (props.passwordHash) this.passwordHash = props.passwordHash;
    if (props.metadata) this.metadata = { ...this.metadata, ...props.metadata };
    this.updatedAt = new Date();

    // 이메일이나 닉네임이 변경된 경우 유효성 검증
    if (oldEmail !== this.email || oldNickname !== this.nickname) {
      this.validate();
    }
  }

  /**
   * 초대 코드를 생성합니다.
   * @throws {InvalidStatusTransitionException} 비활성화된 사용자인 경우
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

  /**
   * 사용자가 활성 상태인지 확인합니다.
   */
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  /**
   * 사용자가 특정 역할을 가지고 있는지 확인합니다.
   */
  hasRole(role: UserRole): boolean {
    return this.roles.includes(role);
  }

  /**
   * 상태 전이가 유효한지 검증합니다.
   */
  private isValidStatusTransition(newStatus: UserStatus): boolean {
    // 같은 상태로 변경하는 경우는 허용
    if (this.status === newStatus) return true;

    // 상태 전이 규칙 정의
    const validTransitions = {
      [UserStatus.PENDING]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
      [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
      [UserStatus.INACTIVE]: [UserStatus.ACTIVE],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
    };

    return validTransitions[this.status]?.includes(newStatus) ?? false;
  }

  /**
   * 역할 할당이 유효한지 검증합니다.
   */
  private isValidRoleAssignment(roles: UserRole[]): boolean {
    // 빈 역할 배열은 허용하지 않음
    if (roles.length === 0) return false;

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