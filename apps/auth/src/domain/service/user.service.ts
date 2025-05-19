import * as bcrypt from 'bcrypt';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

// DTO
import { RegisterRequestDto, UpdateUserRequestDto, ProfileResponseDto } from '@app/auth/presentation/dto';

// Repository
import { UserRepository, USER_REPOSITORY } from '@app/auth/domain/repository';

// Entity
import { UserEntity } from '@app/auth/domain/entity';

// Schema
import { UserRole, UserStatus } from '@app/libs/common/schema';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository
  ) { }

  /**
   * 새로운 사용자를 생성합니다.
   */
  async createUser(dto: RegisterRequestDto): Promise<UserEntity> {
    // 중복 확인
    const exists = await this.userRepository.exists({ email: dto.email });
    if (exists) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    // 비밀번호 해싱
    const hashedPassword = await this.hashPassword(dto.password);

    // 사용자 엔티티 생성
    const user = UserEntity.create({
      email: dto.email,
      passwordHash: hashedPassword,
      nickname: dto.nickname,
      roles: dto.roles || [UserRole.USER],
      status: UserStatus.ACTIVE,
    });

    // 사용자 저장
    return await this.userRepository.create(user);
  }

  /**
   * ID로 사용자를 조회합니다.
   */
  async findUserById(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }
    return user;
  }

  /**
   * 이메일로 사용자를 조회합니다.
   */
  async findUserByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }
    return user;
  }

  /**
   * 사용자의 마지막 로그인 시간을 업데이트합니다.
   */
  async updateUserLastLogin(userId: string): Promise<UserEntity> {
    const user = await this.findUserById(userId);

    // 엔티티 로직을 통한 로그인 정보 업데이트
    user.updateLoginInfo();

    // 변경된 엔티티 저장
    return await this.userRepository.save(user);
  }

  /**
   * 사용자의 리프레시 토큰을 업데이트합니다.
   */
  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    const user = await this.findUserById(userId);

    if (refreshToken) {
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      user.setRefreshToken(hashedRefreshToken);
    } else {
      user.setRefreshToken(null);
    }

    await this.userRepository.save(user);
  }

  /**
   * 리프레시 토큰의 유효성을 검증합니다.
   */
  async validateRefreshToken(refreshToken: string, hashedRefreshToken: string): Promise<boolean> {
    return bcrypt.compare(refreshToken, hashedRefreshToken);
  }

  /**
   * 사용자 인증 정보를 검증합니다.
   */
  async validateUserCredentials(email: string, password: string): Promise<UserEntity> {
    const user = await this.findUserByEmail(email);

    // 비밀번호 검증
    const isPasswordValid = await this.validatePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 사용자 상태 검증
    if (!user.isActive()) {
      throw new BadRequestException('비활성화된 계정입니다');
    }

    return user;
  }

  /**
   * 사용자 정보를 업데이트합니다.
   */
  async updateUser(userId: string, dto: UpdateUserRequestDto): Promise<UserEntity> {
    const user = await this.findUserById(userId);

    // 이메일 중복 확인
    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepository.exists({ email: dto.email });
      if (exists) {
        throw new ConflictException('이미 사용 중인 이메일입니다');
      }
    }

    // 비밀번호 해싱
    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await this.hashPassword(dto.password);
    }

    // 엔티티 업데이트
    user.update({
      email: dto.email,
      nickname: dto.nickname,
      passwordHash: hashedPassword,
      metadata: dto.metadata,
    });

    // 역할 업데이트
    if (dto.roles) {
      user.updateRoles(dto.roles);
    }

    // 상태 업데이트
    if (dto.status) {
      user.changeStatus(dto.status);
    }

    return await this.userRepository.save(user);
  }

  /**
   * 사용자 프로필을 조회합니다.
   */
  async getUserProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.findUserById(userId);

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      roles: user.roles,
      status: user.status,
      metadata: user.metadata,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * 모든 사용자를 조회합니다.
   */
  async findAllUsers(): Promise<UserEntity[]> {
    return await this.userRepository.findAll();
  }

  /**
   * 비밀번호를 해싱합니다.
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * 비밀번호를 검증합니다.
   */
  private async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
} 