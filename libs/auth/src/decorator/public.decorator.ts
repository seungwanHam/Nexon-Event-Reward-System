import { SetMetadata } from '@nestjs/common';

/**
 * 공개 엔드포인트를 위한 메타데이터 키
 * JwtAuthGuard에서 사용되어 인증 검사를 건너뜁니다.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 컨트롤러 메서드에 인증 없이 접근 가능하도록 표시하는 데코레이터
 * 
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * checkHealth() {
 *   return { status: 'ok' };
 * }
 * ```
 * 
 * @returns 메서드/컨트롤러 데코레이터
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true); 