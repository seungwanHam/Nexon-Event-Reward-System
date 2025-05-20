import { Injectable, Inject } from '@nestjs/common';
import { EventService, RewardService, ClaimService } from '../../domain/service';
import { EventEntity, RewardEntity, RewardClaimEntity } from '../../domain/entity';
import { ConditionType, EventStatus, RewardType, ClaimStatus } from '@app/libs/common/enum';
import { RULE_ENGINE, RuleEngine } from '../../domain/service/rule-engine.interface';

@Injectable()
export class EventFacade {
  constructor(
    private readonly eventService: EventService,
    private readonly rewardService: RewardService,
    private readonly claimService: ClaimService,
    @Inject(RULE_ENGINE)
    private readonly ruleEngine: RuleEngine,
  ) { }

  // 이벤트 관련 메서드
  async createEvent(
    name: string,
    description: string,
    conditionType: ConditionType,
    conditionParams: Record<string, any>,
    startDate: Date,
    endDate: Date,
    metadata?: Record<string, any>,
  ): Promise<EventEntity> {
    return this.eventService.createEvent(
      name,
      description,
      conditionType,
      conditionParams,
      startDate,
      endDate,
      metadata,
    );
  }

  async getAllEvents(): Promise<EventEntity[]> {
    return this.eventService.findAllEvents();
  }

  async getActiveEvents(): Promise<EventEntity[]> {
    return this.eventService.findActiveEvents();
  }

  async getEventById(id: string): Promise<EventEntity> {
    return this.eventService.findEventById(id);
  }

  async updateEvent(
    id: string,
    updateData: Partial<Omit<EventEntity, 'id' | 'createdAt'>>,
  ): Promise<EventEntity> {
    return this.eventService.updateEvent(id, updateData);
  }

  async activateEvent(id: string): Promise<EventEntity> {
    return this.eventService.changeEventStatus(id, EventStatus.ACTIVE);
  }

  async deactivateEvent(id: string): Promise<EventEntity> {
    return this.eventService.changeEventStatus(id, EventStatus.INACTIVE);
  }

  async deleteEvent(id: string): Promise<void> {
    return this.eventService.deleteEvent(id);
  }

  // 보상 관련 메서드
  async createReward(
    eventId: string,
    type: RewardType,
    amount: number,
    description: string,
    requiresApproval: boolean = false,
    metadata?: Record<string, any>,
  ): Promise<RewardEntity> {
    return this.rewardService.createReward(
      eventId,
      type,
      amount,
      description,
      requiresApproval,
      metadata,
    );
  }

  async getRewardsByEventId(eventId: string): Promise<RewardEntity[]> {
    return this.rewardService.findRewardsByEventId(eventId);
  }

  async getAllRewards(): Promise<RewardEntity[]> {
    return this.rewardService.findAllRewards();
  }

  async getRewardById(id: string): Promise<RewardEntity> {
    return this.rewardService.findRewardById(id);
  }

  async updateReward(
    id: string,
    updateData: Partial<Omit<RewardEntity, 'id' | 'eventId' | 'createdAt'>>,
  ): Promise<RewardEntity> {
    return this.rewardService.updateReward(id, updateData);
  }

  async deleteReward(id: string): Promise<void> {
    return this.rewardService.deleteReward(id);
  }

  // 보상 청구 관련 메서드
  async createClaim(
    userId: string,
    eventId: string,
    rewardId: string,
  ): Promise<RewardClaimEntity> {
    return this.claimService.createClaim(userId, eventId, rewardId);
  }

  async approveClaim(claimId: string, approverId: string): Promise<RewardClaimEntity> {
    return this.claimService.approveClaim(claimId, approverId);
  }

  async rejectClaim(
    claimId: string,
    approverId: string,
    reason: string,
  ): Promise<RewardClaimEntity> {
    return this.claimService.rejectClaim(claimId, approverId, reason);
  }

  async getUserClaims(userId: string): Promise<RewardClaimEntity[]> {
    return this.claimService.findClaimsByUserId(userId);
  }

  async getEventClaims(eventId: string): Promise<RewardClaimEntity[]> {
    return this.claimService.findClaimsByEventId(eventId);
  }

  async getPendingClaims(): Promise<RewardClaimEntity[]> {
    return this.claimService.findClaimsByStatus(ClaimStatus.PENDING);
  }

  async getAllClaims(): Promise<RewardClaimEntity[]> {
    return this.claimService.findAllClaims();
  }

  async getClaimById(id: string): Promise<RewardClaimEntity> {
    return this.claimService.findClaimById(id);
  }

  // 규칙 엔진 관련 메서드
  async isEligibleForReward(userId: string, eventId: string): Promise<boolean> {
    return this.ruleEngine.isEligibleForReward(userId, eventId);
  }

  async hasClaimedReward(userId: string, eventId: string): Promise<boolean> {
    return this.ruleEngine.hasClaimedReward(userId, eventId);
  }

  async evaluateUserAction(
    userId: string,
    eventId: string,
    userAction: any,
  ): Promise<boolean> {
    const event = await this.eventService.findEventById(eventId);
    return this.ruleEngine.evaluateCondition(userId, event, userAction);
  }
} 