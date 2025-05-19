import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
import { RewardType } from './reward-redemption.schema';

export type EventRuleDocument = EventRule & Document;

export enum ConditionType {
  LOGIN_DAYS = 'login_days',
  INVITE_FRIENDS = 'invite_friends',
  PURCHASE_AMOUNT = 'purchase_amount',
  QUEST_COMPLETION = 'quest_completion',
  CUSTOM = 'custom',
}

@Schema({ timestamps: true, collection: 'event_rules' })
export class EventRule {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: String, enum: Object.values(ConditionType), required: true })
  conditionType: ConditionType;

  @Prop({ type: Object, required: true })
  conditionParams: Record<string, any>;

  @Prop({ type: String, enum: Object.values(RewardType), required: true })
  rewardType: RewardType;

  @Prop({ type: Object, required: true })
  rewardParams: Record<string, any>;

  @Prop({ default: false })
  requiresApproval: boolean;

  @Prop({ default: 1 })
  version: number;

  @Prop({ default: 0 })
  priority: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User | MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy?: User | MongooseSchema.Types.ObjectId;

  @Prop({ default: -1 })
  maxRewardsPerUser: number;

  @Prop({ default: -1 })
  totalRewardLimit: number;

  @Prop({ default: 0 })
  currentRewardCount: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const EventRuleSchema = SchemaFactory.createForClass(EventRule);

// 인덱스 설정
EventRuleSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
EventRuleSchema.index({ conditionType: 1, isActive: 1 });
EventRuleSchema.index({ name: 'text', description: 'text' });
EventRuleSchema.index({ createdBy: 1 });
EventRuleSchema.index({ isDeleted: 1 });
EventRuleSchema.index({ createdAt: -1 });
EventRuleSchema.index({ priority: -1, startDate: 1 }); 