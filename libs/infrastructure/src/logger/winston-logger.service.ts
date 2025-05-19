import { Injectable } from '@nestjs/common';
import { Logger } from './logger.interface';
import * as winston from 'winston';

/**
 * Winston 기반 로거 구현체
 */
@Injectable()
export class WinstonLoggerService implements Logger {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let metadataStr = '';
          if (Object.keys(metadata).length > 0) {
            metadataStr = JSON.stringify(metadata);
          }
          return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metadataStr}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
          ),
        }),
      ],
    });
  }

  log(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.logger.error(message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, metadata);
  }

  verbose(message: string, metadata?: Record<string, any>): void {
    this.logger.verbose(message, metadata);
  }
} 