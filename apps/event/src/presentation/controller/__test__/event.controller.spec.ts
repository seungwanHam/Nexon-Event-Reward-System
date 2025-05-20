import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from '../event.controller';
import { EventFacade } from '../../../application/facade/event.facade';
import { CreateEventDto, UpdateEventDto, ChangeEventStatusDto } from '../../dto/event.dto';
import { ConditionType, EventStatus } from '@app/libs/common/enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEntity } from '../../../domain/entity/event.entity';

describe('EventController', () => {
  let controller: EventController;
  let eventFacade: EventFacade;

  const mockEventFacade = {
    createEvent: jest.fn(),
    getAllEvents: jest.fn(),
    getActiveEvents: jest.fn(),
    getEventById: jest.fn(),
    updateEvent: jest.fn(),
    activateEvent: jest.fn(),
    deactivateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventFacade,
          useValue: mockEventFacade,
        },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    eventFacade = module.get<EventFacade>(EventFacade);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEvent', () => {
    it('유효한 데이터로 이벤트를 생성해야 한다', async () => {
      // given
      const createEventDto: CreateEventDto = {
        name: '테스트 이벤트',
        description: '테스트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z',
        metadata: { category: 'test' }
      };

      const request = { user: { id: 'admin-123' } };

      const createdEvent = {
        id: 'event-123',
        ...createEventDto,
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
        status: EventStatus.INACTIVE,
        metadata: { ...createEventDto.metadata, createdBy: 'admin-123' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockEventFacade.createEvent.mockResolvedValue(createdEvent);

      // when
      const result = await controller.createEvent(createEventDto, request);

      // then
      expect(result).toEqual(createdEvent);
      expect(mockEventFacade.createEvent).toHaveBeenCalledWith(
        createEventDto.name,
        createEventDto.description,
        createEventDto.conditionType,
        createEventDto.conditionParams,
        new Date(createEventDto.startDate),
        new Date(createEventDto.endDate),
        { ...createEventDto.metadata, createdBy: 'admin-123' }
      );
    });

    it('조건 파라미터가 잘못된 경우 예외를 발생시켜야 한다', async () => {
      // given
      const invalidCreateEventDto: CreateEventDto = {
        name: '테스트 이벤트',
        description: '테스트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: {}, // requiredCount 누락
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z'
      };

      const request = { user: { id: 'admin-123' } };

      // when, then
      await expect(controller.createEvent(invalidCreateEventDto, request))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('getAllEvents', () => {
    it('모든 이벤트 목록을 반환해야 한다', async () => {
      // given
      const mockEvents = [
        {
          id: 'event-1',
          name: '이벤트 1',
          description: '설명 1',
          conditionType: ConditionType.LOGIN,
          conditionParams: { requiredCount: 1 },
          startDate: new Date(),
          endDate: new Date(),
          status: EventStatus.ACTIVE,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'event-2',
          name: '이벤트 2',
          description: '설명 2',
          conditionType: ConditionType.CUSTOM,
          conditionParams: { eventCode: 'signup' },
          startDate: new Date(),
          endDate: new Date(),
          status: EventStatus.INACTIVE,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockEventFacade.getAllEvents.mockResolvedValue(mockEvents);

      // when
      const result = await controller.getAllEvents();

      // then
      expect(result).toEqual(mockEvents);
      expect(mockEventFacade.getAllEvents).toHaveBeenCalled();
    });
  });

  describe('getActiveEvents', () => {
    it('활성 상태의 이벤트만 반환해야 한다', async () => {
      // given
      const mockActiveEvents = [
        {
          id: 'event-1',
          name: '활성 이벤트',
          description: '활성 설명',
          conditionType: ConditionType.LOGIN,
          conditionParams: { requiredCount: 1 },
          startDate: new Date(),
          endDate: new Date(),
          status: EventStatus.ACTIVE,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockEventFacade.getActiveEvents.mockResolvedValue(mockActiveEvents);

      // when
      const result = await controller.getActiveEvents();

      // then
      expect(result).toEqual(mockActiveEvents);
      expect(mockEventFacade.getActiveEvents).toHaveBeenCalled();
    });
  });

  describe('getEventById', () => {
    it('존재하는 이벤트를 ID로 조회해야 한다', async () => {
      // given
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        name: '테스트 이벤트',
        description: '테스트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: new Date(),
        endDate: new Date(),
        status: EventStatus.ACTIVE,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockEventFacade.getEventById.mockResolvedValue(mockEvent);

      // when
      const result = await controller.getEventById(eventId);

      // then
      expect(result).toEqual(mockEvent);
      expect(mockEventFacade.getEventById).toHaveBeenCalledWith(eventId);
    });

    it('존재하지 않는 이벤트에 대해 예외를 발생시켜야 한다', async () => {
      // given
      const eventId = 'non-existent-id';
      mockEventFacade.getEventById.mockResolvedValue(null);

      // when, then
      await expect(controller.getEventById(eventId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEvent', () => {
    it('이벤트 정보를 올바르게 업데이트해야 한다', async () => {
      // given
      const eventId = 'event-123';
      const updateEventDto: UpdateEventDto = {
        name: '업데이트된 이벤트',
        description: '업데이트된 설명',
        conditionParams: { requiredCount: 5 }
      };

      const request = { user: { id: 'admin-123' } };

      const updatedEvent = {
        id: eventId,
        name: updateEventDto.name,
        description: updateEventDto.description,
        conditionType: ConditionType.LOGIN,
        conditionParams: updateEventDto.conditionParams,
        startDate: new Date(),
        endDate: new Date(),
        status: EventStatus.ACTIVE,
        metadata: { updatedBy: 'admin-123' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockEventFacade.updateEvent.mockResolvedValue(updatedEvent);

      // when
      const result = await controller.updateEvent(eventId, updateEventDto, request);

      // then
      expect(result).toEqual(updatedEvent);
      expect(mockEventFacade.updateEvent).toHaveBeenCalledWith(
        eventId,
        expect.objectContaining({
          name: updateEventDto.name,
          description: updateEventDto.description,
          conditionParams: updateEventDto.conditionParams,
          metadata: expect.objectContaining({
            updatedBy: 'admin-123',
            lastUpdated: expect.any(String)
          })
        })
      );
    });

    it('잘못된 조건 파라미터로 업데이트 시 예외를 발생시켜야 한다', async () => {
      // given
      const eventId = 'event-123';
      const invalidUpdateEventDto: UpdateEventDto = {
        conditionType: ConditionType.CUSTOM,
        conditionParams: {} // eventCode 누락
      };

      const request = { user: { id: 'admin-123' } };

      // when, then
      await expect(controller.updateEvent(eventId, invalidUpdateEventDto, request))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('changeEventStatus', () => {
    it('이벤트 상태를 활성으로 변경해야 한다', async () => {
      // given
      const eventId = 'event-123';
      const changeStatusDto: ChangeEventStatusDto = {
        status: EventStatus.ACTIVE
      };

      const request = { user: { id: 'admin-123' } };

      const updatedEvent = {
        id: eventId,
        name: '테스트 이벤트',
        description: '테스트 설명',
        conditionType: ConditionType.LOGIN,
        conditionParams: { requiredCount: 3 },
        startDate: new Date(),
        endDate: new Date(),
        status: EventStatus.ACTIVE,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockEventFacade.activateEvent.mockResolvedValue(updatedEvent);
      mockEventFacade.updateEvent.mockResolvedValue(updatedEvent);

      // when
      const result = await controller.changeEventStatus(eventId, changeStatusDto, request);

      // then
      expect(result).toEqual(updatedEvent);
      expect(mockEventFacade.activateEvent).toHaveBeenCalledWith(eventId);
      expect(mockEventFacade.updateEvent).toHaveBeenCalledWith(
        eventId,
        expect.objectContaining({
          metadata: expect.objectContaining({
            statusChangedBy: 'admin-123',
            statusChangedAt: expect.any(String),
            previousStatus: 'inactive'
          })
        })
      );
    });

    it('지원하지 않는 상태로 변경 시 예외를 발생시켜야 한다', async () => {
      // given
      const eventId = 'event-123';
      const invalidChangeStatusDto = {
        status: 'unknown-status'
      } as unknown as ChangeEventStatusDto;

      const request = { user: { id: 'admin-123' } };

      // when, then
      await expect(controller.changeEventStatus(eventId, invalidChangeStatusDto, request))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('deleteEvent', () => {
    it('이벤트를 성공적으로 삭제해야 한다', async () => {
      // given
      const eventId = 'event-123';
      mockEventFacade.deleteEvent.mockResolvedValue(undefined);

      // when, then
      await expect(controller.deleteEvent(eventId)).resolves.not.toThrow();
      expect(mockEventFacade.deleteEvent).toHaveBeenCalledWith(eventId);
    });
  });
}); 