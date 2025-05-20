require('reflect-metadata');
const { join } = require('path');
const { register } = require('tsconfig-paths');

// tsconfig.json의 경로를 등록
const baseUrl = join(__dirname, '../../');
const { paths } = require('../../tsconfig.json').compilerOptions;

// tsconfig 경로를 Jest가 이해할 수 있는 형태로 등록
register({
  baseUrl,
  paths,
});

// 테스트 환경 변수에 따라 모킹 적용 (기본값: false - 실제 구현체 사용)
const useMocks = process.env.USE_MOCKS === 'true';

if (useMocks) {
  console.log('모의 객체를 사용하여 테스트합니다.');
  
  // 공통 enum 모킹
  jest.mock('@app/libs/common/enum', () => ({
    ConditionType: {
      LOGIN: 'login',
      CUSTOM: 'custom'
    },
    EventStatus: {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      EXPIRED: 'expired'
    },
    UserRole: {
      USER: 'user',
      OPERATOR: 'operator',
      ADMIN: 'admin'
    },
    UserStatus: {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      PENDING: 'pending',
      SUSPENDED: 'suspended'
    }
  }), { virtual: true });

  // 공통 예외 클래스 모킹
  jest.mock('@app/libs/common/exception', () => ({
    ValidationException: class ValidationException extends Error {
      constructor(message) {
        super(message);
        this.name = 'ValidationException';
      }
    },
    EntityNotFoundException: class EntityNotFoundException extends Error {
      constructor(message) {
        super(message);
        this.name = 'EntityNotFoundException';
      }
    },
    BusinessLogicException: class BusinessLogicException extends Error {
      constructor(message) {
        super(message);
        this.name = 'BusinessLogicException';
      }
    },
    EventNotFoundException: class EventNotFoundException extends Error {
      constructor(message) {
        super(message);
        this.name = 'EventNotFoundException';
      }
    },
    InvalidStatusTransitionException: class InvalidStatusTransitionException extends Error {
      constructor(message) {
        super(message);
        this.name = 'InvalidStatusTransitionException';
      }
    },
    InvalidRoleAssignmentException: class InvalidRoleAssignmentException extends Error {
      constructor(message) {
        super(message);
        this.name = 'InvalidRoleAssignmentException';
      }
    }
  }), { virtual: true });

  // 로거 서비스 모킹
  jest.mock('@app/libs/infrastructure/logger', () => ({
    WinstonLoggerService: class MockLogger {
      log = jest.fn();
      error = jest.fn();
      warn = jest.fn();
      debug = jest.fn();
      verbose = jest.fn();
      setContext = jest.fn();
    }
  }), { virtual: true });
} else {
  // 로거 모킹을 항상 적용
  jest.mock('@app/libs/infrastructure/logger', () => ({
    WinstonLoggerService: class MockLogger {
      log = jest.fn();
      error = jest.fn();
      warn = jest.fn();
      debug = jest.fn();
      verbose = jest.fn();
      setContext = jest.fn();
    }
  }), { virtual: true });
  
  // 실제 구현체 사용 메시지는 출력하지 않음
}

// Jest를 위한 전역 설정 - 모든 콘솔 출력 억제
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// NestJS 로거 모킹
const nestCommon = require('@nestjs/common');
const originalLogger = nestCommon.Logger;

nestCommon.Logger = class MockNestLogger {
  constructor() {}
  static log = jest.fn();
  static error = jest.fn();
  static warn = jest.fn();
  static debug = jest.fn();
  static verbose = jest.fn();
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  debug = jest.fn();
  verbose = jest.fn();
}; 