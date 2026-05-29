import {
  buildCompactCueDataset,
  type CompactCinematicCue,
} from './buildCompactCueDataset';
import {
  buildRichCueSignalDataset,
  type RichCueSceneSignal,
  type RichCinematicSignals,
} from './buildRichCueSignals';

export const RUNTIME_CUE_BRIDGE_VERSION = 'PHASE-36A-v1' as const;
export const RUNTIME_CUE_BRIDGE_PHASE = 'PHASE-36A' as const;
export const PROMPT_MODULATION_MAX_CHARS = 280;
export const PROMPT_MODULATION_MAX_RATIO = 0.15;
export const ESTIMATED_BRIDGED_PROMPT_BASELINE = 1800;

/** Lightweight runtime object passed to PromptBridge — no render payloads or character DNA. */
export type RuntimeCinematicContext = {
  camera_momentum: RichCinematicSignals['camera_momentum'];
  emotional_carryover: RichCinematicSignals['emotional_carryover'];
  montage_rhythm: RichCinematicSignals['montage_rhythm'];
  spatial_continuity: RichCinematicSignals['spatial_continuity'];
  scene_energy_waveform: RichCinematicSignals['scene_energy_waveform'];
  motion_bridge: RichCinematicSignals['motion_bridge'];
};

export interface RuntimeCueBridgeResult {
  scene_id: string;
  scene_index: number;
  runtime_context: RuntimeCinematicContext;
  prompt_modulation: string;
  modulation_length: number;
  within_char_budget: boolean;
  within_ratio_budget: boolean;
  within_budget: boolean;
  baseline_prompt_length: number;
  modulation_ratio_estimate: number;
}

export interface RuntimeCueBridgePreviewEntry {
  scene_id: string;
  runtime_context: RuntimeCinematicContext;
  prompt_modulation: string;
  modulation_length: number;
  within_budget: boolean;
  within_char_budget: boolean;
  within_ratio_budget: boolean;
  modulation_ratio_estimate: number;
}

export interface RuntimeCueBridgePreview {
  phase: typeof RUNTIME_CUE_BRIDGE_PHASE;
  schema_version: typeof RUNTIME_CUE_BRIDGE_VERSION;
  modulation_budget: {
    max_chars: typeof PROMPT_MODULATION_MAX_CHARS;
    max_ratio: typeof PROMPT_MODULATION_MAX_RATIO;
    single_line: true;
  };
  prompt_resolution_probe: RuntimeCueBridgePreviewEntry & {
    probe_prompt: string;
    matched_scene_index: number | null;
  };
  samples: RuntimeCueBridgePreviewEntry[];
  diagnosis_only: true;
  no_render_payload: true;
  no_character_dna: true;
  generated_at: string;
}

function extractRuntimeContext(rich: RichCinematicSignals): RuntimeCinematicContext {
  return {
    camera_momentum: { ...rich.camera_momentum },
    emotional_carryover: { ...rich.emotional_carryover },
    montage_rhythm: { ...rich.montage_rhythm },
    spatial_continuity: { ...rich.spatial_continuity },
    scene_energy_waveform: { ...rich.scene_energy_waveform },
    motion_bridge: { ...rich.motion_bridge },
  };
}

export function buildModulationLineFromContext(context: RuntimeCinematicContext): string {
  const cm = context.camera_momentum;
  const ec = context.emotional_carryover;
  const mr = context.montage_rhythm;
  const ew = context.scene_energy_waveform;
  const sc = context.spatial_continuity;
  const mb = context.motion_bridge;

  return [
    `camera:${cm.direction}/${cm.intensity_curve}`,
    `rhythm:${mr.tempo}/${mr.cut_density}`,
    `emotion:${ec.from_previous_scene}→${ec.transition_mode}@${ec.carry_strength}`,
    `energy:${ew.start_energy}-${ew.peak_energy}-${ew.end_energy}`,
    `space:${sc.environmental_anchor}/${sc.screen_direction}`,
    `motion:${mb.walking_sync}`,
  ].join('; ');
}

