import { Provider } from '@nestjs/common';
import { LockType } from '../../../../common/src/enum';
import { LockManagerOptions } from '../interface';
import { RedisLockService, MemoryLockService } from '../implementation';

/**
 * 락 서비스 팩토리 함수
 * 
 * @param provide 제공할 서비스 토큰
 * @param type 락 타입
 * @param options 락 서비스 옵션
 * @returns 제공자 배열
 */
export function createLockServiceProvider(
  provide: string,
  type: LockType = LockType.REDIS,
  options: LockManagerOptions = {},
): Provider[] {
  switch (type) {
    case LockType.REDIS:
      return [
        // 잠금 서비스 제공자
        {
          provide,
          useClass: RedisLockService,
        },
      ];

    case LockType.MEMORY:
      return [
        {
          provide,
          useClass: MemoryLockService,
        },
      ];

    default:
      throw new Error(`Unsupported lock type: ${type}`);
  }
} 