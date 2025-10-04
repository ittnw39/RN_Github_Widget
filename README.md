# GitHub Contribution Widget - React Native

GitHub 컨트리뷰션을 홈 화면 위젯으로 표시하는 React Native 앱입니다. 다양한 크기의 위젯을 지원하며, 백그라운드 동기화와 실시간 업데이트 기능을 제공합니다.

## 🚀 주요 기능

### 📱 다양한 크기의 위젯 지원
- **1x1, 2x1, 3x1, 4x1, 4x2, 4x3** 크기의 홈 화면 위젯
- 각 크기별로 최적화된 레이아웃과 표시 기간
- 위젯 클릭 시 메인 앱 실행

### 🔗 GitHub API 연동
- **REST API**: 사용자 정보, 저장소 목록 조회
- **GraphQL API**: 컨트리뷰션 데이터 (효율적인 단일 쿼리)
- 개발자 토큰 지원 (API 제한 해결)
- 네트워크 상태 확인 및 오프라인 지원

### 📊 컨트리뷰션 시각화
- 커스텀 ContributionGrid 컴포넌트 (바둑판 형태)
- 색상 레벨별 기여도 표시 (5단계)
- 연도별 데이터 조회 기능
- 요일/월 라벨 표시

### 🔄 백그라운드 동기화
- 주기적 데이터 업데이트 (3시간마다)
- 위젯 새로고침 버튼 (4x2, 4x3 위젯)
- 브로드캐스트를 통한 실시간 업데이트

### 👤 사용자 관리
- AsyncStorage를 통한 사용자명 저장
- 첫 실행 시 사용자명 설정 다이얼로그
- 사용자 변경 기능

## 🛠 기술 스택

- **React Native 0.81.4**
- **TypeScript**
- **Zustand** (상태 관리)
- **Axios** (HTTP 클라이언트)
- **GraphQL** (GitHub API)
- **React Native SVG** (그래프 렌더링)
- **React Native Paper** (UI 컴포넌트)
- **AsyncStorage** (로컬 저장소)

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
# 또는
yarn install
```

### 2. iOS 설정 (iOS만 해당)

```bash
cd ios && pod install && cd ..
```

### 3. 개발 서버 시작

```bash
npm start
# 또는
yarn start
```

### 4. 앱 실행

#### Android
```bash
npm run android
# 또는
yarn android
```

#### iOS
```bash
npm run ios
# 또는
yarn ios
```

## 🔧 개발자 설정

### GitHub 토큰 설정 (선택사항)

API 제한을 피하기 위해 GitHub Personal Access Token을 설정할 수 있습니다:

1. GitHub에서 토큰 생성:
   - Settings → Developer settings → Personal access tokens
   - `public_repo`, `read:user` 권한 선택

2. 앱에서 토큰 설정:
   - 앱 내 설정에서 토큰 입력
   - 또는 환경변수로 설정

## 📱 필요한 권한

### Android 권한
- **INTERNET**: GitHub API 통신
- **ACCESS_NETWORK_STATE**: 네트워크 상태 확인
- **BIND_APPWIDGET**: 위젯 기능
- **WAKE_LOCK**: 백그라운드 작업
- **FOREGROUND_SERVICE**: 백그라운드 동기화
- **POST_NOTIFICATIONS**: 알림 (Android 13+)
- **RECEIVE_BOOT_COMPLETED**: 부팅 시 자동 시작

### iOS 권한
- **NSAppTransportSecurity**: 안전한 네트워크 통신
- **UIBackgroundModes**: 백그라운드 작업
- **NSUserNotificationsUsageDescription**: 알림 권한

### 권한 요청 과정
1. 앱 첫 실행 시 권한 요청 화면 표시
2. 각 권한별 설명과 함께 허용/거부 선택
3. 권한 거부 시에도 앱 사용 가능 (일부 기능 제한)
4. 나중에 설정에서 권한 변경 가능

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── ContributionGrid.tsx
│   └── Widget.tsx
├── screens/            # 화면 컴포넌트
│   └── MainScreen.tsx
├── services/           # 비즈니스 로직
│   ├── api.ts
│   ├── backgroundSync.ts
│   └── widgetService.ts
├── store/              # 상태 관리
│   └── appStore.ts
├── types/              # TypeScript 타입 정의
│   └── index.ts
├── constants/          # 상수 정의
│   └── index.ts
└── native/             # 네이티브 모듈
    └── WidgetModule.ts
```

## 🐛 기존 이슈 해결

### 1. 위젯 업데이트 로직 개선
- 기존: 각 위젯 Provider마다 개별 업데이트 로직
- 개선: 통합된 위젯 관리 시스템으로 일관성 보장

### 2. 메모리 관리 최적화
- 기존: GlobalScope 사용으로 메모리 누수 위험
- 개선: React Native 생명주기에 맞춘 상태 관리

### 3. UI 레이아웃 개선
- 기존: 하드코딩된 그리드 레이아웃
- 개선: 동적 SVG 기반 반응형 레이아웃

### 4. 데이터 처리 최적화
- 기존: 복잡한 날짜 계산 로직
- 개선: 단순화된 날짜 처리 및 캐싱 시스템

## 🚀 배포

### Android
```bash
cd android
./gradlew assembleRelease
```

### iOS
```bash
cd ios
xcodebuild -workspace rn_github_widget.xcworkspace -scheme rn_github_widget -configuration Release
```

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request