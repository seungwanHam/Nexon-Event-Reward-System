import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventController } from './presentation/event.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [EventController],
  providers: [],
})
export class EventModule { } 