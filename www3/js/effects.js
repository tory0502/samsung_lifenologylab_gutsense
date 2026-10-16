/* GutSense — game effects engine. canvas-confetti wrapper + screen FX.
 * Celebrations for quest/level/streak. Exposed as window.GS.fx2.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  var HAS_CONFETTI = typeof window.confetti === 'function';

  function burst(x, y, opts) {
    opts = opts || {};
    if (!HAS_CONFETTI) return;
    var colors = opts.colors || ['#37C7FF', '#27D89B', '#A98CFF', '#FFC44D', '#7ADCFF'];
    window.confetti({
      particleCount: opts.count || 60,
      spread: opts.spread || 70,
      origin: { x: (x || 0.5), y: (y || 0.5) },
      colors: colors,
      startVelocity: opts.velocity || 35,
      decay: 0.92,
      scalar: opts.scale || 1,
      ticks: 120
    });
  }

  function celebrate() {
    if (!HAS_CONFETTI) return;
    var end = Date.now() + 800;
    (function frame() {
      window.confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#37C7FF', '#7ADCFF'] });
      window.confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#A98CFF', '#27D89B'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  function questDone() {
    burst(0.5, 0.4, { count: 50, spread: 60, colors: ['#FFC44D', '#37C7FF', '#27D89B'] });
  }

  function levelUp() {
    celebrate();
  }

  function streakFlame(days) {
    if (days < 3 || !HAS_CONFETTI) return;
    burst(0.5, 0.3, { count: 30 + days * 3, spread: 100, colors: ['#FF8A4D', '#FFC44D', '#FF5C7A'], velocity: 45 });
  }

  function screenFlash(color) {
    var app = document.querySelector('.app');
    if (!app) return;
    var f = document.createElement('div');
    f.style.cssText = 'position:absolute;inset:0;z-index:200;pointer-events:none;background:' + (color || 'rgba(55,199,255,.25)') + ';opacity:1;transition:opacity .5s';
    app.appendChild(f);
    requestAnimationFrame(function () { f.style.opacity = '0'; });
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 600);
  }

  function numberPop(el) {
    if (!el || !el.style) return;
    el.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1)';
    el.style.transform = 'scale(1.4)';
    setTimeout(function () { el.style.transform = 'scale(1)'; }, 300);
  }

  GS.fx2 = { burst: burst, celebrate: celebrate, questDone: questDone, levelUp: levelUp, streakFlame: streakFlame, screenFlash: screenFlash, numberPop: numberPop };
})();
