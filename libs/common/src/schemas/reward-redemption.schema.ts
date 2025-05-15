import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RewardRedemptionDocument = RewardRedemption & Document;

export enum RewardType {
  ITEM = 'item',
  CURRENCY = 'currency',
  EXPERIENCE = 'experience',
  BUFF = 'buff',
  COSMETIC = 'cosmetic',
  POINT = 'point',
  COUPON = 'coupon',
  CUSTOM = 'custom',
}

export enum RedemptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export interface StatusHistoryItem {
  status: RedemptionStatus;
  timestamp: Date;
  performedBy?: string;
  reason?: string;
}

@Schema({
  collection: 'reward_redemptions',
  timestamps: true,
})
export class RewardRedemption {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'EventRule', required: true })
  eventRuleId: string;

  @Prop({
    type: String,
    enum: Object.values(RewardType),
    required: true
  })
  rewardType: RewardType;

  @Prop({ type: Object, required: true })
  rewardData: Record<string, any>;

  @Prop({
    type: String,
    enum: Object.values(RedemptionStatus),
    default: RedemptionStatus.PENDING
  })
  status: RedemptionStatus;

  @Prop({ type: Date, default: Date.now })
  requestedAt: Date;

  @Prop({ type: Date })
  processedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  approvedBy?: string;

  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: String, sparse: true })
  transactionId?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Array, default: [] })
  statusHistory: StatusHistoryItem[];
}

export const RewardRedemptionSchema = SchemaFactory.createForClass(RewardRedemption);

// 인덱스 설정
RewardRedemptionSchema.index({ userId: 1, eventRuleId: 1 });
RewardRedemptionSchema.index({ status: 1, requestedAt: 1 });
RewardRedemptionSchema.index({ transactionId: 1 }, { unique: true, sparse: true }); 