export function capPromptModulation(
  modulation: string,
  baselinePromptLength: number
): {
  modulation: string;
  ratio: number;
  withinCharBudget: boolean;
  withinRatioBudget: boolean;
  withinBudget: boolean;
} {
  const maxByRatio = Math.floor(baselinePromptLength * PROMPT_MODULATION_MAX_RATIO);
  const maxChars = Math.min(PROMPT_MODULATION_MAX_CHARS, Math.max(96, maxByRatio));
  const trimmed =
    modulation.length <= maxChars ? modulation : `${modulation.slice(0, maxChars - 1)}…`;
  const ratio = baselinePromptLength > 0 ? trimmed.length / baselinePromptLength : 0;
  const withinCharBudget = trimmed.length <= PROMPT_MODULATION_MAX_CHARS;
  const withinRatioBudget = ratio <= PROMPT_MODULATION_MAX_RATIO;

  return {
    modulation: trimmed,
    ratio: Number(ratio.toFixed(4)),
    withinCharBudget,
    withinRatioBudget,
    withinBudget: withinCharBudget && withinRatioBudget,
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 4);
}

function scoreSceneMatch(prompt: string, cue: CompactCinematicCue, rich?: RichCueSceneSignal): number {
  const tokens = new Set(tokenize(prompt));
  let score = 0;

  for (const purpose of cue.shot_purpose) {
    for (const token of tokenize(purpose)) {
      if (tokens.has(token)) score += 2;
    }
  }

  for (const token of tokenize(cue.narrative_intent)) {
    if (tokens.has(token)) score += 1;
  }

  const anchor = rich?.rich_cinematic_signals.spatial_continuity.environmental_anchor ?? '';
  for (const token of tokenize(anchor.replace(/_/g, ' '))) {
    if (tokens.has(token)) score += 3;
  }

  if (/\bharbor\b/i.test(prompt) && anchor.includes('harbor')) score += 5;
  if (/\b(terrace|walk|walking)\b/i.test(prompt) && anchor.includes('terrace')) score += 4;
  if (
    /\bharbor\b/i.test(prompt) &&
    /\b(terrace|walk|walking|golden|friendship)\b/i.test(prompt) &&
    cue.shot_purpose.some((purpose) => /environmental|establishment|tension/i.test(purpose))
  ) {
    score += 5;
  }
  if (
    /\b(terrace|walk|walking)\b/i.test(prompt) &&
    rich?.rich_cinematic_signals.motion_bridge.walking_sync === 'matched_cadence'
  ) {
    score += 2;
  }
  if (/\b(gonegi|dana)\b/i.test(prompt) && cue.narrative_intent.toLowerCase().includes('companion')) {
    score += 2;
  }

  return score;
}

export function resolveSceneIdFromPrompt(controlledPrompt: string): {
  scene_id: string;
  scene_index: number;
} {
  const compact = buildCompactCueDataset();
  const richDataset = buildRichCueSignalDataset();
  const richBySceneId = new Map(richDataset.signals.map((row) => [row.scene_id, row]));

  let bestCue: CompactCinematicCue | null = null;
  let bestScore = -1;

  for (const cue of compact.export.cues) {
    const rich = richBySceneId.get(cue.scene_id);
    const score = scoreSceneMatch(controlledPrompt, cue, rich);
    if (score > bestScore) {
      bestScore = score;
      bestCue = cue;
    }
  }

  const fallbackCue = compact.export.cues[0];
  const cue = bestCue ?? fallbackCue;

  return {
    scene_id: cue?.scene_id ?? 'scene_unknown',
    scene_index: cue?.scene_index ?? 0,
  };
}

export function lookupRuntimeCueData(sceneId: string): {
  cue: CompactCinematicCue | null;
  rich: RichCueSceneSignal | null;
} {
  const compact = buildCompactCueDataset();
  const richDataset = buildRichCueSignalDataset();
  const cue = compact.export.cues.find((row) => row.scene_id === sceneId) ?? null;
  const rich = richDataset.signals.find((row) => row.scene_id === sceneId) ?? null;
  return { cue, rich };
}

