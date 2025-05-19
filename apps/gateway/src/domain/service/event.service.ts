// import { Injectable, Inject } from '@nestjs/common';
// import { Logger, LoggerFactory } from '@app/libs/infrastructure/logger';
// import { EventFacade } from '@app/gateway/application/facade';
// import { IEventService } from '../interface/event.interface';
// import {
//   EventListResponse,
//   EventResponse,
//   DeleteEventResponse,
//   ParticipateEventResponse,
//   RewardListResponse,
//   RewardResponse,
//   ClaimRewardResponse
// } from 'proto/interfaces';

// @Injectable()
// export class EventService implements IEventService {
//   private readonly logger: Logger;

//   constructor(
//     private readonly eventFacade: EventFacade,
//     @Inject('LOGGER_FACTORY') private readonly loggerFactory: LoggerFactory,
//   ) {
//     this.logger = this.loggerFactory.createLogger('EventService');
//   }

//   /**
//    * 이벤트 목록 조회
//    */
//   async getEvents(page: number, limit: number): Promise<EventListResponse> {
//     this.logger.debug(`이벤트 목록 조회 요청 처리: 페이지 ${page}, 한도 ${limit}`);
//     return this.eventFacade.getEvents({ page, limit });
//   }

//   /**
//    * 특정 이벤트 조회
//    */
//   async getEvent(eventId: string): Promise<EventResponse> {
//     this.logger.debug(`이벤트 조회 요청 처리: ${eventId}`);
//     return this.eventFacade.getEvent(eventId);
//   }

//   /**
//    * 이벤트 생성
//    */
//   async createEvent(title: string, description: string, startDate: Date, endDate: Date): Promise<EventResponse> {
//     this.logger.debug(`이벤트 생성 요청 처리: ${title}`);
//     return this.eventFacade.createEvent({
//       title,
//       description,
//       startDate: startDate.toISOString(),
//       endDate: endDate.toISOString(),
//       rewards: []
//     });
//   }

//   /**
//    * 이벤트 수정
//    */
//   async updateEvent(
//     eventId: string,
//     title?: string,
//     description?: string,
//     startDate?: Date,
//     endDate?: Date
//   ): Promise<EventResponse> {
//     this.logger.debug(`이벤트 수정 요청 처리: ${eventId}`);
//     return this.eventFacade.updateEvent({
//       id: eventId,
//       title,
//       description,
//       startDate: startDate?.toISOString(),
//       endDate: endDate?.toISOString()
//     });
//   }

//   /**
//    * 이벤트 삭제
//    */
//   async deleteEvent(eventId: string): Promise<DeleteEventResponse> {
//     this.logger.debug(`이벤트 삭제 요청 처리: ${eventId}`);
//     return this.eventFacade.deleteEvent(eventId);
//   }

//   /**
//    * 이벤트 참여
//    */
//   async participateEvent(eventId: string, userId: string): Promise<ParticipateEventResponse> {
//     this.logger.debug(`이벤트 참여 요청 처리: 이벤트 ${eventId}, 사용자 ${userId}`);
//     return this.eventFacade.participateEvent(eventId, userId);
//   }

//   /**
//    * 보상 목록 조회
//    */
//   async getRewards(userId: string, eventId?: string): Promise<RewardListResponse> {
//     this.logger.debug(`보상 목록 조회 요청 처리: 사용자 ${userId}, 이벤트 ${eventId || '전체'}`);
//     return this.eventFacade.getRewards({ userId, eventId });
//   }

//   /**
//    * 특정 보상 조회
//    */
//   async getReward(rewardId: string): Promise<RewardResponse> {
//     this.logger.debug(`보상 조회 요청 처리: ${rewardId}`);
//     return this.eventFacade.getReward(rewardId);
//   }

//   /**
//    * 보상 청구
//    */
//   async claimReward(rewardId: string, userId: string): Promise<ClaimRewardResponse> {
//     this.logger.debug(`보상 청구 요청 처리: 보상 ${rewardId}, 사용자 ${userId}`);
//     return this.eventFacade.claimReward(rewardId, userId);
//   }
// } 