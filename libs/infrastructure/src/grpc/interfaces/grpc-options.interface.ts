/**
 * gRPC 서비스 옵션 인터페이스
 */
export interface GrpcOptions {
  // 서비스 호스트
  host: string;
  
  // 서비스 포트
  port: number;
  
  // 패키지 이름 (proto 파일에 정의된 package 이름)
  package: string;
  
  // 프로토파일 경로
  protoPath: string;
  
  // 로드할 서비스 목록
  serviceName: string;
  
  // 기타 옵션
  options?: {
    // 최대 메시지 크기
    'grpc.max_receive_message_length'?: number;
    // 최대 메타데이터 크기
    'grpc.max_metadata_size'?: number;
    // 기타 gRPC 채널 옵션들...
    [key: string]: any;
  }
} 