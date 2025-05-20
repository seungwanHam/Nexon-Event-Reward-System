import { EventEntity } from '../entity/event.entity';

export const RULE_ENGINE = 'RULE_ENGINE';

export interface RuleEngine {
  /**
   * 사용자 행동이 특정 이벤트의 조건을 충족하는지 평가합니다.
   */
  evaluateCondition(userId: string, event: EventEntity, userAction?: any): Promise<boolean>;

  /**
   * 사용자가 특정 이벤트의 보상을 받을 자격이 있는지 확인합니다.
   */
  isEligibleForReward(userId: string, eventId: string): Promise<boolean>;

  /**
   * 사용자가 특정 이벤트의 보상을 이미 청구했는지 확인합니다.
   */
  hasClaimedReward(userId: string, eventId: string): Promise<boolean>;

  /**
   * 사용자가 특정 이벤트의 조건을 충족하는지 검증합니다.
   * 
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @returns 검증 결과
   */
  validateEventConditions(userId: string, eventId: string): Promise<{
    isValid: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }>;
} 