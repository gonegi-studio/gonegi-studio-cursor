/**
 * Story Intelligence — Resolver Integration Layer
 *
 * Implements the design frozen in docs/architecture/StoryIntelligenceResolverIntegration.md
 * (PHASE-048): the seam between the real, tested resolver (sourceResolver.ts, PHASE-044–047)
 * and the still-unimplemented Story/Season/Episode contracts (PHASE-037).
 *
 * Rule I1 (PHASE-048 §2): this module NEVER reads datasets/ or the registry directly — it has
 * no 'node:fs' import at all. Every fact it produces comes from calling sourceResolver.ts's
 * already-allowlisted, already-existence-checked public functions. This is a structural
 * guarantee, not just a comment: grep this file for 'node:fs' and it will not be found.
 *
 * Scope: project_brain/story_scenario_intelligence/ only, per PHASE-049's explicit
 * authorization ("범위: project_brain/story_scenario_intelligence/ 내부만").
 */

import {
  resolveScene,
  resolveShot,
  resolveCharacterGrowthField,
  resolveWorldIdentity,
  type Envelope,
} from './sourceResolver.js';

export type AggregateStatus = 'RESOLVED' | 'PARTIAL' | 'NOT_DERIVABLE';

export interface ProvenanceLedgerEntry {
  registry_ref: string;
  registry_generated_at: string;
  movie_id: string;
  movie_entry_found: boolean;
  movie_entry_verified_by_phase: string[];
}

export interface KnownGap {
  field: string;
  reason: string;
  excluded_from_aggregate_status: true;
}

export interface LeafFailure {
  label: string;
  reason: string | null;
}

export interface AggregateResult {
  aggregate_status: AggregateStatus;
  resolved_count: number;
  total_count: number;
  provenance_ledger: ProvenanceLedgerEntry[];
  known_gaps: KnownGap[];
  leaf_failures: LeafFailure[];
  /**
   * Rule AG3 (PHASE-048 §4, specified but left unimplemented through PHASE-081 — see
   * docs/architecture/StoryIntelligenceResolverIntegration.md's own §"Rule AG3" section for the
   * original spec this implements verbatim, PHASE-704): a leaf explicitly marked `optional`
   * (distinct from Rule AG2's `known_gap`, which is reserved for structurally-impossible tiers
   * like world_identity) is excluded from resolved_count/total_count exactly like a known_gap
   * leaf, but — per the original spec's own wording — its failure is recorded here, in
   * `warnings`, never in `known_gaps` or `leaf_failures`. A leaf that is both optional AND
   * currently resolves fine produces no entry anywhere; only a FAILING optional leaf is visible,
   * as a warning, never a downgrade of aggregate_status.
   */
  warnings: LeafFailure[];
}

interface LeafInput {
  label: string;
  envelope: Envelope;
  /** Rule AG2 (PHASE-048 §4): excluded from the required resolved/total tally. */
  known_gap?: boolean;
  /** Rule AG3 (PHASE-048 §4, implemented PHASE-704): excluded from the required tally, same as
   * known_gap, but a failure is reported via `warnings`, not `known_gaps` — a legitimately
   * optional leaf (e.g. a pure establishing/transition Episode's absent character_growth beat)
   * is not the same kind of gap as a structurally-blocked tier. Mutually exclusive with
   * known_gap in practice (nothing sets both), but not enforced as exclusive here — a leaf
   * marked both is simply treated as a known_gap (known_gap is checked first in aggregateEnvelopes). */
  optional?: boolean;
}

function movieIdOf(envelope: Envelope): string {
  return String((envelope.requested as Record<string, unknown>).movie_id ?? 'unknown_movie');
}

/**
 * Rule AG1/AG2 (PHASE-048 §4) — the core three-way aggregation over a flat list of resolver
 * envelopes. Pure function: same inputs always produce the same output, no I/O.
 */
