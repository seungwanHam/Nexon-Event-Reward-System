import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RewardType } from '../enum';

export type RewardDocument = Reward & Document;

@Schema({
  collection: 'rewards',
  timestamps: true,
  versionKey: false,
})
export class Reward {
  @Prop({ required: true, unique: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  eventId: string;

  @Prop({ 
    required: true, 
    enum: RewardType, 
    type: String,
    default: RewardType.POINT
  })
  type: RewardType;

  @Prop({ required: true, type: Number, min: 1 })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Boolean, default: false })
  requiresApproval: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);

// 인덱스 생성
RewardSchema.index({ eventId: 1 });
RewardSchema.index({ type: 1 });

export const RewardModel = { name: Reward.name, schema: RewardSchema }; 