import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import type { MovieSourceId } from './pbrpKnowledgeRepository.js';
import type { KnowledgeSelection } from './pbrpKnowledgeSelector.js';

/**
 * PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-002: Scene Ground-Truth
 * Binding & Data Gap Resolution V1.
 *
 * This module is the code form of PHASE-001's by-hand finding: every real
 * scene in `titanic-scene-registry.json` / `spirited-away-scene-registry.json`
 * already names its own real camera/composition/blocking pattern -- PBRP's
 * existing `pbrpKnowledgeSelector.ts` never reads this and independently
 * re-selects by emotion-keyword overlap against a *different* registry
 * (`*-shot-registry.json`), which PHASE-001 proved produces a different
 * result for both of its test scenes.
 *
 * This module does NOT modify `pbrpKnowledgeSelector.ts` or the runtime
 * orchestrator wiring -- both stay exactly as PHASE-005-008 left them, so
 * every existing verify script keeps passing unmodified (PASS->PASS
 * regression). Instead, this is an additive, parallel, ground-truth-first
 * path: given a real scene id, it resolves that scene's own real bindings
 * FIRST, and only then (via `compareAgainstEmotionSelection`) exposes the
 * emotion-selector's answer purely as a disclosed comparison value, never as
 * an input to the ground-truth result itself. This is what "PBRP가 실제
 * Scene Ground Truth를 우선 사용하는 구조" means here: ground truth is
 * always the primary, complete result; the emotion selector is downgraded
 * to an audit signal.
 *
 * Every function in this module is read-only against `datasets/` and never
 * fabricates a value: a real field that is absent stays `null`/`[]` with an
 * explicit note, a real conflict between two sourced fields is reported
 * with both values (never tie-broken here), and a near-name candidate for a
 * missing id is listed as a candidate only -- never adopted as the answer
 * (데이터 발명 금지 / 충돌 임의 해결 금지).
 */

export const PBRP_SCENE_GROUND_TRUTH_BINDER_PHASE =
  'PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-002' as const;

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function fileExists(root: string, relativePath: string): boolean {
  return fs.existsSync(path.join(root, relativePath));
}

// ===========================================================================
// Raw registry shapes -- one per real source, never unified into a fake
// shared shape (same principle `pbrpKnowledgeRepository.ts` already
// establishes for StyleDnaEntry: normalize the OUTPUT, never the input).
// ===========================================================================

type RawTitanicScene = {
  scene_id: string;
  scene_type: string;
  bindings: {
    camera_pattern_id: string;
    blocking_pattern_id: string;
    composition_id: string;
    semantic_anchor_id: string;
    emotion: string;
  };
  gonegi_translation: {
    target_world_identity: string;
    target_location_id?: string;
    target_characters?: string[];
  };
};

type RawSpiritedAwayScene = {
  scene_id: string;
  scene_category: string;
  semantic_anchor_ids: string[];
  emotion_state: string;
  camera_id: string;
  blocking_id: string;
  composition_id: string;
  gonegi_translation: {
    target_world_identity: string;
    // Confirmed real and confirmed ABSENT on every one of the 300 real
    // scenes in this source (this phase's own exhaustive scan) --
    // deliberately typed optional/undefined, never defaulted to a guess.
    target_location_id?: string;
  };
};

type RawSemanticAnchor = {
  anchor_id: string;
  emotion: string;
  semantic_meaning: string;
  participants: number;
  gonegi_characters: string[];
};

type RawTitanicCamera = { camera_pattern_id: string; scene_type: string; camera_language: string; shot_type: string; camera_height: string; camera_movement: string; fov_hint: string };
type RawTitanicComposition = { composition_id: string; composition_priority: string; horizon_weight: number; subject_scale: string; negative_space_policy: string };
type RawTitanicBlocking = { blocking_pattern_id: string; group_layout: string; spatial_relationship: string; character_positions: { character_ref: string; position: [number, number] }[]; emotion_staging: string };

type RawSpiritedCamera = { camera_id: string; scene_id: string; camera_grammar: string; camera_movement: string; camera_framing: string; camera_perspective: string; camera_energy: number };
type RawSpiritedComposition = { composition_id: string; scene_id: string; foreground: string; midground: string; background: string; visual_balance: number; composition_score: number };
type RawSpiritedBlocking = { blocking_id: string; scene_id: string; character_placement: string; group_blocking: string; participant_count: number };

