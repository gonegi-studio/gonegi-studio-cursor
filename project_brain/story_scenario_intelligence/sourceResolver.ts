/**
 * Story/Scenario Intelligence — Trusted Source Resolver
 *
 * Implements the frozen contract in docs/architecture/StoryScenarioResolverFinalContract.md
 * (PHASE-043), which supersedes docs/architecture/StoryScenarioSourceResolver.md (PHASE-041)
 * wherever the two differ. Validated by docs/architecture/StoryScenarioResolverValidation.md
 * (PHASE-042) and docs/architecture/StoryScenarioResolverRealDataValidation.md (PHASE-045).
 *
 * PHASE-046 addendum: resolveScene/resolveShot now verify the requested scene_id/shot_id
 * actually appears in the target movie_reconstruction registry's own array, in addition to
 * matching a known namespace *pattern*. PHASE-045 found that namespace-pattern matching alone
 * let a syntactically plausible but nonexistent scene_id resolve as if real — see
 * docs/architecture/StoryScenarioResolverExistenceValidation.md for the fix and its tests.
 * READY/PARTIAL/NOT_READY tier logic (PHASE-043 §6) is unchanged by this addendum.
 *
 * PHASE-078 addendum: resolveCharacterGrowthField now verifies the requested character_id
 * actually appears in the target character_growth_source registry, closing the PHASE-077 §4
 * finding that the PHASE-046 existence check was never applied to characters — a fake
 * character_id was resolving RESOLVED identically to a real one, at every tier. See
 * docs/architecture/CharacterGrowthExistenceValidation.md for the fix and its tests.
 * READY/PARTIAL/NOT_READY tier logic and the Envelope/TrustGate shape are unchanged by this
 * addendum too — the check only ever narrows an existing RESOLVED path to NOT_DERIVABLE,
 * exactly as PHASE-046's did for scenes/shots.
 *
 * PHASE-699 addendum: resolveWorldIdentity is no longer an unconditional stub. PHASE-037/043's
 * premise ("no source exists") is stale — PHASE-698/699 traced a real, terminal, non-placeholder
 * content chain (datasets/world_translation/gonegi-world-translation-contract.json + its
 * gonegi-master-world-translation-v1.json) for the "GONEGI_MEDITERRANEAN" world_id, and built
 * datasets/story/world-identity-index-v1.json (allowlisted root, per Rule S1 — the resolver
 * still never reads datasets/world_translation/ directly) recording that verification. A
 * movie_id resolves RESOLVED only if it is explicitly listed in that index's referenced_by[]
 * with resolution_status="CONTENT_RESOLVED" — currently spirited_away and titanic ONLY.
 * checkReadiness('world_identity') deliberately still hard-codes NOT_READY (PHASE-043 §6's own
 * table): it is not on this function's call path and updating it was judged out of this
 * addendum's minimal scope — see PHASE-699's report for the disclosed inconsistency. Every
 * uncovered movie_id (including the 6 still-NOT_READY ones and any unknown movie_id) keeps the
 * exact prior NOT_DERIVABLE behavior and reason string, unchanged.
 *
 * READ-ONLY BY DESIGN:
 *  - Never writes to TRUSTED_SOURCE_REGISTRY.json (Rule PB2 / "Registry 수정 금지").
 *  - Never writes to any datasets/ file — including the movie_reconstruction registries this
 *    addendum now also reads, for the existence check only.
 *  - Contains no call to any AI/generation/network API.
 *  - Every resolvable path is checked against ALLOWLIST_ROOTS before being returned (Rule S1).
 *
 * Scope of this file: created under PHASE-044's explicit authorization
 * ("코드 변경 허용: project_brain/story_scenario_intelligence/ 내부만"), amended under
 * PHASE-046's — it must not be imported by, or moved into, services/ or scripts/ without a
 * new phase authorizing that.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

export const REGISTRY_PATH = join(__dirname, 'TRUSTED_SOURCE_REGISTRY.json');
export const REGISTRY_REPO_RELATIVE = 'project_brain/story_scenario_intelligence/TRUSTED_SOURCE_REGISTRY.json';

// Rule S1 (PHASE-041 §2, reaffirmed PHASE-043 §2): allowlist, not denylist.
export const ALLOWLIST_ROOTS = [
  'datasets/story/',
  'datasets/feature_film/',
  'datasets/movie_reconstruction/',
  REGISTRY_REPO_RELATIVE,
] as const;

// Rule R1/PHASE-040 excluded_sources — kept here too as defense-in-depth, even though
// nothing in this module ever constructs a path from these roots.
export const EXCLUDED_SOURCES = [
  'datasets/movie_factory/movie-dataset-registry.json',
  'datasets/narrative_dna/',
  'services/narrativeProductionV2',
];

export type Tier = 'scene_shot' | 'character_growth' | 'world_identity';
export type Verdict = 'READY' | 'PARTIAL' | 'NOT_READY';

export interface TrustGate {
  registry_ref: string;
  registry_generated_at: string;
  movie_entry_found: boolean;
  movie_entry_verified_by_phase: string[];
}

export interface Envelope {
  status: 'RESOLVED' | 'NOT_DERIVABLE';
  requested: Record<string, unknown>;
  value_ref: { registry_ref: string; field_path: string } | null;
  namespace_used: string | null;
  reason: string | null;
  warnings: string[];
  trust_gate: TrustGate;
  resolved_at: string;
}

// PHASE-043 §3, final form of Rule N2's absent-entry case.
export const ABSENT_MOVIE_REASON =
  'movie_id not present in Trusted Source Registry — treated as NOT_READY per Rule S3.';

let _registryCache: any = null;

function loadRegistry(): any {
  if (_registryCache) return _registryCache;
  if (!existsSync(REGISTRY_PATH)) {
    throw new Error(
      `FATAL: TRUSTED_SOURCE_REGISTRY.json not found at ${REGISTRY_PATH}. ` +
        `Resolver refuses to operate without it (Rule S2) — it never falls back to a live disk scan.`
    );
  }
  const raw = readFileSync(REGISTRY_PATH, 'utf8'); // read-only
  _registryCache = JSON.parse(raw);
  return _registryCache;
}

/**
 * Re-scan/validate the registry file. This is the "먼저 재스캔/검증" step PHASE-044 requires
 * before anything else runs. It re-reads from disk (bypassing the cache) so a caller can
 * confirm the file is still present and still shaped as expected at the start of a session.
 */
