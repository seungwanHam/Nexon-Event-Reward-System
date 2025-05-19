import { Global, Module } from '@nestjs/common';
import { WinstonLoggerService } from './winston-logger.service';
import { LOGGER_FACTORY, LoggerFactory } from './logger.interface';

export class WinstonLoggerFactory implements LoggerFactory {
  createLogger(context: string) {
    return new WinstonLoggerService();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: WinstonLoggerService,
      useClass: WinstonLoggerService,
    },
    {
      provide: LOGGER_FACTORY,
      useClass: WinstonLoggerFactory,
    },
  ],
  exports: [WinstonLoggerService, LOGGER_FACTORY],
})
export class LoggerModule {} 