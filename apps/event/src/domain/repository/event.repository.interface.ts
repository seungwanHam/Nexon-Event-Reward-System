import { EventEntity } from '../entity/event.entity';

export const EVENT_REPOSITORY = 'EVENT_REPOSITORY';

/**
 * 이벤트 저장소 인터페이스
 */
export interface EventRepository {
  /**
   * ID로 이벤트를 조회합니다.
   * @throws {EventNotFoundException} 이벤트를 찾을 수 없는 경우
   */
  findById(id: string): Promise<EventEntity>;

  /**
   * 필터 조건에 맞는 모든 이벤트를 조회합니다.
   */
  findAll(filter?: Partial<EventEntity>): Promise<EventEntity[]>;

  /**
   * 현재 활성화되어 있고 유효 기간 내의 이벤트를 조회합니다.
   */
  findActive(): Promise<EventEntity[]>;

  /**
   * 이벤트를 저장합니다.
   */
  save(event: EventEntity): Promise<void>;

  /**
   * 지정된 ID의 이벤트를 삭제합니다.
   * @throws {EventNotFoundException} 이벤트를 찾을 수 없는 경우
   */
  delete(id: string): Promise<void>;
} 