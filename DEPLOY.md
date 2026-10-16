# GutSense — 하이브리드 앱 배포 가이드 (Android + iOS)

> **결론부터.** 현재 `www/` 앱(바닐라 JS, 프레임워크 없음, 빌드 단계 없음)은 **네이티브 하이브리드
> 앱으로 양 스토어에 배포 가능**하다. 가장 권장되는 경로는 **Capacitor**(Ionic)로 웹 자산을
> 네이티브 셸로 감싸는 것이며, Android는 **TWA(Trusted Web Activity)** 도 대안이다.
>
> 이 문서는 (1) Capacitor 래핑 절차, (2) 양 스토어 요구사항/비용/심사, (3) **실제 배포 전
> 핸드폰에서 "앱처럼" 시뮬레이션하는 4가지 방법**을 다룬다.

---

## 0. 사전 확인 — 이 앱의 배포 친화도

현재 `www/` 앱은 이미 하이브리드 배포에 유리한 구조다:

| 항목 | 상태 | 비고 |
|---|:---:|---|
| 프레임워크 의존성 없음 | ✅ | 바닐라 JS, 빌드 불필요 |
| `viewport-fit=cover` | ✅ | 노치/안전영역 대응 (index.html L5) |
| `theme-color` 메타 | ✅ | `#F4F8FE` (index.html L6) |
| 상태 저장 localStorage | ✅ | `store.js` — WebView에서도 영속 |
| 안전영역 `env(safe-area-inset-*)` | ✅ | 백버튼/상태필에 이미 사용 |
| 외부 fetch/CORS 없음 | ✅ | 완전 자급자족 오프라인 |
| **⚠️ browser-sync 스크립트 태그** | ❌ | index.html L305 — **배포 전 제거 필수** |

> **배포 전 필수 수정:** `index.html`의 `<script async src="/browser-sync/browser-sync-client.js"></script>`
> 라인은 개발용 라이브 리로드 스크립트다. 프로덕션 빌드에서는 404 + 지연을 유발하므로 **반드시
> 제거** 또는 조건부 로드로 변경.

---

## 1. 권장 경로: Capacitor (Ionic)

Capacitor는 Cordova의 후속으로, 웹 앱을 네이티크 Android(iOS) WebView 셸로 감싸준다. 빌드
단계가 없는 바닐라 JS 앱에 가장 적합하다. 현재 메이저 버전은 **Capacitor 7**(2025년 기준)이며,
API는 안정적이다.

### 1.1 왜 Capacitor인가
| | Capacitor | Cordova | TWA(PWA) |
|---|---|---|---|
| 유지보수 | ✅ 활발 | ⚠️ 레거시 | ✅ |
| 빌드 단계 불필요 | ✅ | ⚠️ | ✅ |
| 네이티브 플러그인 | ✅ 풍부 | ✅ | ❌ |
| iOS 지원 | ✅ | ✅ | ❌ (Android 전용) |
| Apple 심사 통과 | ✅ 원활 | ⚠️ | ❌ (PWA 래퍼는 4.2 리스크) |

### 1.2 프로젝트 래핑 절차

