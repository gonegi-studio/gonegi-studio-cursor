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
  buildPendingEvaluationQueue,
  buildEvaluationStagingBridge,
  buildQueueDriftDetection,
  buildQueuePersistenceTimeline,
  buildQueueSteeringRecommendations,
  buildReplayPreparationLayer,
  buildCinematicSequenceReplayBridge,
  buildReplayPrepDriftDetection,
  buildReplayPrepPersistenceTimeline,
  buildReplayPrepSteeringRecommendations,
  buildReplayEvaluationOrchestration,
  buildCinematicReplayRoutingBridge,
  buildReplayEvaluationDriftDetection,
  buildReplayEvaluationPersistenceTimeline,
  buildReplayEvaluationSteeringRecommendations,
  buildReplayRuntimeBridge,
  buildRuntimeSessionOrchestration,
  buildReplayRuntimeDriftDetection,
  buildReplayRuntimePersistenceTimeline,
  buildReplayRuntimeSteeringRecommendations,
  buildCinematicSequenceStateLayer,
  buildSceneStateTransitionBridge,
  buildSequenceStateDriftDetection,
  buildSequenceStateTimeline,
  buildSequenceStateSteeringRecommendations,
  buildCinematicStateGraph,
  buildMultiSequenceGraphBridge,
  buildGraphDriftDetection,
  buildGraphPersistenceTimeline,
  buildGraphSteeringRecommendations,
  buildCinematicEmotionalMemoryGraph,
  buildEmotionalTransitionMemoryBridge,
  buildEmotionalMemoryDriftDetection,
  buildEmotionalMemoryTimeline,
  buildEmotionalMemorySteeringRecommendations,
  buildCinematicIntentMemory,
  buildIntentTransitionRoutingBridge,
  buildIntentDriftDetection,
  buildIntentPersistenceTimeline,
  buildIntentSteeringRecommendations,
  buildCinematicIntentResolutionGraph,
  buildIntentResolutionRoutingBridge,
  buildIntentResolutionDriftDetection,
  buildIntentResolutionTimeline,
  buildIntentResolutionSteeringRecommendations,
  buildCinematicDestinationMemory,
  buildDestinationRoutingBridge,
  buildDestinationDriftDetection,
  buildDestinationPersistenceTimeline,
  buildDestinationSteeringRecommendations,
  buildCinematicResolutionPersistence,
  buildResolutionTransitionBridge,
  buildResolutionDriftDetection,
  buildResolutionPersistenceTimeline,
  buildResolutionSteeringRecommendations,
  buildCinematicClosureMemory,
  buildClosureTransitionBridge,
  buildClosureDriftDetection,
  buildClosurePersistenceTimeline,
  buildClosureSteeringRecommendations,
  buildCinematicAfterglowMemory,
  buildAfterglowTransitionBridge,
  buildAfterglowDriftDetection,
  buildAfterglowPersistenceTimeline,
  buildAfterglowSteeringRecommendations,
  buildCinematicEchoPersistence,
  buildEchoTransitionBridge,
  buildEchoDriftDetection,
  buildEchoPersistenceTimeline,
  buildEchoSteeringRecommendations,
  buildRealDatasetIntakeLayer,
  buildCinematicDnaExtractionBridge,
  buildImageAppLinkageReadiness,
  buildDatasetIntakeTimeline,
  buildDatasetIntakeSteeringRecommendations,
  buildRealVideoSampleIntakeSchema,
  buildVideoSceneSegmentationReadiness,
  buildCinematicFeatureExtractionReadiness,
  buildVideoToDatasetNormalizationTimeline,
  buildVideoSampleSteeringRecommendations,
  buildPilotSceneSegmentationSchema,
  buildCinematicShotTransitionBridge,
  buildEmotionalBeatSegmentation,
  buildSceneIndexPersistenceTimeline,
  buildSceneSegmentationSteeringRecommendations,
  buildCinematicDnaSchemaLayer,
  buildEmotionalToneExtractionBridge,
  buildLightingStyleInheritanceMap,
  buildCompositionPatternTimeline,
  buildCinematicDnaSteeringRecommendations,
  buildImageAppLinkageBridge,
  buildStyleCoreCompatibilityMap,
  buildCharacterCoreCompatibilityMap,
  buildPromptRecipeRoutingTimeline,
  buildImageAppSteeringRecommendations,
  buildStyleCoreOrchestrationLayer,
  buildWarmToneStyleInheritanceBridge,
  buildCinematicTextureContinuityMap,
  buildStyleDriftPersistenceTimeline,
  buildStyleCoreSteeringRecommendations,
  buildCharacterContinuityOrchestrationLayer,
  buildFaceSilhouetteContinuityBridge,
  buildCostumeColorInheritanceMap,
  buildEmotionalExpressionPersistenceTimeline,
  buildCharacterOrchestrationSteeringRecommendations,
  buildCinematicMotionOrchestrationLayer,
  buildCameraMovementContinuityBridge,
  buildCinematicPacingRhythmMap,
  buildMotionPersistenceTimeline,
  buildMotionOrchestrationSteeringRecommendations,
  buildCinematicNarrativeRhythmLayer,
  buildEmotionalPacingSyncBridge,
  buildCinematicBeatContinuityMap,
  buildNarrativeRhythmPersistenceTimeline,
  buildNarrativeRhythmSteeringRecommendations,
  buildCinematicWorldStateLayer,
  buildAtmosphericContinuityBridge,
  buildLocationMemoryInheritanceMap,
  buildWorldStatePersistenceTimeline,
  buildWorldStateSteeringRecommendations,
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
  groupQueuePersistenceTimelineByDimension,
  groupReplayPrepPersistenceTimelineByDimension,
  groupReplayEvaluationPersistenceTimelineByDimension,
  groupReplayRuntimePersistenceTimelineByDimension,
  groupSequenceStateTimelineByDimension,
  groupGraphPersistenceTimelineByDimension,
  groupEmotionalMemoryTimelineByDimension,
  groupIntentPersistenceTimelineByDimension,
  groupIntentResolutionTimelineByDimension,
  groupDestinationPersistenceTimelineByDimension,
  groupResolutionPersistenceTimelineByDimension,
  groupClosurePersistenceTimelineByDimension,
  groupAfterglowPersistenceTimelineByDimension,
  groupEchoPersistenceTimelineByDimension,
  groupDatasetIntakeTimelineByDimension,
  groupVideoToDatasetNormalizationTimelineByDimension,
  groupSceneIndexPersistenceTimelineByDimension,
  groupCompositionPatternTimelineByDimension,
  groupPromptRecipeRoutingTimelineByDimension,
  groupStyleDriftPersistenceTimelineByDimension,
  groupEmotionalExpressionPersistenceTimelineByDimension,
  groupMotionPersistenceTimelineByDimension,
  groupNarrativeRhythmPersistenceTimelineByDimension,
  groupWorldStatePersistenceTimelineByDimension,
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
  const pendingEvaluationQueue = buildPendingEvaluationQueue();
  const evaluationStagingBridge = buildEvaluationStagingBridge();
  const queueDriftDetection = buildQueueDriftDetection();
  const queuePersistenceTimeline = buildQueuePersistenceTimeline(payload);
  const queuePersistenceTimelineGroups = groupQueuePersistenceTimelineByDimension(queuePersistenceTimeline);
  const queueSteeringRecommendations = buildQueueSteeringRecommendations();
  const replayPreparationLayer = buildReplayPreparationLayer();
  const cinematicSequenceReplayBridge = buildCinematicSequenceReplayBridge();
  const replayPrepDriftDetection = buildReplayPrepDriftDetection();
  const replayPrepPersistenceTimeline = buildReplayPrepPersistenceTimeline(payload);
  const replayPrepPersistenceTimelineGroups = groupReplayPrepPersistenceTimelineByDimension(replayPrepPersistenceTimeline);
  const replayPrepSteeringRecommendations = buildReplayPrepSteeringRecommendations();
  const replayEvaluationOrchestration = buildReplayEvaluationOrchestration();
  const cinematicReplayRoutingBridge = buildCinematicReplayRoutingBridge();
  const replayEvaluationDriftDetection = buildReplayEvaluationDriftDetection();
  const replayEvaluationPersistenceTimeline = buildReplayEvaluationPersistenceTimeline(payload);
  const replayEvaluationPersistenceTimelineGroups = groupReplayEvaluationPersistenceTimelineByDimension(replayEvaluationPersistenceTimeline);
  const replayEvaluationSteeringRecommendations = buildReplayEvaluationSteeringRecommendations();
  const replayRuntimeBridge = buildReplayRuntimeBridge();
  const runtimeSessionOrchestration = buildRuntimeSessionOrchestration();
  const replayRuntimeDriftDetection = buildReplayRuntimeDriftDetection();
  const replayRuntimePersistenceTimeline = buildReplayRuntimePersistenceTimeline(payload);
  const replayRuntimePersistenceTimelineGroups = groupReplayRuntimePersistenceTimelineByDimension(replayRuntimePersistenceTimeline);
  const replayRuntimeSteeringRecommendations = buildReplayRuntimeSteeringRecommendations();
  const cinematicSequenceStateLayer = buildCinematicSequenceStateLayer();
  const sceneStateTransitionBridge = buildSceneStateTransitionBridge();
  const sequenceStateDriftDetection = buildSequenceStateDriftDetection();
  const sequenceStateTimeline = buildSequenceStateTimeline(payload);
  const sequenceStateTimelineGroups = groupSequenceStateTimelineByDimension(sequenceStateTimeline);
  const sequenceStateSteeringRecommendations = buildSequenceStateSteeringRecommendations();
  const cinematicStateGraph = buildCinematicStateGraph();
  const multiSequenceGraphBridge = buildMultiSequenceGraphBridge();
  const graphDriftDetection = buildGraphDriftDetection();
  const graphPersistenceTimeline = buildGraphPersistenceTimeline(payload);
  const graphPersistenceTimelineGroups = groupGraphPersistenceTimelineByDimension(graphPersistenceTimeline);
  const graphSteeringRecommendations = buildGraphSteeringRecommendations();
  const cinematicEmotionalMemoryGraph = buildCinematicEmotionalMemoryGraph();
  const emotionalTransitionMemoryBridge = buildEmotionalTransitionMemoryBridge();
  const emotionalMemoryDriftDetection = buildEmotionalMemoryDriftDetection();
  const emotionalMemoryTimeline = buildEmotionalMemoryTimeline(payload);
  const emotionalMemoryTimelineGroups = groupEmotionalMemoryTimelineByDimension(emotionalMemoryTimeline);
  const emotionalMemorySteeringRecommendations = buildEmotionalMemorySteeringRecommendations();
  const cinematicIntentMemory = buildCinematicIntentMemory();
  const intentTransitionRoutingBridge = buildIntentTransitionRoutingBridge();
  const intentDriftDetection = buildIntentDriftDetection();
  const intentPersistenceTimeline = buildIntentPersistenceTimeline(payload);
  const intentPersistenceTimelineGroups = groupIntentPersistenceTimelineByDimension(intentPersistenceTimeline);
  const intentSteeringRecommendations = buildIntentSteeringRecommendations();
  const cinematicIntentResolutionGraph = buildCinematicIntentResolutionGraph();
  const intentResolutionRoutingBridge = buildIntentResolutionRoutingBridge();
  const intentResolutionDriftDetection = buildIntentResolutionDriftDetection();
  const intentResolutionTimeline = buildIntentResolutionTimeline(payload);
  const intentResolutionTimelineGroups = groupIntentResolutionTimelineByDimension(intentResolutionTimeline);
  const intentResolutionSteeringRecommendations = buildIntentResolutionSteeringRecommendations();
  const cinematicDestinationMemory = buildCinematicDestinationMemory();
  const destinationRoutingBridge = buildDestinationRoutingBridge();
  const destinationDriftDetection = buildDestinationDriftDetection();
  const destinationPersistenceTimeline = buildDestinationPersistenceTimeline(payload);
  const destinationPersistenceTimelineGroups = groupDestinationPersistenceTimelineByDimension(destinationPersistenceTimeline);
  const destinationSteeringRecommendations = buildDestinationSteeringRecommendations();
  const cinematicResolutionPersistence = buildCinematicResolutionPersistence();
  const resolutionTransitionBridge = buildResolutionTransitionBridge();
  const resolutionDriftDetection = buildResolutionDriftDetection();
  const resolutionPersistenceTimeline = buildResolutionPersistenceTimeline(payload);
  const resolutionPersistenceTimelineGroups = groupResolutionPersistenceTimelineByDimension(resolutionPersistenceTimeline);
  const resolutionSteeringRecommendations = buildResolutionSteeringRecommendations();
  const cinematicClosureMemory = buildCinematicClosureMemory();
  const closureTransitionBridge = buildClosureTransitionBridge();
  const closureDriftDetection = buildClosureDriftDetection();
  const closurePersistenceTimeline = buildClosurePersistenceTimeline(payload);
  const closurePersistenceTimelineGroups = groupClosurePersistenceTimelineByDimension(closurePersistenceTimeline);
  const closureSteeringRecommendations = buildClosureSteeringRecommendations();
  const cinematicAfterglowMemory = buildCinematicAfterglowMemory();
  const afterglowTransitionBridge = buildAfterglowTransitionBridge();
  const afterglowDriftDetection = buildAfterglowDriftDetection();
  const afterglowPersistenceTimeline = buildAfterglowPersistenceTimeline(payload);
  const afterglowPersistenceTimelineGroups = groupAfterglowPersistenceTimelineByDimension(afterglowPersistenceTimeline);
  const afterglowSteeringRecommendations = buildAfterglowSteeringRecommendations();
  const cinematicEchoPersistence = buildCinematicEchoPersistence();
  const echoTransitionBridge = buildEchoTransitionBridge();
  const echoDriftDetection = buildEchoDriftDetection();
  const echoPersistenceTimeline = buildEchoPersistenceTimeline(payload);
  const echoPersistenceTimelineGroups = groupEchoPersistenceTimelineByDimension(echoPersistenceTimeline);
  const echoSteeringRecommendations = buildEchoSteeringRecommendations();
  const realDatasetIntakeLayer = buildRealDatasetIntakeLayer();
  const cinematicDnaExtractionBridge = buildCinematicDnaExtractionBridge();
  const imageAppLinkageReadiness = buildImageAppLinkageReadiness();
  const datasetIntakeTimeline = buildDatasetIntakeTimeline(payload);
  const datasetIntakeTimelineGroups = groupDatasetIntakeTimelineByDimension(datasetIntakeTimeline);
  const datasetIntakeSteeringRecommendations = buildDatasetIntakeSteeringRecommendations();
  const realVideoSampleIntakeSchema = buildRealVideoSampleIntakeSchema();
  const videoSceneSegmentationReadiness = buildVideoSceneSegmentationReadiness();
  const cinematicFeatureExtractionReadiness = buildCinematicFeatureExtractionReadiness();
  const videoToDatasetNormalizationTimeline = buildVideoToDatasetNormalizationTimeline(payload);
  const videoToDatasetNormalizationTimelineGroups = groupVideoToDatasetNormalizationTimelineByDimension(videoToDatasetNormalizationTimeline);
  const videoSampleSteeringRecommendations = buildVideoSampleSteeringRecommendations();
  const pilotSceneSegmentationSchema = buildPilotSceneSegmentationSchema();
  const cinematicShotTransitionBridge = buildCinematicShotTransitionBridge();
  const emotionalBeatSegmentation = buildEmotionalBeatSegmentation();
  const sceneIndexPersistenceTimeline = buildSceneIndexPersistenceTimeline(payload);
  const sceneIndexPersistenceTimelineGroups = groupSceneIndexPersistenceTimelineByDimension(sceneIndexPersistenceTimeline);
  const sceneSegmentationSteeringRecommendations = buildSceneSegmentationSteeringRecommendations();
  const cinematicDnaSchemaLayer = buildCinematicDnaSchemaLayer();
  const emotionalToneExtractionBridge = buildEmotionalToneExtractionBridge();
  const lightingStyleInheritanceMap = buildLightingStyleInheritanceMap();
  const compositionPatternTimeline = buildCompositionPatternTimeline(payload);
  const compositionPatternTimelineGroups = groupCompositionPatternTimelineByDimension(compositionPatternTimeline);
  const cinematicDnaSteeringRecommendations = buildCinematicDnaSteeringRecommendations();
  const imageAppLinkageBridge = buildImageAppLinkageBridge();
  const styleCoreCompatibilityMap = buildStyleCoreCompatibilityMap();
  const characterCoreCompatibilityMap = buildCharacterCoreCompatibilityMap();
  const promptRecipeRoutingTimeline = buildPromptRecipeRoutingTimeline(payload);
  const promptRecipeRoutingTimelineGroups = groupPromptRecipeRoutingTimelineByDimension(promptRecipeRoutingTimeline);
  const imageAppSteeringRecommendations = buildImageAppSteeringRecommendations();
  const styleCoreOrchestrationLayer = buildStyleCoreOrchestrationLayer();
  const warmToneStyleInheritanceBridge = buildWarmToneStyleInheritanceBridge();
  const cinematicTextureContinuityMap = buildCinematicTextureContinuityMap();
  const styleDriftPersistenceTimeline = buildStyleDriftPersistenceTimeline(payload);
  const styleDriftPersistenceTimelineGroups = groupStyleDriftPersistenceTimelineByDimension(styleDriftPersistenceTimeline);
  const styleCoreSteeringRecommendations = buildStyleCoreSteeringRecommendations();
  const characterContinuityOrchestrationLayer = buildCharacterContinuityOrchestrationLayer();
  const faceSilhouetteContinuityBridge = buildFaceSilhouetteContinuityBridge();
  const costumeColorInheritanceMap = buildCostumeColorInheritanceMap();
  const emotionalExpressionPersistenceTimeline = buildEmotionalExpressionPersistenceTimeline(payload);
  const emotionalExpressionPersistenceTimelineGroups = groupEmotionalExpressionPersistenceTimelineByDimension(emotionalExpressionPersistenceTimeline);
  const characterOrchestrationSteeringRecommendations = buildCharacterOrchestrationSteeringRecommendations();
  const cinematicMotionOrchestrationLayer = buildCinematicMotionOrchestrationLayer();
  const cameraMovementContinuityBridge = buildCameraMovementContinuityBridge();
  const cinematicPacingRhythmMap = buildCinematicPacingRhythmMap();
  const motionPersistenceTimeline = buildMotionPersistenceTimeline(payload);
  const motionPersistenceTimelineGroups = groupMotionPersistenceTimelineByDimension(motionPersistenceTimeline);
  const motionOrchestrationSteeringRecommendations = buildMotionOrchestrationSteeringRecommendations();
  const cinematicNarrativeRhythmLayer = buildCinematicNarrativeRhythmLayer();
  const emotionalPacingSyncBridge = buildEmotionalPacingSyncBridge();
  const cinematicBeatContinuityMap = buildCinematicBeatContinuityMap();
  const narrativeRhythmPersistenceTimeline = buildNarrativeRhythmPersistenceTimeline(payload);
  const narrativeRhythmPersistenceTimelineGroups = groupNarrativeRhythmPersistenceTimelineByDimension(narrativeRhythmPersistenceTimeline);
  const narrativeRhythmSteeringRecommendations = buildNarrativeRhythmSteeringRecommendations();
  const cinematicWorldStateLayer = buildCinematicWorldStateLayer();
  const atmosphericContinuityBridge = buildAtmosphericContinuityBridge();
  const locationMemoryInheritanceMap = buildLocationMemoryInheritanceMap();
  const worldStatePersistenceTimeline = buildWorldStatePersistenceTimeline(payload);
  const worldStatePersistenceTimelineGroups = groupWorldStatePersistenceTimelineByDimension(worldStatePersistenceTimeline);
  const worldStateSteeringRecommendations = buildWorldStateSteeringRecommendations();
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

        <DashboardSection sectionId="pending-evaluation-queue" title="Pending Evaluation Queue">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-pending-evaluation-queue-id={pendingEvaluationQueue.pendingEvaluationQueueId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Queue ID" value={pendingEvaluationQueue.pendingEvaluationQueueId} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Replay-Ready State" value={pendingEvaluationQueue.replayReadyQueueState} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Normalization State" value={pendingEvaluationQueue.queueNormalizationState} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Active Pending Sessions</p><TagList tags={pendingEvaluationQueue.activePendingSessions} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Queued Evidence Groups</p><TagList tags={pendingEvaluationQueue.queuedEvidenceGroups} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Groups</p><TagList tags={pendingEvaluationQueue.continuitySafeQueueGroups} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Groups</p><TagList tags={pendingEvaluationQueue.highDriftQueueGroups} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="evaluation-staging-bridge" title="Evaluation Staging Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-evaluation-staging-bridge-id={evaluationStagingBridge.evaluationStagingBridgeId}>
            <p className="text-sm font-black">{evaluationStagingBridge.evaluationStagingBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active staging session · {evaluationStagingBridge.activeStagingSession}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Staging Compatibility" value={formatScore3Dec(evaluationStagingBridge.stagingCompatibilityScore)} emphasis />
              <KeyValueField label="Queue Replay Strength" value={formatScore3Dec(evaluationStagingBridge.queueReplayStrength)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Queue</p><TagList tags={evaluationStagingBridge.replayLinkedQueue} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity Evaluation Queue</p><TagList tags={evaluationStagingBridge.continuityEvaluationQueue} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Evaluation Queue</p><TagList tags={evaluationStagingBridge.highDriftEvaluationQueue} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="queue-drift-detection" title="Queue Drift Detection">
          <DriftList items={queueDriftDetection} dataAttr="queue-drift" />
        </DashboardSection>

        <DashboardSection sectionId="queue-persistence-timeline" title="Queue Persistence Timeline">
          <TimelineTrendGrid groups={queuePersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="queue-steering-recommendations" title="Queue Steering Recommendations">
          <SteeringChipList items={queueSteeringRecommendations} dataAttr="queue-steer" />
        </DashboardSection>

        <DashboardSection sectionId="replay-preparation-layer" title="Replay Preparation Layer">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-replay-preparation-id={replayPreparationLayer.replayPreparationId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Preparation ID" value={replayPreparationLayer.replayPreparationId} emphasis />
              <KeyValueField label="Active Replay Session" value={replayPreparationLayer.activeReplaySession} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Lineage Normalization" value={replayPreparationLayer.replayLineageNormalization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay Compatibility" value={replayPreparationLayer.cinematicReplayCompatibility} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Ready Evidence</p><TagList tags={replayPreparationLayer.replayReadyEvidence} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Replay Groups</p><TagList tags={replayPreparationLayer.continuitySafeReplayGroups} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Replay Groups</p><TagList tags={replayPreparationLayer.highDriftReplayGroups} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="cinematic-sequence-replay-bridge" title="Cinematic Sequence Replay Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-replay-bridge-id={cinematicSequenceReplayBridge.cinematicReplayBridgeId}>
            <p className="text-sm font-black">{cinematicSequenceReplayBridge.cinematicReplayBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active sequence replay · {cinematicSequenceReplayBridge.activeSequenceReplay}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Sequence Strength" value={formatScore3Dec(cinematicSequenceReplayBridge.replaySequenceStrength)} emphasis />
              <KeyValueField label="Replay Persistence" value={formatScore3Dec(cinematicSequenceReplayBridge.cinematicReplayPersistence)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Sequences</p><TagList tags={cinematicSequenceReplayBridge.replayLinkedSequences} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Sequences</p><TagList tags={cinematicSequenceReplayBridge.continuitySafeReplaySequences} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Sequences</p><TagList tags={cinematicSequenceReplayBridge.highDriftReplaySequences} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="replay-preparation-drift-detection" title="Replay Drift Detection">
          <DriftList items={replayPrepDriftDetection} dataAttr="replay-prep-drift" />
        </DashboardSection>

        <DashboardSection sectionId="replay-preparation-timeline" title="Replay Persistence Timeline">
          <TimelineTrendGrid groups={replayPrepPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="replay-preparation-steering" title="Replay Steering Recommendations">
          <SteeringChipList items={replayPrepSteeringRecommendations} dataAttr="replay-prep-steer" />
        </DashboardSection>

        <DashboardSection sectionId="replay-evaluation-orchestration" title="Replay Evaluation Orchestration">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-replay-evaluation-orchestration-id={replayEvaluationOrchestration.replayEvaluationOrchestrationId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Orchestration ID" value={replayEvaluationOrchestration.replayEvaluationOrchestrationId} emphasis />
              <KeyValueField label="Active Evaluation Session" value={replayEvaluationOrchestration.activeReplayEvaluationSession} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Normalization State" value={replayEvaluationOrchestration.replayEvaluationNormalizationState} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Evaluation Compatibility" value={replayEvaluationOrchestration.cinematicReplayEvaluationCompatibility} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Safe Evaluation Groups</p><TagList tags={replayEvaluationOrchestration.replaySafeEvaluationGroups} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Evaluations</p><TagList tags={replayEvaluationOrchestration.continuitySafeReplayEvaluations} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Evaluations</p><TagList tags={replayEvaluationOrchestration.highDriftReplayEvaluations} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="cinematic-replay-routing-bridge" title="Cinematic Replay Routing Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-replay-routing-bridge-id={cinematicReplayRoutingBridge.cinematicReplayRoutingBridgeId}>
            <p className="text-sm font-black">{cinematicReplayRoutingBridge.cinematicReplayRoutingBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active replay route · {cinematicReplayRoutingBridge.activeReplayRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Routing Strength" value={formatScore3Dec(cinematicReplayRoutingBridge.replayRoutingStrength)} emphasis />
              <KeyValueField label="Routing Persistence" value={formatScore3Dec(cinematicReplayRoutingBridge.cinematicReplayRoutingPersistence)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Routes</p><TagList tags={cinematicReplayRoutingBridge.replayLinkedRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Routes</p><TagList tags={cinematicReplayRoutingBridge.continuitySafeReplayRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Routes</p><TagList tags={cinematicReplayRoutingBridge.highDriftReplayRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="replay-evaluation-drift-detection" title="Replay Evaluation Drift Detection">
          <DriftList items={replayEvaluationDriftDetection} dataAttr="replay-evaluation-drift" />
        </DashboardSection>

        <DashboardSection sectionId="replay-evaluation-persistence-timeline" title="Replay Evaluation Persistence Timeline">
          <TimelineTrendGrid groups={replayEvaluationPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="replay-evaluation-steering" title="Replay Evaluation Steering Recommendations">
          <SteeringChipList items={replayEvaluationSteeringRecommendations} dataAttr="replay-evaluation-steer" />
        </DashboardSection>

        <DashboardSection sectionId="replay-runtime-bridge" title="Replay Runtime Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-replay-runtime-bridge-id={replayRuntimeBridge.replayRuntimeBridgeId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Runtime Bridge ID" value={replayRuntimeBridge.replayRuntimeBridgeId} emphasis />
              <KeyValueField label="Active Runtime Session" value={replayRuntimeBridge.activeReplayRuntimeSession} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Normalization State" value={replayRuntimeBridge.runtimeNormalizationState} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Runtime Compatibility" value={replayRuntimeBridge.cinematicReplayRuntimeCompatibility} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Safe Runtime Groups</p><TagList tags={replayRuntimeBridge.replaySafeRuntimeGroups} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Runtime</p><TagList tags={replayRuntimeBridge.continuitySafeReplayRuntime} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Runtime</p><TagList tags={replayRuntimeBridge.highDriftReplayRuntime} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="runtime-session-orchestration" title="Runtime Session Orchestration">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-runtime-session-orchestration-id={runtimeSessionOrchestration.runtimeSessionOrchestrationId}>
            <p className="text-sm font-black">{runtimeSessionOrchestration.runtimeSessionOrchestrationId}</p>
            <p className="mt-2 text-xs text-stone-600">Active runtime route · {runtimeSessionOrchestration.activeRuntimeRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Orchestration Strength" value={formatScore3Dec(runtimeSessionOrchestration.runtimeOrchestrationStrength)} emphasis />
              <KeyValueField label="Persistence Score" value={formatScore3Dec(runtimeSessionOrchestration.runtimePersistenceScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Runtime Routes</p><TagList tags={runtimeSessionOrchestration.replayLinkedRuntimeRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Routes</p><TagList tags={runtimeSessionOrchestration.continuitySafeRuntimeRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Routes</p><TagList tags={runtimeSessionOrchestration.highDriftRuntimeRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="replay-runtime-drift-detection" title="Replay Runtime Drift Detection">
          <DriftList items={replayRuntimeDriftDetection} dataAttr="replay-runtime-drift" />
        </DashboardSection>

        <DashboardSection sectionId="replay-runtime-persistence-timeline" title="Replay Runtime Persistence Timeline">
          <TimelineTrendGrid groups={replayRuntimePersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="replay-runtime-steering" title="Replay Runtime Steering Recommendations">
          <SteeringChipList items={replayRuntimeSteeringRecommendations} dataAttr="replay-runtime-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-sequence-state-layer" title="Cinematic Sequence State Layer">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-sequence-state-machine-id={cinematicSequenceStateLayer.sequenceStateMachineId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="State Machine ID" value={cinematicSequenceStateLayer.sequenceStateMachineId} emphasis />
              <KeyValueField label="Active Sequence State" value={cinematicSequenceStateLayer.activeSequenceState} emphasis />
              <KeyValueField label="State Persistence" value={formatScore3Dec(cinematicSequenceStateLayer.cinematicStatePersistence)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Prior Scene Inheritance" value={cinematicSequenceStateLayer.priorSceneStateInheritance} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Next Scene Readiness" value={cinematicSequenceStateLayer.nextSceneStateReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Continuity State Lock" value={cinematicSequenceStateLayer.continuityStateLock} /></div>
              <div className="sm:col-span-2"><KeyValueField label="State Normalization" value={cinematicSequenceStateLayer.stateNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="scene-state-transition-bridge" title="Scene State Transition Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-scene-state-transition-bridge-id={sceneStateTransitionBridge.sceneStateTransitionBridgeId}>
            <p className="text-sm font-black">{sceneStateTransitionBridge.sceneStateTransitionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active transition route · {sceneStateTransitionBridge.activeTransitionRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Transition Strength" value={formatScore3Dec(sceneStateTransitionBridge.transitionStrength)} emphasis />
              <KeyValueField label="State Persistence Score" value={formatScore3Dec(sceneStateTransitionBridge.statePersistenceScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked State Routes</p><TagList tags={sceneStateTransitionBridge.replayLinkedStateRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Routes</p><TagList tags={sceneStateTransitionBridge.continuitySafeStateRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Routes</p><TagList tags={sceneStateTransitionBridge.highDriftStateRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="sequence-state-drift-detection" title="Sequence State Drift Detection">
          <DriftList items={sequenceStateDriftDetection} dataAttr="sequence-state-drift" />
        </DashboardSection>

        <DashboardSection sectionId="sequence-state-timeline" title="Sequence State Timeline">
          <TimelineTrendGrid groups={sequenceStateTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="sequence-state-steering" title="Sequence State Steering Recommendations">
          <SteeringChipList items={sequenceStateSteeringRecommendations} dataAttr="sequence-state-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-state-graph" title="Cinematic State Graph">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-state-graph-id={cinematicStateGraph.cinematicStateGraphId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="State Graph ID" value={cinematicStateGraph.cinematicStateGraphId} emphasis />
              <KeyValueField label="Active Graph State" value={cinematicStateGraph.activeGraphState} emphasis />
              <KeyValueField label="Graph Persistence" value={formatScore3Dec(cinematicStateGraph.cinematicGraphPersistence)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Prior Graph Inheritance" value={cinematicStateGraph.priorGraphInheritance} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Next Transition Readiness" value={cinematicStateGraph.nextGraphTransitionReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Graph Continuity Lock" value={cinematicStateGraph.graphContinuityLock} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Graph Normalization" value={cinematicStateGraph.graphNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="multi-sequence-graph-bridge" title="Multi-Sequence Graph Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-multi-sequence-graph-bridge-id={multiSequenceGraphBridge.multiSequenceGraphBridgeId}>
            <p className="text-sm font-black">{multiSequenceGraphBridge.multiSequenceGraphBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active graph route · {multiSequenceGraphBridge.activeGraphRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Routing Strength" value={formatScore3Dec(multiSequenceGraphBridge.graphRoutingStrength)} emphasis />
              <KeyValueField label="Persistence Score" value={formatScore3Dec(multiSequenceGraphBridge.graphPersistenceScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Graph Routes</p><TagList tags={multiSequenceGraphBridge.replayLinkedGraphRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Routes</p><TagList tags={multiSequenceGraphBridge.continuitySafeGraphRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Routes</p><TagList tags={multiSequenceGraphBridge.highDriftGraphRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="graph-drift-detection" title="Graph Drift Detection">
          <DriftList items={graphDriftDetection} dataAttr="graph-drift" />
        </DashboardSection>

        <DashboardSection sectionId="graph-persistence-timeline" title="Graph Persistence Timeline">
          <TimelineTrendGrid groups={graphPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="graph-steering" title="Graph Steering Recommendations">
          <SteeringChipList items={graphSteeringRecommendations} dataAttr="graph-steer" />
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

        <DashboardSection sectionId="cinematic-emotional-memory-graph" title="Cinematic Emotional Memory Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-emotional-memory-graph-id={cinematicEmotionalMemoryGraph.emotionalMemoryGraphId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Memory Graph ID" value={cinematicEmotionalMemoryGraph.emotionalMemoryGraphId} emphasis />
              <KeyValueField label="Active Emotional Memory State" value={cinematicEmotionalMemoryGraph.activeEmotionalMemoryState} emphasis />
              <KeyValueField label="Emotional Memory Persistence" value={formatScore3Dec(cinematicEmotionalMemoryGraph.emotionalMemoryPersistence)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Inherited Emotional Tone" value={cinematicEmotionalMemoryGraph.inheritedEmotionalTone} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Persistence Lock" value={cinematicEmotionalMemoryGraph.emotionalPersistenceLock} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Carry-Over State" value={cinematicEmotionalMemoryGraph.emotionalCarryOverState} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Memory Compatibility" value={cinematicEmotionalMemoryGraph.cinematicMemoryCompatibility} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="emotional-transition-memory-bridge" title="Emotional Transition Memory Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-emotional-transition-memory-bridge-id={emotionalTransitionMemoryBridge.emotionalTransitionBridgeId}>
            <p className="text-sm font-black">{emotionalTransitionMemoryBridge.emotionalTransitionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active emotional transition · {emotionalTransitionMemoryBridge.activeEmotionalTransition}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Transition Strength" value={formatScore3Dec(emotionalTransitionMemoryBridge.emotionalTransitionStrength)} emphasis />
              <KeyValueField label="Transition Persistence" value={formatScore3Dec(emotionalTransitionMemoryBridge.emotionalTransitionPersistence)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Emotional Transitions</p><TagList tags={emotionalTransitionMemoryBridge.replayLinkedEmotionalTransitions} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Transitions</p><TagList tags={emotionalTransitionMemoryBridge.continuitySafeEmotionalTransitions} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Transitions</p><TagList tags={emotionalTransitionMemoryBridge.highDriftEmotionalTransitions} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="emotional-memory-drift-detection" title="Emotional Memory Drift Detection">
          <DriftList items={emotionalMemoryDriftDetection} dataAttr="emotional-memory-drift" />
        </DashboardSection>

        <DashboardSection sectionId="emotional-memory-timeline" title="Emotional Memory Timeline">
          <TimelineTrendGrid groups={emotionalMemoryTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="emotional-memory-steering" title="Emotional Memory Steering Recommendations">
          <SteeringChipList items={emotionalMemorySteeringRecommendations} dataAttr="emotional-memory-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-intent-memory" title="Cinematic Intent Memory Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-intent-memory-id={cinematicIntentMemory.cinematicIntentMemoryId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Intent Memory ID" value={cinematicIntentMemory.cinematicIntentMemoryId} emphasis />
              <KeyValueField label="Active Narrative Intent" value={cinematicIntentMemory.activeNarrativeIntent} emphasis />
              <KeyValueField label="Intent Persistence Score" value={formatScore3Dec(cinematicIntentMemory.intentPersistenceScore)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Active Cinematic Purpose" value={cinematicIntentMemory.activeCinematicPurpose} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Destination State" value={cinematicIntentMemory.emotionalDestinationState} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Scene Purpose Persistence" value={cinematicIntentMemory.scenePurposePersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Intent Lock" value={cinematicIntentMemory.cinematicIntentLock} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Intent Normalization" value={cinematicIntentMemory.intentNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="intent-transition-routing-bridge" title="Intent Transition Routing Bridge Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-intent-transition-routing-bridge-id={intentTransitionRoutingBridge.intentTransitionRoutingBridgeId}>
            <p className="text-sm font-black">{intentTransitionRoutingBridge.intentTransitionRoutingBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active intent route · {intentTransitionRoutingBridge.activeIntentRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Routing Strength" value={formatScore3Dec(intentTransitionRoutingBridge.intentRoutingStrength)} emphasis />
              <KeyValueField label="Intent Persistence" value={formatScore3Dec(intentTransitionRoutingBridge.cinematicIntentPersistence)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Intent Routes</p><TagList tags={intentTransitionRoutingBridge.replayLinkedIntentRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Intent Routes</p><TagList tags={intentTransitionRoutingBridge.continuitySafeIntentRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Intent Routes</p><TagList tags={intentTransitionRoutingBridge.highDriftIntentRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="intent-drift-detection" title="Intent Drift Detection Map">
          <DriftList items={intentDriftDetection} dataAttr="intent-drift" />
        </DashboardSection>

        <DashboardSection sectionId="intent-persistence-timeline" title="Intent Persistence Timeline Map">
          <TimelineTrendGrid groups={intentPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="intent-steering-recommendations" title="Intent Steering Recommendation Map">
          <SteeringChipList items={intentSteeringRecommendations} dataAttr="intent-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-intent-resolution-graph" title="Cinematic Intent Resolution Graph">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-intent-resolution-graph-id={cinematicIntentResolutionGraph.intentResolutionGraphId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Resolution Graph ID" value={cinematicIntentResolutionGraph.intentResolutionGraphId} emphasis />
              <KeyValueField label="Active Resolution State" value={cinematicIntentResolutionGraph.activeResolutionState} emphasis />
              <KeyValueField label="Intent Convergence Score" value={formatScore3Dec(cinematicIntentResolutionGraph.intentConvergenceScore)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Emotional Resolution Target" value={cinematicIntentResolutionGraph.emotionalResolutionTarget} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Closure State" value={cinematicIntentResolutionGraph.cinematicClosureState} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Resolution Normalization" value={cinematicIntentResolutionGraph.resolutionNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="intent-resolution-routing-bridge" title="Intent Resolution Routing Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-intent-resolution-routing-bridge-id={intentResolutionRoutingBridge.intentResolutionRoutingBridgeId}>
            <p className="text-sm font-black">{intentResolutionRoutingBridge.intentResolutionRoutingBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active resolution route · {intentResolutionRoutingBridge.activeResolutionRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Routing Strength" value={formatScore3Dec(intentResolutionRoutingBridge.resolutionRoutingStrength)} emphasis />
              <KeyValueField label="Resolution Persistence" value={formatScore3Dec(intentResolutionRoutingBridge.cinematicResolutionPersistence)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Resolution Routes</p><TagList tags={intentResolutionRoutingBridge.replayLinkedResolutionRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Resolution Routes</p><TagList tags={intentResolutionRoutingBridge.continuitySafeResolutionRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Resolution Routes</p><TagList tags={intentResolutionRoutingBridge.highDriftResolutionRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="intent-resolution-drift-detection" title="Intent Resolution Drift Detection">
          <DriftList items={intentResolutionDriftDetection} dataAttr="intent-resolution-drift" />
        </DashboardSection>

        <DashboardSection sectionId="intent-resolution-timeline" title="Intent Resolution Timeline">
          <TimelineTrendGrid groups={intentResolutionTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="intent-resolution-steering" title="Intent Resolution Steering Recommendations">
          <SteeringChipList items={intentResolutionSteeringRecommendations} dataAttr="intent-resolution-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-destination-memory" title="Cinematic Destination Memory">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-destination-memory-id={cinematicDestinationMemory.cinematicDestinationMemoryId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Destination Memory ID" value={cinematicDestinationMemory.cinematicDestinationMemoryId} emphasis />
              <KeyValueField label="Active Destination State" value={cinematicDestinationMemory.activeDestinationState} emphasis />
              <KeyValueField label="Cinematic Destination Score" value={formatScore3Dec(cinematicDestinationMemory.cinematicDestinationScore)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Emotional Destination Persistence" value={cinematicDestinationMemory.emotionalDestinationPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Endpoint State" value={cinematicDestinationMemory.cinematicEndpointState} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Destination Continuity Lock" value={cinematicDestinationMemory.destinationContinuityLock} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Destination Normalization" value={cinematicDestinationMemory.destinationNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="destination-routing-bridge" title="Destination Routing Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-destination-routing-bridge-id={destinationRoutingBridge.destinationRoutingBridgeId}>
            <p className="text-sm font-black">{destinationRoutingBridge.destinationRoutingBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active destination route · {destinationRoutingBridge.activeDestinationRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Routing Strength" value={formatScore3Dec(destinationRoutingBridge.destinationRoutingStrength)} emphasis />
              <KeyValueField label="Destination Persistence" value={formatScore3Dec(destinationRoutingBridge.cinematicDestinationPersistence)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Destination Routes</p><TagList tags={destinationRoutingBridge.replayLinkedDestinationRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Destination Routes</p><TagList tags={destinationRoutingBridge.continuitySafeDestinationRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Destination Routes</p><TagList tags={destinationRoutingBridge.highDriftDestinationRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="destination-drift-detection" title="Destination Drift Detection">
          <DriftList items={destinationDriftDetection} dataAttr="destination-drift" />
        </DashboardSection>

        <DashboardSection sectionId="destination-persistence-timeline" title="Destination Persistence Timeline">
          <TimelineTrendGrid groups={destinationPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="destination-steering" title="Destination Steering Recommendations">
          <SteeringChipList items={destinationSteeringRecommendations} dataAttr="destination-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-resolution-persistence" title="Cinematic Resolution Persistence Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-resolution-persistence-id={cinematicResolutionPersistence.cinematicResolutionPersistenceId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Resolution Persistence ID" value={cinematicResolutionPersistence.cinematicResolutionPersistenceId} emphasis />
              <KeyValueField label="Active Resolution State" value={cinematicResolutionPersistence.activeResolutionState} emphasis />
              <KeyValueField label="Cinematic Resolution Stability" value={formatScore3Dec(cinematicResolutionPersistence.cinematicResolutionStability)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Emotional Closure Inheritance" value={cinematicResolutionPersistence.emotionalClosureInheritance} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Narrative Resolution Persistence" value={cinematicResolutionPersistence.narrativeResolutionPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Continuity Resolution Lock" value={cinematicResolutionPersistence.continuityResolutionLock} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Resolution Normalization" value={cinematicResolutionPersistence.resolutionNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="resolution-transition-bridge" title="Resolution Transition Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-resolution-transition-bridge-id={resolutionTransitionBridge.resolutionTransitionBridgeId}>
            <p className="text-sm font-black">{resolutionTransitionBridge.resolutionTransitionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active resolution route · {resolutionTransitionBridge.activeResolutionRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Routing Strength" value={formatScore3Dec(resolutionTransitionBridge.resolutionRoutingStrength)} emphasis />
              <KeyValueField label="Resolution Persistence Score" value={formatScore3Dec(resolutionTransitionBridge.resolutionPersistenceScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Resolution Routes</p><TagList tags={resolutionTransitionBridge.replayLinkedResolutionRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Resolution Routes</p><TagList tags={resolutionTransitionBridge.continuitySafeResolutionRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Resolution Routes</p><TagList tags={resolutionTransitionBridge.highDriftResolutionRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="resolution-drift-detection" title="Resolution Drift Detection">
          <DriftList items={resolutionDriftDetection} dataAttr="resolution-drift" />
        </DashboardSection>

        <DashboardSection sectionId="resolution-persistence-timeline" title="Resolution Persistence Timeline">
          <TimelineTrendGrid groups={resolutionPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="resolution-steering" title="Resolution Steering Recommendations">
          <SteeringChipList items={resolutionSteeringRecommendations} dataAttr="resolution-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-closure-memory" title="Cinematic Closure Memory">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-closure-memory-id={cinematicClosureMemory.cinematicClosureMemoryId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Closure Memory ID" value={cinematicClosureMemory.cinematicClosureMemoryId} emphasis />
              <KeyValueField label="Active Closure State" value={cinematicClosureMemory.activeClosureState} emphasis />
              <KeyValueField label="Cinematic Closure Score" value={formatScore3Dec(cinematicClosureMemory.cinematicClosureScore)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Emotional Closure Stability" value={cinematicClosureMemory.emotionalClosureStability} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Ending-State Inheritance" value={cinematicClosureMemory.endingStateInheritance} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Final Scene Calmness Persistence" value={cinematicClosureMemory.finalSceneCalmnessPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Closure Continuity Lock" value={cinematicClosureMemory.closureContinuityLock} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Closure Normalization" value={cinematicClosureMemory.closureNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="closure-transition-bridge" title="Closure Transition Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-closure-transition-bridge-id={closureTransitionBridge.closureTransitionBridgeId}>
            <p className="text-sm font-black">{closureTransitionBridge.closureTransitionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active closure route · {closureTransitionBridge.activeClosureRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Routing Strength" value={formatScore3Dec(closureTransitionBridge.closureRoutingStrength)} emphasis />
              <KeyValueField label="Closure Persistence Score" value={formatScore3Dec(closureTransitionBridge.closurePersistenceScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Closure Routes</p><TagList tags={closureTransitionBridge.replayLinkedClosureRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Closure Routes</p><TagList tags={closureTransitionBridge.continuitySafeClosureRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Closure Routes</p><TagList tags={closureTransitionBridge.highDriftClosureRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="closure-drift-detection" title="Closure Drift Detection">
          <DriftList items={closureDriftDetection} dataAttr="closure-drift" />
        </DashboardSection>

        <DashboardSection sectionId="closure-persistence-timeline" title="Closure Persistence Timeline">
          <TimelineTrendGrid groups={closurePersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="closure-steering" title="Closure Steering Recommendations">
          <SteeringChipList items={closureSteeringRecommendations} dataAttr="closure-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-afterglow-memory" title="Cinematic Afterglow Memory">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-afterglow-memory-id={cinematicAfterglowMemory.cinematicAfterglowMemoryId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Afterglow Memory ID" value={cinematicAfterglowMemory.cinematicAfterglowMemoryId} emphasis />
              <KeyValueField label="Active Afterglow State" value={cinematicAfterglowMemory.activeAfterglowState} emphasis />
              <KeyValueField label="Cinematic Afterglow Score" value={formatScore3Dec(cinematicAfterglowMemory.cinematicAfterglowScore)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Lingering Emotion Continuity" value={cinematicAfterglowMemory.lingeringEmotionContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Aftertaste Persistence" value={cinematicAfterglowMemory.emotionalAftertastePersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Post-Scene Calmness Continuity" value={cinematicAfterglowMemory.postSceneCalmnessContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Emotional Residue" value={cinematicAfterglowMemory.cinematicEmotionalResidue} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Ending Echo Stability" value={cinematicAfterglowMemory.endingEchoStability} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Afterglow Normalization" value={cinematicAfterglowMemory.afterglowNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="afterglow-transition-bridge" title="Afterglow Transition Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-afterglow-transition-bridge-id={afterglowTransitionBridge.afterglowTransitionBridgeId}>
            <p className="text-sm font-black">{afterglowTransitionBridge.afterglowTransitionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active afterglow route · {afterglowTransitionBridge.activeAfterglowRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Routing Strength" value={formatScore3Dec(afterglowTransitionBridge.afterglowRoutingStrength)} emphasis />
              <KeyValueField label="Afterglow Persistence Score" value={formatScore3Dec(afterglowTransitionBridge.afterglowPersistenceScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Afterglow Routes</p><TagList tags={afterglowTransitionBridge.replayLinkedAfterglowRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Afterglow Routes</p><TagList tags={afterglowTransitionBridge.continuitySafeAfterglowRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Afterglow Routes</p><TagList tags={afterglowTransitionBridge.highDriftAfterglowRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="afterglow-drift-detection" title="Afterglow Drift Detection">
          <DriftList items={afterglowDriftDetection} dataAttr="afterglow-drift" />
        </DashboardSection>

        <DashboardSection sectionId="afterglow-persistence-timeline" title="Afterglow Persistence Timeline">
          <TimelineTrendGrid groups={afterglowPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="afterglow-steering" title="Afterglow Steering Recommendations">
          <SteeringChipList items={afterglowSteeringRecommendations} dataAttr="afterglow-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-echo-persistence" title="Cinematic Echo Persistence">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-echo-persistence-id={cinematicEchoPersistence.cinematicEchoPersistenceId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Echo Persistence ID" value={cinematicEchoPersistence.cinematicEchoPersistenceId} emphasis />
              <KeyValueField label="Active Echo State" value={cinematicEchoPersistence.activeEchoState} emphasis />
              <KeyValueField label="Cinematic Echo Score" value={formatScore3Dec(cinematicEchoPersistence.cinematicEchoScore)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Emotional Echo Remnant" value={cinematicEchoPersistence.emotionalEchoRemnant} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Scene Lingering Atmosphere" value={cinematicEchoPersistence.sceneLingeringAtmosphere} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Memory Persistence Flow" value={cinematicEchoPersistence.memoryPersistenceFlow} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Echo Continuity" value={cinematicEchoPersistence.cinematicEchoContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Echo Residue Stability" value={cinematicEchoPersistence.echoResidueStability} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Echo Normalization" value={cinematicEchoPersistence.echoNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="echo-transition-bridge" title="Echo Transition Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-echo-transition-bridge-id={echoTransitionBridge.echoTransitionBridgeId}>
            <p className="text-sm font-black">{echoTransitionBridge.echoTransitionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active echo route · {echoTransitionBridge.activeEchoRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Routing Strength" value={formatScore3Dec(echoTransitionBridge.echoRoutingStrength)} emphasis />
              <KeyValueField label="Echo Persistence Score" value={formatScore3Dec(echoTransitionBridge.echoPersistenceScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Echo Routes</p><TagList tags={echoTransitionBridge.replayLinkedEchoRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Echo Routes</p><TagList tags={echoTransitionBridge.continuitySafeEchoRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Echo Routes</p><TagList tags={echoTransitionBridge.highDriftEchoRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="echo-drift-detection" title="Echo Drift Detection">
          <DriftList items={echoDriftDetection} dataAttr="echo-drift" />
        </DashboardSection>

        <DashboardSection sectionId="echo-persistence-timeline" title="Echo Persistence Timeline">
          <TimelineTrendGrid groups={echoPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="echo-steering" title="Echo Steering Recommendations">
          <SteeringChipList items={echoSteeringRecommendations} dataAttr="echo-steer" />
        </DashboardSection>

        <DashboardSection sectionId="real-dataset-intake-layer" title="Real Dataset Intake Layer">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-real-dataset-intake-layer-id={realDatasetIntakeLayer.realDatasetIntakeLayerId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Intake Layer ID" value={realDatasetIntakeLayer.realDatasetIntakeLayerId} emphasis />
              <KeyValueField label="Active Intake State" value={realDatasetIntakeLayer.activeIntakeState} emphasis />
              <KeyValueField label="Real Dataset Intake Score" value={formatScore3Dec(realDatasetIntakeLayer.realDatasetIntakeScore)} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Canonical Video Intake Readiness" value={realDatasetIntakeLayer.canonicalVideoIntakeReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Scene Extraction Preparation" value={realDatasetIntakeLayer.cinematicSceneExtractionPreparation} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Continuity Extraction" value={realDatasetIntakeLayer.emotionalContinuityExtraction} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Style-Core Linkage Readiness" value={realDatasetIntakeLayer.styleCoreLinkageReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Character-Core Compatibility" value={realDatasetIntakeLayer.characterCoreCompatibility} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay-Safe Dataset Normalization" value={realDatasetIntakeLayer.replaySafeDatasetNormalization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Intake Normalization" value={realDatasetIntakeLayer.intakeNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="cinematic-dna-extraction-bridge" title="Cinematic DNA Extraction Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-dna-extraction-bridge-id={cinematicDnaExtractionBridge.cinematicDnaExtractionBridgeId}>
            <p className="text-sm font-black">{cinematicDnaExtractionBridge.cinematicDnaExtractionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active extraction route · {cinematicDnaExtractionBridge.activeExtractionRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="DNA Extraction Strength" value={formatScore3Dec(cinematicDnaExtractionBridge.dnaExtractionStrength)} emphasis />
              <KeyValueField label="Cinematic DNA Linkage Score" value={formatScore3Dec(cinematicDnaExtractionBridge.cinematicDnaLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Extraction Routes</p><TagList tags={cinematicDnaExtractionBridge.replayLinkedExtractionRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Extraction Routes</p><TagList tags={cinematicDnaExtractionBridge.continuitySafeExtractionRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Extraction Routes</p><TagList tags={cinematicDnaExtractionBridge.highDriftExtractionRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="image-app-linkage-readiness" title="Image App Linkage Readiness">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-image-app-linkage-readiness-id={imageAppLinkageReadiness.imageAppLinkageReadinessId}>
            <p className="text-sm font-black">{imageAppLinkageReadiness.imageAppLinkageReadinessId}</p>
            <p className="mt-2 text-xs text-stone-600">Active linkage state · {imageAppLinkageReadiness.activeLinkageState}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Linkage Readiness Score" value={formatScore3Dec(imageAppLinkageReadiness.linkageReadinessScore)} emphasis />
              <KeyValueField label="Orchestration Compatibility Score" value={formatScore3Dec(imageAppLinkageReadiness.orchestrationCompatibilityScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Provider-Neutral Preparation" value={imageAppLinkageReadiness.providerNeutralPreparation} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Image App Orchestration Compatibility" value={imageAppLinkageReadiness.imageAppOrchestrationCompatibility} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Ready Linkage Modules</p><TagList tags={imageAppLinkageReadiness.readyLinkageModules} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Pending Linkage Modules</p><TagList tags={imageAppLinkageReadiness.pendingLinkageModules} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="dataset-intake-timeline" title="Dataset Intake Timeline">
          <TimelineTrendGrid groups={datasetIntakeTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="dataset-intake-steering" title="Dataset Intake Steering Recommendations">
          <SteeringChipList items={datasetIntakeSteeringRecommendations} dataAttr="dataset-intake-steer" />
        </DashboardSection>

        <DashboardSection sectionId="real-video-sample-intake-schema" title="Real Video Sample Intake Schema">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-real-video-sample-intake-schema-id={realVideoSampleIntakeSchema.realVideoSampleIntakeSchemaId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Intake Schema ID" value={realVideoSampleIntakeSchema.realVideoSampleIntakeSchemaId} emphasis />
              <KeyValueField label="Canonical Sample Slot" value={realVideoSampleIntakeSchema.canonicalSampleSlotId} emphasis />
              <KeyValueField label="Real Video Sample Score" value={formatScore3Dec(realVideoSampleIntakeSchema.realVideoSampleScore)} emphasis />
              <KeyValueField label="Pilot Video Mode" value={realVideoSampleIntakeSchema.pilotVideoMode} emphasis />
              <KeyValueField label="Future Scale Mode" value={realVideoSampleIntakeSchema.futureScaleMode} emphasis />
              <KeyValueField label="Sample Duration (sec)" value={String(realVideoSampleIntakeSchema.sampleDurationSec)} emphasis />
              <KeyValueField label="Dataset Expansion Target" value={realVideoSampleIntakeSchema.datasetExpansionTarget} emphasis />
              <KeyValueField label="Active Sample State" value={realVideoSampleIntakeSchema.activeSampleState} emphasis />
              <KeyValueField label="Schema Version" value={realVideoSampleIntakeSchema.canonicalVideoIntakeSchemaVersion} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Single Sample Intake Readiness" value={realVideoSampleIntakeSchema.singleSampleIntakeReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Scene-to-Dataset Bridge Readiness" value={realVideoSampleIntakeSchema.sceneToDatasetBridgeReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic DNA Linkage Slot" value={realVideoSampleIntakeSchema.cinematicDnaLinkageSlot} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Image App Steering Slot" value={realVideoSampleIntakeSchema.imageAppSteeringSlot} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Sample Schema Normalization" value={realVideoSampleIntakeSchema.sampleSchemaNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="video-scene-segmentation-readiness" title="Video Scene Segmentation Readiness">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-video-scene-segmentation-readiness-id={videoSceneSegmentationReadiness.videoSceneSegmentationReadinessId}>
            <p className="text-sm font-black">{videoSceneSegmentationReadiness.videoSceneSegmentationReadinessId}</p>
            <p className="mt-2 text-xs text-stone-600">Active segmentation state · {videoSceneSegmentationReadiness.activeSegmentationState}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Segmentation Readiness Score" value={formatScore3Dec(videoSceneSegmentationReadiness.segmentationReadinessScore)} emphasis />
              <KeyValueField label="Scene Boundary Score" value={formatScore3Dec(videoSceneSegmentationReadiness.sceneBoundaryScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Prepared Scene Segments</p><TagList tags={videoSceneSegmentationReadiness.preparedSceneSegments} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Segments</p><TagList tags={videoSceneSegmentationReadiness.continuitySafeSegments} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">Pending Segment Slots</p><TagList tags={videoSceneSegmentationReadiness.pendingSegmentSlots} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="cinematic-feature-extraction-readiness" title="Cinematic Feature Extraction Readiness">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-feature-extraction-readiness-id={cinematicFeatureExtractionReadiness.cinematicFeatureExtractionReadinessId}>
            <p className="text-sm font-black">{cinematicFeatureExtractionReadiness.cinematicFeatureExtractionReadinessId}</p>
            <p className="mt-2 text-xs text-stone-600">Active extraction state · {cinematicFeatureExtractionReadiness.activeExtractionState}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Feature Extraction Readiness Score" value={formatScore3Dec(cinematicFeatureExtractionReadiness.featureExtractionReadinessScore)} emphasis />
              <KeyValueField label="Cinematic Feature Linkage Score" value={formatScore3Dec(cinematicFeatureExtractionReadiness.cinematicFeatureLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Emotional Continuity Extraction Readiness" value={cinematicFeatureExtractionReadiness.emotionalContinuityExtractionReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Style-Core Feature Linkage" value={cinematicFeatureExtractionReadiness.styleCoreFeatureLinkage} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Ready Feature Families</p><TagList tags={cinematicFeatureExtractionReadiness.readyFeatureFamilies} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Pending Feature Families</p><TagList tags={cinematicFeatureExtractionReadiness.pendingFeatureFamilies} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="video-to-dataset-normalization" title="Video-to-Dataset Normalization">
          <TimelineTrendGrid groups={videoToDatasetNormalizationTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="video-sample-steering" title="Video Sample Steering Recommendations">
          <SteeringChipList items={videoSampleSteeringRecommendations} dataAttr="video-sample-steer" />
        </DashboardSection>

        <DashboardSection sectionId="pilot-scene-segmentation-schema" title="Pilot Scene Segmentation Schema">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-pilot-scene-segmentation-schema-id={pilotSceneSegmentationSchema.pilotSceneSegmentationSchemaId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Segmentation Schema ID" value={pilotSceneSegmentationSchema.pilotSceneSegmentationSchemaId} emphasis />
              <KeyValueField label="Pilot Video Mode" value={pilotSceneSegmentationSchema.pilotVideoMode} emphasis />
              <KeyValueField label="Pilot Scene Segmentation Score" value={formatScore3Dec(pilotSceneSegmentationSchema.pilotSceneSegmentationScore)} emphasis />
              <KeyValueField label="Active Segmentation State" value={pilotSceneSegmentationSchema.activeSegmentationState} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Scene Segmentation Readiness" value={pilotSceneSegmentationSchema.sceneSegmentationReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Shot Boundary Continuity" value={pilotSceneSegmentationSchema.shotBoundaryContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Scene Continuity Extraction" value={pilotSceneSegmentationSchema.sceneContinuityExtraction} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Scene Indexing" value={pilotSceneSegmentationSchema.cinematicSceneIndexing} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay-Safe Scene Ordering" value={pilotSceneSegmentationSchema.replaySafeSceneOrdering} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Scene Continuity Normalization" value={pilotSceneSegmentationSchema.sceneContinuityNormalization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Segmentation Schema Normalization" value={pilotSceneSegmentationSchema.segmentationSchemaNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="cinematic-shot-transition-bridge" title="Cinematic Shot Transition Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-shot-transition-bridge-id={cinematicShotTransitionBridge.cinematicShotTransitionBridgeId}>
            <p className="text-sm font-black">{cinematicShotTransitionBridge.cinematicShotTransitionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active transition route · {cinematicShotTransitionBridge.activeTransitionRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Shot Transition Strength" value={formatScore3Dec(cinematicShotTransitionBridge.shotTransitionStrength)} emphasis />
              <KeyValueField label="Transition Continuity Score" value={formatScore3Dec(cinematicShotTransitionBridge.transitionContinuityScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Transition Routes</p><TagList tags={cinematicShotTransitionBridge.replayLinkedTransitionRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Transition Routes</p><TagList tags={cinematicShotTransitionBridge.continuitySafeTransitionRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Transition Routes</p><TagList tags={cinematicShotTransitionBridge.highDriftTransitionRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="emotional-beat-segmentation" title="Emotional Beat Segmentation">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-emotional-beat-segmentation-id={emotionalBeatSegmentation.emotionalBeatSegmentationId}>
            <p className="text-sm font-black">{emotionalBeatSegmentation.emotionalBeatSegmentationId}</p>
            <p className="mt-2 text-xs text-stone-600">Active beat indexing state · {emotionalBeatSegmentation.activeBeatIndexingState}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Beat Segmentation Score" value={formatScore3Dec(emotionalBeatSegmentation.beatSegmentationScore)} emphasis />
              <KeyValueField label="Pacing Continuity Score" value={formatScore3Dec(emotionalBeatSegmentation.pacingContinuityScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Emotional Beat Indexing Readiness" value={emotionalBeatSegmentation.emotionalBeatIndexingReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Pacing Extraction" value={emotionalBeatSegmentation.cinematicPacingExtraction} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Indexed Emotional Beats</p><TagList tags={emotionalBeatSegmentation.indexedEmotionalBeats} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Beats</p><TagList tags={emotionalBeatSegmentation.continuitySafeBeats} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">Pending Beat Slots</p><TagList tags={emotionalBeatSegmentation.pendingBeatSlots} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="scene-index-persistence-timeline" title="Scene Index Persistence Timeline">
          <TimelineTrendGrid groups={sceneIndexPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="scene-segmentation-steering" title="Scene Segmentation Steering Recommendations">
          <SteeringChipList items={sceneSegmentationSteeringRecommendations} dataAttr="scene-segmentation-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-dna-schema-layer" title="Cinematic DNA Schema Layer">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-dna-schema-layer-id={cinematicDnaSchemaLayer.cinematicDnaSchemaLayerId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="DNA Schema Layer ID" value={cinematicDnaSchemaLayer.cinematicDnaSchemaLayerId} emphasis />
              <KeyValueField label="Pilot Video Mode" value={cinematicDnaSchemaLayer.pilotVideoMode} emphasis />
              <KeyValueField label="Cinematic DNA Schema Score" value={formatScore3Dec(cinematicDnaSchemaLayer.cinematicDnaSchemaScore)} emphasis />
              <KeyValueField label="Active DNA Schema State" value={cinematicDnaSchemaLayer.activeDnaSchemaState} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Emotional Warmth Continuity" value={cinematicDnaSchemaLayer.emotionalWarmthContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Framing Persistence" value={cinematicDnaSchemaLayer.cinematicFramingPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Character Continuity Linkage" value={cinematicDnaSchemaLayer.characterContinuityLinkage} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay-Safe Cinematic DNA Normalization" value={cinematicDnaSchemaLayer.replaySafeCinematicDnaNormalization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Style-Core Compatibility Preparation" value={cinematicDnaSchemaLayer.styleCoreCompatibilityPreparation} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Image App Steering Readiness" value={cinematicDnaSchemaLayer.imageAppSteeringReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="DNA Schema Normalization" value={cinematicDnaSchemaLayer.dnaSchemaNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="emotional-tone-extraction-bridge" title="Emotional Tone Extraction Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-emotional-tone-extraction-bridge-id={emotionalToneExtractionBridge.emotionalToneExtractionBridgeId}>
            <p className="text-sm font-black">{emotionalToneExtractionBridge.emotionalToneExtractionBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active tone route · {emotionalToneExtractionBridge.activeToneRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Emotional Tone Strength" value={formatScore3Dec(emotionalToneExtractionBridge.emotionalToneStrength)} emphasis />
              <KeyValueField label="Tone Extraction Score" value={formatScore3Dec(emotionalToneExtractionBridge.toneExtractionScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Tone Routes</p><TagList tags={emotionalToneExtractionBridge.replayLinkedToneRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Tone Routes</p><TagList tags={emotionalToneExtractionBridge.continuitySafeToneRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Tone Routes</p><TagList tags={emotionalToneExtractionBridge.highDriftToneRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="lighting-style-inheritance-map" title="Lighting Style Inheritance Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-lighting-style-inheritance-map-id={lightingStyleInheritanceMap.lightingStyleInheritanceMapId}>
            <p className="text-sm font-black">{lightingStyleInheritanceMap.lightingStyleInheritanceMapId}</p>
            <p className="mt-2 text-xs text-stone-600">Active inheritance state · {lightingStyleInheritanceMap.activeInheritanceState}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Style-Core Linkage Score" value={formatScore3Dec(lightingStyleInheritanceMap.styleCoreLinkageScore)} emphasis />
              <KeyValueField label="Lighting Inheritance Score" value={formatScore3Dec(lightingStyleInheritanceMap.lightingInheritanceScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Lighting Inheritance Readiness" value={lightingStyleInheritanceMap.lightingInheritanceReadiness} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Ready Inheritance Traits</p><TagList tags={lightingStyleInheritanceMap.readyInheritanceTraits} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Pending Inheritance Traits</p><TagList tags={lightingStyleInheritanceMap.pendingInheritanceTraits} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="composition-pattern-timeline" title="Composition Pattern Timeline">
          <TimelineTrendGrid groups={compositionPatternTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-dna-steering" title="Cinematic DNA Steering Recommendations">
          <SteeringChipList items={cinematicDnaSteeringRecommendations} dataAttr="cinematic-dna-steer" />
        </DashboardSection>

        <DashboardSection sectionId="image-app-linkage-bridge" title="Image App Linkage Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-image-app-linkage-bridge-id={imageAppLinkageBridge.imageAppLinkageBridgeId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Linkage Bridge ID" value={imageAppLinkageBridge.imageAppLinkageBridgeId} emphasis />
              <KeyValueField label="Pilot Video Mode" value={imageAppLinkageBridge.pilotVideoMode} emphasis />
              <KeyValueField label="Image App Linkage Bridge Score" value={formatScore3Dec(imageAppLinkageBridge.imageAppLinkageBridgeScore)} emphasis />
              <KeyValueField label="Active Linkage Bridge State" value={imageAppLinkageBridge.activeLinkageBridgeState} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Style-Core Linkage" value={imageAppLinkageBridge.styleCoreLinkage} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Character-Core Linkage" value={imageAppLinkageBridge.characterCoreLinkage} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Prompt Recipe Compatibility" value={imageAppLinkageBridge.promptRecipeCompatibility} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Generation Preset Compatibility" value={imageAppLinkageBridge.generationPresetCompatibility} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Orchestration Bridge Readiness" value={imageAppLinkageBridge.orchestrationBridgeReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Linkage Bridge Normalization" value={imageAppLinkageBridge.linkageBridgeNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="style-core-compatibility-map" title="Style Core Compatibility Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-style-core-compatibility-map-id={styleCoreCompatibilityMap.styleCoreCompatibilityMapId}>
            <p className="text-sm font-black">{styleCoreCompatibilityMap.styleCoreCompatibilityMapId}</p>
            <p className="mt-2 text-xs text-stone-600">Active style-core route · {styleCoreCompatibilityMap.activeStyleCoreRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Style-Core Compatibility Score" value={formatScore3Dec(styleCoreCompatibilityMap.styleCoreCompatibilityScore)} emphasis />
              <KeyValueField label="Generation Preset Linkage Score" value={formatScore3Dec(styleCoreCompatibilityMap.generationPresetLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Style-Core Routes</p><TagList tags={styleCoreCompatibilityMap.replayLinkedStyleCoreRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Style-Core Routes</p><TagList tags={styleCoreCompatibilityMap.continuitySafeStyleCoreRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Style-Core Routes</p><TagList tags={styleCoreCompatibilityMap.highDriftStyleCoreRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="character-core-compatibility-map" title="Character Core Compatibility Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-character-core-compatibility-map-id={characterCoreCompatibilityMap.characterCoreCompatibilityMapId}>
            <p className="text-sm font-black">{characterCoreCompatibilityMap.characterCoreCompatibilityMapId}</p>
            <p className="mt-2 text-xs text-stone-600">Active character-core route · {characterCoreCompatibilityMap.activeCharacterCoreRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Character-Core Compatibility Score" value={formatScore3Dec(characterCoreCompatibilityMap.characterCoreCompatibilityScore)} emphasis />
              <KeyValueField label="Character Continuity Linkage Score" value={formatScore3Dec(characterCoreCompatibilityMap.characterContinuityLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Character-Core Linkage Readiness" value={characterCoreCompatibilityMap.characterCoreLinkageReadiness} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Ready Character-Core Traits</p><TagList tags={characterCoreCompatibilityMap.readyCharacterCoreTraits} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Pending Character-Core Traits</p><TagList tags={characterCoreCompatibilityMap.pendingCharacterCoreTraits} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="prompt-recipe-routing-readiness" title="Prompt Recipe Routing Readiness">
          <TimelineTrendGrid groups={promptRecipeRoutingTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="image-app-steering-readiness" title="Image App Steering Readiness">
          <SteeringChipList items={imageAppSteeringRecommendations} dataAttr="image-app-steer" />
        </DashboardSection>

        <DashboardSection sectionId="style-core-orchestration-layer" title="Style Core Orchestration Layer">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-style-core-orchestration-layer-id={styleCoreOrchestrationLayer.styleCoreOrchestrationLayerId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Orchestration Layer ID" value={styleCoreOrchestrationLayer.styleCoreOrchestrationLayerId} emphasis />
              <KeyValueField label="Pilot Video Mode" value={styleCoreOrchestrationLayer.pilotVideoMode} emphasis />
              <KeyValueField label="Style-Core Orchestration Score" value={formatScore3Dec(styleCoreOrchestrationLayer.styleCoreOrchestrationScore)} emphasis />
              <KeyValueField label="Active Orchestration State" value={styleCoreOrchestrationLayer.activeOrchestrationState} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Warm Emotional Texture Continuity" value={styleCoreOrchestrationLayer.warmEmotionalTextureContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Ghibli-Style Warmth Persistence" value={styleCoreOrchestrationLayer.ghibliStyleWarmthPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Painterly Lighting Inheritance" value={styleCoreOrchestrationLayer.painterlyLightingInheritance} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Atmospheric Continuity Normalization" value={styleCoreOrchestrationLayer.atmosphericContinuityNormalization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Texture Routing" value={styleCoreOrchestrationLayer.cinematicTextureRouting} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay-Safe Style Inheritance" value={styleCoreOrchestrationLayer.replaySafeStyleInheritance} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Style-Core Stabilization Readiness" value={styleCoreOrchestrationLayer.styleCoreStabilizationReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Image App Orchestration Compatibility" value={styleCoreOrchestrationLayer.imageAppOrchestrationCompatibility} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Orchestration Normalization" value={styleCoreOrchestrationLayer.orchestrationNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="warm-tone-style-inheritance-bridge" title="Warm Tone Style Inheritance Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-warm-tone-style-inheritance-bridge-id={warmToneStyleInheritanceBridge.warmToneStyleInheritanceBridgeId}>
            <p className="text-sm font-black">{warmToneStyleInheritanceBridge.warmToneStyleInheritanceBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active warm-tone route · {warmToneStyleInheritanceBridge.activeWarmToneRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Warm-Tone Inheritance Strength" value={formatScore3Dec(warmToneStyleInheritanceBridge.warmToneInheritanceStrength)} emphasis />
              <KeyValueField label="Style Inheritance Orchestration Score" value={formatScore3Dec(warmToneStyleInheritanceBridge.styleInheritanceOrchestrationScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Warm-Tone Routes</p><TagList tags={warmToneStyleInheritanceBridge.replayLinkedWarmToneRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Warm-Tone Routes</p><TagList tags={warmToneStyleInheritanceBridge.continuitySafeWarmToneRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Warm-Tone Routes</p><TagList tags={warmToneStyleInheritanceBridge.highDriftWarmToneRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="cinematic-texture-continuity-map" title="Cinematic Texture Continuity Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-texture-continuity-map-id={cinematicTextureContinuityMap.cinematicTextureContinuityMapId}>
            <p className="text-sm font-black">{cinematicTextureContinuityMap.cinematicTextureContinuityMapId}</p>
            <p className="mt-2 text-xs text-stone-600">Active texture route · {cinematicTextureContinuityMap.activeTextureRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Cinematic Texture Continuity Score" value={formatScore3Dec(cinematicTextureContinuityMap.cinematicTextureContinuityScore)} emphasis />
              <KeyValueField label="Texture Routing Linkage Score" value={formatScore3Dec(cinematicTextureContinuityMap.textureRoutingLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Texture Routing Readiness" value={cinematicTextureContinuityMap.cinematicTextureRoutingReadiness} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Ready Texture Continuity Traits</p><TagList tags={cinematicTextureContinuityMap.readyTextureContinuityTraits} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Pending Texture Continuity Traits</p><TagList tags={cinematicTextureContinuityMap.pendingTextureContinuityTraits} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="style-drift-persistence-timeline" title="Style Drift Persistence Timeline">
          <TimelineTrendGrid groups={styleDriftPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="style-core-steering" title="Style Core Steering Recommendations">
          <SteeringChipList items={styleCoreSteeringRecommendations} dataAttr="style-core-steer" />
        </DashboardSection>

        <DashboardSection sectionId="character-continuity-orchestration-layer" title="Character Continuity Orchestration Layer">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-character-continuity-orchestration-layer-id={characterContinuityOrchestrationLayer.characterContinuityOrchestrationLayerId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Orchestration Layer ID" value={characterContinuityOrchestrationLayer.characterContinuityOrchestrationLayerId} emphasis />
              <KeyValueField label="Pilot Video Mode" value={characterContinuityOrchestrationLayer.pilotVideoMode} emphasis />
              <KeyValueField label="Character Orchestration Score" value={formatScore3Dec(characterContinuityOrchestrationLayer.characterOrchestrationScore)} emphasis />
              <KeyValueField label="Active Character Orchestration State" value={characterContinuityOrchestrationLayer.activeCharacterOrchestrationState} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Character Identity Persistence" value={characterContinuityOrchestrationLayer.characterIdentityPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Silhouette Continuity Readiness" value={characterContinuityOrchestrationLayer.silhouetteContinuityReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Costume Inheritance Normalization" value={characterContinuityOrchestrationLayer.costumeInheritanceNormalization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Expression Continuity" value={characterContinuityOrchestrationLayer.emotionalExpressionContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay-Safe Character Orchestration" value={characterContinuityOrchestrationLayer.replaySafeCharacterOrchestration} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Character Persistence" value={characterContinuityOrchestrationLayer.cinematicCharacterPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Long-Form Consistency Readiness" value={characterContinuityOrchestrationLayer.longFormConsistencyReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Image App Character Steering Compatibility" value={characterContinuityOrchestrationLayer.imageAppCharacterSteeringCompatibility} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Character Orchestration Normalization" value={characterContinuityOrchestrationLayer.characterOrchestrationNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="face-silhouette-continuity-bridge" title="Face Silhouette Continuity Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-face-silhouette-continuity-bridge-id={faceSilhouetteContinuityBridge.faceSilhouetteContinuityBridgeId}>
            <p className="text-sm font-black">{faceSilhouetteContinuityBridge.faceSilhouetteContinuityBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active silhouette route · {faceSilhouetteContinuityBridge.activeSilhouetteRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Silhouette Continuity Strength" value={formatScore3Dec(faceSilhouetteContinuityBridge.silhouetteContinuityStrength)} emphasis />
              <KeyValueField label="Face Silhouette Linkage Score" value={formatScore3Dec(faceSilhouetteContinuityBridge.faceSilhouetteLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Silhouette Routes</p><TagList tags={faceSilhouetteContinuityBridge.replayLinkedSilhouetteRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Silhouette Routes</p><TagList tags={faceSilhouetteContinuityBridge.continuitySafeSilhouetteRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Silhouette Routes</p><TagList tags={faceSilhouetteContinuityBridge.highDriftSilhouetteRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="costume-color-inheritance-map" title="Costume Color Inheritance Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-costume-color-inheritance-map-id={costumeColorInheritanceMap.costumeColorInheritanceMapId}>
            <p className="text-sm font-black">{costumeColorInheritanceMap.costumeColorInheritanceMapId}</p>
            <p className="mt-2 text-xs text-stone-600">Active costume route · {costumeColorInheritanceMap.activeCostumeRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Costume Inheritance Score" value={formatScore3Dec(costumeColorInheritanceMap.costumeInheritanceScore)} emphasis />
              <KeyValueField label="Color Continuity Linkage Score" value={formatScore3Dec(costumeColorInheritanceMap.colorContinuityLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Costume Inheritance Readiness" value={costumeColorInheritanceMap.costumeInheritanceReadiness} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Ready Costume Color Traits</p><TagList tags={costumeColorInheritanceMap.readyCostumeColorTraits} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Pending Costume Color Traits</p><TagList tags={costumeColorInheritanceMap.pendingCostumeColorTraits} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="emotional-expression-persistence-timeline" title="Emotional Expression Persistence Timeline">
          <TimelineTrendGrid groups={emotionalExpressionPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="character-orchestration-steering" title="Character Orchestration Steering Recommendations">
          <SteeringChipList items={characterOrchestrationSteeringRecommendations} dataAttr="character-orchestration-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-motion-orchestration-layer" title="Cinematic Motion Orchestration Layer">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-motion-orchestration-layer-id={cinematicMotionOrchestrationLayer.cinematicMotionOrchestrationLayerId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Motion Orchestration Layer ID" value={cinematicMotionOrchestrationLayer.cinematicMotionOrchestrationLayerId} emphasis />
              <KeyValueField label="Pilot Video Mode" value={cinematicMotionOrchestrationLayer.pilotVideoMode} emphasis />
              <KeyValueField label="Motion Orchestration Score" value={formatScore3Dec(cinematicMotionOrchestrationLayer.motionOrchestrationScore)} emphasis />
              <KeyValueField label="Active Motion Orchestration State" value={cinematicMotionOrchestrationLayer.activeMotionOrchestrationState} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Motion Continuity" value={cinematicMotionOrchestrationLayer.cinematicMotionContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Camera Movement Persistence" value={cinematicMotionOrchestrationLayer.cameraMovementPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Pacing Rhythm Inheritance" value={cinematicMotionOrchestrationLayer.pacingRhythmInheritance} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay-Safe Motion Orchestration" value={cinematicMotionOrchestrationLayer.replaySafeMotionOrchestration} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Transition Flow Normalization" value={cinematicMotionOrchestrationLayer.transitionFlowNormalization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Movement Grammar Readiness" value={cinematicMotionOrchestrationLayer.cinematicMovementGrammarReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Video Generation Compatibility" value={cinematicMotionOrchestrationLayer.videoGenerationCompatibility} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Pacing Continuity" value={cinematicMotionOrchestrationLayer.emotionalPacingContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Motion Orchestration Normalization" value={cinematicMotionOrchestrationLayer.motionOrchestrationNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="camera-movement-continuity-bridge" title="Camera Movement Continuity Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-camera-movement-continuity-bridge-id={cameraMovementContinuityBridge.cameraMovementContinuityBridgeId}>
            <p className="text-sm font-black">{cameraMovementContinuityBridge.cameraMovementContinuityBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active camera route · {cameraMovementContinuityBridge.activeCameraRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Camera Movement Continuity Strength" value={formatScore3Dec(cameraMovementContinuityBridge.cameraMovementContinuityStrength)} emphasis />
              <KeyValueField label="Camera Movement Linkage Score" value={formatScore3Dec(cameraMovementContinuityBridge.cameraMovementLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Camera Routes</p><TagList tags={cameraMovementContinuityBridge.replayLinkedCameraRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Camera Routes</p><TagList tags={cameraMovementContinuityBridge.continuitySafeCameraRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Camera Routes</p><TagList tags={cameraMovementContinuityBridge.highDriftCameraRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="cinematic-pacing-rhythm-map" title="Cinematic Pacing Rhythm Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-pacing-rhythm-map-id={cinematicPacingRhythmMap.cinematicPacingRhythmMapId}>
            <p className="text-sm font-black">{cinematicPacingRhythmMap.cinematicPacingRhythmMapId}</p>
            <p className="mt-2 text-xs text-stone-600">Active pacing route · {cinematicPacingRhythmMap.activePacingRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Pacing Rhythm Score" value={formatScore3Dec(cinematicPacingRhythmMap.pacingRhythmScore)} emphasis />
              <KeyValueField label="Motion Rhythm Linkage Score" value={formatScore3Dec(cinematicPacingRhythmMap.motionRhythmLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Pacing Rhythm Readiness" value={cinematicPacingRhythmMap.pacingRhythmReadiness} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Ready Pacing Rhythm Traits</p><TagList tags={cinematicPacingRhythmMap.readyPacingRhythmTraits} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Pending Pacing Rhythm Traits</p><TagList tags={cinematicPacingRhythmMap.pendingPacingRhythmTraits} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="motion-persistence-timeline" title="Motion Persistence Timeline">
          <TimelineTrendGrid groups={motionPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="motion-orchestration-steering" title="Motion Orchestration Steering Recommendations">
          <SteeringChipList items={motionOrchestrationSteeringRecommendations} dataAttr="motion-orchestration-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-narrative-rhythm-layer" title="Cinematic Narrative Rhythm Layer">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-narrative-rhythm-layer-id={cinematicNarrativeRhythmLayer.cinematicNarrativeRhythmLayerId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="Narrative Rhythm Layer ID" value={cinematicNarrativeRhythmLayer.cinematicNarrativeRhythmLayerId} emphasis />
              <KeyValueField label="Pilot Video Mode" value={cinematicNarrativeRhythmLayer.pilotVideoMode} emphasis />
              <KeyValueField label="Narrative Rhythm Score" value={formatScore3Dec(cinematicNarrativeRhythmLayer.narrativeRhythmScore)} emphasis />
              <KeyValueField label="Active Narrative Rhythm State" value={cinematicNarrativeRhythmLayer.activeNarrativeRhythmState} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Narrative Rhythm Continuity" value={cinematicNarrativeRhythmLayer.cinematicNarrativeRhythmContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Pacing Synchronization" value={cinematicNarrativeRhythmLayer.emotionalPacingSynchronization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Transition Cadence Inheritance" value={cinematicNarrativeRhythmLayer.transitionCadenceInheritance} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay-Safe Narrative Orchestration" value={cinematicNarrativeRhythmLayer.replaySafeNarrativeOrchestration} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Cinematic Beat Persistence" value={cinematicNarrativeRhythmLayer.cinematicBeatPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Long-Form Rhythm Readiness" value={cinematicNarrativeRhythmLayer.longFormRhythmReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Flow Normalization" value={cinematicNarrativeRhythmLayer.emotionalFlowNormalization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Video Generation Rhythm Compatibility" value={cinematicNarrativeRhythmLayer.videoGenerationRhythmCompatibility} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Narrative Rhythm Normalization" value={cinematicNarrativeRhythmLayer.narrativeRhythmNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="emotional-pacing-sync-bridge" title="Emotional Pacing Sync Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-emotional-pacing-sync-bridge-id={emotionalPacingSyncBridge.emotionalPacingSyncBridgeId}>
            <p className="text-sm font-black">{emotionalPacingSyncBridge.emotionalPacingSyncBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active pacing sync route · {emotionalPacingSyncBridge.activePacingSyncRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Emotional Pacing Sync Strength" value={formatScore3Dec(emotionalPacingSyncBridge.emotionalPacingSyncStrength)} emphasis />
              <KeyValueField label="Pacing Sync Linkage Score" value={formatScore3Dec(emotionalPacingSyncBridge.pacingSyncLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Pacing Sync Routes</p><TagList tags={emotionalPacingSyncBridge.replayLinkedPacingSyncRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Pacing Sync Routes</p><TagList tags={emotionalPacingSyncBridge.continuitySafePacingSyncRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Pacing Sync Routes</p><TagList tags={emotionalPacingSyncBridge.highDriftPacingSyncRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="cinematic-beat-continuity-map" title="Cinematic Beat Continuity Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-beat-continuity-map-id={cinematicBeatContinuityMap.cinematicBeatContinuityMapId}>
            <p className="text-sm font-black">{cinematicBeatContinuityMap.cinematicBeatContinuityMapId}</p>
            <p className="mt-2 text-xs text-stone-600">Active beat route · {cinematicBeatContinuityMap.activeBeatRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Cinematic Beat Continuity Score" value={formatScore3Dec(cinematicBeatContinuityMap.cinematicBeatContinuityScore)} emphasis />
              <KeyValueField label="Beat Rhythm Linkage Score" value={formatScore3Dec(cinematicBeatContinuityMap.beatRhythmLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Beat Continuity Readiness" value={cinematicBeatContinuityMap.beatContinuityReadiness} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Ready Beat Continuity Traits</p><TagList tags={cinematicBeatContinuityMap.readyBeatContinuityTraits} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Pending Beat Continuity Traits</p><TagList tags={cinematicBeatContinuityMap.pendingBeatContinuityTraits} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="narrative-rhythm-persistence-timeline" title="Narrative Rhythm Persistence Timeline">
          <TimelineTrendGrid groups={narrativeRhythmPersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="narrative-rhythm-steering" title="Narrative Rhythm Steering Recommendations">
          <SteeringChipList items={narrativeRhythmSteeringRecommendations} dataAttr="narrative-rhythm-steer" />
        </DashboardSection>

        <DashboardSection sectionId="cinematic-world-state-layer" title="Cinematic World State Layer">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-cinematic-world-state-layer-id={cinematicWorldStateLayer.cinematicWorldStateLayerId}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
              <KeyValueField label="World State Layer ID" value={cinematicWorldStateLayer.cinematicWorldStateLayerId} emphasis />
              <KeyValueField label="Pilot Video Mode" value={cinematicWorldStateLayer.pilotVideoMode} emphasis />
              <KeyValueField label="World State Orchestration Score" value={formatScore3Dec(cinematicWorldStateLayer.worldStateOrchestrationScore)} emphasis />
              <KeyValueField label="Active World State Orchestration State" value={cinematicWorldStateLayer.activeWorldStateOrchestrationState} emphasis />
              <div className="sm:col-span-2"><KeyValueField label="Cinematic World Continuity" value={cinematicWorldStateLayer.cinematicWorldContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Atmospheric Persistence" value={cinematicWorldStateLayer.atmosphericPersistence} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Location Memory Inheritance" value={cinematicWorldStateLayer.locationMemoryInheritance} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Replay-Safe Environment Orchestration" value={cinematicWorldStateLayer.replaySafeEnvironmentOrchestration} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Environmental Transition Normalization" value={cinematicWorldStateLayer.environmentalTransitionNormalization} /></div>
              <div className="sm:col-span-2"><KeyValueField label="World-State Stabilization Readiness" value={cinematicWorldStateLayer.worldStateStabilizationReadiness} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Emotional Atmosphere Continuity" value={cinematicWorldStateLayer.emotionalAtmosphereContinuity} /></div>
              <div className="sm:col-span-2"><KeyValueField label="Long-Form Environment Consistency" value={cinematicWorldStateLayer.longFormEnvironmentConsistency} /></div>
              <div className="sm:col-span-2"><KeyValueField label="World State Normalization" value={cinematicWorldStateLayer.worldStateNormalizationState} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="atmospheric-continuity-bridge" title="Atmospheric Continuity Bridge">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-atmospheric-continuity-bridge-id={atmosphericContinuityBridge.atmosphericContinuityBridgeId}>
            <p className="text-sm font-black">{atmosphericContinuityBridge.atmosphericContinuityBridgeId}</p>
            <p className="mt-2 text-xs text-stone-600">Active atmosphere route · {atmosphericContinuityBridge.activeAtmosphereRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Atmospheric Continuity Strength" value={formatScore3Dec(atmosphericContinuityBridge.atmosphericContinuityStrength)} emphasis />
              <KeyValueField label="Atmosphere Linkage Score" value={formatScore3Dec(atmosphericContinuityBridge.atmosphereLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Replay-Linked Atmosphere Routes</p><TagList tags={atmosphericContinuityBridge.replayLinkedAtmosphereRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Continuity-Safe Atmosphere Routes</p><TagList tags={atmosphericContinuityBridge.continuitySafeAtmosphereRoutes} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-red-600">High-Drift Atmosphere Routes</p><TagList tags={atmosphericContinuityBridge.highDriftAtmosphereRoutes} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="location-memory-inheritance-map" title="Location Memory Inheritance Map">
          <article className="rounded-xl border border-stone-200 bg-white p-5" data-location-memory-inheritance-map-id={locationMemoryInheritanceMap.locationMemoryInheritanceMapId}>
            <p className="text-sm font-black">{locationMemoryInheritanceMap.locationMemoryInheritanceMapId}</p>
            <p className="mt-2 text-xs text-stone-600">Active location route · {locationMemoryInheritanceMap.activeLocationRoute}</p>
            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              <KeyValueField label="Location Memory Inheritance Score" value={formatScore3Dec(locationMemoryInheritanceMap.locationMemoryInheritanceScore)} emphasis />
              <KeyValueField label="Environment Continuity Linkage Score" value={formatScore3Dec(locationMemoryInheritanceMap.environmentContinuityLinkageScore)} emphasis />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2"><KeyValueField label="Location Memory Readiness" value={locationMemoryInheritanceMap.locationMemoryReadiness} /></div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><p className="mb-1 text-[10px] font-bold uppercase text-emerald-600">Ready Location Memory Traits</p><TagList tags={locationMemoryInheritanceMap.readyLocationMemoryTraits} /></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase text-stone-400">Pending Location Memory Traits</p><TagList tags={locationMemoryInheritanceMap.pendingLocationMemoryTraits} /></div>
            </div>
          </article>
        </DashboardSection>

        <DashboardSection sectionId="world-state-persistence-timeline" title="World State Persistence Timeline">
          <TimelineTrendGrid groups={worldStatePersistenceTimelineGroups} />
        </DashboardSection>

        <DashboardSection sectionId="world-state-steering" title="World State Steering Recommendations">
          <SteeringChipList items={worldStateSteeringRecommendations} dataAttr="world-state-steer" />
        </DashboardSection>

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
