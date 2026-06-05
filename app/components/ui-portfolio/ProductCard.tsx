"use client";

import { useState } from "react";

const NAVY = "#0D2B5E";
const GOLD = "#C9A84C";

type Product = {
  id: number;
  name: string;
  type: "성장" | "인컴" | "안전";
  risk: "저위험" | "중위험" | "고위험";
  isa: boolean;
  score: number;
  return: number;
  fee: number;
  aum: number;
  currency: "KRW" | "USD";
  taxBenefit: boolean;
  manager: string;
  region: "국내" | "해외" | "글로벌";
};

const allProducts: Product[] = [
  { id: 1, name: "삼성 글로벌 배당 ETF", type: "인컴", risk: "저위험", isa: true, score: 92, return: 7.2, fee: 0.15, aum: 12000, currency: "KRW", taxBenefit: true, manager: "삼성자산운용", region: "글로벌" },
  { id: 2, name: "미국 S&P500 인덱스 펀드", type: "성장", risk: "중위험", isa: false, score: 88, return: 11.3, fee: 0.05, aum: 85000, currency: "USD", taxBenefit: false, manager: "블랙록", region: "해외" },
  { id: 3, name: "국내 우량채 ETF", type: "안전", risk: "저위험", isa: true, score: 85, return: 3.8, fee: 0.12, aum: 9500, currency: "KRW", taxBenefit: true, manager: "KB자산운용", region: "국내" },
  { id: 4, name: "글로벌 리츠 펀드", type: "인컴", risk: "중위험", isa: false, score: 83, return: 6.5, fee: 0.45, aum: 7200, currency: "USD", taxBenefit: false, manager: "미래에셋", region: "글로벌" },
  { id: 5, name: "한국 중소형 성장주 펀드", type: "성장", risk: "고위험", isa: true, score: 78, return: 14.2, fee: 0.8, aum: 3400, currency: "KRW", taxBenefit: true, manager: "한국투자신탁", region: "국내" },
  { id: 6, name: "달러 MMF", type: "안전", risk: "저위험", isa: false, score: 76, return: 2.1, fee: 0.1, aum: 45000, currency: "USD", taxBenefit: false, manager: "삼성자산운용", region: "해외" },
  { id: 7, name: "유럽 배당주 ETF", type: "인컴", risk: "저위험", isa: true, score: 74, return: 5.8, fee: 0.25, aum: 6800, currency: "USD", taxBenefit: true, manager: "뱅가드", region: "해외" },
  { id: 8, name: "나스닥100 ETF", type: "성장", risk: "고위험", isa: false, score: 71, return: 18.4, fee: 0.2, aum: 120000, currency: "USD", taxBenefit: false, manager: "인베스코", region: "해외" },
  { id: 9, name: "단기 국공채 펀드", type: "안전", risk: "저위험", isa: true, score: 69, return: 3.2, fee: 0.08, aum: 22000, currency: "KRW", taxBenefit: true, manager: "NH아문디", region: "국내" },
  { id: 10, name: "아시아 신흥국 펀드", type: "성장", risk: "고위험", isa: false, score: 67, return: 9.8, fee: 0.9, aum: 4100, currency: "USD", taxBenefit: false, manager: "피델리티", region: "해외" },
  { id: 11, name: "글로벌 인프라 펀드", type: "인컴", risk: "중위험", isa: true, score: 65, return: 5.1, fee: 0.55, aum: 5600, currency: "USD", taxBenefit: true, manager: "맥쿼리", region: "글로벌" },
  { id: 12, name: "국내 단기채 ETF", type: "안전", risk: "저위험", isa: false, score: 63, return: 2.8, fee: 0.08, aum: 18000, currency: "KRW", taxBenefit: false, manager: "키움투자자산운용", region: "국내" },
  { id: 13, name: "헬스케어 섹터 ETF", type: "성장", risk: "중위험", isa: true, score: 61, return: 8.4, fee: 0.4, aum: 9200, currency: "USD", taxBenefit: true, manager: "스테이트스트리트", region: "해외" },
  { id: 14, name: "미국 리츠 ETF", type: "인컴", risk: "중위험", isa: false, score: 59, return: 6.1, fee: 0.35, aum: 31000, currency: "USD", taxBenefit: false, manager: "뱅가드", region: "해외" },
  { id: 15, name: "원자재 혼합 펀드", type: "성장", risk: "고위험", isa: true, score: 57, return: 10.2, fee: 0.7, aum: 2800, currency: "USD", taxBenefit: true, manager: "골드만삭스", region: "글로벌" },
  { id: 16, name: "채권혼합 밸런스 펀드", type: "안전", risk: "저위험", isa: false, score: 55, return: 4.1, fee: 0.2, aum: 14000, currency: "KRW", taxBenefit: false, manager: "한화자산운용", region: "국내" },
  { id: 17, name: "일본 배당주 펀드", type: "인컴", risk: "중위험", isa: true, score: 53, return: 4.8, fee: 0.5, aum: 3200, currency: "USD", taxBenefit: true, manager: "노무라", region: "해외" },
  { id: 18, name: "중국 본토 A주 펀드", type: "성장", risk: "고위험", isa: false, score: 51, return: 12.3, fee: 1.0, aum: 5500, currency: "USD", taxBenefit: false, manager: "CSAM", region: "해외" },
  { id: 19, name: "ESG 글로벌 펀드", type: "성장", risk: "중위험", isa: true, score: 49, return: 7.9, fee: 0.45, aum: 8700, currency: "USD", taxBenefit: true, manager: "블랙록", region: "글로벌" },
  { id: 20, name: "단기 회사채 ETF", type: "안전", risk: "저위험", isa: false, score: 47, return: 3.5, fee: 0.18, aum: 11000, currency: "KRW", taxBenefit: false, manager: "삼성자산운용", region: "국내" },
  { id: 21, name: "미국 배당성장 ETF", type: "인컴", risk: "저위험", isa: true, score: 45, return: 6.8, fee: 0.06, aum: 62000, currency: "USD", taxBenefit: true, manager: "뱅가드", region: "해외" },
  { id: 22, name: "글로벌 채권혼합 펀드", type: "안전", risk: "저위험", isa: false, score: 43, return: 3.1, fee: 0.3, aum: 7800, currency: "USD", taxBenefit: false, manager: "PIMCO", region: "글로벌" },
  { id: 23, name: "국내 대형주 액티브 펀드", type: "성장", risk: "중위험", isa: true, score: 41, return: 9.1, fee: 0.75, aum: 4300, currency: "KRW", taxBenefit: true, manager: "미래에셋", region: "국내" },
  { id: 24, name: "글로벌 멀티에셋 펀드", type: "인컴", risk: "중위험", isa: false, score: 39, return: 5.5, fee: 0.6, aum: 9100, currency: "USD", taxBenefit: false, manager: "JP모건", region: "글로벌" },
  { id: 25, name: "국내 ISA 채권형 랩", type: "안전", risk: "저위험", isa: true, score: 37, return: 4.3, fee: 0.25, aum: 6200, currency: "KRW", taxBenefit: true, manager: "삼성증권", region: "국내" },
];

