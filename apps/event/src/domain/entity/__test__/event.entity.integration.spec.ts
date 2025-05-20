import { EventEntity } from '../event.entity';
import { ConditionType, EventStatus } from '@app/libs/common/enum';

/**
 * 이벤트 엔티티 통합 테스트
 * 
 * 이 테스트는 모의 객체가 아닌 실제 구현체를 사용합니다.
 * 실행 방법: USE_MOCKS=false jest event.entity.integration.spec.ts
 */
describe('이벤트 엔티티 통합 테스트', () => {
  describe('이벤트 생성', () => {
    it('유효한 데이터로 이벤트를 생성해야 한다', () => {
      // given
      const eventData = {
        id: `event-${Date.now()}`,
        name: '이벤트 테스트',
        description: '테스트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: EventStatus.ACTIVE,
        metadata: { createdBy: 'admin' }
      };

      // when
      const event = EventEntity.create(eventData);

      // then
      expect(event).toBeDefined();
      expect(event.name).toBe('이벤트 테스트');
      expect(event.status).toBe(EventStatus.ACTIVE);
      expect(event.conditionParams.requiredCount).toBe(3);
    });
  });

  describe('이벤트 메서드', () => {
    let event: EventEntity;

    beforeEach(() => {
      // 각 테스트 전에 기본 이벤트 엔티티 생성
      event = EventEntity.create({
        id: `event-${Date.now()}`,
        name: '테스트 이벤트',
        description: '테스트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: EventStatus.ACTIVE
      });
    });

    it('isActive 메서드는 상태가 ACTIVE인 경우 true를 반환해야 한다', () => {
      // given
      event.status = EventStatus.ACTIVE;

      // when
      const result = event.isActive();

      // then
      expect(result).toBe(true);
    });

    it('isActive 메서드는 상태가 ACTIVE가 아닌 경우 false를 반환해야 한다', () => {
      // given
      event.status = EventStatus.INACTIVE;

      // when
      const result = event.isActive();

      // then
      expect(result).toBe(false);
    });

    it('isWithinPeriod 메서드는 주어진 날짜가 기간 내인 경우 true를 반환해야 한다', () => {
      // given
      // 기본 이벤트 사용

      // when
      const result = event.isWithinPeriod(new Date('2023-06-15'));

      // then
      expect(result).toBe(true);
    });

    it('isWithinPeriod 메서드는 주어진 날짜가 기간 이전인 경우 false를 반환해야 한다', () => {
      // given
      // 기본 이벤트 사용

      // when
      const result = event.isWithinPeriod(new Date('2022-12-31'));

      // then
      expect(result).toBe(false);
    });

    it('isWithinPeriod 메서드는 주어진 날짜가 기간 이후인 경우 false를 반환해야 한다', () => {
      // given
      // 기본 이벤트 사용

      // when
      const result = event.isWithinPeriod(new Date('2024-01-01'));

      // then
      expect(result).toBe(false);
    });

    it('isValid 메서드는 활성 상태이고 기간 내인 경우 true를 반환해야 한다', () => {
      // given
      event.status = EventStatus.ACTIVE;

      // when
      const result = event.isValid(new Date('2023-06-15'));

      // then
      expect(result).toBe(true);
    });

    it('isValid 메서드는 비활성 상태인 경우 false를 반환해야 한다', () => {
      // given
      event.status = EventStatus.INACTIVE;

      // when
      const result = event.isValid(new Date('2023-06-15'));

      // then
      expect(result).toBe(false);
    });

    it('autoUpdateStatus 메서드는 종료된 이벤트를 만료 상태로 변경해야 한다', () => {
      // given
      const expiredEvent = EventEntity.create({
        id: `event-${Date.now()}`,
        name: '만료 이벤트',
        description: '만료 이벤트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 1 },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        status: EventStatus.ACTIVE
      });

      // when
      expiredEvent.autoUpdateStatus(new Date('2023-02-01'));

      // then
      expect(expiredEvent.status).toBe(EventStatus.EXPIRED);
    });

    it('autoUpdateStatus 메서드는 종료되지 않은 이벤트의 상태를 변경하지 않아야 한다', () => {
      // given
      // 기본 이벤트 사용

      // when
      event.autoUpdateStatus(new Date('2023-06-15'));

      // then
      expect(event.status).toBe(EventStatus.ACTIVE);
    });
  });
}); 