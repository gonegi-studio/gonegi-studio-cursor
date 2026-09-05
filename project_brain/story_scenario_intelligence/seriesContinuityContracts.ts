/**
 * Series Continuity — Real Data Contracts
 *
 * Implements docs/architecture/SeriesContinuityContract.md (PHASE-057) as real TypeScript
 * code: SeasonCarryoverRecord, CharacterArcRecord, CallbackChain, RelationshipContinuityRecord.
 *
 * Reuse discipline (PHASE-057 §2, enforced here, not re-derived): every structural rollup
 * below calls aggregateEnvelopes/aggregateChildren (storyIntelligenceIntegration.ts, PHASE-049)
 * unchanged — no new aggregation algorithm. Every authoring gate reuses the exact
 * AuthoringGateError / sentinel-collision discipline from storyAuthoringSampleV1.ts (PHASE-054)
 * — no parallel convention. Two-axis separation (structural vs. authored) is enforced the same
 * way as every prior phase: authoring a note never touches structural_resolution.
 *
 * Rule I1: no 'node:fs' import — every real fact comes from the resolver/integration layer.
 * Scope: project_brain/story_scenario_intelligence/ only, per PHASE-058's authorization.
 */

import { createHash } from 'node:crypto';
import type { Envelope } from './sourceResolver.js';
import { aggregateEnvelopes, aggregateChildren, type AggregateResult } from './storyIntelligenceIntegration.js';
import { notDerivable, CONTENT_GAP_REASON, DEREF_GAP_REASON, type CharacterGrowthDeltaRecord } from './storyContracts.js';
import { AuthoringGateError } from './storyAuthoringSampleV1.js';

// ---------------------------------------------------------------------------
// Shared authoring-gate helpers (reused pattern, not reimplemented logic)
// ---------------------------------------------------------------------------

function assertNotSentinelCollision(value: string, fieldLabel: string): void {
  if (value.startsWith('NOT_DERIVABLE:')) {
    throw new AuthoringGateError(`Rule AU3-pattern violation: "${fieldLabel}" collides with the NOT_DERIVABLE sentinel: "${value}"`);
  }
  if (value.trim().length === 0) {
    throw new AuthoringGateError(`Rule AU3-pattern violation: "${fieldLabel}" is empty — not real authored text`);
  }
}

/** Gate: content may only be authored once the given structural result has at least one real (RESOLVED) leaf. */
function authorOnStructural(result: AggregateResult, value: string, fieldLabel: string): string {
  if (result.aggregate_status === 'NOT_DERIVABLE') {
    throw new AuthoringGateError(`Cannot author "${fieldLabel}" — structural_resolution is NOT_DERIVABLE (nothing real to write about)`);
  }
  assertNotSentinelCollision(value, fieldLabel);
  return value;
}

// ---------------------------------------------------------------------------
// CharacterArcRecord (PHASE-057 §4)
// ---------------------------------------------------------------------------

export interface CharacterArcRecord {
  character_id: string;
  span: { from_episode_id: string; to_episode_id: string };
  growth_deltas: CharacterGrowthDeltaRecord[]; // real, unmodified atomic units — reused, not duplicated (Rule CA1)
  structural_resolution: AggregateResult; // computed by aggregateEnvelopes over every delta's entry+exit envelopes
  authored_series_arc_note: string; // Rule CA2 — the one authored field
}

export function buildCharacterArcRecord(
  character_id: string,
  from_episode_id: string,
  to_episode_id: string,
  growth_deltas: CharacterGrowthDeltaRecord[]
): CharacterArcRecord {
  const leaves = growth_deltas.flatMap((d, i) => [
    { label: `growth_deltas[${i}].entry_state_ref`, envelope: d.entry_state_ref.resolution },
    { label: `growth_deltas[${i}].exit_state_ref`, envelope: d.exit_state_ref.resolution },
  ]);
  const structural_resolution = aggregateEnvelopes(leaves);
  return {
    character_id,
    span: { from_episode_id, to_episode_id },
    growth_deltas,
    structural_resolution,
    authored_series_arc_note: notDerivable(CONTENT_GAP_REASON),
  };
}

