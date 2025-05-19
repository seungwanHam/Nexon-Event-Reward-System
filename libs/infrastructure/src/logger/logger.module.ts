import { Module, Global } from '@nestjs/common';
import { WinstonLoggerFactory } from './winston-logger.service';
import { LOGGER_FACTORY } from './logger.interface';

@Global()
@Module({
  providers: [
    {
      provide: LOGGER_FACTORY,
      useClass: WinstonLoggerFactory,
    },
  ],
  exports: [LOGGER_FACTORY],
})
export class LoggerModule {} 