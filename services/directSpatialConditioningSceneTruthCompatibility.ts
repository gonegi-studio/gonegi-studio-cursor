/**
 * [DSC Scene Truth Compatibility V1]
 *
 * Makes Direct Spatial Conditioning (DSC) able to genuinely carry real Scene
 * Truth data -- Lighting and Environment, both entirely absent from DSC
 * today -- while preserving MEASURED/INFERRED/null exactly as Scene Truth
 * produced it. This file adds two new channels; it does not touch the
 * existing six.
 *
 * ---------------------------------------------------------------------
 * Why this is additive, not an in-place fix -- a real, measured blast radius
 * ---------------------------------------------------------------------
 * DSC's real problem is that `ChannelComponentSchema.nullable` in
 * directSpatialConditioningContractBuilder.ts is typed as the LITERAL `false`
 * -- not `boolean` -- so no channel built through that type can ever declare
 * a genuinely-nullable field; the type system itself forbids it. The
 * "obvious" fix would be widening that one field to `boolean`. Before doing
 * that, this phase checked how many files could be affected: 96
 * scripts/verify-direct-spatial-conditioning-*.ts files reference `.nullable`
 * (grep, confirmed), and 6 downstream builder files also do, on top of
 * verify-direct-spatial-conditioning-contract.ts's own
 * `if (!comp.required || comp.nullable) issues.push('COMPONENT_OPTIONAL_OR_NULLABLE', ...)`
 * check, which today asserts EVERY existing component is never nullable --
 * i.e. widening the shared type would not just be type-compatible, it would
 * require deciding, for 96+ files whose actual logic was never read this
 * phase, whether each one's assumptions still hold. That is not a "minimal"
 * change ("Lighting / Environment channel 최소 추가" was the actual
 * instruction), and "기존 6채널 호환성 유지" (preserve the existing six
 * channels' compatibility) argues directly against touching a type 96 files
 * depend on for a two-channel addition.
 *
 * So the real fix here is architectural, not a type-widen: a NEW,
 * independent schema type (SceneTruthConditioningComponentSchema) that
 * genuinely supports `nullable: boolean`, used only by the two new channels
 * this file defines. The original ConditioningChannelId union, the six
 * SPATIAL_CONDITIONING_CHANNELS, DirectSpatialConditioningContract, and
 * every one of their component schemas remain BYTE-IDENTICAL and untouched
 * -- confirmed empirically by re-running every existing
 * verify:direct-spatial-conditioning-{foundation,contract,packet} script
 * unchanged after this file was added (see this file's own verify script).
 *
 * ---------------------------------------------------------------------
 * unknown(null) != missing/error -- a real validator, not a declarative string
 * ---------------------------------------------------------------------
 * Every DSC contract file to date only ever emits declarative JSON
 * (`predicate: 'some english/pseudocode string'`) -- there was no function
 * anywhere in DSC that actually reads a real component value and decides
 * accept/reject. validateComponentsAgainstSchema() below is DSC's first real
 * validator. It distinguishes three real, distinct outcomes per field:
 *   - the key is absent from the values object entirely -> 'missing' (an
 *     error regardless of the field's nullable flag -- every declared field
 *     must always be present as a key)
 *   - the key is present with value null -> 'valid' only if the schema
 *     marks that field nullable, else 'null_not_allowed'
 *   - the key is present with a non-null value -> checked against its
 *     declared kind ('valid' or 'type_mismatch')
 * "Unknown" (a field Scene Truth genuinely could not determine, e.g.
 * weather.guess, which is unconditionally null -- see
 * sceneMeasurementEnvironmentAnalyzer.ts) is therefore representable and
 * valid; a field silently dropped from the payload is not.
 *
 * ---------------------------------------------------------------------
 * Provenance never lost
 * ---------------------------------------------------------------------
 * Every Scene-Truth-derived value that can legitimately be null also has a
 * sibling `..._provenance` component (always 'measured' or 'inferred',
 * required, non-nullable) built straight from the SAME MeasuredValue/
 * InferredValue's own `.provenance` field -- never invented, never
 * defaulted. A consumer reading a null component can always also read
 * whether that null came from a MEASURED or INFERRED step.
 *
 * ---------------------------------------------------------------------
 * Character / Style: the one swappable boundary
 * ---------------------------------------------------------------------
 * CONDITIONING_SWAP_BOUNDARY below is the single declared list covering
 * every DSC channel (original six + these two) plus the two domains Scene
 * Truth never produces at all (character, style -- every detector across
 * this whole effort reports generic COCO classes, never identity; see
 * realOcclusionIntegration.ts's `character_identity: null`). Exactly two
 * entries are 'swappable' (character, style -- pointing at the real,
 * existing movieCharacterDNALock.ts / movieArtstyleLockValidation.ts lock
 * systems); every other domain is 'locked'. assertOnlyCharacterAndStyleSwappable()
 * checks this structurally, not just by inspection.
 */

