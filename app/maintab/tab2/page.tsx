"use client";

import { AlertTriangle, ClipboardList, ShieldCheck, WalletCards } from "lucide-react";
import { useCustomerContext } from "../CustomerContext";
import { Panel, TextField, TextAreaField, ResultCard, ResultGrid, Metric } from "../ui";

export default function Tab2Page() {
  const { formData, riskResult, warnings, setFinancial, setRrttllu, financialCompletion, rrttlluCompletion } = useCustomerContext();

  return (
    <>
      <header className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-samsung">Samsung Securities PB Advisory</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-navy md:text-3xl">기존 포트폴리오 분석</h1>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="기본 정보" value={`${financialCompletion}%`} />
            <Metric label="RRTTLLU" value={`${rrttlluCompletion}%`} />
            <Metric label="Risk 점수" value={`${riskResult.score}/100`} />
            <Metric label="경고" value={`${warnings.length}개`} strong />
          </div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <section className="space-y-5">
          <Panel icon={<WalletCards size={18} />} eyebrow="기존 포트폴리오 분석" title="보유 자산 정보">
            <TextAreaField label="현재 보유하거나 처분을 검토 중인 자산" value={formData.rrttllu.holdingOrDisposalPlan} placeholder="예. 삼성전자 10억 원 계속 보유, 임대용 부동산 1년 내 매각 검토" onChange={(v) => setRrttllu("holdingOrDisposalPlan", v)} />
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="총 자산" value={formData.financial.totalAssets} placeholder="예. 20억 원" onChange={(v) => setFinancial("totalAssets", v)} />
              <TextField label="금융자산" value={formData.financial.financialAssets} placeholder="예. 8억 원" onChange={(v) => setFinancial("financialAssets", v)} />
            </div>
            <TextAreaField label="피하고 싶은 자산" value={formData.rrttllu.avoidedAssets} placeholder="예. 가상자산, 변동성이 큰 테마형 상품" onChange={(v) => setRrttllu("avoidedAssets", v)} />
          </Panel>

          <Panel icon={<ClipboardList size={18} />} eyebrow="공유 입력" title="포트폴리오 분석에 반영되는 조건">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="향후 목돈 사용 계획" value={formData.rrttllu.lumpSumPlan} placeholder="예. 5년 후 자녀 유학비 1억원" onChange={(v) => setRrttllu("lumpSumPlan", v)} />
              <TextField label="정기 현금흐름 필요" value={formData.rrttllu.regularCashflowNeed} placeholder="예. 20년간 월 생활비 500만 원" onChange={(v) => setRrttllu("regularCashflowNeed", v)} />
              <TextField label="비상예비자금 확보 계획" value={formData.rrttllu.emergencyReservePlan} placeholder="예. 의료비 등 비상 상황 대비 1억 원" onChange={(v) => setRrttllu("emergencyReservePlan", v)} />
            </div>
          </Panel>
        </section>

        <aside className="space-y-5">
          <ResultCard icon={<ShieldCheck size={18} />} title="고객 성향 연동 요약" accent="gold">
            <ResultGrid rows={[["위험점수", `${riskResult.score}/100`], ["위험등급", riskResult.level], ["투자 기간", formData.rrttllu.timeHorizon || "미선택"], ["투자 목적", formData.rrttllu.returnObjective || "미선택"]]} />
          </ResultCard>
          <ResultCard icon={<AlertTriangle size={18} />} title="분석 전 확인 사항" accent={warnings.length ? "orange" : "green"}>
            <p className="text-sm font-semibold leading-6 text-slate-700">
              {warnings.length ? "고객 성향 분석 탭의 누락 정보가 기존 포트폴리오 진단에도 반영됩니다." : "현재 입력된 고객 정보가 기존 포트폴리오 분석에 충분히 반영되어 있습니다."}
            </p>
          </ResultCard>
        </aside>
      </div>
    </>
  );
}
