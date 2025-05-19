import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get<T = string>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue);
  }

  getOrThrow<T = string>(key: string): T {
    return this.configService.getOrThrow<T>(key);
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue?.toString());
    return value ? parseInt(value, 10) : defaultValue;
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue?.toString());
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }
} 