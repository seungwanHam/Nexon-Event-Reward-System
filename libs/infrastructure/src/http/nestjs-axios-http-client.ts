import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  HttpClient,
  HttpRequestConfig,
  HttpResponse,
  GetRequestConfig,
  DataRequestConfig
} from './http-client.interface';

/**
 * @nestjs/axios의 HttpService를 사용한 HTTP 클라이언트 구현체
 */
@Injectable()
export class NestAxiosHttpClient implements HttpClient {
  constructor(private readonly httpService: HttpService) { }

  async request<T = any, D = any>(config: HttpRequestConfig<D>): Promise<HttpResponse<T>> {
    const response = await firstValueFrom(this.httpService.request<T>(config));
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>
    };
  }

  async get<T = any>(url: string, config?: GetRequestConfig): Promise<T> {
    const response = await this.request<T>({
      method: 'GET',
      url,
      ...config
    });
    return response.data;
  }

  async post<T = any, D = any>(
    url: string,
    data: D,
    config?: Omit<DataRequestConfig<D>, 'data'>
  ): Promise<T> {
    const response = await this.request<T, D>({
      method: 'POST',
      url,
      data,
      ...config
    });
    return response.data;
  }

  async put<T = any, D = any>(
    url: string,
    data: D,
    config?: Omit<DataRequestConfig<D>, 'data'>
  ): Promise<T> {
    const response = await this.request<T, D>({
      method: 'PUT',
      url,
      data,
      ...config
    });
    return response.data;
  }

  async delete<T = any>(url: string, config?: GetRequestConfig): Promise<T> {
    const response = await this.request<T>({
      method: 'DELETE',
      url,
      ...config
    });
    return response.data;
  }
} 