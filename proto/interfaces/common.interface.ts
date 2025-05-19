// HTTP 요청 데이터
export interface RequestData {
  method: string;
  path: string;
  headers: any;
  body: any;
  query: any;
}

// HTTP 응답 데이터
export interface ResponseData {
  statusCode: number;
  headers: any;
  body: any;
} 