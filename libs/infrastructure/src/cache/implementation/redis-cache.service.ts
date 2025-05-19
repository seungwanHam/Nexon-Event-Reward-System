import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheService } from '@app/libs/infrastructure/cache/cache.service';

/**
 * Redis 기반 캐시 서비스 구현체
 */
@Injectable()
export class RedisCacheService extends CacheService {
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
  ) {
    super(cacheManager);
  }

  /**
   * 캐시에서 특정 패턴의 모든 키를 삭제합니다.
   * 참고: Redis의 SCAN 명령어를 사용하는 방식으로, 대규모 시스템에서도 안전함
   */
  override async delPattern(pattern: string): Promise<void> {
    try {
      // Redis 클라이언트 직접 접근을 위한 형변환 
      const redisClient = (this.cacheManager as any).store.getClient();

      // 스캔을 사용하여 키 찾기
      let cursor = '0';
      do {
        const reply = await new Promise<[string, string[]]>((resolve, reject) => {
          redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '100', (err, res) => {
            if (err) return reject(err);
            resolve(res);
          });
        });

        cursor = reply[0];
        const keys = reply[1];

        if (keys.length > 0) {
          await new Promise<void>((resolve, reject) => {
            redisClient.del(keys, (err) => {
              if (err) return reject(err);
              resolve();
            });
          });
        }
      } while (cursor !== '0');
    } catch (error) {
      // Redis 클라이언트가 없는 경우 등 에러 처리
      console.error(`캐시 패턴 삭제 중 오류: ${error.message}`);
    }
  }
} 