export function rescanRegistry(): {
  valid: boolean;
  movieCount: number;
  generatedAt: string;
  excludedSourceCount: number;
  errors: string[];
} {
  _registryCache = null; // force a fresh read, not the module-level cache
  const errors: string[] = [];
  let reg: any;
  try {
    reg = loadRegistry();
  } catch (e: any) {
    return { valid: false, movieCount: 0, generatedAt: '', excludedSourceCount: 0, errors: [e.message] };
  }
  if (!Array.isArray(reg.movies)) errors.push('movies[] missing or not an array');
  if (typeof reg.generated_at !== 'string') errors.push('generated_at missing or not a string');
  if (!Array.isArray(reg.excluded_sources)) errors.push('excluded_sources missing or not an array');
  if (!reg.reference_field_policy) errors.push('reference_field_policy missing');
  return {
    valid: errors.length === 0,
    movieCount: Array.isArray(reg.movies) ? reg.movies.length : 0,
    generatedAt: reg.generated_at ?? '',
    excludedSourceCount: Array.isArray(reg.excluded_sources) ? reg.excluded_sources.length : 0,
    errors,
  };
}

function findMovie(movieId: string): any | undefined {
  const reg = loadRegistry();
  return (reg.movies as any[]).find((m) => m.movie_id === movieId);
}

function assertAllowlisted(path: string): void {
  const excluded = EXCLUDED_SOURCES.some((bad) => path === bad || path.startsWith(bad));
  if (excluded) {
    throw new Error(`EXCLUDED SOURCE (Rule R1): "${path}" is explicitly excluded and may never be read by this resolver.`);
  }
  const ok = ALLOWLIST_ROOTS.some((root) => path === root || path.startsWith(root));
  if (!ok) {
    throw new Error(`ALLOWLIST VIOLATION (Rule S1): "${path}" is not under any allowlisted root.`);
  }
}

// PHASE-046: caches the underlying movie_reconstruction registry files themselves (read-only),
// separate from _registryCache (which only ever holds TRUSTED_SOURCE_REGISTRY.json). Keyed by
// the repo-relative registry_ref string, e.g. "datasets/movie_reconstruction/.../*.json".
const _underlyingRegistryCache = new Map<string, any>();

function loadUnderlyingRegistry(registryRef: string): any {
  assertAllowlisted(registryRef); // Rule S1 — never read anything outside the allowlist, even for this check
  if (_underlyingRegistryCache.has(registryRef)) return _underlyingRegistryCache.get(registryRef);
  const absPath = join(REPO_ROOT, registryRef);
  if (!existsSync(absPath)) {
    // The registry claimed this file exists; if it doesn't, that's a Trusted Source Registry
    // staleness problem (Rule S2's snapshot risk), not a reason to guess — treat as nonexistent.
    _underlyingRegistryCache.set(registryRef, null);
    return null;
  }
  const raw = readFileSync(absPath, 'utf8'); // read-only
  const parsed = JSON.parse(raw);
  _underlyingRegistryCache.set(registryRef, parsed);
  return parsed;
}

/**
 * PHASE-046: does `sceneId` actually appear in the target registry's `scenes[]` array?
 * This is the check PHASE-045 found missing — namespace-pattern matching alone is not
 * existence verification.
 */
function sceneExistsInRegistry(registryRef: string, sceneId: string): boolean {
  const doc = loadUnderlyingRegistry(registryRef);
  if (!doc || !Array.isArray(doc.scenes)) return false;
  return doc.scenes.some((s: any) => s.scene_id === sceneId);
}

/** PHASE-046: does `shotId` actually appear in the target registry's `shots[]` array? */
function shotExistsInRegistry(registryRef: string, shotId: string): boolean {
  const doc = loadUnderlyingRegistry(registryRef);
  if (!doc || !Array.isArray(doc.shots)) return false;
  return doc.shots.some((s: any) => s.shot_id === shotId);
}