export function buildRuntimeCueBridgeForSceneId(
  sceneId: string,
  options?: { baselinePromptLength?: number }
): RuntimeCueBridgeResult {
  const { rich } = lookupRuntimeCueData(sceneId);
  const signals = rich?.rich_cinematic_signals;
  const fallbackDataset = buildRichCueSignalDataset();
  const fallbackRich =
    signals ?? fallbackDataset.signals[0]?.rich_cinematic_signals ?? null;

  if (!fallbackRich) {
    return {
      scene_id: sceneId,
      scene_index: 0,
      runtime_context: {
        camera_momentum: {
          direction: 'locked_observation',
          intensity_curve: 'flat',
          stability: 'stable',
        },
        emotional_carryover: {
          from_previous_scene: 'neutral',
          transition_mode: 'hold',
          carry_strength: 0,
        },
        montage_rhythm: {
          tempo: 'moderate',
          cut_density: 'low',
          visual_breathing_room: 'wide',
        },
        spatial_continuity: {
          camera_axis_lock: true,
          environmental_anchor: 'unknown',
          screen_direction: 'neutral',
        },
        scene_energy_waveform: {
          start_energy: 0.5,
          peak_energy: 0.5,
          end_energy: 0.5,
        },
        motion_bridge: {
          hair_motion: 'still',
          coat_motion: 'still',
          walking_sync: 'neutral',
        },
      },
      prompt_modulation: '',
      modulation_length: 0,
      within_char_budget: true,
      within_ratio_budget: true,
      within_budget: true,
      baseline_prompt_length: options?.baselinePromptLength ?? ESTIMATED_BRIDGED_PROMPT_BASELINE,
      modulation_ratio_estimate: 0,
    };
  }

  const runtime_context = extractRuntimeContext(fallbackRich);
  const modulationRaw = buildModulationLineFromContext(runtime_context);
  const baseline =
    options?.baselinePromptLength ?? ESTIMATED_BRIDGED_PROMPT_BASELINE;
  const capped = capPromptModulation(modulationRaw, baseline);

  return {
    scene_id: rich?.scene_id ?? sceneId,
    scene_index: rich?.scene_index ?? 0,
    runtime_context,
    prompt_modulation: capped.modulation,
    modulation_length: capped.modulation.length,
    within_char_budget: capped.withinCharBudget,
    within_ratio_budget: capped.withinRatioBudget,
    within_budget: capped.withinBudget,
    baseline_prompt_length: baseline,
    modulation_ratio_estimate: capped.ratio,
  };
}

export function buildRuntimeCueBridgeFromPrompt(
  controlledPrompt: string,
  options?: { baselinePromptLength?: number }
): RuntimeCueBridgeResult {
  const resolved = resolveSceneIdFromPrompt(controlledPrompt);
  const baseline =
    options?.baselinePromptLength ??
    Math.max(controlledPrompt.length, ESTIMATED_BRIDGED_PROMPT_BASELINE);

  return buildRuntimeCueBridgeForSceneId(resolved.scene_id, { baselinePromptLength: baseline });
}

function toPreviewEntry(result: RuntimeCueBridgeResult): RuntimeCueBridgePreviewEntry {
  return {
    scene_id: result.scene_id,
    runtime_context: result.runtime_context,
    prompt_modulation: result.prompt_modulation,
    modulation_length: result.modulation_length,
    within_budget: result.within_budget,
    within_char_budget: result.within_char_budget,
    within_ratio_budget: result.within_ratio_budget,
    modulation_ratio_estimate: result.modulation_ratio_estimate,
  };
}

let cachedPreview: RuntimeCueBridgePreview | null = null;

export function buildRuntimeCueBridgePreview(): RuntimeCueBridgePreview {
  if (cachedPreview) return cachedPreview;

  const probePrompt =
    'Gonegi and Dana walk along the harbor terrace at golden hour, hopeful forward motion.';
  const probeBridge = buildRuntimeCueBridgeFromPrompt(probePrompt);
  const resolved = resolveSceneIdFromPrompt(probePrompt);

  const richDataset = buildRichCueSignalDataset();
  const sampleIds = [
    resolved.scene_id,
    richDataset.signals[0]?.scene_id,
    richDataset.signals[Math.floor(richDataset.signals.length / 2)]?.scene_id,
    richDataset.signals[richDataset.signals.length - 1]?.scene_id,
  ].filter((id, index, arr): id is string => Boolean(id) && arr.indexOf(id) === index);

  const samples = sampleIds.map((sceneId) =>
    toPreviewEntry(buildRuntimeCueBridgeForSceneId(sceneId))
  );

  cachedPreview = {
    phase: RUNTIME_CUE_BRIDGE_PHASE,
    schema_version: RUNTIME_CUE_BRIDGE_VERSION,
    modulation_budget: {
      max_chars: PROMPT_MODULATION_MAX_CHARS,
      max_ratio: PROMPT_MODULATION_MAX_RATIO,
      single_line: true,
    },
    prompt_resolution_probe: {
      ...toPreviewEntry(probeBridge),
      probe_prompt: probePrompt,
      matched_scene_index: probeBridge.scene_index,
    },
    samples,
    diagnosis_only: true,
    no_render_payload: true,
    no_character_dna: true,
    generated_at: new Date().toISOString(),
  };

  return cachedPreview;
}

export function resetRuntimeCueBridgeCache(): void {
  cachedPreview = null;
}
