import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

/**
 * 사용자 역할 정의
 */
export enum UserRole {
  USER = 'user',
  OPERATOR = 'operator',
  AUDITOR = 'auditor',
  ADMIN = 'admin',
}

/**
 * 사용자 상태 정의
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

/**
 * 사용자 스키마 정의
 */
@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: (doc, ret) => {
      delete ret.passwordHash;
      return ret;
    },
  }
})
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  nickname: string;

  @Prop({ type: [String], enum: Object.values(UserRole), default: [UserRole.USER] })
  roles: UserRole[];

  @Prop({ type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop()
  lastLoginAt: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  refreshToken?: string;

  // 친구 초대 시나리오를 위한 필드
  @Prop({ unique: true, sparse: true })
  inviteCode?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  invitedBy?: User | MongooseSchema.Types.ObjectId | null;
}

/**
 * 사용자 스키마 팩토리
 */
export const UserSchema = SchemaFactory.createForClass(User);

// 인덱스 설정
UserSchema.index({ email: 1 });
UserSchema.index({ nickname: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ inviteCode: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 }); 