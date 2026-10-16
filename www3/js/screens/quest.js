/* GutSense www3 — MISSION (미션 & 보상). Reset challenge (intuitive progress),
 * horizontal sliding mission cards, Dr.장 explains AI auto-detection system,
 * streak with flame effects, weekly ranking popup. Confetti on completion.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var ui = window.GS.ui, D = window.GS_DATA;

  if (!document.getElementById('gs-quest-flame-style')) {
    var qfs = document.createElement('style'); qfs.id = 'gs-quest-flame-style';
    qfs.textContent =
      '@keyframes gsFlame{0%,100%{transform:scale(1) rotate(-4deg);filter:drop-shadow(0 0 5px #FF8A4D) drop-shadow(0 0 10px rgba(255,196,77,.65))}25%{transform:scale(1.18) rotate(3deg) translateY(-2px);filter:drop-shadow(0 0 9px #FF5C7A) drop-shadow(0 0 16px rgba(255,196,77,.9))}50%{transform:scale(.94) rotate(-2deg);filter:drop-shadow(0 0 6px #FFC44D) drop-shadow(0 0 12px rgba(255,138,77,.8))}75%{transform:scale(1.12) rotate(4deg) translateY(-1px);filter:drop-shadow(0 0 8px #FF8A4D) drop-shadow(0 0 14px rgba(255,92,122,.85))}}' +
      '.gs-flame{display:inline-block;animation:gsFlame .9s ease-in-out infinite;transform-origin:50% 85%}';
    document.head.appendChild(qfs);
  }

  function resetAvatarBox(rc, prof) {
    var mood = rc.complete ? 'bigSmile' : (rc.noSugar ? 'sweat' : 'cry');
    var cap = rc.complete ? '완료!' : (rc.noSugar ? '땀 흘리며 진행 중' : '가당 감지 · 우는 중');
    return { html: '<div style="width:44px;height:44px;border-radius:14px;background:rgba(169,140,255,.14);border:1.5px solid rgba(169,140,255,.45);display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 14px rgba(123,97,255,.3);animation:bob 2s infinite">' + GS.chars.avatarFace(prof && prof.avatar, mood, 36) + '</div>', cap: cap };
  }

  function render() {
    var done = GS.store.quests.done();
    var total = D.QUESTS.length;
    var m = GS.store.coreMetrics();
    var streak = GS.store.streak();
    var rc = GS.store.reset.status();
    var auto = GS.store.quests.autoSignals();
    var prof = GS.store.profile.get() || {};
    var ctx = { metrics: m, foods: GS.store.diet.foodsToday(), streak: streak.days, questDone: done.length, resetActive: rc.active, resetHours: rc.hours };
    var av = resetAvatarBox(rc, prof);

    var resetCard = rc.active
      ? ui.panel(
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">' + av.html + '<div style="flex:1"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:13px;color:#C9B6FF;font-weight:700">장 리셋 챌린지</span><span style="font-size:12px;animation:gs-twinkle 1.6s ease-in-out infinite;display:inline-block">✨</span><span style="display:inline-flex;align-items:center;gap:4px;font-size:9px;color:#C9B6FF;background:rgba(169,140,255,.16);border:1px solid rgba(169,140,255,.45);padding:2px 8px;border-radius:999px"><span style="width:5px;height:5px;border-radius:50%;background:#A98CFF;box-shadow:0 0 6px #A98CFF;animation:blink 1.1s infinite"></span>' + av.cap + '</span></div><div class="micro">' + prof.name + ' · ' + rc.hours + '시간/48시간 진행 중.. · 무가당 식단으로 장벽 균열 아물히는 중</div></div><div class="num" style="font-size:18px;color:var(--cyan)">' + rc.hours + '<span style="font-size:10px;color:var(--ink-dim)">h</span></div></div>' +
          '<div style="position:relative;height:10px;border-radius:5px;background:rgba(169,140,255,.12);overflow:hidden;margin-bottom:8px">' +
            '<div style="position:absolute;top:0;left:0;bottom:0;width:' + Math.round(rc.hours/48*100) + '%;background:linear-gradient(90deg,#7B61FF,#A98CFF,#7ADCFF);border-radius:5px;box-shadow:0 0 10px rgba(169,140,255,.5);transition:width .5s"></div>' +
            '<div style="position:absolute;top:0;bottom:0;left:0;width:' + Math.round(rc.hours/48*100) + '%;overflow:hidden;pointer-events:none"><div style="position:absolute;inset:0;background:linear-gradient(100deg,transparent 25%,rgba(255,255,255,.5) 50%,transparent 75%);background-size:200% 100%;animation:gs-shimmer 2s linear infinite"></div></div>' +
            '<div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(255,255,255,.2)"></div>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--ink-dim)"><span>🔥 ' + rc.hours + '시간/48시간 진행 중..</span><span>48h 완료 → 균열 아물음 ✓</span></div>' +
          '<div style="margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(169,140,255,.08);border:1px solid rgba(169,140,255,.2)"><div class="micro" style="color:#C9B6FF;margin-bottom:3px">🔬 왜 48시간일까요?</div><div class="cap" style="font-size:10px;color:var(--ink-dim);line-height:1.6">장내 미생물은 식단 변화에 24~48시간 내에 반응해요. 식단을 바꾸면 장내 균총 조성이 단 하루 만에 바뀌기 시작하고 며칠 안에 안정화돼요 (David et al., <i>Nature</i> 2014). 즉 48시간은 <b style="color:#C9B6FF">"체감 가능한 최소 변화 단위"</b>예요.</div></div>' +
          '<div style="display:flex;gap:6px;margin-top:8px"><span style="font-size:9px;padding:3px 8px;border-radius:7px;background:' + (rc.noSugar ? ui.T.green + '22;color:' + ui.T.green : ui.T.red + '22;color:' + ui.T.red) + '">' + (rc.noSugar ? '✓ 무가당 유지' : '⚠ 가당 감지') + '</span><span style="font-size:9px;padding:3px 8px;border-radius:7px;background:rgba(169,140,255,.16);color:#C9B6FF">미션 ' + rc.quests + '/' + D.RESET_CHALLENGE.requireQuests + '</span></div>',
          { glow: true, pad: '14px', mb: 10 })
      : '<div onclick="GS.screens.quest.startReset()" style="cursor:pointer">' + ui.panel(
          '<div style="display:flex;align-items:center;gap:10px"><div style="width:38px;height:38px;border-radius:12px;background:linear-gradient(135deg,var(--violet),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:18px;animation:bob 2s infinite">✨</div>' +
          '<div style="flex:1"><div style="font-size:12px;color:#C9B6FF;font-weight:700">48시간 리셋 챌린지</div><div class="micro">무가당 48시간 + 미션 ' + D.RESET_CHALLENGE.requireQuests + '개 → 장벽 균열 아물고 도파민 상한선 해제</div><div class="cap" style="font-size:9.5px;color:var(--ink-faint);margin-top:4px;line-height:1.5">🔬 근거: 균총은 식단 변화 후 하루 만에 바뀌기 시작 — 48시간은 체감 가능한 최소 변화 단위 (David et al., <i>Nature</i> 2014)</div></div>' +
          '<div style="color:#C9B6FF;font-size:12px;white-space:nowrap">시작 ›</div></div>',
          { glow: true, pad: '14px', mb: 10 }) + '</div>';

      var missionTarget = Math.min(rc.active ? rc.quests : done.length, total);
      var checkedMap = {}, checkedN = 0;
      D.QUESTS.forEach(function (q) { if (done.indexOf(q.id) >= 0) { checkedMap[q.id] = 1; checkedN++; } });
      D.QUESTS.forEach(function (q) { if (checkedN < missionTarget && !checkedMap[q.id]) { checkedMap[q.id] = 1; checkedN++; } });

      var missionCards = D.QUESTS.map(function (q) {
        var isDone = !!checkedMap[q.id];
        var sig = auto[q.id];
        var detected = sig && sig.detected;
        var cardBg = isDone ? 'rgba(39,216,155,.12)' : detected ? 'rgba(55,199,255,.1)' : 'rgba(8,18,40,.3)';
        var cardBorder = isDone ? ui.T.green + '44' : detected ? 'rgba(55,199,255,.25)' : 'rgba(122,220,255,.1)';
        var col = isDone ? ui.T.green : detected ? ui.T.cyan : ui.T.faint;
        return '<div class="panel tight fadeIn" style="min-width:165px;max-width:175px;padding:12px;background:' + cardBg + ';border-color:' + cardBorder + ';position:relative;transition:background .5s,border-color .5s">' +
          (isDone ? '<div style="position:absolute;top:6px;right:6px;width:18px;height:18px;border-radius:5px;background:' + ui.T.green + ';display:flex;align-items:center;justify-content:center;font-size:11px;color:#04101F;box-shadow:0 0 8px ' + ui.T.green + '66">✓</div>' : '<div style="position:absolute;top:6px;right:6px;width:18px;height:18px;border-radius:5px;border:1.5px solid rgba(122,220,255,.3);display:flex;align-items:center;justify-content:center"></div>') +
          (detected && !isDone ? '<div style="position:absolute;top:6px;left:6px;font-size:8px;color:' + ui.T.cyan + ';background:rgba(55,199,255,.15);padding:2px 5px;border-radius:5px">👓 감지</div>' : '') +
          '<div style="text-align:center;margin-bottom:6px;margin-top:8px"><div style="width:38px;height:38px;margin:0 auto;border-radius:12px;background:' + col + '1F;display:flex;align-items:center;justify-content:center;font-size:18px">' + (q.icon || '⭐') + '</div></div>' +
          '<div style="font-size:12px;color:var(--ink);text-align:center;margin-bottom:3px">' + q.title + '</div>' +
          '<div class="cap" style="font-size:10px;text-align:center">' + q.cond + '</div>' +
          '<div style="display:flex;gap:4px;justify-content:center;margin-top:6px">' +
            '<span style="font-size:8px;padding:2px 6px;border-radius:6px;background:' + ui.T.violet + '1F;color:#C9B6FF">+' + q.xp + ' XP</span>' +
          '</div>' +
        '</div>';
      }).join('');

    var rankBtn = '<div onclick="GS.screens.quest.openRanking()" style="cursor:pointer">' + ui.panel('<div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,var(--amber),var(--orange));display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 4px 12px rgba(255,196,77,.3)">🏆</div><div style="flex:1"><div style="font-size:13px;color:var(--ink)">주간 랭킹</div><div class="micro">내 또래·비슷한 습관 1~5위 + 내 순위</div></div><div style="color:var(--amber);font-size:16px">›</div></div>', { pad: '11px 14px', mb: 10 }) + '</div>';

    var streakHtml = (function () {
      var lv = streak.current ? streak.current : { tier: 'Lv.1', icon: '🥉', color: '#CD7F32' };
      var streakDesc = streak.days === 0 ? '시작해보세요!' : streak.days < 3 ? '3일 달성 시 Lv.2!' : streak.days < 5 ? '5일 달성 시 Lv.3!' : streak.days < 7 ? '7일 달성 시 Lv.4!' : '7일+ 달성! 대단해요!';
      var flameSize = Math.min(7, streak.days);
      var flames = '';
      for (var i = 0; i < flameSize; i++) flames += '<span class="gs-flame" style="font-size:' + (13 + i * 1.5) + 'px;animation-delay:' + (i * 0.12).toFixed(2) + 's;animation-duration:' + (0.8 + i * 0.07).toFixed(2) + 's">🔥</span>';
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(20,40,78,.5);border:1px solid ' + lv.color + '44;border-radius:16px;margin-bottom:10px">' +
        '<div>' + (flames || '<span style="font-size:16px;opacity:.3">🔥</span>') + '</div>' +
        '<div style="flex:1"><div style="font-size:13px;color:var(--ink);font-weight:700">연속 ' + streak.days + '일 미션 완료!</div>' +
        '<div style="font-size:10px;color:' + lv.color + '">' + lv.icon + ' 꾸준함 ' + lv.tier + ' · ' + streakDesc + '</div></div>' +
      '</div>';
    })();

    return '<div class="pad">' +
      '<div style="margin-bottom:10px;padding-right:150px">' + ui.stageTag('미션') + '<div class="h1" style="margin-top:6px">오늘의 미션</div><div class="cap">AI가 자동 감지 · 완료하면 경험치 획득</div></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px">' +
      '<div style="position:relative;flex:1;padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,rgba(39,216,155,.18),rgba(55,199,255,.1));border:1px solid rgba(39,216,155,.35);text-align:center;overflow:hidden">' +
        '<div style="position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(120,255,200,.22) 50%,transparent 70%);background-size:200% 100%;animation:gs-shimmer 2.2s linear infinite;pointer-events:none"></div>' +
        '<div style="position:absolute;top:-14px;right:-8px;font-size:30px;opacity:.22;animation:gs-twinkle 1.8s ease-in-out infinite;pointer-events:none">✦</div>' +
        '<div class="micro" style="color:var(--green);position:relative">오늘의 성공미션</div><div class="num" style="font-size:22px;color:var(--green);position:relative;text-shadow:0 0 12px rgba(39,216,155,.7)">' + checkedN + '<span style="font-size:12px;color:var(--ink-dim)"> / ' + total + '</span></div>' +
      '</div>' +
      '<div style="position:relative;flex:1;padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,rgba(255,92,122,.16),rgba(255,138,77,.1));border:1px solid rgba(255,92,122,.35);text-align:center;overflow:hidden">' +
        '<div style="position:absolute;inset:0;background:repeating-linear-gradient(-45deg,transparent 0 6px,rgba(255,92,122,.07) 6px 12px);pointer-events:none"></div>' +
        '<div style="position:absolute;top:-14px;right:-8px;font-size:30px;opacity:.2;animation:bob 1.6s ease-in-out infinite;pointer-events:none">💤</div>' +
        '<div class="micro" style="color:' + ui.T.red + ';position:relative">미션 미수행</div><div class="num" style="font-size:22px;color:' + ui.T.red + ';position:relative;text-shadow:0 0 12px rgba(255,92,122,.6)">' + (total - checkedN) + '<span style="font-size:12px;color:var(--ink-dim)"> / ' + total + '</span></div>' +
      '</div>' +
      '</div>' +
      resetCard +
      GS.drjang.renderInteractive([
        { label: '👁 바이오 비전', pose: 'explain', line: '각종 바이오 센서가 음식·물·운동을 실시간으로 감지해요. 병원 데이터, 웨어러블 센서 데이터, AI 렌즈가 모두 연동돼서 수동 입력 없이도 미션이 자동 인증돼요.' },
        { label: '✓ 자동 판정', pose: 'cheer', line: '감지된 데이터가 미션 목표(예: 식이섬유 25g, 물 500ml)를 달성했는지 자동으로 판정해요. 직접 체크할 필요 없어요!' },
        { label: '💎 경험치', pose: 'celebrate', line: '미션 완료 시 경험치(XP)가 자동 적립돼요. XP가 쌓이면 레벨이 올라가고 장 생태계 분석이 더 정밀해져요.' }
      ], ctx, { size: 72, pose: 'explain' }) +
      '<div style="height:8px"></div>' +
      streakHtml +
      rankBtn +
      '<div class="micro" style="color:var(--cyan2);margin-bottom:6px">' + ui.star() + ' 오늘의 미션 👓 <span style="color:var(--cyan)">(AI 스캐너 자동인식 중)</span></div>' +
      '<div style="overflow-x:auto;scrollbar-width:none;padding-bottom:6px"><div style="display:flex;gap:9px;min-width:max-content">' + missionCards + '</div></div>' +
      '<div style="height:.5rem"></div></div>';
  }

  function openRanking() {
    var ranking = GS.store.ranking.weekly();
    var myEntry = ranking.all.filter(function (e) { return e.id === 'me'; })[0];
    var myRank = ranking.all.indexOf(myEntry) + 1;
    var top5 = ranking.all.slice(0, 5);
    var all = top5.indexOf(myEntry) >= 0 ? top5 : top5.concat([myEntry]);
    var prof = GS.store.profile.get() || {};
    myEntry.level = GS.store.xp.level().level;
    myEntry.color = ui.T.cyan;
    myEntry.avatar = prof.avatar || '🙂';
    myEntry.name = (prof.name || '나');
    var cluster = GS.store.demographic.cluster() || {};
    var prof2 = GS.store.profile.get() || {};
    var br = D.ageBracket(prof2.age || 30);
    var genderLabel = prof2.gender === 'female' ? '여성' : '남성';
    var lsLabel = (D.LIFESTYLES[prof2.lifestyle] || {}).label || '';
    var groupDesc = br + ' ' + genderLabel + ' · ' + lsLabel + ' 그룹';
    var totalPlayers = ranking.all.length;
    var line;
    if (myRank <= 3) line = groupDesc + '에서 상위 ' + myRank + '위! 🎉 상위 ' + Math.round(myRank/totalPlayers*100) + '%예요. 이 식습관이 장벽을 강화하고 있어요. 이 패턴을 유지하면 다음 주엔 더 높은 레벨이 돼요.';
    else if (myRank <= 5) line = groupDesc + '에서 ' + myRank + '위! 식이섬유 한 끼만 더 추가하면 상위 3위 안에 들 수 있어요. 발효식품(김치·요거트)이 GUT 점수를 올려줘요.';
    else line = groupDesc + totalPlayers + '명 중 ' + myRank + '위. 아직 시작 단계예요! 매일 미션 하나씩 완료하면 빠르게 올라가요. 3일 연속 미션이 열정 보너스를 줘요.';

    var body = '<div style="text-align:center;margin-bottom:10px"><div style="font-size:28px">🏆</div><div class="h2" style="margin-top:4px">이번 주 랭킹</div><div class="cap">' + groupDesc + ' · 참여 ' + totalPlayers + '명</div></div>' +
      ui.rankingList(all, 'me', myRank) +
      '<div style="margin-top:10px;padding:10px;background:rgba(55,199,255,.08);border-radius:12px;text-align:center"><div class="cap">내 순위: <b style="color:var(--cyan);font-size:16px">' + myRank + '위</b> / ' + totalPlayers + '명 · GUT <b style="color:var(--cyan)">' + myEntry.score + '</b></div></div>' +
      '<div style="margin-top:10px">' + GS.drjang.render(myRank <= 3 ? 'celebrate' : myRank <= 5 ? 'cheer' : 'explain', line, { size: 66 }) + '</div>';
    ui.modal('주간 랭킹', body, { footer: ui.btn('닫기', { ghost: true, onclick: 'GS.ui.closeModal()' }) });
  }

  function toggle(id) {
    GS.store.quests.toggle(id);
    var done = GS.store.quests.done().indexOf(id) >= 0;
    if (done) {
      if (GS.fx2) { GS.fx2.questDone(); GS.fx2.screenFlash('rgba(39,216,155,.15)'); }
      ui.toast('미션 완료! +XP 💎', 'success');
      if (GS.story) GS.story.beat('quest-done', { force: true });
    } else { ui.toast('취소', 'info'); }
    GS.nav.render();
  }
  function startReset() { GS.store.reset.start(); if (GS.fx2) GS.fx2.screenFlash('rgba(169,140,255,.2)'); ui.toast('48시간 리셋 시작! 🧬', 'success'); GS.nav.render(); if (GS.story) GS.story.beat('reset-start', { force: true }); }
  function streakBoost() { if (GS.fx2) GS.fx2.streakFlame(GS.store.streak().days); ui.toast('🔥 열정 불태우는 중!', 'success'); }

  GS.screens.quest = render;
  GS.screens.quest.toggle = toggle;
  GS.screens.quest.startReset = startReset;
  GS.screens.quest.openRanking = openRanking;
  GS.screens.quest.streakBoost = streakBoost;
})();
