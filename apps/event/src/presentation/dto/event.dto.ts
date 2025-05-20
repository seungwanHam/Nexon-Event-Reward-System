import { IsNotEmpty, IsString, IsEnum, IsDateString, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConditionType, EventStatus } from '@app/libs/common/enum';

export class CreateEventDto {
  @ApiProperty({ description: '이벤트 이름' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '이벤트 설명' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ 
    description: '이벤트 조건 타입',
    enum: ConditionType,
    example: ConditionType.LOGIN
  })
  @IsEnum(ConditionType)
  conditionType: ConditionType;

  @ApiProperty({ 
    description: '조건 매개변수 (타입에 따라 다름)',
    example: {
      // LOGIN: 단순 로그인 이벤트
      requiredCount: 1,
      
      // CUSTOM: 회원가입 이벤트
      eventCode: 'SIGN_UP'
    }
  })
  @IsNotEmpty()
  @IsObject()
  conditionParams: Record<string, any>;

  @ApiProperty({ 
    description: '이벤트 시작일',
    example: '2023-01-01T00:00:00Z'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    description: '이벤트 종료일',
    example: '2023-12-31T23:59:59Z'
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ 
    description: '추가 메타데이터 (선택사항)',
    example: { category: 'seasonal', featured: true }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ description: '이벤트 이름' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '이벤트 설명' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ 
    description: '이벤트 조건 타입',
    enum: ConditionType
  })
  @IsOptional()
  @IsEnum(ConditionType)
  conditionType?: ConditionType;

  @ApiPropertyOptional({ 
    description: '조건 매개변수 (타입에 따라 다름)',
    example: {
      // LOGIN: 단순 로그인 이벤트
      requiredCount: 1,
      
      // CUSTOM: 회원가입 이벤트
      eventCode: 'SIGN_UP'
    }
  })
  @IsOptional()
  @IsObject()
  conditionParams?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: '이벤트 시작일',
    example: '2023-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: '이벤트 종료일',
    example: '2023-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: '추가 메타데이터 (선택사항)',
    example: { category: 'seasonal', featured: true }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ChangeEventStatusDto {
  @ApiProperty({ 
    description: '이벤트 상태',
    enum: EventStatus,
    example: EventStatus.ACTIVE
  })
  @IsEnum(EventStatus)
  status: EventStatus;
}

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ConditionType })
  conditionType: ConditionType;

  @ApiProperty()
  conditionParams: Record<string, any>;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty()
  metadata: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
} 