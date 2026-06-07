"use client";

import { BadgeCheck } from "lucide-react";

export function questionLabel(label: string) {
  return label.startsWith("Q. ") ? label : `Q. ${label}`;
}

export function Panel({ icon, eyebrow, title, note, children }: { icon: React.ReactNode; eyebrow: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-samsung">{icon}</div>
        <div>
          <p className="text-xs font-bold uppercase tracking-normal text-slate-500">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-bold text-navy">{title}</h2>
          {note ? <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900">{note}</p> : null}
        </div>
      </div>
      <div className="question-stack space-y-4">{children}</div>
    </section>
  );
}

export function TextField({ label, value, placeholder, onChange, compact = false, tone }: { label: string; value: string; placeholder: string; onChange: (value: string) => void; compact?: boolean; tone?: "blue" | "gray" }) {
  return (
    <label className={`question-card ${tone ? `question-card-${tone}` : ""} block rounded-lg border border-slate-200 p-4`}>
      <span className="mb-2 block text-sm font-bold text-slate-700">{questionLabel(label)}</span>
      <input className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-samsung" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function TextAreaField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="question-card block rounded-lg border border-slate-200 p-4">
      <span className="mb-2 block text-sm font-bold text-slate-700">{questionLabel(label)}</span>
      <textarea className="min-h-28 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-ink shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-samsung" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function IncomeWithNoneField({ label, value, placeholder, noneSelected, onChange, onToggleNone }: { label: string; value: string; placeholder: string; noneSelected: boolean; onChange: (value: string) => void; onToggleNone: () => void }) {
  return (
    <div className="question-card rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-700">{questionLabel(label)}</p>
        <button type="button" onClick={onToggleNone} className={`min-h-10 rounded-lg border px-4 py-2 text-sm font-bold transition ${noneSelected ? "border-samsung bg-blue-50 text-samsung" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>없음</button>
      </div>
      <div className="mt-3">
        <textarea className="min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-ink shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-samsung disabled:bg-slate-100 disabled:text-slate-400 sm:min-h-12" value={value} placeholder={placeholder} disabled={noneSelected} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

export function ExpectedReturnField({ value, unknownSelected, onChange, onToggleUnknown }: { value: string; unknownSelected: boolean; onChange: (value: string) => void; onToggleUnknown: () => void }) {
  return (
    <div className="question-card rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-bold text-slate-700">{questionLabel("기대수익률")}</p>
      <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_190px]">
        <input className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-ink shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-samsung disabled:bg-slate-100 disabled:text-slate-400" value={value} placeholder="예. 15%" disabled={unknownSelected} onChange={(e) => onChange(e.target.value)} />
        <button type="button" onClick={onToggleUnknown} className={`min-h-12 rounded-lg border px-3 py-2 text-sm font-bold transition ${unknownSelected ? "border-samsung bg-blue-50 text-samsung" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>구체적인 수치는 모름</button>
      </div>
    </div>
  );
}

export function ChoiceGroup({ label, description, options, value, onChange, tone, cardClassName }: { label: string; description?: string; options: string[]; value: string; onChange: (value: string) => void; tone?: "blue" | "gray"; cardClassName?: string }) {
  return (
    <div className={`question-card ${tone ? `question-card-${tone}` : ""} ${cardClassName ?? ""} rounded-lg border border-slate-200 p-4`}>
      <p className="text-sm font-bold text-slate-700">{questionLabel(label)}</p>
      {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm font-semibold leading-5 transition ${value === option ? "border-samsung bg-blue-50 text-samsung shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}>{option}</button>
        ))}
      </div>
    </div>
  );
}

export function MultiChoiceGroup({ label, options, values, onToggle }: { label: string; options: string[]; values: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="question-card rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-bold text-slate-700">{questionLabel(label)}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {options.map((option) => {
          const selected = values.includes(option);
          return (
            <button key={option} type="button" onClick={() => onToggle(option)} className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold leading-5 transition ${selected ? "border-mint bg-emerald-50 text-mint shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-mint bg-mint text-white" : "border-slate-300 bg-white"}`}>{selected ? <BadgeCheck size={14} /> : null}</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ResultCard({ icon, title, accent, children }: { icon: React.ReactNode; title: string; accent: "blue" | "green" | "gold" | "red" | "orange" | "slate"; children: React.ReactNode }) {
  const accentMap = { blue: "text-samsung bg-blue-50", green: "text-mint bg-emerald-50", gold: "text-gold bg-amber-50", red: "text-red-700 bg-red-50", orange: "text-orange-700 bg-orange-50", slate: "text-slate-700 bg-slate-100" };
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentMap[accent]}`}>{icon}</div>
        <h3 className="text-base font-bold text-navy">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function ResultGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid gap-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex min-h-10 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-sm font-semibold text-slate-500">{label}</span>
          <span className="text-right text-sm font-bold text-navy">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-3">
      <p className="text-xs font-bold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-navy">{value}</p>
    </div>
  );
}

export function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 sm:block sm:px-4 sm:py-3 ${strong ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50"}`}>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`text-sm font-bold sm:mt-1 sm:text-xl ${strong ? "text-orange-700" : "text-navy"}`}>{value}</p>
    </div>
  );
}

export function LiquiditySummary({ summary }: { summary: { requiredDisplay: string; investableDisplay: string } }) {
  return (
    <div className="grid gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
      <p className="text-sm font-bold leading-6 text-blue-900">필요 자금(정기적 현금흐름, 목돈 사용 자금, 비상예비자금): {summary.requiredDisplay}</p>
      <p className="text-sm font-bold leading-6 text-blue-900">투자 가능 자산(당장 사용 계획이 없는 자산): {summary.investableDisplay}</p>
    </div>
  );
}
