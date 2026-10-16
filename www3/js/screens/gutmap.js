/* GutSense www3 — GUT MAP. Metrics hub with 3D gut tube (compact, organic
 * colors, Korean labels), clickable causal chain (Dr.장 explains each step),
 * clickable system status, zone detail with PIE CHART.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var ui = window.GS.ui, D = window.GS_DATA;
  var active = null;

  function sc(s) { return s > 70 ? '#27D89B' : s > 55 ? '#7ADCFF' : s > 40 ? '#FFC44D' : s > 25 ? '#FF8A4D' : '#FF5C7A'; }
  function healthHex(s) { return s >= 45 ? 0x27d89b : 0x9e0d1e; }
  function dangerUnits() {
    var COLON = { ascending: 1, transverse: 1, descending: 1, sigmoid: 1 };
    var zones = GS.store.zoneStates();
    var n = 0, sum = 0, cnt = 0;
    zones.forEach(function (z) {
      if (COLON[z.id]) { sum += z.score; cnt++; }
      else if (z.score < 45) n++;
    });
    if (cnt && Math.round(sum / cnt) < 45) n++;
    return n;
  }
  function zemoji(id) { return ({ duodenum: '🌀', jejunum: '🌿', ileum: '🛡️', cecum: '⚗️', ascending: '🔥', transverse: '💧', descending: '🧱', sigmoid: '⚠️', rectum: '🚪' })[id] || '🧬'; }

  function radialTex() { var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'); var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.4, 'rgba(255,255,255,.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }

  if (window.THREE && GS.engine) {
    GS.engine.register('gutmap', function (stage) {
      var host = document.getElementById('gut3d'); if (!host) return;
      stage.attach(host);
      var labHost = host.querySelector('#gutLabels');
      stage.camera.fov = 32;
      stage.camera.position.set(0, 0, 20);
      stage.camera.lookAt(0, 0, 0);
      stage.camera.updateProjectionMatrix();
      stage.scene.fog = new THREE.Fog(0x060e1c, 14, 44);
      setTimeout(function () {
        if (!host || !host.parentNode) return;
        var w = host.clientWidth || 380, h = host.clientHeight || 280;
        stage.renderer.setSize(w, h, true);
        stage.camera.aspect = w / h;
        stage.camera.updateProjectionMatrix();
      }, 80);
      var gutScore = GS.store.gutScore();
      var healthCol = gutScore >= 60 ? 0x27d89b : gutScore >= 40 ? 0xffc44d : 0xff5c7a;
      var healthCol2 = gutScore >= 60 ? 0x37c7ff : gutScore >= 40 ? 0xff8a4d : 0xff80b0;
      var organBase = gutScore >= 60 ? 0x2a7ab8 : gutScore >= 40 ? 0x3a2810 : 0x3a1020;
      var zones = GS.store.zoneStates();
      var COLON_IDS = { ascending: 1, transverse: 1, descending: 1, sigmoid: 1 };
      var pts = { duodenum: [-3.7, 2.6, .4], jejunum: [-1.8, 3.1, -.4], ileum: [-.3, 1.7, .4], cecum: [1.3, .8, -.3], ascending: [2.8, 1.9, .2], transverse: [3.7, .2, -.3], descending: [2.9, -1.5, .2], sigmoid: [3.8, -2.7, -.2], rectum: [1.9, -3.1, .2] };
      var order = ['duodenum','jejunum','ileum','cecum','ascending','transverse','descending','sigmoid','rectum'];
      var curve = new THREE.CatmullRomCurve3(order.map(function (id) { return new THREE.Vector3().fromArray(pts[id]); }), false, 'catmullrom', 0.5);
      var group = new THREE.Group(); group.scale.setScalar(1.02); stage.add(group);
      group.add(new THREE.AmbientLight(0x90aacc, 0.75));
      var lamp = new THREE.PointLight(0xffffff, 1.1, 40); lamp.position.set(4, 6, 10); group.add(lamp);
      // 단일 연속 튜브 + 정점 색상 — 결장 구간(상행~구불)만 노란 계열로 착색, 관은 하나로 이어짐
      var US = 800, usamp = [];
      for (var si2 = 0; si2 <= US; si2++) usamp.push({ u: si2 / US, p: curve.getPointAt(si2 / US) });
      function uOf(id) { var v3 = new THREE.Vector3().fromArray(pts[id]), bu = 0, bd = 1e9; for (var q2 = 0; q2 <= US; q2++) { var d2 = usamp[q2].p.distanceToSquared(v3); if (d2 < bd) { bd = d2; bu = usamp[q2].u; } } return bu; }
      var yStart = uOf('cecum') + (uOf('ascending') - uOf('cecum')) * 0.55;
      var yEnd = uOf('sigmoid') + (uOf('rectum') - uOf('sigmoid')) * 0.55;
      function paintTube(geo) {
        var n = geo.attributes.position.count, col = new Float32Array(n * 3), uvA = geo.attributes.uv;
        var cb = new THREE.Color(organBase), cy = new THREE.Color(0xFFC44D), tmp2 = new THREE.Color();
        for (var i2 = 0; i2 < n; i2++) {
          var u = uvA.getX(i2);
          var tt = Math.max(0, Math.min(1, Math.min((u - yStart) / 0.045, (yEnd - u) / 0.045)));
          tmp2.copy(cb).lerp(cy, tt);
          col[i2 * 3] = tmp2.r; col[i2 * 3 + 1] = tmp2.g; col[i2 * 3 + 2] = tmp2.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        return geo;
      }
      var tubeGeo = paintTube(new THREE.TubeGeometry(curve, 160, 0.95, 16, false));
      group.add(new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false })));
      group.add(new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: true, transparent: true, opacity: 0.16 })));
      group.add(new THREE.Mesh(paintTube(new THREE.TubeGeometry(curve, 80, 1.5, 12, false)), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide })));
      var rt = radialTex();
      var pal = gutScore >= 60 ? [[.42, .83, 1], [.3, .8, 1], [.48, .55, 1]] : gutScore >= 40 ? [[1, .77, .3], [.54, .87, 1], [1, .5, .75]] : [[1, .36, .48], [1, .54, .3], [.8, .2, .3]];
      var FN = 140, fp = new Float32Array(FN * 3), fc = new Float32Array(FN * 3), ft2 = [];
      for (var i = 0; i < FN; i++) { var v0 = curve.getPointAt(i / FN); fp[i * 3] = v0.x; fp[i * 3 + 1] = v0.y; fp[i * 3 + 2] = v0.z; var cc = pal[i % pal.length]; fc[i * 3] = cc[0]; fc[i * 3 + 1] = cc[1]; fc[i * 3 + 2] = cc[2]; ft2.push(i / FN); }
      var fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fgeo.setAttribute('color', new THREE.BufferAttribute(fc, 3));
      var flow = new THREE.Points(fgeo, new THREE.PointsMaterial({ size: 0.28, map: rt, vertexColors: true, transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending }));
      group.add(flow);
      var pick = [], leaks = [], hoverables = [], callouts = [];
      // 바깥 방사형 콜아웃 앵커 — 부위를 원주 가장자리로 밀어 라벨이 3D에 가려지지 않게
      var CALL_OUT = { duodenum: [-5.6, 3.8, .9], jejunum: [-3.4, 4.5, -.4], ileum: [-4.9, 1.6, .6], cecum: [-5.2, -1.2, -.3], rectum: [5.6, -5.0, .4] };
      function dashedCallout(from, to, colHex) {
        var segs = 14, ptsArr = [];
        for (var i = 0; i <= segs; i++) ptsArr.push(new THREE.Vector3().lerpVectors(from, to, i / segs));
        var g = new THREE.BufferGeometry().setFromPoints(ptsArr);
        return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: colHex, transparent: true, opacity: 0.55 }));
      }
      order.forEach(function (id, zi) {
        var z = zones.filter(function (x) { return x.id === id; })[0]; if (!z) return;
        var isColon = !!COLON_IDS[id];
        if (isColon) return;                      // 결장 4구간은 개별 구체 없음 — 중심 1개로 대체
        var pos = new THREE.Vector3().fromArray(pts[id]);
        var blend = new THREE.Color(healthHex(z.score));
        var blendCss = '#' + blend.getHexString();
        var isActive = active === id; var r = isActive ? 0.62 : 0.5;
        var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: rt, color: blend, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.set(r * 3.5, r * 3.5, 1); halo.position.copy(pos); group.add(halo);
        var sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 26), new THREE.MeshPhongMaterial({ color: blend, emissive: 0xffffff, emissiveIntensity: 0.04, shininess: 120, specular: 0xbfe0ff, transparent: true, opacity: .95 }));
        sphere.position.copy(pos); sphere.userData = { zoneId: id, colon: false, baseR: r }; group.add(sphere); pick.push(sphere); hoverables.push({ sphere: sphere, halo: halo, hovered: false, scl: 1 });
        var shell = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 1.42, 1), new THREE.MeshBasicMaterial({ color: blend, wireframe: true, transparent: true, opacity: 0.2 }));
        shell.position.copy(pos); group.add(shell);
        var nodeRing = new THREE.Mesh(new THREE.TorusGeometry(r * 1.7, 0.014, 6, 44), new THREE.MeshBasicMaterial({ color: blend, transparent: true, opacity: 0.55 }));
        nodeRing.rotation.x = Math.PI / 2.3; nodeRing.position.copy(pos); group.add(nodeRing);
        var anchor = new THREE.Vector3().fromArray(CALL_OUT[id]);
        var el = null;
        if (labHost) {
          el = document.createElement('div');
          el.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-50%);display:flex;align-items:center;gap:6px;padding:5px 10px 5px 7px;border-radius:11px;background:rgba(5,14,32,.82);backdrop-filter:blur(6px);border:1px solid ' + blendCss + '77;box-shadow:0 4px 14px rgba(0,0,0,.5),0 0 10px ' + blendCss + '2e;white-space:nowrap;will-change:transform';
          el.innerHTML = '<span style="font-size:12px">' + zemoji(id) + '</span>' +
            '<span style="font-size:11.5px;font-weight:800;color:#F2F8FF;text-shadow:0 1px 2px rgba(0,0,0,.8)">' + z.name + '</span>' +
            '<span style="font-size:9px;font-weight:800;font-family:Orbitron,monospace;color:' + blendCss + ';background:' + blendCss + '1c;border:1px solid ' + blendCss + '44;padding:1px 6px;border-radius:999px">' + z.score + '</span>';
          labHost.appendChild(el);
        }
        group.add(dashedCallout(pos.clone(), anchor, blend.getHex()));
        callouts.push({ zoneId: id, el: el, anchor: anchor, isColon: false, col: blendCss });
        var perm = z.indices.permeability;
        if (perm >= 40) {
          var n = perm >= 75 ? 20 : perm >= 60 ? 12 : 7, lp = new Float32Array(n * 3), lv = [];
          for (var k = 0; k < n; k++) { lp[k * 3] = pos.x; lp[k * 3 + 1] = pos.y; lp[k * 3 + 2] = pos.z; var a = Math.random() * Math.PI * 2, ee = (Math.random() - .5) * Math.PI, sp = .5 + Math.random() * 1.0; lv.push([Math.cos(a) * Math.cos(ee) * sp, Math.sin(ee) * sp, Math.sin(a) * Math.cos(ee) * sp]); }
          var lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
          group.add(new THREE.Points(lgeo, new THREE.PointsMaterial({ size: 0.2, map: rt, color: new THREE.Color(0xff5c7a), transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending })));
          leaks.push({ geo: lgeo, pos: pos, vel: lv, n: n });
        }
      });
      // 결장 중심 구체 1개 — 4구간 평균 HP 기반 건강색, 4구간 대표 (클릭 시 결장 통합 팝업)
      var colonCentroid = new THREE.Vector3((pts.ascending[0] + pts.transverse[0] + pts.descending[0] + pts.sigmoid[0]) / 4, (pts.ascending[1] + pts.transverse[1] + pts.descending[1] + pts.sigmoid[1]) / 4, 0.2);
      var cScore = Math.round(zones.filter(function (x) { return COLON_IDS[x.id]; }).reduce(function (s, x) { return s + x.score; }, 0) / 4);
      var colonBlend = new THREE.Color(healthHex(cScore));
      var colonCss = '#' + colonBlend.getHexString();
      var cHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: rt, color: colonBlend, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending })); cHalo.scale.set(0.62 * 3.5, 0.62 * 3.5, 1); cHalo.position.copy(colonCentroid); group.add(cHalo);
      var cSphere = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 26), new THREE.MeshPhongMaterial({ color: colonBlend, emissive: 0xffffff, emissiveIntensity: 0.05, shininess: 120, specular: 0xbfe0ff, transparent: true, opacity: .95 }));
      cSphere.position.copy(colonCentroid); cSphere.userData = { zoneId: 'colon', colon: true, baseR: 0.62 }; group.add(cSphere); pick.push(cSphere); hoverables.push({ sphere: cSphere, halo: cHalo, hovered: false, scl: 1 });
      var cShell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62 * 1.42, 1), new THREE.MeshBasicMaterial({ color: colonBlend, wireframe: true, transparent: true, opacity: 0.2 }));
      cShell.position.copy(colonCentroid); group.add(cShell);
      var cRing = new THREE.Mesh(new THREE.TorusGeometry(0.62 * 1.7, 0.016, 6, 44), new THREE.MeshBasicMaterial({ color: colonBlend, transparent: true, opacity: 0.6 }));
      cRing.rotation.x = Math.PI / 2.3; cRing.position.copy(colonCentroid); group.add(cRing);
      var colonAnchor = new THREE.Vector3(6.6, -1.1, -0.3);
      var cEl = null;
      if (labHost) {
        cEl = document.createElement('div');
        cEl.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-50%);display:flex;align-items:center;gap:6px;padding:6px 11px 6px 8px;border-radius:12px;background:rgba(5,14,32,.85);backdrop-filter:blur(6px);border:1px solid ' + colonCss + '77;box-shadow:0 4px 14px rgba(0,0,0,.5),0 0 10px ' + colonCss + '2e;white-space:nowrap;will-change:transform';
        cEl.innerHTML = '<span style="font-size:12px">🧬</span>' +
          '<span style="display:flex;flex-direction:column;gap:1px"><span style="font-size:12px;font-weight:800;color:#F2F8FF;text-shadow:0 1px 2px rgba(0,0,0,.8)">결장 <span style="font-size:9px;color:#8fb6d8;font-weight:700">상행·횡행·하행·구불 통합</span></span></span>' +
          '<span style="font-size:9px;font-weight:800;font-family:Orbitron,monospace;color:' + colonCss + ';background:' + colonCss + '1c;border:1px solid ' + colonCss + '44;padding:1px 6px;border-radius:999px">' + cScore + '</span>';
        labHost.appendChild(cEl);
      }
      group.add(dashedCallout(colonCentroid, colonAnchor, colonBlend.getHex()));
      callouts.push({ zoneId: 'colon', el: cEl, anchor: colonAnchor, isColon: true, col: colonCss });
      var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), dom = stage.renderer.domElement;
      var drag = { active: false, moved: false, x: 0, y: 0, rx: 0, ry: 0 };
      var hoverKey = null;
      function ptr(e) { var rect = dom.getBoundingClientRect(); return { x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left, y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top, w: rect.width, h: rect.height }; }
      function down(e) { var p = ptr(e); drag.active = true; drag.moved = false; drag.x = p.x; drag.y = p.y; }
      function move(e) { if (drag.active) { var p = ptr(e); var dx = p.x - drag.x, dy = p.y - drag.y; drag.x = p.x; drag.y = p.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true; drag.ry += dx * 0.01; drag.rx = Math.max(-0.6, Math.min(0.6, drag.rx + dy * 0.01)); group.rotation.y = drag.ry; group.rotation.x = drag.rx; } else if (e.pointerType === 'mouse') { var p2 = ptr(e); ndc.x = (p2.x / p2.w) * 2 - 1; ndc.y = -(p2.y / p2.h) * 2 + 1; ray.setFromCamera(ndc, stage.camera); var hv = ray.intersectObjects(pick, false); hoverKey = hv.length ? hv[0].object.userData.zoneId : null; dom.style.cursor = hoverKey ? 'pointer' : 'grab'; } }
      function up(e) { if (!drag.active) return; drag.active = false; if (!drag.moved) { var p = ptr(e || lastEvent); ndc.x = (p.x / p.w) * 2 - 1; ndc.y = -(p.y / p.h) * 2 + 1; ray.setFromCamera(ndc, stage.camera); var hits = ray.intersectObjects(pick, false); if (hits.length) { var ud = hits[0].object.userData; if (ud.colon) GS.screens.gutmap.colonDetail(); else GS.screens.gutmap.detail(ud.zoneId); } } }
      var lastEvent = null;
      dom.addEventListener('pointerdown', function (e) { lastEvent = e; down(e); });
      dom.addEventListener('pointermove', function (e) { lastEvent = e; move(e); });
      dom.addEventListener('pointerup', function (e) { lastEvent = e; up(e); });
      dom.addEventListener('pointerleave', function () { hoverKey = null; });
      var auto = 0;
      var polar;
      try { polar = new THREE.PolarGridHelper(7.6, 12, 6, 64, 0x2a6ea8, 0x14375c); polar.position.y = -4.4; polar.material.transparent = true; polar.material.opacity = 0.3; group.add(polar); } catch (e) {}
      var scanRing = new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.02, 6, 72), new THREE.MeshBasicMaterial({ color: 0x37c7ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
      scanRing.rotation.x = -Math.PI / 2; scanRing.position.y = -4.38; group.add(scanRing);
      var scanAng = 0;
      stage.onUpdate(function (dt, t) {
        var pa = fgeo.attributes.position.array;
        for (var j = 0; j < FN; j++) { ft2[j] = (ft2[j] + dt * 0.05) % 1; var vv = curve.getPointAt(ft2[j]); pa[j * 3] = vv.x; pa[j * 3 + 1] = vv.y; pa[j * 3 + 2] = vv.z; }
        fgeo.attributes.position.needsUpdate = true;
        for (var m2 = 0; m2 < leaks.length; m2++) { var L = leaks[m2], lpa = L.geo.attributes.position.array; for (var q = 0; q < L.n; q++) { lpa[q * 3] += L.vel[q][0] * dt; lpa[q * 3 + 1] += L.vel[q][1] * dt; lpa[q * 3 + 2] += L.vel[q][2] * dt; var dx = lpa[q * 3] - L.pos.x, dy = lpa[q * 3 + 1] - L.pos.y, dz = lpa[q * 3 + 2] - L.pos.z; if (dx * dx + dy * dy + dz * dz > 8) { lpa[q * 3] = L.pos.x; lpa[q * 3 + 1] = L.pos.y; lpa[q * 3 + 2] = L.pos.z; } } L.geo.attributes.position.needsUpdate = true; }
        for (var h2 = 0; h2 < hoverables.length; h2++) {
          var hv2 = hoverables[h2], on = hv2.sphere.userData.zoneId === hoverKey;
          var tgtScl = on ? 1.3 : 1;
          hv2.scl += (tgtScl - hv2.scl) * Math.min(1, dt * 10);
          hv2.sphere.scale.setScalar(hv2.scl);
          var tgtEm = on ? 0.9 : 0.04 + 0.03 * Math.sin(t * 2 + h2 * 1.3);
          hv2.sphere.material.emissiveIntensity += (tgtEm - hv2.sphere.material.emissiveIntensity) * Math.min(1, dt * 10);
          var tgtHalo = on ? 1.0 : hv2.sphere.userData.colon ? 0.5 : 0.55;
          hv2.halo.material.opacity += (tgtHalo - hv2.halo.material.opacity) * Math.min(1, dt * 10);
          if (on) hv2.halo.scale.setScalar(hv2.sphere.userData.baseR * 3.5 * hv2.scl * 1.15);
          else hv2.halo.scale.setScalar(hv2.sphere.userData.baseR * 3.5);
        }
        for (var c3 = 0; c3 < callouts.length; c3++) {
          var co = callouts[c3];
          var hot = co.zoneId === hoverKey;
          if (co.pop == null) co.pop = 0;
          if (hot && !co.wasHot) co.pop = 1;
          co.wasHot = hot;
          if (co.pop > 0) co.pop = Math.max(0, co.pop - dt * 2.6);
          if (co.el && co.anchor) {
            var vv3 = co.anchor.clone().applyMatrix4(group.matrixWorld).project(stage.camera);
            var hw2 = host.clientWidth || 1, hh2 = host.clientHeight || 1;
            var lx = (vv3.x * 0.5 + 0.5) * hw2, ly = (-vv3.y * 0.5 + 0.5) * hh2;
            var lv = vv3.z < 1 && lx > -90 && lx < hw2 + 90 && ly > -40 && ly < hh2 + 40;
            co.el.style.display = lv ? 'flex' : 'none';
            if (lv) {
              var lmult = 1 + co.pop * 0.22 + (hot ? 0.1 : 0);
              co.el.style.transform = 'translate(-50%,-50%) translate3d(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0) scale(' + lmult.toFixed(3) + ')';
              co.el.style.borderColor = hot ? co.col : co.col + '77';
              co.el.style.boxShadow = hot ? '0 6px 20px rgba(0,0,0,.55),0 0 18px ' + co.col + '66' : '0 4px 14px rgba(0,0,0,.5),0 0 10px ' + co.col + '2e';
            }
          }
        }
        group.children.forEach(function (o) {
          if (o.geometry && o.geometry.type === 'IcosahedronGeometry') { o.rotation.y += dt * 0.5; o.rotation.x += dt * 0.2; }
          if (o.geometry && o.geometry.type === 'TorusGeometry' && o.rotation.x > 1 && o.rotation.x < 1.6) o.rotation.z += dt * 0.7;
        });
        if (scanRing) { scanAng += dt * 0.9; scanRing.rotation.z = scanAng; var sp2 = (t * 0.35) % 1; scanRing.scale.setScalar(0.4 + sp2 * 1.6); scanRing.material.opacity = 0.4 * (1 - sp2); }
        if (!drag.active) { auto += dt; group.rotation.y = drag.ry + auto * 0.1; group.rotation.x = drag.rx + Math.sin(t * 0.1) * 0.03; }
      });
    });
  }

  function causalChainInteractive(m) {
    var steps = [
      { i: '🦠', t: '유해균↑', desc: '가공식품·감미료가 유익균을 줄여요', detail: 'Akkermansia(장벽 지킴이)와 F.prausnitzii(부티레이트 명장)가 사라져요. 이 균들은 장벽 점액층을 다듬고 항염 물질을 만들어요.', pose: 'warn', c: ui.T.red },
      { i: '📉', t: 'SCFA↓', desc: '부티레이트가 부족해져요', detail: '유익균이 줄면 식이섬유 발효산물인 단쇄지방산(특히 부티레이트)이 떨어져요. 부티레이트는 결장 세포 에너지의 70%를 만들어요.', pose: 'warn', c: ui.T.amber },
      { i: '🧱', t: '투과성↑', desc: '장벽 틈이 벌어져요 (leaky gut)', detail: '부티레이트 부족으로 밀착연접(ZO-1, occludin)이 약해지고 장 점막에 균열이 생겨요. 이게 "장 누수"예요.', pose: 'warn', c: ui.T.cyan },
      { i: '☣️', t: 'LPS 유입', desc: '내독소가 핏줄로 새어들어가요', detail: '장벽 틈으로 내독소(LPS)가 혈류로 유입돼요. 이를 "대사성 내독소혈증"이라고 해요. 간이 이걸 감지해 염증 반응을 시작해요.', pose: 'warn', c: ui.T.red },
      { i: '🔥', t: '염증↑', desc: '전신 저도염증이 시작돼요', detail: 'LPS가 면역 수용체 TLR4를 눌러 전신에 만성적인 저도염증을 일으켜요. CRP 수치가 올라가고 인슐린 저항성이 생겨요.', pose: 'warn', c: ui.T.orange },
      { i: '🫥', t: '도파민↓', desc: '뇌 보상 회로가 둔해져요', detail: '염증이 도파민 전구물질(tyrosine→L-DOPA) 공급을 막아요. 좋은 음식을 먹어도 예전만큼 기쁨을 느끼기 어려워져요. 회복 상한선이 내려가요.', pose: 'warn', c: ui.T.purple }
    ];
    return GS.drjang.renderInteractive(steps.map(function (s) {
      return { label: s.i + ' ' + s.t, line: s.detail, pose: s.pose };
    }), { metrics: m }, { size: 72, pose: 'explain' });
  }

  function metricGuideModal(metric) {
    var g = D.METRIC_GUIDE[metric]; if (!g) return;
    var recoveryHtml = g.howToRecover.map(function (r) { return '<div style="display:flex;gap:7px;align-items:flex-start;padding:7px 0;border-bottom:1px solid rgba(122,220,255,.08)"><span style="color:var(--green);font-size:12px;flex-shrink:0">✓</span><span class="cap">' + r + '</span></div>'; }).join('');
    var body = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="width:42px;height:42px;border-radius:14px;background:' + ui.T.cyan + '1F;display:flex;align-items:center;justify-content:center;font-size:20px">' + g.icon + '</div><div><div class="h2">' + g.label + '</div><div class="micro" style="color:var(--cyan2)">' + g.good + '</div></div></div>' +
      '<div style="margin-bottom:12px"><div class="micro" style="color:var(--cyan2);margin-bottom:4px">이 지표가 뭔가요?</div><div class="cap">' + g.what + '</div></div>' +
      '<div style="margin-bottom:12px"><div class="micro" style="color:var(--green);margin-bottom:4px">어떻게 회복하나요?</div>' + recoveryHtml + '</div>' +
      GS.drjang.render('cheer', g.howToRecover[0], { size: 72 });
    ui.modal(g.label + ' · Dr.장 가이드', body, { footer: ui.btn('닫기', { ghost: true, onclick: 'GS.ui.closeModal()' }) });
  }

  // 부위별 임상 영상 슬롯 — video/gut_systems/{프로필명}_{부위명}.mp4 무한 재생 (유재석/정형돈 프로필, 그 외 기본 유재석)
  function zoneImgSlot(id, name, col) {
    var uid = 'zi-' + id;
    var pname = '유재석';
    try { var pp = GS.store.profile.get() || {}; if (pp.name === '유재석' || pp.name === '정형돈') pname = pp.name; } catch (e) {}
    var vsrc = 'video/gut_systems/' + encodeURIComponent(pname) + '_' + encodeURIComponent(name) + '.mp4';
    return '<div style="position:relative;height:260px;border-radius:14px;overflow:hidden;border:1px solid ' + col + '40;background:linear-gradient(160deg,rgba(4,12,28,.92),rgba(8,20,44,.85))">' +
      '<video id="' + uid + '" autoplay muted loop playsinline preload="auto" src="' + vsrc + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#04070f" ' +
        'oncanplay="var p=document.getElementById(\'' + uid + '-ph\');if(p)p.style.display=\'none\'" ' +
        'onerror="this.style.display=\'none\';var p=document.getElementById(\'' + uid + '-ph\');if(p)p.style.display=\'flex\'">' +
      '<div id="' + uid + '-ph" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center">' +
        '<div style="font-size:20px;opacity:.7">🎬</div>' +
        '<div class="micro" style="color:var(--cyan2)">' + name + ' 임상 영상 슬롯</div>' +
        '<div style="font-family:monospace;font-size:8px;color:var(--ink-faint);line-height:1.8">video/gut_systems/' + pname + '_' + name + '.mp4</div>' +
      '</div></div>';
  }

  function detail(id) {
    var zones = GS.store.zoneStates(); var z = zones.filter(function (x) { return x.id === id; })[0]; if (!z) return;
    var col = sc(z.score), idx = z.indices;
    var tv = D.ZONE_TIMEVISION[id] || {};
    var tvBlock = '<div style="margin-top:9px;padding:9px 11px;border-radius:13px;background:rgba(169,140,255,.16);border:1px solid rgba(169,140,255,.4)">' +
      '<div class="micro" style="color:#C9B6FF;margin-bottom:4px">🔮 ' + z.name + ' 변화</div>' +
      '<div class="cap" style="color:var(--ink)"><b style="color:' + ui.T.red + '">위험:</b> ' + (tv.risk || z.risk) + '</div>' +
      '<div class="cap" style="margin-top:3px"><b style="color:' + ui.T.green + '">회복:</b> ' + (tv.recover || z.advice) + '</div>' +
      (tv.timeline ? '<div class="cap" style="margin-top:3px"><b style="color:var(--cyan2)">예상:</b> ' + tv.timeline + '</div>' : '') +
      '</div>';
    var drjang = GS.drjang.render(z.score < 45 ? 'warn' : z.score > 70 ? 'celebrate' : 'cheer',
      z.name + (z.score < 45 ? '이 위험해요. ' + z.advice : z.score > 70 ? '은 건강해요. 현재 패턴을 유지하세요.' : '은 주의 상태예요. ' + (z.advice || '')),
      { size: 70, topicsHtml: tvBlock });
    var body = zoneImgSlot(id, z.name, col) +
      '<div style="height:10px"></div>' +
      drjang +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px"><div><div class="micro" style="color:' + col + '">' + z.eng + '</div><div class="h2">' + z.name + '</div></div><div style="text-align:right"><div class="micro">HP</div><div class="num" style="color:' + col + ';font-size:26px">' + z.score + '</div></div></div>' +
      '<div class="cap" style="padding:9px;background:rgba(122,220,255,.06);border-radius:12px;margin-bottom:10px"><b>역할:</b> ' + z.role + '<br><b style="color:' + ui.T.red + '">위험:</b> ' + z.risk + '</div>' +
      (z.feature || z.microbe || z.barrierNote
        ? '<div style="border:1px solid rgba(122,220,255,.16);border-radius:12px;margin-bottom:10px;overflow:hidden">' +
          '<div class="micro" style="padding:6px 10px;background:rgba(122,220,255,.08);color:var(--cyan2)">🔍 ' + z.name + ' 이해하기</div>' +
          (z.feature ? '<div style="display:flex;gap:8px;padding:8px 10px;border-top:1px solid rgba(122,220,255,.08)"><span style="font-size:13px;flex-shrink:0">📌</span><div class="cap"><b style="color:var(--ink)">특징</b> — ' + z.feature + '</div></div>' : '') +
          (z.microbe ? '<div style="display:flex;gap:8px;padding:8px 10px;border-top:1px solid rgba(122,220,255,.08)"><span style="font-size:13px;flex-shrink:0">🦠</span><div class="cap"><b style="color:var(--ink)">미생물 환경</b> — ' + z.microbe + '</div></div>' : '') +
          (z.barrierNote ? '<div style="display:flex;gap:8px;padding:8px 10px;border-top:1px solid rgba(122,220,255,.08)"><span style="font-size:13px;flex-shrink:0">🧱</span><div class="cap"><b style="color:var(--ink)">장벽과의 관계</b> — ' + z.barrierNote + '</div></div>' : '') +
          '</div>'
        : '') +
      '<div style="height:8px"></div>' +
      ui.liveBars([
        { k: 'scfa', l: 'SCFA', v: idx.scfa },
        { k: 'perm', l: '투과성', v: idx.permeability },
        { k: 'inf', l: '염증', v: idx.inflammation },
        { k: 'motility', l: '운동성', v: idx.motility }
      ]);
    ui.modal(z.name + ' · 상세 분석', body);
  }

  function colonDetail() {
    var COLON = ['ascending', 'transverse', 'descending', 'sigmoid'];
    var zones = GS.store.zoneStates().filter(function (x) { return COLON.indexOf(x.id) >= 0; });
    if (!zones.length) return;
    var avg = function (fn) { return Math.round(zones.reduce(function (s, x) { return s + fn(x); }, 0) / zones.length); };
    var hp = avg(function (x) { return x.score; });
    var idx = {
      scfa: avg(function (x) { return x.indices.scfa; }),
      permeability: avg(function (x) { return x.indices.permeability; }),
      inflammation: avg(function (x) { return x.indices.inflammation; }),
      motility: avg(function (x) { return x.indices.motility; })
    };
    var col = sc(hp);
    var risks = zones.map(function (x) { return (D.ZONE_TIMEVISION[x.id] || {}).risk || x.risk; });
    var recovers = zones.map(function (x) { return (D.ZONE_TIMEVISION[x.id] || {}).recover || x.advice; });
    var tvBlock = '<div style="margin-top:9px;padding:9px 11px;border-radius:13px;background:rgba(169,140,255,.16);border:1px solid rgba(169,140,255,.4)">' +
      '<div class="micro" style="color:#C9B6FF;margin-bottom:4px">🔮 결장 변화</div>' +
      zones.map(function (x) { return '<div class="cap" style="margin-top:3px"><b style="color:' + ui.T.cyan2 + '">' + x.name + ':</b> ' + ((D.ZONE_TIMEVISION[x.id] || {}).risk || x.risk) + '</div>'; }).join('') +
      '<div class="cap" style="margin-top:5px"><b style="color:' + ui.T.green + '">회복 공통 전략:</b> ' + recovers[0] + '</div>' +
      '</div>';
    var drjang = GS.drjang.render(hp < 45 ? 'warn' : hp > 70 ? 'celebrate' : 'cheer',
      '결장 4구간(상행·횡행·하행·구불)의 평균 HP가 ' + hp + '예요. ' + (hp < 45 ? 'SCFA가 부족해 장벽이 약해진 상태예요. 전통 발효식품과 식이섬유로 부티레이트를 채워주세요.' : hp > 70 ? '결장 전반이 건강해요. 물 2L와 식이섬유 패턴을 유지해주세요.' : '구간별 편차가 있지만 전반적으로 주의 상태예요. 가공육을 줄이고 규칙적인 배변 리듬을 만들어요.'),
      { size: 70, topicsHtml: tvBlock });
    var segHtml = zones.map(function (x) {
      return '<div style="display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:11px;background:rgba(255,196,77,.08);border:1px solid rgba(255,196,77,.3);margin-bottom:5px">' +
        '<span style="font-size:12px">' + zemoji(x.id) + '</span>' +
        '<span style="flex:1;font-size:11px;color:var(--ink)">' + x.name + '</span>' +
        '<span class="num" style="font-size:13px;font-weight:700;color:' + sc(x.score) + '">' + x.score + '</span></div>';
    }).join('');
    var body = drjang +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px"><div><div class="micro" style="color:' + ui.T.cyan + '">Colon Bundle</div><div class="h2">결장</div><div class="micro" style="color:var(--ink-dim)">상행 · 횡행 · 하행 · 구불(S상) 4구간 통합</div></div><div style="text-align:right"><div class="micro">평균 HP</div><div class="num" style="color:' + col + ';font-size:26px">' + hp + '</div></div></div>' +
      segHtml +
      '<div class="cap" style="padding:9px;background:rgba(255,196,77,.07);border-radius:12px;margin-bottom:10px"><b>역할:</b> 수분·전해질 흡수와 대변 성형, 미생물 발효의 최종 관문<br><b style="color:' + ui.T.red + '">위험:</b> 용종·게실염·대장암(한국인 발생률 1위) — ' + risks[0].split('·')[0] + ' 등</div>' +
      zoneImgSlot('colon', '결장', col) +
      '<div style="height:8px"></div>' +
      ui.liveBars([
        { k: 'scfa', l: 'SCFA', v: idx.scfa },
        { k: 'perm', l: '투과성', v: idx.permeability },
        { k: 'inf', l: '염증', v: idx.inflammation },
        { k: 'motility', l: '운동성', v: idx.motility }
      ]);
    ui.modal('결장 · 상세 분석', body);
  }
  function sourceDetail(srcKey, zoneId) {
    var z = GS.store.zoneStates().filter(function (x) { return x.id === zoneId; })[0];
    var META = {
      medical:   { i: '🩺', l: '의료 데이터', color: ui.T.cyan,   sub: 'EMR · LIS · PACS · ECL 실시간 연동' },
      aidiet:    { i: '👓', l: '식단 AI 스캔', color: ui.T.green,  sub: '삼성 AI 렌즈 · 상시 음식 감지' },
      biosensor: { i: '⌚', l: '웨어러블 센서',   color: ui.T.violet, sub: '4기기 멀티모달 동시 계측' }
    };
    var meta = META[srcKey]; if (!meta) return;

    if (!document.getElementById('gs-stream-style')) {
      var st = document.createElement('style'); st.id = 'gs-stream-style';
      st.textContent =
        '.gs-cv-wrap{position:relative;border-radius:12px;background:linear-gradient(180deg,rgba(4,12,28,.95),rgba(8,20,44,.92));border:1px solid rgba(55,199,255,.16);overflow:hidden}' +
        '.gs-cv-wrap canvas{display:block;width:100%}' +
        '.gs-scan{animation:gs-scanY 2.8s ease-in-out infinite}' +
        '@keyframes gs-scanY{0%{top:4%}50%{top:94%}100%{top:4%}}' +
        '@keyframes gs-feedRow{0%,100%{opacity:.4}15%{opacity:1}60%{opacity:1}}' +
        '@keyframes gs-hintNudge{0%,100%{transform:translateX(-50%)}50%{transform:translateX(calc(-50% - 7px))}}';
      document.head.appendChild(st);
    }

    function seedRng(key) { var sd = 0; for (var i = 0; i < key.length; i++) sd = (sd * 131 + key.charCodeAt(i)) & 0x7fffffff; return function () { sd = (sd * 1103515245 + 12345) & 0x7fffffff; return sd / 0x7fffffff; }; }
    function genWave(n, amp, freq, base, noise, rng) { var a = []; for (var i = 0; i < n; i++) { var t = i / n; var v = base + Math.sin(t * Math.PI * 2 * freq) * amp + Math.sin(t * Math.PI * 2 * freq * 2.7 + 0.6) * amp * 0.35 + (rng() - 0.5) * noise; a.push(Math.max(8, Math.min(92, v))); } return a; }

    var N = 90;
    function makeStream(series, yTicks, xTicks, title, xLabel, ch) {
      var CH = ch || 138;
      var cid = 'gscv' + Date.now() + Math.floor(Math.random() * 9999);
      var legend = series.map(function (sr, i) {
        return '<div style="display:flex;align-items:center;gap:4px;flex:1;min-width:45%"><span style="width:8px;height:8px;border-radius:2px;background:' + sr.color + ';flex-shrink:0;box-shadow:0 0 5px ' + sr.color + '"></span><span style="font-size:9px;color:var(--ink-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">' + sr.label + '</span><span id="' + cid + '_v' + i + '" style="font-size:9px;color:' + sr.color + ';font-weight:700;white-space:nowrap">' + sr.format(sr.vals[sr.vals.length - 1]) + '</span></div>';
      }).join('');
      var yLabels = yTicks.map(function (tk) { return '<span style="position:absolute;left:4px;top:' + (100 - tk.pct) + '%;transform:translateY(-50%);font-size:8px;color:var(--ink-faint);background:rgba(4,12,28,.7);padding:0 3px;border-radius:3px">' + tk.label + '</span>'; }).join('');
      var xLabels = xTicks.map(function (tk, i) { return '<span style="position:absolute;left:' + (i / (xTicks.length - 1) * 100) + '%;bottom:1px;transform:translateX(-50%);font-size:8px;color:var(--ink-faint)">' + tk + '</span>'; }).join('');

      setTimeout(function () {
        var cv = document.getElementById(cid); if (!cv) return;
        var ctx = cv.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        function resize() { var r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = CH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
        resize();
        var cw = cv.getBoundingClientRect().width, ch = CH;
        var bufs = series.map(function (sr) { return sr.vals.slice(); });
        var phase = 0;
        function evolve(prev, g) { var tgt = g.base + Math.sin(phase * g.freq) * g.amp + Math.sin(phase * g.freq * 2.7) * g.amp * 0.3; return Math.max(6, Math.min(94, prev * 0.82 + tgt * 0.18 + (Math.random() - 0.5) * g.noise)); }
        function draw() {
          ctx.clearRect(0, 0, cw, ch);
          ctx.strokeStyle = 'rgba(122,220,255,.07)'; ctx.lineWidth = 1;
          for (var gi = 0; gi < yTicks.length; gi++) { var gy = ch * (1 - yTicks[gi].pct / 100); ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke(); }
          for (var si = 0; si < series.length; si++) {
            var buf = bufs[si], col = series[si].color;
            ctx.beginPath(); ctx.moveTo(0, ch);
            for (var i = 0; i < buf.length; i++) { var x = i / (buf.length - 1) * cw, y = ch * (1 - buf[i] / 100); ctx.lineTo(x, y); }
            ctx.lineTo(cw, ch); ctx.closePath(); ctx.fillStyle = col + '1F'; ctx.fill();
            ctx.beginPath();
            for (var i2 = 0; i2 < buf.length; i2++) { var x2 = i2 / (buf.length - 1) * cw, y2 = ch * (1 - buf[i2] / 100); if (i2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2); }
            ctx.strokeStyle = col; ctx.lineWidth = 1.9; ctx.shadowColor = col; ctx.shadowBlur = 7; ctx.stroke(); ctx.shadowBlur = 0;
            var lastY = ch * (1 - buf[buf.length - 1] / 100);
            ctx.beginPath(); ctx.arc(cw - 2, lastY, 3, 0, Math.PI * 2); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
          }
          ctx.strokeStyle = series[0].color; ctx.globalAlpha = 0.5; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cw - 1, 0); ctx.lineTo(cw - 1, ch); ctx.stroke(); ctx.globalAlpha = 1;
        }
        var step = 0;
        function loop() {
          if (!document.body.contains(cv) || cv.offsetParent === null) return;
          step++;
          if (step % 2 === 0) {
            phase += 0.07;
            for (var si2 = 0; si2 < series.length; si2++) {
              var b = bufs[si2]; b.shift(); b.push(evolve(b[b.length - 1], series[si2].gen));
              var ve = document.getElementById(cid + '_v' + si2); if (ve) ve.textContent = series[si2].format(b[b.length - 1]);
            }
          }
          draw();
          requestAnimationFrame(loop);
        }
        draw(); requestAnimationFrame(loop);
      }, 70);

      return '<div style="margin-bottom:8px"><div class="cap" style="color:var(--cyan2);margin-bottom:5px">' + title + ' · <span style="color:var(--green)">● LIVE 스트리밍</span></div>' +
        '<div class="gs-cv-wrap" style="height:' + CH + 'px"><canvas id="' + cid + '" style="height:' + CH + 'px"></canvas>' + yLabels + xLabels + '</div>' +
        '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' + legend + '</div>' +
        '<div class="micro" style="color:var(--ink-faint);margin-top:5px">' + xLabel + '</div></div>';
    }

    var rng = seedRng(srcKey + zoneId);
    var chartHtml = '', statsHtml = '', drjPose = 'explain', drjLine = '';

    if (srcKey === 'medical') {
      var crp0 = (0.2 + rng() * 2.4).toFixed(2);
      var calp0 = Math.round(36 + rng() * 210);
      var vitd0 = Math.round(14 + rng() * 34);
      var badges = ['EMR', 'EHR', 'LIS', 'PACS', 'ECL', 'CDR'].map(function (b, bi) {
        return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:7px;background:rgba(55,199,255,.08);border:1px solid rgba(55,199,255,.2);font-size:9px;color:var(--cyan2);font-family:monospace">' + b + '<span style="width:4px;height:4px;border-radius:50%;background:var(--green);animation:blink 1.2s infinite;animation-delay:' + (bi * 0.18).toFixed(2) + 's"></span></span>';
      }).join('');
      statsHtml = '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">' + badges + '</div>' +
        '<div style="display:flex;gap:7px;margin-bottom:10px">' +
        '<div style="flex:1.2;padding:9px;background:rgba(255,92,122,.07);border:1px solid rgba(255,92,122,.2);border-radius:10px"><div class="micro">hs-CRP 현재</div><div class="num" style="font-size:17px;color:' + ui.T.red + '">' + crp0 + '<span style="font-size:9px;color:var(--ink-dim)"> mg/L</span></div></div>' +
        '<div style="flex:1;padding:9px;background:rgba(255,138,77,.07);border:1px solid rgba(255,138,77,.2);border-radius:10px"><div class="micro">칼프로텍틴</div><div class="num" style="font-size:17px;color:' + ui.T.orange + '">' + calp0 + '<span style="font-size:9px;color:var(--ink-dim)"> µg/g</span></div></div>' +
        '<div style="flex:1;padding:9px;background:rgba(39,216,155,.06);border:1px solid rgba(39,216,155,.18);border-radius:10px"><div class="micro">비타민 D</div><div class="num" style="font-size:17px;color:' + ui.T.green + '">' + vitd0 + '<span style="font-size:9px;color:var(--ink-dim)"> ng/mL</span></div></div></div>';

      function medChart(title, unit, color, yTicks, fmt, gen) {
        return makeStream([{ label: unit, color: color, vals: genWave(N, gen.a, gen.f, gen.b, gen.n || 8, rng), gen: { amp: gen.a, freq: gen.f, base: gen.b, noise: gen.n || 8 }, format: fmt }],
          yTicks, ['12h', '6h', '현재'], title, '', 64);
      }
      var medGrid = function (cells) { return '<div style="display:flex;flex-wrap:wrap;gap:7px">' + cells.map(function (x) { return '<div style="flex:1 1 46%;min-width:150px">' + x + '</div>'; }).join('') + '</div>'; };
      chartHtml = medGrid([
        medChart('hs-CRP · 염증', 'mg/L', '#FF5C7A', [{ pct: 90, label: '5.0' }, { pct: 50, label: '1.0' }, { pct: 10, label: '0.2' }], function (v) { return (0.2 + v / 100 * 4.6).toFixed(2); }, { a: 12, f: 1.1, b: 40, n: 12 }),
        medChart('대변 칼프로텍틴', 'µg/g', '#FF8A4D', [{ pct: 90, label: '260' }, { pct: 50, label: '50' }, { pct: 10, label: '20' }], function (v) { return Math.round(18 + v / 100 * 250); }, { a: 14, f: 1.6, b: 44, n: 12 }),
        medChart('공복혈당 · FPG', 'mg/dL', '#37C7FF', [{ pct: 90, label: '140' }, { pct: 50, label: '100' }, { pct: 10, label: '70' }], function (v) { return Math.round(72 + v / 100 * 66); }, { a: 8, f: 0.8, b: 48, n: 6 }),
        medChart('페리틴 · 체내철', 'ng/mL', '#FFC44D', [{ pct: 90, label: '260' }, { pct: 50, label: '90' }, { pct: 10, label: '15' }], function (v) { return Math.round(15 + v / 100 * 245); }, { a: 10, f: 0.6, b: 42, n: 9 }),
        medChart('비타민 D 25-OH', 'ng/mL', '#27D89B', [{ pct: 90, label: '50' }, { pct: 50, label: '30' }, { pct: 10, label: '10' }], function (v) { return Math.round(12 + v / 100 * 42); }, { a: 7, f: 0.9, b: 50, n: 6 }),
        medChart('알부민 · ALB', 'g/dL', '#A98CFF', [{ pct: 90, label: '4.9' }, { pct: 50, label: '4.0' }, { pct: 10, label: '3.0' }], function (v) { return (3.0 + v / 100 * 1.9).toFixed(1); }, { a: 6, f: 0.7, b: 55, n: 5 })
      ]);
      chartHtml += '<div class="micro" style="color:var(--ink-faint);margin-top:6px">X축: 최근 12시간 · 검체: 혈청 5종 + 대변 1종 · 검사실 LIS 게이트웨이 실시간 동기화</div>';
      drjPose = 'explain';
      drjLine = (z ? z.name + ' 판독을 위해 ' : '') + '혈청·대변 검체 6종 지표를 교차 분석했어요. hs-CRP ' + crp0 + 'mg/L는 간에서 합성되는 급성기 단백질로 1.0mg/L 미만이 참고치고, 대변 칼프로텍틴 ' + calp0 + 'µg/g은 호중구 유래 단백질이라 ' + (z ? z.name : '해당 부위') + ' 점막의 국소 염증을 혈청 지표보다 먼저 반영해요. 페리틴·비타민D는 점막 흡수 기능의 간접 지표라서 낮게 유지되면 융모 위축을 의심합니다.';
    } else if (srcKey === 'aidiet') {
      var _pp = {};
      try { _pp = GS.store.profile.get() || {}; } catch (e) {}
      var recImg = _pp.name === '정형돈' ? 'imgs/bad_food_record.png' : 'imgs/good_food_record.png';
      var scanId = 'aiscan-' + Math.random().toString(36).substr(2, 6);
      var phId = 'aiscan-ph-' + Math.random().toString(36).substr(2, 5);
      var corners = ['tl', 'tr', 'bl', 'br'].map(function (c) {
        var st = c === 'tl' ? 'top:8px;left:34px;border-top:2px solid #27D89B;border-left:2px solid #27D89B'
          : c === 'tr' ? 'top:8px;right:34px;border-top:2px solid #27D89B;border-right:2px solid #27D89B'
          : c === 'bl' ? 'bottom:8px;left:34px;border-bottom:2px solid #27D89B;border-left:2px solid #27D89B'
          : 'bottom:8px;right:34px;border-bottom:2px solid #27D89B;border-right:2px solid #27D89B';
        return '<div style="position:absolute;' + st + ';width:18px;height:18px"></div>';
      }).join('');
      var feedRows = (_pp.name === '정형돈'
        ? [['🍩', '도넛 · 당 32g · 트랜스지방 감지 ⚠', '#FF5C7A'],
           ['🍕', '피자 · 정제탄수 48g · 나트륨 1020mg', '#FF8A4D'],
           ['🥤', '콜라 · 당 35g · 혈당 스파이크 예상 ⚠', '#FF5C7A'],
           ['🍫', '초콜릿 · 당 28g · 유화제 감지 ⚠', '#FF8A4D']]
        : [['🍗', '닭가슴살 · 단백질 31g · 180g 추정', '#27D89B'],
           ['🥗', '포케 · 오메가3 · 식이섬유 7.1g', '#27D89B'],
           ['🥛', '요거트 · 프로바이오틱스 50억 CFU', '#37C7FF'],
           ['🥬', '샐러드 · 210g 추정 · 식이섬유 6.2g', '#27D89B']]
      ).map(function (r, i) {
        return '<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;background:rgba(8,18,40,.5);border:1px solid ' + r[2] + '22;margin-bottom:5px;animation:gs-feedRow 6s ease-in-out infinite;animation-delay:' + (i * 1.2).toFixed(1) + 's"><span style="font-size:13px">' + r[0] + '</span><span style="flex:1;font-size:10px;color:var(--ink)">' + r[1] + '</span><span style="font-size:8px;color:' + r[2] + ';font-family:monospace">감지</span></div>';
      }).join('');
      statsHtml = '<div style="display:flex;gap:7px;margin-bottom:10px">' +
        '<div style="flex:1;padding:9px;background:rgba(39,216,155,.06);border:1px solid rgba(39,216,155,.18);border-radius:10px;text-align:center"><div class="micro">감지 정확도</div><div class="num" style="font-size:16px;color:var(--green)">96.8%</div></div>' +
        '<div style="flex:1;padding:9px;background:rgba(55,199,255,.06);border:1px solid rgba(55,199,255,.16);border-radius:10px;text-align:center"><div class="micro">오늘 감지</div><div class="num" style="font-size:16px;color:var(--cyan)">14건</div></div>' +
        '<div style="flex:1;padding:9px;background:rgba(169,140,255,.07);border:1px solid rgba(169,140,255,.2);border-radius:10px;text-align:center"><div class="micro">추론</div><div class="num" style="font-size:16px;color:#C9B6FF">60fps</div></div></div>';
      chartHtml = '<div style="position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;border:1px solid rgba(39,216,155,.3);background:#060D20;box-shadow:0 8px 24px rgba(39,216,155,.1)">' +
        '<div id="' + scanId + '" style="position:absolute;inset:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch;cursor:grab">' +
          '<img alt="AI 렌즈 실시간 스캔 화면" src="' + recImg + '" draggable="false" style="height:100%;width:auto;max-width:none;display:block;pointer-events:none" ' +
            'onerror="this.style.display=\'none\';var p=document.getElementById(\'' + phId + '\');if(p)p.style.display=\'flex\'">' +
        '</div>' +
        '<div style="position:absolute;top:0;left:0;right:0;height:18px;background:linear-gradient(180deg,rgba(6,13,32,.9),transparent);pointer-events:none;z-index:2"></div>' +
        '<div id="' + phId + '" style="position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:radial-gradient(circle at 50% 50%,rgba(39,216,155,.05),rgba(6,13,32,.6));z-index:3">' +
          '<div style="width:40px;height:40px;border-radius:50%;background:rgba(39,216,155,.12);border:2px solid rgba(39,216,155,.5);display:flex;align-items:center;justify-content:center;font-size:17px;animation:pulse 2s infinite">👓</div>' +
          '<div style="font-family:monospace;font-size:9px;color:#27D89B;background:rgba(4,10,22,.6);padding:3px 9px;border-radius:6px;border:1px solid rgba(39,216,155,.3)">' + recImg + '</div>' +
        '</div>' +
        '<div style="position:absolute;inset:0;pointer-events:none">' +
          '<div style="position:absolute;top:8px;left:34px;display:flex;align-items:center;gap:5px;font-size:9px;color:#EAFFEB;font-family:monospace;background:rgba(4,10,22,.55);padding:3px 8px;border-radius:6px;border:1px solid rgba(39,216,155,.25)"><span style="font-size:11px">👓</span>삼성 AI 렌즈 연동 중..<span style="width:6px;height:6px;border-radius:50%;background:#27D89B;box-shadow:0 0 6px #27D89B;animation:blink 1.1s infinite"></span></div>' +
          '<div style="position:absolute;top:8px;right:34px;display:flex;align-items:center;gap:4px;font-size:9px;color:#FF9DB0;font-family:monospace;background:rgba(4,10,22,.55);padding:3px 8px;border-radius:6px"><span style="width:6px;height:6px;border-radius:50%;background:#FF5C7A;animation:blink 1s infinite"></span>REC</div>' +
          corners +
          '<div class="gs-scan" style="position:absolute;left:10px;right:10px;height:2px;background:linear-gradient(90deg,transparent,#27D89B,transparent);box-shadow:0 0 14px rgba(39,216,155,.7)"></div>' +
          '<div style="position:absolute;bottom:8px;left:34px;font-size:8px;color:#9DF3CF;font-family:monospace;background:rgba(4,10,22,.55);padding:3px 7px;border-radius:6px">비전 모델 v9.2 · 실시간 추론</div>' +
          '<div style="position:absolute;bottom:8px;right:34px;font-size:8px;color:#9DB4D6;font-family:monospace;background:rgba(4,10,22,.55);padding:3px 7px;border-radius:6px">🔒 온디바이스 처리</div>' +
          '<div id="' + scanId + '-hint" style="position:absolute;bottom:26px;left:50%;transform:translateX(-50%);font-size:8.5px;color:#BFEFD6;font-family:monospace;background:rgba(4,10,22,.62);padding:3px 10px;border-radius:999px;border:1px solid rgba(39,216,155,.3);animation:gs-hintNudge 1.6s ease-in-out infinite">← 옆으로 넘겨서 보기 →</div>' +
        '</div></div>' +
        '<div style="margin-top:9px"><div class="micro" style="color:var(--cyan2);margin-bottom:5px">실시간 감지 피드</div>' + feedRows + '</div>';
      setTimeout(function () {
        var sc = document.getElementById(scanId); if (!sc) return;
        var hint = document.getElementById(scanId + '-hint');
        var pauseUntil = 0, dragging = false, lastX = 0;
        function userAct() { pauseUntil = performance.now() + 3000; if (hint) hint.style.display = 'none'; }
        sc.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; sc.style.cursor = 'grabbing'; userAct(); });
        sc.addEventListener('pointermove', function (e) { if (!dragging) return; sc.scrollLeft -= (e.clientX - lastX); lastX = e.clientX; });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { sc.addEventListener(ev, function () { dragging = false; sc.style.cursor = 'grab'; userAct(); }); });
        ['wheel', 'touchmove'].forEach(function (ev) { sc.addEventListener(ev, userAct, { passive: true }); });
        var t0 = performance.now();
        (function pan() {
          if (!document.body.contains(sc)) return;
          if (!dragging && performance.now() > pauseUntil && sc.scrollWidth > sc.clientWidth + 4) {
            var ph = (performance.now() - t0) / 11000;
            sc.scrollLeft = (0.5 - 0.5 * Math.cos(ph * Math.PI * 2)) * (sc.scrollWidth - sc.clientWidth);
          }
          requestAnimationFrame(pan);
        })();
      }, 150);
      drjPose = 'cheer';
      drjLine = '삼성 AI 렌즈의 전방 카메라가 시야에 들어온 모든 음식을 실시간으로 추적해요. 음식 종류·추정 중량·조리법을 분류하고, 이를 탄수화물·지방·식이섬유 부하로 환산해 ' + (z ? z.name : '장') + ' 발효 시뮬레이션에 직접 입력합니다. 제로 음료의 인공감미료처럼 라벨에 숨은 성분도 감지해서 점막 영향을 즉시 반영해요. 영상은 외부로 전송되지 않고 기기 안에서만 처리돼요.';
    } else {
      var sensors = [
        { i: '⌚', n: '갤럭시 워치 S2040', m: '심박변이 HRV', u: 'ms', c: '#37C7FF', t: [{ pct: 90, label: '88' }, { pct: 50, label: '58' }, { pct: 10, label: '28' }], f: function (v) { return Math.round(28 + v / 100 * 60); }, g: { a: 12, f: 2.2, b: 48, n: 9 } },
        { i: '🤖', n: '장 마이크로 로봇', m: '점막 표면 pH', u: '', c: '#27D89B', t: [{ pct: 90, label: '7.4' }, { pct: 50, label: '6.7' }, { pct: 10, label: '6.0' }], f: function (v) { return (6.0 + v / 100 * 1.4).toFixed(2); }, g: { a: 8, f: 1.4, b: 46, n: 6 } },
        { i: '💊', n: '복약 센서', m: '혈중 약물 농도', u: 'ng/mL', c: '#A98CFF', t: [{ pct: 90, label: '190' }, { pct: 50, label: '100' }, { pct: 10, label: '12' }], f: function (v) { return Math.round(12 + v / 100 * 178); }, g: { a: 10, f: 0.9, b: 44, n: 8 } },
        { i: '🖐️', n: '스킨 센서', m: '경피수분 TEWL', u: 'g/m²·h', c: '#FFC44D', t: [{ pct: 90, label: '30' }, { pct: 50, label: '19' }, { pct: 10, label: '8' }], f: function (v) { return (8 + v / 100 * 22).toFixed(1); }, g: { a: 9, f: 1.8, b: 42, n: 7 } }
      ];
      var cells = sensors.map(function (sn) {
        return '<div style="flex:1 1 46%;min-width:150px;padding:9px;border-radius:12px;background:rgba(8,18,40,.5);border:1px solid ' + sn.c + '26">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span style="font-size:13px">' + sn.i + '</span><span style="font-size:10px;color:var(--ink);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + sn.n + '</span><span style="width:5px;height:5px;border-radius:50%;background:' + sn.c + ';animation:pulse 1.4s infinite"></span></div>' +
          makeStream([{ label: sn.m + (sn.u ? ' (' + sn.u + ')' : ''), color: sn.c, vals: genWave(N, sn.g.a, sn.g.f, sn.g.b, sn.g.n, rng), gen: { amp: sn.g.a, freq: sn.g.f, base: sn.g.b, noise: sn.g.n }, format: sn.f }], sn.t, ['30s', '10s', '현재'], sn.m, '', 62) +
        '</div>';
      }).join('');
      statsHtml = '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:11px;background:linear-gradient(90deg,rgba(169,140,255,.1),rgba(55,199,255,.06));border:1px solid rgba(169,140,255,.25);margin-bottom:10px"><span style="font-size:14px">📡</span><span style="font-size:10px;color:#C9B6FF;font-weight:700">4기기 동시 스트리밍</span><span style="font-size:9px;color:var(--ink-dim);margin-left:auto;font-family:monospace">512Hz · 지연 3ms · BLE 7.0 메시</span></div>';
      chartHtml = '<div style="display:flex;flex-wrap:wrap;gap:7px">' + cells + '</div>' +
        '<div class="micro" style="color:var(--ink-faint);margin-top:6px">모든 센서 값은 512Hz로 샘플링되어 초저지연 BLE 7.0 메시로 디지털 트윈에 유입돼요</div>';
      drjPose = 'explain';
      drjLine = '4개 센서가 ' + (z ? z.name : '장') + '을 다각도로 계측 중이에요. 갤럭시 워치 S2040의 심박변이(HRV)는 미주신경 톤을 반영해 장 운동성·분비 리듬과 공진하고, 장 마이크로 로봇이 측정하는 점막 pH는 미생물 발효 산도를 직접 보여줘요. 복약 센서의 혈중 농도 곡선은 흡수 동역학을, 스킨 센서의 경피수분손실(TEWL)은 전신 수분 장벽 상태를 각각 추적합니다. 이 신호들이 융합되면 단일 지표보다 훨씬 정밀한 판독이 가능해요.';
    }

    var body = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="width:38px;height:38px;border-radius:12px;background:' + meta.color + '1F;border:1px solid ' + meta.color + '55;display:flex;align-items:center;justify-content:center;font-size:18px">' + meta.i + '</div><div><div class="h2">' + meta.l + '</div><div class="micro" style="color:var(--cyan2)">' + (z ? z.name + ' · ' : '') + meta.sub + ' <span style="width:6px;height:6px;border-radius:50%;background:var(--green);display:inline-block;animation:pulse 1.5s infinite"></span></div></div></div>' +
      statsHtml +
      chartHtml +
      '<div style="margin-top:10px">' + GS.drjang.render(drjPose, drjLine, { size: 66 }) + '</div>';
    ui.modal(z ? meta.l + ' · ' + z.name : meta.l, body, { footer: z
      ? ui.btn('← 뒤로', { ghost: true, onclick: 'GS.ui.closeModal();GS.screens.gutmap.detail(\'' + zoneId + '\')' })
      : ui.btn('닫기', { ghost: true, onclick: 'GS.ui.closeModal()' }) });
  }

  function render() {
    var m = GS.store.coreMetrics();
    var zones = GS.store.zoneStates();
    var danger = dangerUnits();
    var avg = Math.round(zones.reduce(function (s, x) { return s + x.score; }, 0) / zones.length);
    var score = GS.store.gutScore();

    var statusTitle = '<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;background:linear-gradient(135deg,rgba(55,199,255,.16),rgba(169,140,255,.16));border:1px solid rgba(55,199,255,.45);font-size:11px;font-weight:800;letter-spacing:.5px;white-space:nowrap">' +
      '<span class="gs-star" style="font-weight:700">★ 장 상태</span>' +
      '<span style="font-size:10px;animation:gs-twinkle 1.2s ease-in-out infinite;display:inline-block">✨</span></span>';

    var metricsPanel = ui.panel(
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' + statusTitle + ui.weatherBadge(m.inflammation) + '</div>' +
      ui.liveBars([
        { k: 'scfa', l: 'SCFA', v: m.scfa, oc: 'GS.screens.gutmap.guide(\'scfa\')', hint: '↓ 부족하면' },
        { k: 'perm', l: '투과성', v: m.permeability, oc: 'GS.screens.gutmap.guide(\'permeability\')', hint: '↓ 틈이 벌어지면' },
        { k: 'inf', l: '염증', v: m.inflammation, oc: 'GS.screens.gutmap.guide(\'inflammation\')', hint: '↓ 염증이 올리면' },
        { k: 'dopa', l: '도파민', v: m.dopamine, oc: 'GS.screens.gutmap.guide(\'dopamine\')', ceiling: m.ceiling }
      ], { header: false }),
      { pad: '12px 14px' });

    return '<div class="pad">' +
      '<div style="margin-bottom:10px;padding-right:150px">' + ui.stageTag('장 맵') + '<div class="h1" style="margin-top:6px">장 생태계 지도</div><div class="cap">9개 부위 · 드래그로 돌리고 탭하면 상세 분석</div></div>' +
      metricsPanel +
      '<div style="height:8px"></div>' +
      '<div class="micro" style="color:var(--cyan2);margin-bottom:4px;padding:0 4px">' + ui.star() + ' 인과 사슬 · 각 단계를 탭하면 Dr.장이 설명해요</div>' +
      causalChainInteractive(m) +
      '<div style="height:8px"></div>' +
      ui.panel('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div><div class="micro">종합 장 건강</div><div class="num" style="font-size:20px;color:' + sc(avg) + '">' + avg + '<span style="font-size:11px;color:var(--ink-dim)">/100</span></div></div><div style="text-align:right"><div class="micro">위험 부위</div><div class="num" style="font-size:20px;color:' + (danger ? ui.T.red : ui.T.green) + '">' + danger + '<span style="font-size:11px;color:var(--ink-dim)">/6</span></div></div></div>' +
        '<div id="gut3d" style="position:relative;width:100%;height:290px;border-radius:14px;overflow:hidden;background:radial-gradient(circle at 50% 50%,rgba(255,128,176,.06),rgba(55,199,255,.04),transparent 70%)"><div id="gutLabels" style="position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden"></div></div>',
      { pad: '12px' }) +
      '<div style="height:.5rem"></div></div>';
  }
  function select(id) { active = active === id ? null : id; GS.nav.render(); }
  function guide(metric) { metricGuideModal(metric); }
  GS.screens.gutmap = render;
  GS.screens.gutmap.select = select;
  GS.screens.gutmap.detail = detail;
  GS.screens.gutmap.guide = guide;
  GS.screens.gutmap.sourceDetail = sourceDetail;
  GS.screens.gutmap.colonDetail = colonDetail;
  GS.screens.gutmap.dangerUnits = dangerUnits;
})();
