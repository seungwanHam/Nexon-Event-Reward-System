import { Test, TestingModule } from '@nestjs/testing';
import { RuleEngineImpl } from './rule-engine.impl';
import { EventEntity } from '../domain/entity/event.entity';
import { REWARD_CLAIM_REPOSITORY } from '../domain/repository/reward-claim.repository.interface';
import { EVENT_REPOSITORY } from '../domain/repository/event.repository.interface';
import { USER_EVENT_REPOSITORY } from '../domain/repository/user-event.repository';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

// 외부 의존성을 직접 구현
enum ConditionType {
  LOGIN = 'login',
  CUSTOM = 'custom',
  PURCHASE = 'purchase',
}

// 로거 모킹
class MockLogger {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
  setContext = jest.fn();
}

describe('규칙 엔진 구현체 테스트', () => {
  let ruleEngine: RuleEngineImpl;
  let userEventRepository: any;
  let eventRepository: any;
  let claimRepository: any;

  beforeEach(async () => {
    // 모의 객체 생성
    userEventRepository = {
      findByUser: jest.fn(),
    };

    eventRepository = {
      findById: jest.fn(),
    };

    claimRepository = {
      findByUserAndEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineImpl,
        {
          provide: USER_EVENT_REPOSITORY,
          useValue: userEventRepository,
        },
        {
          provide: EVENT_REPOSITORY,
          useValue: eventRepository,
        },
        {
          provide: REWARD_CLAIM_REPOSITORY,
          useValue: claimRepository,
        },
        {
          provide: WinstonLoggerService,
          useClass: MockLogger,
        },
      ],
    }).compile();

    ruleEngine = module.get<RuleEngineImpl>(RuleEngineImpl);
  });

  describe('로그인 조건 평가', () => {
    it('필요한 로그인 횟수를 충족하면 true를 반환해야 한다', async () => {
      // given
      const userId = 'user-123';
      const event = {
        id: 'event-123',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 2 },
        isValid: () => true,
      } as unknown as EventEntity;

      userEventRepository.findByUser.mockResolvedValue([
        { eventType: 'login', occurredAt: new Date() },
        { eventType: 'login', occurredAt: new Date() },
      ]);

      // when
      const result = await ruleEngine.evaluateCondition(userId, event);

      // then
      expect(result).toBe(true);
      expect(userEventRepository.findByUser).toHaveBeenCalledWith(userId, 'login');
    });

    it('필요한 로그인 횟수를 충족하지 못하면 false를 반환해야 한다', async () => {
      // given
      const userId = 'user-123';
      const event = {
        id: 'event-123',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        isValid: () => true,
      } as unknown as EventEntity;

      userEventRepository.findByUser.mockResolvedValue([
        { eventType: 'login', occurredAt: new Date() },
      ]);

      // when
      const result = await ruleEngine.evaluateCondition(userId, event);

      // then
      expect(result).toBe(false);
      expect(userEventRepository.findByUser).toHaveBeenCalledWith(userId, 'login');
    });
  });

  describe('커스텀 조건 평가', () => {
    it('회원가입 이벤트 코드가 사용자 이벤트와 일치하면 true를 반환해야 한다', async () => {
      // given
      const userId = 'user-123';
      const event = {
        id: 'event-123',
        conditionType: ConditionType.CUSTOM,
        conditionParams: { eventCode: 'SIGN_UP' },
        isValid: () => true,
      } as unknown as EventEntity;

      userEventRepository.findByUser.mockResolvedValue([
        { eventType: 'custom', eventKey: 'user-register', occurredAt: new Date() },
      ]);

      // when
      const result = await ruleEngine.evaluateCondition(userId, event);

      // then
      expect(result).toBe(true);
      expect(userEventRepository.findByUser).toHaveBeenCalledWith(userId);
    });
    
    it('이벤트 코드와 매핑되는 이벤트 키가 없으면 false를 반환해야 한다', async () => {
      // given
      const userId = 'user-123';
      const event = {
        id: 'event-123',
        conditionType: ConditionType.CUSTOM,
        conditionParams: { eventCode: 'UNKNOWN_EVENT' },
        isValid: () => true,
      } as unknown as EventEntity;

      userEventRepository.findByUser.mockResolvedValue([
        { eventType: 'custom', eventKey: 'user-register', occurredAt: new Date() },
      ]);

      // when
      const result = await ruleEngine.evaluateCondition(userId, event);

      // then
      expect(result).toBe(false);
      expect(userEventRepository.findByUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('이벤트 조건 검증', () => {
    it('유효하지 않은 이벤트면 isValid=false를 반환해야 한다', async () => {
      // given
      const userId = 'user-123';
      const eventId = 'event-123';
      const event = {
        id: eventId,
        status: 'inactive',
        startDate: new Date(),
        endDate: new Date(),
        isValid: () => false,
      } as unknown as EventEntity;

      eventRepository.findById.mockResolvedValue(event);

      // when
      const result = await ruleEngine.validateEventConditions(userId, eventId);

      // then
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('이벤트가 활성 상태가 아니거나 유효 기간이 아닙니다');
    });
  });
}); 