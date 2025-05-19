import { HttpException, HttpStatus } from '@nestjs/common';

export class ForbiddenException extends HttpException {
  constructor(message: string = '권한이 없습니다.') {
    super({
      success: false,
      message,
      error: {
        code: 'FORBIDDEN',
        details: null,
      },
    }, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = '인증이 필요합니다.') {
    super({
      success: false,
      message,
      error: {
        code: 'UNAUTHORIZED',
        details: null,
      },
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string, details?: any) {
    super({
      success: false,
      message,
      error: {
        code: 'BAD_REQUEST',
        details,
      },
    }, HttpStatus.BAD_REQUEST);
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string, details?: any) {
    super({
      success: false,
      message,
      error: {
        code: 'NOT_FOUND',
        details,
      },
    }, HttpStatus.NOT_FOUND);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string, details?: any) {
    super({
      success: false,
      message,
      error: {
        code: 'CONFLICT',
        details,
      },
    }, HttpStatus.CONFLICT);
  }
} 