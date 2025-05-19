import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

// ClientProxy 모킹
const mockClientProxy = () => ({
  send: jest.fn(),
});

describe('HealthController 테스트', () => {
  let controller: HealthController;
  let authClient: ClientProxy;
  let eventClient: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: 'AUTH_SERVICE',
          useFactory: mockClientProxy,
        },
        {
          provide: 'EVENT_SERVICE',
          useFactory: mockClientProxy,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    authClient = module.get<ClientProxy>('AUTH_SERVICE');
    eventClient = module.get<ClientProxy>('EVENT_SERVICE');
  });

  describe('getStatus 메서드', () => {
    it('Gateway 서비스 상태 정보를 반환해야 함', () => {
      // 실행
      const result = controller.getStatus();

      // 검증
      expect(result.status).toBe('ok');
      expect(result.service).toBe('gateway');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getAuthServiceStatus 메서드', () => {
    it('Auth 서비스가 온라인인 경우 정상 상태를 반환해야 함', async () => {
      // 준비
      const pingResponse = { status: 'ok', service: 'auth' };
      jest.spyOn(authClient, 'send').mockReturnValue(of(pingResponse));

      // 실행
      const result = await controller.getAuthServiceStatus();

      // 검증
      expect(authClient.send).toHaveBeenCalledWith({ cmd: 'ping' }, {});
      expect(result.status).toBe('ok');
      expect(result.service).toBe('auth');
      expect(result.connected).toBe(true);
      expect(result.response).toEqual(pingResponse);
      expect(result.timestamp).toBeDefined();
    });

    it('Auth 서비스가 오프라인인 경우 오류 상태를 반환해야 함', async () => {
      // 준비
      const error = new Error('연결할 수 없습니다');
      jest.spyOn(authClient, 'send').mockReturnValue(throwError(() => error));

      // 실행
      const result = await controller.getAuthServiceStatus();

      // 검증
      expect(authClient.send).toHaveBeenCalledWith({ cmd: 'ping' }, {});
      expect(result.status).toBe('error');
      expect(result.service).toBe('auth');
      expect(result.connected).toBe(false);
      expect(result.error).toBe('연결할 수 없습니다');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getEventServiceStatus 메서드', () => {
    it('Event 서비스가 온라인인 경우 정상 상태를 반환해야 함', async () => {
      // 준비
      const pingResponse = { status: 'ok', service: 'event' };
      jest.spyOn(eventClient, 'send').mockReturnValue(of(pingResponse));

      // 실행
      const result = await controller.getEventServiceStatus();

      // 검증
      expect(eventClient.send).toHaveBeenCalledWith({ cmd: 'ping' }, {});
      expect(result.status).toBe('ok');
      expect(result.service).toBe('event');
      expect(result.connected).toBe(true);
      expect(result.response).toEqual(pingResponse);
      expect(result.timestamp).toBeDefined();
    });

    it('Event 서비스가 오프라인인 경우 오류 상태를 반환해야 함', async () => {
      // 준비
      const error = new Error('연결할 수 없습니다');
      jest.spyOn(eventClient, 'send').mockReturnValue(throwError(() => error));

      // 실행
      const result = await controller.getEventServiceStatus();

      // 검증
      expect(eventClient.send).toHaveBeenCalledWith({ cmd: 'ping' }, {});
      expect(result.status).toBe('error');
      expect(result.service).toBe('event');
      expect(result.connected).toBe(false);
      expect(result.error).toBe('연결할 수 없습니다');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('getAllServicesStatus 메서드', () => {
    it('모든 서비스 상태를 집계해서 반환해야 함', async () => {
      // 준비
      const authResult = {
        status: 'ok',
        service: 'auth',
        connected: true,
        response: { status: 'ok' },
        timestamp: '2023-06-01T00:00:00.000Z',
      };

      const eventResult = {
        status: 'error',
        service: 'event',
        connected: false,
        error: '연결할 수 없습니다',
        timestamp: '2023-06-01T00:00:00.000Z',
      };

      jest.spyOn(controller, 'getAuthServiceStatus').mockResolvedValue(authResult);
      jest.spyOn(controller, 'getEventServiceStatus').mockResolvedValue(eventResult);

      // 실행
      const result = await controller.getAllServicesStatus();

      // 검증
      expect(controller.getAuthServiceStatus).toHaveBeenCalled();
      expect(controller.getEventServiceStatus).toHaveBeenCalled();
      
      expect(result.gateway.status).toBe('ok');
      expect(result.gateway.service).toBe('gateway');
      expect(result.gateway.timestamp).toBeDefined();
      
      expect(result.services.auth).toEqual(authResult);
      expect(result.services.event).toEqual(eventResult);
    });
  });
}); 