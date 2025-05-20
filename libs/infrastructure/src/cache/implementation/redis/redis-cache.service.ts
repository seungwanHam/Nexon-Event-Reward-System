import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { WinstonLoggerService } from '../../../logger/winston-logger.service';
import { ICacheService } from '../../interface/cache.interface';

/**
 * Redis 연결 설정 인터페이스
 */
interface RedisConfig {
  /** Redis 서버 호스트 */
  host: string;
  
  /** Redis 서버 포트 */
  port: number;
  
  /** Redis 서버 비밀번호 (선택) */
  password?: string;
  
  /** Redis 연결 제한 시간 (밀리초) */
  connectTimeout?: number;
  
  /** 데이터베이스 인덱스 */
  db?: number;
}

/**
 * Redis 기반 캐시 서비스 구현체
 * 
 * 고성능 Redis 서버를 활용하여 애플리케이션의 캐싱 기능을 제공합니다.
 * 모듈 초기화/소멸 시 연결 관리 및 정리를 자동으로 처리합니다.
 */
@Injectable()
export class RedisCacheService implements ICacheService, OnModuleInit, OnModuleDestroy {
  private readonly master: Redis;
  private readonly slaves: Redis[];
  private currentSlaveIndex = 0;
  private readonly keyPrefix: string = 'app:';
  private readonly logger: Logger;

  /**
   * Redis 캐시 서비스 생성자
   * 
   * @param config - Redis 연결 설정
   * @param loggerService - 로깅 서비스
   */
  constructor(
    private readonly config: RedisConfig,
    private readonly loggerService: WinstonLoggerService,
  ) {
    this.logger = new Logger(RedisCacheService.name);
    
    // Master 설정
    this.master = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      keyPrefix: this.keyPrefix,
      db: config.db || 0,
      connectTimeout: config.connectTimeout || 5000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        this.loggerService.warn(`Redis master 재연결 시도 (${times}번째)`, { delay });
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    // Slave 설정 - 현재는 단일 Redis 인스턴스만 사용
    this.slaves = [];
  }

  /**
   * 모듈 초기화 시 실행되는 메서드
   * Redis 연결을 설정하고 초기 연결 테스트를 수행합니다.
   */
  async onModuleInit() {
    // 연결 이벤트 핸들러 등록
    this.master.on('connect', () => {
      this.logger.log('Redis master 연결됨');
    });

    this.master.on('error', (error) => {
      this.logger.error(`Redis master 에러: ${error.message}`, error.stack);
    });

    // 초기 연결 테스트
    try {
      await this.master.ping();
      this.logger.log('Redis master 연결 테스트 성공');
    } catch (error) {
      this.logger.error(`Redis 초기 연결 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 모듈 소멸 시 실행되는 메서드
   * Redis 연결을 정상적으로 종료합니다.
   */
  async onModuleDestroy() {
    this.logger.log('Redis 연결 종료 중...');
    await this.master.quit();
    await Promise.all(this.slaves.map((slave) => slave.quit()));
    this.logger.log('Redis 연결 종료 완료');
  }

  /**
   * 값을 캐시에 저장합니다.
   * 
   * @param key - 캐시 키
   * @param value - 저장할 값
   * @param ttl - 만료 시간(초)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.master.set(key, value, 'EX', ttl);
      } else {
        await this.master.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Redis set 작업 실패 (key: ${key}): ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 캐시에서 값을 가져옵니다.
   * 
   * @param key - 캐시 키
   * @returns 캐시된 값 또는 null
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.master.get(key);
    } catch (error) {
      this.logger.error(`Redis get 작업 실패 (key: ${key}): ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 키를 캐시에서 삭제합니다.
   * 
   * @param key - 삭제할 캐시 키
   */
  async del(key: string): Promise<void> {
    try {
      await this.master.del(key);
    } catch (error) {
      this.logger.error(`Redis del 작업 실패 (key: ${key}): ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 여러 키를 캐시에서 삭제합니다.
   * 
   * @param keys - 삭제할 캐시 키 배열
   */
  async delMany(keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await this.master.del(keys);
      }
    } catch (error) {
      this.logger.error(`Redis delMany 작업 실패 (keys: ${keys.length}개): ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 패턴과 일치하는 모든 키를 캐시에서 삭제합니다.
   * 
   * @param pattern - 삭제할 키 패턴 (예: user:*)
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      let deletedCount = 0;
      
      do {
        const [nextCursor, keys] = await this.master.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await this.master.del(keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');
      
      if (deletedCount > 0) {
        this.logger.log(`Redis delPattern 작업 완료: ${deletedCount}개 키 삭제됨 (pattern: ${pattern})`);
      }
    } catch (error) {
      this.logger.error(`Redis delPattern 작업 실패 (pattern: ${pattern}): ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 캐시가 특정 키를 가지고 있는지 확인합니다.
   * 
   * @param key - 확인할 캐시 키
   * @returns 키 존재 여부
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.master.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis exists 작업 실패 (key: ${key}): ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 캐시에서 값을 가져오거나, 없으면 생성하여 저장합니다.
   * 
   * @param key - 캐시 키
   * @param factory - 값이 없을 때 호출될 팩토리 함수
   * @param ttl - 만료 시간(초)
   * @returns 캐시된 값 또는 새로 생성된 값
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      const value = await this.get(key);
      if (value !== null) {
        try {
          return JSON.parse(value) as T;
        } catch (parseError) {
          this.logger.warn(`Redis getOrSet JSON 파싱 실패 (key: ${key}), 새 값 생성`, parseError.stack);
          // 파싱 실패 시 새 값 생성
        }
      }

      // 캐시에 없거나 파싱 실패 시 새 값 생성
      const newValue = await factory();
      await this.set(key, JSON.stringify(newValue), ttl);
      return newValue;
    } catch (error) {
      this.logger.error(`Redis getOrSet 작업 실패 (key: ${key}): ${error.message}`, error.stack);
      throw error;
    }
  }
} 