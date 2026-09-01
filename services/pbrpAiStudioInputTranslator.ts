import type { PbrpRuntimeExecutionResult } from './pbrpRuntimeOrchestrator.js';
import type { CharacterDnaEntry, StyleDnaEntry } from './pbrpKnowledgeRepository.js';
import type { LightingQuery } from './pbrpIntentAnalyzer.js';

/**
 * PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-001: PBRP → AI Studio Path-A Input
 * Translation V1.
 *
 * Translates a completed, passing PBRP Runtime result into the real AI
 * Studio "Path A" structured input contract identified in
 * `reports/project_brain_integration/PBRP_AI_STUDIO_INPUT_SCHEMA_MAPPING_DESIGN_V1.md`.
 *
 * This module does NOT import anything from `E:\Gonegi-AIStudio\AIStudio-App`
 * -- that is a separate, unrelated project outside this repository. The
 * `AiStudio*` types below are a deliberately minimal, hand-mirrored subset
 * of that app's own real `types.ts` (as read, read-only, during the design
 * phase), kept only as far as this translator's scope actually reaches.
 * This repository gains no dependency on that project by doing this.
 *
 * Scope boundary (per this phase's own 범위/제외 lists):
 *  - `scenario`, `timeKey` (+ `environmentDNA` selection), `layoutBlueprint`,
 *    `negative_prompt` ARE produced here.
 *  - `visual_dna` / `characterBook.styleCore` / `seed` / `referenceImages` /
 *    `render_rules` / the Path-B spatial graph are explicitly NOT produced
 *    here -- they stay app-owned, per the design doc's own finding that
 *    "Character DNA" means two different kinds of data in the two systems
 *    and must not be conflated.
 *
 * PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-002 update (real compatibility
 * findings from a read-only comparison of this contract against the actual
 * pre-generation code in `AIStudio-App/services/geminiService.ts`):
 *  - `negative_prompt` is kept in this contract (harmless to carry, useful
 *    for a human reviewer), but is disclosed here as NOT actually wired
 *    into the app's real live-generation call (`generateOptimizedImage`
 *    never references any negative-prompt parameter at all -- confirmed by
 *    a direct grep of that file). It only appears elsewhere in the app in
 *    an unrelated JSON export function (`constructVideoRecipe`) and as an
 *    unused default in one other component. A human handing this off
 *    should not expect the negative prompt to have any effect through the
 *    app's normal "Render Image" path.
 *  - `character_reference` (the value that would occupy the app's unused
 *    `dnaCore` parameter position) has been confirmed, by the same
 *    read-only comparison, to have zero effect on real generation --
 *    `dnaCore` is declared in `generateOptimizedImage`'s signature but
 *    never referenced in its body. Real character visual identity comes
 *    entirely from the app's own separate, human-curated `characterBook`
 *    state, independent of any per-scenario input. This is consistent with,
 *    not a contradiction of, this translator's Character DNA boundary
 *    design -- it confirms there was never a real channel for PBRP's
 *    semantic character data to reach visual generation in this app, by
 *    the app's own construction.
 *  - `layoutBlueprint`'s five fields were changed from optional
 *    (`undefined` when not derivable) to always-populated strings (using
 *    `NOT_DERIVABLE_PLACEHOLDER`), because the app's real template code
 *    interpolates all five fields unconditionally with no undefined-guard
 *    -- see `AiStudioLayoutDnaFields`'s own doc comment for the exact
 *    real code this was checked against.
 */

export const PBRP_AI_STUDIO_TRANSLATION_PHASE = 'PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-002' as const;

// --- Mirrored (not imported) AI Studio Path-A schema, minimal subset -----

/** Mirrors AIStudio-App's `TimeOfDay` (types.ts). Hand-copied, not imported -- see file header. */
export type AiStudioTimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'late_afternoon' | 'sunset' | 'night' | 'dream' | 'spiritual' | 'global';

/**
 * Mirrors AIStudio-App's `LayoutDna` (types.ts) -- but unlike Phase 001's
 * first draft, every field here is a required, always-populated string,
 * never `undefined`.
 *
 * PHASE-PBRP-AI-STUDIO-INPUT-TRANSLATION-002 found, via read-only
 * comparison against the real pre-generation code
 * (`AIStudio-App/services/geminiService.ts`), that the app's own
 * `layoutContext` template unconditionally interpolates all five
 * `layoutBlueprint.dna.*` fields with no undefined-guard:
 * `` `[LAYOUT DNA: PERSPECTIVE: ${dna.perspective} | ... | SCALE: ${dna.scale}]` ``.
 * Phase 001's `Partial<LayoutDna>` (leaving undeivable fields as
 * `undefined`) would, if actually fed to that real code, produce the
 * literal string "undefined" inside the real generation prompt sent to
 * Gemini -- a genuine defect, not a cosmetic one. Fixed here by requiring
 * every field to carry either real, PBRP-derived content or an explicit,
 * legible `NOT_DERIVABLE_PLACEHOLDER` -- never JavaScript `undefined`.
 */
