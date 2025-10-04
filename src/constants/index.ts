// GitHub API 관련 상수
export const GITHUB_API_BASE_URL = 'https://api.github.com';
export const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// 기본 설정
export const DEFAULT_GITHUB_USERNAME = 'octocat';
export const DEFAULT_WIDGET_SIZE: WidgetSize = '4x2';

// 위젯 크기별 설정
export const WIDGET_CONFIGS = {
  '1x1': {
    displayDays: 7,
    showToday: true,
    showTotal: false,
    showGraph: false,
  },
  '2x1': {
    displayDays: 14,
    showToday: true,
    showTotal: true,
    showGraph: false,
  },
  '3x1': {
    displayDays: 21,
    showToday: true,
    showTotal: true,
    showGraph: true,
  },
  '4x1': {
    displayDays: 28,
    showToday: true,
    showTotal: true,
    showGraph: true,
  },
  '4x2': {
    displayDays: 84,
    showToday: true,
    showTotal: true,
    showGraph: true,
  },
  '4x3': {
    displayDays: 147,
    showToday: true,
    showTotal: true,
    showGraph: true,
  },
} as const;

// 컨트리뷰션 색상 레벨
export const CONTRIBUTION_COLORS = {
  0: '#EEEEEE', // 기여 없음
  1: '#9BE9A8', // 1-2 기여
  2: '#40C463', // 3-4 기여
  3: '#30A14E', // 5-9 기여
  4: '#216E39', // 10+ 기여
} as const;

// API 제한
export const API_RATE_LIMIT = {
  UNAUTHENTICATED: 60, // 시간당 60회
  AUTHENTICATED: 5000, // 시간당 5000회
};

// 동기화 설정
export const SYNC_CONFIG = {
  INTERVAL_HOURS: 3,
  RETRY_ATTEMPTS: 3,
  TIMEOUT_MS: 30000,
};

// 스토리지 키
export const STORAGE_KEYS = {
  USERNAME: 'github_username',
  USER_DATA: 'github_user_data',
  CONTRIBUTION_DATA: 'github_contribution_data',
  LAST_SYNC: 'last_sync_time',
  WIDGET_CONFIGS: 'widget_configs',
} as const;

// 위젯 액션
export const WIDGET_ACTIONS = {
  REFRESH: 'REFRESH_WIDGET',
  OPEN_APP: 'OPEN_APP',
  CHANGE_USER: 'CHANGE_USER',
} as const;

import { WidgetSize } from '../types';
