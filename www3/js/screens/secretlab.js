/* GutSense www3 — Dr.장 시크릿 랩 (비밀 진단실).
 * 진입: Dr.장 탭 → 수술대 각성 POV(흐릿→깜빡→선명, 세션 1회) →
 * 배경 이미지(gut_lab_background.png) + Dr.장 종합 소견.
 * 슬롯은 병원용 디스플레이 모니터 스타일. 뒤로가기는 nav 히스토리로 항상 가능.
 * Exposed as GS.screens.secretlab.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var D = window.GS_DATA;

  var timers = [];
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(function (id) { clearTimeout(id); }); timers = []; }
  var lastScreen = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function inject() {
    if (document.getElementById('gs3-sl-style')) return;
    var s = document.createElement('style'); s.id = 'gs3-sl-style';
    s.textContent =
      '.sl-root{min-height:100%;padding:calc(env(safe-area-inset-top,0px) + 52px) 14px calc(env(safe-area-inset-bottom,0px) + 14px);position:relative;color:#1c3048;display:flex;flex-direction:column;' +
      'background:url(imgs/gut_lab_background.png) center/contain no-repeat fixed,#e6edf5}' +
      '.sl-root>*{position:relative;z-index:1}' +
      '.sl-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}' +
      '.sl-title{font-size:15px;color:#0d2c4f;display:flex;align-items:center;gap:8px;font-weight:700}' +
      '.sl-title .dot{width:9px;height:9px;border-radius:50%;background:#37C7FF;box-shadow:0 0 10px rgba(55,199,255,.9);animation:pulse 1.6s infinite}' +
      '.sl-exit{font-size:11px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.7);border:1px solid rgba(30,90,170,.25);color:#0d2c4f;cursor:pointer;transition:transform .14s}' +
      '.sl-exit:active{transform:scale(.94)}' +
      '.sl-monitor{position:relative;margin-bottom:10px;border-radius:16px;background:linear-gradient(180deg,#31506b,#22394f);padding:7px;box-shadow:0 10px 24px rgba(10,30,60,.35),inset 0 1px 0 rgba(255,255,255,.18)}' +
      '.sl-monitor::before,.sl-monitor::after{content:"";position:absolute;width:5px;height:5px;border-radius:50%;background:#0e1c2b;box-shadow:inset 0 1px 1px rgba(255,255,255,.25)}' +
      '.sl-monitor::before{top:4px;left:5px}.sl-monitor::after{bottom:4px;right:5px}' +
      '.sl-monitor .scr{position:relative;border-radius:10px;overflow:hidden;background:radial-gradient(120% 130% at 20% 0%,#12354f,#0a1d30 70%);padding:10px 12px}' +
      '.sl-monitor .scr::before{content:"";position:absolute;inset:0;pointer-events:none;background:' +
        'linear-gradient(rgba(90,180,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(90,180,255,.05) 1px,transparent 1px);background-size:22px 22px}' +
      '.sl-monitor .scr::after{content:"";position:absolute;left:0;right:0;height:34px;top:-34px;pointer-events:none;' +
        'background:linear-gradient(180deg,transparent,rgba(120,220,255,.10),transparent);animation:slScan 3.4s linear infinite}' +
      '@keyframes slScan{to{transform:translateY(520px)}}' +
      '.sl-mtag{display:flex;align-items:center;gap:7px;font-size:10px;color:#8fd8ff;margin-bottom:7px;letter-spacing:.04em}' +
      '.sl-mtag .live{display:inline-flex;align-items:center;gap:4px;font-size:8px;color:#ff7d94;font-weight:800;letter-spacing:.12em}' +
      '.sl-mtag .live i{width:6px;height:6px;border-radius:50%;background:#ff5c7a;box-shadow:0 0 6px #ff5c7a;animation:blink 1.1s infinite}' +
      '.sl-mtag svg{margin-left:auto;display:block}' +
      '.sl-monitor .body{font-size:12px;line-height:1.6;color:#cfe8ff;min-height:22px;word-break:break-word;position:relative}' +
      '.sl-monitor .body.empty{color:#6f93b5;font-size:11px}' +
      '.sl-monitor .busy{display:inline-block;width:12px;height:12px;border:2px solid rgba(143,216,255,.3);border-top-color:#8fd8ff;border-radius:50%;animation:spin .8s linear infinite;vertical-align:-2px;margin-right:6px}' +
      '.sl-monitor.sl-disp{background:rgba(36,59,82,.4);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:8px;border-radius:20px;box-shadow:inset 0 0 0 1px rgba(143,216,255,.18)}' +
      '.sl-monitor.sl-disp .scr{min-height:0;padding:8px 10px;border-radius:10px;display:flex;flex-direction:column;gap:6px;background:rgba(10,26,44,.3)}' +
      '.sl-disp-imgwrap{position:relative;border-radius:10px;overflow:hidden;flex:0 0 auto;width:132px;margin:0 auto;background:#0a1626}' +
      '.sl-disp-imgwrap img{width:100%;height:auto;aspect-ratio:326/392;object-fit:contain;display:block}' +
      '.sl-disp-imgwrap .score-ov{position:absolute;left:10px;bottom:10px;display:flex;align-items:baseline;gap:6px;background:rgba(4,12,28,.72);backdrop-filter:blur(6px);padding:6px 12px;border-radius:12px;border:1px solid rgba(122,220,255,.3)}' +
      '.sl-disp-imgwrap .score-ov b{font-family:"Orbitron",monospace;font-size:16px;line-height:1}' +
      '.sl-disp-imgwrap .score-ov span{font-size:8px;color:#8fd8ff}' +
      '.sl-disp-imgwrap .state-ov{position:absolute;right:10px;top:8px;font-size:8.5px;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(4,12,28,.72);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.18)}' +
      '.sl-disp-imgwrap .tick-ov{position:absolute;inset:auto 10px 8px auto;font-family:monospace;font-size:8px;color:#6fa8d8}' +
      '.sl-disp-scale{display:flex;gap:4px;align-items:center}' +
      '.sl-disp-scale i{flex:1;height:5px;border-radius:3px}' +
      '.sl-disp-scale span{font-size:8px;color:#8fd8ff;font-family:monospace}' +
      '@keyframes slScan{to{transform:translateY(620px)}}' +
'.sl-chalk{position:relative;margin-top:auto;border-radius:18px;background:rgba(58,38,20,.08);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);padding:11px;box-shadow:0 12px 28px rgba(30,50,20,.22),inset 0 0 0 1px rgba(255,240,210,.14)}' +
'.sl-chalk .board{position:relative;border-radius:10px;overflow:hidden;background:rgba(34,56,44,.10);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);padding:12px 14px;min-height:120px;box-shadow:inset 0 0 30px rgba(0,0,0,.2),inset 0 0 0 1px rgba(255,255,255,.05)}' +
      '.sl-chalk .board::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.22;background:' +
        'repeating-linear-gradient(0deg,transparent 0 3px,rgba(255,255,255,.028) 3px 4px),repeating-linear-gradient(90deg,transparent 0 5px,rgba(255,255,255,.02) 5px 6px)}' +
      '.sl-chalk .board::after{content:"";position:absolute;left:0;right:0;height:30px;top:-30px;pointer-events:none;' +
        'background:linear-gradient(180deg,transparent,rgba(240,235,215,.07),transparent);animation:slChalk 5s linear infinite}' +
      '@keyframes slChalk{to{transform:translateY(430px)}}' +
      '.sl-cframe{position:absolute;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f5e3c2,#c9a469 60%,#8a6a3e);box-shadow:0 1px 2px rgba(0,0,0,.4);top:6px;z-index:2}' +
      '.sl-cframe.tl{left:6px}.sl-cframe.tr{right:6px}.sl-cframe.bl{bottom:6px;left:6px}.sl-cframe.br{bottom:6px;right:6px}' +
      '.sl-chalk .mtag-chalk{display:flex;align-items:center;gap:7px;font-size:10px;color:#f3ead2;margin-bottom:8px;letter-spacing:.04em}' +
      '.sl-chalk .mtag-chalk .live{display:inline-flex;align-items:center;gap:4px;font-size:8px;color:#ffd9a0;font-weight:800;letter-spacing:.12em}' +
      '.sl-chalk .mtag-chalk .live i{width:6px;height:6px;border-radius:50%;background:#ffb45c;box-shadow:0 0 6px #ffb45c;animation:blink 1.1s infinite}' +
      '.sl-chalk .mtag-chalk svg{margin-left:auto;display:block}' +
      '.sl-chalk .body{font-size:12.5px;line-height:1.7;color:#f6f2e3;min-height:22px;word-break:break-word;position:relative;font-family:"NanumPen Script","Jua","Malgun Gothic",cursive}' +
      '.sl-chalk .body.empty{color:#b9c9b2;font-size:11px}' +
      '.sl-chalk .busy{display:inline-block;width:12px;height:12px;border:2px solid rgba(243,234,210,.35);border-top-color:#f3ead2;border-radius:50%;animation:spin .8s linear infinite;vertical-align:-2px;margin-right:6px}' +
      '.sl-djrow{display:flex;gap:10px;align-items:flex-end;margin-bottom:8px}' +
      '.sl-bubble{flex:1;position:relative;background:rgba(255,255,255,.86);backdrop-filter:blur(10px);border:1.5px solid rgba(30,90,170,.28);border-radius:16px 18px 18px 14px;padding:8px 10px;box-shadow:0 8px 20px rgba(20,60,120,.14)}' +
      '.sl-tail{position:absolute;left:-8px;bottom:14px;width:0;height:0;border-style:solid;border-width:7px 10px 7px 0;border-color:transparent rgba(255,255,255,.86) transparent transparent}' +
      '.sl-djline{font-size:11.5px;line-height:1.4;color:#1e3a5f;margin-bottom:2px}' +
      '.sl-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}' +
      '.sl-chip{font-size:9px;padding:2px 7px;border-radius:999px;background:rgba(55,199,255,.14);border:1px solid rgba(55,199,255,.35);color:#16639c}' +
      '.sl-chip.warn{background:rgba(255,92,122,.14);border-color:rgba(255,92,122,.4);color:#c44a63}' +
      '.sl-grid{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}' +
      '.sl-cell{border-radius:8px;padding:2px 7px;border:1px solid rgba(30,90,170,.1);min-width:0;display:flex;align-items:center;gap:4px}' +
      '.sl-cell .k{font-size:8px;color:#5a7a9a;white-space:nowrap;line-height:1.2}' +
      '.sl-cell .v{font-size:11px;font-weight:800;color:#0d2c4f;font-family:"Orbitron",monospace;font-variant-numeric:tabular-nums;white-space:nowrap;line-height:1.4}' +
      '.sl-badge{display:inline-block;padding:1px 6px;border-radius:999px;font-size:8.5px;vertical-align:1px}' +
      '.sl-connector{position:absolute;left:31px;width:3px;border-radius:3px;background:repeating-linear-gradient(180deg,#37C7FF 0 4px,transparent 4px 8px);box-shadow:0 0 8px rgba(55,199,255,.75),0 0 16px rgba(55,199,255,.4);animation:slDash 1.4s linear infinite;pointer-events:none;z-index:0}' +
      '@keyframes slDash{to{background-position:0 8px}}' +
      '.sl-intro{position:absolute;inset:0;z-index:40;background:#04070d;display:flex;align-items:center;justify-content:center;transition:opacity .55s;cursor:pointer;overflow:hidden}' +
      '.sl-pov{position:absolute;inset:0;overflow:hidden}' +
      '.sl-pov-scene{position:absolute;inset:0;filter:blur(18px);transition:filter .45s}' +
      '.sl-lamp{position:absolute;left:50%;top:34%;width:190px;height:190px;margin:-95px;border-radius:50%;' +
        'background:radial-gradient(circle at 50% 46%,#ffffff 0 14%,rgba(226,240,255,.85) 26%,rgba(140,180,230,.28) 58%,transparent 72%);opacity:.5;transition:opacity .4s}' +
      '.sl-lamp::after{content:"";position:absolute;inset:-14%;border-radius:50%;border:10px solid rgba(190,215,245,.16)}' +
      '.sl-lamp2{position:absolute;left:50%;top:34%;width:190px;height:190px;margin:-95px 0 0 -58px;border-radius:50%;' +
        'background:radial-gradient(circle at 50% 46%,rgba(255,255,255,.7) 0 16%,rgba(226,240,255,.4) 34%,transparent 68%);opacity:.35;filter:blur(6px);transition:opacity .4s,margin .45s}' +
      '.sl-pov-halo{position:absolute;left:50%;top:34%;width:420px;height:420px;margin:-210px;border-radius:50%;' +
        'background:radial-gradient(circle,rgba(120,170,255,.16),transparent 62%)}' +
      '.sl-lid{position:absolute;left:-6%;right:-6%;height:56%;background:linear-gradient(180deg,#02040a,#05080f);z-index:3;transition:transform .16s ease-out}' +
      '.sl-lid.t{top:-3%;border-radius:0 0 50% 50%;transform-origin:top center}' +
      '.sl-lid.b{bottom:-3%;background:linear-gradient(0deg,#02040a,#05080f);border-radius:50% 50% 0 0;transform-origin:bottom center}' +
      '.sl-pov-vig{position:absolute;inset:0;z-index:2;background:radial-gradient(ellipse at 50% 46%,transparent 30%,rgba(2,4,9,.9) 78%)}' +
      '.sl-flash{position:absolute;inset:0;background:radial-gradient(80% 70% at 50% 40%,#fff,rgba(255,255,255,.9));opacity:0;animation:slFlash 1.15s ease-out both;z-index:5}' +
      '@keyframes slFlash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}' +
      '.sl-voice{position:absolute;bottom:104px;left:24px;right:24px;background:rgba(10,20,40,.74);border:1px solid rgba(122,220,255,.28);border-radius:20px;padding:13px 16px;color:#dcebff;font-size:14px;text-align:center;opacity:0;transform:translateY(6px);transition:opacity .45s,transform .45s;box-shadow:0 10px 30px rgba(0,0,0,.5);z-index:6}' +
      '.sl-voice.show{opacity:1;transform:none}' +
      '.sl-skip{position:absolute;bottom:22px;left:0;right:0;text-align:center;font-size:10px;color:rgba(180,205,235,.45);letter-spacing:.1em;z-index:6}';
    document.head.appendChild(s);
  }

  function xpLevel() {
    try { return GS.store.xp.level(); } catch (e) { return { level: 1 }; }
  }

  function summary() {
    var m = GS.store.coreMetrics();
    var score = GS.store.gutScore();
    var zones = GS.store.zoneStates() || [];
    var risky = zones.filter(function (z) { return z.score < 48; });
    var foods = [];
    try { foods = GS.store.diet.eatenToday() || []; } catch (e) {}
    return {
      m: m, score: score,
      lvl: xpLevel(),
      title: D.titleFor ? D.titleFor(xpLevel().level) : '',
      risky: risky,
      foods: foods
    };
  }

  function metricsTable(s) {
    var m = s.m;
    var rows = [
      ['종합 장 건강', s.score + '/100', m.inflammation >= 61 ? 'danger' : (m.inflammation >= 41 ? 'warn' : 'good'), ''],
      ['SCFA · 장 세포 에너지', m.scfa, m.scfa >= 55 ? 'good' : (m.scfa >= 40 ? 'warn' : 'danger'), ''],
      ['장벽 투과성', m.permeability + '', m.permeability < 40 ? 'good' : (m.permeability < 70 ? 'warn' : 'danger'), '낮을수록 양호'],
      ['전신 염증 지수', m.inflammation + '', m.inflammation < 40 ? 'good' : (m.inflammation < 61 ? 'warn' : 'danger'), (m.weather && m.weather.label) || ''],
      ['도파민 감수성', m.dopamine + '', m.dopamine >= 70 ? 'good' : (m.dopamine >= 30 ? 'warn' : 'danger'), (m.dopaState && m.dopaState.label) || ''],
      ['레벨', 'Lv.' + s.lvl.level, 'good', s.title || '']
    ];
    function color(k) { return k === 'good' ? '#168a63' : (k === 'warn' ? '#b98a1e' : '#c44a63'); }
    function bgc(k) { return k === 'good' ? 'rgba(39,216,155,.14)' : (k === 'warn' ? 'rgba(255,196,77,.16)' : 'rgba(255,92,122,.14)'); }
    return '<div class="sl-grid">' + rows.map(function (r) {
      return '<div class="sl-cell" style="background:' + bgc(r[2]) + '"><span class="k">' + r[0] + '</span><span class="v" style="color:' + color(r[2]) + '">' + r[1] + '</span>' +
        (r[3] ? '<span class="sl-badge" style="background:rgba(255,255,255,.6);color:' + color(r[2]) + '">' + r[3] + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }

  function riskyChips(s) {
    if (!s.risky.length) return '<div class="sl-chips"><span class="sl-chip">취약 부위 없음 · 안정</span></div>';
    return '<div class="sl-chips">' + s.risky.map(function (z) {
      return '<span class="sl-chip warn">⚠ ' + esc(z.name) + ' ' + z.score + '</span>';
    }).join('') + '</div>';
  }

  function fill(tpl, fields) {
    return tpl.replace(/\{(\w+)\}/g, function (mm, k) {
      return fields[k] != null ? String(fields[k]) : mm;
    });
  }

  function loadMd(path) {
    return fetch(path).then(function (r) { return r.ok ? r.text() : ''; }).catch(function () { return ''; });
  }

  function drLine(s, name) {
    if (s.score >= 70) return '어서 오세요, ' + esc(name) + ' 레지던트. 깨어나셨군요. 당신의 장은 상당히 건강한 편입니다. 지표를 정리해 드릴게요.';
    if (s.score >= 48) return '어서 오세요, ' + esc(name) + ' 레지던트. 장 상태에 경고등이 절반쯤 켜져 있습니다. 지표를 정리해 드릴게요.';
    return '어서 오세요, ' + esc(name) + ' 레지던트. 당신의 장은 지금 비상등이 켜진 상태입니다. 차분히 분석해 보겠습니다.';
  }

  function mountHuman(src) {
    var p = {};
    try { p = GS.store.profile.get() || {}; } catch (e) {}
    var s = summary();
    var badFoods = s.foods.filter(function (f) { return f.bad; });
    var note = (s.score >= 70)
      ? '최근 식단과 습관이 좋은 방향으로 작용 중 — 유지 전략 중심으로 설명할 것.'
      : (badFoods.length >= 2)
        ? '최근 해로운 음식 섭취가 많음 — 식이 개선 우선순위를 명확히 제시할 것.'
        : '복합적 상태 — SCFA/투과성/염증 간 인과 관계를 중심으로 설명할 것.';
    return fill(src, {
      name: p.name || '레지던트',
      age: (p.age || '?'),
      gutScore: s.score,
      level: 'Lv.' + s.lvl.level + ' ' + s.title,
      scfa: s.m.scfa, permeability: s.m.permeability,
      inflammation: s.m.inflammation, dopamine: s.m.dopamine,
      weather: (s.m.weather && s.m.weather.label) || '—',
      dopaState: (s.m.dopaState && s.m.dopaState.label) || '—',
      riskyZones: s.risky.length ? s.risky.map(function (z) { return z.name + '(' + z.score + ')'; }).join(', ') : '없음',
      recentFoods: s.foods.length ? s.foods.map(function (f) { return f.label + (f.bad ? '(해로움)' : ''); }).join(', ') : '오늘 기록 없음',
      profileNote: note
    });
  }

  function runSlots() {
    var llmBody = document.getElementById('sl-llm');
    if (llmBody && llmBody.dataset && llmBody.dataset.done) return;
    if (llmBody) llmBody.innerHTML = '<span class="busy"></span>종합 소견 분석 중…';

    loadMd('prompts/secretlab-llm.md').then(function (md) {
      var sys = md ? mountHuman(md) : '';
      var user = '위 환자 데이터를 바탕으로 Dr.장의 종합 의학 소견을 작성해주세요.';
      var hasKey = GS.llm && GS.llm.activeProvider();
      if (!sys || !hasKey) {
        if (llmBody) { llmBody.classList.add('empty'); llmBody.innerHTML = '🔌 AI 연결 대기 — config.js에 키를 입력하면 Dr.장의 종합 의학 소견이 이곳에 표시됩니다.'; if (llmBody.dataset) llmBody.dataset.done = '1'; }
        return;
      }
      GS.llm.generateCustom(sys, user, '진단 데이터 기준으로 말씀드릴게요. 장벽 투과성이 올라가면 세균 유래 LPS 내독소가 혈류로 새어 나가 전신 염증 지표(hs-CRP)를 높이고, 이 염증이 도파민 전구물질(L-DOPA) 경로를 눌러 보상 회로 반응을 둔화시킵니다. 회복의 순서는 정해져 있어요 — 식이섬유·발효식품으로 SCFA(부티레이트)를 올려 융모와 밀착연접을 재생하면 투과성이 먼저 내려가고, 염증·도파민이 그 뒤를 따릅니다. 다음 끼니부터 충분히 되돌릴 수 있는 상태예요.').then(function (res) {
        if (!llmBody) return;
        llmBody.classList.remove('empty');
        llmBody.textContent = res.text;
        if (llmBody.dataset) llmBody.dataset.done = '1';
      });
    });
  }

  // 수술대 각성 POV — 흐릿한 복시 → 깜빡×3 → 선명한 수술등 → 플래시
  function playIntro(name, done) {
    var intro = document.getElementById('sl-intro');
    if (!intro) { done(); return; }
    try { sessionStorage.setItem('slPovSeen', '1'); } catch (e) {}
    var scene = intro.querySelector('.sl-pov-scene');
    var lamp = intro.querySelector('.sl-lamp');
    var lamp2 = intro.querySelector('.sl-lamp2');
    var lidT = intro.querySelector('.sl-lid.t');
    var lidB = intro.querySelector('.sl-lid.b');
    var voice = intro.querySelector('.sl-voice');
    var pname = document.getElementById('sl-pname');
    if (pname) pname.textContent = name;
    function setLids(openAmt) {
      if (lidT) lidT.style.transform = 'scaleY(' + (1 - openAmt) + ')';
      if (lidB) lidB.style.transform = 'scaleY(' + (1 - openAmt) + ')';
    }
    function setVision(blur, ghost) {
      if (scene) scene.style.filter = 'blur(' + blur + 'px)';
      if (lamp) lamp.style.opacity = String(Math.max(.25, 1 - blur / 24));
      if (lamp2) { lamp2.style.opacity = String(Math.max(0, ghost)); lamp2.style.marginLeft = (-58 * (blur / 18)) + 'px'; }
    }
    function blinkAfter(ms, nextBlur, nextGhost, open) {
      later(function () {
        setLids(0.08);
        later(function () { setLids(open); setVision(nextBlur, nextGhost); }, 130);
      }, ms);
    }
    setLids(0); setVision(18, 0.4);
    later(function () { setLids(0.62); }, 260);
    blinkAfter(1050, 11, 0.28, 0.78);
    blinkAfter(1850, 5, 0.14, 0.9);
    blinkAfter(2550, 0, 0, 1);
    later(function () {
      var fl = document.createElement('div'); fl.className = 'sl-flash';
      intro.appendChild(fl);
      if (voice) voice.classList.add('show');
      later(function () { if (fl.parentNode) fl.parentNode.removeChild(fl); }, 1300);
    }, 3000);
    var finished = false;
    function finish() {
      if (finished) return; finished = true;
      clearTimers();
      intro.style.opacity = '0';
      later(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 550);
      done();
    }
    later(finish, 4700);
    intro.addEventListener('click', finish, { once: true });
  }


  function ecgMini() {
    return '<svg width="72" height="16" viewBox="0 0 72 16"><polyline points="0,8 14,8 18,2 23,14 27,8 40,8 44,4 48,11 52,8 72,8" fill="none" stroke="#4dffa8" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><animate attributeName="stroke-dasharray" values="0 200;72 200" dur="1.6s" repeatCount="indefinite"/></polyline><polygon points="62,4 71,8 62,12" fill="#4dffa8" opacity=".8"><animate attributeName="opacity" values=".3;.9;.3" dur="1.6s" repeatCount="indefinite"/></polygon></svg>';
  }

  function emojiMini(emo) {
    return '<svg width="20" height="16" viewBox="0 0 20 16"><text x="10" y="13" text-anchor="middle" font-size="12">' + emo + '</text></svg>';
  }

  function render() {
    inject();
    clearTimers();
    var povSeen = false;
    var needIntro = true;

    var p = {};
    try { p = GS.store.profile.get() || {}; } catch (e) {}
    var name = p.name || '레지던트';
    var s = summary();
    var st = GS.llm ? GS.llm.status() : { label: '' };
    var stLabel = st.label || '';
    var imgN = Math.max(10, Math.min(100, Math.round(s.score / 10) * 10));
    var stateLabel = s.score >= 70 ? '안정' : s.score >= 45 ? '주의' : '위험';
    var stateCol = s.score >= 70 ? '#4dffa8' : s.score >= 45 ? '#ffd166' : '#ff7d94';
    var markPct = ((imgN - 10) / 90 * 100).toFixed(1);

    var html =
      '<div class="sl-root">' +
      '<div class="sl-top"><div class="sl-title"><span class="dot"></span>GUT LAB · 비밀 진단실</div>' +
      '<div class="sl-exit" onclick="GS.screens.secretlab.exit()">← 나가기</div></div>' +
      '<div class="sl-djrow"><div style="flex-shrink:0">' + GS.chars.drJang('welcome', 92, { noClick: true }) + '</div>' +
      '<div class="sl-bubble"><div class="sl-tail"></div>' +
      '<div class="sl-djline">' + esc(drLine(s, name)) + '</div>' + metricsTable(s) + riskyChips(s) +
      '</div></div>' +
      '<div class="sl-chalk">' +
        '<span class="sl-cframe tl"></span><span class="sl-cframe tr"></span><span class="sl-cframe bl"></span><span class="sl-cframe br"></span>' +
        '<div class="board">' +
        '<div class="mtag-chalk"><span>🧠 AI 종합 의학 소견</span>' + (stLabel ? '<span style="color:#b8e6a8">· ' + esc(stLabel) + ' 연결됨</span>' : '') + '<span class="live"><i></i>CONSULT</span>' + emojiMini('🩺') + '</div>' +
        '<div class="body empty" id="sl-llm">🔌 AI 연결 대기 — config.js에 키를 입력하면 Dr.장의 종합 의학 소견이 이곳에 표시됩니다.</div>' +
        '<div class="sl-monitor sl-disp" style="margin:10px 0 0"><div class="scr">' +
          '<div class="sl-mtag"><span>🫧 장 상태 디스플레이</span>' + ecgMini() + '</div>' +
          '<div class="sl-disp-imgwrap">' +
            '<img src="imgs/gut_status/' + imgN + '.png" alt="장 상태 ' + imgN + ' 프레임" onerror="this.style.display=\'none\'">' +
            '<div class="state-ov" style="color:' + stateCol + ';border-color:' + stateCol + '55">' + stateLabel + '</div>' +
            '<div class="score-ov"><b style="color:' + stateCol + '">' + s.score + '</b><span>/ 100 · 종합 장 건강</span></div>' +
          '</div>' +
          '<div class="sl-disp-scale">' +
            '<span>10</span>' +
            '<div style="flex:1;position:relative;height:5px;border-radius:3px;background:linear-gradient(90deg,#c44a63,#b98a1e,#168a63)">' +
              '<i style="position:absolute;top:-3.5px;width:3px;height:12px;border-radius:2px;background:#fff;box-shadow:0 0 7px rgba(255,255,255,.9);left:' + markPct + '%"></i>' +
            '</div>' +
            '<span>100</span>' +
          '</div>' +
        '</div></div>' +
      '</div></div>' +
      (needIntro
        ? '<div class="sl-intro" id="sl-intro">' +
          '<div class="sl-pov">' +
            '<div class="sl-pov-scene"><div class="sl-pov-halo"></div><div class="sl-lamp"></div><div class="sl-lamp2"></div></div>' +
            '<div class="sl-pov-vig"></div>' +
            '<div class="sl-lid t"></div><div class="sl-lid b"></div>' +
          '</div>' +
          '<div class="sl-voice"><span id="sl-pname"></span>… 여긴 어디지..?</div>' +
          '<div class="sl-skip">탭하여 건너뛰기</div></div>'
        : '') +
      '</div>';

    if (needIntro) {
      setTimeout(function () {
        playIntro(name, function () {
          setTimeout(function () { runSlots(); }, 60);
        });
      }, 60);
    } else {
      setTimeout(runSlots, 40);
    }
    later(function () {
      var host = document.querySelector('.sl-root');
      var charEl = document.querySelector('.sl-djrow > div:first-child');
      var chalk = document.querySelector('.sl-chalk');
      if (!host || !charEl || !chalk) return;
      var old = document.querySelector('.sl-connector');
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var line = document.createElement('div');
      line.className = 'sl-connector';
      function place() {
        var hr = host.getBoundingClientRect(), cr = charEl.getBoundingClientRect(), kr = chalk.getBoundingClientRect();
        var top = cr.bottom - hr.top;
        var bottom = kr.top - hr.top;
        line.style.left = Math.max(8, Math.min(hr.width - 11, cr.left - hr.left + cr.width / 2)) + 'px';
        line.style.top = top + 'px';
        line.style.height = Math.max(0, bottom - top - 2) + 'px';
      }
      place();
      host.appendChild(line);
      window.addEventListener('resize', place);
      later(place, 1200);
    }, 80);
    return html;
  }

  function exit() {
    if (GS.nav && GS.nav.goBack) GS.nav.goBack();
  }

  GS.screens.secretlab = render;
  GS.screens.secretlab.exit = exit;
})();
