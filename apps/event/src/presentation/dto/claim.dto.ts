import { IsNotEmpty, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClaimStatus } from '@app/libs/common/enum';

export class CreateClaimDto {
  @ApiProperty({ description: '사용자 ID' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: '이벤트 ID' })
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @ApiProperty({ description: '보상 ID' })
  @IsNotEmpty()
  @IsString()
  rewardId: string;
}

export class ApproveClaimDto {
  @ApiProperty({ description: '승인자 ID' })
  @IsNotEmpty()
  @IsString()
  approverId: string;
}

export class RejectClaimDto {
  @ApiProperty({ description: '승인자 ID' })
  @IsNotEmpty()
  @IsString()
  approverId: string;

  @ApiProperty({ description: '거부 이유' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class UserActionDto {
  @ApiProperty({ description: '이벤트 ID' })
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @ApiProperty({ description: '사용자 ID' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: '사용자 행동 데이터 - 이벤트 타입에 따라 다른 데이터 필요',
    example: {
      // 단순 로그인 이벤트
      loginCount: 1,

      // 커스텀 이벤트 (회원가입)
      eventCode: 'SIGN_UP',
      customEventPassed: true
    }
  })
  @IsNotEmpty()
  @IsObject()
  actionData: Record<string, any>;
}

export class ClaimResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  rewardId: string;

  @ApiProperty({ enum: ClaimStatus })
  status: ClaimStatus;

  @ApiProperty()
  requestDate: Date;

  @ApiPropertyOptional()
  processDate?: Date;

  @ApiPropertyOptional()
  approverId?: string;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 