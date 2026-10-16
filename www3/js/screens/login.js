/* GutSense www3 — LOGIN. Futuristic resident-select (정형돈/유재석) + bio-load
 * auto sequence + 생체 캘리브레이션 registration. 3D microbiota field behind.
 * Must respect the engine contract on its own re-renders.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var ui = window.GS.ui, D = window.GS_DATA;
  var AV = ['🧑', '👩', '🧔', '👱', '👨', '🧓', '👵', '🦸', '🧑‍🚀'];
  var mem = { stage: 'select', name: '', gender: 'male', age: '30', lifestyle: 'sedentary', avatar: '🧑', pid: null, pname: '' };

  if (window.THREE && GS.engine) {
    GS.engine.register('login', function (stage) {
      var host = document.getElementById('login3d'); if (!host) return;
      stage.attach(host); stage.camera.position.set(0, 0, 17);
      var tex = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'); var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.35, 'rgba(255,255,255,.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
      var N = 130, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), spd = [];
      var pal = [[.22, .78, 1], [.48, .55, 1], [.15, .85, .61], [.66, .55, 1], [1, .77, .3]];
      for (var i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 26; pos[i * 3 + 1] = (Math.random() - .5) * 34; pos[i * 3 + 2] = (Math.random() - .5) * 10 - 2; var p = pal[i % pal.length]; col[i * 3] = p[0]; col[i * 3 + 1] = p[1]; col[i * 3 + 2] = p[2]; spd.push(.2 + Math.random() * .5); }
      var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      var pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.3, map: tex, vertexColors: true, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending }));
      stage.add(pts);
      stage.onUpdate(function (dt, t) { var pa = geo.attributes.position.array; for (var j = 0; j < N; j++) { pa[j * 3 + 1] += spd[j] * dt; if (pa[j * 3 + 1] > 17) pa[j * 3 + 1] = -17; } geo.attributes.position.needsUpdate = true; pts.rotation.z = Math.sin(t * .05) * .06; stage.camera.position.x = Math.sin(t * .08) * 1.3; });
    });
  }

  function gutIdx(p) { var s = (p.name || '') + (p.age || 30) + (p.gender || ''); var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return 46 + (h % 45); }
  function orb(emoji, accent, sz) { sz = sz || 58; return '<div style="position:relative;width:' + sz + 'px;height:' + sz + 'px;flex-shrink:0"><div style="position:absolute;inset:-8px;border-radius:50%;background:radial-gradient(circle,' + accent + '55 0%,transparent 70%);animation:float 3s ease-in-out infinite"></div><div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,#13244A,#0A1428);border:2px solid ' + accent + '88;box-shadow:0 0 18px ' + accent + '55;display:flex;align-items:center;justify-content:center;font-size:' + (sz * .5) + 'px;animation:float 3.4s ease-in-out infinite">' + emoji + '</div></div>'; }

  function selectView() {
    var profiles = GS.store.profiles.list();
    var cards = profiles.map(function (p) {
      var idx = gutIdx(p);
      var accent = idx > 65 ? ui.T.green : idx > 45 ? ui.T.cyan : ui.T.red;
      var dl = idx > 65 ? '⚡ 생기' : idx > 45 ? '😐 둔감' : '🫥 탈진';
      return '<div onclick="GS.screens.login.enter(\'' + p.id + '\')" class="panel tight fadeIn" style="display:flex;gap:14px;align-items:center;padding:14px;margin-bottom:10px;cursor:pointer">' +
        orb(GS.chars.avatarHtml(p.avatar, 40), accent, 56) +
        '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-size:17px;color:var(--ink)">' + p.name + '</div><div class="micro" style="color:var(--cyan)">RESIDENT</div></div>' +
        '<div class="cap" style="margin-top:2px">' + (p.bio || '') + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-top:9px"><div style="flex:1;height:5px;border-radius:3px;background:rgba(122,220,255,.14);overflow:hidden"><div style="height:100%;width:' + idx + '%;background:linear-gradient(90deg,' + accent + ',' + ui.T.cyan2 + ');box-shadow:0 0 6px ' + accent + '88"></div></div>' +
        '<div style="font-size:10px;color:' + accent + ';white-space:nowrap">GUT ' + idx + ' · ' + dl + '</div></div></div>' +
        '<div style="color:' + accent + ';font-size:22px">›</div></div>';
    }).join('');
    return '<div style="position:absolute;inset:0" id="login3d"></div>' +
      '<div class="pad" style="position:relative;z-index:2;min-height:100%;display:flex;flex-direction:column">' +
        '<div style="text-align:center;padding-top:calc(env(safe-area-inset-top,0px) + 30px);padding-bottom:6px">' +
          '<div style="font-size:42px;font-weight:400;letter-spacing:-1px;color:#fff;text-shadow:0 0 24px rgba(55,199,255,.7),0 0 4px rgba(122,220,255,.5)">GutSense<span style="color:var(--cyan)">.</span></div>' +
          '<div class="micro" style="color:var(--cyan);letter-spacing:.22em;text-transform:uppercase;margin-top:8px">Gut Ecosystem Digital Twin</div>' +
          '<div class="cap" style="margin-top:8px">당신의 장 속 우주를 만나보세요</div>' +
        '</div>' +
        '<div style="margin:18px 0 12px">' + ui.stageTag('생체 프로필 선택') + '</div>' +
        cards +
        '<div onclick="GS.screens.login.toRegister()" class="panel tight fadeIn" style="display:flex;gap:14px;align-items:center;padding:14px;margin-bottom:10px;border:1.5px dashed rgba(122,220,255,.4);cursor:pointer">' +
          '<div style="width:56px;height:56px;border-radius:50%;border:2px dashed rgba(122,220,255,.5);display:flex;align-items:center;justify-content:center;font-size:28px;color:var(--cyan);background:rgba(122,220,255,.06)">+</div>' +
          '<div><div style="font-size:15px;color:var(--ink)">새 생체 등록</div><div class="cap" style="margin-top:2px">디지털 트윈을 처음부터 조립하기</div></div></div>' +
        '<div style="flex:1"></div>' +
        '<div class="micro" style="text-align:center;padding:14px 0 calc(env(safe-area-inset-bottom,0px) + 14px);line-height:1.7">v3.0 · BIO-TWIN ENGINE · 본 앱은 건강 관리 보조 도구이며 의료 기기가 아닙니다</div>' +
      '</div>';
  }

  function loadView() {
    return '<div class="pad" style="min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">' +
      '<div style="position:relative;width:148px;height:148px;margin-bottom:1.75rem">' +
        '<div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,' + ui.T.cyan + '33 0%,transparent 70%);animation:float 3s ease-in-out infinite"></div>' +
        '<svg viewBox="0 0 148 148" style="position:absolute;inset:0;width:100%;height:100%"><circle cx="74" cy="74" r="64" fill="none" stroke="rgba(122,220,255,.15)" stroke-width="3"/><circle id="ldArc" cx="74" cy="74" r="64" fill="none" stroke="' + ui.T.cyan + '" stroke-width="3" stroke-linecap="round" stroke-dasharray="402" stroke-dashoffset="402" transform="rotate(-90 74 74)" style="filter:drop-shadow(0 0 6px ' + ui.T.cyan + ')"/></svg>' +
        '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="font-size:40px;animation:float 2s ease-in-out infinite">🧬</div></div></div>' +
      '<div class="h1">USER 정보 불러오는 중..</div>' +
      '<div id="ldName" class="cap" style="color:var(--cyan);margin:.6rem 0 1.2rem;min-height:16px"></div>' +
      '<div id="ldStream" class="cap" style="min-height:150px;font-family:monospace;font-size:11px;line-height:1.9;text-align:left"></div></div>';
  }
  function runLoad(pid, then) {
    var list = GS.store.profiles.list(), p = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === pid) { p = list[i]; break; }
    var ne = document.getElementById('ldName'); if (ne && p) ne.textContent = '▸ ' + p.name + ' · 생체 ID#' + pid.toUpperCase();
    var se = document.getElementById('ldStream'), arc = document.getElementById('ldArc');
    var lines = ['▸ 생체 ID 동기화 ……', '▸ 마이크로바이옴 지문 스캔 ……', '▸ 장 생태계 지수 계산 ……', '▸ SCFA / LPS / 염증 지표 로드 ……', '▸ 디지털 트윈 조립 ……', '▸ Dr.장 연결 ……', '▸ 동기화 완료 ✓'];
    var k = 0;
    (function step() {
      if (k >= lines.length) { var t = document.querySelector('.h1'); if (t) t.textContent = '진입 준비 완료'; if (arc) arc.setAttribute('stroke-dashoffset', '0'); setTimeout(function () { then && then(); }, 360); return; }
      if (se) se.innerHTML = lines.slice(0, k + 1).map(function (l, m) { return '<div style="opacity:' + (.4 + .6 * m / Math.max(1, k)) + '">' + l + '</div>'; }).join('');
      if (arc) arc.setAttribute('stroke-dashoffset', String(402 * (1 - (k + 1) / lines.length)));
      k++; setTimeout(step, 270);
    })();
  }

  function regView() {
    function fh(n, l) { return '<div style="font-size:11px;color:var(--ink);margin-bottom:6px;display:flex;align-items:center;gap:6px"><span style="display:inline-flex;width:18px;height:18px;border-radius:50%;background:rgba(55,199,255,.18);color:var(--cyan);font-size:10px;align-items:center;justify-content:center">' + n + '</span> ' + l + '</div>'; }
    var g = ['male', 'female'].map(function (x) { var on = mem.gender === x; return '<div onclick="GS.screens.login.set(\'gender\',\'' + x + '\')" class="chip' + (on ? ' on-good' : '') + '" style="flex:1;justify-content:center">' + (x === 'male' ? '남성' : '여성') + '</div>'; }).join('');
    var lf = Object.keys(D.LIFESTYLES).map(function (k) { var on = mem.lifestyle === k; return '<div onclick="GS.screens.login.set(\'lifestyle\',\'' + k + '\')" class="chip' + (on ? ' on-good' : '') + '" style="justify-content:center;font-size:11px">' + D.LIFESTYLES[k].label + '</div>'; }).join('');
    var av = AV.map(function (a) { var on = mem.avatar === a; return '<div onclick="GS.screens.login.set(\'avatar\',\'' + a + '\')" style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;border:2px solid ' + (on ? ui.T.cyan : 'rgba(122,220,255,.2)') + ';background:' + (on ? 'rgba(55,199,255,.18)' : 'rgba(20,40,78,.5)') + '">' + a + '</div>'; }).join('');
    return '<div class="pad">' +
      '<div onclick="GS.screens.login.toSelect()" class="cap" style="cursor:pointer;margin-bottom:16px">← 프로필 선택</div>' +
      '<div class="h1">생체 캘리브레이션</div><div class="cap" style="margin:4px 0 1.25rem">당신의 장 생태계 디지털 트윈을 조립합니다.<br>각 항목이 시뮬레이션 정확도를 높여요.</div>' +
      ui.panel(fh(1, '이름 / 닉네임') + '<input class="field" placeholder="예) 김미생" value="' + mem.name + '" oninput="GS.screens.login.set(\'name\',this.value)">') +
      ui.panel(fh(2, '성별') + '<div style="display:flex;gap:8px">' + g + '</div>') +
      ui.panel(fh(3, '나이') + '<input class="field" type="number" min="10" max="100" value="' + mem.age + '" oninput="GS.screens.login.set(\'age\',this.value)">') +
      ui.panel(fh(4, '라이프스타일') + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + lf + '</div>') +
      ui.panel(fh(5, '아바타') + '<div style="display:flex;flex-wrap:wrap;gap:8px">' + av + '</div>') +
      '<div style="height:6px"></div>' + ui.btn('디지털 트윈 생성 →', { onclick: 'GS.screens.login.submit()' }) +
      '<div class="micro" style="text-align:center;margin-top:1rem">🔒 입력 정보는 이 기기(localStorage)에만 저장됩니다</div></div>';
  }

  function render() { if (mem.stage === 'loading') return loadView(); if (mem.stage === 'register') return regView(); return selectView(); }
  function reRender() { if (GS.engine && GS.engine.dispose) { try { GS.engine.dispose(); } catch (e) {} } var c = document.querySelector('.screen'); if (c) c.innerHTML = render(); if (GS.engine && GS.engine.mount) { try { GS.engine.mount('login'); } catch (e) {} if (mem.stage === 'loading') runLoad(mem.pid, function () { GS.store.profiles.switch(mem.pid); ui.toast('환영합니다, ' + (mem.pname || '') + '님! 🎉', 'success'); GS.nav.boot(); }); } }
  function enter(id) { var list = GS.store.profiles.list(), p = null; for (var i = 0; i < list.length; i++) if (list[i].id === id) { p = list[i]; break; } if (!p) return; mem.pid = id; mem.pname = p.name; mem.stage = 'loading'; reRender(); }
  function toSelect() { mem.stage = 'select'; reRender(); }
  function toRegister() { mem.stage = 'register'; mem.name = ''; mem.gender = 'male'; mem.age = '30'; mem.lifestyle = 'sedentary'; mem.avatar = '🧑'; reRender(); }
  function set(f, v) { mem[f] = v; if (f === 'gender' || f === 'lifestyle' || f === 'avatar') reRender(); }
  function submit() {
    var name = (mem.name || '').trim(); if (!name) { ui.toast('이름을 입력해주세요', 'error'); return; }
    var age = parseInt(mem.age, 10); if (!age || age < 10 || age > 100) { ui.toast('나이를 확인해주세요 (10-100)', 'error'); return; }
    var p = { name: name, gender: mem.gender, age: age, lifestyle: mem.lifestyle, avatar: mem.avatar, bio: (mem.gender === 'female' ? '여성' : '남성') + ' · ' + age + '세 · 새 트윈' };
    GS.store.profiles.add(p); mem.pid = p.id; mem.pname = name; mem.stage = 'loading'; reRender();
  }
  // profile screen depends on these
  function confirmLogout() { ui.modal('로그아웃', '<div class="cap">로그아웃 시 프로필 선택 화면으로 이동합니다.</div>', { footer: ui.btn('로그아웃', { onclick: 'GS.screens.login.doLogout()' }) + '<div style="height:8px"></div>' + ui.btn('취소', { ghost: true, onclick: 'GS.ui.closeModal()' }) }); }
  function doLogout() { GS.store.logout(); ui.closeModal(); ui.toast('로그아웃되었습니다', 'info'); mem.stage = 'select'; setTimeout(function () { GS.nav.boot(); }, 300); }
  function confirmReset() { ui.modal('모든 데이터 삭제', '<div class="cap">모든 데이터가 영구 삭제됩니다. 되돌릴 수 없어요.</div>', { footer: ui.btn('완전히 삭제', { danger: true, onclick: 'GS.screens.login.doReset()' }) + '<div style="height:8px"></div>' + ui.btn('취소', { ghost: true, onclick: 'GS.ui.closeModal()' }) }); }
  function doReset() { GS.store.reset(); ui.closeModal(); ui.toast('데이터가 삭제되었습니다', 'info'); mem.stage = 'select'; setTimeout(function () { GS.nav.boot(); }, 300); }

  GS.screens.login = render;
  GS.screens.login.enter = enter; GS.screens.login.toSelect = toSelect; GS.screens.login.toRegister = toRegister;
  GS.screens.login.set = set; GS.screens.login.submit = submit;
  GS.screens.login.confirmLogout = confirmLogout; GS.screens.login.doLogout = doLogout;
  GS.screens.login.confirmReset = confirmReset; GS.screens.login.doReset = doReset;
})();
