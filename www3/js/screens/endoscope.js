/* GutSense www3 — TIME VISION (타임 비전). 3년 연속 시뮬레이션.
 * 3D 대장내시경 오브젝트(하우스트라 주름·습윤 점막·미란 오버레이)가
 * 영상처럼 흘러가며, 현재→3년 타임라인의 얼굴 아이콘과 실시간 연동.
 * 좋은 습관=점막 회복, 나쁜 습관=염증 악화. 드라마틱 변화 연출.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var ui = window.GS.ui, D = window.GS_DATA;

  var DUR = 12.3;                      // 현재→3년 재생 시간(초)
  var sim = { progress: 0, playing: true, trend: 'flat', score0: 50, score5: 50, h0: 0.5, avatar: null };
  var simGen = 0;

  var FACE_MOODS = {
    up:   ['smile', 'smile', 'bigSmile', 'bigSmile'],
    down: ['smile', 'flat', 'frown', 'cry'],
    flat: ['smile', 'flat', 'flat', 'frown']
  };

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function calibrate() {
    var m = GS.store.coreMetrics();
    var score = GS.store.gutScore();
    var isGood = score >= 55 && m.inflammation < 45;
    var isBad = score < 40 || m.inflammation >= 55;
    sim.trend = isGood ? 'up' : isBad ? 'down' : 'flat';
    sim.score0 = score;
    sim.score5 = isGood ? Math.min(96, Math.max(80, score) + 6)
                : isBad ? Math.max(8, Math.round(score * 0.3))
                : score - 6;
    sim.h0 = clamp(score / 100, 0.3, 0.7);
    var p = (GS.store && GS.store.profile && GS.store.profile.get()) || {};
    sim.avatar = p.avatar;
  }

  function healthAt(p) {
    if (sim.trend === 'up') return lerp(sim.h0, 0.95, p);
    if (sim.trend === 'down') return lerp(sim.h0, 0.05, p);
    return clamp(sim.h0 - 0.12 * p + 0.03 * Math.sin(p * Math.PI * 2), 0.05, 0.95);
  }
  function scoreAt(p) { return Math.round(lerp(sim.score0, sim.score5, p)); }

  function gradeFor(h) {
    if (h >= 0.75) return { g: 'Grade 0', l: '정상 점막', col: '#27D89B' };
    if (h >= 0.55) return { g: 'Grade 1', l: '경도 염증', col: '#7ADCFF' };
    if (h >= 0.35) return { g: 'Grade 2', l: '중등도 염증', col: '#FFC44D' };
    if (h >= 0.2)  return { g: 'Grade 3', l: '중증 염증', col: '#FF8A4D' };
    return { g: 'Grade 4', l: '미란·궤양 진행', col: '#FF5C7A' };
  }

  // ---- DOM readout sync (runs every frame, independent of WebGL) ----
  function applySim() {
    var face = document.getElementById('tvFace');
    if (!face) return;
    var p = sim.progress;
    var h = healthAt(p), sc = scoreAt(p), gr = gradeFor(h);
    var yr = Math.round(p * 3);
    face.style.left = (p * 100) + '%';
    face.innerHTML = GS.chars.avatarFace(sim.avatar, FACE_MOODS[sim.trend][Math.min(3, Math.floor(p * 3.999))], 30);
    face.style.filter = 'drop-shadow(0 0 8px ' + gr.col + 'aa)';
    document.getElementById('tvFill').style.width = (p * 100) + '%';
    var yEl = document.getElementById('tvYear');
    if (yEl) yEl.textContent = yr === 0 ? '현재' : '+' + yr + '년';
    var sEl = document.getElementById('tvScore');
    if (sEl) { sEl.textContent = 'GUT ' + sc; sEl.style.color = sc > 65 ? ui.T.green : sc > 40 ? ui.T.amber : ui.T.red; }
    var gEl = document.getElementById('tvGrade');
    if (gEl) { gEl.textContent = gr.g + ' · ' + gr.l; gEl.style.color = gr.col; gEl.style.borderColor = gr.col + '55'; gEl.style.background = gr.col + '14'; }
    var wash = document.getElementById('tvWash');
    if (wash) {
      if (sim.trend === 'down') { wash.style.background = 'radial-gradient(ellipse at 50% 60%, rgba(226,38,64,' + (0.05 + 0.3 * p) + '), rgba(60,0,10,.22) 75%)'; }
      else if (sim.trend === 'up') { wash.style.background = 'radial-gradient(ellipse at 50% 60%, rgba(35,216,155,' + (0.04 + 0.1 * p) + '), rgba(4,40,32,.14) 75%)'; }
      else wash.style.background = 'radial-gradient(ellipse at 50% 60%, rgba(255,196,77,' + (0.04 + 0.08 * p) + '), rgba(40,28,4,.14) 75%)';
    }
  }

  function domLoop() {
    var gen = ++simGen;
    var last = performance.now(), miss = 0;
    function frame(now) {
      if (gen !== simGen) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!document.getElementById('tvFace')) { if (++miss > 90) return; }
      else miss = 0;
      if (sim.playing) { sim.progress += dt / DUR; if (sim.progress >= 1) sim.progress -= 1; }
      applySim();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ============================================================
  // 3D ENDOSCOPE — procedural mucosa tunnel (three.js)
  // ============================================================
  function mucosaTex() {
    var c = document.createElement('canvas'); c.width = c.height = 512;
    var g = c.getContext('2d');
    var lg = g.createLinearGradient(0, 0, 512, 0);
    lg.addColorStop(0, '#E28F9C'); lg.addColorStop(.5, '#EA9BA6'); lg.addColorStop(1, '#D9838F');
    g.fillStyle = lg; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 2600; i++) {
      var r = Math.random();
      g.fillStyle = r < .5 ? 'rgba(178,64,80,' + (.02 + Math.random() * .05) + ')'
                 : r < .85 ? 'rgba(255,214,220,' + (.02 + Math.random() * .04) + ')'
                 : 'rgba(140,36,50,' + (.02 + Math.random() * .04) + ')';
      g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2.4, 1 + Math.random() * 2.4);
    }
    g.strokeStyle = 'rgba(150,40,56,.13)'; g.lineWidth = 1.4;
    for (var v = 0; v < 46; v++) {
      var x = Math.random() * 512, y = Math.random() * 512;
      g.beginPath(); g.moveTo(x, y);
      for (var s = 0; s < 5; s++) { x += (Math.random() - .5) * 46; y += 18 + Math.random() * 30; g.lineTo(x, y); }
      g.stroke();
    }
    for (var b = 0; b < 22; b++) {
      var bx = Math.random() * 512, by = Math.random() * 512, br = 22 + Math.random() * 50;
      var rg = g.createRadialGradient(bx, by, 0, bx, by, br);
      rg.addColorStop(0, 'rgba(255,235,238,.09)'); rg.addColorStop(1, 'rgba(255,235,238,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 10);
    return t;
  }

  function damageTex() {
    var c = document.createElement('canvas'); c.width = c.height = 512;
    var g = c.getContext('2d');
    // 궤양 — 중심 황색 섬유소 가피(fibrin exudate) + 적색 윤상 침윤
    function ulcer(x, y, r) {
      var rg = g.createRadialGradient(x, y, r * .1, x, y, r);
      rg.addColorStop(0, 'rgba(244,229,168,.96)');
      rg.addColorStop(.28, 'rgba(224,196,116,.9)');
      rg.addColorStop(.5, 'rgba(160,44,52,.78)');
      rg.addColorStop(.75, 'rgba(98,14,28,.5)');
      rg.addColorStop(1, 'rgba(98,14,28,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.strokeStyle = 'rgba(214,196,140,.7)'; g.lineWidth = 1.8;
      g.beginPath(); g.arc(x, y, r * .42, Math.random() * 3, Math.random() * 3 + 2.4); g.stroke();
      g.strokeStyle = 'rgba(58,6,14,.7)'; g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, r * .72, Math.random() * 3, Math.random() * 3 + 2.8); g.stroke();
    }
    // 고름(pus) — 황록색 삼출물 뭉치
    function pus(x, y, r) {
      var rg = g.createRadialGradient(x, y, r * .1, x, y, r);
      rg.addColorStop(0, 'rgba(222,214,128,.9)');
      rg.addColorStop(.45, 'rgba(198,190,102,.55)');
      rg.addColorStop(1, 'rgba(198,190,102,0)');
      g.fillStyle = rg;
      g.beginPath(); g.ellipse(x, y, r, r * (.55 + Math.random() * .5), Math.random() * Math.PI, 0, 7); g.fill();
      g.fillStyle = 'rgba(240,234,170,.65)';
      g.beginPath(); g.arc(x + r * .2, y - r * .15, r * .18, 0, 7); g.fill();
    }
    for (var u = 0; u < 17; u++) ulcer(26 + Math.random() * 460, 22 + Math.random() * 468, 10 + Math.random() * 26);
    for (var p = 0; p < 15; p++) pus(24 + Math.random() * 464, 20 + Math.random() * 472, 7 + Math.random() * 19);
    for (var f = 0; f < 9; f++) {
      var x = Math.random() * 512, y = Math.random() * 512;
      g.strokeStyle = 'rgba(46,6,12,.75)'; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(x, y);
      for (var s = 0; s < 6; s++) { x += (Math.random() - .5) * 34; y += 12 + Math.random() * 26; g.lineTo(x, y); }
      g.stroke();
      g.strokeStyle = 'rgba(180,30,40,.3)'; g.lineWidth = 5.5; g.stroke();
    }
    for (var d = 0; d < 240; d++) {
      g.fillStyle = 'rgba(96,14,26,' + (.18 + Math.random() * .22) + ')';
      g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, .8 + Math.random() * 2.4, 0, 7); g.fill();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 10);
    return t;
  }

  function bloodTex() {
    var c = document.createElement('canvas'); c.width = c.height = 512;
    var g = c.getContext('2d');
    g.lineCap = 'round';
    // 충혈된 혈관망 — 점차 굵어지는 분지
    for (var v = 0; v < 26; v++) {
      var x = Math.random() * 512, y = Math.random() * 512;
      var w = 3.5 + Math.random() * 5.5;
      var segs = 4 + Math.floor(Math.random() * 4);
      for (var s = 0; s < segs; s++) {
        var nx = x + (Math.random() - .5) * 60, ny = y + (Math.random() - .4) * 60;
        g.strokeStyle = 'rgba(128,18,34,.5)'; g.lineWidth = w;
        g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
        g.strokeStyle = 'rgba(66,4,16,.6)'; g.lineWidth = w * .45;
        g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
        x = nx; y = ny; w *= .8;
      }
    }
    // 정체된 피 웅덩이(stasis pooling)
    for (var b = 0; b < 17; b++) {
      var bx = Math.random() * 512, by = Math.random() * 512, br = 16 + Math.random() * 42;
      var rg = g.createRadialGradient(bx, by, 0, bx, by, br);
      rg.addColorStop(0, 'rgba(104,8,22,.62)');
      rg.addColorStop(.55, 'rgba(72,4,18,.38)');
      rg.addColorStop(1, 'rgba(72,4,18,0)');
      g.fillStyle = rg;
      g.beginPath(); g.ellipse(bx, by, br, br * (.6 + Math.random() * .5), Math.random() * Math.PI, 0, 7); g.fill();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 10);
    return t;
  }

  function sheenTex() {
    var c = document.createElement('canvas'); c.width = 256; c.height = 256;
    var g = c.getContext('2d');
    for (var i = 0; i < 26; i++) {
      var x = Math.random() * 256, w = 4 + Math.random() * 16;
      var lg = g.createLinearGradient(x, 0, x + w, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(.5, 'rgba(255,240,244,' + (.05 + Math.random() * .1) + ')');
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lg; g.fillRect(x, 0, w, 256);
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 6);
    return t;
  }

  function dotTex() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(.35, 'rgba(255,255,255,.55)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  if (window.THREE && GS.engine) {
    GS.engine.register('endoscope', function (stage) {
      var host = document.getElementById('endoscope3d'); if (!host) return;
      stage.attach(host);
      var LEN = 44, R = 3.1, FOLDS = 10, ASYM = 5;

      stage.camera.fov = 78;
      stage.camera.position.set(0, 0, 16);
      stage.camera.lookAt(0, 0, -10);
      stage.camera.updateProjectionMatrix();
      stage.scene.fog = new THREE.Fog(0x180409, 6, 30);

      var amb = new THREE.AmbientLight(0x7a5a5e, 0.62); stage.add(amb);
      var head = new THREE.PointLight(0xfff0ec, 1.15, 34); head.position.set(0, 0, 13); stage.add(head);
      var rim = new THREE.PointLight(0xff8fa0, 0.4, 26); rim.position.set(0, 0, -6); stage.add(rim);

      function displace(geo, k) {
        var pos = geo.attributes.position;
        for (var i = 0; i < pos.count; i++) {
          var x = pos.getX(i), y = pos.getY(i) + LEN / 2, z = pos.getZ(i);
          var a = Math.atan2(z, x);
          var s = k * (1 + 0.13 * Math.sin(y * Math.PI * 2 * FOLDS / LEN)
                      + 0.05 * Math.sin(y * Math.PI * 2 * FOLDS * 2 / LEN)
                      + 0.035 * Math.sin(a * 3 + y * Math.PI * 2 * ASYM / LEN));
          var len0 = Math.sqrt(x * x + z * z) || 1;
          pos.setX(i, x / len0 * R * s); pos.setZ(i, z / len0 * R * s);
        }
        geo.computeVertexNormals();
      }

      var tube = new THREE.Group(); stage.add(tube);

      var gMuc = new THREE.CylinderGeometry(R, R, LEN, 48, 200, true); displace(gMuc, 1);
      var mucMat = new THREE.MeshPhongMaterial({ map: mucosaTex(), color: 0xffffff, shininess: 42, specular: 0x886666, side: THREE.BackSide });
      var mucosa = new THREE.Mesh(gMuc, mucMat); tube.add(mucosa);

      var gDmg = new THREE.CylinderGeometry(R * .99, R * .99, LEN, 48, 200, true); displace(gDmg, .99);
      var dmgMat = new THREE.MeshPhongMaterial({ map: damageTex(), transparent: true, opacity: 0, shininess: 20, specular: 0x554444, side: THREE.BackSide, depthWrite: false });
      var damage = new THREE.Mesh(gDmg, dmgMat); damage.renderOrder = 1; tube.add(damage);

      // 혈관 울혈 오버레이 — 혈관망 + 피 고임 (악화 시 맥동하며 짙어짐)
      var gBld = new THREE.CylinderGeometry(R * .985, R * .985, LEN, 48, 200, true); displace(gBld, .985);
      var bldMat = new THREE.MeshPhongMaterial({ map: bloodTex(), transparent: true, opacity: 0, shininess: 8, side: THREE.BackSide, depthWrite: false });
      var blood = new THREE.Mesh(gBld, bldMat); blood.renderOrder = 2; tube.add(blood);

      // 3D 용종(polyp) — 내벽에 부착된 발적 결절, 악화 진행도에 따라 자람
      var polyps = new THREE.Group();
      var pGeo = new THREE.SphereGeometry(1, 12, 10);
      for (var pp = 0; pp < 20; pp++) {
        var pMat = new THREE.MeshPhongMaterial({ color: 0xb52e3a, shininess: 58, specular: 0xffb4b4, emissive: 0x2a0508 });
        var po = new THREE.Mesh(pGeo, pMat);
        var pa = (pp / 12) * Math.PI * 2 + Math.random() * .5;
        po.position.set(Math.cos(pa) * R * (0.9 + Math.random() * .05), (Math.random() - .5) * (LEN - 8), Math.sin(pa) * R * (0.9 + Math.random() * .05));
        po.userData.s = 0.1 + Math.random() * 0.17;
        po.scale.setScalar(0.001);
        polyps.add(po);
      }
      tube.add(polyps);

      var gShn = new THREE.CylinderGeometry(R * .955, R * .955, LEN, 40, 24, true); displace(gShn, .955);
      var shnTex = sheenTex();
      var sheen = new THREE.Mesh(gShn, new THREE.MeshBasicMaterial({ map: shnTex, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false }));
      tube.add(sheen);
      tube.rotation.x = Math.PI / 2;

      var dt2 = dotTex();
      function makePts(col, size, blend) {
        var N = 90, arr = new Float32Array(N * 3);
        for (var i = 0; i < N; i++) {
          var a = Math.random() * Math.PI * 2, rr = 1.1 + Math.random() * 1.7;
          arr[i * 3] = Math.cos(a) * rr; arr[i * 3 + 1] = Math.sin(a) * rr; arr[i * 3 + 2] = -12 + Math.random() * 24;
        }
        var gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        var mm = new THREE.PointsMaterial({ color: col, size: size, map: dt2, transparent: true, opacity: 0, depthWrite: false, blending: blend });
        var pts = new THREE.Points(gg, mm); stage.add(pts);
        return { pts: pts, arr: arr, mat: mm, N: N };
      }
      var debris = makePts(0x93202f, 0.17, THREE.NormalBlending);   // LPS 파편 (악화)
      var spark = makePts(0x5df2c0, 0.22, THREE.AdditiveBlending);  // 회복 스파클

      // 결합조직 오버레이 — 악화 후반부에 흰 세로 섬유 다발이 두드러짐 (위축·섬유화 연출)
      function fibrosisTex() {
        var c = document.createElement('canvas'); c.width = c.height = 512;
        var g = c.getContext('2d');
        for (var v = 0; v < 34; v++) {
          var x = Math.random() * 512, w = 2 + Math.random() * 5;
          var lg = g.createLinearGradient(x, 0, x, 512);
          lg.addColorStop(0, 'rgba(240,238,228,0)');
          lg.addColorStop(.5, 'rgba(240,238,228,.8)');
          lg.addColorStop(1, 'rgba(240,238,228,0)');
          g.fillStyle = lg; g.fillRect(x, 0, w, 512);
          g.fillStyle = 'rgba(208,204,190,.35)'; g.fillRect(x - 1, 0, 1, 512);
        }
        for (var b2 = 0; b2 < 10; b2++) {
          var bx = Math.random() * 512, by = Math.random() * 512, br = 20 + Math.random() * 46;
          var rg = g.createRadialGradient(bx, by, 0, bx, by, br);
          rg.addColorStop(0, 'rgba(234,232,220,.28)'); rg.addColorStop(1, 'rgba(234,232,220,0)');
          g.fillStyle = rg; g.beginPath(); g.arc(bx, by, br, 0, 7); g.fill();
        }
        var t2 = new THREE.CanvasTexture(c);
        t2.wrapS = t2.wrapT = THREE.RepeatWrapping; t2.repeat.set(3, 10);
        return t2;
      }
      var gFib = new THREE.CylinderGeometry(R * .992, R * .992, LEN, 48, 200, true); displace(gFib, .992);
      var fibMat = new THREE.MeshPhongMaterial({ map: fibrosisTex(), transparent: true, opacity: 0, shininess: 26, side: THREE.BackSide, depthWrite: false });
      var fibrosis = new THREE.Mesh(gFib, fibMat); fibrosis.renderOrder = 3; tube.add(fibrosis);

      function crackTex() {
        var c = document.createElement('canvas'); c.width = c.height = 512;
        var g = c.getContext('2d'); g.lineCap = 'round';
        for (var v = 0; v < 26; v++) {
          var x = Math.random() * 512, y = Math.random() * 512;
          var w = 3 + Math.random() * 4;
          var segs = 5 + Math.floor(Math.random() * 4);
          for (var s = 0; s < segs; s++) {
            var nx = x + (Math.random() - .5) * 52, ny = y + 16 + Math.random() * 34;
            g.strokeStyle = 'rgba(12,2,6,.92)'; g.lineWidth = w;
            g.beginPath(); g.moveTo(x, y); g.lineTo(nx, ny); g.stroke();
            g.strokeStyle = 'rgba(120,10,26,.4)'; g.lineWidth = w * 2.2; g.stroke();
            x = nx; y = ny; w *= .82;
          }
        }
        var t2 = new THREE.CanvasTexture(c);
        t2.wrapS = t2.wrapT = THREE.RepeatWrapping; t2.repeat.set(3, 10);
        return t2;
      }
      var gCrk = new THREE.CylinderGeometry(R * .989, R * .989, LEN, 48, 200, true); displace(gCrk, .989);
      var crkMat = new THREE.MeshPhongMaterial({ map: crackTex(), transparent: true, opacity: 0, shininess: 4, side: THREE.BackSide, depthWrite: false });
      var cracksOv = new THREE.Mesh(gCrk, crkMat); cracksOv.renderOrder = 4; tube.add(cracksOv);

      var pusGrp = new THREE.Group();
      var pusMat = new THREE.MeshPhongMaterial({ color: 0xd6c84e, emissive: 0x6a5c10, emissiveIntensity: 0.4, shininess: 90, specular: 0xfff6c0 });
      for (var pj = 0; pj < 16; pj++) {
        var pb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), pusMat.clone());
        var pa2 = Math.random() * Math.PI * 2;
        pb.position.set(Math.cos(pa2) * R * 0.86, (Math.random() - 0.5) * (LEN - 10), Math.sin(pa2) * R * 0.86);
        pb.userData = { s: 0.4 + Math.random() * 0.9, drip: Math.random() * Math.PI * 2 };
        pb.scale.setScalar(0.001);
        pusGrp.add(pb);
      }
      tube.add(pusGrp);

      var villiGrp = new THREE.InstancedMesh(
        new THREE.ConeGeometry(0.14, 0.6, 5),
        new THREE.MeshPhongMaterial({ color: 0xffb6c2, emissive: 0x30101a, shininess: 40 }),
        80
      );
      var dummy = new THREE.Object3D();
      var villiBase = [];
      for (var vk = 0; vk < 80; vk++) {
        var va2 = (vk * 2.399) % (Math.PI * 2);
        var vy = ((vk * 7.3) % (LEN - 8)) - (LEN - 8) / 2;
        dummy.position.set(Math.cos(va2) * R * 0.9, vy, Math.sin(va2) * R * 0.9);
        dummy.lookAt(0, vy, 0);
        dummy.rotateX(-Math.PI / 2);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        villiGrp.setMatrixAt(vk, dummy.matrix);
        villiBase.push({ p: dummy.position.clone(), q: dummy.quaternion.clone(), s: 0.7 + Math.random() * 0.5 });
      }
      villiGrp.instanceMatrix.needsUpdate = true;
      tube.add(villiGrp);

      var cam = stage.camera, colH = new THREE.Color();
      var colSick = new THREE.Color(0xd42a3c), colMid = new THREE.Color(0xffb0a0), colWell = new THREE.Color(0xffe9ec), colPearl = new THREE.Color(0xfff0f4), colRot = new THREE.Color(0x4a0812);
      var off = 0;

      stage.onUpdate(function (dt, t) {
        var run = sim.playing ? 1 : 0.15;
        var spd = 2.3 + (sim.trend === 'down' ? Math.sin(t * 0.9) * 0.9 + sim.progress * sim.progress * 1.4 : Math.sin(t * 0.6) * 0.4);
        off = (off + spd * dt * run) % LEN;
        tube.position.z = off;
        shnTex.offset.y -= 0.22 * dt * run;

        var p = sim.progress, h = healthAt(p);
        var bad = 1 - clamp((h - 0.1) / 0.85, 0, 1);
        var ease = p * p * p;
        if (sim.trend === 'down') {
          colH.copy(colWell).lerp(colMid, Math.min(1, bad * 2)).lerp(colSick, ease * 0.95);
          if (p > 0.55) colH.lerp(colRot, Math.pow((p - 0.55) / 0.45, 1.4) * 0.85);
        } else if (sim.trend === 'up') {
          colH.copy(colWell).lerp(colPearl, p * 0.9);
        } else {
          colH.copy(colWell).lerp(colSick, bad * 0.5);
        }
        mucMat.color.copy(colH);
        mucMat.shininess = 42 + (sim.trend === 'up' ? p * 50 : -ease * 22);
        dmgMat.opacity = sim.trend === 'down' ? 0.14 + 0.95 * ease : Math.max(0.02, 0.34 * (1 - p * 1.6));
        bldMat.opacity = sim.trend === 'down' ? (0.1 + 0.75 * ease) * (0.78 + 0.22 * Math.sin(t * 3.2)) : Math.max(0, 0.12 * (1 - p * 2));
        fibMat.opacity = sim.trend === 'down' ? Math.max(0, (p - 0.3) * 1.35) : 0;
        crkMat.opacity = sim.trend === 'down' ? Math.max(0, (p - 0.24) * 1.9) : 0;
        var pgrow = sim.trend === 'down' ? 0.12 + 2.6 * ease : Math.max(0.02, 0.1 * (1 - p * 2));
        for (var pi = 0; pi < polyps.children.length; pi++) {
          var po = polyps.children[pi];
          var wob = 1 + 0.13 * Math.sin(t * 3.4 + pi * 1.7);
          var pscP = po.userData.s * pgrow * wob;
          if (sim.trend === 'down' && p > 0.55 && pi % 3 === 0) pscP *= 1 + Math.max(0, Math.sin(t * 1.2 + pi)) * 0.35 * (p - 0.55);
          po.scale.setScalar(Math.max(0.001, pscP));
          po.material.emissiveIntensity = sim.trend === 'down' ? 0.2 + ease * 0.75 : 0.1;
          po.rotation.z += dt * (sim.trend === 'down' ? 0.6 : 0.1);
        }
        var rupturing = sim.trend === 'down' && p > 0.72 && (t % 1.15) < 0.17;
        for (var pk = 0; pk < pusGrp.children.length; pk++) {
          var pb2 = pusGrp.children[pk];
          var psc = sim.trend === 'down' ? Math.max(0.001, pb2.userData.s * 1.4 * clamp((p - 0.24) * 1.9, 0, 1) * (1 + 0.16 * Math.sin(t * 3 + pk))) : 0.001;
          pb2.scale.setScalar(psc);
          pb2.material.emissiveIntensity = 0.4 + ease * 0.7 + (rupturing ? 0.9 : 0);
          if (sim.trend === 'down' && p > 0.32) {
            pb2.position.y -= dt * (0.35 + p * 0.9);
            if (pb2.position.y < -(LEN - 10) / 2) pb2.position.y = (LEN - 10) / 2;
          }
        }
        var vSc;
        if (sim.trend === 'up') vSc = 0.3 + Math.pow(p, 1.5) * 1.05;
        else if (sim.trend === 'down') vSc = Math.max(0.001, 0.85 - Math.pow(p, 1.4) * 1.1);
        else vSc = Math.max(0.001, 0.6 - p * 0.4);
        for (var vi2 = 0; vi2 < villiBase.length; vi2++) {
          var vb = villiBase[vi2];
          dummy.position.copy(vb.p);
          dummy.quaternion.copy(vb.q);
          dummy.scale.setScalar(Math.max(0.001, vb.s * vSc));
          dummy.updateMatrix();
          villiGrp.setMatrixAt(vi2, dummy.matrix);
        }
        villiGrp.instanceMatrix.needsUpdate = true;
        debris.mat.opacity = bad * (0.65 + ease * 0.5);
        debris.mat.size = 0.17 + ease * 0.12;
        spark.mat.opacity = sim.trend === 'up' ? 0.12 + 0.85 * p : 0.06 * (1 - p);
        spark.mat.size = 0.22 + (sim.trend === 'up' ? p * 0.16 : 0);
        head.color.setRGB(1, 1 - bad * 0.3 * ease - bad * 0.12, 1 - bad * 0.38 * ease - bad * 0.14);
        head.intensity = 1.15 + (rupturing ? 1.5 : 0) + (sim.trend === 'down' && p > 0.5 ? Math.sin(t * 6) * 0.25 * ease : 0) - bad * 0.2;
        amb.intensity = 0.62 - bad * 0.5 * ease;
        stage.scene.fog.color.setRGB(0.09 + (1 - bad) * 0.02, 0.016 + (1 - bad * ease) * 0.03, 0.035 + (1 - bad * ease) * 0.03);
        stage.scene.fog.near = 6 - ease * 2.6;
        if (sim.trend === 'down' && p > 0.5) {
          var amp = Math.pow((p - 0.5) * 2, 1.6) * 3.2 * (rupturing ? 3.2 : 1);
          cam.rotation.z = Math.sin(t * 8.5) * 0.032 * amp;
          cam.position.x += (Math.random() - 0.5) * 0.05 * amp;
          cam.position.y += (Math.random() - 0.5) * 0.05 * amp;
        } else { cam.rotation.z = 0; }

        cam.position.x = Math.sin(t * 0.55) * 0.14 * run + cam.position.x * 0.2;
        cam.position.y = Math.cos(t * 0.7) * 0.1 * run + cam.position.y * 0.2;
        head.position.set(cam.position.x, cam.position.y, 13);

        for (var s = 0; s < 2; s++) {
          var o = s ? debris : spark;
          for (var i = 0; i < o.N; i++) {
            o.arr[i * 3 + 2] += (s ? 2.6 : 1.9) * dt * run * (sim.trend === 'down' && s ? 1 + ease * 1.2 : 1);
            if (o.arr[i * 3 + 2] > 14) o.arr[i * 3 + 2] = -12;
          }
          o.pts.geometry.attributes.position.needsUpdate = true;
        }
      });
    });
  }

  // ============================================================
  // SCREEN
  // ============================================================
  function render() {
    calibrate();
    domLoop();

    var m = GS.store.coreMetrics();
    var score = GS.store.gutScore();
    var trend = sim.trend;
    var FRAMES = D.CLINICAL_FRAMES;
    var cf = trend === 'up' ? FRAMES.future.recover : trend === 'down' ? FRAMES.future.progress : FRAMES.current.warn;
    var trendCol = trend === 'up' ? ui.T.green : trend === 'down' ? ui.T.red : ui.T.amber;
    var trendCap = trend === 'up' ? '↗ 좋은 습관 궤적 · 갈수록 점막이 회복돼요'
                 : trend === 'down' ? '↘ 나쁜 습관 궤적 · 염증이 깊어져요'
                 : '→ 분기점 궤적 · 매일의 선택이 방향을 바꿔요';
    var gr = gradeFor(healthAt(1));

    var ticks = [0, 1, 2, 3].map(function (y) {
      return '<div style="position:absolute;left:' + (y * 33.333) + '%;bottom:-15px;transform:translateX(-50%);font-size:9px;color:' + (y === 0 ? 'var(--cyan2)' : 'var(--ink-faint)') + ';white-space:nowrap">' + (y === 0 ? '현재' : '+' + y + '년') + '</div>' +
        '<div style="position:absolute;left:' + (y * 33.333) + '%;top:50%;width:5px;height:5px;border-radius:50%;background:' + (y === 0 ? 'var(--cyan)' : 'rgba(122,220,255,.35)') + ';transform:translate(-50%,-50%)"></div>';
    }).join('');

    var hud =
      '<div style="position:absolute;top:10px;left:12px;display:flex;align-items:center;gap:6px;font-size:10px;color:#ffd7de;letter-spacing:.4px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:#FF5C7A;box-shadow:0 0 8px #FF5C7A;animation:blink 1.1s infinite"></span>SCOPY-9 · 생체 시뮬레이션</div>' +
      '<div style="position:absolute;top:10px;right:12px;text-align:right">' +
        '<div id="tvYear" style="font-size:13px;color:#fff;font-weight:700;text-shadow:0 0 8px rgba(55,199,255,.6)">현재</div>' +
        '<div id="tvScore" style="font-size:10px;color:var(--ink-dim)">GUT ' + score + '</div></div>' +
      '<div id="tvGrade" style="position:absolute;bottom:12px;left:12px;font-size:10px;padding:4px 10px;border-radius:999px;border:1px solid ' + gr.col + '55;background:' + gr.col + '14;color:' + gr.col + ';font-weight:700">' + gr.g + ' · ' + gr.l + '</div>' +
      '<div style="position:absolute;bottom:10px;right:10px;display:flex;gap:7px">' +
        '<div onclick="GS.screens.endoscope.toggle()" style="width:32px;height:32px;border-radius:50%;background:rgba(10,20,44,.75);border:1px solid rgba(122,220,255,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#7ADCFF;font-size:13px" id="tvPlayBtn">⏸</div>' +
        '<div onclick="GS.screens.endoscope.replay()" style="width:32px;height:32px;border-radius:50%;background:rgba(10,20,44,.75);border:1px solid rgba(122,220,255,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#7ADCFF;font-size:14px">↻</div></div>';

    var scope =
      '<div style="position:relative;height:252px;border-radius:18px;overflow:hidden;background:#150608">' +
        '<div id="endoscope3d" style="position:absolute;inset:0"></div>' +
        '<div id="tvWash" style="position:absolute;inset:0;pointer-events:none;transition:background .3s"></div>' +
        '<div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 55%, transparent 46%, rgba(16,2,6,.62) 100%)"></div>' +
        '<div style="position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 3px)"></div>' +
        '<div style="position:absolute;inset:7px;pointer-events:none;border-radius:12px;border:1px solid rgba(122,220,255,.14)"></div>' +
        hud +
      '</div>';

    var timeline =
      '<div style="margin-top:20px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><span class="micro" style="color:var(--cyan2)">' + ui.star() + ' 3년 타임라인</span><span style="font-size:10px;font-weight:700;color:' + trendCol + '">' + trendCap + '</span></div>' +
        '<div id="tvTrack" onclick="GS.screens.endoscope.seek(event)" style="position:relative;height:34px;cursor:pointer;margin-bottom:18px">' +
          '<div style="position:absolute;left:0;right:0;top:50%;height:3px;border-radius:2px;background:rgba(122,220,255,.14);transform:translateY(-50%)"></div>' +
          '<div id="tvFill" style="position:absolute;left:0;top:50%;height:3px;border-radius:2px;background:linear-gradient(90deg,var(--cyan),' + trendCol + ');box-shadow:0 0 8px ' + trendCol + '66;transform:translateY(-50%);width:0%"></div>' +
          ticks +
          '<div id="tvFace" style="position:absolute;top:50%;left:0%;transform:translate(-50%,-58%);font-size:23px;line-height:1;transition:none">' + GS.chars.avatarFace(sim.avatar, 'smile', 30) + '</div>' +
        '</div></div>';

    var drjangLine =
      trend === 'up' ? '좋은 소식이에요! 지금 습관을 유지하면 3년 후 GUT ' + sim.score5 + '까지 회복해요. 발효식품과 식이섬유가 부티레이트를 키워 융모가 다시 살아나는 게 보이죠.'
      : trend === 'down' ? '보이세요? 지금 습관대로면 3년 후 GUT ' + sim.score5 + '까지 떨어져요. 점막이 붉어지고 미란이 퍼지는 게 시뮬레이션에 그대로 드러나요. 오늘부터 식이섬유·발효식품으로 궤적을 되돌릴 수 있어요.'
      : '지금이 분기점이에요. 왼쪽(현재)과 오른쪽(3년 후) 사이 — 매일의 선택이 점막을 어느 방향으로든 바꿔요.';

    return '<div class="pad">' +
      '<div style="margin-bottom:10px;padding-right:150px">' + ui.stageTag('타임 비전') + '<div class="h1" style="margin-top:6px">장 점막 타임 비전</div><div class="cap">현재부터 3년 후까지, 습관이 점막을 바꾸는 과정을 실시간 시뮬레이션해요</div></div>' +
      ui.panel(scope + timeline, { pad: '12px' }) +
      '<div style="height:8px"></div>' +
      '<div style="padding:12px;background:rgba(55,199,255,.06);border:1px solid rgba(55,199,255,.14);border-radius:14px">' +
        '<div class="micro" style="color:var(--cyan2);margin-bottom:4px">📋 3년 후 예측 임상 소견 · ' + cf.label + '</div>' +
        '<div class="cap" style="color:var(--ink);margin-bottom:6px">' + cf.findings + '</div>' +
        '<div style="padding:8px 10px;background:rgba(39,216,155,.1);border-radius:10px;margin-bottom:6px"><span style="font-size:11px;color:var(--green)">💡 ' + (trend === 'up' ? '3년 후에도 건강한 점막이 유지돼요' : trend === 'down' ? '지금 바꾸면 이 예측도 바뀌어요' : '분기점 — 작은 습관이 큰 차이를 만들어요') + '</span></div>' +
        '<div class="cap"><b style="color:' + trendCol + '">조직학적 등급:</b> ' + cf.grade + ' · <b style="color:' + trendCol + '">의미:</b> ' + cf.implication + '</div>' +
      '</div>' +
      '<div style="height:10px"></div>' +
      '<div id="endoscopeDrjang">' + GS.drjang.render(trend === 'up' ? 'celebrate' : trend === 'down' ? 'warn' : 'explain', drjangLine, { size: 74 }) + '</div>' +
      '<div style="height:10px"></div>' +
      '<div onclick="GS.nav.go(\'quest\')" style="cursor:pointer">' + ui.panel(
        '<div style="display:flex;align-items:center;gap:11px"><div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,var(--cyan),var(--violet));display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 6px 16px rgba(55,199,255,.3)">⭐</div><div style="flex:1"><div style="font-size:14px;color:var(--ink)">미션으로 장 회복하기 →</div><div class="micro">매일의 미션이 3년 후 장을 바꿔요</div></div><div style="color:var(--cyan);font-size:22px">→</div></div>',
        { glow: true }) + '</div>' +
      '<div style="height:.5rem"></div></div>';
  }

  function toggle() {
    sim.playing = !sim.playing;
    var b = document.getElementById('tvPlayBtn'); if (b) b.textContent = sim.playing ? '⏸' : '▶';
  }
  function replay() { sim.progress = 0; sim.playing = true; var b = document.getElementById('tvPlayBtn'); if (b) b.textContent = '⏸'; }
  function seek(ev) {
    var el = document.getElementById('tvTrack'); if (!el) return;
    var r = el.getBoundingClientRect();
    sim.progress = clamp((ev.clientX - r.left) / r.width, 0, 0.999);
    applySim();
  }

  GS.screens.endoscope = render;
  GS.screens.endoscope.toggle = toggle;
  GS.screens.endoscope.replay = replay;
  GS.screens.endoscope.seek = seek;
})();
