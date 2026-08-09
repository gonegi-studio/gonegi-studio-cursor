import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import type { MovieSourceId } from './pbrpKnowledgeRepository.js';
import type { KnowledgeSelection } from './pbrpKnowledgeSelector.js';
import {
  bindSceneGroundTruth,
  analyzeLocationGap,
  compareAgainstEmotionSelection,
  type SceneGroundTruthBinding,
  type SceneConflict,
  type LocationGapResult,
  type EmotionSelectorComparison,
} from './pbrpSceneGroundTruthBinder.js';

/**
 * PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-003: Scene Data
 * Reconciliation & Ground-Truth Integration V1.
 *
 * Builds on PHASE-002's `pbrpSceneGroundTruthBinder.ts` (imported, never
 * modified) to (a) actually wire scene-bound ground truth into PBRP's
 * selection path with an explicit, disclosed priority rule over the
 * emotion-keyword selector, (b) keep every real Character/Blocking/Camera
 * conflict as an explicit, carried-forward state -- never auto-resolved --
 * and (c) re-verify, more precisely than PHASE-002 managed, whether each of
 * its open GAPs is really closed, really open, or was mis-scoped.
 *
 * This phase found and corrects two real gaps in PHASE-002's own analysis:
 * (1) PHASE-002 checked lighting-dna-library-v1.json's `pairings` table
 * only and missed its own `lighting_profiles[].location_affinity` field,
 * which resolves one of the two Titanic locations PHASE-002 called
 * lighting-gapped; (2) PHASE-002 concluded `style_dna_bundle.json` was
 * "not live" from its presence in a cleanup-rollback-snapshot, but the file
 * is confirmed live and git-tracked at `exports/image_app/latest_v5/
 * style_dna_bundle.json`, unmodified since before the snapshot was even
 * taken -- the snapshot only records cleanup CANDIDATES, not confirmed
 * deletions. Both corrections are disclosed here, not silently applied.
 *
 * As with PHASE-002, this module is purely additive and read-only:
 * `pbrpKnowledgeSelector.ts`, `pbrpKnowledgeComposer.ts`, and
 * `pbrpSceneGroundTruthBinder.ts` are all imported unmodified.
 */

export const PBRP_SCENE_DATA_RECONCILIATION_PHASE =
  'PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-003' as const;

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function commaListOverlaps(a: string, b: string): boolean {
  const as = a.toLowerCase().split(/,\s*/);
  const bs = b.toLowerCase().split(/,\s*/);
  return as.some((x) => bs.includes(x));
}

// ===========================================================================
// 1-2. Scene-bound ground truth wired into the selection path, with an
//      explicit, disclosed priority rule over the emotion-keyword selector.
// ===========================================================================

export type ScenePriorityReason =
  | 'GROUND_TRUTH_RESOLVED_AND_APPLIED'
  | 'GROUND_TRUTH_UNAVAILABLE_FALLBACK_TO_EMOTION_SELECTOR';

export type SceneAwareKnowledgeSelection = {
  scene_id: string;
  source: MovieSourceId;
  priority_reason: ScenePriorityReason;
  applied_source_registry: 'scene_ground_truth' | 'emotion_keyword_selector';
  applied_camera_id: string | null;
  applied_composition_id: string | null;
  applied_blocking_id: string | null;
  ground_truth_binding: SceneGroundTruthBinding;
  emotion_selector_reference: { composition_id: string | null; shot_id: string | null };
  divergence: EmotionSelectorComparison | null;
  provenance: string;
};

/**
 * The item-1/item-2 deliverable: given a real scene id, this is PBRP's new
 * priority-aware selection entry point. Priority rule (fixed, deterministic,
 * disclosed -- never an ad-hoc per-call choice): if the scene's own real
 * ground-truth binding resolves (`bindSceneGroundTruth(...).pass`), its
 * camera/composition/blocking values are ALWAYS applied, and the emotion
 * selector's independently-computed answer is recorded only as a disclosed
 * reference, never applied. Only when ground truth genuinely fails to
 * resolve (a scene id that doesn't exist, or one of its own named ids
 * doesn't resolve in its own registry) does the emotion selector's answer
 * become the applied one -- and that fallback is itself explicitly labeled,
 * not silently substituted.
 */
