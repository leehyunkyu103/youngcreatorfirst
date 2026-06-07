"use client";

import { ClipboardList, Sparkles, WalletCards } from "lucide-react";
import { useCustomerContext } from "../CustomerContext";
import { Panel, TextAreaField, ResultCard, ResultGrid, Metric } from "../ui";

export default function Tab4Page() {
  const { formData, riskResult, warnings, internalJsonPayload, setRrttllu, financialCompletion, rrttlluCompletion } = useCustomerContext();

  return (
    <>
      <header className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-samsung">Samsung Securities PB Advisory</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal text-navy md:text-3xl">포트폴리오 비교</h1>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="기본 정보" value={`${financialCompletion}%`} />
            <Metric label="RRTTLLU" value={`${rrttlluCompletion}%`} />
            <Metric label="Risk 점수" value={`${riskResult.score}/100`} />
            <Metric label="경고" value={`${warnings.length}개`} strong />
          </div>
        </div>
      </header>

      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <ResultCard icon={<WalletCards size={18} />} title="기존 포트폴리오" accent="slate">
            <ResultGrid rows={[["보유/처분 계획", formData.rrttllu.holdingOrDisposalPlan || "입력 대기"], ["비선호 자산", formData.rrttllu.avoidedAssets || "입력 대기"], ["유동성 필요", formData.rrttllu.lumpSumPlan || "입력 대기"], ["비상예비자금", formData.rrttllu.emergencyReservePlan || "입력 대기"], ["Tax 알림", internalJsonPayload.rrttllu.tax.financial_income_tax_alert]]} />
          </ResultCard>

          <ResultCard icon={<Sparkles size={18} />} title="신규 포트폴리오 생성 기준" accent="blue">
            <ResultGrid rows={[["선호 자산", formData.rrttllu.preferredAssets || "입력 대기"], ["위험점수", `${riskResult.score}/100`], ["위험등급", riskResult.level], ["투자 기간", formData.rrttllu.timeHorizon || "미선택"]]} />
          </ResultCard>
        </div>

        <Panel icon={<ClipboardList size={18} />} eyebrow="포트폴리오 비교" title="비교 기준 보완">
          <div className="grid gap-3 md:grid-cols-2">
            <TextAreaField label="기존 자산 운용 계획" value={formData.rrttllu.holdingOrDisposalPlan} placeholder="예. 기존 주식은 유지, 임대 부동산은 매각 검토" onChange={(v) => setRrttllu("holdingOrDisposalPlan", v)} />
            <TextAreaField label="신규안에서 우선 반영할 자산" value={formData.rrttllu.preferredAssets} placeholder="예. 미국 배당 ETF, 월지급식 상품" onChange={(v) => setRrttllu("preferredAssets", v)} />
          </div>
        </Panel>
      </div>
    </>
  );
}
