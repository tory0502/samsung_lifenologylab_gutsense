/* GutSense www3 — HOME. Restored 3D gut-ribbon backdrop + causal overlay,
 * Dr.장 comprehensive feedback (LLM home-only), 3D-perspective world map,
 * enhanced reset challenge UI.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var ui = window.GS.ui, D = window.GS_DATA;

  if (window.THREE && GS.engine) {
    GS.engine.register('home', function (stage) {
      var host = document.getElementById('home3d'); if (!host) return;
      stage.attach(host); stage.camera.position.set(0, 0, 14);
      stage.scene.fog = new THREE.Fog(0x060e1c, 8, 28);
      var tex = (function () { var cv = document.createElement('canvas'); cv.width = cv.height = 32; var g = cv.getContext('2d'); var grd = g.createRadialGradient(16, 16, 0, 16, 16, 16); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.4, 'rgba(255,255,255,.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(cv); })();
      var pts = [[-5, 3, -1], [-2, 4, 0], [2, 3.2, -1], [5, 1, 0], [4, -2, -1], [0, -3, 0], [-4, -2, -1], [-5, 1, 0]].map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
      var curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
      var tube = new THREE.TubeGeometry(curve, 120, 0.5, 14, true);
      stage.add(new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: 0x37c7ff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })));
      stage.add(new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: 0x7adcff, wireframe: true, transparent: true, opacity: 0.16 })));
      var PN = 240, pp = new Float32Array(PN * 3), pc = new Float32Array(PN * 3), tt = [];
      var pal = [[.22, .78, 1], [.48, .55, 1], [.15, .85, .61], [.66, .55, 1]];
      for (var i = 0; i < PN; i++) { var v = curve.getPointAt((i / PN) % 1); pp[i * 3] = v.x; pp[i * 3 + 1] = v.y; pp[i * 3 + 2] = v.z; var c = pal[i % pal.length]; pc[i * 3] = c[0]; pc[i * 3 + 1] = c[1]; pc[i * 3 + 2] = c[2]; tt.push((i / PN + Math.random() * 0.01) % 1); }
      var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pp, 3)); geo.setAttribute('color', new THREE.BufferAttribute(pc, 3));
      var flow = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.34, map: tex, vertexColors: true, transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending }));
      stage.add(flow);
      var bgN = 80, bgp = new Float32Array(bgN * 3), bgc = new Float32Array(bgN * 3), bsp = [];
      for (var j = 0; j < bgN; j++) { bgp[j*3] = (Math.random()-.5)*18; bgp[j*3+1] = (Math.random()-.5)*14; bgp[j*3+2] = (Math.random()-.5)*8-3; var bc = pal[j%pal.length]; bgc[j*3]=bc[0]; bgc[j*3+1]=bc[1]; bgc[j*3+2]=bc[2]; bsp.push(.08+Math.random()*.15); }
      var bgGeo = new THREE.BufferGeometry(); bgGeo.setAttribute('position', new THREE.BufferAttribute(bgp, 3)); bgGeo.setAttribute('color', new THREE.BufferAttribute(bgc, 3));
      var bgPts = new THREE.Points(bgGeo, new THREE.PointsMaterial({ size: 0.2, map: tex, vertexColors: true, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending }));
      stage.add(bgPts);
      stage.onUpdate(function (dt, t) {
        var pa = geo.attributes.position.array;
        for (var k = 0; k < PN; k++) { tt[k] = (tt[k] + dt * 0.05) % 1; var vv = curve.getPointAt(tt[k]); pa[k * 3] = vv.x; pa[k * 3 + 1] = vv.y; pa[k * 3 + 2] = vv.z; }
        geo.attributes.position.needsUpdate = true;
        var bpa = bgGeo.attributes.position.array;
        for (var b = 0; b < bgN; b++) { bpa[b*3+1] += bsp[b]*dt; if (bpa[b*3+1]>7) bpa[b*3+1]=-7; }
        bgGeo.attributes.position.needsUpdate = true;
        stage.scene.rotation.z = Math.sin(t * 0.04) * 0.08;
        stage.scene.rotation.x = Math.sin(t * 0.03) * 0.05;
        stage.camera.position.y = Math.sin(t * 0.1) * 0.6;
      });

      // 월드맵 3D 행성 시스템 — 별도 스테이지(engine.track로 생명주기 연결)
      var wmHost = document.getElementById('worldmap3d');
      if (wmHost && GS.engine.Stage) {
        (function () {
          var wm = new GS.engine.Stage({ alpha: true });
          GS.engine.track(wm);
          wmHost.appendChild(wm.renderer.domElement);
          wm.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%!important;height:100%!important';
          (function fitWm() {
            var w2 = wmHost.clientWidth || 380, h2 = wmHost.clientHeight || 300;
            wm.renderer.setSize(w2, h2, false);
            wm.camera.aspect = w2 / h2; wm.camera.updateProjectionMatrix();
          })();
          if (window.ResizeObserver) { var wro = new ResizeObserver(function () { var w3 = wmHost.clientWidth || 1, h3 = wmHost.clientHeight || 1; wm.renderer.setSize(w3, h3, false); wm.camera.aspect = w3 / h3; wm.camera.updateProjectionMatrix(); }); wro.observe(wmHost); }
          var wcam = wm.camera;
          wcam.fov = 46; wcam.position.set(0, 2.7, 10.4); wcam.lookAt(0, -0.1, 0); wcam.updateProjectionMatrix();
          wm.scene.add(new THREE.AmbientLight(0x8fa3c8, 0.7));
          var sun = new THREE.PointLight(0xffffff, 1.2, 40); sun.position.set(5, 6, 6); wm.scene.add(sun);

          function radialTex(colA) { var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'); var rg = g.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, colA); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
          var softTex = radialTex('rgba(255,255,255,1)');

          // 배경 별
          var SN = 520, sp2 = new Float32Array(SN * 3);
          for (var s0 = 0; s0 < SN; s0++) { var rr2 = 13 + Math.random() * 6, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1); sp2[s0 * 3] = rr2 * Math.sin(ph) * Math.cos(th); sp2[s0 * 3 + 1] = rr2 * Math.cos(ph); sp2[s0 * 3 + 2] = rr2 * Math.sin(ph) * Math.sin(th); }
          var sg2 = new THREE.BufferGeometry(); sg2.setAttribute('position', new THREE.BufferAttribute(sp2, 3));
          var stars = new THREE.Points(sg2, new THREE.PointsMaterial({ color: 0xdfe9ff, size: 0.09, map: softTex, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
          wm.scene.add(stars);

          // 은하수 밴드 — 기울어진 디스크에 밀집한 입자
          var MN = 1200, mp = new Float32Array(MN * 3), mc = new Float32Array(MN * 3);
          var mwCols = [[1, 1, 1], [0.55, 0.8, 1], [0.75, 0.65, 1], [0.9, 0.95, 1]];
          for (var m0 = 0; m0 < MN; m0++) {
            var a2 = Math.random() * Math.PI * 2, r2 = 3.5 + Math.pow(Math.random(), 0.7) * 8;
            mp[m0 * 3] = Math.cos(a2) * r2; mp[m0 * 3 + 1] = (Math.random() - 0.5) * (1.5 - r2 * 0.06); mp[m0 * 3 + 2] = Math.sin(a2) * r2 * 0.9;
            var cc2 = mwCols[m0 % mwCols.length];
            mc[m0 * 3] = cc2[0]; mc[m0 * 3 + 1] = cc2[1]; mc[m0 * 3 + 2] = cc2[2];
          }
          var mg2 = new THREE.BufferGeometry(); mg2.setAttribute('position', new THREE.BufferAttribute(mp, 3)); mg2.setAttribute('color', new THREE.BufferAttribute(mc, 3));
          var milky = new THREE.Points(mg2, new THREE.PointsMaterial({ size: 0.07, map: softTex, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }));
          milky.rotation.set(0.62, 0, 0.28); wm.scene.add(milky);

          // 은하수 흐름 — 밴드를 따라 나선 유입하는 차등 회전 입자 (헤일로+본류 2층)
          var FLOW_N = 900;
          var flowGeo = new THREE.BufferGeometry();
          var flowPos = new Float32Array(FLOW_N * 3), flowCol = new Float32Array(FLOW_N * 3);
          var flowSeed = [];
          var flowCols = [[0.62, 0.85, 1], [1, 1, 1], [0.72, 0.62, 1], [0.5, 0.9, 0.95]];
          for (var fl = 0; fl < FLOW_N; fl++) {
            var layer = fl % 2;
            var frMin = layer ? 3.2 : 5.2, frMax = layer ? 5.6 : 9.5;
            flowSeed.push({ r: frMin + Math.random() * (frMax - frMin), a: Math.random() * Math.PI * 2, sp: (layer ? 0.16 : 0.09) * (1.35 - 0.06 * Math.random()), y: (Math.random() - 0.5) * (layer ? 0.5 : 0.28), ph: Math.random() * Math.PI * 2 });
            var fc3 = flowCols[fl % flowCols.length];
            flowCol[fl * 3] = fc3[0]; flowCol[fl * 3 + 1] = fc3[1]; flowCol[fl * 3 + 2] = fc3[2];
          }
          flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
          flowGeo.setAttribute('color', new THREE.BufferAttribute(flowCol, 3));
          var flowPts = new THREE.Points(flowGeo, new THREE.PointsMaterial({ size: 0.085, map: softTex, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
          var flowGrp = new THREE.Group(); flowGrp.rotation.set(0.62, 0, 0.28); flowGrp.add(flowPts); wm.scene.add(flowGrp);
          var flowArr = flowGeo.attributes.position.array;

          // 은하 코어 글로우 — 중심 밝은 핵
          var coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0xbfe0ff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
          coreGlow.scale.set(7, 4.6, 1); coreGlow.position.set(-4.5, 1.8, -6); wm.scene.add(coreGlow);

          // 유성 — 주기적으로 가로지르는 궤적
          var meteor = { line: null, head: null, t: 99, dur: 0.9, from: new THREE.Vector3(), to: new THREE.Vector3() };
          (function () {
            var mg = new THREE.BufferGeometry();
            var mpts = [];
            for (var i = 0; i < 18; i++) mpts.push(new THREE.Vector3());
            mg.setFromPoints(mpts);
            meteor.line = new THREE.Line(mg, new THREE.LineBasicMaterial({ color: 0xdff2ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
            wm.scene.add(meteor.line);
            meteor.head = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
            meteor.head.scale.set(0.65, 0.65, 1); wm.scene.add(meteor.head);
          })();

          // 성운 스프라이트
          [[0xA98CFF, -6, 2, -6, 9], [0x37C7FF, 6, -1, -7, 8], [0x7B61FF, 2, 3, -9, 6]].forEach(function (n) {
            var sm = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: n[0], transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
            sm.scale.set(n[3], n[3] * 0.7, 1); sm.position.set(n[1], n[2], n[3] !== 9 ? n[3] * -0.8 : -7); wm.scene.add(sm);
          });

          var NODES2 = GS.nav.NODES;
          var cur2 = GS.store.nav.get();
          var idx2 = 0;
          for (var n0 = 0; n0 < NODES2.length; n0++) if (NODES2[n0].id === cur2) { idx2 = n0; break; }
          function metaTxt(id) {
            if (id === 'gutmap') { try { return GS.screens.gutmap.dangerUnits() + '개 위험 부위'; } catch (e) { var z = GS.store.zoneStates(); return z.filter(function (x) { return x.score < 45; }).length + '개 위험 부위'; } }
            if (id === 'diet') { try { return GS.store.diet.eatenToday().length + '개 감지'; } catch (e) { return '식단 기록'; } }
            if (id === 'endoscope') return '3년 후 예측';
            if (id === 'quest') return GS.store.quests.done().length + '개 완료';
            return '';
          }
          var P_ICONS = { gutmap: '🧬', diet: '🍽️', endoscope: '🔮', quest: '⭐' };
          var labelHost = wmHost.querySelector('#wmLabels');
          function planetSurfaceTex(colHex, seed) {
            var c = document.createElement('canvas'); c.width = c.height = 256;
            var g = c.getContext('2d');
            var bands = 5 + (seed % 3);
            for (var b = 0; b < bands; b++) {
              var y0 = (b / bands) * 256;
              g.fillStyle = 'rgba(255,255,255,' + (0.05 + ((seed * (b + 3)) % 7) * 0.017) + ')';
              g.fillRect(0, y0, 256, 256 / bands - 2);
            }
            for (var n = 0; n < 90; n++) {
              var rx = ((seed * 37 + n * 61) % 256), ry = ((seed * 53 + n * 29) % 256), rr = 5 + ((seed + n * 13) % 26);
              var rg = g.createRadialGradient(rx, ry, 0, rx, ry, rr);
              rg.addColorStop(0, 'rgba(255,255,255,.12)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
              g.fillStyle = rg; g.beginPath(); g.arc(rx, ry, rr, 0, 7); g.fill();
            }
            var t = new THREE.CanvasTexture(c);
            t.wrapS = THREE.RepeatWrapping;
            return t;
          }

          var sys = new THREE.Group(); wm.scene.add(sys);
          var P_POS = [[-2.85, 1.0, 0.4, 0.86], [2.45, 1.4, -0.3, 0.72], [-1.5, -1.3, -0.5, 0.64], [2.3, -1.2, 0.5, 0.68]];
          var planets = [];
          NODES2.forEach(function (nd, pi) {
            var accent = new THREE.Color(nd.accent);
            var pg = new THREE.Group(); pg.position.fromArray(P_POS[pi]); sys.add(pg);
            var R0 = P_POS[pi][3];
            // 유리 형광 행성 — 반투명 본체 + 발광 코어 + 와이어 쉘 + 자이로 링
            var glassMat = new THREE.MeshPhongMaterial({ color: accent.clone().multiplyScalar(0.5), emissive: accent, emissiveIntensity: 0.25, transparent: true, opacity: 0.34, shininess: 160, specular: 0xffffff, map: planetSurfaceTex(nd.accent, pi + 3), depthWrite: false });
            var mesh = new THREE.Mesh(new THREE.SphereGeometry(R0, 48, 32), glassMat);
            mesh.userData.idx = pi; pg.add(mesh);
            var core = new THREE.Mesh(new THREE.SphereGeometry(R0 * 0.38, 16, 12), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85 }));
            pg.add(core);
            var shell = new THREE.Mesh(new THREE.IcosahedronGeometry(R0 * 1.22, 1), new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.3 }));
            pg.add(shell);
            var ring1 = new THREE.Mesh(new THREE.TorusGeometry(R0 * 1.45, 0.016, 8, 64), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5 }));
            ring1.rotation.x = Math.PI / 2.4; pg.add(ring1);
            var ring2 = new THREE.Mesh(new THREE.TorusGeometry(R0 * 1.62, 0.011, 8, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.24 }));
            ring2.rotation.x = -Math.PI / 3.2; ring2.rotation.y = 0.6; pg.add(ring2);
            var sats = new THREE.Group();
            for (var s3 = 0; s3 < 4; s3++) {
              var sat = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
              sat.userData.a0 = (s3 / 4) * Math.PI * 2; sat.userData.spd = 1.2 + s3 * 0.45; sat.userData.r = R0 * (1.45 + (s3 % 2) * 0.2);
              sats.add(sat);
            }
            pg.add(sats);
            var atmo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: accent, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
            atmo.scale.setScalar(R0 * 4.2); pg.add(atmo);
            var orbLine = (function () { var pts2 = []; for (var q = 0; q <= 60; q++) { var aa = q / 60 * Math.PI * 2; pts2.push(new THREE.Vector3(Math.cos(aa) * R0 * 1.9, 0, Math.sin(aa) * R0 * 1.9)); } return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.16 })); })();
            orbLine.position.y = -R0 - 0.32; pg.add(orbLine);
            var labelEl = null;
            if (labelHost) {
              labelEl = document.createElement('div');
              labelEl.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-50%);display:flex;align-items:center;gap:7px;padding:6px 12px 6px 8px;border-radius:14px;background:rgba(6,16,36,.78);backdrop-filter:blur(8px);border:1px solid ' + nd.accent + '66;box-shadow:0 6px 18px rgba(0,0,0,.45),0 0 12px ' + nd.accent + '22;white-space:nowrap;will-change:transform;transition:box-shadow .25s,border-color .25s';
              labelEl.innerHTML = '<span style="font-size:16px;filter:drop-shadow(0 0 5px ' + nd.accent + 'cc)">' + (P_ICONS[nd.id] || '🪐') + '</span>' +
                '<span style="display:flex;flex-direction:column;gap:1px">' +
                  '<span style="font-size:12.5px;font-weight:800;color:#F2F8FF;letter-spacing:.02em;text-shadow:0 1px 2px rgba(0,0,0,.7)">' + nd.label + '</span>' +
                  '<span style="font-size:9.5px;font-weight:700;color:' + nd.accent + '">' + metaTxt(nd.id) + '</span>' +
                '</span>';
              labelHost.appendChild(labelEl);
            }
            var selRing = null;
            if (pi === idx2) {
              selRing = new THREE.Mesh(new THREE.TorusGeometry(R0 * 1.38, 0.02, 8, 64), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.7 }));
              selRing.rotation.x = Math.PI / 2.25; pg.add(selRing);
            }
            planets.push({ g: pg, mesh: mesh, core: core, shell: shell, ring1: ring1, ring2: ring2, sats: sats, glassMat: glassMat, labelEl: labelEl, atmo: atmo, selRing: selRing, baseR: R0, hovered: false, scl: pi === idx2 ? 1.1 : 1, accent: accent, accentCss: nd.accent, labY: R0 + 0.72 });
          });

          // 행성 간 광선 연결 — 가산 블렌딩 라인 + 흐르는 광 입자 (4행성 순환 고리)
          var edges = [];
          function linkPlanets(a, b) {
            var pa = new THREE.Vector3().fromArray(P_POS[a]), pb = new THREE.Vector3().fromArray(P_POS[b]);
            var mid = pa.clone().lerp(pb, 0.5).add(new THREE.Vector3(0, 0.35, 0.3));
            var curve3 = new THREE.QuadraticBezierCurve3(pa, mid, pb);
            var lineGeo3 = new THREE.BufferGeometry().setFromPoints(curve3.getPoints(40));
            var line3 = new THREE.Line(lineGeo3, new THREE.LineBasicMaterial({ color: 0x7ADCFF, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
            sys.add(line3);
            var FN2 = 10, fArr = new Float32Array(FN2 * 3), fProg = [];
            for (var f0 = 0; f0 < FN2; f0++) fProg.push(Math.random());
            var fGeo = new THREE.BufferGeometry(); fGeo.setAttribute('position', new THREE.BufferAttribute(fArr, 3));
            var fPts = new THREE.Points(fGeo, new THREE.PointsMaterial({ color: 0xBDEBFF, size: 0.14, map: softTex, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
            sys.add(fPts);
            edges.push({ curve: curve3, arr: fArr, geo: fGeo, prog: fProg, N: FN2, line: line3 });
          }
          linkPlanets(0, 1); linkPlanets(1, 2); linkPlanets(2, 3); linkPlanets(3, 0); linkPlanets(0, 2);

          var ray2 = new THREE.Raycaster(), m2 = new THREE.Vector2(-9, -9);
          function setPtr2(ev) { var r = wmHost.getBoundingClientRect(); m2.x = ((ev.clientX - r.left) / r.width) * 2 - 1; m2.y = -((ev.clientY - r.top) / r.height) * 2 + 1; }
          function pickIdx2() {
            ray2.setFromCamera(m2, wcam);
            var hits = ray2.intersectObjects(planets.map(function (p) { return p.mesh; }), false);
            return hits.length ? hits[0].object.userData.idx : null;
          }
          wmHost.addEventListener('mousemove', setPtr2);
          wmHost.addEventListener('click', function (ev) {
            setPtr2(ev);
            var i = pickIdx2();
            if (i != null) GS.screens.home.go(i);
          });

          wm.onUpdate(function (dt, t) {
            milky.rotation.y += dt * 0.015;
            stars.rotation.y -= dt * 0.006;
            flowGrp.rotation.y -= dt * 0.012;

            for (var fi2 = 0; fi2 < FLOW_N; fi2++) {
              var fs2 = flowSeed[fi2];
              fs2.a += dt * fs2.sp * (1.9 - fs2.r * 0.11);
              fs2.r -= dt * 0.055 * (fs2.r > 3.4 ? 1 : -1.6);
              if (fs2.r < 3.1) { fs2.r = 9.5; fs2.a = Math.random() * Math.PI * 2; }
              if (fs2.r > 9.8) { fs2.r = 3.2; fs2.a = Math.random() * Math.PI * 2; }
              flowArr[fi2 * 3] = Math.cos(fs2.a) * fs2.r;
              flowArr[fi2 * 3 + 1] = fs2.y + Math.sin(t * 0.7 + fs2.ph) * 0.12;
              flowArr[fi2 * 3 + 2] = Math.sin(fs2.a) * fs2.r * 0.9;
            }
            flowGeo.attributes.position.needsUpdate = true;
            coreGlow.material.opacity = 0.42 + Math.sin(t * 0.8) * 0.12;
            coreGlow.scale.set(7 + Math.sin(t * 0.6) * 0.5, 4.6 + Math.sin(t * 0.7) * 0.3, 1);

            meteor.t += dt;
            if (meteor.t >= 90) {
              if (meteor.t > 90 + 3.2) meteor.t = 0;
              meteor.head.material.opacity = 0; meteor.line.material.opacity = 0;
            } else if (meteor.t < meteor.dur) {
              if (meteor.t < dt * 2) {
                meteor.from.set(-14 + Math.random() * 6, 5 + Math.random() * 4, -6 - Math.random() * 5);
                meteor.to.set(meteor.from.x + 12 + Math.random() * 6, meteor.from.y - 6 - Math.random() * 3, meteor.from.z + 4);
              }
              var mp2 = meteor.t / meteor.dur;
              var hx = meteor.from.x + (meteor.to.x - meteor.from.x) * mp2;
              var hy = meteor.from.y + (meteor.to.y - meteor.from.y) * mp2;
              var hz = meteor.from.z + (meteor.to.z - meteor.from.z) * mp2;
              meteor.head.position.set(hx, hy, hz);
              meteor.head.material.opacity = Math.sin(mp2 * Math.PI) * 0.95;
              var lArr = meteor.line.geometry.attributes.position.array;
              for (var mi2 = 0; mi2 < 18; mi2++) {
                var tt = Math.max(0, mp2 - mi2 * 0.028);
                lArr[mi2 * 3] = meteor.from.x + (meteor.to.x - meteor.from.x) * tt;
                lArr[mi2 * 3 + 1] = meteor.from.y + (meteor.to.y - meteor.from.y) * tt;
                lArr[mi2 * 3 + 2] = meteor.from.z + (meteor.to.z - meteor.from.z) * tt;
              }
              meteor.line.geometry.attributes.position.needsUpdate = true;
              meteor.line.material.opacity = Math.sin(mp2 * Math.PI) * 0.5;
            } else { meteor.t = 90; }

            var hovIdx = pickIdx2();
            wmHost.style.cursor = hovIdx != null ? 'pointer' : 'default';

            planets.forEach(function (p, pi) {
              p.hovered = pi === hovIdx;
              if (p.pop == null) p.pop = 0;          // 첫 프레임 undefined * 1 = NaN 방지
              if (p.hovered && !p.wasHot) p.pop = 1;      // 호버 진입 순간 타이틀 2배 팝
              p.wasHot = p.hovered;
              if (p.pop > 0) p.pop = Math.max(0, p.pop - dt * 2.6);
              var tgt = pi === idx2 ? 1.1 : 1;
              if (p.hovered) tgt *= 1.18;
              p.scl += (tgt - p.scl) * Math.min(1, dt * 9);
              p.mesh.scale.setScalar(p.scl);
              p.glassMat.emissiveIntensity = p.hovered ? 0.9 : 0.22 + Math.sin(t * 1.6 + pi * 1.7) * 0.06;
              p.glassMat.opacity = p.hovered ? 0.5 : 0.32;
              p.glassMat.color.copy(p.hovered ? new THREE.Color(0xffffff) : p.accent.clone().multiplyScalar(0.5));
              p.core.material.opacity = p.hovered ? 1 : 0.6 + Math.sin(t * 2.4 + pi) * 0.25;
              p.core.scale.setScalar(p.hovered ? 1.2 : 1 + Math.sin(t * 2.4 + pi) * 0.1);
              p.shell.rotation.y += dt * (p.hovered ? 1.4 : 0.35);
              p.shell.rotation.x += dt * 0.12;
              p.ring1.rotation.z += dt * (p.hovered ? 2.0 : 0.8);
              p.ring2.rotation.z -= dt * (p.hovered ? 1.5 : 0.5);
              p.atmo.material.opacity = p.hovered ? 0.55 : 0.3;
              if (p.selRing) { p.selRing.material.opacity = 0.45 + Math.sin(t * 2.4) * 0.3; p.selRing.rotation.z += dt * 0.8; }
              if (p.labelEl) {
                var v3 = p.g.position.clone(); v3.y -= p.labY;
                v3.project(wcam);
                var hw = wmHost.clientWidth || 1, hh = wmHost.clientHeight || 1;
                var sx = (v3.x * 0.5 + 0.5) * hw, sy = (-v3.y * 0.5 + 0.5) * hh;
                var vis = v3.z < 1 && sx > -70 && sx < hw + 70 && sy > -40 && sy < hh + 40;
                p.labelEl.style.display = vis ? 'flex' : 'none';
                if (vis) {
                  var lm = 1 + p.pop * 0.22 + (p.hovered ? 0.08 : 0);
                  p.labelEl.style.transform = 'translate(-50%,-50%) translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) scale(' + lm.toFixed(3) + ')';
                  p.labelEl.style.opacity = p.hovered ? '1' : '0.9';
                  p.labelEl.style.borderColor = p.hovered ? p.accentCss : p.accentCss + '66';
                  p.labelEl.style.boxShadow = p.hovered ? '0 8px 24px rgba(0,0,0,.5),0 0 18px ' + p.accentCss + '55' : '0 6px 18px rgba(0,0,0,.45),0 0 12px ' + p.accentCss + '22';
                }
              }
              p.sats.children.forEach(function (sat) {
                var a = sat.userData.a0 + t * sat.userData.spd;
                sat.position.set(Math.cos(a) * sat.userData.r, Math.sin(a * 1.3) * 0.22, Math.sin(a) * sat.userData.r);
              });
            });
            edges.forEach(function (e2, ei2) {
              e2.line.material.opacity = 0.28 + Math.sin(t * 1.8 + ei2) * 0.12;
              for (var f2 = 0; f2 < e2.N; f2++) {
                e2.prog[f2] += dt * (0.16 + (f2 % 3) * 0.07);
                if (e2.prog[f2] > 1) e2.prog[f2] -= 1;
                var pv = e2.curve.getPoint(e2.prog[f2]);
                e2.arr[f2 * 3] = pv.x; e2.arr[f2 * 3 + 1] = pv.y; e2.arr[f2 * 3 + 2] = pv.z;
              }
              e2.geo.attributes.position.needsUpdate = true;
            });
          });
        })();
      }
    });
  }

  function causalOverlay(m) {
    var isBad = m.inflammation >= 50;
    var gutCol = isBad ? ui.T.red : ui.T.green;
    var brainCol = m.dopamine < 40 ? ui.T.red : ui.T.amber;
    return '<div style="position:absolute;left:16px;bottom:16px;z-index:2;text-align:left;opacity:.65"><div style="font-size:11px;color:' + gutCol + ';font-weight:700">🧬 장 · ' + (isBad ? '염증' : '안정') + '</div></div>' +
      '<div style="position:absolute;right:16px;bottom:16px;z-index:2;text-align:right;opacity:.65"><div style="font-size:11px;color:' + brainCol + ';font-weight:700">🧠 뇌 · ' + (m.dopamine >= 70 ? '생기' : m.dopamine >= 30 ? '둔감' : '탈진') + '</div></div>';
  }

  function worldMap3D() {
    var NODES = GS.nav.NODES;
    var idx = 0;
    var cur = GS.store.nav.get();
    if (cur !== 'home') for (var i = 0; i < NODES.length; i++) if (NODES[i].id === cur) { idx = i; break; }
    return ui.panel(
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' + ui.stageTag('Gut World') + '</div>' +
      '<div id="worldmap3d" style="position:relative;width:100%;height:300px;border-radius:14px;overflow:hidden;background:radial-gradient(ellipse at 30% 15%, rgba(55,199,255,.07), rgba(4,10,24,.72) 75%)">' +
        '<div id="wmLabels" style="position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden"></div>' +
      '</div>',
      { pad: '10px' });
  }

  function render() {
    var m = GS.store.coreMetrics();
    var score = GS.store.gutScore();
    var lvl = GS.store.xp.level();
    var ctx = { metrics: m, foods: GS.store.diet.foodsToday(), streak: GS.store.streak().days, alerts: GS.store.alerts.active().length, questDone: GS.store.quests.done().length, resetActive: GS.store.reset.status().active, resetHours: GS.store.reset.status().hours };

    var hud = '<div style="position:relative;z-index:2;padding:calc(env(safe-area-inset-top,0px) + 58px) 16px 6px">' +
      '<div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;padding-right:150px">' +
        '<div class="h1" style="font-size:22px;color:#fff;text-shadow:0 0 14px rgba(55,199,255,.6)">GutSense<span style="color:var(--cyan)">.</span></div>' +
        ui.levelBadge(lvl.level, D.titleFor(lvl.level)) + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><span class="micro" style="color:var(--cyan2)">' + ui.star() + ' 종합 장 건강</span><div style="display:flex;align-items:center;gap:8px">' + ui.weatherBadge(m.inflammation) + '<span class="num" style="color:' + (score > 65 ? ui.T.green : score > 40 ? ui.T.amber : ui.T.red) + ';font-size:16px">' + score + '<span style="font-size:11px;color:var(--ink-dim)">/100</span></span></div></div>' +
      '<div style="height:6px;border-radius:3px;background:rgba(122,220,255,.1);overflow:hidden;margin-bottom:4px"><div style="height:100%;width:' + score + '%;background:linear-gradient(90deg,' + (score > 65 ? ui.T.green + ',' + ui.T.cyan : score > 40 ? ui.T.amber + ',' + ui.T.cyan : ui.T.red + ',' + ui.T.orange) + ');border-radius:3px;box-shadow:0 0 8px ' + (score > 65 ? ui.T.green : score > 40 ? ui.T.amber : ui.T.red) + '66;transition:width .6s"></div></div>' +
    '</div>';

    var drjang = '<div style="position:relative;z-index:2;padding:6px 16px">' + GS.drjang.renderSmart(ctx, { size: 88 }) + '</div>';
    var reset = GS.store.reset.status();
    var prof = GS.store.profile.get() || {};
    var resetMood = reset.complete ? 'bigSmile' : (reset.noSugar ? 'sweat' : 'cry');
    var resetMoodCap = reset.complete ? '완료!' : (reset.noSugar ? '땀 흘리며 진행 중' : '가당 감지 · 우는 중');
    var resetCard = reset.active
      ? ui.panel(
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><div style="width:44px;height:44px;border-radius:14px;background:rgba(169,140,255,.14);border:1.5px solid rgba(169,140,255,.45);display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 14px rgba(123,97,255,.3);animation:bob 2s infinite">' + GS.chars.avatarFace(prof.avatar, resetMood, 36) + '</div><div style="flex:1"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:13px;color:#C9B6FF;font-weight:700">장 리셋 챌린지</span><span style="font-size:12px;animation:gs-twinkle 1.6s ease-in-out infinite;display:inline-block">✨</span><span style="display:inline-flex;align-items:center;gap:4px;font-size:9px;color:#C9B6FF;background:rgba(169,140,255,.16);border:1px solid rgba(169,140,255,.45);padding:2px 8px;border-radius:999px"><span style="width:5px;height:5px;border-radius:50%;background:#A98CFF;box-shadow:0 0 6px #A98CFF;animation:blink 1.1s infinite"></span>' + resetMoodCap + '</span></div><div class="micro">' + prof.name + ' · ' + reset.hours + '시간/48시간 진행 중.. · 무가당·무감미료로 장벽 균열 아물히는 중</div></div><div class="num" style="font-size:18px;color:var(--cyan)">' + reset.hours + '<span style="font-size:10px;color:var(--ink-dim)">h</span></div></div>' +
          '<div style="position:relative;display:flex;gap:1px;height:8px;margin-bottom:6px;border-radius:4px;overflow:hidden">' + (function () { var s = ''; for (var i = 0; i < 48; i++) { s += '<div style="flex:1;background:' + (i < reset.hours ? 'linear-gradient(180deg,#A98CFF,#7B61FF)' : 'rgba(169,140,255,.12)') + (i < reset.hours ? ';box-shadow:0 0 3px #A98CFF' : '') + '"></div>'; } return s; })() +
            '<div style="position:absolute;top:0;bottom:0;left:0;width:' + Math.round(reset.hours / 48 * 100) + '%;overflow:hidden;border-radius:4px;pointer-events:none"><div style="position:absolute;inset:0;background:linear-gradient(100deg,transparent 25%,rgba(255,255,255,.5) 50%,transparent 75%);background-size:200% 100%;animation:gs-shimmer 2s linear infinite"></div></div></div>' +
          '<div style="display:flex;justify-content:space-between;font-size:10px"><span style="color:var(--ink-dim)">🔥 ' + reset.hours + '시간/48시간 진행 중..</span><span style="color:' + ui.T.cyan + '">미션 ' + reset.quests + '/' + D.RESET_CHALLENGE.requireQuests + ' · ' + (reset.noSugar ? '✓ 무가당' : '⚠ 가당') + '</span></div>',
          { glow: true })
      : '<div onclick="GS.screens.home.startReset()" style="cursor:pointer">' + ui.panel(
          '<div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,var(--violet),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 14px rgba(123,97,255,.3);animation:bob 2s infinite">✨</div>' +
          '<div style="flex:1"><div style="font-size:13px;color:#C9B6FF;font-weight:700">장-뇌 축 48시간 리셋 챌린지</div><div class="micro">무가당·무감미료 48시간 + 미션 ' + D.RESET_CHALLENGE.requireQuests + '개 → 장벽 균열 아물고 도파민 회복 상한선 해제</div></div>' +
          '<div style="color:#C9B6FF;font-size:12px;white-space:nowrap">시작 ›</div></div>',
          { glow: true }) + '</div>';

    return '<div style="position:absolute;inset:0">' +
      '<div id="home3d" style="position:absolute;inset:0;z-index:0"></div>' +
      '<div style="position:relative;z-index:1">' + hud + drjang +
      '<div style="position:relative;z-index:2;padding:0 16px">' + worldMap3D() + '<div style="height:8px"></div>' + resetCard +
      '<div class="micro" style="text-align:center;padding:12px 0 calc(env(safe-area-inset-bottom,0px) + 14px);opacity:.6">BIO-TWIN ENGINE · 실시간 동기화</div></div></div></div>';
  }
  function go(i) { var n = GS.nav.NODES[i]; if (!n) return; if (GS.fx2) GS.fx2.screenFlash('rgba(55,199,255,.15)'); ui.toast('🎮 ' + n.label + ' 이동', 'info'); setTimeout(function () { GS.nav.go(n.id); }, 200); }
  function startReset() { GS.store.reset.start(); ui.toast('48시간 리셋 시작! 🧬', 'success'); if (GS.fx2) GS.fx2.screenFlash('rgba(169,140,255,.2)'); GS.nav.render(); }

  GS.screens.home = render;
  GS.screens.home.go = go;
  GS.screens.home.startReset = startReset;
})();
