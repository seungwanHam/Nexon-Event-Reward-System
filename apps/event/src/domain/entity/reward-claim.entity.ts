import { ClaimStatus } from '@app/libs/common/enum';
import { InvalidStatusTransitionException } from '@app/libs/common/exception';

export class RewardClaimEntity {
  readonly id: string;
  userId: string;
  eventId: string;
  rewardId: string;
  status: ClaimStatus;
  requestDate: Date;
  processDate?: Date;
  approverId?: string;
  rejectionReason?: string;
  metadata: Record<string, any>;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: Partial<RewardClaimEntity>) {
    this.id = props.id;
    this.userId = props.userId;
    this.eventId = props.eventId;
    this.rewardId = props.rewardId;
    this.status = props.status || ClaimStatus.PENDING;
    this.requestDate = props.requestDate || new Date();
    this.processDate = props.processDate;
    this.approverId = props.approverId;
    this.rejectionReason = props.rejectionReason;
    this.metadata = props.metadata || {};
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * 새로운 보상 청구 엔티티를 생성합니다.
   */
  static create(props: Partial<RewardClaimEntity>): RewardClaimEntity {
    return new RewardClaimEntity(props);
  }

  /**
   * 보상 청구를 승인합니다.
   */
  approve(approverId: string): void {
    if (this.status !== ClaimStatus.PENDING) {
      throw new InvalidStatusTransitionException('승인 대기 상태의 청구만 승인할 수 있습니다.');
    }
    this.status = ClaimStatus.APPROVED;
    this.approverId = approverId;
    this.processDate = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 보상 청구를 거부합니다.
   */
  reject(approverId: string, reason: string): void {
    if (this.status !== ClaimStatus.PENDING) {
      throw new InvalidStatusTransitionException('승인 대기 상태의 청구만 거부할 수 있습니다.');
    }
    this.status = ClaimStatus.REJECTED;
    this.approverId = approverId;
    this.rejectionReason = reason;
    this.processDate = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 보상 지급을 완료합니다.
   */
  complete(): void {
    if (this.status !== ClaimStatus.APPROVED) {
      throw new InvalidStatusTransitionException('승인된 청구만 완료할 수 있습니다.');
    }
    this.status = ClaimStatus.COMPLETED;
    this.processDate = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 보상 청구 상태를 확인합니다.
   */
  isPending(): boolean {
    return this.status === ClaimStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === ClaimStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === ClaimStatus.REJECTED;
  }

  isCompleted(): boolean {
    return this.status === ClaimStatus.COMPLETED;
  }

  /**
   * 메타데이터를 업데이트합니다.
   */
  updateMetadata(key: string, value: any): void {
    this.metadata = { ...this.metadata, [key]: value };
    this.updatedAt = new Date();
  }
} 