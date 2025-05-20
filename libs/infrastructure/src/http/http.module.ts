import { DynamicModule, Module } from '@nestjs/common';
import { HttpModule as NestHttpModule } from '@nestjs/axios';
import { NestAxiosHttpClient } from './nestjs-axios-http-client';

/**
 * HTTP 요청을 위한 모듈
 * 
 * 이 모듈은 외부 API와의 통신을 위한 HTTP 클라이언트를 제공합니다.
 * 기본적으로 @nestjs/axios를 사용하는 구현체가 제공되지만,
 * register 메서드를 통해 커스텀 설정을 적용할 수 있습니다.
 */
@Module({
  imports: [NestHttpModule],
  providers: [
    {
      provide: 'HTTP_CLIENT',
      useClass: NestAxiosHttpClient,
    },
  ],
  exports: ['HTTP_CLIENT'],
})
export class HttpModule {
  /**
   * 커스텀 설정으로 HttpModule을 등록합니다.
   * 
   * @param options - axios 옵션 (타임아웃, 헤더 등)
   * @returns 동적 모듈
   * 
   * @example
   * ```typescript
   * // app.module.ts
   * imports: [
   *   HttpModule.register({
   *     timeout: 5000,
   *     headers: {
   *       'Content-Type': 'application/json',
   *     },
   *   }),
   * ]
   * ```
   */
  static register(options?: Record<string, any>): DynamicModule {
    return {
      module: HttpModule,
      imports: [
        NestHttpModule.register(options || {}),
      ],
      providers: [
        {
          provide: 'HTTP_CLIENT',
          useClass: NestAxiosHttpClient,
        },
      ],
      exports: ['HTTP_CLIENT'],
    };
  }
} 