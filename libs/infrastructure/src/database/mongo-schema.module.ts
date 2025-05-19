import { Module, DynamicModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { 
  User, UserSchema,
  EventRule, EventRuleSchema,
  UserEvent, UserEventSchema,
  RewardRedemption, RewardRedemptionSchema,
  AuditLog, AuditLogSchema
} from './schema';

/**
 * MongoDB 스키마 모듈
 * 필요한 스키마들을 등록하고 가져오는 공통 모듈
 */
@Module({})
export class MongoSchemaModule {
  /**
   * 기본 스키마 모듈 설정
   * @returns MongoDB 스키마 모듈
   */
  static forRoot(): DynamicModule {
    return {
      module: MongoSchemaModule,
      imports: [
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: EventRule.name, schema: EventRuleSchema },
          { name: UserEvent.name, schema: UserEventSchema },
          { name: RewardRedemption.name, schema: RewardRedemptionSchema },
          { name: AuditLog.name, schema: AuditLogSchema },
        ]),
      ],
      exports: [MongooseModule],
    };
  }

  /**
   * 사용자 관련 스키마만 등록
   * @returns 사용자 관련 스키마 모듈
   */
  static forUser(): DynamicModule {
    return {
      module: MongoSchemaModule,
      imports: [
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
        ]),
      ],
      exports: [MongooseModule],
    };
  }

  /**
   * 이벤트 관련 스키마만 등록
   * @returns 이벤트 관련 스키마 모듈
   */
  static forEvent(): DynamicModule {
    return {
      module: MongoSchemaModule,
      imports: [
        MongooseModule.forFeature([
          { name: EventRule.name, schema: EventRuleSchema },
          { name: UserEvent.name, schema: UserEventSchema },
          { name: RewardRedemption.name, schema: RewardRedemptionSchema },
        ]),
      ],
      exports: [MongooseModule],
    };
  }

  /**
   * 감사 로그 관련 스키마만 등록
   * @returns 감사 로그 관련 스키마 모듈
   */
  static forAudit(): DynamicModule {
    return {
      module: MongoSchemaModule,
      imports: [
        MongooseModule.forFeature([
          { name: AuditLog.name, schema: AuditLogSchema },
        ]),
      ],
      exports: [MongooseModule],
    };
  }
} 