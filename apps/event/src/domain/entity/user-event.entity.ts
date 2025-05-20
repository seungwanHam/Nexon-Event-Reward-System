/**
 * 사용자 이벤트 엔티티
 * 
 * 사용자 행동(로그인, 회원가입 등)에 대한 이벤트를 표현하는 도메인 모델입니다.
 */
export class UserEventEntity {
  readonly id: string;
  readonly userId: string;
  readonly eventType: string;
  readonly eventKey: string;
  readonly occurredAt: Date;
  readonly metadata: Record<string, any>;
  readonly idempotencyKey?: string;
  readonly createdAt: Date;

  private constructor(props: Partial<UserEventEntity>) {
    this.id = props.id;
    this.userId = props.userId;
    this.eventType = props.eventType;
    this.eventKey = props.eventKey;
    this.occurredAt = props.occurredAt || new Date();
    this.metadata = props.metadata || {};
    this.idempotencyKey = props.idempotencyKey;
    this.createdAt = props.createdAt || new Date();
  }

  /**
   * 사용자 이벤트 생성 팩토리 메서드
   * 
   * 새로운 사용자 이벤트 엔티티를 생성합니다.
   * 
   * @param props - 이벤트 속성
   * @returns 생성된, 불변 사용자 이벤트 엔티티
   */
  static create(props: {
    id?: string;
    userId: string;
    eventType: string;
    eventKey: string;
    occurredAt?: Date | string;
    metadata?: Record<string, any>;
    idempotencyKey?: string;
    createdAt?: Date;
  }): UserEventEntity {
    // 발생 시간이 문자열로 들어오면 Date 객체로 변환
    const occurredAt = typeof props.occurredAt === 'string'
      ? new Date(props.occurredAt)
      : props.occurredAt;

    return new UserEventEntity({
      ...props,
      occurredAt,
    });
  }
} 