> 전제: [Node.js](https://nodejs.org) LTS 설치됨. iOS 빌드은 **macOS 필수**(Xcode 필요).

```bash
# 1) www/ 안에서 npm 프로젝트 초기화
cd www
npm init -y

# 2) Capacitor 설치
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# 3) 초기화 — webDir를 현재 디렉터리로 (index.html이 www 루트에 있으므로)
npx cap init "GutSense" "com.gutsense.app" --web-dir=.

# 4) 네이티브 프로젝트 추가
npx cap add android
npx cap add ios

# 5) 웹 자산 동기화 (이후 코드 바뀔 때마다 반복)
npx cap sync

# 6) IDE에서 열기
npx cap open android   # Android Studio 열림
npx cap open ios       # Xcode 열림 (macOS만)
```

### 1.3 `capacitor.config.json` 핵심 설정

`npx cap init`이 생성하는 설정 파일. 이 앱에 맞춰 아래처럼 다듬는다:

```json
{
  "appId": "com.gutsense.app",
  "appName": "GutSense",
  "webDir": ".",
  "server": {
    "androidScheme": "https",
    "iosScheme": "capacitor"
  },
  "android": {
    "backgroundColor": "#F4F8FE"
  },
  "ios": {
    "scrollEnabled": false,
    "limitsNavigationsToAppBoundDomains": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 1200,
      "backgroundColor": "#F4F8FE",
      "showSpinner": false
    }
  }
}
```

> **`webDir` 주의:** 보통 Capacitor는 `webDir: "dist"`(빌드 출력)를 쓴다. 이 앱은 빌드가
> 없으므로 `webDir: "."`로 설정해 `www/` 자체가 웹 루트가 되게 한다.

### 1.4 앱 아이콘 / 스플래시
- **Icon:** 1024×1024 마스터 이미지 준비 → Android는 `android/app/src/main/res/mipmap-*/`,
  iOS는 Xcode Asset Catalog(`AppIcon.appiconset`)에 배치.
- **Splash:** `@capacitor/splash-screen` 플러그인 + `#F4F8FE` 배경 (삼성 테마 유지).
- 자동 생성 도구: `npm install -D @capacitor/assets` → `npx capacitor-assets generate`.

---

## 2. 양 스토어 요구사항 / 비용 / 심사

### 2.1 Google Play (Android)

| 항목 | 내용 |
|---|---|
| 개발자 계정 비용 | **$25 일회성** (Google Play Console) |
| 필요 도구 | Android Studio (Windows/macOS/Linux) |
| 빌드 산출물 | **AAB** (Android App Bundle, `.aab`) — APK 아님 |
| 심사 소요 | 보통 1~3일 (신규 계정은 최대 7일) |
| 주요 요구사항 | 데이터 안전성 양식, 콘텐츠 등급, 개인정보처리방침(URL 필요), 타겟 API 레벨 최신(현재 34/35) |

**빌드 명령** (Android Studio 안에서):
1. `npx cap sync android`
2. `npx cap open android`
3. Android Studio → **Build → Generate Signed Bundle / APK → AAB**
4. 키스토어 생성(최초 1회, 안전 보관 필수)
5. 완성된 `.aab`를 Play Console에 업로드

### 2.2 Apple App Store (iOS)

| 항목 | 내용 |
|---|---|
| 개발자 계정 비용 | **$99/년** (Apple Developer Program) |
| 필요 도구 | **macOS + Xcode** (Windows에서 iOS 빌드 불가) |
| 빌드 산출물 | **IPA** (`.ipa`) — TestFlight/ App Store 업로드 |
| 심사 소요 | 보통 1~3일, 신규 앱은 최대 7일 |
| 주요 요구사항 | 앱 프라이버시 "영양 성분표", 개인정보처리방침, 4.2 최소 기능성 충족 |

**빌드 명령** (Xcode 안에서):
1. `npx cap sync ios`
2. `npx cap open ios`
3. Xcode → Signing & Capabilities → Team 선택 (Apple ID)
4. **Product → Archive** → Organizer 열림
5. **Distribute App → App Store Connect** 업로드
6. App Store Connect에서 심사 제출

### 2.3 ⚠️ Apple 4.2 "최소 기능성" — WebView 앱 리스크

Apple은 "단순 웹사이트 래퍼" 앱을 **4.2 리젝**한다. 이 앱은 오프라인 자급자족 + localStorage
영속 + 풍부한 인터랙션을 갖췄으므로 기준은 통과하지만, 심사 통과율을 높이려면:

- ✅ **오프라인 동작 강조** (네트워크 없이도 완전 작동 — 이미 충족)
- ✅ **네이티브 기능 최소 1개 추가**: 햅틱(`@capacitor/haptics`), 로컬 알림, 생체인증
  (`@capacitor/biometric-auth`) — "이건 단순 웹이 아니다" 증명
- ✅ **온보딩/튜토리얼** — 앱 고유의 흐름 강조 (현재 온보딩 있음 ✅)
- ✅ **iOS 네이티브 UI 패턴 일부 차용** (스와이프 백 제스처 등)
- ❌ 웹사이트를 WebView로 로드하는 패턴은 절대 금지 (이 앱은 로컬 자산이므로 안전)

### 2.4 공통 준비물 체크리스트
- [ ] 앱 아이콘 1024×1024
- [ ] 스크린샷 6.7"(iPhone)/7"(태블릿)/Android 다양한 해상도
- [ ] **개인정보처리방침 URL** (HTTPS 호스팅 필수 — GitHub Pages 무료 가능)
- [ ] 앱 설명 (한국어/영어)
- [ ] 지원 이메일
- [ ] 연령 등급 설문
- [ ] 데이터 수집 여부 양식 (이 앱은 localStorage만 쓰므로 "데이터 수집 안 함" 가능 — 단 UPGRADE.md 축1-(B)에서 외부 API 연동 시 재작성 필요)

---

## 3. 📱 실제 배포 전 — 핸드폰에서 "앱처럼" 시뮬레이션하는 4가지 방법

> 네이티브 패키징 전에 실제 기기에서 앱 동작을 확인하는 방법. 빠른 순서로 정렬.

### 방법 1: PWA "홈 화면에 추가" (가장 빠름, 5분)

가장 빠르게 "실제 앱처럼" 핸드폰에서 켜보는 방법. PWA 매니페스트 + 약간의 메타만 추가하면
브라우저 주소창 없이 풀스크린으로 실행된다.

**필요 작업:**

**(a)** `www/manifest.json` 생성:
```json
{
  "name": "GutSense",
  "short_name": "GutSense",
  "start_url": "./index.html",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#F4F8FE",
  "theme_color": "#F4F8FE",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**(b)** `index.html` `<head>`에 추가 (iOS Safari는 매니페스트를 부분만 읽으므로 메타 병행):
```html
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icon-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="GutSense">
<meta name="mobile-web-app-capable" content="yes">
```

**(c)** 정적 호스팅 (HTTPS 필요 — 로컬도 가능):
```bash
# Python 내장 서버 (LAN 내 폰에서 접속)
cd www
python -m http.server 8000
# 폰에서 http://<PC_IP>:8000 접속 (같은 Wi-Fi)
```
또는 **ngrok**으로 HTTPS 터널:
```bash
ngrok http 8000   # https://xxxx.ngrok.io 제공
```

**(d)** 폰에서 실행:
- **Android Chrome:** 메뉴 ⋮ → **홈 화면에 추가** → 런처 아이콘 생성 → 풀스크린 실행
- **iOS Safari:** 공유 → **홈 화면에 추가** → 아이콘 탭 → 주소창 없이 실행

> 이 방법은 100% 진짜 앱 경험(풀스크린, 런처, 햅틱 일부)을 주지만, **WebKit/iOS에서는
> `navigator.vibrate` 미지원, 백그라운드 제한** 등 네이티브와 차이가 있다. 배포 전 1차
> 체크용으로 최적.

### 방법 2: Capacitor `run` — 실제 네이티브 WebView에서 실행 (정확도 최고)

실제 네이티브 APK/IPA를 폰에 직접 설치해 구동. **배포 환경과 100% 동일**하므로 최종 체크용.

**사전 준비:**
- Android: 폰을 **개발자 모드 + USB 디버깅** 켜고 USB 연결
- iOS: 폰을 USB 연결, Apple ID로 Xcode 서명 (유료 계정 필요)

```bash
cd www

# Android (USB 연결된 기기에 직접 설치 실행)
npx cap run android

# iOS (USB 연결된 iPhone에 직접 설치 실행, macOS만)
npx cap run ios
```

코드를 바꿀 때마다 `npx cap sync` → `npx cap run` 으로 즉시 폰에 반영된다. **이 방법이
실제 앱 동작을 가장 정확히 재현**한다 (햅틱, WebView 정책, 안전영역 전부 진짜).

### 방법 3: 에뮬레이터 / 시뮬레이터 (기기 없이)

실제 폰 없이 데스크톱에서 네이티브 환경 시뮬레이션.

```bash
# Android Studio → Device Manager → 가상 기기(AVD) 생성 후
npx cap run android   # 기기 선택 프롬프트에서 에뮬레이터 선택

# iOS (macOS만)
npx cap run ios       # Simulator 자동 부팅
```

> 에뮬레이터는 **햅틱·카메라·블루투스** 등 하드웨어 기능을 흉내 낼 순 없지만, 레이아웃/안전영역/
> WebView 정책 확인엔 충분하다.

### 방법 4: 브라우저 DevTools 모바일 에뮬레이션 (개발 중 1차)

가장 기본. Chrome / Edge / Safari DevTools의 디바이스 모드.

- Chrome: F12 → 토글 디바이스 툴바(Ctrl+Shift+M) → iPhone 12 Pro / Galaxy S20 등 선택
- iOS Safari: 개발 메뉴 → Simulator 사용 (macOS)
- **제한:** 진짜 터치/햅틱/WebView 정책은 재현 안 됨. 레이아웃 점검용.

> 현재 `index.html`에 포함된 **browser-sync** 스크립트가 이 방법과 짝이다 — 코드 저장 시
> 자동 리로드. 단 배포 전엔 제거(§0 참고).

### 요약: 언제 뭘 쓰나

| 목적 | 추천 방법 |
|---|:---:|
| 빠른 레이아웃 점검 (개발 중) | 4 (DevTools) |
| 진짜 폰에서 "앱 느낌" 빠르게 보기 | 1 (PWA 추가) |
| 정확한 네이티브 동작 검증 | 2 (Capacitor run) |
| 폰 없이 시연 | 3 (에뮬레이터) |
| **배포 직전 최종 QA** | **2 (Capacitor run) — 이것만 진짜** |

---

## 4. 이 앱 특유의 WebView 호환성 메모

UPGRADE.md의 기능들을 네이티브로 가져갈 때 주의할 플랫폼 차이:

| API | Android WebView | iOS WKWebView | 비고 |
|---|:---:|:---:|---|
| `localStorage` | ✅ 영속 | ✅ 영속 | 이 앱 상태 저장 — 양쪽 OK |
| `navigator.vibrate()` | ✅ | ❌ | UPGRADE D6 햅틱 — iOS는 `@capacitor/haptics` 플러그인 필요 |
| Web Speech (synthesis) | ✅ | ✅ (한국어 음성 제한적) | UPGRADE D7 — iOS 한국어 TTS 품질 낮음 |
| Web Speech (recognition) | ⚠️ | ❌ | 음성 입력 — iOS는 서드파티 필요 |
| **Web Bluetooth** | ✅ | ❌ | UPGRADE 축1-(B) 워치 연동 — **iOS 불가**, 플러그인 필요 |
| `getUserMedia` (카메라) | ✅ | ✅ (권한 필요) | UPGRADE 축9 AR — 양쪽 OK |
| WebXR / AR.js | ⚠️ 부분 | ❌ | AR — Android에서만 제한적, iOS는 다른 접근 필요 |
| Service Worker (PWA) | ✅ | ✅ | 오프라인 캐싱 — 양쪽 OK |

> **핵심:** UPGRADE.md 축1-(B) "Web Bluetooth 워치 연동"은 **iOS에서 작동 안 함**. 네이티브
> 배포 시 iOS용은 `@capacitor-community/bluetooth-le` 또는 HealthKit 플러그인(`@capacitor/
> healthkit`)으로 우회해야 한다. 이 제약을 데모 기획 단계에서 알아둘 것.

---

## 5. 추천 배포 파이프라인 (한 줄 요약)

```
[개발: DevTools 모바일 + browser-sync]
        ↓
[1차 폰 체크: PWA "홈 화면에 추가"]  ← 가장 빠름
        ↓
[정확도 검증: Capacitor run (USB)]
        ↓
[에뮬레이터: 멀티 디바이스 스크린샷]
        ↓
[배포: AAB → Play / IPA → App Store]
```

### 최소 비용 요약
| 항목 | 비용 |
|---|---|
| Google Play Console | $25 일회성 |
| Apple Developer Program | $99/년 |
| 도메인(개인정보처리방침용) | ~$10/년 (또는 GitHub Pages 무료) |
| macOS(iOS 빌드용) | 없으면 클라우드 Mac($20~40/월) 또는 지인 차용 |
| **총 초기 비용** | **~$124 + macOS 접근 수단** |

---

## 6. 결론

> 이 앱은 **이미 하이브리드 배포에 최적화된 구조**(오프라인 자급, 빌드 불필요, 안전영역 대응)
> 다. **Capacitor 한 번 래핑 + browser-sync 스크립트 제거 + PWA 매니페스트 추가**면 양 스토어
> 배포가 가능하다. 가장 빠른 시연 경로는 **PWA "홈 화면에 추가"**(5분), 가장 정확한 검증은
> **Capacitor run**(USB 직접 설치)다. iOS 4.2 심사 리스크는 오프라인 자급 + 네이티브 햅틱
> 1개 추가로 충분히 회피 가능하다.
