# Nexon 이벤트 보상 시스템 API 테스트 가이드

## 테스트 환경
- Gateway Service: http://localhost:3000
- Auth Service: http://localhost:3001
- Event Service: http://localhost:3002
- Swagger API 문서: http://localhost:3000/api/docs

## 시작하기 전에

### 환경 설정
```bash
# 프로젝트 클론 후 Docker 컨테이너 실행
git clone https://github.com/your-username/Nexon-Event-Reward-System.git
cd Nexon-Event-Reward-System
docker-compose up -d

# 자동화 테스트 실행 권한 설정 및 실행
chmod +x AUTOMATED_INTEGRATION_TEST.sh
./AUTOMATED_INTEGRATION_TEST.sh
```

## 1. 사용자 계정 관리

### 1-1. 관리자 회원가입
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nexon.com",
    "password": "Nexon123!",
    "nickname": "관리자",
    "roles": ["user", "admin"]
  }'
```

### 1-2. 관리자 로그인
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nexon.com",
    "password": "Nexon123!"
  }'
```

### 1-3. 일반 사용자 회원가입
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@nexon.com",
    "password": "Nexon123!",
    "nickname": "일반사용자",
    "roles": ["user"]
  }'
```

### 1-4. 일반 사용자 로그인
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@nexon.com",
    "password": "Nexon123!"
  }'
```

### 1-5. 감사자 회원가입
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "auditor@nexon.com",
    "password": "Nexon123!",
    "nickname": "감사자",
    "roles": ["auditor", "user"]
  }'
```

### 1-6. 감사자 로그인
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "auditor@nexon.com",
    "password": "Nexon123!"
  }'
```

### 1-7. 토큰 갱신
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "refreshToken": "REFRESH_TOKEN_HERE"
  }'
```

### 1-8. 프로필 조회
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE"
```

### 1-9. 로그아웃
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE"
  }'
```

## 2. 이벤트 관리

### 2-1. 로그인 이벤트 생성
```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "첫 로그인 이벤트",
    "description": "게임에 처음 로그인하면 보상을 받을 수 있습니다",
    "conditionType": "login",
    "conditionParams": {
      "requiredCount": 1
    },
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2028-12-31T23:59:59Z"
  }'
```

### 2-2. 회원가입 이벤트 생성
```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "신규 회원 가입 이벤트",
    "description": "회원가입을 완료하면 특별 보상을 받을 수 있습니다",
    "conditionType": "custom",
    "conditionParams": {
      "eventCode": "user-register"
    },
    "startDate": "2023-01-01T00:00:00Z",
    "endDate": "2028-12-31T23:59:59Z"
  }'
```

### 2-3. 이벤트 목록 조회
```bash
curl -X GET "http://localhost:3000/api/v1/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 2-4. 이벤트 활성화
```bash
curl -X PUT "http://localhost:3000/api/v1/events/$EVENT_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "status": "active"
  }'
```

## 3. 보상 관리

### 3-1. 수동 승인 보상 생성
```bash
curl -X POST http://localhost:3000/api/v1/rewards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "eventId": "$EVENT_ID",
    "type": "point",
    "amount": 1000,
    "description": "첫 로그인 특별 보상 (관리자 승인 필요)",
    "requiresApproval": true
  }'
```

### 3-2. 자동 승인 보상 생성
```bash
curl -X POST http://localhost:3000/api/v1/rewards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "eventId": "$EVENT_ID",
    "type": "point",
    "amount": 5000,
    "description": "회원가입 축하 포인트 (자동 승인)",
    "requiresApproval": false
  }'
```

### 3-3. 이벤트별 보상 조회
```bash
curl -X GET "http://localhost:3000/api/v1/rewards/event/$EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 4. 보상 청구 관리

### 4-1. 이벤트 조건 평가 (로그인)
```bash
curl -X POST http://localhost:3000/api/v1/claims/evaluate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "userId": "$USER_ID",
    "eventId": "$EVENT_ID",
    "actionData": {
      "loginCount": 1
    }
  }'
```

### 4-2. 이벤트 조건 평가 (회원가입)
```bash
curl -X POST http://localhost:3000/api/v1/claims/evaluate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "userId": "$USER_ID",
    "eventId": "$EVENT_ID",
    "actionData": {
      "eventCode": "user-register",
      "customEventPassed": true
    }
  }'
```

### 4-3. 보상 청구
```bash
curl -X POST http://localhost:3000/api/v1/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "userId": "$USER_ID",
    "eventId": "$EVENT_ID",
    "rewardId": "$REWARD_ID"
  }'
```

### 4-4. 사용자별 청구 이력 조회
```bash
curl -X GET http://localhost:3000/api/v1/claims/user \
  -H "Authorization: Bearer $USER_TOKEN"
```

### 4-5. 청구 승인 (관리자용)
```bash
curl -X PUT "http://localhost:3000/api/v1/claims/$CLAIM_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "approverId": "$ADMIN_ID"
  }'
```

### 4-6. 모든 청구 이력 조회 (감사자용)
```bash
curl -X GET http://localhost:3000/api/v1/claims \
  -H "Authorization: Bearer $AUDITOR_TOKEN"
```

## 5. 헬스 체크

### 5-1. 게이트웨이 헬스 체크
```bash
curl -X GET http://localhost:3000/api/v1/health
```

### 5-2. 인증 서비스 헬스 체크
```bash
curl -X GET http://localhost:3001/api/v1/health
```

### 5-3. 이벤트 서비스 헬스 체크
```bash
curl -X GET http://localhost:3002/api/v1/health
```

### 5-4. 전체 헬스 체크 결과
각 서비스 헬스 체크 결과를 별도로 확인하여 모든 서비스가 정상 작동하는지 확인해야 합니다.

## 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "작업이 성공적으로 완료되었습니다",
  "data": {
    // 응답 데이터
  }
}
```

### 실패 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## 참고사항

1. 모든 API 요청의 자세한 사양은 Swagger 문서에서 확인 가능합니다: http://localhost:3000/api/docs
2. 자동화된 테스트를 실행하려면 AUTOMATED_INTEGRATION_TEST.sh 스크립트를 사용하세요
3. 권한에 따라 접근 가능한 API가 제한됩니다:
   - 일반 사용자: 자신의 이벤트/보상/청구 관련 API
   - 관리자: 모든 API (생성/수정/승인 권한 포함)
   - 감사자: 조회 전용 API (수정/승인 권한 없음) 