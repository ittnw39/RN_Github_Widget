/**
 * GitHub Contribution Widget App
 * React Native implementation of GitHub contribution widget
 *
 * @format
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { useAppStore } from './src/store/appStore';
import MainScreen from './src/screens/MainScreen';
import PermissionRequest from './src/components/PermissionRequest';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const { username, loadUserData, loadContributionData } = useAppStore();
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
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
        <PaperProvider>
          <StatusBar 
            barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent
          />
          <MainScreen />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