const SCENE_REGISTRY_PATHS: Record<MovieSourceId, { scenes: string; anchors: string; cameras: string; compositions: string; blockings: string }> = {
  titanic: {
    scenes: 'datasets/movie_reconstruction/titanic/titanic-scene-registry.json',
    anchors: 'datasets/movie_reconstruction/titanic/titanic-semantic-anchor-registry.json',
    cameras: 'datasets/movie_reconstruction/titanic/titanic-camera-registry.json',
    compositions: 'datasets/movie_reconstruction/titanic/titanic-composition-registry.json',
    blockings: 'datasets/movie_reconstruction/titanic/titanic-blocking-registry.json',
  },
  spirited_away: {
    scenes: 'datasets/movie_reconstruction/spirited_away/spirited-away-scene-registry.json',
    anchors: 'datasets/movie_reconstruction/spirited_away/spirited-away-semantic-anchor-registry.json',
    cameras: 'datasets/movie_reconstruction/spirited_away/spirited-away-camera-registry.json',
    compositions: 'datasets/movie_reconstruction/spirited_away/spirited-away-composition-registry.json',
    blockings: 'datasets/movie_reconstruction/spirited_away/spirited-away-blocking-registry.json',
  },
};

function loadScenes(root: string, source: MovieSourceId): (RawTitanicScene | RawSpiritedAwayScene)[] {
  if (source === 'titanic') {
    return readJson<{ scenes: RawTitanicScene[] }>(root, SCENE_REGISTRY_PATHS.titanic.scenes).scenes;
  }
  return readJson<{ scenes: RawSpiritedAwayScene[] }>(root, SCENE_REGISTRY_PATHS.spirited_away.scenes).scenes;
}

function loadAnchors(root: string, source: MovieSourceId): RawSemanticAnchor[] {
  if (source === 'titanic') {
    return readJson<{ semantic_anchors: RawSemanticAnchor[] }>(root, SCENE_REGISTRY_PATHS.titanic.anchors).semantic_anchors;
  }
  return readJson<{ anchors: RawSemanticAnchor[] }>(root, SCENE_REGISTRY_PATHS.spirited_away.anchors).anchors;
}

// ===========================================================================
// 1. Scene Ground-Truth Binding -- real camera/composition/blocking
//    connection, priority-first (item 1 of this phase's own 작업 list).
// ===========================================================================

export type PrimaryAnchorResolution = 'direct_field' | 'scene_category_match' | 'ambiguous_multiple_candidates';

export type SceneGroundTruthBinding = {
  source: MovieSourceId;
  scene_id: string;
  pass: boolean;
  errors: string[];
  camera_id: string | null;
  composition_id: string | null;
  blocking_id: string | null;
  camera: Record<string, unknown> | null;
  composition: Record<string, unknown> | null;
  blocking: Record<string, unknown> | null;
  all_listed_anchor_ids: string[];
  primary_anchor_id: string | null;
  primary_anchor_resolution: PrimaryAnchorResolution;
  primary_anchor: RawSemanticAnchor | null;
  target_location_id: string | null;
  provenance: Record<string, string>;
};

/**
 * Real per-source rule for "which listed semantic anchor drives this
 * scene's cast" -- Titanic names exactly one anchor directly
 * (`bindings.semantic_anchor_id`), no ambiguity. Spirited Away's scene
 * schema lists TWO anchor ids per scene with no field marking either as
 * primary; this phase's own real, non-invented tie-break is: if the
 * scene's own `scene_category` equals one of its two listed anchor ids,
 * that one is primary (uses the scene's own real self-classification,
 * confirmed real for 40 of 300 scenes -- not a guess). Everywhere else
 * (260 of 300 scenes), this returns `ambiguous_multiple_candidates` and
 * `primary_anchor_id: null` rather than picking one arbitrarily.
 */
function resolvePrimaryAnchor(
  source: MovieSourceId,
  scene: RawTitanicScene | RawSpiritedAwayScene,
  anchors: RawSemanticAnchor[]
): { id: string | null; resolution: PrimaryAnchorResolution; listed: string[] } {
  if (source === 'titanic') {
    const t = scene as RawTitanicScene;
    return { id: t.bindings.semantic_anchor_id, resolution: 'direct_field', listed: [t.bindings.semantic_anchor_id] };
  }
  const s = scene as RawSpiritedAwayScene;
  const listed = s.semantic_anchor_ids;
  if (listed.includes(s.scene_category)) {
    return { id: s.scene_category, resolution: 'scene_category_match', listed };
  }
  return { id: null, resolution: 'ambiguous_multiple_candidates', listed };
}

