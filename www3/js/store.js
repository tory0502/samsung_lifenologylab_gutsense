/* GutSense state store - localStorage persistence + derived computations.
 * Exposed as window.GS.store. All mutations persist and return fresh state.
 */
(function () {
  'use strict';
  var D = window.GS_DATA;
  var KEY = 'gutsense_v2';

  // ============================================================
  // MULTI-PROFILE SEED — two demo residents shown on the login
  // screen as selectable "residents". Real registration adds more.
  // `s.profile` always mirrors the active resident for backward compat
  // (other screens read load().profile directly and stay unchanged).
  // ============================================================
  // Each resident carries a frozen `scenario` (diet today + quests + xp) that
  // drives every derived metric. Switching residents swaps the session state
  // to that scenario, so 정형돈(bad) vs 유재석(good) contrast instantly.
  function seedProfiles() {
    return [
      { id: 'ws', name: '정형돈', gender: 'male', age: 34, lifestyle: 'sedentary', avatar: 'jd', bio: '10년차 프로그래머 · 제로음료·라면·야식 상시', createdAt: 0, onboarded: true, demo: true, resetHours: 20,
        scenario: { diet: ['soda', 'noodle', 'snack', 'sausage', 'beer', 'cake'], quests: ['q_walk'], xp: 40 } },
      { id: 'hj', name: '유재석', gender: 'male', age: 29, lifestyle: 'active', avatar: 'yjs', bio: '마라톤 러너 · 발효식품·식이섬유 챙김', createdAt: 0, onboarded: true, demo: true, resetHours: 20,
        scenario: { diet: ['yogurt', 'kimchi', 'greens', 'banana', 'oats', 'berry'], quests: ['q_fiber', 'q_water', 'q_walk', 'q_ferment'], xp: 520 } }
    ];
  }

  function defaultState() {
    return {
      onboarded: false,
      profile: null,           // active resident mirror (backward compat)
      profiles: null,          // seeded on first load (null = not yet seeded)
      activeProfileId: null,   // id of the currently selected resident
      dietLog: [],             // [{date:'YYYY-MM-DD', foods:[id], ts}]
      questDone: [],           // [questId]
      xp: 0,
      alertsDismissed: [],     // [comboKey]
      activeTab: 'home',
      lastScreen: 'home',
      // game layer (SCENE.md core metrics + streak + scene + reset)
      streakCount: 0,
      lastQuestDate: null,     // 'YYYY-MM-DD' of last quest-completion day
      mealCount: 0,            // total meals shown through the 4-act scene (fatigue)
      lastSceneTs: 0,
      lastSceneFood: null,     // {id, bad} last food that triggered a scene
      resetStartedAt: null,    // ms timestamp when 48h reset challenge began
      resetHours: 0,           // simulated elapsed hours (advances on visits)
      resetQuestsDone: 0,
      introSeen: false,        // intro animation played once
      theme: 'lab',            // 'day' | 'lab'
      customFoods: []          // user-added foods (persist + merge with D.FOODS)
    };
  }

  var cache = null;

  function load() {
    if (cache) return cache;
    try {
      var raw = localStorage.getItem(KEY);
      cache = raw ? JSON.parse(raw) : defaultState();
    } catch (e) { cache = defaultState(); }
    // schema migrate: ensure all keys
    var def = defaultState();
    Object.keys(def).forEach(function (k) { if (!(k in cache)) cache[k] = def[k]; });
    // migrate legacy viaKakao field to viaSamsung
    if (cache.profile && cache.profile.viaKakao !== undefined && cache.profile.viaSamsung === undefined) {
      cache.profile.viaSamsung = cache.profile.viaKakao;
      delete cache.profile.viaKakao;
    }
    // seed demo residents on first run; mirror the active one into s.profile
    if (!cache.profiles || !cache.profiles.length) {
      cache.profiles = seedProfiles();
      if (!cache.activeProfileId) cache.activeProfileId = 'ws';
      if (!cache.profile) {
        for (var pi = 0; pi < cache.profiles.length; pi++) {
          if (cache.profiles[pi].id === cache.activeProfileId) { cache.profile = cache.profiles[pi]; break; }
        }
      }
    }
    // rename legacy demo residents in place (장우성→정형돈, 이혜준→유재석) + custom avatar keys
    (cache.profiles || []).forEach(function (p) {
      if (p.id === 'ws' && p.name === '장우성') p.name = '정형돈';
      if (p.id === 'ws' && (p.avatar === '🧑' || !p.avatar)) p.avatar = 'jd';
      if (p.id === 'hj' && p.name === '이혜준') { p.name = '유재석'; p.gender = 'male'; }
      if (p.id === 'hj' && (p.avatar === '👨' || p.avatar === '👩' || !p.avatar)) p.avatar = 'yjs';
      if (cache.profile && cache.profile.id === p.id && cache.profile.name !== p.name) {
        cache.profile.name = p.name; cache.profile.gender = p.gender; cache.profile.avatar = p.avatar;
      } else if (cache.profile && cache.profile.id === p.id && cache.profile.avatar !== p.avatar) {
        cache.profile.avatar = p.avatar;
      }
    });
    // Older sessions can persist a partial profile (age/lifestyle/bio missing) in the mirror.
    if (cache.profile && cache.profiles && cache.profiles.length) {
      for (var mi = 0; mi < cache.profiles.length; mi++) {
        if (cache.profiles[mi].id === cache.profile.id) {
          var mirror = cache.profiles[mi];
          // canonical wins; keep mirror-only legacy fields (e.g. viaSamsung)
          Object.keys(cache.profile).forEach(function (mk) { if (!(mk in mirror)) mirror[mk] = cache.profile[mk]; });
          cache.profile = mirror;
          break;
        }
      }
      if (!cache.activeProfileId && cache.profile) cache.activeProfileId = cache.profile.id;
    }
    // backfill the canonical scenario onto any resident missing it (old sessions),
    // then sync the live session to the active resident so the contrast holds.
    var _seeded = seedProfiles();
    (cache.profiles || []).forEach(function (p) {
      if (p.id === 'ws' || p.id === 'hj') {
        p.demo = true; if (p.resetHours == null) p.resetHours = 20;
        for (var si0 = 0; si0 < _seeded.length; si0++) if (_seeded[si0].id === p.id) p.scenario = _seeded[si0].scenario;
      }
      if (!p.scenario) {
        for (var si = 0; si < _seeded.length; si++) { if (_seeded[si].id === p.id) { p.scenario = _seeded[si].scenario; break; } }
        if (!p.scenario) p.scenario = { diet: [], quests: [], xp: 0 };
      }
    });
    if (cache.activeProfileId && cache.profile && cache.profile.id === cache.activeProfileId) {
      applyScenario(cache.profile);
    }
    if (cache.profile && cache.profile.demo && !cache.resetStartedAt) cache.resetStartedAt = Date.now();
    return cache;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {}
    return cache;
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Load a resident's frozen scenario into the live session so every derived
  // metric (state3/coreMetrics/zoneStates/gutScore) recomputes for them.
  function applyScenario(p) {
    var s = load();
    s.autoAppliedDate = null;
    if (!p || !p.scenario) { s.dietLog = []; s.questDone = []; s.xp = 0; return; }
    var sc = p.scenario;
    s.dietLog = (sc.diet && sc.diet.length) ? [{ date: today(), foods: sc.diet.slice(), ts: Date.now() }] : [];
    s.questDone = (sc.quests || []).slice();
    s.xp = sc.xp || 0;
  }
  // Write live session edits back into the active resident's scenario (per-profile persistence).
  function writeBackScenario() {
    var s = load();
    if (!s.activeProfileId || !s.profiles) return;
    for (var i = 0; i < s.profiles.length; i++) {
      if (s.profiles[i].id === s.activeProfileId) {
        s.profiles[i].scenario = { diet: dietToday().slice(), quests: s.questDone.slice(), xp: s.xp };
        return;
      }
    }
  }

  // ---- profile (active resident) ----
  function setProfile(p) {
    var s = load();
    if (!p) return save();
    if (!p.id) p.id = 'p' + Date.now();
    s.profile = p;
    s.onboarded = true;
    if (!s.profiles) s.profiles = [];
    var idx = -1;
    for (var i = 0; i < s.profiles.length; i++) { if (s.profiles[i].id === p.id) { idx = i; break; } }
    if (idx >= 0) s.profiles[idx] = p; else s.profiles.push(p);
    s.activeProfileId = p.id;
    return save();
  }
  function getProfile() { return load().profile; }
  function isOnboarded() { return !!load().onboarded && !!load().profile; }

  // ---- multi-profile ----
  function listProfiles() { return load().profiles || []; }
  function getActiveProfileId() { return load().activeProfileId; }
  function freshSessionState(s) {
    s.dietLog = []; s.questDone = []; s.xp = 0;
    s.resetStartedAt = null; s.resetHours = 0; s.resetQuestsDone = 0; s.resetRewardApplied = false;
    s.streakCount = 0; s.lastQuestDate = null;
    s.mealCount = 0; s.lastSceneTs = 0; s.lastSceneFood = null;
    s.alertsDismissed = []; s.autoAppliedDate = null;
    return s;
  }
  function switchProfile(id) {
    var s = load();
    var p = null;
    for (var i = 0; i < (s.profiles || []).length; i++) { if (s.profiles[i].id === id) { p = s.profiles[i]; break; } }
    if (!p) return null;
    s.activeProfileId = id;
    s.profile = p;
    s.onboarded = true;
    if (!p.demo) freshSessionState(s);
    applyScenario(p);
    return save();
  }
  function addProfile(p) {
    var s = load();
    if (!p) return save();
    if (!p.id) p.id = 'p' + Date.now();
    p.createdAt = p.createdAt || Date.now();
    if (!p.scenario) p.scenario = { diet: [], quests: [], xp: 0 };
    if (!s.profiles) s.profiles = [];
    s.profiles.push(p);
    s.activeProfileId = p.id;
    s.profile = p;
    s.onboarded = true;
    freshSessionState(s);
    s.resetStartedAt = Date.now();
    s.resetHours = 0;
    applyScenario(p);
    return save();
  }
  function removeProfile(id) {
    var s = load();
    s.profiles = (s.profiles || []).filter(function (x) { return x.id !== id; });
    if (s.activeProfileId === id) {
      s.activeProfileId = s.profiles.length ? s.profiles[0].id : null;
      s.profile = s.profiles.length ? s.profiles[0] : null;
      if (!s.profile) s.onboarded = false;
    }
    return save();
  }

  // ---- diet ----
  function dietForDate(date) {
    var s = load();
    var entry = s.dietLog.filter(function (e) { return e.date === date; })[0];
    return entry ? entry.foods : [];
  }
  function dietToday() { return dietForDate(today()); }

  function toggleFood(foodId) {
    var s = load();
    var date = today();
    var entry = s.dietLog.filter(function (e) { return e.date === date; })[0];
    if (!entry) { entry = { date: date, foods: [], ts: Date.now() }; s.dietLog.push(entry); }
    var i = entry.foods.indexOf(foodId);
    if (i >= 0) entry.foods.splice(i, 1);
    else entry.foods.push(foodId);
    s.dietLog = s.dietLog.slice(-30);
    writeBackScenario();
    return save();
  }
  function clearDietToday() {
    var s = load();
    var date = today();
    s.dietLog = s.dietLog.filter(function (e) { return e.date !== date; });
    writeBackScenario();
    return save();
  }

  function addCustomFood(name, cat, bad) {
    var s = load();
    var id = 'custom_' + Date.now();
    cat = cat || 'mixed';
    var f = {
      id: id, label: name, cat: cat, bad: !!bad, custom: true,
      scfa: bad ? -12 : 8, lps: bad ? 16 : -5, inf: bad ? 14 : -6,
      fiber: cat === 'fiber' ? 4 : 1, sugar: cat === 'sugar' ? 20 : 2, fat: 5,
      ev: '사용자 직접 입력'
    };
    if (!s.customFoods) s.customFoods = [];
    s.customFoods.push(f);
    s.customFoods = s.customFoods.slice(-30);
    save();
    return f;
  }

  function dietWeekSummary() {
    var s = load();
    var prof = s.profile;
    var pool = allFoods();
    function foodById(id) { for (var i = 0; i < pool.length; i++) { if (pool[i].id === id) return pool[i]; } return null; }
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      var loggedFoods = dietForDate(ds);
      var objs, imp;
      if (loggedFoods.length > 0) {
        objs = loggedFoods.map(function (id) { return foodById(id); }).filter(Boolean);
        imp = { scfa: 0, lps: 0, inf: 0 };
        objs.forEach(function (f) { imp.scfa += f.scfa; imp.lps += f.lps; imp.inf += f.inf; });
      } else if (prof && i > 0) {
        var tl = D.aiTimeline(prof, ds);
        var mealEvents = tl.events.filter(function (e) { return e.type === 'meal' && e.foodId; });
        objs = mealEvents.map(function (e) { return foodById(e.foodId); }).filter(Boolean);
        imp = tl.cumulative;
      } else {
        objs = [];
        imp = { scfa: 0, lps: 0, inf: 0 };
      }
      out.push({ date: ds, dow: d.getDay(), foods: objs, impact: imp, count: objs.length });
    }
    return out;
  }

  function weeklyRanking() {
    var p = load().profile || {};
    var score = gutScore();
    return D.weeklyRanking(p, score);
  }

  // ---- derived: today's food objects (includes custom foods) ----
  function allFoods() {
    var s = load();
    return (D.FOODS || []).concat(s.customFoods || []);
  }
  function foodsToday() {
    var ids = dietToday();
    var pool = allFoods();
    return ids.map(function (id) { return pool.filter(function (f) { return f.id === id; })[0]; }).filter(Boolean);
  }
  function kstTotalMin() {
    var p = new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
    return (parseInt(p.split(':')[0], 10) % 24) * 60 + parseInt(p.split(':')[1], 10);
  }
  // AI 렌즈 타임라인 기준 "지금까지 먹은" 음식 (타임라인 표시·상세·지표의 단일 소스)
  function foodsEatenToday() {
    var now = kstTotalMin();
    var tl = aiTimeline();
    var pool = allFoods(), seen = {}, out = [];
    tl.events.forEach(function (e) {
      if (!e.foodId || e.hour * 60 + e.min > now) return;
      var f = null;
      for (var i = 0; i < pool.length; i++) if (pool[i].id === e.foodId) { f = pool[i]; break; }
      if (f && !seen[f.id]) { seen[f.id] = 1; out.push(f); }
    });
    if (!out.length) {
      var firstMeal = null;
      for (var m = 0; m < tl.events.length; m++) if (tl.events[m].foodId) { firstMeal = tl.events[m]; break; }
      if (firstMeal) {
        for (var p = 0; p < pool.length; p++) if (pool[p].id === firstMeal.foodId) { out.push(pool[p]); break; }
      }
    }
    return out;
  }

  // ---- derived: cumulative impact deltas (includes custom foods) ----
  function impact() {
    var foods = foodsToday();
    var acc = { scfa: 0, lps: 0, inf: 0 };
    foods.forEach(function (f) {
      acc.scfa += f.scfa; acc.lps += f.lps; acc.inf += f.inf;
    });
    var s = load();
    s.questDone.forEach(function (qid) {
      var q = D.QUESTS.filter(function (x) { return x.id === qid; })[0];
      if (q && q.fix) { acc.scfa += q.fix.scfa; acc.lps += q.fix.lps; acc.inf += q.fix.inf; }
    });
    return acc;
  }

  // ---- derived: gutMetrics 엔진 파이프라인 (식단→SCFA→투과성→염증→도파민) ----
  // 신규 프로필(감지 없음)은 한국인 평균 식사 입력으로 중립 시작
  var GM_NEUTRAL = { fiber: 15, satFat: 8 };
  var SCORE_CAL = { sysLo: 13, sysHi: 89, outLo: 21, outHi: 94 };
  function gmInput() {
    var foods = foodsEatenToday();
    if (!foods.length) return GM_NEUTRAL;
    return GS.gm.aggregate(foods);
  }
  function gmResult() {
    return GS.gm.computeMetrics(gmInput(), null);
  }
  function state3() {
    var r = gmResult();
    return { scfa: r.scfa, lps: r.permeability, inf: r.inflammation };
  }

  // ---- derived: composite gut score (엔진 system status → 표시 스케일 보정) ----
  function gutScore() {
    var sys = gmResult().system.score;
    var c = SCORE_CAL;
    var t = (sys - c.sysLo) / (c.sysHi - c.sysLo);
    return Math.round(Math.max(5, Math.min(97, c.outLo + t * (c.outHi - c.outLo))));
  }

  // ---- derived: dynamic per-zone scores ----
  function zoneStates() {
    var st = state3();
    var scfaFactor = (st.scfa - 60) / 40; // -1..+1ish
    return D.GUT_ZONES.map(function (z) {
      // distal zones are more diet-sensitive
      var sens = 0.5 + z.inflow * 0.8;
      var delta = Math.round(scfaFactor * sens * 12);
      return {
        id: z.id, name: z.name, eng: z.eng, color: z.color,
        baseScore: z.baseScore,
        score: D.clamp(z.baseScore + delta),
        role: z.role, risk: z.risk, evidence: z.evidence, advice: z.advice,
        feature: z.feature, microbe: z.microbe, barrierNote: z.barrierNote,
        indices: {
          scfa: D.clamp(z.indices.scfa + Math.round(scfaFactor * 10)),
          permeability: D.clamp(z.indices.permeability - Math.round(scfaFactor * 8)),
          inflammation: D.clamp(z.indices.inflammation - Math.round(scfaFactor * 8)),
          motility: D.clamp(z.indices.motility + Math.round(scfaFactor * 5))
        },
        sources: z.sources
      };
    });
  }

  // ---- derived: active alerts (bad combos not dismissed) ----
  function activeAlerts() {
    var s = load();
    var ids = dietToday();
    var out = [];
    D.BAD_COMBOS.forEach(function (c) {
      var hit = c.ids.every(function (id) { return ids.indexOf(id) >= 0; });
      var key = c.ids.join('+');
      if (hit && s.alertsDismissed.indexOf(key) < 0) out.push(c);
    });
    // also: high LPS or inflammation
    var st = state3();
    if (st.lps > 70 && out.length === 0) {
      out.push({ title: '내독소(LPS) 고위험', sev: 'mid', why: '최근 식단으로 장 투과성 상승 추정. 유해균 대사물 혈류 유입 가능.', zone: 'ascending', ev: 'Gut 2023', synthetic: true });
    }
    return out;
  }
  function dismissAlert(key) {
    var s = load();
    if (s.alertsDismissed.indexOf(key) < 0) s.alertsDismissed.push(key);
    return save();
  }

  // ---- quests ----
  function toggleQuest(id) {
    var s = load();
    var q = D.QUESTS.filter(function (x) { return x.id === id; })[0];
    var i = s.questDone.indexOf(id);
    if (i >= 0) {
      s.questDone.splice(i, 1);
      if (q) s.xp = Math.max(0, s.xp - q.xp);
      if (s.resetStartedAt && s.resetQuestsDone > 0) s.resetQuestsDone--;
    } else {
      s.questDone.push(id);
      if (q) s.xp += q.xp;
      if (s.resetStartedAt) s.resetQuestsDone++;
      var t = today();
      if (s.lastQuestDate !== t) {
        var y = new Date(); y.setDate(y.getDate() - 1);
        var yStr = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
        s.streakCount = (s.lastQuestDate === yStr) ? (s.streakCount + 1) : 1;
        s.lastQuestDate = t;
      }
    }
    writeBackScenario();
    return save();
  }
  function level() { return D.levelForXp(load().xp); }

  // ---- navigation ----
  function setTab(t) { var s = load(); s.activeTab = t; s.lastScreen = t; return save(); }

  // ---- mock streams (EMR/sensor) ----
  function streams() {
    var s = load();
    if (!s.profile) return [];
    var imp = impact();
    var net = imp.scfa + imp.lps + imp.inf; // proxy
    return D.mockStreams(s.profile, Math.round(net / 2));
  }

  // ---- demographic comparison ("people like me") ----
  function cluster() {
    var s = load();
    return s.profile ? D.clusterFor(s.profile) : null;
  }
  function compareMetric(metric, userValue) {
    var s = load();
    if (!s.profile) return null;
    return D.compareMetric(s.profile, metric, userValue);
  }
  // user's current derived biomarker values (today)
  function userBiomarkers() {
    var s = load();
    if (!s.profile) return null;
    var st = state3();
    var streams = D.mockStreams(s.profile, 0);
    var t = streams[0] || {};
    return {
      crp: parseFloat(t.biomarkers ? t.biomarkers.crp : 0.8),
      fg:  t.biomarkers ? t.biomarkers.fasting_glucose : 92,
      tg:  t.biomarkers ? t.biomarkers.triglyceride : 120,
      scfa: st.scfa,
      lps:  st.lps,
      inf:  st.inf
    };
  }

  // ---- AI glasses timeline ----
  function aiTimeline(dateStr) {
    var s = load();
    if (!s.profile) return { events: [], cumulative: { scfa: 0, lps: 0, inf: 0 } };
    return D.aiTimeline(s.profile, dateStr || D.todayStr());
  }
  function aiTimelineWeek() {
    var out = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      out.push(Object.assign({ date: ds, dow: d.getDay() }, aiTimeline(ds)));
    }
    return out;
  }

  // ---- auto-detected quest signals ----
  function autoQuestSignals(dateStr) {
    var s = load();
    if (!s.profile) return {};
    return D.autoQuestSignals(s.profile, dateStr || D.todayStr());
  }
  function autoApplyQuests() {
    var s = load();
    var t = today();
    if (s.autoAppliedDate === t) return [];
    var signals = autoQuestSignals();
    var changed = [];
    Object.keys(signals).forEach(function (qid) {
      var sig = signals[qid];
      var isDone = s.questDone.indexOf(qid) >= 0;
      if (sig.detected && !isDone) {
        s.questDone.push(qid);
        var q = D.QUESTS.filter(function (x) { return x.id === qid; })[0];
        if (q) s.xp += q.xp;
        changed.push({ id: qid, action: 'completed', evidence: sig.evidence });
      }
    });
    s.autoAppliedDate = t;
    if (changed.length) {
      if (s.lastQuestDate !== t) {
        var y = new Date(); y.setDate(y.getDate() - 1);
        var yStr = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
        s.streakCount = (s.lastQuestDate === yStr) ? (s.streakCount + 1) : 1;
        s.lastQuestDate = t;
      }
      save();
    }
    return changed;
  }

  // ============================================================
  // CORE METRICS — 3 causally linked indicators (SCENE.md CORE 지표).
  // permeability(↑bad): LPS burden weighted + SCFA deficit.
  // inflammation(↑bad): (LPS + inf)/2 — matches GBA 시뮬레이션.
  // dopamine(↑good):    asymmetric memory over last 3 days, ceiling = 100 - inflammation*0.5.
  // ============================================================
  function dietLastNDays(n) {
    var s = load();
    var out = [];
    for (var i = 0; i < n; i++) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      var entry = s.dietLog.filter(function (e) { return e.date === ds; })[0];
      if (entry) out.push(entry);
    }
    return out;
  }
  function coreMetrics() {
    var r = gmResult();
    var s = load();
    var dopamine = r.dopamine;
    // 48시간 리셋 보너스 + 미션 fix 가산 (엔진 값 위에 게임 보너스만 얹음)
    if (s.resetStartedAt && s.resetHours >= D.RESET_CHALLENGE.durationHours) {
      dopamine += D.RESET_CHALLENGE.reward.dopamine;
    }
    s.questDone.forEach(function (qid) {
      var q = D.QUESTS.filter(function (x) { return x.id === qid; })[0];
      if (q && q.fix) dopamine += Math.round(Math.abs(q.fix.scfa) * 0.3);
    });
    var ceil = D.dopaCeiling(r.inflammation);
    dopamine = Math.max(D.CORE_METRICS.dopamine.floor, Math.min(ceil, dopamine));
    return {
      permeability: r.permeability,
      inflammation: r.inflammation,
      dopamine: Math.round(dopamine),
      scfa: r.scfa, butyrate: r.butyrate, lpsFold: r.lpsFold,
      lps: r.permeability, inf: r.inflammation,
      system: r.system,
      ceiling: Math.round(ceil),
      weather: D.weatherFor(r.inflammation),
      dopaState: D.dopaStateFor(dopamine)
    };
  }

  // ============================================================
  // STREAK — persisted consecutive-day quest completion.
  // ============================================================
  function streak() {
    var s = load();
    var days = s.streakCount || 0;
    // streak breaks if lastQuestDate older than yesterday
    if (s.lastQuestDate) {
      var last = new Date(s.lastQuestDate + 'T00:00:00');
      var now = new Date(today() + 'T00:00:00');
      var diffDays = Math.round((now - last) / 86400000);
      if (diffDays > 1) { // missed a day → broken
        days = 0;
      }
    }
    return Object.assign({ days: days }, D.streakTier(days));
  }

  // ============================================================
  // SCENE — "한 끼의 여정" 4-act scene state + fatigue management.
  // ============================================================
  function sceneState() {
    var s = load();
    var meals = s.mealCount || 0;
    var full = meals < D.SCENE_FATIGUE.fullUntilMeal;
    var metrics = coreMetrics();
    var crossedThreshold = false;
    // threshold-crossing re-trigger (염증 폭풍 첫 진입 등)
    if (s.lastSceneTs && metrics.inflammation >= D.WEATHER_STATES.danger.max - 1) crossedThreshold = true;
    return {
      mealCount: meals,
      full: full || crossedThreshold,
      abbreviated: !full && !crossedThreshold,
      lastSceneFood: s.lastSceneFood,
      lastSceneTs: s.lastSceneTs
    };
  }
  function triggerScene(food) {
    var s = load();
    s.mealCount = (s.mealCount || 0) + 1;
    s.lastSceneTs = Date.now();
    s.lastSceneFood = food ? { id: food.id, bad: food.bad, label: food.label } : null;
    return save();
  }

  // ============================================================
  // 48-HOUR RESET CHALLENGE — advances simulated hours on each visit.
  // ============================================================
  function resetChallenge() {
    var s = load();
    if (!s.resetStartedAt) return { active: false, hours: 0, quests: 0, complete: false };
    var doneCount = s.questDone.length;
    var noSugar = checkNoSugarToday();
    if (s.profile && s.profile.demo && s.profile.resetHours != null) {
      var demoHours = Math.min(D.RESET_CHALLENGE.durationHours, s.profile.resetHours);
      return {
        active: true,
        hours: demoHours,
        quests: Math.max(doneCount, 1),
        noSugar: noSugar,
        complete: demoHours >= D.RESET_CHALLENGE.durationHours && doneCount >= D.RESET_CHALLENGE.requireQuests && noSugar,
        startedAt: s.resetStartedAt
      };
    }
    var elapsedReal = (Date.now() - s.resetStartedAt) / 3600000;
    var simHours = Math.min(D.RESET_CHALLENGE.durationHours, Math.floor(elapsedReal));
    var complete = simHours >= D.RESET_CHALLENGE.durationHours &&
                   doneCount >= D.RESET_CHALLENGE.requireQuests &&
                   noSugar;
    return {
      active: true,
      hours: simHours,
      quests: doneCount,
      noSugar: noSugar,
      complete: complete,
      startedAt: s.resetStartedAt
    };
  }
  function checkNoSugarToday() {
    var manual = foodsToday();
    var detected = foodsEatenToday();
    return !manual.concat(detected).some(function (f) { return f.bad; });
  }
  function startReset() {
    var s = load();
    s.resetStartedAt = Date.now();
    s.resetHours = 0;
    s.resetQuestsDone = 0;
    return save();
  }
  function tickReset() {
    var s = load();
    if (!s.resetStartedAt) return null;
    var rc = resetChallenge();
    if (rc.complete && !s.resetRewardApplied) {
      s.resetRewardApplied = true;
      s.xp += 300;
    }
    return save();
  }

  // ---- intro / theme ----
  function setIntroSeen() { var s = load(); s.introSeen = true; return save(); }
  function setTheme(t) { var s = load(); s.theme = t; return save(); }

  // ---- logout (keep profile, return to onboarding) ----
  function logout() {
    var s = load();
    s.onboarded = false;
    s.activeTab = 'home';
    s.alertsDismissed = []; // re-show alerts next session
    return save();
  }
  // ---- reset (wipe everything) ----
  function reset() { cache = defaultState(); try { localStorage.removeItem(KEY); } catch (e) {} return cache; }
  // ---- saved profile for "continue as" option ----
  function savedProfile() {
    var s = load();
    return s.profile || null;
  }

  window.GS = window.GS || {};
  window.GS.store = {
    load: load, save: save, reset: reset, logout: logout, raw: function () { return load(); },
    savedProfile: savedProfile,
    today: today,
    profile: { set: setProfile, get: getProfile, isOnboarded: isOnboarded },
    profiles: { list: listProfiles, activeId: getActiveProfileId, switch: switchProfile, add: addProfile, remove: removeProfile },
    diet: {
      today: dietToday, foodsToday: foodsToday, eatenToday: foodsEatenToday, allFoods: allFoods,
      toggle: toggleFood, clearToday: clearDietToday,
      forDate: dietForDate, addCustom: addCustomFood, weekSummary: dietWeekSummary
    },
    impact: impact, state3: state3, gutScore: gutScore,
    zoneStates: zoneStates,
    coreMetrics: coreMetrics,
    streak: streak,
    scene: { state: sceneState, trigger: triggerScene },
    reset: { status: resetChallenge, start: startReset, tick: tickReset },
    alerts: { active: activeAlerts, dismiss: dismissAlert },
    quests: { done: function () { return load().questDone; }, toggle: toggleQuest, autoSignals: autoQuestSignals, autoApply: autoApplyQuests },
    xp: { get: function () { return load().xp; }, level: level },
    nav: { setTab: setTab, get: function () { return load().activeTab; } },
    streams: streams,
    demographic: { cluster: cluster, compare: compareMetric, userBiomarkers: userBiomarkers },
    ai: { timeline: aiTimeline, timelineWeek: aiTimelineWeek },
    ranking: { weekly: weeklyRanking },
    intro: { seen: function () { return !!load().introSeen; }, mark: setIntroSeen },
    theme: { get: function () { return load().theme || 'day'; }, set: setTheme }
  };
})();
