import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from '../interface/jwt-payload.interface';

/**
 * JWT 액세스 토큰 인증 전략
 * 
 * 요청의 Authorization 헤더에서 Bearer 토큰을 추출하여 검증합니다.
 * 유효한 토큰인 경우 사용자 정보를 요청 객체에 추가합니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * JWT 전략 생성자
   * 
   * @param configService - 환경 설정 서비스
   */
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'nexon-access-secret',
    });
  }

  /**
   * JWT 페이로드에서 사용자 정보를 추출합니다.
   * 
   * @param payload - JWT 토큰 페이로드
   * @returns 사용자 정보
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
    };
  }
} 