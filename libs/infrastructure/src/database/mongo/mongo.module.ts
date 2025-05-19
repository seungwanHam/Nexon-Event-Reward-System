import { Module, DynamicModule } from '@nestjs/common';
import { MongoService } from './mongo.service';
import { createMongoProvider } from './mongo.provider';
import { DatabaseConfigOptions } from '../interface/database-config.interface';

@Module({})
export class MongoModule {
  /**
   * MongoDB 모듈 등록
   * @param options 데이터베이스 연결 설정
   * @returns 동적 MongoDB 모듈
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
   * 테스트용 MongoDB 모듈 등록
   * @returns 테스트용 동적 MongoDB 모듈
   */
  static forTest(): DynamicModule {
    return this.forRoot({
      uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/nexon-event-system-test',
      debug: false,
      autoIndex: false,
    });
  }
} 