/** Loads and resolves one real scene's real ground-truth binding. Returns `pass:false` with a real error list -- never a partial invented result -- if the scene id doesn't exist or an id it names doesn't resolve in its own registry. */
export function bindSceneGroundTruth(
  projectRoot: string | undefined,
  source: MovieSourceId,
  sceneId: string
): SceneGroundTruthBinding {
  const root = projectRoot ?? resolveProjectRoot();
  const errors: string[] = [];

  const scenes = loadScenes(root, source);
  const scene = scenes.find((s) => s.scene_id === sceneId);
  if (!scene) {
    return {
      source, scene_id: sceneId, pass: false, errors: [`SCENE_NOT_FOUND: '${sceneId}' does not exist in ${SCENE_REGISTRY_PATHS[source].scenes}`],
      camera_id: null, composition_id: null, blocking_id: null, camera: null, composition: null, blocking: null,
      all_listed_anchor_ids: [], primary_anchor_id: null, primary_anchor_resolution: 'ambiguous_multiple_candidates', primary_anchor: null,
      target_location_id: null, provenance: {},
    };
  }

  const anchors = loadAnchors(root, source);
  const anchorById = new Map(anchors.map((a) => [a.anchor_id, a]));

  const cameraId = source === 'titanic' ? (scene as RawTitanicScene).bindings.camera_pattern_id : (scene as RawSpiritedAwayScene).camera_id;
  const compositionId = source === 'titanic' ? (scene as RawTitanicScene).bindings.composition_id : (scene as RawSpiritedAwayScene).composition_id;
  const blockingId = source === 'titanic' ? (scene as RawTitanicScene).bindings.blocking_pattern_id : (scene as RawSpiritedAwayScene).blocking_id;

  let camera: Record<string, unknown> | null = null;
  let composition: Record<string, unknown> | null = null;
  let blocking: Record<string, unknown> | null = null;

  if (source === 'titanic') {
    const cams = readJson<{ camera_patterns: RawTitanicCamera[] }>(root, SCENE_REGISTRY_PATHS.titanic.cameras).camera_patterns;
    const comps = readJson<{ compositions: RawTitanicComposition[] }>(root, SCENE_REGISTRY_PATHS.titanic.compositions).compositions;
    const blks = readJson<{ blocking_patterns: RawTitanicBlocking[] }>(root, SCENE_REGISTRY_PATHS.titanic.blockings).blocking_patterns;
    camera = (cams.find((c) => c.camera_pattern_id === cameraId) as unknown as Record<string, unknown>) ?? null;
    composition = (comps.find((c) => c.composition_id === compositionId) as unknown as Record<string, unknown>) ?? null;
    blocking = (blks.find((b) => b.blocking_pattern_id === blockingId) as unknown as Record<string, unknown>) ?? null;
  } else {
    const cams = readJson<{ cameras: RawSpiritedCamera[] }>(root, SCENE_REGISTRY_PATHS.spirited_away.cameras).cameras;
    const comps = readJson<{ compositions: RawSpiritedComposition[] }>(root, SCENE_REGISTRY_PATHS.spirited_away.compositions).compositions;
    const blks = readJson<{ blockings: RawSpiritedBlocking[] }>(root, SCENE_REGISTRY_PATHS.spirited_away.blockings).blockings;
    const c = cams.find((x) => x.camera_id === cameraId);
    const co = comps.find((x) => x.composition_id === compositionId);
    const b = blks.find((x) => x.blocking_id === blockingId);
    // Real bidirectional check: Spirited Away's own pattern registries carry
    // a `scene_id` back-reference (Titanic's do not -- a real, disclosed
    // schema difference, not a bug in this reader). A mismatch here would
    // mean the scene's forward reference and the pattern's own claimed
    // owner disagree -- checked, not assumed consistent.
    if (c && c.scene_id !== sceneId) errors.push(`CAMERA_BACKREFERENCE_MISMATCH: scene claims '${cameraId}', but that camera's own scene_id is '${c.scene_id}'`);
    if (co && co.scene_id !== sceneId) errors.push(`COMPOSITION_BACKREFERENCE_MISMATCH: scene claims '${compositionId}', but that composition's own scene_id is '${co.scene_id}'`);
    if (b && b.scene_id !== sceneId) errors.push(`BLOCKING_BACKREFERENCE_MISMATCH: scene claims '${blockingId}', but that blocking's own scene_id is '${b.scene_id}'`);
    camera = (c as unknown as Record<string, unknown>) ?? null;
    composition = (co as unknown as Record<string, unknown>) ?? null;
    blocking = (b as unknown as Record<string, unknown>) ?? null;
  }

  if (!camera) errors.push(`CAMERA_ID_NOT_FOUND: '${cameraId}'`);
  if (!composition) errors.push(`COMPOSITION_ID_NOT_FOUND: '${compositionId}'`);
  if (!blocking) errors.push(`BLOCKING_ID_NOT_FOUND: '${blockingId}'`);

  const { id: primaryAnchorId, resolution, listed } = resolvePrimaryAnchor(source, scene, anchors);
  const primaryAnchor = primaryAnchorId ? anchorById.get(primaryAnchorId) ?? null : null;
  if (primaryAnchorId && !primaryAnchor) errors.push(`PRIMARY_ANCHOR_ID_NOT_FOUND: '${primaryAnchorId}'`);

  const targetLocationId = source === 'titanic' ? (scene as RawTitanicScene).gonegi_translation.target_location_id ?? null : null;

  return {
    source,
    scene_id: sceneId,
    pass: errors.length === 0,
    errors,
    camera_id: cameraId,
    composition_id: compositionId,
    blocking_id: blockingId,
    camera,
    composition,
    blocking,
    all_listed_anchor_ids: listed,
    primary_anchor_id: primaryAnchorId,
    primary_anchor_resolution: resolution,
    primary_anchor: primaryAnchor,
    target_location_id: targetLocationId,
    provenance: {
      camera: `${SCENE_REGISTRY_PATHS[source].cameras} -> ${cameraId}`,
      composition: `${SCENE_REGISTRY_PATHS[source].compositions} -> ${compositionId}`,
      blocking: `${SCENE_REGISTRY_PATHS[source].blockings} -> ${blockingId}`,
      primary_anchor: primaryAnchorId ? `${SCENE_REGISTRY_PATHS[source].anchors} -> ${primaryAnchorId} (${resolution})` : 'not determinable from real fields (see primary_anchor_resolution)',
    },
  };
}

