/**
 * 이벤트 필터링 매개변수 인터페이스
 * 
 * 이벤트 목록 조회 시 사용할 수 있는 다양한 필터링 옵션을 정의합니다.
 */
export interface EventFilterParams {
  /** 이벤트 상태 필터 (active, inactive, draft, completed) */
  status?: string;
  
  /** 이벤트 시작일 필터 (ISO 형식 날짜, 이후) */
  startDate?: string;
  
  /** 이벤트 종료일 필터 (ISO 형식 날짜, 이전) */
  endDate?: string;
  
  /** 이벤트 이름 및 설명 검색어 */
  search?: string;
  
  /** 태그 기반 필터링 */
  tags?: string[];
} 