export function aggregateEnvelopes(leaves: LeafInput[]): AggregateResult {
  const gaps = leaves.filter((l) => l.known_gap);
  // Rule AG3: optional leaves are excluded from the required tally the same way known_gap
  // leaves are — checked after known_gap so a leaf marked both lands in `gaps`, not here.
  const optionals = leaves.filter((l) => l.optional && !l.known_gap);
  const required = leaves.filter((l) => !l.known_gap && !l.optional);

  const resolvedCount = required.filter((l) => l.envelope.status === 'RESOLVED').length;
  const totalCount = required.length;

  let status: AggregateStatus;
  if (totalCount === 0) {
    status = 'NOT_DERIVABLE'; // nothing required was even attempted — fail closed, not a silent RESOLVED
  } else if (resolvedCount === totalCount) {
    status = 'RESOLVED';
  } else if (resolvedCount === 0) {
    status = 'NOT_DERIVABLE';
  } else {
    status = 'PARTIAL';
  }

  // Rule PV5: dedup provenance by movie_id, not by call.
  const provenanceMap = new Map<string, ProvenanceLedgerEntry>();
  for (const l of leaves) {
    const movieId = movieIdOf(l.envelope);
    if (!provenanceMap.has(movieId)) {
      const tg = l.envelope.trust_gate;
      provenanceMap.set(movieId, {
        registry_ref: tg.registry_ref,
        registry_generated_at: tg.registry_generated_at,
        movie_id: movieId,
        movie_entry_found: tg.movie_entry_found,
        movie_entry_verified_by_phase: tg.movie_entry_verified_by_phase,
      });
    }
  }

  // Rule PV6: known_gaps vs leaf_failures are kept structurally separate.
  const known_gaps: KnownGap[] = gaps
    .filter((l) => l.envelope.status === 'NOT_DERIVABLE')
    .map((l) => ({ field: l.label, reason: l.envelope.reason ?? 'unknown', excluded_from_aggregate_status: true as const }));

  const leaf_failures: LeafFailure[] = required
    .filter((l) => l.envelope.status === 'NOT_DERIVABLE')
    .map((l) => ({ label: l.label, reason: l.envelope.reason }));

  // Rule AG3: a failing optional leaf is a warning, never a known_gap or a leaf_failure, and
  // never affects resolved_count/total_count/aggregate_status (already excluded above).
  const warnings: LeafFailure[] = optionals
    .filter((l) => l.envelope.status !== 'RESOLVED')
    .map((l) => ({ label: l.label, reason: l.envelope.reason }));

  return {
    aggregate_status: status,
    resolved_count: resolvedCount,
    total_count: totalCount,
    provenance_ledger: [...provenanceMap.values()],
    known_gaps,
    leaf_failures,
    warnings,
  };
}

/**
 * Rule AG1, one tier up: aggregates already-computed child AggregateResults (e.g. Episodes
 * rolling up into a Season) rather than raw envelopes. A child whose own aggregate_status is
 * not RESOLVED contributes a leaf_failure noting that, in addition to bubbling up its own
 * known_gaps/leaf_failures (namespaced under the child's label so provenance stays traceable).
 */
