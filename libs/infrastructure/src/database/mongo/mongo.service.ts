import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * MongoDB 서비스 클래스
 * 데이터베이스 연결 관리 및 헬스체크 기능 제공
 */
@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) { }

  /**
   * 모듈 초기화 시 데이터베이스 연결 상태 확인
   */
  async onModuleInit() {
    try {
      // 연결 상태 확인
      if (this.connection.readyState === 1) {
        this.logger.log('MongoDB connection is ready');

        // DB 서버 정보 확인
        const admin = this.connection.db.admin();
        const serverInfo = await admin.serverInfo();
        this.logger.log(`Connected to MongoDB Server: ${serverInfo.version}`);

        // 컬렉션 정보 확인
        const collections = await this.connection.db.listCollections().toArray();
        this.logger.log(`Available collections: ${collections.map(c => c.name).join(', ')}`);
      } else {
        this.logger.warn(`MongoDB connection is not ready. State: ${this.connection.readyState}`);
      }
    } catch (error) {
      this.logger.error(`Failed to initialize MongoDB connection: ${error.message}`);
    }
  }

  /**
   * 모듈 종료 시 연결 정리
   */
  async onModuleDestroy() {
    try {
      if (this.connection) {
        await this.connection.close();
        this.logger.log('MongoDB connection closed');
      }
    } catch (error) {
      this.logger.error(`Error closing MongoDB connection: ${error.message}`);
    }
  }

  /**
   * 데이터베이스 연결 상태 확인
   * @returns 연결 상태
   */
  async checkHealth(): Promise<{ status: string; details?: any }> {
    try {
      // 간단한 핑 명령으로 연결 상태 확인
      const adminDb = this.connection.db.admin();
      const result = await adminDb.ping();

      if (result && result.ok === 1) {
        // 서버 정보 조회
        const serverInfo = await adminDb.serverInfo();

        return {
          status: 'up',
          details: {
            readyState: this.connection.readyState,
            version: serverInfo.version
          }
        };
      }

      return { status: 'down', details: result };
    } catch (error) {
      return {
        status: 'error',
        details: { message: error.message }
      };
    }
  }

  /**
   * 현재 데이터베이스 연결 가져오기
   * @returns Mongoose 연결 객체
   */
  getConnection(): Connection {
    return this.connection;
  }
} 