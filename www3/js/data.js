/* GutSense data layer - sample medical/lifestyle/sensor mock data.
 * All values are illustrative for a prototype; grounded in published literature
 * where cited, but NOT medical advice. See CITATIONS for sources.
 * Exposed as window.GS_DATA (single global).
 */
(function () {
  'use strict';

  // ---- Color tokens — Samsung white/blue theme (light surface, navy text).
  // Semantic names preserved from v1; values rebased onto Samsung brand palette.
  var C = {
    samsung: '#1428A0',
    cyan:    '#1F77F2',
    cyan2:   '#5BA4FF',
    glow:    'rgba(31,119,242,.35)',
    green:   '#1CB87C', red: '#E94560', yellow: '#F5A623',
    orange:  '#FF7A45', purple: '#7B61FF', blue: '#0A66C2',
    bg:      '#F4F8FE',
    bg2:     '#EAF1FC',
    card:    '#FFFFFF',
    card2:   '#EEF3FB',
    line:    '#DCE6F4',
    w:       '#0B1E3F',
    sub:     '#5A6B85',
    dim:     '#8A99B5',
    shd:     '0 6px 24px rgba(20,40,160,.08)',
    shdHov:  '0 10px 32px rgba(20,40,160,.14)'
  };

  // ============================================================
  // GUT ZONES - realistic anatomical layout, per-zone indices
  // score: composite mucosal health (0-100, higher=better)
  // inflow: 0(top, duodenum) -> 1(rectum), used for tube path math
  // ============================================================
  var GUT_ZONES = [
    {
      id: 'duodenum', name: '십이지장', eng: 'Duodenum', inflow: 0.00,
      baseScore: 74, color: C.yellow,
      role: '위에서 내려온 강산(pH 1.5)을 중탄산염으로 중화하고, 췌장 효소·담즙을 받아 소화를 완성. 철·칼슘 흡수가 시작되는 화학 중재소',
      risk: '소장 궤양, 흡수불량',
      evidence: '에리스리톨/자일리톨 고용량은 점막 투과성을 높인다 — IJMS 2025',
      feature: '위산이 들어온 직후라 가장 자극적인 구간. 췌장액·담즙이 이곳에서 합류해요',
      microbe: '위산·담즙·췌장효소 때문에 미생물은 상대적으로 적은 깨끗한 구간',
      barrierNote: '장 상피와 밀착연접(tight junction)이 첫 장벽 — 투과성이 오르면 장내 항원 노출이 늘어요',
      advice: '공복 제로음료 회피, 식사 중 충분한 수분',
      indices: { scfa: 42, permeability: 38, inflammation: 22, motility: 70 },
      sources: { emr: ['혈청 철분', '비타민 D'], diet: '당류 + 인공감미료', sensor: '식사 타이밍' }
    },
    {
      id: 'jejunum', name: '공장', eng: 'Jejunum', inflow: 0.18,
      baseScore: 82, color: C.green,
      role: '소장의 2/5 구간. 융모가 가장 촘촘해 단백질·탄수화물·지방 등 영양소의 약 90%를 흡수하는 주 흡수 공장',
      risk: '융모 위축, 영양실조',
      evidence: '장내 미생물은 융모 성장을 조절한다 — Cell Host Microbe 2021',
      feature: '융모·미세융모가 가장 발달해 점막 표면적을 카펫처럼 넓힌 구간',
      microbe: '십이지장보단 많지만 대장보다 훨씬 적어요 — 흡수에 최적화된 환경',
      barrierNote: '밀착연접이 선택적 투과를 조절 — 흡수 기능과 장벽이 한몸',
      advice: '발효 식품, 식이섬유 25g/일 권장',
      indices: { scfa: 58, permeability: 28, inflammation: 15, motility: 75 },
      sources: { emr: ['알부민', '총 단백질'], diet: '단백질 + 식이섬유', sensor: '식후 포만감' }
    },
    {
      id: 'ileum', name: '회장', eng: 'Ileum', inflow: 0.32,
      baseScore: 78, color: C.green,
      role: '소장의 마지막 관문. 비타민 B12·담즙산을 회수해 간으로 재사용 보내고, Peyer판이 미생물을 감시하는 면역 초소',
      risk: '크론병, SIBO(소장세균과증식)',
      evidence: '회장의 Bile acid signaling은 GLP-1 분비를 촉진한다 — Nature 2023',
      feature: "소장의 마지막 부분. Peyer판(면역 조직)이 풍부하고 말단 회장이 특히 중요해요",
      microbe: '소장 앞부분보다 많고 대장으로 갈수록 밀도가 급격히 증가하는 전환대',
      barrierNote: '장내 항원과 면역계가 만나는 면역 초소 — 장벽이 약해지면 면역 자극·염증이 커져요',
      advice: '프로바이오틱스, 규칙적 식사',
      indices: { scfa: 61, permeability: 30, inflammation: 18, motility: 72 },
      sources: { emr: ['비타민 B12', 'CRP'], diet: '유제품 + 발효식품', sensor: '장 운동 리듬' }
    },
    {
      id: 'cecum', name: '맹장', eng: 'Cecum', inflow: 0.46,
      baseScore: 70, color: C.yellow,
      role: '소장과 대장의 이음매. 소화 찌꺼기가 머물며 미생물 발효가 본격 시작되는 발효조 입구',
      risk: '맹장염, 미생물 불균형',
      evidence: '식이섬유 발효로 butyrate 생성이 장벽을 강화한다 — Nat Rev Gastro 2021',
      feature: '회장-대장 이음매. 회맹판(ileocecal valve)과 충수(맹장)가 자리한 관문',
      microbe: '미생물이 급격히 많아지기 시작 — 미소화 탄수화물을 발효하는 발효조 점화',
      barrierNote: '미생물-장벽 상호작용이 본격적으로 중요해지는 구간',
      advice: '수용성 식이섬유(귀리, 바나나)',
      indices: { scfa: 68, permeability: 32, inflammation: 20, motility: 65 },
      sources: { emr: ['대변 미생물 검사'], diet: '식이섬유 총량', sensor: '가스 팽만감' }
    },
    {
      id: 'ascending', name: '상행결장', eng: 'Ascending Colon', inflow: 0.58,
      baseScore: 66, color: C.yellow,
      role: '우하복부의 물결 주름(하우스트라) 구간. 식이섬유를 분해해 butyrate·acetate 등 SCFA를 가장 많이 생산하는 발전소',
      risk: '미생물 다양성 감소, 게실',
      evidence: 'Butyrate은 결장 상피세포 주 에너지원 — Gastroenterology 2022',
      feature: '결장 공통 — 하우스트라(주름)가 물결치는 대장의 대부분 구간',
      microbe: '가장 풍부한 미생물 서식지. 혐기성 균이 우세하고 식이섬유를 SCFA로 전환',
      barrierNote: '부티레이트가 대장 상피세포의 주 에너지원 — 장벽·면역의 핵심 연료',
      advice: '전통 발효식품(김치, 콤부차)',
      indices: { scfa: 64, permeability: 35, inflammation: 24, motility: 60 },
      sources: { emr: ['대변 칼프로텍틴'], diet: '발효식품 빈도', sensor: '배변 규칙성' }
    },
    {
      id: 'transverse', name: '횡행결장', eng: 'Transverse Colon', inflow: 0.70,
      baseScore: 60, color: C.orange,
      role: '복부를 가로지르는 가장 긴 구간. 수분·전해질을 흡수해 묽은 찌꺼기를 반죽처럼 성형하는 제조 라인',
      risk: '변비, 만성 염증',
      evidence: '만성 변비는 장내 methanogen 과증식과 연관 — Gut 2020',
      feature: '결장 공통 — 수분이 제거되며 대변이 농축·성형되는 구간',
      microbe: '매우 풍부한 혐기성 미생물 — 발효로 SCFA를 지속 생산',
      barrierNote: '부티레이트가 장벽을 강화 — 미생물 생태계와 장벽 상호작용이 가장 큰 구간',
      advice: '수분 2L/일, 마그네슘 식품',
      indices: { scfa: 58, permeability: 38, inflammation: 28, motility: 52 },
      sources: { emr: ['대변 미생물 검사'], diet: '수분 섭취량', sensor: '배변 주기' }
    },
    {
      id: 'descending', name: '하행결장', eng: 'Descending Colon', inflow: 0.82,
      baseScore: 52, color: C.orange,
      role: '좌하복부의 저장고. 성형된 변을 저장하다가 S상결장으로 이송하는 웨이팅 존',
      risk: '용종, 대장암(한국인 발생 1위)',
      evidence: '한국인 대장암 발생률 10년간 30% 증가 — 국가암등록통계 2023',
      feature: '결장 공통 — 대변 저장·이동이 일어나는 좌하복부 저장고',
      microbe: '풍부한 혐기성 미생물 — 수분 제거와 함께 발효가 마무리돼요',
      barrierNote: '용종·게실이 잘 생기는 구간 — 장벽 건강이 직접 체크포인트',
      advice: '적색육 제한, 식이섬유 강화',
      indices: { scfa: 50, permeability: 42, inflammation: 32, motility: 48 },
      sources: { emr: ['대변 잠혈', 'CEA'], diet: '적색육 + 가공육', sensor: '배변 통증' }
    },
    {
      id: 'sigmoid', name: 'S상결장', eng: 'Sigmoid Colon', inflow: 0.92,
      baseScore: 44, color: C.red,
      role: 'S자로 꺾인 마지막 정거장. 변을 모아 직장으로 보내는 배변 신호 발신기',
      risk: 'S상결장암, 게실염(서구식 식사 증가)',
      evidence: '가공육 50g/일 섭취 시 대장암 위험 18% 증가 — IARC 2018, WHO',
      feature: '결장 공통 — S자 굴곡으로 배변 신호를 조율하는 마지막 결장 구간',
      microbe: '풍부한 미생물 — 발효 산물이 대변과 함께 농축돼요',
      barrierNote: '게실염·용종 호발 구간 — 섬유질이 장벽 압력을 덜어줘요',
      advice: '가공육 회피, 정기 내시경',
      indices: { scfa: 44, permeability: 48, inflammation: 38, motility: 42 },
      sources: { emr: ['대변 잠혈', 'CEA', '내시경 결과'], diet: '가공육 + 저섬유', sensor: '배변 긴장도' }
    },
    {
      id: 'rectum', name: '직장', eng: 'Rectum', inflow: 1.00,
      baseScore: 48, color: C.red,
      role: '배변의 최종 게이트. 내압 수용체가 팽창을 감지하면 뇌에 배변 신호를 보내는 통로',
      risk: '치질, 직장암',
      evidence: '직장암은 좌식 생활 + 저섬유 식사와 강한 상관 — BMJ 2021',
      feature: '대변이 차면 신장 수용체(stretch receptor)가 자극돼 배변 욕구를 발신',
      microbe: '미생물은 있지만 핵심 기능은 발효가 아닌 저장',
      barrierNote: '장벽 기능보다 저장·배변 조절이 주 역할인 최종 게이트',
      advice: '규칙 배변, 좌욕, 섬유질',
      indices: { scfa: 46, permeability: 46, inflammation: 35, motility: 50 },
      sources: { emr: ['직장촬진', '내시경'], diet: '전반적 식사 질', sensor: '배변 통증' }
    }
  ];

  // ============================================================
  // FOOD DATABASE - extends legacy 5 items to 28
  // effects: deltas applied by calcState(). bad=true = gut-harming.
  // fiber/sugar/fat in g per typical serving (approx)
  // ============================================================
  var FOODS = [
    // --- Bad (정형돈 시나리오 20종 · why = 장에 불리한 핵심 이유) ---
    { id: 'noodle', label: '라면/국수', cat: 'refined', bad: true, scfa: -14, lps: 16, inf: 13, fiber: 1, sugar: 4, fat: 14, why: '정제 탄수화물 + 높은 나트륨 + 지방 + 첨가물', ev: '정제 탄수화물은 장내 염증 마커 CRP 상승 — Am J Clin Nutr 2019' },
    { id: 'chicken', label: '치킨', cat: 'fried', bad: true, scfa: -13, lps: 17, inf: 15, fiber: 0, sugar: 2, fat: 24, icon: '🍗', why: '튀김 지방 + 고열량 + 산화지방', ev: '산화 지방이 장 점막을 직접 자극해 염증 유발 — Gut 2022' },
    { id: 'sausage', label: '햄·소시지', cat: 'processed', bad: true, scfa: -18, lps: 22, inf: 20, fiber: 0, sugar: 1, fat: 22, icon: '🌭', why: '가공육 + 높은 나트륨 + 포화지방', ev: '가공육 50g/일 = 대장암 위험 +18% — IARC/WHO 2018' },
    { id: 'bacon', label: '베이컨', cat: 'processed', bad: true, scfa: -16, lps: 20, inf: 18, fiber: 0, sugar: 1, fat: 26, icon: '🥓', why: '가공육 + 지방 + 염분', ev: '질산염 보존제가 장내 화학물질 생성 — IARC 2018' },
    { id: 'burger', label: '햄버거', cat: 'refined', bad: true, scfa: -15, lps: 18, inf: 16, fiber: 1, sugar: 8, fat: 22, icon: '🍔', why: '정제 탄수화물 + 가공육/고지방 + 소스', ev: '고지방·고나트륨 패스트푸드는 미생물 다양성 감소 — Cell 2021' },
    { id: 'pizza', label: '피자', cat: 'refined', bad: true, scfa: -14, lps: 18, inf: 16, fiber: 1, sugar: 6, fat: 20, icon: '🍕', why: '정제 밀가루 + 치즈/지방 + 가공육 + 높은 염분', ev: '정제 곡물+가공육 조합은 장내 유해균 비율 증가 — Nutrients 2020' },
    { id: 'fries', label: '감자튀김', cat: 'fried', bad: true, scfa: -12, lps: 18, inf: 15, fiber: 2, sugar: 0, fat: 18, why: '튀김 + 지방 + 정제전분', ev: '튀김 기름의 산화 지방이 장 점막 자극 — Gut 2022' },
    { id: 'soda', label: '탄산음료', cat: 'sugar', bad: true, scfa: -16, lps: 20, inf: 16, fiber: 0, sugar: 35, fat: 0, why: '설탕 또는 감미료 + 식이섬유 거의 없음', ev: '액상과당은 간 지방 축적 + 장 누수 가속 — J Hepatol 2020' },
    { id: 'boba', label: '달달한 버블티', cat: 'sugar', bad: true, scfa: -15, lps: 18, inf: 15, fiber: 0, sugar: 40, fat: 5, icon: '🧋', why: '당류가 매우 높아지기 쉬움', ev: '한 잔당 당 30~50g — 당 과다가 유익균 감소 유도 — J Hepatol 2020' },
    { id: 'mixcoffee', label: '달달한 믹스커피', cat: 'sugar', bad: true, scfa: -11, lps: 14, inf: 12, fiber: 0, sugar: 25, fat: 6, icon: '☕', why: '설탕/크리머를 반복적으로 많이 섭취하기 쉬움', ev: '크리머 유화제가 점액층 얇게 만듦 — Nature 2015' },
    { id: 'snack', label: '과자', cat: 'snack', bad: true, scfa: -20, lps: 24, inf: 18, fiber: 0, sugar: 22, fat: 12, icon: '🍪', why: '정제전분 + 지방 + 당 + 첨가물', ev: '수크랄로스가 장내 Akkermansia 감소 — Nature 2021' },
    { id: 'choco', label: '초콜릿 과자', cat: 'snack', bad: true, scfa: -13, lps: 16, inf: 14, fiber: 0, sugar: 28, fat: 14, icon: '🍫', why: '당 + 지방 + 초가공 성분', ev: '초가공식품 빈도 ↑ = 미생물 다양성 ↓ — Cell 2021' },
    { id: 'donut', label: '도넛', cat: 'sugar', bad: true, scfa: -14, lps: 17, inf: 15, fiber: 0, sugar: 26, fat: 18, icon: '🍩', why: '정제 밀가루 + 당 + 튀김 지방', ev: '당+트랜스지방 조합이 미생물 다양성 감소 — Cell 2021' },
    { id: 'cake', label: '케이크', cat: 'sugar', bad: true, scfa: -15, lps: 19, inf: 17, fiber: 1, sugar: 28, fat: 16, icon: '🍰', why: '당 + 정제 밀가루 + 지방', ev: '정제당 + 트랜스지방 = 미생물 다양성 감소 — Cell 2021' },
    { id: 'icecream', label: '아이스크림', cat: 'sugar', bad: true, scfa: -10, lps: 14, inf: 12, fiber: 0, sugar: 22, fat: 10, icon: '🍦', why: '당 + 포화지방 · 유당 민감하면 추가 위장 증상 가능', ev: '고당 + 유당이 소장 발효 과부하 유발 — Gastroenterology 2020' },
    { id: 'dumpling', label: '냉동만두', cat: 'processed', bad: true, scfa: -13, lps: 16, inf: 14, fiber: 1, sugar: 3, fat: 14, icon: '🥟', why: '정제전분 + 지방 + 나트륨 + 가공육/가공재료', ev: '냉동 가공식품 첨가물이 점액층 감소 — Nature 2015' },
    { id: 'triangle', label: '편의점 삼각김밥', cat: 'refined', bad: true, scfa: -12, lps: 15, inf: 13, fiber: 1, sugar: 5, fat: 8, icon: '🍙', why: '정제 탄수화물 + 나트륨 + 가공된 속재료/소스', ev: '정제 백미 + 가공 속재료의 나트륨 부하 — Nutrients 2020' },
    { id: 'bento', label: '편의점 도시락', cat: 'processed', bad: true, scfa: -14, lps: 17, inf: 15, fiber: 1, sugar: 5, fat: 15, icon: '🍱', why: '높은 나트륨 + 정제 탄수화물 + 가공육/튀김류', ev: '편의식 도시락 평균 나트륨 1,800mg+ — KDCA 2022' },
    { id: 'tteok', label: '즉석 떡볶이', cat: 'refined', bad: true, scfa: -13, lps: 16, inf: 14, fiber: 1, sugar: 18, fat: 8, icon: '🍲', why: '정제 탄수화물 + 설탕 + 높은 나트륨', ev: '떡+설탕 조합의 혈당 스파이크가 장 염증 유발 — Am J Clin Nutr 2019' },
    { id: 'soju', label: '소주 + 안주', cat: 'alcohol', bad: true, scfa: -12, lps: 18, inf: 16, fiber: 0, sugar: 4, fat: 8, icon: '🥃', why: '알코올이 장 점막 직접 자극 + 안주의 나트륨/지방', ev: '알코올은 장 투과성 증가 + 내독소 혈류 유입 — Gut 2023' },
    { id: 'instant', label: '즉석식품', cat: 'processed', bad: true, scfa: -16, lps: 20, inf: 18, fiber: 1, sugar: 6, fat: 16, why: '정제전분 + 지방 + 나트륨 + 가공재료', ev: '인공첨가제(emulsifier)가 장 점막 점액층 감소 — Nature 2015' },
    { id: 'beer', label: '맥주/주류', cat: 'alcohol', bad: true, scfa: -8, lps: 12, inf: 14, fiber: 0, sugar: 6, fat: 0, why: '알코올 — 장 투과성 증가 + 내독소 혈류 유입', ev: '알코올은 장내 투과성 증가 + 내독소 혈류 유입 — Gut 2023' },
    // --- Good ---
    { id: 'yogurt', label: '그릭요거트', cat: 'ferment', bad: false, scfa: 10, lps: -6, inf: -7, fiber: 0, sugar: 6, fat: 4, ev: '프로바이오틱스가 Bifidobacterium 강화 — Br J Nutr 2020' },
    { id: 'kimchi', label: '김치', cat: 'ferment', bad: false, scfa: 14, lps: -8, inf: -9, fiber: 2, sugar: 2, fat: 0, ev: '한국인 장 건강의 핵심 — Lactobacillus 풍부, Nutrients 2020' },
    { id: 'oats', label: '오트밀/귀리', cat: 'fiber', bad: false, scfa: 16, lps: -8, inf: -8, fiber: 4, sugar: 1, fat: 3, ev: '베타글루칸이 butyrate 생성균 증가 — Front Microbiol 2021' },
    { id: 'banana', label: '바나나', cat: 'fiber', bad: false, scfa: 8, lps: -4, inf: -4, fiber: 3, sugar: 14, fat: 0, ev: '저항전분이 프로바이오틱스 먹이 — Nutrients 2019' },
    { id: 'greens', label: '녹색채소', cat: 'fiber', bad: false, scfa: 18, lps: -10, inf: -10, fiber: 4, sugar: 2, fat: 0, ev: '식이섬유 + 폴리페놀 = 미생물 다양성 ↑ — Nat Commun 2021' },
    { id: 'berry', label: '베리류', cat: 'fiber', bad: false, scfa: 12, lps: -7, inf: -8, fiber: 4, sugar: 10, fat: 0, ev: '안토시아닌이 Akkermansia 증가 — Front Microbiol 2020' },
    { id: 'bean', label: '콩/렌틸', cat: 'fiber', bad: false, scfa: 15, lps: -9, inf: -9, fiber: 8, sugar: 2, fat: 1, ev: 'galactooligosaccharide = 비피더스균 증가 — Br J Nutr 2018' },
    { id: 'fish', label: '생선(오메가3)', cat: 'protein', bad: false, scfa: 7, lps: -6, inf: -10, fiber: 0, sugar: 0, fat: 6, ev: '오메가-3가 항염 미생물 증가 — Gut Microbes 2020' },
    { id: 'nut', label: '견과류', cat: 'fiber', bad: false, scfa: 10, lps: -5, inf: -6, fiber: 3, sugar: 1, fat: 14, ev: '호두 섭취자 장내 미생물 다양성 ↑ — Nutrients 2018' },
    { id: 'water', label: '생수 500ml', cat: 'hydrate', bad: false, scfa: 4, lps: -3, inf: -2, fiber: 0, sugar: 0, fat: 0, ev: '수분 부족은 변비 + 미생물 대사 산물 농축 — EFSA 2010' },
    { id: 'sand', label: '샌드위치', cat: 'mixed', bad: false, scfa: 2, lps: 0, inf: 1, fiber: 3, sugar: 3, fat: 8, ev: '통곡물 + 채소 조합은 보통 이로움' },
    { id: 'steak', label: '스테이크', cat: 'protein', bad: false, scfa: -5, lps: 6, inf: 5, fiber: 0, sugar: 0, fat: 18, ev: '적색육 고용량은 TMAO 생성 — NEJM 2013 (양은 안전)' },
    { id: 'tofu', label: '두부', cat: 'protein', bad: false, scfa: 6, lps: -4, inf: -5, fiber: 1, sugar: 1, fat: 5, ev: '대두 단백은 Bifidobacterium 증가 — J Nutr 2019' },
    { id: 'miso', label: '된장국', cat: 'ferment', bad: false, scfa: 8, lps: -5, inf: -5, fiber: 1, sugar: 1, fat: 1, ev: '발효 대두는 프로바이오틱스 + 이소플라본 — Int J Mol Sci 2022' },
    { id: 'avocado', label: '아보카도', cat: 'fiber', bad: false, scfa: 11, lps: -6, inf: -7, fiber: 7, sugar: 1, fat: 11, ev: '식이섬유 + 단일불포화지방 = 미생물 다양성 ↑ — J Nutr 2019' },
    { id: 'egg', label: '계란', cat: 'protein', bad: false, scfa: 1, lps: 2, inf: 1, fiber: 0, sugar: 1, fat: 5, ev: '콜린이 풍부하나 과다 시 TMAO 증가 — Eur Heart J 2021' }
  ];

  // ============================================================
  // PROFILE TEMPLATES - baseline gut health by demographic
  // ============================================================
  var LIFESTYLES = {
    sedentary: { label: '좌식/사무직', baseShift: -6, advice: '매시간 기립, 걷기 5000보+' },
    active: { label: '활동적', baseShift: 4, advice: '현재 라이프스타일 유지' },
    athlete: { label: '운동선수', baseShift: 8, advice: '수분/전해질 균형 주의' },
    stress: { label: '고스트레스', baseShift: -10, advice: '명상/수면 7시간+' }
  };

  var PROFILE_BASELINES = {
    // ageBracket: { male: {scfa, lps, inf, overall}, female: {...} }
    '20s': {
      male: { scfa: 62, lps: 32, inf: 24, overall: 70 },
      female: { scfa: 60, lps: 34, inf: 26, overall: 67 }
    },
    '30s': {
      male: { scfa: 58, lps: 36, inf: 28, overall: 65 },
      female: { scfa: 56, lps: 38, inf: 30, overall: 62 }
    },
    '40s': {
      male: { scfa: 52, lps: 42, inf: 34, overall: 58 },
      female: { scfa: 50, lps: 44, inf: 36, overall: 55 }
    },
    '50s': {
      male: { scfa: 46, lps: 48, inf: 40, overall: 52 },
      female: { scfa: 48, lps: 46, inf: 38, overall: 54 }
    },
    '60+': {
      male: { scfa: 42, lps: 52, inf: 44, overall: 46 },
      female: { scfa: 44, lps: 50, inf: 42, overall: 48 }
    }
  };

  function ageBracket(age) {
    age = parseInt(age, 10) || 30;
    if (age < 30) return '20s';
    if (age < 40) return '30s';
    if (age < 50) return '40s';
    if (age < 60) return '50s';
    return '60+';
  }

  // Cluster averages for "people like me" comparisons.
  // Values seeded from published Korean / pan-Asian population statistics:
  // - CRP (mg/L): Clin Lab 2018 Korean reference (<1 normal, 1-3 marginal, >3 elevated)
  // - Fasting glucose (mg/dL): KDCA 2022 KNHANES (~90-99 median adults)
  // - Triglyceride (mg/dL): KNHANES 2021 (~110-150 adult median)
  // - SCFA index / LPS index / Inflammation: derived from gut-microbiome literature
  //   (Nat Rev Gastro 2021, Cell 2021) mapped onto 0-100 scale.
  var CLUSTER_AVG = {
    '20s': {
      male: {
        sedentary: { crp: 0.9,  fg: 92,  tg: 138, scfa: 60, lps: 36, inf: 26 },
        active:    { crp: 0.5,  fg: 88,  tg: 102, scfa: 66, lps: 30, inf: 20 },
        athlete:   { crp: 0.4,  fg: 85,  tg: 88,  scfa: 72, lps: 26, inf: 16 },
        stress:    { crp: 1.4,  fg: 96,  tg: 158, scfa: 52, lps: 44, inf: 34 }
      },
      female: {
        sedentary: { crp: 0.8,  fg: 90,  tg: 108, scfa: 58, lps: 38, inf: 28 },
        active:    { crp: 0.5,  fg: 86,  tg: 92,  scfa: 64, lps: 32, inf: 22 },
        athlete:   { crp: 0.4,  fg: 84,  tg: 82,  scfa: 70, lps: 28, inf: 18 },
        stress:    { crp: 1.3,  fg: 94,  tg: 128, scfa: 50, lps: 46, inf: 36 }
      }
    },
    '30s': {
      male: {
        sedentary: { crp: 1.1,  fg: 96,  tg: 162, scfa: 56, lps: 40, inf: 30 },
        active:    { crp: 0.6,  fg: 90,  tg: 116, scfa: 62, lps: 34, inf: 24 },
        athlete:   { crp: 0.5,  fg: 87,  tg: 96,  scfa: 68, lps: 30, inf: 18 },
        stress:    { crp: 1.7,  fg: 100, tg: 184, scfa: 48, lps: 48, inf: 38 }
      },
      female: {
        sedentary: { crp: 1.0,  fg: 92,  tg: 122, scfa: 54, lps: 42, inf: 32 },
        active:    { crp: 0.6,  fg: 88,  tg: 100, scfa: 60, lps: 36, inf: 26 },
        athlete:   { crp: 0.5,  fg: 85,  tg: 86,  scfa: 66, lps: 32, inf: 20 },
        stress:    { crp: 1.6,  fg: 97,  tg: 142, scfa: 46, lps: 50, inf: 40 }
      }
    },
    '40s': {
      male: {
        sedentary: { crp: 1.4,  fg: 102, tg: 178, scfa: 50, lps: 46, inf: 36 },
        active:    { crp: 0.8,  fg: 94,  tg: 132, scfa: 58, lps: 38, inf: 28 },
        athlete:   { crp: 0.6,  fg: 90,  tg: 104, scfa: 64, lps: 34, inf: 22 },
        stress:    { crp: 2.1,  fg: 106, tg: 202, scfa: 42, lps: 54, inf: 44 }
      },
      female: {
        sedentary: { crp: 1.2,  fg: 98,  tg: 134, scfa: 48, lps: 48, inf: 38 },
        active:    { crp: 0.7,  fg: 92,  tg: 108, scfa: 56, lps: 40, inf: 30 },
        athlete:   { crp: 0.6,  fg: 88,  tg: 92,  scfa: 62, lps: 36, inf: 24 },
        stress:    { crp: 2.0,  fg: 102, tg: 158, scfa: 40, lps: 56, inf: 46 }
      }
    },
    '50s': {
      male: {
        sedentary: { crp: 1.7,  fg: 106, tg: 188, scfa: 44, lps: 52, inf: 42 },
        active:    { crp: 1.0,  fg: 98,  tg: 142, scfa: 52, lps: 44, inf: 34 },
        athlete:   { crp: 0.7,  fg: 94,  tg: 116, scfa: 60, lps: 38, inf: 26 },
        stress:    { crp: 2.4,  fg: 110, tg: 212, scfa: 38, lps: 60, inf: 50 }
      },
      female: {
        sedentary: { crp: 1.5,  fg: 100, tg: 148, scfa: 46, lps: 50, inf: 40 },
        active:    { crp: 0.9,  fg: 94,  tg: 118, scfa: 54, lps: 42, inf: 32 },
        athlete:   { crp: 0.7,  fg: 90,  tg: 100, scfa: 60, lps: 38, inf: 24 },
        stress:    { crp: 2.2,  fg: 104, tg: 168, scfa: 40, lps: 58, inf: 48 }
      }
    },
    '60+': {
      male: {
        sedentary: { crp: 1.9,  fg: 104, tg: 168, scfa: 40, lps: 56, inf: 46 },
        active:    { crp: 1.2,  fg: 100, tg: 138, scfa: 50, lps: 46, inf: 36 },
        athlete:   { crp: 0.8,  fg: 96,  tg: 112, scfa: 58, lps: 40, inf: 28 },
        stress:    { crp: 2.6,  fg: 108, tg: 196, scfa: 34, lps: 62, inf: 54 }
      },
      female: {
        sedentary: { crp: 1.7,  fg: 102, tg: 156, scfa: 42, lps: 54, inf: 44 },
        active:    { crp: 1.1,  fg: 98,  tg: 128, scfa: 52, lps: 44, inf: 34 },
        athlete:   { crp: 0.8,  fg: 94,  tg: 108, scfa: 58, lps: 40, inf: 26 },
        stress:    { crp: 2.4,  fg: 106, tg: 178, scfa: 36, lps: 60, inf: 52 }
      }
    }
  };

  // Metric display configuration — direction, units, healthy thresholds, labels.
  // goodDown=true means lower is better (e.g. CRP, LPS, glucose).
  var METRIC_META = {
    crp:    { label: '혈청 CRP (염증)', unit: 'mg/L',  goodDown: true,  good: 1.0,  warn: 3.0,  decimals: 2 },
    fg:     { label: '공복 혈당',       unit: 'mg/dL', goodDown: true,  good: 100,  warn: 126, decimals: 0 },
    tg:     { label: '중성지방',         unit: 'mg/dL', goodDown: true,  good: 150,  warn: 200, decimals: 0 },
    scfa:   { label: '유익 대사물 SCFA', unit: '',      goodDown: false, good: 60,   warn: 40,  decimals: 0 },
    lps:    { label: '내독소 LPS',       unit: '',      goodDown: true,  good: 40,   warn: 60,  decimals: 0 },
    inf:    { label: '염증 지수',        unit: '',      goodDown: true,  good: 30,   warn: 50,  decimals: 0 }
  };

  function clusterFor(profile) {
    var br = ageBracket(profile.age);
    var g = profile.gender || 'male';
    var ls = profile.lifestyle || 'sedentary';
    var node = (((CLUSTER_AVG[br] || {})[g]) || {})[ls];
    return node || CLUSTER_AVG['30s'].male.sedentary;
  }

  // Compare a user value against the matched cluster using a simple z-score
  // approximation (std derived empirically per-metric). Returns a descriptor
  // with percentile, status label and color for visualizations.
  var METRIC_STD = { crp: 0.6, fg: 8, tg: 28, scfa: 8, lps: 7, inf: 7 };
  function compareMetric(profile, metric, userValue) {
    var cluster = clusterFor(profile);
    var avg = cluster[metric];
    var std = METRIC_STD[metric] || (avg * 0.15 || 1);
    var meta = METRIC_META[metric] || {};
    var z = (userValue - avg) / std;
    var pct = 50 * (1 + erf(z / Math.sqrt(2)));
    var meta = METRIC_META[metric] || {};
    var better = meta.goodDown ? userValue < avg : userValue > avg;
    var status = 'avg';
    var col = C.sub;
    var deltaPct = Math.round(((userValue - avg) / Math.max(0.0001, avg)) * 100);
    if (meta.goodDown) {
      if (userValue < avg - std * 0.5) { status = 'better'; col = C.green; }
      else if (userValue > avg + std * 0.5) { status = 'worse'; col = C.red; }
    } else {
      if (userValue > avg + std * 0.5) { status = 'better'; col = C.green; }
      else if (userValue < avg - std * 0.5) { status = 'worse'; col = C.red; }
    }
    return {
      metric: metric,
      user: userValue,
      avg: avg,
      std: std,
      z: z,
      percentile: Math.max(2, Math.min(98, Math.round(pct))),
      better: better,
      deltaPct: deltaPct,
      status: status,
      col: col,
      meta: meta
    };
  }

  // Abramowitz-Stegun erf approximation (sufficient for percentile viz)
  function erf(x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  }

  // ============================================================
  // ANATOMICAL GUT SVG — detailed digestive tract illustration.
  // Each zone is an independent path so per-zone scores color/opacity
  // the segment. viewBox 360x420; coordinates mirror LAYOUT in gutmap.js.
  // ============================================================
  var ANATOMY_PATHS = {
    // Stomach sac (upper-left)
    stomach: 'M58,72 Q42,82 44,108 Q46,132 70,138 Q96,140 108,122 Q112,108 104,96 Q94,84 82,86 Q70,86 58,72 Z',
    // Duodenum C-curve
    duodenum: 'M104,122 C132,124 146,142 138,164 C130,184 116,192 124,210',
    // Small intestine coil (jejunum+ileum)
    smallIntestine: 'M124,210 C158,200 174,224 162,250 C150,272 122,266 132,292 C140,316 168,310 184,322 C202,334 196,360 214,366',
    // Cecum pouch (lower-right)
    cecum: 'M214,366 Q242,366 250,386 Q256,408 232,410 Q210,410 208,392 Q208,376 214,366 Z',
    // Ascending colon (right vertical up)
    ascending: 'M244,392 Q264,360 268,310 Q270,260 256,212',
    // Transverse colon (top cross, right-to-left)
    transverse: 'M256,212 Q220,178 168,176 Q116,176 86,196',
    // Descending colon (left vertical down)
    descending: 'M86,196 Q72,236 76,286 Q80,326 92,348',
    // Sigmoid colon (S-curve)
    sigmoid: 'M92,348 Q104,372 130,366 Q154,360 156,386 Q156,408 138,412',
    // Rectum (final exit)
    rectum: 'M138,412 Q150,412 152,398 L152,418'
  };

  function anatomicalGutSVG(opts) {
    opts = opts || {};
    var hl = opts.highlight; // zone id to highlight
    var scores = opts.scores || {}; // { zoneId: 0..100 }
    var onTap = opts.onTap || 'GS.screens.gutmap.select';
    var label = opts.label !== false;

    function zoneColor(id) {
      var s = scores[id];
      if (s == null) return '#E2E8F5';
      return s > 70 ? '#7CD9B0' : s > 55 ? '#FFE08A' : s > 40 ? '#FFB074' : '#FF8E8E';
    }
    function zoneOpacity(id) {
      if (!hl) return 1;
      return hl === id ? 1 : 0.35;
    }

    function tubePath(d, id, w) {
      w = w || 14;
      return '<path d="' + d + '" fill="none" stroke="' + zoneColor(id) + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + zoneOpacity(id) + '" class="gs-anatomy-tube" style="cursor:pointer;transition:opacity .25s,stroke .4s" onclick="' + onTap + '(\'' + id + '\')"/>';
    }
    function fillPath(d, id, fill) {
      return '<path d="' + d + '" fill="' + fill + '" stroke="' + zoneColor(id) + '" stroke-width="3" opacity="' + zoneOpacity(id) + '" style="cursor:pointer" onclick="' + onTap + '(\'' + id + '\')"/>';
    }

    // Soft body silhouette (torso outline) for anatomical context
    var torso = '<path d="M30,40 Q30,30 50,28 L300,28 Q324,28 326,52 L326,398 Q326,418 304,418 L52,418 Q30,418 28,398 Z" fill="#F4F8FE" stroke="#DCE6F4" stroke-width="2"/>';

    // Tube shadows (for depth)
    var shadow = '<g opacity=".12" transform="translate(2,3)">' +
      '<path d="' + ANATOMY_PATHS.ascending + ' ' + ANATOMY_PATHS.transverse + ' ' + ANATOMY_PATHS.descending + '" fill="none" stroke="#0B1E3F" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + ANATOMY_PATHS.smallIntestine + '" fill="none" stroke="#0B1E3F" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="' + ANATOMY_PATHS.duodenum + '" fill="none" stroke="#0B1E3F" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="' + ANATOMY_PATHS.sigmoid + '" fill="none" stroke="#0B1E3F" stroke-width="12" stroke-linecap="round"/>' +
      '</g>';

    var p = '<svg viewBox="0 0 360 440" preserveAspectRatio="xMidYMid meet" style="width:100%;display:block;max-height:460px">';
    p += '<defs>' +
      '<radialGradient id="gutGlow" cx="50%" cy="40%" r="60%">' +
        '<stop offset="0%" stop-color="#5BA4FF" stop-opacity=".12"/>' +
        '<stop offset="100%" stop-color="#5BA4FF" stop-opacity="0"/>' +
      '</radialGradient>' +
      '<filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="2"/>' +
        '<feOffset dx="0" dy="2"/>' +
        '<feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer>' +
        '<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>' +
      '</defs>';
    p += '<rect x="0" y="0" width="360" height="440" fill="url(#gutGlow)"/>';
    p += torso;
    p += shadow;

    // Stomach (with subtle interior line)
    p += fillPath(ANATOMY_PATHS.stomach, 'duodenum', '#FFD3DC');
    p += '<path d="' + ANATOMY_PATHS.stomach + '" fill="none" stroke="#E68FAE" stroke-width="1.5" opacity=".5"/>';
    if (label) p += '<text x="60" y="64" fill="#5A6B85" font-size="10" font-weight="500">위</text>';

    // Small intestine (filled with realistic pink)
    p += tubePath(ANATOMY_PATHS.duodenum, 'duodenum', 14);
    p += tubePath(ANATOMY_PATHS.smallIntestine, 'jejunum', 16);
    p += '<g opacity=".35" pointer-events="none">' +
      '<path d="M124,210 C158,200 174,224 162,250 C150,272 122,266 132,292 C140,316 168,310 184,322 C202,334 196,360 214,366" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="3,5"/>' +
      '</g>';

    // Cecum
    p += fillPath(ANATOMY_PATHS.cecum, 'cecum', '#FFD8C2');

    // Large intestine segments
    p += tubePath(ANATOMY_PATHS.ascending, 'ascending', 18);
    p += tubePath(ANATOMY_PATHS.transverse, 'transverse', 18);
    p += tubePath(ANATOMY_PATHS.descending, 'descending', 18);
    p += tubePath(ANATOMY_PATHS.sigmoid, 'sigmoid', 16);
    p += tubePath(ANATOMY_PATHS.rectum, 'rectum', 12);

    // Haustra markings (the pouches along colon) for realism
    p += '<g opacity=".25" pointer-events="none" stroke="#FFFFFF" stroke-width="1.5" fill="none">' +
      '<path d="M260,260 L252,272 M256,300 L246,310 M250,340 L240,348"/>' + // ascending
      '<path d="M216,196 L222,208 M168,180 L168,194 M120,184 L114,196"/>' + // transverse
      '<path d="M80,240 L88,250 M80,290 L88,300 M86,330 L94,340"/>' + // descending
      '</g>';

    // Liver silhouette (upper-right context)
    p += '<path d="M210,60 Q260,55 280,76 Q288,100 276,118 Q256,128 232,124 Q214,116 210,90 Z" fill="#C77870" opacity=".55" stroke="#A04F4A" stroke-width="1.5"/>';
    if (label) p += '<text x="236" y="96" fill="#FFFFFF" font-size="9" font-weight="600">간</text>';

    // Hotspot markers (pulse on danger)
    Object.keys(scores).forEach(function (id) {
      var s = scores[id];
      if (s == null || s >= 45) return;
      var pos = ZONE_HOTSPOTS[id];
      if (!pos) return;
      p += '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="10" fill="none" stroke="#E94560" stroke-width="2" opacity=".7">' +
        '<animate attributeName="r" from="10" to="22" dur="1.6s" repeatCount="indefinite"/>' +
        '<animate attributeName="opacity" from=".7" to="0" dur="1.6s" repeatCount="indefinite"/>' +
        '</circle>';
      p += '<circle cx="' + (pos.x + 6) + '" cy="' + (pos.y - 8) + '" r="6" fill="#E94560"/>';
      p += '<text x="' + (pos.x + 6) + '" y="' + (pos.y - 5) + '" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="700">!</text>';
    });

    p += '</svg>';
    return p;
  }

  // Hotspot coordinates matching ANATOMY_PATHS midpoints, used for danger pulses + labels
  var ZONE_HOTSPOTS = {
    duodenum:  { x: 130, y: 156 },
    jejunum:   { x: 158, y: 250 },
    ileum:     { x: 200, y: 340 },
    cecum:     { x: 230, y: 392 },
    ascending: { x: 264, y: 300 },
    transverse:{ x: 168, y: 196 },
    descending:{ x: 80,  y: 270 },
    sigmoid:   { x: 124, y: 384 },
    rectum:    { x: 146, y: 408 }
  };

  // ============================================================
  // GUT CHARACTER — cute colon-shaped mascot with expressions.
  // Used in alert + quest screens instead of generic emoji.
  // ============================================================
  function gutCharacterSVG(state, opts) {
    opts = opts || {};
    var size = opts.size || 120;
    var DEFAULT = { mouth: 'smile', eyes: 'normal', cheeks: true, aura: '#1F77F2', body: '#FFB7C5', label: '' };
    var S = {
      healthy:   { mouth: 'smile',    eyes: 'normal', cheeks: true,  aura: '#1CB87C', body: '#FFB7C5', label: '쾌통!' },
      warn:      { mouth: 'flat',     eyes: 'wide',   cheeks: true,  aura: '#F5A623', body: '#FFC8B8', label: '주의' },
      danger:    { mouth: 'frown',    eyes: 'x',      cheeks: false, aura: '#E94560', body: '#FF9EA8', label: '위험' },
      recovered: { mouth: 'bigSmile', eyes: 'happy',  cheeks: true,  aura: '#1F77F2', body: '#FFD3DC', label: '회복중' },
      quest:     { mouth: 'bigSmile', eyes: 'star',   cheeks: true,  aura: '#7B61FF', body: '#FFD3DC', label: '레벨업!' },
      scan:      { mouth: 'o',        eyes: 'scan',   cheeks: false, aura: '#1F77F2', body: '#FFB7C5', label: '스캔중' }
    }[state] || DEFAULT;

    var mouth = {
      smile:    '<path d="M84,98 Q100,112 116,98" stroke="#3A1F2B" stroke-width="3" fill="none" stroke-linecap="round"/>',
      bigSmile: '<path d="M82,96 Q100,122 118,96 Q100,108 82,96 Z" fill="#3A1F2B" stroke="#3A1F2B" stroke-width="2" stroke-linejoin="round"/><path d="M84,104 Q100,116 116,104" fill="#FF6B8A" stroke="none"/>',
      flat:     '<path d="M84,104 L116,104" stroke="#3A1F2B" stroke-width="3" stroke-linecap="round"/>',
      frown:    '<path d="M84,110 Q100,94 116,110" stroke="#3A1F2B" stroke-width="3" fill="none" stroke-linecap="round"/>',
      o:        '<ellipse cx="100" cy="104" rx="6" ry="8" fill="#3A1F2B"/>'
    }[S.mouth];

    var eye = {
      normal: '<circle cx="80" cy="80" r="6" fill="#3A1F2B"/><circle cx="120" cy="80" r="6" fill="#3A1F2B"/><circle cx="82" cy="78" r="2" fill="#FFFFFF"/><circle cx="122" cy="78" r="2" fill="#FFFFFF"/>',
      wide:   '<circle cx="80" cy="80" r="7" fill="#FFFFFF" stroke="#3A1F2B" stroke-width="2"/><circle cx="120" cy="80" r="7" fill="#FFFFFF" stroke="#3A1F2B" stroke-width="2"/><circle cx="81" cy="81" r="3" fill="#3A1F2B"/><circle cx="121" cy="81" r="3" fill="#3A1F2B"/>',
      happy:  '<path d="M74,82 Q80,72 86,82" stroke="#3A1F2B" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M114,82 Q120,72 126,82" stroke="#3A1F2B" stroke-width="3" fill="none" stroke-linecap="round"/>',
      x:      '<path d="M74,74 L86,86 M86,74 L74,86" stroke="#3A1F2B" stroke-width="3" stroke-linecap="round"/><path d="M114,74 L126,86 M126,74 L114,86" stroke="#3A1F2B" stroke-width="3" stroke-linecap="round"/>',
      star:   '<path d="M80,72 L83,79 L90,80 L85,85 L86,92 L80,89 L74,92 L75,85 L70,80 L77,79 Z" fill="#7B61FF"/><path d="M120,72 L123,79 L130,80 L125,85 L126,92 L120,89 L114,92 L115,85 L110,80 L117,79 Z" fill="#7B61FF"/>',
      scan:   '<rect x="72" y="74" width="16" height="12" rx="3" fill="#0B1E3F" stroke="#1F77F2" stroke-width="2"/><rect x="112" y="74" width="16" height="12" rx="3" fill="#0B1E3F" stroke="#1F77F2" stroke-width="2"/><line x1="80" y1="76" x2="80" y2="84" stroke="#5BA4FF" stroke-width="1.5"><animate attributeName="y1" from="76" to="84" dur="1s" repeatCount="indefinite"/><animate attributeName="y2" from="80" to="88" dur="1s" repeatCount="indefinite"/></line><line x1="120" y1="76" x2="120" y2="84" stroke="#5BA4FF" stroke-width="1.5"><animate attributeName="y1" from="76" to="84" dur="1s" repeatCount="indefinite"/><animate attributeName="y2" from="80" to="88" dur="1s" repeatCount="indefinite"/></line>'
    }[S.eyes];

    var cheeks = S.cheeks ? '<ellipse cx="68" cy="98" rx="7" ry="4" fill="#FF6B8A" opacity=".45"/><ellipse cx="132" cy="98" rx="7" ry="4" fill="#FF6B8A" opacity=".45"/>' : '';

    var body =
      '<path d="M40,130 Q40,80 80,72 Q130,68 168,76 Q210,84 210,130 Q210,160 180,164 Q150,166 146,140 Q142,116 118,118 Q100,120 100,140 Q100,162 78,164 Q40,164 40,130 Z" ' +
      'fill="' + S.body + '" stroke="#E68FAE" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M40,130 Q40,80 80,72 Q130,68 168,76 Q210,84 210,130" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".5"/>' +
      '<ellipse cx="80" cy="100" rx="20" ry="14" fill="#FFFFFF" opacity=".25"/>';

    var auraGlow = '<circle cx="125" cy="118" r="86" fill="none" stroke="' + S.aura + '" stroke-width="2" opacity=".25"><animate attributeName="r" from="80" to="92" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" from=".35" to="0" dur="2.4s" repeatCount="indefinite"/></circle>';

    var svg = '<svg viewBox="0 0 250 220" width="' + size + '" height="' + (size * 0.88) + '" style="display:block;filter:drop-shadow(0 8px 16px ' + S.aura + '33)">';
    svg += auraGlow + body + cheeks + eye + mouth;
    svg += '</svg>';
    if (S.label) {
      svg += '<div style="margin-top:6px;font-size:12px;color:' + S.aura + ';font-weight:700;text-align:center">' + S.label + '</div>';
    }
    return '<div style="text-align:center">' + svg + '</div>';
  }

  // ============================================================
  // AI LENS TIMELINE — auto-detected daily events.
  // ws/hj = 결정적 하루 스크립트(정형돈 20종 배치 / 유재석 좋은 식단).
  // 새 프로필(demo 아님) = 감지 없음 → 모든 화면이 "처음 상태".
  // ============================================================
  var DEMO_DAY_WS = [
    [7, 'triangle'], [7, 'bacon'], [7, 'mixcoffee'],
    [9, 'snack'], [9, 'stress'],
    [10, 'soda'],
    [11, 'boba'],
    [12, 'bento'], [12, 'sausage'], [12, 'tteok'],
    [13, 'choco'],
    [14, 'icecream'],
    [15, 'burger'],
    [16, 'fries'],
    [18, 'noodle'],
    [19, 'chicken'],
    [20, 'pizza'],
    [21, 'donut'],
    [22, 'cake'],
    [23, 'soju'], [23, 'dumpling']
  ];
  var DEMO_DAY_HJ = [
    [6, 'water'],
    [7, 'yogurt'], [7, 'oats'], [7, 'banana'],
    [10, 'nut'], [10, 'berry'],
    [12, 'miso'], [12, 'tofu'], [12, 'kimchi'],
    [13, 'walk'],
    [15, 'avocado'], [15, 'water'],
    [18, 'fish'], [18, 'greens'], [18, 'bean'],
    [20, 'water']
  ];
  function scriptTimeline(script, dateStr) {
    var day = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    var events = [], cum = { scfa: 0, lps: 0, inf: 0 };
    var mealNames = { 7: '아침', 12: '점심', 18: '저녁' };
    script.forEach(function (row) {
      var h = row[0], kind = row[1];
      var min = hashStr(kind + (dateStr || '') + '' + h) % 50 + 5;
      var ts = new Date(day); ts.setHours(h, min, 0, 0);
      if (kind === 'water') {
        events.push({ ts: ts.getTime(), hour: h, min: min, type: 'water', title: '물 섭취', desc: 'AI 렌즈가 텀블러 섭취 감지', icon: '💧', gutDelta: { scfa: 2, lps: -1, inf: -1 } });
        cum.scfa += 2; cum.lps -= 1; cum.inf -= 1;
        return;
      }
      if (kind === 'walk') {
        events.push({ ts: ts.getTime(), hour: h, min: min, type: 'movement', title: '식후 산책 감지', desc: 'GPS + 걸음 수로 15분 야외 걷기 감지', icon: '🚶', gutDelta: { scfa: 3, lps: -2, inf: -2 } });
        cum.scfa += 3; cum.lps -= 2; cum.inf -= 2;
        return;
      }
      if (kind === 'stress') {
        events.push({ ts: ts.getTime(), hour: h, min: min, type: 'stress', title: '스트레스 증가 감지', desc: '웨어러블 심박 변이도 ↓, 한숨 감지', icon: '😟', gutDelta: { scfa: -3, lps: 4, inf: 3 } });
        cum.scfa -= 3; cum.lps += 4; cum.inf += 3;
        return;
      }
      var f = null;
      for (var fi = 0; fi < FOODS.length; fi++) if (FOODS[fi].id === kind) { f = FOODS[fi]; break; }
      if (!f) return;
      events.push({ ts: ts.getTime(), hour: h, min: min, type: 'meal', title: (mealNames[h] ? mealNames[h] + ' · ' : '') + f.label, desc: f.bad ? '해로운 식단 — ' + f.why : '이로운 식단 — ' + f.label, icon: '', foodId: f.id, gutDelta: { scfa: f.scfa, lps: f.lps, inf: f.inf } });
      cum.scfa += f.scfa; cum.lps += f.lps; cum.inf += f.inf;
    });
    return { date: dateStr || todayStr(), events: events.sort(function (a, b) { return a.ts - b.ts; }), cumulative: cum };
  }

  function aiTimeline(profile, dateStr) {
    if (!profile || !profile.demo) {
      return { date: dateStr || todayStr(), events: [], cumulative: { scfa: 0, lps: 0, inf: 0 } };
    }
    if (profile.id === 'ws') return scriptTimeline(DEMO_DAY_WS, dateStr);
    if (profile.id === 'hj') return scriptTimeline(DEMO_DAY_HJ, dateStr);
    var seed = hashStr((profile.name || 'anon') + profile.gender + profile.age + profile.lifestyle + dateStr);
    var rnd = mulberry32(seed);
    var day = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    var dayOfWeek = day.getDay(); // 0 sun .. 6 sat

    // Build event list anchored to meal times + lifestyle behavior
    var events = [];

    function pickFood(cat, bad) {
      var pool = FOODS.filter(function (f) {
        if (bad != null && f.bad !== bad) return false;
        if (cat) {
          if (Array.isArray(cat)) { if (cat.indexOf(f.cat) < 0) return false; }
          else if (f.cat !== cat) return false;
        }
        return true;
      });
      return pool[Math.floor(rnd() * pool.length)] || FOODS[0];
    }
    function add(h, m, type, title, desc, opts) {
      var ts = new Date(day);
      ts.setHours(h, m, 0, 0);
      events.push(Object.assign({ ts: ts.getTime(), hour: h, min: m, type: type, title: title, desc: desc }, opts || {}));
    }

    // Morning wake + water (active lifestyle drinks more water)
    var wakeH = 6 + Math.floor(rnd() * 2);
    add(wakeH, Math.floor(rnd() * 30), 'water', '기상 후 물 한 잔', '스캐너이 기상 직후 물 섭취를 감지했어요', { icon: '💧', gutDelta: { scfa: 2, lps: -1, inf: -1 } });

    // Breakfast
    var breakfastGood = rnd() > 0.4;
    var bf = breakfastGood ? pickFood(['fiber', 'ferment', 'protein'], false) : pickFood(['processed', 'sugar'], true);
    add(wakeH + 1, 15 + Math.floor(rnd() * 20), 'meal', '아침 · ' + bf.label, bf.bad ? '정제 탄수화물 위주 아침 — 혈당 스파이크 예상' : '식이섬유+단백 균형 잡힌 아침', { icon: '🍳', foodId: bf.id, gutDelta: { scfa: bf.scfa, lps: bf.lps, inf: bf.inf } });

    // Stress event mid-morning (lifestyle-driven)
    if (profile.lifestyle === 'stress' || rnd() > 0.7) {
      add(10 + Math.floor(rnd() * 2), Math.floor(rnd() * 50), 'stress', '스트레스 증가 감지', '웨어러블 심박 변이도 ↓, 스캐너 한숨 감지', { icon: '😟', gutDelta: { scfa: -3, lps: 4, inf: 3 } });
    }

    // Lunch
    var lunchBad = (profile.lifestyle === 'sedentary' && rnd() > 0.5);
    var ln = lunchBad ? pickFood(['refined', 'processed', 'fried'], true) : pickFood(['mixed', 'protein', 'fiber'], false);
    add(12, 15 + Math.floor(rnd() * 45), 'meal', '점심 · ' + ln.label, ln.bad ? '외식/가공식품 — 나트륨+지방 높음' : '균형 잡힌 점심', { icon: '🍱', foodId: ln.id, gutDelta: { scfa: ln.scfa, lps: ln.lps, inf: ln.inf } });

    // Post-lunch walk (active/athlete lifestyles)
    if (profile.lifestyle === 'active' || profile.lifestyle === 'athlete' || (dayOfWeek !== 0 && dayOfWeek !== 6 && rnd() > 0.6)) {
      add(13, 10 + Math.floor(rnd() * 20), 'movement', '식후 산책 감지', '스캐너 GPS + 걸음 수로 15분 야외 걷기 감지', { icon: '🚶', gutDelta: { scfa: 3, lps: -2, inf: -2 } });
    }

    // Snack (lifestyle-driven risk)
    if ((profile.lifestyle === 'sedentary' || profile.lifestyle === 'stress') && rnd() > 0.4) {
      var sn = pickFood(['snack', 'sugar'], true);
      add(15, Math.floor(rnd() * 60), 'meal', '오후 간식 · ' + sn.label, '오후 크래빙 — 스캐너이 당 충동 패턴 감지', { icon: '🍪', foodId: sn.id, gutDelta: { scfa: sn.scfa, lps: sn.lps, inf: sn.inf } });
    } else {
      var hsn = pickFood(['fiber', 'ferment'], false);
      add(15, Math.floor(rnd() * 60), 'meal', '오후 간식 · ' + hsn.label, '건강한 간식 선택', { icon: '🥜', foodId: hsn.id, gutDelta: { scfa: hsn.scfa, lps: hsn.lps, inf: hsn.inf } });
    }

    // Dinner
    var dn = (rnd() > 0.55) ? pickFood(['protein', 'fiber', 'mixed'], false) : pickFood(['refined', 'fried'], true);
    add(18 + Math.floor(rnd() * 2), Math.floor(rnd() * 50), 'meal', '저녁 · ' + dn.label, dn.bad ? '늦은 저녁 + 무거운 메뉴 — 수면 질에 영향' : '건강한 저녁 구성', { icon: '🍲', foodId: dn.id, gutDelta: { scfa: dn.scfa, lps: dn.lps, inf: dn.inf } });

    // Evening water
    if (rnd() > 0.4) {
      add(20, Math.floor(rnd() * 60), 'water', '물 섭취', '스캐너이 사무용 텀블러 섭취 감지', { icon: '🚰', gutDelta: { scfa: 2, lps: -1, inf: -1 } });
    }

    // Late-night risk (sedentary/stress)
    if ((profile.lifestyle === 'sedentary' || profile.lifestyle === 'stress') && rnd() > 0.6) {
      var ln2 = pickFood(['alcohol', 'snack', 'sugar'], true);
      add(22, Math.floor(rnd() * 50), 'meal', '야식 · ' + ln2.label, '야식 — 수면 2시간 내 섭취, 흡수+장 운동 저하', { icon: '🌙', foodId: ln2.id, gutDelta: { scfa: ln2.scfa, lps: ln2.lps, inf: ln2.inf } });
    }

    // Cumulative gut impact through the day
    var cum = { scfa: 0, lps: 0, inf: 0 };
    events.forEach(function (e) { if (e.gutDelta) { cum.scfa += e.gutDelta.scfa; cum.lps += e.gutDelta.lps; cum.inf += e.gutDelta.inf; } });

    return { date: dateStr || todayStr(), events: events.sort(function (a, b) { return a.ts - b.ts; }), cumulative: cum };
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ============================================================
  // AUTO QUEST SIGNALS — AI glasses-detected quest progress.
  // Returns per-quest: detected bool + evidence event description.
  // ============================================================
  function autoQuestSignals(profile, dateStr) {
    var tl = aiTimeline(profile, dateStr);
    var events = tl.events;
    var mealEvents = events.filter(function (e) { return e.type === 'meal'; });
    var moveEvents = events.filter(function (e) { return e.type === 'movement'; });
    var waterEvents = events.filter(function (e) { return e.type === 'water'; });

    var totalFiber = mealEvents.reduce(function (s, e) {
      var f = FOODS.filter(function (x) { return x.id === e.foodId; })[0];
      return s + (f ? f.fiber : 0);
    }, 0);
    var hadZero = mealEvents.every(function (e) {
      var f = FOODS.filter(function (x) { return x.id === e.foodId; })[0];
      return !f || (f.cat !== 'sugar' && f.id !== 'soda' && f.id !== 'snack');
    });
    var hadFerment = mealEvents.some(function (e) {
      var f = FOODS.filter(function (x) { return x.id === e.foodId; })[0];
      return f && f.cat === 'ferment';
    });
    var hadProcessed = mealEvents.some(function (e) {
      var f = FOODS.filter(function (x) { return x.id === e.foodId; })[0];
      return f && f.cat === 'processed';
    });

    var out = {};
    out.q_fiber = {
      detected: totalFiber >= 20,
      progress: Math.min(100, Math.round(totalFiber / 25 * 100)),
      evidence: '스캐너 식사 인식: 금일 식이섬유 약 ' + totalFiber + 'g 감지 (목표 25g)',
      events: mealEvents.filter(function (e) { var f = FOODS.filter(function (x) { return x.id === e.foodId; })[0]; return f && f.fiber > 0; })
    };
    out.q_water = {
      detected: waterEvents.length >= 2,
      progress: Math.min(100, Math.round(waterEvents.length / 2 * 100)),
      evidence: '스캐너 + 웨어러블: 금일 물 섭취 이벤트 ' + waterEvents.length + '회 (목표: 기상 + 1회+)',
      events: waterEvents
    };
    out.q_zero = {
      detected: hadZero,
      progress: hadZero ? 100 : Math.round((1 - mealEvents.filter(function (e) { var f = FOODS.filter(function (x) { return x.id === e.foodId; })[0]; return f && (f.id === 'soda' || f.id === 'snack'); }).length / Math.max(1, mealEvents.length)) * 100),
      evidence: hadZero ? '제로음료/저당과자 금일 0건 — 습관 유지 감지' : '스캐너이 제로음료/저당과자 섭취를 감지함',
      events: mealEvents
    };
    out.q_walk = {
      detected: moveEvents.length >= 1,
      progress: Math.min(100, Math.round(moveEvents.length / 1 * 100)),
      evidence: moveEvents.length ? '스캐너 GPS: 식후 야외 걷기 ' + moveEvents.length + '회 감지 (15분+)' : '식후 산책 이벤트 미감지',
      events: moveEvents
    };
    out.q_ferment = {
      detected: hadFerment,
      progress: hadFerment ? 100 : 0,
      evidence: hadFerment ? '발효식품(김치/요거트/된장) 감지 — 프로바이오틱스 정착 신호' : '금일 발효식품 미감지',
      events: mealEvents.filter(function (e) { var f = FOODS.filter(function (x) { return x.id === e.foodId; })[0]; return f && f.cat === 'ferment'; })
    };
    out.q_meat = {
      detected: !hadProcessed,
      progress: hadProcessed ? 0 : 100,
      evidence: hadProcessed ? '가공육(소시지/베이컨) 섭취 감지 — 14일 챌린지 리셋' : '금일 가공육 0건 — 챌린지 진행 중',
      events: mealEvents
    };
    return out;
  }

  // Returns baseline indices for a profile, applying lifestyle shift
  function baselineFor(profile) {
    var br = PROFILE_BASELINES[ageBracket(profile.age)][profile.gender] || PROFILE_BASELINES['30s'].male;
    var shift = (LIFESTYLES[profile.lifestyle] || LIFESTYLES.sedentary).baseShift;
    return {
      scfa: clamp(br.scfa + shift),
      lps: clamp(br.lps - Math.round(shift / 2)),
      inf: clamp(br.inf - Math.round(shift / 2)),
      overall: clamp(br.overall + shift)
    };
  }

  function clamp(v, lo, hi) { lo = lo || 4; hi = hi || 94; return Math.max(lo, Math.min(hi, v)); }

  // ============================================================
  // BAD COMBOS - triggers the alert screen
  // ============================================================
  var BAD_COMBOS = [
    { ids: ['snack', 'noodle'], title: '저당과자 + 라면', sev: 'high',
      why: '수크랄로스 + 정제 탄수화물 → SCFA 급감 → 소장 융모 손상 → 영양 흡수 저하',
      zone: 'jejunum', ev: 'IJMS 2025' },
    { ids: ['sausage', 'soda'], title: '가공육 + 탄산음료', sev: 'high',
      why: '아질산염 + 액상과당 → 장 점막 산화 손상 + 인슐린 스파이크',
      zone: 'sigmoid', ev: 'IARC/WHO 2018' },
    { ids: ['beer', 'fries'], title: '맥주 + 튀김', sev: 'mid',
      why: '알코올 + 산화지방 → 장 투과성 상승 → 내독소 혈류 유입',
      zone: 'descending', ev: 'Gut 2023' },
    { ids: ['cake', 'icecream'], title: '케이크 + 아이스크림', sev: 'mid',
      why: '정제당 이중 타격 → 미생물 다양성 감소 → 효모 과증식',
      zone: 'cecum', ev: 'Cell 2021' },
    { ids: ['instant', 'soda'], title: '즉석식품 + 탄산', sev: 'high',
      why: '유화제 + 고당 → 점액층 붕괴 → 장 누수 증후군',
      zone: 'ascending', ev: 'Nature 2015' }
  ];

  // ============================================================
  // EMR + SENSOR MOCK - simulated multi-source signals
  // We generate a stable per-profile stream using a seeded RNG.
  // ============================================================
  function mulberry32(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h); }

  // Returns 7-day mock streams: vitals + biomarkers + sensors
  function mockStreams(profile, dietImpact) {
    var seed = hashStr((profile.name || 'anon') + profile.gender + profile.age + profile.lifestyle);
    var rnd = mulberry32(seed);
    var impact = dietImpact || 0; // -30..30
    var days = [];
    for (var d = 6; d >= 0; d--) {
      var base = baselineFor(profile);
      days.push({
        day: d,
        vitals: {
          bp_sys: 118 + Math.round((rnd() - 0.4) * 18) + Math.round(impact / 5),
          bp_dia: 76 + Math.round((rnd() - 0.4) * 12) + Math.round(impact / 6),
          hr: 64 + Math.round((rnd() - 0.4) * 14),
          temp: (36.4 + (rnd() - 0.5) * 0.7).toFixed(1),
          sleep_hr: (6.4 + (rnd() - 0.3) * 2).toFixed(1)
        },
        biomarkers: {
          crp: (0.4 + (rnd() + impact / 30) * 2.5).toFixed(2),    // mg/L, <1 good
          fasting_glucose: 88 + Math.round((rnd() - 0.3) * 22) + Math.round(impact / 4),
          triglyceride: 110 + Math.round((rnd() - 0.3) * 80) + Math.round(impact / 3),
          cholesterol: 175 + Math.round((rnd() - 0.4) * 50)
        },
        sensors: {
          steps: 4000 + Math.round(rnd() * 8000),
          stress_idx: clamp(Math.round(40 + (rnd() - 0.4) * 50 + impact), 5, 95),
          water_ml: 1100 + Math.round(rnd() * 1300),
          gut_activity: clamp(Math.round(base.scfa + (rnd() - 0.5) * 18 + impact), 4, 94)
        }
      });
    }
    return days;
  }

  // ============================================================
  // QUESTS - medical knowledge backed
  // ============================================================
  var QUESTS = [
    { id: 'q_fiber', icon: '🌿', title: '식이섬유 챌린지', cond: '25g/일 × 5일',
      reward: '유익균 강화 포션 +120 XP', zone: 'ascending', xp: 120,
      ev: '식이섬유 25g/일은 butyrate 생성균 2배 증가 — Lancet 2019 메타분석',
      fix: { scfa: 8, lps: -4, inf: -5 } },
    { id: 'q_water', icon: '💧', title: '공복 수분', cond: '아침 물 500ml × 5일',
      reward: '장 운동성 부스터 +80 XP', zone: 'transverse', xp: 80,
      ev: '공복 수분은 대장 운동 촉진 + 변비 예방 — J Neurogastroenterol 2020',
      fix: { scfa: 4, lps: -3, inf: -2 } },
    { id: 'q_zero', icon: '🚫', title: '제로음료 끊기', cond: '7일 연속',
      reward: '장벽 회복 방패 +150 XP', zone: 'duodenum', xp: 150,
      ev: '수크랄로스/아스파탐 7일 중단은 장내 유익균 회복 — Nature 2021',
      fix: { scfa: 6, lps: -8, inf: -7 } },
    { id: 'q_walk', icon: '🚶', title: '식후 산책 15분', cond: '주 5회',
      reward: '장 운동 스피드업 +100 XP', zone: 'sigmoid', xp: 100,
      ev: '식후 가벼운 운동은 위장관 통과시간 단축 — Gut 2022',
      fix: { scfa: 5, lps: -3, inf: -4 } },
    { id: 'q_ferment', icon: '🥬', title: '발효식품 매일', cond: '김치/요거트/된장 × 7일',
      reward: '프로바이오틱스 정착 +110 XP', zone: 'ileum', xp: 110,
      ev: '발효식품 다양성은 미생물 다양성 30% 증가 — Cell 2021 Stanford',
      fix: { scfa: 7, lps: -5, inf: -6 } },
    { id: 'q_meat', icon: '🥩', title: '가공육 제로', cond: '14일',
      reward: '대장암 위험 감소 배지 +200 XP', zone: 'sigmoid', xp: 200,
      ev: '가공육 회피 14일은 장내 발암 대사물질 감소 — Cancer Res 2020',
      fix: { scfa: 8, lps: -10, inf: -9 } }
  ];

  // ============================================================
  // ENDOSCOPE IMAGE SET - mapped to legacy base64 images
  // ============================================================
  var ENDOSCOPE_SET = {
    healthy: { img: 'scope_now', label: '정상 점막', desc: '융모 정렬, 혈관문 정상', score: 85, col: C.green },
    inflamed: { img: 'scope_bad', label: '만성 염증 + 용종', desc: '발적, 용종 형성, 점액 감소', score: 28, col: C.red },
    recovered: { img: 'scope_rec', label: '회복 균총', desc: '융모 재생, SCFA 회복', score: 78, col: C.cyan }
  };

  // ============================================================
  // XP / LEVEL CURVE
  // ============================================================
  function levelForXp(xp) {
    // quadratic: level n requires n^2 * 50 xp cumulative
    var lvl = 1;
    while (xp >= (lvl + 1) * (lvl + 1) * 50) lvl++;
    var cur = lvl * lvl * 50, next = (lvl + 1) * (lvl + 1) * 50;
    return { level: lvl, cur, next, into: xp - cur, span: next - cur };
  }
  var LEVEL_TITLES = ['장 새내기', '장 탐험가', '장 수호자', '마이크로바이옴 마스터', '디지털 트윈 전문가'];
  function titleFor(level) { return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] || LEVEL_TITLES[0]; }

  // ============================================================
  // CITATIONS
  // ============================================================
  var CITATIONS = {
    'IJMS 2025': 'Erythritol alters gut permeability — Int J Mol Sci, 2025',
    'Nature 2021 (sucralose)': 'Sucralose metabolite alters gut microbiome — Nature, 2021',
    'IARC/WHO 2018': 'Processed meat carcinogenicity — IARC Monograph, WHO 2018',
    'Lancet 2019': 'Carbohydrate quality & health — Lancet meta-analysis, 2019',
    'Cell 2021': 'Fermented foods & microbiome diversity — Stanford, Cell 2021',
    'Gut 2022': 'Dietary emulsifiers & mucus layer — Gut, 2022',
    'Nat Rev Gastro 2021': 'SCFA and colonic barrier — Nature Reviews Gastroenterology, 2021'
  };

  // ============================================================
  // CORE METRICS SYSTEM — causally linked triple (SCENE.md CORE 지표).
  // ① Permeability(장벽 투과성) derived from LPS — cracks >= 40, leak at max
  // ② Inflammation(전신 염증) = "장 상태": 우수/양호/주의/위험 4단계
  // ③ Dopamine(도파미니) — asymmetric (bad=fast drop, good=slow rise),
  //    capped by inflammation. 3 states: 생기/둔감/탈진.
  // ============================================================
  var CORE_METRICS = {
    permeability: { label: '장벽 투과성', unit: '', goodDown: true, crackAt: 40, leakAt: 80,
      ev: 'SCFA 감소 → tight junction 단백질(claudin/occludin) 발현 ↓ → 점막 균열 — Nat Rev Gastro 2021' },
    inflammation: { label: '전신 염증 지수', unit: '', goodDown: true, dangerAt: 60, cautionAt: 40,
      ev: 'LPS 혈류 유입 → TLR4 활성화 → 전신 저도염증 — Gut 2023' },
    dopamine:     { label: '도파미니 감수성', unit: '', goodDown: false, floor: 25,
      ev: '염증이 도파민 전구물질(tyrosine→L-DOPA) 공급 방해 — Nat Neurosci 2020' }
  };

  // 3-state 도파미니 character config (SCENE.md 1-3)
  var DOPA_STATES = {
    lively:   { key: 'lively',   emoji: '⚡', label: '생기',  color: C.yellow, min: 70, scale: 1.3, particles: 16, bob: 0.6, mouthY: 9 },
    dull:     { key: 'dull',     emoji: '😐', label: '둔감',  color: C.sub,   min: 30, scale: 1.0, particles: 5,  bob: 1.6, mouthY: 6 },
    exhausted:{ key: 'exhausted',emoji: '🫥', label: '탈진',  color: '#4B5A70',min: 0,  scale: 0.75,particles: 0,  bob: 0,   mouthY: 4 }
  };
  function dopaStateFor(d) {
    if (d >= 70) return DOPA_STATES.lively;
    if (d >= 30) return DOPA_STATES.dull;
    return DOPA_STATES.exhausted;
  }
  // 도파민 회복 상한선 — 염증이 높으면 100%까지 못 올림 (논문 기반, SCENE.md 1-3)
  function dopaCeiling(inf) { return Math.max(40, 100 - inf * 0.5); }

  // 장 상태 — 전신 염증 4단계 매핑: 우수/양호/주의/위험 (SCENE.md 1-2 개정)
  var WEATHER_STATES = {
    excellent: { key: 'excellent', emoji: '🌟', label: '우수', color: C.green,  max: 20, tone: 'linear-gradient(180deg,#F4F8FE,#EAF1FC)' },
    fair:      { key: 'fair',      emoji: '☀️', label: '양호', color: C.yellow, max: 40, tone: 'linear-gradient(180deg,#F4F8FE,#EAF1FC)' },
    caution:   { key: 'caution',   emoji: '🌥️', label: '주의', color: C.sub,    max: 60, tone: 'linear-gradient(180deg,#E8EEF7,#D8E2F0)' },
    danger:    { key: 'danger',    emoji: '⛈️', label: '위험', color: C.red,    max: 101, tone: 'linear-gradient(180deg,#FFE5E9,#FFD3DC)' }
  };
  function weatherFor(inf) {
    if (inf < 20) return WEATHER_STATES.excellent;
    if (inf < 40) return WEATHER_STATES.fair;
    if (inf < 60) return WEATHER_STATES.caution;
    return WEATHER_STATES.danger;
  }

  // 도파미니 SVG 캐릭터 (포팅+확장 from GBA 데모)
  function dopaCharSVG(d, size) {
    size = size || 56;
    var st = dopaStateFor(d);
    var bob = d >= 70 ? 'gsbob 0.6s ease-in-out infinite' : d >= 30 ? 'gsbob 1.6s ease-in-out infinite' : 'none';
    var eyes = d >= 70
      ? '<circle cx="-6" cy="-2" r="2.4" fill="#060E1C"/><circle cx="6" cy="-2" r="2.4" fill="#060E1C"/>'
      : d >= 30
        ? '<line x1="-8" y1="-2" x2="-4" y2="-2" stroke="#060E1C" stroke-width="2"/><line x1="4" y1="-2" x2="8" y2="-2" stroke="#060E1C" stroke-width="2"/>'
        : '<path d="M-8,-1 Q-6,-3 -4,-1" stroke="#060E1C" stroke-width="1.6" fill="none"/><path d="M4,-1 Q6,-3 8,-1" stroke="#060E1C" stroke-width="1.6" fill="none"/>';
    var particles = '';
    for (var i = 0; i < st.particles; i++) {
      var a = (i / st.particles) * 360, r = size * 0.55;
      particles += '<circle cx="' + (Math.cos(a * Math.PI / 180) * r).toFixed(1) + '" cy="' + (Math.sin(a * Math.PI / 180) * r).toFixed(1) + '" r="1.6" fill="' + st.color + '" opacity=".7"><animate attributeName="opacity" values=".3;.9;.3" dur="' + (1 + i % 3 * 0.3) + 's" repeatCount="indefinite"/></circle>';
    }
    return '<svg width="' + size + '" height="' + size + '" viewBox="-30 -30 60 60" style="overflow:visible;display:block">' +
      '<g style="animation:' + bob + '">' +
        particles +
        '<circle cx="0" cy="0" r="16" fill="' + st.color + '" opacity="' + (d < 30 ? '.4' : '.95') + '"/>' +
        '<circle cx="0" cy="0" r="16" fill="none" stroke="#FFFFFF" stroke-width="1" opacity=".4"/>' +
        eyes +
        '<path d="M-4,5 Q0,' + st.mouthY + ' 4,5" stroke="#060E1C" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '</g>' +
    '</svg>';
  }

  // 장벽 균열 단계 (SCENE.md 1-1) — 투과성이 높을수록 균열 증가
  function crackLevel(permeability) {
    if (permeability >= 75) return 3;
    if (permeability >= 60) return 2;
    if (permeability >= 40) return 1;
    return 0;
  }
  function crackSVG(cx, cy, r, level) {
    if (!level) return '';
    var paths = [
      'M' + (cx - 4) + ',' + (cy - r + 3) + ' l3,6 l-2,4 l4,5',
      'M' + (cx + 5) + ',' + (cy - r + 4) + ' l-3,5 l3,4',
      'M' + (cx) + ',' + (cy + r - 3) + ' l2,-5 l-3,-4'
    ];
    var s = '';
    for (var i = 0; i < level; i++) {
      s += '<path d="' + paths[i] + '" stroke="' + C.red + '" stroke-width="1.4" fill="none" opacity=".9" class="gs-crack"><animate attributeName="opacity" values=".5;1;.5" dur="1.4s" repeatCount="indefinite" begin="' + (i * 0.3) + 's"/></path>';
    }
    // 최고 단계 - 입자 유출 (SCENE.md 1-1)
    if (level >= 3) {
      for (var j = 0; j < 6; j++) {
        var ang = j * 60;
        s += '<circle r="1.8" fill="' + C.red + '" opacity=".7">' +
          '<animateMotion dur="1.8s" repeatCount="indefinite" path="M' + cx + ',' + cy + ' L' + (cx + Math.cos(ang * Math.PI / 180) * r * 2) + ',' + (cy + Math.sin(ang * Math.PI / 180) * r * 2) + '"/>' +
          '<animate attributeName="opacity" values=".8;0" dur="1.8s" repeatCount="indefinite"/>' +
        '</circle>';
      }
    }
    return s;
  }

  // ============================================================
  // DR. JANG NPC LIBRARY — 5 poses × situation-driven speech lines.
  // Poses map to www/assets/img/dr_jang_1..5.png (1=환영/2=경고/3=격려/4=축하/5=설명).
  // ============================================================
  var DR_JANG_POSES = {
    welcome:  { img: 'assets/img/DR_JANG_1.png', name: 'Dr.장', role: '장 생태계 가이드' },
    warn:     { img: 'assets/img/DR_JANG_2.png', name: 'Dr.장', role: '장 생태계 가이드' },
    cheer:    { img: 'assets/img/DR_JANG_3.png', name: 'Dr.장', role: '장 생태계 가이드' },
    celebrate:{ img: 'assets/img/DR_JANG_4.png', name: 'Dr.장', role: '장 생태계 가이드' },
    explain:  { img: 'assets/img/DR_JANG_5.png', name: 'Dr.장', role: '장 생태계 가이드' }
  };

  // 상황별 Dr.장 라인 선택기: 현재 장 상태/퀘스트/알림/스트릭을 종합해 적절한 라인 반환
  function drJangLine(ctx) {
    ctx = ctx || {};
    var metrics = ctx.metrics || {};
    var dopa = metrics.dopamine != null ? metrics.dopamine : 60;
    var inf = metrics.inflammation != null ? metrics.inflammation : 30;
    var perm = metrics.permeability != null ? metrics.permeability : 35;
    var foods = ctx.foods || [];
    var badFoods = foods.filter(function (f) { return f.bad; });
    var goodFoods = foods.filter(function (f) { return !f.bad; });
    var streak = ctx.streak || 0;
    var alerts = ctx.alerts || 0;
    var questDone = ctx.questDone || 0;
    var scene = ctx.scene || null;

    // 씬 직후 (Act 4) — 회복 유도
    if (scene === 'bad-after') {
      return { pose: 'cheer', line: '방금 그 선택, 한 끼면 되돌릴 수 있어요. 다음 끼니에 발효식품(김치·요거트)을 한 조각 추가하면 융모가 다시 살아날 거예요. 48시간 리셋 챌린지도 열려 있어요.' };
    }
    if (scene === 'good-after') {
      return { pose: 'celebrate', line: '훌륭해요! SCFA가 장벽 에너지를 강화하고 도파미니가 생기 상태예요. 이 패턴을 3일 유지하면 연속 달성 보너스가 열립니다.' };
    }

    // 48시간 리셋 챌린지 진행 중
    if (ctx.resetActive) {
      var hrs = ctx.resetHours || 0;
      if (hrs >= 48) return { pose: 'celebrate', line: '48시간 리셋 완료! 균열이 아물고 장 상태가 양호로 전환되며, 도파미니 회복 제한이 해제됐어요.' };
      return { pose: 'cheer', line: '리셋 챌린지 ' + hrs + '시간 진행 중. 무가당·무감미료만 ' + (48 - hrs) + '시간 더 버티면 장벽이 아물기 시작해요.' };
    }

    // 위험 상태
    if (perm >= 70 || inf >= 60) {
      return { pose: 'warn', line: '지금 장 누수 가능성이 높아요. 내독소(LPS)가 혈류로 새어 나가 염증을 키우고 있어요. 당장 물 500ml와 식이섬유 한 끼로 브레이크를 걸어볼까요?' };
    }

    // 활성 알림 — 구체적 언급 (AGENTS.md 4)
    if (alerts > 0) {
      if (badFoods.length >= 2) {
        var names = badFoods.slice(0, 2).map(function (f) { return f.label; }).join('+');
        return { pose: 'warn', line: '"' + names + '" 조합이 감지됐어요. 이 조합은 장 점막 점액층을 녹여내요. 지금 퀘스트로 전환하면 보너스 포션이 열립니다.' };
      }
      return { pose: 'warn', line: '이상 징후가 ' + alerts + '개 잡혔어요. 장 상태가 "주의"로 넘어가기 직전이에요 — 한 끼 건강하게 먹으면 양호를 유지할 수 있어요.' };
    }

    // 제로음료 감지 (AGENTS.md 예시 문구)
    var hasZero = foods.some(function (f) { return f.id === 'soda' || f.id === 'snack'; });
    if (hasZero) {
      var duodenumQuest = '십이지장 퀘스트';
      return { pose: 'warn', line: '오늘 제로음료/저당과자를 드셨네요? ' + duodenumQuest + '를 확인해보세요. 수크랄로스가 장내 Akkermansia를 감소시킵니다.' };
    }

    // 스트릭 격려
    if (streak >= 3) {
      var weekMap = { 3: 2, 5: 3, 7: 4, 14: 5 };
      var nextLv = 3;
      for (var k in weekMap) { if (streak < parseInt(k, 10)) { nextLv = weekMap[k]; break; } }
      return { pose: 'cheer', line: '연속 ' + streak + '일째 잘하고 계세요! 이대로면 연속 달성 Lv.' + nextLv + '에 도달해요. 내일도 한 끼를 챙겨요.' };
    }

    // 좋은 식단 직후
    if (goodFoods.length >= 2 && badFoods.length === 0) {
      return { pose: 'celebrate', line: '오늘 식단 구성이 훌륭해요! ' + goodFoods[0].label + ' 같은 식이섬유가 butyrate 생성균을 키우고 있어요. 도파미니가 생기로 반응할 거예요.' };
    }

    // 도파민 탈진
    if (dopa < 30) {
      return { pose: 'warn', line: '도파미니가 탈진 상태예요. 염증이 도파민 전구물질 공급을 막고 있어요. 좋은 음식을 먹어도 당장은 예전만큼 반응이 크지 않을 거예요 — 조급해하지 마세요.' };
    }

    // 기본 환영/설명
    if (questDone === 0 && foods.length === 0) {
      return { pose: 'welcome', line: '환영해요! 저는 Dr.장, 당신의 장 생태계를 안내할게요. 먼저 식단 입력에서 오늘 먹은 걸 기록해볼까요? 음식마다 장이 어떻게 반응하는지 보여드릴게요.' };
    }

    // 기본 — 현재 상태 설명
    var stateLabel = dopa >= 70 ? '생기' : dopa >= 30 ? '둔감' : '탈진';
    var weather = weatherFor(inf).label;
    return { pose: 'explain', line: '지금 장 상태는 "' + weather + '", 도파미니는 "' + stateLabel + '" 상태예요. 퀘스트를 한 개 더 완료하면 ' + (streak + 1) + '일 연속 달성이에요.' };
  }

  // ============================================================
  // STREAK SYSTEM — consecutive-day quest completion (말해보카 ref).
  // Persisted in store, survives refresh. Tier unlocks at 3/5/7/14/30 days.
  // ============================================================
  var STREAK_TIERS = [
    { days: 0,  tier: 'Lv.1', color: '#CD7F32', icon: '🥉' },
    { days: 3,  tier: 'Lv.2', color: '#B8C5D6', icon: '🥈' },
    { days: 5,  tier: 'Lv.3', color: '#F5A623', icon: '🥇' },
    { days: 7,  tier: 'Lv.4', color: '#5BA4FF', icon: '💎' },
    { days: 14, tier: 'Lv.5', color: '#7B61FF', icon: '🔷' },
    { days: 30, tier: 'Lv.6', color: '#E94560', icon: '👑' }
  ];
  function streakTier(days) {
    var t = STREAK_TIERS[0];
    for (var i = 0; i < STREAK_TIERS.length; i++) {
      if (days >= STREAK_TIERS[i].days) t = STREAK_TIERS[i];
    }
    var nextTier = null;
    for (var j = 0; j < STREAK_TIERS.length; j++) {
      if (STREAK_TIERS[j].days > days) { nextTier = STREAK_TIERS[j]; break; }
    }
    return { current: t, next: nextTier };
  }

  // ============================================================
  // GAME MAP NODES — menu icons placed along winding colon road (home).
  // Positions are relative (0..100 x, 0..100 y) on a 100x140 viewBox.
  // Order follows the colon anatomy path for "길 따라가기" feel.
  // ============================================================
  var GAME_MAP_NODES = [
    { id: 'gutmap',    icon: '🧬', label: '장 맵',     sub: 'Stage 1 · 해부학 지도', accent: '#1F77F2', x: 50, y: 16, kind: 'castle' },
    { id: 'diet',      icon: '🍽️', label: '식단 입력', sub: 'Stage 2 · 한 끼의 여정', accent: '#1CB87C', x: 78, y: 34, kind: 'fork' },
    { id: 'endoscope', icon: '🔬', label: '타임 비전', sub: 'Level 3 · 3년 후 예측', accent: '#7B61FF', x: 64, y: 56, kind: 'lab' },
    { id: 'quest',     icon: '⭐', label: '퀘스트',    sub: 'Stage 4 · 보상 타워', accent: '#F5A623', x: 32, y: 72, kind: 'tower' },
    { id: 'alert',     icon: '🔔', label: '이상 감지', sub: 'Stage 5 · 경보 레이더', accent: '#E94560', x: 52, y: 92, kind: 'radar' },
    { id: 'profile',   icon: '👤', label: '내 프로필',  sub: 'Stage 6 · 캐릭터 시트', accent: '#0A66C2', x: 76, y: 118, kind: 'profile' }
  ];
  // 구불구불한 대장 길 SVG path (game map background road). 단일 path로 모든 노드를 잇는다.
  var GAME_MAP_ROAD = 'M50,12 C66,12 82,18 82,32 C82,42 70,40 64,50 C58,60 78,58 80,72 C82,86 36,68 28,80 C20,92 44,90 50,104 C56,118 72,114 78,124';

  // ============================================================
  // SCENE ACTS — "한 끼의 여정" 4막 구조 (SCENE.md).
  // Act1 선택의 순간 / Act2 침투 / Act3 파급 / Act4 Dr.장 개입
  // ============================================================
  var SCENE_ACTS = [
    {
      id: 1, key: 'choice', title: '선택의 순간', duration: 1500,
      desc: '음식이 식도를 타고 내려가는 짧은 전환 연출',
      emotion: '기대/긴장, 죄책감은 아직 없음'
    },
    {
      id: 2, key: 'penetrate', title: '침투', duration: 2500,
      desc: '융털(젤리) 파괴(나쁜) / 강화(좋은). 단계는 투과성과 1:1 매핑',
      emotion: '방어선 붕괴가 "사건"으로 체감'
    },
    {
      id: 3, key: 'ripple', title: '파급', duration: 3000,
      desc: '장→혈류→뇌 원테이크. 3대 지수 변화 + 도파미니 반응',
      emotion: '"진짜 연결돼 있었구나" 깨달음'
    },
    {
      id: 4, key: 'follow', title: '다음 한 끼로', duration: 1500,
      desc: 'Dr.장 개입, 회복 루프(48시간 리셋 등)로 자연스럽게 연결',
      emotion: '다음 행동이 보임'
    }
  ];

  // 피로도 관리 (SCENE.md 반복 구조) — 첫 3~5끼 풀연출, 이후 축약, 임계점 돌파 시 예외 없이 풀연출
  var SCENE_FATIGUE = { fullUntilMeal: 5, abbreviatedMs: 1800, retriggerOnThresholdCross: true };

  // 인과 사슬 5컷 (SCENE.md 1-4 / Alert 화면)
  var CAUSAL_CHAIN = [
    { t: '유익균 감소',        d: 'Akkermansia, Faecalibacterium 등 butyrate 생성균 저하' },
    { t: 'SCFA 급감',          d: '단쇄지방산 생산 저하 — tight junction 단백질(claudin/occludin) 발현 ↓' },
    { t: '장벽 투과성 ↑',       d: '점막 점액층 붕괴, 장 누수(Leaky Gut) — 균열 이펙트로 시각화' },
    { t: 'LPS 혈류 유입',      d: '대사성 내독소혈증 — 전신 염증 마커 CRP 상승' },
    { t: '도파민 회로 불안정',  d: '염증이 도파민 전구물질 공급 방해 → 회복 상한선 하락' }
  ];

  // ============================================================
  // 48-HOUR RESET CHALLENGE (SCENE.md 1-5) — 통합 각성 이벤트
  // 조건: 48시간 무가당/무감미료 + 전체 미션 완료
  // 동시 발생: 균열 아물음 → 날씨 맑음 전환 → 도파미니 회복 제한 해제 → 장맵 화이트아웃
  // ============================================================
  var RESET_CHALLENGE = {
    durationHours: 48,
    requireQuests: QUESTS.length,
    requireNoSugar: true,
    reward: { scfa: 14, lps: -12, inf: -10, dopamine: 25 }
  };

  // ============================================================
  // CIRCADIAN GUT CLOCK — 시간대별 장 상태 매핑 (UPGRADE.md 축 6)
  // ============================================================
  var CIRCADIAN = {
    regeneration: { start: 22, end: 2,  label: '장 재생 시간',  advice: '단백질 섭취 피하세요. 점막 복구가 활발한 시간.' },
    morning:      { start: 6,  end: 9,  label: '장 활성화',     advice: '공복 물 500ml로 대장 운동 촉진.' },
    peak:         { start: 11, end: 14, label: '흡수 피크',     advice: '가장 영양 밀도 높은 식사를 이때.' },
    afternoon:    { start: 15, end: 18, label: '미생물 발효',   advice: '식이섬유 간식(견과·과일)이 SCFA 생성.' },
    evening:      { start: 19, end: 21, label: '마무리 식사',   advice: '수면 3시간 전 식사 마칠 것.' }
  };
  function circadianNow() {
    var h = new Date().getHours();
    var zones = ['regeneration','morning','peak','afternoon','evening'];
    for (var i = 0; i < zones.length; i++) {
      var z = CIRCADIAN[zones[i]];
      if (z.start <= z.end) { if (h >= z.start && h < z.end) return Object.assign({ key: zones[i] }, z); }
      else { if (h >= z.start || h < z.end) return Object.assign({ key: zones[i] }, z); }
    }
    return Object.assign({ key: 'morning' }, CIRCADIAN.morning);
  }

  // ============================================================
  // UPGRADE DATA — 주간 랭킹 / 도파민 가이드 / 임상 프레임 / 부위 타임비전
  // ============================================================

  // WEEKLY RANKING — 게임 스타일 주간 랭킹 (AGENTS.md: 퀘스트&보상 주간랭킹)
  // 또래 + 비슷한 습관 가진 사람들의 주간 GUT 점수 랭킹. 결정적이라 시연 고정.
  var WEEKLY_RANKING_POOL = [
    { id: 'u1', name: '김건강', avatar: '🧑', level: 8, color: '#27D89B', habit: '식이섬유 마스터' },
    { id: 'u2', name: '이프로', avatar: '👩', level: 7, color: '#37C7FF', habit: '발효식품 매일' },
    { id: 'u3', name: '박런너', avatar: '🧔', level: 6, color: '#A98CFF', habit: '식후 산책' },
    { id: 'u4', name: '최요거트', avatar: '👱', level: 6, color: '#FFC44D', habit: '그릭요거트 사랑' },
    { id: 'u5', name: '정비건', avatar: '👨', level: 5, color: '#27D89B', habit: '채식 위주' },
    { id: 'u6', name: '강웰니스', avatar: '👩', level: 5, color: '#7ADCFF', habit: '물 2L 챙김' },
    { id: 'u7', name: '윤마라', avatar: '🧓', level: 4, color: '#FF8A4D', habit: '주말 러닝' },
    { id: 'u8', name: '임디톡스', avatar: '👵', level: 4, color: '#9BE15B', habit: '저당 식단' }
  ];
  function weeklyRanking(myProfile, myScore) {
    // 시드 결정적 생성 — myScore 기준으로 또래 점수 분포
    var seed = hashStr((myProfile && myProfile.name || 'me') + (myScore || 50));
    var rnd = mulberry32(seed);
    var avatar = (myProfile && myProfile.avatar) || '';
    var pool = WEEKLY_RANKING_POOL.slice();
    // 참가자 확장 (총 80명) — 정형돈이 60위 바깥이 되도록
    var sur = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
    var giv = ['건강', '프로', '런너', '요거트', '비건', '웰니스', '마라', '디톡스', '미소', '튼튼', '차밍', '브라이트', '하모니', '스마트', '젠틀', '그린', '바른', '힘찬', '맑음', '활기'];
    var avs = ['🧑', '👩', '🧔', '👱', '👨', '👩‍🦰', '🧓', '👵', '👦', '👧', '🧑‍🦰', '👨‍🦱', '👩‍🦱', '🧑‍🦱', '👨‍🦳', '👩‍🦳'];
    var cols = ['#27D89B', '#37C7FF', '#A98CFF', '#FFC44D', '#7ADCFF', '#9BE15B', '#FF8A4D', '#FF80B0', '#1FB8C9', '#5EE6C7'];
    for (var i = 0; i < 72; i++) {
      pool.push({ id: 'n' + (i + 10), name: sur[Math.floor(rnd() * sur.length)] + giv[Math.floor(rnd() * giv.length)], avatar: avs[Math.floor(rnd() * avs.length)], level: 1 + Math.floor(rnd() * 9), color: cols[Math.floor(rnd() * cols.length)], habit: '이번 주 활동' });
    }
    // 페르소나: 유재석(좋은 습관) 3위 안쪽, 정형돈(나쁜 습관) 60위 바깥
    var meScore;
    if (avatar === 'yjs') meScore = 93;
    else if (avatar === 'jd') meScore = 27;
    else meScore = myScore || 50;
    // 점수 할당: 페르소나에 맞춰 NPC 분포 결정
    pool.forEach(function (p, i) {
      var base;
      if (avatar === 'yjs') base = 55 + rnd() * 37;    // 55~92 → 나(93)보다 항상 낮음 → 1위
      else if (avatar === 'jd') base = 32 + rnd() * 62; // 32~94 → 나(27)보다 항상 높음 → 꼴찌(81위)
      else base = meScore + (rnd() - 0.3) * 35;
      p.score = clamp(Math.round(base), 30, 95);
    });
    // me 추가
    var me = { id: 'me', name: (myProfile && myProfile.name) || '나', avatar: (myProfile && myProfile.avatar) || '🙂', level: levelForXp(myProfile ? 0 : 0).level, color: '#37C7FF', score: meScore, habit: '나의 이번 주' };
    pool.push(me);
    pool.sort(function (a, b) { return b.score - a.score; });
    return { all: pool, me: me };
  }

  // DOPAMINE GUIDE — 점수 상한/하한 공식 설명 (AGENTS.md: CORE.pdf 참고 설명)
  var DOPAMINE_GUIDE = {
    ceilingFormula: '도파민 회복 상한선 = 100 − (염증 × 0.5)',
    floorReason: '도파민 감수성 하한선 25: 이 이하로는 떨어지지 않아요. 뇌가 보상 회로를 완전히 꺼버리지 않는 최소 안전장치예요.',
    ceilingReason: '염증이 도파민 전구물질(L-DOPA) 공급을 방해해요. 염증이 60이면 상한선은 70까지 내려와요. 염증이 0이면 100% 회복 가능!',
    recovery: [
      { trigger: '무가당·무감미료 48시간', effect: '염증 −10 → 상한선 +5', detail: '감미료가 도파민 보상 예측 오류를 만드는 걸 멈춰요.' },
      { trigger: '발효식품 매일 (김치·요거트)', effect: 'SCFA ↑ → 염증 ↓ → 상한선 ↑', detail: '부티레이트가 장벽을 아물게 해 LPS 유입을 줄여요.' },
      { trigger: '식이섬유 25g/일', effect: '부티레이트 생성균 2배 → 간접 도파민 ↑', detail: '부티레이트가 결장 세포 에너지의 70%를 만들어요.' },
      { trigger: '식후 산책 15분', effect: '장 운동 ↑ + 자연 도파민 ↑', detail: '운동이 부티레이트 생성균 비율을 올려요.' },
      { trigger: '수면 7시간+', effect: '장 생체시계 정렬 → 미생물 다양성 ↑', detail: '수면 부족은 미생물 일주기 리듬을 흔들어요.' }
    ],
    factors: [
      { factor: '염증 (LPS 유입)', weight: '−0.5/점', dir: 'down', ev: '염증이 도파민 전구물질(tyrosine→L-DOPA) 공급을 차단 — Nat Neurosci 2020' },
      { factor: 'SCFA (부티레이트)', weight: '+0.3/점', dir: 'up', ev: '장-뇌 미주신경 보상 신호 — Cell 2021' },
      { factor: '나쁜 음식 (비대칭)', weight: '−10~15/끼', dir: 'down', ev: '나쁜 음식은 빠르게 깎고 좋은 음식은 천천히 올라요 (비대칭 기억)' },
      { factor: '48시간 리셋 보너스', weight: '+25', dir: 'up', ev: '무가당 48시간 → 균열 아물고 상한선 해제' }
    ]
  };

  // CLINICAL FRAMES — 타임비전 임상 프레임 설명 (AGENTS.md: 실제 임상데이터처럼 전문적으로)
  var CLINICAL_FRAMES = {
    current: {
      good: { label: '정상 점막 · 융모 정렬', findings: '융모(villi)가 규칙적으로 정렬되어 있고, 고유층(lamina propria)에 염증 세포 침윤이 관찰되지 않습니다. 혈관문(vascular pattern)은 정상 소견입니다.', grade: 'Grade 0 (정상)', implication: '현재 장벽 기능이 양호하며 영양 흡수가 정상적으로 이루어지고 있습니다.' },
      warn: { label: '경도 염증 · 융모 부분 위축', findings: '융모 경계가 다소 불분명하고, 점막 부종 소견이 관찰됩니다. 국소적 발적(erythema)이 있으나 궤양은 없습니다.', grade: 'Grade 1 (경도 염증)', implication: '장벽 투과성이 경도 증가한 상태로, 식이 개선으로 회복 가능한 단계입니다.' },
      bad: { label: '만성 염증 · 융모 융합 · 장 누수', findings: '융모 융합(villous blunting)과 점막 얇아짐이 관찰됩니다. 고유층에 염증 세포(림프구·호중구) 침윤, 점액층(mucus layer) 감소가 동반됩니다. 밀착연접(tight junction) 단백질 발현 저하로 장 누수(leaky gut)가 의심됩니다.', grade: 'Grade 3 (중증 염증)', implication: '내독소(LPS)의 혈류 유입으로 전신 염증이 진행 중이며, 도파민 합성 경로가 억제되고 있습니다.' }
    },
    future: {
      recover: { label: '3년 후 · 회복된 정상 점막', findings: '융모 구조가 완전히 복원되고, 미생물 다양성(Shannon index)이 정상 범위로 회복됩니다. 부티레이트 생성균(F. prausnitzii, Roseburia)이 풍부해져 장벽 강화가 유지됩니다.', grade: 'Grade 0 (정상 유지)', implication: '현재의 좋은 식습관을 유지하면 3년 후에도 건강한 장 생태계가 유지됩니다.' },
      progress: { label: '3년 후 · 만성 염증성 장 질환 궤적', findings: '융모 위축이 진행하고 미생물 다양성 지수가 30% 감소합니다. Akkermansia 감소로 점액층이 얇아지며, 대장 용종 발생 위험이 통계적으로 유의하게 증가합니다 (HR 1.8).', grade: 'Grade 3→4 (진행성)', implication: '현재의 나쁜 식습관을 유지하면 3년 후에도 만성 염증, 대장 용종, 대사 증후군 위험이 누적됩니다.' }
    }
  };

  // 부위별 타임비전 데이터 (AGENTS.md: 부위명 타임비전 예측)
  var ZONE_TIMEVISION = {
    duodenum: { risk: '십이지장 궤양 · 철/칼슘 흡수 불량', recover: '공복 제로음료 중단 14일 → 점막 재생', timeline: '2주 후 점막 복구 시작, 8주 후 정상화' },
    jejunum: { risk: '융모 위축 · 영양실조', recover: '발효식품 + 식이섬유 → 융모 재성장', timeline: '4주 후 융모 길이 회복, 12주 후 흡수율 정상' },
    ileum: { risk: '크론병 · SIBO · B12 결핍', recover: '프로바이오틱스 + 규칙 식사 → 미생물 균형', timeline: '6주 후 B12 흡수 개선, 16주 후 염증 마커 정상' },
    cecum: { risk: '미생물 불균형 · 가스·팽만', recover: '수용성 식이섬유(귀리·바나나) → 발효 정상화', timeline: '1주 후 가스 감소, 4주 후 미생물 다양성 ↑' },
    ascending: { risk: 'SCFA 부족 · 장벽 약화 · 게실', recover: '전통 발효식품(김치·콤부차) → 부티레이트 ↑', timeline: '2주 후 SCFA 측정치 상승, 8주 후 장벽 강화' },
    transverse: { risk: '만성 변비 · 저도염증 축적', recover: '수분 2L + 마그네슘 식품 → 운동성 회복', timeline: '3일 후 배변 규칙성 ↑, 4주 후 염증 마커 ↓' },
    descending: { risk: '용종 · 대장암(한국인 1위)', recover: '적색육 제한 + 식이섬유 강화 → 발암물질 희석', timeline: '8주 후 대변 잠혈 음성화 경향, 장기적 암 위험 ↓' },
    sigmoid: { risk: 'S상결장암 · 게실염', recover: '가공육 회피 + 정기 내시경 → 조기 발견·예방', timeline: '가공육 중단 2주 후 염증 마커 ↓, 정기 검진 권장' },
    rectum: { risk: '치질 · 직장암 · 배변 곤란', recover: '규칙 배변 + 좌욕 + 섬유질 → 항문 압력 정상화', timeline: '1주 후 배변 통증 감소, 4주 후 항문 압력 정상' }
  };

  // 데이터 소스 기여도 — 부위 클릭 팝업 PIE CHART (AGENTS.md)
  var DATA_SOURCE_CONTRIB = {
    emr: { label: 'EMR', color: '#37C7FF', desc: '혈액 검사(CRP, 알부민, 비타민), 대변 검사 결과가 이 부위의 염증·흡수 상태를 가장 정확히 반영해요.' },
    diet: { label: '식단', color: '#27D89B', desc: '스캐너가 인식한 매일 식단이 이 부위의 미생물 대사물(SCFA, LPS)에 직접 영향을 줘요.' },
    sensor: { label: '센서', color: '#A98CFF', desc: '걸음 수, 수면, 스트레스 지수가 장 운동성과 미생물 일주기 리듬에 영향을 미쳐요.' },
    scanner: { label: '스캐너', color: '#FFC44D', desc: '식사 타이밍·패턴 감지가 이 부위의 일일 변동을 실시간으로 추적해요.' }
  };

  // 메트릭별 가이드 — 시스템 스테이터스 클릭 시 (AGENTS.md: 클릭 시 의미·회복법)
  var METRIC_GUIDE = {
    scfa: {
      label: 'SCFA · 단쇄지방산', icon: '🌿', good: '높을수록 좋음',
      what: '장내 유익균이 식이섬유를 발효해 만드는 지방산이에요. 그중 부티레이트가 장 세포의 주 에너지원(결장 세포 ATP의 70%)이에요.',
      howToRecover: [
        '수용성 식이섬유(귀리·바나나·아보카도) 매일 섭취',
        '발효식품(김치·요거트·된장)으로 부티레이트 생성균 강화',
        '식이섬유 25g/일 목표 (한국인 평균 15g 부족)'
      ],
      ev: '식이섬유 25g/일 → 부티레이트 생성균 2배 증가 — Lancet 2019 메타분석'
    },
    permeability: {
      label: '장벽 투과성 (LPS 부담)', icon: '🧱', good: '낮을수록 좋음',
      what: '장 점막의 밀착연접(tight junction)이 느슨해지면 내독소(LPS)가 혈류로 새어 들어가요. 이게 "장 누수(leaky gut)"예요.',
      howToRecover: [
        '제로음료·감미료 중단 (수크랄로스가 점막 점액층 감소)',
        '부티레이트 ↑로 밀착연접 단백질(ZO-1, occludin) 발현 회복',
        '48시간 무가당 리셋 → 균열 아물기 시작'
      ],
      ev: 'SCFA 감소 → tight junction 단백질 발현 ↓ → 점막 균열 — Nat Rev Gastro 2021'
    },
    inflammation: {
      label: '전신 염증 지수', icon: '🔥', good: '낮을수록 좋음',
      what: '장벽을 뚫고 나온 LPS가 면역 수용체 TLR4를 활성화해 전신 저도염증을 만들어요. CRP 수치와 연관돼요.',
      howToRecover: [
        '오메가-3(생선·아마씨)로 항염 미생물 강화',
        '가공육·정제당 회피 → 염증 마커 CRP 감소',
        '규칙 유산소 운동 → 항염 사이토카인 ↑'
      ],
      ev: 'LPS 혈류 유입 → TLR4/NF-κB → 전신 저도염증 — Cani 2007, Gut 2023'
    },
    dopamine: {
      label: '도파민 감수성', icon: '⚡', good: '높을수록 좋음',
      what: '장내 미생물이 도파민 전구물질(L-DOPA)을 공급하고 미주신경으로 뇌 보상 회로에 신호를 보내요. 염증이 이 공급을 끊으면 도파민 반응이 둔해져요.',
      howToRecover: [
        '염증 ↓ → 도파민 회복 상한선(100−염증×0.5)이 올라감',
        '48시간 무가당 리셋 → 상한선 해제 +25 보너스',
        '발효식품 → 장-뇌 미주신경 보상 신호 강화'
      ],
      ev: '염증이 도파민 전구물질 공급 방해 — Nat Neurosci 2020; Coccurello 2025'
    },
    motility: {
      label: '장 운동성', icon: '🌀', good: '높을수록 좋음',
      what: '장이 음식물을 이동시키는 파동 운동(peristalsis)이에요. 운동성이 떨어지면 변비, 발효 과부하, 미생물 불균형이 생겨요.',
      howToRecover: [
        '식후 산책 15분 → 위장관 통과 시간 단축',
        '수분 2L/일 → 변의 부피·부드러움 유지',
        '마그네슘 식품(견과·녹색채소) → 장 평활근 이완'
      ],
      ev: '식후 가벼운 운동은 위장관 통과시간 단축 — Gut 2022'
    }
  };

  // ============================================================
  // EXPORT
  // ============================================================
  window.GS_DATA = Object.assign(window.GS_DATA || {}, {
    C: C,
    GUT_ZONES: GUT_ZONES,
    FOODS: FOODS,
    LIFESTYLES: LIFESTYLES,
    PROFILE_BASELINES: PROFILE_BASELINES,
    CLUSTER_AVG: CLUSTER_AVG,
    METRIC_META: METRIC_META,
    BAD_COMBOS: BAD_COMBOS,
    QUESTS: QUESTS,
    ENDOSCOPE_SET: ENDOSCOPE_SET,
    LEVEL_TITLES: LEVEL_TITLES,
    CITATIONS: CITATIONS,
    ageBracket: ageBracket,
    baselineFor: baselineFor,
    clusterFor: clusterFor,
    compareMetric: compareMetric,
    mockStreams: mockStreams,
    aiTimeline: aiTimeline,
    gutCharacterSVG: gutCharacterSVG,
    anatomicalGutSVG: anatomicalGutSVG,
    autoQuestSignals: autoQuestSignals,
    todayStr: todayStr,
    levelForXp: levelForXp,
    titleFor: titleFor,
    clamp: clamp,
    CORE_METRICS: CORE_METRICS,
    DOPA_STATES: DOPA_STATES,
    WEATHER_STATES: WEATHER_STATES,
    DR_JANG_POSES: DR_JANG_POSES,
    STREAK_TIERS: STREAK_TIERS,
    GAME_MAP_NODES: GAME_MAP_NODES,
    GAME_MAP_ROAD: GAME_MAP_ROAD,
    SCENE_ACTS: SCENE_ACTS,
    SCENE_FATIGUE: SCENE_FATIGUE,
    CAUSAL_CHAIN: CAUSAL_CHAIN,
    RESET_CHALLENGE: RESET_CHALLENGE,
    CIRCADIAN: CIRCADIAN,
    dopaStateFor: dopaStateFor,
    dopaCeiling: dopaCeiling,
    dopaCharSVG: dopaCharSVG,
    weatherFor: weatherFor,
    crackLevel: crackLevel,
    crackSVG: crackSVG,
    drJangLine: drJangLine,
    streakTier: streakTier,
    circadianNow: circadianNow,
    weeklyRanking: weeklyRanking,
    DOPAMINE_GUIDE: DOPAMINE_GUIDE,
    CLINICAL_FRAMES: CLINICAL_FRAMES,
    ZONE_TIMEVISION: ZONE_TIMEVISION,
    DATA_SOURCE_CONTRIB: DATA_SOURCE_CONTRIB,
    METRIC_GUIDE: METRIC_GUIDE
  });
})();
