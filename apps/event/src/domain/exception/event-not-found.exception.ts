import { NotFoundException } from '@nestjs/common';

/**
 * 이벤트를 찾을 수 없을 때 발생하는 예외
 */
export class EventNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super(message || '이벤트를 찾을 수 없습니다');
  }
} 