/** Rule CA2: authored once structural_resolution has at least one real delta. Returns a new record (immutable). */
export function authorCharacterArcNote(arc: CharacterArcRecord, note: string): CharacterArcRecord {
  const authored_series_arc_note = authorOnStructural(arc.structural_resolution, note, 'authored_series_arc_note');
  return { ...arc, authored_series_arc_note };
}

// ---------------------------------------------------------------------------
// CallbackChain (PHASE-057 §5)
// ---------------------------------------------------------------------------

export type CallbackLegRole = 'plant' | 'reference' | 'payoff';

export interface CallbackChainLeg {
  movie_id: string;
  scene_id: string;
  semantic_anchor_id: string;
  resolution: Envelope; // real resolveScene(...) result
  role: CallbackLegRole;
}

export interface CallbackChain {
  chain_id: string;
  callback_type: string; // same constrained vocabulary as Rule AU10, unchanged
  legs: CallbackChainLeg[]; // N >= 2, first=plant, last=payoff, middle=reference (Rule CB1)
  structural_resolution: AggregateResult; // aggregateEnvelopes over legs[].resolution
  narrative_significance: string; // Rule CB2 — one authored field for the whole chain
}

export function buildCallbackChain(chain_id: string, callback_type: string, legs: CallbackChainLeg[]): CallbackChain {
  if (legs.length < 2) {
    throw new AuthoringGateError(`CallbackChain "${chain_id}" needs at least 2 legs (plant + payoff); got ${legs.length}`);
  }
  if (legs[0].role !== 'plant' || legs[legs.length - 1].role !== 'payoff') {
    throw new AuthoringGateError(`CallbackChain "${chain_id}" must start with a "plant" leg and end with a "payoff" leg`);
  }
  const leaves = legs.map((leg, i) => ({ label: `legs[${i}](${leg.role}):${leg.scene_id}`, envelope: leg.resolution }));
  const structural_resolution = aggregateEnvelopes(leaves);
  return { chain_id, callback_type, legs, structural_resolution, narrative_significance: notDerivable(CONTENT_GAP_REASON) };
}

/** Rule CB2: narrative_significance is authored independently of whether every leg resolved. */
export function authorCallbackChainSignificance(chain: CallbackChain, significance: string): CallbackChain {
  const narrative_significance = authorOnStructural(chain.structural_resolution, significance, 'narrative_significance');
  return { ...chain, narrative_significance };
}

// ---------------------------------------------------------------------------
// RelationshipContinuityRecord (PHASE-057 §6)
// ---------------------------------------------------------------------------

export interface RelationshipSupportingScene {
  scene_id: string;
  resolution: Envelope; // real resolveScene(...) result
}

export interface RelationshipContinuityRecord {
  character_ids: [string, string];
  span: { from_episode_id: string; to_episode_id: string };
  relationship_stage_from: string; // authored
  relationship_stage_to: string; // authored
  supporting_scene_refs: RelationshipSupportingScene[]; // real pointers (Rule RC1)
  structural_resolution: AggregateResult; // aggregateEnvelopes over supporting_scene_refs[].resolution
  authored_relationship_note: string; // authored
}

export function buildRelationshipContinuityRecord(
  character_ids: [string, string],
  from_episode_id: string,
  to_episode_id: string,
  supporting_scene_refs: RelationshipSupportingScene[]
): RelationshipContinuityRecord {
  const leaves = supporting_scene_refs.map((s, i) => ({ label: `supporting_scene_refs[${i}]:${s.scene_id}`, envelope: s.resolution }));
  const structural_resolution = aggregateEnvelopes(leaves);
  return {
    character_ids,
    span: { from_episode_id, to_episode_id },
    relationship_stage_from: notDerivable(CONTENT_GAP_REASON),
    relationship_stage_to: notDerivable(CONTENT_GAP_REASON),
    supporting_scene_refs,
    structural_resolution,
    authored_relationship_note: notDerivable(CONTENT_GAP_REASON),
  };
}

