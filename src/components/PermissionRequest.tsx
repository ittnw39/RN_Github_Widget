import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
import { LinearGradient } from 'react-native-linear-gradient';

interface PermissionRequestProps {
  onPermissionGranted: () => void;
}

const PermissionRequest: React.FC<PermissionRequestProps> = ({ onPermissionGranted }) => {
  const [permissions, setPermissions] = useState({
    notification: false,
    background: false,
    network: false,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const notificationPermission = await checkNotificationPermission();
    const backgroundPermission = await checkBackgroundPermission();
    const networkPermission = await checkNetworkPermission();

    setPermissions({
      notification: notificationPermission,
      background: backgroundPermission,
      network: networkPermission,
    });

    // 모든 권한이 허용되었으면 콜백 호출
    if (notificationPermission && backgroundPermission && networkPermission) {
      onPermissionGranted();
    }
  };

  const checkNotificationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
      return result === RESULTS.GRANTED;
    } else {
      // iOS는 알림 권한이 자동으로 요청됨
      return true;
    }
  };

  const checkBackgroundPermission = async (): Promise<boolean> => {
    // 백그라운드 권한은 시스템에서 자동으로 관리됨
    return true;
  };

  const checkNetworkPermission = async (): Promise<boolean> => {
    // 네트워크 권한은 AndroidManifest.xml에서 자동으로 허용됨
    return true;
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android') {
      const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
      if (result === RESULTS.GRANTED) {
        setPermissions(prev => ({ ...prev, notification: true }));
      }
    } else {
      // iOS는 첫 알림 요청 시 자동으로 권한 요청
      Alert.alert(
        '알림 권한',
        '알림을 받으려면 설정에서 알림 권한을 허용해주세요.',
        [
          { text: '나중에', style: 'cancel' },
          { text: '설정 열기', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const requestBackgroundPermission = () => {
    Alert.alert(
      '백그라운드 권한',
      '위젯이 정상적으로 작동하려면 백그라운드에서 데이터를 동기화할 수 있어야 합니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '설정 열기', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const requestNetworkPermission = () => {
    Alert.alert(
      '네트워크 권한',
      'GitHub 데이터를 가져오려면 인터넷 연결이 필요합니다.',
      [
        { text: '확인', style: 'default' },
      ]
    );
  };

  const handleSkip = () => {
    Alert.alert(
      '권한 건너뛰기',
      '일부 기능이 제한될 수 있습니다. 나중에 설정에서 권한을 허용할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '건너뛰기', onPress: onPermissionGranted },
      ]
    );
  };

  const allPermissionsGranted = Object.values(permissions).every(Boolean);

  if (allPermissionsGranted) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>
        <Text style={styles.title}>권한 설정</Text>
        <Text style={styles.subtitle}>
          GitHub 컨트리뷰션 위젯이 정상적으로 작동하려면 다음 권한이 필요합니다.
        </Text>

        <View style={styles.permissionList}>
          <View style={styles.permissionItem}>
            <Text style={styles.permissionTitle}>🔔 알림 권한</Text>
            <Text style={styles.permissionDescription}>
              컨트리뷰션 목표 달성 시 알림을 받을 수 있습니다.
            </Text>
            <TouchableOpacity
              style={[
                styles.permissionButton,
                permissions.notification && styles.permissionButtonGranted,
              ]}
              onPress={requestNotificationPermission}
            >
              <Text style={styles.permissionButtonText}>
                {permissions.notification ? '허용됨' : '허용하기'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionTitle}>🔄 백그라운드 권한</Text>
            <Text style={styles.permissionDescription}>
              위젯이 자동으로 업데이트되도록 합니다.
            </Text>
            <TouchableOpacity
              style={[
                styles.permissionButton,
                permissions.background && styles.permissionButtonGranted,
              ]}
              onPress={requestBackgroundPermission}
            >
              <Text style={styles.permissionButtonText}>
                {permissions.background ? '허용됨' : '설정 열기'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.permissionItem}>
            <Text style={styles.permissionTitle}>🌐 네트워크 권한</Text>
            <Text style={styles.permissionDescription}>
              GitHub에서 데이터를 가져올 수 있습니다.
            </Text>
            <TouchableOpacity
              style={[
                styles.permissionButton,
                permissions.network && styles.permissionButtonGranted,
              ]}
              onPress={requestNetworkPermission}
            >
              <Text style={styles.permissionButtonText}>
                {permissions.network ? '허용됨' : '확인'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>나중에 설정</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  permissionList: {
    marginBottom: 40,
  },
  permissionItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  permissionButtonGranted: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PermissionRequest;
