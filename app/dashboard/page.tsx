"use client";

import { useState } from "react";
import Tuner from "../components/ui-portfolio/Tuner";
import ProductCard from "../components/ui-portfolio/ProductCard";
import StressChart from "../components/ui-portfolio/StressChart";
import Compare from "../components/ui-portfolio/Compare";

const NAVY = "#0D2B5E";
const GOLD = "#C9A84C";

const tabs = [
  { id: "tuner", label: "포트폴리오 조율기", desc: "투자 조건 설정" },
  { id: "products", label: "상품 추천", desc: "TOP 4 상품 추천" },
  { id: "stress", label: "스트레스 테스트", desc: "시나리오 분석" },
  { id: "compare", label: "포트폴리오 비교", desc: "기존안과 신규안 비교" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("tuner");
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", fontFamily: "sans-serif", display: "flex" }}>
      <nav style={{ width: 180, minHeight: "100vh", background: NAVY, padding: "32px 12px", flexShrink: 0 }}>
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 20, marginBottom: 20 }}>
          <p style={{ color: GOLD, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Samsung Securities</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>신규 포트폴리오 산출</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tabs.map((tab, i) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "14px 12px", border: "none", cursor: "pointer", textAlign: "left", borderRadius: 8, background: activeTab === tab.id ? "rgba(255,255,255,0.12)" : "transparent", borderLeft: activeTab === tab.id ? `3px solid ${GOLD}` : "3px solid transparent" }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.5)", marginBottom: 2 }}>{i + 1}. {tab.label}</span>
              <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{tab.desc}</span>
            </button>
          ))}
        </div>
      </nav>
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeTab === "tuner" && <Tuner />}
        {activeTab === "products" && <ProductCard />}
        {activeTab === "stress" && <StressChart />}
        {activeTab === "compare" && <Compare />}
      </div>
    </div>
  );
}