# GutSense 🧬

**장 생태계 디지털 트윈 기반 건강관리앱**
사후적 치료에서 사전적 습관으로 — 보여주고, 알려주는 장 건강 시뮬레이터

> 삼성생명 라이프놀로지 랩 3기 · 연세대학교 · 최종심사 출품작 (Team GutSense &lt;변화&gt;)

**👉 [앱 체험하기 (Live Demo)](https://gutsense-e5m.pages.dev/)** — 모바일 뷰(폭 약 440px) 권장

> ⚠️ 서비스 개념을 보여주는 **프로토타입**입니다. 의료기기가 아니며 진단·치료에 사용할 수 없습니다.

---

## 한눈에 보기

건강해 보이는 식사도 장에는 다르게 작용합니다. 하지만 그 결과는 너무 늦게, 눈에 보이지 않게 나타납니다. GutSense는 한 끼의 식사가 장과 뇌에 미치는 영향을 **즉각 시각화**하고, 회복은 **다음 끼니부터** 보여줘서 행동 변화를 이끕니다.

```
음식 선택 → 몸속 시뮬레이션 → 지표 반응 → AI 피드백(Dr.장) → 미션·회복 → 레벨업
```

- **4개 코어 지표**: SCFA → 장벽 투과성 → 전신 염증 → 도파민 감수성 (서로 인과적으로 연결)
- **주요 화면**: 홈(GUT WORLD) · 장맵 · 식단 · 타임비전 · 미션
- **AI 캐릭터 Dr.장**: 장 상태를 LLM으로 쉽게 설명하고 미션을 제안
- **스택**: Vanilla JS, Three.js, GSAP, Capacitor 7, Cloudflare Pages + Worker

더 자세한 내용은 **[상세 기획안](docs/PLAN.md)** 에 있습니다. 문제 정의, 점수 산식, 화면별 설명, 기술·배포 구조, 기대효과를 정리했습니다.

---

## 실행

웹 레이어는 정적 파일이라 별도 빌드가 필요 없습니다.

```bash
cd www3
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000/`을 열고 개발자 도구의 모바일 뷰로 보세요.

Android 앱으로 실행하려면 Node.js 18+, Android Studio, JDK 17이 필요합니다.

```bash
npm install
npm run sync
npm run android:open
```

### Dr.장 (LLM) 설정

키가 없어도 기본 멘트로 정상 동작합니다. 직접 연결하려면 `www3/config.example.js`를 `config.js`로 복사해 키를 입력하세요. `config.js`는 `.gitignore`에 포함되어 있으니 **절대 커밋하지 마세요.** 공개 배포에서는 `deploy/`의 Cloudflare Worker 프록시를 쓰고 키는 Worker 시크릿으로만 등록하세요.

---

## 폴더 구조

```
├─ www3/          # 웹 앱 (Capacitor webDir)
├─ deploy/        # Cloudflare Worker (LLM 프록시)
├─ android/       # Capacitor Android 프로젝트
├─ scripts/       # 번들 · 동기화 스크립트
└─ docs/PLAN.md   # 상세 기획안
```

---

## 한계

로그인, 의료 데이터, 웨어러블 센서, 예측 이미지는 **시뮬레이션 또는 mock 데이터**이며, 지표 산식은 임상적으로 검증되지 않은 설계 가정입니다.

---

**Team GutSense &lt;변화&gt;** · 연세대학교 · 이혜준, 장우성
