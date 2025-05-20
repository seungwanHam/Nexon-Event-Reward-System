import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventData, EventHandler, IEventBus } from '../interface/event-bus.interface';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

/**
 * Redis 기반 이벤트 버스 구현체
 * 분산 환경에서 서비스 간 이벤트 통신을 위한 구현체
 */
@Injectable()
export class RedisEventBus implements IEventBus, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisEventBus.name);
  private readonly subscriber: any;
  private readonly publisher: any;
  private readonly handlers: Map<string, Set<EventHandler>> = new Map();
  private readonly channelPrefix = 'event:';

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    // 구독자 클라이언트
    this.subscriber = createClient({ url: redisUrl });

    // 발행자 클라이언트 (구독자와 분리하여 사용)
    this.publisher = createClient({ url: redisUrl });

    // 에러 핸들링
    this.subscriber.on('error', (err) => {
      this.logger.error(`Redis subscriber error: ${err.message}`, err.stack);
    });

    this.publisher.on('error', (err) => {
      this.logger.error(`Redis publisher error: ${err.message}`, err.stack);
    });
  }

  async onModuleInit() {
    // Redis 연결
    await this.subscriber.connect();
    await this.publisher.connect();

    // 메시지 수신 핸들러 설정
    this.subscriber.on('message', (channel, message) => {
      try {
        const eventType = channel.replace(this.channelPrefix, '');
        const event = JSON.parse(message) as EventData;

        this.processEvent(eventType, event);
      } catch (error) {
        this.logger.error(`Error processing Redis message: ${error.message}`, error.stack);
      }
    });

    this.logger.log('Redis event bus initialized');
  }

  async onModuleDestroy() {
    // Redis 연결 해제
    await this.subscriber.quit();
    await this.publisher.quit();
    this.logger.log('Redis event bus destroyed');
  }

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

    this.logger.debug(`Publishing event to Redis: ${event.type}`);

    // 이벤트를 Redis 채널로 발행
    const channel = `${this.channelPrefix}${event.type}`;
    await this.publisher.publish(channel, JSON.stringify(event));

    // 로컬 핸들러도 실행 (같은 서비스 내 구독자 처리)
    await this.processEvent(event.type, event);
  }

  /**
   * 이벤트 구독
   */
  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());

      // Redis 채널 구독
      const channel = `${this.channelPrefix}${eventType}`;
      await this.subscriber.subscribe(channel);
      this.logger.debug(`Subscribed to Redis channel: ${channel}`);
    }

    // 로컬 핸들러 등록
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

      // 핸들러가 더 이상 없으면 Redis 구독도 취소
      if (this.handlers.get(eventType)!.size === 0) {
        const channel = `${this.channelPrefix}${eventType}`;
        await this.subscriber.unsubscribe(channel);
        this.handlers.delete(eventType);
        this.logger.debug(`Unsubscribed from Redis channel: ${channel}`);
      }

      return;
    }

    // 모든 핸들러 제거
    const channel = `${this.channelPrefix}${eventType}`;
    await this.subscriber.unsubscribe(channel);
    this.handlers.delete(eventType);
    this.logger.debug(`All handlers unsubscribed from event: ${eventType}`);
  }

  /**
   * 이벤트 처리 로직
   */
  private async processEvent(eventType: string, event: EventData): Promise<void> {
    // 해당 이벤트 타입에 등록된 핸들러가 없으면 종료
    if (!this.handlers.has(eventType)) {
      return;
    }

    // 모든 핸들러에게 이벤트 전달
    const handlers = this.handlers.get(eventType) || new Set();
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(`Error handling event ${eventType}: ${error.message}`, error.stack);
      }
    });

    await Promise.all(promises);
  }
} 