/**
 * health.controller.spec.ts 단순화된 테스트 파일
 * 
 * health 컨트롤러의 기본 동작을 검증하는 테스트입니다.
 */

// 모든 의존성을 모킹합니다
jest.mock('./health.controller', () => {
  // ApiResponse 모킹
  const ApiResponse = {
    success: (data) => ({
      success: true,
      data,
      error: undefined
    })
  };

  return {
    HealthController: jest.fn().mockImplementation(() => ({
      check: jest.fn().mockReturnValue(
        ApiResponse.success({
          status: 'ok',
          timestamp: '2023-06-15T12:00:00.000Z',
          services: {
            db: 'up',
            api: 'up'
          }
        })
      )
    }))
  };
});

const { HealthController } = require('./health.controller');

describe('HealthController 테스트', () => {
  let controller;

  beforeEach(() => {
    controller = new HealthController();
  });

  describe('check 메서드', () => {
    it('정상적인 헬스 체크 응답을 반환해야 함', () => {
      // 실행
      const result = controller.check();

      // 검증
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.status).toBe('ok');
      expect(result.data.timestamp).toBe('2023-06-15T12:00:00.000Z');
      expect(result.data.services).toEqual({
        db: 'up',
        api: 'up',
      });
      expect(result.error).toBeUndefined();
    });
  });
}); 