/**
 * PHASE-078: does `characterId` actually appear in the target character_growth_source
 * registry? The two real shapes recorded in TRUSTED_SOURCE_REGISTRY.json's own
 * character_growth_source.shape field (already read elsewhere in resolveCharacterGrowthField
 * for its PARTIAL-tier reason message) store the character reference differently:
 *  - "character_state_registry" (e.g. spirited_away): top-level `character_states[]`, each
 *    entry carrying a `character_ids: string[]` array (multiple characters can share one state).
 *  - "subject_motion_registry" (e.g. titanic): top-level `subject_motions[]`, each entry
 *    carrying a single `character_id: string`.
 * An unrecognized shape fails closed — false, never a guess — exactly like PHASE-046's
 * sceneExistsInRegistry/shotExistsInRegistry never assume a shape they haven't been told about.
 */
/**
 * PHASE-757: a minimal, additive, one-directional alias — see docs/architecture/
 * CharacterIdAliasDesign.md (PHASE-756) for the full design rationale. Both real movies' frozen
 * character-growth registries spell this character CHAR-gonagi (600 combined occurrences,
 * PHASE-755's audit) and can never be corrected (Rule "Registry/Resolver/Frozen Brain 변경 없음").
 * This map lets authored_content/ use the studio's actual, correct spelling (CHAR-gonegi) going
 * forward without ever touching datasets/ — canonicalCharacterId() is the ONLY thing this phase
 * adds; every other character_id (including CHAR-gonagi itself, via the `?? characterId`
 * fallback) passes through completely unchanged, so no already-real resolution is affected.
 */
const CHARACTER_ID_ALIASES: Record<string, string> = {
  'CHAR-gonegi': 'CHAR-gonagi',
};

/**
 * PHASE-786: exported (visibility-only change, logic unchanged) so
 * storyPersistence.ts's identity_signature wrapper can reuse this exact, already-proven
 * canonicalization (Rule ID3c, docs/architecture/SeriesAnchorIdentitySignatureDesign.md) rather
 * than reimplementing a parallel alias table.
 */
export function canonicalCharacterId(characterId: string): string {
  return CHARACTER_ID_ALIASES[characterId] ?? characterId;
}

function characterExistsInRegistry(registryRef: string, shape: string | undefined, characterId: string): boolean {
  const doc = loadUnderlyingRegistry(registryRef);
  if (!doc) return false;
  const canonicalId = canonicalCharacterId(characterId);
  if (shape === 'character_state_registry') {
    if (!Array.isArray(doc.character_states)) return false;
    return doc.character_states.some((s: any) => Array.isArray(s.character_ids) && s.character_ids.includes(canonicalId));
  }
  if (shape === 'subject_motion_registry') {
    if (!Array.isArray(doc.subject_motions)) return false;
    return doc.subject_motions.some((s: any) => s.character_id === canonicalId);
  }
  return false; // unrecognized shape — fail closed, per Rule S3's fail-closed discipline applied here
}

function baseTrustGate(movieId: string): TrustGate {
  const reg = loadRegistry();
  const entry = findMovie(movieId);
  return {
    registry_ref: REGISTRY_REPO_RELATIVE,
    registry_generated_at: reg.generated_at,
    movie_entry_found: !!entry,
    movie_entry_verified_by_phase: entry ? entry.verified_by_phase ?? [] : [],
  };
}

function notDerivable(requested: Record<string, unknown>, movieId: string, reason: string): Envelope {
  return {
    status: 'NOT_DERIVABLE',
    requested,
    value_ref: null,
    namespace_used: null,
    reason,
    warnings: [],
    trust_gate: baseTrustGate(movieId),
    resolved_at: new Date().toISOString(),
  };
}

function resolved(
  requested: Record<string, unknown>,
  movieId: string,
  valueRef: { registry_ref: string; field_path: string },
  namespaceUsed: string | null,
  warnings: string[] = []
): Envelope {
  assertAllowlisted(valueRef.registry_ref); // defense-in-depth, Rule S1
  return {
    status: 'RESOLVED',
    requested,
    value_ref: valueRef,
    namespace_used: namespaceUsed,
    reason: null,
    warnings,
    trust_gate: baseTrustGate(movieId),
    resolved_at: new Date().toISOString(),
  };
}

/** checkReadiness — PHASE-043 §6 verdict table, first entry point every other method uses. */
export function checkReadiness(movieId: string, tier: Tier): Verdict {
  if (tier === 'world_identity') return 'NOT_READY'; // §5 — WorldIdentityIndex not materialized
  const entry = findMovie(movieId);
  if (!entry) return 'NOT_READY'; // Rule S3, fail-closed
  const v = tier === 'scene_shot' ? entry.scene_shot_tier : entry.character_growth_tier;
  return (v as Verdict) ?? 'NOT_READY';
}

