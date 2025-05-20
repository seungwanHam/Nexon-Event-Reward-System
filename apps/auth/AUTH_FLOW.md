# Auth Service 인증 흐름 설명

## 아키텍처 개요

Auth Service는 클린 아키텍처 원칙을 적용하여 다음과 같은 4개의 계층으로 구성되어 있습니다:

1. **프레젠테이션 계층 (Presentation Layer)**
   - HTTP 요청/응답 처리
   - DTO 변환 및 유효성 검사
   - 컨트롤러와 가드가 위치

2. **애플리케이션 계층 (Application Layer)**
   - 도메인 서비스를 조합하고 오케스트레이션 담당
   - 유스케이스 구현에 중점
   - 퍼사드 패턴으로 구현됨

3. **도메인 계층 (Domain Layer)**
   - 비즈니스 핵심 로직과 규칙을 담당
   - 외부 의존성에 영향 받지 않는 독립적인 계층
   - 엔티티, 서비스, 리포지토리 인터페이스가 위치

4. **인프라스트럭처 계층 (Infrastructure Layer)**
   - 데이터베이스, 외부 API 등의 기술적 구현 담당 
   - 도메인 인터페이스 구현체 제공
   - 구체적인 기술에 의존적인 코드가 위치

## 주요 구성 요소

### 프레젠테이션 계층
- **AuthController**: 인증 관련 엔드포인트 제공
- **DTO 클래스들**: 데이터 전송 객체 (CreateUserDto, LoginDto 등)
- **Guards**: JWT 인증 가드

### 애플리케이션 계층
- **AuthFacade**: 도메인 서비스를 조합하여 클라이언트에게 서비스 제공

### 도메인 계층
- **UserEntity**: 사용자 도메인 모델
- **UserService**: 사용자 관련 비즈니스 로직 담당
- **AuthService**: 인증/인가 관련 비즈니스 로직 담당
- **UserRepository (인터페이스)**: 사용자 데이터 접근 계약

### 인프라스트럭처 계층
- **UserRepositoryImpl**: MongoDB를 사용한 UserRepository 구현체
- **JwtStrategy/JwtRefreshStrategy**: Passport JWT 전략 구현

## 의존성 주입 흐름

```
AuthController → AuthFacade → AuthService/UserService → UserRepository (interface) ← UserRepositoryImpl
```

## 인증 흐름

### 1. 회원가입 (Register)

```
[Client] → [AuthController] → [AuthFacade] → [AuthService] → [UserService] → [UserRepository]
```

1. **클라이언트**: `/auth/register` 엔드포인트로 사용자 정보 전송
2. **AuthController**: CreateUserDto 유효성 검사 후 AuthFacade.register() 호출
3. **AuthFacade**: AuthService.register() 호출
4. **AuthService**: 
   - UserService.createUser()를 통해 사용자 생성
   - JWT 토큰 생성 (액세스 토큰 + 리프레시 토큰)
   - UserService.updateRefreshToken()을 통해 리프레시 토큰 저장
5. **UserService**: 
   - 비밀번호 유효성 검사
   - 중복 사용자 확인
   - 비밀번호 해싱
   - UserRepository.create()를 통해 사용자 저장
6. **UserRepositoryImpl**: MongoDB에 사용자 데이터 저장

### 2. 로그인 (Login)

```
[Client] → [AuthController] → [AuthFacade] → [AuthService] → [UserService] → [UserRepository]
```

1. **클라이언트**: `/auth/login` 엔드포인트로 인증 정보 전송
2. **AuthController**: LoginDto 유효성 검사 후 AuthFacade.login() 호출
3. **AuthFacade**: AuthService.login() 호출
4. **AuthService**:
   - UserService.validateUserCredentials()를 통해 인증 정보 검증
   - UserService.updateUserLastLogin()을 통해 로그인 정보 업데이트
   - JWT 토큰 생성 (액세스 토큰 + 리프레시 토큰)
   - UserService.updateRefreshToken()을 통해 리프레시 토큰 저장
5. **UserService**:
   - UserRepository를 통한 사용자 조회
   - 비밀번호 비교 검증
   - 로그인 정보 업데이트 (마지막 로그인 시간, 로그인 횟수)
