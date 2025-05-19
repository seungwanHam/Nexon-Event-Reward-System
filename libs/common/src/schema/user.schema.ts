import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserRole, UserStatus } from '../enum';

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  nickname: string;

  @Prop({ type: [String], enum: UserRole, default: [UserRole.USER] })
  roles: UserRole[];

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ type: String, sparse: true })
  inviteCode?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  invitedBy?: User | MongooseSchema.Types.ObjectId | null;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: String })
  refreshToken?: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// 인덱스 설정 (unique 옵션은 @Prop에서만 설정)
UserSchema.index({ nickname: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });
UserSchema.index({ inviteCode: 1 }, { sparse: true }); 