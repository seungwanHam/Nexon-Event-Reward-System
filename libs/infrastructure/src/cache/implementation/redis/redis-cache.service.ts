import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { WinstonLoggerService } from '../../../logger/winston-logger.service';
import { ICacheService } from '../../interface/cache.interface';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

@Injectable()
export class RedisCacheService implements ICacheService, OnModuleInit, OnModuleDestroy {
  private readonly master: Redis;
  private readonly slaves: Redis[];
  private currentSlaveIndex = 0;

  constructor(
    private readonly config: RedisConfig,
    private readonly logger: WinstonLoggerService,
  ) {
    // Master 설정
    this.master = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        this.logger.warn(`Redis master 재연결 시도 (${times}번째)`, { delay });
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    // Slave 설정 - 현재는 단일 Redis 인스턴스만 사용
    this.slaves = [];
  }

  async onModuleInit() {
    // 연결 이벤트 핸들러 등록
    this.master.on('connect', () => {
      this.logger.log('Redis master 연결됨');
    });

    this.master.on('error', (error) => {
      this.logger.error('Redis master 에러', { error });
    });

    // 초기 연결 테스트
    try {
      await this.master.ping();
      this.logger.log('Redis master 연결 테스트 성공');
    } catch (error) {
      this.logger.error('Redis 초기 연결 실패', { error });
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.master.quit();
    await Promise.all(this.slaves.map((slave) => slave.quit()));
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.master.set(key, value, 'EX', ttl);
      } else {
        await this.master.set(key, value);
      }
    } catch (error) {
      this.logger.error('Redis set 작업 실패', { key, error });
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.master.get(key);
    } catch (error) {
      this.logger.error('Redis get 작업 실패', { key, error });
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.master.del(key);
    } catch (error) {
      this.logger.error('Redis del 작업 실패', { key, error });
      throw error;
    }
  }

  async delMany(keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await this.master.del(keys);
      }
    } catch (error) {
      this.logger.error('Redis delMany 작업 실패', { keys, error });
      throw error;
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.master.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await this.master.del(keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.error('Redis delPattern 작업 실패', { pattern, error });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.master.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error('Redis exists 작업 실패', { key, error });
      throw error;
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    try {
      const value = await this.get(key);
      if (value !== null) {
        return JSON.parse(value) as T;
      }

      const newValue = await factory();
      await this.set(key, JSON.stringify(newValue), ttl);
      return newValue;
    } catch (error) {
      this.logger.error('Redis getOrSet 작업 실패', { key, error });
      throw error;
    }
  }
} 