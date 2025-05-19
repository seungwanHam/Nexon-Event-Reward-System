import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EVENT_GRPC_CLIENT } from '@app/libs/infrastructure/grpc/constants';
import { Logger, LoggerFactory } from '@app/libs/infrastructure/logger';
import {
  EventService,
  GetEventsRequest,
  EventListResponse,
  EventResponse,
  CreateEventRequest,
  UpdateEventRequest,
  DeleteEventResponse,
  ParticipateEventResponse,
  GetRewardsRequest,
  RewardListResponse,
  RewardResponse,
  ClaimRewardResponse
} from 'proto/interfaces';

@Injectable()
export class EventFacade implements OnModuleInit {
  private readonly logger: Logger;
  private eventService: EventService;

  constructor(
    @Inject(EVENT_GRPC_CLIENT) private readonly eventClient: ClientGrpc,
    @Inject('LOGGER_FACTORY') private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.createLogger('EventFacade');
  }

  onModuleInit() {
    this.eventService = this.eventClient.getService<EventService>('EventService');
    this.logger.log('Event gRPC 서비스 초기화 완료');
  }

  /**
   * 이벤트 목록 조회
   */
  async getEvents(request: GetEventsRequest): Promise<EventListResponse> {
    this.logger.debug(`이벤트 목록 조회 요청: 페이지 ${request.page}, 한도 ${request.limit}`);

    try {
      return await firstValueFrom(
        this.eventService.getEvents(request)
      );
    } catch (error) {
      this.logger.error(`이벤트 목록 조회 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 특정 이벤트 조회
   */
  async getEvent(eventId: string): Promise<EventResponse> {
    this.logger.debug(`이벤트 조회 요청: ${eventId}`);

    try {
      return await firstValueFrom(
        this.eventService.getEvent({ id: eventId })
      );
    } catch (error) {
      this.logger.error(`이벤트 조회 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 이벤트 생성
   */
  async createEvent(request: CreateEventRequest): Promise<EventResponse> {
    this.logger.debug(`이벤트 생성 요청: ${request.title}`);

    try {
      return await firstValueFrom(
        this.eventService.createEvent(request)
      );
    } catch (error) {
      this.logger.error(`이벤트 생성 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 이벤트 수정
   */
  async updateEvent(request: UpdateEventRequest): Promise<EventResponse> {
    this.logger.debug(`이벤트 수정 요청: ${request.id}`);

    try {
      return await firstValueFrom(
        this.eventService.updateEvent(request)
      );
    } catch (error) {
      this.logger.error(`이벤트 수정 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 이벤트 삭제
   */
  async deleteEvent(eventId: string): Promise<DeleteEventResponse> {
    this.logger.debug(`이벤트 삭제 요청: ${eventId}`);

    try {
      return await firstValueFrom(
        this.eventService.deleteEvent({ id: eventId })
      );
    } catch (error) {
      this.logger.error(`이벤트 삭제 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 이벤트 참여
   */
  async participateEvent(eventId: string, userId: string): Promise<ParticipateEventResponse> {
    this.logger.debug(`이벤트 참여 요청: 이벤트 ${eventId}, 사용자 ${userId}`);

    try {
      return await firstValueFrom(
        this.eventService.participateEvent({ eventId, userId })
      );
    } catch (error) {
      this.logger.error(`이벤트 참여 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 보상 목록 조회
   */
  async getRewards(request: GetRewardsRequest): Promise<RewardListResponse> {
    this.logger.debug(`보상 목록 조회 요청: 사용자 ${request.userId}, 이벤트 ${request.eventId}`);

    try {
      return await firstValueFrom(
        this.eventService.getRewards(request)
      );
    } catch (error) {
      this.logger.error(`보상 목록 조회 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 특정 보상 조회
   */
  async getReward(rewardId: string): Promise<RewardResponse> {
    this.logger.debug(`보상 조회 요청: ${rewardId}`);

    try {
      return await firstValueFrom(
        this.eventService.getReward({ id: rewardId })
      );
    } catch (error) {
      this.logger.error(`보상 조회 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 보상 청구
   */
  async claimReward(rewardId: string, userId: string): Promise<ClaimRewardResponse> {
    this.logger.debug(`보상 청구 요청: 보상 ${rewardId}, 사용자 ${userId}`);

    try {
      return await firstValueFrom(
        this.eventService.claimReward({ rewardId, userId })
      );
    } catch (error) {
      this.logger.error(`보상 청구 중 오류: ${error.message}`, error.stack);
      throw error;
    }
  }
} 