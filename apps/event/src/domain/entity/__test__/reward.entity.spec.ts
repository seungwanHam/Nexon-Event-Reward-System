import { RewardEntity } from '../reward.entity';
import { RewardType } from '@app/libs/common/enum';

describe('보상 엔티티 테스트', () => {
  describe('보상 생성', () => {
    it('유효한 데이터로 보상을 생성해야 한다', () => {
      // given
      const rewardData = {
        id: `reward-${Date.now()}`,
        eventId: 'event-123',
        type: RewardType.ITEM,
        amount: 5,
        description: '테스트 보상',
        requiresApproval: true,
        metadata: { category: 'equipment' }
      };

      // when
      const reward = RewardEntity.create(rewardData);

      // then
      expect(reward).toBeDefined();
      expect(reward.id).toBe(rewardData.id);
      expect(reward.eventId).toBe('event-123');
      expect(reward.type).toBe(RewardType.ITEM);
      expect(reward.amount).toBe(5);
      expect(reward.description).toBe('테스트 보상');
      expect(reward.requiresApproval).toBe(true);
      expect(reward.metadata.category).toBe('equipment');
    });

    it('기본값이 올바르게 적용되어야 한다', () => {
      // given
      const rewardData = {
        id: `reward-${Date.now()}`,
        eventId: 'event-123',
        type: RewardType.ITEM,
        description: '테스트 보상'
      };

      // when
      const reward = RewardEntity.create(rewardData);

      // then
      expect(reward.amount).toBe(1); // 기본값 1
      expect(reward.requiresApproval).toBe(false); // 기본값 false
      expect(reward.metadata).toEqual({}); // 기본값 빈 객체
      expect(reward.createdAt).toBeInstanceOf(Date);
      expect(reward.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('보상 메서드 테스트', () => {
    let reward: RewardEntity;

    beforeEach(() => {
      // 각 테스트 전에 기본 보상 엔티티 생성
      reward = RewardEntity.create({
        id: `reward-${Date.now()}`,
        eventId: 'event-123',
        type: RewardType.ITEM,
        amount: 1,
        description: '테스트 보상',
        requiresApproval: false
      });
    });

    it('update 메서드는 보상 정보를 올바르게 업데이트해야 한다', () => {
      // given
      const updateData = {
        type: RewardType.POINT,
        amount: 100,
        description: '업데이트된 보상',
        requiresApproval: true,
        metadata: { currency: 'gold' }
      };

      // when
      reward.update(updateData);

      // then
      expect(reward.type).toBe(RewardType.POINT);
      expect(reward.amount).toBe(100);
      expect(reward.description).toBe('업데이트된 보상');
      expect(reward.requiresApproval).toBe(true);
      expect(reward.metadata.currency).toBe('gold');
    });

    it('needsApproval 메서드는 requiresApproval 값에 따라 올바른 결과를 반환해야 한다', () => {
      // given
      reward.requiresApproval = false;
      
      // when, then
      expect(reward.needsApproval()).toBe(false);
      
      // given
      reward.requiresApproval = true;
      
      // when, then
      expect(reward.needsApproval()).toBe(true);
    });

    it('updateMetadata 메서드는 메타데이터를 올바르게 업데이트해야 한다', () => {
      // given
      reward.metadata = { category: 'weapon' };
      
      // when
      reward.updateMetadata('rarity', 'legendary');
      
      // then
      expect(reward.metadata).toEqual({
        category: 'weapon',
        rarity: 'legendary'
      });
    });
  });

  describe('보상 업데이트', () => {
    it('update 메서드로 보상 정보를 수정할 수 있어야 한다', () => {
      // given
      const reward = RewardEntity.create({
        eventId: 'event-123',
        type: RewardType.ITEM,
        amount: 100,
        description: '아이템 보상',
        requiresApproval: false
      });

      const updateData = {
        type: RewardType.POINT,
        amount: 200,
        description: '포인트 보상',
        requiresApproval: true,
        metadata: { category: 'point', reason: 'event-reward' }
      };

      // when
      reward.update(updateData);

      // then
      expect(reward.type).toBe(updateData.type);
      expect(reward.amount).toBe(updateData.amount);
      expect(reward.description).toBe(updateData.description);
      expect(reward.requiresApproval).toBe(updateData.requiresApproval);
      expect(reward.metadata).toEqual(updateData.metadata);
    });

    it('부분 업데이트를 지원해야 한다', () => {
      // given
      const reward = RewardEntity.create({
        eventId: 'event-123',
        type: RewardType.ITEM,
        amount: 100,
        description: '아이템 보상',
        requiresApproval: false
      });

      const partialUpdate = {
        description: '수정된 아이템 보상'
      };

      // when
      reward.update(partialUpdate);

      // then
      expect(reward.type).toBe(RewardType.ITEM); // 변경 안됨
      expect(reward.amount).toBe(100); // 변경 안됨
      expect(reward.description).toBe(partialUpdate.description); // 변경됨
      expect(reward.requiresApproval).toBe(false); // 변경 안됨
    });

    it('메타데이터를 업데이트할 수 있어야 한다', () => {
      // given
      const reward = RewardEntity.create({
        eventId: 'event-123',
        type: RewardType.ITEM,
        amount: 100,
        description: '아이템 보상',
        metadata: { existingKey: 'existingValue' }
      });

      // when
      reward.updateMetadata('newKey', 'newValue');

      // then
      expect(reward.metadata).toEqual({
        existingKey: 'existingValue',
        newKey: 'newValue'
      });
    });
  });

  describe('승인 필요 여부 확인', () => {
    it('requiresApproval이 true인 경우 needsApproval 메서드는 true를 반환해야 한다', () => {
      // given
      const reward = RewardEntity.create({
        eventId: 'event-123',
        type: RewardType.ITEM,
        amount: 100,
        description: '아이템 보상',
        requiresApproval: true
      });

      // when
      const result = reward.needsApproval();

      // then
      expect(result).toBe(true);
    });

    it('requiresApproval이 false인 경우 needsApproval 메서드는 false를 반환해야 한다', () => {
      // given
      const reward = RewardEntity.create({
        eventId: 'event-123',
        type: RewardType.ITEM,
        amount: 100,
        description: '아이템 보상',
        requiresApproval: false
      });

      // when
      const result = reward.needsApproval();

      // then
      expect(result).toBe(false);
    });
  });
}); 