/**
 * Story/Series Authoring — Persistence Layer
 *
 * Implements docs/architecture/StorySeriesPersistenceContract.md (PHASE-062) as real code:
 * the authored_content/ file layout, the common document schema (content/provenance/
 * structural_snapshot/change_history), reload-and-reconnect drift detection (Rule PS3),
 * open-callback-chain resume (Rule PS4), cumulative character-arc append (Rule PS5), and
 * optimistic-concurrency writes (Rule PS8).
 *
 * PHASE-065 addendum: adds real save/load for the 4 DocumentKinds PHASE-063 left as
 * directory-name-only placeholders — relationships, seasons, stories, season_carryovers.
 * Seasons/Stories are built by loading and Rule-PS3-reverifying their already-persisted
 * children (Episodes / Seasons respectively), never by re-deriving from scratch — drift in a
 * child (e.g. an Episode) propagates up into its parent Season's/Story's own drift report.
 *
 * PHASE-068 addendum: adds appendEpisodeToSeason/appendSeasonToStory — PHASE-067 found Season
 * and Story were the only two DocumentKinds without an append path (unlike CallbackChain/
 * CharacterArc/Relationship). Both new functions follow that exact same proven pattern.
 *
 * PHASE-071 addendum: adds refreshSeasonSnapshot/refreshStorySnapshot, implementing PHASE-070's
 * Rule FR4 exactly — an explicit, non-cascading, content-preserving resync of a stale
 * structural_snapshot. Automatic write-back remains permanently banned (Rule FR3): no load*
 * function writes anything, and no append function calls a refresh function on anyone's
 * behalf. A caller must invoke refresh* deliberately.
 *
 * PHASE-082 addendum: every DocumentKind's content schema gains one new OPTIONAL field for
 * real authored narrative text (episode scene purposes/shot intents, season arc, story
 * title/synopsis/themes, character-arc note, relationship stages, callback significance) —
 * additive only, absent on every document created before this phase. The six new
 * `author*`-family functions below (authorEpisodeNarrative, authorSeasonArc,
 * authorStoryNarrative, authorPersistedCharacterArcNote, authorPersistedRelationshipStages,
 * authorPersistedCallbackSignificance) are thin persistence wrappers — every actual gating
 * rule (Rule AU1/AU7 scene-purpose-then-shot-intent order, Rule CA2/CB2/RC-stage sentinel
 * checks) is enforced by calling the SAME real, unmodified functions storyAuthoringSampleV1.ts
 * and seriesContinuityContracts.ts already exported and already proved, never reimplemented
 * here. This closes the gap those two modules always had: their authored fields were provably
 * correct in memory but never actually durable — nothing before this phase could save real
 * authored prose to disk. See docs/architecture/StoryAuthoringSessionV1.md.
 *
 * Rule I1 VARIANT (intentional, scoped exception — read this before assuming a violation):
 * every other module in this directory (sourceResolver.ts, storyIntelligenceIntegration.ts,
 * storyContracts.ts, storyAuthoringSampleV1.ts, seriesContinuityContracts.ts) has NO
 * 'node:fs' import, because none of them ever needs to write anything. This module is
 * different in kind, not degree: its entire job is writing/reading authored_content/, so it
 * legitimately imports 'node:fs'. What Rule I1's spirit still requires, and this module
 * upholds: it NEVER opens any datasets/ file or TRUSTED_SOURCE_REGISTRY.json directly — every
 * real fact about Scene/Shot/Character data still comes exclusively from calling
 * sourceResolver.ts's / seriesContinuityContracts.ts's already-real, unmodified functions.
 * Its own filesystem access is scoped to its own authored_content/ subtree only (Rule PS1,
 * enforced by assertSafeObjectId + a fixed root path, never a caller-supplied path).
 *
 * Scope: project_brain/story_scenario_intelligence/ only, per PHASE-063's authorization.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveScene, resolveShot, resolveCharacterGrowthField, dereferenceCharacterGrowthFieldAtScene, dereferenceSceneLocationId, dereferenceSceneEmotion, dereferenceShotCameraChoice, canonicalCharacterId } from './sourceResolver.js';
import { resolveEpisode, resolveSeasonScenario, resolveStoryBible, type EpisodeResult, type SeasonScenarioResult } from './storyIntelligenceIntegration.js';
import {
  buildCallbackChain, authorCallbackChainSignificance, type CallbackChain, type CallbackChainLeg, type CallbackLegRole,
  buildCharacterArcRecord, authorCharacterArcNote, type CharacterArcRecord,
  buildRelationshipContinuityRecord, authorRelationshipStages, type RelationshipContinuityRecord, type RelationshipSupportingScene,
  buildSeasonCarryoverRecord, authorCarryoverCheck, authorSeriesAnchorRelationshipStage, authorSeriesAnchorGrowthScore,
  authorSeriesAnchorIdentitySignature, type IdentitySignatureInputs,
  authorSeriesAnchorLocationSignature, type LocationSignatureInputs, type SeasonCarryoverRecord,
} from './seriesContinuityContracts.js';
import type { CharacterGrowthDeltaRecord } from './storyContracts.js';
// PHASE-082: reuse the exact same Rule AU1/AU7 authoring gates storyAuthoringSampleV1.ts
// already proved, rather than reimplementing scene-purpose/shot-intent validation here.
import { authorField, authorShotIntent, assertControlledVocabulary, type ScenePurposeCategory } from './storyAuthoringSampleV1.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTHORED_CONTENT_ROOT = join(__dirname, 'authored_content');

export class PersistenceError extends Error {}

// ---------------------------------------------------------------------------
// Path safety (Rule PS1 — this module's own filesystem access is scoped and validated)
// ---------------------------------------------------------------------------

export type DocumentKind = 'stories' | 'seasons' | 'episodes' | 'callback_chains' | 'character_arcs' | 'relationships' | 'season_carryovers' | 'dependency_test';
const KINDS: DocumentKind[] = ['stories', 'seasons', 'episodes', 'callback_chains', 'character_arcs', 'relationships', 'season_carryovers', 'dependency_test'];

function assertSafeObjectId(objectId: string): void {
  if (!/^[A-Za-z0-9_-]+$/.test(objectId)) {
    throw new PersistenceError(`Unsafe object_id "${objectId}" — only [A-Za-z0-9_-] allowed, to prevent path traversal into/out of authored_content/`);
  }
}

function documentPath(kind: DocumentKind, objectId: string): string {
  assertSafeObjectId(objectId);
  return join(AUTHORED_CONTENT_ROOT, kind, `${objectId}.json`);
}

function ensureDir(kind: DocumentKind): void {
  mkdirSync(join(AUTHORED_CONTENT_ROOT, kind), { recursive: true });
}

// ---------------------------------------------------------------------------
// Common document schema (PHASE-062 §3/§7)
// ---------------------------------------------------------------------------

export interface AuthorshipProvenance {
  author_type: 'human' | 'ai_assisted';
  tool: string | null;
  reviewed_by_human: boolean;
  authored_at: string;
}

export interface ChangeHistoryEntry {
  version: number;
  changed_at: string;
  changed_fields: string[];
  authorship_provenance: AuthorshipProvenance | null;
  drift_detected: boolean;
  drift_detail: string | null;
}

/** Editorial decision state; absent preserves every pre-Canon document unchanged. */
export type CanonStatus = 'CANON' | 'PLANNED' | 'CANDIDATE' | 'REJECTED';


/**
 * PHASE-731/732: content-axis dependency bookkeeping, per docs/architecture/
 * StoryContentDependencyBookkeepingDesign.md (PHASE-730) Rule DB1/DB2 — a sibling to
 * `structural_snapshot`, never nested inside `content`. Absent by default (Rule DB1b): a content
 * field with no entry here is UNVERIFIED (Rule CF3c), never assumed FRESH or accused STALE.
 */
export type ComparisonMode = 'count' | 'exact_value';

export interface SelfDependency {
  kind: 'self';
  tracked_field: string; // dotted content-path WITHIN THE SAME document, e.g. "content.episode_ids"
  comparison: ComparisonMode;
  count_at_authoring?: number; // present iff comparison === 'count'
  value_at_authoring?: string; // present iff comparison === 'exact_value'
}

export interface DocumentDependency {
  kind: 'document';
  object_kind: DocumentKind;
  object_id: string;
  tracked_field: string; // dotted content-path WITHIN THAT OTHER document
  comparison: ComparisonMode;
  count_at_authoring?: number;
  value_at_authoring?: string;
}

export type ContentDependency = SelfDependency | DocumentDependency;

export interface PersistedDocument<T = unknown> {
  schema_version: '1';
  object_id: string;
  content: T;
  provenance: Record<string, AuthorshipProvenance>;
  structural_snapshot: unknown;
  last_resolved_at: string;
  change_history: ChangeHistoryEntry[];
  // PHASE-731/732: optional, additive — absent on every document created before this phase
  // (Rule DB6: no retroactive population, ever, for those documents).
  dependency_ledger?: Record<string, ContentDependency[]>;
  canon_status?: CanonStatus;
}

