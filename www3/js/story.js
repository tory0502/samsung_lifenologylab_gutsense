/* GutSense www3 — RPG narrative engine. JRPG-style dialogue box (portrait +
 * typewriter) with contextual story beats involving Dr.장, 장구(gut mascot),
 * 도파민이. Triggers fire on profile switch / first zone visit / danger / etc.
 * Exposed as window.GS.story = { show, beat }.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var ui = (window.GS && window.GS.ui) || { T: {} };
  var seen = {}; // beatIds already shown once (avoids spamming)

  function inject() {
    if (document.getElementById('gs3-story-style')) return;
    var s = document.createElement('style'); s.id = 'gs3-story-style';
    s.textContent =
      '#gsStory{position:absolute;inset:0;z-index:150;display:none;align-items:flex-end;justify-content:center}' +
      '#gsStory.show{display:flex}' +
      '.story-backdrop{position:absolute;inset:0;background:rgba(4,10,22,.45);backdrop-filter:blur(3px)}' +
      '.story-box{position:relative;width:100%;max-width:430px;background:linear-gradient(160deg,rgba(20,40,78,.97),rgba(10,22,48,.98));border:1px solid rgba(122,220,255,.24);border-radius:24px 24px 0 0;padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 18px);box-shadow:0 -10px 40px rgba(0,0,0,.5);animation:storyUp .3s cubic-bezier(.22,1,.36,1)}' +
      '@keyframes storyUp{from{transform:translateY(50px);opacity:.4}to{transform:translateY(0);opacity:1}}' +
      '.story-row{display:flex;gap:13px;align-items:flex-end}' +
      '.story-port{flex-shrink:0;animation:storyBob 2.6s ease-in-out infinite}' +
      '@keyframes storyBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
      '.story-name{font-size:13px;font-weight:400;color:var(--cyan);margin-bottom:6px}' +
      '.story-text{font-size:14px;line-height:1.6;color:var(--ink);min-height:48px}' +
      '.story-adv{position:absolute;right:18px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);font-size:16px;color:var(--cyan);animation:storyBlink 1s steps(2) infinite}' +
      '@keyframes storyBlink{0%,100%{opacity:1}50%{opacity:.2}}' +
      '.story-skip{position:absolute;top:12px;right:14px;font-size:10px;color:var(--ink-faint);cursor:pointer;padding:4px 9px;border-radius:999px;background:rgba(122,220,255,.08)}';
    document.head.appendChild(s);
  }

  // character portrait + display name by speaker id
  function speaker(id) {
    if (id === 'gut') return { name: '장구', portrait: function () { return GS.chars.gutMascot('happy', 64); } };
    if (id === 'dopa') { var d = (GS.store && GS.store.coreMetrics) ? GS.store.coreMetrics().dopamine : 60; return { name: '도파민이', portrait: function () { return GS.chars.dopamine(d, 52); } }; }
    if (id === 'narr') return { name: '', portrait: function () { return ''; } };
    return { name: 'Dr.장', portrait: function () { return GS.chars.drJang('explain', 72); } };
  }

  // Contextual beats — each selects lines based on current state.
  function buildBeat(id) {
    var S = GS.store || {};
    var m = S.coreMetrics ? S.coreMetrics() : {};
    var p = S.profile ? S.profile.get() : {};
    var score = S.gutScore ? S.gutScore() : 50;
    var name = (p && p.name) || '레지던트';
    var bad = m.inflammation >= 60 || score < 40;
    var good = m.inflammation < 30 && score >= 60;
    if (id === 'switch') {
      if (bad) return [
        { c: 'gut', t: '으악… ' + name + '님 장에서 LPS가 새어 나오는 느낌이에요. 투과성이 너무 높아요!' },
        { c: 'drjang', t: '맞아요. 장벽에 균열이 생겨 염증 폭풍이 났고, 도파민 회복 상한선까지 눌린 상태예요.' },
        { c: 'dopa', t: '…힘들어. 좋은 음식 먹어도 반응이 잘 안 와.' },
        { c: 'drjang', t: '걱정 마세요. 발효식품 한 끼부터 시작하면 장구 벽이 먼저 아물 거예요.' }
      ];
      if (good) return [
        { c: 'gut', t: '으쌰으쌰! ' + name + '님 장벽 탄탄해요! 유익균들이 신나 있어요!' },
        { c: 'dopa', t: '⚡ 나도 생기! 보상 회로가 잘 반응하고 있어!' },
        { c: 'drjang', t: '훌륭해요. 부티레이트 생성균이 장벽을 지키고 있어요. 이 패턴을 유지해요.' }
      ];
      return [
        { c: 'gut', t: name + '님 반가워요! 저 장구, 오늘도 장벽 지키는 중이에요.' },
        { c: 'drjang', t: '지금 장 상태는 중간. 매일의 한 끼가 어느 방향으로 갈지 결정해요.' }
      ];
    }
    if (id === 'intro-gutmap') return [
      { c: 'drjang', t: '여기가 장 생태계 지도예요. 입→소장→대장까지 9개 부위가 살고 있어요.' },
      { c: 'gut', t: '각 부위마다 제 친구들이 있어요! 투과성이 높은 부위는 균열이 져서 빨간 입자가 새어 나가요.' },
      { c: 'drjang', t: '부위를 탭하면 상세 분석, 드래그하면 장을 돌려볼 수 있어요. 한 번 만져보세요!' }
    ];
    if (id === 'danger') return [
      { c: 'gut', t: '아야… S상결장 쪽이 깨지는 느낌이에요!' },
      { c: 'drjang', t: '가공육·저섬유 식단이 점막을 약하게 만들었어요. 식이섬유 한 끼가 응급 처치예요.' }
    ];
    if (id === 'quest-done') return [
      { c: 'dopa', t: '⚡ 퀘스트 클리어! 기분 좋아!' },
      { c: 'drjang', t: '잘했어요. 스캐너가 자동으로 인식해 포인트를 적립했어요. 레벨 상승이 가까워요.' }
    ];
    if (id === 'reset-start') return [
      { c: 'gut', t: '48시간 무가당 도전! 내 점막이 아물 수 있어?' },
      { c: 'drjang', t: '네. 무가당·무감미료 48시간이면 균열이 아물고 도파민 회복 한계가 풀려요. 같이 해봐요.' }
    ];
    if (id === 'reset-done') return [
      { c: 'gut', t: '벽이 아물었어요! 유익균들이 돌아왔어요!' },
      { c: 'dopa', t: '⚡ 한계 풀림! 100%까지 회복 가능해!' },
      { c: 'drjang', t: '장-뇌 축이 리셋됐어요. 이게 CORE 시스템이 하나로 연결된 순간이에요.' }
    ];
    return null;
  }

  var typing = null, lineIdx = 0, curLines = null;

  function renderLine() {
    if (!curLines || lineIdx >= curLines.length) { close(); return; }
    var ln = curLines[lineIdx];
    var sp = speaker(ln.c);
    var box = document.querySelector('.story-box');
    if (!box) return;
    var portWrap = '<div class="story-port">' + sp.portrait() + '</div>';
    box.querySelector('.story-row').innerHTML = portWrap +
      '<div style="flex:1;min-width:0"><div class="story-name">' + sp.name + '</div><div class="story-text" id="storyText"></div></div>';
    var el = document.getElementById('storyText');
    // typewriter
    if (typing) clearInterval(typing);
    var i = 0, full = ln.t;
    el.textContent = '';
    typing = setInterval(function () {
      el.textContent = full.slice(0, ++i);
      if (i >= full.length) { clearInterval(typing); typing = null; }
    }, 28);
  }

  function advance() {
    // if still typing, fast-forward to full line first
    if (typing) { clearInterval(typing); typing = null; var el = document.getElementById('storyText'); if (el && curLines[lineIdx]) el.textContent = curLines[lineIdx].t; return; }
    lineIdx++;
    renderLine();
  }

  function show(beatId, opts) {
    opts = opts || {};
    inject();
    if (seen[beatId] && !opts.force) return; // play each beat once per session
    seen[beatId] = true;
    curLines = buildBeat(beatId);
    if (!curLines) return;
    lineIdx = 0;
    var app = document.querySelector('.app');
    if (!app) return;
    var ov = document.createElement('div');
    ov.id = 'gsStory';
    ov.innerHTML = '<div class="story-backdrop"></div><div class="story-box"><div class="story-skip" onclick="GS.story.hide()">스킵 ✕</div><div class="story-row"></div><div class="story-adv">▼</div></div>';
    app.appendChild(ov);
    ov.classList.add('show');
    ov.addEventListener('click', advance);
    renderLine();
  }
  function close() {
    var ov = document.getElementById('gsStory');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    if (typing) { clearInterval(typing); typing = null; }
    curLines = null;
  }
  function beat(id, opts) { show(id, opts); }
  function hide() { close(); }

  GS.story = { show: show, beat: beat, hide: hide };
})();
