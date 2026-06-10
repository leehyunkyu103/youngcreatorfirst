import { NextResponse } from "next/server";

type GuideLine = { text: string; highlights?: string[]; memoItems?: string[] };
type GuideCheckpoint = { id: string; title: string; prompt?: string };
type AdvisoryGuide = {
  conflicts: { lines: GuideLine[] };
  followUps: { lines: GuideLine[]; checkpoints: GuideCheckpoint[] };
  explanation: { lines: GuideLine[] };
};

const fallbackLine = "현재 입력된 정보 기준으로 특별한 유의사항이 감지되지 않았습니다.";

const responseSchema = {
  type: "object",
  properties: {
    conflicts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
        },
        required: ["text"],
      },
    },
    followUps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
          memoItems: { type: "array", items: { type: "string" } },
        },
        required: ["text", "memoItems"],
      },
    },
    communicationGuides: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
        },
        required: ["text"],
      },
    },
  },
  required: ["conflicts", "followUps", "communicationGuides"],
};

function compact(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseKoreanAmount(value: unknown): number | null {
  const raw = text(value).replace(/,/g, "");
  if (!raw) return null;
  const matches = [...raw.matchAll(/(\d+(?:\.\d+)?)\s*(억|천만|백만|만)?/g)];
  if (!matches.length) return null;
  let total = 0;
  matches.forEach((match) => {
    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) return;
    const unit = match[2] ?? "";
    if (unit === "억") total += amount * 100000000;
    else if (unit === "천만") total += amount * 10000000;
    else if (unit === "백만") total += amount * 1000000;
    else if (unit === "만") total += amount * 10000;
    else total += amount;
  });
  return total || null;
}

function parseAge(value: unknown): number | null {
  const match = text(value).match(/\d{2,3}/);
  return match ? Number(match[0]) : null;
}

function ratio(part: number | null, total: number | null) {
  if (!part || !total || total <= 0) return null;
  return part / total;
}

function includesAny(source: string, words: string[]) {
  return words.some((word) => source.includes(word));
}

function compactText(value: unknown) {
  return text(value).replace(/\s+/g, "");
}

const negationPattern = /않|아니|아님|없음|없는|없다|적음|적은|낮음|낮은|덜함|덜한|크지않|많지않|높지않|강하지않/;
const marketSensitivityPatterns = [/시장뉴스/, /단기이슈/, /민감/, /예민/];
const fastDecisionPatterns = [/의사결정.*빠/, /결정.*빠/, /성격.*급/, /급함/, /급하/, /속도.*빠/];
const explanationNeedPatterns = [/의심/, /질문.*많/];

