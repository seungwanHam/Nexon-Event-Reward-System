import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ConditionType, EventStatus } from '../enum';
import { v4 as uuidv4 } from 'uuid';

export type EventDocument = Event & Document;

@Schema({
  collection: 'events',
  timestamps: true,
  versionKey: false,
})
export class Event {
  @Prop({ 
    required: true, 
    unique: true, 
    index: true,
    default: () => uuidv4()
  })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ 
    required: true, 
    enum: ConditionType, 
    type: String,
    default: ConditionType.LOGIN
  })
  conditionType: ConditionType;

  @Prop({ required: true, type: Object })
  conditionParams: Record<string, any>;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ 
    required: true, 
    enum: EventStatus, 
    type: String,
    default: EventStatus.INACTIVE
  })
  status: EventStatus;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// 인덱스 생성
EventSchema.index({ status: 1, startDate: 1, endDate: 1 });
EventSchema.index({ conditionType: 1 });
EventSchema.index({ name: 'text', description: 'text' });

export const EventModel = { name: Event.name, schema: EventSchema }; 