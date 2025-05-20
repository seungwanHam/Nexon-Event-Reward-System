import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserRole, UserStatus } from '../enum';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends Document {
  @Prop({ 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ 
    required: true, 
    unique: true, 
    trim: true 
  })
  nickname: string;

  @Prop({ type: [String], enum: UserRole, default: [UserRole.USER] })
  roles: UserRole[];

  @Prop({ 
    type: String, 
    enum: UserStatus, 
    default: UserStatus.ACTIVE
  })
  status: UserStatus;

  @Prop({ 
    type: String, 
    sparse: true, 
    unique: true
  })
  inviteCode?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  invitedBy?: User | MongooseSchema.Types.ObjectId | null;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: Date })
  statusChangedAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: String })
  refreshToken?: string;

  @Prop({ type: String, default: () => uuidv4() })
  publicId: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);

// 복합 인덱스 설정
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ nickname: 1 }, { unique: true, collation: { locale: 'ko', strength: 2 } });
UserSchema.index({ status: 1, createdAt: -1 });
UserSchema.index({ roles: 1, status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });
UserSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });
UserSchema.index({ email: 'text', nickname: 'text' }); // 텍스트 검색 인덱스

// 가상 필드 설정
UserSchema.virtual('isActive').get(function(this: UserDocument) {
  return this.status === UserStatus.ACTIVE;
});

UserSchema.virtual('fullName').get(function(this: UserDocument) {
  return this.metadata?.firstName && this.metadata?.lastName 
    ? `${this.metadata.firstName} ${this.metadata.lastName}` 
    : this.nickname;
}); 