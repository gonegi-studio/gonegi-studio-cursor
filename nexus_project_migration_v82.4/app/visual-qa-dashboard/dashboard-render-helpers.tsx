import React from "react";
import {
  findingSeverityClass,
  formatScore3Dec,
  scoreBarWidth,
  trendMarker,
  type ContinuityMetric,
  type DatasetSteeringRecommendation,
  type DecisionSummaryPanel,
  type DirectorGrammarSteeringCard,
  type FindingSeverity,
  type GroupedFinding,
  type IdentityPersistenceMetric,
  type MultiCycleTrendPoint,
  type RetryGuardRecommendation,
  type StyleCoreTraitTag,
} from "./dashboard-ux-data.ts";

export type SteeringItem = {
  readonly label: string;
  readonly severity: FindingSeverity;
};

export function SectionTitle({ children }: { readonly children: string }) {
  return <h2 className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">{children}</h2>;
}

export function DashboardSection({
  sectionId,
  title,
  children,
}: {
  readonly sectionId: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section data-section={sectionId} className="space-y-4">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  );
}

export function SeverityChip({ severity, label }: { readonly severity: FindingSeverity; readonly label: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${findingSeverityClass(severity)}`} data-severity={severity}>
      {label}
    </span>
  );
}

export function SteeringChip({
  label,
  severity,
  dataAttr,
}: {
  readonly label: string;
  readonly severity: FindingSeverity;
  readonly dataAttr: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase ${findingSeverityClass(severity)}`}
      {...{ [`data-${dataAttr}`]: label }}
    >
      {label}
    </span>
  );
}

export function SteeringChipList({
  items,
  dataAttr,
}: {
  readonly items: readonly SteeringItem[];
  readonly dataAttr: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-white p-4">
      {items.map((item) => (
        <SteeringChip key={item.label} label={item.label} severity={item.severity} dataAttr={dataAttr} />
      ))}
    </div>
  );
}

export function DriftList({
  items,
  dataAttr,
}: {
  readonly items: readonly SteeringItem[];
  readonly dataAttr: string;
}) {
  return (
    <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-2 text-sm" {...{ [`data-${dataAttr}`]: item.label }}>
          <span className="text-stone-700">{item.label}</span>
          <SeverityChip severity={item.severity} label={item.severity} />
        </li>
      ))}
    </ul>
  );
}

export function TagList({ tags }: { readonly tags: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span key={tag} className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">{tag}</span>
      ))}
    </div>
  );
}

export function KeyValueField({
  label,
  value,
  emphasis = false,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly emphasis?: boolean;
}) {
  return (
    <div>
      <p className="font-bold uppercase text-stone-400">{label}</p>
      <p className={`mt-1 ${emphasis ? "font-black" : "text-stone-700"}`}>{value}</p>
    </div>
  );
}

export function ScoreBar({ score }: { readonly score: number }) {
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-stone-100">
      <div className="h-full rounded-full bg-emerald-500" style={{ width: scoreBarWidth(score) }} />
    </div>
  );
}

export function MetricScoreRow({ metric, dataAttr }: { readonly metric: ContinuityMetric; readonly dataAttr: string }) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm" {...{ [`data-${dataAttr}`]: metric.label }}>
      <span className="text-stone-700">{metric.label}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold">{formatScore3Dec(metric.score)}</span>
        <SeverityChip severity={metric.severity} label={metric.severity} />
      </div>
    </li>
  );
}

export function IdentityPersistenceRow({ metric }: { readonly metric: IdentityPersistenceMetric }) {
  return <MetricScoreRow metric={metric} dataAttr="identity-persistence" />;
}

export function TimelineTrendRow({ dimension, points }: { readonly dimension: string; readonly points: readonly MultiCycleTrendPoint[] }) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4" data-timeline-dimension={dimension}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{dimension}</p>
      <ul className="mt-3 space-y-2">
        {points.map((point) => (
          <li key={`${point.dimension}:${point.cycleId}`} className="flex items-center justify-between gap-2 text-xs" data-timeline-point={point.cycleId}>
            <span className="font-medium text-stone-700">{point.cycleId}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{trendMarker(point.trend)} {formatScore3Dec(point.score)}</span>
              <SeverityChip severity={point.severity} label={point.severity} />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function TimelineTrendGrid({ groups }: { readonly groups: readonly { readonly dimension: string; readonly points: readonly MultiCycleTrendPoint[] }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <TimelineTrendRow key={group.dimension} dimension={group.dimension} points={group.points} />
      ))}
    </div>
  );
}

export function FindingGroup({ title, findings }: { readonly title: string; readonly findings: readonly GroupedFinding[] }) {
  return (
    <div className="space-y-2" data-finding-group={title}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{title}</p>
      <ul className="space-y-2">
        {findings.map((finding) => (
          <li key={finding.label} className="flex items-center justify-between gap-2 text-sm text-stone-700" data-grouped-finding={finding.label}>
            <span>{finding.label}</span>
            <SeverityChip severity={finding.severity} label={finding.severity} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DecisionSummaryCard({ panel }: { readonly panel: DecisionSummaryPanel }) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4" data-decision-summary={panel.label}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{panel.label}</p>
        <SeverityChip severity={panel.severity} label={panel.severity} />
      </div>
      <p className="mt-2 text-sm font-black">{panel.promptVersion}</p>
      <p className="mt-1 text-xs text-stone-500">{panel.cycleId}</p>
      <p className="mt-2 text-lg font-black">{formatScore3Dec(panel.score)}</p>
      <p className="mt-1 text-xs text-stone-600">{panel.detail}</p>
    </article>
  );
}

export function RuleBlock({ title, rules, tone }: { readonly title: string; readonly rules: readonly string[]; readonly tone: "safe" | "unsafe" | "preserve" | "avoid" }) {
  const toneClass =
    tone === "safe" || tone === "preserve"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";
  return (
    <article className={`rounded-xl border p-4 ${toneClass}`} data-retry-steering={tone}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{title}</p>
      {tone === "safe" || tone === "unsafe" ? (
        <p className="mt-2 text-sm font-bold">{rules[0]}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-xs font-bold">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function TraitTagList({ traits }: { readonly traits: readonly StyleCoreTraitTag[] }) {
  return (
    <ul className="space-y-2">
      {traits.map((trait) => (
        <li key={trait.label} className="flex items-center justify-between gap-2 text-sm" data-style-trait={trait.label}>
          <span className="text-stone-700">{trait.label}</span>
          <SeverityChip severity={trait.severity} label={trait.severity} />
        </li>
      ))}
    </ul>
  );
}

export function RetryGuardCard({ item }: { readonly item: RetryGuardRecommendation }) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4" data-retry-guard={item.label}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{item.label}</p>
        <SeverityChip severity={item.severity} label={item.severity} />
      </div>
      <p className="mt-2 text-xs font-bold text-stone-700">{item.detail}</p>
    </article>
  );
}

export function GrammarSteeringCard({ card }: { readonly card: DirectorGrammarSteeringCard }) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4" data-grammar-steering={card.label}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{card.label}</p>
        <SeverityChip severity={card.severity} label={card.severity} />
      </div>
      <p className="mt-2 text-xs font-bold text-stone-700">{card.detail}</p>
    </article>
  );
}

export function DatasetSteerCard({ item }: { readonly item: DatasetSteeringRecommendation }) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4" data-dataset-steer={item.label}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{item.label}</p>
        <SeverityChip severity={item.severity} label={item.severity} />
      </div>
      <p className="mt-2 text-xs font-bold text-stone-700">{item.detail}</p>
    </article>
  );
}
