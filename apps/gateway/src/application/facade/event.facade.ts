import { Injectable } from '@nestjs/common';
import { EventHttpClient } from '@app/gateway/infrastructure/client/event.http.client';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';
import { EventFilterParams } from '@app/gateway/infrastructure/interface/event-filter-params.interface';

@Injectable()
export class EventFacade {
  constructor(
    private readonly eventClient: EventHttpClient,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('EventFacade');
  }

  /**
   * 이벤트 목록을 조회합니다.
   * 
   * @param page 페이지 번호
   * @param limit 한 페이지당 항목 수
   * @param filter 필터링 조건
   */
  async getEvents(page = 1, limit = 10, filter: EventFilterParams = {}) {
    this.logger.debug(`이벤트 목록 조회: 페이지 ${page}, 한도 ${limit}, 필터: ${JSON.stringify(filter)}`);
    return this.eventClient.getEvents(page, limit, filter);
  }

  /**
   * 활성화된 이벤트 목록을 조회합니다.
   */
  async getActiveEvents() {
    this.logger.debug('활성화된 이벤트 목록 조회');
    return this.eventClient.getActiveEvents();
  }

  /**
   * 특정 이벤트 상세 정보를 조회합니다.
   */
  async getEvent(id: string) {
    this.logger.debug(`이벤트 상세 조회: ${id}`);
    return this.eventClient.getEvent(id);
  }

  /**
   * 새 이벤트를 생성합니다.
   */
  async createEvent(eventData: any) {
    this.logger.debug('이벤트 생성', { title: eventData.title });
    return this.eventClient.createEvent(eventData);
  }

  /**
   * 이벤트 정보를 수정합니다.
   */
  async updateEvent(id: string, eventData: any) {
    this.logger.debug(`이벤트 수정: ${id}`);
    return this.eventClient.updateEvent(id, eventData);
  }

  /**
   * 이벤트 상태를 수정합니다.
   */
  async updateEventStatus(id: string, status: string) {
    this.logger.debug(`이벤트 상태 수정: ${id}, 상태: ${status}`);
    return this.eventClient.updateEventStatus(id, status);
  }

  /**
   * 이벤트를 삭제합니다.
   */
  async deleteEvent(id: string) {
    this.logger.debug(`이벤트 삭제: ${id}`);
    return this.eventClient.deleteEvent(id);
  }

  /**
   * 이벤트의 보상 목록을 조회합니다.
   */
  async getEventRewards(eventId: string) {
    this.logger.debug(`이벤트 보상 목록 조회: ${eventId}`);
    return this.eventClient.getRewards(eventId);
  }

  /**
   * 보상을 청구합니다.
   */
  async claimReward(rewardId: string, userId: string) {
    this.logger.debug(`보상 청구: 보상 ${rewardId}, 사용자 ${userId}`);
    return this.eventClient.claimReward(rewardId, userId);
  }

  /**
   * 사용자의 보상 청구 목록을 조회합니다.
   */
  async getUserClaims(userId: string) {
    this.logger.debug(`사용자 보상 청구 목록 조회: ${userId}`);
    return this.eventClient.getUserClaims(userId);
  }

  /**
   * 모든 보상 목록을 조회합니다.
   */
  async getAllRewards() {
    this.logger.debug('모든 보상 목록 조회');
    return this.eventClient.getAllRewards();
  }

  /**
   * 특정 보상 상세 정보를 조회합니다.
   */
  async getRewardById(rewardId: string) {
    this.logger.debug(`보상 상세 조회: ${rewardId}`);
    return this.eventClient.getRewardById(rewardId);
  }

  /**
   * 보상 정보를 수정합니다.
   */
  async updateReward(rewardId: string, rewardData: any) {
    this.logger.debug(`보상 수정: ${rewardId}`);
    return this.eventClient.updateReward(rewardId, rewardData);
  }

  /**
   * 보상을 삭제합니다.
   */
  async deleteReward(rewardId: string) {
    this.logger.debug(`보상 삭제: ${rewardId}`);
    return this.eventClient.deleteReward(rewardId);
  }

  /**
   * 모든 청구 목록을 조회합니다 (감사/관리자용).
   */
  async getAllClaims(page = 1, limit = 10, filter: any = {}) {
    this.logger.debug(`모든 청구 목록 조회: 페이지 ${page}, 한도 ${limit}, 필터: ${JSON.stringify(filter)}`);
    return this.eventClient.getAllClaims(page, limit, filter);
  }

  /**
   * 감사/관리자용 특정 사용자의 청구 목록을 조회합니다.
   */
  async getUserClaimsForAudit(userId: string) {
    this.logger.debug(`감사용 사용자 청구 목록 조회: ${userId}`);
    return this.eventClient.getUserClaimsForAudit(userId);
  }

  /**
   * 청구를 승인합니다.
   */
  async approveClaim(claimId: string, approverId: string) {
    this.logger.debug(`청구 승인: ${claimId}, 승인자: ${approverId}`);
    return this.eventClient.approveClaim(claimId, approverId);
  }

  /**
   * 청구를 거부합니다.
   */
  async rejectClaim(claimId: string, approverId: string, reason: string) {
    this.logger.debug(`청구 거부: ${claimId}, 승인자: ${approverId}, 사유: ${reason}`);
    return this.eventClient.rejectClaim(claimId, approverId, reason);
  }

  /**
   * 이벤트 자격 조건을 평가합니다.
   */
  async evaluateCondition(userId: string, eventId: string, actionData: any = {}) {
    this.logger.debug(`이벤트 자격 평가: 사용자 ${userId}, 이벤트 ${eventId}`);
    return this.eventClient.evaluateCondition(userId, eventId, actionData);
  }

  /**
   * 보상을 생성합니다.
   */
  async createReward(rewardData: any) {
    this.logger.debug('보상 생성 요청', { eventId: rewardData.eventId });
    return this.eventClient.createReward(rewardData);
  }

  /**
   * 보상 청구를 생성합니다.
   */
  async createClaim(userId: string, eventId: string) {
    this.logger.debug(`보상 청구 요청: 사용자 ${userId}, 이벤트 ${eventId}`);
    return this.eventClient.createClaim(userId, eventId);
  }
} 