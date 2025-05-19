import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'user',
  OPERATOR = 'operator',
  AUDITOR = 'auditor',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

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
  @Prop({ required: true, trim: true, lowercase: true })
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

  @Prop({ sparse: true })
  inviteCode?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  invitedBy?: User | MongooseSchema.Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 인덱스 설정
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ nickname: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 }); 