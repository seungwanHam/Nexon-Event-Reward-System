import { Model } from 'mongoose';
import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ICacheService, CACHE_SERVICE } from '@app/libs/infrastructure/cache';
import { UserNotFoundException, ValidationException } from '@app/libs/common/exception';

// Schema
import { User, UserDocument } from '@app/libs/common/schema';

// Enum
import { UserRole, UserStatus } from '@app/libs/common/enum';

// Repository
import { UserRepository } from '@app/auth/domain/repository';

// Entity
import { UserEntity } from '@app/auth/domain/entity';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  private readonly USER_CACHE_TTL = 300; // 5분
  private readonly USER_CACHE_PREFIX = 'user:';

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
  ) { }

  async create(user: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    // 이메일 또는 닉네임 중복 체크
    const exists = await this.exists({
      email: user.email,
      nickname: user.nickname,
    });

    if (exists) {
      throw new ConflictException('이미 존재하는 이메일 또는 닉네임입니다.');
    }

    const createdUser = await this.userModel.create({
      email: user.email,
      passwordHash: user.passwordHash,
      nickname: user.nickname,
      roles: user.roles,
      status: user.status,
      metadata: user.metadata || {},
      inviteCode: user.inviteCode,
      publicId: user.publicId,
      statusChangedAt: user.status ? new Date() : undefined,
    });

    const userEntity = this.toEntity(createdUser);
    await this.updateCache(userEntity);
    return userEntity;
  }

  async findById(id: string): Promise<UserEntity> {
    try {
      // 캐시에서 사용자 검색
      const cachedUser = await this.getCachedUser(`${this.USER_CACHE_PREFIX}id:${id}`);
      if (cachedUser) return cachedUser;

      // DB에서 사용자 검색
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new UserNotFoundException(`ID ${id}인 사용자를 찾을 수 없습니다`);
      }

      const userEntity = this.toEntity(user);
      await this.updateCache(userEntity);
      return userEntity;
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new UserNotFoundException(`사용자 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<UserEntity> {
    try {
      // 이메일 정규화
      const normalizedEmail = email.toLowerCase().trim();

      // 캐시에서 사용자 검색
      const cachedUser = await this.getCachedUser(`${this.USER_CACHE_PREFIX}email:${normalizedEmail}`);
      if (cachedUser) return cachedUser;

      // DB에서 사용자 검색
      const user = await this.userModel.findOne({ email: normalizedEmail }).exec();
      if (!user) {
        throw new UserNotFoundException(`이메일 ${email}인 사용자를 찾을 수 없습니다`);
      }

      const userEntity = this.toEntity(user);
      await this.updateCache(userEntity);
      return userEntity;
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new UserNotFoundException(`사용자 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  async exists(criteria: { email?: string; nickname?: string; excludeId?: string }): Promise<boolean> {
    const query: any = {};

    if (criteria.email) {
      query.$or = query.$or || [];
      query.$or.push({ email: criteria.email.toLowerCase().trim() });
    }

    if (criteria.nickname) {
      query.$or = query.$or || [];
      query.$or.push({ nickname: criteria.nickname.trim() });
    }

    if (criteria.excludeId) {
      query._id = { $ne: criteria.excludeId };
    }

    // 검색 조건이 없는 경우 false 반환
    if (!query.$or || query.$or.length === 0) {
      return false;
    }

    return await this.userModel.exists(query) !== null;
  }

  async findByRole(role: UserRole): Promise<UserEntity[]> {
    const users = await this.userModel.find({ roles: role })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return users.map(user => this.toEntity(user));
  }

  async findByStatus(status: UserStatus): Promise<UserEntity[]> {
    const users = await this.userModel.find({ status })
      .sort({ statusChangedAt: -1, createdAt: -1 })
      .lean()
      .exec();
    return users.map(user => this.toEntity(user));
  }

  async updateAuthenticationInfo(
    userId: string,
    data: {
      refreshToken?: string | null;
      lastLoginAt?: Date;
    }
  ): Promise<void> {
    const updateData: any = {};
    if (data.refreshToken !== undefined) updateData.refreshToken = data.refreshToken;
    if (data.lastLoginAt) updateData.lastLoginAt = data.lastLoginAt;
    updateData.updatedAt = new Date();

    const result = await this.userModel.findByIdAndUpdate(userId, updateData).exec();
    if (!result) {
      throw new UserNotFoundException(`사용자 ID ${userId}를 찾을 수 없습니다`);
    }

    await this.invalidateCache(userId);
  }

  async save(user: UserEntity): Promise<UserEntity> {
    try {
      // 이메일 중복 확인 (닉네임이 변경된 경우)
      if (user.nickname) {
        const nicknameExists = await this.exists({
          nickname: user.nickname,
          excludeId: user.id,
        });
        if (nicknameExists) {
          throw new ConflictException(`닉네임 ${user.nickname}은(는) 이미 사용 중입니다.`);
        }
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(
        user.id,
        {
          email: user.email,
          nickname: user.nickname,
          roles: user.roles,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          refreshToken: user.refreshToken,
          metadata: user.metadata,
          inviteCode: user.inviteCode,
          invitedBy: user.invitedBy,
          publicId: user.publicId,
          statusChangedAt: user.statusChangedAt,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();

      if (!updatedUser) {
        throw new UserNotFoundException(`사용자 ID ${user.id}를 찾을 수 없습니다`);
      }

      const userEntity = this.toEntity(updatedUser);
      await this.updateCache(userEntity);
      return userEntity;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof UserNotFoundException) {
        throw error;
      }
      throw new ValidationException(`사용자 저장 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  async findInactiveUsers(criteria: {
    lastLoginBefore: Date;
    status?: UserStatus;
  }): Promise<UserEntity[]> {
    const query: any = {
      lastLoginAt: { $lt: criteria.lastLoginBefore }
    };
    if (criteria.status) query.status = criteria.status;

    const users = await this.userModel.find(query)
      .sort({ lastLoginAt: 1 })
      .lean()
      .exec();
    return users.map(user => this.toEntity(user));
  }

  async findByInviteCode(inviteCode: string): Promise<UserEntity | null> {
    const cacheKey = `${this.USER_CACHE_PREFIX}invite:${inviteCode}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      try {
        return UserEntity.create(JSON.parse(cached));
      } catch (error) {
        // 캐시 파싱 오류 무시
      }
    }

    const user = await this.userModel.findOne({ inviteCode }).exec();
    if (!user) return null;

    const userEntity = this.toEntity(user);

    // 초대 코드 캐싱 (짧은 TTL)
    await this.cacheService.set(cacheKey, JSON.stringify(userEntity), 60); // 1분

    return userEntity;
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.userModel.find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return users.map(user => this.toEntity(user));
  }

  private async getCachedUser(cacheKey: string): Promise<UserEntity | null> {
    const cached = await this.cacheService.get(cacheKey);
    if (!cached) return null;

    try {
      const userData = JSON.parse(cached);
      return UserEntity.create(userData);
    } catch (error) {
      await this.cacheService.del(cacheKey);
      return null;
    }
  }

  private async updateCache(user: UserEntity): Promise<void> {
    const userData = JSON.stringify(user);
    const promises = [
      this.cacheService.set(
        `${this.USER_CACHE_PREFIX}id:${user.id}`,
        userData,
        this.USER_CACHE_TTL
      ),
      this.cacheService.set(
        `${this.USER_CACHE_PREFIX}email:${user.email.toLowerCase().trim()}`,
        userData,
        this.USER_CACHE_TTL
      )
    ];

    // publicId가 있으면 publicId로도 캐싱
    if (user.publicId) {
      promises.push(
        this.cacheService.set(
          `${this.USER_CACHE_PREFIX}publicId:${user.publicId}`,
          userData,
          this.USER_CACHE_TTL
        )
      );
    }

    await Promise.all(promises);
  }

  private async invalidateCache(userId: string): Promise<void> {
    try {
      const user = await this.findById(userId);
      const promises = [
        this.cacheService.del(`${this.USER_CACHE_PREFIX}id:${userId}`),
        this.cacheService.del(`${this.USER_CACHE_PREFIX}email:${user.email.toLowerCase().trim()}`)
      ];

      if (user.publicId) {
        promises.push(this.cacheService.del(`${this.USER_CACHE_PREFIX}publicId:${user.publicId}`));
      }

      if (user.inviteCode) {
        promises.push(this.cacheService.del(`${this.USER_CACHE_PREFIX}invite:${user.inviteCode}`));
      }

      await Promise.all(promises);
    } catch (error) {
      // 사용자를 찾을 수 없는 경우, ID 기반 캐시만 삭제
      await this.cacheService.del(`${this.USER_CACHE_PREFIX}id:${userId}`);
    }
  }

  private toEntity(document: UserDocument | any): UserEntity {
    const docObject = document.toObject ? document.toObject() : document;
    return UserEntity.create({
      id: docObject._id.toString(),
      email: docObject.email,
      passwordHash: docObject.passwordHash,
      nickname: docObject.nickname,
      roles: docObject.roles,
      status: docObject.status,
      lastLoginAt: docObject.lastLoginAt,
      refreshToken: docObject.refreshToken,
      inviteCode: docObject.inviteCode,
      invitedBy: docObject.invitedBy?.toString(),
      metadata: docObject.metadata || {},
      createdAt: docObject.createdAt,
      updatedAt: docObject.updatedAt,
      publicId: docObject.publicId,
      statusChangedAt: docObject.statusChangedAt,
    });
  }
} 