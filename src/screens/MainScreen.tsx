import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useAppStore } from '../store/appStore';
import Widget from '../components/Widget';
import ContributionGrid from '../components/ContributionGrid';
import { WidgetSize } from '../types';

const MainScreen: React.FC = () => {
  const {
    username,
    repositories,
    contributionData,
    isLoading,
    error,
    lastSyncTime,
    loadUserData,
    loadContributionData,
    refreshAllData,
    setUsername,
  } = useAppStore();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (username) {
      loadUserData(username);
      loadContributionData(username, selectedYear);
    }
  }, [username, selectedYear, loadUserData, loadContributionData]);

  const handleRefresh = async () => {
    if (!username) return;
    
    setRefreshing(true);
    try {
      await refreshAllData(username);
    } finally {
      setRefreshing(false);
    }
  };

  const handleChangeUser = () => {
    Alert.prompt(
      'GitHub 사용자명 변경',
      '새로운 GitHub 사용자명을 입력하세요:',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: (newUsername?: string) => {
            if (newUsername && newUsername.trim()) {
              setUsername(newUsername.trim());
            }
          },
        },
      ],
      'plain-text',
      username
    );
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const getTodayContributions = (): number => {
    if (!contributionData) return 0;
    const today = new Date().toISOString().split('T')[0];
    return contributionData.contributionsByDay.get(today) || 0;
  };

  const getTotalContributions = (): number => {
    return contributionData?.totalContributions || 0;
  };

  const renderYearSelector = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
      <View style={styles.yearSelector}>
        <Text style={styles.yearLabel}>연도 선택:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.yearButtonSelected,
              ]}
              onPress={() => handleYearChange(year)}
            >
              <Text
                style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.yearButtonTextSelected,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderWidgets = () => {
    const widgetSizes: WidgetSize[] = ['1x1', '2x1', '3x1', '4x1', '4x2', '4x3'];

    return (
      <View style={styles.widgetsContainer}>
        <Text style={styles.sectionTitle}>위젯 미리보기</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {widgetSizes.map((size) => (
            <View key={size} style={styles.widgetPreview}>
              <Text style={styles.widgetSizeLabel}>{size}</Text>
              <Widget
                size={size}
                username={username || '사용자'}
                contributionData={contributionData}
                isLoading={isLoading}
                error={error}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderRepositoryList = () => {
    if (!repositories.length) return null;

    return (
      <View style={styles.repositoriesContainer}>
        <Text style={styles.sectionTitle}>저장소 목록</Text>
        <ScrollView style={styles.repositoryList}>
          {repositories.slice(0, 10).map((repo) => (
            <View key={repo.id} style={styles.repositoryItem}>
              <Text style={styles.repositoryName}>{repo.name}</Text>
              <Text style={styles.repositoryDescription} numberOfLines={2}>
                {repo.description || '설명 없음'}
              </Text>
              <View style={styles.repositoryMeta}>
                <Text style={styles.repositoryLanguage}>{repo.language}</Text>
                <Text style={styles.repositoryStars}>
                  ⭐ {repo.stargazers_count}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (!username) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>GitHub 컨트리뷰션 위젯</Text>
          <Text style={styles.welcomeSubtitle}>
            GitHub 사용자명을 입력하여 시작하세요
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleChangeUser}
          >
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.userStats}>
              오늘: {getTodayContributions()} | 전체: {getTotalContributions()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changeUserButton}
            onPress={handleChangeUser}
          >
            <Text style={styles.changeUserText}>변경</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {renderYearSelector()}

        <View style={styles.contributionContainer}>
          <Text style={styles.sectionTitle}>컨트리뷰션 그래프</Text>
          <ContributionGrid
            data={contributionData}
            size="4x3"
            showLabels={true}
          />
        </View>

        {renderWidgets()}
        {renderRepositoryList()}

        {lastSyncTime && (
          <Text style={styles.lastSyncText}>
            마지막 동기화: {lastSyncTime.toLocaleString()}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userStats: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  changeUserButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeUserText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  yearSelector: {
    marginBottom: 20,
  },
  yearLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  yearButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  yearButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  yearButtonTextSelected: {
    color: '#fff',
  },
  contributionContainer: {
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  widgetsContainer: {
    marginBottom: 30,
  },
  widgetPreview: {
    marginRight: 16,
    alignItems: 'center',
  },
  widgetSizeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  repositoriesContainer: {
    marginBottom: 30,
  },
  repositoryList: {
    maxHeight: 300,
  },
  repositoryItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  repositoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  repositoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  repositoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  repositoryLanguage: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  repositoryStars: {
    fontSize: 12,
    color: '#666',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  startButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
});

export default MainScreen;