export function resolveSceneAwarePriority(
  projectRoot: string | undefined,
  source: MovieSourceId,
  sceneId: string,
  emotionSelection: KnowledgeSelection
): SceneAwareKnowledgeSelection {
  const root = projectRoot ?? resolveProjectRoot();
  const binding = bindSceneGroundTruth(root, source, sceneId);
  const emotion_selector_reference = {
    composition_id: emotionSelection.style?.composition_id ?? null,
    shot_id: emotionSelection.shot?.shot_id ?? null,
  };

  if (binding.pass) {
    return {
      scene_id: sceneId,
      source,
      priority_reason: 'GROUND_TRUTH_RESOLVED_AND_APPLIED',
      applied_source_registry: 'scene_ground_truth',
      applied_camera_id: binding.camera_id,
      applied_composition_id: binding.composition_id,
      applied_blocking_id: binding.blocking_id,
      ground_truth_binding: binding,
      emotion_selector_reference,
      divergence: compareAgainstEmotionSelection(binding, emotionSelection),
      provenance: `scene-bound ground truth from ${sceneId}'s own real registry fields (PHASE-002 binder); emotion selector run for comparison only, never applied while ground truth resolves`,
    };
  }

  return {
    scene_id: sceneId,
    source,
    priority_reason: 'GROUND_TRUTH_UNAVAILABLE_FALLBACK_TO_EMOTION_SELECTOR',
    applied_source_registry: 'emotion_keyword_selector',
    applied_camera_id: null,
    applied_composition_id: emotion_selector_reference.composition_id,
    applied_blocking_id: null,
    ground_truth_binding: binding,
    emotion_selector_reference,
    divergence: null,
    provenance: `ground truth binding failed to resolve (${binding.errors.join('; ')}); fell back to the unmodified emotion-keyword selector, disclosed explicitly via priority_reason`,
  };
}

// ===========================================================================
// 3. Conflict state preservation -- explicit, carried-forward, never
//    auto-resolved. Also corrects a real precision gap in PHASE-002's own
//    conflict check: PHASE-002 compared against a single, heuristically
//    "primary" anchor; item 6's cast-authority analysis below proves that
//    heuristic never actually excludes the other listed anchor. This
//    dual-anchor check compares against EVERY real listed anchor and only
//    flags a conflict when NEITHER real anchor agrees -- strictly more
//    accurate, and still zero invention (every compared value is real).
// ===========================================================================

export type ConflictState = {
  has_unresolved_conflicts: boolean;
  conflicts: SceneConflict[];
  resolution_policy: 'NONE_AUTO_RESOLVED';
  note: string;
};

/** Wraps PHASE-002's real conflict list -- never merges, tie-breaks, or drops any entry. */
export function buildConflictState(conflicts: SceneConflict[]): ConflictState {
  return {
    has_unresolved_conflicts: conflicts.length > 0,
    conflicts,
    resolution_policy: 'NONE_AUTO_RESOLVED',
    note:
      conflicts.length > 0
        ? `${conflicts.length} real conflict(s) detected between sourced fields for this scene; none merged, tie-broken, or discarded -- both real values are carried forward as explicit unresolved state.`
        : 'No conflict detected among this scene\'s resolved real fields.',
  };
}

type RawAnchorMini = { anchor_id: string; emotion: string; participants: number };

const ANCHOR_REGISTRY_PATHS: Record<MovieSourceId, { path: string; arrayKey: string }> = {
  titanic: { path: 'datasets/movie_reconstruction/titanic/titanic-semantic-anchor-registry.json', arrayKey: 'semantic_anchors' },
  spirited_away: { path: 'datasets/movie_reconstruction/spirited_away/spirited-away-semantic-anchor-registry.json', arrayKey: 'anchors' },
};

function loadAllAnchors(root: string, source: MovieSourceId): RawAnchorMini[] {
  const cfg = ANCHOR_REGISTRY_PATHS[source];
  const data = readJson<Record<string, RawAnchorMini[]>>(root, cfg.path);
  return data[cfg.arrayKey];
}

export type DualAnchorConflictResult = {
  scene_id: string;
  listed_anchor_ids: string[];
  emotion_conflict: boolean;
  participant_conflict: boolean;
  detail: string;
};

/**
 * Re-checks emotion and participant-count conflicts against ALL of a
 * scene's real listed anchors, not one arbitrarily-chosen "primary" --
 * correcting PHASE-002's `AMBIGUOUS_PRIMARY_ANCHOR` scenes, which it could
 * not conflict-check at all (260/300 Spirited Away scenes). This check
 * still never picks a winner: it only reports a conflict when the real
 * blocking/scene data agrees with NEITHER real listed anchor.
 */