/** resolveScene — Rules P1 (canonical selection), P2 (non-canonical allowed + flagged). */
export function resolveScene(movieId: string, sceneId: string): Envelope {
  const requested = { movie_id: movieId, tier: 'scene_shot', scene_id: sceneId };
  const entry = findMovie(movieId);
  if (!entry) return notDerivable(requested, movieId, ABSENT_MOVIE_REASON);
  if (entry.scene_shot_tier !== 'READY') {
    return notDerivable(requested, movieId, entry.not_derivable_reason ?? `scene_shot_tier is ${entry.scene_shot_tier} for ${movieId}`);
  }
  const namespaces: any[] = entry.scene_id_namespaces ?? [];
  const canonicalMatches = namespaces.filter((n) => n.canonical_for_new_contracts === true);
  if (canonicalMatches.length !== 1) {
    // Rule P1's ambiguity guard: zero or multiple canonical entries is a registry fault, not a guess.
    return notDerivable(
      requested,
      movieId,
      `ambiguous or missing canonical namespace for ${movieId} (found ${canonicalMatches.length} canonical entries, expected exactly 1)`
    );
  }
  const stripStar = (pattern: string) => pattern.replace(/\*$/, '');
  const matched = namespaces.find((ns) => sceneId.startsWith(stripStar(ns.pattern)));
  if (!matched) {
    return notDerivable(requested, movieId, `scene_id "${sceneId}" does not match any known namespace pattern for ${movieId}`);
  }
  // PHASE-046: namespace-pattern matching only proves sceneId *could* belong to this
  // registry — it does not prove the scene actually exists in it. Check the real array.
  if (!sceneExistsInRegistry(matched.registry_ref, sceneId)) {
    return notDerivable(
      requested,
      movieId,
      `scene_id "${sceneId}" matches the ${matched.pattern} namespace pattern but does not exist in ${matched.registry_ref}'s scenes[] array (PHASE-046 existence check)`
    );
  }
  const warnings: string[] = [];
  if (matched.canonical_for_new_contracts !== true) {
    warnings.push('NON_CANONICAL_NAMESPACE'); // Rule P2
  }
  return resolved(requested, movieId, { registry_ref: matched.registry_ref, field_path: 'scenes[].scene_id' }, matched.pattern, warnings);
}

/** resolveShot — Rule P3 (namespace cross-check between Shot registry and canonical Scene namespace). */
export function resolveShot(movieId: string, shotId: string): Envelope {
  const requested = { movie_id: movieId, tier: 'scene_shot', shot_id: shotId };
  const entry = findMovie(movieId);
  if (!entry) return notDerivable(requested, movieId, ABSENT_MOVIE_REASON);
  if (entry.scene_shot_tier !== 'READY') {
    return notDerivable(requested, movieId, entry.not_derivable_reason ?? `scene_shot_tier is ${entry.scene_shot_tier} for ${movieId}`);
  }
  const shotRegistry = entry.shot_registry;
  if (!shotRegistry) return notDerivable(requested, movieId, `no shot_registry recorded for ${movieId}`);
  // PHASE-046: same existence check as resolveScene, for shots.
  if (!shotExistsInRegistry(shotRegistry.registry_ref, shotId)) {
    return notDerivable(
      requested,
      movieId,
      `shot_id "${shotId}" does not exist in ${shotRegistry.registry_ref}'s shots[] array (PHASE-046 existence check)`
    );
  }
  const canonical = (entry.scene_id_namespaces ?? []).find((n: any) => n.canonical_for_new_contracts === true);
  const warnings: string[] = [];
  if (canonical && shotRegistry.scene_id_namespace_used !== canonical.pattern) {
    warnings.push('NAMESPACE_MISMATCH'); // Rule P3
  }
  return resolved(
    requested,
    movieId,
    { registry_ref: shotRegistry.registry_ref, field_path: 'shots[].shot_id' },
    shotRegistry.scene_id_namespace_used,
    warnings
  );
}

/** resolveCharacterGrowthField — field-level PARTIAL logic, PHASE-043 §6 final table. */
export function resolveCharacterGrowthField(movieId: string, characterId: string, field: string): Envelope {
  const requested = { movie_id: movieId, tier: 'character_growth', character_id: characterId, field };
  const entry = findMovie(movieId);
  if (!entry) return notDerivable(requested, movieId, ABSENT_MOVIE_REASON);
  const tier: Verdict = entry.character_growth_tier ?? 'NOT_READY';

  if (tier === 'NOT_READY') {
    return notDerivable(requested, movieId, entry.not_derivable_reason ?? `character_growth_tier is NOT_READY for ${movieId}`);
  }
  if (tier === 'READY') {
    const src = entry.character_growth_source;
    // PHASE-078: namespace/tier eligibility only proves the FIELD could resolve for this
    // movie — it never proved characterId itself is a real, tracked character. Check the
    // real underlying registry, exactly as PHASE-046 did for scene_id/shot_id.
    if (!characterExistsInRegistry(src.registry_ref, src.shape, characterId)) {
      return notDerivable(
        requested,
        movieId,
        `character_id "${characterId}" does not exist in ${src.registry_ref} (shape: ${src.shape ?? 'unknown'}) (PHASE-078 existence check)`
      );
    }
    return resolved(requested, movieId, { registry_ref: src.registry_ref, field_path: `states[].${field}` }, null);
  }
  // tier === 'PARTIAL'
  const available: string[] = entry.character_growth_fields_available ?? [];
  const notDerivableFields: string[] = entry.character_growth_fields_not_derivable ?? [];
  if (available.includes(field)) {
    const src = entry.character_growth_source;
    // PHASE-078: same existence check as the READY branch above.
    if (!characterExistsInRegistry(src.registry_ref, src.shape, characterId)) {
      return notDerivable(
        requested,
        movieId,
        `character_id "${characterId}" does not exist in ${src.registry_ref} (shape: ${src.shape ?? 'unknown'}) (PHASE-078 existence check)`
      );
    }
    return resolved(requested, movieId, { registry_ref: src.registry_ref, field_path: `states[].${field}` }, null);
  }
  const reason = notDerivableFields.includes(field)
    ? `"${field}" is listed in character_growth_fields_not_derivable for ${movieId} (source shape: ${entry.character_growth_source?.shape ?? 'unknown'})`
    : `"${field}" is not listed in character_growth_fields_available for ${movieId} (PARTIAL tier — unrecognized field)`;
  return notDerivable(requested, movieId, reason);
}