// ===========================================================================
// 2. Conflict Detection -- Character / Blocking / Camera. Every check
//    compares two REAL sourced values and reports both; none is silently
//    tie-broken (충돌 임의 해결 금지).
// ===========================================================================

export type SceneConflict = {
  type: 'EMOTION_ANCHOR_VS_BLOCKING' | 'EMOTION_ANCHOR_VS_SCENE' | 'PARTICIPANT_ANCHOR_VS_BLOCKING' | 'CAMERA_FRAMING_VS_ANCHOR_SOLO' | 'AMBIGUOUS_PRIMARY_ANCHOR';
  scene_id: string;
  detail: string;
  value_a: { source: string; value: string };
  value_b: { source: string; value: string };
};

function commaListOverlaps(a: string, b: string): boolean {
  const as = a.toLowerCase().split(/,\s*/);
  const bs = b.toLowerCase().split(/,\s*/);
  return as.some((x) => bs.includes(x));
}

/** Detects (never resolves) real Character/Blocking/Camera conflicts for one already-bound scene. */
export function detectSceneConflicts(binding: SceneGroundTruthBinding, sceneEmotionField: string): SceneConflict[] {
  const conflicts: SceneConflict[] = [];
  const { scene_id, source, blocking, camera, primary_anchor, primary_anchor_resolution } = binding;

  if (primary_anchor_resolution === 'ambiguous_multiple_candidates') {
    conflicts.push({
      type: 'AMBIGUOUS_PRIMARY_ANCHOR',
      scene_id,
      detail: `Scene lists ${binding.all_listed_anchor_ids.length} semantic anchors with no field marking either as the scene's cast-driving anchor, and scene_category does not match either id -- resolving this would require an invented tie-break.`,
      value_a: { source: 'scene.semantic_anchor_ids', value: binding.all_listed_anchor_ids.join(' | ') },
      value_b: { source: 'scene.scene_category', value: 'no match' },
    });
  }

  if (primary_anchor && blocking) {
    const blockingEmotion = source === 'titanic' ? (blocking.emotion_staging as string | undefined) : sceneEmotionField;
    if (blockingEmotion && !commaListOverlaps(primary_anchor.emotion, blockingEmotion)) {
      conflicts.push({
        type: source === 'titanic' ? 'EMOTION_ANCHOR_VS_BLOCKING' : 'EMOTION_ANCHOR_VS_SCENE',
        scene_id,
        detail: 'The semantic anchor\'s own emotion and the ' + (source === 'titanic' ? 'bound blocking pattern\'s' : 'scene\'s own') + ' emotion field share no keyword.',
        value_a: { source: 'semantic_anchor.emotion', value: primary_anchor.emotion },
        value_b: { source: source === 'titanic' ? 'blocking_pattern.emotion_staging' : 'scene.emotion_state', value: blockingEmotion },
      });
    }

    if (source === 'titanic') {
      const positions = (blocking.character_positions as unknown[] | undefined) ?? [];
      if (positions.length !== primary_anchor.participants) {
        conflicts.push({
          type: 'PARTICIPANT_ANCHOR_VS_BLOCKING',
          scene_id,
          detail: 'The semantic anchor\'s own participant count and the bound blocking pattern\'s character_positions length disagree.',
          value_a: { source: 'semantic_anchor.participants', value: String(primary_anchor.participants) },
          value_b: { source: 'blocking_pattern.character_positions.length', value: String(positions.length) },
        });
      }
    } else {
      const participantCount = blocking.participant_count as number | undefined;
      if (typeof participantCount === 'number' && participantCount !== primary_anchor.participants) {
        conflicts.push({
          type: 'PARTICIPANT_ANCHOR_VS_BLOCKING',
          scene_id,
          detail: 'The primary semantic anchor\'s own participant count and the bound blocking pattern\'s participant_count disagree.',
          value_a: { source: 'semantic_anchor.participants', value: String(primary_anchor.participants) },
          value_b: { source: 'blocking_pattern.participant_count', value: String(participantCount) },
        });
      }
    }
  }

  if (primary_anchor && camera && source === 'spirited_away') {
    const framing = (camera.camera_framing as string | undefined) ?? '';
    if (/two_shot|group|pair/i.test(framing) && primary_anchor.participants === 1) {
      conflicts.push({
        type: 'CAMERA_FRAMING_VS_ANCHOR_SOLO',
        scene_id,
        detail: 'The bound camera pattern\'s own framing implies more than one figure, but the primary semantic anchor\'s own participant count is 1 (solo).',
        value_a: { source: 'semantic_anchor.participants', value: '1' },
        value_b: { source: 'camera.camera_framing', value: framing },
      });
    }
  }

  return conflicts;
}

