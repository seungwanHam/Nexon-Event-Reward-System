import { Body, Controller, Get, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '../../../../../libs/auth/src';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@app/libs/common/enum';
import { EventFacade } from '@app/gateway/application/facade';

/**
 * 청구 관련 컨트롤러
 * 
 * 보상 청구, 승인, 거부 및 조회 API 엔드포인트를 제공합니다.
 */
@ApiTags('청구 API')
@Controller('claims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClaimController {
  constructor(private readonly eventFacade: EventFacade) { }

  /**
   * 보상 청구 생성
   */
  @ApiOperation({ summary: '보상 청구 생성', description: '사용자가 보상을 청구합니다.' })
  @ApiBody({
    description: '청구 정보',
    schema: {
      type: 'object',
      required: ['eventId'],
      properties: {
        userId: { type: 'string', example: 'user-123' },
        eventId: { type: 'string', example: 'event-123' }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '청구 생성 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '보상 청구 요청 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347a5f12' },
            userId: { type: 'string', example: 'user-123' },
            eventId: { type: 'string', example: 'event-123' },
            status: { type: 'string', example: 'pending', enum: ['pending', 'approved', 'rejected', 'completed'] },
            claimedAt: { type: 'string', format: 'date-time', example: '2023-06-10T15:30:00Z' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '유효하지 않은 요청',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '이벤트 ID가 필요합니다' },
        error: { type: 'string', example: 'BadRequest' }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: '이미 청구한 보상',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '이미 청구한 보상입니다' },
        error: { type: 'string', example: 'Conflict' }
      }
    }
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post()
  async createClaim(@Body() claimData: any, @Req() req: any) {
    const userId = req.user.userId;
    const result = await this.eventFacade.createClaim(
      userId,
      claimData.eventId
    );
    return {
      success: true,
      message: '보상 청구 요청 성공',
      data: result
    };
  }

  /**
   * 사용자 보상 청구 목록 조회
   */
  @ApiOperation({ summary: '사용자 청구 목록 조회', description: '현재 사용자의 보상 청구 목록을 조회합니다.' })
  @ApiResponse({
    status: 200,
    description: '사용자 보상 청구 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '사용자 보상 청구 목록 조회 성공' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '60d3b41667948b2d347a5f12' },
              eventId: { type: 'string', example: 'event-123' },
              eventName: { type: 'string', example: '출석 체크 이벤트' },
              rewardId: { type: 'string', example: 'reward-456' },
              rewardName: { type: 'string', example: '골드 100개' },
              status: { type: 'string', example: 'pending', enum: ['pending', 'approved', 'rejected', 'completed'] },
              claimedAt: { type: 'string', format: 'date-time', example: '2023-06-10T15:30:00Z' },
              processedAt: { type: 'string', format: 'date-time', example: '2023-06-11T09:15:00Z' }
            }
          }
        }
      }
    }
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('user')
  async getUserClaims(@Req() req: any) {
    const userId = req.user.userId;
    const result = await this.eventFacade.getUserClaims(userId);

    return {
      success: true,
      message: '사용자 보상 청구 목록 조회 성공',
      data: result
    };
  }

  /**
   * 모든 청구 목록 조회 (감사/관리자용)
   */
  @ApiOperation({ summary: '모든 청구 목록 조회', description: '모든 보상 청구 목록을 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수', type: Number })
  @ApiQuery({ name: 'status', required: false, description: '상태 필터', type: String })
  @ApiResponse({
    status: 200,
    description: '청구 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '청구 목록 조회 성공' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '60d3b41667948b2d347a5f12' },
                  userId: { type: 'string', example: 'user-123' },
                  userNickname: { type: 'string', example: 'gameUser1' },
                  eventId: { type: 'string', example: 'event-123' },
                  eventName: { type: 'string', example: '출석 체크 이벤트' },
                  rewardId: { type: 'string', example: 'reward-456' },
                  rewardName: { type: 'string', example: '골드 100개' },
                  status: { type: 'string', example: 'pending', enum: ['pending', 'approved', 'rejected', 'completed'] },
                  claimedAt: { type: 'string', format: 'date-time', example: '2023-06-10T15:30:00Z' },
                  processedAt: { type: 'string', format: 'date-time', example: null }
                }
              }
            },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 }
          }
        }
      }
    }
  })
  @Roles(UserRole.AUDITOR, UserRole.ADMIN)
  @Get()
  async getAllClaims(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string
  ) {
    const filter = status ? { status } : {};
    const result = await this.eventFacade.getAllClaims(+page, +limit, filter);
    return {
      success: true,
      message: '청구 목록 조회 성공',
      data: result
    };
  }

  /**
   * 특정 사용자의 청구 목록 조회 (감사/관리자용)
   */
  @ApiOperation({ summary: '사용자별 청구 목록 조회', description: '특정 사용자의 모든 보상 청구를 조회합니다.' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '사용자별 청구 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '사용자별 청구 목록 조회 성공' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '60d3b41667948b2d347a5f12' },
              eventId: { type: 'string', example: 'event-123' },
              eventName: { type: 'string', example: '출석 체크 이벤트' },
              rewardId: { type: 'string', example: 'reward-456' },
              status: { type: 'string', example: 'pending' },
              claimedAt: { type: 'string', format: 'date-time', example: '2023-06-10T15:30:00Z' }
            }
          }
        }
      }
    }
  })
  @Roles(UserRole.AUDITOR, UserRole.ADMIN)
  @Get('users/:userId')
  async getUserClaimsForAudit(@Param('userId') userId: string) {
    const result = await this.eventFacade.getUserClaimsForAudit(userId);
    return {
      success: true,
      message: '사용자별 청구 목록 조회 성공',
      data: result
    };
  }

  /**
   * 청구 승인
   */
  @ApiOperation({ summary: '청구 승인', description: '보상 청구를 승인합니다.' })
  @ApiParam({ name: 'claimId', description: '청구 ID' })
  @ApiBody({
    description: '승인 정보',
    schema: {
      type: 'object',
      required: ['approverId'],
      properties: {
        approverId: { type: 'string', example: 'admin-123' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '청구 승인 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '청구 승인 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347a5f12' },
            status: { type: 'string', example: 'approved' },
            processedAt: { type: 'string', format: 'date-time', example: '2023-06-11T09:15:00Z' },
            processedBy: { type: 'string', example: 'admin-123' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '청구를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '청구를 찾을 수 없습니다' },
        error: { type: 'string', example: 'NotFound' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '승인 불가능한 상태',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '이미 처리된 청구입니다' },
        error: { type: 'string', example: 'BadRequest' }
      }
    }
  })
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @Put(':claimId/approve')
  async approveClaim(
    @Param('claimId') claimId: string,
    @Body('approverId') approverId: string
  ) {
    const result = await this.eventFacade.approveClaim(claimId, approverId);
    return {
      success: true,
      message: '청구 승인 성공',
      data: result
    };
  }

  /**
   * 청구 거부
   */
  @ApiOperation({ summary: '청구 거부', description: '보상 청구를 거부합니다.' })
  @ApiParam({ name: 'claimId', description: '청구 ID' })
  @ApiBody({
    description: '거부 정보',
    schema: {
      type: 'object',
      required: ['approverId', 'reason'],
      properties: {
        approverId: { type: 'string', example: 'admin-123' },
        reason: { type: 'string', example: '중복 지급 요청' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '청구 거부 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '청구 거부 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347a5f12' },
            status: { type: 'string', example: 'rejected' },
            reason: { type: 'string', example: '중복 지급 요청' },
            processedAt: { type: 'string', format: 'date-time', example: '2023-06-11T09:15:00Z' },
            processedBy: { type: 'string', example: 'admin-123' }
          }
        }
      }
    }
  })
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @Put(':claimId/reject')
  async rejectClaim(
    @Param('claimId') claimId: string,
    @Body() rejectData: any
  ) {
    const result = await this.eventFacade.rejectClaim(claimId, rejectData.approverId, rejectData.reason);
    return {
      success: true,
      message: '청구 거부 성공',
      data: result
    };
  }

  /**
   * 이벤트 자격 조건 평가
   */
  @ApiOperation({ summary: '이벤트 자격 평가', description: '사용자의 이벤트 참여 자격을 평가합니다.' })
  @ApiBody({
    description: '평가 정보',
    schema: {
      type: 'object',
      required: ['eventId'],
      properties: {
        eventId: { type: 'string', example: 'event-123' },
        actionData: { type: 'object', example: { loginCount: 5 } }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '평가 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '자격 평가 완료' },
        data: {
          type: 'object',
          properties: {
            eligible: { type: 'boolean', example: true },
            conditionType: { type: 'string', example: 'login' },
            currentProgress: { type: 'object', example: { currentDays: 5, requiredDays: 5 } }
          }
        }
      }
    }
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post('evaluate')
  async evaluateCondition(@Body() evaluateData: any, @Req() req: any) {
    const userId = req.user.userId;
    const result = await this.eventFacade.evaluateCondition(
      userId,
      evaluateData.eventId,
      evaluateData.actionData
    );
    return {
      success: true,
      message: '자격 평가 완료',
      data: { eligible: result }
    };
  }

  /**
   * 이벤트 참여 자격 확인
   */
  @ApiOperation({ summary: '이벤트 참여 자격 확인', description: '사용자가 이벤트 참여 자격을 충족하는지 확인합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({
    status: 200,
    description: '자격 확인 완료',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '자격 확인 완료' },
        data: {
          type: 'object',
          properties: {
            eligible: { type: 'boolean', example: true },
            missingRequirements: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('eligibility/:eventId')
  async checkEligibility(@Param('eventId') eventId: string, @Req() req: any) {
    const userId = req.user.userId;
    const result = await this.eventFacade.evaluateCondition(userId, eventId, {});

    return {
      success: true,
      message: '자격 확인 완료',
      data: { eligible: result }
    };
  }

  /**
   * 이미 청구한 보상인지 확인
   */
  @ApiOperation({ summary: '보상 청구 여부 확인', description: '이미 청구한 보상인지 확인합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({
    status: 200,
    description: '확인 완료',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '확인 완료' },
        data: {
          type: 'object',
          properties: {
            claimed: { type: 'boolean', example: false },
            claimInfo: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                status: { type: 'string' },
                claimedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('claimed/:eventId')
  async checkClaimed(@Param('eventId') eventId: string, @Req() req: any) {
    const userId = req.user.userId;
    const userClaims = await this.eventFacade.getUserClaims(userId);

    // 사용자의 청구 목록에서 해당 이벤트 ID와 관련된 보상 중 성공적으로 청구된 것이 있는지 확인
    const eventRewards = await this.eventFacade.getEventRewards(eventId);
    const rewardIds = eventRewards.map(reward => reward.id || reward._id);

    // 사용자가 이 이벤트의 보상을 청구했는지 확인
    const claimed = userClaims.some(claim =>
      rewardIds.includes(claim.rewardId) &&
      ['approved', 'pending'].includes(claim.status)
    );

    return {
      success: true,
      message: '확인 완료',
      data: {
        claimed,
        claimInfo: claimed ? userClaims.find(claim =>
          rewardIds.includes(claim.rewardId) &&
          ['approved', 'pending'].includes(claim.status)
        ) : null
      }
    };
  }
} 