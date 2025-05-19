import { Injectable } from '@nestjs/common';
import { ICacheService } from '@app/libs/infrastructure/cache/interface';

interface CacheItem<T> {
  value: T;
  expireAt?: number; // Unix timestamp in ms
}

/**
 * 단순 인메모리 캐시 서비스 구현체
 * 단일 서버 환경이나 테스트용으로 적합합니다.
 */
@Injectable()
export class MemoryCacheService implements ICacheService {
  private cache: Map<string, CacheItem<any>> = new Map();

  /**
   * 캐시에서 값을 가져옵니다.
   */
  async get<T>(key: string): Promise<T | undefined> {
    const item = this.cache.get(key);

    // 캐시에 없는 경우
    if (!item) {
      return undefined;
    }

    // 만료된 경우
    if (item.expireAt && Date.now() > item.expireAt) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * 값을 캐시에 저장합니다.
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const item: CacheItem<any> = {
      value
    };

    if (ttl) {
      item.expireAt = Date.now() + ttl * 1000;
    }

    this.cache.set(key, item);
  }

  /**
   * 키를 캐시에서 삭제합니다.
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * 여러 키를 캐시에서 삭제합니다.
   */
  async delMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.cache.delete(key);
    }
  }

  /**
   * 캐시에서 특정 패턴의 모든 키를 삭제합니다.
   */
  async delPattern(pattern: string): Promise<void> {
    // 글로브 패턴을 정규식으로 변환
    const globToRegex = (glob: string): RegExp => {
      // 특수 문자 이스케이프 처리
      const escapedText = glob.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 글로브 와일드카드를 정규식으로 변환
      const regexText = escapedText
        .replace(/\\\*/g, '.*') // *를 .*로 치환
        .replace(/\\\?/g, '.'); // ?를 .으로 치환
      
      return new RegExp(`^${regexText}$`);
    };

    const regex = globToRegex(pattern);

    // 패턴과 일치하는 키 모두 삭제
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 캐시가 특정 키를 가지고 있는지 확인합니다.
   */
  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  /**
   * 캐시에서 값을 가져오거나, 없으면 생성하여 저장합니다.
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const value = await this.get<T>(key);
    if (value !== undefined) {
      return value;
    }

    const newValue = await factory();
    await this.set(key, newValue, ttl);
    return newValue;
  }

  /**
   * 캐시를 비웁니다.
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * 만료된 항목을 정리합니다.
   */
  async cleanup(): Promise<void> {
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.expireAt && now > item.expireAt) {
        this.cache.delete(key);
      }
    }
  }
} 