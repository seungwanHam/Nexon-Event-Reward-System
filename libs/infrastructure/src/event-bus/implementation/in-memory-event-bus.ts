import { Injectable, Logger } from '@nestjs/common';
import { EventData, EventHandler, IEventBus } from '../interface/event-bus.interface';

/**
 * 인메모리 이벤트 버스 구현체
 * 간단한 이벤트 관리를 위한 구현으로, 단일 서버 내에서만 작동합니다.
 */
@Injectable()
export class InMemoryEventBus implements IEventBus {
  private readonly logger = new Logger(InMemoryEventBus.name);
  private readonly handlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * 이벤트 발행
   */
  async publish(event: EventData): Promise<void> {
    if (!event.type) {
      throw new Error('Event type is required');
    }

    // 이벤트 메타데이터가 없으면 기본값 설정
    if (!event.metadata) {
      event.metadata = {};
    }

    // 타임스탬프가 없으면 현재 시간 설정
    if (!event.metadata.timestamp) {
      event.metadata.timestamp = new Date();
    }

    this.logger.debug(`Publishing event: ${event.type}`);
    
    // 해당 이벤트 타입에 등록된 핸들러가 없으면 종료
    if (!this.handlers.has(event.type)) {
      this.logger.debug(`No handlers registered for event: ${event.type}`);
      return;
    }

    // 모든 핸들러에게 이벤트 전달
    const handlers = this.handlers.get(event.type) || new Set();
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(`Error handling event ${event.type}: ${error.message}`, error.stack);
      }
    });

    await Promise.all(promises);
  }

  /**
   * 이벤트 구독
   */
  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);
    this.logger.debug(`Handler subscribed to event: ${eventType}`);
  }

  /**
   * 이벤트 구독 취소
   */
  async unsubscribe(eventType: string, handler?: EventHandler): Promise<void> {
    if (!this.handlers.has(eventType)) {
      return;
    }

    // 특정 핸들러만 제거
    if (handler) {
      this.handlers.get(eventType)!.delete(handler);
      this.logger.debug(`Handler unsubscribed from event: ${eventType}`);
      return;
    }

    // 모든 핸들러 제거
    this.handlers.delete(eventType);
    this.logger.debug(`All handlers unsubscribed from event: ${eventType}`);
  }
} 