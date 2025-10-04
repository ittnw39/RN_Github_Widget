import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { githubAPI } from '../services/api';
import { widgetManager } from '../services/widgetService';
import { backgroundSyncService } from '../services/backgroundSync';
import { AppState, GitHubUser, GitHubRepository, ContributionData } from '../types';
import { STORAGE_KEYS } from '../constants';

interface AppStore extends AppState {
  // Actions
  setUsername: (username: string) => void;
  setUser: (user: GitHubUser | null) => void;
  setRepositories: (repositories: GitHubRepository[]) => void;
  setContributionData: (data: ContributionData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSyncTime: (time: Date | null) => void;
  
  // Complex actions
  loadUserData: (username: string) => Promise<void>;
  loadContributionData: (username: string, year?: number) => Promise<void>;
  refreshAllData: (username: string) => Promise<void>;
  clearAllData: () => void;
  
  // Widget specific
  updateWidgets: () => Promise<void>;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      username: '',
      user: null,
      repositories: [],
      contributionData: null,
      isLoading: false,
      error: null,
      lastSyncTime: null,

      // Basic setters
      setUsername: (username) => set({ username }),
      setUser: (user) => set({ user }),
      setRepositories: (repositories) => set({ repositories }),
      setContributionData: (contributionData) => set({ contributionData }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),

      // Load user data
      loadUserData: async (username) => {
        set({ isLoading: true, error: null });
        
        try {
          const [user, repositories] = await Promise.all([
            githubAPI.getUser(username),
            githubAPI.getUserRepositories(username),
          ]);

          set({
            username,
            user,
            repositories,
            isLoading: false,
            error: null,
          });

          // Cache the data
          await githubAPI.cacheData(STORAGE_KEYS.USER_DATA, { user, repositories });
          
          // 백그라운드 동기화 시작
          await backgroundSyncService.startPeriodicSync();
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '사용자 데이터를 불러오는데 실패했습니다',
          });
        }
      },

      // Load contribution data
      loadContributionData: async (username, year = new Date().getFullYear()) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log(`📊 Loading contribution data for ${username}, year: ${year}`);
          
          // 선택한 연도의 데이터만 가져오기
          const contributionData = await githubAPI.getContributionData(username, year);
          
          console.log(`✅ Contribution data loaded: ${contributionData.totalContributions} contributions`);
          
          set({
            contributionData,
            isLoading: false,
            error: null,
            lastSyncTime: new Date(),
          });

          // Cache the data
          await githubAPI.cacheData(STORAGE_KEYS.CONTRIBUTION_DATA, contributionData);
          await githubAPI.cacheData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
        } catch (error: any) {
          console.error('❌ Failed to load contribution data:', error);
          set({
            isLoading: false,
            error: error.message || '컨트리뷰션 데이터를 불러오는데 실패했습니다',
          });
        }
      },

      // Refresh all data
      refreshAllData: async (username) => {
        set({ isLoading: true, error: null });
        
        try {
          await Promise.all([
            get().loadUserData(username),
            get().loadContributionData(username),
          ]);
          
          // Update widgets after data refresh
          await get().updateWidgets();
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || '데이터 새로고침에 실패했습니다',
          });
        }
      },

      // Clear all data
      clearAllData: () => {
        set({
          username: '',
          user: null,
          repositories: [],
          contributionData: null,
          isLoading: false,
          error: null,
          lastSyncTime: null,
        });
      },

      // Update widgets
      updateWidgets: async () => {
        try {
          const { username, contributionData } = get();
          if (username && contributionData) {
            await widgetManager.updateAllWidgets(username, contributionData);
          }
        } catch (error) {
          console.error('Failed to update widgets:', error);
        }
      },
    }),
    {
      name: 'github-widget-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        username: state.username,
        user: state.user,
        repositories: state.repositories,
        contributionData: state.contributionData,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);
