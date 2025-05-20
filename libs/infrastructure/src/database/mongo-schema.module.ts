import { Module, DynamicModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User, UserSchema,
  AuditLog, AuditLogSchema,
  EventRule, EventRuleSchema,
  UserEvent, UserEventSchema,
  RewardRedemption, RewardRedemptionSchema,
  Event, EventSchema,
  Reward, RewardSchema,
  RewardClaim, RewardClaimSchema
} from './schema';

/**
 * MongoDB 스키마 모듈
 * 
 * 애플리케이션에서 사용되는 MongoDB 스키마들을 등록하고 관리하는 모듈입니다.
 * 여러 서비스에서 필요한 스키마를 도메인별로 분리하여 사용할 수 있도록
 * 정적 메서드들을 제공합니다.
 * 
 * 이 모듈은 다음과 같은 기능을 제공합니다:
 * - 모든 스키마를 한번에 등록 (forRoot)
 * - 사용자 관련 스키마만 등록 (forUser)
 * - 이벤트 관련 스키마만 등록 (forEvent)
 * - 감사 로그 관련 스키마만 등록 (forAudit)
 */
@Module({})
export class MongoSchemaModule {
  /**
   * 모든 MongoDB 스키마를 등록합니다.
   * 
   * 애플리케이션의 전체 도메인 스키마를 한번에 등록할 때 사용합니다.
   * 주로 단일 마이크로서비스나 모놀리식 애플리케이션에서 사용됩니다.
   * 
   * @returns MongoDB 스키마 동적 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     MongooseModule.forRoot('mongodb://localhost:27017/nexon-event'),
   *     MongoSchemaModule.forRoot(),
   *   ]
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(): DynamicModule {
    return {
      module: MongoSchemaModule,
      imports: [
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: AuditLog.name, schema: AuditLogSchema },
          { name: EventRule.name, schema: EventRuleSchema },
          { name: UserEvent.name, schema: UserEventSchema },
          { name: RewardRedemption.name, schema: RewardRedemptionSchema },
          { name: Event.name, schema: EventSchema },
          { name: Reward.name, schema: RewardSchema },
          { name: RewardClaim.name, schema: RewardClaimSchema },
        ]),
      ],
      exports: [MongooseModule],
    };
  }

  /**
   * 사용자 관련 스키마만 등록합니다.
   * 
   * 사용자 서비스나 인증 서비스와 같이 사용자 데이터만 필요한
   * 마이크로서비스에서 사용됩니다.
   * 
   * @returns 사용자 관련 스키마 동적 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     MongooseModule.forRoot('mongodb://localhost:27017/nexon-users'),
   *     MongoSchemaModule.forUser(),
   *   ]
   * })
   * export class UserModule {}
   * ```
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
   * 이벤트 관련 스키마만 등록합니다.
   * 
   * 이벤트 서비스나 보상 서비스와 같이 이벤트/보상 데이터가 필요한
   * 마이크로서비스에서 사용됩니다.
   * 
   * @returns 이벤트 관련 스키마 동적 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     MongooseModule.forRoot('mongodb://localhost:27017/nexon-events'),
   *     MongoSchemaModule.forEvent(),
   *   ]
   * })
   * export class EventModule {}
   * ```
   */
  static forEvent(): DynamicModule {
    return {
      module: MongoSchemaModule,
      imports: [
        MongooseModule.forFeature([
          { name: Event.name, schema: EventSchema },
          { name: Reward.name, schema: RewardSchema },
          { name: RewardClaim.name, schema: RewardClaimSchema },
          // 레거시 스키마 지원
          { name: EventRule.name, schema: EventRuleSchema },
          { name: UserEvent.name, schema: UserEventSchema },
          { name: RewardRedemption.name, schema: RewardRedemptionSchema },
        ]),
      ],
      exports: [MongooseModule],
    };
  }

  /**
   * 감사 로그 관련 스키마만 등록합니다.
   * 
   * 감사 로그 서비스나 관리 서비스와 같이 감사 데이터가 필요한
   * 마이크로서비스에서 사용됩니다.
   * 
   * @returns 감사 로그 관련 스키마 동적 모듈
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     MongooseModule.forRoot('mongodb://localhost:27017/nexon-audit'),
   *     MongoSchemaModule.forAudit(),
   *   ]
   * })
   * export class AuditModule {}
   * ```
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