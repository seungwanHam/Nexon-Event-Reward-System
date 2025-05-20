import { Injectable, Inject } from '@nestjs/common';
import { EVENT_REPOSITORY, EventRepository } from '../repository/event.repository.interface';
import { RULE_ENGINE, RuleEngine } from './rule-engine.interface';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';
import { EventNotFoundException } from '@app/libs/common/exception';

/**
 * 이벤트 검증 서비스
 * 
 * 다양한 이벤트 타입에 맞는 검증기를 관리하고, 사용자의 이벤트 조건 충족 여부를 검증합니다.
 */
@Injectable()
export class EventValidatorService {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
    @Inject(RULE_ENGINE)
    private readonly ruleEngine: RuleEngine,
    private readonly logger: WinstonLoggerService
  ) {
    this.logger.setContext('EventValidatorService');
  }

  /**
   * 사용자가 특정 이벤트의 자격 조건을 충족하는지 검증합니다.
   * 
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @returns 검증 결과 객체
   */
  async validateEvent(userId: string, eventId: string): Promise<{
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

    // 이벤트 유효 기간 확인
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

    // 실제 이벤트 조건 검증은 RuleEngine에 위임
    return this.ruleEngine.validateEventConditions(userId, eventId);
  }

  /**
   * 특정 이벤트에 대해 사용자가 이미 보상을 받았는지 확인합니다.
   * 
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @returns 이미 보상을 받았는지 여부
   */
  async hasAlreadyClaimed(userId: string, eventId: string): Promise<boolean> {
    // 구현은 ClaimService에서 진행
    return false;
  }
} 