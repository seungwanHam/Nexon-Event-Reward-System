import { Injectable } from '@nestjs/common';
import { Logger, LoggerFactory } from '@app/libs/infrastructure/logger';
import * as winston from 'winston';

/**
 * Winston 기반 로거 구현체
 */
export class WinstonLogger implements Logger {
  private readonly logger: winston.Logger;

  constructor(private readonly context: string) {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let metadataStr = '';
          if (Object.keys(metadata).length > 0) {
            metadataStr = JSON.stringify(metadata);
          }
          return `[${timestamp}] [${this.context}] ${level.toUpperCase()}: ${message} ${metadataStr}`;
        })
      ),
      defaultMeta: { service: this.context },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}

/**
 * Winston 로거 팩토리 구현체
 */
@Injectable()
export class WinstonLoggerFactory implements LoggerFactory {
  createLogger(context: string): Logger {
    return new WinstonLogger(context);
  }
} 