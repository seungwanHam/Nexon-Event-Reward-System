/**
 * 공통 모듈 - 모든 마이크로서비스에서 공유되는 코드
 * 
 * 여기에서는 순환 참조를 방지하기 위해 
 * 직접 내부 파일을 가져와 다시 내보내는 대신
 * 각 디렉토리의 인덱스 파일에 대한 참조만 노출합니다.
 */

// DTO 인터페이스 및 클래스
export * from './dto';

// 스키마 및 열거형 다시 내보내기 - 중복 방지
import * as AllSchemas from './schema';
import * as AllEnums from './enum';
import * as AllExceptions from './exception';

// 모든 스키마 내보내기
export const Schemas = AllSchemas;

// 모든 열거형 내보내기
export const Enums = AllEnums;

// 모든 예외 내보내기 
export const Exceptions = AllExceptions;

// 하위 호환성 유지를 위해 개별 모듈도 내보내기
export * from './schema';
export * from './exception';