import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy';
import { JWT_CONSTANTS } from './constant/jwt.constant';

export interface AuthModuleOptions {
  accessTokenSecret?: string;
  refreshTokenSecret?: string;
  accessTokenExpiry?: string;
  refreshTokenExpiry?: string;
}

@Module({})
export class AuthModule {
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