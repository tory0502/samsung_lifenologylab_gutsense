/* GutSense www3 — PROFILE (내 프로필). Accessed via top-right avatar.
 * Level/XP gauge, streak, data-hub as translucent glowing cards.
 * UPGRADE: 3D 구체 → 세로 반투명 카드 3개 (색상별 · 호버 발광 · 클릭 상세 팝업).
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var ui = window.GS.ui, D = window.GS_DATA;

  function injectHubStyle() {
    if (document.getElementById('gs-hubcard-style')) return;
    var s = document.createElement('style'); s.id = 'gs-hubcard-style';
    s.textContent =
      '.hub-card{--c:#37C7FF;position:relative;border-radius:18px;padding:14px 12px 12px;background:rgba(8,20,44,.58);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1.5px solid var(--c)44;overflow:hidden;cursor:pointer;transition:transform .22s ease, box-shadow .22s ease, background .22s ease, border-color .22s ease;flex:1;min-width:0}' +
      '.hub-card:hover{transform:translateY(-5px);background:rgba(12,30,64,.8);border-color:var(--c);box-shadow:0 14px 34px rgba(0,0,0,.4), 0 0 26px var(--c)40, inset 0 0 22px var(--c)14}' +
      '.hub-card::before{content:"";position:absolute;top:0;left:8%;right:8%;height:2px;background:linear-gradient(90deg,transparent,var(--c),transparent);opacity:.5;transition:opacity .22s}' +
      '.hub-card:hover::before{opacity:1;height:3px}' +
      '.hub-card .hub-scan{position:absolute;left:0;right:0;top:-30%;height:26%;background:linear-gradient(180deg,transparent,var(--c)26,transparent);opacity:0;transition:opacity .22s;pointer-events:none}' +
      '.hub-card:hover .hub-scan{opacity:1;animation:hubScanY 1.6s ease-in-out infinite}' +
      '@keyframes hubScanY{0%{top:-30%}50%{top:104%}100%{top:-30%}}' +
      '.hub-icon{width:46px;height:46px;margin:0 auto 8px;border-radius:14px;background:linear-gradient(135deg,var(--c)30,var(--c)0d);border:1.5px solid var(--c)66;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 6px 16px var(--c)26;transition:box-shadow .22s,transform .22s}' +
      '.hub-card:hover .hub-icon{box-shadow:0 8px 22px var(--c)55;transform:scale(1.08)}' +
      '.hub-badge{display:inline-flex;align-items:center;gap:4px;font-size:8px;color:var(--c);background:var(--c)18;border:1px solid var(--c)44;padding:2px 7px;border-radius:999px;font-weight:700}' +
      '.hub-badge i{width:4px;height:4px;border-radius:50%;background:var(--c);box-shadow:0 0 5px var(--c);animation:blink 1.2s infinite}';
    document.head.appendChild(s);
  }

  function hubCards() {
    injectHubStyle();
    var CARDS = [
      { k: 'medical', c: '#37C7FF', icon: '🩺', char: '🧪', l: '의료 데이터', s: 'EMR · LIS · PACS', badge: 'LIVE', foot: '혈청·대변 6종 지표 스트리밍' },
      { k: 'aidiet', c: '#27D89B', icon: '👓', char: '🥗', l: '식단 AI 스캔', s: '삼성 AI 렌즈', badge: 'REC', foot: '실시간 음식 자동 감지' },
      { k: 'biosensor', c: '#A98CFF', icon: '⌚', char: '📡', l: '웨어러블 센서', s: '4기기 동시 계측', badge: '512Hz', foot: '워치·로봇·복약·스킨' }
    ];
    var cards = CARDS.map(function (d) {
      return '<div class="hub-card" style="--c:' + d.c + '" onclick="GS.screens.gutmap.sourceDetail(\'' + d.k + '\', null)">' +
        '<div class="hub-scan"></div>' +
        '<div class="hub-icon">' + d.icon + '</div>' +
        '<div style="text-align:center;margin-bottom:5px"><span style="font-size:12.5px;color:var(--ink);font-weight:700">' + d.l + '</span></div>' +
        '<div style="text-align:center;margin-bottom:7px"><span class="hub-badge"><i></i>' + d.badge + '</span></div>' +
        '<div class="micro" style="text-align:center;color:var(--cyan2);margin-bottom:4px">' + d.s + '</div>' +
        '<div style="position:relative;height:52px;border-radius:11px;background:rgba(4,12,28,.55);border:1px solid ' + d.c + '22;display:flex;align-items:center;justify-content:center;gap:6px;overflow:hidden">' +
          '<span style="font-size:26px;animation:bob 2.6s ease-in-out infinite">' + d.char + '</span>' +
          '<span style="font-size:16px;opacity:.5">' + (d.k === 'medical' ? '💉' : d.k === 'aidiet' ? '🍲' : '💊') + '</span>' +
          '<span style="position:absolute;bottom:4px;right:7px;font-size:12px;color:' + d.c + ';animation:gs-twinkle 1.8s ease-in-out infinite">✦</span>' +
          '<span style="position:absolute;top:5px;left:8px;font-size:8px;color:' + d.c + '88;font-family:monospace">SYNC</span>' +
        '</div>' +
        '<div class="micro" style="text-align:center;color:var(--ink-faint);margin-top:7px;font-size:8.5px">' + d.foot + '</div>' +
      '</div>';
    }).join('');
    return '<div class="micro" style="color:var(--cyan2);margin-bottom:9px">' + ui.star() + ' 데이터 허브 · 3개 소스가 장 디지털 트윈으로 흐르고 있어요</div>' +
      '<div style="display:flex;gap:9px;align-items:stretch">' + cards + '</div>' +
      '<div class="micro" style="text-align:center;margin-top:8px;color:var(--ink-faint)">카드를 탭하면 상세 분석이 열려요</div>';
  }

  function render() {
    var p = GS.store.profile.get();
    if (!p) return '<div class="pad" style="color:var(--ink-dim)">프로필이 없습니다.</div>';
    var raw = GS.store.raw();
    var lvl = GS.store.xp.level();
    var questCount = raw.questDone.length;
    var m = GS.store.coreMetrics();
    var score = GS.store.gutScore();
    var streak = GS.store.streak();
    var xpPct = Math.round(lvl.into / Math.max(1, lvl.span) * 100);
    var mascot = score < 40 ? 'danger' : score > 65 ? 'recovered' : 'warn';

    var segs = ''; var lit = Math.round(xpPct / 10); for (var i = 0; i < 10; i++) segs += '<div style="flex:1;height:8px;border-radius:2px;background:' + (i < lit ? ui.T.cyan : 'rgba(122,220,255,.14)') + (i < lit ? ';box-shadow:0 0 5px ' + ui.T.cyan + '66' : '') + '"></div>';

    return '<div class="pad">' +
      '<div style="margin-bottom:10px">' + ui.stageTag('내 프로필') + '<div class="h1" style="margin-top:6px">레지던트 카드</div></div>' +
      ui.panel('<div style="display:flex;align-items:center;gap:14px">' +
          '<div style="flex-shrink:0">' + GS.chars.gutMascot(mascot, 80) + '</div>' +
          '<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px"><div style="position:relative;width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,' + ui.T.cyan + ',' + ui.T.violet + ');padding:2.5px;flex-shrink:0"><div style="width:100%;height:100%;border-radius:50%;background:#0E2244;display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden">' + GS.chars.avatarHtml(p.avatar, 42) + '</div></div>' +
            '<div><div style="font-size:17px;color:var(--ink)">' + p.name + '</div><div class="cap">' + (p.gender === 'female' ? '여성' : '남성') + ' · ' + p.age + '세 · ' + D.LIFESTYLES[p.lifestyle].label + '</div></div></div>' +
            ui.levelBadge(lvl.level, D.titleFor(lvl.level)) + '</div>' +
        '</div>' +
          '<div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--ink-dim);margin-bottom:5px"><span class="micro" style="color:var(--cyan2)">' + ui.star() + ' 경험치 XP</span><span>' + raw.xp + ' · 다음까지 ' + Math.max(0, lvl.next - raw.xp) + '</span></div><div style="display:flex;gap:2px">' + segs + '</div></div>' +
        '<div style="margin-top:10px">' + ui.streak(streak.days) + '</div>',
      { pad: '14px' }) +
      '<div style="height:8px"></div>' +
      ui.panel(hubCards(), { pad: '12px' }) +
      '<div style="height:8px"></div>' +
      GS.drjang.renderSmart({ metrics: m, foods: GS.store.diet.foodsToday(), streak: streak.days, questDone: questCount }, { size: 72 }) +
      '<div style="height:8px"></div>' +
      ui.panel('<div style="margin-top:4px">' + ui.btn('로그아웃', { ghost: true, onclick: 'GS.screens.login.confirmLogout()' }) + '</div>',
      { pad: '14px' }) +
      '<div class="micro" style="text-align:center;padding:12px 0 calc(env(safe-area-inset-bottom,0px) + 10px)">BIO-TWIN ENGINE · 당신의 장 속 우주</div></div>';
  }
  GS.screens.profile = render;
})();
