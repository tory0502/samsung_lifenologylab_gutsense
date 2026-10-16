/* GutSense www3 — DIET. 삼성 AI 렌즈 타임라인(KST 연속), 음식 클릭 시 Dr.장
 * 의학 설명, 오늘 식단 3D 임팩트 시각화, 주간 아바타 표정 + SCFA 곡선 그래프.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var ui = window.GS.ui, D = window.GS_DATA;
  var tab = 'today';

  function emoji(id) { return ({ snack: '🍪', noodle: '🍜', soda: '🥤', fries: '🍟', sausage: '🌭', cake: '🍰', icecream: '🍨', instant: '🥫', beer: '🍺', yogurt: '🥛', kimchi: '🥬', oats: '🥣', banana: '🍌', greens: '🥗', berry: '🫐', bean: '🫘', fish: '🐟', nut: '🥜', water: '💧', sand: '🥪', steak: '🥩', tofu: '🫘', miso: '🍲', avocado: '🥑', egg: '🥚' })[id] || '🍽️'; }
  function foodById(id) {
    var pool = GS.store.diet.allFoods();
    for (var i = 0; i < pool.length; i++) if (pool[i].id === id) return pool[i];
    return null;
  }
  function foodIcon(f) { return (f && f.icon) || emoji(f && f.id); }
  function kstNowMin() {
    var p = new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
    var h = parseInt(p.split(':')[0], 10) % 24;
    var m = parseInt(p.split(':')[1], 10);
    return { hm: p, total: h * 60 + m };
  }
  function todayFoods() { return GS.store.diet.eatenToday(); }

  if (!document.getElementById('gs-tl-style')) {
    var tls = document.createElement('style'); tls.id = 'gs-tl-style';
    tls.textContent =
      '.gs-tl-scroll{max-height:330px;overflow-y:auto;scrollbar-width:none;position:relative;padding:2px 4px 8px 0}' +
      '.gs-tl-scroll::-webkit-scrollbar{display:none}' +
      '.gs-tl-row{display:flex;gap:8px;position:relative;padding:0 0 12px 0}' +
      '.gs-tl-time{width:42px;flex-shrink:0;text-align:right;font-family:monospace;font-size:9px;color:var(--ink-faint);padding-top:8px}' +
      '.gs-tl-track{width:20px;flex-shrink:0;position:relative;display:flex;justify-content:center}' +
      '.gs-tl-line{position:absolute;top:0;bottom:0;width:2px;background:linear-gradient(180deg,rgba(122,220,255,.4),rgba(169,140,255,.3));border-radius:1px}' +
      '.gs-tl-dot{position:relative;z-index:1;width:10px;height:10px;margin-top:9px;border-radius:50%;background:#0E2244;border:2px solid var(--cyan);box-shadow:0 0 8px rgba(55,199,255,.5);animation:gs-dotPulse 2s ease-in-out infinite}' +
      '@keyframes gs-dotPulse{0%,100%{box-shadow:0 0 4px rgba(55,199,255,.4)}50%{box-shadow:0 0 12px rgba(55,199,255,.9)}}' +
      '.gs-tl-card{flex:1;min-width:0;border-radius:13px;background:rgba(8,18,40,.55);border:1px solid rgba(122,220,255,.12);padding:8px 10px;position:relative;overflow:hidden;animation:gs-rowIn .5s ease both}' +
      '@keyframes gs-rowIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}' +
      '.gs-tl-card::after{content:"";position:absolute;top:0;bottom:0;left:0;width:100%;background:linear-gradient(100deg,transparent 40%,rgba(122,220,255,.07) 50%,transparent 60%);background-size:250% 100%;animation:gs-shimmer 3.2s linear infinite;pointer-events:none}' +
      '.gs-tl-chip{display:inline-flex;flex-direction:column;align-items:center;gap:2px;min-width:46px;padding:5px 4px;border-radius:10px;background:rgba(4,12,28,.6);border:1px solid rgba(122,220,255,.14);animation:gs-chipIn .45s ease both;transition:transform .15s,border-color .15s}' +
      '.gs-tl-chip:active{transform:scale(.93)}' +
      '@keyframes gs-chipIn{from{opacity:0;transform:translateY(8px) scale(.8)}to{opacity:1;transform:translateY(0) scale(1)}}' +
      '.gs-tl-now{position:relative;overflow:hidden}' +
      '.gs-tl-scan{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,' + ui.T.green + ',transparent);box-shadow:0 0 10px rgba(39,216,155,.8);animation:gs-scanY 2.8s ease-in-out infinite}';
    document.head.appendChild(tls);
  }

  function aiVisionSection() {
    var tl = GS.store.ai.timeline();
    var kst = kstNowMin();
    var kstParts = kst.hm;
    var totalNow = kst.total;

    var past = tl.events.filter(function (e) {
      return e.hour * 60 + e.min <= totalNow;
    });
    var byHour = {};
    past.forEach(function (e) { (byHour[e.hour] = byHour[e.hour] || []).push(e); });
    var hours = Object.keys(byHour).map(Number).sort(function (a, b) { return b - a; });
    var latestHour = hours.length ? hours[0] : -1;

    var nowRow = '<div class="gs-tl-row">' +
      '<div class="gs-tl-time" style="color:' + ui.T.cyan + ';font-weight:700">지금</div>' +
      '<div class="gs-tl-track"><div class="gs-tl-line"></div><div class="gs-tl-dot" style="border-color:' + ui.T.cyan + ';box-shadow:0 0 10px ' + ui.T.cyan + '99;animation:gs-dotPulse 1.1s ease-in-out infinite"></div></div>' +
      '<div class="gs-tl-card gs-tl-now" style="border-color:' + ui.T.cyan + '55;background:rgba(10,26,54,.7)">' +
        '<div class="gs-tl-scan"></div>' +
        '<div style="display:flex;align-items:center;gap:7px;position:relative">' +
          '<span style="font-size:12px">📍</span>' +
          '<span style="font-size:11px;color:' + ui.T.cyan + ';font-weight:800;font-family:monospace">' + kstParts + ' KST</span>' +
          '<span style="font-size:8.5px;color:var(--cyan2)">삼성 AI 렌즈 실시간 스캐닝 중…</span>' +
          '<span style="margin-left:auto;font-size:8px;color:var(--ink-faint)">오늘 ' + (totalNow / 60).toFixed(1) + '시간 경과</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    var rows;
    if (!hours.length) {
      rows = '<div class="gs-tl-row">' +
        '<div class="gs-tl-track"><div class="gs-tl-line" style="background:linear-gradient(180deg,rgba(122,220,255,.18),transparent)"></div><div class="gs-tl-dot" style="border-color:rgba(122,220,255,.35);animation:none"></div></div>' +
        '<div class="gs-tl-card" style="text-align:center;padding:16px 10px"><div style="font-size:22px;opacity:.55">🍽️</div><div style="font-size:11px;color:var(--ink-dim);margin-top:6px">아직 감지된 식단이 없어요</div><div class="micro" style="margin-top:3px">첫 식단을 먹으면 AI 렌즈가 자동으로 기록해요</div></div>' +
      '</div>';
    } else {
      rows = hours.map(function (h, ri) {
        var list2 = byHour[h];
        var col = list2.some(function (x) { var f2 = x.foodId ? foodById(x.foodId) : null; return f2 ? f2.bad : (x.gutDelta && x.gutDelta.scfa < 0); }) ? ui.T.red : ui.T.green;
        var isLatest = h === latestHour;
        var scfaSum = list2.reduce(function (s, x) { return s + (x.gutDelta ? x.gutDelta.scfa : 0); }, 0);
        return '<div class="gs-tl-row" style="animation-delay:' + (ri * 0.08).toFixed(2) + 's">' +
          '<div class="gs-tl-time">' + String(h).padStart(2, '0') + ':00</div>' +
          '<div class="gs-tl-track"><div class="gs-tl-line"></div><div class="gs-tl-dot" style="border-color:' + col + ';box-shadow:0 0 8px ' + col + '66"></div></div>' +
          '<div class="gs-tl-card' + (isLatest ? ' gs-tl-now' : '') + '" style="border-color:' + col + '2e">' +
            (isLatest ? '<div class="gs-tl-scan"></div>' : '') +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;position:relative">' +
              '<span style="font-size:8.5px;color:var(--cyan2);font-weight:700">' + (isLatest ? '🟢 최신 감지' : '자동 감지 완료') + '</span>' +
              '<span style="font-size:8px;color:' + col + '">SCFA ' + (scfaSum >= 0 ? '+' : '') + scfaSum + '</span>' +
              '<span style="margin-left:auto;font-size:8px;color:var(--ink-faint);font-family:monospace">' + list2.length + '개</span>' +
            '</div>' +
            '<div style="display:flex;gap:5px;flex-wrap:wrap;position:relative">' +
            list2.map(function (ev, ci) {
              var f = ev.foodId ? foodById(ev.foodId) : null;
              var ico = f ? foodIcon(f) : (ev.icon || '💧');
              var bad = f ? !!f.bad : (ev.gutDelta ? ev.gutDelta.scfa < 0 : false);
              var tcol = bad ? ui.T.red : ui.T.green;
              var label = f ? f.label : ev.title;
              var scfa = ev.gutDelta ? ev.gutDelta.scfa : 0;
              var clickAttr = f ? ' onclick="GS.screens.diet.foodInfo(\'' + f.id + '\')"' : '';
              return '<div class="gs-tl-chip" style="animation-delay:' + (ri * 0.08 + 0.1 + ci * 0.07).toFixed(2) + 's;border-color:' + tcol + '3a;cursor:' + (f ? 'pointer' : 'default') + '"' + clickAttr + ' title="탭하면 Dr.장 설명">' +
                '<span style="font-size:19px;line-height:1">' + ico + '</span>' +
                '<span style="font-size:8px;color:var(--ink);max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + label.substring(0, 8) + '</span>' +
                '<span style="font-size:7px;color:' + tcol + '">' + (scfa >= 0 ? '+' : '') + scfa + '</span>' +
              '</div>';
            }).join('') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    var endRow = '<div class="gs-tl-row" style="padding-bottom:2px">' +
      '<div class="gs-tl-time" style="color:var(--ink-faint)">00:00</div>' +
      '<div class="gs-tl-track"><div class="gs-tl-line" style="background:linear-gradient(180deg,rgba(122,220,255,.18),transparent)"></div><div class="gs-tl-dot" style="border-color:rgba(122,220,255,.4);box-shadow:none;animation:none;width:8px;height:8px;margin-top:11px"></div></div>' +
      '<div class="micro" style="align-self:center;color:var(--ink-faint);font-size:8.5px;padding-top:2px">오늘의 시작 · 하루 기록 종점</div>' +
    '</div>';

    return ui.panel(
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><div style="width:34px;height:34px;border-radius:11px;background:linear-gradient(135deg,var(--cyan),var(--violet));display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(55,199,255,.25)">👓</div><div><div style="font-size:12px;color:var(--ink)">삼성 AI 렌즈 연동</div><div class="micro" style="color:var(--cyan2)">오늘 ' + past.length + '개 자동 감지 · 실시간 스캐닝</div></div><div style="margin-left:auto;display:flex;align-items:center;gap:5px;font-family:monospace;font-size:10px;color:' + ui.T.red + ';background:' + ui.T.red + '18;border:1px solid ' + ui.T.red + '44;padding:3px 9px;border-radius:8px"><span style="width:7px;height:7px;border-radius:50%;background:' + ui.T.red + ';box-shadow:0 0 6px ' + ui.T.red + ';animation:blink 1s infinite"></span>REC</div></div>' +
      '<div class="gs-tl-scroll">' + nowRow + rows + endRow + '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;padding:6px 2px 0"><span style="width:7px;height:7px;border-radius:50%;background:' + ui.T.green + ';animation:gs-dotPulse 1.4s infinite"></span><span class="micro" style="color:var(--ink-dim)">' + kstParts + ' KST 기준 · 오늘 하루의 연속 기록 (음식을 탭하면 Dr.장이 설명해요)</span></div>',
      { pad: '12px', mb: 10 });
  }

  function foodInfo(id) {
    var f = foodById(id);
    if (!f) return;
    var col = f.bad ? ui.T.red : ui.T.green;
    var why = f.why || (f.bad ? '정제·가공 성분이 장내 염증 부하를 높여요' : '식이섬유·발효 성분이 유익균과 장벽을 강화해요');
    var line = f.bad
      ? foodIcon(f) + ' ' + f.label + ' 조심해요. ' + why + '. 이 음식 하나로 SCFA ' + f.scfa + ', 내독소 부담 +' + f.lps + ', 염증 +' + f.inf + ' 움직였어요. 다음 끼니는 발효식품(김치·요거트)이나 식이섬유로 장벽을 회복해봐요.'
      : foodIcon(f) + ' ' + f.label + ' 훌륭한 선택이에요! ' + why + '. SCFA ' + (f.scfa >= 0 ? '+' : '') + f.scfa + ', 염증 ' + (f.inf <= 0 ? '' : '+') + f.inf + '으로 장 생태계가 회복되고 있어요.';
    var body =
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><div style="width:52px;height:52px;border-radius:16px;background:' + col + '14;border:1.5px solid ' + col + '44;display:flex;align-items:center;justify-content:center;font-size:26px">' + foodIcon(f) + '</div>' +
      '<div><div style="font-size:15px;color:var(--ink);font-weight:700">' + f.label + '</div><div style="font-size:10px;color:' + col + ';font-weight:700;margin-top:2px">' + (f.bad ? '⚠ 장에 해로운 식단' : '✓ 장에 이로운 식단') + '</div></div></div>' +
      '<div style="padding:10px 12px;background:' + col + '10;border:1px solid ' + col + '2e;border-radius:12px;margin-bottom:10px"><div class="micro" style="color:' + col + ';margin-bottom:4px">장에 미치는 영향</div><div class="cap" style="color:var(--ink)">' + why + '</div></div>' +
      '<div style="display:flex;gap:6px;margin-bottom:10px">' +
        '<div style="flex:1;padding:9px;border-radius:11px;background:rgba(39,216,155,.08);text-align:center"><div class="micro">SCFA</div><div class="num" style="font-size:15px;color:' + (f.scfa >= 0 ? ui.T.green : ui.T.red) + '">' + (f.scfa >= 0 ? '+' : '') + f.scfa + '</div></div>' +
        '<div style="flex:1;padding:9px;border-radius:11px;background:rgba(55,199,255,.08);text-align:center"><div class="micro">내독소 부담</div><div class="num" style="font-size:15px;color:' + (f.lps <= 0 ? ui.T.green : ui.T.red) + '">' + (f.lps >= 0 ? '+' : '') + f.lps + '</div></div>' +
        '<div style="flex:1;padding:9px;border-radius:11px;background:rgba(255,92,122,.08);text-align:center"><div class="micro">염증</div><div class="num" style="font-size:15px;color:' + (f.inf <= 0 ? ui.T.green : ui.T.red) + '">' + (f.inf >= 0 ? '+' : '') + f.inf + '</div></div>' +
      '</div>' +
      '<div style="padding:9px 12px;background:rgba(55,199,255,.06);border-radius:11px;margin-bottom:10px"><div class="micro" style="color:var(--cyan2);margin-bottom:3px">📖 근거</div><div class="cap">' + (f.ev || '장내 미생물 연구 기반') + '</div></div>' +
      GS.drjang.render(f.bad ? 'warn' : 'celebrate', line, { size: 64 });
    ui.modal(foodIcon(f) + ' ' + f.label + ' · Dr.장 진단', body, { footer: ui.btn('닫기', { ghost: true, onclick: 'GS.ui.closeModal()' }) });
  }

  // ===== 오늘 식단 3D 임팩트 — 장벽에 미치는 영향 시각화 =====
  var imp3d = null;
  var impFace = null;
  function disposeImpact3d() {
    if (!imp3d) return;
    imp3d.dead = true;
    if (imp3d.raf) cancelAnimationFrame(imp3d.raf);
    try { imp3d.renderer.dispose(); } catch (e) {}
    if (imp3d.canvas && imp3d.canvas.parentNode) imp3d.canvas.parentNode.removeChild(imp3d.canvas);
    imp3d = null; impFace = null;
  }
  window.addEventListener('gs:modalclose', disposeImpact3d);

  function glowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.35, 'rgba(255,255,255,.6)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  function emojiTex(e) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.font = '42px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(e, 32, 36);
    return new THREE.CanvasTexture(c);
  }
  function faceTex(mode) {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var g = c.getContext('2d');
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.scale(1.78, 1.78);
    function eye(x, happy) {
      if (happy) {
        g.strokeStyle = '#1e2d4a'; g.lineWidth = 7;
        g.beginPath(); g.arc(x + 1, 55, 9, Math.PI * 0.12, Math.PI * 0.88); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2.5;
        g.beginPath(); g.arc(x + 1, 55, 9, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
      } else {
        g.fillStyle = '#fff';
        g.beginPath(); g.ellipse(x, 53, 11, 13, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#2b4a7a';
        g.beginPath(); g.arc(x + 0.5, 55, 6.4, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1e2d4a';
        g.beginPath(); g.arc(x - 1.5, 53, 2.6, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(x + 2.8, 51.5, 2.3, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#1e2d4a'; g.lineWidth = 4.5;
        g.beginPath(); g.moveTo(x - 10, 40); g.quadraticCurveTo(x, 35.5, x + 10, 30); g.stroke();
        g.fillStyle = 'rgba(122,220,255,.9)';
        g.beginPath(); g.ellipse(x + 13, 74, 3.4, 5.6, 0.3, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,.8)';
        g.beginPath(); g.arc(x + 12.4, 72.6, 1.2, 0, Math.PI * 2); g.fill();
      }
    }
    var happy = mode === 'happy';
    eye(40, happy); eye(104, happy);
    g.fillStyle = 'rgba(255,120,150,.5)';
    [[24, 76], [120, 76]].forEach(function (ch) { g.beginPath(); g.ellipse(ch[0], ch[1], 9, 5.6, 0, 0, Math.PI * 2); g.fill(); });
    if (happy) {
      g.fillStyle = '#5a2338';
      g.beginPath(); g.arc(72, 90, 15, 0.12 * Math.PI, 0.88 * Math.PI); g.fill();
      g.fillStyle = 'rgba(255,122,147,.95)';
      g.beginPath(); g.arc(72, 90, 15, 0.3 * Math.PI, 0.7 * Math.PI); g.fill();
      g.fillStyle = 'rgba(255,120,150,.55)';
      g.beginPath(); g.ellipse(72, 98, 10.5, 5, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#ff8fa8';
      g.beginPath(); g.ellipse(68, 97.5, 3.2, 1.8, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(76, 97.5, 3.2, 1.8, 0, 0, Math.PI * 2); g.fill();
    } else {
      g.strokeStyle = '#5a2338'; g.lineWidth = 5.5;
      g.beginPath(); g.arc(72, 116, 14, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke();
      g.strokeStyle = 'rgba(122,220,255,.85)'; g.lineWidth = 3.5;
      g.beginPath(); g.arc(72, 118, 14, 1.25 * Math.PI, 1.75 * Math.PI); g.stroke();
    }
    return new THREE.CanvasTexture(c);
  }

  function initImpact3d() {
    var host = document.getElementById('dietImpact3d');
    if (!host || !window.THREE) return;
    disposeImpact3d();
    var sel = todayFoods();
    if (!sel.length) return;
    var badCount = sel.filter(function (f) { return f.bad; }).length;
    var isBad = badCount > sel.length / 2;
    var goodCol = 0x27d89b, badCol = 0xff5c7a;

    var w = host.clientWidth || 320, h = host.clientHeight || 210;
    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    host.appendChild(renderer.domElement);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 50);
    camera.position.set(0, 1.4, 7.4);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0x9fb4d8, 0.8));
    var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(2, 4, 5); scene.add(key);
    var gt = glowTex();

    var gut = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.72, 26, 72),
      new THREE.MeshPhongMaterial({ color: 0xff9fae, emissive: isBad ? 0x30060c : 0x062218, emissiveIntensity: 0.35, shininess: 72, specular: 0xffffff })
    );
    gut.rotation.x = Math.PI / 2.4;
    scene.add(gut);
    var gutGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: isBad ? badCol : goodCol, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false }));
    gutGlow.scale.set(7, 7, 1); scene.add(gutGlow);

    var faceMat = new THREE.SpriteMaterial({ map: faceTex(isBad ? 'sad' : 'happy'), transparent: true, depthWrite: false });
    impFace = new THREE.Sprite(faceMat);
    impFace.scale.set(1.7, 1.7, 1);
    impFace.position.set(0, 0, 0.95);
    scene.add(impFace);

    var PN = 110, pArr = new Float32Array(PN * 3), pSeed = [], pHit = new Float32Array(PN);
    for (var pi = 0; pi < PN; pi++) { pSeed.push({ a: Math.random() * Math.PI * 2, sp: 0.25 + Math.random() * 0.5, off: Math.random() }); }
    var pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    var pMat = new THREE.PointsMaterial({ size: 0.17, map: gt, color: isBad ? badCol : goodCol, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
    scene.add(new THREE.Points(pGeo, pMat));

    var foodSprites = [];
    sel.slice(0, 10).forEach(function (f, fi) {
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(foodIcon(f)), transparent: true, depthWrite: false }));
      var s = 0.62; sp.scale.set(s, s, 1);
      sp.userData = { a: (fi / Math.min(10, sel.length)) * Math.PI * 2, r: 3.3, bad: !!f.bad };
      scene.add(sp); foodSprites.push(sp);
    });

    var flash = 0, shake = 0, faceTexA = faceMat;
    imp3d = { dead: false, renderer: renderer, canvas: renderer.domElement, raf: 0 };
    var clock = new THREE.Clock();
    (function loop() {
      if (!imp3d || imp3d.dead) return;
      imp3d.raf = requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      gut.rotation.z = t * 0.28;
      var pulse = 1 + Math.sin(t * (isBad ? 5.2 : 2.2)) * (isBad ? 0.045 : 0.02);
      gut.scale.setScalar(pulse);
      gutGlow.material.opacity = 0.28 + Math.sin(t * 3) * 0.1 + flash * 0.4;
      impFace.position.set(0, Math.sin(t * (isBad ? 5.2 : 2.2)) * 0.1 + 0.05, 0.95);
      var blink = (t % 3.4) < 0.13 ? 0.1 : 1;
      impFace.scale.y = 1.7 * blink;

      for (var i = 0; i < PN; i++) {
        var s = pSeed[i];
        if (isBad) {
          var prog = 1 - ((t * s.sp * 0.35 + s.off) % 1);
          var r = 0.5 + prog * 4.2;
          var aa = s.a + t * (0.5 + s.sp);
          pArr[i * 3] = Math.cos(aa) * r;
          pArr[i * 3 + 1] = Math.sin(aa) * r * 0.85 + Math.sin(t * 2 + i) * 0.1;
          pArr[i * 3 + 2] = Math.sin(t * 1.4 + i * 1.7) * 0.5;
          if (prog > 0.52 && prog < 0.56 && pHit[i] < t) { pHit[i] = t + 0.6; flash = 1; shake = 0.5; }
        } else {
          var pr = (t * 0.16 * s.sp + s.off) % 1;
          var ang2 = pr * Math.PI * 2 * 2 + s.a;
          var rr = 1.45 + Math.sin(t * 1.8 + i) * 0.28;
          pArr[i * 3] = Math.cos(ang2) * rr;
          pArr[i * 3 + 1] = Math.sin(ang2) * rr * 0.82;
          pArr[i * 3 + 2] = Math.sin(t * 2.2 + i * 2.1) * 0.55;
        }
      }
      pGeo.attributes.position.needsUpdate = true;
      flash = Math.max(0, flash - 0.045);
      shake = Math.max(0, shake - 0.03);
      gut.material.emissiveIntensity = 0.3 + flash * 1.3;
      gut.material.emissive.setHex(isBad ? (flash > 0.4 ? 0x88101e : 0x30060c) : 0x0a3a22);
      foodSprites.forEach(function (sp, k) {
        sp.userData.a += 0.004 + k * 0.0006;
        var bobY = Math.sin(t * 1.6 + k * 1.3) * 0.24;
        sp.position.set(Math.cos(sp.userData.a) * sp.userData.r, bobY, Math.sin(sp.userData.a) * sp.userData.r);
        sp.material.opacity = 0.92;
      });
      camera.position.x = Math.sin(t * 0.5) * 0.5 + (Math.random() - 0.5) * shake * 0.3;
      camera.position.y = 1.4 + Math.cos(t * 0.4) * 0.3 + (Math.random() - 0.5) * shake * 0.3;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    })();
  }

  function todayPopup() {
    var sel = todayFoods();
    if (!sel.length) { ui.toast('아직 감지된 식단이 없어요', 'info'); return; }
    var badCount = sel.filter(function (f) { return f.bad; }).length;
    var isBad = badCount > sel.length / 2;
    var col = isBad ? ui.T.red : ui.T.green;
    var chips = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">' + sel.map(function (f) {
      return '<div onclick="GS.screens.diet.foodInfo(\'' + f.id + '\')" style="cursor:pointer">' + ui.chip(foodIcon(f) + ' ' + f.label, { on: true, bad: f.bad }) + '</div>';
    }).join('') + '</div>';
    var body = chips +
      '<div class="micro" style="color:var(--cyan2);margin-bottom:6px">' + ui.star() + ' 오늘 식단이 내 장에 미치는 영향</div>' +
      '<div id="dietImpact3d" style="position:relative;height:212px;border-radius:14px;overflow:hidden;background:radial-gradient(ellipse at 50% 45%, rgba(10,22,48,.65), rgba(4,8,20,.92));border:1px solid ' + col + '33"></div>' +
      '<div style="display:flex;align-items:center;gap:7px;margin-top:8px"><span style="font-size:13px">' + (isBad ? '⚠️' : '✨') + '</span><span class="cap" style="color:' + col + '">' + (isBad
        ? '해로운 식단 ' + badCount + '개의 공격에 장벽이 울고 있어요 — 붉은 입자가 벽을 때리는 게 보여요'
        : '이로운 식단 ' + (sel.length - badCount) + '개로 장벽이 웃고 있어요 — 초록 입자가 스며드는 게 보여요') + '</span></div>';
    ui.modal('오늘 먹은 식단 (' + sel.length + '개)', body, { footer: ui.btn('닫기', { ghost: true, onclick: 'GS.ui.closeModal()' }) });
    setTimeout(initImpact3d, 80);
  }

  function liveReaction(m, sel) {
    var badCount = sel.filter(function (f) { return f.bad; }).length;
    var goodCount = sel.filter(function (f) { return !f.bad; }).length;
    var line, pose;
    if (!sel.length) { line = 'AI 렌즈가 식사를 감지하면 장이 어떻게 반응하는지 실시간으로 보여드릴게요!'; pose = 'welcome'; }
    else if (badCount > goodCount) { line = '해로운 음식 ' + badCount + '개 감지! SCFA가 떨어지고 장벽에 균열이 생기기 시작해요. 발효식품이나 식이섬유를 하나 추가해보세요.'; pose = 'warn'; }
    else if (goodCount >= 2 && badCount === 0) { line = '훌륭해요! ' + sel.slice(0,2).map(function(f){return f.label;}).join(' · ') + '가 부티레이트 생성균을 키우고 있어요. 도파민도 회복되는 중이에요.'; pose = 'celebrate'; }
    else if (badCount > 0 && goodCount > 0) { line = '좋은 음식 ' + goodCount + '개, 해로운 음식 ' + badCount + '개. 좋은 음식이 장벽을 보호하지만 나쁜 음식의 영향이 커요.'; pose = 'cheer'; }
    else { line = '좋은 선택! ' + sel[0].label + '이 장벽을 강화하고 있어요.'; pose = 'celebrate'; }
    return {
      drjang: GS.drjang.render(pose, line, { size: 68 }),
      bars: ui.panel(
        '<div class="micro" style="color:var(--cyan2);margin-bottom:8px">' + ui.star() + ' 실시간 장 생태계 반응</div>' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><div style="flex-shrink:0">' + GS.chars.dopamine(m.dopamine, 38) + '</div>' + ui.weatherBadge(m.inflammation) + '</div>' +
        ui.liveBars([
          { k: 'scfa', l: 'SCFA', v: m.scfa },
          { k: 'perm', l: '투과성', v: m.permeability },
          { k: 'inf', l: '염증', v: m.inflammation },
          { k: 'dopa', l: '도파민', v: m.dopamine, ceiling: m.ceiling }
        ], { header: false }),
        { pad: '12px 14px', mb: 0 })
    };
  }

  function todaySummary(sel) {
    if (!sel.length) return '';
    var badCount = sel.filter(function (f) { return f.bad; }).length;
    var col = badCount > sel.length / 2 ? ui.T.red : ui.T.green;
    return '<div onclick="GS.screens.diet.todayPopup()" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:13px;background:rgba(8,18,40,.4);border:1px solid ' + col + '22;margin-bottom:8px;cursor:pointer"><div style="font-size:16px">📋</div><div style="flex:1;font-size:11px;color:var(--ink-dim)">오늘 식단 <b style="color:var(--ink)">' + sel.length + '</b>개 · 이로운 ' + (sel.length - badCount) + ' · 해로운 ' + badCount + '</div><div style="font-size:10px;color:' + ui.T.cyan + '">상세 ›</div></div>';
  }

  function portal(sel) {
    if (!sel.length) {
      return '<div onclick="GS.ui.toast(\'AI 렌즈가 식사를 감지하면 3D 시뮬레이션이 열려요 🧬\', \'info\')" style="cursor:pointer;position:relative;margin-bottom:10px;border-radius:20px;border:1.5px dashed rgba(122,220,255,.35);background:rgba(8,18,40,.45);padding:13px 16px;display:flex;align-items:center;gap:12px">' +
        '<div style="width:44px;height:44px;border-radius:50%;background:rgba(122,220,255,.12);display:flex;align-items:center;justify-content:center;font-size:21px;opacity:.75;animation:bob 2.4s infinite">🧬</div>' +
        '<div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:800;color:var(--ink)">🧬 장 속으로</div><div class="micro" style="color:var(--cyan2)">식사가 감지되면 3D 시뮬레이션이 자동으로 열려요</div></div>' +
        '<div style="font-size:16px;color:var(--cyan);opacity:.55">🔒</div></div>';
    }
    var f = sel.slice().sort(function (a, b) { return (b.bad ? b.lps + b.inf : 0) - (a.bad ? a.lps + a.inf : 0); })[0];
    if (!f.bad) f = sel.slice().sort(function (a, b) { return b.scfa - a.scfa; })[0];
    var col = f.bad ? ui.T.red : ui.T.green;
    var col2 = f.bad ? ui.T.orange : ui.T.cyan;
    return '<div onclick="GS.screens.diet.toGut()" style="cursor:pointer;position:relative;margin-bottom:10px">' +
      '<div style="position:absolute;inset:-3px;border-radius:23px;background:conic-gradient(from 0deg,transparent 0%,' + col + ' 12%,transparent 26%);animation:spin 2.6s linear infinite;filter:blur(.5px)"></div>' +
      '<div style="position:absolute;inset:0;border-radius:20px;box-shadow:0 0 26px ' + col + '59;animation:pulse 1.7s ease-in-out infinite;pointer-events:none"></div>' +
      '<div style="position:relative;border-radius:20px;overflow:hidden;background:linear-gradient(120deg,' + col + ',' + col2 + ');padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 10px 26px ' + col + '33">' +
        '<div style="position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.4) 50%,transparent 70%);background-size:200% 100%;animation:gs-shimmer 2.2s linear infinite;pointer-events:none"></div>' +
        '<div style="position:relative;width:46px;height:46px;flex-shrink:0"><div style="position:absolute;inset:0;border-radius:50%;background:rgba(255,255,255,.28);border:1.5px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-size:22px;animation:bob 1.8s ease-in-out infinite">🧬</div><div style="position:absolute;top:-5px;right:-6px;font-size:13px;animation:gs-twinkle 1.3s ease-in-out infinite">✨</div></div>' +
        '<div style="flex:1;color:#04101F;min-width:0"><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap"><span style="font-size:15px;font-weight:800;letter-spacing:-.3px">장 속으로</span><span style="display:inline-flex;align-items:center;gap:4px;font-size:8.5px;font-weight:800;background:rgba(4,16,31,.55);color:#fff;padding:2.5px 8px;border-radius:999px;letter-spacing:.3px"><span style="width:5px;height:5px;border-radius:50%;background:#fff;animation:blink 1s infinite"></span>Travel Sim.</span></div>' +
        '<div style="font-size:10px;opacity:.9;font-weight:600;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + foodIcon(f) + ' ' + f.label + (f.bad ? ' · 장벽에 무슨 일이 생길까?' : ' · 장벽이 단단해지는 과정') + '</div></div>' +
        '<div style="font-size:24px;color:#04101F;font-weight:800;animation:bob 1.1s infinite;flex-shrink:0">→</div>' +
      '</div></div>';
  }

  function todayView() {
    var m = GS.store.coreMetrics();
    var sel = todayFoods();
    var lr = liveReaction(m, sel);
    return portal(sel) +
      lr.drjang +
      '<div style="height:8px"></div>' +
      aiVisionSection() +
      '<div style="height:8px"></div>' +
      lr.bars +
      '<div style="height:8px"></div>' +
      todaySummary(sel);
  }

  function scfaGraph(week) {
    var W = 330, H = 168;
    // 실제 일별 SCFA 값 사용 — 그래프 표시값의 합 = 총 SCFA (mM 변환 제거)
    var vals = week.map(function (d) { return Math.round(d.impact.scfa); });
    var maxAbs = Math.max(5, Math.max.apply(null, vals.map(function (v) { return Math.abs(v); })));
    var zeroY = 88, topY = 52, botY = 148;
    var scaleH = 56;
    function Y(v) { return zeroY - (v / maxAbs) * scaleH; }
    var pts = week.map(function (d, i) {
      return { x: 22 + i * (W - 44) / 6, y: Y(vals[i]) };
    });
    var path = 'M' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      var p0 = pts[i - 1], p1 = pts[i], mx = (p0.x + p1.x) / 2;
      path += ' C' + mx.toFixed(1) + ',' + p0.y.toFixed(1) + ' ' + mx.toFixed(1) + ',' + p1.y.toFixed(1) + ' ' + p1.x.toFixed(1) + ',' + p1.y.toFixed(1);
    }
    // 0 기준 분할 영역 (양수 위, 음수 아래)
    var posArea = '', negArea = '';
    var posFirst = -1, posLast = -1, negFirst = -1, negLast = -1;
    for (var i = 0; i < pts.length; i++) {
      if (vals[i] >= 0) { if (posFirst < 0) posFirst = i; posLast = i; }
      else { if (negFirst < 0) negFirst = i; negLast = i; }
    }
    function segArea(first, last, dir) {
      if (first < 0 || last < 0) return '';
      var d = 'M' + pts[first].x.toFixed(1) + ',' + zeroY.toFixed(1);
      for (var i = first; i <= last; i++) {
        var p0 = pts[i - 1], p1 = pts[i];
        if (i === first) { d += ' L' + p1.x.toFixed(1) + ',' + p1.y.toFixed(1); continue; }
        var mx = (p0.x + p1.x) / 2;
        d += ' C' + mx.toFixed(1) + ',' + p0.y.toFixed(1) + ' ' + mx.toFixed(1) + ',' + p1.y.toFixed(1) + ' ' + p1.x.toFixed(1) + ',' + p1.y.toFixed(1);
      }
      d += ' L' + pts[last].x.toFixed(1) + ',' + zeroY.toFixed(1) + ' Z';
      return d;
    }
    posArea = segArea(posFirst, posLast); negArea = segArea(negFirst, negLast);
    var today = GS.store.today();
    var dots = week.map(function (d, i) {
      var c2 = vals[i] >= 0 ? ui.T.green : ui.T.red;
      var isToday = d.date === today;
      return '<circle cx="' + pts[i].x.toFixed(1) + '" cy="' + pts[i].y.toFixed(1) + '" r="' + (isToday ? 4.6 : 3.6) + '" fill="' + c2 + '" stroke="#04101F" stroke-width="1.6" style="filter:drop-shadow(0 0 6px ' + c2 + ')">' +
        (isToday ? '<animate attributeName="r" values="4.6;5.8;4.6" dur="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.55;1" dur="1.1s" repeatCount="indefinite"/>' : '') + '</circle>' +
        (isToday ? '<circle cx="' + pts[i].x.toFixed(1) + '" cy="' + pts[i].y.toFixed(1) + '" r="8" fill="none" stroke="' + c2 + '" stroke-width="1.4" opacity=".6"><animate attributeName="r" values="6;13" dur="1.3s" repeatCount="indefinite"/><animate attributeName="opacity" values=".75;0" dur="1.3s" repeatCount="indefinite"/></circle>' : '') +
        '<text x="' + pts[i].x.toFixed(1) + '" y="' + (vals[i] >= 0 ? pts[i].y - 9 : pts[i].y + 15) + '" text-anchor="middle" font-size="8.5" fill="' + c2 + '" font-weight="800">' + (vals[i] >= 0 ? '+' : '') + vals[i] + '</text>';
    }).join('');
    var labels = week.map(function (d, i) {
      return '<text x="' + pts[i].x.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="8" fill="' + (d.date === today ? ui.T.cyan : '#5E7AA6') + '" font-weight="700">' + ['일', '월', '화', '수', '목', '금', '토'][d.dow] + '</text>';
    }).join('');
    var grid = '';
    [-1, -0.5, 0.5, 1].forEach(function (f) {
      var v = Math.round(f * maxAbs);
      var gy = Y(v);
      grid += '<line x1="22" y1="' + gy.toFixed(1) + '" x2="' + (W - 22) + '" y2="' + gy.toFixed(1) + '" stroke="rgba(94,122,166,.14)" stroke-dasharray="2 4"/>' +
        '<text x="16" y="' + (gy + 3).toFixed(1) + '" text-anchor="end" font-size="7" fill="#5E7AA6">' + (v > 0 ? '+' : '') + v + '</text>';
    });
    var sumTotal = vals.reduce(function (a, b) { return a + b; }, 0);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;display:block;filter:drop-shadow(0 4px 12px rgba(39,216,155,.14))">' +
      '<defs>' +
        '<linearGradient id="gsScfaFillPos" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + ui.T.green + '" stop-opacity=".32"/><stop offset="100%" stop-color="' + ui.T.green + '" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="gsScfaFillNeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + ui.T.red + '" stop-opacity="0"/><stop offset="100%" stop-color="' + ui.T.red + '" stop-opacity=".3"/></linearGradient>' +
        '<linearGradient id="gsScfaStroke" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0%" stop-color="#27D89B"/><stop offset="50%" stop-color="#7ADCFF"/><stop offset="100%" stop-color="#A98CFF"/></linearGradient>' +
        '<filter id="gsScfaGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
        '<clipPath id="gsScfaReveal"><rect x="0" y="0" height="' + H + '"><animate attributeName="width" values="0;' + W + '" dur="1.6s" fill="freeze" calcMode="spline" keySplines="0.3 0 0.2 1" keyTimes="0;1"/></rect></clipPath></defs>' +
      '<rect x="22" y="' + topY + '" width="' + (W - 44) + '" height="' + (botY - topY) + '" rx="10" fill="rgba(8,18,40,.35)"/>' +
      '<text x="12" y="' + (topY - 6) + '" font-size="8.5" fill="' + ui.T.cyan2 + '" font-weight="700">Δ SCFA</text>' +
      '<text x="' + (W - 12) + '" y="' + (topY - 6) + '" text-anchor="end" font-size="8.5" fill="' + (sumTotal >= 0 ? ui.T.green : ui.T.red) + '" font-weight="800">∑ ' + (sumTotal >= 0 ? '+' : '') + sumTotal + ' = 총 SCFA</text>' +
      grid +
      '<line x1="22" y1="' + zeroY + '" x2="' + (W - 22) + '" y2="' + zeroY + '" stroke="rgba(122,220,255,.5)" stroke-width="1.2" stroke-dasharray="5 4"/>' +
      '<text x="' + (W - 14) + '" y="' + (zeroY + 12) + '" text-anchor="end" font-size="7.5" fill="#5E7AA6">0 기준</text>' +
      '<g clip-path="url(#gsScfaReveal)">' +
        (posArea ? '<path d="' + posArea + '" fill="url(#gsScfaFillPos)"/>' : '') +
        (negArea ? '<path d="' + negArea + '" fill="url(#gsScfaFillNeg)"/>' : '') +
        '<path d="' + path + '" fill="none" stroke="url(#gsScfaStroke)" stroke-width="3.2" stroke-linecap="round" filter="url(#gsScfaGlow)"/>' +
        '<path d="' + path + '" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="0.8" stroke-linecap="round" opacity=".5"/>' +
        dots +
      '</g>' + labels + '</svg>';
  }

  function weekView() {
    var week = GS.store.diet.weekSummary();
    var prof = GS.store.profile.get() || {};
    var dows = ['일', '월', '화', '수', '목', '금', '토'];
    var totalScfa = week.reduce(function (s, d) { return s + d.impact.scfa; }, 0);
    var goodDays = week.filter(function (d) { return d.count > 0 && d.impact.scfa >= 0; }).length;
    var badDays = week.filter(function (d) { return d.count > 0 && d.impact.scfa < 0; }).length;
    var avgCol = totalScfa >= 0 ? ui.T.green : ui.T.red;
    var drjangLine;
    if (goodDays >= 4) drjangLine = '이번 주 식단이 훌륭해요! ' + goodDays + '일이나 좋은 식단을 유지하셨어요. 이 패턴이 장벽을 강화하고 있어요.';
    else if (badDays >= 4) drjangLine = '이번 주 나쁜 식단이 많았어요. ' + badDays + '일이 해로운 식단이었어요. 다음 주는 발효식품과 식이섬유로 회복해봐요.';
    else drjangLine = '이번 주는 좋은 날과 나쁜 날이 섞여 있어요. 일관성이 장 건강의 핵심이에요. 다음 주는 좋은 식단 날을 늘려봐요.';

    var dayCards = '<div style="overflow-x:auto;scrollbar-width:none;padding-bottom:6px"><div style="display:flex;gap:8px;min-width:max-content">' +
      week.map(function (d) {
        var isToday = d.date === GS.store.today();
        var good = d.impact.scfa >= 0;
        var col = d.count === 0 ? ui.T.faint : good ? ui.T.green : ui.T.red;
        var bg = d.count === 0 ? 'rgba(8,18,40,.3)' : good ? 'rgba(39,216,155,.08)' : 'rgba(255,92,122,.08)';
        var day = parseInt(d.date.split('-')[2], 10);
        var mood = d.count === 0 ? 'flat' : (good ? 'bigSmile' : 'frown');
        return '<div onclick="GS.screens.diet.dayDetail(\'' + d.date + '\')" style="min-width:74px;padding:12px 8px;border-radius:15px;cursor:pointer;text-align:center;background:' + bg + ';border:1.5px solid ' + (isToday ? ui.T.cyan : col + '33') + ';flex-shrink:0;position:relative;overflow:hidden">' +
          (d.count > 0 ? '<div style="position:absolute;top:0;left:0;right:0;height:3px;background:' + col + '"></div>' : '') +
          '<div style="font-size:10px;color:' + (isToday ? ui.T.cyan : 'var(--ink-dim)') + '">' + dows[d.dow] + (isToday ? '·오늘' : '') + '</div>' +
          '<div style="font-size:18px;font-weight:700;color:var(--ink);margin:4px 0">' + day + '</div>' +
          '<div style="height:30px;display:flex;align-items:center;justify-content:center;margin:4px 0">' + (d.count === 0 ? '<span style="font-size:14px;opacity:.3">—</span>' : GS.chars.avatarFace(prof.avatar, mood, 28)) + '</div>' +
          '<div style="font-size:9px;color:' + col + ';font-weight:700">' + (d.count ? d.count + '개' : '없음') + '</div>' +
          (d.count ? '<div style="font-size:8px;color:' + col + ';margin-top:1px">SCFA ' + (d.impact.scfa >= 0 ? '+' : '') + d.impact.scfa + '</div>' : '') +
        '</div>';
      }).join('') + '</div></div>';

    var statsHtml = '<div style="display:flex;gap:8px;margin-bottom:10px">' +
      '<div style="flex:1;padding:10px;border-radius:12px;background:rgba(39,216,155,.08);text-align:center"><div class="micro">좋은 날</div><div class="num" style="font-size:18px;color:' + ui.T.green + '">' + goodDays + '일</div></div>' +
      '<div style="flex:1;padding:10px;border-radius:12px;background:rgba(255,92,122,.08);text-align:center"><div class="micro">나쁜 날</div><div class="num" style="font-size:18px;color:' + ui.T.red + '">' + badDays + '일</div></div>' +
      '<div style="flex:1;padding:10px;border-radius:12px;background:rgba(55,199,255,.08);text-align:center"><div class="micro">총 SCFA</div><div class="num" style="font-size:18px;color:' + avgCol + '">' + (totalScfa >= 0 ? '+' : '') + totalScfa + '</div></div>' +
    '</div>';

    return GS.drjang.render(goodDays >= badDays ? 'celebrate' : 'warn', drjangLine, { size: 70 }) +
      ui.panel(dayCards, { pad: '10px', mb: 10 }) +
      ui.panel(statsHtml + '<div class="micro" style="color:var(--cyan2);margin-bottom:6px">' + ui.star() + ' 주간 SCFA 추세</div>' + scfaGraph(week), { pad: '12px', mb: 10 });
  }

  function render() {
    return '<div class="pad">' +
      '<div style="margin-bottom:10px;padding-right:150px">' + ui.stageTag('식단') + '<div class="h1" style="margin-top:6px">한 끼의 여정</div><div class="cap">삼성 AI 렌즈가 하루 식단을 자동으로 감지해요</div></div>' +
      ui.segControl([{ id: 'today', label: '🍽️ 오늘' }, { id: 'week', label: '📅 주간' }], tab, 'GS.screens.diet.setTab') +
      (tab === 'week' ? weekView() : todayView()) +
      '<div style="height:.5rem"></div></div>';
  }
  var simRepeat = { id: null, n: 0 };
  function toGut() {
    var foods = todayFoods();
    if (!foods.length) { GS.nav.go('gutmap'); return; }
    var f = foods.slice().sort(function (a, b) { return (b.bad ? b.lps + b.inf : 0) - (a.bad ? a.lps + b.inf : 0); })[0];
    if (!f.bad) f = foods.slice().sort(function (a, b) { return b.scfa - a.scfa; })[0];
    var scene = GS.store.scene.state();
    GS.store.scene.trigger(f);
    var fatigued = false;
    if (simRepeat.id === f.id) {
      simRepeat.n++;
      if (simRepeat.n >= 3) { fatigued = true; simRepeat.n = 0; }
    } else { simRepeat.id = f.id; simRepeat.n = 1; }
    if (GS.sim && GS.sim.run && !fatigued) {
      GS.sim.run({ id: f.id, label: f.label, bad: !!f.bad }, { onDone: function () { GS.nav.go('gutmap'); } });
    } else if (GS.sim && GS.sim.runQuick) {
      GS.sim.runQuick(f, { onDone: function () { GS.nav.go('gutmap'); } });
    } else { GS.nav.go('gutmap'); }
  }
  function setTab(t) { tab = t; GS.nav.render(); }
  function dayDetail(date) {
    var week = GS.store.diet.weekSummary();
    var d = week.filter(function (x) { return x.date === date; })[0];
    if (!d) return;
    var prof = GS.store.profile.get() || {};
    var dows = ['일', '월', '화', '수', '목', '금', '토'];
    var good = d.impact.scfa >= 0;
    var col = d.count === 0 ? ui.T.faint : good ? ui.T.green : ui.T.red;
    var mood = d.count === 0 ? 'flat' : (good ? 'bigSmile' : 'frown');
    var foodsHtml = d.count ? '<div style="display:flex;flex-wrap:wrap;gap:6px">' + d.foods.map(function (f) { return '<div onclick="GS.screens.diet.foodInfo(\'' + f.id + '\')" style="cursor:pointer">' + ui.chip(foodIcon(f) + ' ' + f.label, { on: true, bad: f.bad }) + '</div>'; }).join('') + '</div>' : '<div class="cap" style="text-align:center;padding:14px">기록 없음</div>';
    var body = '<div style="text-align:center;margin-bottom:12px"><div class="h2">' + dows[d.dow] + '요일</div><div style="height:44px;display:flex;align-items:center;justify-content:center;margin-top:4px">' + (d.count === 0 ? '<span style="font-size:20px;opacity:.35">—</span>' : GS.chars.avatarFace(prof.avatar, mood, 40)) + '<span style="font-size:13px;color:' + col + ';font-weight:700;margin-left:8px">' + (d.count === 0 ? '기록 없음' : good ? '좋은 식단' : '나쁜 식단') + '</span></div></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
        '<div style="flex:1;padding:10px;border-radius:12px;background:rgba(55,199,255,.08);text-align:center"><div class="micro">식단</div><div class="num" style="font-size:18px;color:' + col + '">' + d.count + '</div></div>' +
        '<div style="flex:1;padding:10px;border-radius:12px;background:rgba(55,199,255,.08);text-align:center"><div class="micro">SCFA</div><div class="num" style="font-size:18px;color:' + (d.impact.scfa >= 0 ? ui.T.green : ui.T.red) + '">' + (d.impact.scfa >= 0 ? '+' : '') + d.impact.scfa + '</div></div>' +
        '<div style="flex:1;padding:10px;border-radius:12px;background:rgba(55,199,255,.08);text-align:center"><div class="micro">염증</div><div class="num" style="font-size:18px;color:' + (d.impact.inf <= 0 ? ui.T.green : ui.T.red) + '">' + (d.impact.inf > 0 ? '+' : '') + d.impact.inf + '</div></div>' +
      '</div>' + foodsHtml +
      (d.count ? '<div style="margin-top:10px">' + GS.drjang.render(good ? 'celebrate' : 'warn', good ? '좋은 식단이었어요! 장벽이 강화됐을 거예요.' : '나쁜 음식 위주였어요. 발효식품으로 회복해요.', { size: 64 }) + '</div>' : '');
    ui.modal(dows[d.dow] + '요일 식단', body, { footer: ui.btn('닫기', { ghost: true, onclick: 'GS.ui.closeModal()' }) });
  }
  GS.screens.diet = render;
  GS.screens.diet.enterToday = function () { tab = 'today'; };
  GS.screens.diet.toGut = toGut;
  GS.screens.diet.setTab = setTab;
  GS.screens.diet.dayDetail = dayDetail;
  GS.screens.diet.todayPopup = todayPopup;
  GS.screens.diet.foodInfo = foodInfo;
})();
