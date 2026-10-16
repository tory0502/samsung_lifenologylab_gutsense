# GutSense 실행 가이드

GutSense는 Capacitor 기반 하이브리드 모바일 게임 앱(장 생태계 디지털 트윈)입니다. 웹 레이어는 정적 파일(`index.html` + JS 모듈)로 구성되어 별도 빌드 없이 브라우저에서 바로 실행되며, 동일한 코드가 Android/iOS 네이티브 앱으로 패키징됩니다.

---

## 1. PC 로컬호스트에서 실행 (가장 빠름, 권장)

### 옵션 A — Python 내장 서버 (권장, 별도 설치 불필요)
```powershell
cd C:\Users\woosungJang\Desktop\ws\gutsense\code\www
python -m http.server 8000
```
브라우저에서 **http://localhost:8000/** 열기. `Ctrl+C`로 종료.

### 옵션 B — Node http-server
```powershell
npx http-server www -p 8000
```

### 옵션 C — 파일 직접 열기 (제한적)
`www/index.html`을 브라우저로 드래그. 단 `file://` 프로토콜에서는 `localStorage` 제한이 있을 수 있어 **localhost 서버 권장**.

### 모바일 뷰로 보기 (필수)
Chrome DevTools 열기(`F12`) → 디바이스 토글(`Ctrl+Shift+M`) → **iPhone 12 Pro / Pixel 5 / Responsive 440×920** 선택. 앱은 **440px 폭**에 최적화.

### 첫 실행 흐름
1. **시스템 보정 부팅 시퀀스** (~2.7초, 최초 1회) → ENTER
2. **온보딩** — 삼성생명 로그인(시뮬레이션) 또는 이메일 없이 시작
3. **개인 프로파일 보정** — 이름/성별/나이/라이프스타일/아바타 → "디지털 트윈 생성"
4. **홈 (게임 월드 맵)** — 구불구불 대장 로드 + 6개 스테이지 노드 + HP/MP/SP + Dr.장
5. 각 스테이지 탭하여 탐험: 장 맵 → 식단 입력 → AI 내시경 → 퀘스트 → 이상 감지 → 프로필

### 데모 시연 시나리오
1. 홈에서 **식단 입력(Stage 2)** 노드 탭
2. 직접 입력 모드에서 **라면 + 저당과자** 선택 → "장 속으로 →" 포털 클릭
3. **4막 씬 "한 끼의 여정"** 재생 (선택 → 침투 → 파급 → Dr.장)
4. 씬 종료 후 **장 맵(Stage 1)** 에서 루핑 leaky gut 비디오 + 균열 확인
5. **퀘스트(Stage 4)** 에서 48시간 리셋 챌린지 시작
6. 홈 우측 상단 🌙 아이콘으로 **다크 랩 모드** 토글

---

## 2. Android 앱으로 실행 (Capacitor)

### 사전 요구사항
- Node.js 18+
- Android Studio (Hedgehog 이상)
- JDK 17 (Android Studio 번들)
- Android SDK (API 23+)

### 빌드 단계
```powershell
# 1. 의존성 설치 (최초 1회)
npm install

# 2. 웹 자산 → Android 동기화 (코드 변경 후 매번)
npm run sync
# 또는: npx cap sync android

# 3-a. Android Studio에서 실행 (권장)
npm run android:open
# ▶ Run 버튼 클릭 (에뮬레이터 또는 USB 실기기)

# 3-b. CLI 직접 실행
npm run android:run
```

### 에뮬레이터 준비
Android Studio → Device Manager → Create Device → **Pixel 7 (API 34)** 권장.

### 실기기 디버그
1. 폰 개발자 옵션 활성화 (빌드번호 7회 탭)
2. USB 디버깅 켜기 → PC 연결
3. `npm run android:run`

---

## 3. Play 스토어 배포 (AAB 서명 빌드)

### 사전: 서명 키스토어 생성 (최초 1회)
```powershell
keytool -genkey -v -keystore gutsense.keystore -alias gutsense -keyalg RSA -keysize 2048 -validity 10000
```
**비밀번호와 .keystore 파일 안전한 곳에 백업 (분실 시 업데이트 불가).**

