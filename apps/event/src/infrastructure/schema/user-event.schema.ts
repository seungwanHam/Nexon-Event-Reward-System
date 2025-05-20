import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 사용자 이벤트 MongoDB 문서 타입
 */
export type UserEventDocument = UserEventSchema & Document;

/**
 * 사용자 이벤트 MongoDB 스키마
 * 
 * 사용자 행동 이벤트를 MongoDB에 저장하기 위한 스키마입니다.
 */
@Schema({
  collection: 'user_events',
  timestamps: { createdAt: 'createdAt', updatedAt: false }, // 이벤트는 생성만 있고 수정은 없음
  versionKey: false,
})
export class UserEventSchema {
  /**
   * 사용자 ID
   * 이벤트를 발생시킨 사용자의 고유 식별자
   */
  @Prop({ required: true, index: true })
  userId: string;

  /**
   * 이벤트 타입
   * 발생한 이벤트의 종류 (login, register, profile_update, logout 등)
   */
  @Prop({ required: true, index: true })
  eventType: string;

  /**
   * 이벤트 발생 시간
   */
  @Prop({ required: true, type: Date, index: true })
  occurredAt: Date;

  /**
   * 이벤트 메타데이터
   * 이벤트와 관련된 추가 정보
   */
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  /**
   * 멱등성 키
   * 이벤트 중복 저장 방지를 위한 고유 식별자
   */
  @Prop({ sparse: true, index: true, unique: true })
  idempotencyKey?: string;

  /**
   * 생성 시간
   */
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const UserEventSchemaFactory = SchemaFactory.createForClass(UserEventSchema); 