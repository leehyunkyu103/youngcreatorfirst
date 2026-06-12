"use client";
import { useEffect, useState } from "react";
import { FinancialIncomeGauge } from "../tab1/FinancialIncomeGauge";
import type { FinancialIncomeSummary } from "../tab1/FinancialIncomeGauge";

export default function Tab5Page() {
  const [summary, setSummary] = useState<FinancialIncomeSummary | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem("financial-income-summary-v1");
        if (stored) setSummary(JSON.parse(stored));
      } catch {}
    };
    load();
    window.addEventListener("financial-income-updated", load);
    return () => window.removeEventListener("financial-income-updated", load);
  }, []);

  return <FinancialIncomeGauge summary={summary} />;
}
