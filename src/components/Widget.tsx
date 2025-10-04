import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import ContributionGrid from './ContributionGrid';
import { WidgetSize, ContributionData } from '../types';
import { WIDGET_CONFIGS, CONTRIBUTION_COLORS } from '../constants';

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
  const { showToday, showTotal, showGraph, displayDays } = config;

  const getTodayContributions = (): number => {
    if (!contributionData) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    return contributionData.contributionsByDay.get(today) || 0;
  };

  const getTotalContributions = (): number => {
    return contributionData?.totalContributions || 0;
  };

  const getWidgetStyles = () => {
    const baseStyles = {
      borderRadius: 12,
      padding: 12,
      margin: 4,
    };

    switch (size) {
      case '1x1':
        return {
          ...baseStyles,
          width: 80,
          height: 80,
          justifyContent: 'center',
          alignItems: 'center',
        };
      case '2x1':
        return {
          ...baseStyles,
          width: 160,
          height: 80,
        };
      case '3x1':
        return {
          ...baseStyles,
          width: 240,
          height: 80,
        };
      case '4x1':
        return {
          ...baseStyles,
          width: 320,
          height: 80,
        };
      case '4x2':
        return {
          ...baseStyles,
          width: 320,
          height: 160,
        };
      case '4x3':
        return {
          ...baseStyles,
          width: 320,
          height: 240,
        };
      default:
        return baseStyles;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>오류 발생</Text>
          <Text style={styles.errorSubText}>{error}</Text>
        </View>
      );
    }

    if (!contributionData) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>데이터 없음</Text>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.username} numberOfLines={1}>
            {username}
          </Text>
          {size === '4x2' || size === '4x3' ? (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Text style={styles.refreshText}>새로고침</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 통계 정보 */}
        <View style={styles.stats}>
          {showToday && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>오늘</Text>
              <Text style={styles.statValue}>{getTodayContributions()}</Text>
            </View>
          )}
          {showTotal && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>전체</Text>
              <Text style={styles.statValue}>{getTotalContributions()}</Text>
            </View>
          )}
        </View>

        {/* 컨트리뷰션 그래프 */}
        {showGraph && (
          <View style={styles.graphContainer}>
            <ContributionGrid
              data={contributionData}
              size={size}
              showLabels={size === '4x3'}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.widget, getWidgetStyles()]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#f8f9fa', '#e9ecef']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  widget: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  refreshText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  graphContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  errorSubText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#666',
  },
});

export default Widget;
