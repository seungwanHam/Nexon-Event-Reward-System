import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

/**
 * JWT 액세스 토큰을 검증하는 인증 가드
 * 
 * Public 데코레이터가 적용된 엔드포인트는 인증 검사를 건너뜁니다.
 * 그 외 모든 엔드포인트는 유효한 JWT 액세스 토큰이 필요합니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * 요청에 대한 인증 검사를 수행합니다.
   * Public 데코레이터가 적용된 경우 인증 검사를 건너뜁니다.
   * 
   * @param context - 실행 컨텍스트
   * @returns 인증 성공 여부
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * 인증 결과를 처리합니다.
   * 토큰 만료나 유효하지 않은 토큰에 대한 예외를 발생시킵니다.
   * 
   * @param err - 발생한 오류
   * @param user - 인증된 사용자 정보
   * @param info - 추가 정보
   * @returns 인증된 사용자 정보
   * @throws {UnauthorizedException} 토큰이 만료되었거나 유효하지 않은 경우
   */
  handleRequest(err: any, user: any, info: any): any {
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException('토큰이 만료되었습니다');
    }

    if (err || !user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    return user;
  }
} 