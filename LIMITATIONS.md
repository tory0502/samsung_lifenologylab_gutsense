# 달성하지 못한 작업들 — 한계 및 향후 작업

본 프로토타입은 `AGENTS.md`의 Upgrade 요구사항을 모두 **UI/UX 차원에서 구현**했지만, 실제 외부 API 연동, 키 발급, 백엔드 인프라가 필요한 항목은 **시뮬레이션 모드**로 대체되었습니다. 아래는 상용화를 위해 추가로 필요한 작업들입니다.

---

## 1. 인증: 카카오 로그인 실제 연동

### 현재 상태
- "카카오로 계속하기" 버튼 → **가짜 OAuth 모달** 표시 → 1.4초 후 성공 처리 → 등록 폼으로 이동
- 실제 카카오 서버와 통신하지 않음. 사용자가 입력한 정보만 localStorage에 저장.

### 시뮬레이션 위치
- `www/js/screens/onboarding.js`의 `kakao()` 및 `kakaoApprove()` 함수

### 실제 연동에 필요한 것
1. [Kakao Developers](https://developers.kakao.com/)에서 앱 등록
   - **REST API 키** + **Native app 키** 발급
   - Android 패키지명: `com.gutsense.app` (capacitor.config.json 참조)
   - iOS 번들 ID (iOS 확장 시)
   - Redirect URI 등록 (예: `https://yourdomain.com/oauth/kakao`)
2. **백엔드 서버 필수** — Kakao OAuth는 client secret을 클라이언트에 하드코딩할 수 없음 (보안)
   - 토큰 교환(`/oauth/token`), 사용자 정보 조회(`/v2/user/me`)를 서버에서 처리
   - 클라이언트는 인가 코드만 받아 백엔드로 전달
3. Capacitor 플러그인 옵션
   - `@capacitor-community/http`로 백엔드 API 호출
   - 또는 `@kimmerin/capacitor-kakao-login` (서드파티) — 검증 필요
4. redirect 처리 — Capacitor의 `App.addListener('appUrlOpen')`로 커스텀 스킴 처리

### 권장 스택
```
[Client]  Capacitor WebView → @capacitor-community/http
   ↓ 인가 코드
[Server]  Node.js/Express or Cloud Function
   ↓ Kakao REST API
[Kakao]   oauth/token + v2/user/me
   ↓ JWT
[Client]  localStorage에 JWT 저장
```

---

## 2. AI 모델: Diffusion 기반 내시경 예측 이미지

### 현재 상태
- endoscope 화면의 NOW/+5년 악화/+5년 회복 3개 프레임은 **미리 준비된 정적 이미지**(`www/js/images.js`의 base64)와 캐릭터 이모지로 표현
- "Diffusion 모델 생성 중..." 로딩 애니메이션은 시뮬레이션 (1.6초 후 동일 이미지 표시)

### 시뮬레이션 위치
- `www/js/screens/endoscope.js`의 `regenerate()` 함수와 `ENDOSCOPE_SET` (`data.js`)

### 실제 연동에 필요한 것
- **API 키 필수** — 클라이언트에 하드코딩 불가 (유출 시 과금/남용 위험)
- 백엔드 프록시 또는 서버리스 함수 필요

#### 옵션 비교 (2025년 기준)

| 서비스 | 모델 | 특징 | 클라이언트 직접 호출 | 비용 |
|--------|------|------|---------------------|------|
| **Stability AI** | SDXL / SD3 | 고품질, 커스텀 fine-tune 가능 | 불가 (secret key) | 이미지당 ~$0.03 |
| **Replicate** | 다양한 diffusion 호스팅 | API 단순, 커뮤니티 모델 풍부 | 불가 (token) | 시간당 과금 |
| **OpenAI** | gpt-image-1 / DALL-E 3 | 사용성 최고, 의료 이미지 품질은 보통 | 불가 (api_key) | 이미지당 $0.04~$0.12 |
| **Hugging Face Inference** | Stable Diffusion 등 | 무료 tier 가능, 지연 높음 | 가능 (유출 위험) | 무료 / Pro $9/월 |
| **fal.ai** | SDXL Lightning 등 | 매우 빠름 (1-2초), 실시간 느낌 | 불가 (key) | 이미지당 ~$0.005 |

### 권장 접근 (상용화 시)
1. **전용 모델 fine-tune** — 실제 대장내시경 이미지 데이터셋으로 SDXL fine-tune (의료 데이터 확보 필요 + IRB 승인)
2. **조건부 생성** — 식단/EMR 입력 → latent conditioning → 악화/회복 시나리오별 프레임 생성
3. **캐싱** — 동일 입력에 대해서는 캐시된 이미지 반환 (비용 절감)
4. **의료 면책 라벨 필수** — "AI 생성 이미지, 진단용 아님"

---

## 3. 의료 데이터 연동 (EMR)

### 현재 상태
- 홈/이상감지 화면의 EMR 지표(CRP, 혈당, 중성지방 등)는 **프로필 기반 시드 RNG로 생성된 일관된 시계열** (`data.js`의 `mockStreams()`)
- 같은 사용자가 다시 로그인해도 동일한 "가짜 데이터"가 표시됨

### 시뮬레이션 위치
- `www/js/data.js`의 `mockStreams(profile, dietImpact)` 함수
- `www/js/store.js`의 `streams()` 메서드

### 실제 연동에 필요한 것
1. **EMR 벤더 API** — 병원 정보 시스템(HIS)과의 연동
   - 국내: EMR interchange / 건강보험심사평가원 HIRA API
   - 글로벌: HL7 FHIR 표준, Epic / Cerner API
2. **환자 동의 흐름** — OAuth 기반 환자 데이터 접근 (Cures Act 규정)
3. **법적 규제** — 국내 개인정보보호법, 의료법, 보건의료데이터 활용 가이드라인 준수
4. **데이터 표준화** — LOINC/SNOMED CT 코드 매핑
5. **백엔드** — EMR API와 클라이언트 사이의 보안 프록시

⚠️ 본 항목은 규제/파트너십 없이는 기술적으로만 해결 불가

---

## 4. 웨어러블 / IoT 센서 연동

### 현재 상태
- 심박, 수면, 걸음 수, 스트레스 지수 등은 시뮬레이션 (위와 동일)
- "ingestible gut sensor"(삼킬 수 있는 장 센서) 개념은 UI에만 표시

### 실제 연동에 필요한 것
- **스마트워치**: Apple HealthKit / Google Fit / Samsung Health SDK
  - `@capacitor-community/healthkit` (iOS)
  - Google Fit REST API (Android, OAuth 필요)
  - Samsung Health SDK (삼성 디바이스 한정)
- **연속 혈당 모니터 (CGM)**: Dexcom / Abbott Libre API — 파트너십 필요
- **장 센서**: 현재 상용화된 ingestible microbiome sensor는 없음 (연구 단계). 본 데모의 표현은 미래 시나리오 가정

---

## 5. AI 안경 / 스마트 렌즈 연동

### 현재 상태
- 식단 입력 화면의 "AI 안경" 모드는 `<input type="file" capture="environment">`로 기기 카메라를 호출
- 업로드된 이미지에서 **미리 정의된 음식 목록 중 무작위로 2-4개를 "인식 결과"로 표시** — 실제 비전 모델 아님

### 시뮬레이션 위치
- `www/js/screens/diet.js`의 `simulateRecognize(dataUrl)` 함수

### 실제 연동에 필요한 것
1. **음식 인식 비전 모델**
   - 클라우드: Google Vision API / AWS Rekognition Custom Labels (음식 데이터셋 학습)
   - 온디바이스: TensorFlow Lite, Core ML (경량 음식 분류 모델)
   - 오픈소스: Food-101 데이터셋 기반 모델
2. **안경/렌즈 디바이스 API** — 현재 상용 스마트 안경(Meta Ray-Ban 등)은 개방형 식단 인식 API를 제공하지 않음. 본 데모는 미래 시나리오 가정
3. **영양 데이터베이스 매핑** — 인식된 음식 → 영양성분 (USDA FoodData Central API, 한국 영양성분 DB)

---

## 6. 삼성생명 보험 연동

### 현재 상태
- 퀘스트 화면의 "리워드 → 삼성생명 연동" 체인(퀘스트 완수 → 포인트 → 보험료 할인 → 건강검진 할인권)은 **시각적 시나리오만 표시**

### 실제 연동에 필요한 것
1. **삼성생명 파트너십 계약** — 보험료 연동 API 접근 권한
2. **사용자 식별 연결** — GutSense 계정 ↔ 삼성생명 고객 번호 매핑 (보안 검증 필요)
3. **보험료 할인 로직 서버** — 건강 점수 → 할인율 계산은 서버에서 수행 (클라이언트 조작 방지)
4. **리워드 발권 시스템** — 건강검진 바우처 발급/사용 내역 관리
5. **규제 준수** — 보험업법 제6조 (요율 인가), 제102조 (대리점/중개)

---

## 7. 백엔드 인프라

### 현재 상태
- 모든 상태는 **클라이언트 localStorage**에 저장 — 기기 변경 시 데이터 이전 불가
- 서버 통신 전무

### 상용화에 필요한 백엔드 구성
```
[Client (Capacitor)]
   ↓ HTTPS
[API Gateway]
   ↓
[Auth Service]      — JWT 발급/갱신, 카카오 OAuth 콜백
[Profile Service]   — 사용자 프로필, 라이프스타일
[Diet Service]      — 식단 기록, 영양 분석
[Quest Service]     — 퀘스트 진행, XP/레벨
[AI Service]        — Diffusion 프록시, 비전 인식
[Integration]       — EMR / HealthKit / 삼성생명 어댑터
   ↓
[Database]          — PostgreSQL (사용자/식단/퀘스트)
[Cache]             — Redis (세션, AI 응답 캐시)
[Object Storage]    — S3/GCS (음식 사진, 생성된 내시경 이미지)
[Push Service]      — FCM (Android) / APNs (iOS)
```

### 권장 스택
- Node.js + Express / NestJS, 또는 Go + gin
- PostgreSQL + Prisma / sqlc
- Redis (캐싱)
- AWS / GCP / Vercel
- 모니터링: Sentry + DataDog

---

## 8. 푸시 알림

### 현재 상태
- 이상 감지 알림은 앱 내에서만 표시 (앱을 열어야 확인 가능)

### 필요한 것
- `@capacitor/push-notifications` 플러그인
- FCM (Android) / APNs (iOS) 인증서
- 백엔드에서 알림 트리거 로직 (식단 입력 후 배치 분석 등)

---

## 9. 법적 / 규제 (상용화 필수)

- **의료기기 분류** — 본 앱이 진단/치료 목적이면 식약처 의료기기 등록 필요 (한국). "건강 관리 앱"으로 명확히 경계를 짓고 면책 라벨 필수
- **개인정보보호법 준수** — 건강 데이터는 민감정보, 사전 동의 + 암호화 + 보관 기간 명시
- **GDPR / CCPA** (해외 진출 시)
- **보험업법 준수** — 보험료 연동 시 금융감독원 사전 심사
- **의료광고 제한** — "치료", "완치" 등의 표현 금지

---

## 10. 테스트 / 품질 보증 (현재 부재)

- 단위 테스트, E2E 테스트, 접근성(WCAG) 검사, 다언어(i18n), 다크/라이트 모드, 태블릿 레이아웃 — 모두 미구현
- 상용화를 위해 최소한 추가할 것:
  - Jest + Playwright 자동화
  - ESLint + Prettier
  - Lighthouse CI (성능/접근성)
  - 실기기 QA 매트릭스 (Samsung, Pixel, iPhone)

---

## 요약: 시뮬레이션 vs 실제 구현 매핑

| Upgrade 요구사항 | 구현 상태 | 시뮬레이션 위치 |
|------------------|----------|----------------|
| 0. 헤더/사이드바 네비 | ✅ 실제 구현 | `nav.js` |
| 1. 카카오 인증 | 🟡 UI만 (시뮬레이션) | `onboarding.js` `kakao()` |
| 2. 장 맵 재디자인 | ✅ 실제 구현 (SVG) | `gutmap.js` |
| 2-1. EMR/센서 연계 | 🟡 시뮬레이션 데이터 | `data.js` `mockStreams()` |
| 2-2. 프로필별 데이터 | ✅ 실제 구현 | `data.js` `baselineFor()` + `profile.js` |
| 3. 식단 입력 듀얼 모드 | ✅ UI + 🟡 AI 인식 시뮬 | `diet.js` (텍스트 모드는 실제 작동) |
| 4. 이상 감지 알림 | ✅ 식단 기반은 실제, 🟡 EMR/센서는 시뮬 | `alert.js`, `store.js` `activeAlerts()` |
| 5. 내시경 Diffusion | 🟡 정적 이미지 + 캐릭터 | `endoscope.js` |
| 6. 퀘스트 의학 지식 | ✅ 실제 (논문 인용 포함) | `quest.js`, `data.js` `QUESTS` |
| 6. 리워드 캐릭터 영상 | 🟡 캐릭터 애니메이션만 | `quest.js` `preview()` |
| 6. 삼성생명 연동 | 🟡 시각적 시나리오만 | `quest.js` reward chain |

✅ = 프로토타입에서 실제로 동작 / 🟡 = UI/UX는 완성, 실제 외부 연동은 한계
