import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type AuditLogDocument = AuditLog & Document;

export enum EntityType {
  USER = 'user',
  EVENT_RULE = 'event_rule',
  REWARD_REDEMPTION = 'reward_redemption',
}

export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: String, enum: Object.values(EntityType), required: true })
  entityType: EntityType;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  entityId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ActionType), required: true })
  action: ActionType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  performedBy: User | MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  previousState?: Record<string, any>;

  @Prop({ type: Object })
  newState?: Record<string, any>;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  reason?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// 인덱스 설정
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ 'metadata.relatedId': 1 }, { sparse: true }); 