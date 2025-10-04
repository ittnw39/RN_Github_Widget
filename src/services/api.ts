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

    // GraphQL 클라이언트 초기화 - 헤더는 setToken에서 설정
    this.graphqlClient = new GraphQLClient(GITHUB_GRAPHQL_URL);

    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // 1. Native Module에서 빌드된 토큰 로드
      const ConfigModule = require('../native/ConfigModule').default;
      if (ConfigModule) {
        const builtInToken = await ConfigModule.getGithubToken();
        if (builtInToken && builtInToken.trim()) {
          console.log('✅ GitHub 토큰 로드 완료');
          this.setToken(builtInToken);
          return;
        }
      }
      
      // 2. AsyncStorage에 저장된 토큰 확인 (백업)
      const savedToken = await AsyncStorage.getItem('github_token');
      if (savedToken) {
        console.log('✅ 저장된 토큰 사용');
        this.setToken(savedToken);
        return;
      }
      
      console.warn('⚠️ GitHub 토큰이 설정되지 않았습니다. API 속도 제한이 적용됩니다.');
    } catch (error) {
      console.warn('Failed to load GitHub token:', error);
    }
  }

  public setToken(token: string) {
    this.token = token;
    this.restClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // GraphQL 클라이언트 헤더 업데이트
    this.graphqlClient.setHeader('Authorization', `Bearer ${token}`);
    this.graphqlClient.setHeader('Content-Type', 'application/json');
    
    console.log('✅ [API] 토큰 설정 완료:', token.substring(0, 15) + '...');
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

      console.log(`📊 Fetching contribution data for ${username}, year: ${year}`);
      console.log('🔑 Token:', this.token ? `${this.token.substring(0, 10)}...` : 'NO TOKEN');

      // graphql-request 라이브러리 사용 (변수 활용)
      const query = `
        query ($username: String!, $from: DateTime!, $to: DateTime!) {
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

      const variables = {
        username,
        from: `${year}-01-01T00:00:00Z`,
        to: `${year}-12-31T23:59:59Z`,
      };

      console.log('🔍 GraphQL variables:', variables);

      // axios로 직접 GraphQL 호출 (graphql-request 대신)
      const axiosResponse = await axios.post(
        GITHUB_GRAPHQL_URL,
        { query, variables },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('✅ GraphQL Response Status:', axiosResponse.status);
      console.log('✅ GraphQL Response:', JSON.stringify(axiosResponse.data, null, 2));

      if (axiosResponse.data.errors) {
        console.error('❌ GraphQL Errors:', axiosResponse.data.errors);
        throw new Error(`GraphQL Error: ${axiosResponse.data.errors[0].message}`);
      }

      const response = axiosResponse.data.data as GitHubGraphQLData;

      console.log('✅ Parsed Response:', JSON.stringify(response, null, 2));

      if (!response.user?.contributionsCollection?.contributionCalendar) {
        console.error('❌ Invalid response structure:', response);
        throw new Error('컨트리뷰션 데이터를 찾을 수 없습니다');
      }

      const calendar = response.user.contributionsCollection.contributionCalendar;
      const contributionsByDay = new Map<string, number>();

      calendar.weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          contributionsByDay.set(day.date, day.contributionCount);
        });
      });

      console.log(`✅ Total contributions: ${calendar.totalContributions}, Days: ${contributionsByDay.size}`);

      return {
        totalContributions: calendar.totalContributions,
        contributionsByDay,
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch contribution data:', error);
      console.error('❌ Error details:', error.response || error.message);
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
