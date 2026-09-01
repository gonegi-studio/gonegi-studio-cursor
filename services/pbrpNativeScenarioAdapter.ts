import type { PbrpRuntimeExecutionResult } from './pbrpRuntimeOrchestrator.js';
import { resolveCharacterByRawId, type AiStudioCharacterEntry, type CharacterResolution } from './pbrpCharacterVisualDnaLibrary.js';

/**
 * PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-001: PBRP -> AI Studio
 * Native Scenario JSON Adapter V1.
 *
 * Converts PBRP Runtime output into the REAL "Ghibli Drama JSON
 * specification file standard layout" -- the app's own code comment name
 * for the schema `handleImportScenarioJSON` (`AIStudio-App/components/
 * MusicDramaStudio.tsx:1278-1315`) actually parses. Confirmed field-by-
 * field against that real code (read-only, never modified, never
 * imported, never called) before writing anything here.
 *
 * Scope correction from the original phase request, made explicit by
 * direct user decision after a real-schema mismatch was found: this
 * repository does NOT contain, anywhere, a top-level `version` field, a
 * `fixed_foundation_layer` field, or per-slot `location_id`/`lighting_id`/
 * `shot_type`/`composition_id`/`movie_dataset_condition` fields in the
 * real, non-Path-B Import Scenario JSON schema. Those concepts belong (if
 * anywhere) to a *different* import branch in the same handler --
 * `parseRuntimeSpatialGraph` (the real numeric-3D spatial graph parser),
 * i.e. Path-B, which this phase explicitly excludes. This module produces
 * ONLY the confirmed-real fields:
 *   { mode?, concept?, themes?, masterDirective?, slots: [...] }
 * and deliberately omits mode/concept/themes/masterDirective entirely
 * (rather than inventing values PBRP has no data source for), since the
 * real import handler already treats every one of those as optional and
 * leaves existing app state untouched when absent
 * (`if (data.mode) setMode(data.mode)`, etc.) -- omitting them is the
 * genuinely correct, non-destructive choice, not a shortcut.
 */

export const PBRP_NATIVE_SCENARIO_ADAPTER_PHASE = 'PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-001' as const;

/** Mirrors the real per-version fields `handleImportScenarioJSON` reads/writes (MusicDramaStudio.tsx:1295-1311). Not imported -- see file header. */
export type NativeScenarioVersion = {
  id: string;
  artStyle?: string;
  timeSetting?: string;
  scenario: string;
  character?: string;
  status: 'idle';
  finalPrompt?: string;
  version: 1;
};

/** Mirrors the real slot wrapper shape the import handler always produces, whether the source JSON supplied raw fields or pre-built `versions`. */
export type NativeScenarioSlot = {
  id: number;
  activeVersionIndex: 0;
  versions: [NativeScenarioVersion];
};

/** Mirrors the real top-level document shape -- every field here besides `slots` is confirmed optional in the real handler and is never produced by this adapter (see file header). */
export type NativeScenarioDocument = {
  slots: NativeScenarioSlot[];
};

export type SlotFieldSource = {
  scenario_source: string;
  timeSetting_source: string;
  character_source: string;
  finalPrompt_source: string;
  omitted_slot_fields: string[];
};

export type NativeScenarioBuildResult = {
  pass: boolean;
  document: NativeScenarioDocument | null;
  validation_errors: string[];
  slot_sources: SlotFieldSource[];
  omitted_top_level_fields: string[];
};

function validatePbrpResult(result: PbrpRuntimeExecutionResult, index: number): string[] {
  const errors: string[] = [];
  const tag = `slot[${index}]`;
  if (!result.pass) errors.push(`${tag}: PBRP_RESULT_NOT_PASSING`);
  if (!result.scene_context) errors.push(`${tag}: MISSING_SCENE_CONTEXT`);
  if (!result.selection?.character) errors.push(`${tag}: MISSING_CHARACTER_SELECTION`);
  if (!result.selection?.shot) errors.push(`${tag}: MISSING_SHOT_SELECTION`);
  if (!result.final_prompt) errors.push(`${tag}: MISSING_FINAL_PROMPT`);
  if (!result.intent) errors.push(`${tag}: MISSING_INTENT`);
  return errors;
}