export type AiStudioLayoutDnaFields = {
  perspective: string;
  composition: string;
  structuralGeometry: string;
  depthLayers: string;
  scale: string;
};

/** Explicit, legible placeholder for a LayoutDna field PBRP has no data source for -- deliberately readable text, never `undefined`. */
export const NOT_DERIVABLE_PLACEHOLDER = '(not derivable from PBRP data)' as const;

export type AiStudioCharacterReference = {
  pbrp_anchor_id: string;
  semantic_note: string;
};

export type AiStudioInputContractV1 = {
  contract_version: 'ai_studio_input_contract_v1';
  scenario: string;
  timeKey: AiStudioTimeOfDay;
  negative_prompt: string;
  layoutBlueprint: AiStudioLayoutDnaFields | null;
  character_reference: AiStudioCharacterReference | null;
};

export type TranslationTraceability = {
  scenario_source: string;
  timeKey_source: string;
  layoutBlueprint_source: string;
  character_reference_source: string;
  omitted_fields: string[];
};

export type TranslationResult = {
  pass: boolean;
  contract: AiStudioInputContractV1 | null;
  validation_errors: string[];
  traceability: TranslationTraceability | null;
};

// --- Input Validation ------------------------------------------------------

/** Blocks translation of an incomplete/failed PBRP result rather than producing a partial or misleading AI Studio contract. */
function validatePbrpResult(result: PbrpRuntimeExecutionResult): string[] {
  const errors: string[] = [];
  if (!result.pass) {
    errors.push('PBRP_RESULT_NOT_PASSING: cannot translate a failed PBRP run');
  }
  if (!result.scene_context) {
    errors.push('MISSING_SCENE_CONTEXT');
  }
  if (!result.selection?.character) {
    errors.push('MISSING_CHARACTER_SELECTION');
  }
  if (!result.selection?.shot) {
    errors.push('MISSING_SHOT_SELECTION');
  }
  if (!result.final_prompt || result.final_prompt.negative_prompt.trim().length === 0) {
    errors.push('MISSING_OR_EMPTY_NEGATIVE_PROMPT');
  }
  if (!result.intent) {
    errors.push('MISSING_INTENT');
  }
  return errors;
}

// --- TimeKey translation -----------------------------------------------

/**
 * Fixed, deterministic, disclosed mapping (per
 * PBRP_AI_STUDIO_INPUT_SCHEMA_MAPPING_DESIGN_V1.md §4). Only `night` is an
 * exact match between the two systems; `golden_hour`->`sunset` and
 * `day`->`afternoon` are documented default choices, not derived facts --
 * PBRP does not currently distinguish sunset from late_afternoon, or
 * morning from afternoon.
 */
const TIME_KEY_MAP: Record<LightingQuery['time_of_day'], AiStudioTimeOfDay> = {
  night: 'night',
  golden_hour: 'sunset',
  day: 'afternoon',
  unspecified: 'global',
};

function translateTimeKey(timeOfDay: LightingQuery['time_of_day']): AiStudioTimeOfDay {
  return TIME_KEY_MAP[timeOfDay];
}

// --- Layout mapping -----------------------------------------------------

/** Parses the Spirited-Away-shaped descriptor ("foreground=X, midground=Y, background=Z"), real convention from pbrpKnowledgeRepository.ts. */
function parseForegroundMidgroundBackground(descriptor: string): { foreground: string; midground: string; background: string } | null {
  const m = descriptor.match(/foreground=([^,]+), midground=([^,]+), background=(.+)/);
  if (!m) return null;
  return { foreground: m[1].trim(), midground: m[2].trim(), background: m[3].trim() };
}

/**
 * Populates every `AiStudioLayoutDnaFields` field -- real PBRP-derived
 * content where available, `NOT_DERIVABLE_PLACEHOLDER` everywhere else.
 * Never fabricates `perspective`/`structuralGeometry`/`scale` content
 * PBRP has no data for, and never leaves a field `undefined` either (see
 * the type's own doc comment for why the latter matters for real
 * compatibility with `AIStudio-App`'s actual template code).
 */
