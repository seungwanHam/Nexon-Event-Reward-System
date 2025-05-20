import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 사용자 로그인 기록 스키마
 */
@Schema({
  collection: 'user_logins',
  timestamps: true,
  versionKey: false
})
export class UserLogin extends Document {
  /**
   * 사용자 ID
   */
  @Prop({ required: true, index: true })
  userId: string;

  /**
   * 로그인 시간
   */
  @Prop({ required: true, index: true })
  loginAt: Date;

  /**
   * 기기 정보
   */
  @Prop()
  deviceInfo?: string;

  /**
   * IP 주소
   */
  @Prop()
  ipAddress?: string;
}

export const UserLoginSchema = SchemaFactory.createForClass(UserLogin); 