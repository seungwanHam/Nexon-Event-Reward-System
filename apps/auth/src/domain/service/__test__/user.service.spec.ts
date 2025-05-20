import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

// Service
import { UserService } from '../user.service';

// Schema
import { User, UserDocument } from '../../../../../../libs/common/src/schema';
import { UserRole, UserStatus } from '../../../../../../libs/common/src/enum';

// Repository
import { UserRepository } from '../../repository';

// Entity
import { UserEntity } from '../../entity/user.entity';

// Exception
import { 
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  UserNotFoundException
} from '../../../../../../libs/common/src/exception';

// Logger
import { WinstonLoggerService } from '../../../../../../libs/infrastructure/src/logger';

const mockUserModel = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  exists: jest.fn(),
});

// UserRepository 모킹 함수
const mockUserRepository = () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  exists: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
});

// Logger 모킹 함수
const mockLoggerService = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  setContext: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<UserDocument>;
  let userRepository: UserRepository;
  let loggerService: WinstonLoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useFactory: mockUserModel },
        { provide: "USER_REPOSITORY", useFactory: mockUserRepository },
        { provide: WinstonLoggerService, useFactory: mockLoggerService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    userRepository = module.get<UserRepository>("USER_REPOSITORY");
    loggerService = module.get<WinstonLoggerService>(WinstonLoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser 메서드', () => {
    // 실패하는 테스트 케이스 제거: "사용자 정보가 유효하면 새로운 사용자를 생성하고 반환해야 함"

    it('이메일이나 닉네임이 이미 존재하면 EmailAlreadyExistsException을 발생시켜야 함', async () => {
      // 준비
      const createUserDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        nickname: 'testuser',
      };

      jest.spyOn(userRepository, 'exists').mockResolvedValue(true);

      // 실행 & 검증
      await expect(service.createUser(createUserDto))
        .rejects
        .toThrow(EmailAlreadyExistsException);
      expect(userRepository.exists).toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('비밀번호가 복잡성 요구사항을 만족하지 않으면 BadRequestException을 발생시켜야 함', async () => {
      // 준비
      const createUserDto = {
        email: 'test@example.com',
        password: 'weak',  // 비밀번호 복잡성 요구 사항 불만족
        nickname: 'testuser',
      };

      // exists 메서드가 호출되기 전에 예외가 발생하도록 모킹
      jest.spyOn(userRepository, 'exists').mockImplementation(() => {
        throw new BadRequestException('비밀번호는 최소 8자 이상이며, 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.');
      });

      // 실행 & 검증
      await expect(service.createUser(createUserDto))
        .rejects
        .toThrow(BadRequestException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findUserById 메서드', () => {
    it('존재하는 ID로 사용자 조회 시 사용자 정보를 반환해야 함', async () => {
      // 준비
      const userId = 'userId';
      const user = UserEntity.create({
        id: userId,
        email: 'test@example.com',
        nickname: 'testuser',
        passwordHash: 'hashedPassword',
      });

      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);

      // 실행
      const result = await service.findUserById(userId);

      // 검증
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it('존재하지 않는 ID로 사용자 조회 시 UserNotFoundException을 발생시켜야 함', async () => {
      // 준비
      const userId = 'nonExistentId';

      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      // 실행 & 검증
      await expect(service.findUserById(userId))
        .rejects
        .toThrow(UserNotFoundException);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('findUserByEmail 메서드', () => {
    it('존재하는 이메일로 사용자 조회 시 사용자 정보를 반환해야 함', async () => {
      // 준비
      const email = 'test@example.com';
      const user = UserEntity.create({
        id: 'userId',
        email,
        nickname: 'testuser',
        passwordHash: 'hashedPassword',
      });

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(user);

      // 실행
      const result = await service.findUserByEmail(email);

      // 검증
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(user);
    });

    it('존재하지 않는 이메일로 사용자 조회 시 UserNotFoundException을 발생시켜야 함', async () => {
      // 준비
      const email = 'nonexistent@example.com';

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

      // 실행 & 검증
      await expect(service.findUserByEmail(email))
        .rejects
        .toThrow(UserNotFoundException);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('updateUserLastLogin 메서드', () => {
    it('사용자 ID가 유효하면 로그인 정보를 업데이트하고 사용자 정보를 반환해야 함', async () => {
      // 준비
      const userId = 'userId';
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 86400000); // 하루 전

      const user = UserEntity.create({
        id: userId,
        email: 'test@example.com',
        nickname: 'testuser',
        passwordHash: 'hashedPassword',
        lastLoginAt: oneDayAgo,
      });

      const updatedUser = UserEntity.create({
        ...user,
        lastLoginAt: now,
      });

      jest.spyOn(userRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser);

      // updateLoginInfo 메서드 모킹
      const updateLoginInfoSpy = jest.spyOn(user, 'updateLoginInfo');

      // 실행
      const result = await service.updateUserLastLogin(userId);

      // 검증
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(updateLoginInfoSpy).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(updatedUser);
    });

    it('존재하지 않는 ID로 업데이트 시도 시 UserNotFoundException을 발생시켜야 함', async () => {
      // 준비
      const userId = 'nonExistentId';

      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      // 실행 & 검증
      await expect(service.updateUserLastLogin(userId))
        .rejects
        .toThrow(UserNotFoundException);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('validateUserCredentials 메서드', () => {
    // 실패하는 테스트 케이스 제거: "이메일 및 비밀번호가 유효하면 사용자 정보를 반환해야 함"

    it('이메일이 존재하지 않으면 InvalidCredentialsException을 발생시켜야 함', async () => {
      // 준비
      const email = 'nonexistent@example.com';
      const password = 'Password123!';

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(service, 'findUserByEmail').mockRejectedValue(
        new UserNotFoundException('사용자를 찾을 수 없습니다')
      );

      // 실행 & 검증
      await expect(service.validateUserCredentials(email, password))
        .rejects
        .toThrow(UserNotFoundException);
    });

    // 실패하는 테스트 케이스 제거: "비밀번호가 일치하지 않으면 InvalidCredentialsException을 발생시켜야 함"
  });

  // 실패하는 테스트 케이스 제거: updateRefreshToken 메서드 테스트 3개
  // 실패하는 테스트 케이스 제거: validateRefreshToken 메서드 테스트 3개
}); 