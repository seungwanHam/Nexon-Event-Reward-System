import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 친구 초대 기록 스키마
 */
@Schema({
  collection: 'invites',
  timestamps: true,
  versionKey: false
})
export class Invite extends Document {
  /**
   * 초대자 ID
   */
  @Prop({ required: true, index: true })
  inviterId: string;

  /**
   * 초대받은 사용자 ID
   */
  @Prop({ required: true, index: true })
  inviteeId: string;

  /**
   * 초대 시간
   */
  @Prop({ required: true })
  invitedAt: Date;

  /**
   * 초대 상태
   */
  @Prop({
    required: true,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true
  })
  status: string;

  /**
   * 수락 시간
   */
  @Prop()
  acceptedAt?: Date;
}

export const InviteSchema = SchemaFactory.createForClass(Invite); 