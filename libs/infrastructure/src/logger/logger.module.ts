import { DynamicModule, Global, Module } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service';
import { LOGGER_FACTORY, LoggerFactory } from './logger.interface';

/**
 * Winston 로거 팩토리 구현체
 * 
 * 특정 컨텍스트(서비스/컴포넌트)에 맞는 로거 인스턴스를 생성합니다.
 */
export class WinstonLoggerFactory implements LoggerFactory {
  /**
   * 지정된 컨텍스트를 가진 Winston 로거 인스턴스를 생성합니다.
   * 
   * @param context - 로깅 컨텍스트 이름 (서비스/컴포넌트 이름)
   * @returns 새로 생성된 로거 인스턴스
   */
  createLogger(context: string) {
    // 직접 생성할 때는 @Inject가 적용되지 않으므로
    // 인스턴스를 생성한 후 컨텍스트 설정
    const logger = new WinstonLoggerService();
    return logger.setContext(context);
  }
}

/**
 * 로깅을 위한 전역 모듈
 * 
 * 애플리케이션 전체에서 사용할 로깅 서비스를 제공하는 모듈입니다.
 * 기본적으로 Winston 로거 구현체를 사용합니다.
 */
@Global()
@Module({
  providers: [
    {
      provide: WinstonLoggerService,
      useClass: WinstonLoggerService,
    },
    {
      provide: LOGGER_FACTORY,
      useClass: WinstonLoggerFactory,
    },
    {
      provide: 'LOGGER_CONTEXT',
      useValue: 'App',
    },
  ],
  exports: [WinstonLoggerService, LOGGER_FACTORY],
})
export class LoggerModule {
  /**
   * 로거 모듈을 커스텀 설정으로 등록합니다.
   * 
   * @param options - 로거 설정 옵션
   * @returns 동적 모듈
   */
  static forRoot(options?: Record<string, any>): DynamicModule {
    // 향후 확장을 위한 동적 모듈 생성 메서드
    return {
      global: true,
      module: LoggerModule,
      providers: [
        {
          provide: WinstonLoggerService,
          useFactory: () => {
            const logger = new WinstonLoggerService();
            // 추가 설정 적용 코드 (향후 구현)
            return logger;
          }
        },
        {
          provide: LOGGER_FACTORY,
          useClass: WinstonLoggerFactory,
        },
        {
          provide: 'LOGGER_CONTEXT',
          useValue: options?.context || 'App',
        },
      ],
      exports: [WinstonLoggerService, LOGGER_FACTORY],
    };
  }
} 