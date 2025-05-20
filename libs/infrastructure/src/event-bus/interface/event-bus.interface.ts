/**
 * 이벤트 객체 인터페이스
 * 
 * 시스템 내에서 전파되는 이벤트의 구조를 정의합니다.
 * 타입, 페이로드, 메타데이터를 포함하여 이벤트에 대한 충분한 컨텍스트를 제공합니다.
 */
export interface EventData {
  /**
   * 이벤트 타입
   * 
   * 이벤트를 고유하게 식별하는 문자열입니다.
   * 일반적으로 'entity.action' 패턴을 따릅니다. (예: 'user.created', 'order.updated')
   */
  type: string;
  
  /**
   * 이벤트 페이로드 (이벤트와 관련된 데이터)
   * 
   * 이벤트에 관련된 핵심 데이터를 포함합니다.
   * 예를 들어 'user.created' 이벤트는 생성된 사용자 정보를 포함합니다.
   */
  payload: any;
  
  /**
   * 이벤트 메타데이터
   * 
   * 이벤트 처리와 관련된 추가 정보를 포함합니다.
   * 추적, 감사, 디버깅 목적으로 사용됩니다.
   */
  metadata?: {
    /**
     * 이벤트 소스 (어느 서비스에서 발생했는지)
     * 
     * 이벤트를 발생시킨 서비스 또는 컴포넌트 식별자입니다.
     */
    source?: string;
    
    /**
     * 이벤트 발생 시간
     * 
     * 이벤트가 생성된 정확한 시간입니다.
     */
    timestamp?: Date;
    
    /**
     * 상관 ID (요청 추적용)
     * 
     * 분산 시스템에서 관련 이벤트를 그룹화하는 데 사용됩니다.
     * 하나의 사용자 요청이 여러 서비스에 걸쳐 처리될 때 유용합니다.
     */
    correlationId?: string;
    
    /**
     * 사용자 ID (이벤트 발생 주체)
     * 
     * 이벤트를 발생시킨 사용자의 식별자입니다.
     * 감사 및 권한 확인에 유용합니다.
     */
    userId?: string;
    
    /**
     * 추가 메타데이터 필드
     * 
     * 애플리케이션별 커스텀 메타데이터 필드를 허용합니다.
     */
    [key: string]: any;
  };
}

/**
 * 이벤트 핸들러 타입
 * 
 * 이벤트를 수신하고 처리하는 함수의 시그니처를 정의합니다.
 * 비동기 처리를 지원하기 위해 Promise를 반환할 수 있습니다.
 */
export type EventHandler = (event: EventData) => Promise<void> | void;

/**
 * 이벤트 버스 인터페이스
 * 
 * 의존성 역전 원칙(DIP)에 따라 추상화된 인터페이스로 구현됩니다.
 * 구현체는 인메모리, Redis, Kafka 등 다양한 메시징 시스템을 사용할 수 있습니다.
 * 이 인터페이스는 발행-구독(Publish-Subscribe) 패턴을 따릅니다.
 */
export interface IEventBus {
  /**
   * 이벤트 발행
   * 
   * 시스템에 이벤트를 전파합니다. 구독자들은 이벤트 타입에 맞게 알림을 받게 됩니다.
   * 이벤트는 비동기적으로 처리되며, 발행자는 구독자의 처리 결과를 기다리지 않습니다.
   * 
   * @param event - 발행할 이벤트 데이터
   * @returns 이벤트 발행 완료 프로미스
   * 
   * @example
   * ```typescript
   * await eventBus.publish({
   *   type: 'user.created',
   *   payload: { id: '123', name: 'John Doe' },
   *   metadata: { source: 'user-service', correlationId: 'abc-123' }
   * });
   * ```
   */
  publish(event: EventData): Promise<void>;
  
  /**
   * 이벤트 구독
   * 
   * 특정 타입의 이벤트를 수신하고 처리하기 위한 핸들러를 등록합니다.
   * 하나의 이벤트 타입에 여러 핸들러를 등록할 수 있습니다.
   * 
   * @param eventType - 구독할 이벤트 타입
   * @param handler - 이벤트 처리 핸들러
   * @returns 구독 완료 프로미스
   * 
   * @example
   * ```typescript
   * await eventBus.subscribe('user.created', async (event) => {
   *   console.log(`New user created: ${event.payload.name}`);
   *   // 이벤트 처리 로직
   * });
   * ```
   */
  subscribe(eventType: string, handler: EventHandler): Promise<void>;
  
  /**
   * 이벤트 구독 취소
   * 
   * 특정 이벤트 타입에 대한 구독을 취소합니다.
   * 핸들러를 지정하면 해당 핸들러만 구독 취소하고, 지정하지 않으면 모든 핸들러를 취소합니다.
   * 
   * @param eventType - 구독 취소할 이벤트 타입
   * @param handler - 취소할 특정 핸들러 (선택적)
   * @returns 구독 취소 완료 프로미스
   * 
   * @example
   * ```typescript
   * // 특정 핸들러만 구독 취소
   * await eventBus.unsubscribe('user.created', myHandler);
   * 
   * // 해당 이벤트 타입의 모든 핸들러 구독 취소
   * await eventBus.unsubscribe('user.created');
   * ```
   */
  unsubscribe(eventType: string, handler?: EventHandler): Promise<void>;
} 