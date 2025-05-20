import { Body, Controller, Param, UseGuards, Post, Get, Put, Req, ForbiddenException, Headers } from '@nestjs/common';
import { JwtAuthGuard, Roles } from '../../../../../libs/auth/src';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
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

/**
 * 인증 관련 컨트롤러
 * 
 * 사용자 인증, 회원가입, 프로필 관리 등의 API 엔드포인트를 제공합니다.
 */
@ApiTags('인증 API')
@Controller()
export class AuthController {
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
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '회원가입에 성공했습니다.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'user@example.com' },
            nickname: { type: 'string', example: 'John Doe' },
            roles: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['user'] 
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '이미 존재하는 이메일입니다.' },
        error: { type: 'string', example: 'BadRequest' }
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
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '로그인에 성공했습니다.' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        error: { type: 'string', example: 'Unauthorized' }
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
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '토큰이 갱신되었습니다.' },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않은 리프레시 토큰',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '유효하지 않은 리프레시 토큰입니다.' },
        error: { type: 'string', example: 'Unauthorized' }
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
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer 토큰',
    required: false,
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
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
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '로그아웃 되었습니다.' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '유효하지 않은 토큰입니다.' },
        error: { type: 'string', example: 'Unauthorized' }
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
  @ApiBearerAuth('access-token')
  @ApiParam({
    name: 'userId',
    description: '조회할 사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '프로필을 조회했습니다.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'user@example.com' },
            nickname: { type: 'string', example: 'John Doe' },
            roles: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['user'] 
            },
            status: { type: 'string', example: 'active' },
            metadata: { 
              type: 'object',
              example: { 
                lastLogin: '2023-06-10T15:30:00Z',
                preferredLanguage: 'ko'
              } 
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '사용자를 찾을 수 없습니다.' },
        error: { type: 'string', example: 'NotFound' }
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
  @ApiBearerAuth('access-token')
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
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '사용자 정보가 수정되었습니다.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', example: 'new@example.com' },
            nickname: { type: 'string', example: 'New Name' },
            roles: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['user', 'admin']
            },
            status: { type: 'string', example: 'active' },
            metadata: { 
              type: 'object',
              example: {
                preferredLanguage: 'ko',
                theme: 'dark'
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '유효하지 않은 이메일 형식입니다.' },
        error: { type: 'string', example: 'BadRequest' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: '권한 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '자신의 정보만 수정할 수 있습니다.' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '사용자를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '사용자를 찾을 수 없습니다.' },
        error: { type: 'string', example: 'NotFound' }
      }
    }
  })
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
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