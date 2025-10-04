import { WidgetSize, ContributionData } from '../types';
import { WIDGET_CONFIGS } from '../constants';
import WidgetModule from '../native/WidgetModule';

class WidgetManager {
  private static instance: WidgetManager;

  private constructor() {
    // 위젯 리스너 설정
    this.setupWidgetListeners();
  }

  public static getInstance(): WidgetManager {
    if (!WidgetManager.instance) {
      WidgetManager.instance = new WidgetManager();
    }
    return WidgetManager.instance;
  }

  public async updateAllWidgets(
    username: string,
    contributionData: ContributionData | null
  ): Promise<void> {
    if (!contributionData) {
      console.log('No contribution data to update widgets');
      return;
    }

    const widgetSizes: WidgetSize[] = ['1x1', '2x1', '3x1', '4x1', '4x2', '4x3'];

    try {
      await Promise.all(
        widgetSizes.map(async (size) => {
          const config = WIDGET_CONFIGS[size];
          const widgetData = this.prepareWidgetData(username, contributionData, size);
          
          await WidgetModule.updateWidget(size, widgetData);
        })
      );
      
      console.log('All widgets updated successfully');
    } catch (error) {
      console.error('Failed to update widgets:', error);
      throw error;
    }
  }

  public async refreshWidget(size: WidgetSize): Promise<void> {
    try {
      await WidgetModule.refreshWidget(size);
      console.log(`${size} widget refreshed`);
    } catch (error) {
      console.error(`Failed to refresh ${size} widget:`, error);
      throw error;
    }
  }

  public async clearAllWidgets(): Promise<void> {
    const widgetSizes: WidgetSize[] = ['1x1', '2x1', '3x1', '4x1', '4x2', '4x3'];

    try {
      await Promise.all(
        widgetSizes.map(async (size) => {
          await WidgetModule.clearWidget(size);
        })
      );
      
      console.log('All widgets cleared');
    } catch (error) {
      console.error('Failed to clear widgets:', error);
      throw error;
    }
  }

  private prepareWidgetData(
    username: string,
    contributionData: ContributionData,
    size: WidgetSize
  ): any {
    const config = WIDGET_CONFIGS[size];
    const today = new Date().toISOString().split('T')[0];
    const todayContributions = contributionData.contributionsByDay.get(today) || 0;

    // 위젯 크기에 따른 데이터 필터링 (주 단위 -> 일 단위 변환)
    const displayDays = config.weeks * 7;
    const filteredContributions = this.filterContributionsByDays(
      contributionData.contributionsByDay,
      displayDays
    );

    return {
      username,
      todayContributions,
      totalContributions: contributionData.totalContributions,
      contributions: filteredContributions,
      config: {
        showTitle: config.showTitle,
        showToday: config.showToday,
        showTotal: config.showTotal,
        showGraph: config.showGraph,
        showRefresh: config.showRefresh,
        weeks: config.weeks,
        cellSize: config.cellSize,
        cellMargin: config.cellMargin,
        padding: config.padding,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private filterContributionsByDays(
    contributions: Map<string, number>,
    displayDays: number
  ): Map<string, number> {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - displayDays + 1);

    const filtered = new Map<string, number>();
    
    for (let i = 0; i < displayDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = contributions.get(dateStr) || 0;
      filtered.set(dateStr, count);
    }

    return filtered;
  }

  public async setupWidgetListeners(): Promise<void> {
    // 위젯에서 앱으로의 액션 리스너 설정
    // TODO: 실제 위젯 액션 리스너 구현
    console.log('Widget listeners setup completed');
  }

  public async handleWidgetAction(action: string, data: any): Promise<void> {
    console.log(`Handling widget action: ${action}`, data);
    
    switch (action) {
      case 'REFRESH':
        // 위젯 새로고침 요청 처리
        break;
      case 'OPEN_APP':
        // 앱 열기 요청 처리
        break;
      case 'CHANGE_USER':
        // 사용자 변경 요청 처리
        break;
      default:
        console.log(`Unknown widget action: ${action}`);
    }
  }
}

export const widgetManager = WidgetManager.getInstance();
