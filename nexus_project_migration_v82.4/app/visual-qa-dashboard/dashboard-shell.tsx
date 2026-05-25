import React from "react";
import type { VisualQaDashboardPreviewRoute } from "../../services/image-generation/visual-qa-dashboard-preview-route.ts";
import {
  DASHBOARD_NEXT_REQUEST_IMPROVEMENTS,
  DASHBOARD_RANKING_SORT_LABELS,
  VISUAL_QA_DASHBOARD_SUMMARY_CARD_FIELDS,
  VISUAL_QA_DASHBOARD_TREND_SIGNAL_SLOTS,
  buildContinuityFocus,
  buildCharacterContinuityBridge,
  buildCanonicalEvidenceIntake,
  buildCanonicalDatasetRegistry,
  buildCanonicalSessionIntake,
  buildCinematicDnaProfile,
  buildCinematicDriftDetection,
  buildCinematicSteeringRecommendations,
  buildCinematicWorldState,
  buildCycleTimeline,
  buildDashboardCycleDisplays,
  buildDashboardDecisions,
  buildDatasetIdentity,
  buildDatasetOrchestration,
  buildDatasetSteeringRecommendations,
  buildDecisionMatrix,
  buildDecisionSummary,
  buildDirectorGrammarSteering,
  buildEmotionalContinuityTimeline,
  buildEmotionalDriftDetection,
  buildEnvironmentalContinuity,
  buildEnvironmentalPersistenceTimeline,
  buildEnvironmentalSteeringRecommendations,
  buildEvidenceDriftDetection,
  buildEvidenceFamilyOrchestration,
  buildEvidenceSteeringRecommendations,
  buildRegistryDriftDetection,
  buildRegistryPersistenceTimeline,
  buildRegistrySteeringRecommendations,
  buildRealGenerationSessionBridge,
  buildSessionDriftDetection,
  buildSessionPersistenceTimeline,
  buildSessionSteeringRecommendations,
  buildProviderAdapterReadiness,
  buildSessionProviderCompatibility,
  buildProviderDriftDetection,
  buildProviderReadinessTimeline,
  buildProviderSteeringRecommendations,
  buildEvaluationIntakeNormalization,
  buildEvidenceSessionLinking,
  buildIntakeDriftDetection,
  buildReplayMappingTimeline,
  buildIntakeSteeringRecommendations,
  buildIdentityPersistence,
  buildImageEvaluationIntakes,
  buildIdentityPersistenceTimeline,
  buildLongSessionContinuityMemory,
  buildMultiCycleContinuityTimeline,
  buildMultiProjectCinematicMemory,
  buildNarrativeEmotionalState,
  buildNarrativeSteeringRecommendations,
  buildPromptEvolutionInsights,
  buildProductionOrchestration,
  buildProductionPersistenceTimeline,
  buildProductionSteeringRecommendations,
  buildRealEvaluationBridge,
  buildReplayPersistenceTimeline,
  buildSceneGrammarProfile,
  buildSequenceContinuity,
  buildSequenceStabilityTimeline,
  buildSequenceSteeringRecommendations,
  buildTemporalDriftDetection,
  buildTemporalSceneMemory,
  buildUnifiedCinematicIdentity,
  buildUnifiedDriftDetection,
  buildUnifiedSteeringRecommendations,
  buildWorldStateDriftDetection,
  buildCrossLayerContinuityMatrix,
  buildCrossProjectDriftDetection,
  groupEmotionalContinuityTimelineByDimension,
  groupEnvironmentalPersistenceTimelineByDimension,
  groupIdentityPersistenceTimelineByDimension,
  groupProductionPersistenceTimelineByDimension,
  groupRegistryPersistenceTimelineByDimension,
  groupReplayPersistenceTimelineByDimension,
  groupSessionPersistenceTimelineByDimension,
  groupProviderReadinessTimelineByDimension,
  groupReplayMappingTimelineByDimension,
  groupMultiCycleTimelineByDimension,
  groupSequenceStabilityTimelineByDimension,
  buildRankingEvolution,
  buildRetryGuardRecommendations,
  buildRetrySteering,
  buildStyleCoreDecision,
  buildStyleCoreProfile,
  formatDelta3Dec,
  formatScore3Dec,
  groupFindingsByCategory,
  groupHeatmapRows,
  severityBandClass,
  statusBandClass,
  trendMarker,
} from "./dashboard-ux-data.ts";
import { buildDashboardRenderStabilityGuard } from "./dashboard-section-registry.ts";
import {
  DashboardSection,
  DatasetSteerCard,
  DecisionSummaryCard,
  DriftList,
  FindingGroup,
  GrammarSteeringCard,
  IdentityPersistenceRow,
  KeyValueField,
  MetricScoreRow,
  RetryGuardCard,
  RuleBlock,
  ScoreBar,
  SectionTitle,
  SeverityChip,
  SteeringChipList,
  TagList,
  TimelineTrendGrid,
  TraitTagList,
} from "./dashboard-render-helpers.tsx";

export {
  VISUAL_QA_DASHBOARD_TREND_SIGNAL_SLOTS,
  VISUAL_QA_DASHBOARD_SUMMARY_CARD_FIELDS,
} from "./dashboard-ux-data.ts";

export { buildVisualQaDashboardRenderSnapshot } from "./dashboard-snapshot.ts";

type VisualQaDashboardShellProps = {
  readonly payload: VisualQaDashboardPreviewRoute;
};

