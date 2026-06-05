"use client";

import { useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const NAVY = "#0D2B5E";
const GOLD = "#C9A84C";

const existing = {
  name: "기존 포트폴리오",
  return: "5.2%",
  volatility: "12.3%",
  sharpe: "0.18",
  mdd: "18.5%",
  assets: [
    { name: "국내주식", ratio: 40 },
    { name: "해외주식", ratio: 20 },
    { name: "채권", ratio: 30 },
    { name: "현금", ratio: 10 },
  ],
};

const newPortfolio = {
  name: "신규 포트폴리오",
  return: "7.8%",
  volatility: "10.8%",
  sharpe: "0.44",
  mdd: "15.6%",
  assets: [
    { name: "국내주식", ratio: 25 },
    { name: "해외주식", ratio: 35 },
    { name: "채권", ratio: 25 },
    { name: "배당ETF", ratio: 15 },
  ],
};

const lineData = [
  { year: "1년", 기존: 5.2, 신규: 7.8 },
  { year: "3년", 기존: 16.4, 신규: 25.2 },
  { year: "5년", 기존: 28.6, 신규: 45.8 },
  { year: "7년", 기존: 43.1, 신규: 70.2 },
  { year: "10년", 기존: 67.5, 신규: 114.3 },
  { year: "15년", 기존: 110.2, 신규: 198.7 },
  { year: "20년", 기존: 175.8, 신규: 328.4 },
];

export default function Compare() {
  const printRef = useRef<HTMLDivElement>(null);

  async function handlePDF() {
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("포트폴리오_비교.pdf");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "32px 24px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>포트폴리오 비교</p>
            <h1 style={{ color: NAVY, fontSize: 22, fontWeight: 700 }}>기존 vs 신규 포트폴리오</h1>
          </div>
          <button onClick={handlePDF}
            style={{ padding: "10px 20px", background: NAVY, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
            PDF 저장
          </button>
        </div>

        <div ref={printRef}>
          {/* 지표 비교 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            {[existing, newPortfolio].map((p, i) => (
              <div key={p.name} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", borderTop: `3px solid ${i === 0 ? "#94a3b8" : GOLD}` }}>
                <h2 style={{ color: NAVY, fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{p.name}</h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "기대수익률", value: p.return, color: "#3B82F6" },
                    { label: "변동성", value: p.volatility, color: GOLD },
                    { label: "샤프지수", value: p.sharpe, color: "#10B981" },
                    { label: "MDD", value: p.mdd, color: "#EF4444" },
                  ].map(m => (
                    <div key={m.label} style={{ background: "#f8f9fa", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 4 }}>{m.label}</div>
                      <div style={{ color: m.color, fontSize: 20, fontWeight: 700 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ color: NAVY, fontWeight: 600, fontSize: 13, marginBottom: 10 }}>자산 배분</div>
                  {p.assets.map(a => (
                    <div key={a.name} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 12, color: "#6b7280" }}>
                        <span>{a.name}</span><span style={{ fontWeight: 700 }}>{a.ratio}%</span>
                      </div>
                      <div style={{ background: "#e9ecef", borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${a.ratio}%`, height: "100%", background: i === 0 ? NAVY : GOLD, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 수익률 라인차트 */}
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
            <h3 style={{ color: NAVY, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>누적 수익률 비교 (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="기존" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="신규" stroke={GOLD} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}