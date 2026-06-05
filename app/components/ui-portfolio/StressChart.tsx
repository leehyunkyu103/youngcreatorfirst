"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const NAVY = "#0D2B5E";
const GOLD = "#C9A84C";

const scenarios = [
  { id: "rate", label: "금리인상 100bp", 기존: -8.2, 신규: -4.1, desc: "채권 가격 급락, 성장주 하락" },
  { id: "commodity", label: "원자재 인플레", 기존: -12.5, 신규: -6.3, desc: "금/원자재 상승, 주식 하락" },
  { id: "fx", label: "환율급등 +200원", 기존: -9.8, 신규: -5.2, desc: "환노출 해외주식 상승, 국내 하락" },
];

export default function StressChart() {
  const [selected, setSelected] = useState<string[]>(["rate", "commodity", "fx"]);

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  const filtered = scenarios.filter(s => selected.includes(s.id));

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "32px 24px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>신규 포트폴리오 산출</p>
        <h1 style={{ color: NAVY, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>스트레스 테스트</h1>

        {/* 시나리오 선택 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {scenarios.map(s => (
            <button key={s.id} onClick={() => toggle(s.id)}
              style={{
                padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
                border: `2px solid ${selected.includes(s.id) ? NAVY : "#e5e7eb"}`,
                background: selected.includes(s.id) ? NAVY : "#fff",
                color: selected.includes(s.id) ? "#fff" : "#6b7280",
              }}>
              {selected.includes(s.id) ? "✓ " : ""}{s.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#9ca3af", border: "1px solid #e5e7eb" }}>
            시나리오를 1개 이상 선택해주세요.
          </div>
        ) : (
          <>
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", marginBottom: 20 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={filtered} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="기존" fill={NAVY} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="신규" fill={GOLD} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${filtered.length}, 1fr)`, gap: 16 }}>
              {filtered.map(s => (
                <div key={s.id} style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #e5e7eb", borderLeft: `3px solid ${NAVY}` }}>
                  <div style={{ color: NAVY, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 12 }}>{s.desc}</div>
                  <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>
                    기존: <span style={{ color: "#EF4444", fontWeight: 700 }}>{s.기존}%</span>
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>
                    신규: <span style={{ color: "#10B981", fontWeight: 700 }}>{s.신규}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}