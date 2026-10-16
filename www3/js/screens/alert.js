/* GutSense www3 — ALERT → BELL POPUP. 이상 감지가 우상단 벨 아이콘으로 전환.
 * 벨 클릭 시 Dr.장이 현재 상태 요약 + 확인할 화면 추천 + 행동 피드백을
 * 게임 스타일 팝업으로 제공. UPGRADE: 페이지→벨 전환.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var ui = window.GS.ui, D = window.GS_DATA;

  function bellPopup() {
    var alerts = GS.store.alerts.active();
    var m = GS.store.coreMetrics();
    var score = GS.store.gutScore();
    var foods = GS.store.diet.foodsToday();
    var badFoods = foods.filter(function (f) { return f.bad; });
    var goodFoods = foods.filter(function (f) { return !f.bad; });
    var streak = GS.store.streak();
    var danger = m.inflammation >= 60 || m.permeability >= 65 || score < 40;
    var warn = !danger && (m.inflammation >= 40 || badFoods.length > 0 || alerts.length > 0);

    var statusCol = danger ? ui.T.red : warn ? ui.T.amber : ui.T.green;
    var statusIcon = danger ? '🔴' : warn ? '🟡' : '🟢';
    var statusLabel = danger ? '위험 · 즉시 행동 필요' : warn ? '주의 · 개선 여지 있음' : '안정 · 좋은 상태 유지';

    var issues = [];
    if (m.inflammation >= 60) issues.push({ icon: '🔥', t: '염증 폭풍', d: '전신 염증(' + m.inflammation + ')이 높아요', goto: 'gutmap', gotoLabel: '장 맵에서 인과 확인' });
    if (m.permeability >= 60) issues.push({ icon: '🧱', t: '장 누수 위험', d: '투과성(' + m.permeability + ')이 높아 LPS 유입 추정', goto: 'gutmap', gotoLabel: '장 맵에서 균열 확인' });
    if (m.dopamine < 35) issues.push({ icon: '🫥', t: '도파민 탈진', d: '염증이 도파민 회복을 막고 있어요', goto: 'quest', gotoLabel: '리셋 챌린지로 회복' });
    if (badFoods.length >= 2) issues.push({ icon: '⚠️', t: '해로운 식단 조합', d: badFoods.slice(0, 2).map(function (f) { return f.label; }).join('+') + ' 조합 감지', goto: 'diet', gotoLabel: '식단에서 교체' });
    alerts.forEach(function (a) { issues.push({ icon: a.sev === 'high' ? '🔴' : '🟡', t: a.title, d: a.why, goto: 'gutmap', gotoLabel: '상세 분석' }); });
    if (!issues.length) issues.push({ icon: '✅', t: '이상 신호 없음', d: '장 생태계가 안정적이에요', goto: 'quest', gotoLabel: '미션으로 레벨업' });

    var line;
    if (danger) line = '지금 장 상태가 위험해요! ' + issues[0].d + '. 당장 ' + (issues[0].gotoLabel || '개선') + '을(를) 시작해요. 48시간 리셋이 가장 빠른 회복이에요.';
    else if (warn) line = issues[0].t + '가 감지됐어요. ' + issues[0].d + '. 지금 대처하면 악화를 막을 수 있어요.';
    else line = '장 생태계가 안정적이에요! GUT 점수 ' + score + ', ' + (m.dopamine >= 70 ? '도파민도 생기' : m.dopamine >= 30 ? '도파민은 보통' : '도파민이 낮음') + ' 상태예요. 미션으로 더 레벨업해봐요!';

    var issuesHtml = issues.slice(0, 4).map(function (iss) {
      return '<div style="display:flex;gap:9px;align-items:flex-start;padding:10px;border-radius:13px;background:rgba(8,18,40,.4);border:1px solid ' + statusCol + '22;margin-bottom:7px">' +
        '<div style="font-size:16px;flex-shrink:0">' + iss.icon + '</div>' +
        '<div style="flex:1;min-width:0"><div style="font-size:12px;color:var(--ink)">' + iss.t + '</div><div class="cap" style="font-size:10px;margin-top:2px">' + iss.d + '</div></div>' +
        '<div onclick="GS.ui.closeModal();GS.nav.go(\'' + iss.goto + '\')" style="flex-shrink:0;font-size:9px;color:' + ui.T.cyan + ';padding:5px 8px;border-radius:8px;background:rgba(55,199,255,.12);cursor:pointer;white-space:nowrap">' + iss.gotoLabel + ' ›</div>' +
      '</div>';
    }).join('');

    var body = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:12px;border-radius:14px;background:linear-gradient(135deg,' + statusCol + '18,' + statusCol + '06);border:1px solid ' + statusCol + '33">' +
        '<div style="width:46px;height:46px;border-radius:14px;background:' + statusCol + '22;display:flex;align-items:center;justify-content:center;font-size:22px;animation:pulse 1.5s infinite">' + statusIcon + '</div>' +
        '<div><div class="h2" style="color:' + statusCol + '">' + statusLabel + '</div><div class="cap">GUT ' + score + ' · 염증 ' + m.inflammation + ' · 도파민 ' + m.dopamine + '</div></div>' +
      '</div>' +
      issuesHtml +
      '<div style="margin-top:8px">' + GS.drjang.render(danger ? 'warn' : warn ? 'cheer' : 'celebrate', line, { size: 72 }) + '</div>';

    ui.modal('🔔 장 상태 알림', body, {
      footer: (danger ? ui.btn('🧬 48시간 리셋 시작', { violet: true, onclick: 'GS.screens.alert.startResetGuide()' }) + '<div style="height:8px"></div>' : '') +
        ui.btn('닫기', { ghost: true, onclick: 'GS.ui.closeModal()' })
    });
  }

  function startResetGuide() {
    GS.ui.closeModal();
    GS.store.reset.start();
    if (GS.fx2) GS.fx2.screenFlash('rgba(169,140,255,.2)');
    ui.toast('48시간 리셋 시작! 🧬', 'success');
    if (GS.story) GS.story.beat('reset-start', { force: true });
    setTimeout(function () {
      var body = '<div style="text-align:center;margin-bottom:14px"><div style="font-size:28px">🧬</div><div class="h2" style="color:#C9B6FF;margin-top:4px">48시간 리셋 챌린지 시작!</div></div>' +
        '<div style="padding:12px;background:rgba(55,199,255,.06);border-radius:12px;margin-bottom:10px"><div class="cap" style="line-height:1.7">' +
        '<b style="color:var(--cyan2)">지금부터 48시간 동안:</b><br>' +
        '① <b>무가당·무감미료 식단</b> 유지 (제로음료, 저당과자 금지)<br>' +
        '② 미션 <b>' + D.RESET_CHALLENGE.requireQuests + '개 이상</b> 완료 (식이섬유, 발효식품 등)<br>' +
        '③ 식단 페이지에서 <b>오늘의 식단 확인</b><br>' +
        '</div></div>' +
        '<div style="padding:10px;background:rgba(39,216,155,.08);border-radius:12px;margin-bottom:10px"><div class="cap"><b style="color:var(--green)">완료 보상:</b> 장벽 균열 아물음 + 도파민 회복 상한선 해제 (+25)</div></div>' +
        GS.drjang.render('cheer', '이제 식단 페이지로 가서 무가당 식단을 확인하고, 미션을 완료해보세요. 발효식품(김치·요거트)과 식이섬유가 장벽 회복을 앞당겨요!', { size: 70 });
      ui.modal('48시간 리셋 가이드', body, {
        footer: ui.btn('식단 페이지로 →', { violet: true, blink: true, onclick: 'GS.ui.closeModal();GS.nav.go(\'diet\')' }) + '<div style="height:8px"></div>' +
          ui.btn('미션 보기', { ghost: true, onclick: 'GS.ui.closeModal();GS.nav.go(\'quest\')' })
      });
    }, 1800);
  }

  function render() {
    return '<div class="pad" style="text-align:center;padding-top:40px"><div style="font-size:40px">🔔</div><div class="h2" style="margin-top:8px">이상 감지</div><div class="cap" style="margin-top:6px">이상 감지는 우상단 벨 아이콘으로 통합됐어요.<br>벨을 탭하면 Dr.장이 상태를 분석해드려요.</div></div>';
  }

  GS.screens.alert = render;
  GS.screens.alert.bellPopup = bellPopup;
  GS.screens.alert.startResetGuide = startResetGuide;
})();
