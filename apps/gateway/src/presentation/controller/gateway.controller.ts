import { Body, Controller, Param, Query, UseGuards, HttpStatus, Post, Get, Put } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Public, Roles } from '../../../../../libs/auth/src/index';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import {
  LoginRequestDto,
  RegisterRequestDto,
  RefreshTokenRequestDto,
  LogoutRequestDto,
  UpdateUserRequestDto,

  AuthResponseDto,
} from '@app/gateway/presentation/dto';

import { UserRole } from '@app/libs/common/enum/user-role.enum';
import { AuthFacade } from '@app/gateway/application/facade';

@ApiTags('인증 API')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class GatewayController {
  constructor(
    private readonly AuthFacade: AuthFacade,
    // private readonly EventFacade: EventFacade,
  ) { }

  // ================== 인증 서비스 라우트 ==================

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
  @Public()
  @Post('auth/login')
  async authLogin(@Body() loginDto: LoginRequestDto): Promise<AuthResponseDto> {
    const result = await this.AuthFacade.login(loginDto.email, loginDto.password);
    return {
      success: true,
      message: '로그인에 성공했습니다.',
      data: result,
    };
  }

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
  @Public()
  @Post('auth/register')
  async authRegister(@Body() registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    const result = await this.AuthFacade.register(registerDto);
    return {
      success: true,
      message: '회원가입에 성공했습니다.',
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
  @Public()
  @Post('auth/refresh')
  async authRefresh(@Body() refreshTokenDto: RefreshTokenRequestDto): Promise<AuthResponseDto> {
    const result = await this.AuthFacade.refreshToken(
      refreshTokenDto.userId,
      refreshTokenDto.refreshToken
    );
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
  async authLogout(@Body() logoutDto: LogoutRequestDto): Promise<AuthResponseDto> {
    await this.AuthFacade.logout(logoutDto.userId);
    return {
      success: true,
      message: '로그아웃 되었습니다.',
    };
  }

  @ApiOperation({ summary: '프로필 조회', description: '사용자의 프로필 정보를 조회합니다.' })
  @ApiQuery({
    name: 'userId',
    type: String,
    description: '조회할 사용자 ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: AuthResponseDto,
    content: {
      'application/json': {
        example: {
          success: true,
          message: '프로필을 조회했습니다.',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user@example.com',
            nickname: 'John Doe',
            roles: ['user'],
            createdAt: '2024-03-19T15:00:00.000Z',
            updatedAt: '2024-03-19T15:00:00.000Z'
          }
        }
      }
    }
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
  @Get('auth/profile')
  async getProfile(@Query('userId') userId: string): Promise<AuthResponseDto> {
    const result = await this.AuthFacade.getUserProfile(userId);
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
  @Roles(UserRole.ADMIN)
  @Put('auth/users/:userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserRequestDto
  ): Promise<AuthResponseDto> {
    const result = await this.AuthFacade.updateUser({
      userId,
      nickname: updateUserDto.nickname,
      email: updateUserDto.email,
      password: updateUserDto.password,
      roles: updateUserDto.roles || [],
      status: updateUserDto.status,
      metadata: updateUserDto.metadata,
    });
    return {
      success: true,
      message: '사용자 정보가 수정되었습니다.',
      data: result,
    };
  }

  // 인증이 필요한 Auth 서비스 경로
  // @ApiOperation({ summary: '인증 서비스 프록시', description: '인증이 필요한 Auth 서비스 요청을 처리합니다.' })
  // @ApiResponse({ status: 200, description: '요청 성공' })
  // @ApiResponse({ status: 401, description: '인증 실패' })
  // @All('api/auth/*')
  // async authProxy(@Req() req: Request, @Body() body: any, @Query() query: any, @Res() res: Response) {
  //   const result = await this.proxyFacade.forwardToAuth(
  //     req.method,
  //     req.path,
  //     req.headers,
  //     body,
  //     query,
  //   );

  //   return this.sendResponse(res, result);
  // }

  // // ================== 이벤트 서비스 라우트 ==================

  // // @ApiOperation({ summary: '이벤트 목록 조회', description: '모든 이벤트 목록을 조회합니다.' })
  // // @ApiResponse({ status: 200, description: '이벤트 목록 조회 성공' })
  // @Get('api/events')
  // async eventsList(@Query() query: any, @Res() res: Response) {
  //   try {
  //     const result = await this.proxyFacade.getEvents({
  //       page: query.page ? parseInt(query.page) : 1,
  //       limit: query.limit ? parseInt(query.limit) : 10,
  //       filter: query.filter
  //     });
  //     return res.status(HttpStatus.OK).json(result);
  //   } catch (error) {
  //     return this.handleError(res, error);
  //   }
  // }

  // // @ApiOperation({ summary: '이벤트 상세 조회', description: '특정 이벤트의 상세 정보를 조회합니다.' })
  // // @ApiParam({ name: 'id', description: '이벤트 ID' })
  // // @ApiResponse({ status: 200, description: '이벤트 상세 조회 성공' })
  // // @ApiResponse({ status: 404, description: '이벤트 없음' })
  // @Get('api/events/:id')
  // async eventDetail(@Param('id') id: string, @Res() res: Response) {
  //   try {
  //     const result = await this.proxyFacade.getEvent(id);
  //     return res.status(HttpStatus.OK).json(result);
  //   } catch (error) {
  //     return this.handleError(res, error);
  //   }
  // }

  // // @ApiOperation({ summary: '이벤트 생성', description: '새 이벤트를 생성합니다. (운영자 이상 권한 필요)' })
  // // @ApiResponse({ status: 201, description: '이벤트 생성 성공' })
  // // @ApiResponse({ status: 403, description: '권한 없음' })
  // @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  // @Post('api/events/create')
  // async createEvent(@Body() body: any, @Res() res: Response) {
  //   try {
  //     const result = await this.proxyFacade.createEvent(body);
  //     return res.status(HttpStatus.CREATED).json(result);
  //   } catch (error) {
  //     return this.handleError(res, error);
  //   }
  // }

  // // @ApiOperation({ summary: '이벤트 수정', description: '기존 이벤트를 수정합니다. (운영자 이상 권한 필요)' })
  // // @ApiParam({ name: 'id', description: '이벤트 ID' })
  // // @ApiResponse({ status: 200, description: '이벤트 수정 성공' })
  // // @ApiResponse({ status: 403, description: '권한 없음' })
  // // @ApiResponse({ status: 404, description: '이벤트 없음' })
  // @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  // @Post('api/events/:id/update')
  // async updateEvent(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
  //   try {
  //     const updateData = { id, ...body };
  //     const result = await this.proxyFacade.updateEvent(updateData);
  //     return res.status(HttpStatus.OK).json(result);
  //   } catch (error) {
  //     return this.handleError(res, error);
  //   }
  // }

  // @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  // @Post('api/events/:id/delete')
  // async deleteEvent(@Param('id') id: string, @Res() res: Response) {
  //   try {
  //     const result = await this.proxyFacade.deleteEvent(id);
  //     return res.status(HttpStatus.OK).json(result);
  //   } catch (error) {
  //     return this.handleError(res, error);
  //   }
  // }

  // @Post('api/events/:id/participate')
  // async participateEvent(@Param('id') eventId: string, @Body() body: { userId: string }, @Res() res: Response) {
  //   try {
  //     const result = await this.proxyFacade.participateEvent(eventId, body.userId);
  //     return res.status(HttpStatus.OK).json(result);
  //   } catch (error) {
  //     return this.handleError(res, error);
  //   }
  // }

  // // 나머지 Event 서비스 경로
  // // @ApiOperation({ summary: '이벤트 서비스 프록시', description: '이벤트 서비스 요청을 처리합니다.' })
  // // @ApiResponse({ status: 200, description: '요청 성공' })
  // @All('api/events/*')
  // async eventsProxy(@Req() req: Request, @Body() body: any, @Query() query: any, @Res() res: Response) {
  //   const result = await this.proxyFacade.forwardToEvent(
  //     req.method,
  //     req.path,
  //     req.headers,
  //     body,
  //     query,
  //   );

  //   return this.sendResponse(res, result);
  // }

  // @Get('api/rewards')
  // async getRewards(@Query() query: any, @Res() res: Response) {
  //   try {
  //     const result = await this.proxyFacade.getRewards({
  //       userId: query.userId,
  //       eventId: query.eventId,
  //       page: query.page ? parseInt(query.page) : 1,
  //       limit: query.limit ? parseInt(query.limit) : 10
  //     });
  //     return res.status(HttpStatus.OK).json(result);
  //   } catch (error) {
  //     return this.handleError(res, error);
  //   }
  // }

  // @Get('api/rewards/:id')
  // async getReward(@Param('id') rewardId: string, @Res() res: Response) {
  //   try {
  //     const result = await this.proxyFacade.getReward(rewardId);
  //     return res.status(HttpStatus.OK).json(result);
  //   } catch (error) {
  //     return this.handleError(res, error);
  //   }
  // }

  // @Post('api/rewards/:id/claim')
  // async claimReward(@Param('id') rewardId: string, @Body() body: { userId: string }, @Res() res: Response) {
  //   try {
  //     const result = await this.proxyFacade.claimReward(rewardId, body.userId);
  //     return res.status(HttpStatus.OK).json(result);
  //   } catch (error) {
  //     return this.handleError(res, error);
  //   }
  // }

  // /**
  //  * gRPC 응답을 HTTP 응답으로 변환하여 반환
  //  */
  // private sendResponse(res: Response, result: any): void {
  //   // 헤더 설정
  //   if (result.headers) {
  //     Object.entries(result.headers).forEach(([key, value]) => {
  //       res.setHeader(key, value as string);
  //     });
  //   }

  //   // 상태 코드 설정 (기본값: 200 OK)
  //   const statusCode = result.statusCode || HttpStatus.OK;

  //   // 응답 본문 설정
  //   let responseBody;
  //   if (result.body) {
  //     try {
  //       // 바이너리 응답을 문자열로 변환 후 JSON으로 파싱
  //       if (Buffer.isBuffer(result.body)) {
  //         responseBody = JSON.parse(result.body.toString('utf-8'));
  //       } else if (typeof result.body === 'string') {
  //         responseBody = JSON.parse(result.body);
  //       } else {
  //         responseBody = result.body;
  //       }
  //     } catch (e) {
  //       // JSON 파싱 실패 시 원본 반환
  //       responseBody = result.body;
  //     }
  //   }

  //   // 응답 전송
  //   res.status(statusCode).json(responseBody);
  // }

  // /**
  //  * 에러 처리 헬퍼 메서드
  //  */
  // private handleError(res: Response, error: any): Response {
  //   const statusCode = this.determineStatusCode(error);
  //   const errorResponse = {
  //     error: error.message || '내부 서버 오류',
  //     code: error.code || 'INTERNAL_ERROR',
  //     details: error.details
  //   };

  //   return res.status(statusCode).json(errorResponse);
  // }

  // /**
  //  * 에러 메시지에 따른 HTTP 상태 코드 결정
  //  */
  // private determineStatusCode(error: any): number {
  //   // 이미 HTTP 상태 코드가 있는 경우
  //   if (error.statusCode) {
  //     return error.statusCode;
  //   }

  //   const message = error.message || '';

  //   if (message.includes('찾을 수 없') || message.includes('not found')) {
  //     return HttpStatus.NOT_FOUND;
  //   } else if (message.includes('인증') || message.includes('권한') ||
  //     message.includes('unauthorized') || message.includes('auth')) {
  //     return HttpStatus.UNAUTHORIZED;
  //   } else if (message.includes('유효하지 않은') || message.includes('잘못된') ||
  //     message.includes('invalid') || message.includes('bad request')) {
  //     return HttpStatus.BAD_REQUEST;
  //   } else if (message.includes('중복') || message.includes('duplicate')) {
  //     return HttpStatus.CONFLICT;
  //   }

  //   return HttpStatus.INTERNAL_SERVER_ERROR;
  // }
} 