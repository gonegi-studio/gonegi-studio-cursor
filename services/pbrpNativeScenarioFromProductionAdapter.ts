import type { ProductionScenario } from './pbrpProductionScenarioAssembler.js';
import type { NativeScenarioDocument, NativeScenarioSlot, CharacterBookCompanion } from './pbrpNativeScenarioAdapter.js';
import type { AiStudioCharacterEntry } from './pbrpCharacterVisualDnaLibrary.js';

/**
 * PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-005: AI Studio Ready
 * Scenario Output V1.
 *
 * Converts PHASE-004's `ProductionScenario` (ground-truth-priority,
 * conflict-preserving, gap-honest) into the same real Native Scenario JSON
 * shape `pbrpNativeScenarioAdapter.ts` targets (PHASE-PBRP-AI-STUDIO-
 * NATIVE-SCENARIO-ADAPTER-001's confirmed-real `{slots: [...]}` schema,
 * field-by-field verified against `AIStudio-App/components/
 * MusicDramaStudio.tsx`'s real `handleImportScenarioJSON`). Types
 * (`NativeScenarioDocument`/`NativeScenarioSlot`/`CharacterBookCompanion`)
 * are imported from that module, never redefined -- this is a second,
 * parallel real path into the identical schema, not a competing one.
 *
 * This path differs from `pbrpNativeScenarioAdapter.ts`'s existing
 * `buildNativeScenarioDocument` in exactly one deliberate, disclosed way:
 * that function's `character` field is semantic/emotional PBRP data ONLY,
 * explicitly NOT visual_dna (a boundary that module's own header states).
 * This phase's own item 2 explicitly requires real Character Visual DNA to
 * be included -- so here, `character` carries the real, resolved
 * `visual_dna` text PHASE-004 already attached to the scene's cast. This is
 * consistent with AI Studio's own `CharacterEntry.visual_dna` field being
 * the actual real visual-data slot on the consumer side; it does not
 * change or reinterpret the older adapter, which is untouched and still
 * serves its own, different (PbrpRuntimeExecutionResult-based) callers.
 *
 * Purely additive and read-only: no existing file is modified, no network
 * call, no Path-B usage.
 */

export const PBRP_NATIVE_SCENARIO_FROM_PRODUCTION_PHASE =
  'PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-005' as const;

export type ProductionSlotFieldSource = {
  scenario_source: string;
  timeSetting_source: string;
  character_source: string;
  finalPrompt_source: string;
  omitted_slot_fields: string[];
};

export type ProductionNativeScenarioBuildResult = {
  pass: boolean;
  document: NativeScenarioDocument | null;
  validation_errors: string[];
  slot_sources: ProductionSlotFieldSource[];
};

function validateProductionScenario(scenario: ProductionScenario, index: number): string[] {
  const errors: string[] = [];
  const tag = `slot[${index}] (${scenario.scene_id})`;
  if (!scenario.pass) errors.push(`${tag}: PRODUCTION_SCENARIO_NOT_PASSING (${scenario.errors.join('; ')})`);
  if (!scenario.final_text) errors.push(`${tag}: MISSING_FINAL_TEXT`);
  // Deliberately NOT a hard error when `cast` is empty (e.g. a real
  // semantic anchor with no `gonegi_characters` field at all, confirmed for
  // `titanic_deck_to_interior_transition` during this phase's own testing):
  // an unresolvable cast is a real data gap, disclosed as NOT_DERIVABLE in
  // the character field below -- the same treatment already given to
  // Location/Lighting/Style, not a reason to reject the whole scenario.
  return errors;
}

/** Builds one real cast text from PHASE-004's already-resolved Character Visual DNA -- verbatim visual_dna, never a paraphrase; a raw id with no real resolution is disclosed as NOT_DERIVABLE, never guessed. An empty cast (a real anchor with no gonegi_characters field at all) is disclosed the same way. */
function buildCharacterField(scenario: ProductionScenario): string {
  if (scenario.character_direction.cast.length === 0) {
    return `NOT_DERIVABLE: ${scenario.character_direction.cast_source_note}`;
  }
  return scenario.character_direction.cast
    .map((c) => (c.resolved ? `${c.resolved.name}: ${c.resolved.visual_dna}` : `${c.raw_id}: NOT_DERIVABLE (${c.resolution_note})`))
    .join(' / ');
}