function buildSlot(result: PbrpRuntimeExecutionResult, index: number): { slot: NativeScenarioSlot; source: SlotFieldSource } {
  const character = result.selection!.character!;
  const lighting = result.scene_context!.lighting;
  const finalPrompt = result.final_prompt!;
  const intentId = result.intent!.intent_id;

  const scenario = finalPrompt.positive_prompt;
  // Real per-slot free-text field (distinct from the app's separate GLOBAL
  // selectedTime dropdown, per this repository's own prior read-only
  // finding) -- populated with real PBRP lighting data, disclosed as
  // round-tripped/stored but not itself generation-driving.
  const timeSetting = `${lighting.time_of_day}/${lighting.weather}: ${lighting.descriptor}`;
  // Character DNA boundary (same principle as pbrpAiStudioInputTranslator.ts):
  // semantic/emotional PBRP data, explicitly NOT AI Studio's visual_dna.
  const characterField = `${character.anchor_id}: ${character.emotion} -- ${character.semantic_meaning}`;

  const slotId = index + 1;
  const slot: NativeScenarioSlot = {
    id: slotId,
    activeVersionIndex: 0,
    versions: [{
      id: `${slotId}_v0`,
      scenario,
      character: characterField,
      timeSetting,
      status: 'idle',
      finalPrompt: finalPrompt.positive_prompt,
      version: 1,
    }],
  };

  const source: SlotFieldSource = {
    scenario_source: `final_prompt.positive_prompt (ai_studio consumer, intent_id=${intentId})`,
    timeSetting_source: `scene_context.lighting.time_of_day + weather + descriptor (real PBRP data; NOT the same as the app's separate global selectedTime dropdown -- disclosed as round-tripped/stored only, not generation-driving, per this repository's prior confirmed reading of AIStudio-App)`,
    character_source: `selection.character (semantic/emotional DNA only -- NOT visual_dna; same boundary as pbrpAiStudioInputTranslator.ts)`,
    finalPrompt_source: `final_prompt.positive_prompt (ai_studio consumer)`,
    omitted_slot_fields: ['artStyle (no PBRP data source -- app falls back to its own UNIFIED_ART_STYLE default)', 'seed (no PBRP data source)'],
  };

  return { slot, source };
}

/**
 * Builds a Native Scenario JSON document from one or more completed,
 * passing PBRP Runtime results. Slot order and count exactly match the
 * input array -- no reordering, no dropping, no duplication.
 */
export function buildNativeScenarioDocument(results: PbrpRuntimeExecutionResult[]): NativeScenarioBuildResult {
  const validation_errors: string[] = [];
  results.forEach((r, i) => validation_errors.push(...validatePbrpResult(r, i)));

  if (results.length === 0) {
    validation_errors.push('EMPTY_INPUT: at least one PBRP result is required');
  }

  if (validation_errors.length > 0) {
    return { pass: false, document: null, validation_errors, slot_sources: [], omitted_top_level_fields: [] };
  }

  const slots: NativeScenarioSlot[] = [];
  const slot_sources: SlotFieldSource[] = [];
  results.forEach((r, i) => {
    const { slot, source } = buildSlot(r, i);
    slots.push(slot);
    slot_sources.push(source);
  });

  return {
    pass: true,
    document: { slots },
    validation_errors: [],
    slot_sources,
    omitted_top_level_fields: [
      'mode (no PBRP equivalent -- real field is a fixed enum: reality|dream|parallel|afterworld)',
      'concept (no PBRP data source; app keeps its existing value when absent)',
      'themes (no PBRP data source; app keeps its existing value when absent)',
      'masterDirective (no PBRP data source; app keeps its existing value when absent)',
    ],
  };
}