function translateLayout(style: StyleDnaEntry | null): { layout: AiStudioLayoutDnaFields | null; source: string } {
  if (!style) {
    return { layout: null, source: 'no style selected' };
  }
  const fmb = parseForegroundMidgroundBackground(style.descriptor);
  if (fmb) {
    return {
      layout: {
        perspective: NOT_DERIVABLE_PLACEHOLDER,
        composition: NOT_DERIVABLE_PLACEHOLDER,
        structuralGeometry: NOT_DERIVABLE_PLACEHOLDER,
        depthLayers: `Foreground: ${fmb.foreground}; Midground: ${fmb.midground}; Background: ${fmb.background}`,
        scale: NOT_DERIVABLE_PLACEHOLDER,
      },
      source: `style.descriptor (spirited_away-shaped foreground/midground/background) -> depthLayers only; perspective/structuralGeometry/scale set to NOT_DERIVABLE_PLACEHOLDER (no PBRP data source)`,
    };
  }
  return {
    layout: {
      perspective: NOT_DERIVABLE_PLACEHOLDER,
      composition: `priority_score=${style.priority_score} (${style.descriptor})`,
      structuralGeometry: NOT_DERIVABLE_PLACEHOLDER,
      depthLayers: NOT_DERIVABLE_PLACEHOLDER,
      scale: NOT_DERIVABLE_PLACEHOLDER,
    },
    source: `style.descriptor (titanic-shaped priority_score) -> composition only; depthLayers/perspective/structuralGeometry/scale set to NOT_DERIVABLE_PLACEHOLDER (no PBRP data source)`,
  };
}

// --- Character DNA boundary (deliberately NOT visual_dna) ----------------

function buildCharacterReference(character: CharacterDnaEntry | null): { ref: AiStudioCharacterReference | null; source: string } {
  if (!character) {
    return { ref: null, source: 'no character selected' };
  }
  return {
    ref: { pbrp_anchor_id: character.anchor_id, semantic_note: `${character.emotion} -- ${character.semantic_meaning}` },
    source: 'selection.character (semantic/emotional DNA only -- NOT mapped to visual_dna; see design doc finding on the Character DNA terminology collision)',
  };
}

// --- Scenario construction -----------------------------------------------

/** Small, disclosed, partial-coverage table -- real shot_type values observed in the Titanic/Spirited Away registries. Unknown values fall back to the raw shot_type string rather than failing translation. */
const SHOT_TYPE_PHRASE: Record<string, string> = {
  wide_establishing: 'in a wide establishing shot',
  medium_two_shot: 'in a medium two-shot',
  close_up_emotion: 'in an emotional close-up',
  over_shoulder: 'in an over-the-shoulder shot',
  insert_detail: 'in a detail insert shot',
  tracking_follow: 'in a tracking shot following the subject',
  static_hold: 'in a static held shot',
  low_angle_hero: 'in a low-angle heroic shot',
  high_angle_reveal: 'in a high-angle reveal shot',
  profile_intimacy: 'in an intimate profile shot',
  pull_back_reveal: 'in a pull-back reveal shot',
  medium_character_entry: 'in a medium shot as the character enters',
};

function shotPhrase(shotType: string): string {
  return SHOT_TYPE_PHRASE[shotType] ?? `in a ${shotType.replace(/_/g, ' ')} shot`;
}

function buildScenario(result: PbrpRuntimeExecutionResult): { scenario: string; source: string } {
  const character = result.selection!.character!;
  const shot = result.selection!.shot!;
  const lighting = result.scene_context!.lighting;
  const scenario = `${character.semantic_meaning} ${shotPhrase(shot.shot_type)}, ${lighting.descriptor}.`;
  return {
    scenario,
    source: 'selection.character.semantic_meaning + shotPhrase(selection.shot.shot_type) + scene_context.lighting.descriptor, assembled into one sentence (not a string-strip of PBRP\'s own labeled positive_prompt)',
  };
}

// --- Main entry point ------------------------------------------------------

export function translatePbrpOutputToAiStudioInput(result: PbrpRuntimeExecutionResult): TranslationResult {
  const validation_errors = validatePbrpResult(result);
  if (validation_errors.length > 0) {
    return { pass: false, contract: null, validation_errors, traceability: null };
  }

  const { scenario, source: scenarioSource } = buildScenario(result);
  const timeKey = translateTimeKey(result.scene_context!.lighting.time_of_day);
  const { layout, source: layoutSource } = translateLayout(result.selection!.style);
  const { ref, source: refSource } = buildCharacterReference(result.selection!.character);

  const contract: AiStudioInputContractV1 = {
    contract_version: 'ai_studio_input_contract_v1',
    scenario,
    timeKey,
    negative_prompt: result.final_prompt!.negative_prompt,
    layoutBlueprint: layout,
    character_reference: ref,
  };

  const traceability: TranslationTraceability = {
    scenario_source: scenarioSource,
    timeKey_source: `scene_context.lighting.time_of_day='${result.scene_context!.lighting.time_of_day}' -> timeKey='${timeKey}' via fixed TIME_KEY_MAP`,
    layoutBlueprint_source: layoutSource,
    character_reference_source: refSource,
    omitted_fields: ['visual_dna (characterBook.characters)', 'styleCore', 'seed', 'referenceImages', 'render_rules', 'movieDataset (Path-B spatial graph)'],
  };

  return { pass: true, contract, validation_errors: [], traceability };
}