6. **UserRepositoryImpl**: MongoDB에서 사용자 조회 및 업데이트

### 3. 토큰 갱신 (Refresh Token)

```
[Client] → [RefreshTokenGuard] → [AuthController] → [AuthFacade] → [AuthService] → [UserService] → [UserRepository]
```

1. **클라이언트**: `/auth/refresh` 엔드포인트로 리프레시 토큰 전송
2. **RefreshTokenGuard**: 리프레시 토큰의 기본 유효성 검사
3. **AuthController**: AuthFacade.refreshTokens() 호출
4. **AuthFacade**: AuthService.refreshTokens() 호출
5. **AuthService**:
   - UserService.findUserById()를 통해 사용자 조회
   - UserService.validateRefreshToken()을 통해 리프레시 토큰 검증
   - 새로운 JWT 토큰 쌍 생성
   - UserService.updateRefreshToken()을 통해 새 리프레시 토큰 저장
6. **UserService**: 사용자 조회 및 리프레시 토큰 검증/업데이트
7. **UserRepositoryImpl**: MongoDB에서 사용자 조회 및 업데이트

### 4. 로그아웃 (Logout)

```
[Client] → [JwtAuthGuard] → [AuthController] → [AuthFacade] → [AuthService] → [UserService] → [UserRepository]
```

1. **클라이언트**: `/auth/logout` 엔드포인트로 요청
2. **JwtAuthGuard**: 액세스 토큰 검증
3. **AuthController**: AuthFacade.logout() 호출
4. **AuthFacade**: AuthService.logout() 호출
5. **AuthService**: UserService.updateRefreshToken(null)을 통해 리프레시 토큰 제거
6. **UserService**: 리프레시 토큰 제거 로직 처리
7. **UserRepositoryImpl**: MongoDB에서 사용자의 리프레시 토큰 필드 업데이트

### 5. 프로필 조회 (Get Profile)

```
[Client] → [JwtAuthGuard] → [AuthController] → [AuthFacade] → [UserService] → [UserRepository]
```

1. **클라이언트**: `/auth/profile` 엔드포인트로 요청
2. **JwtAuthGuard**: 액세스 토큰 검증
3. **AuthController**: AuthFacade.getUserProfile() 호출
4. **AuthFacade**: UserService.findUserById()를 통해 사용자 조회 및 민감 정보 제거
5. **UserService**: 사용자 조회 로직 처리
6. **UserRepositoryImpl**: MongoDB에서 사용자 조회

## JWT 인증 전략

### 액세스 토큰 (Access Token)
- **목적**: API 접근 권한 부여
- **유효 기간**: 15분 (짧은 유효기간)
- **보관 위치**: 클라이언트 측 (일반적으로 메모리)
- **검증 방식**: JwtAuthGuard에서 검증

### 리프레시 토큰 (Refresh Token)
- **목적**: 새로운 액세스 토큰 발급
- **유효 기간**: 7일 (긴 유효기간)
- **보관 위치**: 
  - 클라이언트 측: HTTP 전용 쿠키
  - 서버 측: 사용자 데이터에 해시화하여 저장
- **검증 방식**: RefreshTokenGuard 및 bcrypt.compare()로 해시 비교

## 보안 특징

1. **비밀번호 보안**:
   - 비밀번호 복잡성 검증 (최소 8자, 대소문자, 숫자, 특수문자 포함)
   - bcrypt를 사용한 해시 저장

2. **토큰 보안**:
   - 액세스 토큰 짧은 유효기간 (15분)
   - 리프레시 토큰은 DB에 해시화하여 저장
   - 로그아웃 시 리프레시 토큰 무효화

3. **계층 분리**:
   - 도메인 로직과 인프라 로직 분리
   - 의존성 방향 엄격히 제어 (외부에서 내부로만 의존)

## 에러 처리

각 계층에서 발생한 에러는 그 계층에서 적절한 NestJS 예외로 변환하여 전파됩니다:

