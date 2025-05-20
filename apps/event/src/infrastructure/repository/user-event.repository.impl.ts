import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEventEntity } from '../../domain/entity/user-event.entity';
import { UserEventRepository } from '../../domain/repository/user-event.repository';
import { UserEvent, UserEventDocument } from '@app/libs/common/schema';

/**
 * 사용자 이벤트 리포지토리 구현체
 * 
 * MongoDB를 사용하여 사용자 이벤트를 저장하고 조회하는 구현체입니다.
 */
@Injectable()
export class UserEventRepositoryImpl implements UserEventRepository {
  constructor(
    @InjectModel(UserEvent.name)
    private readonly userEventModel: Model<UserEventDocument>,
  ) {}

  /**
   * 사용자 이벤트 저장
   * 
   * @param event - 저장할 이벤트 엔티티
   * @returns 저장된 이벤트 엔티티
   */
  async save(event: UserEventEntity): Promise<UserEventEntity> {
    // 데이터 변환
    const eventData = {
      userId: event.userId,
      eventType: event.eventType,
      eventKey: event.eventKey,
      occurredAt: event.occurredAt,
      metadata: event.metadata,
      idempotencyKey: event.idempotencyKey,
    };

    // MongoDB에 저장
    const createdEvent = await this.userEventModel.create(eventData);

    // 도메인 엔티티로 변환하여 반환
    return UserEventEntity.create({
      id: createdEvent._id.toString(),
      userId: createdEvent.userId,
      eventType: createdEvent.eventType,
      eventKey: createdEvent.eventKey,
      occurredAt: createdEvent.occurredAt,
      metadata: createdEvent.metadata,
      idempotencyKey: createdEvent.idempotencyKey,
      createdAt: new Date(), // 현재 시간으로 설정
    });
  }

  /**
   * ID로 이벤트 조회
   * 
   * @param id - 이벤트 ID
   * @returns 찾은 이벤트 엔티티 또는 null
   */
  async findById(id: string): Promise<UserEventEntity | null> {
    const event = await this.userEventModel.findById(id).exec();
    
    if (!event) {
      return null;
    }

    return UserEventEntity.create({
      id: event._id.toString(),
      userId: event.userId,
      eventType: event.eventType,
      eventKey: event.eventKey,
      occurredAt: event.occurredAt,
      metadata: event.metadata,
      idempotencyKey: event.idempotencyKey,
      createdAt: event.occurredAt, // 발생 시간을 생성 시간으로 대체
    });
  }

  /**
   * 멱등성 키로 이벤트 조회
   * 
   * @param key - 멱등성 키
   * @returns 찾은 이벤트 엔티티 또는 null
   */
  async findByIdempotencyKey(key: string): Promise<UserEventEntity | null> {
    const event = await this.userEventModel.findOne({ idempotencyKey: key }).exec();
    
    if (!event) {
      return null;
    }

    return UserEventEntity.create({
      id: event._id.toString(),
      userId: event.userId,
      eventType: event.eventType,
      eventKey: event.eventKey,
      occurredAt: event.occurredAt,
      metadata: event.metadata,
      idempotencyKey: event.idempotencyKey,
      createdAt: event.occurredAt, // 발생 시간을 생성 시간으로 대체
    });
  }

  /**
   * 사용자 이벤트 목록 조회
   * 
   * @param userId - 사용자 ID
   * @param eventType - 이벤트 타입 (선택 사항)
   * @returns 이벤트 엔티티 목록
   */
  async findByUser(userId: string, eventType?: string): Promise<UserEventEntity[]> {
    // 쿼리 조건 구성
    const query: any = { userId };
    if (eventType) {
      query.eventType = eventType;
    }

    // 최신 이벤트부터 조회
    const events = await this.userEventModel
      .find(query)
      .sort({ occurredAt: -1 })
      .exec();

    // 도메인 엔티티로 변환하여 반환
    return events.map(event => 
      UserEventEntity.create({
        id: event._id.toString(),
        userId: event.userId,
        eventType: event.eventType,
        eventKey: event.eventKey,
        occurredAt: event.occurredAt,
        metadata: event.metadata,
        idempotencyKey: event.idempotencyKey,
        createdAt: event.occurredAt, // 발생 시간을 생성 시간으로 대체
      })
    );
  }
} 