export interface DereferenceResult {
  status: 'DEREFERENCED' | 'NOT_DEREFERENCED';
  value: unknown;
  reason: string | null;
}

function resolveArrayMatches(matches: any[], subField: string, idLabel: string, idValue: unknown): DereferenceResult {
  if (matches.length === 0) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `no entries found for ${idLabel}="${idValue}" — registry may have drifted since resolution` };
  }
  if (matches.length > 1) {
    return {
      status: 'NOT_DEREFERENCED',
      value: null,
      reason: `ambiguous — ${matches.length} entries match ${idLabel}="${idValue}"; this pointer does not carry enough context (e.g. a specific scene) to disambiguate further`,
    };
  }
  return { status: 'DEREFERENCED', value: matches[0][subField], reason: null };
}

/**
 * PHASE-780 — the minimal, additive "generic dereferencing" capability PHASE-779 identified as
 * mostly-already-buildable from existing pieces. Turns an already-RESOLVED Envelope's pointer
 * (registry_ref + field_path) into the real underlying value, by loading the registry
 * (loadUnderlyingRegistry, reused unmodified — no export needed, called from within this same
 * module) and finding the specific array element the pointer refers to.
 *
 * PHASE-779's own finding is honored here: field_path's array-key label ("scenes[]", "shots[]",
 * "states[]") does not always match the registry's own real top-level array property name (e.g.
 * "states[]" is a resolver-side LABEL — the real property is character_states or
 * subject_motions, depending on character_growth_source.shape) — so this function resolves the
 * REAL array + matching strategy per label, the same way resolveScene/resolveShot/
 * characterExistsInRegistry already do, rather than trusting field_path as a literal walkable
 * path. Only the 3 label shapes those existing resolver functions actually produce are
 * supported: scenes[].<field>, shots[].<field>, states[].<field> (character growth).
 *
 * Deliberately NOT solved here (PHASE-779's own finding, left as a separate design problem):
 * SeasonCarryoverSeriesAnchor's identity_signature/location_signature/series_memory_signature/
 * growth_score have no Envelope pointer at all yet — there is nothing for this function to
 * dereference for them. World Identity's own resolveWorldIdentity/world-identity-index-v1.json
 * path is untouched and not exercised by this function or its test.
 */
export function dereferenceEnvelope(envelope: Envelope): DereferenceResult {
  if (envelope.status !== 'RESOLVED' || !envelope.value_ref) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: 'envelope is not RESOLVED — cannot dereference a pointer that does not exist' };
  }
  const { registry_ref, field_path } = envelope.value_ref;
  const doc = loadUnderlyingRegistry(registry_ref);
  if (!doc) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `registry file not found or unreadable: ${registry_ref}` };
  }

  const match = /^([a-zA-Z_]+)\[\]\.(.+)$/.exec(field_path);
  if (!match) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `field_path "${field_path}" does not match the supported <arrayKey>[].<subField> shape` };
  }
  const [, arrayKeyLabel, subField] = match;

  if (arrayKeyLabel === 'scenes') {
    const arr = Array.isArray(doc.scenes) ? doc.scenes : [];
    const idValue = envelope.requested.scene_id;
    return resolveArrayMatches(arr.filter((s: any) => s.scene_id === idValue), subField, 'scene_id', idValue);
  }
  if (arrayKeyLabel === 'shots') {
    const arr = Array.isArray(doc.shots) ? doc.shots : [];
    const idValue = envelope.requested.shot_id;
    return resolveArrayMatches(arr.filter((s: any) => s.shot_id === idValue), subField, 'shot_id', idValue);
  }
  if (arrayKeyLabel === 'states') {
    // PHASE-779: the "states[]" label does not name a real array property — the real shape
    // (character_state_registry vs subject_motion_registry) is re-derived from the movie's own
    // registry entry, exactly as characterExistsInRegistry already does for existence checks.
    const movieId = envelope.requested.movie_id as string;
    const characterId = envelope.requested.character_id as string;
    const entry = findMovie(movieId);
    const shape: string | undefined = entry?.character_growth_source?.shape;
    const canonicalId = canonicalCharacterId(characterId);
    if (shape === 'character_state_registry') {
      const arr = Array.isArray(doc.character_states) ? doc.character_states : [];
      const matches = arr.filter((s: any) => Array.isArray(s.character_ids) && s.character_ids.includes(canonicalId));
      return resolveArrayMatches(matches, subField, 'character_id', canonicalId);
    }
    if (shape === 'subject_motion_registry') {
      const arr = Array.isArray(doc.subject_motions) ? doc.subject_motions : [];
      const matches = arr.filter((s: any) => s.character_id === canonicalId);
      return resolveArrayMatches(matches, subField, 'character_id', canonicalId);
    }
    return { status: 'NOT_DEREFERENCED', value: null, reason: `unrecognized character_growth_source shape: ${shape ?? 'undefined'}` };
  }
  return {
    status: 'NOT_DEREFERENCED',
    value: null,
    reason: `unsupported array key label "${arrayKeyLabel}[]" — this minimal implementation only supports scenes[]/shots[]/states[]`,
  };
}