export function authorRelationshipStages(
  rec: RelationshipContinuityRecord,
  from: string,
  to: string,
  note: string
): RelationshipContinuityRecord {
  const relationship_stage_from = authorOnStructural(rec.structural_resolution, from, 'relationship_stage_from');
  const relationship_stage_to = authorOnStructural(rec.structural_resolution, to, 'relationship_stage_to');
  const authored_relationship_note = authorOnStructural(rec.structural_resolution, note, 'authored_relationship_note');
  return { ...rec, relationship_stage_from, relationship_stage_to, authored_relationship_note };
}

// ---------------------------------------------------------------------------
// SeasonCarryoverRecord (PHASE-057 §3)
// ---------------------------------------------------------------------------

export interface SeasonCarryoverSeriesAnchor {
  identity_signature: string; // NOT_DERIVABLE — dereferencing/signature-computation gap, out of scope (PHASE-057 §7)
  location_signature: string; // NOT_DERIVABLE — same
  series_memory_signature: string; // NOT_DERIVABLE — same
  growth_score: string; // NOT_DERIVABLE — Rule SC3, numeric dereferencing gap
  relationship_stage: string; // authored — Rule SC3
}

export interface SeasonCarryoverChecks {
  season_to_season_consistency: string; // authored ("PASS"-style judgment) or NOT_EVALUATED sentinel — Rule SC2
  character_growth_carryover: string;
  relationship_carryover: string;
  world_state_carryover: string; // permanently NOT_DERIVABLE — Rule SC4, never authored
  series_arc_continuity: string;
}

export interface SeasonCarryoverRecord {
  from_season_scenario_id: string;
  to_season_scenario_id: string;
  from_resolution: AggregateResult; // real, from resolveSeasonScenario — Rule SC1 gate source
  to_resolution: AggregateResult;
  series_anchor: SeasonCarryoverSeriesAnchor;
  carryover_checks: SeasonCarryoverChecks;
  character_growth_carryover_detail: CharacterArcRecord[]; // pointers only, reused unchanged
  callback_chains_spanning_seasons: CallbackChain[]; // pointers only, reused unchanged
}

export const NOT_EVALUATED = 'NOT_EVALUATED: no author judgment recorded yet';

export function buildSeasonCarryoverRecord(
  from_season_scenario_id: string,
  from_resolution: AggregateResult,
  to_season_scenario_id: string,
  to_resolution: AggregateResult,
  character_growth_carryover_detail: CharacterArcRecord[] = [],
  callback_chains_spanning_seasons: CallbackChain[] = []
): SeasonCarryoverRecord {
  // Rule SC1: both seasons must already be real, resolved pointers.
  if (from_resolution.aggregate_status !== 'RESOLVED' || to_resolution.aggregate_status !== 'RESOLVED') {
    throw new AuthoringGateError(
      `SeasonCarryoverRecord requires both seasons to be fully RESOLVED (Rule SC1); got from=${from_resolution.aggregate_status}, to=${to_resolution.aggregate_status}`
    );
  }
  return {
    from_season_scenario_id,
    to_season_scenario_id,
    from_resolution,
    to_resolution,
    series_anchor: {
      identity_signature: notDerivable(DEREF_GAP_REASON),
      location_signature: notDerivable(DEREF_GAP_REASON),
      series_memory_signature: notDerivable(DEREF_GAP_REASON),
      growth_score: notDerivable(DEREF_GAP_REASON),
      relationship_stage: notDerivable(CONTENT_GAP_REASON),
    },
    carryover_checks: {
      season_to_season_consistency: NOT_EVALUATED,
      character_growth_carryover: NOT_EVALUATED,
      relationship_carryover: NOT_EVALUATED,
      world_state_carryover: notDerivable('world_state_carryover is permanently out of scope — blocked on WorldIdentityIndex (PHASE-037 GAP 1 / PHASE-057 §7), never an authoring surface (Rule SC4)'),
      series_arc_continuity: NOT_EVALUATED,
    },
    character_growth_carryover_detail,
    callback_chains_spanning_seasons,
  };
}

