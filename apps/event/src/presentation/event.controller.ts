import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class EventController {
  @MessagePattern({ cmd: 'ping' })
  ping() {
    return { message: 'Event service is alive!' };
  }
} 