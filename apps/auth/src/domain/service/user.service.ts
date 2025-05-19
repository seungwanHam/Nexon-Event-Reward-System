import * as bcrypt from 'bcrypt';
import { Inject, Injectable } from '@nestjs/common';
import { RegisterRequestDto, UpdateUserRequestDto, ProfileResponseDto } from '@app/auth/presentation/dto';
import { UserRepository, USER_REPOSITORY } from '@app/auth/domain/repository';
import { UserEntity } from '@app/auth/domain/entity';
import { UserStatus } from '@app/libs/common/enum';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UserNotFoundException,
  InvalidUserStatusException
} from '@app/libs/common/exception';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly logger: WinstonLoggerService
  ) { }

  /**
   * 새로운 사용자를 생성합니다.
   */
  async createUser(registerDto: RegisterRequestDto): Promise<UserEntity> {
    try {
      const { email, nickname, password, roles } = registerDto;
      this.logger.debug(`[UserService] 사용자 생성 시도`, {
        email,
        nickname
      });

      // 중복 확인
      const exists = await this.userRepository.exists({ email });
      if (exists) {
        this.logger.warn(`[UserService] 이메일 중복`, {
          email,
          error: 'EmailAlreadyExistsException'
        });
        throw new EmailAlreadyExistsException('이미 사용 중인 이메일입니다');
      }

      // 비밀번호 해싱
      const hashedPassword = await this.hashPassword(password);

      // 사용자 엔티티 생성
      const user = UserEntity.create({
        email: email,
        passwordHash: hashedPassword,
        nickname: nickname,
        roles: roles,
        status: UserStatus.ACTIVE,
      });

      // 사용자 저장
      const savedUser = await this.userRepository.create(user);

      this.logger.debug(`[UserService] 사용자 생성 완료`, {
        userId: savedUser.id,
        email: savedUser.email
      });

      return savedUser;
    } catch (error) {
      if (error instanceof EmailAlreadyExistsException) {
        throw error;
      }

      this.logger.error(`[UserService] 사용자 생성 실패`, {
        email: registerDto.email,
        error: error.name,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * ID로 사용자를 조회합니다.
   */
  async findUserById(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.error(`[UserService] 사용자를 찾을 수 없음`, {
        userId,
        error: 'UserNotFoundException',
        message: '사용자를 찾을 수 없습니다'
      });
      throw new UserNotFoundException('사용자를 찾을 수 없습니다');
    }
    return user;
  }

  /**
   * 이메일로 사용자를 조회합니다.
   */
  async findUserByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.error(`[UserService] 사용자를 찾을 수 없음`, {
        email,
        error: 'UserNotFoundException',
        message: '사용자를 찾을 수 없습니다'
      });
      throw new UserNotFoundException('사용자를 찾을 수 없습니다');
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
      this.logger.error(`[UserService] 잘못된 인증 정보`, {
        email,
        error: 'InvalidCredentialsException',
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
      throw new InvalidCredentialsException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    // 사용자 상태 검증
    if (!user.isActive()) {
      this.logger.error(`[UserService] 유효하지 않은 사용자 상태`, {
        userId: user.id,
        status: user.status,
        error: 'InvalidUserStatusException'
      });
      throw new InvalidUserStatusException(user.id, user.status);
    }

    return user;
  }

  /**
   * 사용자 정보를 업데이트합니다.
   */
  async updateUser(userId: string, updateUserDto: UpdateUserRequestDto): Promise<UserEntity> {
    const { email, nickname, password, roles, status, metadata } = updateUserDto;
    const user = await this.findUserById(userId);

    // 이메일 중복 확인
    if (email && email !== user.email) {
      const exists = await this.userRepository.exists({ email: email });
      if (exists) {
        this.logger.error(`[UserService] 이메일 중복 발생`, {
          userId,
          email: email,
          error: 'EmailAlreadyExistsException',
          message: '이미 사용 중인 이메일입니다'
        });
        throw new EmailAlreadyExistsException('이미 사용 중인 이메일입니다');
      }
    }

    // 비밀번호 해싱
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await this.hashPassword(password);
    }

    // 엔티티 업데이트
    user.update({
      email: email,
      nickname: nickname,
      passwordHash: hashedPassword,
      metadata: metadata,
    });

    // 역할 업데이트
    if (roles) {
      user.updateRoles(roles);
    }

    // 상태 업데이트
    if (status) {
      user.changeStatus(status);
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
      lastLoginAt: new Date(user.lastLoginAt)?.toISOString(),
      createdAt: new Date(user.createdAt)?.toISOString(),
      updatedAt: new Date(user.updatedAt)?.toISOString(),
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