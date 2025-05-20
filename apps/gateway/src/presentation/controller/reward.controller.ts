import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, HttpStatus, Req, HttpCode } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Public, Roles } from '../../../../../libs/auth/src';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@app/libs/common/enum';
import { EventFacade } from '@app/gateway/application/facade';

/**
 * 보상 관련 컨트롤러
 * 
 * 보상 관리 API 엔드포인트를 제공합니다.
 */
@ApiTags('보상 API')
@Controller('rewards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RewardController {
  constructor(private readonly eventFacade: EventFacade) { }

  /**
   * 모든 보상 목록 조회
   */
  @ApiOperation({ summary: '모든 보상 목록 조회', description: '시스템의 모든 보상 목록을 조회합니다.' })
  @ApiResponse({
    status: 200,
    description: '보상 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '보상 목록 조회 성공' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '60d3b41667948b2d347e12c5' },
              eventId: { type: 'string', example: '60d3b41667948b2d347e12b8' },
              name: { type: 'string', example: '골드 100개' },
              type: { type: 'string', example: 'currency', enum: ['item', 'currency', 'point', 'coupon'] },
              amount: { type: 'integer', example: 100 },
              description: { type: 'string', example: '이벤트 참여 보상으로 제공되는 게임 내 골드' },
              requiresApproval: { type: 'boolean', example: false },
              createdAt: { type: 'string', format: 'date-time', example: '2023-04-15T12:00:00Z' }
            }
          }
        }
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
        message: { type: 'string', example: '보상 목록 조회 권한이 없습니다' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.AUDITOR)
  @Get()
  async getAllRewards() {
    const result = await this.eventFacade.getAllRewards();
    return {
      success: true,
      message: '보상 목록 조회 성공',
      data: result
    };
  }

  /**
   * 이벤트의 보상 목록 조회
   */
  @ApiOperation({ summary: '이벤트 보상 목록 조회', description: '특정 이벤트의 보상 목록을 조회합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '이벤트 보상 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '이벤트 보상 목록 조회 성공' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '60d3b41667948b2d347e12c5' },
              name: { type: 'string', example: '특별 아이템' },
              type: { type: 'string', example: 'item', enum: ['item', 'currency', 'point', 'coupon'] },
              amount: { type: 'integer', example: 1 },
              description: { type: 'string', example: '특별 이벤트 전용 아이템' },
              requiresApproval: { type: 'boolean', example: true }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '이벤트를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '이벤트를 찾을 수 없습니다' },
        error: { type: 'string', example: 'NotFound' }
      }
    }
  })
  @Public()
  @Get('event/:eventId')
  async getEventRewards(@Param('eventId') eventId: string) {
    const result = await this.eventFacade.getEventRewards(eventId);

    return {
      success: true,
      message: '이벤트 보상 목록 조회 성공',
      data: result
    };
  }

  /**
   * 특정 보상 조회
   */
  @ApiOperation({ summary: '보상 조회', description: '특정 보상의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'rewardId', description: '보상 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '보상 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '보상 조회 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347e12c5' },
            eventId: { type: 'string', example: '60d3b41667948b2d347e12b8' },
            name: { type: 'string', example: '골드 100개' },
            type: { type: 'string', example: 'currency' },
            amount: { type: 'integer', example: 100 },
            description: { type: 'string', example: '이벤트 참여 보상으로 제공되는 게임 내 골드' },
            requiresApproval: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time', example: '2023-04-15T12:00:00Z' },
            metadata: { 
              type: 'object',
              example: { 
                iconUrl: 'https://example.com/gold-icon.png',
                expiryDays: 30
              } 
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '보상을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '보상을 찾을 수 없습니다' },
        error: { type: 'string', example: 'NotFound' }
      }
    }
  })
  @Public()
  @Get(':rewardId')
  async getRewardById(@Param('rewardId') rewardId: string) {
    const result = await this.eventFacade.getRewardById(rewardId);
    return {
      success: true,
      message: '보상 조회 성공',
      data: result
    };
  }

  /**
   * 보상 생성
   */
  @ApiOperation({ summary: '보상 생성', description: '새로운 보상을 생성합니다.' })
  @ApiBody({
    description: '보상 생성 정보',
    schema: {
      type: 'object',
      required: ['eventId', 'type', 'amount', 'description'],
      properties: {
        eventId: { type: 'string' },
        name: { type: 'string', example: '골드 100개' },
        type: { type: 'string', enum: ['item', 'currency', 'point', 'coupon'], example: 'currency' },
        amount: { type: 'integer', minimum: 1, example: 100 },
        description: { type: 'string', example: '이벤트 참여 보상으로 제공되는 게임 내 골드' },
        requiresApproval: { type: 'boolean', default: false, example: false },
        metadata: { type: 'object', example: { iconUrl: 'https://example.com/gold-icon.png' } }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: '보상 생성 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '보상 생성 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347e12c5' },
            name: { type: 'string', example: '골드 100개' },
            eventId: { type: 'string', example: '60d3b41667948b2d347e12b8' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청 데이터',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '유효하지 않은 보상 데이터' },
        error: { type: 'string', example: 'BadRequest' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '이벤트를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '연결할 이벤트를 찾을 수 없습니다' },
        error: { type: 'string', example: 'NotFound' }
      }
    }
  })
  @Roles(UserRole.ADMIN)
  @Post()
  async createReward(@Body() rewardData: any) {
    const result = await this.eventFacade.createReward(rewardData);

    return {
      success: true,
      message: '보상 생성 성공',
      data: result
    };
  }

  /**
   * 보상 수정
   */
  @ApiOperation({ summary: '보상 수정', description: '기존 보상 정보를 수정합니다.' })
  @ApiParam({ name: 'rewardId', description: '보상 ID' })
  @ApiBody({
    description: '보상 수정 정보',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '수정된 보상 이름' },
        amount: { type: 'integer', example: 200 },
        description: { type: 'string', example: '수정된 보상 설명' },
        requiresApproval: { type: 'boolean', example: true },
        metadata: { type: 'object', example: { iconUrl: 'https://example.com/new-icon.png' } }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '보상 수정 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '보상 수정 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347e12c5' },
            name: { type: 'string', example: '수정된 보상 이름' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '보상을 찾을 수 없음' })
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @Put(':rewardId')
  async updateReward(
    @Param('rewardId') rewardId: string,
    @Body() rewardData: any
  ) {
    const result = await this.eventFacade.updateReward(rewardId, rewardData);
    return {
      success: true,
      message: '보상 수정 성공',
      data: result
    };
  }

  /**
   * 보상 삭제
   */
  @ApiOperation({ summary: '보상 삭제', description: '보상을 삭제합니다.' })
  @ApiParam({ name: 'rewardId', description: '보상 ID' })
  @ApiResponse({ 
    status: 204, 
    description: '보상 삭제 성공'
  })
  @ApiResponse({ 
    status: 404, 
    description: '보상을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '보상을 찾을 수 없습니다' },
        error: { type: 'string', example: 'NotFound' }
      }
    }
  })
  @Roles(UserRole.ADMIN)
  @Delete(':rewardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReward(@Param('rewardId') rewardId: string) {
    await this.eventFacade.deleteReward(rewardId);
  }

  /**
   * 보상 청구
   */
  @ApiOperation({ summary: '보상 청구', description: '이벤트의 보상을 청구합니다.' })
  @ApiParam({ name: 'rewardId', description: '보상 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '보상 청구 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '보상 청구 신청이 완료되었습니다' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347a5f12' },
            userId: { type: 'string', example: 'user-123' },
            rewardId: { type: 'string', example: '60d3b41667948b2d347e12c5' },
            status: { type: 'string', example: 'pending' },
            claimedAt: { type: 'string', format: 'date-time', example: '2023-06-10T15:30:00Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '보상 청구 실패',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '이미 청구한 보상입니다' },
        error: { type: 'string', example: 'BadRequest' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '보상을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '보상을 찾을 수 없습니다' },
        error: { type: 'string', example: 'NotFound' }
      }
    }
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post(':rewardId/claim')
  async claimReward(
    @Param('rewardId') rewardId: string,
    @Req() req: any
  ) {
    const userId = req.user.userId;
    const result = await this.eventFacade.claimReward(rewardId, userId);

    return {
      success: true,
      message: '보상 청구 신청이 완료되었습니다',
      data: result
    };
  }
} 