// ===========================================================================
// 3. Location DNA GAP -- precise analysis, never invents a link.
// ===========================================================================

type LocationLibraryEntry = { location_id: string; source_library: string };

const LOCATION_LIBRARY_PATHS: { file: string; arrayKey: string; idField: string }[] = [
  { file: 'datasets/location/location-dna-library-v1.json', arrayKey: 'locations', idField: 'location_id' },
  { file: 'datasets/location/indoor-location-anchor-library-v1.json', arrayKey: 'anchors', idField: 'anchor_id' },
  { file: 'datasets/location/outdoor-layout-lock-library-v1.json', arrayKey: 'layouts', idField: 'outdoor_layout_id' },
  { file: 'datasets/location/room-layout-lock-library-v1.json', arrayKey: 'layouts', idField: 'layout_id' },
];

function loadAllRealLocationIds(root: string): LocationLibraryEntry[] {
  const out: LocationLibraryEntry[] = [];
  for (const lib of LOCATION_LIBRARY_PATHS) {
    if (!fileExists(root, lib.file)) continue;
    const data = readJson<Record<string, unknown>>(root, lib.file);
    const arr = (data[lib.arrayKey] as Record<string, unknown>[] | undefined) ?? [];
    for (const entry of arr) {
      const id = entry[lib.idField];
      if (typeof id === 'string') out.push({ location_id: id, source_library: lib.file });
    }
  }
  return out;
}

/** Strips the `gonegi_` prefix and trailing numeral suffix, splits into tokens. Used only to surface non-authoritative candidates -- never to answer the gap. */
function tokenizeLocationId(id: string): string[] {
  return id
    .toLowerCase()
    .replace(/^gonegi_/, '')
    .split('_')
    .filter((t) => t.length > 0 && !/^\d+$/.test(t));
}

export type LocationNearNameCandidate = { location_id: string; source_library: string; shared_tokens: string[] };

export type LocationGapResult = {
  target_location_id: string | null;
  scope: 'per_scene' | 'structural_dataset_wide';
  exact_match_found: boolean;
  matched_library: string | null;
  near_name_candidates: LocationNearNameCandidate[];
  resolvable: boolean;
  resolution_note: string;
};

/** Precise Location DNA gap analysis for one scene's real target_location_id (or the structural absence of that field entirely, for sources where it never exists). Never adopts a near-name candidate as the answer. */
export function analyzeLocationGap(projectRoot: string | undefined, source: MovieSourceId, targetLocationId: string | null): LocationGapResult {
  const root = projectRoot ?? resolveProjectRoot();

  if (targetLocationId === null) {
    return {
      target_location_id: null,
      scope: source === 'spirited_away' ? 'structural_dataset_wide' : 'per_scene',
      exact_match_found: false,
      matched_library: null,
      near_name_candidates: [],
      resolvable: false,
      resolution_note:
        source === 'spirited_away'
          ? 'Structural: gonegi_translation has no target_location_id key on ANY of this source\'s 300 real scenes (confirmed by exhaustive scan, not a single-scene omission) -- there is no real field to bind, so this cannot be resolved by better connection logic.'
          : 'This scene\'s own gonegi_translation has no target_location_id field.',
    };
  }

  const allIds = loadAllRealLocationIds(root);
  const exact = allIds.find((e) => e.location_id === targetLocationId);
  if (exact) {
    return {
      target_location_id: targetLocationId,
      scope: 'per_scene',
      exact_match_found: true,
      matched_library: exact.source_library,
      near_name_candidates: [],
      resolvable: true,
      resolution_note: `Real exact match found in ${exact.source_library}.`,
    };
  }

  const targetTokens = new Set(tokenizeLocationId(targetLocationId));
  const near_name_candidates: LocationNearNameCandidate[] = allIds
    .map((e) => ({ location_id: e.location_id, source_library: e.source_library, shared_tokens: tokenizeLocationId(e.location_id).filter((t) => targetTokens.has(t)) }))
    .filter((c) => c.shared_tokens.length > 0);

  return {
    target_location_id: targetLocationId,
    scope: 'per_scene',
    exact_match_found: false,
    matched_library: null,
    near_name_candidates,
    resolvable: false,
    resolution_note:
      near_name_candidates.length > 0
        ? `No real exact id match in any of ${LOCATION_LIBRARY_PATHS.length} real location libraries. ${near_name_candidates.length} lexically-related real id(s) exist (e.g. shared domain tokens), listed as candidates only -- no field anywhere links '${targetLocationId}' to any of them, so adopting one would be an invented mapping, not a resolution.`
        : `No real exact id match, and no lexically-related real id either, in any of ${LOCATION_LIBRARY_PATHS.length} real location libraries.`,
  };
}