/**
 * PHASE-782 — a scene-disambiguated sibling to dereferenceEnvelope, built specifically for
 * SeasonCarryoverSeriesAnchor.growth_score (Rule SC3): a bare resolveCharacterGrowthField()
 * Envelope's "states[].<field>" pointer is ambiguous on its own (PHASE-780/781's own finding —
 * no scene_id in the Envelope's requested object), but CharacterGrowthDeltaRecord's real
 * entry_state_ref/exit_state_ref already carry a concrete scene_id as a sibling field. This
 * function accepts that already-known scene_id as an extra argument to disambiguate down to
 * the single real array entry, reusing every other piece of dereferenceEnvelope's states[]
 * branch (loadUnderlyingRegistry, findMovie, canonicalCharacterId, resolveArrayMatches)
 * unchanged.
 */
export function dereferenceCharacterGrowthFieldAtScene(envelope: Envelope, sceneId: string): DereferenceResult {
  if (envelope.status !== 'RESOLVED' || !envelope.value_ref) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: 'envelope is not RESOLVED — cannot dereference a pointer that does not exist' };
  }
  const { registry_ref, field_path } = envelope.value_ref;
  const match = /^states\[\]\.(.+)$/.exec(field_path);
  if (!match) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `field_path "${field_path}" is not a character-growth (states[].<field>) pointer — this function only handles that shape` };
  }
  const subField = match[1];
  const doc = loadUnderlyingRegistry(registry_ref);
  if (!doc) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `registry file not found or unreadable: ${registry_ref}` };
  }
  const movieId = envelope.requested.movie_id as string;
  const characterId = envelope.requested.character_id as string;
  const entry = findMovie(movieId);
  const shape: string | undefined = entry?.character_growth_source?.shape;
  const canonicalId = canonicalCharacterId(characterId);
  if (shape === 'character_state_registry') {
    const arr = Array.isArray(doc.character_states) ? doc.character_states : [];
    const matches = arr.filter((s: any) => Array.isArray(s.character_ids) && s.character_ids.includes(canonicalId) && s.scene_id === sceneId);
    return resolveArrayMatches(matches, subField, 'character_id+scene_id', `${canonicalId}@${sceneId}`);
  }
  if (shape === 'subject_motion_registry') {
    const arr = Array.isArray(doc.subject_motions) ? doc.subject_motions : [];
    const matches = arr.filter((s: any) => s.character_id === canonicalId && s.scene_id === sceneId);
    return resolveArrayMatches(matches, subField, 'character_id+scene_id', `${canonicalId}@${sceneId}`);
  }
  return { status: 'NOT_DEREFERENCED', value: null, reason: `unrecognized character_growth_source shape: ${shape ?? 'undefined'}` };
}

/**
 * PHASE-789 — implements docs/architecture/SeriesAnchorLocationSignatureDesign.md (PHASE-788)
 * Rule LS3c exactly: a minimal, additive sibling to dereferenceCharacterGrowthFieldAtScene, built
 * specifically for SeasonCarryoverSeriesAnchor.location_signature. Given an already-RESOLVED
 * scene Envelope (from resolveScene, unmodified), loads the same underlying registry
 * (loadUnderlyingRegistry, unmodified) and reads that scene's own real, nested
 * gonegi_translation.target_location_id field.
 *
 * Rule LS6a/LS6b (World Identity separation — the central concern of PHASE-788's design):
 * this function's own return value NEVER carries anything but the extracted target_location_id
 * string (or NOT_DEREFERENCED). resolveArrayMatches is reused unmodified to find the single real
 * scene entry and its whole gonegi_translation object — that object is held only in a local,
 * unreturned variable for one statement, immediately narrowed down to target_location_id alone.
 * target_world_identity (gonegi_translation's own literal sibling field to target_location_id,
 * confirmed live PHASE-788) is never read, logged, compared, or returned by this function —
 * resolveWorldIdentity is never called here, and never will be, per Rule LS6a.
 */
