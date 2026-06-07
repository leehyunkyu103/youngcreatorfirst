"use client";

import { useState } from "react";
import { FolderOpen, UserCheck } from "lucide-react";
import CustomerAnalysisTab from "./CustomerAnalysisTab";
import ExistingPortfolioTab from "./ExistingPortfolioTab";

// ── Inner Sub-tab IDs ────────────────────────────────────────────────────────
type InnerTab = "tendency" | "existing";

const innerTabs: { id: InnerTab; label: string; icon: React.ReactNode }[] = [
  { id: "tendency", label: "고객 성향 분석", icon: <UserCheck size={15} /> },
  { id: "existing", label: "기존 포트폴리오 분석", icon: <FolderOpen size={15} /> },
];

// ── 메인 Tab1 페이지 (탭 전환만 담당) ──────────────────────────────────────
export default function Tab1Page() {
  const [activeInnerTab, setActiveInnerTab] = useState<InnerTab>("tendency");

  return (
    <>
      {/* 페이지 헤더 */}
      <header className="rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-soft">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-samsung">Samsung Securities PB Advisory</p>
          <h1 className="mt-1 text-2xl font-bold tracking-normal text-navy md:text-3xl">고객 정보 입력</h1>
        </div>
      </header>

      {/* 내부 세부 탭 */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-soft">
        {innerTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveInnerTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold transition ${
              activeInnerTab === tab.id
                ? "bg-[#2f2f9d] text-white shadow-soft"
                : "text-slate-600 hover:bg-slate-100 hover:text-navy"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      {activeInnerTab === "tendency" ? <CustomerAnalysisTab /> : <ExistingPortfolioTab />}
    </>
  );
}
