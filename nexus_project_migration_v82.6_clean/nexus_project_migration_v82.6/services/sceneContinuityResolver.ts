import type { CompactCinematicCue } from './cinematic/buildCompactCueDataset';
import {
  buildRuntimeCueBridgeFromPrompt,
  lookupRuntimeCueData,
  resolveSceneIdFromPrompt,
  RUNTIME_CUE_BRIDGE_VERSION,
  PROMPT_MODULATION_MAX_CHARS,
  PROMPT_MODULATION_MAX_RATIO,
  ESTIMATED_BRIDGED_PROMPT_BASELINE,
} from './cinematic/buildRuntimeCueBridge';

export const SCENE_CONTINUITY_RESOLVER_VERSION = RUNTIME_CUE_BRIDGE_VERSION;
export { PROMPT_MODULATION_MAX_CHARS, PROMPT_MODULATION_MAX_RATIO, ESTIMATED_BRIDGED_PROMPT_BASELINE };

export interface SceneContinuityChecks {
  camera_axis_continuity: boolean;
  walking_cadence_persistence: boolean;
  emotion_carryover: boolean;
  environment_anchor_persistence: boolean;
}

export interface SceneContinuityResolveResult {
  modulation: string;
  matched_scene_ids: string[];
  matched_scene_index: number | null;
  continuity_checks: SceneContinuityChecks;
  rich_signals_used: number;
  modulation_char_count: number;
  modulation_ratio_estimate: number;
  within_prompt_inflation_budget: boolean;
}

function continuityChecksFromCue(
  sceneId: string,
  cue: CompactCinematicCue | null
): SceneContinuityChecks {
  const { rich } = lookupRuntimeCueData(sceneId);
  const signals = rich?.rich_cinematic_signals;

  return {
    camera_axis_continuity: signals?.spatial_continuity.camera_axis_lock ?? false,
    walking_cadence_persistence: signals?.motion_bridge.walking_sync === 'matched_cadence',
    emotion_carryover: (signals?.emotional_carryover.carry_strength ?? 0) >= 0.5,
    environment_anchor_persistence: Boolean(signals?.spatial_continuity.environmental_anchor),
  };
}

export function resolveSceneContinuityForPrompt(
  controlledPrompt: string,
  options?: { baselinePromptLength?: number }
): SceneContinuityResolveResult {
  const runtimeBridge = buildRuntimeCueBridgeFromPrompt(controlledPrompt, options);
  const resolved = resolveSceneIdFromPrompt(controlledPrompt);
  const { cue } = lookupRuntimeCueData(resolved.scene_id);

  return {
    modulation: runtimeBridge.prompt_modulation,
    matched_scene_ids: [runtimeBridge.scene_id],
    matched_scene_index: cue?.scene_index ?? runtimeBridge.scene_index,
    continuity_checks: continuityChecksFromCue(resolved.scene_id, cue),
    rich_signals_used: runtimeBridge.prompt_modulation.length > 0 ? 1 : 0,
    modulation_char_count: runtimeBridge.modulation_length,
    modulation_ratio_estimate: runtimeBridge.modulation_ratio_estimate,
    within_prompt_inflation_budget: runtimeBridge.within_budget,
  };
}
