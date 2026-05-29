import type { CharacterBook } from '../../types';
import { buildMasterCoreV175Snapshot } from './aiStudioControlledJsonRebuild.fixtures';
import { generateDramaScene } from './musicDramaSceneGeneration';
import type { CueMatchType, MusicDramaSlotScenario } from './musicDramaRuntimeBridge';
import type { RenderSafetyGateResult } from './renderSafetyGate';

export const ONE_SCENE_RENDER_DRY_RUN_VERSION = 'PHASE-36D-v1' as const;
export const ONE_SCENE_RENDER_DRY_RUN_PHASE = 'PHASE-36D' as const;

export const DEFAULT_DRY_RUN_PROBE_PROMPT =
  'Gonegi and Dana walk along the harbor terrace at golden hour, hopeful forward motion.';

const PROMPT_EXCERPT_MAX = 480;

const GENERIC_DRIFT_PATTERNS = [
  /\bgeneric\s+boy\b/i,
  /\bgeneric\s+girl\b/i,
  /\byoung\s+companion\b/i,
  /\banonymous\s+child\b/i,
];

export type OneSceneRenderDryRunInput = MusicDramaSlotScenario | string;

export interface OneSceneRenderDryRunResult {
  phase: typeof ONE_SCENE_RENDER_DRY_RUN_PHASE;
  schema_version: typeof ONE_SCENE_RENDER_DRY_RUN_VERSION;
  dry_run: true;
  would_generate: false;
  pipeline_stopped_before: 'generateOptimizedImage';
  scene_id: string;
  slot_id: string;
  controlled_prompt: string;
  readiness: 'READY' | 'NOT_READY';
  blocked_reason?: string;
  runtime_bridge: {
    used: boolean;
    match_type: CueMatchType;
    modulation_length: number;
    within_budget: boolean;
  };
  render_safety_gate: {
    status: RenderSafetyGateResult['status'];
    failed_checks: string[];
    warnings: string[];
    runtime_bridge_ready: boolean;
    identity_ready: boolean;
    reference_order_ready: boolean;
    budget_ready: boolean;
    prompt_integrity_ready: boolean;
    continuity_warning: boolean;
  };
  prompt_preview: {
    final_prompt_excerpt: string;
    prompt_length: number;
    contains_character_names: boolean;
    contains_generic_drift_terms: boolean;
    cinematic_modulation_injected: boolean;
  };
  reference_preview: {
    detected_characters: string[];
    selected_elite_refs: string[];
    reference_order: Array<{
      kind: string;
      ref_id: string;
      slot_id?: string;
      character_name?: string;
    }>;
    identity_refs_before_style_refs: boolean;
  };
  no_image_generation: true;
  no_generate_optimized_image_call: true;
  generated_at: string;
}

function containsGenericDriftTerms(text: string): boolean {
  return GENERIC_DRIFT_PATTERNS.some((pattern) => pattern.test(text));
}

function containsCanonicalCharacterNames(
  prompt: string,
  detected: string[]
): boolean {
  const hasGonegi = /\bGonegi\b/i.test(prompt) || detected.some((n) => /gonegi/i.test(n));
  const hasDana = /\bDana\b/i.test(prompt) || detected.some((n) => /dana/i.test(n));
  return hasGonegi && hasDana;
}

function normalizeSlotInput(slotOrPrompt: OneSceneRenderDryRunInput): MusicDramaSlotScenario {
  if (typeof slotOrPrompt === 'string') {
    return {
      slot_id: 'one-scene-dry-run-prompt',
      scenario: slotOrPrompt.trim(),
    };
  }
  return slotOrPrompt;
}

function excerptPrompt(prompt: string | undefined): string {
  if (!prompt) return '';
  if (prompt.length <= PROMPT_EXCERPT_MAX) return prompt;
  return `${prompt.slice(0, PROMPT_EXCERPT_MAX)}…`;
}

export function buildOneSceneRenderDryRun(
  slotOrPrompt: OneSceneRenderDryRunInput,
  options?: { characterBook?: CharacterBook }
): OneSceneRenderDryRunResult {
  const slot = normalizeSlotInput(slotOrPrompt);
  const snapshot = buildMasterCoreV175Snapshot();
  const characterBook = options?.characterBook ?? (snapshot.characterBook as CharacterBook);
  const controlledPrompt = slot.scenario;

  const pipeline = generateDramaScene({
    slot,
    characterBook,
    controlledPrompt,
  });

  const bridged = pipeline.bridged_prompt ?? '';
  const gate = pipeline.render_safety_gate;
  const bridge = pipeline.runtime_bridge_debug;

  return {
    phase: ONE_SCENE_RENDER_DRY_RUN_PHASE,
    schema_version: ONE_SCENE_RENDER_DRY_RUN_VERSION,
    dry_run: true,
    would_generate: false,
    pipeline_stopped_before: 'generateOptimizedImage',
    scene_id: bridge.scene_id,
    slot_id: slot.slot_id,
    controlled_prompt: controlledPrompt,
    readiness: pipeline.readiness,
    blocked_reason: pipeline.blocked_reason,
    runtime_bridge: {
      used: bridge.runtime_bridge_used,
      match_type: bridge.cue_match_type,
      modulation_length: bridge.modulation_length,
      within_budget: bridge.within_budget,
    },
    render_safety_gate: {
      status: gate.status,
      failed_checks: gate.failed_checks,
      warnings: gate.warnings,
      runtime_bridge_ready: gate.runtime_bridge_ready,
      identity_ready: gate.identity_ready,
      reference_order_ready: gate.reference_order_ready,
      budget_ready: gate.budget_ready,
      prompt_integrity_ready: gate.prompt_integrity_ready,
      continuity_warning: gate.continuity_warning,
    },
    prompt_preview: {
      final_prompt_excerpt: excerptPrompt(bridged || controlledPrompt),
      prompt_length: bridged.length,
      contains_character_names: containsCanonicalCharacterNames(
        controlledPrompt,
        pipeline.detected_characters
      ),
      contains_generic_drift_terms: containsGenericDriftTerms(controlledPrompt),
      cinematic_modulation_injected: bridged.includes('[CINEMATIC_MODULATION]'),
    },
    reference_preview: {
      detected_characters: pipeline.detected_characters,
      selected_elite_refs: pipeline.injected_elite_image_ids,
      reference_order: pipeline.reference_order,
      identity_refs_before_style_refs: pipeline.identity_before_style,
    },
    no_image_generation: true,
    no_generate_optimized_image_call: true,
    generated_at: new Date().toISOString(),
  };
}

export function buildOneSceneRenderDryRunPreview(
  prompt?: string
): OneSceneRenderDryRunResult {
  const controlledPrompt = prompt?.trim() || DEFAULT_DRY_RUN_PROBE_PROMPT;
  return buildOneSceneRenderDryRun(controlledPrompt);
}
