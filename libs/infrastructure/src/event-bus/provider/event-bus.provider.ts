import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEventBus } from '../interface/event-bus.interface';
import { InMemoryEventBus } from '../implementation/in-memory-event-bus';
import { RedisEventBus } from '../implementation/redis-event-bus';
import { EVENT_BUS } from '../index';

/**
 * 이벤트 버스 프로바이더 팩토리
 * 주입된 'EVENT_BUS_TYPE'에 따라 적절한 구현체를 제공합니다.
 */
export const eventBusProvider: Provider = {
  provide: EVENT_BUS,
  useFactory: (type: string, configService: ConfigService): IEventBus => {
    switch (type) {
      case 'redis':
        return new RedisEventBus(configService);
      case 'in-memory':
      default:
        return new InMemoryEventBus();
    }
  },
  inject: ['EVENT_BUS_TYPE', ConfigService],
}; 