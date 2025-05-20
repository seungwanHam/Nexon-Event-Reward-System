import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';
import { EventFilterParams } from '../interface/event-filter-params.interface';

/**
 * Event 서비스와 통신하는 HTTP 클라이언트
 * 
 * Event 마이크로서비스 API 엔드포인트에 요청을 보내고 응답을 처리합니다.
 */
@Injectable()
export class EventHttpClient {
  private readonly eventServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('EventHttpClient');
    this.eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL') || 'http://localhost:3002';
    this.logger.log(`Event service URL: ${this.eventServiceUrl}`);
  }

  /**
   * 이벤트 목록을 조회합니다.
   * 
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @param filter 이벤트 필터링 조건
   */
  async getEvents(page = 1, limit = 10, filter: EventFilterParams = {}) {
    this.logger.debug(`이벤트 목록 조회 요청: 페이지 ${page}, 한도 ${limit}, 필터: ${JSON.stringify(filter)}`);
    
    const query: Record<string, any> = { 
      page, 
      limit 
    };

    // 필터 파라미터 추가
    if (filter.status) query.status = filter.status;
    if (filter.startDate) query.startDate = filter.startDate;
    if (filter.endDate) query.endDate = filter.endDate;
    if (filter.search) query.search = filter.search;
    if (filter.tags && filter.tags.length > 0) query.tags = filter.tags.join(',');
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/events`, { params: query })
    );
    
    return data;
  }

  /**
   * 활성화된 이벤트 목록을 조회합니다.
   */
  async getActiveEvents() {
    this.logger.debug('활성화된 이벤트 목록 조회 요청');
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/events/active`)
    );
    
    return data;
  }

  /**
   * 특정 이벤트 상세 정보를 조회합니다.
   * 
   * @param id 이벤트 ID
   */
  async getEvent(id: string) {
    this.logger.debug(`이벤트 상세 조회 요청: ${id}`);
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/events/${id}`)
    );
    
    return data;
  }

  /**
   * 새 이벤트를 생성합니다.
   * 
   * @param eventData 이벤트 생성 데이터
   */
  async createEvent(eventData: any) {
    this.logger.debug('이벤트 생성 요청', { name: eventData.name });
    
    // 이벤트 서버 DTO에 맞게 필드 구성
    const payload = {
      name: eventData.name,
      description: eventData.description,
      conditionType: eventData.conditionType,
      conditionParams: eventData.conditionParams,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      metadata: eventData.metadata || {}
    };
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.eventServiceUrl}/api/v1/events`, payload)
    );
    
    return data;
  }

  /**
   * 이벤트 정보를 수정합니다.
   * 
   * @param id 이벤트 ID
   * @param eventData 이벤트 수정 데이터
   */
  async updateEvent(id: string, eventData: any) {
    this.logger.debug(`이벤트 수정 요청: ${id}`);
    
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.eventServiceUrl}/api/v1/events/${id}`, eventData)
    );
    
    return data;
  }

  /**
   * 이벤트 상태를 수정합니다.
   * 
   * @param id 이벤트 ID
   * @param status 이벤트 상태
   */
  async updateEventStatus(id: string, status: string) {
    this.logger.debug(`이벤트 상태 수정 요청: ${id}, 상태: ${status}`);
    
    // 이벤트 서버 DTO에 맞게 필드 구성
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.eventServiceUrl}/api/v1/events/${id}/status`, { status })
    );
    
    return data;
  }

  /**
   * 이벤트를 삭제합니다.
   * 
   * @param id 이벤트 ID
   */
  async deleteEvent(id: string) {
    this.logger.debug(`이벤트 삭제 요청: ${id}`);
    
    const { data } = await firstValueFrom(
      this.httpService.delete(`${this.eventServiceUrl}/api/v1/events/${id}`)
    );
    
    return data;
  }

  /**
   * 이벤트의 보상 목록을 조회합니다.
   * 
   * @param eventId 이벤트 ID
   */
  async getRewards(eventId: string) {
    this.logger.debug(`이벤트 보상 목록 조회 요청: ${eventId}`);
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/rewards/event/${eventId}`)
    );
    
    return data;
  }

  /**
   * 보상 청구 신청을 합니다.
   * 
   * @param rewardId 보상 ID
   * @param userId 사용자 ID
   */
  async claimReward(rewardId: string, userId: string) {
    this.logger.debug(`보상 청구 요청: 보상 ${rewardId}, 사용자 ${userId}`);
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.eventServiceUrl}/api/v1/claims`, { rewardId, userId })
    );
    
    return data;
  }

  /**
   * 사용자의 보상 청구 목록을 조회합니다.
   * 
   * @param userId 사용자 ID
   */
  async getUserClaims(userId: string) {
    this.logger.debug(`사용자 보상 청구 목록 조회: ${userId}`);
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/claims/user`, { 
        params: { userId } 
      })
    );
    
    return data;
  }

  /**
   * 모든 보상 목록을 조회합니다.
   */
  async getAllRewards() {
    this.logger.debug('모든 보상 목록 조회 요청');
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/rewards`)
    );
    
    return data;
  }

  /**
   * 특정 보상 상세 정보를 조회합니다.
   * 
   * @param rewardId 보상 ID
   */
  async getRewardById(rewardId: string) {
    this.logger.debug(`보상 상세 조회 요청: ${rewardId}`);
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/rewards/${rewardId}`)
    );
    
    return data;
  }

  /**
   * 보상 정보를 수정합니다.
   * 
   * @param rewardId 보상 ID
   * @param rewardData 보상 수정 데이터
   */
  async updateReward(rewardId: string, rewardData: any) {
    this.logger.debug(`보상 수정 요청: ${rewardId}`);
    
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.eventServiceUrl}/api/v1/rewards/${rewardId}`, rewardData)
    );
    
    return data;
  }

  /**
   * 보상을 삭제합니다.
   * 
   * @param rewardId 보상 ID
   */
  async deleteReward(rewardId: string) {
    this.logger.debug(`보상 삭제 요청: ${rewardId}`);
    
    const { data } = await firstValueFrom(
      this.httpService.delete(`${this.eventServiceUrl}/api/v1/rewards/${rewardId}`)
    );
    
    return data;
  }

  /**
   * 모든 청구 목록을 조회합니다.
   * 
   * @param page 페이지 번호
   * @param limit 페이지당 항목 수
   * @param filter 필터링 조건
   */
  async getAllClaims(page = 1, limit = 10, filter: any = {}) {
    this.logger.debug(`모든 청구 목록 조회 요청: 페이지 ${page}, 한도 ${limit}, 필터: ${JSON.stringify(filter)}`);
    
    const query: Record<string, any> = { page, limit, ...filter };
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/claims`, { params: query })
    );
    
    return data;
  }

  /**
   * 감사/관리자용 특정 사용자의 청구 목록을 조회합니다.
   * 
   * @param userId 사용자 ID
   */
  async getUserClaimsForAudit(userId: string) {
    this.logger.debug(`감사용 사용자 청구 목록 조회: ${userId}`);
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/audit/users/${userId}/claims`)
    );
    
    return data;
  }

  /**
   * 청구를 승인합니다.
   * 
   * @param claimId 청구 ID
   * @param approverId 승인자 ID
   */
  async approveClaim(claimId: string, approverId: string) {
    this.logger.debug(`청구 승인 요청: ${claimId}, 승인자: ${approverId}`);
    
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.eventServiceUrl}/api/v1/claims/${claimId}/approve`, { approverId })
    );
    
    return data;
  }

  /**
   * 청구를 거부합니다.
   * 
   * @param claimId 청구 ID
   * @param approverId 승인자 ID
   * @param reason 거부 사유
   */
  async rejectClaim(claimId: string, approverId: string, reason: string) {
    this.logger.debug(`청구 거부 요청: ${claimId}, 승인자: ${approverId}, 사유: ${reason}`);
    
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.eventServiceUrl}/api/v1/claims/${claimId}/reject`, { approverId, reason })
    );
    
    return data;
  }

  /**
   * 이벤트 자격 조건을 평가합니다.
   * 
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @param actionData 행동 데이터
   */
  async evaluateCondition(userId: string, eventId: string, actionData: any = {}) {
    this.logger.debug(`이벤트 자격 평가 요청: 사용자 ${userId}, 이벤트 ${eventId}`);
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.eventServiceUrl}/api/v1/claims/evaluate`, { 
        userId, 
        eventId,
        actionData
      })
    );
    
    return data;
  }

  /**
   * 보상을 생성합니다.
   * 
   * @param rewardData 보상 생성 데이터
   */
  async createReward(rewardData: any) {
    this.logger.debug(`보상 생성 요청: 이벤트 ${rewardData.eventId}`);
    
    // 이벤트 서버 DTO에 맞게 필드 구성
    const payload = {
      eventId: rewardData.eventId,
      type: rewardData.type,
      amount: rewardData.amount,
      description: rewardData.description,
      requiresApproval: rewardData.requiresApproval || false,
      metadata: rewardData.metadata || {}
    };
    
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.eventServiceUrl}/api/v1/rewards`, payload)
    );
    
    return data;
  }

  /**
   * 보상 청구를 생성합니다.
   * 
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   */
  async createClaim(userId: string, eventId: string) {
    this.logger.debug(`보상 청구 요청: 사용자 ${userId}, 이벤트 ${eventId}`);
    
    // 먼저 이벤트에 연결된 보상 목록을 조회
    const rewardsResult = await firstValueFrom(
      this.httpService.get(`${this.eventServiceUrl}/api/v1/rewards/event/${eventId}`)
    );
    
    const rewards = rewardsResult.data;
    
    if (!rewards || !rewards.length) {
      throw new Error('해당 이벤트에 연결된 보상이 없습니다.');
    }
    
    // 첫 번째 보상 ID 사용
    const rewardId = rewards[0].id;
    
    // 헤더에 인증 토큰 추가 - userId는 서버에서 JWT 토큰에서 추출
    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.eventServiceUrl}/api/v1/claims`, 
        {
          userId,
          eventId,
          rewardId
        }
      )
    );
    
    return data;
  }
} 