import type { SceneTruth } from './sceneMeasurementSceneTruthIntegrator.js';
import type { ComponentValueKind } from './directSpatialConditioningContractBuilder.js';
import { CONDITIONING_CHANNEL_IDS, type ConditioningChannelId } from './directSpatialConditioningFoundationBuilder.js';

export const DSC_SCENE_TRUTH_COMPATIBILITY_PHASE = 'PHASE-DSC-SCENE-TRUTH-COMPAT-001' as const;

// ============================================================
// Two new channels -- additive, independent type
// ============================================================

export type SceneTruthChannelId = 'lighting_condition_field' | 'environment_condition_field';

/** Every channel this repo now has, original six + these two -- for
 *  reporting purposes only; never fed back into the original, untouched
 *  CONDITIONING_CHANNEL_IDS array. */
export const EXTENDED_CONDITIONING_CHANNEL_IDS: readonly (ConditioningChannelId | SceneTruthChannelId)[] = Object.freeze([
  ...CONDITIONING_CHANNEL_IDS,
  'lighting_condition_field',
  'environment_condition_field',
]);

/**
 * The real fix: nullable is a genuine boolean here, not a literal `false`.
 * Structurally independent of directSpatialConditioningContractBuilder.ts's
 * ChannelComponentSchema -- see file header for why.
 */
export interface SceneTruthConditioningComponentSchema {
  name: string;
  kind: ComponentValueKind;
  required: true;
  nullable: boolean;
  /** Required whenever nullable is true: the sibling component name that
   *  carries this field's MEASURED/INFERRED provenance tag, so a null value
   *  is never reported without also disclosing how it was (not) derived. */
  provenance_component: string | null;
  description: string;
}

export const LIGHTING_CONDITION_FIELD_SCHEMA: readonly SceneTruthConditioningComponentSchema[] = Object.freeze([
  {
    name: 'luminance_mean',
    kind: 'number',
    required: true,
    nullable: false,
    provenance_component: 'luminance_provenance',
    description: 'Mean grayscale luminance byte value (0-255), deterministic pixel arithmetic, never null.',
  },
  {
    name: 'luminance_stddev',
    kind: 'number',
    required: true,
    nullable: false,
    provenance_component: 'luminance_provenance',
    description: 'Standard deviation of grayscale luminance bytes -- this contract\'s contrast measurement, never null.',
  },
  {
    name: 'luminance_provenance',
    kind: 'string',
    required: true,
    nullable: false,
    provenance_component: null,
    description: 'Provenance tag ("measured") for luminance_mean/luminance_stddev.',
  },
  {
    name: 'light_direction_guess',
    kind: 'string',
    required: true,
    nullable: true,
    provenance_component: 'light_direction_provenance',
    description: 'Heuristic light-direction bucket from quadrant luminance spread; nullable because INFERRED guesses are never fabricated when ungrounded.',
  },
  {
    name: 'light_direction_confidence',
    kind: 'number',
    required: true,
    nullable: true,
    provenance_component: 'light_direction_provenance',
    description: 'Confidence for light_direction_guess; nullable, matching InferredValue<T>.confidence: number | null.',
  },
  {
    name: 'light_direction_provenance',
    kind: 'string',
    required: true,
    nullable: false,
    provenance_component: null,
    description: 'Provenance tag ("inferred") for light_direction_guess/light_direction_confidence.',
  },
]);

export const ENVIRONMENT_CONDITION_FIELD_SCHEMA: readonly SceneTruthConditioningComponentSchema[] = Object.freeze([
  {
    name: 'indoor_outdoor_guess',
    kind: 'string',
    required: true,
    nullable: true,
    provenance_component: 'indoor_outdoor_provenance',
    description: 'Indoor/outdoor guess from detected object classes; null when no indoor- or outdoor-associated class was detected at all (a real, honest outcome, not an error).',
  },
  {
    name: 'indoor_outdoor_confidence',
    kind: 'number',
    required: true,
    nullable: true,
    provenance_component: 'indoor_outdoor_provenance',
    description: 'Confidence for indoor_outdoor_guess; null exactly when indoor_outdoor_guess is null.',
  },
  {
    name: 'indoor_outdoor_provenance',
    kind: 'string',
    required: true,
    nullable: false,
    provenance_component: null,
    description: 'Provenance tag ("inferred") for indoor_outdoor_guess/indoor_outdoor_confidence.',
  },
  {
    name: 'weather_guess',
    kind: 'string',
    required: true,
    nullable: true,
    provenance_component: 'weather_provenance',
    description: 'Weather guess -- unconditionally null in the current pipeline (no weather detector exists; see sceneMeasurementEnvironmentAnalyzer.ts). Declared nullable rather than omitted, so the field is visibly present-but-unknown.',
  },
  {
    name: 'weather_confidence',
    kind: 'number',
    required: true,
    nullable: true,
    provenance_component: 'weather_provenance',
    description: 'Confidence for weather_guess; unconditionally null alongside it.',
  },
  {
    name: 'weather_provenance',
    kind: 'string',
    required: true,
    nullable: false,
    provenance_component: null,
    description: 'Provenance tag ("inferred") for weather_guess/weather_confidence.',
  },
]);