/** Rule SC2: carryover_checks (except world_state_carryover, Rule SC4) are authored, gated on Rule SC1 having already held at construction time. */
export function authorCarryoverCheck(
  record: SeasonCarryoverRecord,
  field: 'season_to_season_consistency' | 'character_growth_carryover' | 'relationship_carryover' | 'series_arc_continuity',
  value: string
): SeasonCarryoverRecord {
  assertNotSentinelCollision(value, field);
  if (value.startsWith('NOT_EVALUATED')) {
    throw new AuthoringGateError(`"${field}" value must not itself be the NOT_EVALUATED sentinel — that is the default, not an authored value`);
  }
  return { ...record, carryover_checks: { ...record.carryover_checks, [field]: value } };
}

/** Rule SC3: relationship_stage on the series anchor is authored; the three signature fields and growth_score are not (they stay NOT_DERIVABLE forever, per §7). */
export function authorSeriesAnchorRelationshipStage(record: SeasonCarryoverRecord, stage: string): SeasonCarryoverRecord {
  assertNotSentinelCollision(stage, 'series_anchor.relationship_stage');
  return { ...record, series_anchor: { ...record.series_anchor, relationship_stage: stage } };
}

/**
 * PHASE-782: implements Rule SC3's own computation rule for growth_score -- "averaging real
 * numeric values the resolver can't dereference yet" -- now that PHASE-780/782's dereferencing
 * capability exists. This function stays pure (Rule I1: no resolver calls here) -- the caller
 * (storyPersistence.ts, which already imports the resolver) does the actual dereferencing and
 * passes in only the real numeric values it successfully found. If none were found, this
 * function never invents a number -- it records the SPECIFIC reason the caller supplies (e.g.
 * a scene-namespace mismatch), never falling back to the old generic DEREF_GAP_REASON text,
 * so a future reader can tell "dereferencing is unbuilt" apart from "dereferencing works, but
 * this record's own real data doesn't align."
 */
export function authorSeriesAnchorGrowthScore(
  record: SeasonCarryoverRecord,
  realValues: number[],
  emptyReason: string
): SeasonCarryoverRecord {
  const growth_score = realValues.length > 0
    ? String(realValues.reduce((a, b) => a + b, 0) / realValues.length)
    : notDerivable(emptyReason);
  return { ...record, series_anchor: { ...record.series_anchor, growth_score } };
}

/**
 * PHASE-786: implements PHASE-785's design (docs/architecture/SeriesAnchorIdentitySignatureDesign.md)
 * exactly — Rule ID2 (hash inputs: from/to_season_scenario_id, from/to_movie_id, character_ids),
 * Rule ID4 (sha256 via node:crypto, fixed serialization order, first 12 hex chars of the digest).
 * Stays pure (Rule I1: no resolver calls in this file) — the caller (storyPersistence.ts, which
 * already imports the resolver) reads the record's own dependency_ledger, dereferences each
 * referenced CharacterArc's real content.character_id, canonicalizes via sourceResolver.ts's own
 * canonicalCharacterId (Rule ID3c), and passes in either a fully-resolved `inputs` object or
 * `null`. When `inputs` is null (Rule ID3b — no real, already-persisted character-arc reference
 * exists to ground character_ids), this function never invents a signature — it records the
 * caller-supplied SPECIFIC reason via notDerivable(), mirroring authorSeriesAnchorGrowthScore's
 * own established discipline (PHASE-782).
 */
