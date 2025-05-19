import { Observable } from 'rxjs';
import { RequestData, ResponseData } from './common.interface';

// 이벤트 조회 요청
export interface GetEventsRequest {
  page?: number;
  limit?: number;
  filter?: string;
}

// 이벤트 목록 응답
export interface EventListResponse {
  events: EventData[];
  total: number;
  page: number;
  limit: number;
}

// 이벤트 데이터
export interface EventData {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  rewards: RewardData[];
  createdAt: string;
  updatedAt: string;
}

// 이벤트 단일 조회 요청
export interface GetEventRequest {
  id: string;
}

// 이벤트 응답
export interface EventResponse {
  event: EventData;
}

// 이벤트 생성 요청
export interface CreateEventRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  rewards: RewardCreateData[];
}

// 이벤트 수정 요청
export interface UpdateEventRequest {
  id: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  rewards?: RewardCreateData[];
}

// 이벤트 삭제 요청
export interface DeleteEventRequest {
  id: string;
}

// 이벤트 삭제 응답
export interface DeleteEventResponse {
  success: boolean;
}

// 이벤트 참여 요청
export interface ParticipateEventRequest {
  eventId: string;
  userId: string;
}

// 이벤트 참여 응답
export interface ParticipateEventResponse {
  success: boolean;
  rewards?: RewardData[];
}

// 보상 생성 데이터
export interface RewardCreateData {
  name: string;
  description: string;
  type: string;
  value: string;
  quantity: number;
  probabilityPercent?: number;
}

// 보상 데이터
export interface RewardData {
  id: string;
  name: string;
  description: string;
  type: string;
  value: string;
  quantity: number;
  remaining: number;
  probabilityPercent?: number;
  createdAt: string;
  updatedAt: string;
}

// 보상 목록 조회 요청
export interface GetRewardsRequest {
  eventId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

// 보상 목록 응답
export interface RewardListResponse {
  rewards: RewardData[];
  total: number;
  page: number;
  limit: number;
}

// 보상 단일 조회 요청
export interface GetRewardRequest {
  id: string;
}

// 보상 응답
export interface RewardResponse {
  reward: RewardData;
}

// 보상 청구 요청
export interface ClaimRewardRequest {
  rewardId: string;
  userId: string;
}

// 보상 청구 응답
export interface ClaimRewardResponse {
  success: boolean;
  rewardId: string;
  userId: string;
  claimedAt: string;
}

// Event 서비스 인터페이스
export interface EventService {
  getEvents(request: GetEventsRequest): Observable<EventListResponse>;
  getEvent(request: GetEventRequest): Observable<EventResponse>;
  createEvent(request: CreateEventRequest): Observable<EventResponse>;
  updateEvent(request: UpdateEventRequest): Observable<EventResponse>;
  deleteEvent(request: DeleteEventRequest): Observable<DeleteEventResponse>;
  participateEvent(request: ParticipateEventRequest): Observable<ParticipateEventResponse>;
  getRewards(request: GetRewardsRequest): Observable<RewardListResponse>;
  getReward(request: GetRewardRequest): Observable<RewardResponse>;
  claimReward(request: ClaimRewardRequest): Observable<ClaimRewardResponse>;
} 