const FILTERS = ["전체", "ISA", "저위험", "중위험", "배당·인컴", "성장", "해외", "국내"];

export default function ProductCard() {
  const [activeFilter, setActiveFilter] = useState("전체");

  const filtered = allProducts.filter(p => {
    if (activeFilter === "전체") return true;
    if (activeFilter === "ISA") return p.isa;
    if (activeFilter === "저위험") return p.risk === "저위험";
    if (activeFilter === "중위험") return p.risk === "중위험";
    if (activeFilter === "배당·인컴") return p.type === "인컴";
    if (activeFilter === "성장") return p.type === "성장";
    if (activeFilter === "해외") return p.region === "해외" || p.region === "글로벌";
    if (activeFilter === "국내") return p.region === "국내";
    return true;
  });

  const top4 = [...filtered].sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", padding: "32px 24px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <p style={{ color: "#6b7280", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>신규 포트폴리오 산출</p>
        <h1 style={{ color: NAVY, fontSize: 22, fontWeight: 700, marginBottom: 24 }}>상품 추천</h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              style={{
                padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
                background: activeFilter === f ? NAVY : "#fff",
                color: activeFilter === f ? "#fff" : "#6b7280",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
              }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
          {top4.map((p, i) => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", borderTop: `3px solid ${i === 0 ? GOLD : NAVY}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ background: i === 0 ? GOLD : NAVY, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>TOP {i + 1}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {p.isa && <span style={{ background: "#EFF6FF", color: NAVY, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>ISA</span>}
                  {p.taxBenefit && <span style={{ background: "#F0FDF4", color: "#16a34a", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>절세</span>}
                </div>
              </div>
              <div style={{ color: NAVY, fontWeight: 700, fontSize: 14, marginBottom: 6, lineHeight: 1.4 }}>{p.name}</div>
              <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 10 }}>{p.manager} · {p.region}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
                <div style={{ background: "#f9fafb", borderRadius: 6, padding: "6px 8px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 2 }}>기대수익</div>
                  <div style={{ color: "#10B981", fontWeight: 700, fontSize: 14 }}>{p.return}%</div>
                </div>
                <div style={{ background: "#f9fafb", borderRadius: 6, padding: "6px 8px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 2 }}>수수료</div>
                  <div style={{ color: NAVY, fontWeight: 700, fontSize: 14 }}>{p.fee}%</div>
                </div>
                <div style={{ background: "#f9fafb", borderRadius: 6, padding: "6px 8px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 2 }}>위험등급</div>
                  <div style={{ color: p.risk === "고위험" ? "#EF4444" : p.risk === "중위험" ? GOLD : "#10B981", fontWeight: 700, fontSize: 12 }}>{p.risk}</div>
                </div>
                <div style={{ background: "#f9fafb", borderRadius: 6, padding: "6px 8px" }}>
                  <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 2 }}>AUM(억)</div>
                  <div style={{ color: NAVY, fontWeight: 700, fontSize: 12 }}>{p.aum.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ color: NAVY, fontWeight: 700, fontSize: 16, marginBottom: 14 }}>스코어 {p.score}</div>
              <button onClick={() => alert(`${p.name} 약관 다운로드 (더미)`)}
                style={{ width: "100%", padding: "9px", background: NAVY, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                약관 다운로드
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}