import { UserEventEntity } from '../entity/user-event.entity';

export const USER_EVENT_REPOSITORY = 'USER_EVENT_REPOSITORY';

/**
 * 사용자 이벤트 리포지토리 인터페이스
 * 
 * 사용자 이벤트 엔티티에 대한 데이터 접근 계약을 정의합니다.
 */
export interface UserEventRepository {
  /**
   * 이벤트 저장
   * 
   * 새로운 사용자 이벤트를 저장합니다.
   * 
   * @param event - 저장할 이벤트 엔티티
   * @returns 저장된 이벤트
   */
  save(event: UserEventEntity): Promise<UserEventEntity>;

  /**
   * 이벤트 조회
   * 
   * ID로 특정 이벤트를 조회합니다.
   * 
   * @param id - 이벤트 ID
   * @returns 찾은 이벤트 또는 null
   */
  findById(id: string): Promise<UserEventEntity | null>;

  /**
   * 멱등성 키로 이벤트 조회
   * 
   * 동일한 이벤트 중복 저장 방지를 위해 멱등성 키로 이벤트를 조회합니다.
   * 
   * @param key - 멱등성 키
   * @returns 찾은 이벤트 또는 null
   */
  findByIdempotencyKey(key: string): Promise<UserEventEntity | null>;

  /**
   * 사용자 이벤트 목록 조회
   * 
   * 특정 사용자의, 선택적으로 특정 타입의 이벤트를 조회합니다.
   * 
   * @param userId - 사용자 ID
   * @param eventType - 이벤트 타입 (선택 사항)
   * @returns 이벤트 목록
   */
  findByUser(userId: string, eventType?: string): Promise<UserEventEntity[]>;
} 