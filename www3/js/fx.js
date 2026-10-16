/* GutSense — natural tap/change effects. A delegated ripple on tappable
 * elements (cards, chips, buttons) + a burst() for rewards/metric changes.
 * No per-screen wiring: it listens on #gsApp once. GPU-composited only.
 * Exposed as window.GS.fx.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var READY = false;
  function ensureStyle() {
    if (document.getElementById('gs-fx-style')) return;
    var s = document.createElement('style');
    s.id = 'gs-fx-style';
    s.textContent =
      '@keyframes gsFxRipple{to{transform:translate(-50%,-50%) scale(2.6);opacity:0}}' +
      '@keyframes gsFxBurst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(.2);opacity:0}}' +
      '@keyframes gsFxPop{0%{transform:scale(1)}40%{transform:scale(1.12)}100%{transform:scale(1)}}' +
      '.gs-fx-ripple{position:absolute;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(91,164,255,.45),transparent 70%);animation:gsFxRipple .55s ease-out forwards;mix-blend-mode:screen}' +
      '.gs-fx-burst{position:absolute;width:7px;height:7px;border-radius:50%;pointer-events:none;animation:gsFxBurst .7s ease-out forwards}';
    document.head.appendChild(s);
  }
  function spawn(el, x, y) {
    var r = document.createElement('div');
    r.className = 'gs-fx-ripple';
    var size = Math.max(el.offsetWidth, el.offsetHeight) * 0.9;
    r.style.width = r.style.height = size + 'px';
    r.style.left = x + 'px'; r.style.top = y + 'px';
    el.appendChild(r);
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 600);
  }
  function isTappable(t) {
    return t && (t.hasAttribute && (t.hasAttribute('onclick') || t.closest('[onclick]') || t.tagName === 'BUTTON' || (t.closest && t.closest('.gs-chip,.gs-qcard,.gs-gamemap-node,.gs-radio,.gs-seg-it'))));
  }
  function host(t) {
    var p = t.closest ? (t.closest('[onclick]') || t.closest('.gs-chip,.gs-qcard,.gs-gamemap-node,.gs-card,.gs-glass') || t) : t;
    return (p && p.style) ? p : null;
  }
  function attach() {
    if (READY) return; READY = true;
    ensureStyle();
    document.addEventListener('pointerdown', function (e) {
      var t = e.target;
      if (!isTappable(t)) return;
      var app = document.getElementById('gsApp') || document.querySelector('.gs-app-shell');
      var cont = t.closest('.gs-content') || app;
      if (!cont) return;
      var rect = cont.getBoundingClientRect();
      var h = host(t) || cont;
      var hr = h.getBoundingClientRect();
      var lx = (e.clientX - hr.left), ly = (e.clientY - hr.top);
      if (h !== cont && h.style.position === 'static') h.style.position = 'relative';
      try { spawn(h, lx, ly); } catch (err) {}
    }, true);
  }
  // public: burst of particles at a screen point (rewards / metric change)
  function burst(x, y, opts) {
    opts = opts || {};
    ensureStyle();
    var app = document.querySelector('.gs-app-shell');
    if (!app) return;
    if (app.style.position !== 'absolute' && app.style.position !== 'relative') app.style.position = 'relative';
    var ar = app.getBoundingClientRect();
    var col = opts.color || '#5BA4FF';
    var n = opts.count || 10;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('div');
      p.className = 'gs-fx-burst';
      var a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      var dist = 26 + Math.random() * 30;
      p.style.left = x + 'px'; p.style.top = y + 'px';
      p.style.background = col;
      p.style.setProperty('--bx', (Math.cos(a) * dist).toFixed(1) + 'px');
      p.style.setProperty('--by', (Math.sin(a) * dist).toFixed(1) + 'px');
      p.style.boxShadow = '0 0 8px ' + col;
      app.appendChild(p);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 750); })(p);
    }
  }
  // pulse an element (metric changed / reward)
  function pop(el) { if (!el || !el.style) return; ensureStyle(); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'gsFxPop .45s ease'; }
  GS.fx = { attach: attach, burst: burst, pop: pop };
  if (document.readyState === 'complete' || document.readyState === 'interactive') attach();
  else document.addEventListener('DOMContentLoaded', attach);
})();
