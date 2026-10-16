/* GutSense www3 — navigation shell. Boots, routes screens, owns the global
 * top-right cluster (home + bell + profile) and 3D lifecycle.
 * UPGRADE: alert/profile removed from world map → global icons.
 * Exposed as window.GS.nav.
 */
(function () {
  'use strict';
  var GS = window.GS = window.GS || {};
  GS.screens = GS.screens || {};
  var ui = (window.GS.ui) || { T: {} };

  var NODES = [
    { id: 'gutmap', icon: '🧬', label: '장 맵', accent: '#37C7FF' },
    { id: 'diet', icon: '🍽️', label: '식단', accent: '#27D89B' },
    { id: 'endoscope', icon: '🔮', label: '타임 비전', accent: '#A98CFF' },
    { id: 'quest', icon: '⭐', label: '미션', accent: '#FFC44D' }
  ];

  var menuOpen = false;
  var savedScroll = 0;
  var navHistory = ['home'];
  var navIdx = 0;

  if (!document.getElementById('gs-nav-glow-style')) {
    var ngs = document.createElement('style'); ngs.id = 'gs-nav-glow-style';
    ngs.textContent =
      '@keyframes gsProfileGlow{0%,100%{box-shadow:0 0 0 1.5px rgba(122,220,255,.55),0 0 12px rgba(55,199,255,.45),0 8px 22px rgba(0,0,0,.36)}50%{box-shadow:0 0 0 2.5px rgba(169,220,255,.95),0 0 24px rgba(55,199,255,.85),0 8px 26px rgba(0,0,0,.4)}}' +
      '@keyframes gsProfileRing{0%{background-position:0% 50%}100%{background-position:200% 50%}}' +
      '.gs-profile-pill{animation:gsProfileGlow 1.8s ease-in-out infinite;transition:transform .15s}' +
      '.gs-profile-pill:active{transform:scale(.93)}' +
      '.gs-profile-ring{background:linear-gradient(90deg,#37C7FF,#A98CFF,#7ADCFF,#37C7FF);background-size:200% 100%;animation:gsProfileRing 3s linear infinite}';
    document.head.appendChild(ngs);
  }

  function currentTab() { return (GS.store && GS.store.nav.get()) || 'home'; }
  function go(tab) {
    var c = document.querySelector('.screen'); if (c) savedScroll = 0;
    if (tab === 'diet' && GS.screens.diet && GS.screens.diet.enterToday) { try { GS.screens.diet.enterToday(); } catch (e) {} }
    if (tab !== navHistory[navIdx]) {
      navHistory = navHistory.slice(0, navIdx + 1);
      navHistory.push(tab);
      navIdx = navHistory.length - 1;
    }
    GS.store.nav.setTab(tab); render(); var sc = document.querySelector('.screen'); if (sc) sc.scrollTop = 0;
  }
  function goBack() { if (navIdx > 0) { navIdx--; GS.store.nav.setTab(navHistory[navIdx]); render(); } }
  function goForward() { if (navIdx < navHistory.length - 1) { navIdx++; GS.store.nav.setTab(navHistory[navIdx]); render(); } }
  function teardown() { if (GS.engine && GS.engine.dispose) { try { GS.engine.dispose(); } catch (e) {} } }
  function mount(cur) { if (GS.engine && GS.engine.mount) { try { GS.engine.mount(cur); } catch (e) {} } }

  function renderTopLeft() {
    var top = 'calc(env(safe-area-inset-top,0px) + 12px)';
    var canBack = navIdx > 0;
    var canFwd = navIdx < navHistory.length - 1;
    var backOp = canBack ? '1' : '.25';
    var fwdOp = canFwd ? '1' : '.25';
    return '<div style="position:absolute;top:' + top + ';left:12px;z-index:60;display:flex;gap:5px">' +
      '<div onclick="GS.nav.goBack()" style="width:32px;height:32px;border-radius:50%;background:rgba(14,30,60,.6);backdrop-filter:blur(10px);border:1px solid rgba(122,220,255,.15);display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:' + backOp + (canBack ? ';transition:transform .14s' : ';pointer-events:none') + '" ' + (canBack ? 'ontouchstart="this.style.transform=\'scale(.9)\'" ontouchend="this.style.transform=\'\'"' : '') + '><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7ADCFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></div>' +
      '<div onclick="GS.nav.goForward()" style="width:32px;height:32px;border-radius:50%;background:rgba(14,30,60,.6);backdrop-filter:blur(10px);border:1px solid rgba(122,220,255,.15);display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:' + fwdOp + (canFwd ? ';transition:transform .14s' : ';pointer-events:none') + '" ' + (canFwd ? 'ontouchstart="this.style.transform=\'scale(.9)\'" ontouchend="this.style.transform=\'\'"' : '') + '><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7ADCFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>' +
    '</div>';
  }

  function renderTopRight() {
    var cur = currentTab();
    var parts = [];
    var alerts = (GS.store && GS.store.alerts) ? GS.store.alerts.active() : [];
    var badFoods = (GS.store && GS.store.diet) ? GS.store.diet.foodsToday().filter(function (f) { return f.bad; }) : [];
    var bellActive = alerts.length > 0 || badFoods.length > 0;
    var bellCount = alerts.length + badFoods.length;

    var top = 'calc(env(safe-area-inset-top,0px) + 12px)';
    parts.push('<div style="position:absolute;top:' + top + ';right:12px;z-index:60;display:flex;align-items:center;gap:8px">');

    if (cur !== 'home') {
      parts.push('<div onclick="GS.nav.go(\'home\')" style="width:40px;height:40px;border-radius:50%;background:rgba(14,30,60,.82);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(122,220,255,.28);box-shadow:0 8px 22px rgba(0,0,0,.36);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .14s" ontouchstart="this.style.transform=\'scale(.92)\'" ontouchend="this.style.transform=\'\'"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7ADCFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>');
    }

    parts.push(ui.bellButton(bellActive, bellCount));

    var profiles = (GS.store.profiles && GS.store.profiles.list()) || [];
    if (profiles.length >= 1) {
      var active = GS.store.profiles.activeId();
      var ap = profiles.filter(function (p) { return p.id === active; })[0] || profiles[0];
      parts.push('<div class="gs-profile-pill" style="display:flex;align-items:center;gap:6px;padding:5px 12px 5px 5px;border-radius:999px;background:rgba(14,30,60,.82);backdrop-filter:blur(12px);border:1px solid rgba(122,220,255,.28);cursor:pointer" onclick="GS.nav.goProfile()">');
      parts.push('<div style="width:30px;height:30px;border-radius:50%;padding:1.5px;overflow:hidden" class="gs-profile-ring"><div style="width:100%;height:100%;border-radius:50%;background:#0E2244;display:flex;align-items:center;justify-content:center;font-size:15px;overflow:hidden">' + GS.chars.avatarHtml(ap.avatar, 26) + '</div></div>');
      if (profiles.length >= 2) {
        parts.push('<span style="font-size:12px;color:var(--ink);max-width:54px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + ap.name + '</span>');
        parts.push('<span onclick="event.stopPropagation();GS.nav.toggleProfileMenu()" style="font-size:14px;color:var(--cyan);padding:0 2px;cursor:pointer">⇄</span>');
      }
      parts.push('</div>');
    }
    parts.push('</div>');
    return parts.join('');
  }

  function renderProfileSwitcher() {
    var profiles = (GS.store.profiles && GS.store.profiles.list()) || [];
    if (profiles.length < 2 || !menuOpen) return '';
    var active = GS.store.profiles.activeId();
    var items = profiles.map(function (p) {
      var on = p.id === active;
      return '<div onclick="GS.nav.selectProfile(\'' + p.id + '\')" style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:16px;cursor:pointer;background:' + (on ? 'rgba(55,199,255,.16)' : 'rgba(122,220,255,.05)') + ';margin-bottom:6px;border:1px solid ' + (on ? 'rgba(55,199,255,.4)' : 'transparent') + '">' +
        '<div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;background:rgba(122,220,255,.12);overflow:hidden">' + GS.chars.avatarHtml(p.avatar, 30) + '</div>' +
        '<div style="flex:1;min-width:0"><div style="font-size:13px;color:var(--ink)">' + p.name + (on ? ' <span style="color:var(--cyan);font-size:9px">● 현재</span>' : '') + '</div>' +
        '<div style="font-size:10px;color:var(--ink-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.bio || '') + '</div></div></div>';
    }).join('');
    return '<div onclick="GS.nav.toggleProfileMenu()" style="position:absolute;inset:0;z-index:64;background:rgba(4,10,22,.55)"></div>' +
      '<div class="fadeIn" style="position:absolute;top:calc(env(safe-area-inset-top,0px) + 60px);right:60px;z-index:65;width:250px;background:linear-gradient(160deg,rgba(20,40,78,.97),rgba(10,22,48,.97));backdrop-filter:blur(18px);border:1px solid rgba(122,220,255,.24);border-radius:22px;padding:12px;box-shadow:0 18px 44px rgba(0,0,0,.55)">' +
      '<div class="micro" style="color:var(--cyan);margin-bottom:10px;padding:0 4px">레지던트 전환 · 수치 즉시 비교</div>' + items + '</div>';
  }

  function toggleProfileMenu() { menuOpen = !menuOpen; render(); }
  function selectProfile(id) { menuOpen = false; GS.store.profiles.switch(id); var p = GS.store.profile.get(); if (GS.ui) GS.ui.toast('레지던트 전환 → ' + (p ? p.name : ''), 'info'); render(); if (GS.story) GS.story.beat('switch', { force: true }); }
  function goProfile() { go('profile'); }

  function openBell() {
    if (!GS.screens.alert || !GS.screens.alert.bellPopup) return;
    GS.screens.alert.bellPopup();
  }

  // Dr.장 시크릿 랩 진입 — 캐릭터 하얀 발광 → 화면 플래시 → 이동.
  // chars.js 의 [data-gs-lab] 캐릭터를 문서 위임 리스너가 캐치해 호출한다.
  function openSecretLab(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (currentTab() === 'secretlab') return;
    var el = (e && e.target && e.target.closest) ? e.target.closest('[data-gs-lab]') : null;
    if (el && el.classList) el.classList.add('gs-lab-charge');
    setTimeout(function () {
      if (GS.fx2 && GS.fx2.screenFlash) GS.fx2.screenFlash('rgba(255,255,255,.92)');
      go('secretlab');
    }, 480);
  }

  // 전역 위임 — 어떤 화면이든 Dr.장 캐릭터 클릭 시 시크릿 랩 진입
  document.addEventListener('click', function (e) {
    var el = (e.target && e.target.closest) ? e.target.closest('[data-gs-lab]') : null;
    if (!el) return;
    openSecretLab(e);
  }, false);

  function render() {
    var c = document.querySelector('.screen'); if (c) savedScroll = c.scrollTop;
    teardown();
    // Globally apply auto-detected missions BEFORE any screen renders, so every
    // screen (home map card, quest header, profile) sees the same fresh count.
    // Idempotent: only completes newly-detected missions, never double-applies.
    if (GS.store && GS.store.quests && GS.store.quests.autoApply) {
      try { GS.store.quests.autoApply(); } catch (e) {}
    }
    var cur = currentTab();
    var fn = GS.screens[cur];
    if (!fn) { cur = 'home'; fn = GS.screens.home; }
    var root = document.getElementById('root');
    if (!root) return;
    var html;
    try { html = fn(); } catch (e) { html = '<div class="pad" style="color:var(--red)">화면 오류: ' + (e && e.message) + '</div>'; }
    root.innerHTML = '<div class="screen">' + html + '</div>' + renderTopLeft() + renderTopRight() + renderProfileSwitcher();
    mount(cur);
    var sc = document.querySelector('.screen');
    if (sc && savedScroll) sc.scrollTop = savedScroll;
    savedScroll = 0;
    if (cur === 'gutmap' && GS.story) GS.story.beat('intro-gutmap');
  }

  function boot() {
    if (!GS.store.profile.isOnboarded()) {
      teardown();
      var root = document.getElementById('root'); if (!root) return;
      root.innerHTML = '<div class="screen">' + (GS.screens.login ? GS.screens.login() : '<div style="display:flex;align-items:center;justify-content:center;height:100%"><div style="width:34px;height:34px;border:3px solid rgba(122,220,255,.22);border-top-color:#7ADCFF;border-radius:50%;animation:spin .8s linear infinite"></div></div>') + '</div>';
      mount('login');
      return;
    }
    render();
  }

  function reRenderKeepScroll() {
    var c = document.querySelector('.screen'); if (c) savedScroll = c.scrollTop;
    render();
  }

  GS.nav = {
    NODES: NODES, currentTab: currentTab, go: go, render: render, boot: boot,
    toggleProfileMenu: toggleProfileMenu, selectProfile: selectProfile,
    goProfile: goProfile, openBell: openBell, openSecretLab: openSecretLab,
    reRenderKeepScroll: reRenderKeepScroll,
    goBack: goBack, goForward: goForward
  };
})();
