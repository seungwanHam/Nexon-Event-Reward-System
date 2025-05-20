import { Injectable } from '@nestjs/common';
import { EventValidator, ValidationResult } from '../event-validator.interface';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

/**
 * 친구 초대 기반 이벤트 검증기
 * 
 * 사용자가 초대한 친구 수를 기반으로 이벤트 조건을 검증합니다.
 */
@Injectable()
export class InviteEventValidator implements EventValidator {
  constructor(
    private readonly logger: WinstonLoggerService
  ) {
    this.logger.setContext('InviteEventValidator');
  }

  /**
   * 친구 초대 이벤트 검증 (임시 구현)
   */
  async validate(userId: string, eventId: string, eventConfig: any): Promise<{
    isValid: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }> {
    this.logger.debug(`친구 초대 이벤트 검증: 사용자 ${userId}, 이벤트 ${eventId}`);
    
    // 실제 구현에서는 초대 이력을 확인해야 합니다.
    // 임시 구현에서는 항상 성공으로 처리합니다.
    return {
      isValid: true,
      metadata: {
        validatedAt: new Date(),
        userId,
        eventId,
        type: 'invite'
      }
    };
  }
} 