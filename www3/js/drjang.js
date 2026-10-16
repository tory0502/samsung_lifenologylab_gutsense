/* GutSense www3 — Dr.장 speech bubble. Uses the cute chars.drJang character
 * + GS.llm for grounded comments. UPGRADE: blue bubble, no GLM LIVE,
 * interactive multi-topic mode (click area → Dr.장 explains differently).
 * Exposed as window.GS.drjang = { render, renderSmart, renderInteractive }.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var D = window.GS_DATA;
  function inject() {
    if (document.getElementById('gs3-dj-style')) return;
    var s = document.createElement('style'); s.id = 'gs3-dj-style';
    s.textContent =
      '.dj-row{display:flex;gap:11px;align-items:flex-end}' +
      '.dj-row.right{flex-direction:row-reverse}' +
      '.dj-bubble{flex:1;align-self:center;position:relative;background:linear-gradient(160deg,rgba(20,60,110,.72),rgba(12,36,78,.68));backdrop-filter:blur(14px);border:1.5px solid rgba(55,199,255,.3);border-radius:22px 24px 24px 20px;padding:13px 15px;box-shadow:0 12px 30px rgba(0,0,0,.32),0 0 20px rgba(55,199,255,.08);overflow:hidden}' +
      '.dj-bubble::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(135deg,rgba(55,199,255,.1),transparent 40%,transparent 60%,rgba(122,220,255,.08))}' +
      '.dj-tail{position:absolute;left:-9px;bottom:14px;width:0;height:0;border-style:solid;border-width:7px 11px 7px 0;border-color:transparent rgba(20,60,110,.72) transparent transparent;filter:drop-shadow(-1px 0 0 rgba(55,199,255,.2))}' +
      '.dj-label{font-size:10px;font-weight:400;letter-spacing:.04em;color:var(--cyan2);margin-bottom:5px;display:flex;align-items:center;gap:6px}' +
      '.dj-label .sub{color:var(--ink-faint)}' +
      '.dj-text{position:relative;font-size:13px;line-height:1.55;color:var(--ink);animation:djWipe 1s steps(26,end) both}' +
      '.dj-topics{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}' +
      '.dj-topic{font-size:10px;padding:4px 10px;border-radius:999px;background:rgba(55,199,255,.1);border:1px solid rgba(55,199,255,.2);color:var(--ink-dim);cursor:pointer;transition:all .2s;white-space:nowrap}' +
      '.dj-topic.on{background:rgba(55,199,255,.25);border-color:var(--cyan);color:var(--cyan2);box-shadow:0 0 8px rgba(55,199,255,.2)}' +
      '@keyframes djWipe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}';
    document.head.appendChild(s);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

function render(pose, line, opts) {
    inject();
    opts = opts || {};
    var size = opts.size || 84;
    return '<div class="dj-row ' + (opts.right ? 'right' : '') + '">' +
      '<div style="flex-shrink:0">' + GS.chars.drJang(pose, size) + '</div>' +
      '<div class="dj-bubble"><div class="dj-tail"></div>' +
      '<div class="dj-label">Dr.장 <span class="sub">· 장 생태계 가이드</span></div>' +
      '<div class="dj-text"' + (opts.bid ? ' id="' + opts.bid + '"' : '') + '>' + esc(line) + '</div>' +
      (opts.topicsHtml || '') +
      '</div></div>';
  }

  var seq = 0;
  function renderSmart(ctx, opts) {
    opts = opts || {};
    var fb = (opts.pose || opts.line) ? { pose: opts.pose || 'explain', line: opts.line || '' } : (D.drJangLine ? D.drJangLine(ctx || {}) : { pose: 'explain', line: '' });
    var bid = 'dj-b-' + (++seq);
    var html = render(fb.pose, fb.line, { size: opts.size || 80, right: opts.right, bid: bid });
    var curTab = (GS.store && GS.store.nav && GS.store.nav.get()) || '';
    var llmEnabled = curTab === 'home' && window.GS && window.GS.llm && window.GS.llm.activeProvider();
    if (llmEnabled) {
      var el0 = document.getElementById(bid);
      if (el0) el0.style.opacity = '0.6';
      GS.llm.generate(ctx || {}, { role: opts.role || 'coach' }).then(function (res) {
        if (res.fallback) { if (el0) el0.style.opacity = '1'; return; }
        var el = document.getElementById(bid); if (!el) return;
        el.textContent = res.text;
        el.style.opacity = '1';
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
      });
    }
    return html;
  }

  var topicSeq = 0;
  var activeInstances = [];
  function renderInteractive(topics, ctx, opts) {
    opts = opts || {};
    inject();
    activeInstances.forEach(function (id) { var inst = window[id]; if (inst && inst.autoTimer) clearInterval(inst.autoTimer); try { delete window[id]; } catch (e) {} });
    activeInstances = [];
    var instId = 'djInst-' + (++topicSeq);
    var size = opts.size || 78;
    var pose = opts.pose || 'explain';
    ctx = ctx || {};
    var topicData = topics.map(function (t, i) {
      return { id: instId + '-' + i, label: t.label, line: t.line, pose: t.pose || pose };
    });
    window[instId] = { topics: topicData, idx: 0, ctx: ctx, autoTimer: null, userPaused: false };
    activeInstances.push(instId);

    function topicsHtml() {
      return '<div class="dj-topics">' + topicData.map(function (t, i) {
        return '<div class="dj-topic' + (i === 0 ? ' on' : '') + '" id="' + t.id + '-tab" onclick="GS.drjang._switchTopic(\'' + instId + '\',' + i + ',true)">' + t.label + '</div>';
      }).join('') + '</div>';
    }

    var first = topicData[0] || { line: '', pose: pose };
    var bid = instId + '-text';
    var html = '<div id="' + instId + '-wrap">' +
      render(first.pose, first.line, { size: size, bid: bid }) +
      '</div>';
    setTimeout(function () {
      var w = document.getElementById(instId + '-wrap');
      if (!w) return;
      var bubble = w.querySelector('.dj-bubble');
      if (bubble) bubble.insertAdjacentHTML('beforeend', topicsHtml());
      startAutoRotate(instId);
    }, 0);
    return html;
  }

  function startAutoRotate(instId) {
    var inst = window[instId]; if (!inst) return;
    if (inst.autoTimer) clearInterval(inst.autoTimer);
    inst.autoTimer = setInterval(function () {
      var cur = window[instId]; if (!cur) return;
      if (cur.userPaused) return;
      var next = (cur.idx + 1) % cur.topics.length;
      _doSwitch(instId, next, false);
    }, 3000);
  }

  function _doSwitch(instId, idx, isManual) {
    var inst = window[instId]; if (!inst) return;
    inst.idx = idx;
    var t = inst.topics[idx]; if (!t) return;
    var el = document.getElementById(instId + '-text');
    if (el) { el.textContent = t.line; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; }
    var wrap = document.getElementById(instId + '-wrap');
    if (wrap) {
      var charWrap = wrap.querySelector('.dj-row > div:first-child');
      if (charWrap) charWrap.innerHTML = GS.chars.drJang(t.pose, 78);
    }
    for (var i = 0; i < inst.topics.length; i++) {
      var tab = document.getElementById(inst.topics[i].id + '-tab');
      if (tab) tab.classList.toggle('on', i === idx);
    }
    if (isManual) { inst.userPaused = true; setTimeout(function () { var c = window[instId]; if (c) c.userPaused = false; }, 10000); }
  }

  function switchTopic(instId, idx, isManual) {
    _doSwitch(instId, idx, isManual !== false);
  }

  GS.drjang = { render: render, renderSmart: renderSmart, renderInteractive: renderInteractive, _switchTopic: switchTopic };
})();
