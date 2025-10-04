import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
  TextInput as RNTextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/appStore';
import ContributionGrid from '../components/ContributionGrid';

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
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [inputUsername, setInputUsername] = useState('');

  useEffect(() => {
    console.log('🔵 [MainScreen] useEffect 실행');
    console.log('🔵 [MainScreen] username:', username);
    console.log('🔵 [MainScreen] selectedYear:', selectedYear);
    
    // 토큰 확인
    const checkToken = async () => {
      try {
        const ConfigModule = require('../native/ConfigModule').default;
        const token = await ConfigModule.getGithubToken();
        console.log('🔵 [MainScreen] Native 토큰:', token ? `${token.substring(0, 10)}...` : 'NULL');
      } catch (error) {
        console.error('❌ [MainScreen] 토큰 확인 실패:', error);
      }
    };
    checkToken();
    
    // 사용자명이 없으면 입력 다이얼로그 표시
    if (!username) {
      setTimeout(() => {
        setShowUsernameDialog(true);
      }, 500);
    } else {
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
    setInputUsername(username || '');
    setShowUsernameDialog(true);
  };

  const handleUsernameSubmit = () => {
    if (inputUsername && inputUsername.trim()) {
      setUsername(inputUsername.trim());
      setShowUsernameDialog(false);
      setInputUsername('');
    } else {
      Alert.alert('오류', '사용자명을 입력해주세요.');
    }
  };

  const handleUsernameCancel = () => {
    if (!username) {
      Alert.alert('알림', '사용자명을 입력해야 앱을 사용할 수 있습니다.');
    } else {
      setShowUsernameDialog(false);
      setInputUsername('');
    }
  };

  const getTodayContributions = (): number => {
    if (!contributionData) return 0;
    const today = new Date().toISOString().split('T')[0];
    return contributionData.contributionsByDay.get(today) || 0;
  };

  const getTotalContributions = (): number => {
    return contributionData?.totalContributions || 0;
  };

  // 연도 목록 생성 (최근 5년)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  // 사용자명 입력 다이얼로그
  const renderUsernameDialog = () => (
    <Modal
      visible={showUsernameDialog}
      transparent={true}
      animationType="fade"
      onRequestClose={handleUsernameCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>GitHub 사용자명</Text>
          
          <RNTextInput
            style={styles.modalInput}
            value={inputUsername}
            onChangeText={setInputUsername}
            placeholder="예: octocat"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleUsernameSubmit}
          />
          
          <View style={styles.modalButtons}>
            {username && (
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleUsernameCancel}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]} 
              onPress={handleUsernameSubmit}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!username) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>GitHub Contribution</Text>
          <Text style={styles.emptyMessage}>사용자명을 설정해주세요</Text>
        </View>
        {renderUsernameDialog()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 연도 선택 */}
        <View style={styles.yearContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {getYearOptions().map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton,
                  selectedYear === year && styles.yearButtonSelected,
                ]}
                onPress={() => setSelectedYear(year)}
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

        {/* 타이틀 */}
        <Text style={styles.title}>GitHub Contribution</Text>

        {/* 컨트리뷰션 카드 */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            {/* 가로 스크롤 가능한 그리드 */}
            <ContributionGrid
              data={contributionData}
              size="full"
              showLabels={false}
              weeks={52}
              cellSize={12}
            />

            {/* 오늘 컨트리뷰션 */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Today Contribution:</Text>
              <Text style={styles.statValue}>{getTodayContributions()}</Text>
            </View>

            {/* 전체 컨트리뷰션 */}
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Contribution:</Text>
              <Text style={styles.statValue}>{getTotalContributions()}</Text>
            </View>
          </View>
        </View>

        {/* 버튼 영역 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleRefresh}>
            <Text style={styles.buttonText}>새로고침</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonMargin]} 
            onPress={handleChangeUser}
          >
            <Text style={styles.buttonText}>사용자 변경</Text>
          </TouchableOpacity>
        </View>

        {/* 리포지토리 목록 타이틀 */}
        <Text style={styles.repoTitle}>리포지토리 목록</Text>

        {/* 리포지토리 목록 */}
        {repositories.length > 0 && (
          <FlatList
            data={repositories.slice(0, 10)}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.repoCard}>
                <Text style={styles.repoName}>{item.name}</Text>
                <Text style={styles.repoDescription} numberOfLines={2}>
                  {item.description || '설명 없음'}
                </Text>
                <Text style={styles.repoStats}>
                  ⭐ {item.stargazers_count} • 🍴 {item.forks_count}
                </Text>
              </View>
            )}
          />
        )}
      </ScrollView>

      {/* 사용자명 입력 다이얼로그 */}
      {renderUsernameDialog()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
  },
  yearContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  yearButtonSelected: {
    backgroundColor: '#6200ee',
  },
  yearButtonText: {
    fontSize: 14,
    color: '#333',
  },
  yearButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  card: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  gridScroll: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  buttonMargin: {
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  repoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  repoCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  repoName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  repoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  repoStats: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#6200ee',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MainScreen;