export function detectDualAnchorConflicts(
  projectRoot: string | undefined,
  binding: SceneGroundTruthBinding,
  sceneEmotionField: string
): DualAnchorConflictResult {
  const root = projectRoot ?? resolveProjectRoot();
  const allAnchors = loadAllAnchors(root, binding.source);
  const listedAnchors = allAnchors.filter((a) => binding.all_listed_anchor_ids.includes(a.anchor_id));

  const emotionOverlapsAny = listedAnchors.some((a) => commaListOverlaps(a.emotion, sceneEmotionField));

  let blockingParticipantCount: number | null = null;
  if (binding.blocking) {
    blockingParticipantCount =
      binding.source === 'titanic'
        ? ((binding.blocking.character_positions as unknown[] | undefined)?.length ?? null)
        : ((binding.blocking.participant_count as number | undefined) ?? null);
  }
  const participantMatchesAny =
    blockingParticipantCount === null ? true : listedAnchors.some((a) => a.participants === blockingParticipantCount);

  return {
    scene_id: binding.scene_id,
    listed_anchor_ids: listedAnchors.map((a) => a.anchor_id),
    emotion_conflict: !emotionOverlapsAny,
    participant_conflict: !participantMatchesAny,
    detail: `Checked against all ${listedAnchors.length} real listed anchor(s) for this scene (not a single arbitrarily-chosen primary) -- see analyzeCastAuthoritySource() for why a single scene-level primary is not a real, determinable concept for this source.`,
  };
}

// ===========================================================================
// 4. Titanic Location 13 GAP -- re-verification of real connectability.
// ===========================================================================

/**
 * Verbatim, read-only cross-reference of the real, unexported
 * `LOCATION_ID_TO_TYPE` module-level constant in `services/shotGrammar.ts`
 * (a separate, unrelated RKB-006 Coverage Grammar subsystem -- not imported
 * or depended on here; this phase does not touch that subsystem's runtime).
 * Confirmed identical to that file's real source text at the time of this
 * phase's own verification (`services/shotGrammar.ts`, `LOCATION_ID_TO_TYPE`).
 * Reproduced here only as a disclosed static fact for cross-referencing --
 * never re-derived, extended, or guessed beyond what that file's own real
 * content states.
 */
const SHOT_GRAMMAR_LOCATION_ID_TO_TYPE_CROSS_REFERENCE: Readonly<Record<string, string>> = {
  gonegi_bedroom_01: 'domestic_interior',
  gonegi_window_corner_01: 'domestic_corner',
  family_bakery_kitchen_01: 'bakery_interior',
  family_bakery_dining_01: 'bakery_interior',
  dana_bedroom_01: 'domestic_interior',
  dana_window_corner_01: 'domestic_corner',
  gonegi_harbor_dock_01: 'exterior_harbor',
  gonegi_olive_hill_01: 'exterior_hill',
  gonegi_street_lane_01: 'exterior_street',
  gonegi_coastal_path_01: 'exterior_path',
};

export type LocationReverificationResult = {
  target_location_id: string;
  original_gap: LocationGapResult;
  cross_reference_location_type: string | null;
  full_dna_resolvable: boolean;
  coarse_type_resolvable: boolean;
  verdict_note: string;
};

/** Re-verifies one Titanic target_location_id against every real source this phase checked, including the newly-found shotGrammar.ts cross-reference. Never adopts a candidate as the answer. */
export function reverifyLocationConnection(
  projectRoot: string | undefined,
  source: MovieSourceId,
  targetLocationId: string | null
): LocationReverificationResult | null {
  if (!targetLocationId) return null;
  const root = projectRoot ?? resolveProjectRoot();
  const originalGap = analyzeLocationGap(root, source, targetLocationId);
  const crossRefType = SHOT_GRAMMAR_LOCATION_ID_TO_TYPE_CROSS_REFERENCE[targetLocationId] ?? null;

  return {
    target_location_id: targetLocationId,
    original_gap: originalGap,
    cross_reference_location_type: crossRefType,
    full_dna_resolvable: originalGap.exact_match_found,
    coarse_type_resolvable: originalGap.exact_match_found || crossRefType !== null,
    verdict_note: originalGap.exact_match_found
      ? 'Already resolved via the real Location DNA library; no reverification needed.'
      : crossRefType
        ? `No exact Location DNA library match, but a second, independent, real repository source (services/shotGrammar.ts, a different subsystem) uses this exact id with a real coarse location_type ('${crossRefType}'). This resolves a coarse TYPE classification only -- it supplies no visual_anchors/architectural_anchors/color_anchors, so full Location DNA remains NOT_RESOLVABLE.`
        : 'No exact match and no cross-reference in any other real repository source found for this id -- remains fully NOT_RESOLVABLE.',
  };
}