### android/app/build.gradle 서명 설정
```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../gutsense.keystore")
            storePassword "YOUR_STORE_PASSWORD"
            keyAlias "gutsense"
            keyPassword "YOUR_KEY_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### AAB 빌드 (Play 스토어 필수 포맷)
```powershell
cd android
.\gradlew bundleRelease
# 산출물: android/app/build/outputs/bundle/release/app-release.aab
```

### Play Console 업로드
1. https://play.google.com/console → 앱 생성
2. **프로덕션** → 새 버전 만들기 → `.aab` 업로드
3. 앱 정보, 스토어 등록, 콘텐츠 등급, 개인정보 처리방침 입력
4. 검토 후 게시 (신규 앱은 검토에 1~7일 소요)

상세 가이드: https://capacitorjs.com/docs/android/deploying-to-google-play

---

## 4. iOS (참고)

macOS 필요:
```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```
Xcode에서 서명 설정 후 빌드. App Store 배포는 Apple Developer 계정($99/년) 필요.

---

## 5. 프로젝트 구조

```
code/
├─ www/                      # 웹 레이어 (Capacitor webDir)
│  ├─ index.html             # 앱 셸 (CSS + 부팅 시퀀스 + 스크립트 로드)
│  ├─ assets/
│  │  ├─ video/              # good/bad_leaky_gut.mp4 (루핑 재생)
│  │  └─ img/                # DR_JANG_1..5.png, gut_map_game.png
│  └─ js/
│     ├─ data.js             # 도메인 데이터 + 코어 메트릭 + Dr.장 라이브러리 + 게임 맵 노드
│     ├─ store.js            # localStorage 영속성 + 코어 메트릭/스트릭/씬/리셋 파생
│     ├─ ui.js               # 게임 UI 컴포넌트 (drJang/gameBar/glassCard/dopaChar/leakyVideo 등)
│     ├─ nav.js              # 라우팅 셸
│     ├─ game.js             # 4막 "한 끼의 여정" 씬 엔진 + 48시간 리셋 피날레
│     └─ screens/
│        ├─ onboarding.js    # 보정(calibration) 프레이밍
│        ├─ home.js          # 게임 월드 맵 (구불구불 대장 로드 + 6 노드)
│        ├─ gutmap.js        # 장 맵 (캐릭터 부위 + HP/MP/SP + 루핑 비디오)
│        ├─ diet.js          # 식단 입력 (씬 트리거 + 게임 포털)
│        ├─ endoscope.js     # AI 내시경 (concat 루핑 영상)
│        ├─ quest.js         # 퀘스트 (Dr.장 NPC + 스트릭 + 48시간 리셋)
│        ├─ alert.js         # 이상 감지 (5컷 인과 사슬 + 게임형 랭크)
│        └─ profile.js       # 캐릭터 시트
├─ android/                  # Capacitor Android 네이티브
├─ capacitor.config.json     # appId: com.gutsense.app, webDir: www
├─ package.json              # Capacitor v7
└─ imgs/, video/             # 원본 PNG/MP4 소스
```

### 게임 시스템 아키텍처
- **3대 코어 지표** (CORE.pdf 기반, 인과 연결): 장벽 투과성(LPS↑→균열) · 전신 염증(장 날씨: 맑음/흐림/폭풍) · 도파미니(생기/둔감/탈진, 비대칭 회복, 염증 상한선)
- **Dr.장 NPC**: 5 포즈 × 상황별 말풍선 (환영/경고/격려/축하/설명)
- **스트릭 시스템**: 연속 퀘스트 완료일 (브론즈→실버→골드→플래티넘→다이아→마스터)
- **4막 씬 엔진**: 식단 선택 → 융모 침투 → 혈류→뇌 파급 → Dr.장 회복 유도 (피로도 관리로 축약 모드 전환)
- **48시간 리셋 챌린지**: 균열 아물음 + 날씨 맑음 + 도파민 제한 해제 동시 컷신

### 데이터 수정
- 음식: `www/js/data.js`의 `FOODS` 배열
- 장 부위: 같은 파일의 `GUT_ZONES`
- 퀘스트: `QUESTS` 배열
- 색 토큰: `C` 객체에서 중앙 관리 (새 hex 금지, `C.*` 재사용)

### 화면 추가
1. `www/js/screens/새화면.js` — IIFE 패턴
2. `index.html`의 `<script>` 목록에 추가
3. `nav.js`의 `MENU` / `GAME_MAP_NODES`에 진입점 추가

---

## 6. 문제 해결

| 증상 | 해결 |
|------|------|
| 흰 화면 | F12 콘솔 확인 — 보통 JS 문법 에러. `node --check www/js/*.js www/js/screens/*.js`로 검사 |
| Android 빌드 실패 | `npm run sync` 후 재시도. JDK 17 / SDK 23+ 확인 |
| 삼성생명 로그인 안 됨 | 정상 — 데모 모드는 시뮬레이션. 실제 연동은 백엔드+API 키 필요 |
| 데이터 초기화됨 | localStorage는 브라우저/앱 데이터 삭제 시 날아감. 온보딩부터 재진행 |
| 영상 안 재생 | 모바일은 `muted + autoplay + playsinline` 필수 (이미 적용됨). localhost 서버로 실행 권장 |
| 부팅 시퀀스 다시 보고 싶음 | DevTools → Application → Local Storage → `gutsense_v2` → `introSeen:false`로 변경 후 새로고침 |

---

## 7. 데모 데이터 초기화

- 브라우저: DevTools → Application → Local Storage → `gutsense_v2` 삭제 후 새로고침
- 앱 내: 프로필(Stage 6) → "데이터 삭제"

