# Android Play Store 배포 가이드 — GutSense

본 가이드는 완성된 Capacitor 앱을 Google Play Store에 게시하기 위한 절차를 다룹니다. Capacitor v7 기준이며, 2025년 현재 Play Console 정책을 반영합니다.

---

## 0. 사전 체크리스트

- [ ] Google Play Developer 계정 ($25 일회성, [play.google.com/console/signup](https://play.google.com/console/signup))
- [ ] 앱 아이콘 (512×512 PNG), 적어도 1개의 스크린샷 (1920×1080 이상)
- [ ] 앱 서명 키 (keystore) — 아래에서 생성
- [ ] 앱 버전 코드/번호 결정
- [ ] 개인정보처리방침 URL (필수)
- [ ] 데이터 안전성 설문 응답 준비 (건강 데이터 수집 여부 등)

---

## 1. 앱 버전 설정

`android/app/build.gradle`의 `defaultConfig`에서:
```gradle
defaultConfig {
    applicationId "com.gutsense.app"     // capacitor.config.json의 appId와 일치
    minSdkVersion 23                       // Android 6.0+ (Capacitor v7 요구)
    targetSdkVersion 34                    // Play 정책 요구 (2025년 기준 34)
    versionCode 1                          // 정수,每次 출시마다 +1
    versionName "1.0.0"                    // 사용자에게 표시되는 버전
}
```

> **중요**: `versionCode`는 후속 업로드마다 반드시 증가해야 합니다. `versionName`은 임의 문자열이지만 `versionCode`는 단조 증가해야 합니다.

---

## 2. 앱 서명용 Keystore 생성

최초 1회만 수행. keystore 파일과 비밀번호는 **절대 분실 금지** — 분실하면 앱 업데이트 불가.

```powershell
keytool -genkey -v -keystore gutsense-upload.keystore -alias gutsense -keyalg RSA -keysize 2048 -validity 10000
```

프롬프트에 따라 입력:
- 비밀번호 (keystore + key 각각)
- 이름/조직/도시 등 (임의 가능하지만 기록 권장)

백업: 생성된 `gutsense-upload.keystore` 파일을 안전한 곳(클라우드 + 오프라인)에 2곳 이상 백업.

---

## 3. Gradle에 서명 설정

`android/app/build.gradle`에 release signing config 추가:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../gutsense-upload.keystore')  // android/ 폴더 기준 상대경로
            storePassword '****'   // 실제 비밀번호 (또는 환경변수 사용)
            keyAlias 'gutsense'
            keyPassword '****'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false    // ProGuard 활성화 시 true + 규칙 작성
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

> **보안 권장**: 비밀번호를 build.gradle에 하드코딩하지 말고 `local.properties` 또는 환경변수에서 읽기. Git에 커밋 금지.

---

## 4. 웹 자산 동기화 및 빌드

```powershell
# 1. 웹 자산 최신화
npm run sync              # = cap sync android

# 2. release AAB 빌드 (권장 — Play Store는 .aab만 허용)
cd android
.\gradlew assembleRelease
# 출력: android/app/build/outputs/bundle/release/app-release.aab
#       또는 app/build/outputs/apk/release/app-release.apk (APK 필요 시)

cd ..
```

또는 Capacitor CLI로 직접:
```powershell
npx cap build android --keystorepath gutsense-upload.keystore --keystorepass **** --keystorealias gutsense --keystorealiaspass ****
```

---

## 5. Play App Signing (권장)

Google은 Play App Signing을 권장/사실상 필수화했습니다:
1. 업로드 키(사용자가 관리)로 서명한 `.aab` 업로드
2. Google이 앱 서명 키(별도)로 최종 사용자에게 배포되는 APK 재서명
3. 업로드 키 분실 시 Google을 통해 재설정 가능 (앱 서명 키 분실과 다름)

최초 앱 생성 시 Play Console에서 "Use Google-generated key" 선택하면 자동 처리됨.

---

## 6. Play Console 앱 생성

1. [Play Console](https://play.google.com/console) → **Create app**
2. 앱 정보 입력:
   - **App name**: GutSense
   - **Default language**: 한국어
   - **App type**: App
   - **Pricing**: Free (또는 Paid)
3. 선언 서약 모두 체크 (미국 수출 규제, 가족 정책 등)

---

## 7. 스토어 등록 정보 입력

### 메인 스토어 등록
- **App details**: 짧은 설명(80자), 긴 설명(4000자)
- **App icon**: 512×512 PNG (32-bit)
- **Feature graphic**: 1024×500 PNG (선택이지만 강력 권장)
- **Phone screenshots**: 최소 2장, 권장 4-8장 (1920×1080 또는 1080×1920)
- **App category**: Health & Fitness (건강/의료)
- **Tag**: 최대 5개 (Microbiome, Health tracking 등)
- **Contact email**: 지원 이메일
- **Privacy policy URL**: 필수 (자체 호스팅 페이지 필요)

### 데이터 안전성 (Data safety)
GutSense의 경우:
- 수집 데이터: 이름, 건강 정보(식단), 활동 데이터
- 암호화 여부: Yes (전송 시)
- 사용자 요청 시 삭제 가능: Yes
- 모두 정확히 응답해야 함 (허위 응답 시 계정 정지)

### 타겟층 및 콘텐츠
- **Target audience**: 18+ (건강 데이터) — Children 정책 회피
- **Content rating**: Everyone 또는 Teen (IARC 설문 응답)
- **Government apps / News / Financial**: 모두 No
- **Ads**: No (광고 없음)

---

## 8. 출시 트랙 선택

| 트랙 | 용도 | 사용자 제한 |
|------|------|-------------|
| **Internal testing** | 개발팀 내부 테스트 | 최대 100명 |
| **Closed testing (Alpha/Beta)** | 초대받은 테스터 | 이메일 목록 또는 Google 그룹 |
| **Open testing** | 공개 베타 (Play 등록 사용자) | 제한 없음 |
| **Production** | 전체 사용자 배포 | 제한 없음 |

권장 플로우: Internal → Closed → (검증 후) Production.

### Internal testing 배포 단계
1. Play Console → Testing → Internal testing → Create release
2. Release notes 입력 (변경 사항)
3. `.aab` 파일 업로드
4. Review release → 서명 정보 확인 (upload key 인식)
5. Start rollout to Internal
6. Tester 이메일 등록 → 테스터 초대 링크 받기 → 설치

---

## 9. 검토 절차

- 신규 앱 / 주요 업데이트는 Google 인증 대기 (통상 **1-3일**, 복잡한 건강/의료 앱은 최대 7일**)
- 거부 사유 (흔한 것들):
  - 개인정보처리방침 누락
  - 데이터 안전성 설문과 실제 데이터 수집 불일치
  - HEALTH 관련 앱의 의료 면책 명확화 부족 — 앱 내 "교육 목적, 의료 진단 아님" 명시 필수
  - 무단 API 키 사용
  - 광고 정책 위반
- 거부 시 Console에서 이메일로 사유 수신 → 수정 후 재업로드

---

## 10. 프로덕션 출시

1. Production → Create release
2. 국가 선택 (초기 한국만 또는 글로벌)
3. Staged rollout (단계적 배포) — 권장. 1% → 10% → 50% → 100%
4. Release notes 작성
5. Review → Start rollout

---

## 11. 앱 업데이트 절차 (후속 버전)

1. 코드 수정
2. `versionCode` 증가 (1 → 2 → 3...)
3. `versionName` 변경 ("1.0.0" → "1.0.1")
4. `npm run sync` → `gradlew assembleRelease`
5. Play Console → 새 release 업로드

---

## 12. 한 번에 보는 전체 커맨드 (치트시트)

```powershell
# 최초 설정 (1회)
keytool -genkey -v -keystore gutsense-upload.keystore -alias gutsense -keyalg RSA -keysize 2048 -validity 10000

# 빌드 + 동기화
npm run sync
cd android; .\gradlew assembleRelease; cd ..

# AAB 위치
ls android\app\build\outputs\bundle\release\app-release.aab

# Play Console에 업로드
# https://play.google.com/console → Create release → 드래그 업로드
```

---

## 13. 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| `versionCode already used` | 이전에 업로드한 versionCode와 중복. 증가 후 재시도 |
| `Your app is using a permission that requires a declaration` | 위치/카메라 권한 사용 시 콘솔에서 사용 사유 작성 |
| `Incorrect package name` | capacitor.config.json의 appId와 Play Console 등록 패키지명 일치 확인 |
| `Upload key certificate expired` | validity 10000일(약 27년)로 설정하면 사실상 발생 안 함 |
| 서명 불일치 | keystore 교체 불가 — Google Play App Signing 엔롤먼트로 마이그레이션 |
| 검토 지연 | 건강/의료 카테고리는 추가 검토. 정책 링크와 면책 라벨 명확히 |

---

## 14. 권장 사항

- **난독화(minifyEnabled true)**: 빌드 크기 축소 + 리버스 엔지니어링 방지. Capacitor/웹뷰 코드는 영향 없음
- **App Bundle(.aab)**: APK 대신 — 사용자 기기별 최적화된 APK 자동 생성, 평균 20% 작은 크기
- **Asset Delivery**: `www/js/images.js`(base64)가 크면 외부 에셋으로 분리 + Play Asset Delivery 고려
- **Firebase App Distribution**: Play Internal testing 전 빠른 디버그 배포용 (별도 SDK 필요)
- **Crashlytics**: 출시 전 필수 — 크래시 모니터링
