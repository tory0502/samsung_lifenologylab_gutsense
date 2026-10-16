/* GutSense www3 — UI primitives composing the organic design system.
 * Pure HTML-string builders (screens return strings). Exposed as window.GS.ui.
 * UPGRADE: compact metric rows, video slots, pie charts, ranking cards,
 * level badges (not tiers), bell button. Blue-toned Dr.장 bubble support.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var T = {
    cyan:'#37C7FF', cyan2:'#7ADCFF', green:'#27D89B', lime:'#9BE15B',
    purple:'#A98CFF', violet:'#7B61FF', amber:'#FFC44D', orange:'#FF8A4D',
    red:'#FF5C7A', pink:'#FF80B0', ink:'#EAF3FF', dim:'#9DB4D6', faint:'#5E7AA6'
  };

  if (!document.getElementById('gs-ui-star-style')) {
    var ss = document.createElement('style'); ss.id = 'gs-ui-star-style';
    ss.textContent =
      '.gs-star{color:#FFD700!important;text-shadow:0 0 6px rgba(255,215,0,.45)}' +
      '@keyframes gsBtnBlink{0%,100%{box-shadow:0 0 10px rgba(55,199,255,.5),0 4px 14px rgba(55,199,255,.3)}50%{box-shadow:0 0 26px rgba(55,199,255,.95),0 4px 22px rgba(55,199,255,.55)}}' +
      '.btn.blink{animation:gsBtnBlink 1.25s ease-in-out infinite}';
    document.head.appendChild(ss);
  }
  function star() { return '<span class="gs-star">★</span>'; }

  // organic "organ panel"
  function panel(inner, opts) {
    opts = opts || {};
    var cls = 'panel' + (opts.tight ? ' tight' : '') + (opts.glow ? ' glow' : '');
    var pad = opts.pad != null ? opts.pad : '16px';
    var mb = opts.mb != null ? opts.mb : 14;
    var click = opts.onclick ? (' onclick="' + opts.onclick + '"') : '';
    return '<div class="' + cls + ' fadeIn" style="padding:' + pad + ';margin-bottom:' + mb + 'px;cursor:' + (opts.onclick ? 'pointer' : 'default') + '"' + click + '>' + inner + '</div>';
  }

  // metric bar kind config
  var MBAR_DEF = {
    scfa: { col: T.green, up: true, icon: '🌿' },
    perm: { col: T.cyan, up: false, icon: '🧱' },
    inf:  { col: T.red, up: false, icon: '🔥' },
    dopa: { col: T.amber, up: true, icon: '⚡' },
    shield: { col: T.cyan, up: false, icon: '🛡' },
    toxin: { col: T.red, up: false, icon: '☠' },
    mana: { col: T.amber, up: true, icon: '✨' },
    hp: { col: T.green, up: true, icon: '❤' },
    motility: { col: T.cyan, up: true, icon: '🌀' }
  };

  function colorFor(val, kind) {
    var def = MBAR_DEF[kind] || { col: T.cyan, up: true };
    return def.up ? (val > 65 ? def.col : val > 35 ? T.amber : T.red)
                  : (val < 40 ? def.col : val < 65 ? T.amber : T.red);
  }

  // Original full-width metric bar (kept for backward compat)
  function mbar(label, val, kind, opts) {
    opts = opts || {};
    var def = MBAR_DEF[kind] || { col: T.cyan, up: true, icon: '●' };
    var col = colorFor(val, kind);
    var seg = opts.segments || 10, lit = Math.round((val / 100) * seg), segs = '';
    for (var i = 0; i < seg; i++) segs += '<i class="' + (i < lit ? 'on' : '') + '" style="color:' + col + ';background:' + (i < lit ? col : '') + '"></i>';
    var cap = '';
    if (opts.ceiling != null && opts.ceiling < 100) {
      var left = Math.max(0, Math.min(100, opts.ceiling));
      cap = '<div style="position:absolute;top:-3px;bottom:-3px;left:' + left + '%;width:2px;background:' + T.purple + ';box-shadow:0 0 6px ' + T.purple + 'cc"></div><div style="position:absolute;top:-12px;left:' + left + '%;transform:translateX(-50%);font-size:8px;font-weight:700;color:' + T.purple + ';white-space:nowrap">▼' + opts.ceiling + '</div>';
    }
    return '<div class="mbar" style="margin-bottom:' + (opts.mb != null ? opts.mb : 9) + 'px">' +
      '<div class="mhead"><span class="mlabel">' + def.icon + ' ' + label + '</span><span class="mval" style="color:' + col + '">' + val + '</span></div>' +
      '<div style="position:relative;padding-top:11px"><div class="segs">' + segs + '</div>' + cap + '</div></div>';
  }

  // COMPACT metric row — UPGRADE: index name on LEFT (~1/3), bar on RIGHT (~2/3).
  // Single-line height, much less vertical space. Bars fill 2/3 of panel width.
  function mbarRow(label, val, kind, opts) {
    opts = opts || {};
    var def = MBAR_DEF[kind] || { col: T.cyan, up: true, icon: '●' };
    var col = colorFor(val, kind);
    var seg = opts.segments || 8, lit = Math.round((val / 100) * seg), segs = '';
    for (var i = 0; i < seg; i++) segs += '<i style="flex:1;height:7px;border-radius:2px;background:' + (i < lit ? col : 'rgba(122,220,255,.1)') + (i < lit ? ';box-shadow:0 0 5px ' + col + '88' : '') + ';transition:background .4s"></i>';
    var cap = '';
    if (opts.ceiling != null && opts.ceiling < 100) {
      cap = '<div style="position:absolute;top:-2px;bottom:-2px;left:' + opts.ceiling + '%;width:2px;background:' + T.purple + ';box-shadow:0 0 5px ' + T.purple + '"></div>';
    }
    // clickable for Dr.장 explanation
    var clickAttr = opts.onclick ? (' onclick="' + opts.onclick + '"') : '';
    var cursorStyle = opts.onclick ? ';cursor:pointer' : '';
    return '<div class="mbarRow" style="display:flex;align-items:center;gap:8px;margin-bottom:' + (opts.mb != null ? opts.mb : 6) + 'px' + cursorStyle + '"' + clickAttr + '>' +
      '<div style="flex-shrink:0;width:34%;display:flex;align-items:center;gap:4px">' +
        '<span style="font-size:11px">' + def.icon + '</span>' +
        '<span style="font-size:10px;color:var(--ink);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + label + '</span>' +
      '</div>' +
      '<div style="flex:1;position:relative;padding:1px 0">' +
        '<div style="display:flex;gap:1.5px">' + segs + '</div>' + cap +
      '</div>' +
      '<span class="num" style="flex-shrink:0;font-size:11px;font-weight:700;color:' + col + ';width:24px;text-align:right">' + val + '</span>' +
    '</div>';
  }

  function chip(label, opts) {
    opts = opts || {};
    var cls = 'chip' + (opts.on ? ' on-' + (opts.bad ? 'bad' : 'good') : '');
    var click = opts.onclick ? (' onclick="' + opts.onclick + '"') : '';
    return '<span class="' + cls + '"' + click + '>' + label + '</span>';
  }

  // LIVE energy bars — continuous (unsegmented) bars with real-time micro-fluctuation.
  // Intervals self-clean when their elements leave the DOM.
  function liveBars(defs, opts) {
    opts = opts || {};
    var uid = 'lb' + Date.now() + Math.floor(Math.random() * 9999);
    var header = opts.header === false ? '' :
      '<div class="micro" style="color:var(--cyan2);margin:0 0 7px">' + (opts.header || star() + ' 실시간 지표 · 생체 신호 반영 중') + ' <span style="width:5px;height:5px;border-radius:50%;background:var(--green);display:inline-block;animation:pulse 1.3s infinite"></span></div>';
    var html = header + defs.map(function (d, i) {
      var col = colorFor(d.v, d.k);
      var cap = (d.ceiling != null && d.ceiling < 100)
        ? '<div style="position:absolute;top:-2px;bottom:-2px;left:' + d.ceiling + '%;width:2px;background:' + T.purple + ';box-shadow:0 0 5px ' + T.purple + '"></div>' : '';
      return '<div' + (d.oc ? ' onclick="' + d.oc + '" style="display:flex;align-items:center;gap:8px;margin-bottom:7px;cursor:pointer"' : ' style="display:flex;align-items:center;gap:8px;margin-bottom:7px"') + '>' +
        '<div style="flex-shrink:0;width:32%;display:flex;align-items:center;gap:4px"><span style="font-size:11px">' + (MBAR_DEF[d.k] || { icon: '●' }).icon + '</span><span style="font-size:10px;color:var(--ink)">' + d.l + '</span></div>' +
        '<div style="flex:1;position:relative;height:9px;border-radius:5px;background:rgba(122,220,255,.1);overflow:hidden">' +
          '<div id="' + uid + 'f' + i + '" style="position:absolute;top:0;left:0;bottom:0;width:' + d.v + '%;border-radius:5px;background:linear-gradient(90deg,' + col + '99,' + col + ');box-shadow:0 0 8px ' + col + '77;transition:width .45s ease,background .45s"></div>' +
          '<div style="position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.22) 50%,transparent 70%);background-size:200% 100%;animation:gs-shimmer 2.6s linear infinite"></div>' +
          cap +
        '</div>' +
        '<span id="' + uid + 'v' + i + '" class="num" style="flex-shrink:0;font-size:11px;font-weight:700;color:' + col + ';width:24px;text-align:right;transition:color .45s">' + d.v + '</span>' +
      '</div>' +
      (d.hint ? '<div style="text-align:center;font-size:10px;color:' + T.faint + ';margin:-4px 0;line-height:1">' + d.hint + '</div>' : '');
    }).join('');
    setTimeout(function () {
      defs.forEach(function (d, i) {
        var fEl = document.getElementById(uid + 'f' + i), vEl = document.getElementById(uid + 'v' + i);
        if (!fEl || !vEl) return;
        var base = d.v, cur = d.v, phase = Math.random() * 6.28;
        var iv = setInterval(function () {
          if (!document.body.contains(fEl)) { clearInterval(iv); return; }
          phase += 0.4;
          var tgt = Math.max(4, Math.min(96, base + Math.sin(phase) * 3.4 + (Math.random() - 0.5) * 1.8));
          cur = cur * 0.55 + tgt * 0.45;
          var c = colorFor(cur, d.k);
          fEl.style.width = cur + '%';
          fEl.style.background = 'linear-gradient(90deg,' + c + '99,' + c + ')';
          fEl.style.boxShadow = '0 0 8px ' + c + '77';
          vEl.textContent = Math.round(cur);
          vEl.style.color = c;
        }, 160);
      });
    }, 60);
    return html;
  }
  function btn(label, opts) {
    opts = opts || {};
    var cls = 'btn' + (opts.violet ? ' violet' : opts.danger ? ' danger' : opts.ghost ? ' ghost' : '') + (opts.blink ? ' blink' : '');
    var click = opts.onclick ? (' onclick="' + opts.onclick + '"') : '';
    return '<button class="' + cls + '"' + click + '>' + label + '</button>';
  }
  function stageTag(t) { return '<span class="stage-tag" style="white-space:nowrap;max-width:none;flex-shrink:0">' + star() + ' ' + t + '</span>'; }
  function badge(t, col) { return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:' + (col || T.cyan) + '22;color:' + (col || T.cyan) + ';font-size:11px;font-weight:400;border:1px solid ' + (col || T.cyan) + '44;white-space:nowrap">' + t + '</span>'; }

  function weatherBadge(inf) {
    var w = inf < 20 ? { e: '🌟', l: '우수', c: T.green } : inf < 40 ? { e: '☀️', l: '양호', c: T.cyan } : inf < 60 ? { e: '🌥️', l: '주의', c: T.amber } : { e: '⛈️', l: '위험', c: T.red };
    return badge('<span style="font-size:14px">' + w.e + '</span> ' + w.l, w.c);
  }

  var toastT = null;
  function toast(msg, type) {
    var t = document.getElementById('toast'); if (!t) return;
    var col = type === 'error' ? T.red : type === 'success' ? T.green : T.cyan2;
    t.style.borderColor = col + '88'; t.style.color = T.ink;
    t.textContent = msg; t.classList.add('show');
    if (toastT) clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function modal(title, bodyHtml, opts) {
    opts = opts || {};
    var m = document.getElementById('modal'); if (!m) return;
    m.innerHTML = '<div class="backdrop" onclick="GS.ui.closeModal()"></div><div class="sheet">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><div class="h2">' + title + '</div>' +
      '<div onclick="GS.ui.closeModal()" style="width:30px;height:30px;border-radius:50%;background:rgba(122,220,255,.1);display:flex;align-items:center;justify-content:center;color:var(--ink-dim);font-size:18px;cursor:pointer;line-height:1">×</div></div>' +
      bodyHtml + (opts.footer ? '<div style="margin-top:16px">' + opts.footer + '</div>' : '') + '</div>';
    m.classList.add('show');
  }
  function closeModal() {
    var m = document.getElementById('modal'); if (m) m.classList.remove('show');
    try { window.dispatchEvent(new Event('gs:modalclose')); } catch (e) {}
  }

  // streak — now expressed as LEVEL not tier (AGENTS.md: 티어→레벨)
  function streak(days) {
    var lvl = days >= 30 ? { lv: 6, icon: '👑', c: T.red } : days >= 14 ? { lv: 5, icon: '🔷', c: T.violet }
            : days >= 7 ? { lv: 4, icon: '💎', c: T.cyan } : days >= 5 ? { lv: 3, icon: '🥇', c: T.amber }
            : days >= 3 ? { lv: 2, icon: '🥈', c: T.dim } : { lv: 1, icon: '🥉', c: '#B08D57' };
    var flames = ''; var cap = Math.min(7, days);
    for (var i = 0; i < cap; i++) flames += '<span style="font-size:' + (12 + i) + 'px;filter:drop-shadow(0 0 4px ' + T.amber + '88)">🔥</span>';
    return '<div style="display:flex;align-items:center;gap:9px;padding:9px 13px;background:rgba(20,40,78,.5);border:1px solid ' + lvl.c + '33;border-radius:18px">' +
      '<div>' + (flames || '<span style="font-size:16px;opacity:.4">🔥</span>') + '</div>' +
      '<div><div style="font-size:12px;color:var(--ink)">연속 ' + days + '일</div><div style="font-size:9px;color:' + lvl.c + '">' + lvl.icon + ' 연속 달성 Lv.' + lvl.lv + '</div></div></div>';
  }

  // level badge (AGENTS.md: 티어→레벨)
  function levelBadge(level, title) {
    return '<div style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:linear-gradient(135deg,' + T.cyan + ',' + T.violet + ');color:#04101F;border-radius:999px;font-size:9px;font-weight:700;box-shadow:0 4px 12px rgba(123,97,255,.4);white-space:nowrap">Lv.' + level + (title ? ' · ' + title : '') + '</div>';
  }

  // evidence / codex citation chip
  function cite(fact) {
    if (!fact) return '';
    return '<div style="display:flex;gap:9px;align-items:flex-start;padding:10px 12px;background:rgba(55,199,255,.06);border:1px solid rgba(55,199,255,.14);border-radius:14px;margin-top:10px">' +
      '<div style="font-size:18px">' + fact.emoji + '</div>' +
      '<div style="flex:1"><div style="font-size:12px;font-weight:400;color:var(--ink)">' + fact.title + '</div>' +
      '<div class="cap" style="margin-top:3px">' + fact.body + '</div></div></div>';
  }

  // VIDEO SLOT — AGENTS.md: 영상 들어갈 공간만 잡고 파일명 표시.
  // 사용자가 같은 이름의 영상을 video 폴더에 올리면 무한재생.
  function videoSlot(filename, label, color) {
    color = color || T.cyan;
    var vid = 'vs-' + Math.random().toString(36).substr(2, 6);
    return '<div style="position:relative;border-radius:18px;overflow:hidden;border:2px solid ' + color + '55;box-shadow:0 10px 28px ' + color + '22;aspect-ratio:16/9;background:#060D20">' +
      '<video autoplay loop muted playsinline preload="auto" src="video/' + filename + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none" onloadeddata="this.style.display=\'block\';var p=document.getElementById(\'' + vid + '\');if(p)p.style.display=\'none\'" onerror="this.onerror=null;this.src=\'assets/video/' + filename + '\';this.load()""></video>' +
      '<div id="' + vid + '" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:radial-gradient(circle at 50% 50%,rgba(55,199,255,.06),rgba(10,22,48,.4))">' +
      '<div style="width:42px;height:42px;border-radius:50%;background:' + color + '22;border:2px solid ' + color + '66;display:flex;align-items:center;justify-content:center;font-size:18px;animation:pulse 2s ease-in-out infinite">🎬</div>' +
      '<div style="font-family:monospace;font-size:9px;color:' + color + ';background:rgba(4,10,22,.5);padding:3px 9px;border-radius:6px;border:1px solid ' + color + '33">' + filename + '</div>' +
      '</div></div>';
  }

  // PIE CHART — data source contribution (AGENTS.md: 데이터 소스별 기여도 PIE)
  function pieChart(data, size) {
    size = size || 110;
    var total = data.reduce(function (s, d) { return s + d.value; }, 0) || 1;
    var cx = size / 2, cy = size / 2, r = size / 2 - 4;
    var angle = -Math.PI / 2, paths = '', legend = '';
    var i = 0;
    data.forEach(function (d) {
      var frac = d.value / total;
      var a2 = angle + frac * Math.PI * 2;
      var large = frac > 0.5 ? 1 : 0;
      var x1 = cx + Math.cos(angle) * r, y1 = cy + Math.sin(angle) * r;
      var x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r;
      if (frac >= 0.999) {
        paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + d.color + '"/>';
      } else {
        paths += '<path d="M' + cx + ',' + cy + ' L' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' Z" fill="' + d.color + '" stroke="rgba(10,22,48,.5)" stroke-width="1"/>';
      }
      legend += '<div onclick="' + (d.onclick || '') + '" style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--ink-dim);cursor:' + (d.onclick ? 'pointer' : 'default') + ';margin-bottom:3px">' +
        '<span style="width:9px;height:9px;border-radius:2px;background:' + d.color + ';flex-shrink:0"></span>' +
        '<span style="color:var(--ink)">' + d.label + '</span>' +
        '<span class="num" style="margin-left:auto;color:' + d.color + '">' + Math.round(frac * 100) + '%</span></div>';
      angle = a2;
      i++;
    });
    return '<div style="display:flex;align-items:center;gap:14px">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" style="flex-shrink:0;filter:drop-shadow(0 4px 8px rgba(0,0,0,.3))">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="rgba(10,22,48,.4)"/>' + paths +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.42) + '" fill="rgba(10,22,48,.85)"/>' +
      '</svg>' +
      '<div style="flex:1;min-width:0">' + legend + '</div></div>';
  }

  // RANKING LIST — game-style weekly ranking (AGENTS.md: 주간 랭킹)
  function rankingList(entries, myId, myDisplayRank) {
    var medals = ['🥇', '🥈', '🥉'];
    return entries.map(function (e, i) {
      var isMe = e.id === myId;
      var rank = isMe && myDisplayRank ? myDisplayRank : i + 1;
      var medal = medals[i] || '<span style="font-size:10px;color:var(--ink-dim)">#' + rank + '</span>';
      var bg = isMe ? 'linear-gradient(135deg,rgba(55,199,255,.18),rgba(169,140,255,.14))' : 'rgba(122,220,255,.04)';
      var border = isMe ? '1.5px solid ' + T.cyan : '1px solid rgba(122,220,255,.1)';
      var barW = Math.round((e.score / Math.max(1, entries[0].score)) * 100);
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:' + bg + ';border:' + border + ';border-radius:14px;margin-bottom:7px">' +
        '<div style="width:30px;text-align:center;font-size:16px;flex-shrink:0">' + medal + '</div>' +
        '<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,' + (e.color || T.cyan) + ',' + T.violet + ');display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;overflow:hidden">' + (window.GS && GS.chars ? GS.chars.avatarHtml(e.avatar, 30) : (e.avatar || '🙂')) + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:6px"><span style="font-size:12px;color:var(--ink);font-weight:' + (isMe ? '700' : '400') + '">' + e.name + (isMe ? ' (나)' : '') + '</span>' +
          '<span style="font-size:8px;padding:1px 6px;border-radius:6px;background:' + (e.color || T.cyan) + '22;color:' + (e.color || T.cyan) + '">Lv.' + e.level + '</span></div>' +
          '<div style="margin-top:3px;height:4px;border-radius:2px;background:rgba(122,220,255,.1);overflow:hidden"><div style="height:100%;width:' + barW + '%;background:linear-gradient(90deg,' + (e.color || T.cyan) + ',' + T.cyan2 + ');border-radius:2px"></div></div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0"><div class="num" style="font-size:14px;font-weight:700;color:' + (e.color || T.cyan) + '">' + e.score + '</div><div class="micro">GUT 점수</div></div>' +
      '</div>';
    }).join('');
  }

  // BELL BUTTON — AGENTS.md: 우상단 벨, 나쁜 습관 시 붉은 점멸
  function bellButton(active, count) {
    var pulse = active ? 'animation:bellPulse 1s ease-in-out infinite' : '';
    var dot = active ? '<span style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:' + T.red + ';border:2px solid #060D20;box-shadow:0 0 8px ' + T.red + '"></span>' : '';
    var badge = (count && !active) ? '<span style="position:absolute;top:-4px;right:-4px;min-width:15px;height:15px;border-radius:8px;background:' + T.amber + ';color:#04101F;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 3px">' + count + '</span>' : '';
    return '<div onclick="GS.nav.openBell()" style="position:relative;width:40px;height:40px;border-radius:50%;background:rgba(14,30,60,.82);backdrop-filter:blur(12px);border:1px solid rgba(122,220,255,.28);box-shadow:0 8px 22px rgba(0,0,0,.36);display:flex;align-items:center;justify-content:center;cursor:pointer;' + pulse + '">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + (active ? T.red : '#7ADCFF') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>' +
      dot + badge + '</div>';
  }

  // SEGMENT CONTROL — for tab switching (e.g. 주간 랭킹 / 미션)
  function segControl(items, activeId, onclickNs) {
    return '<div style="display:flex;background:rgba(8,18,40,.6);border:1px solid var(--line);border-radius:14px;padding:3px;margin-bottom:12px">' +
      items.map(function (it) {
        var on = it.id === activeId;
        return '<div onclick="' + onclickNs + '(\'' + it.id + '\')" style="flex:1;text-align:center;padding:8px 6px;border-radius:11px;font-size:12px;cursor:pointer;transition:all .2s;background:' + (on ? 'linear-gradient(135deg,var(--cyan),var(--cyan2))' : 'transparent') + ';color:' + (on ? '#04101F' : 'var(--ink-dim)') + ';font-weight:' + (on ? '700' : '400') + '">' + it.label + '</div>';
      }).join('') + '</div>';
  }

  // mini sparkline for data source popups
  function sparkline(values, color, w, h) {
    w = w || 100; h = h || 30; color = color || T.cyan;
    var max = Math.max.apply(null, values), min = Math.min.apply(null, values);
    var range = max - min || 1;
    var pts = values.map(function (v, i) {
      var x = (i / (values.length - 1)) * w;
      var y = h - ((v - min) / range) * (h - 4) - 2;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 3px ' + color + '88)"/>' +
      '<polyline points="0,' + h + ' ' + pts + ' ' + w + ',' + h + '" fill="' + color + '" opacity=".12"/></svg>';
  }

  GS.ui = {
    T: T, MBAR_DEF: MBAR_DEF, colorFor: colorFor, star: star,
    panel: panel, mbar: mbar, mbarRow: mbarRow, liveBars: liveBars, chip: chip, btn: btn,
    stageTag: stageTag, badge: badge, weatherBadge: weatherBadge,
    streak: streak, levelBadge: levelBadge, cite: cite,
    videoSlot: videoSlot, pieChart: pieChart, rankingList: rankingList,
    bellButton: bellButton, segControl: segControl, sparkline: sparkline,
    toast: toast, modal: modal, closeModal: closeModal
  };
})();
