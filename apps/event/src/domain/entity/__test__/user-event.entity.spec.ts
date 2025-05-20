import { UserEventEntity } from './../user-event.entity';

describe('사용자 이벤트 엔티티 테스트', () => {
  it('유효한 값으로 사용자 이벤트 엔티티를 생성할 수 있어야 한다', () => {
    // given
    const eventProps = {
      userId: 'user-123',
      eventType: 'login',
      eventKey: 'user-login',
      metadata: { device: 'mobile' }
    };

    // when
    const event = UserEventEntity.create(eventProps);

    // then
    expect(event.userId).toBe(eventProps.userId);
    expect(event.eventType).toBe(eventProps.eventType);
    expect(event.eventKey).toBe(eventProps.eventKey);
    expect(event.metadata).toEqual(eventProps.metadata);
    expect(event.occurredAt).toBeDefined();
  });

  it('문자열 형태의 발생시간이 Date 객체로 변환되어야 한다', () => {
    // given
    const dateStr = '2023-06-15T14:30:00Z';
    
    // when
    const event = UserEventEntity.create({
      userId: 'user-123',
      eventType: 'login',
      eventKey: 'user-login',
      occurredAt: dateStr
    });

    // then
    expect(event.occurredAt).toBeInstanceOf(Date);
    // ISO 문자열 변환 시 밀리초 부분(.000)이 추가될 수 있으므로 startsWith로 검증
    expect(event.occurredAt.toISOString()).toMatch(/^2023-06-15T14:30:00/);
  });
}); 