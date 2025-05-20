import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { JWT_CONSTANTS } from './constant/jwt.constant';

/**
 * 인증 모듈 옵션 인터페이스
 */
export interface AuthModuleOptions {
  /** 액세스 토큰 시크릿 키 */
  accessTokenSecret?: string;

  /** 리프레시 토큰 시크릿 키 */
  refreshTokenSecret?: string;

  /** 액세스 토큰 만료 시간 (예: '1h', '15m') */
  accessTokenExpiry?: string;

  /** 리프레시 토큰 만료 시간 (예: '7d', '30d') */
  refreshTokenExpiry?: string;
}

/**
 * 인증 관련 기능을 제공하는 모듈
 * 
 * JWT 기반 인증, 가드, 전략 등을 포함합니다.
 * 애플리케이션 전체에서 인증 기능을 사용할 수 있도록 글로벌 모듈로 등록됩니다.
 */
@Module({})
export class AuthModule {
  /**
   * 커스텀 옵션으로 AuthModule을 등록합니다.
   * 
   * @param options - 인증 모듈 설정 옵션
   * @returns 동적 모듈 설정
   * 
   * @example
   * ```typescript
   * // app.module.ts
   * imports: [
   *   AuthModule.register({
   *     accessTokenSecret: process.env.JWT_SECRET,
   *     accessTokenExpiry: '2h',
   *   }),
   * ]
   * ```
   */
  static register(options: AuthModuleOptions = {}): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: options.accessTokenSecret || JWT_CONSTANTS.DEFAULT_ACCESS_SECRET,
          signOptions: {
            expiresIn: options.accessTokenExpiry || JWT_CONSTANTS.ACCESS_TOKEN_EXPIRY,
          },
        }),
      ],
      providers: [JwtStrategy, JwtRefreshStrategy],
      exports: [JwtModule, PassportModule],
      global: true,
    };
  }
} 