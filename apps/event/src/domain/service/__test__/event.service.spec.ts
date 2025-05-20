import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from '../event.service';
import { EventEntity } from '../../entity/event.entity';
import { EVENT_REPOSITORY, EventRepository } from '../../repository/event.repository.interface';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';
import { ConditionType, EventStatus } from '@app/libs/common/enum';
import { EventNotFoundException } from '@app/libs/common/exception';

class MockEventRepository implements EventRepository {
  private events: EventEntity[] = [];

  async findById(id: string): Promise<EventEntity> {
    const event = this.events.find(e => e.id === id);
    if (!event) {
      throw new EventNotFoundException();
    }
    return event;
  }

  async findAll(): Promise<EventEntity[]> {
    return [...this.events];
  }

  async findActive(): Promise<EventEntity[]> {
    return this.events.filter(e => e.status === EventStatus.ACTIVE && e.isWithinPeriod());
  }

  async save(event: EventEntity): Promise<void> {
    const index = this.events.findIndex(e => e.id === event.id);
    if (index >= 0) {
      this.events[index] = event;
    } else {
      this.events.push(event);
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.events.findIndex(e => e.id === id);
    if (index >= 0) {
      this.events.splice(index, 1);
    } else {
      throw new EventNotFoundException();
    }
  }
}

describe('EventService', () => {
  let service: EventService;
  let repository: MockEventRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: EVENT_REPOSITORY,
          useClass: MockEventRepository,
        },
        {
          provide: WinstonLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            verbose: jest.fn(),
            setContext: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    repository = module.get<MockEventRepository>(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('유효한 데이터로 이벤트를 생성해야 한다', async () => {
      // given
      const eventData = {
        name: '테스트 이벤트',
        description: '테스트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        metadata: { createdBy: 'admin' }
      };

      // when
      const event = await service.createEvent(
        eventData.name,
        eventData.description,
        eventData.conditionType,
        eventData.conditionParams,
        eventData.startDate,
        eventData.endDate,
        eventData.metadata
      );

      // then
      expect(event).toBeDefined();
      expect(event.name).toBe('테스트 이벤트');
      expect(event.status).toBe(EventStatus.INACTIVE);
      expect(event.conditionParams.requiredCount).toBe(3);
    });
  });

  describe('findEventById', () => {
    it('존재하는 이벤트를 찾아야 한다', async () => {
      // given
      const eventData = {
        id: 'event-123',
        name: '테스트 이벤트',
        description: '테스트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: EventStatus.ACTIVE
      };
      const event = EventEntity.create(eventData);
      await repository.save(event);

      // when
      const foundEvent = await service.findEventById('event-123');

      // then
      expect(foundEvent).toBeDefined();
      expect(foundEvent.id).toBe('event-123');
      expect(foundEvent.name).toBe('테스트 이벤트');
    });

    it('존재하지 않는 이벤트에 대해 예외를 발생시켜야 한다', async () => {
      // when, then
      await expect(service.findEventById('non-existent-id')).rejects.toThrow(EventNotFoundException);
    });
  });

  describe('updateEvent', () => {
    it('이벤트 정보를 업데이트해야 한다', async () => {
      // given
      const event = EventEntity.create({
        id: 'event-123',
        name: '원래 이벤트',
        description: '원래 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 1 },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        status: EventStatus.INACTIVE
      });
      await repository.save(event);

      const updateData = {
        name: '업데이트된 이벤트',
        description: '업데이트된 설명',
        conditionParams: { requiredCount: 5 }
      };

      // when
      const updatedEvent = await service.updateEvent('event-123', updateData);

      // then
      expect(updatedEvent.name).toBe('업데이트된 이벤트');
      expect(updatedEvent.description).toBe('업데이트된 설명');
      expect(updatedEvent.conditionParams.requiredCount).toBe(5);
    });
  });

  describe('deleteEvent', () => {
    it('이벤트를 삭제해야 한다', async () => {
      // given
      const event = EventEntity.create({
        id: 'event-123',
        name: '테스트 이벤트',
        description: '테스트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      });
      await repository.save(event);

      // when
      await service.deleteEvent('event-123');
      
      // then
      await expect(service.findEventById('event-123')).rejects.toThrow(EventNotFoundException);
    });
  });

  describe('findAllEvents', () => {
    it('모든 이벤트를 반환해야 한다', async () => {
      // given
      const event1 = EventEntity.create({
        id: 'event-1',
        name: '이벤트 1',
        description: '설명 1',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      });

      const event2 = EventEntity.create({
        id: 'event-2',
        name: '이벤트 2',
        description: '설명 2',
        conditionType: ConditionType.CUSTOM,
        conditionParams: { eventCode: 'TEST' },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      });

      await repository.save(event1);
      await repository.save(event2);

      // when
      const events = await service.findAllEvents();

      // then
      expect(events).toHaveLength(2);
      expect(events.map(e => e.id)).toContain('event-1');
      expect(events.map(e => e.id)).toContain('event-2');
    });
  });

  describe('findActiveEvents', () => {
    it('활성 상태이고 유효 기간 내인 이벤트만 반환해야 한다', async () => {
      // given
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setMonth(pastDate.getMonth() - 1);
      
      const futureDate = new Date(now);
      futureDate.setMonth(futureDate.getMonth() + 1);

      // 활성 + 유효기간 내 이벤트
      const activeEvent = EventEntity.create({
        id: 'active-event',
        name: '활성 이벤트',
        description: '활성 이벤트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: pastDate,
        endDate: futureDate,
        status: EventStatus.ACTIVE
      });

      // 비활성 이벤트
      const inactiveEvent = EventEntity.create({
        id: 'inactive-event',
        name: '비활성 이벤트',
        description: '비활성 이벤트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: pastDate,
        endDate: futureDate,
        status: EventStatus.INACTIVE
      });

      // 기간 종료 이벤트
      const pastEvent = EventEntity.create({
        id: 'past-event',
        name: '종료된 이벤트',
        description: '종료된 이벤트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: new Date('2022-01-01'),
        endDate: new Date('2022-12-31'),
        status: EventStatus.ACTIVE
      });

      await repository.save(activeEvent);
      await repository.save(inactiveEvent);
      await repository.save(pastEvent);

      // when
      const activeEvents = await service.findActiveEvents();

      // then
      expect(activeEvents).toHaveLength(1);
      expect(activeEvents[0].id).toBe('active-event');
    });
  });
}); 