export const SCENE_TRUTH_CHANNEL_SCHEMAS: Readonly<Record<SceneTruthChannelId, readonly SceneTruthConditioningComponentSchema[]>> =
  Object.freeze({
    lighting_condition_field: LIGHTING_CONDITION_FIELD_SCHEMA,
    environment_condition_field: ENVIRONMENT_CONDITION_FIELD_SCHEMA,
  });

// ============================================================
// Real validator -- unknown(null) != missing/error
// ============================================================

export type ComponentValidationOutcome = 'valid' | 'missing' | 'null_not_allowed' | 'type_mismatch';

export interface ComponentValidationResult {
  name: string;
  outcome: ComponentValidationOutcome;
}

function valueMatchesKind(kind: ComponentValueKind, value: unknown): boolean {
  switch (kind) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    case 'number_array':
      return Array.isArray(value) && value.every((v) => typeof v === 'number');
    case 'string_array':
      return Array.isArray(value) && value.every((v) => typeof v === 'string');
  }
}

/**
 * DSC's first real (not declarative-string) validator. See file header for
 * the missing/null/type_mismatch distinction this implements.
 */
export function validateComponentsAgainstSchema(
  schema: readonly SceneTruthConditioningComponentSchema[],
  values: Readonly<Record<string, unknown>>
): { valid: boolean; results: readonly ComponentValidationResult[] } {
  const results: ComponentValidationResult[] = [];
  for (const field of schema) {
    if (!(field.name in values)) {
      results.push({ name: field.name, outcome: 'missing' });
      continue;
    }
    const value = values[field.name];
    if (value === null) {
      results.push({ name: field.name, outcome: field.nullable ? 'valid' : 'null_not_allowed' });
      continue;
    }
    results.push({ name: field.name, outcome: valueMatchesKind(field.kind, value) ? 'valid' : 'type_mismatch' });
  }
  return { valid: results.every((r) => r.outcome === 'valid'), results: Object.freeze(results) };
}

// ============================================================
// Real Scene-Truth-derived component values, provenance preserved
// ============================================================

export function buildLightingConditionComponentsFromSceneTruth(sceneTruth: SceneTruth): Record<string, unknown> {
  const measured = sceneTruth.lighting.measured;
  const interpreted = sceneTruth.lighting.interpreted;
  return {
    luminance_mean: measured.value.luminance.mean,
    luminance_stddev: measured.value.luminance.stdDev,
    luminance_provenance: measured.provenance,
    light_direction_guess: interpreted.lightDirection.value.guess,
    light_direction_confidence: interpreted.lightDirection.confidence,
    light_direction_provenance: interpreted.lightDirection.provenance,
  };
}

export function buildEnvironmentConditionComponentsFromSceneTruth(sceneTruth: SceneTruth): Record<string, unknown> {
  const interpreted = sceneTruth.environment.interpreted;
  return {
    indoor_outdoor_guess: interpreted.indoorOutdoor.value.guess,
    indoor_outdoor_confidence: interpreted.indoorOutdoor.confidence,
    indoor_outdoor_provenance: interpreted.indoorOutdoor.provenance,
    weather_guess: interpreted.weather.value.guess,
    weather_confidence: interpreted.weather.confidence,
    weather_provenance: interpreted.weather.provenance,
  };
}

// ============================================================
// Character / Style: the one swappable boundary
// ============================================================

export type ConditioningLockState = 'locked' | 'swappable';

export interface ConditioningSwapBoundaryEntry {
  domain: string;
  lock: ConditioningLockState;
  source: string;
}

