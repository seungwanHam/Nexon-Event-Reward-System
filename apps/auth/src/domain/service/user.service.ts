import * as bcrypt from 'bcrypt';
import { Inject, Injectable } from '@nestjs/common';
import { RegisterRequestDto, UpdateUserRequestDto, ProfileResponseDto } from '../../presentation/dto';
import { UserRepository, USER_REPOSITORY } from '../../domain/repository';
import { UserEntity } from '../../domain/entity';
import { UserStatus } from '../../../../../libs/common/src/enum';
import { EmailAlreadyExistsException, InvalidCredentialsException, UserNotFoundException, InvalidUserStatusException } from '../../../../../libs/common/src/exception';
import { WinstonLoggerService } from '../../../../../libs/infrastructure/src/logger';

/**
 * 사용자 서비스
 * 
 * 사용자 관리, 인증, 프로필 관련 비즈니스 로직을 처리하는 도메인 서비스입니다.
 * 사용자 생성, 조회, 수정, 인증 검증 등의 기능을 담당합니다.
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly logger: WinstonLoggerService
  ) { }

  /**
   * 새로운 사용자를 생성합니다.
   * 
   * 이메일 중복을 검사하고, 비밀번호를 해싱하여 새로운 사용자를 저장합니다.
   * 
   * @param registerDto - 사용자 등록 정보가 담긴 DTO
   * @returns 생성된 사용자 엔티티
   * @throws EmailAlreadyExistsException - 이미 등록된 이메일인 경우
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
   * 
   * @param userId - 조회할 사용자 ID
   * @returns 조회된 사용자 엔티티
   * @throws UserNotFoundException - 사용자를 찾을 수 없는 경우
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
   * 
   * @param email - 조회할 사용자 이메일
   * @returns 조회된 사용자 엔티티
   * @throws UserNotFoundException - 사용자를 찾을 수 없는 경우
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
   * 
   * @param userId - 업데이트할 사용자 ID
   * @returns 업데이트된 사용자 엔티티
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
   * 
   * @param userId - 업데이트할 사용자 ID
   * @param refreshToken - 새 리프레시 토큰 (null이면 토큰 제거)
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
   * 
   * @param refreshToken - 검증할 리프레시 토큰
   * @param hashedRefreshToken - 저장된 해시된 리프레시 토큰
   * @returns 토큰 유효성 여부
   */
  async validateRefreshToken(refreshToken: string, hashedRefreshToken: string): Promise<boolean> {
    return bcrypt.compare(refreshToken, hashedRefreshToken);
  }

  /**
   * 사용자 인증 정보를 검증합니다.
   * 
   * 이메일과 비밀번호를 검증하고, 사용자 상태를 확인합니다.
   * 
   * @param email - 인증할 사용자 이메일
   * @param password - 인증할 비밀번호
   * @returns 인증된 사용자 엔티티
   * @throws InvalidCredentialsException - 인증 정보가 유효하지 않은 경우
   * @throws InvalidUserStatusException - 사용자 상태가 유효하지 않은 경우
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
   * 
   * 이메일, 닉네임, 비밀번호, 역할, 상태 등을 업데이트합니다.
   * 
   * @param userId - 업데이트할 사용자 ID
   * @param updateUserDto - 업데이트할 정보가 담긴 DTO
   * @returns 업데이트된 사용자 엔티티
   * @throws EmailAlreadyExistsException - 변경하려는 이메일이 이미 등록된 경우
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
   * 
   * @param userId - 조회할 사용자 ID
   * @returns 사용자 프로필 정보
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
   * 
   * @returns 모든 사용자 엔티티 목록
   */
  async findAllUsers(): Promise<UserEntity[]> {
    return await this.userRepository.findAll();
  }

  /**
   * 비밀번호를 해싱합니다.
   * 
   * @param password - 해싱할 비밀번호
   * @returns 해싱된 비밀번호
   * @private
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 비밀번호의 유효성을 검증합니다.
   * 
   * @param password - 검증할 비밀번호
   * @param hash - 저장된 해시된 비밀번호
   * @returns 비밀번호 유효성 여부
   * @private
   */
  private async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
} 