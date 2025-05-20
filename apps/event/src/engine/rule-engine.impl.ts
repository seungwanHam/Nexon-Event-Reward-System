import { Injectable, Inject } from '@nestjs/common';
import { RuleEngine } from '../domain/service/rule-engine.interface';
import { EventEntity } from '../domain/entity/event.entity';
import { REWARD_CLAIM_REPOSITORY, RewardClaimRepository } from '../domain/repository/reward-claim.repository.interface';
import { EVENT_REPOSITORY, EventRepository } from '../domain/repository/event.repository.interface';
import { USER_EVENT_REPOSITORY, UserEventRepository } from '../domain/repository/user-event.repository';
import { ConditionType } from '@app/libs/common/enum';
import { EventNotFoundException } from '@app/libs/common/exception';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

@Injectable()
export class RuleEngineImpl implements RuleEngine {
  constructor(
    @Inject(REWARD_CLAIM_REPOSITORY)
    private readonly claimRepository: RewardClaimRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
    @Inject(USER_EVENT_REPOSITORY)
    private readonly userEventRepository: UserEventRepository,
    private readonly logger: WinstonLoggerService
  ) {
    this.logger.setContext('RuleEngine');
  }

  /**
   * 사용자 행동이 이벤트 조건을 충족하는지 평가합니다.
   */
  async evaluateCondition(userId: string, event: EventEntity, userAction?: any): Promise<boolean> {
    if (!event.isValid()) {
      return false;
    }

    switch (event.conditionType) {
      case ConditionType.LOGIN:
        return this.evaluateLoginCondition(userId, event, userAction);
      case ConditionType.CUSTOM:
        return this.evaluateCustomCondition(userId, event, userAction);
      default:
        this.logger.warn(`지원하지 않는 이벤트 타입: ${event.conditionType}`);
        return false;
    }
  }

  /**
   * 사용자가 이벤트 보상을 받을 자격이 있는지 확인합니다.
   */
  async isEligibleForReward(userId: string, eventId: string): Promise<boolean> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundException();
    }

    if (!event.isValid()) {
      return false;
    }

    // 자격 조건 평가
    return this.evaluateCondition(userId, event);
  }

  /**
   * 사용자가 이미 이벤트 보상을 청구했는지 확인합니다.
   */
  async hasClaimedReward(userId: string, eventId: string): Promise<boolean> {
    const claims = await this.claimRepository.findByUserAndEvent(userId, eventId);
    return claims.length > 0;
  }

  // 조건 유형별 평가 메서드
  private async evaluateLoginCondition(userId: string, event: EventEntity, userAction?: any): Promise<boolean> {
    const { requiredCount } = event.conditionParams;

    // 실제 사용자 로그인 이벤트 조회
    const loginEvents = await this.userEventRepository.findByUser(userId, 'login');
    const loginCount = loginEvents.length;

    this.logger.debug(`로그인 조건 평가: 사용자 ${userId}, 필요 로그인 수 ${requiredCount}, 실제 로그인 수 ${loginCount}`);
    return loginCount >= requiredCount;
  }

  private async evaluateCustomCondition(userId: string, event: EventEntity, userAction?: any): Promise<boolean> {
    const { eventCode } = event.conditionParams;

    this.logger.debug(`커스텀 조건 평가 시도: 사용자 ${userId}, 이벤트 코드 ${eventCode}`);

    // 이벤트 코드와 이벤트 키 매핑 테이블
    const eventCodeToKeyMap: Record<string, string> = {
      'register': 'user-register',
      'SIGN_UP': 'user-register',
      'profile_update': 'user-profile_update',
      'purchase': 'user-purchase',
      'login': 'user-login'
    };

    // 이벤트 코드에 따라 매핑된 eventKey 사용
    const eventKey = eventCodeToKeyMap[eventCode] || eventCode;

    // 실제 사용자 커스텀 이벤트 조회 - eventType이 custom이고 eventKey가 일치하는 이벤트 조회
    const allUserEvents = await this.userEventRepository.findByUser(userId);
    const customEvents = allUserEvents.filter(event =>
      event.eventType === 'custom' && event.eventKey === eventKey
    );

    const hasRequiredEvent = customEvents.length > 0;

    this.logger.debug(`커스텀 조건 평가: 사용자 ${userId}, 이벤트 키 ${eventKey}, 이벤트 존재 여부 ${hasRequiredEvent}, 찾은 이벤트 수: ${customEvents.length}`);
    this.logger.debug(`사용자 이벤트 목록: ${JSON.stringify(allUserEvents.map(e => ({ eventType: e.eventType, eventKey: e.eventKey })))}`);

    return hasRequiredEvent;
  }

  /**
   * 사용자가 특정 이벤트의 조건을 충족하는지 검증합니다.
   */
  async validateEventConditions(userId: string, eventId: string): Promise<{
    isValid: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }> {
    this.logger.debug(`이벤트 조건 검증: 사용자 ${userId}, 이벤트 ${eventId}`);

    // 이벤트 존재 확인
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundException();
    }

    if (!event.isValid()) {
      return {
        isValid: false,
        errorMessage: '이벤트가 활성 상태가 아니거나 유효 기간이 아닙니다',
        metadata: {
          validatedAt: new Date(),
          eventStatus: event.status,
          startDate: event.startDate,
          endDate: event.endDate
        }
      };
    }

    // 지원하지 않는 이벤트 타입 확인
    if (![ConditionType.LOGIN, ConditionType.CUSTOM].includes(event.conditionType)) {
      return {
        isValid: false,
        errorMessage: `지원하지 않는 이벤트 타입입니다: ${event.conditionType}. 현재는 LOGIN과 회원가입(CUSTOM) 이벤트만 지원합니다.`,
        metadata: {
          validatedAt: new Date(),
          eventType: event.conditionType,
          supportedTypes: [ConditionType.LOGIN, ConditionType.CUSTOM]
        }
      };
    }

    // 이벤트 조건 검증 - 실제 사용자 이벤트 데이터 기반
    const isEligible = await this.evaluateCondition(userId, event);

    if (!isEligible) {
      return {
        isValid: false,
        errorMessage: '이벤트 조건을 충족하지 못했습니다. 필요한 사용자 행동 기록이 없습니다.',
        metadata: {
          validatedAt: new Date(),
          userId,
          eventId,
          conditionType: event.conditionType
        }
      };
    }

    return {
      isValid: true,
      metadata: {
        validatedAt: new Date(),
        userId,
        eventId,
        conditionType: event.conditionType
      }
    };
  }
} 