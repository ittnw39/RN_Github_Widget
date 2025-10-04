import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ContributionGrid from './ContributionGrid';
import { WidgetSize, ContributionData } from '../types';
import { WIDGET_CONFIGS } from '../constants';

interface WidgetProps {
  size: WidgetSize;
  username: string;
  contributionData: ContributionData | null;
  isLoading?: boolean;
  error?: string | null;
  onPress?: () => void;
  onRefresh?: () => void;
}

const Widget: React.FC<WidgetProps> = ({
  size,
  username,
  contributionData,
  isLoading = false,
  error = null,
  onPress,
  onRefresh,
}) => {
  const config = WIDGET_CONFIGS[size];
  const {
    weeks,
    cellSize,
    padding,
    showTitle,
    showToday,
    showTotal,
    showGraph,
    showRefresh,
  } = config;

  // 오늘 기여도 계산
  const getTodayContributions = (): number => {
    if (!contributionData) return 0;
    const today = new Date().toISOString().split('T')[0];
    return contributionData.contributionsByDay.get(today) || 0;
  };

  // 전체 기여도
  const getTotalContributions = (): number => {
    return contributionData?.totalContributions || 0;
  };

  // 위젯 크기별 스타일
  const getWidgetDimensions = () => {
    // 기본 셀 크기 계산: (셀 크기 + 마진 * 2) * 7행 + 패딩 * 2
    const gridHeight = (cellSize + 2) * 7 + padding * 2;
    const gridWidth = (cellSize + 2) * weeks + padding * 2;

    switch (size) {
      case '1x1':
        return { width: gridWidth, height: gridHeight };
      case '2x1':
        return { width: gridWidth, height: gridHeight };
      case '3x1':
        return { width: gridWidth, height: gridHeight };
      case '4x1':
        return { width: gridWidth, height: gridHeight };
      case '4x2':
        // 타이틀(24) + 그리드(gridHeight) + 통계(50) + 버튼(40)
        return { width: gridWidth, height: gridHeight + 120 };
      case '4x3':
        // 4x2와 동일 구조
        return { width: gridWidth, height: gridHeight + 120 };
      default:
        return { width: 300, height: 150 };
    }
  };

  const dimensions = getWidgetDimensions();

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#216E39" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.widgetContent}>
        {/* 타이틀 (4x2, 4x3만) */}
        {showTitle && (
          <Text style={styles.widgetTitle}>GitHub 컨트리뷰션</Text>
        )}

        {/* 컨트리뷰션 그리드 */}
        {showGraph && contributionData && (
          <View style={styles.graphContainer}>
            <ContributionGrid
              data={contributionData}
              size={size === '4x3' || size === '4x2' ? 'full' : 'compact'}
              showLabels={false}
              weeks={weeks}
              cellSize={cellSize}
            />
          </View>
        )}

        {/* 통계 (4x2, 4x3만) */}
        {(showToday || showTotal) && (
          <View style={styles.statsContainer}>
            {showToday && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>오늘: </Text>
                <Text style={styles.statValue}>{getTodayContributions()}</Text>
              </View>
            )}
            {showTotal && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>전체: </Text>
                <Text style={styles.statValue}>{getTotalContributions()}</Text>
              </View>
            )}
          </View>
        )}

        {/* 새로고침 버튼 (4x2, 4x3만) */}
        {showRefresh && onRefresh && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>새로고침</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.widgetContainer,
        {
          width: dimensions.width,
          height: dimensions.height,
          padding: padding,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  widgetContent: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 12,
    color: '#D32F2F',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  graphContainer: {
    marginBottom: 8,
  },
  statsContainer: {
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  statValue: {
    fontSize: 13,
    color: '#000',
  },
  refreshButton: {
    backgroundColor: '#216E39',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Widget;
