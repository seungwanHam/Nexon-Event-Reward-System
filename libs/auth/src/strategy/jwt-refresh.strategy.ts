import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from '../interface/jwt-payload.interface';

/**
 * 리프레시 토큰과 페이로드를 포함하는 확장된 JWT 페이로드 인터페이스
 */
export interface JwtRefreshPayload extends JwtPayload {
  /** 리프레시 토큰 문자열 */
  refreshToken: string;
}

/**
 * JWT 리프레시 토큰 인증 전략
 * 
 * 토큰 갱신 프로세스에서 리프레시 토큰의 유효성을 검증합니다.
 * 요청의 인증 헤더에서 리프레시 토큰을 추출하고 검증합니다.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  /**
   * JWT 리프레시 전략 생성자
   * 
   * @param configService - 환경 설정 서비스
   */
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'nexon-refresh-secret',
      passReqToCallback: true,
    });
  }

  /**
   * JWT 페이로드와 요청 객체에서 사용자 정보와 리프레시 토큰을 추출합니다.
   * 
   * @param req - HTTP 요청 객체
   * @param payload - JWT 토큰 페이로드
   * @returns 사용자 정보와 리프레시 토큰을 포함한 객체
   * @throws {Error} 리프레시 토큰이 없는 경우
   */
  async validate(req: Request, payload: JwtPayload): Promise<JwtRefreshPayload> {
    const refreshToken = req.headers.authorization?.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다');
    }

    return {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
      refreshToken,
    };
  }
} 