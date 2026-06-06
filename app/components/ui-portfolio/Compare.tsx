"use client";

import { useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const NAVY = "#0D2B5E";
const GOLD = "#C9A84C";

const PERSONAS = [
  {
    name: "김준호 (35세, 공격형)",
    existing: { growth: 60, income: 10, hedge: 20, taxLiq: 10 },
    newP: { growth: 65, income: 5, hedge: 10, taxLiq: 20 },
    metrics: {
      existing: { return: "9.8%", vol: "18.2%", sharpe: "0.37", mdd: "28.5%" },
      newP: { return: "12.1%", vol: "15.4%", sharpe: "0.59", mdd: "22.1%" },
    },
    insight: "자사주 매매 제한으로 직접 투자가 불가한 기존 포트폴리오를 AI·반도체 밸류체인 중심의 일임형 랩으로 전환. ISA 계좌 활용 비중 확대를 통해 금융소득종합과세 부담을 구조적으로 완화.",
    llmSummary: `고객님의 포트폴리오를 종합 분석한 결과, 기존 포트폴리오 대비 기대수익률이 9.8%에서 12.1%로 약 2.3%p 개선되었습니다.

위험 조정 수익률(샤프지수)은 0.37에서 0.59로 크게 향상되어, 단위 리스크당 수익 효율이 개선되었습니다. 최대낙폭(MDD)은 28.5%에서 22.1%로 축소되어 하방 위험이 완화되었습니다.

금리 100bp 인상 시나리오에서 신규 포트폴리오의 예상 손실률은 기존 대비 약 40% 감소합니다. 이는 AI·반도체 랩의 분산 효과와 ISA 계좌 절세 구조가 복합적으로 작용한 결과입니다.

세후 관점에서 금융소득종합과세 절세 효과로 연간 실수령액이 추가로 개선될 것으로 예상됩니다. 다만 공격적 성향의 포트폴리오 특성상, 단기 시장 변동성에 대한 모니터링을 권장드립니다.`,
  },
  {
    name: "박서현 (47세, 중립형)",
    existing: { growth: 20, income: 50, hedge: 15, taxLiq: 15 },
    newP: { growth: 20, income: 35, hedge: 15, taxLiq: 30 },
    metrics: {
      existing: { return: "5.1%", vol: "8.4%", sharpe: "0.25", mdd: "12.3%" },
      newP: { return: "7.2%", vol: "7.1%", sharpe: "0.59", mdd: "9.8%" },
    },
    insight: "안전 자산 편중으로 벤치마크 대비 수익률이 부진한 기존 포트폴리오에 일임형 랩을 편입하여 주도주 노출도를 확보. 2년 후 확정 예정인 유학 자금을 달러 표시 타겟만기 채권으로 분리 운용하여 환율 변동 리스크를 사전 차단.",
    llmSummary: `고객님의 포트폴리오를 종합 분석한 결과, 기존 대비 기대수익률이 5.1%에서 7.2%로 개선되면서도 변동성은 8.4%에서 7.1%로 오히려 감소하는 효율적 구조가 확인되었습니다.

샤프지수가 0.25에서 0.59로 대폭 향상된 점이 핵심입니다. 이는 인컴 자산 비중 최적화와 달러 헷지 전략이 동시에 작용한 결과입니다.

2년 후 예정된 유학 자금 3억 원은 달러 타겟만기 채권으로 분리 운용되어, 환율 급등 시나리오(+200원)에서도 원화 기준 손실 없이 목표 금액을 확보할 수 있습니다.

병원 고정비 대응을 위한 월지급식 배당 랩의 예상 연간 현금흐름은 약 3,800만 원으로 산출됩니다. 금융소득종합과세 부담도 구조적으로 완화되어 세후 실수령액이 개선될 전망입니다.`,
  },
  {
    name: "이재형 (65세, 안정형)",
    existing: { growth: 5, income: 15, hedge: 20, taxLiq: 60 },
    newP: { growth: 5, income: 15, hedge: 20, taxLiq: 60 },
    metrics: {
      existing: { return: "3.2%", vol: "4.1%", sharpe: "0.05", mdd: "6.2%" },
      newP: { return: "4.0%", vol: "3.8%", sharpe: "0.26", mdd: "5.1%" },
    },
    insight: "부동산 및 예금 중심의 기존 자산을 만기 10년 이상 국고채 분리과세 상품으로 전환하여 세율을 합법적으로 절감. 이자 지급 주기를 월 단위로 설계하여 생활비 현금흐름을 안정적으로 확보.",
    llmSummary: `고객님의 포트폴리오를 종합 분석한 결과, 원금 보전을 최우선으로 하면서도 세후 실질 수익률을 3.2%에서 4.0%로 개선하는 구조가 완성되었습니다.

가장 핵심적인 변화는 세금 구조 개선입니다. 장기 국고채 분리과세 신청을 통해 적용 세율이 49.5%에서 30%로 낮아져, 동일한 표면 수익률에서도 세후 실수령액이 약 19.5%p 증가합니다.

월 단위 이자 지급 설계로 생활비(월 1,000만 원) 현금흐름이 안정적으로 확보됩니다. 4대 위기 시나리오 모두에서 MDD가 6.2%에서 5.1%로 축소되어 원금 보전 목표에 부합합니다.

증여 계획과 연계하여 유언대용신탁 구조를 활용하면, 자녀 세대로의 자산 이전 과정에서 증여세 부담을 추가로 완화할 수 있습니다.`,
  },
];

const BUCKET_COLORS: Record<string, string> = {
  growth: "#3B82F6", income: GOLD, hedge: "#10B981", taxLiq: "#8B5CF6"
};
const BUCKET_LABELS: Record<string, string> = {
  growth: "자본 증식", income: "인컴 창출", hedge: "위험 헷지", taxLiq: "절세·유동성"
};

function getLineData(existing: Record<string, number>, newP: Record<string, number>) {
  let e = 100, n = 100;
  const eReturn = (existing.growth * 0.10 + existing.income * 0.06 + existing.hedge * 0.04 + existing.taxLiq * 0.03) / 100;
  const nReturn = (newP.growth * 0.12 + newP.income * 0.07 + newP.hedge * 0.05 + newP.taxLiq * 0.035) / 100;
  return Array.from({ length: 6 }, (_, y) => {
    const row = { year: `${2019 + y}년`, 기존: Math.round(e), 신규: Math.round(n) };
    e *= 1 + eReturn;
    n *= 1 + nReturn;
    return row;
  });
}

export default function Compare() {
  const [activePersona, setActivePersona] = useState(0);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmVisible, setLlmVisible] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const p = PERSONAS[activePersona];
  const lineData = getLineData(p.existing, p.newP);

  function handleLLM() {
    setLlmVisible(false);
    setLlmLoading(true);
    setTimeout(() => {
      setLlmLoading(false);
      setLlmVisible(true);
    }, 2000);
  }

  async function handlePDF() {
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`포트폴리오_비교_${p.name}.pdf`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "32px 24px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ color: NAVY, fontSize: 22, fontWeight: 700 }}>포트폴리오 비교</h1>
          <button onClick={handlePDF} style={{ padding: "10px 20px", background: NAVY, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            PDF 저장
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {PERSONAS.map((per, i) => (
            <button key={i} onClick={() => { setActivePersona(i); setLlmVisible(false); }} style={{
              padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
              border: `2px solid ${activePersona === i ? NAVY : "#e5e7eb"}`,
              background: activePersona === i ? NAVY : "#fff",
              color: activePersona === i ? "#fff" : "#374151",
            }}>{per.name}</button>
          ))}
        </div>

        <div ref={printRef}>
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
            <span style={{ color: NAVY, fontWeight: 700, fontSize: 12 }}>포트폴리오 전환 핵심: </span>
            <span style={{ color: "#1e40af", fontSize: 12 }}>{p.insight}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="compare-grid">
            {[
              { title: "기존 포트폴리오", alloc: p.existing, metrics: p.metrics.existing, border: "#94a3b8" },
              { title: "신규 포트폴리오", alloc: p.newP, metrics: p.metrics.newP, border: GOLD },
            ].map((side, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", borderTop: `3px solid ${side.border}` }}>
                <h2 style={{ color: NAVY, fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{side.title}</h2>
                <div style={{ marginBottom: 16 }}>
                  {Object.entries(side.alloc).map(([key, val]) => (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: "#6b7280" }}>{BUCKET_LABELS[key]}</span>
                        <span style={{ color: BUCKET_COLORS[key], fontWeight: 700 }}>{val}%</span>
                      </div>
                      <div style={{ background: "#e9ecef", borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${val}%`, height: "100%", background: BUCKET_COLORS[key], borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "기대수익률", value: side.metrics.return, color: "#3B82F6" },
                    { label: "변동성", value: side.metrics.vol, color: GOLD },
                    { label: "샤프지수", value: side.metrics.sharpe, color: "#10B981" },
                    { label: "MDD", value: side.metrics.mdd, color: "#EF4444" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 3 }}>{m.label}</div>
                      <div style={{ color: m.color, fontSize: 16, fontWeight: 700 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", marginBottom: 20 }}>
            <h3 style={{ color: NAVY, fontSize: 14, fontWeight: 700, marginBottom: 20 }}>누적 수익률 비교 (기준: 100)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="기존" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="신규" stroke={GOLD} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* LLM 종합 해설 */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ color: NAVY, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>AI 종합 해설</h3>
                <p style={{ color: "#9ca3af", fontSize: 11 }}>포트폴리오 지표, 스트레스 테스트, 세후 수익률을 종합한 맞춤 해설</p>
              </div>
              <button onClick={handleLLM} style={{
                padding: "10px 20px", background: llmLoading ? "#94a3b8" : GOLD,
                color: "#fff", border: "none", borderRadius: 8, cursor: llmLoading ? "not-allowed" : "pointer",
                fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8
              }}>
                {llmLoading ? (
                  <>
                    <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    분석 중...
                  </>
                ) : "AI 해설 생성"}
              </button>
            </div>

            {llmVisible && (
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: 20, border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ background: GOLD, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#fff", fontWeight: 700 }}>AI 분석</div>
                  <span style={{ color: "#9ca3af", fontSize: 11 }}>{p.name} 포트폴리오 기준</span>
                </div>
                <p style={{ color: "#374151", fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-line" }}>
                  {p.llmSummary}
                </p>
              </div>
            )}

            {!llmVisible && !llmLoading && (
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: 24, textAlign: "center", border: "1px dashed #e5e7eb" }}>
                <p style={{ color: "#9ca3af", fontSize: 13 }}>AI 해설 생성 버튼을 클릭하면 고객 맞춤 종합 해설이 생성됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}