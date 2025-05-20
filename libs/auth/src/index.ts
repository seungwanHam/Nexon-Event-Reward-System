/**
 * 인증 모듈 - 사용자 인증 및 권한 관리를 위한 공유 라이브러리
 * 
 * JWT 기반 인증, 역할 기반 접근 제어(RBAC) 및 관련 보안 기능을 제공합니다.
 * 이 모듈은 여러 마이크로서비스에서 공통으로 사용되는 인증 로직을 중앙화합니다.
 */

// 메인 모듈
export * from './auth.module';

// 데코레이터
export * from './decorator/public.decorator';
export * from './decorator/roles.decorator';

// 가드
export * from './guard/jwt-auth.guard';
export * from './guard/jwt-refresh.guard';
export * from './guard/roles.guard';

// 전략
export * from './strategy/jwt.strategy';
export * from './strategy/jwt-refresh.strategy';

// 상수 및 인터페이스
export * from './constant/jwt.constant';
export * from './interface/jwt-payload.interface'; 