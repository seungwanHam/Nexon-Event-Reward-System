import { Injectable, Inject } from '@nestjs/common';
import { ICacheService, CACHE_SERVICE } from '@app/libs/infrastructure/cache';
import { TokenBlacklistRepository } from '@app/auth/domain/repository';
import { InvalidTokenException } from '@app/libs/common/exception';

@Injectable()
export class TokenBlacklistRepositoryImpl implements TokenBlacklistRepository {
  private readonly PREFIX = 'blacklist:token:';
  private readonly USER_PREFIX = 'blacklist:user:';

  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async addToBlacklist(token: string, expiryInSeconds: number): Promise<void> {
    const key = this.getTokenKey(token);
    const exists = await this.cacheService.exists(key);

    if (exists) {
      throw new InvalidTokenException('토큰이 이미 블랙리스트에 있습니다');
    }

    await this.cacheService.set(key, 'true', expiryInSeconds);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return await this.cacheService.exists(this.getTokenKey(token));
  }

  async cleanupExpiredTokens(): Promise<number> {
    // Redis의 경우 자동으로 만료되므로 별도 구현 불필요
    return 0;
  }

  async blacklistUserTokens(userId: string, expiryInSeconds: number): Promise<void> {
    const userKey = this.getUserKey(userId);
    await this.cacheService.set(userKey, 'true', expiryInSeconds);
  }

  async getBlacklistSize(): Promise<number> {
    // Redis SCAN을 사용하여 키 개수를 계산
    try {
      const redisClient = await this.getRedisClient();
      return new Promise((resolve, reject) => {
        let count = 0;
        const stream = redisClient.scanStream({
          match: `${this.PREFIX}*`,
          count: 100
        });

        stream.on('data', (keys: string[]) => {
          count += keys.length;
        });

        stream.on('end', () => {
          resolve(count);
        });

        stream.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error('Redis 클라이언트를 가져오는데 실패했습니다:', error);
      return 0;
    }
  }

  private getTokenKey(token: string): string {
    return `${this.PREFIX}${token}`;
  }

  private getUserKey(userId: string): string {
    return `${this.USER_PREFIX}${userId}`;
  }

  private async getRedisClient(): Promise<any> {
    return (this.cacheService as any).cacheManager.store.getClient();
  }
} 