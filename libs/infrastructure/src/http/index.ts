/**
 * HTTP 모듈 - 외부 API와의 통신을 위한 도구
 * 
 * 다양한 HTTP 클라이언트 라이브러리를 일관된 인터페이스로 추상화하여
 * 애플리케이션 전체에서 HTTP 요청을 처리하는 방식을 표준화합니다.
 */
export * from './http-client.interface';
export * from './nestjs-axios-http-client'; 
export * from './http.module';