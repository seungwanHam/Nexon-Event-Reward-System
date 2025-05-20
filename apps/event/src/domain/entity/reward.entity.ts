import { RewardType } from '@app/libs/common/enum';

export class RewardEntity {
  readonly id: string;
  eventId: string;
  type: RewardType;
  amount: number;
  description: string;
  requiresApproval: boolean;
  metadata: Record<string, any>;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: Partial<RewardEntity>) {
    this.id = props.id;
    this.eventId = props.eventId;
    this.type = props.type;
    this.amount = props.amount || 1;
    this.description = props.description;
    this.requiresApproval = props.requiresApproval !== undefined ? props.requiresApproval : false;
    this.metadata = props.metadata || {};
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * 새로운 보상 엔티티를 생성합니다.
   */
  static create(props: Partial<RewardEntity>): RewardEntity {
    return new RewardEntity(props);
  }

  /**
   * 보상 정보를 업데이트합니다.
   */
  update(props: Partial<Omit<RewardEntity, 'id' | 'eventId' | 'createdAt'>>): void {
    if (props.type) this.type = props.type;
    if (props.amount !== undefined) this.amount = props.amount;
    if (props.description) this.description = props.description;
    if (props.requiresApproval !== undefined) this.requiresApproval = props.requiresApproval;
    if (props.metadata) this.metadata = { ...this.metadata, ...props.metadata };
    this.updatedAt = new Date();
  }

  /**
   * 승인이 필요한지 확인합니다.
   */
  needsApproval(): boolean {
    return this.requiresApproval;
  }

  /**
   * 메타데이터를 업데이트합니다.
   */
  updateMetadata(key: string, value: any): void {
    this.metadata = { ...this.metadata, [key]: value };
    this.updatedAt = new Date();
  }
} 