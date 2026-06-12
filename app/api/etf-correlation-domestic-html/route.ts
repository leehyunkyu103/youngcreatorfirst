/**
 * /api/etf-correlation-domestic-html
 * GET ?strategy=balanced&k=3
 *   → data/etf_domestic_b1.json + data/etf_domestic_b2.json 읽기
 *   → 공통 날짜 교집합 기준 6개 기간 상관행렬 연산
 *   → data/template_domestic.html 에 PERIOD_DATA 주입하여 완성 HTML 반환
 * 1시간 인메모리 캐시 (strategy × k 조합별)
 */

export const runtime = 'nodejs';

import path from 'path';
import fs from 'fs';

// ── 타입 ──────────────────────────────────────────────────────────────────────
type Strategy = 'conservative' | 'balanced' | 'aggressive';

interface ETFBatch {
  tickers: string[];
  dates: string[];
  prices: Record<string, (number | null)[]>;
}

interface PeriodResult {
  start: string;
  end: string;
  n_days: number;
  corr_matrix: Record<string, Record<string, number>>;
  optimal: string[];
  opt_avg_corr: number;
  opt_score: number;
  global_avg: number;
  dates: string[];
  prices: Record<string, number[]>;
  capped_weights: Record<string, number>;
  scores: Record<string, number>;
}