- **UserService**: 사용자 관련 예외 (BadRequestException, ConflictException, NotFoundException)
- **AuthService**: 인증 관련 예외 (UnauthorizedException)
- **Guards**: 인증/인가 예외 (UnauthorizedException, ForbiddenException)

## 확장성과 유지보수성

1. **UserEntity의 확장 가능성**:
   - 프로필 데이터 필드
   - 소셜 로그인 연동 정보
   - 권한 및 역할 관리

2. **인증 확장 가능성**:
   - 소셜 로그인 추가
   - 2단계 인증 추가
   - 권한 기반 접근 제어 강화 

## 역할 관리 시스템

### 지원되는 역할 (Roles)
- **USER**: 일반 사용자, 보상 요청 권한
- **OPERATOR**: 운영자, 이벤트/보상 등록 권한
- **AUDITOR**: 감사자, 보상 이력 조회 권한
- **ADMIN**: 관리자, 모든 기능에 대한 접근 권한

### 역할 할당 및 검증
1. **역할 할당**:
   - 초기 회원가입 시 기본적으로 USER 역할 부여
   - ADMIN만이 다른 사용자의 역할 수정 가능
   - 한 사용자는 여러 역할 보유 가능 (예: OPERATOR + AUDITOR)

2. **역할 검증**:
   - JwtAuthGuard에서 토큰의 유효성 검증
   - RolesGuard에서 엔드포인트별 필요 역할 검증
   - @Roles() 데코레이터로 필요 권한 명시

## 에러 코드 체계

### 인증 관련 에러 (AUTH001-AUTH010)
| 코드    | 설명               | HTTP 상태 코드 |
| ------- | ------------------ | -------------- |
| AUTH001 | 잘못된 역할 할당   | 400            |
| AUTH002 | 잘못된 상태 전이   | 400            |
| AUTH003 | 이메일 중복        | 409            |
| AUTH004 | 잘못된 인증 정보   | 401            |
| AUTH005 | 사용자 미존재      | 404            |
| AUTH006 | 유효하지 않은 토큰 | 401            |
| AUTH007 | 토큰 만료          | 401            |
| AUTH008 | 블랙리스트 토큰    | 401            |
| AUTH009 | 권한 부족          | 403            |
| AUTH010 | 잘못된 사용자 상태 | 400            |

## 프로덕션 준비도 (Production Readiness)

### 보안 강화
1. **Rate Limiting**:
   - 로그인 시도 제한 (IP당 5분에 5회)
   - 토큰 갱신 요청 제한 (IP당 15분에 10회)
   - 회원가입 요청 제한 (IP당 24시간에 3회)

2. **데이터 보안**:
   - 비밀번호 해싱 (bcrypt, salt rounds: 10)
   - 민감 정보 암호화 저장
   - 토큰 데이터 최소화

3. **토큰 보안**:
   - 짧은 액세스 토큰 수명 (15분)
   - 리프레시 토큰 순환 (재사용 방지)
   - 토큰 블랙리스트 관리

### 모니터링 및 로깅
1. **로깅 시스템**:
   - Winston 로거 통합
   - 에러 로그 중앙화
   - 민감 정보 마스킹

2. **모니터링 지표**:
   - 인증 시도 성공/실패율
   - 토큰 발급/갱신 횟수
   - API 응답 시간
   - 동시 접속자 수

### 확장성 고려사항
1. **수평적 확장**:
   - 무상태(Stateless) 설계로 다중 인스턴스 지원
   - Redis를 통한 세션/캐시 공유
   - MongoDB 레플리카셋 구성

2. **성능 최적화**:
   - 인덱스 최적화 (이메일, userId)
   - 캐싱 전략 (토큰 검증 결과 캐싱)
   - 비동기 작업 처리 (이메일 발송 등)

### 장애 대응
1. **회복력**:
   - Circuit Breaker 패턴 적용
   - Fallback 메커니즘 구현
   - 자동 재시도 로직

2. **백업 전략**:
   - 데이터베이스 정기 백업
   - 로그 백업 및 보관
   - 설정 값 버전 관리

## API 문서화
- Swagger/OpenAPI 통합
- API 버전 관리
- 상세한 에러 응답 명세 