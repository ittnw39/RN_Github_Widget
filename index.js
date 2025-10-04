/**
 * @format
 */

console.log('🔴 [index.js] 파일 로드됨');

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('🔴 [index.js] appName:', appName);
console.log('🔴 [index.js] App 컴포넌트 등록 중...');

AppRegistry.registerComponent(appName, () => App);

console.log('🔴 [index.js] 앱 등록 완료');
