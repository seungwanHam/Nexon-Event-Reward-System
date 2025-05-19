import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidRoleAssignmentException extends HttpException {
  constructor(message: string = '잘못된 역할 할당입니다') {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'AUTH001',
    }, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidStatusTransitionException extends HttpException {
  constructor(message: string = '잘못된 상태 전이입니다') {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'AUTH002',
    }, HttpStatus.BAD_REQUEST);
  }
}

export class EmailAlreadyExistsException extends HttpException {
  constructor(message: string = '이미 존재하는 이메일입니다') {
    super({
      statusCode: HttpStatus.CONFLICT,
      message,
      error: 'AUTH003',
    }, HttpStatus.CONFLICT);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor(message: string = '잘못된 인증 정보입니다') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'AUTH004',
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class UserNotFoundException extends HttpException {
  constructor(message: string = '사용자를 찾을 수 없습니다') {
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: 'AUTH005',
    }, HttpStatus.NOT_FOUND);
  }
}

export class InvalidTokenException extends HttpException {
  constructor(message: string = '유효하지 않은 토큰입니다') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'AUTH006',
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends HttpException {
  constructor(message: string = '토큰이 만료되었습니다') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'AUTH007',
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenBlacklistedException extends HttpException {
  constructor(message: string = '블랙리스트에 등록된 토큰입니다') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'AUTH008',
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class InsufficientPermissionException extends HttpException {
  constructor(requiredRoles: string[], userRoles: string[]) {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      message: '권한이 부족합니다',
      error: 'AUTH009',
      details: { requiredRoles, userRoles }
    }, HttpStatus.FORBIDDEN);
  }
}

export class InvalidUserStatusException extends HttpException {
  constructor(userId: string, currentStatus: string) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: '유효하지 않은 사용자 상태입니다',
      error: 'AUTH010',
      details: { userId, currentStatus }
    }, HttpStatus.BAD_REQUEST);
  }
} 