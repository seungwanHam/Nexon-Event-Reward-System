import { Injectable, Inject } from '@nestjs/common';
import { EventEntity } from '../entity/event.entity';
import { EVENT_REPOSITORY, EventRepository } from '../repository/event.repository.interface';
import { ConditionType, EventStatus } from '@app/libs/common/enum';
import { EventNotFoundException } from '@app/libs/common/exception';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

@Injectable()
export class EventService {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('EventService');
  }

  /**
   * 새 이벤트를 생성합니다.
   */
  async createEvent(
    name: string,
    description: string,
    conditionType: ConditionType,
    conditionParams: Record<string, any>,
    startDate: Date,
    endDate: Date,
    metadata?: Record<string, any>,
  ): Promise<EventEntity> {
    const event = EventEntity.create({
      name,
      description,
      conditionType,
      conditionParams,
      startDate,
      endDate,
      status: EventStatus.INACTIVE,
      metadata,
    });

    await this.eventRepository.save(event);
    return event;
  }

  /**
   * 모든 이벤트를 조회합니다.
   */
  async findAllEvents(): Promise<EventEntity[]> {
    return this.eventRepository.findAll();
  }

  /**
   * 활성 상태의 이벤트를 조회합니다.
   */
  async findActiveEvents(): Promise<EventEntity[]> {
    return this.eventRepository.findActive();
  }

  /**
   * ID로 이벤트를 조회합니다.
   */
  async findEventById(id: string): Promise<EventEntity> {
    this.logger.debug(`이벤트 조회 요청: ${id}`);
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new EventNotFoundException();
    }
    
    // Date 객체로 형변환 확인
    if (typeof event.startDate === 'string') {
      event.startDate = new Date(event.startDate);
    }
    if (typeof event.endDate === 'string') {
      event.endDate = new Date(event.endDate);
    }
    
    // 이벤트 상태 자동 업데이트
    event.autoUpdateStatus();
    if (event.updatedAt > event.createdAt) {
      await this.eventRepository.save(event);
    }
    
    this.logger.debug(`이벤트 조회 결과: ID=${event.id}, 상태=${event.status}, 활성=${event.isActive()}, 유효기간=${event.isWithinPeriod()}`);
    
    return event;
  }

  /**
   * 이벤트를 업데이트합니다.
   */
  async updateEvent(
    id: string,
    updateData: Partial<Omit<EventEntity, 'id' | 'createdAt'>>
  ): Promise<EventEntity> {
    const event = await this.findEventById(id);
    event.update(updateData);
    await this.eventRepository.save(event);
    return event;
  }

  /**
   * 이벤트 상태를 변경합니다.
   */
  async changeEventStatus(id: string, status: EventStatus): Promise<EventEntity> {
    const event = await this.findEventById(id);
    event.changeStatus(status);
    await this.eventRepository.save(event);
    return event;
  }

  /**
   * 이벤트를 삭제합니다.
   */
  async deleteEvent(id: string): Promise<void> {
    await this.findEventById(id); // 존재 확인
    await this.eventRepository.delete(id);
  }

  /**
   * 이벤트 ID로 특정 이벤트를 조회합니다.
   * 
   * @param id 이벤트 ID
   * @returns 이벤트 엔티티 또는 null
   */
  async findById(id: string): Promise<EventEntity | null> {
    this.logger.debug(`ID로 이벤트 조회: ${id}`);
    return this.eventRepository.findById(id);
  }
} 