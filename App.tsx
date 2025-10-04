/**
 * GitHub Contribution Widget App
 * React Native implementation of GitHub contribution widget
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppStore } from './src/store/appStore';
import MainScreen from './src/screens/MainScreen';
import PermissionRequest from './src/components/PermissionRequest';

function App() {
  console.log('🟢 [App] 렌더링 시작');
  
  const isDarkMode = useColorScheme() === 'dark';
  const { username, loadUserData, loadContributionData } = useAppStore();
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    console.log('🟢 [App] useEffect - username:', username, 'permissionsGranted:', permissionsGranted);
    
    // 토큰 확인
    const checkToken = async () => {
      try {
        console.log('🟢 [App] 토큰 로드 시작...');
        const ConfigModule = require('./src/native/ConfigModule').default;
        console.log('🟢 [App] ConfigModule 로드됨:', !!ConfigModule);
        const token = await ConfigModule.getGithubToken();
        console.log('🟢 [App] 토큰 결과:', token ? `${token.substring(0, 15)}...` : 'NULL 또는 빈 문자열');
      } catch (error) {
        console.error('❌ [App] 토큰 로드 실패:', error);
      }
    };
    checkToken();
    
    // 앱 시작 시 저장된 사용자명으로 데이터 로드
    if (username && permissionsGranted) {
      loadUserData(username);
      loadContributionData(username);
    }
  }, [username, permissionsGranted, loadUserData, loadContributionData]);

  const handlePermissionGranted = () => {
    setPermissionsGranted(true);
  };

  if (!permissionsGranted) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar 
            barStyle="light-content" 
            backgroundColor="transparent"
            translucent
          />
          <PermissionRequest onPermissionGranted={handlePermissionGranted} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar 
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <MainScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
