import { AppState, AppStateStatus } from 'react-native';
import { githubAPI } from './api';
import { useAppStore } from '../store/appStore';
import { SYNC_CONFIG } from '../constants';

class BackgroundSyncService {
  private isRunning = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: any = null;

  constructor() {
    // 앱 상태 변화 감지
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    console.log('BackgroundSyncService initialized');
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // 앱이 포그라운드로 돌아올 때 동기화
      this.performSync();
    }
  };

  public async startPeriodicSync() {
    if (this.isRunning) {
      console.log('Background sync already running');
      return;
    }

    this.isRunning = true;
    
    // 즉시 한 번 실행
    await this.performSync();
    
    // 주기적 실행 설정 (3시간마다)
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, SYNC_CONFIG.INTERVAL_HOURS * 60 * 60 * 1000);

    console.log('Periodic sync started');
  }

  public stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Periodic sync stopped');
  }

  public async performSync() {
    try {
      const { username } = useAppStore.getState();
      
      if (!username) {
        console.log('No username set, skipping sync');
        return;
      }

      console.log(`Syncing data for user: ${username}`);

      // 네트워크 연결 확인
      if (!(await githubAPI.checkNetworkConnection())) {
        console.log('No network connection, skipping sync');
        return;
      }

      // 사용자 데이터 및 컨트리뷰션 데이터 동기화
      const { loadUserData, loadContributionData, updateWidgets } = useAppStore.getState();
      
      await Promise.all([
        loadUserData(username),
        loadContributionData(username),
      ]);

      // 위젯 업데이트
      await updateWidgets();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  public async forceSync() {
    console.log('Force sync requested');
    await this.performSync();
  }

  public isSyncRunning(): boolean {
    return this.isRunning;
  }
}

export const backgroundSyncService = new BackgroundSyncService();
