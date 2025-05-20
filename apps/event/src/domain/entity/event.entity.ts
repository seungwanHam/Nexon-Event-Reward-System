import { ConditionType, EventStatus } from '@app/libs/common/enum';
import { InvalidStatusTransitionException, ValidationException } from '@app/libs/common/exception';

export class EventEntity {
  readonly id: string;
  name: string;
  description: string;
  conditionType: ConditionType;
  conditionParams: Record<string, any>; // 조건별 필요 파라미터
  startDate: Date;
  endDate: Date;
  status: EventStatus;
  metadata: Record<string, any>;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: Partial<EventEntity>) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.conditionType = props.conditionType;
    this.conditionParams = props.conditionParams || {};
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.status = props.status || EventStatus.INACTIVE;
    this.metadata = props.metadata || {};
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * 새로운 이벤트 엔티티를 생성합니다.
   * @throws {ValidationException} 유효성 검증 실패 시
   */
  static create(props: Partial<EventEntity>): EventEntity {
    const event = new EventEntity(props);
    event.validate();
    return event;
  }

  /**
   * 이벤트의 유효성을 검증합니다.
   * @throws {ValidationException} 유효성 검증 실패 시
   */
  private validate(): void {
    // 필수 필드 확인
    if (!this.name) {
      throw new ValidationException('이벤트 이름은 필수입니다.');
    }

    if (!this.description) {
      throw new ValidationException('이벤트 설명은 필수입니다.');
    }

    if (!this.conditionType) {
      throw new ValidationException('이벤트 조건 유형은 필수입니다.');
    }

    if (!this.startDate || !this.endDate) {
      throw new ValidationException('이벤트 시작일과 종료일은 필수입니다.');
    }

    // 종료일이 시작일보다 늦은지 확인
    if (this.startDate > this.endDate) {
      throw new ValidationException('이벤트 종료일은 시작일보다 늦어야 합니다.');
    }

    // 조건 파라미터 유효성 검증 
    this.validateConditionParams();
  }

  /**
   * 이벤트 조건에 따른 파라미터 유효성을 검증합니다.
   * @throws {ValidationException} 유효성 검증 실패 시
   */
  private validateConditionParams(): void {
    switch (this.conditionType) {
      case ConditionType.LOGIN:
        // 단순 로그인 이벤트는 로그인 횟수(requiredCount)가 필요
        if (!this.conditionParams.requiredCount) {
          throw new ValidationException('로그인 이벤트는 필요 로그인 횟수(requiredCount)가 필요합니다.');
        }
        break;

      case ConditionType.CUSTOM:
        // 커스텀 이벤트는 이벤트 코드(eventCode)가 필요
        if (!this.conditionParams.eventCode) {
          throw new ValidationException('커스텀 이벤트는 이벤트 코드(eventCode)가 필요합니다.');
        }
        break;

      default:
        throw new ValidationException(`지원하지 않는 조건 타입입니다: ${this.conditionType}. 현재는 LOGIN과 회원가입(CUSTOM) 이벤트만 지원합니다.`);
    }
  }

  /**
   * 이벤트 상태를 변경합니다.
   * @throws {InvalidStatusTransitionException} 유효하지 않은 상태 전이인 경우
   */
  changeStatus(newStatus: EventStatus): void {
    // 상태 전이 규칙 검증
    if (!this.isValidStatusTransition(newStatus)) {
      throw new InvalidStatusTransitionException('잘못된 상태 전이입니다.');
    }
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  /**
   * 이벤트 정보를 업데이트합니다.
   * @throws {ValidationException} 유효성 검증 실패 시
   */
  update(props: Partial<Omit<EventEntity, 'id' | 'createdAt'>>): void {
    if (props.name) this.name = props.name;
    if (props.description) this.description = props.description;
    if (props.conditionType) this.conditionType = props.conditionType;
    if (props.conditionParams) this.conditionParams = { ...this.conditionParams, ...props.conditionParams };
    if (props.startDate) this.startDate = props.startDate;
    if (props.endDate) this.endDate = props.endDate;
    if (props.metadata) this.metadata = { ...this.metadata, ...props.metadata };
    this.updatedAt = new Date();

    // 업데이트 후 유효성 검증
    this.validate();
  }

  /**
   * 이벤트가 활성 상태인지 확인합니다.
   */
  isActive(): boolean {
    console.log(`[DEBUG] 이벤트 ${this.id} 상태 확인: ${this.status}, 예상 ACTIVE: ${EventStatus.ACTIVE}, 일치 여부: ${this.status === EventStatus.ACTIVE}`);
    return this.status === EventStatus.ACTIVE;
  }

  /**
   * 이벤트 기간이 유효한지 확인합니다.
   */
  isWithinPeriod(date: Date = new Date()): boolean {
    // 날짜가 string으로 저장된 경우 Date 객체로 변환
    const startDate = this.startDate instanceof Date ? this.startDate : new Date(this.startDate);
    const endDate = this.endDate instanceof Date ? this.endDate : new Date(this.endDate);

    console.log(`[DEBUG] 이벤트 ${this.id} 기간 확인: 
      현재: ${date.toISOString()}, 
      시작일: ${startDate.toISOString()}, 
      종료일: ${endDate.toISOString()}, 
      유효기간: ${date >= startDate && date <= endDate}`);

    return date >= startDate && date <= endDate;
  }

  /**
   * 이벤트가 현재 유효한지 확인합니다 (활성 상태이고 기간 내).
   */
  isValid(date: Date = new Date()): boolean {
    const isActiveStatus = this.isActive();
    const isWithinPeriodStatus = this.isWithinPeriod(date);

    console.log(`[DEBUG] 이벤트 ${this.id} 유효성 검사: 활성상태=${isActiveStatus}, 유효기간=${isWithinPeriodStatus}`);

    return isActiveStatus && isWithinPeriodStatus;
  }

  /**
   * 이벤트 상태를 자동으로 업데이트합니다.
   */
  autoUpdateStatus(date: Date = new Date()): void {
    // 종료일이 지났으면 만료 상태로 변경
    if (date > this.endDate && this.status !== EventStatus.EXPIRED) {
      this.status = EventStatus.EXPIRED;
      this.updatedAt = new Date();
    }
  }

  /**
   * 메타데이터를 업데이트합니다.
   */
  updateMetadata(key: string, value: any): void {
    this.metadata = { ...this.metadata, [key]: value };
    this.updatedAt = new Date();
  }

  private isValidStatusTransition(newStatus: EventStatus): boolean {
    // 상태 전이 규칙 정의
    const validTransitions = {
      [EventStatus.INACTIVE]: [EventStatus.ACTIVE, EventStatus.EXPIRED],
      [EventStatus.ACTIVE]: [EventStatus.INACTIVE, EventStatus.EXPIRED],
      [EventStatus.EXPIRED]: [EventStatus.INACTIVE],
    };

    return validTransitions[this.status]?.includes(newStatus) ?? false;
  }
} 