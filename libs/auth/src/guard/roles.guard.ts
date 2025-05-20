import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@app/libs/common/enum';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

/**
 * 역할 기반 접근 제어(RBAC)를 위한 가드
 * 
 * Roles 데코레이터로 지정된 역할을 가진 사용자만 접근할 수 있도록 합니다.
 * Public 데코레이터가 적용된 엔드포인트는 역할 검사를 건너뜁니다.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  /**
   * 요청에 대한 역할 기반 접근 제어를 수행합니다.
   * 
   * 다음 경우에 접근을 허용합니다:
   * 1. Public 데코레이터가 적용된 경우
   * 2. Roles 데코레이터가 적용되지 않은 경우
   * 3. 사용자가 요구되는 역할 중 하나 이상을 가진 경우
   * 
   * @param context - 실행 컨텍스트
   * @returns 접근 허용 여부
   */
  canActivate(context: ExecutionContext): boolean {
    // Public 데코레이터가 있으면 권한 체크를 건너뜀
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.roles?.includes(role));
  }
} 