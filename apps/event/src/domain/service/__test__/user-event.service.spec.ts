import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, Logger } from '@nestjs/common';
import { UserEventService } from '../user-event.service';
import { UserEventEntity } from '../../entity/user-event.entity';
import { USER_EVENT_REPOSITORY } from '../../repository/user-event.repository';

describe('사용자 이벤트 서비스 테스트', () => {
  let service: UserEventService;
  let userEventRepository: any;

  beforeEach(async () => {
    // Mock the repository
    userEventRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      findByUser: jest.fn(),
    };

    // Mock the Logger
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEventService,
        {
          provide: USER_EVENT_REPOSITORY,
          useValue: userEventRepository,
        },
      ],
    }).compile();

    service = module.get<UserEventService>(UserEventService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('recordUserEvent', () => {
    it('새로운 사용자 이벤트를 기록할 수 있어야 한다', async () => {
      // given
      const eventData = {
        userId: 'user-123',
        eventType: 'login',
        eventKey: 'user-login',
        metadata: { device: 'mobile' },
      };

      const mockEvent = UserEventEntity.create({
        ...eventData,
        id: 'event-123',
      });

      userEventRepository.save.mockResolvedValue(mockEvent);

      // when
      const result = await service.recordUserEvent(eventData);

      // then
      expect(result).toBe(mockEvent);
      expect(userEventRepository.save).toHaveBeenCalled();
    });

    it('멱등성 키가 제공되면 중복 이벤트가 있는지 확인해야 한다', async () => {
      // given
      const eventData = {
        userId: 'user-123',
        eventType: 'login',
        eventKey: 'user-login',
        idempotencyKey: 'key-123',
      };

      // 중복 이벤트 없음
      userEventRepository.findByIdempotencyKey.mockResolvedValue(null);

      const mockEvent = UserEventEntity.create({
        ...eventData,
        id: 'event-123',
      });

      userEventRepository.save.mockResolvedValue(mockEvent);

      // when
      const result = await service.recordUserEvent(eventData);

      // then
      expect(result).toBe(mockEvent);
      expect(userEventRepository.findByIdempotencyKey).toHaveBeenCalledWith(eventData.idempotencyKey);
      expect(userEventRepository.save).toHaveBeenCalled();
    });

    it('동일한 멱등성 키로 이벤트가 있으면 기존 이벤트를 반환해야 한다', async () => {
      // given
      const eventData = {
        userId: 'user-123',
        eventType: 'login',
        eventKey: 'user-login',
        idempotencyKey: 'key-123',
      };

      const existingEvent = UserEventEntity.create({
        ...eventData,
        id: 'existing-event-123',
      });

      // 중복 이벤트 존재함
      userEventRepository.findByIdempotencyKey.mockResolvedValue(existingEvent);

      // when
      const result = await service.recordUserEvent(eventData);

      // then
      expect(result).toBe(existingEvent);
      expect(userEventRepository.findByIdempotencyKey).toHaveBeenCalledWith(eventData.idempotencyKey);
      expect(userEventRepository.save).not.toHaveBeenCalled();
    });

    it('MongoDB 중복 키 에러가 발생하면 ConflictException을 던져야 한다', async () => {
      // given
      const eventData = {
        userId: 'user-123',
        eventType: 'login',
        eventKey: 'user-login',
      };

      // MongoDB 중복 키 에러 시뮬레이션
      const error = {
        name: 'MongoServerError',
        code: 11000,
      };
      userEventRepository.save.mockRejectedValue(error);

      // when & then
      await expect(service.recordUserEvent(eventData)).rejects.toThrow(ConflictException);
    });
  });

  describe('getUserEvents', () => {
    it('사용자 이벤트 목록을 반환해야 한다', async () => {
      // given
      const userId = 'user-123';
      const mockEvents = [
        UserEventEntity.create({
          userId,
          eventType: 'login',
          eventKey: 'user-login',
          id: 'event-1',
        }),
        UserEventEntity.create({
          userId,
          eventType: 'profile_update',
          eventKey: 'profile-updated',
          id: 'event-2',
        }),
      ];

      userEventRepository.findByUser.mockResolvedValue(mockEvents);

      // when
      const result = await service.getUserEvents(userId);

      // then
      expect(result).toEqual(mockEvents);
      expect(userEventRepository.findByUser).toHaveBeenCalledWith(userId, undefined);
    });

    it('이벤트 타입 필터로 사용자 이벤트를 조회할 수 있어야 한다', async () => {
      // given
      const userId = 'user-123';
      const eventType = 'login';
      const mockEvents = [
        UserEventEntity.create({
          userId,
          eventType,
          eventKey: 'user-login',
          id: 'event-1',
        }),
      ];

      userEventRepository.findByUser.mockResolvedValue(mockEvents);

      // when
      const result = await service.getUserEvents(userId, eventType);

      // then
      expect(result).toEqual(mockEvents);
      expect(userEventRepository.findByUser).toHaveBeenCalledWith(userId, eventType);
    });
  });

  describe('getEvent', () => {
    it('특정 ID의 이벤트를 반환해야 한다', async () => {
      // given
      const eventId = 'event-123';
      const mockEvent = UserEventEntity.create({
        id: eventId,
        userId: 'user-123',
        eventType: 'login',
        eventKey: 'user-login',
      });

      userEventRepository.findById.mockResolvedValue(mockEvent);

      // when
      const result = await service.getEvent(eventId);

      // then
      expect(result).toEqual(mockEvent);
      expect(userEventRepository.findById).toHaveBeenCalledWith(eventId);
    });

    it('존재하지 않는 ID로 조회하면 null을 반환해야 한다', async () => {
      // given
      const eventId = 'non-existent-id';
      userEventRepository.findById.mockResolvedValue(null);

      // when
      const result = await service.getEvent(eventId);

      // then
      expect(result).toBeNull();
      expect(userEventRepository.findById).toHaveBeenCalledWith(eventId);
    });
  });
}); 