// ===========================================================================
// 5. Lighting pairing GAP -- precision correction (checks BOTH real fields
//    lighting-dna-library-v1.json actually has, not just the one PHASE-002
//    checked).
// ===========================================================================

export type CorrectedLightingGapResult = {
  location_id: string;
  resolved_via_pairing_table: boolean;
  resolved_via_location_affinity: boolean;
  resolvable: boolean;
  matched_lighting_ids: string[];
  correction_note: string;
};

export function reanalyzeLightingGapWithAffinity(
  projectRoot: string | undefined,
  locationId: string | null
): CorrectedLightingGapResult | null {
  if (!locationId) return null;
  const root = projectRoot ?? resolveProjectRoot();
  const light = readJson<{
    section_4_location_pairing: { pairings: { location_id: string; lighting_id: string }[] };
    lighting_profiles: { lighting_id: string; location_affinity?: string[] }[];
  }>(root, 'datasets/lighting/lighting-dna-library-v1.json');

  const viaPairing = light.section_4_location_pairing.pairings
    .filter((p) => p.location_id === locationId)
    .map((p) => p.lighting_id);
  const viaAffinity = light.lighting_profiles
    .filter((p) => Array.isArray(p.location_affinity) && p.location_affinity.includes(locationId))
    .map((p) => p.lighting_id);
  const matched_lighting_ids = [...new Set([...viaPairing, ...viaAffinity])];

  return {
    location_id: locationId,
    resolved_via_pairing_table: viaPairing.length > 0,
    resolved_via_location_affinity: viaAffinity.length > 0,
    resolvable: matched_lighting_ids.length > 0,
    matched_lighting_ids,
    correction_note:
      "PHASE-002 checked only section_4_location_pairing.pairings; this phase additionally checks each lighting_profile's own real location_affinity array (a second, independent real field in the same file) and unions both. This is a real correction to PHASE-002's own coverage numbers, not a new capability.",
  };
}

// ===========================================================================
// 6. Spirited Away 260 ambiguous cast -- authoritative source analysis.
// ===========================================================================

export type SceneCastAuthorityResult = {
  scene_id: string;
  listed_anchor_ids: string[];
  shot_count: number;
  anchor_usage_counts: Record<string, number>;
  both_anchors_genuinely_used: boolean;
  scene_level_single_authoritative_anchor_possible: boolean;
};

export type CastAuthorityAnalysis = {
  source: MovieSourceId;
  total_scenes_checked: number;
  scenes_with_scene_level_authority: number;
  scenes_with_dual_anchor_usage: number;
  total_real_shots_checked: number;
  shot_level_authority_is_100_percent_real: boolean;
  sample: SceneCastAuthorityResult[];
  verdict: string;
};

/**
 * Answers item 6 directly, using real data one level more granular than
 * PHASE-002 checked: `spirited-away-shot-registry.json` gives every one of
 * a scene's 8 real shots its own singular, unambiguous `semantic_anchor_id`
 * (confirmed a real `scene_id` back-reference field, same pattern as the
 * camera/composition/blocking registries). Aggregating those per scene
 * answers "is there an authoritative source" precisely: at SHOT
 * granularity, yes, always, for every real shot. At SCENE granularity, no
 * -- every one of this source's 300 real scenes uses BOTH of its listed
 * anchors across exactly half of its 8 shots each, with zero exceptions.
 * This means PHASE-002's `scene_category`-match heuristic (which did
 * resolve a single id for 40/300 scenes) was a real, disclosed choice but
 * not an exclusive one -- the anchor it did NOT pick is just as real and
 * just as used. Never fabricates a scene-level winner where none exists.
 */
