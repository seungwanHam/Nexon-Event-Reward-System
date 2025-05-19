import { UserEntity } from '@app/auth/domain/entity';
import { UserRole, UserStatus } from '@app/libs/common/enum';

export interface UserRepository {
  /**
   * 새로운 사용자를 생성합니다.
   * @throws {ConflictException} 이미 존재하는 이메일인 경우
   */
  create(user: Omit<UserEntity, 'id'>): Promise<UserEntity>;

  /**
   * ID로 사용자를 조회합니다.
   * @throws {NotFoundException} 사용자를 찾을 수 없는 경우
   */
  findById(id: string): Promise<UserEntity>;

  /**
   * 이메일로 사용자를 조회합니다.
   * @throws {NotFoundException} 사용자를 찾을 수 없는 경우
   */
  findByEmail(email: string): Promise<UserEntity>;

  /**
   * 특정 조건의 사용자가 존재하는지 확인합니다.
   */
  exists(criteria: {
    email?: string;
    nickname?: string;
    excludeId?: string;
  }): Promise<boolean>;

  /**
   * 특정 역할을 가진 사용자 목록을 조회합니다.
   */
  findByRole(role: UserRole): Promise<UserEntity[]>;

  /**
   * 특정 상태의 사용자 목록을 조회합니다.
   */
  findByStatus(status: UserStatus): Promise<UserEntity[]>;

  /**
   * 사용자의 인증 관련 정보를 업데이트합니다.
   */
  updateAuthenticationInfo(
    userId: string,
    data: {
      refreshToken?: string | null;
      lastLoginAt?: Date;
    }
  ): Promise<void>;

  /**
   * 사용자 엔티티를 저장합니다.
   * @throws {OptimisticLockException} 동시성 충돌이 발생한 경우
   */
  save(user: UserEntity): Promise<UserEntity>;

  /**
   * 특정 기간 동안 로그인하지 않은 휴면 계정을 조회합니다.
   */
  findInactiveUsers(criteria: {
    lastLoginBefore: Date;
    status?: UserStatus;
  }): Promise<UserEntity[]>;

  /**
   * 초대 코드로 사용자를 조회합니다.
   */
  findByInviteCode(inviteCode: string): Promise<UserEntity | null>;

  /**
   * 모든 사용자를 조회합니다.
   */
  findAll(): Promise<UserEntity[]>;
} 