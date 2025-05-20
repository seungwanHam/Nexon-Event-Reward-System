import { IsNotEmpty, IsString, IsEnum, IsNumber, IsBoolean, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RewardType } from '@app/libs/common/enum';

export class CreateRewardDto {
  @ApiProperty({ description: '이벤트 ID' })
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @ApiProperty({
    description: '보상 타입',
    enum: RewardType,
    example: RewardType.POINT
  })
  @IsEnum(RewardType)
  type: RewardType;

  @ApiProperty({
    description: '보상 수량',
    minimum: 1,
    example: 100
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: '보상 설명' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: '승인 필요 여부 (기본값: false)',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    description: '추가 메타데이터 (선택사항)',
    example: { itemCode: 'ITEM_123', expires: '7d' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateRewardDto {
  @ApiPropertyOptional({
    description: '보상 타입',
    enum: RewardType
  })
  @IsOptional()
  @IsEnum(RewardType)
  type?: RewardType;

  @ApiPropertyOptional({
    description: '보상 수량',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ description: '보상 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '승인 필요 여부' })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: '추가 메타데이터 (선택사항)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RewardResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty({ enum: RewardType })
  type: RewardType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  requiresApproval: boolean;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 