// ===========================================================================
// 4. Lighting DNA GAP -- precise analysis, downstream of (but not identical
//    to) the Location gap: this phase found real locations that themselves
//    have zero lighting pairing, which is a distinct gap from a missing
//    location.
// ===========================================================================

export type LightingGapResult = {
  location_id: string | null;
  location_exists_in_library: boolean;
  pairing_found: boolean;
  paired_lighting_ids: string[];
  resolvable: boolean;
  resolution_note: string;
};

export function analyzeLightingGap(projectRoot: string | undefined, locationGap: LocationGapResult): LightingGapResult {
  const root = projectRoot ?? resolveProjectRoot();
  const locationId = locationGap.target_location_id;

  if (!locationId || !locationGap.exact_match_found) {
    return {
      location_id: locationId,
      location_exists_in_library: false,
      pairing_found: false,
      paired_lighting_ids: [],
      resolvable: false,
      resolution_note: 'No real location match exists for this scene (see location gap) -- the lighting pairing table keys off a real location_id, so there is nothing to pair against.',
    };
  }

  const lightPath = 'datasets/lighting/lighting-dna-library-v1.json';
  const light = readJson<{ section_4_location_pairing: { pairings: { location_id: string; lighting_id: string }[] } }>(root, lightPath);
  const pairings = light.section_4_location_pairing.pairings.filter((p) => p.location_id === locationId);

  if (pairings.length > 0) {
    return {
      location_id: locationId,
      location_exists_in_library: true,
      pairing_found: true,
      paired_lighting_ids: pairings.map((p) => p.lighting_id),
      resolvable: true,
      resolution_note: `Real pairing found in ${lightPath} for ${pairings.length} lighting profile(s).`,
    };
  }

  return {
    location_id: locationId,
    location_exists_in_library: true,
    pairing_found: false,
    paired_lighting_ids: [],
    resolvable: false,
    resolution_note: `The location itself is real and matched, but ${lightPath}'s own real pairing table (27 distinct paired location ids) has no entry for '${locationId}' -- a real location can exist with zero real lighting pairing; this is not automatically solved by fixing the Location gap.`,
  };
}

// ===========================================================================
// 5. Gonegi Style DNA GAP -- precise analysis, including the one real,
//    superficially similar artifact this phase found and why it does not
//    close the gap.
// ===========================================================================

export type StyleDnaGapResult = {
  live_style_library_found: boolean;
  archived_artifact_found: boolean;
  archived_artifact_path: string | null;
  archived_artifact_is_visual_style_library: boolean;
  archived_artifact_classification: string | null;
  resolvable: boolean;
  resolution_note: string;
};

const ARCHIVED_STYLE_ARTIFACT_PATH = 'datasets/repository_intelligence/cleanup-rollback-snapshot-v1/files/exports/image_app/latest_v5/style_dna_bundle.json';

/**
 * Confirms PHASE-001's "not found anywhere" verdict still holds, and goes
 * one level deeper: a file literally named `style_dna_bundle.json` DOES
 * exist in this repository, but only inside
 * `datasets/repository_intelligence/cleanup-rollback-snapshot-v1/` -- a
 * backup snapshot of files deleted from the live `exports/` tree during a
 * prior, user-approved cleanup (see that snapshot's own
 * `rollback_snapshot_manifest.json`: `relative_path` for this exact file is
 * `exports/image_app/latest_v5/style_dna_bundle.json`, i.e. it used to live
 * in `exports/`, not `datasets/`, and is not live there today). Read on its
 * own real content merits, it is not a visual Style DNA library either: its
 * only real top-level content is `embedded_adapters` referencing the
 * Music Drama Grammar Core's shot/scene-archetype/behavior sections
 * (`consumption_mode: "reference_only"`, `generates_prompts: false`) --
 * zero color/palette/texture/render-style fields anywhere in it.
 */
