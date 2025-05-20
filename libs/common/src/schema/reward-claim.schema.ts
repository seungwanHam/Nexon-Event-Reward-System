import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ClaimStatus } from '../enum';

export type RewardClaimDocument = RewardClaim & Document;

@Schema({
  collection: 'reward_claims',
  timestamps: true,
  versionKey: false,
})
export class RewardClaim {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  eventId: string;

  @Prop({ required: true, index: true })
  rewardId: string;

  @Prop({ 
    required: true, 
    enum: ClaimStatus, 
    type: String,
    default: ClaimStatus.PENDING
  })
  status: ClaimStatus;

  @Prop({ required: true, type: Date, default: Date.now })
  requestDate: Date;

  @Prop({ type: Date })
  processDate?: Date;

  @Prop({ type: String })
  approverId?: string;

  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const RewardClaimSchema = SchemaFactory.createForClass(RewardClaim);

// 인덱스 생성
RewardClaimSchema.index({ userId: 1, eventId: 1 });
RewardClaimSchema.index({ userId: 1, rewardId: 1 });
RewardClaimSchema.index({ status: 1 });
RewardClaimSchema.index({ requestDate: 1 });

export const RewardClaimModel = { name: RewardClaim.name, schema: RewardClaimSchema }; 