"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
export const THRESHOLD = 20_000_000; // 금융소득 종합과세 기준: 2,000만원
export const FINANCIAL_INCOME_STORAGE_KEY = "financial-income-summary-v1";

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
export interface IncomeBreakdownItem {
  name: string;
  ticker: string;
  incomeType: "배당" | "이자" | "배당(국내직접)" | "배당(해외직접)" | "배당(집합투자)";
  annualIncome: number; // 연간 소득 (원)
  yieldRate: number;    // 수익률 (소수)
  value: number;        // 보유 평가액 (원)
}

export interface CapitalGainsBreakdownItem {
  name: string;
  ticker: string;
  gain: number;
  tax: number;
  category: "해외주식" | "국내대주주" | "해외펀드";
}

export interface FinancialIncomeSummary {
  interestIncome: number;       // 이자소득 합계 (원)
  dividendIncome: number;       // 배당소득 합계 (원)
  totalCapitalGains: number;         // 손익 통산 전 총 차익 (해외)
  totalCapitalLosses: number;        // 손익 통산 전 총 손실 (해외)
  netCapitalGains: number;           // 손익 통산 후 순 양도차익 (해외)
  foreignCapitalGainsTax: number;    // 해외주식·ETF·펀드 양도소득세 (22%)
  domesticMajorShareholderTax: number; // 국내 대주주 양도소득세 (20%/25%)
  capitalGainsTax: number;           // 양도소득세 합계
  totalFinancialIncome: number; // 이자 + 배당 합계 (종합과세 판단 기준)
  grossUpAmount: number;              // (Gross-up 가산액)
  taxableFinancialIncome: number;     // (Gross-up 포함 종합과세 합산액)
  generalTax: number;                 // (일반산출세액)
  comparisonTax: number;              // (비교산출세액)
  finalTax: number;                   // (MAX(일반산출세액, 비교산출세액))
  dividendTaxCredit: number;          // (배당세액공제)
  withholdingTax: number;             // (기납부 원천징수세액 15.4%)
  additionalTax: number;              // (최종 추가 납부세액 = finalTax - dividendTaxCredit - withholdingTax)
  tMarginal: number;                  // (적용 한계세율)
  isOverThreshold: boolean;
  breakdown: IncomeBreakdownItem[];
  capitalGainsBreakdown: CapitalGainsBreakdownItem[];
  majorShareholderWarning: boolean;
  majorShareholderItems: { name: string; ticker: string; value: number; estimatedTax: number }[];
  updatedAt: number;
}