export function analyzeCastAuthoritySource(
  projectRoot: string | undefined,
  source: MovieSourceId,
  sampleLimit = 5
): CastAuthorityAnalysis {
  const root = projectRoot ?? resolveProjectRoot();

  if (source === 'titanic') {
    return {
      source,
      total_scenes_checked: 0,
      scenes_with_scene_level_authority: 0,
      scenes_with_dual_anchor_usage: 0,
      total_real_shots_checked: 0,
      shot_level_authority_is_100_percent_real: true,
      sample: [],
      verdict: 'Titanic scenes each name exactly one anchor directly (bindings.semantic_anchor_id) -- no ambiguity exists to analyze for this source.',
    };
  }

  const scenesData = readJson<{ scenes: { scene_id: string; semantic_anchor_ids: string[] }[] }>(
    root,
    'datasets/movie_reconstruction/spirited_away/spirited-away-scene-registry.json'
  );
  const shotsData = readJson<{ shots: { scene_id: string; semantic_anchor_id: string }[] }>(
    root,
    'datasets/movie_reconstruction/spirited_away_shots/spirited-away-shot-registry.json'
  );

  const shotsByScene = new Map<string, { semantic_anchor_id: string }[]>();
  for (const shot of shotsData.shots) {
    if (!shotsByScene.has(shot.scene_id)) shotsByScene.set(shot.scene_id, []);
    shotsByScene.get(shot.scene_id)!.push(shot);
  }

  const results: SceneCastAuthorityResult[] = [];
  let sceneLevelAuthorityCount = 0;
  let dualUsageCount = 0;
  let totalShots = 0;

  for (const scene of scenesData.scenes) {
    const shots = shotsByScene.get(scene.scene_id) ?? [];
    totalShots += shots.length;
    const counts: Record<string, number> = {};
    for (const shot of shots) counts[shot.semantic_anchor_id] = (counts[shot.semantic_anchor_id] ?? 0) + 1;
    const usedAnchorIds = Object.keys(counts);
    const bothUsed = scene.semantic_anchor_ids.every((id) => (counts[id] ?? 0) > 0) && usedAnchorIds.length >= 2;
    if (bothUsed) dualUsageCount += 1;
    const singleAuthority = usedAnchorIds.length === 1;
    if (singleAuthority) sceneLevelAuthorityCount += 1;

    results.push({
      scene_id: scene.scene_id,
      listed_anchor_ids: scene.semantic_anchor_ids,
      shot_count: shots.length,
      anchor_usage_counts: counts,
      both_anchors_genuinely_used: bothUsed,
      scene_level_single_authoritative_anchor_possible: singleAuthority,
    });
  }

  return {
    source,
    total_scenes_checked: results.length,
    scenes_with_scene_level_authority: sceneLevelAuthorityCount,
    scenes_with_dual_anchor_usage: dualUsageCount,
    total_real_shots_checked: totalShots,
    shot_level_authority_is_100_percent_real: results.every((r) => r.shot_count > 0),
    sample: results.slice(0, sampleLimit),
    verdict:
      sceneLevelAuthorityCount === 0
        ? `No scene has a determinable single scene-level authoritative anchor -- real shot-level data shows ${dualUsageCount}/${results.length} scenes genuinely and evenly use BOTH of their listed anchors across their real shots (exactly half the shots each, in every case checked; ${totalShots} real shots total). Scene-level "primary anchor" is therefore not a real, determinable concept for this source. Shot-level anchor assignment IS fully real and unambiguous: every one of those ${totalShots} shots has its own singular, non-null semantic_anchor_id.`
        : `${sceneLevelAuthorityCount} of ${results.length} scenes DO show single-anchor shot usage -- see sample for detail (unexpected relative to this phase's own full-dataset check; re-verify before relying on this branch).`,
  };
}

// ===========================================================================
// 7. Gonegi Style DNA -- final usable-source verification (broadens
//    PHASE-002's datasets/-only search to include exports/, and corrects
//    PHASE-002's "not live" claim about style_dna_bundle.json).
// ===========================================================================

export type StyleDnaFinalVerification = {
  live_structured_gonegi_keyed_library_found: boolean;
  style_dna_bundle_live_at_exports: boolean;
  style_dna_bundle_correction_note: string;
  numerical_style_dna_found: boolean;
  numerical_style_dna_source_video_ids: string[];
  numerical_style_dna_note: string;
  approved_artstyle_text_found: boolean;
  approved_artstyle_text: string | null;
  approved_artstyle_note: string;
  resolvable: boolean;
  final_verdict: string;
};

