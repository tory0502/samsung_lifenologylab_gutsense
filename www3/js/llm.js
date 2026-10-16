/* ============================================================
 * GutSense — Provider-agnostic LLM 클라이언트 (ZAI/GLM + OpenAI/GPT)
 * ------------------------------------------------------------
 * config.js 의 키를 읽어 ZAI(GLM 5.2) 또는 OpenAI(GPT) 중 어느 쪽이든
 * 자동 호출. 둘 다 없거나 실패하면 논문 기반 하드코딩 fallback.
 *
 * 설계 (CORE.pdf "RAG 실시간 API 연동" 방법 A):
 *   - 순수 프론트엔드에서 직접 호출 (http.server 환경)
 *   - 키는 config.js (별도 파일, .gitignore) 에만 존재
 *   - Coccurello 2025 논문 컨텍스트를 시스템 프롬프트에 주입 → 근거 있는 멘트
 *   - 실패 시 fallback → 시연 중 화면 깨짐 방지
 *
 * ZAI/GLM 과 OpenAI 는 모두 OpenAI 호환 chat/completions 포맷을 쓴다.
 * Exposed as window.GS.llm = { generate, status, activeProvider }.
 * ============================================================ */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var D = window.GS_DATA;

  function cfg() { return window.GS_CONFIG || {}; }
  // 프록시(Cloudflare Worker) 우선 — llmProxyBase 설정 시 API 키가
  // 브라우저에 전혀 존재하지 않고 Worker 시크릿으로만 호출됨 (public 배포용).
  function proxyBase() { var p = cfg().llmProxyBase; return p && p.length > 8 ? p.replace(/\/$/, '') : ''; }
  function activeProvider() {
    var c = cfg();
    if (proxyBase()) return 'zai';
    if (c.zaiKey && c.zaiKey.length > 10) return 'zai';
    if (c.openaiKey && c.openaiKey.length > 10) return 'openai';
    return null;
  }

  // Coccurello 2025 논문 기반 시스템 프롬프트 (모든 제공자 공통)
  function systemPrompt(role) {
    role = role || 'coach';
    var grounding = (window.GS_DATA && window.GS_DATA.MEDICAL && window.GS_DATA.MEDICAL.GROUNDING) ? window.GS_DATA.MEDICAL.GROUNDING : '';
    var base = [
      '당신은 GutSense 장-뇌 축 디지털 트윈의 AI 분석 코치 "Dr.장"이다.',
      grounding,
      '',
      '코멘트 규칙:',
      '- 한국어, 1~2문장 (최대 70자), 의학적이되 이해하기 쉽게',
      '- 수치와 인과를 연결해 설명 (예: "SCFA가 낮아 장벽에 균열이 생겼고, 이게 염증을 올려 도파민 회복을 막고 있어요")',
      '- 죄책감보다 구체적 회복 방향 제시 (식이섬유·발효식품·무가당·운동)',
      '- 의료 진단 아님(참고용) 전제',
      '- 이모지 자제, 간결하게, 따옴표 없이'
    ];
    if (role === 'medical') {
      base.push('', '추가로: 사용자가 묻는 의학 지식을 논문 근거와 함께 2~3문장으로 설명한다.');
    }
    return base.join('\n');
  }

  // 사용자 데이터 → 프롬프트 컨텍스트
  function buildUserPrompt(ctx) {
    ctx = ctx || {};
    var parts = [];
    if (ctx.intent) parts.push('요청: ' + ctx.intent);
    parts.push('아래 장 건강 데이터를 보고 사용자에게 맞는 Dr.장 코멘트를 생성해줘.');
    var prof = (window.GS.store && window.GS.store.profile.get()) || {};
    if (prof.name) parts.push('레지던트: ' + prof.name + ' (' + (prof.gender === 'female' ? '여' : '남') + ', ' + (prof.age || '?') + '세, ' + ((D.LIFESTYLES[prof.lifestyle] || {}).label || '') + ')');
    if (ctx.zones && ctx.zones.length) {
      var top = ctx.zones.slice().sort(function (a, b) { return a.score - b.score; }).slice(0, 3);
      parts.push('위험 구역: ' + top.map(function (z) { return z.name + '(HP ' + z.score + ', 투과성 ' + (z.indices ? z.indices.permeability : '?') + ')'; }).join(', '));
    }
    if (ctx.foods && ctx.foods.length) {
      parts.push('오늘 식단: ' + ctx.foods.map(function (f) { return f.label + (f.bad ? '(해로움)' : '(이로움)'); }).join(', '));
    }
    if (ctx.metrics) {
      var m = ctx.metrics;
      parts.push('지표 — SCFA:' + m.scfa + ', 투과성:' + m.permeability + ', 전신염증:' + m.inflammation + ', 도파민감수성:' + m.dopamine + '(상한선 ' + (m.ceiling != null ? m.ceiling : '?') + '), 종합:' + (window.GS.store ? window.GS.store.gutScore() : '?'));
    }
    if (ctx.streak != null) parts.push('연속 퀘스트 달성: ' + ctx.streak + '일');
    if (ctx.alerts != null) parts.push('활성 알림: ' + ctx.alerts + '개');
    parts.push('위 데이터를 바탕으로 1~2문장 한국어 코멘트만 출력해줘.');
    return parts.join('\n');
  }

  function chatCall(baseUrl, apiKey, model, userPrompt, role) {
    var url = baseUrl.replace(/\/$/, '') + '/chat/completions';
    var headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;
    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: model, max_tokens: 900, temperature: 0.7,
        messages: [{ role: 'system', content: systemPrompt(role) }, { role: 'user', content: userPrompt }]
      })
    }).then(function (r) { if (!r.ok) throw new Error('LLM HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        var text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
        if (!text.trim()) throw new Error('LLM 빈 응답');
        return text.trim();
      });
  }

  function callZai(p, role) {
    var c = cfg();
    var base = proxyBase() || c.zaiBase || 'https://open.bigmodel.cn/api/paas/v4';
    return chatCall(base, proxyBase() ? '' : c.zaiKey, c.zaiModel || 'glm-4.5-flash', p, role);
  }
  function callOpenai(p, role) { var c = cfg(); return chatCall(c.openaiBase || 'https://api.openai.com/v1', c.openaiKey, c.openaiModel || 'gpt-4o-mini', p, role); }

  // 시크릿 랩 전용: md 파일에서 읽은 system 프롬프트 그대로 사용 (generate() 와 달리 raw 전달)
  function callRaw(baseUrl, apiKey, model, system, user) {
    var url = baseUrl.replace(/\/$/, '') + '/chat/completions';
    var headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = 'Bearer ' + apiKey;
    return fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: model, max_tokens: 1200, temperature: 0.7,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
      })
    }).then(function (r) { if (!r.ok) throw new Error('LLM HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        var text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
        if (!text.trim()) throw new Error('LLM 빈 응답');
        return text.trim();
      });
  }

  // Fallback (논문 기반 하드코딩) — 키 없거나 호출 실패 시
  function fallbackComment(ctx) {
    var m = (ctx && ctx.metrics) || {};
    var inf = m.inflammation != null ? m.inflammation : 50;
    var dopa = m.dopamine != null ? m.dopamine : 60;
    var scfa = m.scfa != null ? m.scfa : 60;
    var perm = m.permeability != null ? m.permeability : 40;
    if (inf >= 61) return '전신 염증이 ' + inf + '로 폭풍 상태예요. 장벽 투과성(' + perm + ')이 올라 LPS가 혈류에 유입되며, 이게 도파민 회복 상한선까지 누르고 있어요. 식이섬유·발효식품으로 SCFA를 올리면 장벽이 먼저 회복됩니다.';
    if (dopa < 40) return '도파민 감수성이 ' + dopa + '로 낮아요. 염증(' + inf + ')이 도파민 전구물질 공급을 방해해서 좋은 음식을 먹어도 반응이 둔한 상태입니다. 48시간 리셋이 회복 단서가 돼요.';
    if (scfa < 45) return 'SCFA가 ' + scfa + '로 낮아 장벽 에너지가 부족해요. butyrate 생성균을 위해 수용성 식이섬유(귀리·바나나)와 발효식품이 필요합니다.';
    if (inf < 30 && dopa > 65) return '장 생태계가 안정적이에요(SCFA ' + scfa + ', 염증 ' + inf + ', 도파민 ' + dopa + '). 도파민 회복 상한선도 풀려 있어 기분까지 가벼운 상태입니다. 현재 패턴을 유지해요.';
    return '장 상태는 양호, 도파민은 ' + (dopa >= 50 ? '생기' : '둔감') + ' 상태예요. 한 끼 더 식이섬유를 챙기면 SCFA가 올라 장벽이 단단해집니다.';
  }

  // 메인 — 절대 reject 하지 않는다 (실패해도 fallback).
  // opts.onLoading(bool), opts.role ('coach'|'medical')
  // short-TTL cache so re-renders (which fire renderSmart repeatedly) don't
  // re-call the API for the same context — avoids burning quota / rate limits.
  var CACHE = {}; var CACHE_TTL = 45000;
  var PENDING = {}; // in-flight dedupe — concurrent same-context calls share one request
  function cacheKey(provider, prompt) {
    var h = 0; for (var i = 0; i < prompt.length; i++) { h = ((h << 5) - h + prompt.charCodeAt(i)) | 0; }
    return provider + ':' + h;
  }

  function generate(ctx, opts) {
    opts = opts || {};
    var provider = activeProvider();
    var userPrompt = buildUserPrompt(ctx);
    if (opts.onLoading) opts.onLoading(true);
    if (!provider) {
      if (opts.onLoading) opts.onLoading(false);
      return Promise.resolve({ text: fallbackComment(ctx), provider: 'fallback', fallback: true });
    }
    var key = cacheKey(provider, userPrompt);
    var hit = CACHE[key];
    if (hit && (Date.now() - hit.ts) < CACHE_TTL) {
      if (opts.onLoading) opts.onLoading(false);
      return Promise.resolve({ text: hit.text, provider: provider, fallback: false, cached: true });
    }
    if (PENDING[key]) {
      if (opts.onLoading) opts.onLoading(false);
      return PENDING[key];
    }
    var call = provider === 'zai' ? callZai(userPrompt, opts.role) : callOpenai(userPrompt, opts.role);
    var p = call.then(function (text) {
      if (opts.onLoading) opts.onLoading(false);
      CACHE[key] = { text: text, ts: Date.now() };
      return { text: text, provider: provider, fallback: false };
    }).catch(function (err) {
      if (opts.onLoading) opts.onLoading(false);
      return { text: fallbackComment(ctx), provider: provider, fallback: true, error: String(err && err.message || err) };
    });
    PENDING[key] = p;
    p.then(function () { delete PENDING[key]; }, function () { delete PENDING[key]; });
    return p;
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('LLM TIMEOUT ' + ms + 'ms')); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }

  function generateCustom(system, user, fallbackText) {
    var c = cfg();
    var fallback = { text: fallbackText || '', provider: 'local', fallback: true };
    var base = proxyBase();
    if (base) {
      return callRaw(base, '', c.zaiModel || 'glm-4.5-flash', system, user)
        .then(function (t) { return { text: t, provider: 'zai', fallback: false }; })
        .catch(function () { return fallback; });
    }
    if (c.zaiKey) {
      return withTimeout(callRaw(c.zaiBase || 'https://open.bigmodel.cn/api/paas/v4', c.zaiKey, c.zaiModel || 'glm-4.5-flash', system, user), 15000)
        .then(function (t) { return { text: t, provider: 'zai', fallback: false }; })
        .catch(function () { return fallback; });
    }
    if (c.openaiKey) {
      return withTimeout(callRaw(c.openaiBase || 'https://api.openai.com/v1', c.openaiKey, c.openaiModel || 'gpt-4o-mini', system, user), 15000)
        .then(function (t) { return { text: t, provider: 'openai', fallback: false }; })
        .catch(function () { return fallback; });
    }
    return Promise.resolve(fallback);
  }

  function status() {
    var p = activeProvider();
    return { provider: p, label: p ? 'AI' : '연결 대기', model: p ? 'AI' : '—' };
  }

  GS.llm = { generate: generate, generateCustom: generateCustom, status: status, activeProvider: activeProvider, fallback: fallbackComment };
})();
