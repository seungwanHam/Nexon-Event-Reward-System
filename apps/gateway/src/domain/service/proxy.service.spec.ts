import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from './proxy.service';
import { HTTP_CLIENT, SERVICE_AUTH, SERVICE_EVENT } from '../../constants';
import { HttpClient, HttpRequestConfig, HttpResponse } from '@app/libs/infrastructure/http';

// HttpClient 모킹
class MockHttpClient implements HttpClient {
  async request(config: HttpRequestConfig): Promise<HttpResponse> {
    return {
      data: { success: true, mockResponse: true },
      status: 200,
      headers: { 'content-type': 'application/json' }
    };
  }
}

describe('ProxyService 테스트', () => {
  let service: ProxyService;
  let httpClient: HttpClient;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'AUTH_SERVICE_URL') return 'http://auth-service:3001';
              if (key === 'EVENT_SERVICE_URL') return 'http://event-service:3002';
              return null;
            }),
          },
        },
        {
          provide: HTTP_CLIENT,
          useClass: MockHttpClient,
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
    httpClient = module.get<HttpClient>(HTTP_CLIENT);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('생성자', () => {
    it('서비스 URL이 올바르게 초기화되어야 함', () => {
      expect(configService.get).toHaveBeenCalledWith('AUTH_SERVICE_URL');
      expect(configService.get).toHaveBeenCalledWith('EVENT_SERVICE_URL');
    });
  });

  describe('forwardRequest 메서드', () => {
    it('AUTH 서비스로 요청이 올바르게 전달되어야 함', async () => {
      // 준비
      const method = 'GET';
      const path = '/auth/profile';
      const headers = { authorization: 'Bearer token123' };
      const data = { userId: '123' };
      const params = { includeDetails: 'true' };

      jest.spyOn(httpClient, 'request');

      // 실행
      const result = await service.forwardRequest(
        SERVICE_AUTH,
        method,
        path,
        headers,
        data,
        params
      );

      // 검증
      expect(httpClient.request).toHaveBeenCalledWith({
        method,
        url: path,
        baseURL: 'http://auth-service:3001',
        headers: expect.objectContaining({
          authorization: 'Bearer token123',
          'content-type': 'application/json',
        }),
        data,
        params,
      });

      expect(result).toEqual({ success: true, mockResponse: true });
    });

    it('EVENT 서비스로 요청이 올바르게 전달되어야 함', async () => {
      // 준비
      const method = 'POST';
      const path = '/events/create';
      const headers = { authorization: 'Bearer token123' };
      const data = { title: '이벤트 제목', description: '이벤트 설명' };

      jest.spyOn(httpClient, 'request');

      // 실행
      const result = await service.forwardRequest(
        SERVICE_EVENT,
        method,
        path,
        headers,
        data
      );

      // 검증
      expect(httpClient.request).toHaveBeenCalledWith({
        method,
        url: path,
        baseURL: 'http://event-service:3002',
        headers: expect.objectContaining({
          authorization: 'Bearer token123',
          'content-type': 'application/json',
        }),
        data,
        params: undefined,
      });

      expect(result).toEqual({ success: true, mockResponse: true });
    });

    it('유효하지 않은 서비스 이름이 제공되면 오류를 발생시켜야 함', async () => {
      // 준비
      const invalidServiceName = 'INVALID_SERVICE';
      const method = 'GET';
      const path = '/some-path';
      const headers = {};

      // 실행 & 검증
      await expect(
        service.forwardRequest(invalidServiceName, method, path, headers)
      ).rejects.toThrow(`서비스 "${invalidServiceName}"에 대한 URL이 구성되지 않았습니다`);
    });

    it('헤더 필터링이 올바르게 작동해야 함', async () => {
      // 준비
      const method = 'GET';
      const path = '/auth/profile';
      const headers = {
        authorization: 'Bearer token123',
        'user-agent': 'test-agent',
        'x-custom-header': 'custom-value',
        host: 'gateway.example.com',
        referer: 'https://example.com',
      };

      jest.spyOn(httpClient, 'request');

      // 실행
      await service.forwardRequest(SERVICE_AUTH, method, path, headers);

      // 검증
      expect(httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            authorization: 'Bearer token123',
            'content-type': 'application/json',
          },
        })
      );
    });

    it('HTTP 클라이언트에서 오류가 발생하면 응답 형식을 유지해야 함', async () => {
      // 준비
      const method = 'GET';
      const path = '/auth/profile';
      const headers = { authorization: 'Bearer token123' };

      const errorResponse = {
        response: {
          status: 404,
          data: {
            message: '리소스를 찾을 수 없습니다',
            error: 'Not Found',
          },
          statusText: 'Not Found',
        },
      };

      jest.spyOn(httpClient, 'request').mockRejectedValue(errorResponse);

      // 실행
      const result = await service.forwardRequest(SERVICE_AUTH, method, path, headers);

      // 검증
      expect(result).toEqual({
        statusCode: 404,
        message: '리소스를 찾을 수 없습니다',
        error: 'Not Found',
      });
    });
  });
}); 