export const CONDITIONING_SWAP_BOUNDARY: readonly ConditioningSwapBoundaryEntry[] = Object.freeze([
  { domain: 'camera_pose', lock: 'locked', source: 'directSpatialConditioningFoundationBuilder.ts:camera_pose_field' },
  { domain: 'camera_temporal', lock: 'locked', source: 'directSpatialConditioningFoundationBuilder.ts:camera_temporal_track' },
  { domain: 'pose', lock: 'locked', source: 'directSpatialConditioningFoundationBuilder.ts:subject_position_field' },
  { domain: 'spatial_framing', lock: 'locked', source: 'directSpatialConditioningFoundationBuilder.ts:framing_composition_map' },
  { domain: 'spatial_edit_rhythm', lock: 'locked', source: 'directSpatialConditioningFoundationBuilder.ts:edit_rhythm_boundaries' },
  { domain: 'spatial_scene_energy', lock: 'locked', source: 'directSpatialConditioningFoundationBuilder.ts:scene_energy_field' },
  { domain: 'lighting', lock: 'locked', source: 'directSpatialConditioningSceneTruthCompatibility.ts:lighting_condition_field' },
  { domain: 'environment', lock: 'locked', source: 'directSpatialConditioningSceneTruthCompatibility.ts:environment_condition_field' },
  { domain: 'character', lock: 'swappable', source: 'services/movieCharacterDNALock.ts' },
  { domain: 'style', lock: 'swappable', source: 'services/movieArtstyleLockValidation.ts' },
]);

export function assertOnlyCharacterAndStyleSwappable(): { valid: boolean; issues: readonly string[] } {
  const issues: string[] = [];
  const swappable = CONDITIONING_SWAP_BOUNDARY.filter((e) => e.lock === 'swappable').map((e) => e.domain);
  if (swappable.length !== 2 || !swappable.includes('character') || !swappable.includes('style')) {
    issues.push(`expected exactly ['character','style'] swappable, found: ${swappable.join(', ') || '(none)'}`);
  }
  const locked = CONDITIONING_SWAP_BOUNDARY.filter((e) => e.lock === 'locked');
  if (locked.some((e) => e.domain === 'character' || e.domain === 'style')) {
    issues.push('character or style appears in a locked entry -- boundary is not exclusive');
  }
  return { valid: issues.length === 0, issues: Object.freeze(issues) };
}

// ============================================================
// Verdict: DSC_SCENE_TRUTH_COMPATIBLE / REAL_GAP
// ============================================================

export interface DscSceneTruthCompatibilityCheck {
  channel_id: SceneTruthChannelId;
  validation: { valid: boolean; results: readonly ComponentValidationResult[] };
  real_null_fields: readonly string[];
}

export interface DscSceneTruthCompatibilityReadiness {
  verdict: 'DSC_SCENE_TRUTH_COMPATIBLE' | 'REAL_GAP';
  reason: string;
}

export function assessDscSceneTruthCompatibility(
  checks: readonly DscSceneTruthCompatibilityCheck[],
  swapBoundary: { valid: boolean; issues: readonly string[] },
  existingSixChannelsRegressionPassed: boolean
): DscSceneTruthCompatibilityReadiness {
  if (!existingSixChannelsRegressionPassed) {
    return { verdict: 'REAL_GAP', reason: 'the original six DSC channels no longer pass their own unmodified verify scripts -- compatibility broken' };
  }
  if (checks.length === 0) {
    return { verdict: 'REAL_GAP', reason: 'no channel was validated against real Scene Truth data' };
  }
  const invalidChannel = checks.find((c) => !c.validation.valid);
  if (invalidChannel) {
    const failing = invalidChannel.validation.results.filter((r) => r.outcome !== 'valid');
    return {
      verdict: 'REAL_GAP',
      reason: `channel ${invalidChannel.channel_id} failed real validation: ${failing.map((f) => `${f.name}=${f.outcome}`).join(', ')}`,
    };
  }
  if (!swapBoundary.valid) {
    return { verdict: 'REAL_GAP', reason: `Character/Style swap boundary is not exclusive: ${swapBoundary.issues.join('; ')}` };
  }
  const anyRealNull = checks.some((c) => c.real_null_fields.length > 0);
  if (!anyRealNull) {
    return {
      verdict: 'REAL_GAP',
      reason: 'every channel validated, but no real null value was observed anywhere -- the null-vs-missing distinction was never actually exercised against real data',
    };
  }
  return {
    verdict: 'DSC_SCENE_TRUTH_COMPATIBLE',
    reason: `${checks.length} channel(s) validated against real Canonical Scene Truth data, including real null field(s) (${checks.flatMap((c) => c.real_null_fields).join(', ')}) correctly accepted as valid-and-unknown (not missing/error); original six channels unmodified and regression-passing; Character/Style swap boundary exclusive.`,
  };
}
