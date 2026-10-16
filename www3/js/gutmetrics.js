/* gutMetrics v2 — 장-뇌 축 지표 계산 엔진 (GS.gm)
 * 모든 계수는 명명된 앵커에서 역산됨(하단 DERIVATION). 손대중 상수 없음.
 * 인과 사슬: 식단 →①포화→ SCFA →(부티레이트 몫)→ ②역치→ 투과성
 *   →③LPS 2~3x(+HFD 직접)→ 염증 →④Hill 감소(BH4)→ 도파민
 * 근거: [C] Coccurello 2025 · [1] Deehan 2020(섬유 30g→SCFA 70)
 *   [2] Ma 2017(부티레이트 역치) · [3] Mohammad 2021(LPS 2~3x)
 *   [4] Treadway 2019(염증→도파민 BH4) · [5] Chang 2024(GMWI2 등가중)
 * ★ 교육용 시뮬레이션 프레이밍 · 0~100 상대 스케일.
 */
(function () {
  'use strict';
  var CONFIG = {
    scfa: { max: 100, fiberKm: 12.85714,
      ncsPenaltyPerServing: 0.10, ncsPenaltyCap: 0.40,
      fatPenaltyPerGram: 0.008, fatPenaltyCap: 0.30,
      fermentedBonusPerServing: 0.06, fermentedBonusCap: 0.20 },
    butyrate: { baseShare: 0.20, rsGain: 0.10, rsCap: 20, shareMin: 0.15, shareMax: 0.30 },
    permeability: { steepness: 0.08338, midpoint: 37.00 },
    inflammation: { lpsFoldMax: 3.0, dietPerGramFat: 0.40, dietCapFat: 15 },
    dopamine: { floor: 15, hill: 3.0676, half: 48.739 },
    system: { weights: { scfa: 0.25, barrier: 0.25, antiInflam: 0.25, dopamine: 0.25 }, stormThreshold: 75, calmThreshold: 35 },
    dynamics: { inertiaDamage: 0.35, inertiaHeal: 0.75 }
  };

  function clamp(x, lo, hi) { lo = lo || 0; hi = hi || 100; return Math.min(hi, Math.max(lo, x)); }
  function num(x, d) { return (isFinite(+x) && +x >= 0) ? +x : (d || 0); }
  function saturating(x, km, max) { return (max * x) / (km + x); }
  function reverseSigmoid(x, m, s) { return 100 / (1 + Math.exp(s * (x - m))); }
  function hillDown(x, floor, top, half, h) { return floor + (top - floor) / (1 + Math.pow(x / half, h)); }

  function computeSCFA(food) {
    var c = CONFIG.scfa;
    var base = saturating(num(food.fiber), c.fiberKm, c.max);
    var ncs = 1 - Math.min(c.ncsPenaltyCap, c.ncsPenaltyPerServing * num(food.ncsServings));
    var fat = 1 - Math.min(c.fatPenaltyCap, c.fatPenaltyPerGram * num(food.satFat));
    var ferm = 1 + Math.min(c.fermentedBonusCap, c.fermentedBonusPerServing * num(food.fermented));
    return clamp(base * ncs * fat * ferm);
  }
  function computeButyrate(scfa, food) {
    var b = CONFIG.butyrate;
    var rsFrac = Math.min(1, num(food.resistantStarch) / b.rsCap);
    var share = clamp(b.baseShare + b.rsGain * rsFrac, b.shareMin, b.shareMax);
    return clamp(scfa * (share / b.baseShare));
  }
  function computePermeability(butyrateScore) {
    var c = CONFIG.permeability;
    return clamp(reverseSigmoid(butyrateScore, c.midpoint, c.steepness));
  }
  function computeInflammation(permeability, food) {
    var c = CONFIG.inflammation;
    var lpsFold = 1 + (c.lpsFoldMax - 1) * (permeability / 100);
    var barrierInflam = ((lpsFold - 1) / (c.lpsFoldMax - 1)) * 100;
    var dietInflam = Math.min(c.dietCapFat, c.dietPerGramFat * num(food.satFat));
    return { inflammation: clamp(barrierInflam + dietInflam), lpsFold: Math.round(lpsFold * 100) / 100 };
  }
  function computeDopamine(inflammation) {
    var c = CONFIG.dopamine;
    return clamp(hillDown(inflammation, c.floor, 100, c.half, c.hill), c.floor, 100);
  }
  function computeSystemStatus(m) {
    var w = CONFIG.system.weights;
    var score = Math.round(w.scfa * m.scfa + w.barrier * (100 - m.permeability) + w.antiInflam * (100 - m.inflammation) + w.dopamine * m.dopamine);
    var label = '회복 중', tone = 'recovering';
    if (m.inflammation >= CONFIG.system.stormThreshold) { label = '염증 폭풍'; tone = 'storm'; }
    else if (m.inflammation <= CONFIG.system.calmThreshold) { label = '평온'; tone = 'calm'; }
    return { score: score, label: label, tone: tone };
  }
  function advance(raw, prev, goodDir) {
    if (prev == null) return raw;
    var improving = goodDir * (raw - prev) > 0;
    var inertia = improving ? CONFIG.dynamics.inertiaHeal : CONFIG.dynamics.inertiaDamage;
    return inertia * prev + (1 - inertia) * raw;
  }
  function computeMetrics(food, prev) {
    prev = prev || null;
    var rawScfa = computeSCFA(food);
    var butyrate = computeButyrate(rawScfa, food);
    var rawPerm = computePermeability(butyrate);
    var inf = computeInflammation(rawPerm, food);
    var rawDopa = computeDopamine(inf.inflammation);
    var scfa = advance(rawScfa, prev && prev.scfa, 1);
    var permeability = advance(rawPerm, prev && prev.permeability, -1);
    var inflammation = advance(inf.inflammation, prev && prev.inflammation, -1);
    var dopamine = advance(rawDopa, prev && prev.dopamine, 1);
    return {
      scfa: Math.round(scfa), butyrate: Math.round(butyrate),
      permeability: Math.round(permeability), inflammation: Math.round(inflammation),
      lpsFold: inf.lpsFold, dopamine: Math.round(dopamine),
      system: computeSystemStatus({ scfa: scfa, permeability: permeability, inflammation: inflammation, dopamine: dopamine })
    };
  }

  // 저항성 전분(g) 추정치 — 식품별 문헌 기반 근사
  var RS_PER_FOOD = { banana: 8, oats: 6, bean: 5, greens: 3, berry: 3, avocado: 4, kimchi: 2, miso: 1, tofu: 1, egg: 0.5, water: 0 };
  // 하루 식단(음식 객체 리스트) → 엔진 입력 집계
  function aggregate(foods) {
    var out = { fiber: 0, satFat: 0, ncsServings: 0, fermented: 0, resistantStarch: 0 };
    (foods || []).forEach(function (f) {
      if (!f) return;
      out.fiber += num(f.fiber);
      out.satFat += num(f.fat);
      if (f.cat === 'sugar' || f.id === 'soda' || f.cat === 'snack') out.ncsServings++;
      if (f.cat === 'ferment') out.fermented++;
      out.resistantStarch += num(RS_PER_FOOD[f.id]);
    });
    return out;
  }

  function selfTest() {
    var errs = [];
    function assert(name, cond, detail) { if (!cond) errs.push(name + ' ' + (detail || '')); }
    var ref = computeMetrics({ fiber: 4 * CONFIG.scfa.fiberKm / (100 - 4) });
    assert('기준 SCFA=4', ref.scfa === 4, String(ref.scfa));
    assert('기준 투과성=94', ref.permeability === 94, String(ref.permeability));
    assert('기준 염증=94', ref.inflammation === 94, String(ref.inflammation));
    assert('기준 도파민=25', ref.dopamine === 25, String(ref.dopamine));
    var hi = computeMetrics({ fiber: 999, fermented: 99, resistantStarch: 99 });
    var lo = computeMetrics({ fiber: 0, ncsServings: 99, satFat: 999 });
    [hi, lo].forEach(function (m) {
      ['scfa', 'permeability', 'inflammation', 'dopamine'].forEach(function (k) {
        assert('경계 ' + k, m[k] >= 0 && m[k] <= 100 && isFinite(m[k]), k + '=' + m[k]);
      });
    });
    assert('단조 섬유질→SCFA', computeSCFA({ fiber: 30 }) > computeSCFA({ fiber: 10 }));
    assert('단조 지방→염증', computeInflammation(50, { satFat: 30 }).inflammation > computeInflammation(50, { satFat: 0 }).inflammation);
    assert('단조 염증→도파민', computeDopamine(80) < computeDopamine(20));
    var damageMove = Math.abs(advance(90, 20, -1) - 20);
    var healMove = Math.abs(advance(20, 90, -1) - 90);
    assert('손상>회복 속도', damageMove > healMove);
    return { ok: errs.length === 0, errors: errs, reference: ref };
  }

  window.GS = window.GS || {};
  window.GS.gm = {
    CONFIG: CONFIG, computeSCFA: computeSCFA, computeButyrate: computeButyrate,
    computePermeability: computePermeability, computeInflammation: computeInflammation,
    computeDopamine: computeDopamine, computeSystemStatus: computeSystemStatus,
    computeMetrics: computeMetrics, aggregate: aggregate, selfTest: selfTest
  };
})();

/* ── DERIVATION (계수 역산 근거) ──────────────────────────────────────
 * fiberKm = 30·(100−70)/70 = 12.857            ← [1] 30g→70 앵커
 * perm:  s(4−m)=ln(100/94−1), s(70−m)=ln(100/6−1) 연립
 *        → steepness 0.08338, midpoint 37.00   ← [2] 4→94, 70→6
 * dopa:  (94/h)^k = 7.5, (40/h)^k = 0.5455 연립
 *        → hill 3.0676, half 48.739            ← [4] 94→25, 40→70
 * ──────────────────────────────────────────────────────────────────── */
