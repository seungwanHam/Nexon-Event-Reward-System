import { Model } from 'mongoose';
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ICacheService, CACHE_SERVICE } from '@app/libs/infrastructure/cache';
import { UserNotFoundException } from '@app/libs/common/exception';

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
  private readonly USER_CACHE_TTL = 60;
  private readonly USER_CACHE_PREFIX = 'user:';

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
  ) { }

  async create(user: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    const createdUser = await this.userModel.create({
      email: user.email,
      passwordHash: user.passwordHash,
      nickname: user.nickname,
      roles: user.roles,
      status: user.status,
      metadata: user.metadata || {},
      inviteCode: user.inviteCode,
    });

    const userEntity = this.toEntity(createdUser);
    await this.updateCache(userEntity);
    return userEntity;
  }

  async findById(id: string): Promise<UserEntity> {
    const cachedUser = await this.getCachedUser(`${this.USER_CACHE_PREFIX}id:${id}`);
    if (cachedUser) return cachedUser;

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new UserNotFoundException(`ID ${id}인 사용자를 찾을 수 없습니다`);
    }

    const userEntity = this.toEntity(user);
    await this.updateCache(userEntity);
    return userEntity;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const cachedUser = await this.getCachedUser(`${this.USER_CACHE_PREFIX}email:${email}`);
    if (cachedUser) return cachedUser;

    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UserNotFoundException(`이메일 ${email}인 사용자를 찾을 수 없습니다`);
    }

    const userEntity = this.toEntity(user);
    await this.updateCache(userEntity);
    return userEntity;
  }

  async exists(criteria: { email?: string; nickname?: string; excludeId?: string }): Promise<boolean> {
    const query: any = {};
    if (criteria.email) query.email = criteria.email;
    if (criteria.nickname) query.nickname = criteria.nickname;
    if (criteria.excludeId) query._id = { $ne: criteria.excludeId };

    return await this.userModel.exists(query) !== null;
  }

  async findByRole(role: UserRole): Promise<UserEntity[]> {
    const users = await this.userModel.find({ roles: role }).exec();
    return users.map(user => this.toEntity(user));
  }

  async findByStatus(status: UserStatus): Promise<UserEntity[]> {
    const users = await this.userModel.find({ status }).exec();
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

    await this.userModel.findByIdAndUpdate(userId, updateData).exec();
    await this.invalidateCache(userId);
  }

  async save(user: UserEntity): Promise<UserEntity> {
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
      },
      { new: true }
    ).exec();

    if (!updatedUser) {
      throw new UserNotFoundException(`사용자 ID ${user.id}를 찾을 수 없습니다`);
    }

    const userEntity = this.toEntity(updatedUser);
    await this.updateCache(userEntity);
    return userEntity;
  }

  async findInactiveUsers(criteria: {
    lastLoginBefore: Date;
    status?: UserStatus;
  }): Promise<UserEntity[]> {
    const query: any = {
      lastLoginAt: { $lt: criteria.lastLoginBefore }
    };
    if (criteria.status) query.status = criteria.status;

    const users = await this.userModel.find(query).exec();
    return users.map(user => this.toEntity(user));
  }

  async findByInviteCode(inviteCode: string): Promise<UserEntity | null> {
    const user = await this.userModel.findOne({ inviteCode }).exec();
    return user ? this.toEntity(user) : null;
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => this.toEntity(user));
  }

  private async getCachedUser(cacheKey: string): Promise<UserEntity | null> {
    const cached = await this.cacheService.get(cacheKey);
    if (!cached) return null;

    try {
      const userData = JSON.parse(cached);
      return UserEntity.create(userData);
    } catch (error) {
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
        `${this.USER_CACHE_PREFIX}email:${user.email}`,
        userData,
        this.USER_CACHE_TTL
      )
    ];
    await Promise.all(promises);
  }

  private async invalidateCache(userId: string): Promise<void> {
    const user = await this.findById(userId);
    const promises = [
      this.cacheService.del(`${this.USER_CACHE_PREFIX}id:${userId}`),
      this.cacheService.del(`${this.USER_CACHE_PREFIX}email:${user.email}`)
    ];
    await Promise.all(promises);
  }

  private toEntity(document: UserDocument): UserEntity {
    const docObject = document.toObject();
    return UserEntity.create({
      id: document._id.toString(),
      email: document.email,
      passwordHash: document.passwordHash,
      nickname: document.nickname,
      roles: document.roles,
      status: document.status,
      lastLoginAt: document.lastLoginAt,
      refreshToken: document.refreshToken,
      inviteCode: document.inviteCode,
      invitedBy: document.invitedBy?.toString(),
      metadata: document.metadata,
      createdAt: docObject.createdAt,
      updatedAt: docObject.updatedAt,
    });
  }
} 