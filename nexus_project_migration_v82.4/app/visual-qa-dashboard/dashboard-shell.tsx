import React from "react";
import type { VisualQaDashboardPreviewRoute } from "../../services/image-generation/visual-qa-dashboard-preview-route.ts";

export const VISUAL_QA_DASHBOARD_TREND_SIGNAL_SLOTS = Object.freeze([
  "identity",
  "style",
  "emotion",
  "drift",
  "overall",
] as const);

export const VISUAL_QA_DASHBOARD_SUMMARY_CARD_FIELDS = Object.freeze([
  ["dashboardId", "Dashboard ID"],
  ["matrixId", "Matrix ID"],
  ["sourceExportId", "Source Export"],
  ["rankingPreviewRowCount", "Ranking Rows"],
  ["heatmapPreviewRowCount", "Heatmap Rows"],
  ["trendSignalCount", "Trend Signals"],
] as const);

function statusBandClass(statusBand: string): string {
  switch (statusBand) {
    case "stable":
      return "bg-emerald-100 text-emerald-800";
    case "critical":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function severityBandClass(severityBand: string): string {
  switch (severityBand) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
}

export function buildVisualQaDashboardRenderSnapshot(payload: VisualQaDashboardPreviewRoute): string {
  const sections = payload.previewSections
    .map((section) => `${section.sectionKind}:${section.itemCount}`)
    .join("|");
  const summaryCards = VISUAL_QA_DASHBOARD_SUMMARY_CARD_FIELDS.map(
    ([field]) => `${field}:${String(payload.routeMetadata[field as keyof typeof payload.routeMetadata])}`
  ).join("|");
  const ranking = payload.rankingPreviewRows
    .map((row) => `${row.cycleReportId}:${row.displayRank}:${row.statusBand}`)
    .join("|");
  const heatmap = payload.heatmapPreviewRows
    .map((row) => `${row.cycleReportId}:${row.signalKind}:${row.severityBand}`)
    .join("|");
  const trends = VISUAL_QA_DASHBOARD_TREND_SIGNAL_SLOTS.slice(0, payload.routeMetadata.trendSignalCount).join("|");

  return [
    payload.previewRouteId,
    payload.dashboardId,
    sections,
    summaryCards,
    ranking,
    heatmap,
    trends,
  ].join("\n");
}

type VisualQaDashboardShellProps = {
  readonly payload: VisualQaDashboardPreviewRoute;
};

export function VisualQaDashboardShell({ payload }: VisualQaDashboardShellProps) {
  const trendSlots = VISUAL_QA_DASHBOARD_TREND_SIGNAL_SLOTS.slice(0, payload.routeMetadata.trendSignalCount);
  const orderedSections = [...payload.previewSections].sort(
    (left, right) => left.renderPriority - right.renderPriority
  );

  return (
    <div
      className="min-h-screen bg-stone-100 text-stone-900"
      data-page="visual-qa-dashboard"
      data-preview-route-id={payload.previewRouteId}
    >
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Visual QA Dashboard</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">{payload.dashboardId}</h1>
        <p className="mt-1 text-sm text-stone-500">{payload.previewRouteId}</p>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section data-section="summary-cards">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-stone-600">Summary Cards</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VISUAL_QA_DASHBOARD_SUMMARY_CARD_FIELDS.map(([field, label]) => (
              <article
                key={field}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                data-summary-card={field}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{label}</p>
                <p className="mt-2 text-sm font-bold text-stone-800">
                  {String(payload.routeMetadata[field as keyof typeof payload.routeMetadata])}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section data-section="ranking-table">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-stone-600">Style Stability Ranking</h2>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Stability</th>
                  <th className="px-4 py-3">Style</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payload.rankingPreviewRows.map((row) => (
                  <tr key={row.previewRowId} className="border-t border-stone-100" data-ranking-row={row.cycleReportId}>
                    <td className="px-4 py-3 font-bold">{row.displayRank}</td>
                    <td className="px-4 py-3">{row.cycleReportId}</td>
                    <td className="px-4 py-3">{row.stabilityScore.toFixed(6)}</td>
                    <td className="px-4 py-3">{row.styleScore.toFixed(6)}</td>
                    <td className="px-4 py-3">{row.riskScore.toFixed(6)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${statusBandClass(row.statusBand)}`}>
                        {row.statusBand}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section data-section="heatmap-rows">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-stone-600">Regression Heatmap</h2>
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <tr>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Signal</th>
                  <th className="px-4 py-3">Intensity</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Weight</th>
                </tr>
              </thead>
              <tbody>
                {payload.heatmapPreviewRows.map((row) => (
                  <tr key={row.previewRowId} className="border-t border-stone-100" data-heatmap-row={`${row.cycleReportId}:${row.signalKind}`}>
                    <td className="px-4 py-3">{row.cycleReportId}</td>
                    <td className="px-4 py-3">{row.signalKind}</td>
                    <td className="px-4 py-3">{row.intensityScore.toFixed(6)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${severityBandClass(row.severityBand)}`}>
                        {row.severityBand}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.renderWeight.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section data-section="trend-signals">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-stone-600">Trend Signals</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trendSlots.map((signalKind) => (
              <article
                key={signalKind}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                data-trend-signal={signalKind}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Signal</p>
                <p className="mt-2 text-sm font-bold text-stone-800">{signalKind}</p>
              </article>
            ))}
          </div>
        </section>

        <section data-section="preview-sections" className="rounded-2xl border border-dashed border-stone-300 bg-white p-4">
          <h2 className="mb-3 text-[10px] font-black uppercase tracking-widest text-stone-500">Section Order</h2>
          <ul className="space-y-2 text-sm text-stone-600">
            {orderedSections.map((section) => (
              <li key={section.sectionId} data-preview-section={section.sectionKind}>
                {section.sectionOrder}. {section.title} ({section.itemCount})
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
