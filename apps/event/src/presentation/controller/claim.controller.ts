import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  Query,
  BadRequestException
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { EventFacade } from '../../application/facade';
import {
  CreateClaimDto,
  ApproveClaimDto,
  RejectClaimDto,
  UserActionDto,
  ClaimResponseDto
} from '../dto';
import { Public } from '../../../../../libs/auth/src';
import { ClaimStatus } from '@app/libs/common/enum';

@ApiTags('보상 청구')
@Controller('claims')
@Public()
export class ClaimController {
  constructor(private readonly eventFacade: EventFacade) { }

  @Post()
  @ApiOperation({ summary: '보상 청구 생성', description: '사용자가 보상을 청구합니다.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '보상 청구가 생성됨', type: ClaimResponseDto })
  async createClaim(@Body() createClaimDto: CreateClaimDto): Promise<ClaimResponseDto> {
    const { userId, eventId, rewardId } = createClaimDto;
    const claim = await this.eventFacade.createClaim(userId, eventId, rewardId);
    return claim;
  }

  @Get('user')
  @ApiOperation({ summary: '사용자 청구 목록 조회', description: '특정 사용자의 보상 청구 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '청구 목록 반환', type: [ClaimResponseDto] })
  async getUserClaims(@Query('userId') userId: string): Promise<ClaimResponseDto[]> {
    return this.eventFacade.getUserClaims(userId);
  }

  @Get('event/:eventId')
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiOperation({ summary: '이벤트별 청구 조회', description: '특정 이벤트의 모든 보상 청구를 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '청구 목록 반환', type: [ClaimResponseDto] })
  async getEventClaims(@Param('eventId') eventId: string): Promise<ClaimResponseDto[]> {
    return this.eventFacade.getEventClaims(eventId);
  }

  @Get('pending')
  @ApiOperation({ summary: '승인 대기 청구 조회', description: '승인 대기 중인 보상 청구 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '청구 목록 반환', type: [ClaimResponseDto] })
  async getPendingClaims(): Promise<ClaimResponseDto[]> {
    return this.eventFacade.getPendingClaims();
  }

  @Get()
  @ApiOperation({ summary: '모든 청구 조회', description: '모든 보상 청구 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '청구 목록 반환', type: [ClaimResponseDto] })
  async getAllClaims(): Promise<ClaimResponseDto[]> {
    return this.eventFacade.getAllClaims();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: '청구 ID' })
  @ApiOperation({ summary: '청구 조회', description: '특정 보상 청구를 ID로 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '청구 정보 반환', type: ClaimResponseDto })
  async getClaimById(@Param('id') id: string): Promise<ClaimResponseDto> {
    return this.eventFacade.getClaimById(id);
  }

  @Put(':id/approve')
  @ApiParam({ name: 'id', description: '청구 ID' })
  @ApiOperation({ summary: '청구 승인', description: '보상 청구를 승인합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '승인된 청구 정보 반환', type: ClaimResponseDto })
  async approveClaim(
    @Param('id') id: string,
    @Body() approveDto: ApproveClaimDto
  ): Promise<ClaimResponseDto> {
    return this.eventFacade.approveClaim(id, approveDto.approverId);
  }

  @Put(':id/reject')
  @ApiParam({ name: 'id', description: '청구 ID' })
  @ApiOperation({ summary: '청구 거부', description: '보상 청구를 거부합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '거부된 청구 정보 반환', type: ClaimResponseDto })
  async rejectClaim(
    @Param('id') id: string,
    @Body() rejectDto: RejectClaimDto
  ): Promise<ClaimResponseDto> {
    return this.eventFacade.rejectClaim(id, rejectDto.approverId, rejectDto.reason);
  }

  @Post('evaluate')
  @ApiOperation({ summary: '조건 평가', description: '사용자 행동이 이벤트 조건을 충족하는지 평가합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '평가 결과 반환', schema: { type: 'object', properties: { eligible: { type: 'boolean' } } } })
  async evaluateCondition(
    @Body() userActionDto: UserActionDto
  ): Promise<{ eligible: boolean; details?: Record<string, any> }> {
    const { userId, eventId, actionData } = userActionDto;

    // userId 검증
    if (!userId) {
      throw new BadRequestException('사용자 ID가 필요합니다.');
    }

    try {
      const eligible = await this.eventFacade.evaluateUserAction(userId, eventId, actionData);
      return { 
        eligible,
        details: eligible ? 
          { message: '조건을 충족합니다.' } : 
          { message: '조건을 충족하지 않습니다.' }
      };
    } catch (error) {
      return { 
        eligible: false, 
        details: { 
          message: error.message || '조건 평가 중 오류가 발생했습니다.', 
          error: error.name 
        } 
      };
    }
  }

  @Get('eligible/:eventId')
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiOperation({ summary: '자격 확인', description: '사용자가 특정 이벤트의 보상을 받을 자격이 있는지 확인합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '자격 여부 반환', schema: { type: 'object', properties: { eligible: { type: 'boolean' } } } })
  async checkEligibility(
    @Param('eventId') eventId: string,
    @Query('userId') userId: string
  ): Promise<{ eligible: boolean }> {
    const eligible = await this.eventFacade.isEligibleForReward(userId, eventId);
    return { eligible };
  }

  @Get('claimed/:eventId')
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiOperation({ summary: '청구 여부 확인', description: '사용자가 특정 이벤트의 보상을 이미 청구했는지 확인합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '청구 여부 반환', schema: { type: 'object', properties: { claimed: { type: 'boolean' } } } })
  async checkClaimed(
    @Param('eventId') eventId: string,
    @Query('userId') userId: string
  ): Promise<{ claimed: boolean }> {
    const claimed = await this.eventFacade.hasClaimedReward(userId, eventId);
    return { claimed };
  }
} 