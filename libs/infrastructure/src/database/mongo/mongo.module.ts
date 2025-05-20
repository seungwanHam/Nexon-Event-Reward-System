import { Module, DynamicModule } from '@nestjs/common';
import { MongoService } from './mongo.service';
import { createMongoProvider } from './mongo.provider';
import { DatabaseConfigOptions } from '../interface/database-config.interface';

/**
 * MongoDB 연결을 관리하는 모듈
 * 
 * 애플리케이션에서 MongoDB 데이터베이스에 연결하고, 접근하기 위한
 * 서비스와 프로바이더를 제공합니다. 다양한 환경(개발, 테스트, 프로덕션)에
 * 맞게 설정할 수 있습니다.
 */
@Module({})
export class MongoModule {
  /**
   * MongoDB 모듈을 커스텀 설정으로 등록합니다.
   * 
   * @param options - 데이터베이스 연결 설정
   * @returns 동적 MongoDB 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     MongoModule.forRoot({
   *       uri: 'mongodb://localhost:27017/nexon-event-system',
   *       debug: process.env.NODE_ENV !== 'production',
   *       autoIndex: process.env.NODE_ENV !== 'production',
   *       useUnifiedTopology: true,
   *     }),
   *   ],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(options: DatabaseConfigOptions): DynamicModule {
    return {
      module: MongoModule,
      imports: [createMongoProvider(options)],
      providers: [MongoService],
      exports: [MongoService],
      global: true,
    };
  }

  /**
   * 테스트 환경용 MongoDB 모듈을 등록합니다.
   * 
   * 통합 테스트나 단위 테스트에서 몽고DB 데이터베이스에 연결할 때 사용합니다.
   * 테스트 환경에 맞게 최적화된 설정을 자동으로 적용합니다.
   * 
   * @returns 테스트용 동적 MongoDB 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     MongoModule.forTest(),
   *   ],
   * })
   * export class TestAppModule {}
   * ```
   */
  static forTest(): DynamicModule {
    return this.forRoot({
      uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/nexon-event-system-test',
      debug: false,
      autoIndex: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
} 