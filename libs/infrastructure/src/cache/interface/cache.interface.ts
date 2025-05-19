/**
 * 캐시 서비스 인터페이스
 * 모든 캐시 구현체는 이 인터페이스를 준수해야 합니다.
 */
export interface ICacheService {
  /**
   * 캐시에서 값을 가져옵니다.
   */
  get(key: string): Promise<string | null>;

  /**
   * 값을 캐시에 저장합니다.
   */
  set(key: string, value: string, ttl?: number): Promise<void>;

  /**
   * 키를 캐시에서 삭제합니다.
   */
  del(key: string): Promise<void>;

  /**
   * 여러 키를 캐시에서 삭제합니다.
   */
  delMany(keys: string[]): Promise<void>;

  /**
   * 캐시에서 특정 패턴의 모든 키를 삭제합니다.
   * 
   * 각 구현체는 자신의 저장소에 맞는 최적화된 방법으로 패턴 매칭 삭제를 구현해야 합니다:
   * - Redis: SCAN 명령어를 사용하여 대규모 시스템에서도 안전하게 삭제
   * - 메모리: 정규식을 사용하여 패턴 매칭 후 삭제
   * 
   * 글로브 패턴 문법을 지원합니다 (예: user:*, session:*:tokens)
   */
  delPattern(pattern: string): Promise<void>;

  /**
   * 캐시가 특정 키를 가지고 있는지 확인합니다.
   */
  exists(key: string): Promise<boolean>;

  /**
   * 캐시에서 값을 가져오거나, 없으면 생성하여 저장합니다.
   */
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
} 