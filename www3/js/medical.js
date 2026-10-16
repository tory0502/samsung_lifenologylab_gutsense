/* GutSense www3 — medical knowledge library. Concise, citable facts from
 * recent peer-reviewed work, woven into the game as a "도감"(codex) layer
 * and injected into the LLM grounding prompt. NOT medical advice.
 * Attached to window.GS_DATA.MEDICAL.
 */
(function () {
  'use strict';
  var D = window.GS_DATA = window.GS_DATA || {};

  // Each fact: { id, tag, emoji, title, body, cite }. tag drives context pick.
  var FACTS = [
    { id: 'butyrate-energy', tag: 'scfa', emoji: '⚡', title: '부티레이트 = 장 세포의 주 에너지', body: '결장 상피세포(결장 세포) ATP의 약 70%를 부티레이트가 만들고, 장에서 생성된 부티레이트의 95%를 결장이 소비해요. 부티레이트가 부족하면 장벽을 먼저 지키는 세포가 굶어요.', cite: 'van Deuren 2022; Canani 2011' },
    { id: 'butyrate-tj', tag: 'scfa', emoji: '🧱', title: '부티레이트가 장벽 벽돌(밀착연접)을 채워요', body: '부티레이트는 밀착연접 단백질(ZO-1, 오클루딘) 발현을 올려 장벽 틈을 좁혀요. 그래서 SCFA가 떨어지면 틈이 벌어고 내독소가 새어 나갑니다.', cite: 'Peng 2007, Pediatr Res; Canani 2011' },
    { id: 'scfa-ratio', tag: 'scfa', emoji: '🧪', title: '장의 SCFA 황금비 60:25:15', body: '장내 단쇄지방산은 아세테이트 60 : 프로피오네이트 25 : 부티레이트 15 비율. 부티레이트가 제일 적지만 장벽엔 가장 중요해요.', cite: 'den Besten 2015; IJMS 2024' },
    { id: 'akkermansia', tag: 'microbe', emoji: '🛡️', title: '아커만시아 뮤시니필라, 장벽 지킴이', body: '점액층을 다듬어 장벽을 튼튼하게 하는 유익균. 비만·당뇨·고혈압에서 줄어들고, 멸균 균을 보충하자 인슐린 민감도 +28.6%, 콜레스테롤 -8.7%.', cite: 'Depommier 2019, Nat Med' },
    { id: 'fprausnitzii', tag: 'microbe', emoji: '🌿', title: '푸세칼리박테리움, 부티레이트 명장', body: '대표적 부티레이트 생성균. 크론병·비만·우울증·당뇨에서 뚝 떨어져요. 보충하면 공복혈당·HbA1c가 내리고 당내성이 좋아진다고 해요.', cite: 'F. prausnitzii FPZ 2023, mice' },
    { id: 'leaky-lps', tag: 'leaky', emoji: '☣️', title: '장이 새면 LPS가 핏줄로', body: '장벽 틈이 벌어지면 내독소(LPS)가 혈류로 유입(대사성 내독소혈증). LPS가 면역 수용체 TLR4를 눌러 전신 저도염증 스위치를 켜요.', cite: 'Cani 2007; Gut 2023' },
    { id: 'sweetener-suez', tag: 'sugar', emoji: '🥤', title: '제로 콜라가 당뇨를 부른다?', body: '사카린을 먹은 사람의 장내미생물을 무균 쥐에 옮기니 포도당 불내성이 그대로 전이됐어요. 감미료가 “칼로리 없이” 미생물을 교란한다는 결정적 증거.', cite: 'Suez et al. 2014, Nature' },
    { id: 'dopa-gutbrain', tag: 'dopa', emoji: '🧠', title: '장이 도파민의 부품을 만든다', body: '장내 미생물이 도파민 전구물질(L-DOPA)을 공급하고 미주신경으로 뇌 보상 회로에 신호를 보내요. 염증이 이 공급을 끊으면 도파민 반응이 둔해져요.', cite: 'Coccurello 2025, IJMS 26:10220' },
    { id: 'fermented', tag: 'fiber', emoji: '🥬', title: '발효식품 10주, 미생물 다양성 ↑', body: '김치·요거트·콤부차 같은 발효식품을 10주 먹으면 장내 다양성이 오르고 19개 염증 표지가 내려갔어요. 식이섬유와 함께 먹으면 부티레이트 생성균도 늘어요.', cite: 'Wastyk 2021, Cell (Stanford)' },
    { id: 'exercise', tag: 'lifestyle', emoji: '🏃', title: '운동이 부티레이트 균을 키운다', body: '규칙적인 유산소 운동은 부티레이트 생성균 비율과 미생물 다양성을 올려요. 운동선수의 마이크로바이옴이 일반인보다 다양하다는 연구가 있어요.', cite: 'Estaki 2016; Mohr 2013' },
    { id: 'circadian', tag: 'lifestyle', emoji: '🌙', title: '장에도 생체시계가 있다', body: '식사 시간과 수면이 장내 미생물의 일주기 리듬을 흔들어요. 늦은 밤 식사·교대 근무는 미생물 다양성을 떨어뜨리고, 시간 제한 식사는 회복시켜요.', cite: 'Thaiss 2014, Cell' }
  ];

  // paper-level grounding for the LLM system prompt (concise)
  var GROUNDING = [
    'Coccurello R. (2025) Disrupting the Gut–Brain Axis: How Artificial Sweeteners Rewire Microbiota and Reward Pathways. Int J Mol Sci 26:10220.',
    '인과 모델(이중 타격 수렴): ① 감미료/가공식품 → 유익균(Akkermansia, F.prausnitzii, Bifido) 감소 → SCFA(부티레이트) 감소 → 밀착연접(ZO-1/occludin) 손상 → 장벽 투과성 ↑(leaky gut).',
    '② 투과성 ↑ → LPS 혈류 유입(대사성 내독소혈증) → TLR4/NF-κB → 전신 염증 ↑(Cani 2007).',
    '③ 염증이 도파민 전구물질(L-DOPA) 공급을 방해 + 감미료의 “단맛인데 칼로리 없음” 보상예측오류 → 도파민 감수성 ↓.',
    '도파민 회복 상한선 ceiling = 100 − 염증×0.5 (장 염증이 도파민 회복의 천장을 누름).',
    '수치 근거: 부티레이트 = 결장 세포 ATP 약 70%, 결장이 생성량의 95% 소비(van Deuren 2022). SCFA 비 60:25:15.',
    '아커만시아 보충: 인슐린 민감도 +28.6%, 콜레스테롤 -8.7%(Depommier 2019 Nat Med). 발효식품 10주 → 다양성 ↑·염증 19표지 ↓(Wastyk 2021 Cell).'
  ].join('\n');

  function byTag(tag) { return FACTS.filter(function (f) { return !tag || f.tag === tag; }); }
  function pick(tag, seed) {
    var pool = byTag(tag);
    if (!pool.length) return null;
    var i = seed ? (seed % pool.length) : Math.floor(Math.random() * pool.length);
    return pool[i];
  }

  D.MEDICAL = { FACTS: FACTS, GROUNDING: GROUNDING, byTag: byTag, pick: pick };
})();
