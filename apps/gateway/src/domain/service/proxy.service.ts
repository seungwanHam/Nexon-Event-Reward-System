import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SERVICE_AUTH, SERVICE_EVENT, HTTP_CLIENT } from '../../constants';
import { HttpClient, HttpRequestConfig } from '@app/libs/infrastructure/http/http-client.interface';

interface ServiceResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}

/**
 * 다른 마이크로서비스로 요청을 전달하는 프록시 서비스
 */
@Injectable()
export class ProxyService {
  private readonly services: Record<string, string>;

  constructor(
    private configService: ConfigService,
    @Inject(HTTP_CLIENT) private httpClient: HttpClient
  ) {
    // 서비스 URLs 초기화
    this.services = {
      [SERVICE_AUTH]: configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3001',
      [SERVICE_EVENT]: configService.get<string>('EVENT_SERVICE_URL') || 'http://localhost:3002',
    };
  }

  /**
   * 요청을 특정 서비스로 전달
   */
  async forwardRequest<T = any>(
    service: string,
    method: string,
    path: string,
    headers: Record<string, string>,
    data?: any,
    params?: any,
  ): Promise<ServiceResponse<T>> {
    const baseURL = this.services[service];

    if (!baseURL) {
      throw new HttpException(
        `Service "${service}" is not configured`,
        HttpStatus.BAD_GATEWAY
      );
    }

    const adjustedPath = this.adjustPath(service, path);

    const config: HttpRequestConfig = {
      method,
      url: adjustedPath,
      baseURL,
      headers: this.filterHeaders(headers),
      data,
      params,
    };

    try {
      const response = await this.httpClient.request(config);
      return {
        statusCode: HttpStatus.OK,
        message: 'Success',
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private adjustPath(service: string, path: string): string {
    if (service === SERVICE_AUTH && !path.includes('/api/')) {
      return path.startsWith('/') ? `/api${path}` : `/api/${path}`;
    }
    return path;
  }

  /**
   * 필요한 헤더만 전달 (민감 정보 제거)
   */
  private filterHeaders(headers: Record<string, string>): Record<string, string> {
    const filteredHeaders: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (headers?.authorization) {
      filteredHeaders.authorization = headers.authorization;
    }

    // 추가 보안 헤더
    filteredHeaders['x-request-id'] = crypto.randomUUID();
    
    return filteredHeaders;
  }

  private handleError(error: any): ServiceResponse {
    if (error.response) {
      const { status, data } = error.response;
      return {
        statusCode: status,
        message: data?.message || 'Internal service error',
        error: data?.error || error.response.statusText
      };
    }

    // 네트워크 오류나 다른 예외상황
    return {
      statusCode: HttpStatus.BAD_GATEWAY,
      message: 'Service communication error',
      error: error.message
    };
  }
} 