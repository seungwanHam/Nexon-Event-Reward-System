import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { EventFacade } from '../../application/facade';
import { 
  CreateRewardDto, 
  UpdateRewardDto, 
  RewardResponseDto 
} from '../dto';
import { JwtAuthGuard, RolesGuard, Public } from '@app/libs/auth';
import { Roles } from '@app/libs/auth';
import { UserRole } from '@app/libs/common/enum';

@ApiTags('보상')
@Controller('rewards')
// @UseGuards(JwtAuthGuard, RolesGuard)
@Public()
@ApiBearerAuth()
export class RewardController {
  constructor(private readonly eventFacade: EventFacade) {}

  @Post()
  @Public()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: '보상 생성', description: '새로운 보상을 생성합니다.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '보상이 생성됨', type: RewardResponseDto })
  async createReward(@Body() createRewardDto: CreateRewardDto): Promise<RewardResponseDto> {
    const { eventId, type, amount, description, requiresApproval, metadata } = createRewardDto;
    
    const reward = await this.eventFacade.createReward(
      eventId,
      type,
      amount,
      description,
      requiresApproval,
      metadata
    );

    return reward;
  }

  @Get()
  @Public()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.AUDITOR)
  @ApiOperation({ summary: '보상 목록 조회', description: '모든 보상 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '보상 목록 반환', type: [RewardResponseDto] })
  async getAllRewards(): Promise<RewardResponseDto[]> {
    return this.eventFacade.getAllRewards();
  }

  @Get('event/:eventId')
  @Public()
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiOperation({ summary: '이벤트별 보상 조회', description: '특정 이벤트에 연결된 보상을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '보상 목록 반환', type: [RewardResponseDto] })
  async getRewardsByEventId(@Param('eventId') eventId: string): Promise<RewardResponseDto[]> {
    return this.eventFacade.getRewardsByEventId(eventId);
  }

  @Get(':id')
  @Public()
  @ApiParam({ name: 'id', description: '보상 ID' })
  @ApiOperation({ summary: '보상 조회', description: '특정 보상을 ID로 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '보상 정보 반환', type: RewardResponseDto })
  async getRewardById(@Param('id') id: string): Promise<RewardResponseDto> {
    return this.eventFacade.getRewardById(id);
  }

  @Put(':id')
  @Public()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiParam({ name: 'id', description: '보상 ID' })
  @ApiOperation({ summary: '보상 수정', description: '특정 보상 정보를 수정합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '수정된 보상 정보 반환', type: RewardResponseDto })
  async updateReward(
    @Param('id') id: string,
    @Body() updateRewardDto: UpdateRewardDto
  ): Promise<RewardResponseDto> {
    return this.eventFacade.updateReward(id, updateRewardDto);
  }

  @Delete(':id')
  @Public()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: '보상 ID' })
  @ApiOperation({ summary: '보상 삭제', description: '특정 보상을 삭제합니다.' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '보상이 성공적으로 삭제됨' })
  async deleteReward(@Param('id') id: string): Promise<void> {
    await this.eventFacade.deleteReward(id);
  }
} 