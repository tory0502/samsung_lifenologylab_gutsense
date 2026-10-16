/* ============================================================
 * GutSense — LLM 설정 템플릿 (이 파일을 복사해 config.js 로 사용)
 * ------------------------------------------------------------
 * 사용법:
 *   1. 이 파일을 같은 폴더(www/)에 config.js 로 복사
 *   2. 아래 키 중 하나(또는 둘 다) 입력
 *   3. config.js 는 반드시 .gitignore 처리 — 절대 커밋 금지
 *
 * 어느 키를 입력해도 자동으로 해당 제공자가 선택됩니다 (js/llm.js 참고).
 * 둘 다 있으면 ZAI(GLM) > OpenAI(GPT) 순서로, status()로 확인 가능.
 * 둘 다 없으면 하드코딩 fallback 멘트로 동작 (시연 중단 없음).
 *
 * ⚠️ 브라우저에서 직접 호출하는 로컬 시연 프로토타입용입니다.
 *    키가 devtools에 노출되므로 public 저장소에 올리지 마세요.
 *    public 배포는 llmProxyBase (Cloudflare Worker 프록시)를 사용하세요.
 * ============================================================ */

// === public 배포용: Cloudflare Worker 프록시 ===
// deploy/worker.js 배포 후 발급되는 Worker URL (deploy/DEPLOY.md 참고).
// 설정 시 API 키 없이 Worker 시크릿으로만 호출 — 키가 브라우저에 노출되지 않음.
var LLM_PROXY_BASE = "";        // 예: "https://gutsense-llm.XXXXX.workers.dev"

// === ZAI (GLM 5.2 / 지푸AI) — 로컬 시연용 ===
// https://z.ai/ 또는 https://open.bigmodel.cn/ 에서 발급
var ZAI_API_KEY = "";

// === OpenAI (GPT) ===
// https://platform.openai.com/ 에서 발급
var OPENAI_API_KEY = "";

// === (선택) 모델명 오버라이드 — 비워두면 기본값 사용 ===
var ZAI_MODEL = "glm-4.5-flash";        // 무료 한도가 넉넉한 추론 모델 (권장). "glm-4.6"은 유료 잔액 필요(429)
var OPENAI_MODEL = "gpt-4o-mini";       // 또는 "gpt-4o", "gpt-4.1-mini"

// === (선택) API 엔드포인트 오버라이드 ===
var ZAI_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";   // ZAI/GLM (OpenAI 호환)
var OPENAI_BASE_URL = "https://api.openai.com/v1";

// === Diffusion (이미지 생성) — 시크릿 랩 비전 슬롯 ===
// https://platform.openai.com/ 에서 발급 (gpt-image-1 권장)
var DIFFUSION_API_KEY = "";
var DIFFUSION_MODEL = "gpt-image-1";
var DIFFUSION_BASE_URL = "https://api.openai.com/v1";

// 이 파일은 전역 변수만 노출 (window.GS_CONFIG 로 접근)
window.GS_CONFIG = {
  llmProxyBase: LLM_PROXY_BASE,
  zaiKey: ZAI_API_KEY,
  openaiKey: OPENAI_API_KEY,
  zaiModel: ZAI_MODEL,
  openaiModel: OPENAI_MODEL,
  zaiBase: ZAI_BASE_URL,
  openaiBase: OPENAI_BASE_URL,
  diffusionKey: DIFFUSION_API_KEY,
  diffusionModel: DIFFUSION_MODEL,
  diffusionBase: DIFFUSION_BASE_URL
};