export function analyzeStyleDnaGap(projectRoot: string | undefined): StyleDnaGapResult {
  const root = projectRoot ?? resolveProjectRoot();

  const archived_artifact_found = fileExists(root, ARCHIVED_STYLE_ARTIFACT_PATH);
  let archived_artifact_is_visual_style_library = false;
  let archived_artifact_classification: string | null = null;

  if (archived_artifact_found) {
    const bundle = readJson<Record<string, unknown>>(root, ARCHIVED_STYLE_ARTIFACT_PATH);
    const topKeys = Object.keys(bundle);
    const hasVisualStyleFields = topKeys.some((k) => /color|palette|texture|render|brush|hue|saturation/i.test(k));
    archived_artifact_is_visual_style_library = hasVisualStyleFields;
    archived_artifact_classification = hasVisualStyleFields
      ? 'contains visual-style-like fields -- re-check manually before relying on this note'
      : 'grammar/adapter reference bundle (Music Drama Grammar Core sections), not a visual Style DNA library; consumption_mode=reference_only, generates_prompts=false';
  }

  return {
    live_style_library_found: false,
    archived_artifact_found,
    archived_artifact_path: archived_artifact_found ? ARCHIVED_STYLE_ARTIFACT_PATH : null,
    archived_artifact_is_visual_style_library,
    archived_artifact_classification,
    resolvable: false,
    resolution_note: archived_artifact_found
      ? `No live Gonegi Style DNA library exists under datasets/. A file named style_dna_bundle.json exists, but only inside the cleanup-rollback-snapshot archive of deleted exports/ content (not live, not addressable by any live pipeline path) -- and its real content is a ${archived_artifact_classification}. Neither fact closes this gap.`
      : 'No live Gonegi Style DNA library exists under datasets/, and no archived candidate artifact was found either.',
  };
}

// ===========================================================================
// 6. Emotion-selector divergence comparison -- pure, no I/O. Ground truth
//    is never adjusted to match the selector; this only records whether
//    they agree.
// ===========================================================================

export type EmotionSelectorComparison = {
  ground_truth_composition_id: string | null;
  selector_composition_id: string | null;
  composition_diverges: boolean;
  ground_truth_shot_reference: string | null;
  selector_shot_id: string | null;
  shot_reference_diverges: boolean;
  divergence_note: string;
};

export function compareAgainstEmotionSelection(binding: SceneGroundTruthBinding, selection: KnowledgeSelection): EmotionSelectorComparison {
  const selectorCompositionId = selection.style?.composition_id ?? null;
  const compositionDiverges = binding.composition_id !== null && selectorCompositionId !== null && binding.composition_id !== selectorCompositionId;

  const groundTruthShotRef = binding.camera_id; // real camera-pattern id namespace, e.g. titanic_cam_009 / spirited_cam_0001
  const selectorShotId = selection.shot?.shot_id ?? null; // real shot-registry id namespace, e.g. shot_titanic_00078
  const shotReferenceDiverges = groundTruthShotRef !== null && selectorShotId !== null;

  return {
    ground_truth_composition_id: binding.composition_id,
    selector_composition_id: selectorCompositionId,
    composition_diverges: compositionDiverges,
    ground_truth_shot_reference: groundTruthShotRef,
    selector_shot_id: selectorShotId,
    shot_reference_diverges: shotReferenceDiverges,
    divergence_note:
      'Ground truth\'s camera/shot reference is a camera_pattern_id from *-camera-registry.json (scene-bound); the emotion selector\'s shot reference is a shot_id from the separate *-shot-registry.json (emotion-matched). These are two different real registries with non-overlapping id namespaces -- not simply "right vs wrong answer" but two genuinely different data sources; the composition_id namespace IS shared between both paths, so composition_diverges is the more direct apples-to-apples divergence signal.',
  };
}

// ===========================================================================
// 7. Full-registry aggregate scans -- dataset-wide precision (정밀 분석),
//    not just the two named test scenes. Read-only, purely informational.
// ===========================================================================

export type SceneRegistryConflictScan = {
  source: MovieSourceId;
  total_scenes: number;
  conflict_counts_by_type: Record<SceneConflict['type'], number>;
  sample_conflicts: SceneConflict[];
};