function splitQualitativeClauses(source: string) {
  return source
    .split(/[\n,.;；。!?！？()]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasNegatedTraitClause(compactClause: string, patterns: RegExp[]) {
  return negationPattern.test(compactClause) && patterns.some((pattern) => pattern.test(compactClause));
}

function hasPositiveTrait(source: string, patterns: RegExp[]) {
  return splitQualitativeClauses(source).some((clause) => {
    const compact = compactText(clause);
    return patterns.some((pattern) => pattern.test(compact)) && !hasNegatedTraitClause(compact, patterns);
  });
}

function hasNegatedTrait(source: string, patterns: RegExp[]) {
  return splitQualitativeClauses(source).some((clause) => hasNegatedTraitClause(compactText(clause), patterns));
}

function uniqueLines(lines: GuideLine[]) {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const key = lineTopic(line.text);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

function mergeGuideLines(base: GuideLine[], extra: GuideLine[]) {
  return uniqueLines([...base, ...extra]);
}

function lineTopic(value: string) {
  const compact = text(value).replace(/\s+/g, "");
  if (!compact) return "";
  if (/자산증식단계|중장기목표|주택구입|결혼|자녀계획|은퇴준비|상속.?증여/.test(compact)) return "life-stage-goals";
  if (/유학|교육비|외화자산|의원|고정비|포트폴리오관리/.test(compact)) return "client-specific-followup";
  if (/투자기간|투자시계|TimeHorizon|목돈|주택|유학|자금사용시점/.test(compact)) return "time-horizon-cash-use";
  if (/기대수익률|위험등급|손실감내|원금보존|공격적수익|위험감내/.test(compact)) return "return-risk-alignment";
  if (/필요자금|비상예비|유동성|확정지출|생활비|현금흐름/.test(compact)) return "liquidity-planning";
  if (/성과급|비정기소득|스톡옵션|자금유입|매각대금|지분매각/.test(compact)) return "irregular-income";
  if (/추가투자|신규자금|단기손실|투자여력/.test(compact)) return "additional-investment-capacity";
  if (/세금|절세|종합과세|증여|세후수익률/.test(compact)) return "tax-strategy";
  if (/크게흔들리지않|민감하지않|예민하지않/.test(compact)) return "market-stable-communication";
  if (/빠르지않|급하지않|속도가빠르지않/.test(compact)) return "deliberate-decision-communication";
  if (/시장뉴스|단기이슈|민감|예민/.test(compact)) return "market-sensitive-communication";
  if (/의사결정|결정.*빠|성격|급함|속도/.test(compact)) return "fast-decision-communication";
  if (/꼼꼼|의심|질문|설명|근거|가정조건/.test(compact)) return "evidence-communication";
  if (/모니터링|관리시간|본업이바빠|주도주편입/.test(compact)) return "low-maintenance-communication";
  if (/기존PB|PB서비스|사후관리|불만족/.test(compact)) return "pb-service-communication";
  if (/배우자|가족|자녀|부모/.test(compact)) return "family-influence";
  if (/선호자산|기피자산|나스닥|암호화폐|예금|ETF|주식|채권/.test(compact)) return "asset-preference";
  return compact.replace(/[^\p{Script=Hangul}a-zA-Z0-9]/gu, "").slice(0, 48);
}

function preferredSectionForTopic(topic: string, fallback: keyof AdvisoryGuide) {
  if (["time-horizon-cash-use", "return-risk-alignment"].includes(topic)) return "conflicts";
  if (["life-stage-goals", "client-specific-followup", "liquidity-planning", "irregular-income", "additional-investment-capacity"].includes(topic)) return "followUps";
  if (["tax-strategy", "market-stable-communication", "market-sensitive-communication", "deliberate-decision-communication", "fast-decision-communication", "evidence-communication", "low-maintenance-communication", "pb-service-communication", "family-influence", "asset-preference"].includes(topic)) return "explanation";
  return fallback;
}

function mergeSectionedLines(ruleGuide: AdvisoryGuide, aiGuide: AdvisoryGuide) {
  const buckets: Record<keyof AdvisoryGuide, GuideLine[]> = {
    conflicts: [],
    followUps: [],
    explanation: [],
  };
  const used = new Set<string>();
  ([
    ["conflicts", [...ruleGuide.conflicts.lines, ...aiGuide.conflicts.lines]],
    ["followUps", [...ruleGuide.followUps.lines, ...aiGuide.followUps.lines]],
    ["explanation", [...ruleGuide.explanation.lines, ...aiGuide.explanation.lines]],
  ] as const).forEach(([section, lines]) => {
    lines.forEach((line) => {
      const topic = lineTopic(line.text);
      if (!topic || used.has(topic)) return;
      const target = preferredSectionForTopic(topic, section);
      buckets[target].push(line);
      used.add(topic);
    });
  });
  return {
    conflicts: uniqueLines(buckets.conflicts),
    followUps: uniqueLines(buckets.followUps),
    explanation: uniqueLines(buckets.explanation),
  };
}

function checkpointId(title: string) {
  return title.toLowerCase().replace(/[^가-힣a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || `checkpoint-${Math.random().toString(36).slice(2, 8)}`;
}

function mergeCheckpoints(base: GuideCheckpoint[], extra: GuideCheckpoint[]) {
  const byTitle = new Map<string, GuideCheckpoint>();
  [...base, ...extra].forEach((item) => {
    if (!item.title.trim()) return;
    if (!byTitle.has(item.title)) byTitle.set(item.title, { ...item, id: item.id || checkpointId(item.title) });
  });
  return Array.from(byTitle.values()).slice(0, 8);
}

function memoTopic(title: string) {
  const compact = text(title).replace(/\s+/g, "");
  if (/성과급|비정기소득|스톡옵션|자금유입|매각/.test(compact)) return ["irregular-income", "비정기 소득 지급 시점 및 사용 계획"];
  if (/주택.*매입|주택구입|주택.*시점/.test(compact)) return ["housing-timing", "주택 매입 예정 시점"];
  if (/유학|교육비/.test(compact)) return ["education-funding", "자녀 유학 시작 시점 및 필요 금액"];
  if (/자금사용|사용시점|사용우선순위|목돈|확정지출/.test(compact)) return ["cash-use", "자금 사용 시점 및 우선순위"];
  if (/추가투자.*금액|단기손실.*금액|투자가능금액/.test(compact)) return ["additional-amount", "단기 손실 시 추가 투자 가능 금액"];
  if (/추가투자.*출처|자금출처/.test(compact)) return ["additional-source", "추가 투자 자금 출처"];
  if (/월평균|잉여현금흐름/.test(compact)) return ["monthly-surplus", "월평균 잉여현금흐름"];
  if (/비상예비|분리관리/.test(compact)) return ["emergency-reserve", "비상예비자금 분리 관리 여부"];
  if (/의원|고정비|리스|인건비/.test(compact)) return ["clinic-fixed-cost", "의원 월 고정비 규모"];
  if (/외화|달러|통화/.test(compact)) return ["foreign-currency", "외화자산 편입 목적"];
  if (/관리.*시간|본업|포트폴리오관리/.test(compact)) return ["management-time", "포트폴리오 관리 가능 시간"];
  if (/상속|증여|승계/.test(compact)) return ["succession", "상속·증여 대상 및 시점"];
  if (/가족|배우자|의사결정참여/.test(compact)) return ["family-decision", "가족 의사결정 참여자"];
  if (/현금흐름|생활비|월필요/.test(compact)) return ["cashflow-need", "월 필요 현금흐름"];
  if (/기존PB|PB서비스|불만족/.test(compact)) return ["pb-experience", "기존 PB 서비스 불만족 사유"];
  if (/자산승계|승계우선순위/.test(compact)) return ["succession-priority", "자산 승계 우선순위"];
  if (/매매제한|내부규정|투자가능범위/.test(compact)) return ["legal-rule", "매매 제한 대상 및 가능 범위"];
  if (/절세|세후|종합과세|세금/.test(compact)) return ["tax-priority", "절세 우선순위"];
  if (/결혼/.test(compact)) return ["marriage-plan", "결혼 계획 여부"];
  if (/자녀계획/.test(compact)) return ["child-plan", "자녀 계획 여부"];
  if (/중장기/.test(compact)) return ["long-term-goals", "중장기 재무 목표 우선순위"];
  return [compact.replace(/[^\p{Script=Hangul}a-zA-Z0-9]/gu, "").slice(0, 32), title];
}

function memoItemsToCheckpoints(lines: GuideLine[]) {
  const byTopic = new Map<string, string>();
  lines.forEach((line) => {
    (line.memoItems ?? []).forEach((item) => {
      const trimmed = item.trim();
      if (!trimmed) return;
      const [topic, title] = memoTopic(trimmed);
      if (!byTopic.has(topic)) byTopic.set(topic, title);
    });
  });
  return Array.from(byTopic.values()).slice(0, 6).map((title) => ({ id: checkpointId(title), title }));
}

function buildRuleInsights(payload: any): AdvisoryGuide {
  const profile = payload?.profile ?? {};
  const financial = payload?.formData?.financial ?? {};
  const rrttllu = payload?.formData?.rrttllu ?? {};
  const risk = payload?.riskResult ?? {};
  const liquidity = payload?.liquiditySummary ?? {};
  const smartInput = text(payload?.smartInputNote);
  const uniqueOther = text(payload?.uniqueOther ?? rrttllu.uniqueOther);
  const allQualitative = `${smartInput}\n${uniqueOther}`;

  const conflicts: GuideLine[] = [];
  const followUps: GuideLine[] = [];
  const explanation: GuideLine[] = [];
  const checkpoints: GuideCheckpoint[] = [];

  const birthYear = Number(text(profile.birthYear ?? profile.birth_year).match(/\d{4}/)?.[0] ?? "");
  const age = parseAge(profile.age) ?? (birthYear ? 2026 - birthYear : null);
  const displayAge = age ? (text(profile.age).includes("세") ? text(profile.age) : `만 ${age}세`) : "";
  if (age && age < 40) {
    followUps.push({
      text: `고객은 ${displayAge}로 자산 증식 단계에 있는 것으로 보입니다. 주택 구입, 결혼, 자녀 계획 등 중장기 목표가 투자기간과 자금 사용 계획에 영향을 줄 수 있으므로 함께 확인하는 것이 좋습니다.`,
      highlights: ["자산 증식 단계", "중장기 목표"],
      memoItems: ["주택 매입 예정 시점", "결혼 계획 여부", "자녀 계획 여부", "중장기 재무 목표 우선순위"],
    });
    checkpoints.push({ id: "mid-long-term-goals", title: "주택·결혼·자녀 등 중장기 목표" });
  } else if (age && age < 60) {
    followUps.push({
      text: `고객은 ${displayAge}로 자산 증식과 자산 보전을 함께 고려해야 하는 시점으로 보입니다. 은퇴 준비와 주요 지출 계획을 함께 확인하는 것이 좋습니다.`,
      highlights: ["자산 증식과 자산 보전", "은퇴 준비"],
      memoItems: ["은퇴 준비 및 주요 지출 계획", "중장기 재무 목표 우선순위"],
    });
    checkpoints.push({ id: "retirement-major-spending", title: "은퇴 준비 및 주요 지출 계획" });
  } else if (age) {
    followUps.push({
      text: `고객은 ${displayAge}로 자산 보전과 현금흐름 관리의 중요도가 높아질 수 있습니다. 상속·증여 계획과 정기 현금흐름 필요 규모를 함께 확인하는 것이 좋습니다.`,
      highlights: ["자산 보전", "상속·증여 계획"],
      memoItems: ["상속·증여 대상 및 시점", "월 필요 현금흐름", "자산 승계 우선순위"],
    });
    checkpoints.push({ id: "succession-cashflow", title: "상속·증여 및 현금흐름 계획" });
  }

  const job = text(profile.job);
  if (includesAny(job, ["상장", "임직원", "삼성전자", "전략기획", "내부자"])) {
    followUps.push({
      text: `고객 직업은 '${job || "미입력"}'으로, 투자 관련 회사 내부 규정이나 매매 제한이 적용될 수 있습니다. 투자 제안 전 제한 대상 자산과 투자 가능 범위를 확인하는 것이 좋습니다.`,
      highlights: ["내부 규정", "매매 제한"],
      memoItems: ["매매 제한 대상 및 가능 범위"],
    });
    checkpoints.push({ id: "employee-trading-rule", title: "임직원 매매 제한 대상" });
  }
  if (includesAny(job, ["전문직", "의사", "치과", "변호사", "회계사", "세무사"])) {
    followUps.push({
      text: `고객은 '${job}'으로 소득 수준과 세금 부담이 함께 커질 수 있습니다. 절세 전략과 현금흐름 관리 방식을 함께 점검하는 것이 좋습니다.`,
      highlights: ["절세 전략", "현금흐름 관리"],
      memoItems: includesAny(job, ["치과", "의사"]) ? ["의원 월 고정비 규모", "월평균 잉여현금흐름", "절세 우선순위"] : ["월평균 잉여현금흐름", "절세 우선순위"],
    });
    checkpoints.push({ id: "professional-tax-cashflow", title: "전문직 절세·현금흐름 관리" });
  }
  if (includesAny(job + allQualitative, ["창업", "스타트업", "대표", "지분", "스톡옵션"])) {
    followUps.push({
      text: `고객의 직업 또는 Smart Input에 창업·지분·스톡옵션 관련 맥락이 있습니다. 특정 자산 집중 위험과 향후 자금 유입 이후 투자 계획을 확인하는 것이 좋습니다.`,
      highlights: ["특정 자산 집중 위험", "자금 유입 이후 투자 계획"],
      memoItems: ["특정 자산 집중 위험", "비정기 소득 지급 시점 및 사용 계획"],
    });
    checkpoints.push({ id: "concentration-risk", title: "특정 자산 집중 위험" });
  }

  const totalAssets = parseKoreanAmount(financial.totalAssets);
  const financialAssets = parseKoreanAmount(financial.financialAssets);
  const realEstate = parseKoreanAmount(financial.realEstate);
  const debt = parseKoreanAmount(financial.debt);
  const irregularIncome = parseKoreanAmount(financial.irregularIncome);
  const financialRatio = ratio(financialAssets, totalAssets);
  const realEstateRatio = ratio(realEstate, totalAssets);
  const debtRatio = ratio(debt, totalAssets);
  const irregularRatio = ratio(irregularIncome, totalAssets);

  if (financialRatio !== null && financialRatio >= 0.6) {
    followUps.push({
      text: `금융자산은 '${financial.financialAssets}', 총자산은 '${financial.totalAssets}'로 입력되어 금융자산 비중이 높은 편입니다. 투자 성과가 전체 자산에 미치는 영향이 클 수 있어 자산배분과 위험관리 계획을 확인하는 것이 좋습니다.`,
      highlights: ["금융자산 비중", "자산배분과 위험관리"],
      memoItems: ["금융자산 자산배분 계획"],
    });
    checkpoints.push({ id: "financial-asset-allocation", title: "금융자산 자산배분 계획" });
  }
  if (realEstateRatio !== null && realEstateRatio >= 0.6) {
    followUps.push({
      text: `부동산은 '${financial.realEstate}', 총자산은 '${financial.totalAssets}'로 입력되어 부동산 비중이 높은 편입니다. 향후 목돈 사용이나 시장 변동에 대비한 유동성 확보 계획을 확인하는 것이 좋습니다.`,
      highlights: ["부동산 비중", "유동성 확보 계획"],
      memoItems: ["부동산 중심 자산의 유동성 확보"],
    });
    checkpoints.push({ id: "real-estate-liquidity", title: "부동산 중심 자산의 유동성 확보" });
  }
  if (debtRatio !== null && debtRatio >= 0.3) {
    followUps.push({
      text: `부채는 '${financial.debt}', 총자산은 '${financial.totalAssets}'로 입력되어 총자산 대비 부채 부담이 큰 편일 수 있습니다. 상환 계획과 추가 차입 가능성을 확인하는 것이 좋습니다.`,
      highlights: ["부채 부담", "상환 계획"],
      memoItems: ["부채 상환 계획"],
    });
    checkpoints.push({ id: "debt-repayment", title: "부채 상환 계획" });
  }
  if (irregularRatio !== null && irregularRatio >= 0.2) {
    followUps.push({
      text: `향후 예상 비정기소득 '${financial.irregularIncome}'은 총자산 '${financial.totalAssets}' 대비 의미 있는 규모로 보입니다. 자금 유입 이후 투자 계획과 세금 이슈를 함께 확인하는 것이 좋습니다.`,
      highlights: ["대규모 자금 유입", "세금 이슈"],
      memoItems: ["비정기 소득 지급 시점 및 사용 계획", "절세 우선순위"],
    });
    checkpoints.push({ id: "irregular-income-plan", title: "비정기 소득 유입 후 투자 계획" });
  }
  const requiredRatio = ratio(typeof liquidity.requiredAmount === "number" ? liquidity.requiredAmount : null, totalAssets);
  if (requiredRatio !== null && requiredRatio >= 0.5) {
    followUps.push({
      text: `고객은 총자산 '${financial.totalAssets}' 중 향후 사용 예정 자금으로 '${liquidity.requiredDisplay}'를 계획하고 있습니다. 투자 가능한 자산 규모가 제한될 수 있으므로 자금 사용 시점과 유동성 확보 계획을 함께 확인하는 것이 좋습니다.`,
      highlights: ["총자산", "향후 사용 예정 자금", "유동성 확보 계획"],
      memoItems: ["자금 사용 시점 및 우선순위", "월평균 잉여현금흐름"],
    });
    checkpoints.push({ id: "liquidity-use-timing", title: "자금 사용 시점과 유동성 확보 계획" });
  }

  if (rrttllu.returnObjective === "원금 보존 투자" && parseKoreanAmount(rrttllu.expectedReturn) === null && /\d/.test(text(rrttllu.expectedReturn))) {
    conflicts.push({
      text: `고객은 원금 보존 투자를 선택했지만 기대수익률 '${rrttllu.expectedReturn}'도 입력했습니다. 기대수익률과 위험 감내 수준이 일치하는지 확인하는 것이 좋습니다.`,
      highlights: ["원금 보존 투자", `기대수익률 '${rrttllu.expectedReturn}'`],
    });
  }
  const expectedNumbers = text(rrttllu.expectedReturn).match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const maxExpectedReturn = expectedNumbers.length ? Math.max(...expectedNumbers) : null;
  if ((rrttllu.returnObjective === "원금 보존 투자" || rrttllu.returnObjective.includes("안정적")) && maxExpectedReturn !== null && maxExpectedReturn >= 10) {
    conflicts.push({
      text: `고객은 '${rrttllu.returnObjective}'를 선택했지만 기대수익률은 '${rrttllu.expectedReturn}'로 입력했습니다. 안정 성향과 기대수익률의 현실성이 일치하는지 확인하는 것이 좋습니다.`,
      highlights: [rrttllu.returnObjective, rrttllu.expectedReturn],
    });
    checkpoints.push({ id: "return-risk-alignment", title: "기대수익률과 위험 감내 수준" });
  }
  if (rrttllu.lossResponse === "신규 자금 추가 투자") {
    followUps.push({
      text: `고객은 단기 손실 발생 시 '${rrttllu.lossResponse}'를 선택했습니다. 실제 추가 투자 여력이 충분한지 월평균 잉여현금흐름, 비상예비자금, 확정 지출 계획을 함께 확인하는 것이 좋습니다.`,
      highlights: ["신규 자금 추가 투자", "추가 투자 여력"],
      memoItems: ["단기 손실 시 추가 투자 가능 금액", "추가 투자 자금 출처", "월평균 잉여현금흐름", "비상예비자금 분리 관리 여부"],
    });
    checkpoints.push({ id: "additional-investment-capacity", title: "단기 손실 시 추가 투자 가능 금액" });
  }
  if (rrttllu.timeHorizon === "5년 이상" && /1년|2년|3년|목돈|주택|유학|매입/.test(text(rrttllu.lumpSumPlan))) {
    conflicts.push({
      text: `고객은 투자기간을 '${rrttllu.timeHorizon}'으로 선택했지만 목돈 사용 계획에는 '${rrttllu.lumpSumPlan}'이 입력되어 있습니다. 장기 투자 목표와 실제 자금 사용 시점이 충돌할 가능성이 있습니다.`,
      highlights: [rrttllu.timeHorizon, rrttllu.lumpSumPlan],
    });
    checkpoints.push({ id: "investment-period-cash-use", title: "투자기간과 목돈 사용 시점" });
  }
  if (/유학|교육비/.test(text(rrttllu.lumpSumPlan) + allQualitative)) {
    followUps.push({
      text: `고객 입력에는 자녀 유학 또는 교육비 관련 자금 수요가 포함되어 있습니다. 지출 시점과 필요 금액, 통화가 포트폴리오 유동성과 외화자산 편입 목적에 영향을 줄 수 있으므로 함께 확인하는 것이 좋습니다.`,
      highlights: ["자녀 유학", "필요 금액", "통화"],
      memoItems: ["자녀 유학 시작 시점 및 필요 금액", "외화자산 편입 목적", "자금 사용 시점 및 우선순위"],
    });
  }
  if (/배우자|가족/.test(allQualitative)) {
    followUps.push({
      text: `Smart Input 또는 Unique 기타에 배우자·가족 영향력이 나타납니다. 투자 결정이 고객 단독 판단인지 가족 단위 합의가 필요한지에 따라 설명 방식과 상품 제안 범위가 달라질 수 있으므로 의사결정 참여자를 확인하는 것이 좋습니다.`,
      highlights: ["배우자·가족 영향력", "의사결정 참여자"],
      memoItems: ["가족 의사결정 참여자"],
    });
  }
  if (/기존\s*PB|PB\s*서비스|새로운\s*PB|불만족/.test(allQualitative)) {
    followUps.push({
      text: `고객은 기존 PB 서비스 경험 또는 교체 맥락을 언급했습니다. 이전 상담에서 충족되지 않았던 기대를 파악해야 제안 방식과 관리 범위를 조정할 수 있으므로 불만족 사유를 확인하는 것이 좋습니다.`,
      highlights: ["기존 PB 서비스 경험", "불만족 사유"],
      memoItems: ["기존 PB 서비스 불만족 사유"],
    });
  }
  if (rrttllu.globalTaxImportance === "매우 중요" || rrttllu.recentGlobalTaxSubject === "예" || /절세|종합과세|세금/.test(allQualitative)) {
    explanation.push({
      text: `고객은 금융소득종합과세 절감 중요도 '${rrttllu.globalTaxImportance || "미입력"}' 및 Smart Input의 세금 관련 맥락을 보유하고 있습니다. 상품 설명 시 기대수익률보다 세후수익률, 금융소득종합과세 영향, 절세 효과를 중심으로 설명하는 것이 효과적일 수 있습니다.`,
      highlights: ["세후수익률", "금융소득종합과세", "절세 효과"],
    });
  }
  if (hasNegatedTrait(allQualitative, marketSensitivityPatterns)) {
    explanation.push({
      text: `Smart Input 또는 Unique 기타에는 시장 뉴스와 단기 이슈에 크게 흔들리지 않는 성향이 반영되어 있습니다. 상품 설명 시 단기 이슈 대응보다 장기 투자 원칙과 사전에 정한 리밸런싱 기준을 중심으로 차분히 설명하는 방식이 효과적일 수 있습니다.`,
      highlights: ["단기 이슈에 크게 흔들리지 않는 성향", "장기 투자 원칙"],
    });
  } else if (hasPositiveTrait(allQualitative, marketSensitivityPatterns)) {
    explanation.push({
      text: `Smart Input 또는 Unique 기타에 시장 뉴스와 단기 이슈에 민감한 성향이 드러납니다. 투자 의사결정이 단기 시장 흐름에 과도하게 흔들리지 않도록 투자 원칙과 장기 목표를 함께 설명하는 방식이 효과적일 수 있습니다.`,
      highlights: ["시장 뉴스와 단기 이슈에 민감", "투자 원칙과 장기 목표"],
    });
  }
  if (hasNegatedTrait(allQualitative, fastDecisionPatterns)) {
    explanation.push({
      text: `Smart Input 또는 Unique 기타에는 투자 의사결정 속도가 빠르지 않은 편이라는 맥락이 반영되어 있습니다. 충분히 검토한 뒤 결정하려는 성향이 있을 수 있으므로 상품 구조, 위험요인, 투자 가정 조건을 차분히 정리해 설명하는 방식이 효과적일 수 있습니다.`,
      highlights: ["투자 의사결정 속도가 빠르지 않은 편", "차분히 정리"],
    });
  } else if (hasPositiveTrait(allQualitative, fastDecisionPatterns)) {
    explanation.push({
      text: `고객은 의사결정 속도가 빠른 편으로 보입니다. 상품 설명 시 기대수익보다 주요 위험요인과 투자 실패 시나리오를 먼저 설명하는 것이 도움이 될 수 있습니다.`,
      highlights: ["의사결정 속도", "투자 실패 시나리오"],
    });
  }
  if (/꼼꼼|설명/.test(allQualitative) || hasPositiveTrait(allQualitative, explanationNeedPatterns)) {
    explanation.push({
      text: `고객은 충분한 설명과 근거를 중시할 가능성이 있습니다. 상품 구조, 리스크, 가정 조건을 단계적으로 설명하면 상담 수용도가 높아질 수 있습니다.`,
      highlights: ["충분한 설명과 근거", "가정 조건"],
    });
  }
  if (/배우자|가족/.test(allQualitative)) {
    explanation.push({
      text: `고객의 투자 의사결정에 배우자 또는 가족 의견이 영향을 줄 수 있습니다. 주요 투자 제안은 개인 수익률뿐 아니라 가족 단위 재무 목표와 연결해 설명하는 것이 좋습니다.`,
      highlights: ["배우자 또는 가족 의견", "가족 단위 재무 목표"],
    });
    checkpoints.push({ id: "family-decision-influence", title: "배우자·가족 의사결정 영향" });
  }
  if (/손실|급등주|레버리지|망가진|수익률.*낮|불만/.test(allQualitative)) {
    explanation.push({
      text: `Smart Input에는 과거 투자 성과 불만 또는 고위험 투자 경험으로 해석될 수 있는 단서가 있습니다. 신규 제안 시 기대수익보다 리스크 통제 방식과 분산투자 논리를 우선 설명하는 것이 설득력을 높일 수 있습니다.`,
      highlights: ["과거 투자 성과 불만", "리스크 통제 방식"],
    });
  }
  if (/모니터링|관리\s*시간|본업이\s*바빠|주도주\s*편입/.test(allQualitative)) {
    explanation.push({
      text: `고객은 본업 또는 시간 제약으로 자산을 자주 모니터링하기 어려운 맥락이 있습니다. 잦은 매매가 필요한 전략보다 관리 부담이 낮은 포트폴리오 구조와 정기 점검 방식을 중심으로 설명하는 것이 효과적일 수 있습니다.`,
      highlights: ["자산 모니터링", "관리 부담이 낮은 포트폴리오"],
    });
  }
  if (/기존\s*PB|PB\s*서비스|새로운\s*PB|PB.*불만/.test(allQualitative)) {
    explanation.push({
      text: `고객은 기존 PB 서비스 경험 또는 교체 맥락을 언급했습니다. 단순 상품 설명보다 기존 관리 방식과 달라지는 점, 자산관리 프로세스, 사후관리 기준을 함께 제시하는 방식이 더 적합할 수 있습니다.`,
      highlights: ["기존 PB 서비스 경험", "사후관리 기준"],
    });
  }

  return {
    conflicts: { lines: uniqueLines(conflicts) },
    followUps: { lines: uniqueLines(followUps), checkpoints: memoItemsToCheckpoints(uniqueLines(followUps)) },
    explanation: { lines: uniqueLines(explanation) },
  };
}

function mergeGuides(ruleGuide: AdvisoryGuide, aiGuide: AdvisoryGuide): AdvisoryGuide {
  const sectionedLines = mergeSectionedLines(ruleGuide, aiGuide);
  return {
    conflicts: { lines: sectionedLines.conflicts },
    followUps: {
      lines: sectionedLines.followUps,
      checkpoints: memoItemsToCheckpoints(sectionedLines.followUps),
    },
    explanation: { lines: sectionedLines.explanation },
  };
}

function normalizeGuide(value: unknown): AdvisoryGuide {
  const data = value && typeof value === "object" ? value as Partial<AdvisoryGuide> & {
    conflicts?: unknown;
    followUps?: unknown;
    communicationGuides?: unknown;
  } : {};
  const normalizeLines = (lines: unknown): GuideLine[] => {
    if (!Array.isArray(lines)) return [];
    return lines
      .map((line): GuideLine | null => {
        if (typeof line === "string") return { text: line };
        if (!line || typeof line !== "object") return null;
        const item = line as Partial<GuideLine>;
        if (typeof item.text !== "string" || !item.text.trim()) return null;
        return {
          text: item.text.trim(),
          highlights: Array.isArray(item.highlights) ? item.highlights.filter((h): h is string => typeof h === "string" && h.trim().length > 0) : [],
          memoItems: Array.isArray(item.memoItems) ? item.memoItems.filter((m): m is string => typeof m === "string" && m.trim().length > 0) : [],
        };
      })
      .filter((line): line is GuideLine => Boolean(line))
      .slice(0, 5);
  };
  const normalizeCheckpoints = (items: unknown): GuideCheckpoint[] => {
    if (!Array.isArray(items)) return [];
    const checkpoints: GuideCheckpoint[] = [];
    items.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const checkpoint = item as Partial<GuideCheckpoint>;
      if (typeof checkpoint.title !== "string" || !checkpoint.title.trim()) return;
      const id = typeof checkpoint.id === "string" && checkpoint.id.trim()
        ? checkpoint.id.trim()
        : `checkpoint-${index + 1}-${checkpoint.title.trim().replace(/\s+/g, "-").slice(0, 24)}`;
      checkpoints.push({ id, title: checkpoint.title.trim(), prompt: checkpoint.prompt });
    });
    return checkpoints.slice(0, 6);
  };

  return {
    conflicts: { lines: normalizeLines(Array.isArray(data.conflicts) ? data.conflicts : data.conflicts?.lines) },
    followUps: {
      lines: normalizeLines(Array.isArray(data.followUps) ? data.followUps : data.followUps?.lines),
      checkpoints: normalizeCheckpoints(Array.isArray(data.followUps) ? [] : data.followUps?.checkpoints),
    },
    explanation: { lines: normalizeLines(Array.isArray(data.communicationGuides) ? data.communicationGuides : data.explanation?.lines) },
  };
}

function buildPrompt(payload: unknown, ruleGuide: AdvisoryGuide) {
  return [
    "You are an AI advisory strategist for a Samsung Securities private banker meeting a VVIP client for the first time.",
    "Return ONLY JSON matching the schema.",
    "Do not use hardcoded rules, canned examples, or fixed if-else style phrases. Analyze the provided customer data holistically and infer relationships yourself.",
    "The output is internal PB reference text, not customer-facing copy.",
    "Write in Korean. Use cautious wording such as '~로 보입니다', '~할 수 있습니다', '~확인하는 것이 좋습니다'.",
    "Do not copy example sentences verbatim. Generate naturally from the customer's profile, financial data, RRTTLLU answers, Unique notes, Smart Input raw memo, Smart Input extraction reflected in formData, and analysis JSON.",
    "This guide is not a survey summary. It must help the PB quickly understand the customer's decision-making style, hidden risks, behavioral tendencies, possible gaps between stated answers and likely behavior, and the best explanation strategy.",
    "Treat Smart Input raw text as high-value context even when it does not directly map to a survey field. Customer personality, behavior, decision style, sensitivity to market news, family influence, spouse influence, past investment experience, current dissatisfaction, psychological traits, consultation style, and qualitative complaints must be interpreted as counseling strategy clues.",
    "Every useful line must connect three elements: (1) evidence from the customer's actual input, (2) AI interpretation, and (3) what the PB should confirm or use in the conversation.",
    "Do not write abstract statements without evidence. If you mention a possible conflict, include the actual input values or phrases that support it.",
    "Bad style: '투자 기간과 유동성 필요 시기가 충돌할 수 있습니다.'",
    "Good style: '고객은 투자기간을 5년 이상으로 선택했지만, 향후 5년 내 주택 매입 자금 8억 원 사용 계획도 입력했습니다. 장기 투자 목표와 자금 사용 시점이 충돌할 가능성이 있으므로 실제 투자 가능 자금을 확인하는 것이 좋습니다.'",
    "Return this exact JSON shape: { \"conflicts\": [{ \"text\": \"...\", \"highlights\": [\"...\"] }], \"followUps\": [{ \"text\": \"...\", \"highlights\": [\"...\"], \"memoItems\": [\"...\"] }], \"communicationGuides\": [{ \"text\": \"...\", \"highlights\": [\"...\"] }] }.",
    "conflicts: detect actual contradictions, mismatches, or simultaneously hard-to-satisfy conditions. Do not create PB memo items here.",
    "followUps: each item must contain one evidence-rich text and memoItems derived ONLY from that same text. Do not create memoItems for anything not mentioned in followUps.text.",
    "communicationGuides: suggest how the PB should explain. Do not create PB memo items here.",
    "Never generate memoItems without a corresponding followUps.text.",
    "Do not generate customer-inappropriate memoItems. For a 60+ retired client, do not ask marriage plan or housing purchase unless explicitly mentioned. For an education-funding client, do not ask housing purchase unless explicitly mentioned.",
    "Merge semantically duplicate memoItems. Examples: '비정기 소득 지급 시점/확정 가능성/사용 계획' should become '비정기 소득 지급 시점 및 사용 계획'. '자금 사용 시점/우선순위/목돈 사용 시점' should become '자금 사용 시점 및 우선순위'.",
    "Limit memoItems to 4-6 only and keep only items directly tied to the customer's actual inputs.",
    "In explanation, do not list raw keywords such as '시장 뉴스, 민감, 망가진'. Interpret qualitative notes from Unique 기타 and Smart Input into a counseling strategy.",
    "Unique 기타 is a core input for explanation. Review every qualitative item and translate it into how the PB should explain, pace, frame risk, handle family influence, or reduce impulsive decisions.",
    "If Unique 기타 mentions market-news sensitivity, fast decision-making, past portfolio damage, leverage, dissatisfaction, spouse influence, many questions, or urgency about wealth-building, explain the behavioral implication and the recommended PB communication style. Do not simply copy the words.",
    "Respect Korean negation in Smart Input and Unique 기타. Do not convert a negated trait into a positive trait. For example, '성격이 급하지 않음' or '투자 의사결정 속도가 빠르지 않은 편' must never become '의사결정 속도가 빠른 편'. '시장 뉴스에 민감하지 않음' must never become '시장 뉴스에 민감'.",
    "When a qualitative trait is negated, either omit that trait from communicationGuides or describe the neutral/opposite counseling implication, such as explaining calmly with enough structure for a deliberate decision-maker.",
    "For communicationGuides, write 'how to explain to this customer', not 'what to check'. Use Smart Input and Unique 기타 deeply: personality, decision speed, family influence, past losses, benchmark dissatisfaction, tax sensitivity, and time constraints.",
    "Word-document direction for Unique 기타: customer personality such as meticulousness, suspicion, many questions, fast decisions, sensitivity, and market-news sensitivity should become explanation style; family context such as spouse influence, child education burden, old parents, or parent support should become family-goal framing; investment behavior such as aggressive past losses, low existing portfolio returns, or lack of monitoring time should become risk-control, portfolio-management, and low-maintenance explanation strategy.",
    "In communicationGuides, avoid sentences ending with '확인하는 것이 좋습니다' unless the sentence mainly describes how to explain. Prefer verbs such as '설명하는 것이 효과적일 수 있습니다', '먼저 제시하는 방식이 적합할 수 있습니다', '중심으로 설명하는 것이 좋습니다'.",
    "Each section should have 3 to 5 concise but evidence-rich lines when useful. Merge duplicate ideas.",
    "If no meaningful item exists for a section, return one line: 현재 입력된 정보 기준으로 특별한 유의사항이 감지되지 않았습니다.",
    "For each line, include highlights containing only the short key phrases that should be red bold in the UI.",
    "For followUps.memoItems, return compact PB memo labels only when they are directly supported by that followUps.text.",
    "Do not generate customer-visible promises or definitive investment recommendations.",
    "Prefer specific statements over generic ones. Use the exact customer facts where possible: expected return, risk grade, investment period, large cash needs, emergency reserve, irregular income, preferred assets, avoided assets, spouse/family influence, market-news sensitivity, fast decision style, many questions, tax importance, or portfolio dissatisfaction.",
    "If a customer's stated risk appetite and behavioral signals differ, describe the gap carefully and cite both sides.",
    "If Smart Input mentions market sensitivity, impatience, spouse influence, many questions, or family issues, use those as interpretation evidence rather than ignoring them. Express it as a counseling strategy, not a keyword list.",
    "The following rule-based insights were calculated before Gemini. They are mandatory context. You may refine, merge, or expand them, but do not ignore them when relevant.",
    `Rule-based insights:\n${compact(ruleGuide)}`,
    `Customer data payload:\n${compact(payload)}`,
  ].join("\n\n");
}

function fallbackGuide(payload: any): AdvisoryGuide {
  const profile = payload?.profile ?? {};
  const financial = payload?.formData?.financial ?? {};
  const rrttllu = payload?.formData?.rrttllu ?? {};
  const risk = payload?.riskResult ?? {};
  const smartInput = typeof payload?.smartInputNote === "string" ? payload.smartInputNote : "";
  const uniqueOther = text(rrttllu.uniqueOther);
  const qualitative = `${smartInput}\n${uniqueOther}`;
  const liquidity = payload?.liquiditySummary ?? {};
  const conflicts: GuideLine[] = [];
  const followUps: GuideLine[] = [];
  const explanation: GuideLine[] = [];

  if (rrttllu.expectedReturn || rrttllu.returnObjective || risk.level) {
    conflicts.push({
      text: `고객은 ${rrttllu.returnObjective || "투자 목적 미입력"} 성향과 기대수익률 ${rrttllu.expectedReturn || "미입력"}을 제시했고, 현재 위험등급은 ${risk.level || "미산출"}입니다. 기대수익과 실제 손실 감내 수준이 같은 방향인지 상담 중 확인하는 것이 좋습니다.`,
      highlights: [`기대수익률 ${rrttllu.expectedReturn || "미입력"}`, `위험등급은 ${risk.level || "미산출"}`],
    });
  } else {
    conflicts.push({ text: fallbackLine });
  }
  if (rrttllu.lumpSumPlan || rrttllu.regularCashflowNeed) {
    conflicts.push({
      text: `고객은 투자기간을 ${rrttllu.timeHorizon || "미입력"}으로 두고 있으나, ${rrttllu.lumpSumPlan || rrttllu.regularCashflowNeed}도 함께 입력했습니다. 투자 기간과 실제 자금 사용 시점이 충돌할 가능성이 있으므로 투자 가능 자금 범위를 확인하는 것이 좋습니다.`,
      highlights: [`투자기간을 ${rrttllu.timeHorizon || "미입력"}`, rrttllu.lumpSumPlan || rrttllu.regularCashflowNeed],
    });
  }
  if (rrttllu.emergencyReservePlan) {
    conflicts.push({
      text: `비상예비자금 계획으로 '${rrttllu.emergencyReservePlan}'을 입력했습니다. 위험자산 비중을 높일 경우에도 해당 자금이 분리 관리되는지 확인하는 것이 좋습니다.`,
      highlights: ["비상예비자금", rrttllu.emergencyReservePlan],
    });
  }
  followUps.push({
    text: `고객은 총자산 ${financial.totalAssets || "미입력"} 중 향후 사용 예정 자금으로 ${liquidity.requiredDisplay || "미산출"}을 계획하고 있습니다. 단순히 필요자금과 투자 가능 자산을 비교하기보다 자금 사용 시점, 유동성 확보 계획, 월평균 잉여현금흐름을 함께 확인하는 것이 좋습니다.`,
    highlights: ["총자산", "향후 사용 예정 자금", "유동성 확보 계획"],
    memoItems: ["자금 사용 시점 및 우선순위", "월평균 잉여현금흐름"],
  });
  if (financial.irregularIncome) {
    followUps.push({
      text: `향후 예상 비정기 소득으로 '${financial.irregularIncome}'이 입력되어 있습니다. 지급 시점과 확정 가능성에 따라 투자 시작 시점과 분할 투자 계획이 달라질 수 있습니다.`,
      highlights: ["비정기 소득", financial.irregularIncome],
      memoItems: ["비정기 소득 지급 시점 및 사용 계획"],
    });
  }
  explanation.push({
    text: `고객의 기대수익률은 ${rrttllu.expectedReturn || "미입력"}이고 위험등급은 ${risk.level || "미산출"}입니다. 상품 설명 시 기대수익률 숫자만 제시하기보다 손실 시나리오와 대응 기준을 함께 설명하는 편이 적절해 보입니다.`,
    highlights: ["손실 시나리오", "대응 기준"],
  });
  if (rrttllu.globalTaxImportance || rrttllu.giftingPlan) {
    explanation.push({
      text: `세금 관련 응답은 종합과세 절감 중요도 '${rrttllu.globalTaxImportance || "미입력"}', 사전증여 계획 '${rrttllu.giftingPlan || "미입력"}'입니다. 세전수익률보다 세후수익률과 절세 구조 중심으로 설명하는 것이 더 효과적일 수 있습니다.`,
      highlights: ["세후수익률", "절세 구조"],
    });
  }
  if (rrttllu.preferredAssets || rrttllu.avoidedAssets) {
    explanation.push({
      text: `고객은 선호 자산 '${rrttllu.preferredAssets || "미입력"}', 기피 자산 '${rrttllu.avoidedAssets || "미입력"}'을 입력했습니다. 추천 포트폴리오가 이 선호·기피 조건을 어떻게 반영하는지 먼저 설명하면 수용도가 높아질 수 있습니다.`,
      highlights: ["선호 자산", "기피 자산"],
    });
  }
  if (hasNegatedTrait(qualitative, marketSensitivityPatterns)) {
    explanation.push({
      text: `고객은 시장 뉴스와 단기 이슈에 크게 흔들리지 않는 편으로 해석될 수 있습니다. 단기 이벤트 전망보다 투자 원칙, 리밸런싱 기준, 장기 목표와의 연결성을 차분히 설명하는 방식이 도움이 될 수 있습니다.`,
      highlights: ["크게 흔들리지 않는 편", "투자 원칙"],
    });
  } else if (hasPositiveTrait(qualitative, marketSensitivityPatterns)) {
    explanation.push({
      text: `고객은 시장 뉴스나 단기 이슈에 반응하는 성향이 있을 수 있습니다. 상품을 제안할 때 단기 이벤트 전망보다 투자 원칙, 리밸런싱 기준, 장기 목표와의 연결성을 먼저 설명하는 것이 도움이 될 수 있습니다.`,
      highlights: ["단기 이슈", "투자 원칙"],
    });
  }
  if (hasNegatedTrait(qualitative, fastDecisionPatterns)) {
    explanation.push({
      text: `고객은 투자 의사결정 속도가 빠르지 않은 편으로 해석될 수 있습니다. 충분히 검토한 뒤 결정하려는 성향을 고려해 상품 구조, 주요 위험요인, 가정 조건을 순서대로 정리해 설명하는 방식이 효과적일 수 있습니다.`,
      highlights: ["의사결정 속도가 빠르지 않은 편", "순서대로 정리"],
    });
  } else if (hasPositiveTrait(qualitative, fastDecisionPatterns)) {
    explanation.push({
      text: `고객은 투자 의사결정 속도가 빠른 편으로 해석될 수 있습니다. 기대수익률을 먼저 강조하기보다 주요 위험요인, 손실 발생 시나리오, 투자 전 숙려 포인트를 먼저 제시하는 방식이 적합할 수 있습니다.`,
      highlights: ["의사결정 속도", "손실 발생 시나리오"],
    });
  }
  if (/손실|급등주|레버리지|망가진|수익률.*낮|불만|훼손/.test(qualitative)) {
    explanation.push({
      text: `고객은 과거 투자 성과 부진이나 고위험 투자 경험을 의식하고 있을 수 있습니다. 신규 제안에서는 기대수익보다 리스크 통제 방식, 분산투자 논리, 손실 제한 구조를 먼저 설명하는 것이 설득력을 높일 수 있습니다.`,
      highlights: ["투자 성과 부진", "리스크 통제 방식"],
    });
  }
  if (/배우자|가족/.test(qualitative)) {
    explanation.push({
      text: `고객의 투자 결정에는 가족 의견이 영향을 줄 수 있습니다. 포트폴리오 제안은 개인 성과뿐 아니라 가구 단위 목표, 배우자와 공유 가능한 의사결정 기준까지 함께 정리해 설명하는 것이 좋습니다.`,
      highlights: ["가족 의견", "가구 단위 목표"],
    });
  }
  if (/꼼꼼|충분한\s*설명|설명\s*선호/.test(qualitative) || hasPositiveTrait(qualitative, explanationNeedPatterns)) {
    explanation.push({
      text: `고객은 투자 제안의 근거와 구조를 충분히 이해한 뒤 판단하려는 성향이 있을 수 있습니다. 상품의 장점만 압축해 설명하기보다 투자 논리, 주요 가정, 위험요인을 단계적으로 제시하는 방식이 더 적합할 수 있습니다.`,
      highlights: ["투자 제안의 근거", "단계적으로 제시"],
    });
  }
  if (/모니터링|관리\s*시간|본업이\s*바빠|주도주\s*편입/.test(qualitative)) {
    explanation.push({
      text: `고객은 자산 모니터링 시간이 제한적일 수 있습니다. 잦은 매매보다 관리 부담이 낮은 포트폴리오 구조, 정기 점검 방식, 자동화된 리밸런싱 기준을 중심으로 설명하는 것이 효과적일 수 있습니다.`,
      highlights: ["자산 모니터링 시간", "정기 점검 방식"],
    });
  }
  if (/기존\s*PB|PB\s*서비스|새로운\s*PB|PB.*불만/.test(qualitative)) {
    explanation.push({
      text: `고객은 기존 PB 서비스 경험 또는 교체 맥락을 갖고 있을 수 있습니다. 단순 상품 제안보다 이전 관리 방식과 달라지는 점, 사후관리 체계, 자산 승계·절세·현금흐름 관리의 차별성을 먼저 설명하는 것이 좋습니다.`,
      highlights: ["기존 PB 서비스 경험", "사후관리 체계"],
    });
  }

  return {
    conflicts: { lines: conflicts.slice(0, 5) },
    followUps: {
      lines: followUps.slice(0, 5),
      checkpoints: memoItemsToCheckpoints(followUps.slice(0, 5)),
    },
    explanation: { lines: explanation.slice(0, 5) },
  };
}

async function callGemini(payload: unknown) {
  const ruleGuide = buildRuleInsights(payload);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { source: "mock", data: mergeGuides(ruleGuide, fallbackGuide(payload)) };

  try {
    const prompt = buildPrompt(payload, ruleGuide);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    });
    if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") throw new Error("Gemini response did not include JSON text.");
    return { source: "gemini", data: mergeGuides(ruleGuide, normalizeGuide(JSON.parse(text))) };
  } catch (error) {
    console.error("AI advisory guide generation failed. Falling back to mock.", { error });
    return { source: "mock", fallback: true, data: mergeGuides(ruleGuide, fallbackGuide(payload)) };
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await callGemini(payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("AI advisory guide route failed", { error });
    return NextResponse.json({ error: "AI 상담 가이드 생성에 실패했습니다." }, { status: 500 });
  }
}