export function dereferenceSceneLocationId(envelope: Envelope): DereferenceResult {
  if (envelope.status !== 'RESOLVED' || !envelope.value_ref) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: 'envelope is not RESOLVED — cannot dereference a pointer that does not exist' };
  }
  const { registry_ref, field_path } = envelope.value_ref;
  const match = /^scenes\[\]\.(.+)$/.exec(field_path);
  if (!match) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `field_path "${field_path}" is not a scene (scenes[].<field>) pointer — this function only handles that shape` };
  }
  const doc = loadUnderlyingRegistry(registry_ref);
  if (!doc) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `registry file not found or unreadable: ${registry_ref}` };
  }
  const arr = Array.isArray(doc.scenes) ? doc.scenes : [];
  const sceneId = envelope.requested.scene_id;
  // Rule LS3c: reuses the same existence/ambiguity discipline resolveArrayMatches already
  // established — 'gonegi_translation' is the whole real object at this intermediate step only.
  const translationResult = resolveArrayMatches(arr.filter((s: any) => s.scene_id === sceneId), 'gonegi_translation', 'scene_id', sceneId);
  if (translationResult.status !== 'DEREFERENCED') {
    return translationResult;
  }
  // Rule LS6b: extract ONLY target_location_id — target_world_identity (its literal sibling
  // field, confirmed PHASE-788) is discarded here and never touched again.
  const targetLocationId = (translationResult.value as any)?.target_location_id;
  if (typeof targetLocationId !== 'string' || targetLocationId.trim().length === 0) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `scene "${sceneId}" has no real gonegi_translation.target_location_id field (Rule LS3d)` };
  }
  return { status: 'DEREFERENCED', value: targetLocationId, reason: null };
}

/**
 * PHASE-792 — implements PHASE-791's selected next gap: ScenePurposeAnnotation.emotion
 * (Rule AU6, docs/architecture/StoryScenarioAuthoringContract.md, PHASE-053) — a real scene's
 * own bindings.emotion field, blocked purely on a missing dereferencing capability since
 * PHASE-052/053, never revisited until now that the capability is real (PHASE-780/782/789).
 * Mirrors dereferenceSceneLocationId (PHASE-789) exactly — same RESOLVED-scene-Envelope-in,
 * same reused resolveArrayMatches, same "extract exactly one real field, nothing else" shape —
 * applied to a different, unrelated real field on the same real scene entry (bindings.emotion,
 * not gonegi_translation.target_location_id — no World Identity proximity at all here, an even
 * cleaner separation than location_signature's own design had to draw).
 */
export function dereferenceSceneEmotion(envelope: Envelope): DereferenceResult {
  if (envelope.status !== 'RESOLVED' || !envelope.value_ref) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: 'envelope is not RESOLVED — cannot dereference a pointer that does not exist' };
  }
  const { registry_ref, field_path } = envelope.value_ref;
  const match = /^scenes\[\]\.(.+)$/.exec(field_path);
  if (!match) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `field_path "${field_path}" is not a scene (scenes[].<field>) pointer — this function only handles that shape` };
  }
  const doc = loadUnderlyingRegistry(registry_ref);
  if (!doc) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `registry file not found or unreadable: ${registry_ref}` };
  }
  const arr = Array.isArray(doc.scenes) ? doc.scenes : [];
  const sceneId = envelope.requested.scene_id;
  // Rule (mirrors LS3c): reuses the same existence/ambiguity discipline resolveArrayMatches
  // already established — 'bindings' is the whole real object at this intermediate step only.
  const bindingsResult = resolveArrayMatches(arr.filter((s: any) => s.scene_id === sceneId), 'bindings', 'scene_id', sceneId);
  if (bindingsResult.status !== 'DEREFERENCED') {
    return bindingsResult;
  }
  const emotion = (bindingsResult.value as any)?.emotion;
  if (typeof emotion !== 'string' || emotion.trim().length === 0) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `scene "${sceneId}" has no real bindings.emotion field` };
  }
  return { status: 'DEREFERENCED', value: emotion, reason: null };
}

/**
 * PHASE-794 — implements PHASE-793's selected next gap: ShotIntentAnnotation.camera_choice_trace
 * (Rule AU8, docs/architecture/StoryScenarioAuthoringContract.md, PHASE-053) — a real shot's own
 * camera_id/composition_id fields, blocked purely on a missing dereferencing capability since
 * PHASE-052/053, the same shape of gap emotion (PHASE-792) and location_signature (PHASE-789)
 * already closed, applied here to resolveShot's Envelope instead of resolveScene's. Both fields
 * are treated as one unit (matching camera_choice_trace's own original type shape, "both
 * NOT_DERIVABLE — dereferencing gap"): each is looked up via resolveArrayMatches (reused
 * unmodified, called twice against the same already-filtered match set — no new matching logic),
 * and only a real, non-empty pair for BOTH fields counts as successfully dereferenced.
 */
