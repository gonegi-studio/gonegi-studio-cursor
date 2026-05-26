import crypto from 'crypto';
import {
  CinematicExtractionResult,
  OrchestrationDryRunReport,
  OrchestrationDryRunStep,
  OrchestrationDryRunTransition,
  RENDER_ORCHESTRATION_DRY_RUN_VERSION,
  RenderOrchestrationDryRunResult,
} from '../types';
import { loadCanonicalExportDataset } from './datasetCompletionAudit';
import { applyPipelineBCertificationBridge } from './pipelineBCertificationBridge';
import { isEmptyValue } from './pipelineBridge';
import {
  collectFrozenFingerprints,
  deriveProductionDatasetCandidateId,
} from './productionCertificationLock';

export const RENDER_ORCHESTRATION_DRY_RUN_EPOCH = '2026-05-26T17:00:00.000Z';

const KIKI_25S_DURATION_SECONDS = 25;

const STEP_DEFINITIONS = [
  { step_key: 'scene_sequencing', label: 'Scene Sequencing' },
  { step_key: 'continuity_carryover', label: 'Continuity Carryover' },
  { step_key: 'camera_rhythm_propagation', label: 'Camera Rhythm Propagation' },
  { step_key: 'emotional_propagation', label: 'Emotional Propagation' },
  { step_key: 'prompt_orchestration_flow', label: 'Prompt Orchestration Flow' },
  { step_key: 'keyframe_chain_continuity', label: 'Keyframe Chain Continuity' },
] as const;

type StepKey = (typeof STEP_DEFINITIONS)[number]['step_key'];

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return round6(count / total);
}

function hasTemporalBridge(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.production_v72?.temporal_bridge) ||
    !isEmptyValue(scene.production_v82?.temporal_bridge) ||
    !isEmptyValue(scene.temporal_bridge)
  );
}

function hasCameraRhythm(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.camera_rhythm_memory) ||
    !isEmptyValue(scene.director_dna?.camera_motion) ||
    !isEmptyValue(scene.production_v72?.temporal_bridge?.gaze_vector_continuity)
  );
}

function hasEmotionalSignal(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.emotional_carryover) ||
    !isEmptyValue(scene.scene_state?.emotion) ||
    !isEmptyValue(scene.sequence_graph?.transition_logic?.emotion_continuity)
  );
}

function hasPromptOrchestration(scene: CinematicExtractionResult): boolean {
  const prompts = scene.prompts_extraction;
  const hasPromptNamespaces =
    !isEmptyValue(prompts?.midjourney_prompts) ||
    !isEmptyValue(prompts?.runway_prompts) ||
    !isEmptyValue(prompts?.kling_prompts);
  const hasGenerative =
    !isEmptyValue(scene.generative_layer?.midjourney) ||
    !isEmptyValue(scene.generative_layer?.runway) ||
    !isEmptyValue(scene.generative_layer?.kling);
  return hasPromptNamespaces || hasGenerative;
}

function hasKeyframeChain(scene: CinematicExtractionResult): boolean {
  return (
    (scene.visual_atoms?.length ?? 0) > 0 ||
    !isEmptyValue(scene.shot_fingerprint) ||
    !isEmptyValue(scene.production_v72?.continuity_controller)
  );
}

function checkSceneSequencing(
  prev: CinematicExtractionResult,
  cur: CinematicExtractionResult
): boolean {
  const prevEnd = prev.scene_indexing?.v_timestamp_end;
  const curStart = cur.scene_indexing?.v_timestamp_start;
  const timestampOk =
    typeof prevEnd === 'number' &&
    typeof curStart === 'number' &&
    curStart >= prevEnd;
  const graphOk =
    cur.sequence_graph?.previous_node === prev.id ||
    cur.sequence_graph?.previous_node === prev.sequence_graph?.current_node ||
    (prev.sequence_graph?.next_candidates ?? []).some((c) => c.id === cur.id);
  return timestampOk || graphOk || !!cur.sequence_graph?.previous_node;
}

function checkContinuityCarryover(
  prev: CinematicExtractionResult,
  cur: CinematicExtractionResult
): boolean {
  return (
    hasTemporalBridge(prev) ||
    hasTemporalBridge(cur) ||
    !isEmptyValue(prev.production_v72?.continuity_controller) ||
    !isEmptyValue(cur.production_v72?.continuity_controller) ||
    !isEmptyValue(prev.character_persistence) ||
    !isEmptyValue(cur.character_persistence)
  );
}

function checkCameraRhythmPropagation(
  prev: CinematicExtractionResult,
  cur: CinematicExtractionResult
): boolean {
  const flowVector = prev.sequence_graph?.transition_logic?.camera_flow_vector;
  return (
    hasCameraRhythm(prev) ||
    hasCameraRhythm(cur) ||
    (Array.isArray(flowVector) && flowVector.length > 0)
  );
}

function checkEmotionalPropagation(
  prev: CinematicExtractionResult,
  cur: CinematicExtractionResult
): boolean {
  const emotionContinuity = prev.sequence_graph?.transition_logic?.emotion_continuity;
  return (
    hasEmotionalSignal(prev) ||
    hasEmotionalSignal(cur) ||
    typeof emotionContinuity === 'number'
  );
}

