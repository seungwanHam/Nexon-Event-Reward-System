import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';
import { Observable } from 'rxjs';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any): any {
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException('리프레시 토큰이 만료되었습니다');
    }
    
    if (err || !user) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
    }

    return user;
  }
} 