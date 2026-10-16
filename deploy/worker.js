/* ============================================================
 * GutSense LLM Proxy — Cloudflare Worker
 * ------------------------------------------------------------
 * 브라우저 → 이 Worker → BigModel(Z.ai) API 중계.
 * API 키는 Worker 시크릿(ZAI_API_KEY)에만 존재 —
 * 브라우저 devtools에 절대 노출되지 않음.
 *
 * 엔드포인트 (POST, 경로 그대로 업스트림에 패스스루):
 *   /chat/completions      — GLM 채팅 (llm.js chatCall / callRaw)
 *   /images/generations    — 이미지 생성 (향후 확장용)
 *
 * 환경변수 (Cloudflare 대시보드 → Settings → Variables):
 *   ZAI_API_KEY     (Secret, 필수)  — BigModel API 키
 *   UPSTREAM_BASE   (선택, 기본값)  — https://open.bigmodel.cn/api/paas/v4
 *   ALLOWED_ORIGINS (선택)          — 쉼표 구분 허용 Origin 목록.
 *                                     비워두면 모든 Origin 허용(데모용).
 *                                     예: https://gutsense.pages.dev,http://localhost:8000
 *   PROXY_KEY       (Secret, 선택)  — 추가 공유 키. 설정 시 요청 헤더
 *                                     X-Proxy-Key 가 일치해야 함.
 *
 * 무료 요금제: 하루 100,000 요청 — 데모 용도로 충분.
 * ============================================================ */

const DEFAULT_UPSTREAM = 'https://open.bigmodel.cn/api/paas/v4';
const PASS_PATHS = ['/chat/completions', '/images/generations'];

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
  });
}

function corsHeaders(origin, allowAll) {
  return {
    'Access-Control-Allow-Origin': allowAll ? '*' : origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Proxy-Key',
    'Access-Control-Max-Age': '86400',
    // Cloudflare Workers 응답에서 Vary 수동 지정
    'Vary': 'Origin'
  };
}

export default {
  async fetch(request, env) {
    var allowed = String((env && env.ALLOWED_ORIGINS) || '')
      .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var allowAll = allowed.length === 0;
    var origin = request.headers.get('Origin') || '';
    var cors = corsHeaders(origin, allowAll);

    // CORS preflight
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors);

    var url = new URL(request.url);
    if (PASS_PATHS.indexOf(url.pathname) < 0) return json({ error: 'not found' }, 404, cors);

    // Origin 허용 검사 (허용 목록이 설정된 경우)
    if (!allowAll && allowed.indexOf(origin) < 0) {
      return json({ error: 'forbidden origin' }, 403, cors);
    }

    // 선택적 공유 키 검사
    if (env && env.PROXY_KEY && request.headers.get('X-Proxy-Key') !== env.PROXY_KEY) {
      return json({ error: 'unauthorized' }, 401, cors);
    }

    var upstreamBase = String((env && env.UPSTREAM_BASE) || DEFAULT_UPSTREAM).replace(/\/$/, '');
    var apiKey = (env && env.ZAI_API_KEY) || '';
    if (!apiKey) return json({ error: 'worker secret ZAI_API_KEY not set' }, 500, cors);

    try {
      var upstream = await fetch(upstreamBase + url.pathname, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: await request.text()
      });
      var resp = new Response(upstream.body, upstream);
      Object.keys(cors).forEach(function (k) { resp.headers.set(k, cors[k]); });
      return resp;
    } catch (err) {
      return json({ error: 'upstream fetch failed', detail: String(err && err.message || err) }, 502, cors);
    }
  }
};