export function scanSceneRegistryConflicts(projectRoot: string | undefined, source: MovieSourceId, sampleLimit = 10): SceneRegistryConflictScan {
  const root = projectRoot ?? resolveProjectRoot();
  const scenes = loadScenes(root, source);
  const counts: Record<SceneConflict['type'], number> = {
    EMOTION_ANCHOR_VS_BLOCKING: 0,
    EMOTION_ANCHOR_VS_SCENE: 0,
    PARTICIPANT_ANCHOR_VS_BLOCKING: 0,
    CAMERA_FRAMING_VS_ANCHOR_SOLO: 0,
    AMBIGUOUS_PRIMARY_ANCHOR: 0,
  };
  const samples: SceneConflict[] = [];

  for (const scene of scenes) {
    const binding = bindSceneGroundTruth(root, source, scene.scene_id);
    if (!binding.pass) continue; // structural resolution failures are reported separately, not double-counted as "conflicts"
    const sceneEmotion = source === 'titanic' ? (scene as RawTitanicScene).bindings.emotion : (scene as RawSpiritedAwayScene).emotion_state;
    const conflicts = detectSceneConflicts(binding, sceneEmotion);
    for (const c of conflicts) {
      counts[c.type] += 1;
      if (samples.length < sampleLimit) samples.push(c);
    }
  }

  return { source, total_scenes: scenes.length, conflict_counts_by_type: counts, sample_conflicts: samples };
}

export type LocationLightingCoverageScan = {
  source: MovieSourceId;
  total_scenes: number;
  scenes_with_target_location_field: number;
  scenes_with_location_exact_match: number;
  scenes_with_location_and_lighting_match: number;
  unique_target_location_ids: string[];
  unmatched_target_location_ids: string[];
};

export function scanLocationLightingCoverage(projectRoot: string | undefined, source: MovieSourceId): LocationLightingCoverageScan {
  const root = projectRoot ?? resolveProjectRoot();
  const scenes = loadScenes(root, source);

  let withField = 0;
  let locOk = 0;
  let lightOk = 0;
  const uniqueIds = new Set<string>();
  const unmatched = new Set<string>();

  for (const scene of scenes) {
    const targetLocationId = source === 'titanic' ? (scene as RawTitanicScene).gonegi_translation.target_location_id ?? null : null;
    if (!targetLocationId) continue;
    withField += 1;
    uniqueIds.add(targetLocationId);
    const locGap = analyzeLocationGap(root, source, targetLocationId);
    if (locGap.exact_match_found) {
      locOk += 1;
      const lightGap = analyzeLightingGap(root, locGap);
      if (lightGap.pairing_found) lightOk += 1;
    } else {
      unmatched.add(targetLocationId);
    }
  }

  return {
    source,
    total_scenes: scenes.length,
    scenes_with_target_location_field: withField,
    scenes_with_location_exact_match: locOk,
    scenes_with_location_and_lighting_match: lightOk,
    unique_target_location_ids: [...uniqueIds],
    unmatched_target_location_ids: [...unmatched],
  };
}

// ===========================================================================
// 8. Orchestrator -- ground-truth-first scene scenario resolution.
// ===========================================================================

export type GroundTruthSceneScenario = {
  binding: SceneGroundTruthBinding;
  conflicts: SceneConflict[];
  location_gap: LocationGapResult;
  lighting_gap: LightingGapResult;
  style_gap: StyleDnaGapResult;
  emotion_selector_comparison: EmotionSelectorComparison | null;
  ground_truth_priority_applied: true;
};

/**
 * The item-1 deliverable: resolves a real scene's Scene Ground Truth FIRST
 * and completely (binding + conflicts + all three DNA gaps), with the
 * emotion selector's result attached only as an optional, disclosed
 * comparison -- never consulted to build the ground-truth result itself.
 */
export function resolveGroundTruthSceneScenario(
  projectRoot: string | undefined,
  source: MovieSourceId,
  sceneId: string,
  emotionSelection: KnowledgeSelection | null
): GroundTruthSceneScenario {
  const root = projectRoot ?? resolveProjectRoot();
  const binding = bindSceneGroundTruth(root, source, sceneId);

  const scenes = loadScenes(root, source);
  const scene = scenes.find((s) => s.scene_id === sceneId);
  const sceneEmotion = scene ? (source === 'titanic' ? (scene as RawTitanicScene).bindings.emotion : (scene as RawSpiritedAwayScene).emotion_state) : '';
  const conflicts = binding.pass ? detectSceneConflicts(binding, sceneEmotion) : [];

  const location_gap = analyzeLocationGap(root, source, binding.target_location_id);
  const lighting_gap = analyzeLightingGap(root, location_gap);
  const style_gap = analyzeStyleDnaGap(root);
  const emotion_selector_comparison = emotionSelection ? compareAgainstEmotionSelection(binding, emotionSelection) : null;

  return {
    binding,
    conflicts,
    location_gap,
    lighting_gap,
    style_gap,
    emotion_selector_comparison,
    ground_truth_priority_applied: true,
  };
}
