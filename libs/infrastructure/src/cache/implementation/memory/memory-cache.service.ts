import { Injectable, Logger } from '@nestjs/common';
import { ICacheService } from '../../interface/cache.interface';

/**
 * 캐시 항목 인터페이스
 */
interface CacheEntry {
  /** 캐싱된 값 */
  value: string;
  
  /** 만료 시간 (타임스탬프) */
  expiresAt?: number;
}

/**
 * 인메모리 캐시 서비스 구현체
 * 
 * 메모리에 데이터를 캐싱하는 간단한 구현체입니다.
 * 개발 환경이나 작은 규모의 애플리케이션에 적합합니다.
 * 주의: 서버 재시작 시 모든 캐시 데이터가 손실됩니다.
 */
@Injectable()
export class MemoryCacheService implements ICacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly logger = new Logger(MemoryCacheService.name);
  
  // 만료된 항목 정리 간격 (30분)
  private readonly cleanupInterval = 30 * 60 * 1000;
  
  constructor() {
    // 주기적으로 만료된 항목 정리
    setInterval(() => this.removeExpiredEntries(), this.cleanupInterval);
  }

  /**
   * 캐시에서 값을 가져옵니다.
   * 
   * @param key - 캐시 키
   * @returns 캐시된 값 또는 null
   */
  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * 값을 캐시에 저장합니다.
   * 
   * @param key - 캐시 키
   * @param value - 저장할 값
   * @param ttl - 만료 시간(초)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const entry: CacheEntry = {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    };
    this.cache.set(key, entry);
  }

  /**
   * 키를 캐시에서 삭제합니다.
   * 
   * @param key - 삭제할 캐시 키
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * 여러 키를 캐시에서 삭제합니다.
   * 
   * @param keys - 삭제할 캐시 키 배열
   */
  async delMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.cache.delete(key);
    }
  }

  /**
   * 패턴과 일치하는 모든 키를 캐시에서 삭제합니다.
   * 
   * @param pattern - 삭제할 키 패턴 (예: user:*)
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      let deletedCount = 0;
      
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        this.logger.log(`메모리 캐시에서 ${deletedCount}개 항목 삭제됨 (pattern: ${pattern})`);
      }
    } catch (error) {
      this.logger.error(`패턴 매칭 삭제 중 오류 발생: ${error.message}`, error.stack);
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
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
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
          this.logger.warn(`JSON 파싱 실패 (key: ${key}), 새 값 생성`, parseError.stack);
          // 파싱 실패 시 새 값 생성
        }
      }

      // 캐시에 없거나 파싱 실패 시 새 값 생성
      const newValue = await factory();
      await this.set(key, JSON.stringify(newValue), ttl);
      return newValue;
    } catch (error) {
      this.logger.error(`getOrSet 작업 실패 (key: ${key}): ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * 캐시 상태 정보를 반환합니다.
   * 
   * @returns 캐시 상태 정보 객체
   */
  getStats(): { size: number; activeItems: number } {
    let activeItems = 0;
    const now = Date.now();
    
    for (const entry of this.cache.values()) {
      if (!entry.expiresAt || entry.expiresAt > now) {
        activeItems++;
      }
    }
    
    return {
      size: this.cache.size,
      activeItems
    };
  }
  
  /**
   * 만료된 캐시 항목을 정리합니다.
   * 
   * @private
   */
  private removeExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.logger.log(`${removedCount}개의 만료된 캐시 항목 정리됨`);
    }
  }
} 