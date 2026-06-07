"use client";

import { AlertTriangle, BarChart3, ClipboardList, LockKeyhole, PieChart, ShieldCheck, Sparkles, WalletCards, ChevronDown } from "lucide-react";
import { useCustomerContext } from "../CustomerContext";
import { riskLevelColor, fieldGroups, returnOptions, riskExperienceOptions, formatChangeDate, expectedReturnDisplay, irregularIncomeDisplay } from "../CustomerContext";
import { Panel, TextField, TextAreaField, IncomeWithNoneField, ExpectedReturnField, ChoiceGroup, MultiChoiceGroup, ResultCard, ResultGrid, Highlight, Metric, LiquiditySummary } from "../ui";

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

function EditableField({ label, value, placeholder, widthClassName = "w-32", onChange }: { label: string; value: string; placeholder?: string; widthClassName?: string; onChange: (value: string) => void }) {
  return (
    <label className={`block ${widthClassName}`}>
      <span className="mb-1 block text-xs font-bold text-samsung">[{label}]</span>
      <input className="h-11 min-w-0 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-navy transition placeholder:text-slate-400 hover:border-slate-300 focus:border-samsung" value={value} placeholder={placeholder ?? "입력 대기"} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function Tab1Page() {
  const {
    formData, riskResult, financialCompletion, rrttlluCompletion, warnings,
    liquiditySummary, analysisRequested, confirmedRiskResult, changeHistory,
    changeHistoryExpanded, internalJsonPayload,
    setFinancial, setRrttllu, setIrregularIncome, toggleNoIrregularIncome,
    setExpectedReturn, toggleExpectedReturnUnknown, toggleInvestmentExperience,
    toggleLegalConstraint, analyzeRrttllu, resetSelectedCustomer, setChangeHistoryExpanded,
  } = useCustomerContext();

  return (
    <>
      <header className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-samsung">Samsung Securities PB Advisory</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-navy md:text-3xl">VVIP 고객 지능형 입력부</h1>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="기본 정보" value={`${financialCompletion}%`} />
            <Metric label="RRTTLLU" value={`${rrttlluCompletion}%`} />
            <Metric label="Risk 점수" value={`${riskResult.score}/100`} />
            <Metric label="경고" value={`${warnings.length}개`} strong />
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(430px,0.82fr)]">
        <section className="space-y-5">
          <CustomerInfoCard />
          <Panel icon={<WalletCards size={18} />} eyebrow="기본 재무 정보" title="고객 재무 현황" note="※ 금액은 원화(KRW) 기준으로 입력해주세요.">
            <div className="question-card asset-summary-card rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-800">Q. 현재 자산 현황을 알려주세요.</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">총 자산, 금융자산, 부동산, 부채를 항목별로 입력합니다.</p>
              <div className="asset-detail-grid mt-3 grid gap-3 md:grid-cols-2">
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

          <Panel icon={<BarChart3 size={18} />} eyebrow="RRTTLLU" title="① Return 목표 수익률">
            <ChoiceGroup label="투자 목적은 무엇인가요?" options={returnOptions} value={formData.rrttllu.returnObjective} onChange={(v) => setRrttllu("returnObjective", v)} />
            <ExpectedReturnField value={formData.rrttllu.expectedReturn} unknownSelected={formData.rrttllu.expectedReturnUnknown} onChange={setExpectedReturn} onToggleUnknown={toggleExpectedReturnUnknown} />
          </Panel>

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

          <Panel icon={<ClipboardList size={18} />} eyebrow="RRTTLLU" title="③ Time Horizon 투자 기간">
            <ChoiceGroup label="투자 가능한 기간을 선택해 주세요." options={fieldGroups.timeHorizon} value={formData.rrttllu.timeHorizon} onChange={(v) => setRrttllu("timeHorizon", v)} />
          </Panel>

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

          <Panel icon={<WalletCards size={18} />} eyebrow="RRTTLLU" title="⑤ Liquidity 유동성 필요 시기">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="향후 정기적인 현금흐름 필요" value={formData.rrttllu.regularCashflowNeed} placeholder="예. 20년간 월 생활비 500만 원" onChange={(v) => setRrttllu("regularCashflowNeed", v)} />
              <TextField label="향후 목돈 사용 계획" value={formData.rrttllu.lumpSumPlan} placeholder="예. 5년 후 자녀 유학비 1억원" onChange={(v) => setRrttllu("lumpSumPlan", v)} />
              <TextField label="향후 비상예비자금 확보 계획" value={formData.rrttllu.emergencyReservePlan} placeholder="예. 의료비 등 비상 상황 대비 1억 원" onChange={(v) => setRrttllu("emergencyReservePlan", v)} />
            </div>
            <LiquiditySummary summary={liquiditySummary} />
          </Panel>

          <Panel icon={<LockKeyhole size={18} />} eyebrow="RRTTLLU" title="⑥ Legal 법적 규제">
            <MultiChoiceGroup label="투자 의사결정에 영향을 줄 수 있는 법적/제도적 제약" options={fieldGroups.legal} values={formData.rrttllu.legalConstraints} onToggle={toggleLegalConstraint} />
            {formData.rrttllu.legalConstraints.includes("기타") ? (
              <TextField label="기타 제약 직접 입력" value={formData.rrttllu.legalConstraintOther} placeholder="예. 내부 투자심의 승인 필요" onChange={(v) => setRrttllu("legalConstraintOther", v)} />
            ) : null}
          </Panel>

          <Panel icon={<Sparkles size={18} />} eyebrow="RRTTLLU" title="⑦ Unique Circumstances 고객 고유 상황">
            <div className="grid gap-3 md:grid-cols-2">
              <TextAreaField label="선호하는 자산" value={formData.rrttllu.preferredAssets} placeholder="예. 미국 배당주 ETF, 은퇴 후 안정적 현금흐름" onChange={(v) => setRrttllu("preferredAssets", v)} />
              <TextAreaField label="피하고 싶은 자산" value={formData.rrttllu.avoidedAssets} placeholder="예. 가상자산, 가치 평가가 어려움" onChange={(v) => setRrttllu("avoidedAssets", v)} />
            </div>
            <TextAreaField label="계속 보유하거나 향후 처분할 계획" value={formData.rrttllu.holdingOrDisposalPlan} placeholder="예. 삼성전자 10억 원은 계속 보유, 1년 내 임대용 부동산 매각" onChange={(v) => setRrttllu("holdingOrDisposalPlan", v)} />
            <TextAreaField label="기타" value={formData.rrttllu.uniqueOther} placeholder="예. 투자 의사결정에 영향을 줄 수 있는 가족 상황, 선호 상담 방식 등" onChange={(v) => setRrttllu("uniqueOther", v)} />
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">선호 자산은 추천 시 우선 고려하고, 비선호 자산은 추천 후보에서 제외하거나 최대 비중 0% 제한 조건으로 저장됩니다.</div>
          </Panel>
        </section>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-48px)] xl:overflow-auto xl:pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-samsung px-4 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-[#1b35bd]" onClick={analyzeRrttllu}>
              <BarChart3 size={17} /> 재분석
            </button>
            <button className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-soft transition hover:border-slate-400 hover:bg-slate-50" onClick={resetSelectedCustomer}>
              <AlertTriangle size={17} /> 초기화
            </button>
          </div>

          <ResultCard icon={<WalletCards size={18} />} title="기본 재무 정보 요약 카드" accent="blue">
            <ResultGrid rows={[["총 자산", formData.financial.totalAssets || "입력 대기"], ["금융자산", formData.financial.financialAssets || "입력 대기"], ["향후 주요 자금 유입", irregularIncomeDisplay(formData.financial)], ["부동산", formData.financial.realEstate || "입력 대기"], ["부채", formData.financial.debt || "입력 대기"], ["필요자금", liquiditySummary.requiredDisplay], ["투자 가능 자산", liquiditySummary.investableDisplay]]} />
            <p className="mt-3 text-sm text-slate-600">입력값은 실시간으로 요약에 반영됩니다.</p>
          </ResultCard>

          <ResultCard icon={<ClipboardList size={18} />} title="RRTTLLU 분석 결과 카드" accent="green">
            <div className="grid gap-2 text-sm">
              <Highlight label="Return" value={formData.rrttllu.returnObjective || "미선택"} />
              <Highlight label="기대수익률" value={expectedReturnDisplay(formData.rrttllu)} />
              <Highlight label="Risk 핵심 태도" value={formData.rrttllu.riskAttitude || "미선택"} />
              <Highlight label="Time Horizon" value={formData.rrttllu.timeHorizon || "미선택"} />
              <Highlight label="Unique 제약" value={formData.rrttllu.preferredAssets || "선호 자산 입력 대기"} />
            </div>
            {analysisRequested ? <p className="mt-3 text-sm text-slate-600">RRTTLLU 분석 결과가 갱신되었습니다.</p> : null}
          </ResultCard>

          <ResultCard icon={<ShieldCheck size={18} />} title="Risk 점수 및 위험등급 카드" accent="gold">
            <div className="grid gap-3">
              <div className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-100">
                <p className="text-sm font-semibold text-amber-800">위험점수</p>
                <p className="mt-1 text-3xl font-bold text-navy">{riskResult.score}/100</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">위험등급</p>
                <p className={`mt-1 text-2xl font-bold ${riskLevelColor(riskResult.level)}`}>{riskResult.level}</p>
              </div>
              <p className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">{riskResult.interpretation}</p>
              <p className="text-xs font-semibold text-slate-500">{confirmedRiskResult ? `내부 JSON 확정 저장: ${confirmedRiskResult.score}/100, ${confirmedRiskResult.level}` : "선택 즉시 실시간 반영 중"}</p>
            </div>
          </ResultCard>

          <ResultCard icon={<ClipboardList size={18} />} title="변경 이력 카드" accent="blue">
            {changeHistory.length ? (
              <>
                <div className="grid gap-2">
                  {(changeHistoryExpanded ? changeHistory : changeHistory.slice(0, 3)).map((change) => (
                    <div key={`${change.changedAt}-${change.label}`} className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                      <p className="text-sm font-bold leading-6 text-samsung"><span className="mr-2 text-xs text-slate-500">{formatChangeDate(change.changedAt)}</span>{change.label}: {change.before} → {change.after}</p>
                    </div>
                  ))}
                </div>
                {changeHistory.length > 3 ? (
                  <button type="button" onClick={() => setChangeHistoryExpanded((p) => !p)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-bold text-samsung transition hover:bg-blue-50">
                    <ChevronDown size={16} className={`transition ${changeHistoryExpanded ? "rotate-180" : ""}`} />
                    {changeHistoryExpanded ? "접기" : "더 보기"}
                  </button>
                ) : null}
              </>
            ) : (
              <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">변경된 정보가 없습니다.</p>
            )}
          </ResultCard>

          <ResultCard icon={<AlertTriangle size={18} />} title="Tax 분석 알림 카드" accent="red">
            <ResultGrid rows={[["이자소득", formData.rrttllu.expectedInterestIncome || "입력 대기"], ["배당소득", formData.rrttllu.expectedDividendIncome || "입력 대기"], ["종합과세 절감", formData.rrttllu.globalTaxImportance || "미선택"], ["해외주식 절감", formData.rrttllu.foreignStockTaxImportance || "미선택"]]} />
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">{internalJsonPayload.rrttllu.tax.financial_income_tax_alert}</p>
          </ResultCard>

          <ResultCard icon={<AlertTriangle size={18} />} title="누락 정보 경고 카드" accent="orange">
            {warnings.length ? (
              <div className="space-y-3">
                <p className="rounded-lg bg-orange-50 px-4 py-3 text-sm font-bold leading-6 text-orange-800">누락된 정보가 있어 정확한 분석이 제한될 수 있습니다.</p>
                <div className="grid gap-2">
                  {warnings.map((w) => <p key={w} className="rounded-lg border border-orange-100 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-700">{w}</p>)}
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">필수 정보가 충분히 입력되었습니다.</p>
            )}
          </ResultCard>

          <p className="rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold leading-6 text-slate-600 shadow-soft">민감 정보는 필수 입력이 아니며, 제공이 어려운 경우 대략적인 범위만 입력하셔도 됩니다.</p>
        </aside>
      </div>
    </>
  );
}
