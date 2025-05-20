/**
 * HTTP 요청 설정을 위한 인터페이스
 * 
 * HTTP 요청에 필요한 메서드, URL, 헤더, 데이터 등을 정의합니다.
 */
export interface HttpRequestConfig<T = any> {
  /** HTTP 메서드 (GET, POST, PUT, DELETE 등) */
  method: string;
  
  /** 요청 URL 경로 */
  url: string;
  
  /** 기본 URL (도메인) */
  baseURL?: string;
  
  /** 요청 헤더 */
  headers?: Record<string, string>;
  
  /** 요청 본문 데이터 */
  data?: T;
  
  /** URL 쿼리 파라미터 */
  params?: Record<string, string | number | boolean | null | undefined>;
  
  /** 요청 타임아웃 (밀리초) */
  timeout?: number;
}

/**
 * GET 요청 설정
 * 
 * GET 요청에 필요한 헤더와 쿼리 파라미터를 정의합니다.
 */
export interface GetRequestConfig {
  /** 요청 헤더 */
  headers?: Record<string, string>;
  
  /** URL 쿼리 파라미터 */
  params?: Record<string, string | number | boolean | null | undefined>;
  
  /** 요청 타임아웃 (밀리초) */
  timeout?: number;
}

/**
 * POST/PUT 요청 설정
 * 
 * POST/PUT 요청에 필요한 헤더, 데이터, 쿼리 파라미터를 정의합니다.
 */
export interface DataRequestConfig<T> {
  /** 요청 헤더 */
  headers?: Record<string, string>;
  
  /** 요청 본문 데이터 */
  data: T;
  
  /** URL 쿼리 파라미터 */
  params?: Record<string, string | number | boolean | null | undefined>;
  
  /** 요청 타임아웃 (밀리초) */
  timeout?: number;
}

/**
 * HTTP 응답 인터페이스
 * 
 * HTTP 요청의 응답 데이터, 상태 코드, 헤더를 포함합니다.
 */
export interface HttpResponse<T = any> {
  /** 응답 본문 데이터 */
  data: T;
  
  /** HTTP 상태 코드 */
  status: number;
  
  /** 응답 헤더 */
  headers: Record<string, string>;
}

/**
 * HTTP 클라이언트 추상화 인터페이스
 * 
 * 다양한 HTTP 클라이언트 라이브러리를 일관된 방식으로 사용할 수 있도록 추상화합니다.
 * 이 인터페이스를 구현하는 클래스는 실제 HTTP 요청 처리를 담당합니다.
 */
export interface HttpClient {
  /**
   * 일반 HTTP 요청을 보냅니다.
   * 
   * @param config - HTTP 요청 설정
   * @returns HTTP 응답 객체
   */
  request<T = any, D = any>(config: HttpRequestConfig<D>): Promise<HttpResponse<T>>;
  
  /**
   * GET 요청을 보냅니다.
   * 
   * @param url - 요청 URL
   * @param config - GET 요청 설정
   * @returns 응답 데이터
   */
  get<T = any>(url: string, config?: GetRequestConfig): Promise<T>;
  
  /**
   * POST 요청을 보냅니다.
   * 
   * @param url - 요청 URL
   * @param data - 요청 본문 데이터
   * @param config - 추가 요청 설정
   * @returns 응답 데이터
   */
  post<T = any, D = any>(url: string, data: D, config?: Omit<DataRequestConfig<D>, 'data'>): Promise<T>;
  
  /**
   * PUT 요청을 보냅니다.
   * 
   * @param url - 요청 URL
   * @param data - 요청 본문 데이터
   * @param config - 추가 요청 설정
   * @returns 응답 데이터
   */
  put<T = any, D = any>(url: string, data: D, config?: Omit<DataRequestConfig<D>, 'data'>): Promise<T>;
  
  /**
   * DELETE 요청을 보냅니다.
   * 
   * @param url - 요청 URL
   * @param config - GET 요청 설정
   * @returns 응답 데이터
   */
  delete<T = any>(url: string, config?: GetRequestConfig): Promise<T>;
} 