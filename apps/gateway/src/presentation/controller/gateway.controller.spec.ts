import { Test, TestingModule } from '@nestjs/testing';
import { GatewayController } from './gateway.controller';
import { ProxyFacade } from '@app/gateway/application/facade/proxy.facade';

describe('GatewayController 테스트', () => {
  let controller: GatewayController;
  let proxyFacade: ProxyFacade;

  const mockProxyFacade = {
    forwardToAuth: jest.fn(),
    forwardToEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [
        {
          provide: ProxyFacade,
          useValue: mockProxyFacade,
        },
      ],
    }).compile();

    controller = module.get<GatewayController>(GatewayController);
    proxyFacade = module.get<ProxyFacade>(ProxyFacade);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Auth 서비스 관련 테스트
  describe('Auth 서비스 프록시 메서드', () => {
    it('authLogin 메서드가 ProxyFacade.forwardToAuth를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'POST',
        path: '/auth/login',
        headers: { 'content-type': 'application/json' },
      };
      const body = { email: 'test@example.com', password: 'password123' };
      const query = {};
      const expectedResponse = { success: true, data: { token: 'jwt-token' } };

      jest.spyOn(proxyFacade, 'forwardToAuth').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.authLogin(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToAuth).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('authRegister 메서드가 ProxyFacade.forwardToAuth를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'POST',
        path: '/auth/register',
        headers: { 'content-type': 'application/json' },
      };
      const body = {
        email: 'newuser@example.com',
        password: 'password123',
        nickname: '새사용자',
      };
      const query = {};
      const expectedResponse = { success: true, data: { id: 'user-id', token: 'jwt-token' } };

      jest.spyOn(proxyFacade, 'forwardToAuth').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.authRegister(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToAuth).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('authRefresh 메서드가 ProxyFacade.forwardToAuth를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'POST',
        path: '/auth/refresh',
        headers: { 'content-type': 'application/json' },
      };
      const body = { refreshToken: 'refresh-token', userId: 'user-id' };
      const query = {};
      const expectedResponse = { success: true, data: { accessToken: 'new-jwt-token' } };

      jest.spyOn(proxyFacade, 'forwardToAuth').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.authRefresh(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToAuth).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('authProxy 메서드가 ProxyFacade.forwardToAuth를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'GET',
        path: '/auth/profile',
        headers: { authorization: 'Bearer token' },
      };
      const body = {};
      const query = { userId: 'user-id' };
      const expectedResponse = { success: true, data: { user: { id: 'user-id', email: 'test@example.com' } } };

      jest.spyOn(proxyFacade, 'forwardToAuth').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.authProxy(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToAuth).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  // Event 서비스 관련 테스트
  describe('Event 서비스 프록시 메서드', () => {
    it('eventsList 메서드가 ProxyFacade.forwardToEvent를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'GET',
        path: '/events',
        headers: { authorization: 'Bearer token' },
      };
      const body = {};
      const query = { page: '1', limit: '10' };
      const expectedResponse = { success: true, data: { events: [] } };

      jest.spyOn(proxyFacade, 'forwardToEvent').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.eventsList(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToEvent).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('eventDetail 메서드가 ProxyFacade.forwardToEvent를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'GET',
        path: '/events/123',
        headers: { authorization: 'Bearer token' },
      };
      const body = {};
      const query = {};
      const expectedResponse = { success: true, data: { event: { id: '123', title: '이벤트 제목' } } };

      jest.spyOn(proxyFacade, 'forwardToEvent').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.eventDetail(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToEvent).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('createEvent 메서드가 ProxyFacade.forwardToEvent를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'POST',
        path: '/events/create',
        headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      };
      const body = { title: '새 이벤트', description: '이벤트 설명' };
      const query = {};
      const expectedResponse = { success: true, data: { event: { id: 'new-id', title: '새 이벤트' } } };

      jest.spyOn(proxyFacade, 'forwardToEvent').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.createEvent(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToEvent).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('updateEvent 메서드가 ProxyFacade.forwardToEvent를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'PUT',
        path: '/events/123/update',
        headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      };
      const body = { title: '수정된 이벤트', description: '수정된 설명' };
      const query = {};
      const expectedResponse = { success: true, data: { event: { id: '123', title: '수정된 이벤트' } } };

      jest.spyOn(proxyFacade, 'forwardToEvent').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.updateEvent(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToEvent).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  // 보상 관련 테스트
  describe('보상 서비스 프록시 메서드', () => {
    it('requestReward 메서드가 ProxyFacade.forwardToEvent를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'POST',
        path: '/rewards/request',
        headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      };
      const body = { eventId: '123', userId: 'user-id' };
      const query = {};
      const expectedResponse = { success: true, data: { reward: { id: 'reward-id', status: 'pending' } } };

      jest.spyOn(proxyFacade, 'forwardToEvent').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.requestReward(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToEvent).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('myRewards 메서드가 ProxyFacade.forwardToEvent를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'GET',
        path: '/rewards/my-history',
        headers: { authorization: 'Bearer token' },
      };
      const body = {};
      const query = { userId: 'user-id' };
      const expectedResponse = { success: true, data: { rewards: [] } };

      jest.spyOn(proxyFacade, 'forwardToEvent').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.myRewards(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToEvent).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('rewardsHistory 메서드가 ProxyFacade.forwardToEvent를 올바르게 호출해야 함', async () => {
      // 준비
      const req = {
        method: 'GET',
        path: '/rewards/history',
        headers: { authorization: 'Bearer token' },
      };
      const body = {};
      const query = { page: '1', limit: '20' };
      const expectedResponse = { success: true, data: { rewards: [] } };

      jest.spyOn(proxyFacade, 'forwardToEvent').mockResolvedValue(expectedResponse);

      // 실행
      const result = await controller.rewardsHistory(req as any, body, query);

      // 검증
      expect(proxyFacade.forwardToEvent).toHaveBeenCalledWith(
        req.method,
        req.path,
        req.headers,
        body,
        query,
      );
      expect(result).toEqual(expectedResponse);
    });
  });
}); 