import { buildCompactCueDataset, type CompactCinematicCue } from './cinematic/buildCompactCueDataset';
import {
  buildRichCueSignalDataset,
  type RichCueSceneSignal,
  type RichCinematicSignals,
} from './cinematic/buildRichCueSignals';

export const SCENE_CONTINUITY_RESOLVER_VERSION = 'PHASE-35B-v1' as const;
export const PROMPT_MODULATION_MAX_CHARS = 280;
export const PROMPT_MODULATION_MAX_RATIO = 0.15;
/** Typical bridged prompt size used for inflation budgeting when actual length is unknown. */
export const ESTIMATED_BRIDGED_PROMPT_BASELINE = 1800;

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

function buildModulationLine(rich: RichCinematicSignals): string {
  const cm = rich.camera_momentum;
  const ec = rich.emotional_carryover;
  const mr = rich.montage_rhythm;
  const ew = rich.scene_energy_waveform;
  const sc = rich.spatial_continuity;
  const mb = rich.motion_bridge;

  return [
    `camera:${cm.direction}/${cm.intensity_curve}`,
    `rhythm:${mr.tempo}/${mr.cut_density}`,
    `emotion:${ec.from_previous_scene}→${ec.transition_mode}@${ec.carry_strength}`,
    `energy:${ew.start_energy}-${ew.peak_energy}-${ew.end_energy}`,
    `space:${sc.environmental_anchor}/${sc.screen_direction}`,
    `motion:${mb.walking_sync}`,
  ].join('; ');
}

function capModulation(modulation: string, baselinePromptLength: number): {
  modulation: string;
  ratio: number;
  withinBudget: boolean;
} {
  const maxByRatio = Math.floor(baselinePromptLength * PROMPT_MODULATION_MAX_RATIO);
  const maxChars = Math.min(PROMPT_MODULATION_MAX_CHARS, Math.max(96, maxByRatio));
  const trimmed = modulation.length <= maxChars ? modulation : `${modulation.slice(0, maxChars - 1)}…`;
  const ratio = baselinePromptLength > 0 ? trimmed.length / baselinePromptLength : 0;

  return {
    modulation: trimmed,
    ratio: Number(ratio.toFixed(4)),
    withinBudget: ratio <= PROMPT_MODULATION_MAX_RATIO,
  };
}

export function resolveSceneContinuityForPrompt(
  controlledPrompt: string,
  options?: { baselinePromptLength?: number }
): SceneContinuityResolveResult {
  const compact = buildCompactCueDataset();
  const richDataset = buildRichCueSignalDataset();
  const richBySceneId = new Map(richDataset.signals.map((row) => [row.scene_id, row]));

  let bestCue: CompactCinematicCue | null = null;
  let bestRich: RichCueSceneSignal | undefined;
  let bestScore = -1;

  for (const cue of compact.export.cues) {
    const rich = richBySceneId.get(cue.scene_id);
    const score = scoreSceneMatch(controlledPrompt, cue, rich);
    if (score > bestScore) {
      bestScore = score;
      bestCue = cue;
      bestRich = rich;
    }
  }

  if (!bestCue || !bestRich) {
    const fallback = richDataset.signals[0];
    bestCue = compact.export.cues[0] ?? null;
    bestRich = fallback;
  }

  const rich = bestRich?.rich_cinematic_signals;
  const modulationRaw = rich ? buildModulationLine(rich) : '';
  const baseline =
    options?.baselinePromptLength ??
    Math.max(controlledPrompt.length, ESTIMATED_BRIDGED_PROMPT_BASELINE);
  const capped = capModulation(modulationRaw, baseline);

  const continuity_checks: SceneContinuityChecks = {
    camera_axis_continuity: rich?.spatial_continuity.camera_axis_lock ?? false,
    walking_cadence_persistence: rich?.motion_bridge.walking_sync === 'matched_cadence',
    emotion_carryover: (rich?.emotional_carryover.carry_strength ?? 0) >= 0.5,
    environment_anchor_persistence: Boolean(rich?.spatial_continuity.environmental_anchor),
  };

  return {
    modulation: capped.modulation,
    matched_scene_ids: bestCue ? [bestCue.scene_id] : [],
    matched_scene_index: bestCue?.scene_index ?? null,
    continuity_checks,
    rich_signals_used: rich ? 1 : 0,
    modulation_char_count: capped.modulation.length,
    modulation_ratio_estimate: capped.ratio,
    within_prompt_inflation_budget: capped.withinBudget,
  };
}
