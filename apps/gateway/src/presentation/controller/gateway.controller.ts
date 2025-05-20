import { Body, Controller, Param, Query, UseGuards, HttpStatus, Post, Get, Put, Req, ForbiddenException, Headers } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Public, Roles } from '../../../../../libs/auth/src';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import {
  LoginRequestDto,
  RegisterRequestDto,
  RefreshTokenRequestDto,
  LogoutRequestDto,
  UpdateUserRequestDto,
  AuthResponseDto,
  ProfileResponseDto,
} from '@app/gateway/presentation/dto';

import { UserRole } from '@app/libs/common/enum/user-role.enum';
import { AuthFacade } from '@app/gateway/application/facade';

@ApiTags('인증 API')
@Controller()
export class GatewayController {
  constructor(
    private readonly authFacade: AuthFacade,
  ) { }

  @ApiOperation({ summary: '회원가입', description: '새로운 사용자를 등록합니다.' })
  @ApiBody({
    type: RegisterRequestDto,
    description: '회원가입 요청 데이터',
    examples: {
      success: {
        value: {
          email: 'user@example.com',
          password: 'password123',
          nickname: 'John Doe',
          roles: ['user']
        },
        summary: '일반 사용자 회원가입'
      },
      admin: {
        value: {
          email: 'admin@example.com',
          password: 'adminPass123',
          nickname: 'Admin User',
          roles: ['admin', 'user']
        },
        summary: '관리자 회원가입'
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: AuthResponseDto,
    content: {
      'application/json': {
        example: {
          success: true,
          message: '회원가입에 성공했습니다.',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user@example.com',
            nickname: 'John Doe',
            roles: ['user']
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    content: {
      'application/json': {
        example: {
          success: false,
          message: '이미 존재하는 이메일입니다.'
        }
      }
    }
  })
  @Post('auth/register')
  async authRegister(@Body() registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    console.log('registerDto', registerDto);
    const result = await this.authFacade.register(registerDto);
    return {
      success: true,
      message: '회원가입에 성공했습니다.',
      data: result,
    };
  }

  @ApiOperation({ summary: '로그인', description: '이메일과 비밀번호로 사용자 로그인을 처리합니다.' })
  @ApiBody({
    type: LoginRequestDto,
    description: '로그인 요청 데이터',
    examples: {
      success: {
        value: {
          email: 'user@example.com',
          password: 'password123'
        },
        summary: '로그인 요청 예시'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: AuthResponseDto,
    content: {
      'application/json': {
        example: {
          success: true,
          message: '로그인에 성공했습니다.',
          data: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    content: {
      'application/json': {
        example: {
          success: false,
          message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        }
      }
    }
  })
  @Post('auth/login')
  async authLogin(@Body() loginDto: LoginRequestDto): Promise<AuthResponseDto> {
    const result = await this.authFacade.login({ ...loginDto });
    return {
      success: true,
      message: '로그인에 성공했습니다.',
      data: result,
    };
  }

  @ApiOperation({ summary: '토큰 갱신', description: '만료된 액세스 토큰을 갱신합니다.' })
  @ApiBody({
    type: RefreshTokenRequestDto,
    description: '토큰 갱신 요청 데이터',
    examples: {
      success: {
        value: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        summary: '토큰 갱신 요청'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    type: AuthResponseDto,
    content: {
      'application/json': {
        example: {
          success: true,
          message: '토큰이 갱신되었습니다.',
          data: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않은 리프레시 토큰',
    content: {
      'application/json': {
        example: {
          success: false,
          message: '유효하지 않은 리프레시 토큰입니다.'
        }
      }
    }
  })
  @Post('auth/refresh')
  async authRefresh(@Body() refreshTokenDto: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    const result = await this.authFacade.refreshToken({ ...refreshTokenDto });
    return {
      success: true,
      message: '토큰이 갱신되었습니다.',
      data: result,
    };
  }

  @ApiOperation({ summary: '로그아웃', description: '사용자 로그아웃을 처리합니다.' })
  @ApiBody({
    type: LogoutRequestDto,
    description: '로그아웃 요청 데이터',
    examples: {
      success: {
        value: {
          userId: '123e4567-e89b-12d3-a456-426614174000'
        },
        summary: '로그아웃 요청'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    type: AuthResponseDto,
    content: {
      'application/json': {
        example: {
          success: true,
          message: '로그아웃 되었습니다.'
        }
      }
    }
  })
  @Post('auth/logout')
  async authLogout(
    @Body() logoutDto: LogoutRequestDto,
    @Headers('Authorization') accessToken?: string
  ): Promise<AuthResponseDto> {
    await this.authFacade.logout({ ...logoutDto, accessToken });
    return {
      success: true,
      message: '로그아웃 되었습니다.',
    };
  }

  @ApiOperation({ summary: '프로필 조회', description: '사용자의 프로필 정보를 조회합니다.' })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    content: {
      'application/json': {
        example: {
          success: false,
          message: '사용자를 찾을 수 없습니다.'
        }
      }
    }
  })
  @UseGuards(JwtAuthGuard)
  @Get('auth/profile/:userId')
  async getProfile(@Param('userId') userId: string): Promise<AuthResponseDto> {
    const result = await this.authFacade.getUserProfile(userId);
    return {
      success: true,
      message: '프로필을 조회했습니다.',
      data: result,
    };
  }

  @ApiOperation({ summary: '사용자 정보 수정', description: '관리자 권한으로 사용자 정보를 수정합니다.' })
  @ApiParam({
    name: 'userId',
    description: '수정할 사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    type: UpdateUserRequestDto,
    description: '사용자 정보 수정 요청 데이터',
    examples: {
      basic: {
        value: {
          nickname: 'New Name',
          email: 'new@example.com'
        },
        summary: '기본 정보 수정'
      },
      full: {
        value: {
          nickname: 'New Name',
          email: 'new@example.com',
          password: 'newPassword123',
          roles: ['user', 'admin'],
          status: 'active',
          metadata: {
            preferredLanguage: 'ko',
            theme: 'dark'
          }
        },
        summary: '전체 정보 수정'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 수정 성공',
    type: AuthResponseDto,
    content: {
      'application/json': {
        example: {
          success: true,
          message: '사용자 정보가 수정되었습니다.',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'new@example.com',
            nickname: 'New Name',
            roles: ['user', 'admin'],
            status: 'active',
            metadata: {
              preferredLanguage: 'ko',
              theme: 'dark'
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @UseGuards(JwtAuthGuard)
  // @Roles(UserRole.ADMIN)
  @Put('auth/users/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserRequestDto,
    @Req() req: any
  ): Promise<AuthResponseDto> {
    if (userId !== req.user.id) {
      throw new ForbiddenException('자신의 정보만 수정할 수 있습니다.');
    }
    const result = await this.authFacade.updateUser(userId, { ...updateUserDto });
    return {
      success: true,
      message: '사용자 정보가 수정되었습니다.',
      data: result,
    };
  }
} 