/* ============================================================
 * GutSense — "장 속으로" 3D 시네마틱 시뮬레이션 v3
 * ------------------------------------------------------------
 * 4막 원테이크 의학 서사:
 *  Act1 선택의 순간 — 음식 선택 즉시 톤 변화 + 식도 하강
 *  Act2 침투 — 융모 파괴 3단계(눌림→갈라짐→조각남) ↔ 장벽 투과성 1:1
 *  Act3 파급 — 장 → 혈류 → 뇌척수액 → 뇌 원테이크 + 3대 지표 동시 반응
 *  Act4 여운 — Dr.장 회복 코멘트 + 미션 동선
 * ============================================================ */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var D = window.GS_DATA;
  var ui = GS.ui || { T: {} };
  var running = false;

  function glowTex() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.3, 'rgba(255,255,255,.7)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function injectStyles() {
    if (document.getElementById('gs-sim-style')) return;
    var s = document.createElement('style'); s.id = 'gs-sim-style';
    s.textContent =
      '#gsSim{position:absolute;inset:0;z-index:180;overflow:hidden;background:#02060f}' +
      '#gsSim canvas{display:block;width:100%;height:100%}' +
      '.sim-skip{position:absolute;top:calc(env(safe-area-inset-top,0px)+14px);right:14px;z-index:5;padding:7px 16px;border-radius:999px;background:rgba(14,30,60,.8);backdrop-filter:blur(10px);border:1px solid rgba(122,220,255,.25);color:var(--ink-dim);font-size:11px;cursor:pointer}' +
      '.sim-act{position:absolute;left:0;right:0;bottom:15%;z-index:4;text-align:center;pointer-events:none;opacity:0;transition:opacity .7s}' +
      '.sim-act.on{opacity:1}' +
      '.sim-act-tag{display:inline-block;padding:4px 14px;border-radius:999px;background:rgba(14,30,60,.75);backdrop-filter:blur(8px);font-size:9px;letter-spacing:.18em;text-transform:uppercase;margin-bottom:10px;border:1px solid rgba(55,199,255,.25);color:var(--cyan)}' +
      '.sim-act-title{font-size:22px;color:#fff;text-shadow:0 0 24px rgba(55,199,255,.55),0 2px 8px rgba(0,0,0,.6);margin-bottom:8px;font-family:Jua,sans-serif;letter-spacing:.01em}' +
      '.sim-act-desc{font-size:13px;color:rgba(234,243,255,.92);max-width:320px;margin:0 auto;line-height:1.6;padding:10px 18px;background:linear-gradient(180deg,rgba(4,10,22,0),rgba(4,10,22,.55));border-radius:12px;text-shadow:0 1px 4px rgba(0,0,0,.7)}' +
      '.sim-hud{position:absolute;top:calc(env(safe-area-inset-top,0px)+14px);left:14px;z-index:4;width:148px;padding:9px 10px;border-radius:13px;background:rgba(6,14,30,.66);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(122,220,255,.18);box-shadow:0 8px 24px rgba(0,0,0,.4)}' +
      '.sim-hud-row{display:flex;align-items:center;gap:6px;margin:5px 0}' +
      '.sim-hud-row span{font-size:8.5px;color:var(--ink-dim);width:34px;flex-shrink:0;font-family:monospace}' +
      '.sim-hud-track{flex:1;height:5px;border-radius:3px;background:rgba(122,220,255,.12);overflow:hidden}' +
      '.sim-hud-track i{display:block;height:100%;width:50%;border-radius:3px;transition:width .5s}' +
      '.sim-hud-row b{font-size:9px;color:var(--ink);width:22px;text-align:right;font-family:monospace;flex-shrink:0}' +
      '.sim-stage{margin-top:7px;padding:4px 8px;border-radius:8px;background:rgba(255,92,122,.14);border:1px solid rgba(255,92,122,.35);font-size:8px;color:#FFB9C6;text-align:center;display:none}' +
      '.sim-bar{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(122,220,255,.08);z-index:4}' +
      '.sim-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--cyan),var(--violet));transition:width .3s}' +
      '.sim-fin{position:absolute;inset:0;z-index:6;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(2,6,15,.88);backdrop-filter:blur(12px);overflow-y:auto}' +
      '.sim-fin.on{display:flex}';
    document.head.appendChild(s);
  }

  function foodChipTex(label, bad) {
    var c = document.createElement('canvas'); c.width = 300; c.height = 120;
    var g = c.getContext('2d');
    var col = bad ? '#FF5C7A' : '#27D89B';
    g.shadowColor = col; g.shadowBlur = 24;
    g.fillStyle = 'rgba(8,16,34,.92)';
    g.beginPath();
    if (g.roundRect) g.roundRect(14, 22, 272, 76, 24); else g.rect(14, 22, 272, 76);
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = col; g.lineWidth = 3; g.stroke();
    g.font = 'bold 40px Jua, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    var txt = label.length > 8 ? label.slice(0, 8) : label;
    g.fillText(txt, 150, 62);
    return new THREE.CanvasTexture(c);
  }

  function run(food, opts) {
    opts = opts || {};
    if (running || !window.THREE) { opts.onDone && opts.onDone(); return; }
    running = true;
    injectStyles();
    GS.engine && GS.engine.dispose && GS.engine.dispose();

    var isBad = !!(food && food.bad);
    var _prof = (GS.store && GS.store.profile && GS.store.profile.get()) || {};
    if (_prof.avatar === 'jd') isBad = true;
    else if (_prof.avatar === 'yjs') isBad = false;
    var fc = isBad ? 0xff5c7a : 0x27d89b;
    var fcHex = isBad ? '#FF5C7A' : '#27D89B';
    var m = GS.store.coreMetrics();

    var overlay = document.createElement('div');
    overlay.id = 'gsSim';
    overlay.innerHTML =
      '<div id="simWake" style="position:absolute;inset:0;z-index:3;background:#000;pointer-events:none"></div>' +
      '<div class="sim-skip" onclick="GS.sim._finish()">건너뛰기 ✕</div>' +
      '<div class="sim-hud" id="simHud">' +
        '<div class="sim-hud-row"><span>SCFA</span><div class="sim-hud-track"><i id="hudScfa" style="background:#27D89B"></i></div><b id="hudScfaV"></b></div>' +
        '<div class="sim-hud-row"><span>투과성</span><div class="sim-hud-track"><i id="hudPerm" style="background:#FF5C7A"></i></div><b id="hudPermV"></b></div>' +
        '<div class="sim-hud-row"><span>염증</span><div class="sim-hud-track"><i id="hudInf" style="background:#FF8A4D"></i></div><b id="hudInfV"></b></div>' +
        '<div class="sim-stage" id="simStage"></div>' +
      '</div>' +
      '<div class="sim-act" id="simAct"><div class="sim-act-tag" id="simActTag"></div><div class="sim-act-title" id="simActTitle"></div><div class="sim-act-desc" id="simActDesc"></div></div>' +
      '<div class="sim-bar"><i id="simBarFill" style="width:0%"></i></div>' +
      '<div class="sim-fin" id="simFin"></div>';
    document.querySelector('.app').appendChild(overlay);
    var wakeEl = overlay.querySelector('#simWake');
    var hud = {
      scfa: { bar: overlay.querySelector('#hudScfa'), val: overlay.querySelector('#hudScfaV'), cur: m.scfa, tgt: m.scfa },
      perm: { bar: overlay.querySelector('#hudPerm'), val: overlay.querySelector('#hudPermV'), cur: m.permeability, tgt: m.permeability },
      inf: { bar: overlay.querySelector('#hudInf'), val: overlay.querySelector('#hudInfV'), cur: m.inflammation, tgt: m.inflammation }
    };
    var stageEl = overlay.querySelector('#simStage');

    var host = overlay;
    var w = host.clientWidth || 400, h = host.clientHeight || 800;
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isBad ? 0x2a060e : 0x06221c, 0.045);
    var camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 100);
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(isBad ? 0x2a060e : 0x06221c, 1);
    host.appendChild(renderer.domElement);
    var gt = glowTex();
    var group = new THREE.Group(); scene.add(group);
    var hemi = new THREE.HemisphereLight(0x9db8dd, 0x1a0a12, 0.62); scene.add(hemi);
    var headLight = new THREE.PointLight(isBad ? 0xffdfe6 : 0xe8fff2, 1.15, 13); scene.add(headLight);
    var fillLight = new THREE.DirectionalLight(isBad ? 0xff8fa0 : 0x7adfB0, 0.4); fillLight.position.set(2, 3, 4); scene.add(fillLight);
    var accentLight = new THREE.PointLight(fc, 0.55, 10); scene.add(accentLight);

    // ===== 경로: 식도 → 소장 챔버 (장 관) =====
    var gutPts = [];
    for (var i = 0; i <= 12; i++) {
      var t = i / 12;
      gutPts.push(new THREE.Vector3(Math.sin(t * 8) * (0.7 + t * 0.5), 14.6 - t * 15.2, Math.cos(t * 6) * 0.5));
    }
    gutPts.push(new THREE.Vector3(0, -1.2, 0.3));
    var gutCurve = new THREE.CatmullRomCurve3(gutPts, false, 'catmullrom', 0.4);
    var CH_T0 = 0.62, CH_T1 = 0.97;
    function gutRadius(t) { return t < CH_T0 ? 1.05 + t * 0.8 : 2.45; }
    function gutFrame(t) {
      var p = gutCurve.getPointAt(Math.min(0.995, t));
      var fr = gutCurve.getTangentAt(Math.min(0.995, t));
      var n = new THREE.Vector3(0, 1, 0), bi = new THREE.Vector3().crossVectors(fr, n).normalize();
      n.crossVectors(fr, bi).normalize();
      return { p: p, bi: bi, n: n };
    }

    // 점막 텍스처
    function mucosaCanvas(bad) {
      var c = document.createElement('canvas'); c.width = c.height = 512;
      var g = c.getContext('2d');
      var base = bad ? ['#5A1E28', '#6E2A32'] : ['#274A44', '#2E5A50'];
      var lg = g.createLinearGradient(0, 0, 512, 512);
      lg.addColorStop(0, base[0]); lg.addColorStop(1, base[1]);
      g.fillStyle = lg; g.fillRect(0, 0, 512, 512);
      for (var i = 0; i < 3000; i++) {
        var r = Math.random();
        g.fillStyle = bad
          ? (r < .5 ? 'rgba(255,140,160,' + (.02 + Math.random() * .05) + ')' : 'rgba(120,40,60,' + (.02 + Math.random() * .05) + ')')
          : (r < .5 ? 'rgba(140,240,200,' + (.02 + Math.random() * .05) + ')' : 'rgba(30,90,70,' + (.02 + Math.random() * .05) + ')');
        g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 2.6, 1 + Math.random() * 2.6);
      }
      g.strokeStyle = bad ? 'rgba(90,30,48,.16)' : 'rgba(24,70,56,.16)'; g.lineWidth = 1.6;
      for (var v = 0; v < 54; v++) {
        var x = Math.random() * 512, y = Math.random() * 512;
        g.beginPath(); g.moveTo(x, y);
        for (var s2 = 0; s2 < 5; s2++) { x += (Math.random() - .5) * 40; y += 14 + Math.random() * 26; g.lineTo(x, y); }
        g.stroke();
      }
      var capCol = bad ? '255,120,140' : '140,220,255';
      var capCol2 = bad ? '190,60,80' : '70,140,170';
      for (var cp = 0; cp < 26; cp++) {
        var cx = Math.random() * 512, cy = Math.random() * 512;
        var veinLen = 46 + Math.random() * 92, veer = (Math.random() - .5) * 1.6;
        var grad = g.createLinearGradient(cx, cy, cx + Math.cos(veer) * veinLen, cy + Math.sin(veer) * veinLen);
        grad.addColorStop(0, 'rgba(' + capCol2 + ',0)');
        grad.addColorStop(.5, 'rgba(' + capCol + ',.3)');
        grad.addColorStop(1, 'rgba(' + capCol2 + ',0)');
        g.strokeStyle = grad; g.lineWidth = 1.2 + Math.random() * 1.6;
        g.beginPath(); g.moveTo(cx, cy);
        var vx = cx, vy = cy;
        for (var vs = 0; vs < 4; vs++) { vx += Math.cos(veer) * veinLen / 4 + (Math.random() - .5) * 9; vy += Math.sin(veer) * veinLen / 4 + (Math.random() - .5) * 9; g.lineTo(vx, vy); }
        g.stroke();
        if (Math.random() > .55) { g.fillStyle = 'rgba(' + capCol + ',.16)'; g.beginPath(); g.arc(vx, vy, 2.6 + Math.random() * 3, 0, 7); g.fill(); }
      }
      g.strokeStyle = bad ? 'rgba(40,12,22,.28)' : 'rgba(10,34,28,.28)'; g.lineWidth = 2.4;
      for (var cr = 1; cr < 9; cr++) {
        var cy2 = cr * 64;
        g.beginPath();
        for (var cx2 = 0; cx2 <= 512; cx2 += 16) g.lineTo(cx2, cy2 + Math.sin(cx2 * 0.05 + cr * 1.7) * 5);
        g.stroke();
      }
      var tx = new THREE.CanvasTexture(c);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(3, 8);
      return tx;
    }
    var mucTex = mucosaCanvas(isBad);

    var segs = 150, radSegs = 30;
    var positions = [], indices = [], uvs = [];
    for (var s = 0; s <= segs; s++) {
      var t1 = s / segs, fr2 = gutFrame(t1), r = gutRadius(t1);
      for (var rs = 0; rs <= radSegs; rs++) {
        var a = (rs / radSegs) * Math.PI * 2;
        positions.push(fr2.p.x + (Math.cos(a) * fr2.bi.x + Math.sin(a) * fr2.n.x) * r,
          fr2.p.y + (Math.cos(a) * fr2.bi.y + Math.sin(a) * fr2.n.y) * r,
          fr2.p.z + (Math.cos(a) * fr2.bi.z + Math.sin(a) * fr2.n.z) * r);
        uvs.push(rs / radSegs, t1 * 2);
      }
    }
    for (var s3 = 0; s3 < segs; s3++) { for (var rs3 = 0; rs3 < radSegs; rs3++) { var a0 = s3 * (radSegs + 1) + rs3, b0 = a0 + 1, c0 = a0 + (radSegs + 1), d0 = c0 + 1; indices.push(a0, c0, b0, b0, c0, d0); } }
    var tubeGeo = new THREE.BufferGeometry();
    tubeGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    tubeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    tubeGeo.setIndex(indices); tubeGeo.computeVertexNormals();
    var mucosaCol = isBad ? 0xc4909c : 0x9fd8c4;
    group.add(new THREE.Mesh(tubeGeo, new THREE.MeshPhongMaterial({ map: mucTex, color: mucosaCol, side: THREE.BackSide, shininess: 86, specular: 0xbcd2e8, transparent: true, opacity: 0.96 })));
    // 연동운동 파동 — 관이 지나가며 꿈틀
    var peristalsis = new THREE.Mesh(new THREE.TubeGeometry(gutCurve, 90, 1, 16, false),
      new THREE.MeshBasicMaterial({ color: isBad ? 0xff7080 : 0x6fe8b0, wireframe: true, transparent: true, opacity: 0.05, side: THREE.BackSide }));
    group.add(peristalsis);

    // ===== 융모 숲 — 손가락 모양, 챔버 벽에 나선 배치 =====
    var VILLI_N = 110;
    var villiGeo = new THREE.CylinderGeometry(0.07, 0.125, 0.78, 7);
    var villiMat = new THREE.MeshPhongMaterial({ color: isBad ? 0xff8fa3 : 0x7fe8c0, shininess: 85, specular: 0xbfe8ff, emissive: isBad ? 0x2a060e : 0x06231a, emissiveIntensity: 0.6, transparent: true, opacity: 0.94 });
    var villi = new THREE.InstancedMesh(villiGeo, villiMat, VILLI_N);
    var dummy = new THREE.Object3D();
    var villiData = [];
    for (var vi = 0; vi < VILLI_N; vi++) {
      var vt = CH_T0 + 0.01 + ((vi % 46) / 46) * (CH_T1 - CH_T0 - 0.02);
      var vAng = (vi * 2.399) % (Math.PI * 2);
      var vfr = gutFrame(vt);
      var vr = gutRadius(vt) * 0.93;
      var vPos = new THREE.Vector3(
        vfr.p.x + (Math.cos(vAng) * vfr.bi.x + Math.sin(vAng) * vfr.n.x) * vr,
        vfr.p.y + (Math.cos(vAng) * vfr.bi.y + Math.sin(vAng) * vfr.n.y) * vr,
        vfr.p.z + (Math.cos(vAng) * vfr.bi.z + Math.sin(vAng) * vfr.n.z) * vr);
      var inward = new THREE.Vector3().subVectors(vfr.p, vPos).normalize();
      villiData.push({
        pos: vPos, dir: inward, phase: Math.random() * Math.PI * 2,
        tiltAxis: new THREE.Vector3(Math.random() - .5, 0, Math.random() - .5).normalize(),
        tilt: (Math.random() - .5) * 1.6,
        scl: 0.8 + Math.random() * 0.45, cur: 1, tgt: 1, curTilt: 0, tgtTilt: 0
      });
    }
    group.add(villi);

    function setVilliTargets(stage) {
      for (var i = 0; i < VILLI_N; i++) {
        var vd = villiData[i];
        if (stage === 0) { vd.tgt = 1; vd.tgtTilt = 0; }
        else if (stage === 1) { vd.tgt = 0.52; vd.tgtTilt = 0; }
        else if (stage === 2) { vd.tgt = 0.5; vd.tgtTilt = vd.tilt; }
        else { vd.tgt = 0.14; vd.tgtTilt = vd.tilt * 1.4; }
      }
      if (stage === 2) villiMat.color.setHex(0xb06070);
      if (stage === 3) villiMat.color.setHex(0x6e3844);
    }

    // ===== 혈관 + 적혈구 (Act3 혈류) =====
    var vesselCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.3, 0.5, 0.3), new THREE.Vector3(2.85, 2.0, 0),
      new THREE.Vector3(2.3, 4.3, -0.2), new THREE.Vector3(1.1, 6.4, 0.2),
      new THREE.Vector3(0.3, 8.0, 0.7)
    ], false, 'catmullrom', 0.5);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(vesselCurve, 96, 0.34, 18, false),
      new THREE.MeshPhongMaterial({ color: 0xb03048, emissive: 0x400810, emissiveIntensity: 0.5, shininess: 60, specular: 0xffaab0, transparent: true, opacity: 0.38, side: THREE.DoubleSide })));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(vesselCurve, 96, 0.5, 18, false),
      new THREE.MeshPhongMaterial({ color: 0xd85568, emissive: 0x5c1020, emissiveIntensity: 0.6, shininess: 90, specular: 0xffc8ce, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })));
    var RBC_N = 46;
    var rbcGeo = new THREE.TorusGeometry(0.075, 0.03, 8, 16);
    var rbc = new THREE.InstancedMesh(rbcGeo, new THREE.MeshPhongMaterial({ color: 0xff4d5e, emissive: 0x66101c, emissiveIntensity: 0.55, shininess: 70, specular: 0xffccd0 }), RBC_N);
    var rbcT = [];
    for (var ri = 0; ri < RBC_N; ri++) rbcT.push({ t: Math.random(), sp: 0.05 + Math.random() * 0.07, roll: Math.random() * Math.PI * 2 });
    group.add(rbc);

    // LPS(나쁨) / SCFA(좋음) 혈류 입자
    var CARGO_N = 22;
    var cargoGeo = isBad ? new THREE.TetrahedronGeometry(0.075, 0) : new THREE.SphereGeometry(0.062, 10, 8);
    var cargo = new THREE.InstancedMesh(cargoGeo, new THREE.MeshPhongMaterial({
      color: isBad ? 0xff2a44 : 0x37ffb0, emissive: isBad ? 0x8a0a1a : 0x0a5c3a, emissiveIntensity: 0.9, shininess: 90, specular: 0xffffff
    }), CARGO_N);
    var cargoT = [];
    for (var ci = 0; ci < CARGO_N; ci++) cargoT.push({ t: Math.random(), sp: 0.04 + Math.random() * 0.06, ph: Math.random() * Math.PI * 2 });
    group.add(cargo);

    // ===== 뇌 + 뇌척수액 (Act3 후반) =====
    var BRAIN_POS = new THREE.Vector3(0.3, 9.6, 0.4);
    var brainGrp = new THREE.Group(); brainGrp.position.copy(BRAIN_POS); group.add(brainGrp);
    var brainCore = new THREE.Mesh(new THREE.SphereGeometry(0.92, 28, 22),
      new THREE.MeshPhongMaterial({ color: isBad ? 0x6b2436 : 0x9a6fd8, emissive: isBad ? 0x30060f : 0x3a1a5c, emissiveIntensity: 0.5, shininess: 60, transparent: true, opacity: 0 }));
    brainGrp.add(brainCore);
    var brainShell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.14, 1)),
      new THREE.LineBasicMaterial({ color: isBad ? 0xff5c7a : 0xc9a6ff, transparent: true, opacity: 0 }));
    brainGrp.add(brainShell);
    for (var bb = 0; bb < 9; bb++) {
      var bump = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), brainCore.material);
      var bba = bb * 0.7;
      bump.position.set(Math.cos(bba) * 0.8, Math.sin(bb * 1.31) * 0.5, Math.sin(bba) * 0.8);
      bump.scale.setScalar(0.8 + Math.random() * 0.4);
      brainGrp.add(bump);
    }
    var csf = new THREE.Mesh(new THREE.SphereGeometry(1.5, 26, 20),
      new THREE.MeshPhongMaterial({ color: 0x6fd8ff, emissive: 0x10405e, emissiveIntensity: 0.6, shininess: 100, specular: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    brainGrp.add(csf);
    var brainGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: isBad ? 0xff5c7a : 0xffc44d, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    brainGlow.scale.set(3.6, 3.6, 1); brainGrp.add(brainGlow);
    var dopaN = 14, dopas = [];
    var dopaCol = isBad ? 0x8a8f99 : 0xffc44d;
    for (var dj = 0; dj < dopaN; dj++) {
      var orb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8),
        new THREE.MeshPhongMaterial({ color: dopaCol, emissive: dopaCol, emissiveIntensity: 0.85, shininess: 140, specular: 0xffffff, transparent: true, opacity: 0 }));
      orb.userData = { a: (dj / dopaN) * Math.PI * 2, sp: 0.8 + Math.random() * 0.9, r: 1.3 + Math.random() * 0.5, ph: Math.random() * Math.PI * 2 };
      brainGrp.add(orb); dopas.push(orb);
    }

    // ===== 주인공 캐릭터 — 귀여운 얼굴(작은 코 + 볼터치) =====
    var fc3d = isBad ? 0xff5c7a : 0x5ee6a8;
    var fcL3d = isBad ? 0xff8a90 : 0x8ee6b8;
    var char = new THREE.Group();
    var bodyMat = new THREE.MeshPhongMaterial({ color: fc3d, emissive: fc3d, emissiveIntensity: 0.4, shininess: 55, specular: 0x7788aa, transparent: true, opacity: 0.96 });
    var charBody = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 26), bodyMat);
    charBody.scale.y = 0.85; char.add(charBody);
    var charBelly = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 14), new THREE.MeshPhongMaterial({ color: fcL3d, emissive: fcL3d, emissiveIntensity: 0.2, shininess: 30, transparent: true, opacity: 0.6 }));
    charBelly.position.set(0, -0.3, 0.26); charBelly.scale.set(1, 0.62, 0.85); char.add(charBelly);

    function bigEye(sx) {
      var g = new THREE.Group();
      var white = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 110, specular: 0xffffff }));
      white.scale.set(0.92, 1.12, 0.55); g.add(white);
      var iris = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshPhongMaterial({ color: 0x2a4a6e, shininess: 100, specular: 0xffffff }));
      iris.position.z = 0.052; iris.scale.set(1, 1.06, 0.5); g.add(iris);
      var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), new THREE.MeshBasicMaterial({ color: 0x101828 }));
      pupil.position.z = 0.082; g.add(pupil);
      var hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      hl1.position.set(0.028, 0.04, 0.096); g.add(hl1);
      var hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      hl2.position.set(-0.022, -0.028, 0.092); g.add(hl2);
      g.position.set(sx, 0.2, 0.43);
      return g;
    }
    var eyeL = bigEye(-0.17), eyeR = bigEye(0.17);
    char.add(eyeL); char.add(eyeR);
    [[-0.17], [0.17]].forEach(function (e) {
      var lash = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.012, 6, 14, Math.PI * 0.6), new THREE.MeshBasicMaterial({ color: 0x1a2a40 }));
      lash.position.set(e[0], 0.27, 0.45); lash.rotation.z = Math.PI * 0.2; char.add(lash);
    });
    var nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff9fb8 }));
    nose.position.set(0, 0.08, 0.47); char.add(nose);
    [[-0.3, 1], [0.3, 1]].forEach(function (c) {
      var ch = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff9fb8, transparent: true, opacity: 0.6 }));
      ch.position.set(c[0], 0.03, 0.43); ch.scale.set(1.15, 0.72, 0.4); char.add(ch);
    });
    var mouthGrp = new THREE.Group(); mouthGrp.position.set(0, -0.06, 0.46); char.add(mouthGrp);
    var mSmile = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.011, 8, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1a2a40 }));
    mSmile.rotation.z = Math.PI; mSmile.position.y = 0.012;
    var mSmileTongue = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff7a93 }));
    mSmileTongue.position.y = -0.006; mSmileTongue.scale.set(1, 0.5, 0.5);
    var mO = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), new THREE.MeshBasicMaterial({ color: 0x1a2a40 }));
    mO.scale.set(1, 1.15, 0.5);
    var mFrown = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.01, 8, 18, Math.PI), new THREE.MeshBasicMaterial({ color: 0x1a2a40 }));
    mFrown.position.y = -0.026;
    var mGrit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.04), new THREE.MeshBasicMaterial({ color: 0x1a2a40 }));
    var mouths = { smile: [mSmile, mSmileTongue], o: [mO], frown: [mFrown], grit: [mGrit] };
    Object.keys(mouths).forEach(function (k) { mouths[k].forEach(function (mm) { mm.visible = false; mouthGrp.add(mm); }); });
    function setMouth(k) { Object.keys(mouths).forEach(function (kk) { mouths[kk].forEach(function (mm) { mm.visible = kk === k; }); }); }
    setMouth('smile');

    var crown = new THREE.Group(); crown.position.y = 0.5; char.add(crown);
    var goldMat = new THREE.MeshPhongMaterial({ color: 0xFFD700, shininess: 130, specular: 0xffffff, emissive: 0x332200, emissiveIntensity: 0.4 });
    crown.add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.29, 0.09, 20), goldMat));
    var crownRim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.02, 8, 24), goldMat);
    crownRim.rotation.x = Math.PI / 2; crownRim.position.y = -0.045; crown.add(crownRim);
    for (var ci2 = 0; ci2 < 5; ci2++) {
      var spikeAng = (ci2 - 2) * 0.42;
      var spike = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 8), goldMat);
      spike.position.set(Math.sin(spikeAng) * 0.24, 0.11 + Math.abs(Math.sin(spikeAng)) * 0.05, Math.cos(spikeAng) * 0.05);
      spike.rotation.z = -spikeAng * 0.5; crown.add(spike);
      var gemCol = ci2 === 2 ? 0xE8F4FF : ci2 % 2 ? 0xFF4D6D : 0x4DA6FF;
      var gem = new THREE.Mesh(new THREE.OctahedronGeometry(ci2 === 2 ? 0.045 : 0.028, 0), new THREE.MeshPhongMaterial({ color: gemCol, shininess: 200, specular: 0xffffff, emissive: gemCol, emissiveIntensity: 0.5, transparent: true, opacity: 0.95 }));
      gem.position.set(spike.position.x, spike.position.y + 0.11, spike.position.z); crown.add(gem);
    }
    var diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), new THREE.MeshPhongMaterial({ color: 0xE8F4FF, shininess: 250, specular: 0xffffff, emissive: 0x88bbff, emissiveIntensity: 0.35, transparent: true, opacity: 0.97 }));
    diamond.position.y = 0.13; crown.add(diamond);
    var diaGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: 0xBFE3FF, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    diaGlow.scale.set(0.5, 0.5, 1); diaGlow.position.y = 0.13; crown.add(diaGlow);
    group.add(char);
    var charGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: fc, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    charGlow.scale.set(2.5, 2.5, 1); group.add(charGlow);
    var TN = 25, trailPos = new Float32Array(TN * 3), trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    var trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ size: 0.14, map: gt, color: fc, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    group.add(trail); var trailHist = [];

    // 음식 칩 스프라이트 (Act1 하강)
    var foodChip = new THREE.Sprite(new THREE.SpriteMaterial({ map: foodChipTex(food.label, isBad), transparent: true, depthWrite: false }));
    foodChip.scale.set(1.7, 0.68, 1);
    group.add(foodChip);
    var chipGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: fc, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    chipGlow.scale.set(3.2, 1.6, 1);
    group.add(chipGlow);

    // 잔해/파편 버스트
    var burstN = 60, bp = new Float32Array(burstN * 3), bv = [];
    for (var bi = 0; bi < burstN; bi++) bv.push([(Math.random() - .5) * 6, (Math.random() - .5) * 6, (Math.random() - .5) * 6]);
    var bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    var burst = new THREE.Points(bgeo, new THREE.PointsMaterial({ size: 0.22, map: gt, color: fc, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    group.add(burst);

    // 좋은 식단 — 융모 영양 스파클 상승
    var SPK_N = 40, spkPos = new Float32Array(SPK_N * 3), spkSeed = [];
    for (var si3 = 0; si3 < SPK_N; si3++) spkSeed.push({ t: CH_T0 + Math.random() * (CH_T1 - CH_T0), a: Math.random() * Math.PI * 2, ph: Math.random() });
    var spkGeo = new THREE.BufferGeometry(); spkGeo.setAttribute('position', new THREE.BufferAttribute(spkPos, 3));
    var sparkle = new THREE.Points(spkGeo, new THREE.PointsMaterial({ size: 0.13, map: gt, color: 0x37ffb0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    group.add(sparkle);

    // ===== 카메라 원테이크 경로 =====
    var camPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.3, 15.6, 1.6),
      new THREE.Vector3(1.4, 12.8, 1.0),
      new THREE.Vector3(-1.0, 10.0, 1.1),
      new THREE.Vector3(0.9, 7.2, 0.9),
      new THREE.Vector3(0.2, 4.6, 1.4),
      new THREE.Vector3(-0.6, 2.6, 1.7),
      new THREE.Vector3(1.5, 1.4, 1.3),
      new THREE.Vector3(2.45, 0.7, 0.45),
      new THREE.Vector3(2.85, 2.0, 0),
      new THREE.Vector3(2.3, 4.3, -0.2),
      new THREE.Vector3(1.1, 6.4, 0.2),
      new THREE.Vector3(0.5, 7.7, 1.3),
      new THREE.Vector3(0.3, 8.6, 3.1)
    ], false, 'catmullrom', 0.5);

    // ===== 액트 데이터 =====
    var acts = [
      { tag: 'ACT 1 · 선택의 순간', title: food.label + (isBad ? ' ⚠ 경고 톤' : ' ✓ 회복 톤'),
        desc: isBad
          ? food.label + ' 선택! 공기가 순식간에 붉게 — 정제당·유화제가 실린 캡슐이 식도를 타고 내려가요. 연동운동 파도가 우릴 소장까지 밀어내요.'
          : food.label + ' 선택! 장이 환하게 — 식이섬유·발효 영양소 캡슐이 식도를 타고 내려가요. 연동운동 파도를 타고 소장으로!' },
      { tag: 'ACT 2 · 침투', title: isBad ? '융모 파괴 3단계' : '융모 손가락 흡수',
        desc: isBad
          ? '융모 숲에 가공물 잔해가 닿았어요. ① 눌림 → ② 갈라짐 → ③ 조각남. 세 단계마다 장벽 투과성 게이지가 1:1로 올라가요.'
          : '손가락 같은 융모가 영양을 움켜쥐고 살랑! 흡수 면적이 넓어지고 SCFA가 차올라요.' },
      { tag: 'ACT 3 · 파급', title: isBad ? '장 → 혈류 → 뇌로' : '장 → 혈류 → 뇌로',
        desc: isBad
          ? '갈라진 틈으로 LPS 내독소가 모세혈관→혈류→뇌척수액을 뚫고 뇌까지. SCFA·투과성·염증 3대 지표가 동시에 흔들려요.'
          : 'SCFA가 모세혈관→혈류→뇌척수액을 거쳐 뇌에 도달! 항염 신호와 도파민이 함께 살아나요.' },
      { tag: 'ACT 4 · 여운', title: isBad ? '그래도 돌아올 수 있어요' : '장-뇌가 하나가 된 순간',
        desc: isBad
          ? '융모는 3~5일이면 다시 자라요. 다음 끼니로 되돌릴 수 있어요 — Dr.장이 미션을 준비했어요.'
          : '오늘의 선택이 내일의 장벽이 돼요. 이 리듬을 미션으로 이어가 볼까요?' }
    ];
    var actTimings = [0, 0.20, 0.56, 0.86];
    var actEl = overlay.querySelector('#simAct');
    var tagEl = overlay.querySelector('#simActTag');
    var titleEl = overlay.querySelector('#simActTitle');
    var descEl = overlay.querySelector('#simActDesc');
    var barFill = overlay.querySelector('#simBarFill');
    var curAct = -1, actTimer = null;
    function showAct(idx) {
      if (idx === curAct) return; curAct = idx;
      if (actTimer) clearTimeout(actTimer);
      actEl.classList.remove('on');
      actTimer = setTimeout(function () { var a = acts[idx]; if (!a) return; tagEl.textContent = a.tag; titleEl.textContent = a.title; descEl.textContent = a.desc; tagEl.style.color = isBad && idx >= 1 ? '#FF5C7A' : 'var(--cyan)'; actEl.classList.add('on'); actTimer = null; }, 250);
    }

    var STAGES = [
      { at: 0.26, name: '융모 파괴 1단계 · 눌림', perm: 55 },
      { at: 0.38, name: '융모 파괴 2단계 · 갈라짐', perm: 75 },
      { at: 0.50, name: '융모 파괴 3단계 · 조각남', perm: 92 }
    ];
    var stageHit = [false, false, false];
    var flash = 0, shake = 0, impactBoost = 1;

    var TOTAL = 23000, clock = new THREE.Clock(), dead = false, rafId = null;
    var hudTargetsSet = false;

    function camTOf(progress) {
      if (progress < 0.20) return (progress / 0.20) * 0.34;
      if (progress < 0.56) return 0.34 + ((progress - 0.20) / 0.36) * 0.16;
      if (progress < 0.86) return 0.5 + ((progress - 0.56) / 0.30) * 0.42;
      return 0.92 + ((progress - 0.86) / 0.14) * 0.08;
    }

    function tick() {
      if (dead) return;
      rafId = requestAnimationFrame(tick);
      var dt = Math.min(0.05, clock.getDelta()), elapsed = clock.elapsedTime;
      var progress = Math.min(1, elapsed / (TOTAL / 1000));
      barFill.style.width = (progress * 100) + '%';

      var actIdx = 0;
      for (var ai = 0; ai < acts.length; ai++) { if (progress >= actTimings[ai]) actIdx = ai; }
      showAct(actIdx);

      var wakeAlpha = Math.max(0, 1 - progress / 0.05);
      wakeEl.style.opacity = wakeAlpha;

      // === 카메라 ===
      var camT = camTOf(progress);
      var camPos = camPath.getPointAt(Math.min(0.995, camT));
      if (progress >= 0.18 && progress < 0.52) { camPos.x += Math.sin(elapsed * 0.28) * 0.14; camPos.y += Math.cos(elapsed * 0.22) * 0.1; }
      var lookPos;
      if (progress < 0.20) {
        var foodT = 0.94 - (progress / 0.20) * 0.55;
        lookPos = gutCurve.getPointAt(Math.max(0.05, foodT));
      } else if (progress < 0.56) {
        lookPos = gutCurve.getPointAt(CH_T0 + 0.16);
        if (isBad) lookPos.x += 1.2;
      } else if (progress < 0.78) {
        lookPos = vesselCurve.getPointAt(Math.min(0.95, ((progress - 0.56) / 0.22) * 0.85 + 0.1));
      } else {
        lookPos = BRAIN_POS.clone();
      }
      if (impactBoost > 1.2) { camPos.x += (Math.random() - 0.5) * 0.35 * (impactBoost - 1); camPos.y += (Math.random() - 0.5) * 0.35 * (impactBoost - 1); }
      camera.position.copy(camPos);
      camera.lookAt(lookPos);
      camera.fov = 66 + Math.sin(progress * Math.PI) * 6 - (progress > 0.86 ? 5 : 0);
      camera.updateProjectionMatrix();

      // === 캐릭터 — 카메라 전방 고정거리 하단에 상시 노출 ===
      var toLook = new THREE.Vector3().subVectors(lookPos, camPos);
      var charDist = Math.max(1.6, Math.min(2.6, toLook.length() * 0.45));
      var charPos = camPos.clone().addScaledVector(toLook.normalize(), charDist);
      charPos.y -= 0.55;
      if (progress > 0.86) { charPos = camPos.clone().lerp(lookPos, 0.55); charPos.x -= 0.8; charPos.y += 0.1; }
      char.position.copy(charPos);
      char.position.y += Math.sin(elapsed * 3) * 0.1;
      char.lookAt(camera.position);
      char.rotation.z = Math.sin(elapsed * 1.8) * 0.1;
      headLight.position.copy(char.position).add(new THREE.Vector3(0, 0.4, 1.2));
      accentLight.position.copy(char.position).add(new THREE.Vector3(0, 1.2, -0.8));
      accentLight.intensity = 0.45 + Math.sin(elapsed * 2.2) * 0.2;
      var pulse = (1 + Math.sin(elapsed * 5) * 0.06) * impactBoost;
      char.scale.setScalar(pulse);
      impactBoost = Math.max(1, impactBoost - dt * 3);
      charGlow.position.copy(char.position);
      charGlow.material.opacity = 0.4;
      var blink = (elapsed % 3.2) < 0.12 ? 0.08 : 1;
      eyeL.scale.y = blink; eyeR.scale.y = blink;
      var faceKey = progress < 0.18 ? 'smile' : progress < 0.24 ? 'o'
        : progress < 0.52 ? (isBad ? 'grit' : 'smile')
        : progress < 0.86 ? (isBad ? 'o' : 'smile')
        : (isBad ? 'frown' : 'smile');
      setMouth(faceKey);
      diamond.rotation.y += dt * 2.2;
      diaGlow.material.opacity = 0.35 + Math.sin(elapsed * 4) * 0.22;
      crown.rotation.z = Math.sin(elapsed * 2.6) * 0.05;

      trailHist.unshift({ x: char.position.x, y: char.position.y, z: char.position.z });
      if (trailHist.length > TN) trailHist.pop();
      var tpa = trailGeo.attributes.position.array;
      for (var tri = 0; tri < TN; tri++) { var tp2 = trailHist[tri] || trailHist[trailHist.length - 1] || charPos; tpa[tri * 3] = tp2.x; tpa[tri * 3 + 1] = tp2.y; tpa[tri * 3 + 2] = tp2.z; }
      trailGeo.attributes.position.needsUpdate = true;

      // === Act1: 음식 칩 하강 ===
      if (progress < 0.22) {
        var chipT = 0.94 - Math.min(0.95, (progress / 0.20) * 0.62);
        var chipPos = gutCurve.getPointAt(Math.max(0.04, chipT));
        foodChip.position.copy(chipPos);
        foodChip.position.x += Math.sin(elapsed * 4) * 0.05;
        foodChip.material.opacity = progress < 0.02 ? progress / 0.02 : 1;
        chipGlow.position.copy(foodChip.position);
        chipGlow.material.opacity = foodChip.material.opacity * (0.4 + Math.sin(elapsed * 5) * 0.15);
        foodChip.visible = true;
      } else if (progress < 0.32) {
        if (isBad) {
          var crashP = gutCurve.getPointAt(CH_T0 + 0.16);
          crashP.x += 1.0;
          var k = (progress - 0.2) / 0.1;
          foodChip.position.lerpVectors(gutCurve.getPointAt(CH_T0 + 0.1), crashP, Math.min(1, k));
          foodChip.material.opacity = 1 - Math.max(0, k - 0.7) * 3;
        } else {
          foodChip.position.copy(gutCurve.getPointAt(CH_T0 + 0.12));
          foodChip.material.opacity = Math.max(0, 1 - (progress - 0.2) * 6);
        }
        chipGlow.position.copy(foodChip.position);
        chipGlow.material.opacity = foodChip.material.opacity * 0.45;
      } else { foodChip.visible = false; chipGlow.material.opacity = 0; }

      // === Act2: 융모 단계별 파괴/흡수 + HUD 1:1 ===
      if (isBad) {
        for (var sti = 0; sti < 3; sti++) {
          if (!stageHit[sti] && progress >= STAGES[sti].at) {
            stageHit[sti] = true;
            setVilliTargets(sti + 1);
            burst.material.opacity = 1;
            burst.position.copy(foodChip.visible ? foodChip.position : gutCurve.getPointAt(CH_T0 + 0.16));
            if (GS.fx2) GS.fx2.screenFlash('rgba(255,92,122,.3)');
            impactBoost = 1.6; shake = 0.6;
            hud.perm.tgt = STAGES[sti].perm;
            hud.scfa.tgt = Math.max(8, m.scfa - 12 * (sti + 1));
            hud.inf.tgt = Math.min(96, m.inflammation + 14 * (sti + 1));
            stageEl.style.display = 'block';
            stageEl.textContent = STAGES[sti].name + ' — 투과성 ' + STAGES[sti].perm + '%';
          }
        }
      } else {
        if (!hudTargetsSet && progress >= 0.2) {
          hudTargetsSet = true;
          hud.scfa.tgt = Math.min(96, m.scfa + 24);
          hud.perm.tgt = Math.max(6, m.permeability - 22);
          hud.inf.tgt = Math.max(4, m.inflammation - 20);
        }
      }
      for (var vd2 = 0; vd2 < VILLI_N; vd2++) {
        var V = villiData[vd2];
        V.cur += (V.tgt - V.cur) * Math.min(1, dt * 2.2);
        V.curTilt += (V.tgtTilt - V.curTilt) * Math.min(1, dt * 2.2);
        var sway = Math.sin(elapsed * 2 + V.phase) * (V.tgt > 0.8 ? 0.16 : 0.05);
        dummy.position.copy(V.pos).addScaledVector(V.dir, (1 - V.cur) * 0.12);
        dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), V.dir);
        dummy.rotateOnAxis(V.tiltAxis, V.curTilt);
        dummy.rotateOnAxis(new THREE.Vector3(0, 1, 0), sway);
        dummy.scale.set(V.scl, V.scl * V.cur, V.scl);
        dummy.updateMatrix();
        villi.setMatrixAt(vd2, dummy.matrix);
      }
      villi.instanceMatrix.needsUpdate = true;

      if (burst.material.opacity > 0) {
        var bpa = bgeo.attributes.position.array;
        for (var b2 = 0; b2 < burstN; b2++) { bpa[b2 * 3] += bv[b2][0] * dt; bpa[b2 * 3 + 1] += bv[b2][1] * dt - dt * 1.4; bpa[b2 * 3 + 2] += bv[b2][2] * dt; bv[b2][0] *= 0.95; bv[b2][1] *= 0.95; bv[b2][2] *= 0.95; }
        bgeo.attributes.position.needsUpdate = true;
        burst.material.opacity = Math.max(0, burst.material.opacity - dt * 0.6);
      }

      if (!isBad && progress > 0.2 && progress < 0.6) {
        sparkle.material.opacity = 0.75;
        var spa = spkGeo.attributes.position.array;
        for (var sp = 0; sp < SPK_N; sp++) {
          var S = spkSeed[sp];
          var sf = gutFrame(S.t);
          var sr = gutRadius(S.t) * 0.9;
          var rise = ((elapsed * 0.35 + S.ph) % 1);
          spa[sp * 3] = sf.p.x + (Math.cos(S.a) * sf.bi.x + Math.sin(S.a) * sf.n.x) * sr * (1 - rise * 0.75);
          spa[sp * 3 + 1] = sf.p.y + (Math.cos(S.a) * sf.bi.y + Math.sin(S.a) * sf.n.y) * sr * (1 - rise * 0.75) + rise * 0.5;
          spa[sp * 3 + 2] = sf.p.z + (Math.cos(S.a) * sf.bi.z + Math.sin(S.a) * sf.n.z) * sr * (1 - rise * 0.75);
        }
        spkGeo.attributes.position.needsUpdate = true;
      } else sparkle.material.opacity = Math.max(0, sparkle.material.opacity - dt * 2);

      // === Act3: 혈류 + 뇌 ===
      var bloodOn = progress > 0.56;
      if (bloodOn) {
        for (var rb = 0; rb < RBC_N; rb++) {
          var RT = rbcT[rb];
          RT.t = (RT.t + dt * RT.sp) % 1;
          var rp = vesselCurve.getPointAt(RT.t);
          dummy.position.copy(rp);
          dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vesselCurve.getTangentAt(RT.t));
          dummy.rotateOnAxis(new THREE.Vector3(1, 0, 0), RT.roll + elapsed * 3);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          rbc.setMatrixAt(rb, dummy.matrix);
        }
        rbc.instanceMatrix.needsUpdate = true;
        for (var cg = 0; cg < CARGO_N; cg++) {
          var CT = cargoT[cg];
          CT.t = (CT.t + dt * CT.sp * (isBad ? 1.15 : 0.9)) % 1;
          var cp2 = vesselCurve.getPointAt(CT.t);
          var off = 0.16 + Math.sin(elapsed * 2 + CT.ph) * 0.1;
          dummy.position.set(cp2.x + Math.cos(CT.ph) * off, cp2.y, cp2.z + Math.sin(CT.ph) * off);
          if (isBad) { dummy.rotation.set(elapsed * 4 + CT.ph, CT.ph, elapsed * 3); }
          else { dummy.rotation.set(0, 0, 0); }
          dummy.scale.setScalar(1 + Math.sin(elapsed * 5 + CT.ph) * 0.2);
          dummy.updateMatrix();
          cargo.setMatrixAt(cg, dummy.matrix);
        }
        cargo.instanceMatrix.needsUpdate = true;
      }

      if (progress > 0.62) {
        if (progress < 0.78) {
          hud.scfa.tgt = isBad ? Math.max(6, m.scfa - 26) : Math.min(96, m.scfa + 30);
          hud.inf.tgt = isBad ? Math.min(95, m.inflammation + 30) : Math.max(4, m.inflammation - 26);
          hud.perm.tgt = isBad ? Math.min(97, m.permeability + 32) : Math.max(5, m.permeability - 28);
        }
        var brainIn = Math.min(1, (progress - 0.62) / 0.16);
        brainCore.material.opacity = brainIn * 0.88;
        brainShell.material.opacity = brainIn * 0.7;
        csf.material.opacity = brainIn * 0.16;
        brainGlow.material.opacity = brainIn * 0.5;
        brainShell.rotation.y += dt * 0.45;
        brainShell.rotation.x = Math.sin(elapsed * 0.6) * 0.15;
        brainGrp.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.05);
        csf.scale.setScalar(1 + Math.sin(elapsed * 1.6) * 0.04);
        dopas.forEach(function (orb2, oi2) {
          var ud = orb2.userData;
          ud.a += dt * ud.sp;
          orb2.material.opacity = brainIn * 0.9;
          if (!isBad) {
            var rise2 = ((elapsed * 0.5 + ud.ph) % 2.4);
            orb2.position.set(Math.cos(ud.a) * ud.r, rise2 - 0.8, Math.sin(ud.a) * ud.r);
            orb2.material.opacity = brainIn * Math.max(0, 0.95 - rise2 * 0.3);
          } else {
            var fall2 = ((elapsed * 0.4 + ud.ph) % 2.0);
            orb2.position.set(Math.cos(ud.a) * ud.r * (1 - fall2 * 0.3), -fall2 * 0.8 + 0.4, Math.sin(ud.a) * ud.r * (1 - fall2 * 0.3));
            orb2.material.opacity = brainIn * Math.max(0, 0.5 - fall2 * 0.22);
          }
          orb2.scale.setScalar(1 + Math.sin(elapsed * 5 + oi2) * 0.18);
        });
      }

      // HUD 갱신
      Object.keys(hud).forEach(function (k) {
        var H = hud[k];
        H.cur += (H.tgt - H.cur) * Math.min(1, dt * 1.6);
        H.bar.style.width = Math.max(2, Math.min(100, H.cur)) + '%';
        H.val.textContent = Math.round(H.cur);
      });

      // 톤 그라디언트 (4막)
      var fogKf = isBad ? [
        { t: 0, c: 0x010208 }, { t: 0.18, c: 0x2a060e }, { t: 0.52, c: 0x380418 },
        { t: 0.62, c: 0x26060e }, { t: 0.78, c: 0x1a0416 }, { t: 0.9, c: 0x0c0516 }, { t: 1, c: 0x06030f }
      ] : [
        { t: 0, c: 0x010208 }, { t: 0.18, c: 0x06221c }, { t: 0.52, c: 0x062a20 },
        { t: 0.62, c: 0x081a14 }, { t: 0.78, c: 0x0a1020 }, { t: 0.9, c: 0x0c0824 }, { t: 1, c: 0x06030f }
      ];
      var fc3 = new THREE.Color(fogKf[0].c);
      for (var ki = 0; ki < fogKf.length - 1; ki++) {
        if (progress >= fogKf[ki].t && progress <= fogKf[ki + 1].t) {
          var span = fogKf[ki + 1].t - fogKf[ki].t, f2 = span > 0 ? (progress - fogKf[ki].t) / span : 0;
          fc3 = new THREE.Color(fogKf[ki].c).lerp(new THREE.Color(fogKf[ki + 1].c), f2);
          break;
        }
      }
      scene.fog.color.copy(fc3);
      renderer.setClearColor(fc3, 1);
      mucTex.offset.y = (mucTex.offset.y + dt * 0.04) % 1;
      flash = Math.max(0, flash - 0.045);
      shake = Math.max(0, shake - 0.03);
      if (progress > 0.86 && stageEl.style.display === 'block' && !isBad) stageEl.style.display = 'none';
      renderer.render(scene, camera);
      if (progress >= 1) finish();
    }

    setTimeout(function () { showAct(0); }, 200);
    clock.start(); tick();

    function onResize() { var nw = host.clientWidth || 400, nh = host.clientHeight || 800; renderer.setSize(nw, nh); camera.aspect = nw / nh; camera.updateProjectionMatrix(); }
    window.addEventListener('resize', onResize);

    function finish() {
      if (dead) return; dead = true; if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      var finEl = overlay.querySelector('#simFin');
      var m2 = GS.store.coreMetrics();
      var drjang = GS.drjang.render(isBad ? 'warn' : 'celebrate',
        isBad ? food.label + '이 융모를 3단계까지 파괴했지만 — 융모는 3~5일이면 다시 자라요. 다음 끼니로 되돌릴 수 있어요! 발효식품 미션만 챙기면 투과성 ' + m2.permeability + '부터 곧 내려가요.'
              : '훌륭해요! ' + food.label + '이 융모를 살리고 SCFA ' + m2.scfa + '로 장-뇌 회로가 밝아졌어요. 오늘의 미션으로 이 리듬을 이어가요!', { size: 76 });
      var bars = ui.mbarRow('SCFA', m2.scfa, 'scfa', { mb: 4 }) + ui.mbarRow('투과성', m2.permeability, 'perm', { mb: 4 }) + ui.mbarRow('염증', m2.inflammation, 'inf', { mb: 4 }) + ui.mbarRow('도파민', m2.dopamine, 'dopa', { ceiling: m2.ceiling, mb: 0 });
      finEl.innerHTML = '<div style="width:100%;max-width:360px;padding:20px;text-align:center"><div style="font-size:28px;margin-bottom:8px">' + (isBad ? '⚠️' : '✨') + '</div><div style="font-size:18px;color:' + fcHex + ';font-weight:700;margin-bottom:12px">' + (isBad ? '장 누수 — 그래도 회복 가능' : '장벽 강화 완료') + '</div><div style="padding:14px;background:rgba(14,30,60,.6);border-radius:16px;margin-bottom:14px;text-align:left">' + bars + '</div><div style="margin-bottom:16px">' + drjang + '</div>' +
        '<div onclick="GS.sim._finish()" style="padding:14px;border-radius:14px;background:linear-gradient(135deg,var(--cyan),var(--cyan2));color:#04101F;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(55,199,255,.3);margin-bottom:8px">장 맵에서 확인 →</div>' +
        '<div onclick="GS.sim._finish(true);GS.nav.go(\'quest\')" style="padding:12px;border-radius:14px;background:rgba(39,216,155,.12);border:1px solid rgba(39,216,155,.4);color:#7CEFC8;font-size:13px;font-weight:700;cursor:pointer">🎯 오늘의 미션으로 되돌리기 →</div></div>';
      finEl.classList.add('on');
    }

    GS.sim._finish = function (skipOnDone) {
      if (dead && !running) return; dead = true; running = false;
      if (rafId) cancelAnimationFrame(rafId);
      scene.traverse(function (o) { if (o.geometry) try { o.geometry.dispose(); } catch (e) {} if (o.material) try { o.material.dispose(); } catch (e) {} });
      try { renderer.dispose(); } catch (e) {} gt.dispose();
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      window.removeEventListener('resize', onResize);
      if (!skipOnDone) opts.onDone && opts.onDone();
    };
  }

  function runQuick(food, opts) {
    opts = opts || {};
    if (running) { opts.onDone && opts.onDone(); return; }
    running = true;
    injectStyles();
    var isBad = !!(food && food.bad);
    var fcHex = isBad ? '#FF5C7A' : '#27D89B';
    var m = GS.store.coreMetrics();
    var ms = (window.GS_DATA && window.GS_DATA.SCENE_FATIGUE && window.GS_DATA.SCENE_FATIGUE.abbreviatedMs) || 1800;
    var ov = document.createElement('div');
    ov.id = 'gsSim';
    ov.innerHTML =
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(2,6,15,.9);backdrop-filter:blur(10px);text-align:center;padding:28px;animation:gs-qFade .3s ease both">' +
        '<div style="display:flex;align-items:center;gap:10px;font-size:15px;color:#fff;font-weight:800">' +
          '<span style="font-size:30px">' + (isBad ? '⚠️' : '✨') + '</span>' +
          '<span>' + food.label + (isBad ? ' → 융모 손상' : ' → 융모 강화') + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
          '<div style="padding:8px 14px;border-radius:11px;background:rgba(255,92,122,.1);border:1px solid rgba(255,92,122,.35);font-size:11px;color:#FF9DB0">SCFA ' + (isBad ? '−' : '+') + ' · 투과성 ' + (isBad ? '↑' : '↓') + '</div>' +
          '<div style="padding:8px 14px;border-radius:11px;background:rgba(55,199,255,.1);border:1px solid rgba(55,199,255,.3);font-size:11px;color:#8fd8ff">도파민 ' + m.dopamine + '</div>' +
        '</div>' +
        '<div style="font-size:11.5px;color:rgba(234,243,255,.85);max-width:300px;line-height:1.6">' +
          (isBad ? '장벽에 금이 갔지만 다음 끼니로 되돌릴 수 있어요.' : '부티레이트가 장-뇌 회로를 밝히는 중이에요.') +
        '</div>' +
      '</div>' +
      '<style>@keyframes gs-qFade{from{opacity:0}to{opacity:1}}</style>';
    document.querySelector('.app').appendChild(ov);
    setTimeout(function () {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      running = false;
      opts.onDone && opts.onDone();
    }, ms);
  }

  GS.sim = { run: run, runQuick: runQuick, isRunning: function () { return running; } };
})();
