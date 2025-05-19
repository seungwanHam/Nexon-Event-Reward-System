import { Observable } from 'rxjs';

/**
 * gRPC 서비스 클라이언트 인터페이스
 * Proto 파일 기반으로 생성된 서비스 정의를 기반으로 합니다.
 */
export interface GrpcClient {
  // 제네릭 메소드를 통해 모든 서비스 호출 처리
  call<TRequest, TResponse>(
    service: string,
    method: string,
    data: TRequest
  ): Observable<TResponse>;

  // 연결 상태 확인
  healthCheck(): Promise<boolean>;

  // 연결 종료
  close(): void;
}