export function VisualQaDashboardShell({ payload }: VisualQaDashboardShellProps) {
  const renderStabilityGuard = buildDashboardRenderStabilityGuard();
  const cycles = buildDashboardCycleDisplays(payload);
  const intakes = buildImageEvaluationIntakes(payload);
  const timeline = buildCycleTimeline(payload);
  const evolution = buildRankingEvolution(payload);
  const decisions = buildDashboardDecisions(payload);
  const decisionSummary = buildDecisionSummary(payload);
  const continuityFocus = buildContinuityFocus(payload);
  const promptInsights = buildPromptEvolutionInsights(payload);
  const decisionMatrix = buildDecisionMatrix(payload);
  const retrySteering = buildRetrySteering();
  const styleCoreProfile = buildStyleCoreProfile();
  const continuityBridge = buildCharacterContinuityBridge();
  const styleCoreDecision = buildStyleCoreDecision(payload);
  const retryGuardRecommendations = buildRetryGuardRecommendations();
  const cinematicDnaProfile = buildCinematicDnaProfile();
  const directorGrammarSteering = buildDirectorGrammarSteering();
  const cinematicDriftDetection = buildCinematicDriftDetection();
  const datasetIdentity = buildDatasetIdentity();
  const cinematicSteeringRecommendations = buildCinematicSteeringRecommendations();
  const sessionMemory = buildLongSessionContinuityMemory();
  const multiCycleTimeline = buildMultiCycleContinuityTimeline(payload);
  const datasetOrchestration = buildDatasetOrchestration();
  const datasetSteeringRecommendations = buildDatasetSteeringRecommendations();
  const identityPersistence = buildIdentityPersistence();
  const narrativeEmotionalState = buildNarrativeEmotionalState();
  const sceneGrammarProfile = buildSceneGrammarProfile();
  const emotionalDriftDetection = buildEmotionalDriftDetection();
  const emotionalContinuityTimeline = buildEmotionalContinuityTimeline(payload);
  const emotionalContinuityTimelineGroups = groupEmotionalContinuityTimelineByDimension(emotionalContinuityTimeline);
  const narrativeSteeringRecommendations = buildNarrativeSteeringRecommendations();
  const temporalSceneMemory = buildTemporalSceneMemory();
  const sequenceContinuity = buildSequenceContinuity();
  const temporalDriftDetection = buildTemporalDriftDetection();
  const sequenceStabilityTimeline = buildSequenceStabilityTimeline(payload);
  const sequenceStabilityTimelineGroups = groupSequenceStabilityTimelineByDimension(sequenceStabilityTimeline);
  const sequenceSteeringRecommendations = buildSequenceSteeringRecommendations();
  const cinematicWorldState = buildCinematicWorldState();
  const environmentalContinuity = buildEnvironmentalContinuity();
  const worldStateDriftDetection = buildWorldStateDriftDetection();
  const environmentalPersistenceTimeline = buildEnvironmentalPersistenceTimeline(payload);
  const environmentalPersistenceTimelineGroups = groupEnvironmentalPersistenceTimelineByDimension(environmentalPersistenceTimeline);
  const environmentalSteeringRecommendations = buildEnvironmentalSteeringRecommendations();
  const unifiedCinematicIdentity = buildUnifiedCinematicIdentity();
  const crossLayerContinuityMatrix = buildCrossLayerContinuityMatrix();
  const unifiedDriftDetection = buildUnifiedDriftDetection();
  const identityPersistenceTimeline = buildIdentityPersistenceTimeline(payload);
  const identityPersistenceTimelineGroups = groupIdentityPersistenceTimelineByDimension(identityPersistenceTimeline);
  const unifiedSteeringRecommendations = buildUnifiedSteeringRecommendations();
  const multiProjectCinematicMemory = buildMultiProjectCinematicMemory();
  const productionOrchestration = buildProductionOrchestration();
  const crossProjectDriftDetection = buildCrossProjectDriftDetection();
  const productionPersistenceTimeline = buildProductionPersistenceTimeline(payload);
  const productionPersistenceTimelineGroups = groupProductionPersistenceTimelineByDimension(productionPersistenceTimeline);
  const productionSteeringRecommendations = buildProductionSteeringRecommendations();
  const canonicalEvidenceIntake = buildCanonicalEvidenceIntake();
  const realEvaluationBridge = buildRealEvaluationBridge();
  const evidenceDriftDetection = buildEvidenceDriftDetection();
  const replayPersistenceTimeline = buildReplayPersistenceTimeline(payload);
  const replayPersistenceTimelineGroups = groupReplayPersistenceTimelineByDimension(replayPersistenceTimeline);
  const evidenceSteeringRecommendations = buildEvidenceSteeringRecommendations();
  const canonicalDatasetRegistry = buildCanonicalDatasetRegistry();
  const evidenceFamilyOrchestration = buildEvidenceFamilyOrchestration();
  const registryDriftDetection = buildRegistryDriftDetection();
  const registryPersistenceTimeline = buildRegistryPersistenceTimeline(payload);
  const registryPersistenceTimelineGroups = groupRegistryPersistenceTimelineByDimension(registryPersistenceTimeline);
  const registrySteeringRecommendations = buildRegistrySteeringRecommendations();
  const canonicalSessionIntake = buildCanonicalSessionIntake();
  const realGenerationSessionBridge = buildRealGenerationSessionBridge();
  const sessionDriftDetection = buildSessionDriftDetection();
  const sessionPersistenceTimeline = buildSessionPersistenceTimeline(payload);
  const sessionPersistenceTimelineGroups = groupSessionPersistenceTimelineByDimension(sessionPersistenceTimeline);
  const sessionSteeringRecommendations = buildSessionSteeringRecommendations();
  const providerAdapterReadiness = buildProviderAdapterReadiness();
  const sessionProviderCompatibility = buildSessionProviderCompatibility();
  const providerDriftDetection = buildProviderDriftDetection();
  const providerReadinessTimeline = buildProviderReadinessTimeline(payload);
  const providerReadinessTimelineGroups = groupProviderReadinessTimelineByDimension(providerReadinessTimeline);
  const providerSteeringRecommendations = buildProviderSteeringRecommendations();
  const evaluationIntakeNormalization = buildEvaluationIntakeNormalization();
  const evidenceSessionLinking = buildEvidenceSessionLinking();
  const intakeDriftDetection = buildIntakeDriftDetection();
  const replayMappingTimeline = buildReplayMappingTimeline(payload);
  const replayMappingTimelineGroups = groupReplayMappingTimelineByDimension(replayMappingTimeline);
  const intakeSteeringRecommendations = buildIntakeSteeringRecommendations();
  const multiCycleTimelineGroups = groupMultiCycleTimelineByDimension(multiCycleTimeline);
  const heatmapGroups = groupHeatmapRows(payload);
  const continuityFindings = groupFindingsByCategory("continuity");
  const styleFindings = groupFindingsByCategory("style");
  const trendSlots = VISUAL_QA_DASHBOARD_TREND_SIGNAL_SLOTS.slice(0, payload.routeMetadata.trendSignalCount);
  const latestCycleId = cycles.find((cycle) => cycle.isLatest)?.cycleId ?? "";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" data-page="visual-qa-dashboard" data-preview-route-id={payload.previewRouteId}>
      <header className="border-b border-stone-200 bg-white px-6 py-6">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Visual QA Dashboard</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">{payload.dashboardId}</h1>
        <p className="mt-1 text-sm text-stone-500">{payload.previewRouteId}</p>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <DashboardSection sectionId="section-registry-metadata" title="Section Registry">
          <article className="rounded-xl border border-stone-200 bg-white p-4 text-xs" data-section-registry-metadata="">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Total Sections</dt><dd className="mt-1 font-black">{renderStabilityGuard.totalSectionCount}</dd></div>
              <div className="sm:col-span-2"><dt className="font-bold uppercase text-stone-400">Order Signature</dt><dd className="mt-1 break-all font-mono text-[10px] text-stone-600">{renderStabilityGuard.sectionOrderSignature}</dd></div>
            </dl>
            <div className="mt-3"><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Enabled Section IDs</p><TagList tags={renderStabilityGuard.enabledSectionIds} /></div>
          </article>
        </DashboardSection>

        <section data-section="summary-cards" className="space-y-4">
          <SectionTitle>Summary</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VISUAL_QA_DASHBOARD_SUMMARY_CARD_FIELDS.map(([field, label]) => (
              <article key={field} className="rounded-xl border border-stone-200 bg-white p-4" data-summary-card={field}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
                <p className="mt-2 text-base font-black text-stone-800">
                  {String(payload.routeMetadata[field as keyof typeof payload.routeMetadata])}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section data-section="long-session-continuity-memory" className="space-y-4">
          <SectionTitle>Long Session Continuity Memory</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-session-id={sessionMemory.continuitySessionId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div><p className="font-bold uppercase text-stone-400">Session</p><p className="mt-1 font-black text-stone-800">{sessionMemory.continuitySessionId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Character</p><p className="mt-1 font-bold">{sessionMemory.activeCharacterIdentity}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Style Core</p><p className="mt-1 font-bold">{sessionMemory.activeStyleCore}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Cinematic Grammar</p><p className="mt-1 font-bold">{sessionMemory.activeCinematicGrammar}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Emotion State</p><p className="mt-1 text-stone-700">{sessionMemory.preservedEmotionState}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Lighting State</p><p className="mt-1 text-stone-700">{sessionMemory.preservedLightingState}</p></div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Carry-Over Rules</p><TagList tags={sessionMemory.continuityCarryOverRules} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">Failure History</p><TagList tags={sessionMemory.continuityFailureHistory} /></div>
            </div>
          </article>
        </section>

        <section data-section="multi-cycle-continuity-timeline" className="space-y-4">
          <SectionTitle>Multi-Cycle Continuity Timeline</SectionTitle>
          <TimelineTrendGrid groups={multiCycleTimelineGroups} />
        </section>

        <section data-section="dataset-orchestration" className="space-y-4">
          <SectionTitle>Cinematic Dataset Orchestration</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-dataset-family={datasetOrchestration.datasetFamilyId}>
            <p className="text-sm font-black">{datasetOrchestration.datasetFamilyId}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2 text-xs">
              <div>
                <p className="mb-2 font-bold uppercase text-stone-400">Active Dataset Blend</p>
                <ul className="space-y-1">
                  {datasetOrchestration.activeDatasetBlend.map((entry) => (
                    <li key={entry.datasetId} className="flex justify-between font-bold" data-dataset-blend={entry.datasetId}>
                      <span>{entry.datasetId}</span>
                      <span>{formatScore3Dec(entry.weight)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-bold uppercase text-stone-400">Priority Weights</p>
                <ul className="space-y-1">
                  {datasetOrchestration.datasetPriorityWeights.map((entry) => (
                    <li key={entry.datasetId} className="flex items-center justify-between gap-2" data-dataset-priority={entry.datasetId}>
                      <span className="font-bold">{entry.datasetId}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatScore3Dec(entry.weight)}</span>
                        <SeverityChip severity={entry.priority} label={entry.priority} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div><p className="mb-1 font-bold uppercase text-emerald-600">Continuity-Safe</p><TagList tags={datasetOrchestration.continuitySafeDatasets} /></div>
              <div><p className="mb-1 font-bold uppercase text-red-600">High Drift</p><TagList tags={datasetOrchestration.highDriftDatasets} /></div>
              <div><p className="mb-1 font-bold uppercase text-stone-400">Emotional Tone</p><TagList tags={datasetOrchestration.emotionalToneDatasets} /></div>
              <div><p className="mb-1 font-bold uppercase text-stone-400">Cinematic Grammar</p><TagList tags={datasetOrchestration.cinematicGrammarDatasets} /></div>
            </div>
          </article>
        </section>

        <section data-section="dataset-steering-recommendations" className="space-y-4">
          <SectionTitle>Dataset Steering Recommendations</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {datasetSteeringRecommendations.map((item) => (
              <DatasetSteerCard key={item.label} item={item} />
            ))}
          </div>
        </section>

        <section data-section="identity-persistence" className="space-y-4">
          <SectionTitle>Identity Persistence</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-4">
            <ul className="space-y-3">
              {identityPersistence.map((metric) => (
                <IdentityPersistenceRow key={metric.label} metric={metric} />
              ))}
            </ul>
          </article>
        </section>

        <section data-section="narrative-emotional-state" className="space-y-4">
          <SectionTitle>Narrative Emotional State</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-narrative-state-id={narrativeEmotionalState.narrativeStateId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="font-bold uppercase text-stone-400">State ID</p><p className="mt-1 font-black">{narrativeEmotionalState.narrativeStateId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Emotion Arc</p><p className="mt-1 text-stone-700">{narrativeEmotionalState.activeEmotionArc}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Baseline</p><p className="mt-1 text-stone-700">{narrativeEmotionalState.emotionalBaseline}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Carry-Over</p><p className="mt-1 text-stone-700">{narrativeEmotionalState.emotionalCarryOver}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Tension Curve</p><p className="mt-1 font-black">{formatScore3Dec(narrativeEmotionalState.tensionCurve)}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Calm Recovery</p><p className="mt-1 font-black">{formatScore3Dec(narrativeEmotionalState.calmRecoveryCurve)}</p></div>
            </div>
            <div className="mt-4"><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Transition Rules</p><TagList tags={narrativeEmotionalState.emotionalTransitionRules} /></div>
          </article>
        </section>

        <section data-section="scene-grammar" className="space-y-4">
          <SectionTitle>Scene Grammar</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-scene-grammar-id={sceneGrammarProfile.sceneGrammarId}>
            <p className="text-sm font-black">{sceneGrammarProfile.sceneGrammarId}</p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Transition</dt><dd className="mt-1 text-stone-700">{sceneGrammarProfile.transitionPhilosophy}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Pacing Density</dt><dd className="mt-1 text-stone-700">{sceneGrammarProfile.pacingDensity}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Silence Spacing</dt><dd className="mt-1 text-stone-700">{sceneGrammarProfile.silenceSpacing}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Atmosphere</dt><dd className="mt-1 text-stone-700">{sceneGrammarProfile.atmospherePersistence}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Framing Breath</dt><dd className="mt-1 text-stone-700">{sceneGrammarProfile.framingBreathability}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Motion Calmness</dt><dd className="mt-1 text-stone-700">{sceneGrammarProfile.motionCalmness}</dd></div>
            </dl>
          </article>
        </section>

        <section data-section="emotional-drift-detection" className="space-y-4">
          <SectionTitle>Emotional Drift Detection</SectionTitle>
          <DriftList items={emotionalDriftDetection} dataAttr="emotional-drift" />
        </section>

        <section data-section="emotional-continuity-timeline" className="space-y-4">
          <SectionTitle>Emotional Continuity Timeline</SectionTitle>
          <TimelineTrendGrid groups={emotionalContinuityTimelineGroups} />
        </section>

        <section data-section="narrative-steering-recommendations" className="space-y-4">
          <SectionTitle>Narrative Steering Recommendations</SectionTitle>
          <SteeringChipList items={narrativeSteeringRecommendations} dataAttr="narrative-steer" />
        </section>

        <section data-section="temporal-scene-memory" className="space-y-4">
          <SectionTitle>Temporal Scene Memory</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-temporal-sequence-id={temporalSceneMemory.temporalSequenceId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="font-bold uppercase text-stone-400">Sequence ID</p><p className="mt-1 font-black">{temporalSceneMemory.temporalSequenceId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Scene Inheritance</p><p className="mt-1 text-stone-700">{temporalSceneMemory.previousSceneInheritance}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Active Emotion</p><p className="mt-1 text-stone-700">{temporalSceneMemory.activeSequenceEmotion}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Lighting Carry-Over</p><p className="mt-1 font-black">{formatScore3Dec(temporalSceneMemory.lightingCarryOverPersistence)}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Framing Carry-Over</p><p className="mt-1 font-black">{formatScore3Dec(temporalSceneMemory.framingCarryOverPersistence)}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Atmosphere Carry-Over</p><p className="mt-1 font-black">{formatScore3Dec(temporalSceneMemory.atmosphereCarryOverPersistence)}</p></div>
            </div>
            <div className="mt-4"><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity Rules</p><TagList tags={temporalSceneMemory.temporalContinuityRules} /></div>
          </article>
        </section>

        <section data-section="sequence-continuity" className="space-y-4">
          <SectionTitle>Sequence Continuity</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-sequence-grammar-id={sequenceContinuity.sequenceGrammarId}>
            <p className="text-sm font-black">{sequenceContinuity.sequenceGrammarId}</p>
            <p className="mt-2 text-xs text-stone-600">{sequenceContinuity.sceneTransitionMemory}</p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="font-bold uppercase text-stone-400">Emotional Inheritance</dt><dd className="mt-1 font-black">{formatScore3Dec(sequenceContinuity.emotionalInheritanceStrength)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Pacing Inheritance</dt><dd className="mt-1 font-black">{formatScore3Dec(sequenceContinuity.pacingInheritanceStrength)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Framing Persistence</dt><dd className="mt-1 font-black">{formatScore3Dec(sequenceContinuity.framingPersistenceStrength)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Atmosphere Persistence</dt><dd className="mt-1 font-black">{formatScore3Dec(sequenceContinuity.atmospherePersistenceStrength)}</dd></div>
            </dl>
          </article>
        </section>

        <section data-section="temporal-drift-detection" className="space-y-4">
          <SectionTitle>Temporal Drift Detection</SectionTitle>
          <DriftList items={temporalDriftDetection} dataAttr="temporal-drift" />
        </section>

        <section data-section="sequence-stability-timeline" className="space-y-4">
          <SectionTitle>Sequence Stability Timeline</SectionTitle>
          <TimelineTrendGrid groups={sequenceStabilityTimelineGroups} />
        </section>

        <section data-section="sequence-steering-recommendations" className="space-y-4">
          <SectionTitle>Sequence Steering Recommendations</SectionTitle>
          <SteeringChipList items={sequenceSteeringRecommendations} dataAttr="sequence-steer" />
        </section>

        <section data-section="cinematic-world-state" className="space-y-4">
          <SectionTitle>Cinematic World State</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-world-state-id={cinematicWorldState.worldStateId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="font-bold uppercase text-stone-400">World State ID</p><p className="mt-1 font-black">{cinematicWorldState.worldStateId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Environment Profile</p><p className="mt-1 text-stone-700">{cinematicWorldState.activeEnvironmentProfile}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Atmosphere Persistence</p><p className="mt-1 text-stone-700">{cinematicWorldState.atmospherePersistenceState}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Environmental Lighting</p><p className="mt-1 text-stone-700">{cinematicWorldState.environmentalLightingState}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Spatial Harmony</p><p className="mt-1 text-stone-700">{cinematicWorldState.spatialHarmonyState}</p></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Carry-Over Rules</p><TagList tags={cinematicWorldState.environmentalCarryOverRules} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">Failure History</p><TagList tags={cinematicWorldState.worldStateFailureHistory} /></div>
            </div>
          </article>
        </section>

        <section data-section="environmental-continuity" className="space-y-4">
          <SectionTitle>Environmental Continuity</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-environment-grammar-id={environmentalContinuity.environmentGrammarId}>
            <p className="text-sm font-black">{environmentalContinuity.environmentGrammarId}</p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Lighting Inheritance</dt><dd className="mt-1 font-black">{formatScore3Dec(environmentalContinuity.lightingInheritanceProfile)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Atmosphere Inheritance</dt><dd className="mt-1 font-black">{formatScore3Dec(environmentalContinuity.atmosphereInheritanceProfile)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Spatial Persistence</dt><dd className="mt-1 font-black">{formatScore3Dec(environmentalContinuity.spatialPersistenceProfile)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Environmental Density</dt><dd className="mt-1 font-black">{formatScore3Dec(environmentalContinuity.environmentalDensityProfile)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">World-Scale Consistency</dt><dd className="mt-1 font-black">{formatScore3Dec(environmentalContinuity.worldScaleConsistency)}</dd></div>
            </dl>
          </article>
        </section>

        <section data-section="world-state-drift-detection" className="space-y-4">
          <SectionTitle>World-State Drift Detection</SectionTitle>
          <DriftList items={worldStateDriftDetection} dataAttr="world-state-drift" />
        </section>

        <section data-section="environmental-persistence-timeline" className="space-y-4">
          <SectionTitle>Environmental Persistence Timeline</SectionTitle>
          <TimelineTrendGrid groups={environmentalPersistenceTimelineGroups} />
        </section>

        <section data-section="environmental-steering-recommendations" className="space-y-4">
          <SectionTitle>Environmental Steering Recommendations</SectionTitle>
          <SteeringChipList items={environmentalSteeringRecommendations} dataAttr="environment-steer" />
        </section>

        <section data-section="unified-cinematic-identity" className="space-y-4">
          <SectionTitle>Unified Cinematic Identity</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-identity-id={unifiedCinematicIdentity.cinematicIdentityId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="font-bold uppercase text-stone-400">Identity ID</p><p className="mt-1 font-black">{unifiedCinematicIdentity.cinematicIdentityId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Active Profile</p><p className="mt-1 text-stone-700">{unifiedCinematicIdentity.activeIdentityProfile}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Unified State</p><p className="mt-1 text-stone-700">{unifiedCinematicIdentity.unifiedContinuityState}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Character Identity</p><p className="mt-1 font-black">{formatScore3Dec(unifiedCinematicIdentity.characterIdentityPersistence)}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Emotional Identity</p><p className="mt-1 font-black">{formatScore3Dec(unifiedCinematicIdentity.emotionalIdentityPersistence)}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Environmental Identity</p><p className="mt-1 font-black">{formatScore3Dec(unifiedCinematicIdentity.environmentalIdentityPersistence)}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Cinematic Grammar</p><p className="mt-1 font-black">{formatScore3Dec(unifiedCinematicIdentity.cinematicGrammarPersistence)}</p></div>
            </div>
          </article>
        </section>

        <section data-section="cross-layer-continuity-matrix" className="space-y-4">
          <SectionTitle>Cross-Layer Continuity Matrix</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-4">
            <ul className="space-y-3">
              {crossLayerContinuityMatrix.map((link) => (
                <MetricScoreRow key={link.label} metric={link} dataAttr="continuity-metric" />
              ))}
            </ul>
          </article>
        </section>

        <section data-section="unified-drift-detection" className="space-y-4">
          <SectionTitle>Unified Drift Detection</SectionTitle>
          <DriftList items={unifiedDriftDetection} dataAttr="unified-drift" />
        </section>

        <section data-section="identity-persistence-timeline" className="space-y-4">
          <SectionTitle>Identity Persistence Timeline</SectionTitle>
          <TimelineTrendGrid groups={identityPersistenceTimelineGroups} />
        </section>

        <section data-section="unified-steering-recommendations" className="space-y-4">
          <SectionTitle>Unified Steering Recommendations</SectionTitle>
          <SteeringChipList items={unifiedSteeringRecommendations} dataAttr="unified-steer" />
        </section>

        <section data-section="multi-project-cinematic-memory" className="space-y-4">
          <SectionTitle>Multi-Project Cinematic Memory</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-production-memory-id={multiProjectCinematicMemory.productionMemoryId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="font-bold uppercase text-stone-400">Memory ID</p><p className="mt-1 font-black">{multiProjectCinematicMemory.productionMemoryId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Active Project</p><p className="mt-1 font-black">{multiProjectCinematicMemory.activeProjectId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Project Family</p><p className="mt-1 text-stone-700">{multiProjectCinematicMemory.cinematicProjectFamily}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Shared Identity</p><p className="mt-1 font-black">{formatScore3Dec(multiProjectCinematicMemory.sharedIdentityInheritance)}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Shared Atmosphere</p><p className="mt-1 font-black">{formatScore3Dec(multiProjectCinematicMemory.sharedAtmospherePersistence)}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Shared Emotion</p><p className="mt-1 font-black">{formatScore3Dec(multiProjectCinematicMemory.sharedEmotionalPersistence)}</p></div>
            </div>
            <div className="mt-4"><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity Rules</p><TagList tags={multiProjectCinematicMemory.productionContinuityRules} /></div>
          </article>
        </section>

        <section data-section="production-orchestration" className="space-y-4">
          <SectionTitle>Production Orchestration</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-orchestration-profile-id={productionOrchestration.orchestrationProfileId}>
            <p className="text-sm font-black">{productionOrchestration.orchestrationProfileId}</p>
            <p className="mt-2 text-xs text-stone-600">{productionOrchestration.activeProductionState}</p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Stability Score</dt><dd className="mt-1 font-black">{formatScore3Dec(productionOrchestration.productionStabilityScore)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Style Core Bridge</dt><dd className="mt-1 text-stone-700">{productionOrchestration.sharedStyleCoreBridge}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Grammar Bridge</dt><dd className="mt-1 text-stone-700">{productionOrchestration.sharedCinematicGrammarBridge}</dd></div>
            </dl>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Projects</p><TagList tags={productionOrchestration.continuitySafeProjects} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Projects</p><TagList tags={productionOrchestration.highDriftProjects} /></div>
            </div>
          </article>
        </section>

        <section data-section="cross-project-drift-detection" className="space-y-4">
          <SectionTitle>Cross-Project Drift Detection</SectionTitle>
          <DriftList items={crossProjectDriftDetection} dataAttr="cross-project-drift" />
        </section>

        <section data-section="production-persistence-timeline" className="space-y-4">
          <SectionTitle>Production Persistence Timeline</SectionTitle>
          <TimelineTrendGrid groups={productionPersistenceTimelineGroups} />
        </section>

        <section data-section="production-steering-recommendations" className="space-y-4">
          <SectionTitle>Production Steering Recommendations</SectionTitle>
          <SteeringChipList items={productionSteeringRecommendations} dataAttr="production-steer" />
        </section>

        <section data-section="canonical-evidence-intake" className="space-y-4">
          <SectionTitle>Canonical Evidence Intake</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-evidence-intake-id={canonicalEvidenceIntake.evidenceIntakeId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="font-bold uppercase text-stone-400">Intake ID</p><p className="mt-1 font-black">{canonicalEvidenceIntake.evidenceIntakeId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Generation ID</p><p className="mt-1 font-black">{canonicalEvidenceIntake.canonicalGenerationId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Provider</p><p className="mt-1 text-stone-700">{canonicalEvidenceIntake.sourceProvider}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Project</p><p className="mt-1 text-stone-700">{canonicalEvidenceIntake.sourceProjectId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Prompt Version</p><p className="mt-1 font-black">{canonicalEvidenceIntake.sourcePromptVersion}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Lineage ID</p><p className="mt-1 font-black">{canonicalEvidenceIntake.evidenceLineageId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Replay State</p><p className="mt-1 text-stone-700">{canonicalEvidenceIntake.replayCompatibilityState}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Normalization</p><p className="mt-1 text-stone-700">{canonicalEvidenceIntake.evaluationNormalizationState}</p></div>
            </div>
          </article>
        </section>

        <section data-section="real-evaluation-bridge" className="space-y-4">
          <SectionTitle>Real Evaluation Bridge</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-evaluation-bridge-id={realEvaluationBridge.evaluationBridgeId}>
            <p className="text-sm font-black">{realEvaluationBridge.evaluationBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">{realEvaluationBridge.canonicalReplayState}</p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Continuity Compatibility</dt><dd className="mt-1 font-black">{formatScore3Dec(realEvaluationBridge.evidenceContinuityCompatibility)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Replay Inheritance</dt><dd className="mt-1 font-black">{formatScore3Dec(realEvaluationBridge.replayInheritanceStrength)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Steering Compatibility</dt><dd className="mt-1 font-black">{formatScore3Dec(realEvaluationBridge.steeringCompatibilityScore)}</dd></div>
            </dl>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Evidence</p><TagList tags={realEvaluationBridge.continuitySafeEvidence} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Evidence</p><TagList tags={realEvaluationBridge.highDriftEvidence} /></div>
            </div>
          </article>
        </section>

        <section data-section="evidence-drift-detection" className="space-y-4">
          <SectionTitle>Evidence Drift Detection</SectionTitle>
          <DriftList items={evidenceDriftDetection} dataAttr="evidence-drift" />
        </section>

        <section data-section="replay-persistence-timeline" className="space-y-4">
          <SectionTitle>Replay Persistence Timeline</SectionTitle>
          <TimelineTrendGrid groups={replayPersistenceTimelineGroups} />
        </section>

        <section data-section="evidence-steering-recommendations" className="space-y-4">
          <SectionTitle>Evidence Steering Recommendations</SectionTitle>
          <SteeringChipList items={evidenceSteeringRecommendations} dataAttr="evidence-steer" />
        </section>

        <section data-section="canonical-dataset-registry" className="space-y-4">
          <SectionTitle>Canonical Dataset Registry</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-dataset-registry-id={canonicalDatasetRegistry.datasetRegistryId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="font-bold uppercase text-stone-400">Registry ID</p><p className="mt-1 font-black">{canonicalDatasetRegistry.datasetRegistryId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Active Family</p><p className="mt-1 font-black">{canonicalDatasetRegistry.activeDatasetFamily}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Normalization</p><p className="mt-1 text-stone-700">{canonicalDatasetRegistry.registryNormalizationState}</p></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Canonical Groups</p><TagList tags={canonicalDatasetRegistry.canonicalDatasetGroups} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Families</p><TagList tags={canonicalDatasetRegistry.continuitySafeDatasetFamilies} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Families</p><TagList tags={canonicalDatasetRegistry.highDriftDatasetFamilies} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Inheritance Families</p><TagList tags={canonicalDatasetRegistry.cinematicInheritanceFamilies} /></div>
            </div>
          </article>
        </section>

        <section data-section="evidence-family-orchestration" className="space-y-4">
          <SectionTitle>Evidence Family Orchestration</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-evidence-family-bridge-id={evidenceFamilyOrchestration.evidenceFamilyBridgeId}>
            <p className="text-sm font-black">{evidenceFamilyOrchestration.evidenceFamilyBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">{evidenceFamilyOrchestration.lineageSafeBlendState}</p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Inheritance Compatibility</dt><dd className="mt-1 font-black">{formatScore3Dec(evidenceFamilyOrchestration.continuityInheritanceCompatibility)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Orchestration Inheritance</dt><dd className="mt-1 font-black">{formatScore3Dec(evidenceFamilyOrchestration.orchestrationInheritanceStrength)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Blend Stability</dt><dd className="mt-1 font-black">{formatScore3Dec(evidenceFamilyOrchestration.cinematicBlendStability)}</dd></div>
            </dl>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Active Evidence Blend</p><TagList tags={evidenceFamilyOrchestration.activeEvidenceBlend.map((entry) => `${entry.familyId}:${formatScore3Dec(entry.weight)}`)} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Replay-Safe Groups</p><TagList tags={evidenceFamilyOrchestration.replaySafeDatasetGroups} /></div>
            </div>
          </article>
        </section>

        <section data-section="registry-drift-detection" className="space-y-4">
          <SectionTitle>Registry Drift Detection</SectionTitle>
          <DriftList items={registryDriftDetection} dataAttr="registry-drift" />
        </section>

        <section data-section="registry-persistence-timeline" className="space-y-4">
          <SectionTitle>Registry Persistence Timeline</SectionTitle>
          <TimelineTrendGrid groups={registryPersistenceTimelineGroups} />
        </section>

        <section data-section="registry-steering-recommendations" className="space-y-4">
          <SectionTitle>Dataset Registry Steering Recommendations</SectionTitle>
          <SteeringChipList items={registrySteeringRecommendations} dataAttr="registry-steer" />
        </section>

        <section data-section="canonical-session-intake" className="space-y-4">
          <SectionTitle>Canonical Session Intake</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-generation-session-id={canonicalSessionIntake.generationSessionId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="font-bold uppercase text-stone-400">Generation Session</p><p className="mt-1 font-black">{canonicalSessionIntake.generationSessionId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Canonical Session</p><p className="mt-1 font-black">{canonicalSessionIntake.canonicalSessionId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Provider</p><p className="mt-1 text-stone-700">{canonicalSessionIntake.sessionProvider}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Project</p><p className="mt-1 text-stone-700">{canonicalSessionIntake.sessionProjectId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Prompt Family</p><p className="mt-1 font-black">{canonicalSessionIntake.sessionPromptFamily}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Continuity Compatibility</p><p className="mt-1 font-black">{formatScore3Dec(canonicalSessionIntake.continuitySessionCompatibility)}</p></div>
              <div className="sm:col-span-2"><p className="font-bold uppercase text-stone-400">Replay Lineage</p><p className="mt-1 text-stone-700">{canonicalSessionIntake.sessionReplayLineage}</p></div>
              <div className="sm:col-span-2"><p className="font-bold uppercase text-stone-400">Normalization</p><p className="mt-1 text-stone-700">{canonicalSessionIntake.sessionNormalizationState}</p></div>
            </div>
          </article>
        </section>

        <section data-section="real-generation-session-bridge" className="space-y-4">
          <SectionTitle>Real Generation Session Bridge</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-generation-session-bridge-id={realGenerationSessionBridge.generationSessionBridgeId}>
            <p className="text-sm font-black">{realGenerationSessionBridge.generationSessionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active session · {realGenerationSessionBridge.activeGenerationSession}</p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Orchestration Strength</dt><dd className="mt-1 font-black">{formatScore3Dec(realGenerationSessionBridge.orchestrationSessionStrength)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Provider-Neutral Compatibility</dt><dd className="mt-1 font-black">{formatScore3Dec(realGenerationSessionBridge.providerNeutralCompatibility)}</dd></div>
            </dl>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Replay-Safe Sessions</p><TagList tags={realGenerationSessionBridge.replaySafeSessions} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Sessions</p><TagList tags={realGenerationSessionBridge.highDriftSessions} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Continuity-Compatible Sessions</p><TagList tags={realGenerationSessionBridge.continuityCompatibleSessions} /></div>
            </div>
          </article>
        </section>

        <section data-section="session-drift-detection" className="space-y-4">
          <SectionTitle>Session Drift Detection</SectionTitle>
          <DriftList items={sessionDriftDetection} dataAttr="session-drift" />
        </section>

        <section data-section="session-persistence-timeline" className="space-y-4">
          <SectionTitle>Session Persistence Timeline</SectionTitle>
          <TimelineTrendGrid groups={sessionPersistenceTimelineGroups} />
        </section>

        <section data-section="session-steering-recommendations" className="space-y-4">
          <SectionTitle>Session Steering Recommendations</SectionTitle>
          <SteeringChipList items={sessionSteeringRecommendations} dataAttr="session-steer" />
        </section>

        <section data-section="provider-adapter-readiness" className="space-y-4">
          <SectionTitle>Provider Adapter Readiness</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-provider-adapter-readiness-id={providerAdapterReadiness.providerAdapterReadinessId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="font-bold uppercase text-stone-400">Readiness ID</p><p className="mt-1 font-black">{providerAdapterReadiness.providerAdapterReadinessId}</p></div>
              <div><p className="font-bold uppercase text-stone-400">Active Provider Family</p><p className="mt-1 font-black">{providerAdapterReadiness.activeProviderFamily}</p></div>
              <div className="sm:col-span-2"><p className="font-bold uppercase text-stone-400">Capability Summary</p><p className="mt-1 text-stone-700">{providerAdapterReadiness.providerCapabilitySummary}</p></div>
              <div className="sm:col-span-2"><p className="font-bold uppercase text-stone-400">Switching Policy</p><p className="mt-1 text-stone-700">{providerAdapterReadiness.providerSwitchingPolicy}</p></div>
              <div className="sm:col-span-2"><p className="font-bold uppercase text-stone-400">Neutral Safety State</p><p className="mt-1 text-stone-700">{providerAdapterReadiness.providerNeutralSafetyState}</p></div>
            </div>
            <div className="mt-4"><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Supported Provider Profiles</p><TagList tags={providerAdapterReadiness.supportedProviderProfiles} /></div>
          </article>
        </section>

        <section data-section="session-provider-compatibility" className="space-y-4">
          <SectionTitle>Session Provider Compatibility</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-provider-compatibility-id={sessionProviderCompatibility.providerCompatibilityId}>
            <p className="text-sm font-black">{sessionProviderCompatibility.providerCompatibilityId}</p>
            <p className="mt-2 text-xs text-stone-600">Active session · {sessionProviderCompatibility.activeSessionId}</p>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Provider Compatibility</dt><dd className="mt-1 font-black">{formatScore3Dec(sessionProviderCompatibility.providerCompatibilityScore)}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Adapter Readiness</dt><dd className="mt-1 font-black">{formatScore3Dec(sessionProviderCompatibility.adapterReadinessScore)}</dd></div>
            </dl>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Compatible Providers</p><TagList tags={sessionProviderCompatibility.compatibleProviders} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Providers</p><TagList tags={sessionProviderCompatibility.highDriftProviders} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Continuity-Safe Providers</p><TagList tags={sessionProviderCompatibility.continuitySafeProviders} /></div>
            </div>
          </article>
        </section>

        <section data-section="provider-drift-detection" className="space-y-4">
          <SectionTitle>Provider Drift Detection</SectionTitle>
          <DriftList items={providerDriftDetection} dataAttr="provider-drift" />
        </section>

        <section data-section="provider-readiness-timeline" className="space-y-4">
          <SectionTitle>Provider Readiness Timeline</SectionTitle>
          <TimelineTrendGrid groups={providerReadinessTimelineGroups} />
        </section>

        <section data-section="provider-steering-recommendations" className="space-y-4">
          <SectionTitle>Provider Steering Recommendations</SectionTitle>
          <SteeringChipList items={providerSteeringRecommendations} dataAttr="provider-steer" />
        </section>

        <DashboardSection sectionId="evaluation-intake-normalization" title="Evaluation Intake Normalization">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-evaluation-intake-normalization-id={evaluationIntakeNormalization.evaluationIntakeNormalizationId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Normalization ID" value={evaluationIntakeNormalization.evaluationIntakeNormalizationId} emphasis />
              <KeyValueField label="Linked Session" value={evaluationIntakeNormalization.linkedGenerationSessionId} emphasis />
              <KeyValueField label="Evidence Lineage" value={evaluationIntakeNormalization.linkedEvidenceLineageId} emphasis />
              <KeyValueField label="Continuity Compatibility" value={formatScore3Dec(evaluationIntakeNormalization.continuityEvaluationCompatibility)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Replay Mapping" value={evaluationIntakeNormalization.canonicalReplayMappingState} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Normalization State" value={evaluationIntakeNormalization.normalizationCompatibilityState} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay-Safe Normalization" value={evaluationIntakeNormalization.replaySafeNormalization} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="evidence-session-linking" title="Evidence Session Linking">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-evidence-session-link-id={evidenceSessionLinking.evidenceSessionLinkId}>
            <p className="text-sm font-black">{evidenceSessionLinking.evidenceSessionLinkId}</p>
            <p className="mt-2 text-xs text-stone-600">Active evidence session · {evidenceSessionLinking.activeEvidenceSession}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Lineage Compatibility" value={formatScore3Dec(evidenceSessionLinking.lineageCompatibilityScore)} emphasis />
              <KeyValueField label="Replay Mapping Strength" value={formatScore3Dec(evidenceSessionLinking.replayMappingStrength)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Evidence</p><TagList tags={evidenceSessionLinking.replayLinkedEvidence} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Links</p><TagList tags={evidenceSessionLinking.continuitySafeSessionLinks} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Links</p><TagList tags={evidenceSessionLinking.highDriftSessionLinks} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="intake-drift-detection" title="Intake Drift Detection">
          <DriftList items={intakeDriftDetection} dataAttr="intake-drift" />
        </DashboardSection>

        <DashboardSection sectionId="replay-mapping-timeline" title="Replay Mapping Timeline">
          <TimelineTrendGrid groups={replayMappingTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="intake-steering-recommendations" title="Intake Steering Recommendations">
          <SteeringChipList items={intakeSteeringRecommendations} dataAttr="intake-steer" />
        </DashboardSection>

        <section data-section="style-core-profile" className="space-y-4">
          <SectionTitle>Style Core Profile</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-style-core-id={styleCoreProfile.styleCoreId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Active Style Core</p>
                <p className="mt-1 text-lg font-black">{styleCoreProfile.styleCoreName}</p>
                <p className="mt-1 text-xs text-stone-500">{styleCoreProfile.styleCoreId}</p>
              </div>
              <SeverityChip severity="stable" label="stable" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <div><p className="mb-1 font-bold uppercase text-stone-400">Identity Traits</p><TagList tags={styleCoreProfile.visualIdentityTraits} /></div>
              <div><p className="mb-1 font-bold uppercase text-stone-400">Continuity Rules</p><TagList tags={styleCoreProfile.continuityRules} /></div>
              <div><p className="mb-1 font-bold uppercase text-stone-400">Preservation Rules</p><TagList tags={styleCoreProfile.preservationRules} /></div>
              <div><p className="mb-1 font-bold uppercase text-stone-400">Drift Risk Factors</p><TagList tags={styleCoreProfile.driftRiskFactors} /></div>
              <div><p className="mb-1 font-bold uppercase text-stone-400">Retry Guidelines</p><TagList tags={styleCoreProfile.retryGuidelines} /></div>
            </div>
          </article>
        </section>

        <section data-section="character-continuity-bridge" className="space-y-4">
          <SectionTitle>Character Continuity Bridge</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-character-id={continuityBridge.characterId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Character Lock</p>
                <p className="mt-1 text-sm font-black">{continuityBridge.characterId}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black">{formatScore3Dec(continuityBridge.driftSensitivity)}</span>
                <SeverityChip severity={continuityBridge.continuityPriority} label={continuityBridge.continuityPriority} />
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Face Lock</dt><dd className="mt-1 text-stone-700">{continuityBridge.faceLockProfile}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Silhouette</dt><dd className="mt-1 text-stone-700">{continuityBridge.silhouetteProfile}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Expression</dt><dd className="mt-1 text-stone-700">{continuityBridge.expressionProfile}</dd></div>
            </dl>
          </article>
        </section>

        <section data-section="style-core-decision" className="space-y-4">
          <SectionTitle>Style Core Decision</SectionTitle>
          <article className="rounded-xl border border-emerald-200 bg-white p-5" data-style-core-decision={styleCoreDecision.activeStyleCoreId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Active Style Core</p>
                <p className="mt-1 text-sm font-black">{styleCoreDecision.activeStyleCoreName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black">{formatScore3Dec(styleCoreDecision.continuityGuardScore)}</span>
                <SeverityChip severity={styleCoreDecision.continuityGuardStatus} label="continuity guard" />
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div><p className="mb-2 text-[10px] font-bold uppercase text-emerald-600">Preserved Traits</p><TraitTagList traits={styleCoreDecision.preservedTraits} /></div>
              <div><p className="mb-2 text-[10px] font-bold uppercase text-amber-600">Detected Drift Traits</p><TraitTagList traits={styleCoreDecision.detectedDriftTraits} /></div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-bold uppercase text-stone-400">Retry-Preserve Targets</p>
              <TagList tags={styleCoreDecision.retryPreserveTargets} />
            </div>
          </article>
        </section>

        <section data-section="retry-guard-recommendations" className="space-y-4">
          <SectionTitle>Retry Guard Recommendations</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {retryGuardRecommendations.map((item) => (
              <RetryGuardCard key={item.label} item={item} />
            ))}
          </div>
        </section>

        <section data-section="cinematic-dna-profile" className="space-y-4">
          <SectionTitle>Cinematic DNA Profile</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-profile-id={cinematicDnaProfile.cinematicProfileId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Cinematic Profile</p>
                <p className="mt-1 text-lg font-black">{cinematicDnaProfile.cinematicProfileId}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-md bg-stone-100 px-2 py-1">ghibli {formatScore3Dec(cinematicDnaProfile.directorGrammarBlend.ghibliBase)}</span>
                <span className="rounded-md bg-stone-100 px-2 py-1">shinkai {formatScore3Dec(cinematicDnaProfile.directorGrammarBlend.shinkaiLightDistance)}</span>
                <span className="rounded-md bg-stone-100 px-2 py-1">live-action {formatScore3Dec(cinematicDnaProfile.directorGrammarBlend.liveActionMiseEnScene)}</span>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="font-bold uppercase text-stone-400">Pacing</dt><dd className="mt-1 text-stone-700">{cinematicDnaProfile.pacingPhilosophy}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Framing</dt><dd className="mt-1 text-stone-700">{cinematicDnaProfile.framingRhythm}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Lighting</dt><dd className="mt-1 text-stone-700">{cinematicDnaProfile.lightingBehavior}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Composition</dt><dd className="mt-1 text-stone-700">{cinematicDnaProfile.compositionBias}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Emotion</dt><dd className="mt-1 text-stone-700">{cinematicDnaProfile.emotionalEscalationLogic}</dd></div>
              <div><dt className="font-bold uppercase text-stone-400">Blocking</dt><dd className="mt-1 text-stone-700">{cinematicDnaProfile.spatialBlockingSignature}</dd></div>
            </dl>
          </article>
        </section>

        <section data-section="director-grammar-steering" className="space-y-4">
          <SectionTitle>Director Grammar Steering</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {directorGrammarSteering.map((card) => (
              <GrammarSteeringCard key={card.label} card={card} />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section data-section="cinematic-drift-detection" className="space-y-4">
            <SectionTitle>Cinematic Drift Detection</SectionTitle>
            <DriftList items={cinematicDriftDetection} dataAttr="cinematic-drift" />
          </section>

          <section data-section="dataset-identity" className="space-y-4">
            <SectionTitle>Dataset Identity</SectionTitle>
            <article className="rounded-xl border border-stone-200 bg-white p-4" data-dataset-identity={datasetIdentity.activeGrammarProfile}>
              <dl className="space-y-3 text-xs">
                <div><dt className="font-bold uppercase text-stone-400">Source Family Blend</dt><dd className="mt-1 font-bold text-stone-800">{datasetIdentity.sourceFamilyBlend}</dd></div>
                <div><dt className="font-bold uppercase text-stone-400">Cinematic Lineage</dt><dd className="mt-1 text-stone-700">{datasetIdentity.cinematicLineage}</dd></div>
                <div><dt className="font-bold uppercase text-stone-400">Active Grammar Profile</dt><dd className="mt-1 font-bold text-stone-800">{datasetIdentity.activeGrammarProfile}</dd></div>
                <div><dt className="font-bold uppercase text-stone-400">Continuity-Safe Grammar</dt><dd className="mt-1 text-stone-700">{datasetIdentity.continuitySafeGrammar}</dd></div>
              </dl>
            </article>
          </section>
        </div>

        <section data-section="cinematic-steering-recommendations" className="space-y-4">
          <SectionTitle>Generation Steering Recommendations</SectionTitle>
          <SteeringChipList items={cinematicSteeringRecommendations} dataAttr="cinematic-steer" />
        </section>

        <section data-section="decision-summary" className="space-y-4">
          <SectionTitle>QA Decision Summary</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {decisionSummary.map((panel) => (
              <DecisionSummaryCard key={panel.label} panel={panel} />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section data-section="character-continuity-focus" className="space-y-4">
            <SectionTitle>Character Continuity Focus</SectionTitle>
            <article className="rounded-xl border border-stone-200 bg-white p-4" data-continuity-cycle={latestCycleId}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Latest cycle metrics</p>
              <ul className="mt-3 space-y-3">
                {continuityFocus.map((metric) => (
                  <MetricScoreRow key={metric.label} metric={metric} dataAttr="continuity-metric" />
                ))}
              </ul>
            </article>
          </section>

          <section data-section="prompt-evolution-insights" className="space-y-4">
            <SectionTitle>Prompt Evolution Insights</SectionTitle>
            <article className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-sm font-black">{promptInsights.previousPrompt} → {promptInsights.latestPrompt}</p>
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <p className="font-bold uppercase text-emerald-600">Improvements</p>
                  <ul className="mt-1 space-y-1 text-stone-700">
                    {promptInsights.improvementReasons.map((reason) => (
                      <li key={reason} data-improvement-reason={reason}>+ {reason}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-bold uppercase text-red-600">Regressions</p>
                  <ul className="mt-1 space-y-1 text-stone-700">
                    {promptInsights.regressionReasons.map((reason) => (
                      <li key={reason} data-regression-reason={reason}>− {reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-700">{promptInsights.retrySteeringRecommendation}</p>
            </article>
          </section>
        </div>

        <section data-section="decision-matrix" className="space-y-4">
          <SectionTitle>Visual QA Decision Matrix</SectionTitle>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <tr>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Prompt</th>
                  <th className="px-4 py-3">Drift</th>
                  <th className="px-4 py-3">Continuity</th>
                  <th className="px-4 py-3">Style</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {decisionMatrix.map((row) => (
                  <tr key={row.cycleId} className="border-t border-stone-100" data-matrix-row={row.cycleId}>
                    <td className="px-4 py-3 font-medium">{row.cycleId}</td>
                    <td className="px-4 py-3">{row.promptVersion}</td>
                    <td className="px-4 py-3 font-bold">{formatScore3Dec(row.driftRisk)}</td>
                    <td className="px-4 py-3 font-bold">{formatScore3Dec(row.continuityScore)}</td>
                    <td className="px-4 py-3 font-bold">{formatScore3Dec(row.styleScore)}</td>
                    <td className="px-4 py-3">
                      <SeverityChip severity={row.retryPriority} label={row.retryPriority} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">{row.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section data-section="retry-steering" className="space-y-4">
          <SectionTitle>Retry Steering</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RuleBlock title="Safe Retry Direction" rules={[retrySteering.safeRetryDirection]} tone="safe" />
            <RuleBlock title="Unsafe Retry Direction" rules={[retrySteering.unsafeRetryDirection]} tone="unsafe" />
            <RuleBlock title="Preserve Rules" rules={retrySteering.preserveRules} tone="preserve" />
            <RuleBlock title="Avoid Rules" rules={retrySteering.avoidRules} tone="avoid" />
          </div>
        </section>

        <section data-section="decision-ux" className="space-y-4">
          <SectionTitle>Generation Steering</SectionTitle>
          <div className="grid gap-3 lg:grid-cols-3">
            <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4" data-decision="best-prompt">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Best Prompt Candidate</p>
              <p className="mt-2 text-sm font-black text-emerald-900">{decisions.bestPromptCandidate}</p>
            </article>
            <article className="rounded-xl border border-red-200 bg-red-50 p-4" data-decision="unsafe-prompt">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">Unsafe Prompt Candidate</p>
              <p className="mt-2 text-sm font-black text-red-900">{decisions.unsafePromptCandidate}</p>
            </article>
            <article className="rounded-xl border border-amber-200 bg-amber-50 p-4" data-decision="next-iteration">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Recommended Next Iteration</p>
              <p className="mt-2 text-sm font-bold text-amber-900">{decisions.recommendedNextIteration}</p>
            </article>
          </div>
        </section>

        <section data-section="image-evaluation-intake" className="space-y-4">
          <SectionTitle>Real Image Evaluation Intake</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            {intakes.map((intake) => (
              <article key={intake.cycleId} className="rounded-xl border border-stone-200 bg-white p-5" data-intake-cycle={intake.cycleId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Intake</p>
                    <p className="mt-1 text-sm font-black">{intake.cycleId}</p>
                    <p className="mt-1 text-xs text-stone-500">{intake.imageSetId}</p>
                  </div>
                  <span className="rounded-md bg-stone-100 px-2 py-1 text-[10px] font-bold text-stone-600">{intake.providerName}</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-stone-400">Prompt</dt><dd className="font-bold">{intake.sourcePromptVersion}</dd></div>
                  <div><dt className="text-stone-400">Preset</dt><dd className="font-bold">{intake.generationPreset}</dd></div>
                </dl>
                <div className="mt-4 space-y-3">
                  <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Visual Findings</p><TagList tags={intake.visualFindings} /></div>
                  <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Continuity Flags</p><TagList tags={intake.continuityFlags} /></div>
                  <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Style Signals</p><TagList tags={intake.styleSignals} /></div>
                </div>
                <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-700">{intake.evaluatorSummary}</p>
              </article>
            ))}
          </div>
        </section>

        <section data-section="cycle-timeline" className="space-y-4">
          <SectionTitle>Real Cycle Timeline</SectionTitle>
          <div className="space-y-3">
            {timeline.map((entry) => (
              <article
                key={entry.cycleId}
                data-timeline-cycle={entry.cycleId}
                className={`rounded-xl border bg-white p-4 ${
                  entry.isLatest
                    ? "border-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.25)] ring-1 ring-emerald-100"
                    : "border-stone-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-xs font-black">{entry.cycleOrder}</span>
                    <div>
                      <p className="text-sm font-black">{entry.cycleId}</p>
                      <p className="text-xs text-stone-500">{entry.promptEvolution}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-stone-100 px-2 py-1 font-bold">drift {trendMarker(entry.driftTrend)} {formatDelta3Dec(entry.driftDelta)}</span>
                    <span className="rounded-md bg-stone-100 px-2 py-1 font-bold">stability {trendMarker(entry.stabilityTrend)} {formatScore3Dec(entry.stabilityScore)}</span>
                    {entry.continuityRecovery ? (
                      <span className="rounded-md bg-emerald-100 px-2 py-1 font-bold text-emerald-800">continuity recovery</span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section data-section="real-test-cycles" className="space-y-4">
          <SectionTitle>Real Test Cycles</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            {cycles.map((cycle) => (
              <article
                key={cycle.cycleId}
                data-cycle-id={cycle.cycleId}
                data-latest-cycle={cycle.isLatest ? "true" : "false"}
                className={`rounded-xl border bg-white p-5 ${
                  cycle.isLatest
                    ? "border-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.25)] ring-1 ring-emerald-100"
                    : "border-stone-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Cycle</p>
                    <p className="mt-1 text-lg font-black">{cycle.cycleId}</p>
                    <p className="mt-1 text-xs text-stone-500">{cycle.promptVersion}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusBandClass(cycle.statusBand)}`}>
                    {cycle.statusBand}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div><dt className="text-stone-400">Style</dt><dd className="font-bold">{formatScore3Dec(cycle.styleConsistencyScore)}</dd></div>
                  <div><dt className="text-stone-400">Character</dt><dd className="font-bold">{formatScore3Dec(cycle.characterConsistencyScore)}</dd></div>
                  <div><dt className="text-stone-400">Emotion</dt><dd className="font-bold">{formatScore3Dec(cycle.emotionalContinuityScore)}</dd></div>
                  <div><dt className="text-stone-400">Drift Risk</dt><dd className="font-bold">{formatScore3Dec(cycle.promptDriftRisk)}</dd></div>
                  <div><dt className="text-stone-400">Over-Correct</dt><dd className="font-bold">{formatScore3Dec(cycle.overCorrectionRisk)}</dd></div>
                  <div><dt className="text-stone-400">Stability</dt><dd className="font-bold">{formatScore3Dec(cycle.stabilityScore)}</dd></div>
                </dl>
                <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-700" data-next-request-summary={cycle.cycleId}>
                  {cycle.nextRequestSummary}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section data-section="severity-findings" className="space-y-4">
            <SectionTitle>Visual Findings Severity</SectionTitle>
            <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
              <FindingGroup title="Continuity Issues" findings={continuityFindings} />
              <FindingGroup title="Style Issues" findings={styleFindings} />
            </div>
          </section>

          <section data-section="next-request-improvements" className="space-y-4">
            <SectionTitle>Next Request Improvements</SectionTitle>
            <ul className="space-y-2 rounded-xl border border-stone-200 bg-white p-4">
              {DASHBOARD_NEXT_REQUEST_IMPROVEMENTS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-stone-700" data-improvement={item}>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section data-section="ranking-evolution" className="space-y-4">
          <SectionTitle>Ranking Evolution</SectionTitle>
          <article className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400">Previous → Latest</p>
                <p className="mt-1 text-sm font-black">{evolution.previousCycleId} → {evolution.latestCycleId}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400">Drift Delta</p>
                <p className="mt-1 text-sm font-black">{formatDelta3Dec(evolution.driftDelta)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400">Continuity Delta</p>
                <p className="mt-1 text-sm font-black">{formatDelta3Dec(evolution.continuityDelta)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-stone-400">Stability Trend</p>
                <p className="mt-1 text-sm font-black">{trendMarker(evolution.stabilityTrend)} {formatScore3Dec(evolution.latestStability)}</p>
              </div>
            </div>
          </article>
        </section>

        <section data-section="ranking-table" className="space-y-4">
          <SectionTitle>Style Stability Ranking</SectionTitle>
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Stability</th>
                  <th className="px-4 py-3">Bar</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payload.rankingPreviewRows.map((row, index) => (
                  <tr key={row.previewRowId} className="border-t border-stone-100" data-ranking-row={row.cycleReportId}>
                    <td className="px-4 py-3 font-black">{row.displayRank}</td>
                    <td className="px-4 py-3 font-medium">{row.cycleReportId}</td>
                    <td className="px-4 py-3 text-xs text-stone-500">{DASHBOARD_RANKING_SORT_LABELS[index] ?? "cycle"}</td>
                    <td className="px-4 py-3 font-bold">{formatScore3Dec(row.stabilityScore)}</td>
                    <td className="px-4 py-3"><ScoreBar score={row.stabilityScore} /></td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusBandClass(row.statusBand)}`}>
                        {row.statusBand}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section data-section="heatmap-rows" className="space-y-4">
          <SectionTitle>Regression Heatmap</SectionTitle>
          <div className="space-y-4">
            {heatmapGroups.map((group) => (
              <div key={group.cycleReportId} className="overflow-hidden rounded-xl border border-stone-200 bg-white" data-heatmap-group={group.cycleReportId}>
                <div className="border-b border-stone-100 bg-stone-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-stone-500">
                  {group.cycleReportId}
                </div>
                <table className="min-w-full text-left text-sm">
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.previewRowId} className="border-t border-stone-100" data-heatmap-row={`${row.cycleReportId}:${row.signalKind}`}>
                        <td className="w-28 px-4 py-3 text-stone-500">{row.signalKind}</td>
                        <td className="px-4 py-3 font-bold">{formatScore3Dec(row.intensityScore)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${severityBandClass(row.severityBand)}`}>
                            {row.severityBand}
                          </span>
                        </td>
                        <td className="px-4 py-3"><ScoreBar score={row.renderWeight} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>

        <section data-section="trend-signals" className="space-y-4">
          <SectionTitle>Trend Signals</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {trendSlots.map((signalKind) => (
              <article key={signalKind} className="rounded-xl border border-stone-200 bg-white p-4" data-trend-signal={signalKind}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Signal</p>
                <p className="mt-2 text-sm font-black capitalize">{signalKind}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
