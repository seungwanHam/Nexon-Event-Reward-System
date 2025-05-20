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
  @ApiResponse({ status: 200, description: '보상 목록 조회 성공' })
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
  @ApiResponse({ status: 200, description: '이벤트 보상 목록 조회 성공' })
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
  @ApiResponse({ status: 200, description: '보상 조회 성공' })
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
        type: { type: 'string', enum: ['item', 'currency', 'point', 'coupon'] },
        amount: { type: 'integer', minimum: 1 },
        description: { type: 'string' },
        requiresApproval: { type: 'boolean', default: false },
        metadata: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 201, description: '보상 생성 성공' })
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
  @ApiResponse({ status: 200, description: '보상 수정 성공' })
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
  @ApiResponse({ status: 204, description: '보상 삭제 성공' })
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
  @ApiResponse({ status: 200, description: '보상 청구 성공' })
  @ApiResponse({ status: 400, description: '보상 청구 실패' })
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