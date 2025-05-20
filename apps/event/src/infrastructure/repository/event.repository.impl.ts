import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEntity } from '../../domain/entity/event.entity';
import { EventRepository } from '../../domain/repository/event.repository.interface';
import { EventDocument, EventModel } from '@app/libs/common/schema';
import { v4 as uuidv4 } from 'uuid';
import { EventNotFoundException } from '@app/libs/common/exception';
import { CACHE_SERVICE, ICacheService } from '@app/libs/infrastructure/cache';

@Injectable()
export class EventRepositoryImpl implements EventRepository {
  private readonly EVENT_CACHE_TTL = 300; // 5분
  private readonly EVENT_CACHE_PREFIX = 'event:';

  constructor(
    @InjectModel(EventModel.name) private eventModel: Model<EventDocument>,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
  ) {}

  async findById(id: string): Promise<EventEntity> {
    // 캐시에서 이벤트 검색
    const cachedEvent = await this.getCachedEvent(`${this.EVENT_CACHE_PREFIX}${id}`);
    if (cachedEvent) return cachedEvent;

    // DB에서 이벤트 검색
    const event = await this.eventModel.findOne({ id }).exec();
    if (!event) {
      throw new EventNotFoundException(`ID가 ${id}인 이벤트를 찾을 수 없습니다.`);
    }

    const eventEntity = this.mapToEntity(event);
    // 캐시 업데이트
    await this.cacheEvent(id, eventEntity);
    return eventEntity;
  }

  async findAll(filter?: Partial<EventEntity>): Promise<EventEntity[]> {
    const query = filter ? this.buildQuery(filter) : {};
    const events = await this.eventModel.find(query).sort({ createdAt: -1 }).exec();
    return events.map(event => this.mapToEntity(event));
  }

  async findActive(): Promise<EventEntity[]> {
    const now = new Date();
    // 캐시 키
    const cacheKey = `${this.EVENT_CACHE_PREFIX}active:${now.toISOString().split('T')[0]}`;
    
    // 캐시에서 활성 이벤트 목록 검색
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      try {
        const cachedEvents = JSON.parse(cached);
        return cachedEvents.map((data: any) => EventEntity.create(data));
      } catch (error) {
        // 캐시 파싱 오류 무시하고 DB에서 조회
      }
    }

    // DB에서 활성 이벤트 목록 조회
    const events = await this.eventModel.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ startDate: 1 }).exec();
    
    const entities = events.map(event => this.mapToEntity(event));
    
    // 캐시 업데이트
    if (entities.length > 0) {
      await this.cacheService.set(
        cacheKey,
        JSON.stringify(entities),
        this.EVENT_CACHE_TTL
      );
    }
    
    return entities;
  }

  async save(event: EventEntity): Promise<void> {
    const eventDoc = this.mapToDocument(event);
    
    if (!eventDoc.id) {
      eventDoc.id = uuidv4();
    }

    await this.eventModel.updateOne(
      { id: eventDoc.id },
      eventDoc,
      { upsert: true }
    ).exec();
    
    // 캐시 무효화
    await this.invalidateCache(eventDoc.id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.eventModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0) {
      throw new EventNotFoundException(`ID가 ${id}인 이벤트를 찾을 수 없습니다.`);
    }
    
    // 캐시 무효화
    await this.invalidateCache(id);
  }

  private buildQuery(filter: Partial<EventEntity>): Record<string, any> {
    const query: Record<string, any> = {};
    
    if (filter.id) query.id = filter.id;
    if (filter.name) query.name = { $regex: filter.name, $options: 'i' }; // 대소문자 구분 없는 부분 일치
    if (filter.status) query.status = filter.status;
    if (filter.conditionType) query.conditionType = filter.conditionType;
    
    return query;
  }

  private mapToEntity(doc: EventDocument): EventEntity {
    return EventEntity.create({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      conditionType: doc.conditionType,
      conditionParams: doc.conditionParams,
      startDate: doc.startDate,
      endDate: doc.endDate,
      status: doc.status,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private mapToDocument(entity: EventEntity): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      conditionType: entity.conditionType,
      conditionParams: entity.conditionParams,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private async getCachedEvent(cacheKey: string): Promise<EventEntity | null> {
    const cached = await this.cacheService.get(cacheKey);
    if (!cached) return null;

    try {
      const eventData = JSON.parse(cached);
      
      // Date 문자열을 Date 객체로 변환
      if (eventData.startDate) eventData.startDate = new Date(eventData.startDate);
      if (eventData.endDate) eventData.endDate = new Date(eventData.endDate);
      if (eventData.createdAt) eventData.createdAt = new Date(eventData.createdAt);
      if (eventData.updatedAt) eventData.updatedAt = new Date(eventData.updatedAt);
      
      console.log(`[DEBUG] 캐시에서 이벤트 복원: ${eventData.id}, 상태: ${eventData.status}, 시작일: ${eventData.startDate}, 종료일: ${eventData.endDate}`);
      
      return EventEntity.create(eventData);
    } catch (error) {
      console.error('[ERROR] 캐시된 이벤트 파싱 오류:', error);
      return null;
    }
  }

  private async cacheEvent(id: string, event: EventEntity): Promise<void> {
    await this.cacheService.set(
      `${this.EVENT_CACHE_PREFIX}${id}`,
      JSON.stringify(event),
      this.EVENT_CACHE_TTL
    );
  }

  private async invalidateCache(id: string): Promise<void> {
    await this.cacheService.del(`${this.EVENT_CACHE_PREFIX}${id}`);
    // 활성 이벤트 캐시도 무효화
    const dateKey = new Date().toISOString().split('T')[0];
    await this.cacheService.del(`${this.EVENT_CACHE_PREFIX}active:${dateKey}`);
  }
}