function checkPromptOrchestrationFlow(
  prev: CinematicExtractionResult,
  cur: CinematicExtractionResult
): boolean {
  return hasPromptOrchestration(prev) || hasPromptOrchestration(cur);
}

function checkKeyframeChainContinuity(
  prev: CinematicExtractionResult,
  cur: CinematicExtractionResult
): boolean {
  return hasKeyframeChain(prev) && hasKeyframeChain(cur);
}

const STEP_CHECKERS: Record<
  StepKey,
  (prev: CinematicExtractionResult, cur: CinematicExtractionResult) => boolean
> = {
  scene_sequencing: checkSceneSequencing,
  continuity_carryover: checkContinuityCarryover,
  camera_rhythm_propagation: checkCameraRhythmPropagation,
  emotional_propagation: checkEmotionalPropagation,
  prompt_orchestration_flow: checkPromptOrchestrationFlow,
  keyframe_chain_continuity: checkKeyframeChainContinuity,
};

function evaluateTransition(
  prev: CinematicExtractionResult,
  cur: CinematicExtractionResult
): OrchestrationDryRunTransition {
  const failure_reasons: string[] = [];

  for (const def of STEP_DEFINITIONS) {
    if (!STEP_CHECKERS[def.step_key](prev, cur)) {
      failure_reasons.push(def.step_key);
    }
  }

  return {
    from_scene_id: prev.id,
    to_scene_id: cur.id,
    stable: failure_reasons.length === 0,
    failure_reasons,
  };
}

function buildDryRunReport(
  dataset: CinematicExtractionResult[]
): {
  report: OrchestrationDryRunReport;
  continuity_failure_count: number;
  scene_transition_stability: number;
  orchestration_score: number;
} {
  const transitions: OrchestrationDryRunTransition[] = [];
  const stepPassCounts = new Map<StepKey, number>(
    STEP_DEFINITIONS.map((d) => [d.step_key, 0])
  );

  for (let i = 1; i < dataset.length; i++) {
    const transition = evaluateTransition(dataset[i - 1], dataset[i]);
    transitions.push(transition);
    for (const def of STEP_DEFINITIONS) {
      if (!transition.failure_reasons.includes(def.step_key)) {
        stepPassCounts.set(def.step_key, (stepPassCounts.get(def.step_key) ?? 0) + 1);
      }
    }
  }

  const transition_count = transitions.length;
  const continuity_failure_count = transitions.filter((t) => !t.stable).length;
  const stable_count = transition_count - continuity_failure_count;
  const scene_transition_stability = ratio(stable_count, transition_count);

  const steps: OrchestrationDryRunStep[] = STEP_DEFINITIONS.map((def) => {
    const passed = stepPassCounts.get(def.step_key) ?? 0;
    return {
      step_key: def.step_key,
      label: def.label,
      transitions_passed: passed,
      transitions_total: transition_count,
      stability_score: ratio(passed, transition_count),
    };
  });

  const orchestration_score = round6(
    steps.reduce((sum, step) => sum + step.stability_score, 0) / steps.length
  );

  const unstable_transitions = transitions.filter((t) => !t.stable).slice(0, 8);

  const report: OrchestrationDryRunReport = {
    scene_count: dataset.length,
    transition_count,
    steps,
    unstable_transitions,
    simulated_duration_seconds: KIKI_25S_DURATION_SECONDS,
    no_provider_calls: true,
    no_gpu_execution: true,
    no_image_generation: true,
  };

  return {
    report,
    continuity_failure_count,
    scene_transition_stability,
    orchestration_score,
  };
}

export function buildRenderOrchestrationDryRun(): RenderOrchestrationDryRunResult {
  const { dataset: canonicalDataset } = loadCanonicalExportDataset();
  const { enrichedDataset } = applyPipelineBCertificationBridge(canonicalDataset, true);
  const dataset = enrichedDataset.length > 0 ? enrichedDataset : canonicalDataset;

  const fingerprints = collectFrozenFingerprints();
  const production_dataset_candidate_id = deriveProductionDatasetCandidateId(fingerprints);

  const { report, continuity_failure_count, scene_transition_stability, orchestration_score } =
    buildDryRunReport(dataset);

  const exportCore = {
    schema_version: RENDER_ORCHESTRATION_DRY_RUN_VERSION,
    generated_at: RENDER_ORCHESTRATION_DRY_RUN_EPOCH,
    readonly_simulation: true as const,
    production_dataset_candidate_id,
    orchestration_dry_run_report: report,
    continuity_failure_count,
    scene_transition_stability,
    orchestration_score,
    validation: {
      deterministic_checksum_stable: true,
      readonly_simulation: true as const,
      no_dataset_mutation: true as const,
    },
  };

  const export_checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(exportCore))
    .digest('hex');

  return {
    ...exportCore,
    export_checksum,
  };
}

let cachedDryRun: RenderOrchestrationDryRunResult | null = null;

export function buildRenderOrchestrationDryRunPreview(): RenderOrchestrationDryRunResult {
  if (cachedDryRun) return cachedDryRun;
  cachedDryRun = buildRenderOrchestrationDryRun();
  return cachedDryRun;
}

export function resetRenderOrchestrationDryRunCache(): void {
  cachedDryRun = null;
}
