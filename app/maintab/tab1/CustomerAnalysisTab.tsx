"use client";

import { BarChart3, ClipboardList, LockKeyhole, PieChart, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useCustomerContext } from "../CustomerContext";
import { fieldGroups, returnOptions, riskExperienceOptions } from "../CustomerContext";
import { Panel, TextField, TextAreaField, IncomeWithNoneField, ExpectedReturnField, ChoiceGroup, MultiChoiceGroup, LiquiditySummary } from "../ui";

// ── Editable customer fields ─────────────────────────────────────────────────
function EditableField({
  label, value, placeholder, widthClassName = "w-32", onChange,
}: {
  label: string; value: string; placeholder?: string; widthClassName?: string; onChange: (value: string) => void;
}) {
  return (
    <label className={`block ${widthClassName}`}>
      <span className="mb-1 block text-xs font-bold text-samsung">[{label}]</span>
      <input
        className="h-11 min-w-0 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-navy transition placeholder:text-slate-400 hover:border-slate-300 focus:border-samsung"
        value={value}
        placeholder={placeholder ?? "입력 대기"}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function CustomerInfoCard() {
  const { selectedCustomerProfile, updateCustomerProfile } = useCustomerContext();
  const profile = selectedCustomerProfile;
  return (
    <section className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-soft">
      <div className="flex flex-wrap items-end gap-3">
        <EditableField label="성명" value={profile.name} onChange={(v) => updateCustomerProfile("name", v)} />
        <EditableField label="성별" value={profile.gender} onChange={(v) => updateCustomerProfile("gender", v)} />
        <div className="flex flex-wrap gap-2">
          <EditableField label="출생연도" value={profile.birth_year ?? profile.birthYear} placeholder="입력 대기" onChange={(v) => updateCustomerProfile("birthYear", v)} />
          <EditableField label="만 나이" value={profile.age} placeholder="입력 대기" onChange={(v) => updateCustomerProfile("age", v)} />
        </div>
        <EditableField label="직업" value={profile.job} widthClassName="w-80 max-w-full" onChange={(v) => updateCustomerProfile("job", v)} />
      </div>
    </section>
  );
}

// ── 고객 성향 분석 탭 메인 컴포넌트 ────────────────────────────────────────
export default function CustomerAnalysisTab() {
  const {
    formData, liquiditySummary,
    setFinancial, setRrttllu, setIrregularIncome, toggleNoIrregularIncome,
    setExpectedReturn, toggleExpectedReturnUnknown, toggleInvestmentExperience,
    toggleLegalConstraint, analyzeRrttllu, resetSelectedCustomer,
  } = useCustomerContext();

  return (
    <div className="space-y-5">
      <CustomerInfoCard />

      {/* 헤더 액션 버튼 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-samsung px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-[#1b35bd]"
          onClick={analyzeRrttllu}
        >
          <BarChart3 size={17} /> 재분석
        </button>
        <button
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-soft transition hover:border-slate-400 hover:bg-slate-50"
          onClick={resetSelectedCustomer}
        >
          초기화
        </button>
      </div>

      {/* 기본 재무 정보 */}
      <Panel icon={<WalletCards size={18} />} eyebrow="기본 재무 정보" title="고객 재무 현황" note="※ 금액은 원화(KRW) 기준으로 입력해주세요.">
        <div className="question-card asset-summary-card rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-800">Q. 현재 자산 현황을 알려주세요.</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">총 자산, 금융자산, 부동산, 부채를 항목별로 입력합니다.</p>
          <div className="asset-detail-grid mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <TextField compact label="총 자산" value={formData.financial.totalAssets} placeholder="예. 20억 원" onChange={(v) => setFinancial("totalAssets", v)} />
            <TextField compact label="금융자산" value={formData.financial.financialAssets} placeholder="예. 8억 원" onChange={(v) => setFinancial("financialAssets", v)} />
            <TextField compact label="부동산" value={formData.financial.realEstate} placeholder="예. 15억 원" onChange={(v) => setFinancial("realEstate", v)} />
            <TextField compact label="부채" value={formData.financial.debt} placeholder="예. 3억 원" onChange={(v) => setFinancial("debt", v)} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <TextField label="(가구 기준) 연 고정소득" value={formData.financial.annualFixedIncome} placeholder="예. 3억 원~5억 원" onChange={(v) => setFinancial("annualFixedIncome", v)} />
          <TextField label="(가구 기준) 월 고정지출" value={formData.financial.monthlyFixedExpense} placeholder="예. 500만 원~1,000만 원" onChange={(v) => setFinancial("monthlyFixedExpense", v)} />
        </div>
        <IncomeWithNoneField label="향후 예상되는 비정기 소득" value={formData.financial.irregularIncome} placeholder="예. 연 성과급 6~7억 원, 3년 내 스톡옵션 행사" noneSelected={formData.financial.irregularIncomeNone} onChange={setIrregularIncome} onToggleNone={toggleNoIrregularIncome} />
      </Panel>

      {/* ① Return */}
      <Panel icon={<BarChart3 size={18} />} eyebrow="RRTTLLU" title="① Return 목표 수익률">
        <ChoiceGroup label="투자 목적은 무엇인가요?" options={returnOptions} value={formData.rrttllu.returnObjective} onChange={(v) => setRrttllu("returnObjective", v)} />
        <ExpectedReturnField value={formData.rrttllu.expectedReturn} unknownSelected={formData.rrttllu.expectedReturnUnknown} onChange={setExpectedReturn} onToggleUnknown={toggleExpectedReturnUnknown} />
      </Panel>

      {/* ② Risk */}
      <Panel icon={<ShieldCheck size={18} />} eyebrow="RRTTLLU" title="② Risk 위험 허용도">
        <MultiChoiceGroup label="투자 경험이 있는 금융상품을 모두 선택해주세요." options={riskExperienceOptions} values={formData.rrttllu.investmentExperience} onToggle={toggleInvestmentExperience} />
        <ChoiceGroup label="투자 지식 수준은 어느 정도인가요?" options={fieldGroups.knowledge} value={formData.rrttllu.knowledgeLevel} onChange={(v) => setRrttllu("knowledgeLevel", v)} />
        <ChoiceGroup label="파생상품 투자 경험이 있으신가요?" description="파생상품: 파생상품, 원금비보장형 파생결합 증권, 파생상품펀드, 레버리지/인버스 ETF 등" options={fieldGroups.derivatives} value={formData.rrttllu.derivativesExperience} onChange={(v) => setRrttllu("derivativesExperience", v)} />
        <div className="risk-ratio-grid grid gap-4 lg:grid-cols-2">
          <ChoiceGroup cardClassName="risk-mobile-gray" label="총 자산 중 금융자산의 비중" description="금융자산: 예·적금, CMA, 투자자산(주식·채권·펀드·ETF 등) 등" options={fieldGroups.financialAssetRatio} value={formData.rrttllu.financialAssetRatio} onChange={(v) => setRrttllu("financialAssetRatio", v)} />
          <ChoiceGroup cardClassName="risk-mobile-blue" label="금융자산 중 투자자산의 비중" description="투자자산: 주식, ETF, 펀드, 채권, 리츠(REITs), ELS 등" options={fieldGroups.investmentAssetRatio} value={formData.rrttllu.investmentAssetRatio} onChange={(v) => setRrttllu("investmentAssetRatio", v)} />
        </div>
        <ChoiceGroup cardClassName="risk-mobile-gray" label="기대이익 및 기대손실 등을 고려한 위험에 대한 태도" options={fieldGroups.riskAttitude} value={formData.rrttllu.riskAttitude} onChange={(v) => setRrttllu("riskAttitude", v)} />
        <ChoiceGroup cardClassName="risk-mobile-blue" label="단기적으로 손실이 초과 발생할 때 대응" options={fieldGroups.lossResponse} value={formData.rrttllu.lossResponse} onChange={(v) => setRrttllu("lossResponse", v)} />
      </Panel>

      {/* ③ Time Horizon */}
      <Panel icon={<ClipboardList size={18} />} eyebrow="RRTTLLU" title="③ Time Horizon 투자 기간">
        <ChoiceGroup label="투자 가능한 기간을 선택해 주세요." options={fieldGroups.timeHorizon} value={formData.rrttllu.timeHorizon} onChange={(v) => setRrttllu("timeHorizon", v)} />
      </Panel>

      {/* ④ Tax */}
      <Panel icon={<PieChart size={18} />} eyebrow="RRTTLLU" title="④ Tax 세금 요인">
        <div className="grid gap-3 md:grid-cols-2">
          <TextField tone="blue" label="올해 예상 이자소득" value={formData.rrttllu.expectedInterestIncome} placeholder="예. 1,000만 원~2,000만 원" onChange={(v) => setRrttllu("expectedInterestIncome", v)} />
          <TextField tone="gray" label="올해 예상 배당소득" value={formData.rrttllu.expectedDividendIncome} placeholder="예. 1,000만 원 미만" onChange={(v) => setRrttllu("expectedDividendIncome", v)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChoiceGroup tone="gray" label="자녀/가족 사전증여 계획" options={fieldGroups.giftingPlan} value={formData.rrttllu.giftingPlan} onChange={(v) => setRrttllu("giftingPlan", v)} />
          <ChoiceGroup tone="blue" label="금융소득종합과세 절감 중요도" options={fieldGroups.taxImportance} value={formData.rrttllu.globalTaxImportance} onChange={(v) => setRrttllu("globalTaxImportance", v)} />
          <ChoiceGroup tone="blue" label="최근 3년 내 금융소득종합과세 대상 여부" options={fieldGroups.recentTax} value={formData.rrttllu.recentGlobalTaxSubject} onChange={(v) => setRrttllu("recentGlobalTaxSubject", v)} />
          <ChoiceGroup tone="gray" label="해외주식 양도소득세 절감 중요도" options={fieldGroups.taxImportance} value={formData.rrttllu.foreignStockTaxImportance} onChange={(v) => setRrttllu("foreignStockTaxImportance", v)} />
        </div>
      </Panel>

      {/* ⑤ Liquidity */}
      <Panel icon={<WalletCards size={18} />} eyebrow="RRTTLLU" title="⑤ Liquidity 유동성 필요 시기">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <TextField label="향후 정기적인 현금흐름 필요" value={formData.rrttllu.regularCashflowNeed} placeholder="예. 20년간 월 생활비 500만 원" onChange={(v) => setRrttllu("regularCashflowNeed", v)} />
          <TextField label="향후 목돈 사용 계획" value={formData.rrttllu.lumpSumPlan} placeholder="예. 5년 후 자녀 유학비 1억원" onChange={(v) => setRrttllu("lumpSumPlan", v)} />
          <TextField label="향후 비상예비자금 확보 계획" value={formData.rrttllu.emergencyReservePlan} placeholder="예. 의료비 등 비상 상황 대비 1억 원" onChange={(v) => setRrttllu("emergencyReservePlan", v)} />
        </div>
        <LiquiditySummary summary={liquiditySummary} />
      </Panel>

      {/* ⑥ Legal */}
      <Panel icon={<LockKeyhole size={18} />} eyebrow="RRTTLLU" title="⑥ Legal 법적 규제">
        <MultiChoiceGroup label="투자 의사결정에 영향을 줄 수 있는 법적/제도적 제약" options={fieldGroups.legal} values={formData.rrttllu.legalConstraints} onToggle={toggleLegalConstraint} />
        {formData.rrttllu.legalConstraints.includes("기타") ? (
          <TextField label="기타 제약 직접 입력" value={formData.rrttllu.legalConstraintOther} placeholder="예. 내부 투자심의 승인 필요" onChange={(v) => setRrttllu("legalConstraintOther", v)} />
        ) : null}
      </Panel>

      {/* ⑦ Unique */}
      <Panel icon={<Sparkles size={18} />} eyebrow="RRTTLLU" title="⑦ Unique Circumstances 고객 고유 상황">
        <div className="grid gap-3 md:grid-cols-2">
          <TextAreaField label="선호하는 자산" value={formData.rrttllu.preferredAssets} placeholder="예. 미국 배당주 ETF, 은퇴 후 안정적 현금흐름" onChange={(v) => setRrttllu("preferredAssets", v)} />
          <TextAreaField label="피하고 싶은 자산" value={formData.rrttllu.avoidedAssets} placeholder="예. 가상자산, 가치 평가가 어려움" onChange={(v) => setRrttllu("avoidedAssets", v)} />
        </div>
        <TextAreaField label="계속 보유하거나 향후 처분할 계획" value={formData.rrttllu.holdingOrDisposalPlan} placeholder="예. 삼성전자 10억 원은 계속 보유, 1년 내 임대용 부동산 매각" onChange={(v) => setRrttllu("holdingOrDisposalPlan", v)} />
        <TextAreaField label="기타" value={formData.rrttllu.uniqueOther} placeholder="예. 투자 의사결정에 영향을 줄 수 있는 가족 상황, 선호 상담 방식 등" onChange={(v) => setRrttllu("uniqueOther", v)} />
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">선호 자산은 추천 시 우선 고려하고, 비선호 자산은 추천 후보에서 제외하거나 최대 비중 0% 제한 조건으로 저장됩니다.</div>
      </Panel>

      <p className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold leading-6 text-slate-600 shadow-soft">민감 정보는 필수 입력이 아니며, 제공이 어려운 경우 대략적인 범위만 입력하셔도 됩니다.</p>
    </div>
  );
}
