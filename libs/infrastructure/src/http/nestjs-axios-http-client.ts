import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import {
  HttpClient,
  HttpRequestConfig,
  HttpResponse,
  GetRequestConfig,
  DataRequestConfig
} from './http-client.interface';

/**
 * @nestjs/axios의 HttpService를 사용한 HTTP 클라이언트 구현체
 * 
 * HTTP 요청의 실행, 에러 처리, 응답 변환 등을 담당합니다.
 */
@Injectable()
export class NestAxiosHttpClient implements HttpClient {
  private readonly logger = new Logger(NestAxiosHttpClient.name);
  private readonly DEFAULT_TIMEOUT = 10000; // 10초

  constructor(private readonly httpService: HttpService) {}

  /**
   * HTTP 요청을 실행합니다.
   * 
   * @param config - HTTP 요청 설정
   * @returns HTTP 응답
   * @throws 네트워크 오류, 타임아웃, 서버 오류 등
   */
  async request<T = any, D = any>(config: HttpRequestConfig<D>): Promise<HttpResponse<T>> {
    try {
      const timeoutMs = config.timeout || this.DEFAULT_TIMEOUT;
      const response = await firstValueFrom(
        this.httpService.request<T>(config).pipe(
          timeout(timeoutMs),
          catchError(error => {
            this.handleHttpError(error, config);
            throw error;
          })
        )
      );
      
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      this.handleHttpError(error, config);
      throw error;
    }
  }

  /**
   * GET 요청을 실행합니다.
   * 
   * @param url - 요청 URL
   * @param config - GET 요청 설정
   * @returns 응답 데이터
   */
  async get<T = any>(url: string, config?: GetRequestConfig): Promise<T> {
    const response = await this.request<T>({
      method: 'GET',
      url,
      ...config
    });
    return response.data;
  }

  /**
   * POST 요청을 실행합니다.
   * 
   * @param url - 요청 URL
   * @param data - 요청 본문 데이터
   * @param config - 추가 요청 설정
   * @returns 응답 데이터
   */
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

  /**
   * PUT 요청을 실행합니다.
   * 
   * @param url - 요청 URL
   * @param data - 요청 본문 데이터
   * @param config - 추가 요청 설정
   * @returns 응답 데이터
   */
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

  /**
   * DELETE 요청을 실행합니다.
   * 
   * @param url - 요청 URL
   * @param config - GET 요청 설정
   * @returns 응답 데이터
   */
  async delete<T = any>(url: string, config?: GetRequestConfig): Promise<T> {
    const response = await this.request<T>({
      method: 'DELETE',
      url,
      ...config
    });
    return response.data;
  }

  /**
   * HTTP 요청 오류를 처리합니다.
   * 
   * @param error - 발생한 오류
   * @param config - 요청 설정
   * @private
   */
  private handleHttpError(error: any, config: HttpRequestConfig): never {
    const isAxiosError = error instanceof AxiosError;
    const status = isAxiosError ? error.response?.status : HttpStatus.INTERNAL_SERVER_ERROR;
    const method = config.method.toUpperCase();
    const url = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
    
    this.logger.error(
      `HTTP ${method} ${url} 요청 실패: ${error.message}`,
      error.stack,
      NestAxiosHttpClient.name
    );
    
    throw error;
  }
} 