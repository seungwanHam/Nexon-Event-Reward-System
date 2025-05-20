import { RewardClaimEntity } from '../reward-claim.entity';
import { ClaimStatus } from '@app/libs/common/enum';
import { InvalidStatusTransitionException } from '@app/libs/common/exception';

describe('보상 청구 엔티티 테스트', () => {
  describe('보상 청구 생성', () => {
    it('유효한 데이터로 보상 청구를 생성해야 한다', () => {
      // given
      const claimData = {
        id: `claim-${Date.now()}`,
        userId: 'user-123',
        eventId: 'event-123',
        rewardId: 'reward-123',
        status: ClaimStatus.PENDING,
        requestDate: new Date(),
        metadata: { source: 'test' }
      };

      // when
      const claim = RewardClaimEntity.create(claimData);

      // then
      expect(claim).toBeDefined();
      expect(claim.id).toBe(claimData.id);
      expect(claim.userId).toBe('user-123');
      expect(claim.eventId).toBe('event-123');
      expect(claim.rewardId).toBe('reward-123');
      expect(claim.status).toBe(ClaimStatus.PENDING);
      expect(claim.metadata.source).toBe('test');
    });

    it('기본값이 올바르게 적용되어야 한다', () => {
      // given
      const claimData = {
        id: `claim-${Date.now()}`,
        userId: 'user-123',
        eventId: 'event-123',
        rewardId: 'reward-123'
      };

      // when
      const claim = RewardClaimEntity.create(claimData);

      // then
      expect(claim.status).toBe(ClaimStatus.PENDING); // 기본값 PENDING
      expect(claim.requestDate).toBeInstanceOf(Date);
      expect(claim.metadata).toEqual({}); // 기본값 빈 객체
      expect(claim.createdAt).toBeInstanceOf(Date);
      expect(claim.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('보상 청구 상태 관리 메서드 테스트', () => {
    let claim: RewardClaimEntity;

    beforeEach(() => {
      // 각 테스트 전에 기본 보상 청구 엔티티 생성
      claim = RewardClaimEntity.create({
        id: `claim-${Date.now()}`,
        userId: 'user-123',
        eventId: 'event-123',
        rewardId: 'reward-123',
        status: ClaimStatus.PENDING
      });
    });

    it('approve 메서드는 PENDING 상태의 청구를 APPROVED로 변경해야 한다', () => {
      // when
      claim.approve('admin-123');

      // then
      expect(claim.status).toBe(ClaimStatus.APPROVED);
      expect(claim.approverId).toBe('admin-123');
      expect(claim.processDate).toBeInstanceOf(Date);
    });

    it('approve 메서드는 PENDING 상태가 아닌 청구에 대해 예외를 발생시켜야 한다', () => {
      // given
      claim.status = ClaimStatus.REJECTED;

      // when, then
      expect(() => claim.approve('admin-123')).toThrow(InvalidStatusTransitionException);
    });

    it('reject 메서드는 PENDING 상태의 청구를 REJECTED로 변경해야 한다', () => {
      // when
      claim.reject('admin-123', '재고 부족');

      // then
      expect(claim.status).toBe(ClaimStatus.REJECTED);
      expect(claim.approverId).toBe('admin-123');
      expect(claim.rejectionReason).toBe('재고 부족');
      expect(claim.processDate).toBeInstanceOf(Date);
    });

    it('reject 메서드는 PENDING 상태가 아닌 청구에 대해 예외를 발생시켜야 한다', () => {
      // given
      claim.status = ClaimStatus.APPROVED;

      // when, then
      expect(() => claim.reject('admin-123', '재고 부족')).toThrow(InvalidStatusTransitionException);
    });

    it('complete 메서드는 APPROVED 상태의 청구를 COMPLETED로 변경해야 한다', () => {
      // given
      claim.status = ClaimStatus.APPROVED;

      // when
      claim.complete();

      // then
      expect(claim.status).toBe(ClaimStatus.COMPLETED);
      expect(claim.processDate).toBeInstanceOf(Date);
    });

    it('complete 메서드는 APPROVED 상태가 아닌 청구에 대해 예외를 발생시켜야 한다', () => {
      // given
      claim.status = ClaimStatus.PENDING;

      // when, then
      expect(() => claim.complete()).toThrow(InvalidStatusTransitionException);
    });
  });

  describe('상태 확인 메서드 테스트', () => {
    let claim: RewardClaimEntity;

    beforeEach(() => {
      // 각 테스트 전에 기본 보상 청구 엔티티 생성
      claim = RewardClaimEntity.create({
        id: `claim-${Date.now()}`,
        userId: 'user-123',
        eventId: 'event-123',
        rewardId: 'reward-123'
      });
    });

    it('isPending 메서드는 상태가 PENDING인 경우 true를 반환해야 한다', () => {
      // given
      claim.status = ClaimStatus.PENDING;

      // when, then
      expect(claim.isPending()).toBe(true);
    });

    it('isApproved 메서드는 상태가 APPROVED인 경우 true를 반환해야 한다', () => {
      // given
      claim.status = ClaimStatus.APPROVED;

      // when, then
      expect(claim.isApproved()).toBe(true);
    });

    it('isRejected 메서드는 상태가 REJECTED인 경우 true를 반환해야 한다', () => {
      // given
      claim.status = ClaimStatus.REJECTED;

      // when, then
      expect(claim.isRejected()).toBe(true);
    });

    it('isCompleted 메서드는 상태가 COMPLETED인 경우 true를 반환해야 한다', () => {
      // given
      claim.status = ClaimStatus.COMPLETED;

      // when, then
      expect(claim.isCompleted()).toBe(true);
    });
  });

  it('updateMetadata 메서드는 메타데이터를 올바르게 업데이트해야 한다', () => {
    // given
    const claim = RewardClaimEntity.create({
      id: `claim-${Date.now()}`,
      userId: 'user-123',
      eventId: 'event-123',
      rewardId: 'reward-123',
      metadata: { channel: 'web' }
    });

    // when
    claim.updateMetadata('reason', '이벤트 참여');

    // then
    expect(claim.metadata).toEqual({
      channel: 'web',
      reason: '이벤트 참여'
    });
  });
}); 