export interface IdentitySignatureInputs {
  from_season_scenario_id: string;
  to_season_scenario_id: string;
  from_movie_id: string;
  to_movie_id: string;
  character_ids: string[]; // caller-supplied, already deduplicated/canonicalized/sorted (Rule ID3c)
}

/**
 * Rule ID4b/LS5: shared fixed-order-tuple serialization + sha256 truncation — reused unchanged
 * by both authorSeriesAnchorIdentitySignature (PHASE-786) and authorSeriesAnchorLocationSignature
 * (PHASE-789, docs/architecture/SeriesAnchorLocationSignatureDesign.md Rule LS5). Never relies on
 * object-key order or JSON.stringify's default behavior on an unordered object — `parts` is
 * always an array, whose element order is never ambiguous.
 */
function computeFixedOrderSha256(parts: unknown[]): string {
  // Rule ID4c/LS5: first 12 hex characters of the full sha256 hex digest.
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 12);
}

function computeIdentitySignature(inputs: IdentitySignatureInputs): string {
  return computeFixedOrderSha256([
    inputs.from_season_scenario_id,
    inputs.to_season_scenario_id,
    inputs.from_movie_id,
    inputs.to_movie_id,
    inputs.character_ids,
  ]);
}

export function authorSeriesAnchorIdentitySignature(
  record: SeasonCarryoverRecord,
  inputs: IdentitySignatureInputs | null,
  emptyReason: string
): SeasonCarryoverRecord {
  const identity_signature = inputs !== null ? computeIdentitySignature(inputs) : notDerivable(emptyReason);
  return { ...record, series_anchor: { ...record.series_anchor, identity_signature } };
}

/**
 * PHASE-789: implements PHASE-788's design (docs/architecture/SeriesAnchorLocationSignatureDesign.md)
 * exactly — Rule LS2 (hash inputs: from/to_season_scenario_id, from/to_movie_id, location_ids),
 * Rule LS5 (sha256 via the shared computeFixedOrderSha256 helper, identical pattern to
 * identity_signature). Stays pure (Rule I1: no resolver calls in this file, no node:fs) — the
 * caller (storyPersistence.ts) does the actual dependency-ledger read, scene resolution, and
 * dereferenceSceneLocationId dereferencing, and passes in either a fully-resolved `inputs` object
 * or `null`. When `inputs` is null (Rule LS4a/LS4b — no real character-arc reference to ground
 * location_ids, or real scenes resolved but none carry a real target_location_id), this function
 * never invents a signature — it records the caller-supplied SPECIFIC reason via notDerivable(),
 * mirroring authorSeriesAnchorIdentitySignature's own established discipline (PHASE-786). This
 * function never touches gonegi_translation.target_world_identity or calls resolveWorldIdentity
 * — it has no resolver import at all (Rule I1), and its only input is the caller-supplied,
 * already-narrowed `location_ids: string[]` (Rule LS6).
 */
export interface LocationSignatureInputs {
  from_season_scenario_id: string;
  to_season_scenario_id: string;
  from_movie_id: string;
  to_movie_id: string;
  location_ids: string[]; // caller-supplied, already deduplicated/sorted (Rule LS3e)
}

function computeLocationSignature(inputs: LocationSignatureInputs): string {
  return computeFixedOrderSha256([
    inputs.from_season_scenario_id,
    inputs.to_season_scenario_id,
    inputs.from_movie_id,
    inputs.to_movie_id,
    inputs.location_ids,
  ]);
}

export function authorSeriesAnchorLocationSignature(
  record: SeasonCarryoverRecord,
  inputs: LocationSignatureInputs | null,
  emptyReason: string
): SeasonCarryoverRecord {
  const location_signature = inputs !== null ? computeLocationSignature(inputs) : notDerivable(emptyReason);
  return { ...record, series_anchor: { ...record.series_anchor, location_signature } };
}