export function dereferenceShotCameraChoice(envelope: Envelope): DereferenceResult {
  if (envelope.status !== 'RESOLVED' || !envelope.value_ref) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: 'envelope is not RESOLVED — cannot dereference a pointer that does not exist' };
  }
  const { registry_ref, field_path } = envelope.value_ref;
  const match = /^shots\[\]\.(.+)$/.exec(field_path);
  if (!match) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `field_path "${field_path}" is not a shot (shots[].<field>) pointer — this function only handles that shape` };
  }
  const doc = loadUnderlyingRegistry(registry_ref);
  if (!doc) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `registry file not found or unreadable: ${registry_ref}` };
  }
  const arr = Array.isArray(doc.shots) ? doc.shots : [];
  const shotId = envelope.requested.shot_id;
  const filtered = arr.filter((s: any) => s.shot_id === shotId);
  const cameraResult = resolveArrayMatches(filtered, 'camera_id', 'shot_id', shotId);
  if (cameraResult.status !== 'DEREFERENCED') {
    return cameraResult;
  }
  const compositionResult = resolveArrayMatches(filtered, 'composition_id', 'shot_id', shotId);
  if (compositionResult.status !== 'DEREFERENCED') {
    return compositionResult;
  }
  const cameraId = cameraResult.value;
  const compositionId = compositionResult.value;
  if (typeof cameraId !== 'string' || cameraId.trim().length === 0 || typeof compositionId !== 'string' || compositionId.trim().length === 0) {
    return { status: 'NOT_DEREFERENCED', value: null, reason: `shot "${shotId}" is missing a real camera_id and/or composition_id field` };
  }
  return { status: 'DEREFERENCED', value: { camera_id: cameraId, composition_id: compositionId }, reason: null };
}

// PHASE-699: the one allowlisted-root artifact this function is permitted to consult —
// datasets/story/ is already in ALLOWLIST_ROOTS, so loadUnderlyingRegistry's own
// assertAllowlisted call (Rule S1) passes without any allowlist expansion.
const WORLD_IDENTITY_INDEX_REF = 'datasets/story/world-identity-index-v1.json';

/**
 * resolveWorldIdentity — PHASE-043 §5 originally, PHASE-699 addendum above. Consults
 * datasets/story/world-identity-index-v1.json (built PHASE-699): a movie_id resolves RESOLVED
 * only if it is named in some entry's referenced_by[] AND that entry's resolution_status is
 * "CONTENT_RESOLVED". Any other case — index missing, movie_id not listed, listed but not
 * CONTENT_RESOLVED — falls through to the exact original NOT_DERIVABLE envelope, fail-closed,
 * unchanged from before this phase.
 */
export function resolveWorldIdentity(movieId: string): Envelope {
  const requested = { movie_id: movieId, tier: 'world_identity' };
  const index = loadUnderlyingRegistry(WORLD_IDENTITY_INDEX_REF);
  if (index && Array.isArray(index.world_identities)) {
    for (const entry of index.world_identities) {
      if (
        entry.resolution_status === 'CONTENT_RESOLVED' &&
        Array.isArray(entry.referenced_by) &&
        entry.referenced_by.some((r: any) => r.movie_id === movieId)
      ) {
        return resolved(requested, movieId, { registry_ref: WORLD_IDENTITY_INDEX_REF, field_path: 'world_identities[].world_id' }, null);
      }
    }
  }
  return notDerivable(requested, movieId, 'WorldIdentityIndex not yet materialized — see PHASE-037 §2 / PHASE-043 §5');
}

export function listEligibleMovies(tier: Tier): string[] {
  if (tier === 'world_identity') return [];
  const reg = loadRegistry();
  return (reg.movies as any[])
    .filter((m) => (tier === 'scene_shot' ? m.scene_shot_tier : m.character_growth_tier) === 'READY')
    .map((m) => m.movie_id);
}

/**
 * Rule N3 (PHASE-041 §5 / PHASE-043 §2): propagation is the CALLER's job, not the
 * resolver's. This function is a worked example of a caller doing that correctly —
 * it is NOT part of the resolver's own public contract, and it does not represent
 * the real NarrativeCallbackLedger contract (which remains design-only, PHASE-037).
 * It exists solely so PHASE-044's required N3 test has something real to call.
 */
export function exampleCallbackLedgerPropagation(
  movieId: string,
  plantedSceneId: string,
  resolvedSceneId: string
): { status: 'RESOLVED' | 'NOT_DERIVABLE'; reason: string | null } {
  const planted = resolveScene(movieId, plantedSceneId);
  const resolvedEnv = resolveScene(movieId, resolvedSceneId);
  const failures = [planted, resolvedEnv].filter((e) => e.status === 'NOT_DERIVABLE');
  if (failures.length > 0) {
    return {
      status: 'NOT_DERIVABLE',
      reason: `NarrativeCallbackLedger entry cannot resolve: ${failures.map((f) => f.reason).join('; ')}`,
    };
  }
  return { status: 'RESOLVED', reason: null };
}

// Exposed only for tests in verify-source-resolver.ts — not part of the resolver's intended
// public read interface (PHASE-043 §7 method table).
export const __test__ = { assertAllowlisted, loadRegistry, findMovie, sceneExistsInRegistry, shotExistsInRegistry, characterExistsInRegistry };