function readDocumentRaw<T>(kind: DocumentKind, objectId: string): PersistedDocument<T> | null {
  const path = documentPath(kind, objectId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeDocumentRaw<T>(kind: DocumentKind, doc: PersistedDocument<T>): void {
  ensureDir(kind);
  writeFileSync(documentPath(kind, doc.object_id), JSON.stringify(doc, null, 2), 'utf8');
}

/** Rule PS8: creating a document that already exists is rejected — this is not an upsert. */
function createDocument<T>(
  kind: DocumentKind,
  objectId: string,
  content: T,
  structural_snapshot: unknown,
  provenance: Record<string, AuthorshipProvenance>,
  initialProvenanceEntry: AuthorshipProvenance | null
): PersistedDocument<T> {
  if (readDocumentRaw(kind, objectId)) {
    throw new PersistenceError(`Cannot create ${kind}/${objectId} — a document already exists (use an update path, not create)`);
  }
  const doc: PersistedDocument<T> = {
    schema_version: '1',
    object_id: objectId,
    content,
    provenance,
    structural_snapshot,
    last_resolved_at: new Date().toISOString(),
    change_history: [{ version: 1, changed_at: new Date().toISOString(), changed_fields: ['content'], authorship_provenance: initialProvenanceEntry, drift_detected: false, drift_detail: null }],
  };
  writeDocumentRaw(kind, doc);
  return doc;
}

/** Rule PS8: optimistic concurrency — the caller must supply the version it last read; a mismatch is rejected, never silently overwritten. */
function updateDocument<T>(
  kind: DocumentKind,
  objectId: string,
  expectedVersion: number,
  mutate: (current: T) => T,
  changed_fields: string[],
  authorship_provenance: AuthorshipProvenance | null,
  drift: { detected: boolean; detail: string | null } = { detected: false, detail: null }
): PersistedDocument<T> {
  const existing = readDocumentRaw<T>(kind, objectId);
  if (!existing) throw new PersistenceError(`Cannot update ${kind}/${objectId} — no document exists (use create first)`);
  const currentVersion = existing.change_history.length;
  if (currentVersion !== expectedVersion) {
    throw new PersistenceError(
      `Optimistic concurrency conflict on ${kind}/${objectId}: expected version ${expectedVersion}, on-disk version is ${currentVersion} — reload and retry, never overwrite blindly`
    );
  }
  const newContent = mutate(existing.content);
  const nextVersion = currentVersion + 1;
  existing.content = newContent;
  existing.last_resolved_at = new Date().toISOString();
  existing.change_history.push({
    version: nextVersion,
    changed_at: new Date().toISOString(),
    changed_fields,
    authorship_provenance,
    drift_detected: drift.detected,
    drift_detail: drift.detail,
  });
  writeDocumentRaw(kind, existing);
  return existing;
}

/**
 * Rule PS3: never trust a loaded structural_snapshot as still valid. Caller supplies a
 * `recompute` closure that re-derives the fresh value via the real resolver, and a
 * `statusOf` accessor to compare old vs. new without needing deep equality on the whole object.
 */
export function reverifyStructuralSnapshot<S>(
  storedSnapshot: S,
  recompute: () => S,
  statusOf: (s: S) => string
): { fresh: S; driftDetected: boolean; driftDetail: string | null } {
  const fresh = recompute();
  const storedStatus = statusOf(storedSnapshot);
  const freshStatus = statusOf(fresh);
  if (storedStatus === freshStatus) return { fresh, driftDetected: false, driftDetail: null };
  return { fresh, driftDetected: true, driftDetail: `stored status was "${storedStatus}", fresh re-resolution is "${freshStatus}"` };
}

export function loadRawDocument<T>(kind: DocumentKind, objectId: string): PersistedDocument<T> | null {
  return readDocumentRaw<T>(kind, objectId);
}

/** Uses the same version gate and change-history semantics as every persisted update. */
export function updateDocumentCanonStatus<T>(kind: DocumentKind, objectId: string, expectedVersion: number, canonStatus: CanonStatus, authorship: AuthorshipProvenance | null): PersistedDocument<T> {
  const doc = updateDocument(kind, objectId, expectedVersion, (content) => content, ['canon_status'], authorship);
  doc.canon_status = canonStatus;
  writeDocumentRaw(kind, doc);
  return doc;
}


// ---------------------------------------------------------------------------
// Episode persistence (Story/Season/Episode — PHASE-062 §2/§3)
// ---------------------------------------------------------------------------

/** PHASE-082: one scene's real, gated authored content — mirrors ScenePurposeAnnotation's authored fields (storyContracts.ts), minus `emotion` (permanently NOT_DERIVABLE, dereferencing gap, never an authoring surface — Rule AU6). */
export interface AuthoredScenePurposeEntry {
  purpose: string;
  conflict_type: 'internal' | 'external' | 'relational';
  stakes: string;
  opposing_force: string;
  /** PHASE-706: OPTIONAL controlled-vocabulary tag alongside `purpose` — never required, never
   * replacing the free-text field. Absent on every entry authored before this phase. */
  purpose_category?: ScenePurposeCategory;
}

/** PHASE-082: one shot's real, gated authored content — mirrors ShotIntentAnnotation's authored fields, minus `camera_choice_trace` (permanently NOT_DERIVABLE, Rule AU8). */
export interface AuthoredShotIntentEntry {
  intent: string;
  serves_scene_id: string;
}

export interface EpisodeAuthoredNarrative {
  episode_purpose: string;
  scene_purposes: Record<string, AuthoredScenePurposeEntry>; // keyed by scene_id
  shot_intents: Record<string, AuthoredShotIntentEntry>; // keyed by shot_id
}

export interface EpisodeDocumentContent {
  episode_id: string;
  movie_id: string;
  scene_ids: string[];
  shot_ids: string[];
  character_growth_spec: { character_id: string; fields: string[] } | null;
  // PHASE-082: optional real authored narrative content — additive only. Absent (undefined)
  // on every Episode document created before this phase; a document without it remains
  // exactly as valid as one with it.
  authored_narrative?: EpisodeAuthoredNarrative;
  // PHASE-792: optional, COMPUTED-ONLY (never authored, Rule AU6) real scene emotion values —
  // keyed by this episode's own scene_ids. Additive only, absent on every Episode document
  // created before this phase. Deliberately kept OUTSIDE authored_narrative — Rule AU6
  // (docs/architecture/StoryScenarioAuthoringContract.md) permanently forbids `emotion` from
  // ever being a free-form authored field; this field's own persistence function
  // (authorPersistedEpisodeSceneEmotion) takes no string content parameter at all, so there is
  // no code path by which this field could ever be hand-authored.
  computed_scene_emotion?: Record<string, string>;
  // PHASE-794: optional, COMPUTED-ONLY (never authored, Rule AU8) real shot camera_id/
  // composition_id pair — keyed by this episode's own shot_ids. Additive only, absent on every
  // Episode document created before this phase. A real, resolved value is the {camera_id,
  // composition_id} object itself; an unresolved shot is recorded as its own specific
  // "NOT_DERIVABLE: <reason>" string, mirroring computed_scene_emotion's own per-key discipline.
  computed_shot_camera_choice?: Record<string, { camera_id: string; composition_id: string } | string>;
}

export function saveEpisode(spec: EpisodeDocumentContent, provenance: Record<string, AuthorshipProvenance>, authorship: AuthorshipProvenance): PersistedDocument<EpisodeDocumentContent> {
  const resolution = resolveEpisode({
    episode_id: spec.episode_id,
    movie_id: spec.movie_id,
    scene_ids: spec.scene_ids,
    shot_ids: spec.shot_ids,
    ...(spec.character_growth_spec ? { character_growth: spec.character_growth_spec } : {}),
  });
  return createDocument('episodes', spec.episode_id, spec, resolution, provenance, authorship);
}

/** Rule PS3 applied to a saved Episode: reload and re-resolve, never trust the saved snapshot. */
export function loadEpisodeWithReverify(episode_id: string) {
  const doc = readDocumentRaw<EpisodeDocumentContent>('episodes', episode_id);
  if (!doc) return null;
  const { fresh, driftDetected, driftDetail } = reverifyStructuralSnapshot(
    doc.structural_snapshot as any,
    () =>
      resolveEpisode({
        episode_id: doc.content.episode_id,
        movie_id: doc.content.movie_id,
        scene_ids: doc.content.scene_ids,
        shot_ids: doc.content.shot_ids,
        ...(doc.content.character_growth_spec ? { character_growth: doc.content.character_growth_spec } : {}),
      }),
    (s: any) => s.aggregate_status
  );
  return { doc, freshResolution: fresh, driftDetected, driftDetail };
}

/**
 * PHASE-082: author real, gated narrative content onto an already-saved Episode. Scene
 * purpose -> Shot intent ORDER is enforced by reusing authorField/authorShotIntent
 * unmodified (Rule AU1/AU7) — never reimplemented here. Every scene_id/shot_id named in
 * `narrative` must already be one of this episode's own scene_ids/shot_ids — this function
 * only ever authors against pointers the episode already, verifiably, references.
 * Content merges with (never replaces) any narrative authored in a prior call, so an
 * episode's narrative can be built up scene-by-scene across multiple authoring sessions,
 * the same incremental spirit as every other append-style function in this module.
 */
export function authorEpisodeNarrative(
  episode_id: string,
  expectedVersion: number,
  narrative: EpisodeAuthoredNarrative,
  authorship: AuthorshipProvenance
): PersistedDocument<EpisodeDocumentContent> {
  const existing = readDocumentRaw<EpisodeDocumentContent>('episodes', episode_id);
  if (!existing) throw new PersistenceError(`Cannot author narrative for episode "${episode_id}" — no document exists`);

  try {
    for (const sceneId of Object.keys(narrative.scene_purposes)) {
      if (!existing.content.scene_ids.includes(sceneId)) {
        throw new PersistenceError(`"${sceneId}" is not one of episode "${episode_id}"'s own scene_ids — cannot author a purpose for a scene this episode doesn't reference`);
      }
      const entry = narrative.scene_purposes[sceneId];
      const env = resolveScene(existing.content.movie_id, sceneId);
      authorField(env, entry.purpose, `scene_purposes[${sceneId}].purpose`); // Rule AU1 — throws unless RESOLVED
      authorField(env, entry.stakes, `scene_purposes[${sceneId}].conflict.stakes`);
      authorField(env, entry.opposing_force, `scene_purposes[${sceneId}].conflict.opposing_force`);
      // PHASE-706, Rule AU-CV: purpose_category is optional — only validated if the caller
      // actually supplies one; omitting it (every call site before this phase, and any future
      // call that doesn't want it) is unaffected.
      if (entry.purpose_category !== undefined) {
        assertControlledVocabulary(entry.purpose_category, `scene_purposes[${sceneId}].purpose_category`);
      }
    }
    for (const shotId of Object.keys(narrative.shot_intents)) {
      if (!existing.content.shot_ids.includes(shotId)) {
        throw new PersistenceError(`"${shotId}" is not one of episode "${episode_id}"'s own shot_ids — cannot author an intent for a shot this episode doesn't reference`);
      }
      const entry = narrative.shot_intents[shotId];
      const parentPurpose = narrative.scene_purposes[entry.serves_scene_id]?.purpose ?? existing.content.authored_narrative?.scene_purposes?.[entry.serves_scene_id]?.purpose;
      if (!parentPurpose) {
        throw new PersistenceError(`Rule AU7 violation: shot "${shotId}" claims to serve scene "${entry.serves_scene_id}", but that scene has no authored purpose (neither in this call nor already saved) — scene purpose must be authored before shot intent`);
      }
      const env = resolveShot(existing.content.movie_id, shotId);
      authorShotIntent(env, parentPurpose, entry.intent, `shot_intents[${shotId}].intent`); // Rule AU7
    }
  } catch (e: any) {
    if (e instanceof PersistenceError) throw e;
    throw new PersistenceError(`Narrative authoring rejected for episode "${episode_id}": ${e.message}`);
  }

  const merged: EpisodeAuthoredNarrative = {
    episode_purpose: narrative.episode_purpose || existing.content.authored_narrative?.episode_purpose || '',
    scene_purposes: { ...(existing.content.authored_narrative?.scene_purposes ?? {}), ...narrative.scene_purposes },
    shot_intents: { ...(existing.content.authored_narrative?.shot_intents ?? {}), ...narrative.shot_intents },
  };

  return updateDocument<EpisodeDocumentContent>(
    'episodes',
    episode_id,
    expectedVersion,
    (current) => ({ ...current, authored_narrative: merged }),
    ['content.authored_narrative'],
    authorship
  );
}

/**
 * PHASE-792: implements PHASE-791's selected next gap — closes ScenePurposeAnnotation.emotion
 * (Rule AU6) for the real, active persistence layer. For each of this episode's own real
 * scene_ids, resolves the scene (resolveScene, unmodified, existence-checked) and dereferences
 * its real bindings.emotion field (dereferenceSceneEmotion, PHASE-792, sourceResolver.ts).
 * A scene whose registry has no real bindings.emotion (confirmed live, PHASE-791: true for
 * every real spirited_away scene) is recorded as its own honest, specific NOT_DERIVABLE string
 * — never a guess, never silently omitted. This function takes no free-text content parameter
 * at all — it is always derived fresh from the episode's own already-real scene_ids, never
 * hand-authored (Rule AU6's own "not an authoring field" discipline, enforced structurally
 * rather than by a separate gate, since there is no authored-value argument to gate).
 */
export function authorPersistedEpisodeSceneEmotion(
  episode_id: string,
  expectedVersion: number,
  authorship: AuthorshipProvenance
) {
  const existing = readDocumentRaw<EpisodeDocumentContent>('episodes', episode_id);
  if (!existing) throw new PersistenceError(`Cannot author computed_scene_emotion for episode "${episode_id}" — no document exists`);

  const computed_scene_emotion: Record<string, string> = {};
  for (const sceneId of existing.content.scene_ids) {
    const envelope = resolveScene(existing.content.movie_id, sceneId);
    const deref = dereferenceSceneEmotion(envelope);
    computed_scene_emotion[sceneId] = deref.status === 'DEREFERENCED' && typeof deref.value === 'string'
      ? deref.value
      : `NOT_DERIVABLE: ${deref.reason ?? 'scene emotion could not be dereferenced'}`;
  }

  return updateDocument<EpisodeDocumentContent>(
    'episodes',
    episode_id,
    expectedVersion,
    (current) => ({ ...current, computed_scene_emotion }),
    ['content.computed_scene_emotion'],
    authorship
  );
}

/**
 * PHASE-794: implements PHASE-793's selected next gap — closes ShotIntentAnnotation.
 * camera_choice_trace (Rule AU8) for the real, active persistence layer. For each of this
 * episode's own real shot_ids, resolves the shot (resolveShot, unmodified, existence-checked)
 * and dereferences its real {camera_id, composition_id} pair (dereferenceShotCameraChoice,
 * PHASE-794, sourceResolver.ts). A shot without a real pair is recorded as its own honest,
 * specific NOT_DERIVABLE string — never a guess. Same "no free-text content parameter" shape as
 * authorPersistedEpisodeSceneEmotion (PHASE-792): only episode_id/expectedVersion/authorship are
 * accepted, so Rule AU8's "never an authoring surface" is enforced structurally.
 */
export function authorPersistedEpisodeShotCameraChoice(
  episode_id: string,
  expectedVersion: number,
  authorship: AuthorshipProvenance
) {
  const existing = readDocumentRaw<EpisodeDocumentContent>('episodes', episode_id);
  if (!existing) throw new PersistenceError(`Cannot author computed_shot_camera_choice for episode "${episode_id}" — no document exists`);

  const computed_shot_camera_choice: Record<string, { camera_id: string; composition_id: string } | string> = {};
  for (const shotId of existing.content.shot_ids) {
    const envelope = resolveShot(existing.content.movie_id, shotId);
    const deref = dereferenceShotCameraChoice(envelope);
    computed_shot_camera_choice[shotId] = deref.status === 'DEREFERENCED' && deref.value && typeof deref.value === 'object'
      ? (deref.value as { camera_id: string; composition_id: string })
      : `NOT_DERIVABLE: ${deref.reason ?? 'shot camera choice could not be dereferenced'}`;
  }

  return updateDocument<EpisodeDocumentContent>(
    'episodes',
    episode_id,
    expectedVersion,
    (current) => ({ ...current, computed_shot_camera_choice }),
    ['content.computed_shot_camera_choice'],
    authorship
  );
}

// ---------------------------------------------------------------------------
// Open Callback Chain — create + resume (Rule PS4)
// ---------------------------------------------------------------------------

export interface OpenCallbackChainContent {
  chain_id: string;
  callback_type: string;
  open: boolean;
  legSpecs: { movie_id: string; scene_id: string; semantic_anchor_id: string; role: CallbackLegRole }[];
  // PHASE-082: optional real authored narrative_significance — additive only.
  narrative_significance?: string;
}

export function createOpenCallbackChain(chain_id: string, callback_type: string, plantSpec: { movie_id: string; scene_id: string; semantic_anchor_id: string }, authorship: AuthorshipProvenance) {
  const plantResolution = resolveScene(plantSpec.movie_id, plantSpec.scene_id);
  const content: OpenCallbackChainContent = { chain_id, callback_type, open: true, legSpecs: [{ ...plantSpec, role: 'plant' }] };
  const structural_snapshot = { aggregate_status: plantResolution.status === 'RESOLVED' ? 'PARTIAL' : 'NOT_DERIVABLE', leg_count: 1 };
  return createDocument('callback_chains', chain_id, content, structural_snapshot, {}, authorship);
}

/** Rule PS4: resume an open chain — reverify existing legs, resolve+append the new one, close if it's the payoff. */
export function extendOpenCallbackChain(
  chain_id: string,
  expectedVersion: number,
  newLegSpec: { movie_id: string; scene_id: string; semantic_anchor_id: string; role: CallbackLegRole },
  authorship: AuthorshipProvenance
) {
  const existing = readDocumentRaw<OpenCallbackChainContent>('callback_chains', chain_id);
  if (!existing) throw new PersistenceError(`Cannot extend chain "${chain_id}" — no document exists`);
  if (!existing.content.open) throw new PersistenceError(`Cannot extend chain "${chain_id}" — it is already closed (open: false)`);

  // Rule PS3: reverify every existing leg before trusting anything about this chain.
  const reverifiedLegs = existing.content.legSpecs.map((spec) => ({
    ...spec,
    resolution: resolveScene(spec.movie_id, spec.scene_id),
  }));
  const driftedLegs = reverifiedLegs.filter((l) => l.resolution.status !== 'RESOLVED');
  const drift = driftedLegs.length > 0 ? { detected: true, detail: `${driftedLegs.length} previously-resolved leg(s) no longer resolve on reload` } : { detected: false, detail: null };

  const newLeg: CallbackChainLeg = { ...newLegSpec, resolution: resolveScene(newLegSpec.movie_id, newLegSpec.scene_id) };
  const allLegs: CallbackChainLeg[] = [...reverifiedLegs.map((l) => ({ movie_id: l.movie_id, scene_id: l.scene_id, semantic_anchor_id: l.semantic_anchor_id, resolution: l.resolution, role: l.role })), newLeg];

  const willClose = newLegSpec.role === 'payoff';
  if (willClose) {
    // Full Rule CB1 validation now that the chain claims to be complete — reuses PHASE-058's
    // real buildCallbackChain unchanged, the same function an in-session chain would use.
    buildCallbackChain(chain_id, existing.content.callback_type, allLegs);
  }

  return updateDocument<OpenCallbackChainContent>(
    'callback_chains',
    chain_id,
    expectedVersion,
    (current) => ({ ...current, open: !willClose, legSpecs: [...current.legSpecs, newLegSpec] }),
    ['content.legSpecs', 'content.open'],
    authorship,
    drift
  );
}

/**
 * PHASE-082: author real narrative_significance onto an already-saved (typically closed)
 * callback chain — reuses authorCallbackChainSignificance (Rule CB2) unmodified: it rebuilds
 * the real CallbackChain from the document's own stored legSpecs (Rule PS3, reverifying every
 * leg's pointer first), then gates the authored text through that function's own logic.
 */
export function authorPersistedCallbackSignificance(chain_id: string, expectedVersion: number, significance: string, authorship: AuthorshipProvenance) {
  const existing = readDocumentRaw<OpenCallbackChainContent>('callback_chains', chain_id);
  if (!existing) throw new PersistenceError(`Cannot author significance for chain "${chain_id}" — no document exists`);
  const legs: CallbackChainLeg[] = existing.content.legSpecs.map((spec) => ({ ...spec, resolution: resolveScene(spec.movie_id, spec.scene_id) }));
  let authoredSig: string;
  try {
    const rebuilt = buildCallbackChain(chain_id, existing.content.callback_type, legs);
    authoredSig = authorCallbackChainSignificance(rebuilt, significance).narrative_significance;
  } catch (e: any) {
    throw new PersistenceError(`Cannot author significance for chain "${chain_id}": ${e.message}`);
  }
  return updateDocument<OpenCallbackChainContent>(
    'callback_chains',
    chain_id,
    expectedVersion,
    (current) => ({ ...current, narrative_significance: authoredSig }),
    ['content.narrative_significance'],
    authorship
  );
}

/**
 * PHASE-721: implements PHASE-070 Rule FR4 for CallbackChain — same pattern as
 * refreshSeasonSnapshot/refreshStorySnapshot (PHASE-071), applied to the one DocumentKind that
 * addendum never covered. Reuses, unmodified: resolveScene (reverifies every leg, Rule PS3) and
 * buildCallbackChain (Rule CB1) — the exact same function extendOpenCallbackChain already calls
 * on close to validate the chain, whose returned structural_resolution.aggregate_status was
 * previously computed but never persisted (PHASE-720's disclosed finding). Rule FR4a: content
 * (legSpecs/open/narrative_significance) is never touched by a refresh — only
 * structural_snapshot is recomputed and rewritten. Rule CB1's own precondition (>=2 legs,
 * first=plant, last=payoff) means this only accepts an already-closed chain, by design — a
 * still-open chain has no well-defined "structural resolution" to refresh to.
 */
export function refreshCallbackChainSnapshot(chain_id: string, expectedVersion: number, authorship: AuthorshipProvenance) {
  const existing = readDocumentRaw<OpenCallbackChainContent>('callback_chains', chain_id);
  if (!existing) throw new PersistenceError(`Cannot refresh callback chain "${chain_id}" — no document exists`);

  const legs: CallbackChainLeg[] = existing.content.legSpecs.map((spec) => ({ ...spec, resolution: resolveScene(spec.movie_id, spec.scene_id) }));
  let fresh: { aggregate_status: string; leg_count: number };
  try {
    const rebuilt = buildCallbackChain(chain_id, existing.content.callback_type, legs);
    fresh = { aggregate_status: rebuilt.structural_resolution.aggregate_status, leg_count: legs.length };
  } catch (e: any) {
    throw new PersistenceError(`Cannot refresh callback chain "${chain_id}": ${e.message}`);
  }

  const priorStatus = (existing.structural_snapshot as any)?.aggregate_status;
  const wasDrifted = priorStatus !== undefined && priorStatus !== fresh.aggregate_status;

  const updated = updateDocument<OpenCallbackChainContent>(
    'callback_chains',
    chain_id,
    expectedVersion,
    (current) => current, // Rule FR4a: content is never touched by a refresh
    ['structural_snapshot'], // Rule FR4a: the marker that distinguishes a resync from a real content change
    authorship,
    { detected: wasDrifted, detail: wasDrifted ? `refresh corrected stored aggregate_status from "${priorStatus}" to "${fresh.aggregate_status}"` : null }
  );
  updated.structural_snapshot = fresh;
  writeDocumentRaw('callback_chains', updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Character Arc — create + cumulative append (Rule PS5)
// ---------------------------------------------------------------------------

export interface CharacterArcDocumentContent {
  character_id: string;
  from_episode_id: string;
  to_episode_id: string;
  deltaSpecs: { episode_id: string; movie_id: string; sceneA: string; sceneB: string; field: string }[];
  // PHASE-082: optional real authored series-arc note — additive only.
  authored_note?: string;
  // PHASE-696: optional story-scope marker — additive only, absent on every CharacterArc
  // created before this phase. See characterArcObjectId below for what this actually changes
  // (the on-disk object_id, not character_id/resolver behavior, which stay untouched).
  story_id?: string;
  // PHASE-796: optional, COMPUTED-ONLY (never authored, Rule AU11 — "mechanical only") real
  // pose/emotion/gaze/interaction state-change description, keyed by "<sceneA>-><sceneB>" for
  // each (sceneA, sceneB) pair this phase computed it for. Additive only, absent on every
  // CharacterArc document created before this phase.
  computed_growth_delta?: Record<string, ComputedCharacterGrowthDelta>;
}

/**
 * PHASE-796: implements PHASE-795's design (Rule AU11, docs/architecture/StoryAuthoringBaseline.md)
 * — each field is either a mechanical "changed from <entry> to <exit>" / "unchanged: <value>"
 * description built ONLY from two already-real, already-dereferenced registry values (never an
 * interpretive or authored judgment), or a specific "NOT_DERIVABLE: <reason>" string when the
 * real field could not be dereferenced for both scenes.
 */
export interface ComputedCharacterGrowthDelta {
  pose_state_change: string;
  emotion_state_change: string;
  gaze_state_change: string;
  interaction_state_change: string;
}

/**
 * PHASE-696: CharacterArcRecord/CharacterArcDocumentContent were always keyed purely by
 * character_id (a global namespace) — PHASE-694 found this means a second Story reusing an
 * already-arced character_id would silently extend the FIRST story's arc, not create an
 * independent one. This helper is the minimal fix: when a caller supplies story_id, the
 * on-disk object_id becomes "<story_id>__<character_id>" instead of bare character_id.
 * Omitting story_id (every call site before this phase, and any future call that intends the
 * old global/shared-arc behavior) reproduces today's object_id exactly — zero behavior change
 * for CHAR-gonagi.json or any other existing document. character_id itself, and every
 * resolver call keyed on it (buildDeltaFromSpec's resolveCharacterGrowthField), is untouched
 * either way — only the STORAGE key becomes story-scoped, never the underlying real fact.
 */
function characterArcObjectId(character_id: string, story_id?: string): string {
  return story_id ? `${story_id}__${character_id}` : character_id;
}

function buildDeltaFromSpec(character_id: string, spec: CharacterArcDocumentContent['deltaSpecs'][number]): CharacterGrowthDeltaRecord {
  return {
    episode_id: spec.episode_id,
    character_id,
    entry_state_ref: { movie_id: spec.movie_id, scene_id: spec.sceneA, resolution: resolveCharacterGrowthField(spec.movie_id, character_id, spec.field) },
    exit_state_ref: { movie_id: spec.movie_id, scene_id: spec.sceneB, resolution: resolveCharacterGrowthField(spec.movie_id, character_id, spec.field) },
    delta: { pose_state_change: 'NOT_DERIVABLE: dereferencing gap', emotion_state_change: 'NOT_DERIVABLE: dereferencing gap', gaze_state_change: 'NOT_DERIVABLE: dereferencing gap', interaction_state_change: 'NOT_DERIVABLE: dereferencing gap' },
    derived_consistency_trend: 'NOT_DERIVABLE: dereferencing gap',
    authored_growth_note: 'NOT_DERIVABLE: no author-provided content exists yet for this field',
  };
}

export function createCharacterArc(character_id: string, firstDeltaSpec: CharacterArcDocumentContent['deltaSpecs'][number], authorship: AuthorshipProvenance, story_id?: string) {
  const delta = buildDeltaFromSpec(character_id, firstDeltaSpec);
  const arc = buildCharacterArcRecord(character_id, firstDeltaSpec.episode_id, firstDeltaSpec.episode_id, [delta]);
  const content: CharacterArcDocumentContent = { character_id, from_episode_id: firstDeltaSpec.episode_id, to_episode_id: firstDeltaSpec.episode_id, deltaSpecs: [firstDeltaSpec], ...(story_id ? { story_id } : {}) };
  return createDocument('character_arcs', characterArcObjectId(character_id, story_id), content, arc.structural_resolution, {}, authorship);
}

/**
 * Rule PS5: append one more delta to an existing arc, re-verifying every prior delta first
 * (Rule PS3). PHASE-696: story_id must match whatever the arc was created with (or be omitted
 * for a global/unscoped arc) — this function does not migrate an arc between scopes, only
 * locates the correct existing object_id via the same characterArcObjectId computation.
 */
export function appendCharacterGrowthDelta(character_id: string, expectedVersion: number, newDeltaSpec: CharacterArcDocumentContent['deltaSpecs'][number], authorship: AuthorshipProvenance, story_id?: string) {
  const objectId = characterArcObjectId(character_id, story_id);
  const existing = readDocumentRaw<CharacterArcDocumentContent>('character_arcs', objectId);
  if (!existing) throw new PersistenceError(`Cannot append to arc "${objectId}" — no document exists`);

  const allSpecs = [...existing.content.deltaSpecs, newDeltaSpec];
  const allDeltas = allSpecs.map((s) => buildDeltaFromSpec(character_id, s));
  const rebuiltArc = buildCharacterArcRecord(character_id, allSpecs[0].episode_id, newDeltaSpec.episode_id, allDeltas);

  const priorStatus = (existing.structural_snapshot as any)?.aggregate_status;
  const drift = priorStatus && priorStatus !== rebuiltArc.structural_resolution.aggregate_status
    ? { detected: true, detail: `arc aggregate_status moved from "${priorStatus}" to "${rebuiltArc.structural_resolution.aggregate_status}" on reload/append` }
    : { detected: false, detail: null };

  const updated = updateDocument<CharacterArcDocumentContent>(
    'character_arcs',
    objectId,
    expectedVersion,
    (current) => ({ ...current, to_episode_id: newDeltaSpec.episode_id, deltaSpecs: allSpecs }),
    ['content.deltaSpecs', 'content.to_episode_id'],
    authorship,
    drift
  );
  updated.structural_snapshot = rebuiltArc.structural_resolution;
  writeDocumentRaw('character_arcs', updated);
  return updated;
}

/**
 * PHASE-082: author a real series-arc note onto an already-saved CharacterArc — reuses
 * authorCharacterArcNote (Rule CA2) unmodified: rebuilds the real CharacterArcRecord from the
 * document's own stored deltaSpecs (Rule PS3), then gates the authored text through that
 * function's own logic (blocked only if the rebuilt arc's structural_resolution is entirely
 * NOT_DERIVABLE).
 */
export function authorPersistedCharacterArcNote(character_id: string, expectedVersion: number, note: string, authorship: AuthorshipProvenance, story_id?: string) {
  const objectId = characterArcObjectId(character_id, story_id);
  const existing = readDocumentRaw<CharacterArcDocumentContent>('character_arcs', objectId);
  if (!existing) throw new PersistenceError(`Cannot author arc note for "${objectId}" — no document exists`);
  const deltas = existing.content.deltaSpecs.map((s) => buildDeltaFromSpec(character_id, s));
  let authoredNote: string;
  try {
    const rebuilt = buildCharacterArcRecord(character_id, existing.content.from_episode_id, existing.content.to_episode_id, deltas);
    authoredNote = authorCharacterArcNote(rebuilt, note).authored_series_arc_note;
  } catch (e: any) {
    throw new PersistenceError(`Cannot author arc note for "${objectId}": ${e.message}`);
  }
  return updateDocument<CharacterArcDocumentContent>(
    'character_arcs',
    objectId,
    expectedVersion,
    (current) => ({ ...current, authored_note: authoredNote }),
    ['content.authored_note'],
    authorship
  );
}

/** Rule AU11 (mirrors Rule AU6/AU8): a purely mechanical, non-interpretive comparison of two already-real, already-dereferenced values — never a narrative judgment. */
function describeStateChange(entryValue: string, exitValue: string): string {
  return entryValue === exitValue ? `unchanged: ${entryValue}` : `changed from ${entryValue} to ${exitValue}`;
}

const GROWTH_DELTA_FIELD_MAP = {
  pose_state: 'pose_state_change',
  emotion_state: 'emotion_state_change',
  gaze_state: 'gaze_state_change',
  interaction_state: 'interaction_state_change',
} as const;

/**
 * PHASE-796: implements PHASE-795's selected next gap — closes CharacterGrowthDeltaRecord.delta
 * (Rule AU11) for the real, active persistence layer. For the named (sceneA, sceneB) pair —
 * which must already be one of this CharacterArc's own real deltaSpecs' scene pairs (never an
 * arbitrary caller-supplied pair) — dereferences all 4 real growth fields (pose_state,
 * emotion_state, gaze_state, interaction_state; PHASE-795's own disclosed refinement: all 4 are
 * attempted regardless of which single field the matching deltaSpec itself names, since the real
 * registry entries carry all 4 together) via resolveCharacterGrowthField +
 * dereferenceCharacterGrowthFieldAtScene (both reused entirely unmodified, PHASE-782's own proven
 * mechanism). Each field becomes a mechanical describeStateChange() description, or a specific
 * NOT_DERIVABLE reason if either scene's value could not be dereferenced. Takes no free-text
 * content parameter at all — Rule AU11's "never an authoring surface" is enforced structurally.
 */
export function authorPersistedCharacterGrowthDeltaAtScenes(
  character_id: string,
  expectedVersion: number,
  sceneA: string,
  sceneB: string,
  authorship: AuthorshipProvenance,
  story_id?: string
) {
  const objectId = characterArcObjectId(character_id, story_id);
  const existing = readDocumentRaw<CharacterArcDocumentContent>('character_arcs', objectId);
  if (!existing) throw new PersistenceError(`Cannot author computed_growth_delta for "${objectId}" — no document exists`);

  const matchingSpec = existing.content.deltaSpecs.find((s) => s.sceneA === sceneA && s.sceneB === sceneB);
  if (!matchingSpec) {
    throw new PersistenceError(`Cannot author computed_growth_delta for "${objectId}" — (${sceneA}, ${sceneB}) is not one of this arc's own real deltaSpecs' scene pairs`);
  }
  const movieId = matchingSpec.movie_id;

  const delta = {} as ComputedCharacterGrowthDelta;
  for (const [field, outKey] of Object.entries(GROWTH_DELTA_FIELD_MAP) as [keyof typeof GROWTH_DELTA_FIELD_MAP, keyof ComputedCharacterGrowthDelta][]) {
    const envelope = resolveCharacterGrowthField(movieId, character_id, field);
    const entry = dereferenceCharacterGrowthFieldAtScene(envelope, sceneA);
    const exit = dereferenceCharacterGrowthFieldAtScene(envelope, sceneB);
    delta[outKey] = entry.status === 'DEREFERENCED' && exit.status === 'DEREFERENCED' && typeof entry.value === 'string' && typeof exit.value === 'string'
      ? describeStateChange(entry.value, exit.value)
      : `NOT_DERIVABLE: "${field}" could not be dereferenced for both entry (${sceneA}) and exit (${sceneB}) scenes`;
  }

  const sceneKey = `${sceneA}->${sceneB}`;
  return updateDocument<CharacterArcDocumentContent>(
    'character_arcs',
    objectId,
    expectedVersion,
    (current) => ({ ...current, computed_growth_delta: { ...(current.computed_growth_delta ?? {}), [sceneKey]: delta } }),
    ['content.computed_growth_delta'],
    authorship
  );
}

// ---------------------------------------------------------------------------
// Relationship Continuity — create + cumulative append (PHASE-065, Rule PS6 pattern)
// ---------------------------------------------------------------------------

export interface RelationshipDocumentContent {
  character_ids: [string, string];
  from_episode_id: string;
  to_episode_id: string;
  sceneSpecs: { movie_id: string; scene_id: string }[];
  // PHASE-082: optional real authored relationship stages/note — additive only.
  authored?: { relationship_stage_from: string; relationship_stage_to: string; authored_relationship_note: string };
  // PHASE-696: optional story-scope marker — additive only, absent on every relationship
  // created before this phase. Mirrors CharacterArcDocumentContent.story_id.
  story_id?: string;
}

/**
 * PHASE-079: canonical (character-order-independent) pair form — sorted, so (A, B) and
 * (B, A) always produce the exact same pair and the exact same downstream object ID.
 * Closes the gap PHASE-077 §8 found and PHASE-078 deliberately left open: reversed
 * character order previously produced two distinct, disconnected documents.
 */
function canonicalCharacterIdPair(character_ids: [string, string]): [string, string] {
  const sorted = [...character_ids].sort();
  return [sorted[0], sorted[1]];
}

/**
 * PHASE-696: optional story_id prefix, same rationale and same zero-impact guarantee as
 * characterArcObjectId — omitted, this reproduces the exact PHASE-079 canonical id; supplied,
 * it produces a distinct, story-scoped id that cannot collide with any existing unscoped
 * relationship document.
 */
function relationshipCanonicalId(character_ids: [string, string], story_id?: string): string {
  const [a, b] = canonicalCharacterIdPair(character_ids);
  const base = `${a}__${b}`;
  return story_id ? `${story_id}__${base}` : base;
}

/**
 * PHASE-079: the one other on-disk name this exact pair could ever have used — the reverse
 * of the canonical (sorted) order. Only two orderings exist for a 2-element pair, so
 * canonical + this legacy form together cover every name a document for this pair could
 * possibly be stored under, including ones created before this phase existed.
 * PHASE-696: story_id-scoped the same way as relationshipCanonicalId.
 */
function relationshipLegacyId(character_ids: [string, string], story_id?: string): string {
  const [a, b] = canonicalCharacterIdPair(character_ids);
  const base = `${b}__${a}`;
  return story_id ? `${story_id}__${base}` : base;
}

/**
 * PHASE-079: which object ID does an existing relationship document for this pair (if any)
 * actually live under — the canonical name, or a pre-PHASE-079 record still sitting under
 * the legacy (reverse) name? Pure lookup, never writes, never migrates a file on disk.
 * Returns the canonical name when no document exists under either name yet (i.e. where a
 * brand-new relationship for this pair will be created).
 * PHASE-696: when story_id is supplied, only the story-scoped canonical/legacy forms are
 * checked — a scoped lookup deliberately never falls back to an unscoped (cross-story) match,
 * since that would silently reattach a new Story's relationship onto an older, unrelated one.
 */
function resolveRelationshipObjectId(character_ids: [string, string], story_id?: string): string {
  const canonical = relationshipCanonicalId(character_ids, story_id);
  if (readDocumentRaw('relationships', canonical)) return canonical;
  const legacy = relationshipLegacyId(character_ids, story_id);
  if (legacy !== canonical && readDocumentRaw('relationships', legacy)) return legacy;
  return canonical;
}

export function createRelationshipContinuity(
  character_ids: [string, string],
  from_episode_id: string,
  to_episode_id: string,
  sceneSpecs: { movie_id: string; scene_id: string }[],
  authorship: AuthorshipProvenance,
  story_id?: string
) {
  // PHASE-079: order-independent duplicate guard — a relationship already stored under
  // either this pair's canonical or legacy ordering must never get a second, disconnected
  // document just because the characters happened to be passed in the opposite order here.
  const existingId = resolveRelationshipObjectId(character_ids, story_id);
  if (readDocumentRaw('relationships', existingId)) {
    throw new PersistenceError(
      `Cannot create relationship for [${character_ids.join(', ')}] — a document already exists as "${existingId}" (character order does not matter; use appendRelationshipSupportingScene to extend it instead)`
    );
  }
  const canonicalIds = canonicalCharacterIdPair(character_ids);
  const supporting: RelationshipSupportingScene[] = sceneSpecs.map((s) => ({ scene_id: s.scene_id, resolution: resolveScene(s.movie_id, s.scene_id) }));
  const record = buildRelationshipContinuityRecord(canonicalIds, from_episode_id, to_episode_id, supporting);
  // content.character_ids is stored in the SAME canonical order as the object ID, so the
  // two always agree — a caller can never observe a document whose stored character_ids
  // order disagrees with how it's actually named on disk.
  const content: RelationshipDocumentContent = { character_ids: canonicalIds, from_episode_id, to_episode_id, sceneSpecs, ...(story_id ? { story_id } : {}) };
  return createDocument('relationships', relationshipCanonicalId(character_ids, story_id), content, record.structural_resolution, {}, authorship);
}

/** Rule PS6: append one more supporting scene, re-verifying every prior one first (Rule PS3). */
export function appendRelationshipSupportingScene(
  character_ids: [string, string],
  expectedVersion: number,
  newSceneSpec: { movie_id: string; scene_id: string },
  newToEpisodeId: string,
  authorship: AuthorshipProvenance,
  story_id?: string
) {
  // PHASE-079: resolve to wherever this pair's document actually lives (its canonical name,
  // or a pre-PHASE-079 legacy name) — appending with the characters in the reverse order
  // from how the relationship was originally created must reach the SAME document, not
  // silently create a second one. PHASE-696: scoped to story_id when supplied (finding_2).
  const objectId = resolveRelationshipObjectId(character_ids, story_id);
  const existing = readDocumentRaw<RelationshipDocumentContent>('relationships', objectId);
  if (!existing) throw new PersistenceError(`Cannot append to relationship [${character_ids.join(', ')}] — no document exists (would be object id "${objectId}")`);

  const allSpecs = [...existing.content.sceneSpecs, newSceneSpec];
  const supporting: RelationshipSupportingScene[] = allSpecs.map((s) => ({ scene_id: s.scene_id, resolution: resolveScene(s.movie_id, s.scene_id) }));
  // Rebuild using the DOCUMENT's own stored character_ids order, not necessarily this call's
  // — the object identity and pair order are owned by the document, never redefined by
  // whichever order a later append call happens to pass.
  const rebuilt = buildRelationshipContinuityRecord(existing.content.character_ids, existing.content.from_episode_id, newToEpisodeId, supporting);

  const priorStatus = (existing.structural_snapshot as any)?.aggregate_status;
  const drift = priorStatus && priorStatus !== rebuilt.structural_resolution.aggregate_status
    ? { detected: true, detail: `relationship aggregate_status moved from "${priorStatus}" to "${rebuilt.structural_resolution.aggregate_status}" on reload/append` }
    : { detected: false, detail: null };

  const updated = updateDocument<RelationshipDocumentContent>(
    'relationships',
    objectId,
    expectedVersion,
    (current) => ({ ...current, to_episode_id: newToEpisodeId, sceneSpecs: allSpecs }),
    ['content.sceneSpecs', 'content.to_episode_id'],
    authorship,
    drift
  );
  updated.structural_snapshot = rebuilt.structural_resolution;
  writeDocumentRaw('relationships', updated);
  return updated;
}

/**
 * PHASE-082: author real relationship stages + note onto an already-saved relationship —
 * reuses authorRelationshipStages (Rule RC-adjacent) unmodified: rebuilds the real
 * RelationshipContinuityRecord from the document's own stored sceneSpecs (Rule PS3), then
 * gates the authored text through that function's own logic. `character_ids` may be passed
 * in either order — resolved via resolveRelationshipObjectId (PHASE-079), same as every other
 * relationship function in this module.
 */
export function authorPersistedRelationshipStages(
  character_ids: [string, string],
  expectedVersion: number,
  stages: { from: string; to: string; note: string },
  authorship: AuthorshipProvenance,
  story_id?: string
) {
  const objectId = resolveRelationshipObjectId(character_ids, story_id);
  const existing = readDocumentRaw<RelationshipDocumentContent>('relationships', objectId);
  if (!existing) throw new PersistenceError(`Cannot author relationship stages for [${character_ids.join(', ')}] — no document exists`);
  const supporting: RelationshipSupportingScene[] = existing.content.sceneSpecs.map((s) => ({ scene_id: s.scene_id, resolution: resolveScene(s.movie_id, s.scene_id) }));
  let authoredResult: { relationship_stage_from: string; relationship_stage_to: string; authored_relationship_note: string };
  try {
    const rebuilt = buildRelationshipContinuityRecord(existing.content.character_ids, existing.content.from_episode_id, existing.content.to_episode_id, supporting);
    const staged = authorRelationshipStages(rebuilt, stages.from, stages.to, stages.note);
    authoredResult = {
      relationship_stage_from: staged.relationship_stage_from,
      relationship_stage_to: staged.relationship_stage_to,
      authored_relationship_note: staged.authored_relationship_note,
    };
  } catch (e: any) {
    throw new PersistenceError(`Cannot author relationship stages for [${character_ids.join(', ')}]: ${e.message}`);
  }
  return updateDocument<RelationshipDocumentContent>(
    'relationships',
    objectId,
    expectedVersion,
    (current) => ({ ...current, authored: authoredResult }),
    ['content.authored'],
    authorship
  );
}

// ---------------------------------------------------------------------------
// Season persistence — rolls up already-persisted Episode documents
// ---------------------------------------------------------------------------

export interface SeasonDocumentContent {
  season_scenario_id: string;
  episode_ids: string[]; // must each reference an already-persisted episode document
  // PHASE-082: optional real authored season arc — additive only.
  authored_arc?: { main_arc: string; theme_arc: string };
}

/** PHASE-082: shared "is there anything real to author about yet" gate for Season/Story narrative fields — mirrors seriesContinuityContracts.ts's private authorOnStructural, restated locally since that helper isn't exported. */
function assertAuthorableAggregate(aggregate_status: string | undefined, fieldLabel: string): void {
  if (aggregate_status === 'NOT_DERIVABLE') {
    throw new PersistenceError(`Cannot author "${fieldLabel}" — aggregate_status is NOT_DERIVABLE (nothing real to write about yet)`);
  }
}

/** PHASE-082: shared sentinel-collision/non-empty guard for Season/Story narrative fields — mirrors the same check in storyAuthoringSampleV1.ts/seriesContinuityContracts.ts, restated locally since neither exports it. */
function assertRealAuthoredText(value: string, fieldLabel: string): void {
  if (value.startsWith('NOT_DERIVABLE:')) {
    throw new PersistenceError(`"${fieldLabel}" collides with the NOT_DERIVABLE sentinel — not real authored text: "${value}"`);
  }
  if (value.trim().length === 0) {
    throw new PersistenceError(`"${fieldLabel}" is empty — not real authored text`);
  }
}

function loadEpisodeResultForSeason(episode_id: string): { result: EpisodeResult; driftDetected: boolean; driftDetail: string | null } {
  const loaded = loadEpisodeWithReverify(episode_id);
  if (!loaded) throw new PersistenceError(`Cannot build/reverify a season — referenced episode "${episode_id}" has no persisted document`);
  // loaded.freshResolution already carries episode_id (resolveEpisode's own return shape) — no need to re-add it.
  return { result: loaded.freshResolution as EpisodeResult, driftDetected: loaded.driftDetected, driftDetail: loaded.driftDetail };
}

export function saveSeasonScenario(season_scenario_id: string, episode_ids: string[], provenance: Record<string, AuthorshipProvenance>, authorship: AuthorshipProvenance) {
  const loadedEpisodes = episode_ids.map(loadEpisodeResultForSeason);
  const seasonResolution = resolveSeasonScenario(season_scenario_id, loadedEpisodes.map((l) => l.result));
  const content: SeasonDocumentContent = { season_scenario_id, episode_ids };
  return createDocument('seasons', season_scenario_id, content, seasonResolution, provenance, authorship);
}

/** Rule PS3, one tier up: reverify every referenced Episode (which itself reverifies its Scene/Shot pointers) before trusting the season's status. */
export function loadSeasonWithReverify(season_scenario_id: string) {
  const doc = readDocumentRaw<SeasonDocumentContent>('seasons', season_scenario_id);
  if (!doc) return null;
  const loadedEpisodes = doc.content.episode_ids.map(loadEpisodeResultForSeason);
  const fresh = resolveSeasonScenario(season_scenario_id, loadedEpisodes.map((l) => l.result));
  const storedStatus = (doc.structural_snapshot as any)?.aggregate_status;
  const underlyingDrift = loadedEpisodes.filter((l) => l.driftDetected);
  const driftDetected = storedStatus !== fresh.aggregate_status || underlyingDrift.length > 0;
  const driftDetail = driftDetected
    ? `season status stored="${storedStatus}" fresh="${fresh.aggregate_status}"${underlyingDrift.length ? `; underlying episode drift: ${underlyingDrift.map((l) => l.driftDetail).join('; ')}` : ''}`
    : null;
  return { doc, freshResolution: fresh, driftDetected, driftDetail };
}

/**
 * PHASE-068: append one more episode to an already-persisted Season, closing the gap
 * PHASE-067 found (Season had create-only persistence, unlike CallbackChain/CharacterArc/
 * Relationship). Follows the exact same pattern as appendCharacterGrowthDelta/
 * appendRelationshipSupportingScene: reverify every existing referenced episode (Rule PS3,
 * reusing loadEpisodeResultForSeason unchanged), resolve+include the new one, recompute the
 * season's structural_snapshot via the unmodified resolveSeasonScenario, and write under
 * Rule PS8 optimistic concurrency. Drift in ANY referenced episode (old or new) is detected
 * here and surfaces in this season's own change_history entry — and, since loadStoryWithReverify
 * already re-derives its seasons via loadSeasonWithReverify on every call, that drift is
 * automatically visible to any Story built on top of this season on its next reload, with no
 * separate propagation step needed.
 */
export function appendEpisodeToSeason(season_scenario_id: string, expectedVersion: number, newEpisodeId: string, authorship: AuthorshipProvenance) {
  const existing = readDocumentRaw<SeasonDocumentContent>('seasons', season_scenario_id);
  if (!existing) throw new PersistenceError(`Cannot append to season "${season_scenario_id}" — no document exists (use saveSeasonScenario to create it first)`);
  if (existing.content.episode_ids.includes(newEpisodeId)) {
    throw new PersistenceError(`Cannot append episode "${newEpisodeId}" to season "${season_scenario_id}" — it is already referenced by this season`);
  }

  const allEpisodeIds = [...existing.content.episode_ids, newEpisodeId];
  const loadedEpisodes = allEpisodeIds.map(loadEpisodeResultForSeason); // Rule PS3, applied to every episode, old and new
  const rebuiltSeason = resolveSeasonScenario(season_scenario_id, loadedEpisodes.map((l) => l.result));

  const priorStatus = (existing.structural_snapshot as any)?.aggregate_status;
  const underlyingDrift = loadedEpisodes.filter((l) => l.driftDetected);
  const drift = (priorStatus !== undefined && priorStatus !== rebuiltSeason.aggregate_status) || underlyingDrift.length > 0
    ? {
        detected: true,
        detail: `season aggregate_status moved from "${priorStatus}" to "${rebuiltSeason.aggregate_status}"${underlyingDrift.length ? `; underlying episode drift: ${underlyingDrift.map((l) => l.driftDetail).join('; ')}` : ''}`,
      }
    : { detected: false, detail: null };

  const updated = updateDocument<SeasonDocumentContent>(
    'seasons',
    season_scenario_id,
    expectedVersion,
    (current) => ({ ...current, episode_ids: allEpisodeIds }),
    ['content.episode_ids'],
    authorship,
    drift
  );
  updated.structural_snapshot = rebuiltSeason;
  writeDocumentRaw('seasons', updated);
  return updated;
}

/**
 * PHASE-071: implements PHASE-070 Rule FR4 — an explicit, non-cascading resync of a Season's
 * stored structural_snapshot to match current reality. Rule FR4a: content is NEVER touched
 * (the mutate closure is the identity function); only structural_snapshot changes, and the
 * change_history entry's changed_fields is exactly ["structural_snapshot"], never
 * ["content.episode_ids"] or similar, so a future auditor can tell a resync apart from a real
 * content change at a glance. Rule FR4b (not enforced here, since it's a caller discipline, not
 * something this function itself can check): nothing else in this module calls this function —
 * it is only ever invoked explicitly, never as a side effect of appendEpisodeToSeason or any
 * other write.
 */
export function refreshSeasonSnapshot(season_scenario_id: string, expectedVersion: number, authorship: AuthorshipProvenance) {
  const existing = readDocumentRaw<SeasonDocumentContent>('seasons', season_scenario_id);
  if (!existing) throw new PersistenceError(`Cannot refresh season "${season_scenario_id}" — no document exists`);

  const loadedEpisodes = existing.content.episode_ids.map(loadEpisodeResultForSeason); // Rule PS3, same as every other season operation
  const fresh = resolveSeasonScenario(season_scenario_id, loadedEpisodes.map((l) => l.result));

  // Rule FR2: was this season DRIFTED (per the formal definition) going into this refresh?
  // Recorded for audit purposes — this refresh's own job is to correct exactly this.
  const priorStatus = (existing.structural_snapshot as any)?.aggregate_status;
  const wasDrifted = priorStatus !== undefined && priorStatus !== fresh.aggregate_status;

  const updated = updateDocument<SeasonDocumentContent>(
    'seasons',
    season_scenario_id,
    expectedVersion,
    (current) => current, // Rule FR4a: content is never touched by a refresh
    ['structural_snapshot'], // Rule FR4a: the marker that distinguishes a resync from a real content change
    authorship,
    { detected: wasDrifted, detail: wasDrifted ? `refresh corrected stored aggregate_status from "${priorStatus}" to "${fresh.aggregate_status}"` : null }
  );
  updated.structural_snapshot = fresh;
  writeDocumentRaw('seasons', updated);
  return updated;
}

/**
 * PHASE-082: author a real season_arc onto an already-saved Season. Gated on the season's OWN
 * currently-stored aggregate_status (never NOT_DERIVABLE) — content and structural axes stay
 * separate (Rule TA1): authoring this never touches structural_snapshot.
 */
export function authorSeasonArc(season_scenario_id: string, expectedVersion: number, arc: { main_arc: string; theme_arc: string }, authorship: AuthorshipProvenance) {
  const existing = readDocumentRaw<SeasonDocumentContent>('seasons', season_scenario_id);
  if (!existing) throw new PersistenceError(`Cannot author season_arc for "${season_scenario_id}" — no document exists`);
  assertAuthorableAggregate((existing.structural_snapshot as any)?.aggregate_status, 'season_arc');
  assertRealAuthoredText(arc.main_arc, 'season_arc.main_arc');
  assertRealAuthoredText(arc.theme_arc, 'season_arc.theme_arc');
  return updateDocument<SeasonDocumentContent>(
    'seasons',
    season_scenario_id,
    expectedVersion,
    (current) => ({ ...current, authored_arc: arc }),
    ['content.authored_arc'],
    authorship
  );
}

/**
 * PHASE-740: the Season-persistence counterpart of authorPersistedCarryoverCheckWithDependency
 * (PHASE-735) -- additive sibling to authorSeasonArc (untouched), writing content.authored_arc
 * AND dependency_ledger.content.authored_arc atomically, in one change_history entry (Rule DB5).
 * Reuses authorSeasonArc's own gating (assertAuthorableAggregate/assertRealAuthoredText) by
 * calling it internally, rather than duplicating that logic.
 */
export function authorSeasonArcWithDependency(
  season_scenario_id: string,
  expectedVersion: number,
  arc: { main_arc: string; theme_arc: string },
  dependencies: ContentDependency[],
  authorship: AuthorshipProvenance
) {
  const existing = readDocumentRaw<SeasonDocumentContent>('seasons', season_scenario_id);
  if (!existing) throw new PersistenceError(`Cannot author season_arc for "${season_scenario_id}" — no document exists`);
  assertAuthorableAggregate((existing.structural_snapshot as any)?.aggregate_status, 'season_arc');
  assertRealAuthoredText(arc.main_arc, 'season_arc.main_arc');
  assertRealAuthoredText(arc.theme_arc, 'season_arc.theme_arc');
  const updated = updateDocument<SeasonDocumentContent>(
    'seasons',
    season_scenario_id,
    expectedVersion,
    (current) => ({ ...current, authored_arc: arc }),
    ['content.authored_arc', 'dependency_ledger.content.authored_arc'],
    authorship
  );
  updated.dependency_ledger = { ...(updated.dependency_ledger ?? {}), 'content.authored_arc': dependencies };
  writeDocumentRaw('seasons', updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Story persistence — rolls up already-persisted Season documents
// ---------------------------------------------------------------------------

export interface StoryDocumentContent {
  story_id: string;
  season_scenario_ids: string[];
  // PHASE-082: optional real authored story bible fields — additive only.
  authored_bible?: { title: string; synopsis: string; themes: string[] };
}

function loadSeasonResultForStory(season_scenario_id: string): { result: SeasonScenarioResult; driftDetected: boolean; driftDetail: string | null } {
  const loaded = loadSeasonWithReverify(season_scenario_id);
  if (!loaded) throw new PersistenceError(`Cannot build/reverify a story — referenced season "${season_scenario_id}" has no persisted document`);
  // loaded.freshResolution already carries season_scenario_id (resolveSeasonScenario's own return shape).
  return { result: loaded.freshResolution as SeasonScenarioResult, driftDetected: loaded.driftDetected, driftDetail: loaded.driftDetail };
}

export function saveStoryBible(story_id: string, season_scenario_ids: string[], provenance: Record<string, AuthorshipProvenance>, authorship: AuthorshipProvenance) {
  const loadedSeasons = season_scenario_ids.map(loadSeasonResultForStory);
  const storyResolution = resolveStoryBible(story_id, loadedSeasons.map((l) => l.result));
  const content: StoryDocumentContent = { story_id, season_scenario_ids };
  return createDocument('stories', story_id, content, storyResolution, provenance, authorship);
}

/** Rule PS3, two tiers up: reverify every referenced Season (which reverifies every Episode, which reverifies every Scene/Shot). */
export function loadStoryWithReverify(story_id: string) {
  const doc = readDocumentRaw<StoryDocumentContent>('stories', story_id);
  if (!doc) return null;
  const loadedSeasons = doc.content.season_scenario_ids.map(loadSeasonResultForStory);
  const fresh = resolveStoryBible(story_id, loadedSeasons.map((l) => l.result));
  const storedStatus = (doc.structural_snapshot as any)?.aggregate_status;
  const underlyingDrift = loadedSeasons.filter((l) => l.driftDetected);
  const driftDetected = storedStatus !== fresh.aggregate_status || underlyingDrift.length > 0;
  const driftDetail = driftDetected
    ? `story status stored="${storedStatus}" fresh="${fresh.aggregate_status}"${underlyingDrift.length ? `; underlying season drift: ${underlyingDrift.map((l) => l.driftDetail).join('; ')}` : ''}`
    : null;
  return { doc, freshResolution: fresh, driftDetected, driftDetail };
}

/**
 * PHASE-068: append one more season to an already-persisted Story — same pattern as
 * appendEpisodeToSeason, one tier up. Reverifies every referenced season (which itself
 * reverifies every episode, which reverifies every scene/shot — the full 3-tier chain),
 * recomputes via the unmodified resolveStoryBible, writes under Rule PS8.
 */
export function appendSeasonToStory(story_id: string, expectedVersion: number, newSeasonScenarioId: string, authorship: AuthorshipProvenance) {
  const existing = readDocumentRaw<StoryDocumentContent>('stories', story_id);
  if (!existing) throw new PersistenceError(`Cannot append to story "${story_id}" — no document exists (use saveStoryBible to create it first)`);
  if (existing.content.season_scenario_ids.includes(newSeasonScenarioId)) {
    throw new PersistenceError(`Cannot append season "${newSeasonScenarioId}" to story "${story_id}" — it is already referenced by this story`);
  }

  const allSeasonIds = [...existing.content.season_scenario_ids, newSeasonScenarioId];
  const loadedSeasons = allSeasonIds.map(loadSeasonResultForStory); // Rule PS3, transitively through every season and episode
  const rebuiltStory = resolveStoryBible(story_id, loadedSeasons.map((l) => l.result));

  const priorStatus = (existing.structural_snapshot as any)?.aggregate_status;
  const underlyingDrift = loadedSeasons.filter((l) => l.driftDetected);
  const drift = (priorStatus !== undefined && priorStatus !== rebuiltStory.aggregate_status) || underlyingDrift.length > 0
    ? {
        detected: true,
        detail: `story aggregate_status moved from "${priorStatus}" to "${rebuiltStory.aggregate_status}"${underlyingDrift.length ? `; underlying season drift: ${underlyingDrift.map((l) => l.driftDetail).join('; ')}` : ''}`,
      }
    : { detected: false, detail: null };

  const updated = updateDocument<StoryDocumentContent>(
    'stories',
    story_id,
    expectedVersion,
    (current) => ({ ...current, season_scenario_ids: allSeasonIds }),
    ['content.season_scenario_ids'],
    authorship,
    drift
  );
  updated.structural_snapshot = rebuiltStory;
  writeDocumentRaw('stories', updated);
  return updated;
}

/**
 * PHASE-071: implements PHASE-070 Rule FR4 for Story — same pattern as
 * refreshSeasonSnapshot, one tier up. Reverifies every referenced season (which reverifies
 * every episode, full-depth per Rule FR5), recomputes via the unmodified resolveStoryBible,
 * and rewrites ONLY structural_snapshot. This is the operation that would have cleared the
 * exact staleness PHASE-069 §7 found (story_069's stored snapshot never catching up with
 * season_069_2's real change) — had it existed then. It did not exist then; it exists now,
 * and only as an explicit call, never automatically.
 */
export function refreshStorySnapshot(story_id: string, expectedVersion: number, authorship: AuthorshipProvenance) {
  const existing = readDocumentRaw<StoryDocumentContent>('stories', story_id);
  if (!existing) throw new PersistenceError(`Cannot refresh story "${story_id}" — no document exists`);

  const loadedSeasons = existing.content.season_scenario_ids.map(loadSeasonResultForStory); // Rule PS3, transitively through every season and episode
  const fresh = resolveStoryBible(story_id, loadedSeasons.map((l) => l.result));

  const priorStatus = (existing.structural_snapshot as any)?.aggregate_status;
  const wasDrifted = priorStatus !== undefined && priorStatus !== fresh.aggregate_status;

  const updated = updateDocument<StoryDocumentContent>(
    'stories',
    story_id,
    expectedVersion,
    (current) => current, // Rule FR4a: content is never touched by a refresh
    ['structural_snapshot'],
    authorship,
    { detected: wasDrifted, detail: wasDrifted ? `refresh corrected stored aggregate_status from "${priorStatus}" to "${fresh.aggregate_status}"` : null }
  );
  updated.structural_snapshot = fresh;
  writeDocumentRaw('stories', updated);
  return updated;
}

/**
 * PHASE-082: author a real title/synopsis/themes onto an already-saved Story. Same gating
 * pattern as authorSeasonArc — blocked only if the story's own stored aggregate_status is
 * NOT_DERIVABLE; never touches structural_snapshot (Rule TA1).
 */
export function authorStoryNarrative(story_id: string, expectedVersion: number, bible: { title: string; synopsis: string; themes: string[] }, authorship: AuthorshipProvenance) {
  const existing = readDocumentRaw<StoryDocumentContent>('stories', story_id);
  if (!existing) throw new PersistenceError(`Cannot author narrative for story "${story_id}" — no document exists`);
  assertAuthorableAggregate((existing.structural_snapshot as any)?.aggregate_status, 'story bible');
  assertRealAuthoredText(bible.title, 'title');
  assertRealAuthoredText(bible.synopsis, 'synopsis');
  bible.themes.forEach((t, i) => assertRealAuthoredText(t, `themes[${i}]`));
  return updateDocument<StoryDocumentContent>(
    'stories',
    story_id,
    expectedVersion,
    (current) => ({ ...current, authored_bible: bible }),
    ['content.authored_bible'],
    authorship
  );
}

// ---------------------------------------------------------------------------
// Season Carryover persistence — connects two already-persisted Season documents
// ---------------------------------------------------------------------------

function carryoverObjectId(from: string, to: string): string {
  return `${from}__${to}`;
}

export function saveSeasonCarryover(from_season_scenario_id: string, to_season_scenario_id: string, provenance: Record<string, AuthorshipProvenance>, authorship: AuthorshipProvenance) {
  const fromLoaded = loadSeasonWithReverify(from_season_scenario_id);
  const toLoaded = loadSeasonWithReverify(to_season_scenario_id);
  if (!fromLoaded || !toLoaded) throw new PersistenceError(`Cannot build SeasonCarryoverRecord — one or both seasons ("${from_season_scenario_id}", "${to_season_scenario_id}") have no persisted document`);
  // Rule SC1 (PHASE-057/058, reused unchanged): buildSeasonCarryoverRecord itself throws if
  // either season isn't fully RESOLVED — this persistence layer adds no separate gate for that.
  const carryover: SeasonCarryoverRecord = buildSeasonCarryoverRecord(from_season_scenario_id, fromLoaded.freshResolution, to_season_scenario_id, toLoaded.freshResolution);
  const objectId = carryoverObjectId(from_season_scenario_id, to_season_scenario_id);
  const structural_snapshot = { from_status: fromLoaded.freshResolution.aggregate_status, to_status: toLoaded.freshResolution.aggregate_status };
  return createDocument('season_carryovers', objectId, carryover, structural_snapshot, provenance, authorship);
}

/** Rule PS3 + Rule SC2 (reused): reverify both seasons, then author one carryover_checks field. */
export function authorPersistedCarryoverCheck(
  from_season_scenario_id: string,
  to_season_scenario_id: string,
  expectedVersion: number,
  field: 'season_to_season_consistency' | 'character_growth_carryover' | 'relationship_carryover' | 'series_arc_continuity',
  value: string,
  authorship: AuthorshipProvenance
) {
  const objectId = carryoverObjectId(from_season_scenario_id, to_season_scenario_id);
  const existing = readDocumentRaw<SeasonCarryoverRecord>('season_carryovers', objectId);
  if (!existing) throw new PersistenceError(`Cannot author carryover check on "${objectId}" — no document exists`);

  const fromLoaded = loadSeasonWithReverify(from_season_scenario_id);
  const toLoaded = loadSeasonWithReverify(to_season_scenario_id);
  const drift = fromLoaded && toLoaded && (fromLoaded.driftDetected || toLoaded.driftDetected)
    ? { detected: true, detail: 'one or both underlying seasons drifted since this carryover record was last saved' }
    : { detected: false, detail: null };

  return updateDocument<SeasonCarryoverRecord>(
    'season_carryovers',
    objectId,
    expectedVersion,
    (current) => authorCarryoverCheck(current, field, value),
    [`content.carryover_checks.${field}`],
    authorship,
    drift
  );
}

/**
 * PHASE-762: the missing persistence wrapper for authorSeriesAnchorRelationshipStage
 * (seriesContinuityContracts.ts, Rule SC3) — disclosed as an open gap since PHASE-702,
 * re-confirmed PHASE-715, identified as the next core gap PHASE-761. Mirrors
 * authorPersistedCarryoverCheck's own shape exactly (reverify both seasons, compute drift,
 * updateDocument with a single changed_fields entry) — no new rule, vocabulary, or dependency
 * ledger involved; authorSeriesAnchorRelationshipStage's own Rule SC3 gate
 * (assertNotSentinelCollision) is reused unchanged, not duplicated here.
 */
export function authorPersistedSeriesAnchorRelationshipStage(
  from_season_scenario_id: string,
  to_season_scenario_id: string,
  expectedVersion: number,
  stage: string,
  authorship: AuthorshipProvenance
) {
  const objectId = carryoverObjectId(from_season_scenario_id, to_season_scenario_id);
  const existing = readDocumentRaw<SeasonCarryoverRecord>('season_carryovers', objectId);
  if (!existing) throw new PersistenceError(`Cannot author series_anchor.relationship_stage on "${objectId}" — no document exists`);

  const fromLoaded = loadSeasonWithReverify(from_season_scenario_id);
  const toLoaded = loadSeasonWithReverify(to_season_scenario_id);
  const drift = fromLoaded && toLoaded && (fromLoaded.driftDetected || toLoaded.driftDetected)
    ? { detected: true, detail: 'one or both underlying seasons drifted since this carryover record was last saved' }
    : { detected: false, detail: null };

  return updateDocument<SeasonCarryoverRecord>(
    'season_carryovers',
    objectId,
    expectedVersion,
    (current) => authorSeriesAnchorRelationshipStage(current, stage),
    ['content.series_anchor.relationship_stage'],
    authorship,
    drift
  );
}

/**
 * PHASE-782: the persistence wrapper for authorSeriesAnchorGrowthScore (seriesContinuityContracts.ts,
 * Rule SC3), the one dereferencing-blocked SeasonCarryoverSeriesAnchor field PHASE-781 found
 * genuinely designable now (PHASE-780's dereferenceEnvelope + PHASE-782's scene-disambiguated
 * sibling). Reads the named CharacterArc's own real deltaSpecs, tries each unique scene_id
 * against BOTH real numeric field names the 2 known character_growth_source shapes use
 * ('state_consistency_score' for character_state_registry, 'motion_score' for
 * subject_motion_registry) — never both at once for the same movie, since a mismatched field
 * name always dereferences to a non-number, which this function filters out rather than
 * miscounts as a real value. If ANY real numbers were found, averages them (Rule SC3, "averaging
 * real numeric values"); if none were found (e.g. a scene-namespace mismatch between the arc's
 * own scenes and the registry, discovered PHASE-782), records a specific, honest reason instead
 * of the old generic capability-gap text — never invents a number, never silently leaves the
 * old text in place unexamined.
 */
export function authorPersistedSeriesAnchorGrowthScore(
  from_season_scenario_id: string,
  to_season_scenario_id: string,
  expectedVersion: number,
  character_id: string,
  story_id: string | undefined,
  authorship: AuthorshipProvenance
) {
  const objectId = carryoverObjectId(from_season_scenario_id, to_season_scenario_id);
  const existing = readDocumentRaw<SeasonCarryoverRecord>('season_carryovers', objectId);
  if (!existing) throw new PersistenceError(`Cannot author series_anchor.growth_score on "${objectId}" — no document exists`);

  const arcObjectId = characterArcObjectId(character_id, story_id);
  const arc = readDocumentRaw<CharacterArcDocumentContent>('character_arcs', arcObjectId);
  if (!arc) throw new PersistenceError(`Cannot author series_anchor.growth_score on "${objectId}" — referenced CharacterArc "${arcObjectId}" does not exist`);

  const uniqueScenes = new Map<string, string>(); // scene_id -> movie_id
  for (const d of arc.content.deltaSpecs) {
    uniqueScenes.set(d.sceneA, d.movie_id);
    uniqueScenes.set(d.sceneB, d.movie_id);
  }

  const CANDIDATE_NUMERIC_FIELDS = ['state_consistency_score', 'motion_score'];
  const realValues: number[] = [];
  let attempted = 0;
  for (const [sceneId, movieId] of uniqueScenes) {
    attempted++;
    for (const field of CANDIDATE_NUMERIC_FIELDS) {
      const envelope = resolveCharacterGrowthField(movieId, character_id, field);
      const deref = dereferenceCharacterGrowthFieldAtScene(envelope, sceneId);
      if (deref.status === 'DEREFERENCED' && typeof deref.value === 'number') {
        realValues.push(deref.value);
        break; // this scene's real numeric value found — don't also try the other field name
      }
    }
  }

  const emptyReason = `no real numeric character-growth value could be dereferenced for any of the ${attempted} unique scene(s) referenced by "${arcObjectId}"'s deltaSpecs — the character_growth_source registry may use a different scene_id namespace than this arc's own scenes (PHASE-782 finding: this is the case for titanic, whose subject-motion registry uses scene_titanic_dense_* while this arc's scenes use scene_titanic_02_*)`;

  const fromLoaded = loadSeasonWithReverify(from_season_scenario_id);
  const toLoaded = loadSeasonWithReverify(to_season_scenario_id);
  const drift = fromLoaded && toLoaded && (fromLoaded.driftDetected || toLoaded.driftDetected)
    ? { detected: true, detail: 'one or both underlying seasons drifted since this carryover record was last saved' }
    : { detected: false, detail: null };

  return updateDocument<SeasonCarryoverRecord>(
    'season_carryovers',
    objectId,
    expectedVersion,
    (current) => authorSeriesAnchorGrowthScore(current, realValues, emptyReason),
    ['content.series_anchor.growth_score'],
    authorship,
    drift
  );
}

export function loadRawSeasonCarryover(from_season_scenario_id: string, to_season_scenario_id: string) {
  return readDocumentRaw<SeasonCarryoverRecord>('season_carryovers', carryoverObjectId(from_season_scenario_id, to_season_scenario_id));
}

/**
 * PHASE-786: the persistence wrapper for authorSeriesAnchorIdentitySignature
 * (seriesContinuityContracts.ts), implementing PHASE-785's design
 * (docs/architecture/SeriesAnchorIdentitySignatureDesign.md) exactly. Rule ID2/ID3a: reads
 * character_ids from the record's own already-persisted
 * dependency_ledger['content.carryover_checks.character_growth_carryover'] entries (wired
 * PHASE-737) — for each real `{object_kind: 'character_arcs', object_id}` reference there, loads
 * that CharacterArc document (loadRawDocument/readDocumentRaw, unmodified) and reads its own
 * content.character_id field (the authoritative real value, never string-parsed from the
 * object_id). Rule ID2a: from_movie_id/to_movie_id are read directly from the record's own
 * from_resolution/to_resolution.provenance_ledger[0].movie_id — already real, already persisted.
 * Rule ID3c: character_ids are canonicalized (sourceResolver.ts's own canonicalCharacterId,
 * reused unmodified), deduplicated, and sorted before being handed to the pure hash function.
 * Rule ID3b: if the record has no such dependency_ledger entry at all (true today for
 * season_065_test__season_065_titanic.json, which predates the dependency-ledger mechanism and
 * carries no dependency_ledger key whatsoever), identity_signature stays NOT_DERIVABLE with the
 * exact, specific reason Rule ID3b names — never a guessed or hardcoded character list, even
 * though CHAR-gonagi/CHAR-dana would be a tempting shortcut.
 */
export function authorPersistedSeriesAnchorIdentitySignature(
  from_season_scenario_id: string,
  to_season_scenario_id: string,
  expectedVersion: number,
  authorship: AuthorshipProvenance
) {
  const objectId = carryoverObjectId(from_season_scenario_id, to_season_scenario_id);
  const existing = readDocumentRaw<SeasonCarryoverRecord>('season_carryovers', objectId);
  if (!existing) throw new PersistenceError(`Cannot author series_anchor.identity_signature on "${objectId}" — no document exists`);

  const ledgerEntries = existing.dependency_ledger?.['content.carryover_checks.character_growth_carryover'] ?? [];
  const characterArcRefs = ledgerEntries.filter(
    (d): d is DocumentDependency => d.kind === 'document' && d.object_kind === 'character_arcs'
  );

  const emptyReason =
    "no real, already-persisted character-arc reference exists on this record's own dependency_ledger to ground identity_signature's character_ids input";

  let inputs: IdentitySignatureInputs | null = null;
  if (characterArcRefs.length > 0) {
    const rawCharacterIds: string[] = [];
    for (const ref of characterArcRefs) {
      const arcDoc = readDocumentRaw<CharacterArcDocumentContent>(ref.object_kind, ref.object_id);
      if (arcDoc) rawCharacterIds.push(arcDoc.content.character_id);
    }
    if (rawCharacterIds.length > 0) {
      const character_ids = Array.from(new Set(rawCharacterIds.map(canonicalCharacterId))).sort();
      inputs = {
        from_season_scenario_id: existing.content.from_season_scenario_id,
        to_season_scenario_id: existing.content.to_season_scenario_id,
        from_movie_id: existing.content.from_resolution.provenance_ledger[0].movie_id,
        to_movie_id: existing.content.to_resolution.provenance_ledger[0].movie_id,
        character_ids,
      };
    }
  }

  const fromLoaded = loadSeasonWithReverify(from_season_scenario_id);
  const toLoaded = loadSeasonWithReverify(to_season_scenario_id);
  const drift = fromLoaded && toLoaded && (fromLoaded.driftDetected || toLoaded.driftDetected)
    ? { detected: true, detail: 'one or both underlying seasons drifted since this carryover record was last saved' }
    : { detected: false, detail: null };

  return updateDocument<SeasonCarryoverRecord>(
    'season_carryovers',
    objectId,
    expectedVersion,
    (current) => authorSeriesAnchorIdentitySignature(current, inputs, emptyReason),
    ['content.series_anchor.identity_signature'],
    authorship,
    drift
  );
}

/**
 * PHASE-789: the persistence wrapper for authorSeriesAnchorLocationSignature
 * (seriesContinuityContracts.ts), implementing PHASE-788's design
 * (docs/architecture/SeriesAnchorLocationSignatureDesign.md) exactly. Rule LS3a: reuses the
 * SAME dependency_ledger['content.carryover_checks.character_growth_carryover'] CharacterArc
 * references identity_signature's own wrapper already reads (Rule ID3a) — for each real
 * `{object_kind: 'character_arcs', object_id}` reference, loads that CharacterArc document
 * (readDocumentRaw, unmodified) and collects every unique (movie_id, scene_id) pair from its own
 * real deltaSpecs (sceneA/sceneB) — the identical uniqueScenes construction growth_score's own
 * wrapper (PHASE-782) already performs on the same arcs. Rule LS3b: each candidate scene is
 * existence-checked via resolveScene (existing, unmodified) — only a RESOLVED envelope is used
 * further. Rule LS3c/LS6: each RESOLVED scene envelope is dereferenced via the new
 * dereferenceSceneLocationId sibling (PHASE-789, sourceResolver.ts) — which returns ONLY the real
 * target_location_id string, never gonegi_translation.target_world_identity, never calling
 * resolveWorldIdentity. Rule LS3e: real values are deduplicated + sorted before hashing.
 * Rule LS4a: if zero character_arcs references exist in the ledger at all, location_signature
 * stays NOT_DERIVABLE with that specific reason. Rule LS4b: if real, resolved scenes exist but
 * none carry a real target_location_id, location_signature stays NOT_DERIVABLE with a DIFFERENT,
 * specific reason naming that exact cause — never the same text as Rule LS4a's case, never a
 * guessed location.
 */
export function authorPersistedSeriesAnchorLocationSignature(
  from_season_scenario_id: string,
  to_season_scenario_id: string,
  expectedVersion: number,
  authorship: AuthorshipProvenance
) {
  const objectId = carryoverObjectId(from_season_scenario_id, to_season_scenario_id);
  const existing = readDocumentRaw<SeasonCarryoverRecord>('season_carryovers', objectId);
  if (!existing) throw new PersistenceError(`Cannot author series_anchor.location_signature on "${objectId}" — no document exists`);

  const ledgerEntries = existing.dependency_ledger?.['content.carryover_checks.character_growth_carryover'] ?? [];
  const characterArcRefs = ledgerEntries.filter(
    (d): d is DocumentDependency => d.kind === 'document' && d.object_kind === 'character_arcs'
  );

  let inputs: LocationSignatureInputs | null = null;
  let emptyReason =
    "no real, already-persisted character-arc reference exists on this record's own dependency_ledger to ground location_signature's location_ids input";

  if (characterArcRefs.length > 0) {
    const uniqueScenes = new Map<string, string>(); // scene_id -> movie_id
    for (const ref of characterArcRefs) {
      const arcDoc = readDocumentRaw<CharacterArcDocumentContent>(ref.object_kind, ref.object_id);
      if (!arcDoc) continue;
      for (const spec of arcDoc.content.deltaSpecs) {
        uniqueScenes.set(spec.sceneA, spec.movie_id);
        uniqueScenes.set(spec.sceneB, spec.movie_id);
      }
    }

    const rawLocationIds: string[] = [];
    let resolvedCount = 0;
    for (const [sceneId, movieId] of uniqueScenes) {
      const envelope = resolveScene(movieId, sceneId);
      if (envelope.status !== 'RESOLVED') continue;
      resolvedCount++;
      const deref = dereferenceSceneLocationId(envelope);
      if (deref.status === 'DEREFERENCED' && typeof deref.value === 'string') {
        rawLocationIds.push(deref.value);
      }
    }

    if (rawLocationIds.length > 0) {
      const location_ids = Array.from(new Set(rawLocationIds)).sort();
      inputs = {
        from_season_scenario_id: existing.content.from_season_scenario_id,
        to_season_scenario_id: existing.content.to_season_scenario_id,
        from_movie_id: existing.content.from_resolution.provenance_ledger[0].movie_id,
        to_movie_id: existing.content.to_resolution.provenance_ledger[0].movie_id,
        location_ids,
      };
    } else {
      emptyReason = `${resolvedCount} real, resolved scene(s) were found among the ${uniqueScenes.size} unique scene(s) referenced by this record's own dependency_ledger-referenced character arcs, but none of their gonegi_translation entries carry a target_location_id field`;
    }
  }

  const fromLoaded = loadSeasonWithReverify(from_season_scenario_id);
  const toLoaded = loadSeasonWithReverify(to_season_scenario_id);
  const drift = fromLoaded && toLoaded && (fromLoaded.driftDetected || toLoaded.driftDetected)
    ? { detected: true, detail: 'one or both underlying seasons drifted since this carryover record was last saved' }
    : { detected: false, detail: null };

  return updateDocument<SeasonCarryoverRecord>(
    'season_carryovers',
    objectId,
    expectedVersion,
    (current) => authorSeriesAnchorLocationSignature(current, inputs, emptyReason),
    ['content.series_anchor.location_signature'],
    authorship,
    drift
  );
}

/**
 * PHASE-735: the real-content counterpart of authorDependencyTestSummaryWithDependency
 * (PHASE-731), applied to SeasonCarryoverRecord instead of the isolated dependency_test kind —
 * per PHASE-734's selected candidate (carryover_checks.series_arc_continuity, a cross-document/
 * exact_value dependency on both Seasons' authored_arc.main_arc). authorPersistedCarryoverCheck
 * itself is untouched; this is an additive sibling for callers that also want to declare a
 * dependency_ledger entry for the field they're authoring, in the SAME atomic write (Rule DB5).
 */
export function authorPersistedCarryoverCheckWithDependency(
  from_season_scenario_id: string,
  to_season_scenario_id: string,
  expectedVersion: number,
  field: 'season_to_season_consistency' | 'character_growth_carryover' | 'relationship_carryover' | 'series_arc_continuity',
  value: string,
  dependencies: ContentDependency[],
  authorship: AuthorshipProvenance
) {
  const objectId = carryoverObjectId(from_season_scenario_id, to_season_scenario_id);
  const existing = readDocumentRaw<SeasonCarryoverRecord>('season_carryovers', objectId);
  if (!existing) throw new PersistenceError(`Cannot author carryover check on "${objectId}" — no document exists`);

  const fromLoaded = loadSeasonWithReverify(from_season_scenario_id);
  const toLoaded = loadSeasonWithReverify(to_season_scenario_id);
  const drift = fromLoaded && toLoaded && (fromLoaded.driftDetected || toLoaded.driftDetected)
    ? { detected: true, detail: 'one or both underlying seasons drifted since this carryover record was last saved' }
    : { detected: false, detail: null };

  const ledgerPath = `content.carryover_checks.${field}`;
  const updated = updateDocument<SeasonCarryoverRecord>(
    'season_carryovers',
    objectId,
    expectedVersion,
    (current) => authorCarryoverCheck(current, field, value),
    [ledgerPath, `dependency_ledger.${ledgerPath}`],
    authorship,
    drift
  );
  updated.dependency_ledger = { ...(updated.dependency_ledger ?? {}), [ledgerPath]: dependencies };
  writeDocumentRaw('season_carryovers', updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Content dependency bookkeeping + staleness detection (PHASE-731/732)
//
// Minimal implementation of docs/architecture/StoryContentFreshnessContract.md (PHASE-729,
// Rule CF1-CF5) and StoryContentDependencyBookkeepingDesign.md (PHASE-730, Rule DB1-DB6).
// Entirely isolated from the 6 real DocumentKinds above: a new, 8th kind ('dependency_test')
// with its own content shape and its own create/append/author functions — none of
// stories/seasons/episodes/callback_chains/character_arcs/relationships/season_carryovers'
// existing functions are modified. checkContentDependencyStaleness itself is generic (accepts
// any DocumentKind), so it is not special-cased to this test kind, but this phase exercises it
// only against one new dependency_test document, per its own instruction.
// ---------------------------------------------------------------------------

export interface DependencyTestDocumentContent {
  test_id: string;
  tracked_items: string[];
  // PHASE-731/732: optional real authored summary — additive only, mirrors every other
  // DocumentKind's own optional authored_* field (Rule TA1: content axis, never structural).
  authored_summary?: string;
}

export function createDependencyTestDoc(test_id: string, firstItems: string[], authorship: AuthorshipProvenance) {
  const content: DependencyTestDocumentContent = { test_id, tracked_items: firstItems };
  // This kind is not resolver-backed (Rule PS3 does not apply — it tracks no real Scene/Shot
  // pointer), so its structural_snapshot is a trivial, fixed marker, never NOT_DERIVABLE.
  return createDocument('dependency_test', test_id, content, { aggregate_status: 'RESOLVED' }, {}, authorship);
}

/** Simulates the real-world event this whole thread's 3 incidents shared: a legitimate content
 * append that does NOT touch any authored field's dependency_ledger entry — exactly how
 * appendEpisodeToSeason/appendCharacterGrowthDelta/appendRelationshipSupportingScene never touch
 * authored_arc/authored_note/authored_relationship_note today. */
export function appendDependencyTestItem(test_id: string, expectedVersion: number, newItem: string, authorship: AuthorshipProvenance) {
  return updateDocument<DependencyTestDocumentContent>(
    'dependency_test',
    test_id,
    expectedVersion,
    (current) => ({ ...current, tracked_items: [...current.tracked_items, newItem] }),
    ['content.tracked_items'],
    authorship
  );
}

/**
 * Rule DB5: writes the authored content AND its dependency_ledger entry atomically, in the same
 * change_history entry — never as 2 separate writes. `changed_fields` lists both paths, exactly
 * mirroring how refresh* functions list only ['structural_snapshot'] to mark a resync as
 * distinguishable from a real content change (Rule FR4a) — this is that same discipline, applied
 * to declaring a dependency.
 */
export function authorDependencyTestSummaryWithDependency(
  test_id: string,
  expectedVersion: number,
  summary: string,
  dependencies: ContentDependency[],
  authorship: AuthorshipProvenance
) {
  const updated = updateDocument<DependencyTestDocumentContent>(
    'dependency_test',
    test_id,
    expectedVersion,
    (current) => ({ ...current, authored_summary: summary }),
    ['content.authored_summary', 'dependency_ledger.content.authored_summary'],
    authorship
  );
  updated.dependency_ledger = { ...(updated.dependency_ledger ?? {}), 'content.authored_summary': dependencies };
  writeDocumentRaw('dependency_test', updated);
  return updated;
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), obj);
}

export type StalenessStatus = 'FRESH' | 'STALE' | 'UNVERIFIED';

export interface StalenessDetail {
  dependency: ContentDependency;
  live_value: unknown;
  matches: boolean;
}

export interface StalenessCheckResult {
  status: StalenessStatus;
  details: StalenessDetail[];
}

/**
 * Rule CF2/CF2a/DB3: a PURE READ. Never writes anything, under any result, including a confirmed
 * STALE finding (Rule CF4 — detection is advisory only; automatic correction/authoring is
 * permanently out of scope by design, not merely by discipline in this function's own body).
 * Every comparison is a mechanical equality check (Rule DB3a) — no semantic judgment of prose.
 */
export function checkContentDependencyStaleness(kind: DocumentKind, objectId: string, contentFieldPath: string): StalenessCheckResult {
  const doc = readDocumentRaw<Record<string, unknown>>(kind, objectId);
  if (!doc) throw new PersistenceError(`Cannot check staleness for ${kind}/${objectId} — no document exists`);

  const deps = doc.dependency_ledger?.[contentFieldPath];
  if (!deps || deps.length === 0) return { status: 'UNVERIFIED', details: [] };

  const details: StalenessDetail[] = deps.map((dep) => {
    let liveDoc: PersistedDocument<Record<string, unknown>> | null = doc;
    if (dep.kind === 'document') {
      liveDoc = readDocumentRaw<Record<string, unknown>>(dep.object_kind, dep.object_id);
    }
    if (!liveDoc) return { dependency: dep, live_value: undefined, matches: false };
    const raw = getByPath(liveDoc, dep.tracked_field);
    if (dep.comparison === 'count') {
      const liveCount = Array.isArray(raw) ? raw.length : undefined;
      return { dependency: dep, live_value: liveCount, matches: liveCount === dep.count_at_authoring };
    }
    return { dependency: dep, live_value: raw, matches: raw === dep.value_at_authoring };
  });

  const status: StalenessStatus = details.every((d) => d.matches) ? 'FRESH' : 'STALE';
  return { status, details };
}

export const __test__ = {
  AUTHORED_CONTENT_ROOT,
  KINDS,
  assertSafeObjectId,
  documentPath,
  readDocumentRaw,
  carryoverObjectId,
  // PHASE-079
  canonicalCharacterIdPair,
  relationshipCanonicalId,
  relationshipLegacyId,
  resolveRelationshipObjectId,
};