// =========================================================================
// PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-004: Character Visual DNA
// resolution. Purely additive -- does not alter `buildNativeScenarioDocument`
// or its existing `character` field (PBRP's real semantic anchor data,
// still valid and still what PHASE-001/002/003 verified). This section
// adds the SEPARATE, real Character Visual DNA connection: PBRP's earlier
// treatment of a scene anchor's own `anchor_id`/`emotion`/`semantic_meaning`
// as if it were "the character" was a real conflation (the anchor
// describes a borrowed pose/composition, not a cast member) -- the actual
// cast is the anchor's own `gonegi_characters` field, resolved here against
// the real Character Visual DNA library, never against semantic data.
// =========================================================================

export type SlotCastEntry = {
  slot_index: number;
  anchor_id: string;
  raw_gonegi_characters: string[];
  resolutions: CharacterResolution[];
  resolved_count: number;
  unresolved_count: number;
};

export type CharacterBookCompanion = {
  /** Matches the real `{characters: [...]}` shape `CharacterBookModal.tsx`'s `handleImportJSON` assigns directly, untransformed, to `characterBook.characters`. */
  characters: AiStudioCharacterEntry[];
};

export type CharacterResolutionResult = {
  pass: boolean;
  validation_errors: string[];
  slot_cast: SlotCastEntry[];
  character_book_companion: CharacterBookCompanion | null;
  fully_resolved: boolean;
};

/**
 * Resolves the REAL cast (`gonegi_characters`, recovered in
 * `pbrpKnowledgeRepository.ts`) for one or more PBRP results against the
 * real Character Visual DNA library, and aggregates a deduplicated
 * `characterBook.characters[]`-shaped companion covering every distinct
 * character across all slots. Never fabricates a resolution: a raw cast id
 * with no real library match is recorded as unresolved, not guessed.
 */
export function resolveCharacterCastForSlots(
  results: PbrpRuntimeExecutionResult[],
  library: AiStudioCharacterEntry[]
): CharacterResolutionResult {
  const validation_errors: string[] = [];
  results.forEach((r, i) => validation_errors.push(...validatePbrpResult(r, i)));
  if (results.length === 0) validation_errors.push('EMPTY_INPUT: at least one PBRP result is required');

  if (validation_errors.length > 0) {
    return { pass: false, validation_errors, slot_cast: [], character_book_companion: null, fully_resolved: false };
  }

  const slot_cast: SlotCastEntry[] = results.map((r, i) => {
    const anchor = r.selection!.character!;
    const resolutions = anchor.gonegi_characters.map((rawId) => resolveCharacterByRawId(library, rawId));
    return {
      slot_index: i,
      anchor_id: anchor.anchor_id,
      raw_gonegi_characters: anchor.gonegi_characters,
      resolutions,
      resolved_count: resolutions.filter((r) => r.resolved !== null).length,
      unresolved_count: resolutions.filter((r) => r.resolved === null).length,
    };
  });

  // Deduplicate by `id` across every slot's resolved cast, preserving each
  // entry's own real, unmodified content -- first occurrence wins (all
  // occurrences of the same character resolve to the identical library
  // entry regardless of slot, since resolution is a pure lookup).
  const seen = new Map<string, AiStudioCharacterEntry>();
  for (const cast of slot_cast) {
    for (const res of cast.resolutions) {
      if (res.resolved && !seen.has(res.resolved.id)) {
        seen.set(res.resolved.id, res.resolved);
      }
    }
  }

  const fully_resolved = slot_cast.every((c) => c.unresolved_count === 0);

  return {
    pass: true,
    validation_errors: [],
    slot_cast,
    character_book_companion: { characters: [...seen.values()] },
    fully_resolved,
  };
}