// ── 캐시: 연산 결과(PeriodData)만 1시간 캐시, 템플릿은 매번 읽음 ───────────
const dataCache = new Map<string, { data: Record<string, unknown>; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000;

// ── 섹터 맵 (그리디 알고리즘 섹터 다양성 제약) ──────────────────────────────
const SECTOR_MAP: Record<string, string> = {
  '069500.KS': '주식시장(코스피)',
  '229200.KS': '주식시장(코스닥)',
  '091160.KS': '반도체',
  '305720.KS': '2차전지',
  '091180.KS': '자동차',
  '441680.KS': '신재생에너지',
  '143460.KS': '바이오',
  '445290.KS': '로보틱스',
  '472870.KS': '방산',
  '0098F0.KS': '원자력',
  '449170.KS': '자율주행',
  '488290.KS': '조선',
  '475080.KS': 'AI·전력',
  '104530.KS': '건설',
  '228810.KS': '경기소비재',
  '228820.KS': '기계장비',
  '091170.KS': '금융',
  '117460.KS': '에너지화학',
  '140710.KS': '운송',
  '117680.KS': '철강',
  '228800.KS': '필수소비재',
  '114820.KS': '채권(단기)',
  '471230.KS': '채권(장기)',
  '132030.KS': '귀금속',
  '138920.KS': '원자재금속',
  '261220.KS': '에너지원자재',
  '459580.KS': '현금성',
  '453850.KS': '해외채권',
  '138230.KS': '달러·외환',
};

const TICKERS_ORDERED = [
  '069500.KS', '229200.KS', '091160.KS', '305720.KS', '091180.KS',
  '441680.KS', '143460.KS', '445290.KS', '472870.KS', '0098F0.KS',
  '449170.KS', '488290.KS', '475080.KS', '104530.KS', '228810.KS',
  '228820.KS', '091170.KS', '117460.KS', '140710.KS', '117680.KS',
  '228800.KS', '114820.KS', '471230.KS', '132030.KS', '138920.KS',
  '261220.KS', '459580.KS', '453850.KS', '138230.KS',
];

// ── 수학 헬퍼 ─────────────────────────────────────────────────────────────────

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  if (n < 2) return 0;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma, y = b[i] - mb;
    num += x * y; da += x * x; db += y * y;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

function computeReturns(prices: number[]): number[] {
  return prices.slice(1).map((p, i) => p / prices[i] - 1);
}

function ffill(arr: (number | null)[]): number[] {
  let last = 0;
  return arr.map((v) => {
    if (v != null && !isNaN(v)) last = v;
    return last;
  });
}

// ── 그리디 최적 포트폴리오 선택 ───────────────────────────────────────────────

function greedyOptimal(
  cm: Record<string, Record<string, number>>,
  tickers: string[],
  k: number,
  strategy: Strategy,
  vols: Record<string, number>,
  scores: Record<string, number>,
): string[] {
  const sectors: Record<string, string> = {};
  for (const t of tickers) sectors[t] = SECTOR_MAP[t] ?? 'other';

  const calcScore = (a: string, b: string): number => {
    const c = cm[a][b];
    if (strategy === 'aggressive' || strategy === 'balanced') {
      const denom = scores[a] + scores[b];
      return c / (denom > 0 ? denom : 0.001);
    }
    return (c + 1.01) * (vols[a] + vols[b]);
  };

  const selected: string[] = [];
  const usedSectors = new Set<string>();
  let remaining = [...tickers];

  let bestPair: [string, string] | null = null;
  let bestScore = 999999;
  for (let i = 0; i < remaining.length; i++) {
    for (let j = i + 1; j < remaining.length; j++) {
      const a = remaining[i], b = remaining[j];
      if (sectors[a] === sectors[b]) continue;
      const score = calcScore(a, b);
      if (score < bestScore) { bestScore = score; bestPair = [a, b]; }
    }
  }
  if (bestPair) {
    for (const t of bestPair) {
      selected.push(t);
      remaining = remaining.filter((x) => x !== t);
      usedSectors.add(sectors[t]);
    }
  }

  while (selected.length < k && remaining.length > 0) {
    let cands = remaining.filter((t) => !usedSectors.has(sectors[t]));
    if (!cands.length) cands = [...remaining];

    let best: string | null = null;
    let bestAvg = 999999;
    for (const t of cands) {
      const avg = selected.reduce((s, s2) => s + calcScore(t, s2), 0) / selected.length;
      if (avg < bestAvg) { bestAvg = avg; best = t; }
    }
    if (!best) break;
    selected.push(best);
    remaining = remaining.filter((x) => x !== best);
    usedSectors.add(sectors[best]);
  }

  return selected.slice(0, k);
}

// ── 핵심 연산: 기간별 상관행렬 + 최적 포트폴리오 ─────────────────────────────

function computePeriodData(
  b1: ETFBatch,
  b2: ETFBatch,
  strategy: Strategy,
  k: number,
): Record<string, PeriodResult> {
  const datesSet1 = new Set(b1.dates);
  const commonDates = b2.dates.filter((d) => datesSet1.has(d)).sort();
  const N = commonDates.length;

  const idx1: Record<string, number> = {};
  b1.dates.forEach((d, i) => { idx1[d] = i; });
  const idx2: Record<string, number> = {};
  b2.dates.forEach((d, i) => { idx2[d] = i; });

  const tickers = TICKERS_ORDERED;
  const pricesAll: Record<string, number[]> = {};
  for (const t of b1.tickers) {
    pricesAll[t] = ffill(commonDates.map((d) => b1.prices[t]?.[idx1[d]] ?? null));
  }
  for (const t of b2.tickers) {
    pricesAll[t] = ffill(commonDates.map((d) => b2.prices[t]?.[idx2[d]] ?? null));
  }

  const allVols: Record<string, number> = {};
  const strategyScores: Record<string, number> = {};

  for (const t of tickers) {
    const rets = computeReturns(pricesAll[t]);
    const mean = rets.reduce((s, v) => s + v, 0) / (rets.length || 1);
    const variance = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / (rets.length || 1);
    const std = Math.sqrt(variance) || 0.0001;
    allVols[t] = std;

    const annReturn = pricesAll[t][pricesAll[t].length - 1] / pricesAll[t][0] - 1;

    if (strategy === 'aggressive') {
      strategyScores[t] = annReturn > 0 ? annReturn : 0.001;
    } else if (strategy === 'balanced') {
      const annRetAnnual = annReturn / 3;
      const sharpe = std > 0 ? annRetAnnual / (std * Math.sqrt(252)) : 0;
      strategyScores[t] = sharpe > 0 ? sharpe : 0.001;
    } else {
      strategyScores[t] = std;
    }
  }

  const PERIOD_SLICES: Record<string, number> = {
    '1W': 5, '1M': 21, '3M': 63, '6M': 126, '1Y': 252, '3Y': N,
  };

  const result: Record<string, PeriodResult> = {};

  for (const [pname, nDays] of Object.entries(PERIOD_SLICES)) {
    const sl = Math.min(nDays, N);
    const startIdx = N - sl;
    const datesSl = commonDates.slice(startIdx);

    const pricesSl: Record<string, number[]> = {};
    for (const t of tickers) pricesSl[t] = pricesAll[t].slice(startIdx);

    const retsSl: Record<string, number[]> = {};
    for (const t of tickers) retsSl[t] = computeReturns(pricesSl[t]);

    const cm: Record<string, Record<string, number>> = {};
    for (let i = 0; i < tickers.length; i++) {
      const t = tickers[i];
      cm[t] = {};
      for (let j = 0; j < tickers.length; j++) {
        const t2 = tickers[j];
        if (t === t2) {
          cm[t][t2] = 1.0;
        } else if (cm[t2]?.[t] !== undefined) {
          cm[t][t2] = cm[t2][t];
        } else {
          cm[t][t2] = Math.round(pearson(retsSl[t], retsSl[t2]) * 10000) / 10000;
        }
      }
    }

    let pairSum = 0, pairCnt = 0;
    for (let i = 0; i < tickers.length; i++) {
      for (let j = i + 1; j < tickers.length; j++) {
        pairSum += cm[tickers[i]][tickers[j]]; pairCnt++;
      }
    }
    const globalAvg = pairSum / pairCnt;

    const optimal = greedyOptimal(cm, tickers, k, strategy, allVols, strategyScores);

    let optPairSum = 0, optPairCnt = 0;
    for (let i = 0; i < optimal.length; i++) {
      for (let j = i + 1; j < optimal.length; j++) {
        optPairSum += cm[optimal[i]][optimal[j]]; optPairCnt++;
      }
    }
    const optAvgCorr = optPairCnt ? optPairSum / optPairCnt : 0;
    const optScore = Math.max(0, Math.min(100, Math.round((1 - optAvgCorr) * 100)));

    const invVols: Record<string, number> = {};
    for (const t of optimal) invVols[t] = allVols[t] > 0 ? 1 / allVols[t] : 1000;
    const totalInv = Object.values(invVols).reduce((s, v) => s + v, 0);
    const cappedWeights: Record<string, number> = {};
    for (const t of optimal) cappedWeights[t] = invVols[t] / totalInv;

    result[pname] = {
      start: datesSl[0],
      end: datesSl[datesSl.length - 1],
      n_days: datesSl.length,
      corr_matrix: cm,
      optimal,
      opt_avg_corr: Math.round(optAvgCorr * 10000) / 10000,
      opt_score: optScore,
      global_avg: Math.round(globalAvg * 10000) / 10000,
      dates: datesSl,
      prices: pricesSl,
      capped_weights: cappedWeights,
      scores: strategyScores,
    };
  }

  return result;
}

// ── 라우트 핸들러 ─────────────────────────────────────────────────────────────

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const strategy = (['conservative', 'balanced', 'aggressive'].includes(
    url.searchParams.get('strategy') ?? '',
  )
    ? url.searchParams.get('strategy')
    : 'balanced') as Strategy;
  const k = Math.min(8, Math.max(2, parseInt(url.searchParams.get('k') ?? '3', 10)));

  const cacheKey = `domestic-${strategy}-${k}`;
  const dataDir = path.join(process.cwd(), 'data');

  try {
    let periodData: Record<string, unknown>;
    const hit = dataCache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      periodData = hit.data;
    } else {
      const b1: ETFBatch = JSON.parse(fs.readFileSync(path.join(dataDir, 'etf_domestic_b1.json'), 'utf-8'));
      const b2: ETFBatch = JSON.parse(fs.readFileSync(path.join(dataDir, 'etf_domestic_b2.json'), 'utf-8'));
      periodData = computePeriodData(b1, b2, strategy, k) as Record<string, unknown>;
      dataCache.set(cacheKey, { data: periodData, ts: Date.now() });
    }

    const tmpl = fs.readFileSync(path.join(dataDir, 'template_domestic.html'), 'utf-8');

    const strategyTexts: Record<Strategy, string> = {
      conservative: '🛡️ 보수형 (Conservative → 상관계수+변동성 댐핑 리스크 낮춤)',
      balanced: '⚖️ 밸런스형 (Balanced → 상관계수+중립적 리스크 효율 모델)',
      aggressive: '🔥 공격형 (Aggressive → 상관계수+높은 수익률 모델)',
    };

    const html = tmpl
      .replace('##PERIOD_DATA_JS##', JSON.stringify(periodData))
      .replace('##K_VAL_JS##', String(k))
      .replace('##STRATEGY_TYPE##', strategy)
      .replace('##STRATEGY_TXT##', strategyTexts[strategy]);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('[etf-correlation-domestic-html]', err);
    return new Response('<h1>ETF 데이터 로드 실패</h1><p>data/etf_domestic_b1.json, etf_domestic_b2.json, template_domestic.html 파일을 확인하세요.</p>', {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