export function aggregateChildren(children: { label: string; result: AggregateResult }[]): AggregateResult {
  const total = children.length;
  const resolved = children.filter((c) => c.result.aggregate_status === 'RESOLVED').length;

  let status: AggregateStatus;
  if (total === 0) status = 'NOT_DERIVABLE';
  else if (resolved === total) status = 'RESOLVED';
  else if (resolved === 0) status = 'NOT_DERIVABLE';
  else status = 'PARTIAL';

  const provenanceMap = new Map<string, ProvenanceLedgerEntry>();
  const known_gaps: KnownGap[] = [];
  const leaf_failures: LeafFailure[] = [];
  const warnings: LeafFailure[] = [];

  for (const c of children) {
    for (const p of c.result.provenance_ledger) {
      if (!provenanceMap.has(p.movie_id)) provenanceMap.set(p.movie_id, p);
    }
    for (const g of c.result.known_gaps) {
      known_gaps.push({ ...g, field: `${c.label}.${g.field}` });
    }
    for (const f of c.result.leaf_failures) {
      leaf_failures.push({ label: `${c.label}.${f.label}`, reason: f.reason });
    }
    // Rule AG3: a child's warnings bubble up namespaced the same way known_gaps/leaf_failures
    // do — never promoted into leaf_failures, never affecting this level's own aggregate_status.
    for (const w of c.result.warnings) {
      warnings.push({ label: `${c.label}.${w.label}`, reason: w.reason });
    }
    if (c.result.aggregate_status !== 'RESOLVED') {
      leaf_failures.push({ label: `${c.label} (child aggregate)`, reason: `child aggregate_status=${c.result.aggregate_status}` });
    }
  }

  return {
    aggregate_status: status,
    resolved_count: resolved,
    total_count: total,
    provenance_ledger: [...provenanceMap.values()],
    known_gaps,
    leaf_failures,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Story -> Season -> Episode -> Scene -> Shot connection (PHASE-048 §2/§3)
// ---------------------------------------------------------------------------

export interface EpisodeSpec {
  episode_id: string;
  movie_id: string;
  /** Required leaves — an episode with none of these resolved is NOT_DERIVABLE. */
  scene_ids: string[];
  shot_ids?: string[];
  /**
   * Rule AG3 (PHASE-048 §4, implemented PHASE-704): `required` defaults to `true` when omitted
   * — every existing caller in this repo (150+ real episode sessions, all of which predate this
   * field) never passes it and is therefore byte-for-byte unaffected by this addition. Passing
   * `required: false` marks this episode's character_growth leaves optional (Rule AG3): a
   * failure no longer counts toward resolved_count/total_count or drags aggregate_status down
   * to PARTIAL — it is recorded in the result's `warnings` instead. This is exactly the
   * "legitimately-sparse Episode" case docs/architecture/StoryScenarioProductionReadiness.md §3
   * named: a pure establishing/transition episode with no real character-growth beat should not
   * be scored identically to one with a broken pointer.
   */
  character_growth?: { character_id: string; fields: string[]; required?: boolean };
  /** Rule AG2: if true, world_identity is resolved and recorded, but never counted as required. */
  include_world_identity?: boolean;
}

export interface EpisodeResult extends AggregateResult {
  episode_id: string;
}

/** Rule I1: the only way an Episode's data gets touched — every leaf goes through the resolver. */
export function resolveEpisode(spec: EpisodeSpec): EpisodeResult {
  const leaves: LeafInput[] = [];

  for (const sceneId of spec.scene_ids) {
    leaves.push({ label: `scene:${sceneId}`, envelope: resolveScene(spec.movie_id, sceneId) });
  }
  for (const shotId of spec.shot_ids ?? []) {
    leaves.push({ label: `shot:${shotId}`, envelope: resolveShot(spec.movie_id, shotId) });
  }
  if (spec.character_growth) {
    const isOptional = spec.character_growth.required === false; // default true — unset means required, unchanged from before this field existed
    for (const field of spec.character_growth.fields) {
      leaves.push({
        label: `character_growth:${spec.character_growth.character_id}:${field}`,
        envelope: resolveCharacterGrowthField(spec.movie_id, spec.character_growth.character_id, field),
        ...(isOptional ? { optional: true } : {}),
      });
    }
  }
  if (spec.include_world_identity) {
    leaves.push({ label: `world_identity:${spec.movie_id}`, envelope: resolveWorldIdentity(spec.movie_id), known_gap: true });
  }

  return { episode_id: spec.episode_id, ...aggregateEnvelopes(leaves) };
}

export interface SeasonScenarioResult extends AggregateResult {
  season_scenario_id: string;
}

export function resolveSeasonScenario(seasonScenarioId: string, episodes: EpisodeResult[]): SeasonScenarioResult {
  const agg = aggregateChildren(episodes.map((e) => ({ label: e.episode_id, result: e })));
  return { season_scenario_id: seasonScenarioId, ...agg };
}

export interface StoryBibleResult extends AggregateResult {
  story_id: string;
}

export function resolveStoryBible(storyId: string, seasons: SeasonScenarioResult[]): StoryBibleResult {
  const agg = aggregateChildren(seasons.map((s) => ({ label: s.season_scenario_id, result: s })));
  return { story_id: storyId, ...agg };
}

// Exposed only for tests.
export const __test__ = { movieIdOf };
