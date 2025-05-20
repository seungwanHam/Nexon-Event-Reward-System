import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@app/libs/common/enum';

/**
 * 역할 기반 접근 제어를 위한 메타데이터 키
 * RolesGuard에서 사용되어 역할 기반 권한 검사를 수행합니다.
 */
export const ROLES_KEY = 'roles';

/**
 * 컨트롤러나 메서드에 접근 가능한 사용자 역할을 지정하는 데코레이터
 * 
 * @example
 * ```typescript
 * @Roles(UserRole.ADMIN)
 * @Get('admin-only')
 * getAdminData() {
 *   return { sensitive: 'data' };
 * }
 * ```
 * 
 * @param roles - 접근을 허용할 사용자 역할 목록
 * @returns 메서드/컨트롤러 데코레이터
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles); 