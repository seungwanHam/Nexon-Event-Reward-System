/**
 * HTTP 요청 설정을 위한 인터페이스
 */
export interface HttpRequestConfig<T = any> {
  method: string;
  url: string;
  baseURL?: string;
  headers?: Record<string, string>;
  data?: T;
  params?: Record<string, string | number | boolean | null>;
}

/**
 * GET 요청 설정
 */
export interface GetRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | null>;
}

/**
 * POST/PUT 요청 설정
 */
export interface DataRequestConfig<T> {
  headers?: Record<string, string>;
  data: T;
  params?: Record<string, string | number | boolean | null>;
}

/**
 * HTTP 응답 인터페이스
 */
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * HTTP 클라이언트 추상화 인터페이스
 */
export interface HttpClient {
  request<T = any, D = any>(config: HttpRequestConfig<D>): Promise<HttpResponse<T>>;
  get<T = any>(url: string, config?: GetRequestConfig): Promise<T>;
  post<T = any, D = any>(url: string, data: D, config?: Omit<DataRequestConfig<D>, 'data'>): Promise<T>;
  put<T = any, D = any>(url: string, data: D, config?: Omit<DataRequestConfig<D>, 'data'>): Promise<T>;
  delete<T = any>(url: string, config?: GetRequestConfig): Promise<T>;
} 