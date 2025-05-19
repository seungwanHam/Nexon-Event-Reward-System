import {
  EventListResponse,
  EventResponse,
  DeleteEventResponse,
  ParticipateEventResponse,
  RewardListResponse,
  RewardResponse,
  ClaimRewardResponse
} from 'proto/interfaces';

/**
 * Event 서비스의 비즈니스 로직을 정의하는 인터페이스
 */
export interface IEventService {
  /**
   * 이벤트 목록 조회
   */
  getEvents(page: number, limit: number): Promise<EventListResponse>;

  /**
   * 특정 이벤트 조회
   */
  getEvent(eventId: string): Promise<EventResponse>;

  /**
   * 이벤트 생성
   */
  createEvent(title: string, description: string, startDate: Date, endDate: Date): Promise<EventResponse>;

  /**
   * 이벤트 수정
   */
  updateEvent(eventId: string, title?: string, description?: string, startDate?: Date, endDate?: Date): Promise<EventResponse>;

  /**
   * 이벤트 삭제
   */
  deleteEvent(eventId: string): Promise<DeleteEventResponse>;

  /**
   * 이벤트 참여
   */
  participateEvent(eventId: string, userId: string): Promise<ParticipateEventResponse>;

  /**
   * 보상 목록 조회
   */
  getRewards(userId: string, eventId?: string): Promise<RewardListResponse>;

  /**
   * 특정 보상 조회
   */
  getReward(rewardId: string): Promise<RewardResponse>;

  /**
   * 보상 청구
   */
  claimReward(rewardId: string, userId: string): Promise<ClaimRewardResponse>;
} 