# GutSense 공개 배포 — Cloudflare Pages + Worker (무료)

PC를 꺼도 24시간 접속 가능. API 키는 Worker 시크릿에만 존재
(브라우저에 노출되지 않음). 전부 무료 요금제:
- **Pages**: 정적 호스팅 (대역폭 무제한)
- **Worker**: 하루 100,000 요청 (LLM 프록시)

사전 준비: [cloudflare.com](https://dash.cloudflare.com/sign-up) 무료 계정 가입.

---

## 1단계 — Worker 배포 (LLM 프록시)

```powershell
# 최초 1회: 브라우저가 열리고 Cloudflare 로그인
npx wrangler login

cd deploy
npx wrangler deploy
```

출력에 찍히는 Worker URL을 복사 (예: `https://gutsense-llm.xxxxx.workers.dev`).

API 키를 Worker 시크릿으로 등록:

```powershell
npx wrangler secret put ZAI_API_KEY
# 프롬프트에 BigModel API 키 붙여넣기
```

동작 확인 (PowerShell — JSON을 파일로 전송해야 따옴표가 안 깨짐.
Worker가 Origin을 잠그므로 Origin 헤더 필수):

```powershell
Set-Content -Path "$env:TEMP\gs-test.json" -Value '{"model":"glm-4.5-flash","max_tokens":30,"messages":[{"role":"user","content":"hi"}]}'
curl.exe -s -X POST "https://gutsense-llm.gutsense.workers.dev/chat/completions" -H "Content-Type: application/json" -H "Origin: https://gutsense-e5m.pages.dev" --data "@$env:TEMP\gs-test.json"
```

GLM JSON 응답이 오면 성공.

⚠️ PowerShell에서 `-d "{\"model\":...}"` 형태로 직접 쓰면 `\"`가 깨져
업스트림 JSON parse error(400)가 납니다 — 반드시 위처럼 파일 경유.

## 2단계 — 앱 설정 전환 ✅ 완료됨

`www3/config.js`:

```js
llmProxyBase: "https://gutsense-llm.gutsense.workers.dev",  // 1단계 URL
zaiKey: "",                                               // 키 삭제! (더 이상 브라우저에 불필요)
```

로컬에서 앱을 켜고 Dr.장 말풍선 / GUT LAB 종합 소견이 AI 응답인지 확인
(fallback 멘트가 나오면 Worker URL 오타 확인).

## 3단계 — Pages 배포 (정적 사이트)

```powershell
cd ..   # 프로젝트 루트에서
npx wrangler pages project create gutsense --production-branch main
npx wrangler pages deploy www3 --project-name gutsense
```

완료되면 `https://gutsense.pages.dev` 로 접속. (최초 배포는
`https://<hash>.gutsense.pages.dev` URL이 나올 수 있고, 곧 `gutsense.pages.dev` 활성화)

PC를 꺼도 이 URL은 항상 살아 있음.

## 4단계 — Worker 도메인 잠금 ✅ 적용됨

`deploy/wrangler.toml`의 `ALLOWED_ORIGINS`에 production/preview/localhost 등록 후
`deploy/` 폴더에서 `npx wrangler deploy`. 도메인 추가 시(커스텀 도메인 연결 등)
목록에 추가하고 재배포. 잠긴 상태에서 curl 테스트는 Origin 헤더 필수.

---

## 업데이트 방법

앱 파일을 고친 뒤:

```powershell
npx wrangler pages deploy www3 --project-name gutsense
```

Worker를 고친 뒤 (`deploy/` 폴더에서):

```powershell
npx wrangler deploy
```

## 비상 시

- LLM 응답 실패 시 앱은 자동으로 fallback 멘트로 동작 (화면이 깨지지 않음)
- 키 유출이 의심되면 BigModel 콘솔에서 키 재발급 → `npx wrangler secret put ZAI_API_KEY` 갱신
- 배포 중단: Cloudflare 대시보드 → Workers & Pages → 해당 프로젝트 Delete
