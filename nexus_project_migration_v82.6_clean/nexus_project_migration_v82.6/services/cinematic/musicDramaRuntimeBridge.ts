import { buildCompactCueDataset, type CompactCinematicCue } from './buildCompactCueDataset';
import {
  buildRuntimeCueBridgeForSceneId,
  buildRuntimeCueBridgeFromPrompt,
  ESTIMATED_BRIDGED_PROMPT_BASELINE,
  lookupRuntimeCueData,
  type RuntimeCueBridgeResult,
  type RuntimeCinematicContext,
} from './buildRuntimeCueBridge';

export const MUSIC_DRAMA_RUNTIME_BRIDGE_VERSION = 'PHASE-36B-v1' as const;
export const MUSIC_DRAMA_RUNTIME_BRIDGE_PHASE = 'PHASE-36B' as const;

export type CueMatchType = 'exact' | 'pack' | 'semantic';

export interface MusicDramaSlotScenario {
  slot_id: string;
  scenario: string;
  scene_id?: string | null;
  scene_pack_id?: string | null;
}

export interface MusicDramaRuntimeBridgeDebug {
  runtime_bridge_used: boolean;
  scene_id: string;
  cue_match_type: CueMatchType;
  modulation_length: number;
  within_budget: boolean;
}

export interface MusicDramaRuntimeBridgeResult {
  runtime_context: RuntimeCinematicContext;
  prompt_modulation: string;
  debug: MusicDramaRuntimeBridgeDebug;
  bridge: RuntimeCueBridgeResult;
}

function normalizeId(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function findCueBySceneId(sceneId: string): CompactCinematicCue | null {
  const compact = buildCompactCueDataset();
  return compact.export.cues.find((cue) => cue.scene_id === sceneId) ?? null;
}

function findCueByScenePackId(scenePackId: string): CompactCinematicCue | null {
  const normalized = normalizeId(scenePackId);
  if (!normalized) return null;

  const compact = buildCompactCueDataset();
  return (
    compact.export.cues.find(
      (cue) =>
        cue.scene_pack_id === normalized ||
        normalized.includes(cue.scene_pack_id) ||
        cue.scene_pack_id.includes(normalized)
    ) ?? null
  );
}

export function resolveMusicDramaRuntimeCue(
  slot: MusicDramaSlotScenario,
  options?: { baselinePromptLength?: number }
): MusicDramaRuntimeBridgeResult {
  const baseline =
    options?.baselinePromptLength ??
    Math.max(slot.scenario.length, ESTIMATED_BRIDGED_PROMPT_BASELINE);

  const sceneId = normalizeId(slot.scene_id);
  const scenePackId = normalizeId(slot.scene_pack_id);

  let cueMatchType: CueMatchType = 'semantic';
  let resolvedSceneId: string | null = null;

  if (sceneId && lookupRuntimeCueData(sceneId).rich) {
    cueMatchType = 'exact';
    resolvedSceneId = sceneId;
  } else if (sceneId && findCueBySceneId(sceneId)) {
    cueMatchType = 'exact';
    resolvedSceneId = sceneId;
  } else if (scenePackId) {
    const packCue = findCueByScenePackId(scenePackId);
    if (packCue) {
      cueMatchType = 'pack';
      resolvedSceneId = packCue.scene_id;
    }
  }

  const bridge = resolvedSceneId
    ? buildRuntimeCueBridgeForSceneId(resolvedSceneId, { baselinePromptLength: baseline })
    : buildRuntimeCueBridgeFromPrompt(slot.scenario, { baselinePromptLength: baseline });

  if (!resolvedSceneId) {
    resolvedSceneId = bridge.scene_id;
  }

  return {
    runtime_context: bridge.runtime_context,
    prompt_modulation: bridge.prompt_modulation,
    bridge,
    debug: {
      runtime_bridge_used: bridge.prompt_modulation.length > 0,
      scene_id: resolvedSceneId,
      cue_match_type: cueMatchType,
      modulation_length: bridge.modulation_length,
      within_budget: bridge.within_budget,
    },
  };
}

export interface MusicDramaRuntimePreview {
  phase: typeof MUSIC_DRAMA_RUNTIME_BRIDGE_PHASE;
  schema_version: typeof MUSIC_DRAMA_RUNTIME_BRIDGE_VERSION;
  slot_count: number;
  matched_slots: number;
  runtime_bridge_usage_rate: number;
  average_modulation_length: number;
  slots_within_budget: number;
  sample_slots: Array<MusicDramaRuntimeBridgeDebug & { slot_id: string }>;
  diagnosis_only: true;
  generated_at: string;
}

function buildMusicDramaSlotCatalog(): MusicDramaSlotScenario[] {
  const compact = buildCompactCueDataset();
  const cueSlots: MusicDramaSlotScenario[] = compact.export.cues.map((cue) => ({
    slot_id: `drama-cue-${String(cue.scene_index + 1).padStart(2, '0')}`,
    scene_id: cue.scene_id,
    scene_pack_id: cue.scene_pack_id,
    scenario: [cue.narrative_intent, ...cue.shot_purpose].filter(Boolean).join('. '),
  }));

  const identitySlots: MusicDramaSlotScenario[] = [
    {
      slot_id: 'slot_1-1',
      scenario: 'Gonegi Mediterranean harbor identity portrait warm golden light',
    },
    {
      slot_id: 'slot_1-2',
      scenario: 'Dana companion harbor terrace walking hopeful cadence',
    },
    {
      slot_id: 'env-late_afternoon',
      scenario: 'Mediterranean harbor village terrace late afternoon golden friendship',
    },
  ];

  return [...cueSlots, ...identitySlots];
}

let cachedPreview: MusicDramaRuntimePreview | null = null;

export function buildMusicDramaRuntimePreview(): MusicDramaRuntimePreview {
  if (cachedPreview) return cachedPreview;

  const catalog = buildMusicDramaSlotCatalog();
  const results = catalog.map((slot) => {
    const resolved = resolveMusicDramaRuntimeCue(slot);
    return { slot_id: slot.slot_id, ...resolved.debug };
  });

  const matched = results.filter((row) => row.runtime_bridge_used).length;
  const modulationLengths = results.map((row) => row.modulation_length);
  const avg =
    modulationLengths.length > 0
      ? Math.round(
          modulationLengths.reduce((sum, value) => sum + value, 0) / modulationLengths.length
        )
      : 0;
  const withinBudgetCount = results.filter((row) => row.within_budget).length;

  cachedPreview = {
    phase: MUSIC_DRAMA_RUNTIME_BRIDGE_PHASE,
    schema_version: MUSIC_DRAMA_RUNTIME_BRIDGE_VERSION,
    slot_count: catalog.length,
    matched_slots: matched,
    runtime_bridge_usage_rate: Number((matched / Math.max(catalog.length, 1)).toFixed(2)),
    average_modulation_length: avg,
    slots_within_budget: withinBudgetCount,
    sample_slots: results.slice(0, 8),
    diagnosis_only: true,
    generated_at: new Date().toISOString(),
  };

  return cachedPreview;
}

export function resetMusicDramaRuntimeBridgeCache(): void {
  cachedPreview = null;
}
