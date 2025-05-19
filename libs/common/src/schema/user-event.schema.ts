import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserEventDocument = UserEvent & Document;

export enum EventType {
  LOGIN = 'login',
  PURCHASE = 'purchase',
  QUEST_COMPLETE = 'quest_complete',
  ITEM_USE = 'item_use',
  LEVEL_UP = 'level_up',
  CUSTOM = 'custom',
}

@Schema({
  collection: 'user_events',
  timestamps: true,
})
export class UserEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({
    type: String,
    enum: Object.values(EventType),
    required: true
  })
  eventType: EventType;

  @Prop({ type: String, required: true })
  eventKey: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  occurredAt: Date;

  @Prop({ type: Boolean, default: false })
  processed: boolean;

  @Prop({ type: Date })
  processedAt?: Date;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'RewardRedemption' }] })
  relatedRedemptions?: string[];

  @Prop({ type: String, unique: true, sparse: true })
  idempotencyKey?: string;
}

export const UserEventSchema = SchemaFactory.createForClass(UserEvent);

// 인덱스 설정
UserEventSchema.index({ userId: 1, eventType: 1, occurredAt: -1 });
UserEventSchema.index({ processed: 1, eventType: 1 });
UserEventSchema.index({ eventKey: 1 });
UserEventSchema.index({ occurredAt: -1 }); 