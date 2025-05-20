import { NotFoundException } from '@nestjs/common';

export class EventNotFoundException extends NotFoundException {
  constructor(message: string = '이벤트를 찾을 수 없습니다.') {
    super(message);
  }
} 