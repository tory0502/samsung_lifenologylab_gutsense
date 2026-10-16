/* GutSense www3 — cute kawaii character library. Big glossy eyes, soft
 * rounded bodies, rosy cheeks, bioluminescent pastel palette. Every character
 * floats/bobs gently. Exposed as window.GS.chars.
 * Characters: drJang · dopamine · gutMascot · microbe · lps · scfa
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var C = (window.GS_DATA && window.GS_DATA.C) || {};

  function inject() {
    if (document.getElementById('gs3-char-style')) return;
    var s = document.createElement('style'); s.id = 'gs3-char-style';
    s.textContent =
    '@keyframes chFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
      '@keyframes chBob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-3px) rotate(2deg)}}' +
      '@keyframes chBlink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}' +
      '@keyframes chPulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.85;transform:scale(1.08)}}' +
      '@keyframes chSquish{0%,100%{transform:scale(1,1)}50%{transform:scale(1.04,.96)}}' +
      '@keyframes djAura{0%,100%{box-shadow:0 0 14px 3px rgba(55,199,255,.35),0 0 34px 8px rgba(55,199,255,.16)}50%{box-shadow:0 0 22px 6px rgba(122,220,255,.6),0 0 48px 14px rgba(55,199,255,.3)}}' +
      '@keyframes djAuraSpin{to{transform:rotate(360deg)}}' +
      '@keyframes djBtnPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}' +
      '@keyframes djVortex{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.25);opacity:.35}}' +
      '@keyframes djSweat{0%{transform:translateY(0);opacity:0}25%{opacity:1}100%{transform:translateY(9px);opacity:0}}' +
      '.ch{transform-origin:center bottom;display:inline-block}' +
      '.ch-float{animation:chFloat 3.2s ease-in-out infinite}' +
      '.ch-bob{animation:chBob 2.6s ease-in-out infinite}' +
      '.ch-eye{transform-origin:center;transform-box:fill-box;animation:chBlink 5s infinite}' +
      '.ch-aura{animation:chPulse 3s ease-in-out infinite;transform-origin:center;transform-box:fill-box}' +
      '.dj-aura{position:absolute;inset:-9px;border-radius:50%;pointer-events:none;animation:djAura 1.9s ease-in-out infinite}' +
      '.dj-aura::before{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px dashed rgba(122,220,255,.5);animation:djAuraSpin 9s linear infinite}' +
      '.dj-aura::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px dotted rgba(169,140,255,.4);animation:djAuraSpin 13s linear infinite reverse}';
    document.head.appendChild(s);
  }

  // big glossy eye pair centered at (cx,cy), radius r
  function eyes(cx, cy, r, dx, col) {
    dx = dx || 11;
    return '<g class="ch-eye">' +
      '<ellipse cx="' + (cx - dx) + '" cy="' + cy + '" rx="' + r + '" ry="' + (r * 1.12) + '" fill="' + (col || '#15243F') + '"/>' +
      '<ellipse cx="' + (cx + dx) + '" cy="' + cy + '" rx="' + r + '" ry="' + (r * 1.12) + '" fill="' + (col || '#15243F') + '"/>' +
      '<circle cx="' + (cx - dx + r * 0.4) + '" cy="' + (cy - r * 0.4) + '" r="' + (r * 0.42) + '" fill="#fff"/>' +
      '<circle cx="' + (cx + dx + r * 0.4) + '" cy="' + (cy - r * 0.4) + '" r="' + (r * 0.42) + '" fill="#fff"/>' +
      '<circle cx="' + (cx - dx - r * 0.25) + '" cy="' + (cy + r * 0.45) + '" r="' + (r * 0.2) + '" fill="#fff" opacity=".7"/>' +
      '<circle cx="' + (cx + dx - r * 0.25) + '" cy="' + (cy + r * 0.45) + '" r="' + (r * 0.2) + '" fill="#fff" opacity=".7"/>' +
    '</g>';
  }
  function cheeks(cx, cy, dx, col) { col = col || '#FF8FA8'; return '<ellipse cx="' + (cx - dx) + '" cy="' + cy + '" rx="5" ry="3" fill="' + col + '" opacity=".55"/><ellipse cx="' + (cx + dx) + '" cy="' + cy + '" rx="5" ry="3" fill="' + col + '" opacity=".55"/>'; }
  function aura(r, col) { return '<circle class="ch-aura" cx="0" cy="0" r="' + r + '" fill="' + col + '" opacity=".22"/>'; }

  // ===== Dr.장 — cute chibi gut-doctor with intestine-themed coat + colon emblem.
  // Poses: welcome/warn/cheer/celebrate/explain. UPGRADE: 더 장 같은 느낌.
  var POSES = {
    welcome: { mouth: 'smile', accent: '#37C7FF' },
    warn: { mouth: 'flat', accent: '#FF5C7A' },
    cheer: { mouth: 'smile', accent: '#27D89B' },
    celebrate: { mouth: 'bigSmile', accent: '#A98CFF' },
    explain: { mouth: 'talk', accent: '#7ADCFF' }
  };
  function mouthAt(cx, cy, kind) {
    var st = '#243352';
    if (kind === 'smile') return '<path d="M' + (cx - 9) + ',' + cy + ' Q' + cx + ',' + (cy + 9) + ' ' + (cx + 9) + ',' + cy + '" stroke="' + st + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    if (kind === 'bigSmile') return '<path d="M' + (cx - 9) + ',' + (cy - 2) + ' Q' + cx + ',' + (cy + 11) + ' ' + (cx + 9) + ',' + (cy - 2) + ' Q' + cx + ',' + (cy + 3) + ' ' + (cx - 9) + ',' + (cy - 2) + ' Z" fill="' + st + '"/><path d="M' + (cx - 5) + ',' + (cy + 4) + ' Q' + cx + ',' + (cy + 8) + ' ' + (cx + 5) + ',' + (cy + 4) + '" fill="#FF7A93"/>';
    if (kind === 'flat') return '<path d="M' + (cx - 8) + ',' + (cy + 3) + ' L' + (cx + 8) + ',' + (cy + 3) + '" stroke="' + st + '" stroke-width="2.8" stroke-linecap="round"/>';
    if (kind === 'talk') return '<ellipse cx="' + cx + '" cy="' + (cy + 2) + '" rx="4.5" ry="3.6" fill="' + st + '"/>';
    if (kind === 'shock') return '<ellipse cx="' + cx + '" cy="' + (cy + 2) + '" rx="6" ry="7.5" fill="' + st + '"/><ellipse cx="' + cx + '" cy="' + (cy + 5) + '" rx="3" ry="3" fill="#FF7A93"/>';
    return '';
  }
  function drJang(pose, size, opts) {
    inject();
    size = size || 86;
    opts = opts || {};
    var _av = '';
    try { _av = ((GS.store && GS.store.profile && GS.store.profile.get()) || {}).avatar || ''; } catch (e) {}
    var cross = _av === 'jd' ? '' :
      '<div style="position:absolute;left:50%;top:-9%;width:' + Math.round(size * 0.30) + 'px;height:' + Math.round(size * 0.30) + 'px;transform:translateX(-50%);animation:gs-crossBounce 1.1s cubic-bezier(.5,0,.5,1) infinite">' +
      '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(0deg);width:100%;height:100%;filter:drop-shadow(0 0 6px rgba(46,213,115,.8))">' +
        '<div style="position:absolute;left:38%;top:0;width:24%;height:100%;background:linear-gradient(180deg,#5EFFA8,#2ED573);border-radius:3px"></div>' +
        '<div style="position:absolute;top:38%;left:0;height:24%;width:100%;background:linear-gradient(90deg,#5EFFA8,#2ED573);border-radius:3px"></div>' +
      '</div></div>';
    var clickBtn = '<div style="position:absolute;left:50%;top:87%;transform:translate(-50%,-50%);width:' + Math.round(size * 0.44) + 'px;height:' + Math.round(size * 0.44) + 'px;z-index:3;pointer-events:none">' +
      '<div style="position:absolute;inset:-26%;border-radius:50%;background:radial-gradient(circle,rgba(55,199,255,.55),rgba(55,199,255,0) 70%);animation:djVortex 1.6s ease-in-out infinite"></div>' +
      '<div style="position:absolute;inset:-14%;border-radius:50%;border:2px solid rgba(122,220,255,.75);border-top-color:transparent;border-bottom-color:transparent;animation:djAuraSpin 1.2s linear infinite"></div>' +
      '<div style="position:absolute;inset:-8%;border-radius:50%;border:1.5px dashed rgba(169,140,255,.6);animation:djAuraSpin 2.6s linear infinite reverse"></div>' +
      '<div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 35% 30%,#BFF0FF,#37C7FF 55%,#0E5E9E);box-shadow:0 0 14px rgba(55,199,255,.85),inset 0 -3px 6px rgba(4,32,64,.55),inset 0 2px 4px rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;animation:djBtnPulse 1.4s ease-in-out infinite">' +
        '<span style="font-size:' + Math.max(8, Math.round(size * 0.13)) + 'px;font-weight:900;color:#032341;letter-spacing:.5px;text-shadow:0 1px 0 rgba(255,255,255,.6);font-family:Orbitron,monospace">Click</span>' +
      '</div></div>';
    if (opts.noClick) clickBtn = '';
    return '<div class="ch ch-float" data-gs-lab="1" style="position:relative;width:' + size + 'px;height:' + Math.round(size * 1.25) + 'px;cursor:pointer">' + cross + clickBtn + '<div class="dj-aura"></div>' +
      '<div style="position:relative;z-index:2">' + drJangSVG(pose, size) + '</div></div>';
  }

  function drJangSVG(pose, size) {
    size = size || 86;
    var P = POSES[pose] || POSES.explain, a = P.accent;
    var _av = '';
    try { _av = ((GS.store && GS.store.profile && GS.store.profile.get()) || {}).avatar || ''; } catch (e) {}
    var mouthKind = P.mouth;
    if (_av === 'jd') mouthKind = 'shock';
    else if (_av === 'yjs') mouthKind = 'bigSmile';
    var decor = '';
    if (_av === 'jd') {
      decor = '<path d="M38,16 L33,2 L46,10 Z" fill="#E23A4E" stroke="#8A1224" stroke-width="1"/>' +
        '<path d="M82,16 L87,2 L74,10 Z" fill="#E23A4E" stroke="#8A1224" stroke-width="1"/>' +
        '<g transform="translate(60,-4)"><circle r="13" fill="none" stroke="#FF3B4E" stroke-width="1.4" opacity=".5"><animate attributeName="r" values="7;13" dur="0.9s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0" dur="0.9s" repeatCount="indefinite"/></circle>' +
          '<circle r="10" fill="none" stroke="#3B6CFF" stroke-width="1.2" opacity=".4"><animate attributeName="r" values="6;11" dur="0.9s" begin="0.45s" repeatCount="indefinite"/><animate attributeName="opacity" values=".5;0" dur="0.9s" begin="0.45s" repeatCount="indefinite"/></circle>' +
          '<ellipse rx="7" ry="4.5" fill="#2A3550"/>' +
          '<ellipse rx="5.5" ry="3.4" fill="#FF3B4E"><animate attributeName="fill" values="#FF3B4E;#3B6CFF;#FF3B4E" dur="0.9s" repeatCount="indefinite"/></ellipse>' +
        '</g>' +
        '<g stroke="#5EC8F8" stroke-width="1.6" fill="#8FDFFF" stroke-linecap="round">' +
          '<path d="M39,27 q2.2,4.5 0,6.5 q-2.6,-2.5 0,-6.5"><animateTransform attributeName="transform" type="translate" values="0 0;0 8" dur="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.1s" repeatCount="indefinite"/></path>' +
          '<path d="M81,27 q2.2,4.5 0,6.5 q-2.6,-2.5 0,-6.5"><animateTransform attributeName="transform" type="translate" values="0 0;0 8" dur="1.1s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.1s" begin="0.5s" repeatCount="indefinite"/></path>' +
          '<path d="M60,24 q1.8,3.8 0,5.6 q-2.2,-2.2 0,-5.6"><animateTransform attributeName="transform" type="translate" values="0 0;0 7" dur="1.3s" begin="0.25s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.3s" begin="0.25s" repeatCount="indefinite"/></path>' +
        '</g>' +
        '<path d="M88,30 q3,4 0,8 q-3,-4 0,-8" fill="#7ADCFF" opacity=".9"/>';
    } else if (_av === 'yjs') {
      decor = '<text x="8" y="14" font-size="12"><animate attributeName="opacity" values="1;.2;1" dur="1.4s" repeatCount="indefinite">✨</animate></text>' +
        '<text x="102" y="46" font-size="10"><animate attributeName="opacity" values=".3;1;.3" dur="1.8s" repeatCount="indefinite">✨</animate></text>';
    }
    var body =
      '<path d="M30,150 Q30,86 60,80 Q90,86 90,150 Z" fill="#EAF6FF" stroke="#7AC4F2" stroke-width="1.2"/>' +
      '<path d="M60,80 L60,150" stroke="#7AC4F2" stroke-width="1"/>' +
      '<path d="M45,90 Q60,85 75,90 L73,99 Q60,94 47,99 Z" fill="' + a + '" opacity=".85"/>' +
      '<path d="M51,93 Q45,107 51,119" fill="none" stroke="#3A4A66" stroke-width="2"/><circle cx="51" cy="121" r="3.6" fill="#3A4A66"/>' +
      '<g transform="translate(60,112)">' +
        '<circle r="11" fill="' + a + '" opacity=".18"/>' +
        '<path d="M-5,-2 Q-2,-5 1,-2 Q4,-5 5,-2 Q4,1 1,3 Q-2,1 -5,-2 Z" fill="none" stroke="' + a + '" stroke-width="1.6"/>' +
        '<path d="M-3,0 Q0,2 3,0" fill="none" stroke="' + a + '" stroke-width="1.2"/>' +
      '</g>';
    var head =
      '<defs><radialGradient id="djSkin3" cx="42%" cy="34%" r="72%"><stop offset="0%" stop-color="#FFF2E8"/><stop offset="100%" stop-color="#FFD9C0"/></radialGradient></defs>' +
      '<circle cx="60" cy="42" r="27" fill="url(#djSkin3)" stroke="#2A3550" stroke-width="1.2"/>' +
      '<path d="M34,35 Q38,11 60,11 Q83,11 86,35 Q79,22 60,21 Q41,22 34,35 Z" fill="#1E3A5F"/>' +
      '<rect x="41" y="20" width="38" height="6" rx="3" fill="#0B1E3F" opacity=".5"/>' +
      '<circle cx="50" cy="23" r="4.2" fill="' + a + '" opacity=".85" stroke="' + a + '" stroke-width="1"/><circle cx="70" cy="23" r="4.2" fill="' + a + '" opacity=".85" stroke="' + a + '" stroke-width="1"/>' +
      '<circle cx="51" cy="22" r="1.2" fill="#fff" opacity=".9"/><circle cx="71" cy="22" r="1.2" fill="#fff" opacity=".9"/>' +
      '<line x1="60" y1="13" x2="60" y2="5" stroke="#1E3A5F" stroke-width="1.6"/>' +
      '<g transform="translate(60,3)"><path d="M-4,-2 Q0,-5 4,-2 Q2,1 0,3 Q-2,1 -4,-2 Z" fill="' + a + '" opacity=".9"/><circle cx="0" cy="-1" r="1.2" fill="#fff" opacity=".7"/><animate attributeName="opacity" values=".6;1;.6" dur="1.8s" repeatCount="indefinite"/></g>' +
      eyes(60, 44, 5, 11) +
      cheeks(60, 53, 17, '#FF8FA8') +
      mouthAt(60, 58, mouthKind) + decor;
    var arm = '<path d="M84,92 Q97,84 100,70" fill="none" stroke="#EAF6FF" stroke-width="10" stroke-linecap="round"/><circle cx="100" cy="69" r="6.5" fill="url(#djSkin3)" stroke="#2A3550" stroke-width="1.1"/>' +
      '<line x1="101" y1="68" x2="123" y2="34" stroke="#C99A62" stroke-width="3.6" stroke-linecap="round"/>' +
      '<line x1="101" y1="68" x2="105" y2="62" stroke="#8A6238" stroke-width="3.6" stroke-linecap="round"/>' +
      '<circle cx="123" cy="34" r="2.6" fill="#C99A62" stroke="#8A6238" stroke-width=".8"/>';
    var leftArm = pose === 'celebrate'
      ? '<g style="transform-origin:36px 92px;transform-box:fill-box;animation:chBob .6s ease-in-out infinite reverse"><path d="M36,92 Q23,84 20,70" fill="none" stroke="#EAF6FF" stroke-width="10" stroke-linecap="round"/><circle cx="20" cy="69" r="6" fill="url(#djSkin3)" stroke="#2A3550" stroke-width="1.1"/></g>'
      : '<path d="M36,92 Q26,104 25,122" fill="none" stroke="#EAF6FF" stroke-width="10" stroke-linecap="round"/><circle cx="25" cy="123" r="6" fill="url(#djSkin3)" stroke="#2A3550" stroke-width="1.1"/>';
    var neck = '<path d="M52,64 L52,78 Q60,82 68,78 L68,64 Q60,68 52,64 Z" fill="#F2C39E" stroke="#2A3550" stroke-width="1"/>' +
      '<path d="M56,66 Q60,71 64,66" fill="none" stroke="#D9A87F" stroke-width="1.2"/>';
    return '<svg viewBox="0 0 120 150" width="' + size + '" height="' + Math.round(size * 1.25) + '" style="overflow:visible;filter:drop-shadow(0 8px 14px rgba(0,0,0,.32))">' +
      '<g class="ch ch-float">' + neck + head + body + leftArm + arm + '</g></svg>';
  }

  // ===== 도파민이 — reactive blob. mood from d: 70+ 생기 / 30-69 둔감 / <30 탈진 =====
  function dopamine(d, size) {
    inject(); size = size || 60;
    var st = d >= 70 ? { col: '#FFC44D', eye: 'spark', bob: 'chBob .6s ease-in-out infinite', parts: 14, opacity: 1 }
            : d >= 30 ? { col: '#7ADCFF', eye: 'flat', bob: 'chBob 1.6s ease-in-out infinite', parts: 5, opacity: .95 }
            : { col: '#5E7AA6', eye: 'sad', bob: 'none', parts: 0, opacity: .6 };
    var parts = '';
    for (var i = 0; i < st.parts; i++) { var ang = (i / st.parts) * Math.PI * 2, r = size * 0.42; parts += '<circle cx="' + (Math.cos(ang) * r).toFixed(1) + '" cy="' + (Math.sin(ang) * r).toFixed(1) + '" r="1.7" fill="' + st.col + '" opacity=".7"/>'; }
    var e = st.eye === 'spark' ? '<path d="M-7,-2 l2,-3 3,1 -1,-4 4,2 -2,-4" stroke="#243352" stroke-width="0" fill="#243352"/><circle cx="-6" cy="-1" r="2.4" fill="#243352"/><circle cx="6" cy="-1" r="2.4" fill="#243352"/><circle cx="-5.2" cy="-1.8" r=".9" fill="#fff"/><circle cx="6.8" cy="-1.8" r=".9" fill="#fff"/>'
          : st.eye === 'flat' ? '<line x1="-8" y1="-1" x2="-3" y2="-1" stroke="#243352" stroke-width="2"/><line x1="3" y1="-1" x2="8" y2="-1" stroke="#243352" stroke-width="2"/>'
          : '<path d="M-7,0 Q-5,-3 -3,0 M3,0 Q5,-3 7,0" stroke="#243352" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    var mouth = '<path d="M-4,5 Q0,' + (d >= 70 ? 9 : d >= 30 ? 5 : 3) + ' 4,5" stroke="#243352" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    return '<svg width="' + size + '" height="' + size + '" viewBox="-30 -30 60 60" style="overflow:visible">' +
      '<g class="ch" style="animation:' + st.bob + ';transform-origin:center">' +
        parts +
        '<circle cx="0" cy="0" r="16" fill="' + st.col + '" opacity="' + st.opacity + '"/>' +
        '<circle cx="0" cy="0" r="16" fill="none" stroke="#fff" stroke-width="1" opacity=".3"/>' +
        e + mouth +
      '</g></svg>';
  }

  // ===== 장구 (gut mascot) — cute pink stomach/organ blob, state: happy/warn/danger/recovered =====
  function scoreToColor(score) {
    var hue;
    if (score < 20) hue = score * 1.3;
    else if (score < 40) hue = 26 + (score - 20) * 1.9;
    else if (score < 60) hue = 64 + (score - 40) * 0.7;
    else if (score < 80) hue = 78 + (score - 60) * 1.9;
    else hue = 116 + (score - 80) * 1.2;
    hue = Math.max(0, Math.min(140, hue));
    var sat = 62 + Math.max(0, 20 - score * 0.15);
    var lit = 40 + Math.min(30, score * 0.3);
    var body = 'hsl(' + hue.toFixed(0) + ',' + sat.toFixed(0) + '%,' + lit.toFixed(0) + '%)';
    var aura = 'hsl(' + hue.toFixed(0) + ',' + Math.min(85, sat + 12) + '%,' + Math.max(30, lit - 18) + '%)';
    var stk = 'hsl(' + hue.toFixed(0) + ',' + sat.toFixed(0) + '%,' + Math.max(20, lit - 28) + '%)';
    return { body: body, aura: aura, stroke: stk };
  }

  function gutMascot(state, size, score) {
    inject(); size = size || 96;
    var S = { happy: { body: '#FF9DBE', aura: '#FF80B0', mouth: 'bigSmile' }, warn: { body: '#FFC44D', aura: '#FFC44D', mouth: 'flat' }, danger: { body: '#FF7A93', aura: '#FF5C7A', mouth: 'frown' }, recovered: { body: '#7ADCFF', aura: '#37C7FF', mouth: 'smile' } }[state] || { body: '#FF9DBE', aura: '#FF80B0', mouth: 'smile' };
    var stroke = '#E66B95';
    if (score != null) { var sc = scoreToColor(score); S.body = sc.body; S.aura = sc.aura; stroke = sc.stroke; }
    var cGood = score == null || score >= 45;
    var cFill = cGood ? '#FFD700' : '#7A6650';
    var cStk = cGood ? '#D4A800' : '#4A3A2A';
    var g1 = cGood ? '#37C7FF' : '#776655';
    var g2 = cGood ? '#27D89B' : '#665544';
    var g3 = cGood ? '#A98CFF' : '#887766';
    var g4 = cGood ? '#FFC44D' : '#998877';
    var jewel = cGood ? '#FF5C7A' : '#886655';
    var sp1 = cGood ? '#FFD700' : '#8B7355';
    var sp2 = cGood ? '#37C7FF' : '#776655';
    var sp3 = cGood ? '#A98CFF' : '#887766';
    var sp4 = cGood ? '#27D89B' : '#665544';
    var m = S.mouth === 'bigSmile' ? '<path d="M-8,2 Q0,12 8,2 Q0,7 -8,2 Z" fill="#243352"/><path d="M-4,6 Q0,9 4,6" fill="#FF7A93"/>'
          : S.mouth === 'flat' ? '<path d="M-6,5 L6,5" stroke="#243352" stroke-width="2.4" stroke-linecap="round"/>'
          : S.mouth === 'frown' ? '<path d="M-6,7 Q0,2 6,7" stroke="#243352" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
          : '<path d="M-7,4 Q0,10 7,4" stroke="#243352" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    return '<svg width="' + size + '" height="' + Math.round(size * 1.05) + '" viewBox="-50 -60 100 105" style="overflow:visible;filter:drop-shadow(0 8px 16px ' + S.aura + '55)">' +
      '<circle class="ch-aura" cx="0" cy="0" r="44" fill="' + S.aura + '" opacity=".18"/>' +
      '<g class="ch ch-float">' +
        // blobby organ body
        '<path d="M-38,-6 Q-44,-32 -18,-36 Q8,-40 30,-30 Q44,-18 40,6 Q36,30 12,36 Q-14,40 -32,28 Q-44,16 -38,-6 Z" fill="' + S.body + '" stroke="' + stroke + '" stroke-width="2"/>' +
        '<path d="M-30,-18 Q-20,-30 0,-30" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/>' +
        '<g transform="translate(0,-42)">' +
          '<rect x="-13" y="-2" width="26" height="5" rx="2" fill="' + cFill + '" stroke="' + cStk + '" stroke-width="1"/>' +
          '<path d="M-13,-2 L-10,-13 L-6,-4 L-3,-15 L0,-4 L3,-15 L6,-4 L10,-13 L13,-2 Z" fill="' + cFill + '" stroke="' + cStk + '" stroke-width="1"/>' +
          '<circle cx="-10" cy="-14" r="1.8" fill="' + g1 + '"/>' +
          '<circle cx="-3" cy="-16" r="2.2" fill="' + g2 + '"/>' +
          '<circle cx="3" cy="-16" r="2.2" fill="' + g3 + '"/>' +
          '<circle cx="10" cy="-14" r="1.8" fill="' + g4 + '"/>' +
          '<circle cx="0" cy="0.5" r="2.2" fill="' + jewel + '" stroke="#fff" stroke-width=".5"/>' +
          '<animateTransform attributeName="transform" type="translate" values="0,-42;0,-44;0,-42" dur="2s" repeatCount="indefinite"/>' +
        '</g>' +
        '<path d="M-34,-22 L-32,-26 L-30,-22 L-32,-18 Z" fill="' + sp1 + '" opacity=".7"><animate attributeName="opacity" values=".2;.9;.2" dur="1.5s" repeatCount="indefinite"/></path>' +
        '<path d="M32,-18 L34,-22 L36,-18 L34,-14 Z" fill="' + sp2 + '" opacity=".6"><animate attributeName="opacity" values=".1;.8;.1" dur="1.8s" repeatCount="indefinite" begin=".3s"/></path>' +
        '<path d="M-30,20 L-28,16 L-26,20 L-28,24 Z" fill="' + sp3 + '" opacity=".5"><animate attributeName="opacity" values=".1;.7;.1" dur="2s" repeatCount="indefinite" begin=".6s"/></path>' +
        '<path d="M30,24 L32,20 L34,24 L32,28 Z" fill="' + sp4 + '" opacity=".5"><animate attributeName="opacity" values=".1;.7;.1" dur="1.6s" repeatCount="indefinite" begin=".9s"/></path>' +   // shine
        // cute face
        '<g class="ch-eye"><circle cx="-13" cy="-6" r="5" fill="#243352"/><circle cx="15" cy="-6" r="5" fill="#243352"/><circle cx="-11" cy="-8" r="1.8" fill="#fff"/><circle cx="17" cy="-8" r="1.8" fill="#fff"/></g>' +
        '<ellipse cx="-22" cy="6" rx="5" ry="3" fill="#FF5C7A" opacity=".5"/><ellipse cx="24" cy="6" rx="5" ry="3" fill="#FF5C7A" opacity=".5"/>' +
        m +
      '</g></svg>';
  }

  // ===== microbe (beneficial bacterium): kind = akk|fp|bifido =====
  function microbe(kind, size) {
    inject(); size = size || 44;
    var K = { akk: { col: '#27D89B', name: '아커만시아' }, fp: { col: '#9BE15B', name: '푸세칼리' }, bifido: { col: '#7ADCFF', name: '비피더스' } }[kind] || { col: '#27D89B', name: '유익균' };
    return '<svg width="' + size + '" height="' + size + '" viewBox="-26 -26 52 52" style="overflow:visible">' +
      '<g class="ch ch-bob">' +
        '<ellipse cx="0" cy="0" rx="18" ry="15" fill="' + K.col + '" opacity=".92"/>' +
        '<ellipse cx="0" cy="0" rx="18" ry="15" fill="none" stroke="#fff" stroke-width="1" opacity=".4"/>' +
        '<circle cx="-5" cy="-2" r="2.4" fill="#243352"/><circle cx="5" cy="-2" r="2.4" fill="#243352"/><circle cx="-4.2" cy="-2.8" r=".9" fill="#fff"/><circle cx="5.8" cy="-2.8" r=".9" fill="#fff"/>' +
        '<path d="M-4,5 Q0,8 4,5" stroke="#243352" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '</g></svg>';
  }

  // ===== LPS villain — spiky red toxic particle =====
  function lps(size) {
    inject(); size = size || 40;
    var spikes = ''; for (var i = 0; i < 8; i++) { var a = (i / 8) * Math.PI * 2; spikes += '<line x1="0" y1="0" x2="' + (Math.cos(a) * 17).toFixed(1) + '" y2="' + (Math.sin(a) * 17).toFixed(1) + '" stroke="#FF5C7A" stroke-width="2.4" stroke-linecap="round"/>'; }
    return '<svg width="' + size + '" height="' + size + '" viewBox="-22 -22 44 44" style="overflow:visible">' +
      '<g class="ch ch-bob" style="animation-duration:1.4s">' + spikes +
        '<circle cx="0" cy="0" r="11" fill="#FF5C7A"/>' +
        '<path d="M-4,-2 L-1,2 M1,-2 L4,2" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>' +   // angry eyes
        '<path d="M-4,5 Q0,2 4,5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +  // frown
      '</g></svg>';
  }

  // ===== SCFA crystal — glowing hexagon crystal =====
  function scfa(size) {
    inject(); size = size || 40;
    return '<svg width="' + size + '" height="' + size + '" viewBox="-22 -22 44 44" style="overflow:visible">' +
      '<g class="ch ch-float">' +
        '<polygon points="0,-16 14,-8 14,8 0,16 -14,8 -14,-8" fill="#27D89B" opacity=".9" stroke="#fff" stroke-width="1" stroke-opacity=".4"/>' +
        '<polygon points="0,-16 14,-8 0,0" fill="#fff" opacity=".25"/>' +
        '<circle cx="-3" cy="0" r="1.6" fill="#243352"/><circle cx="3" cy="0" r="1.6" fill="#243352"/>' +
      '</g></svg>';
  }

  // ===== 커스텀 레지던트 아바타 — jd(정형돈) / yjs(유재석) · 표정 변형 지원 =====
  var MOOD_MOUTH = {
    smile: '<path d="M26,47 Q32,52.5 38,47" stroke="#1A1A22" stroke-width="2.3" fill="none" stroke-linecap="round"/>',
    bigSmile: '<path d="M25,45 Q32,56 39,45 Q32,50 25,45 Z" fill="#1A1A22"/><path d="M28.5,50.5 Q32,53.5 35.5,50.5" fill="#FF7A93"/>',
    flat: '<path d="M26,48 L38,48" stroke="#1A1A22" stroke-width="2.3" fill="none" stroke-linecap="round"/>',
    frown: '<path d="M26,51 Q32,45.5 38,51" stroke="#1A1A22" stroke-width="2.3" fill="none" stroke-linecap="round"/>',
    cry: '<path d="M26,51.5 Q32,45 38,51.5" stroke="#1A1A22" stroke-width="2.3" fill="none" stroke-linecap="round"/><ellipse cx="19.5" cy="42" rx="2" ry="3.4" fill="#7EC8FF" opacity=".9"/><ellipse cx="44.5" cy="42" rx="2" ry="3.4" fill="#7EC8FF" opacity=".9"/>',
    sweat: '<path d="M26,47 Q32,52.5 38,47" stroke="#1A1A22" stroke-width="2.3" fill="none" stroke-linecap="round"/><path d="M52,25 Q55.5,31.5 52,34.5 Q48.5,31.5 52,25 Z" fill="#7EC8FF" stroke="#4A9BD8" stroke-width=".8"/>',
    o: '<ellipse cx="32" cy="48.5" rx="3.4" ry="4.4" fill="#1A1A22"/>'
  };
  var MOOD_EMOJI = { smile: '🙂', bigSmile: '😄', flat: '😐', frown: '😟', cry: '😭', sweat: '😅', o: '😮' };

  function jdFace(mood, size) {
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" style="display:block">' +
        '<path d="M13,31 Q13,9 32,9 Q51,9 51,31 L46,31 Q46,15.5 32,15.5 Q18,15.5 18,31 Z" fill="#1A1A22"/>' +
        '<circle cx="10.5" cy="37" r="4" fill="#FFD9C0"/><circle cx="53.5" cy="37" r="4" fill="#FFD9C0"/>' +
        '<ellipse cx="32" cy="37" rx="22" ry="21" fill="#FFD9C0"/>' +
        '<path d="M19.5,34.5 Q23.5,29.5 27.5,34.5" stroke="#1A1A22" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        '<path d="M36.5,34.5 Q40.5,29.5 44.5,34.5" stroke="#1A1A22" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="18.5" cy="42.5" rx="4.5" ry="2.8" fill="#FF9DB4" opacity=".55"/>' +
        '<ellipse cx="45.5" cy="42.5" rx="4.5" ry="2.8" fill="#FF9DB4" opacity=".55"/>' +
        (MOOD_MOUTH[mood] || MOOD_MOUTH.smile) +
        '</svg>';
  }
  function yjsFace(mood, size) {
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" style="display:block">' +
        '<path d="M12,37 Q10,7 32,7 Q54,7 52,37 L47.5,37 Q48.5,13 32,13 Q15.5,13 16.5,37 Z" fill="#14141C"/>' +
        '<path d="M12,37 Q10,43 13,55 L18.5,52.5 Q15.5,44 16.5,37 Z" fill="#14141C"/>' +
        '<path d="M52,37 Q54,43 51,55 L45.5,52.5 Q48.5,44 47.5,37 Z" fill="#14141C"/>' +
        '<ellipse cx="32" cy="36" rx="17" ry="20" fill="#FFE0CC"/>' +
        '<g stroke="#2A2A35" stroke-width="2" fill="rgba(160,210,255,.22)">' +
        '<rect x="16" y="29.5" width="13" height="10.5" rx="2.5"/><rect x="35" y="29.5" width="13" height="10.5" rx="2.5"/>' +
        '<line x1="29" y1="34.5" x2="35" y2="34.5"/><line x1="16" y1="31.5" x2="11.5" y2="30"/><line x1="48" y1="31.5" x2="52.5" y2="30"/></g>' +
        '<circle cx="22.5" cy="35" r="1.8" fill="#14141C"/><circle cx="41.5" cy="35" r="1.8" fill="#14141C"/>' +
        (MOOD_MOUTH[mood] || MOOD_MOUTH.smile) +
        '</svg>';
  }
  function avatarFace(key, mood, size) {
    mood = mood || 'smile';
    size = size || 28;
    if (key === 'jd') return jdFace(mood, size);
    if (key === 'yjs') return yjsFace(mood, size);
    return '<span style="font-size:' + Math.round(size * 0.8) + 'px;line-height:1;display:inline-block">' + (MOOD_EMOJI[mood] || MOOD_EMOJI.smile) + '</span>';
  }
  function avatarHtml(key, size) {
    return avatarFace(key, 'smile', size || 24);
  }

  GS.chars = { drJang: drJang, dopamine: dopamine, gutMascot: gutMascot, microbe: microbe, lps: lps, scfa: scfa, poses: POSES, inject: inject, avatarHtml: avatarHtml, avatarFace: avatarFace };
})();
