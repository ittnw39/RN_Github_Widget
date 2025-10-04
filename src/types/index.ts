// GitHub API 응답 타입들
export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  private: boolean;
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionData {
  totalContributions: number;
  contributionsByDay: Map<string, number>;
}

// 위젯 크기 타입
export type WidgetSize = '1x1' | '2x1' | '3x1' | '4x1' | '4x2' | '4x3';

// 위젯 설정 타입
export interface WidgetConfig {
  size: WidgetSize;
  username: string;
  showToday: boolean;
  showTotal: boolean;
  showGraph: boolean;
  displayDays: number;
}

// 앱 상태 타입
export interface AppState {
  username: string;
  user: GitHubUser | null;
  repositories: GitHubRepository[];
  contributionData: ContributionData | null;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

// API 응답 타입
export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
  }>;
}

export interface GitHubGraphQLData {
  user: {
    contributionsCollection: {
      contributionCalendar: ContributionCalendar;
    };
  };
}