function buildSlot(scenario: ProductionScenario, index: number): { slot: NativeScenarioSlot; source: ProductionSlotFieldSource } {
  const slotId = index + 1;
  const scenarioText = scenario.final_text;
  const characterField = buildCharacterField(scenario);
  // timeSetting is confirmed real but non-generation-driving free text
  // (PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-001's own finding: it is
  // round-tripped/stored, not itself generation-driving) -- so an honest
  // "NOT_DERIVABLE: <reason>" string here discloses a real gap without
  // steering any actual generation behavior. `artStyle`, by contrast, is a
  // field the real app could actually apply as-is; per that same phase's
  // own original design it stays OMITTED when PBRP has no real data for it
  // (never string-marked), which item 5's Style NOT_DERIVABLE verdict
  // (confirmed absent every phase from PHASE-002 through PHASE-004) means
  // it always is here.
  const timeSetting = scenario.lighting_direction.status === 'DERIVED' ? scenario.lighting_direction.text : `NOT_DERIVABLE: ${scenario.lighting_direction.text}`;

  const slot: NativeScenarioSlot = {
    id: slotId,
    activeVersionIndex: 0,
    versions: [
      {
        id: `${slotId}_v0`,
        scenario: scenarioText,
        character: characterField,
        timeSetting,
        status: 'idle',
        finalPrompt: scenarioText,
        version: 1,
      },
    ],
  };

  const source: ProductionSlotFieldSource = {
    scenario_source: `ProductionScenario.final_text (PHASE-004, scene_id=${scenario.scene_id})`,
    timeSetting_source:
      scenario.lighting_direction.status === 'DERIVED'
        ? 'ProductionScenario.lighting_direction.text (real, matched lighting profile(s))'
        : 'ProductionScenario.lighting_direction.text (real gap reason, disclosed as NOT_DERIVABLE, not fabricated)',
    character_source: 'ProductionScenario.character_direction.cast (real, resolved Character Visual DNA -- visual_dna verbatim, NOT semantic/emotional anchor data)',
    finalPrompt_source: 'same as scenario_source (PHASE-004 produces one deterministic text, not a separate optimized prompt stage)',
    omitted_slot_fields: ['artStyle (Gonegi Style DNA confirmed absent -- PHASE-002/003/004; app falls back to its own default when this field is absent)', 'seed (no PBRP data source)'],
  };

  return { slot, source };
}

/**
 * The item-6 deliverable: builds a real Native Scenario JSON document from
 * one or more completed, passing PHASE-004 Production Scenarios. Slot
 * order and count exactly match the input array.
 */
export function buildNativeScenarioFromProductionScenarios(scenarios: ProductionScenario[]): ProductionNativeScenarioBuildResult {
  const validation_errors: string[] = [];
  scenarios.forEach((s, i) => validation_errors.push(...validateProductionScenario(s, i)));
  if (scenarios.length === 0) validation_errors.push('EMPTY_INPUT: at least one Production Scenario is required');

  if (validation_errors.length > 0) {
    return { pass: false, document: null, validation_errors, slot_sources: [] };
  }

  const slots: NativeScenarioSlot[] = [];
  const slot_sources: ProductionSlotFieldSource[] = [];
  scenarios.forEach((s, i) => {
    const { slot, source } = buildSlot(s, i);
    slots.push(slot);
    slot_sources.push(source);
  });

  return { pass: true, document: { slots }, validation_errors: [], slot_sources };
}

/**
 * Builds the real `characterBook.characters[]`-shaped companion directly
 * from PHASE-004's already-resolved cast (no re-resolution, no separate
 * lookup) -- deduplicated by real `id` across every scenario, first
 * occurrence wins (all occurrences of the same character resolve to the
 * identical real library entry regardless of scene).
 */
export function buildCharacterBookCompanionFromProductionScenarios(scenarios: ProductionScenario[]): CharacterBookCompanion {
  const seen = new Map<string, AiStudioCharacterEntry>();
  for (const scenario of scenarios) {
    for (const resolution of scenario.character_direction.cast) {
      if (resolution.resolved && !seen.has(resolution.resolved.id)) {
        seen.set(resolution.resolved.id, resolution.resolved);
      }
    }
  }
  return { characters: [...seen.values()] };
}
