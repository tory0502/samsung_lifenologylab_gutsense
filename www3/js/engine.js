/* GutSense 3D engine — a tiny Three.js + GSAP stage manager.
 * Screens register a builder via GS.engine.register(screenId, fn).
 * nav.js calls GS.engine.mount(screenId) right after the screen's HTML
 * is in the DOM, and GS.engine.dispose() before the DOM is replaced.
 *
 * Contract for screens that own their own re-render (e.g. onboarding):
 *   call GS.engine.dispose() BEFORE you overwrite #gsContent.innerHTML,
 *   then GS.engine.mount('<screenId>') AFTER, so the old WebGL context
 *   is freed before its <canvas> leaves the document.
 *
 * Exposed as window.GS.engine. No globals beyond GS.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  if (!window.THREE) { GS.engine = { mount: noop, dispose: noop, register: noop, get: function () { return null; } }; return; }
  var HAS_GSAP = !!window.gsap;

  var builders = {};
  var current = null;
  var tracked = [];

  function noop() {}

  function makeRenderer(alpha, color) {
    var r = new THREE.WebGLRenderer({ alpha: alpha !== false, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (color) r.setClearColor(new THREE.Color(color), 1); else r.setClearColor(0x000000, 0);
    return r;
  }

  function Stage(opts) {
    opts = opts || {};
    this.scene = new THREE.Scene();
    this.scene.fog = opts.far ? new THREE.Fog(opts.fogColor || 0x060e1c, opts.near || 6, opts.far || 24) : null;
    this.camera = opts.camera || new THREE.PerspectiveCamera(opts.fov || 50, 1, opts.near || 0.1, opts.far || 100);
    this.camera.position.set(opts.cx || 0, opts.cy || 0, opts.cz || 10);
    this.renderer = makeRenderer(opts.alpha, opts.bg);
    this.clock = new THREE.Clock();
    this._raf = null;
    this._updaters = [];
    this._tweens = [];
    this._ro = null;
    this._dead = false;
    this._lastSize = { w: 1, h: 1 };
    var self = this;
    function loop() { if (self._dead) return; self._raf = requestAnimationFrame(loop); self._tick(); }
    loop();
  }
  Stage.prototype.add = function (o) { this.scene.add(o); return o; };
  Stage.prototype.remove = function (o) { this.scene.remove(o); return o; };
  Stage.prototype.onUpdate = function (fn) { this._updaters.push(fn); return this; };
  // GSAP tween tracked for clean teardown
  Stage.prototype.tween = function (target, vars) {
    if (!HAS_GSAP) return { kill: noop };
    var t = window.gsap.to(target, vars);
    this._tweens.push(t);
    return t;
  };
  Stage.prototype.timeline = function (vars) {
    if (!HAS_GSAP) return { kill: noop, to: noop, from: noop, add: noop, play: noop };
    var tl = window.gsap.timeline(vars || {});
    this._tweens.push(tl);
    return tl;
  };
  // attach canvas to a host element and track its size
  Stage.prototype.attach = function (host) {
    if (!host) return this;
    host.appendChild(this.renderer.domElement);
    var self = this;
    function fit() {
      var w = host.clientWidth || 1, h = host.clientHeight || 1;
      if (w === self._lastSize.w && h === self._lastSize.h) return;
      self._lastSize = { w: w, h: h };
      self.renderer.setSize(w, h, false);
      self.camera.aspect = w / h;
      self.camera.updateProjectionMatrix();
    }
    fit();
    if (window.ResizeObserver) { this._ro = new ResizeObserver(fit); this._ro.observe(host); }
    else { window.addEventListener('resize', fit); this._fit = fit; }
    return this;
  };
  Stage.prototype._tick = function () {
    var dt = this.clock.getDelta();
    var t = this.clock.elapsedTime;
    for (var i = 0; i < this._updaters.length; i++) { try { this._updaters[i](dt, t); } catch (e) {} }
    this.renderer.render(this.scene, this.camera);
  };
  Stage.prototype.dispose = function () {
    this._dead = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._ro) { try { this._ro.disconnect(); } catch (e) {} }
    if (this._fit) window.removeEventListener('resize', this._fit);
    for (var i = 0; i < this._tweens.length; i++) { try { this._tweens[i].kill(); } catch (e) {} }
    this._tweens = []; this._updaters = [];
    this.scene.traverse(function (o) {
      if (o.geometry) { try { o.geometry.dispose(); } catch (e) {} }
      if (o.material) {
        var m = o.material;
        if (Array.isArray(m)) { for (var k = 0; k < m.length; k++) disposeMat(m[k]); }
        else disposeMat(m);
      }
    });
    function disposeMat(mm) { for (var key in mm) { var v = mm[key]; if (v && v.isTexture) { try { v.dispose(); } catch (e) {} } } try { mm.dispose(); } catch (e) {} }
    try { this.renderer.dispose(); } catch (e) {}
    try { this.renderer.forceContextLoss && this.renderer.forceContextLoss(); } catch (e) {}
    var c = this.renderer.domElement;
    if (c && c.parentNode) c.parentNode.removeChild(c);
  };

  function mount(screenId) {
    dispose();
    var b = builders[screenId];
    if (!b) return;
    try {
      current = new Stage();
      b(current);
    } catch (e) { if (window.console) console.error('[GS.engine] mount failed for', screenId, e); }
  }
  function dispose() {
    if (current) { try { current.dispose(); } catch (e) {} current = null; }
    for (var i = 0; i < tracked.length; i++) { try { tracked[i].dispose(); } catch (e) {} }
    tracked = [];
  }
  function register(screenId, fn) { builders[screenId] = fn; }
  function get() { return current; }
  function track(stage) { tracked.push(stage); }

  GS.engine = { mount: mount, dispose: dispose, register: register, get: get, Stage: Stage, track: track };
})();
