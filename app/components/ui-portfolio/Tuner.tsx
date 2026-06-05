"use client";

import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

const NAVY = "#0D2B5E";
const GOLD = "#C9A84C";

function getBacktestData(er: number) {
  const data = [];
  let existing = 100;
  let newP = 100;
  for (let y = 0; y <= 5; y++) {
    data.push({ year: `${2019 + y}년`, 기존: Math.round(existing), 신규: Math.round(newP) });
    existing *= 1 + 0.052;
    newP *= 1 + er;
  }
  return data;
}

export default function Tuner() {
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState(10);
  const [growth, setGrowth] = useState(40);
  const [income, setIncome] = useState(40);
  const [safe, setSafe] = useState(20);

  const er = (growth * 0.12 + income * 0.06 + safe * 0.03) / 100;
  const vol = (growth * 0.18 + income * 0.08 + safe * 0.02) / 100;
  const sharpe = vol > 0 ? ((er - 0.03) / vol).toFixed(2) : "0.00";
  const mdd = (growth * 0.25 + income * 0.12 + safe * 0.04) / 100;
  const warnOrange = years <= 2 && growth >= 50;
  const warnRed = safe < 10;
  const pieData = [
    { name: "성장", value: growth, color: "#3B82F6" },
    { name: "인컴", value: income, color: GOLD },
    { name: "안전", value: safe, color: "#10B981" },
  ];
  const backtestData = getBacktestData(er);

  function handleGrowth(v: number) {
    const rem = 100 - v; const tot = income + safe;
    if (tot === 0) { setGrowth(v); setIncome(50); setSafe(50); return; }
    const ni = Math.round((income / tot) * rem);
    setGrowth(v); setIncome(ni); setSafe(rem - ni);
  }
  function handleIncome(v: number) {
    const rem = 100 - v; const tot = growth + safe;
    if (tot === 0) { setIncome(v); setGrowth(50); setSafe(50); return; }
    const ng = Math.round((growth / tot) * rem);
    setIncome(v); setGrowth(ng); setSafe(rem - ng);
  }
  function handleSafe(v: number) {
    const rem = 100 - v; const tot = growth + income;
    if (tot === 0) { setSafe(v); setGrowth(50); setIncome(50); return; }
    const ng = Math.round((growth / tot) * rem);
    setSafe(v); setGrowth(ng); setIncome(rem - ng);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "32px 24px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>신규 포트폴리오 산출</p>
        <h1 style={{ color: NAVY, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>포트폴리오 조율기</h1>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 300, background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: NAVY, fontWeight: 600, fontSize: 13, display: "block", marginBottom: 6 }}>투자 금액 (원)</label>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="예: 100,000,000"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: "#f9fafb" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: NAVY, fontWeight: 600, fontSize: 13, display: "block", marginBottom: 6 }}>
                투자 기간: <span style={{ color: GOLD }}>{years}년</span>
              </label>
              <input type="range" min={1} max={20} value={years} onChange={(e) => setYears(Number(e.target.value))} style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                <span>1년</span><span>20년</span>
              </div>
            </div>
            {[
              { label: "성장 자산", value: growth, color: "#3B82F6", handler: handleGrowth },
              { label: "인컴 자산", value: income, color: GOLD, handler: handleIncome },
              { label: "안전 자산", value: safe, color: "#10B981", handler: handleSafe },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 18 }}>
                <label style={{ color: NAVY, fontWeight: 600, fontSize: 13, display: "block", marginBottom: 6 }}>
                  {item.label}: <span style={{ color: item.color }}>{item.value}%</span>
                </label>
                <input type="range" min={0} max={100} value={item.value}
                  onChange={(e) => item.handler(Number(e.target.value))} style={{ width: "100%" }} />
              </div>
            ))}
            {warnOrange && (
              <div style={{ background: "#FFF3CD", border: "1px solid #FFC107", borderRadius: 8, padding: "10px 12px", color: "#856404", fontSize: 13, marginTop: 8 }}>
                ⚠️ 투자기간 2년 이하 + 성장 50% 이상은 고위험 조합입니다.
              </div>
            )}
            {warnRed && (
              <div style={{ background: "#FFE0E0", border: "1px solid #EF4444", borderRadius: 8, padding: "10px 12px", color: "#991B1B", fontSize: 13, marginTop: 8 }}>
                🚨 안전 자산 10% 미만은 매우 위험합니다.
              </div>
            )}
          </div>
          <div style={{ width: 260, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "기대수익률", value: `${(er * 100).toFixed(1)}%`, color: "#3B82F6" },
              { label: "변동성", value: `${(vol * 100).toFixed(1)}%`, color: GOLD },
              { label: "샤프지수", value: sharpe, color: "#10B981" },
              { label: "MDD", value: `${(mdd * 100).toFixed(1)}%`, color: "#EF4444" },
            ].map(m => (
              <div key={m.label} style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#6b7280", fontSize: 12 }}>{m.label}</span>
                <span style={{ color: m.color, fontSize: 20, fontWeight: 700 }}>{m.value}</span>
              </div>
            ))}
            <div style={{ background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
              <p style={{ color: NAVY, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>자산 배분</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 백테스팅 선형 그래프 */}
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
          <p style={{ color: "#6b7280", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>백테스팅 시뮬레이션</p>
          <h3 style={{ color: NAVY, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>최근 5년 누적 수익률 비교 (기준: 100)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={backtestData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
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
      </div>
    </div>
  );
}