import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { UserEventEntity } from '../entity/user-event.entity';
import { UserEventRepository, USER_EVENT_REPOSITORY } from '../repository/user-event.repository';

/**
 * 사용자 이벤트 서비스
 * 
 * 사용자 행동 이벤트 기록과 조회를 담당하는 도메인 서비스입니다.
 */
@Injectable()
export class UserEventService {
  private readonly logger = new Logger(UserEventService.name);

  constructor(
    @Inject(USER_EVENT_REPOSITORY)
    private readonly userEventRepository: UserEventRepository,
  ) {}

  /**
   * 사용자 이벤트 기록
   * 
   * 사용자 행동 이벤트를 기록합니다. 멱등성 키를 통해 중복 이벤트 처리를 방지합니다.
   * 
   * @param data - 이벤트 데이터
   * @returns 생성된 이벤트 엔티티
   * @throws ConflictException - 동일한
   */
  async recordUserEvent(data: {
    userId: string;
    eventType: string;
    eventKey: string;
    occurredAt?: string | Date;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
  }): Promise<UserEventEntity> {
    try {
      // 멱등성 키가 있는 경우 중복 이벤트 확인
      if (data.idempotencyKey) {
        const existingEvent = await this.userEventRepository.findByIdempotencyKey(data.idempotencyKey);
        if (existingEvent) {
          this.logger.debug(`중복 이벤트 감지됨: ${data.idempotencyKey}`);
          return existingEvent; // 중복 이벤트는 기존 이벤트 반환
        }
      }

      // 새 이벤트 엔티티 생성
      const newEvent = UserEventEntity.create({
        userId: data.userId,
        eventType: data.eventType,
        eventKey: data.eventKey,
        occurredAt: data.occurredAt || new Date(),
        metadata: data.metadata || {},
        idempotencyKey: data.idempotencyKey,
      });

      // 리포지토리에 저장
      const savedEvent = await this.userEventRepository.save(newEvent);
      this.logger.debug(`사용자 이벤트 기록 완료: ${data.eventType} for ${data.userId}`);
      
      return savedEvent;
    } catch (error) {
      // 멱등성 키 중복으로 인한 오류 처리
      if (error.name === 'MongoServerError' && error.code === 11000) {
        throw new ConflictException('이벤트가 이미 처리되었습니다.');
      }
      throw error;
    }
  }

  /**
   * 사용자 이벤트 조회
   * 
   * 특정 사용자의 이벤트 목록을, 선택적으로 이벤트 타입으로 필터링하여 조회합니다.
   * 
   * @param userId - 사용자 ID
   * @param eventType - 이벤트 타입 (선택 사항)
   * @returns 이벤트 엔티티 목록
   */
  async getUserEvents(userId: string, eventType?: string): Promise<UserEventEntity[]> {
    return this.userEventRepository.findByUser(userId, eventType);
  }

  /**
   * 이벤트 상세 조회
   * 
   * 특정 ID의 이벤트를 조회합니다.
   * 
   * @param id - 이벤트 ID
   * @returns 이벤트 엔티티 또는 null
   */
  async getEvent(id: string): Promise<UserEventEntity | null> {
    return this.userEventRepository.findById(id);
  }
} 