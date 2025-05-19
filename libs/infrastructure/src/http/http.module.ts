import { Module } from '@nestjs/common';
import { HttpModule as NestHttpModule } from '@nestjs/axios';
import { NestAxiosHttpClient } from './nestjs-axios-http-client';

@Module({
  imports: [NestHttpModule],
  providers: [
    {
      provide: 'HTTP_CLIENT',
      useClass: NestAxiosHttpClient,
    },
  ],
  exports: ['HTTP_CLIENT'],
})
export class HttpModule {} 