// ─────────────────────────────────────────────
// 포맷 유틸
// ─────────────────────────────────────────────
function fmtWon(n: number) {
  if (Math.abs(n) >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (Math.abs(n) >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`;
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

function fmtPct(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

// ─────────────────────────────────────────────
// 게이지 컴포넌트
// ─────────────────────────────────────────────
interface FinancialIncomeGaugeProps {
  summary: FinancialIncomeSummary | null;
  /** Tab3에서 신규 상품 추가 시 delta 값 */
  additionalIncome?: number;
}

export function FinancialIncomeGauge({
  summary,
  additionalIncome = 0,
}: FinancialIncomeGaugeProps) {
  const [activeTab, setActiveTab] = useState<"배당" | "이자" | "양도">("배당");
  const [taxDetailExpanded, setTaxDetailExpanded] = useState(false);

  const baseIncome = summary?.totalFinancialIncome ?? 0;
  const totalIncome = baseIncome + additionalIncome;
  const basePct = Math.min((baseIncome / THRESHOLD) * 100, 100);
  const totalPct = Math.min((totalIncome / THRESHOLD) * 100, 100);
  const isOver = totalIncome > THRESHOLD;
  const remaining = Math.max(THRESHOLD - totalIncome, 0);

  const gaugeColor =
    totalPct >= 100 ? "#dc2626" :
    totalPct >= 80  ? "#f59e0b" :
    totalPct >= 50  ? "#2563eb" : "#10b981";

  const statusLabel =
    totalPct >= 100 ? "종합과세 해당" :
    totalPct >= 80  ? "종합과세 임박" :
    totalPct >= 50  ? "주의 구간"    : "안전 구간";

  const dividendItems = (summary?.breakdown ?? []).filter(b => b.incomeType.startsWith("배당"));
  const interestItems = (summary?.breakdown ?? []).filter(b => b.incomeType === "이자");

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
          금융소득종합과세 및 해외양도세 점검
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isOver ? "#fee2e2" : "#f0fdf4",
            color: isOver ? "#dc2626" : "#16a34a",
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* ── 금액 + 게이지 ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-end gap-1.5 mb-3">
          <span className="text-3xl font-black tracking-tight text-slate-800">
            {fmtWon(totalIncome)}
          </span>
          <span className="text-sm font-bold text-slate-400 pb-1">
            / 2,000만원
          </span>
        </div>

        {/* 게이지 바 */}
        <div className="relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          {/* 기존 포트폴리오 */}
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${basePct}%`, backgroundColor: gaugeColor }}
          />
          {/* Tab3 신규 추가분 */}
          {additionalIncome > 0 && (
            <div
              className="absolute top-0 h-full rounded-r-full transition-all duration-700 ease-out"
              style={{
                left: `${basePct}%`,
                width: `${Math.min((additionalIncome / THRESHOLD) * 100, 100 - basePct)}%`,
                backgroundColor: "#7c3aed",
                opacity: 0.75,
              }}
            />
          )}
        </div>

        {/* 눈금 */}
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-400">0</span>
          <span className="text-[10px] text-slate-500 font-bold">1,000만원</span>
          <span className="text-[10px] text-slate-400">2,000만원</span>
        </div>

        {/* 초과 / 여유 메시지 */}
        <div className="mt-3">
          {isOver ? (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <AlertTriangle size={14} className="shrink-0 text-red-500 mt-0.5" />
              <p className="text-xs font-semibold text-red-700 leading-snug">
                2,000만원을 <strong>{fmtWon(totalIncome - THRESHOLD)}</strong> 초과.
                금융소득 종합과세 신고 대상입니다.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-50 px-3 py-2">
              <span className="text-xs font-semibold text-emerald-700">
                여유 <strong>{fmtWon(remaining)}</strong> · 원천징수 15.4%로 분리과세 적용
              </span>
            </div>
          )}
        </div>

        {/* 대주주 요건 알림 */}
        {summary?.majorShareholderWarning && (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
            <div className="text-xs font-bold text-orange-700 mb-1">
              ⚠️ 대주주 요건 해당 가능 종목
            </div>
            <div className="space-y-1">
              {summary.majorShareholderItems.map((item, idx) => (
                <div key={idx} className="text-xs text-orange-600">
                  {item.name} · 보유액 {(item.value / 100_000_000).toFixed(1).replace(/\.0$/, "")}억원 · 매도 시 양도소득세 20~25% 부과
                  {item.estimatedTax > 0 && ` · 추정 세액 ${Math.round(item.estimatedTax / 10_000).toLocaleString("ko-KR")}만원`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 소득 탭: 배당 / 이자 / 양도 ── */}
      <div className="border-t border-slate-100">
        {/* 탭 헤더 */}
        <div className="flex border-b border-slate-100">
          {(["배당", "이자", "양도"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold transition ${
                activeTab === tab
                  ? "border-b-2 border-samsung text-samsung"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab === "배당" && `배당소득 ${fmtWon(summary?.dividendIncome ?? 0)}`}
              {tab === "이자" && `이자소득 ${fmtWon(summary?.interestIncome ?? 0)}`}
              {tab === "양도" && `양도소득세 ${fmtWon(summary?.capitalGainsTax ?? 0)}`}
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        <div className="px-4 py-3 space-y-2 min-h-[80px]">
          {activeTab === "배당" && (
            <div className="space-y-2">
              {dividendItems.length > 0 ? dividendItems.map((item, i) => (
                <IncomeRow key={i} item={item} />
              )) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  배당소득 내역이 없습니다. 종목을 입력하면 자동 계산됩니다.
                </p>
              )}

              {/* 종합과세 해당 시 표시 */}
              {summary?.isOverThreshold && (
                <div className="border-t border-slate-100 my-2 pt-2 space-y-1">
                  {taxDetailExpanded ? (
                    <>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Gross-up 가산액</span>
                        <span>{fmtWon(summary.grossUpAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>종합과세 합산액</span>
                        <span>{fmtWon(summary.taxableFinancialIncome)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>일반산출세액</span>
                        <span>{fmtWon(summary.generalTax)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>비교산출세액</span>
                        <span>{fmtWon(summary.comparisonTax)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-700 font-bold">
                        <span>적용 산출세액 <span className="text-[10px] font-normal text-slate-400">(둘 중 큰 금액)</span></span>
                        <span>{fmtWon(summary.finalTax)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-emerald-600">
                        <span>배당세액공제</span>
                        <span>-{fmtWon(summary.dividendTaxCredit)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-600">
                        <span>기납부 원천징수세액</span>
                        <span>-{fmtWon(summary.withholdingTax)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-red-600 font-bold mt-1 pt-1 border-t border-slate-50">
                        <span>추가 납부세액</span>
                        <span>{fmtWon(summary.additionalTax)}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setTaxDetailExpanded(false)}
                        className="w-full text-center text-xs font-semibold text-slate-500 mt-2 py-1 hover:text-slate-700 transition"
                      >
                        세금 계산 상세 보기 ▲
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs text-red-600 font-bold">
                        <span>추가 납부세액</span>
                        <span>{fmtWon(summary.additionalTax)}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setTaxDetailExpanded(true)}
                        className="w-full text-center text-xs font-semibold text-slate-500 mt-1 py-1 hover:text-slate-700 transition"
                      >
                        세금 계산 상세 보기 ▼
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === "이자" && (
            interestItems.length > 0 ? interestItems.map((item, i) => (
              <IncomeRow key={i} item={item} />
            )) : (
              <p className="text-xs text-slate-400 text-center py-4">
                이자소득 내역이 없습니다.
              </p>
            )
          )}
          {activeTab === "양도" && (
            <div className="space-y-2">
              {(summary?.capitalGainsBreakdown ?? []).length > 0 ? (
                <>
                  {(summary?.capitalGainsBreakdown ?? []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <span className="font-bold text-navy truncate">{item.name}</span>
                        <span className="ml-1.5 text-slate-400">{item.ticker} · 차익 {fmtWon(item.gain)}</span>
                      </div>
                      <span className="shrink-0 ml-3 font-semibold text-slate-600">세액 {fmtWon(item.tax)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-100 my-2 pt-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-1.5">
                      250만원 공제 후 합계 × 22% (금융소득 종합과세와 별도 과세)
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 font-bold">최종 양도소득세 총액</span>
                      <span className="font-bold text-orange-600">{fmtWon(summary?.capitalGainsTax ?? 0)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">
                  해외주식 등 양도차익 내역이 없습니다.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────
// 내역 행 서브컴포넌트
// ─────────────────────────────────────────────
function IncomeRow({ item }: { item: IncomeBreakdownItem }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="min-w-0">
        <span className="font-bold text-navy truncate">{item.name}</span>
        <span className="ml-1.5 text-slate-400">{item.ticker} · {fmtPct(item.yieldRate)}</span>
      </div>
      <span className="shrink-0 ml-3 font-bold text-samsung">{fmtWon(item.annualIncome)}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 금융소득 계산 유틸
// ─────────────────────────────────────────────
export interface AssetForIncomeCalc {
  name: string;
  ticker?: string;
  asset_class: string;
  productType?: string;
  country?: string;
  current_price?: number;
  current_value?: number;
  amount: number;
  amount_type: "quantity" | "value";
  buy_price?: number | null;
  dividendYield?: number;              // Yahoo Finance: 연간 배당수익률 (소수)
  trailingAnnualDividendRate?: number; // Yahoo Finance: 주당 연간 배당금
  interestRate?: number;               // 채권/예금 이자율 (소수)
}

export function calcFinancialIncomeSummary(
  assets: AssetForIncomeCalc[],
  tMarginal: number = 0.385
): FinancialIncomeSummary {
  const breakdown: IncomeBreakdownItem[] = [];
  const cgBreakdownTemp: (CapitalGainsBreakdownItem & { _raw?: true })[] = [];
  const majorShareholderItems: { name: string; ticker: string; value: number; estimatedTax: number }[] = [];
  let interestIncome = 0;
  let dividendIncome = 0;
  let totalCapitalGains = 0;   // 해외 손익통산용
  let totalCapitalLosses = 0;  // 해외 손익통산용
  let domesticMajorShareholderTax = 0;
  let grossUpTargetDividend = 0;

  for (const a of assets) {
    if (!a.name) continue;

    // 보유 평가액
    const value =
      a.current_value ??
      (a.amount_type === "quantity"
        ? (a.current_price ?? 0) * a.amount
        : a.amount);

    if (value <= 0) continue;

    // 판단 변수
    const ticker = a.ticker ?? "";
    const isKoreanTicker = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
    // 우선순위 1: ticker, 우선순위 2: country
    const isDomesticListed = isKoreanTicker || a.country === "국내" || a.country === "한국";
    
    const assetClass = a.asset_class ?? "";
    const productType = a.productType ?? "";

    // 매매차익 계산
    let gain = 0;
    if (a.buy_price && a.current_price && a.amount_type === "quantity") {
      gain = (a.current_price - a.buy_price) * a.amount;
    }

    // ── 이자 / 배당 소득 ──
    if (assetClass === "국내채권" || assetClass === "해외채권") {
      // 채권/예금은 이자소득
      const rate = a.interestRate ?? a.dividendYield ?? 0;
      const annual = value * rate;
      if (annual > 0) {
        interestIncome += annual;
        breakdown.push({
          name: a.name,
          ticker,
          incomeType: "이자",
          annualIncome: Math.round(annual),
          yieldRate: rate,
          value: Math.round(value),
        });
      }
    } else if (productType === "리츠") {
      // 리츠는 명시적 배당소득
      let yieldRate = a.dividendYield ?? 0;
      if (!yieldRate && a.trailingAnnualDividendRate && (a.current_price ?? 0) > 0) {
        yieldRate = a.trailingAnnualDividendRate / a.current_price!;
      }

      const annual = value * yieldRate;
      if (annual > 0) {
        dividendIncome += annual;
        breakdown.push({
          name: gain > 0 ? a.name + " (배당금)" : a.name,
          ticker,
          incomeType: "배당(집합투자)",
          annualIncome: Math.round(annual),
          yieldRate,
          value: Math.round(value),
        });
      }
    } else {
      // 기타 배당소득 (기본: 주식/ETF/금 등)
      let yieldRate = a.dividendYield ?? 0;
      if (!yieldRate && a.trailingAnnualDividendRate && (a.current_price ?? 0) > 0) {
        yieldRate = a.trailingAnnualDividendRate / a.current_price!;
      }

      if (yieldRate > 0) {
        const annual = value * yieldRate;
        dividendIncome += annual;
        
        let currentIncomeType: IncomeBreakdownItem["incomeType"] = "배당";
        if (isKoreanTicker && productType === "주식형") {
          currentIncomeType = "배당(국내직접)";
          grossUpTargetDividend += annual; // Gross-up 대상
        } else if (!isKoreanTicker && productType === "주식형") {
          currentIncomeType = "배당(해외직접)";
        } else if (productType === "ETF" || productType === "펀드" || productType === "채권형") {
          currentIncomeType = "배당(집합투자)";
        }

        breakdown.push({
          name: gain > 0 ? a.name + " (배당금)" : a.name,
          ticker,
          incomeType: currentIncomeType,
          annualIncome: Math.round(annual),
          yieldRate,
          value: Math.round(value),
        });
      }
    }

    // ── 매매차익(gain) 과세 분류 ──
    if (gain !== 0) {

      // ① 해외주식 · 해외ETF · 해외펀드: 손익통산 후 250만원 공제, 22%
      const isForeignTaxable =
        !isDomesticListed &&
        (productType === "주식형" || productType === "ETF" || productType === "개별주식" ||
         productType === "채권형" || productType === "펀드") ||
        assetClass === "해외채권";

      if (isForeignTaxable) {
        const cat: CapitalGainsBreakdownItem["category"] =
          productType === "ETF" ? "해외주식" :
          productType === "채권형" || productType === "펀드" || assetClass === "해외채권"
            ? "해외펀드" : "해외주식";
        if (gain > 0) totalCapitalGains += gain;
        else totalCapitalLosses += gain;
        cgBreakdownTemp.push({ name: a.name, ticker, gain, tax: 0, category: cat });

      // ② 국내 대주주 상장주식: 지분율 1% 이상(ticker 불명) 또는 종목당 10억 이상
      } else if (isKoreanTicker && value >= 1_000_000_000 && gain !== 0) {
        const tax = gain <= 0 ? 0
          : gain <= 300_000_000
            ? gain * 0.20
            : 300_000_000 * 0.20 + (gain - 300_000_000) * 0.25;
        domesticMajorShareholderTax += tax;
        cgBreakdownTemp.push({ name: a.name, ticker, gain, tax: Math.round(tax), category: "국내대주주" });
        majorShareholderItems.push({ name: a.name, ticker, value, estimatedTax: Math.round(tax) });

      // ③ 국내상장 해외ETF · 금ETF: 매매차익 → 배당소득(집합투자)으로 과세
      } else if (isDomesticListed && gain > 0 &&
                 (assetClass === "해외주식" || assetClass === "금" || productType === "금")) {
        dividendIncome += gain;
        breakdown.push({
          name: a.name + " (매매차익)",
          ticker,
          incomeType: "배당(집합투자)",
          annualIncome: Math.round(gain),
          yieldRate: a.buy_price && a.amount ? gain / (a.buy_price * a.amount) : 0,
          value: Math.round(value),
        });
      }
      // ④ 국내주식형 ETF · 국내채권 매매차익: 비과세 (생략)
    }
  }

  // ── ① 해외주식·ETF·펀드: 손익통산 후 250만원 공제, 22% ──
  const netCapitalGains = totalCapitalGains + totalCapitalLosses;
  const foreignCapitalGainsTax = netCapitalGains > 2_500_000
    ? Math.round((netCapitalGains - 2_500_000) * 0.22)
    : 0;

  // ── ② 합계 ──
  const capitalGainsTax = foreignCapitalGainsTax + Math.round(domesticMajorShareholderTax);

  // ── 항목별 기여 세액 분배 ──
  const capitalGainsBreakdown: CapitalGainsBreakdownItem[] = cgBreakdownTemp.map((item) => {
    if (item.category === "국내대주주") {
      return { ...item, gain: Math.round(item.gain) };
    }
    // 해외주식 / 해외펀드: 손익통산 기여 비율로 분배
    let tax = 0;
    if (foreignCapitalGainsTax > 0 && totalCapitalGains > 0 && item.gain > 0) {
      tax = foreignCapitalGainsTax * (item.gain / totalCapitalGains);
    }
    return { ...item, gain: Math.round(item.gain), tax: Math.round(tax) };
  }).sort((a, b) => b.gain - a.gain);

  const totalFinancialIncome = interestIncome + dividendIncome;

  const grossUpAmount = grossUpTargetDividend * 0.11;
  const taxableFinancialIncome = totalFinancialIncome + grossUpAmount;
  let generalTax = 0;
  let comparisonTax = 0;
  let finalTax = 0;
  let dividendTaxCredit = 0;
  let withholdingTax = totalFinancialIncome * 0.154;
  let additionalTax = 0;

  if (totalFinancialIncome > THRESHOLD) {
    generalTax = (taxableFinancialIncome - THRESHOLD) * tMarginal + THRESHOLD * 0.14;
    comparisonTax = taxableFinancialIncome * 0.14;
    finalTax = Math.max(generalTax, comparisonTax);
    dividendTaxCredit = Math.min(grossUpAmount, finalTax * 0.1);
    additionalTax = Math.max(finalTax - dividendTaxCredit - withholdingTax, 0);
  }

  return {
    interestIncome: Math.round(interestIncome),
    dividendIncome: Math.round(dividendIncome),
    totalCapitalGains: Math.round(totalCapitalGains),
    totalCapitalLosses: Math.round(totalCapitalLosses),
    netCapitalGains: Math.round(netCapitalGains),
    foreignCapitalGainsTax,
    domesticMajorShareholderTax: Math.round(domesticMajorShareholderTax),
    capitalGainsTax,
    totalFinancialIncome: Math.round(totalFinancialIncome),
    grossUpAmount: Math.round(grossUpAmount),
    taxableFinancialIncome: Math.round(taxableFinancialIncome),
    generalTax: Math.round(generalTax),
    comparisonTax: Math.round(comparisonTax),
    finalTax: Math.round(finalTax),
    dividendTaxCredit: Math.round(dividendTaxCredit),
    withholdingTax: Math.round(withholdingTax),
    additionalTax: Math.round(additionalTax),
    tMarginal,
    isOverThreshold: totalFinancialIncome > THRESHOLD,
    breakdown: breakdown.sort((a, b) => b.annualIncome - a.annualIncome),
    capitalGainsBreakdown,
    majorShareholderWarning: majorShareholderItems.length > 0,
    majorShareholderItems,
    updatedAt: Date.now(),
  };
}

/**
 * proxy-finance API 응답에서 배당 데이터 추출
 */
export function extractDividendFromYahoo(yahooJson: Record<string, unknown>): {
  dividendYield?: number;
  trailingAnnualDividendRate?: number;
} {
  // 1. root (proxy-finance 에서 추가한 값)
  let dy = yahooJson?.dividendYield;
  let tadr = yahooJson?.trailingAnnualDividendRate;

  // 2. chart.result[0].meta fallback
  if (typeof dy !== "number" || typeof tadr !== "number") {
    const results = (yahooJson?.chart as Record<string, unknown>)?.result as Record<string, unknown>[] | undefined;
    const m = (results?.[0]?.meta ?? {}) as Record<string, unknown>;
    
    if (typeof dy !== "number") dy = m?.dividendYield;
    if (typeof tadr !== "number") tadr = m?.trailingAnnualDividendRate;
  }

  return {
    dividendYield: typeof dy === "number" && dy > 0 ? dy : undefined,
    trailingAnnualDividendRate: typeof tadr === "number" && tadr > 0 ? tadr : undefined,
  };
}
