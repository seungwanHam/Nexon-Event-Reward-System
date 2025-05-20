import { Test, TestingModule } from '@nestjs/testing';
import { UserEventController } from '../user-event.controller';
import { UserEventService } from '../../../domain/service/user-event.service';
import { CreateUserEventDto } from '../../dto/create-user-event.dto';
import { ConflictException, Logger } from '@nestjs/common';

describe('사용자 이벤트 컨트롤러 테스트', () => {
  let controller: UserEventController;
  let userEventService: any;

  beforeEach(async () => {
    userEventService = {
      recordUserEvent: jest.fn(),
      getUserEvents: jest.fn(),
      getEvent: jest.fn(),
    };

    // NestJS Logger를 목으로 대체
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserEventController],
      providers: [
        {
          provide: UserEventService,
          useValue: userEventService,
        },
      ],
    }).compile();

    controller = module.get<UserEventController>(UserEventController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('이벤트 생성 API', () => {
    it('유효한 이벤트 데이터로 이벤트를 생성할 수 있어야 한다', async () => {
      // given
      const createEventDto: CreateUserEventDto = {
        userId: 'user-123',
        eventType: 'login',
        eventKey: 'user-login',
        occurredAt: '2023-05-20T14:30:00Z',
        metadata: { device: 'mobile' },
        idempotencyKey: 'key-123',
      };

      const mockDate = new Date(createEventDto.occurredAt);
      
      const eventEntity = {
        id: 'event-123',
        userId: createEventDto.userId,
        eventType: createEventDto.eventType,
        eventKey: createEventDto.eventKey,
        occurredAt: mockDate,
        metadata: createEventDto.metadata,
        idempotencyKey: createEventDto.idempotencyKey,
      };

      const expectedResponse = {
        id: 'event-123',
        userId: createEventDto.userId,
        eventType: createEventDto.eventType,
        eventKey: createEventDto.eventKey,
        occurredAt: mockDate.toISOString(),
        metadata: createEventDto.metadata,
      };

      userEventService.recordUserEvent.mockResolvedValue(eventEntity);

      // when
      const result = await controller.createEvent(createEventDto);

      // then
      expect(result).toEqual(expectedResponse);
      expect(userEventService.recordUserEvent).toHaveBeenCalledWith({
        userId: createEventDto.userId,
        eventType: createEventDto.eventType,
        eventKey: createEventDto.eventKey,
        metadata: createEventDto.metadata,
        idempotencyKey: createEventDto.idempotencyKey,
        occurredAt: createEventDto.occurredAt,
      });
    });

    it('중복 이벤트 발생 시 ConflictException을 던지지 않고 서비스에서 처리된 결과를 반환해야 한다', async () => {
      // given
      const createEventDto: CreateUserEventDto = {
        userId: 'user-123',
        eventType: 'login',
        eventKey: 'user-login',
        occurredAt: '2023-05-20T14:30:00Z',
        metadata: {},
        idempotencyKey: 'duplicate-key',
      };

      const mockDate = new Date(createEventDto.occurredAt);
      
      const existingEventEntity = {
        id: 'event-123',
        userId: createEventDto.userId,
        eventType: createEventDto.eventType,
        eventKey: createEventDto.eventKey,
        occurredAt: mockDate,
        metadata: createEventDto.metadata,
        idempotencyKey: createEventDto.idempotencyKey,
      };

      const expectedResponse = {
        id: 'event-123',
        userId: createEventDto.userId,
        eventType: createEventDto.eventType,
        eventKey: createEventDto.eventKey,
        occurredAt: mockDate.toISOString(),
        metadata: createEventDto.metadata,
      };

      // 멱등성 키 중복 처리는 서비스에서 하므로 정상 반환
      userEventService.recordUserEvent.mockResolvedValue(existingEventEntity);

      // when
      const result = await controller.createEvent(createEventDto);

      // then
      expect(result).toEqual(expectedResponse);
      expect(userEventService.recordUserEvent).toHaveBeenCalled();
    });
  });

  describe('사용자 이벤트 조회 API', () => {
    it('사용자 ID로 이벤트 목록을 조회할 수 있어야 한다', async () => {
      // given
      const userId = 'user-123';
      const mockDate = new Date();
      
      const eventEntities = [
        { 
          id: 'event-1', 
          userId, 
          eventType: 'login',
          occurredAt: mockDate,
          metadata: {},
          createdAt: mockDate,
        },
        { 
          id: 'event-2', 
          userId, 
          eventType: 'profile_update',
          occurredAt: mockDate,
          metadata: {},
          createdAt: mockDate,
        },
      ];

      const expectedResponse = eventEntities.map(e => ({
        id: e.id,
        userId: e.userId,
        eventType: e.eventType,
        occurredAt: mockDate.toISOString(),
        metadata: e.metadata,
        createdAt: mockDate.toISOString(),
      }));

      userEventService.getUserEvents.mockResolvedValue(eventEntities);

      // when
      const result = await controller.getUserEvents(userId);

      // then
      expect(result).toEqual(expectedResponse);
      expect(userEventService.getUserEvents).toHaveBeenCalledWith(userId, undefined);
    });

    it('사용자 ID와 이벤트 타입으로 이벤트를 필터링할 수 있어야 한다', async () => {
      // given
      const userId = 'user-123';
      const eventType = 'login';
      const mockDate = new Date();
      
      const eventEntities = [
        { 
          id: 'event-1', 
          userId, 
          eventType: 'login',
          occurredAt: mockDate,
          metadata: {},
          createdAt: mockDate,
        },
      ];

      const expectedResponse = eventEntities.map(e => ({
        id: e.id,
        userId: e.userId,
        eventType: e.eventType,
        occurredAt: mockDate.toISOString(),
        metadata: e.metadata,
        createdAt: mockDate.toISOString(),
      }));

      userEventService.getUserEvents.mockResolvedValue(eventEntities);

      // when
      const result = await controller.getUserEvents(userId, eventType);

      // then
      expect(result).toEqual(expectedResponse);
      expect(userEventService.getUserEvents).toHaveBeenCalledWith(userId, eventType);
    });
  });

  describe('이벤트 상세 조회 API', () => {
    it('이벤트 ID로 특정 이벤트를 조회할 수 있어야 한다', async () => {
      // given
      const eventId = 'event-123';
      const mockDate = new Date();
      
      const eventEntity = {
        id: eventId,
        userId: 'user-123',
        eventType: 'login',
        occurredAt: mockDate,
        metadata: {},
        createdAt: mockDate,
      };

      const expectedResponse = {
        id: eventEntity.id,
        userId: eventEntity.userId,
        eventType: eventEntity.eventType,
        occurredAt: mockDate.toISOString(),
        metadata: eventEntity.metadata,
        createdAt: mockDate.toISOString(),
      };

      userEventService.getEvent.mockResolvedValue(eventEntity);

      // when
      const result = await controller.getEvent(eventId);

      // then
      expect(result).toEqual(expectedResponse);
      expect(userEventService.getEvent).toHaveBeenCalledWith(eventId);
    });

    it('존재하지 않는 이벤트 ID로 조회하면 메시지를 반환해야 한다', async () => {
      // given
      const eventId = 'non-existent-id';
      
      // 모의 구현: 이벤트 조회 결과 없음
      userEventService.getEvent.mockResolvedValue(null);

      // when
      const result = await controller.getEvent(eventId);

      // then
      expect(result).toEqual({ message: '이벤트를 찾을 수 없습니다.' });
      expect(userEventService.getEvent).toHaveBeenCalledWith(eventId);
    });
  });
}); 