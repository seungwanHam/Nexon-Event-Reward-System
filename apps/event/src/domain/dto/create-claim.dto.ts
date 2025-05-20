import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClaimDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 'user123'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: '보상 ID',
    example: 'reward456'
  })
  @IsString()
  @IsNotEmpty()
  rewardId: string;

  @ApiProperty({
    description: '이벤트 ID (선택 사항)',
    example: 'event789',
    required: false
  })
  @IsString()
  @IsOptional()
  eventId?: string;
} 