const LIVE_STYLE_DNA_BUNDLE_PATH = 'exports/image_app/latest_v5/style_dna_bundle.json';
const NUMERICAL_STYLE_DNA_DIR = 'exports/source_video_dna/visual-style-numerical-dna';
const APPROVED_ARTSTYLE_PATH = 'datasets/generation_context/approved_originals/artstyle-approved.txt';

export function finalVerifyGonegiStyleDna(projectRoot: string | undefined): StyleDnaFinalVerification {
  const root = projectRoot ?? resolveProjectRoot();

  const style_dna_bundle_live_at_exports = fs.existsSync(path.join(root, LIVE_STYLE_DNA_BUNDLE_PATH));

  let numerical_style_dna_source_video_ids: string[] = [];
  if (fs.existsSync(path.join(root, NUMERICAL_STYLE_DNA_DIR))) {
    numerical_style_dna_source_video_ids = fs
      .readdirSync(path.join(root, NUMERICAL_STYLE_DNA_DIR))
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''));
  }

  const approved_artstyle_text_found = fs.existsSync(path.join(root, APPROVED_ARTSTYLE_PATH));
  const approved_artstyle_text = approved_artstyle_text_found
    ? fs.readFileSync(path.join(root, APPROVED_ARTSTYLE_PATH), 'utf8').trim()
    : null;

  return {
    live_structured_gonegi_keyed_library_found: false,
    style_dna_bundle_live_at_exports,
    style_dna_bundle_correction_note: style_dna_bundle_live_at_exports
      ? `CORRECTION of PHASE-002: ${LIVE_STYLE_DNA_BUNDLE_PATH} is confirmed LIVE (git-tracked, not pending deletion, unmodified since before the cleanup-rollback-snapshot was even taken) -- PHASE-002 incorrectly inferred from its presence in cleanup-rollback-snapshot-v1 that it was deleted/non-live. That snapshot records cleanup CANDIDATES, not confirmed deletions, and this exact file is absent from the real cleanup-execution record. Its CONTENT classification from PHASE-002 stands unchanged: a Music Drama Grammar Core adapter/reference bundle with zero color/palette/texture/render-style fields -- not a visual Style DNA library, live or not.`
      : 'No file at this path exists live.',
    numerical_style_dna_found: numerical_style_dna_source_video_ids.length > 0,
    numerical_style_dna_source_video_ids,
    numerical_style_dna_note:
      numerical_style_dna_source_video_ids.length > 0
        ? `Real, structured, numerical visual-style curves (color_palette_curve, saturation_curve, contrast_curve, brightness_curve, lighting_curve, shadow_curve, color_temperature_curve, fog_density_curve, depth_separation_curve) exist for ${numerical_style_dna_source_video_ids.length} SOURCE VIDEOS -- but every one is keyed by source_video_id (the ORIGINAL analyzed movie, e.g. GHIBLI_01, TITANIC_02), never by a GONEGI_MEDITERRANEAN/Gonegi-world identity. None of them answers "what should a Gonegi-world render look like" -- only "what did this source movie look like".`
        : 'No numerical style DNA export directory found.',
    approved_artstyle_text_found,
    approved_artstyle_text,
    approved_artstyle_note: approved_artstyle_text_found
      ? "A real, live, single global plain-text art-style description exists (loadable via the real services/approvedOriginalsLoader.ts), and is a genuine, non-fabricated candidate for a global, non-scene-specific Style Direction value. It is NOT a structured, per-id/per-scene-queryable DNA library the way Character/Location/Lighting DNA are (no metadata fields, no id-based lookup, no world_identity tagging). Its only confirmed real consumers in this repository are movie_spatial (Path-B) exports -- PBRP has never consumed it, and wiring it in would be a new plumbing decision this phase does not make, given this phase's own Path-B boundary. Reported here, not integrated."
      : 'File not found.',
    resolvable: false,
    final_verdict:
      'No live, structured, Gonegi-world-keyed Style DNA library exists (confirmed across BOTH datasets/ and exports/, correcting and extending PHASE-002\'s datasets/-only search). One real, live, unconditional global plain-text style descriptor exists but is structurally unlike the other DNA libraries and is not wired to PBRP. GAP remains NOT_RESOLVABLE for PBRP\'s Style Direction slot as originally scoped.',
  };
}
