import axios, { AxiosInstance } from 'axios';
import { GraphQLClient } from 'graphql-request';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  GitHubUser,
  GitHubRepository,
  ContributionData,
  GitHubGraphQLData,
  GraphQLResponse,
} from '../types';
import {
  GITHUB_API_BASE_URL,
  GITHUB_GRAPHQL_URL,
  API_RATE_LIMIT,
  STORAGE_KEYS,
} from '../constants';

class GitHubAPIService {
  private restClient: AxiosInstance;
  private graphqlClient: GraphQLClient;
  private token: string | null = null;

  constructor() {
    this.restClient = axios.create({
      baseURL: GITHUB_API_BASE_URL,
      timeout: 30000,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Contribution-Widget/1.0',
      },
    });

    this.graphqlClient = new GraphQLClient(GITHUB_GRAPHQL_URL, {
      headers: {
        'User-Agent': 'GitHub-Contribution-Widget/1.0',
      },
    });

    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // 개발자 토큰 로드 (선택사항)
      const savedToken = await AsyncStorage.getItem('github_token');
      if (savedToken) {
        this.setToken(savedToken);
      }
    } catch (error) {
      console.warn('Failed to load GitHub token:', error);
    }
  }

  public setToken(token: string) {
    this.token = token;
    this.restClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    this.graphqlClient.setHeader('Authorization', `Bearer ${token}`);
  }

  public async checkNetworkConnection(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  public async getUser(username: string): Promise<GitHubUser | null> {
    try {
      if (!(await this.checkNetworkConnection())) {
        throw new Error('네트워크 연결이 없습니다');
      }

      const response = await this.restClient.get(`/users/${username}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      throw new Error(`사용자 정보를 가져올 수 없습니다: ${error.message}`);
    }
  }

  public async getUserRepositories(username: string): Promise<GitHubRepository[]> {
    try {
      if (!(await this.checkNetworkConnection())) {
        throw new Error('네트워크 연결이 없습니다');
      }

      const response = await this.restClient.get(`/users/${username}/repos`, {
        params: {
          sort: 'updated',
          per_page: 30,
          type: 'owner',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch repositories:', error);
      throw new Error(`저장소 정보를 가져올 수 없습니다: ${error.message}`);
    }
  }

  public async getContributionData(
    username: string,
    year: number = new Date().getFullYear()
  ): Promise<ContributionData> {
    try {
      if (!(await this.checkNetworkConnection())) {
        throw new Error('네트워크 연결이 없습니다');
      }

      const query = `
        query($username: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $username) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `;

      const from = new Date(year, 0, 1).toISOString();
      const to = new Date(year, 11, 31, 23, 59, 59).toISOString();

      const variables = {
        username,
        from,
        to,
      };

      const response = await this.graphqlClient.request<GitHubGraphQLData>(
        query,
        variables
      );

      if (!response.user?.contributionsCollection?.contributionCalendar) {
        throw new Error('컨트리뷰션 데이터를 찾을 수 없습니다');
      }

      const calendar = response.user.contributionsCollection.contributionCalendar;
      const contributionsByDay = new Map<string, number>();

      calendar.weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          contributionsByDay.set(day.date, day.contributionCount);
        });
      });

      return {
        totalContributions: calendar.totalContributions,
        contributionsByDay,
      };
    } catch (error: any) {
      console.error('Failed to fetch contribution data:', error);
      throw new Error(`컨트리뷰션 데이터를 가져올 수 없습니다: ${error.message}`);
    }
  }

  public async getMultiYearContributionData(
    username: string,
    years: number[]
  ): Promise<ContributionData> {
    try {
      const allContributions = new Map<string, number>();
      let totalContributions = 0;

      for (const year of years) {
        const yearData = await this.getContributionData(username, year);
        totalContributions += yearData.totalContributions;
        
        yearData.contributionsByDay.forEach((count, date) => {
          allContributions.set(date, count);
        });
      }

      return {
        totalContributions,
        contributionsByDay: allContributions,
      };
    } catch (error: any) {
      console.error('Failed to fetch multi-year contribution data:', error);
      throw error;
    }
  }

  public async cacheData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  public async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  public async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.CONTRIBUTION_DATA,
        STORAGE_KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

export const githubAPI = new GitHubAPIService();
