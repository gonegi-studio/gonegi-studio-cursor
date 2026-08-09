import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import type { MovieSourceId } from './pbrpKnowledgeRepository.js';
import type { KnowledgeSelection } from './pbrpKnowledgeSelector.js';
import {
  detectSceneConflicts,
  analyzeLocationGap,
  type SceneGroundTruthBinding,
  type SceneConflict,
  type LocationGapResult,
} from './pbrpSceneGroundTruthBinder.js';
import {
  resolveSceneAwarePriority,
  buildConflictState,
  detectDualAnchorConflicts,
  reanalyzeLightingGapWithAffinity,
  finalVerifyGonegiStyleDna,
  type SceneAwareKnowledgeSelection,
  type ConflictState,
  type CorrectedLightingGapResult,
} from './pbrpSceneDataReconciliation.js';
import { loadCharacterVisualDnaLibrary, resolveCharacterByRawId, type AiStudioCharacterEntry, type CharacterResolution } from './pbrpCharacterVisualDnaLibrary.js';

/**
 * PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-004: Production Scenario
 * Assembly V1.
 *
 * Connects PHASE-002 (Scene Ground-Truth Binding) and PHASE-003 (Scene Data
 * Reconciliation)'s results into one real, code-generated Production
 * Scenario -- the code form of what PHASE-001 built by hand. Every field is
 * either a real, cited value or an explicit `NOT_DERIVABLE`; no field is
 * ever templated with invented descriptive language. Purely additive: this
 * module imports PHASE-002/003's modules and `pbrpCharacterVisualDnaLibrary.ts`
 * read-only and modifies none of them, `pbrpKnowledgeSelector.ts`, or
 * `pbrpKnowledgeComposer.ts`.
 */

export const PBRP_PRODUCTION_SCENARIO_ASSEMBLER_PHASE =
  'PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-004' as const;

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

// ===========================================================================
// Minimal, additional real reads this assembler needs beyond what
// PHASE-002/003 already expose (each phase's module does its own minimal
// reads, consistent with this repository's existing pattern).
// ===========================================================================

type RawAnchorFull = { anchor_id: string; gonegi_characters?: string[] };

const ANCHOR_PATHS: Record<MovieSourceId, { path: string; arrayKey: string }> = {
  titanic: { path: 'datasets/movie_reconstruction/titanic/titanic-semantic-anchor-registry.json', arrayKey: 'semantic_anchors' },
  spirited_away: { path: 'datasets/movie_reconstruction/spirited_away/spirited-away-semantic-anchor-registry.json', arrayKey: 'anchors' },
};

function loadAnchorsByIds(root: string, source: MovieSourceId, ids: string[]): RawAnchorFull[] {
  const cfg = ANCHOR_PATHS[source];
  const data = readJson<Record<string, RawAnchorFull[]>>(root, cfg.path);
  const all = data[cfg.arrayKey];
  return all.filter((a) => ids.includes(a.anchor_id));
}

type RawLocationEntry = {
  location_id: string;
  location_name: string;
  location_type: string;
  visual_anchors?: string[];
  architectural_anchors?: string[];
  color_anchors?: string[];
};

function loadLocationEntry(root: string, locationId: string): RawLocationEntry | null {
  const lib = readJson<{ locations: RawLocationEntry[] }>(root, 'datasets/location/location-dna-library-v1.json');
  return lib.locations.find((l) => l.location_id === locationId) ?? null;
}

type RawLightingProfile = {
  lighting_id: string;
  cluster_label: string;
  atmosphere: string;
  key_light_color: string;
  contrast_profile: string;
};

function loadLightingProfiles(root: string, lightingIds: string[]): RawLightingProfile[] {
  const light = readJson<{ lighting_profiles: RawLightingProfile[] }>(root, 'datasets/lighting/lighting-dna-library-v1.json');
  return light.lighting_profiles.filter((p) => lightingIds.includes(p.lighting_id));
}

function loadSceneEmotionField(root: string, source: MovieSourceId, sceneId: string): string {
  if (source === 'titanic') {
    const reg = readJson<{ scenes: { scene_id: string; bindings: { emotion: string } }[] }>(
      root,
      'datasets/movie_reconstruction/titanic/titanic-scene-registry.json'
    );
    return reg.scenes.find((s) => s.scene_id === sceneId)?.bindings.emotion ?? '';
  }
  const reg = readJson<{ scenes: { scene_id: string; emotion_state: string }[] }>(
    root,
    'datasets/movie_reconstruction/spirited_away/spirited-away-scene-registry.json'
  );
  return reg.scenes.find((s) => s.scene_id === sceneId)?.emotion_state ?? '';
}

// ===========================================================================
// 2. Character direction -- real Character Visual DNA, resolved for every
//    real cast id named by every one of the scene's real listed anchors
//    (per PHASE-003's cast-authority finding: no single scene-level
//    anchor is authoritative for Spirited Away, so this uses the union of
//    all listed anchors' real gonegi_characters, deduplicated -- a
//    disclosed, non-inventive resolution of a co-equal-real-sources
//    situation, not an arbitrary conflict tie-break).
// ===========================================================================

export type CharacterDirection = {
  cast: CharacterResolution[];
  cast_raw_ids: string[];
  cast_source_note: string;
  fully_resolved: boolean;
};

function buildCharacterDirection(root: string, binding: SceneGroundTruthBinding): CharacterDirection {
  const anchors = loadAnchorsByIds(root, binding.source, binding.all_listed_anchor_ids);
  const rawIds = [...new Set(anchors.flatMap((a) => a.gonegi_characters ?? []))];
  const library = loadCharacterVisualDnaLibrary(root);
  const cast = rawIds.map((id) => resolveCharacterByRawId(library, id));

  return {
    cast,
    cast_raw_ids: rawIds,
    cast_source_note:
      binding.all_listed_anchor_ids.length > 1
        ? `Union of gonegi_characters across all ${binding.all_listed_anchor_ids.length} of this scene's real listed anchors (${binding.all_listed_anchor_ids.join(', ')}) -- PHASE-003 confirmed both are genuinely, evenly used by this scene's real shots, so no single anchor is treated as sole cast authority.`
        : `gonegi_characters from this scene's single, directly-named anchor (${binding.all_listed_anchor_ids[0] ?? 'none'}).`,
    fully_resolved: cast.every((c) => c.resolved !== null),
  };
}

// ===========================================================================
// 3. Camera / Composition / Blocking direction -- real, scene-bound fields
//    only, joined with fixed labels; no adjective or description invented.
// ===========================================================================

export type FieldDirection = {
  id: string | null;
  text: string;
  raw: Record<string, unknown> | null;
};

function buildCameraDirection(binding: SceneGroundTruthBinding): FieldDirection {
  if (!binding.camera) return { id: binding.camera_id, text: 'NOT_DERIVABLE', raw: null };
  const c = binding.camera;
  const text =
    binding.source === 'titanic'
      ? `${c.camera_language} (${c.shot_type}, height=${c.camera_height}, movement=${c.camera_movement}, fov=${c.fov_hint})`
      : `${c.camera_grammar} (${c.camera_framing}, movement=${c.camera_movement}, perspective=${c.camera_perspective}, energy=${c.camera_energy})`;
  return { id: binding.camera_id, text, raw: c };
}

function buildCompositionDirection(binding: SceneGroundTruthBinding): FieldDirection {
  if (!binding.composition) return { id: binding.composition_id, text: 'NOT_DERIVABLE', raw: null };
  const c = binding.composition;
  const text =
    binding.source === 'titanic'
      ? `${c.composition_priority} priority (horizon_weight=${c.horizon_weight}, subject_scale=${c.subject_scale}, negative_space=${c.negative_space_policy})`
      : `foreground=${c.foreground}, midground=${c.midground}, background=${c.background} (composition_score=${c.composition_score})`;
  return { id: binding.composition_id, text, raw: c };
}

function buildBlockingDirection(binding: SceneGroundTruthBinding): FieldDirection {
  if (!binding.blocking) return { id: binding.blocking_id, text: 'NOT_DERIVABLE', raw: null };
  const b = binding.blocking;
  const text =
    binding.source === 'titanic'
      ? `${b.group_layout}, ${b.spatial_relationship} (${(b.character_positions as unknown[]).length} positions)`
      : `${b.group_blocking}, ${b.character_placement} (participant_count=${b.participant_count})`;
  return { id: binding.blocking_id, text, raw: b };
}

// ===========================================================================
// 4-5. Location / Lighting direction -- real descriptive text ONLY when a
//      real match exists; NOT_DERIVABLE otherwise, always with the exact
//      gap reason attached (never a bare "NOT_DERIVABLE" with no cited
//      reason).
// ===========================================================================

export type LocationDirection = {
  location_id: string | null;
  status: 'DERIVED' | 'NOT_DERIVABLE';
  text: string;
  gap: LocationGapResult | null;
};

function buildLocationDirection(root: string, source: MovieSourceId, targetLocationId: string | null): LocationDirection {
  const gap = analyzeLocationGap(root, source, targetLocationId);
  if (!gap.exact_match_found) {
    return { location_id: targetLocationId, status: 'NOT_DERIVABLE', text: `NOT_DERIVABLE: ${gap.resolution_note}`, gap };
  }
  const entry = loadLocationEntry(root, targetLocationId as string);
  if (!entry) {
    // Defensive: analyzeLocationGap said matched, but direct re-read found nothing -- report honestly, never fabricate.
    return { location_id: targetLocationId, status: 'NOT_DERIVABLE', text: 'NOT_DERIVABLE: gap analysis reported a match but direct re-read of the library found none', gap };
  }
  const anchors = [...(entry.visual_anchors ?? []), ...(entry.architectural_anchors ?? [])];
  const text = `${entry.location_name} (${entry.location_type}): ${anchors.join(', ')}${entry.color_anchors ? `; color anchors: ${entry.color_anchors.join(', ')}` : ''}`;
  return { location_id: targetLocationId, status: 'DERIVED', text, gap };
}

export type LightingDirection = {
  status: 'DERIVED' | 'NOT_DERIVABLE';
  text: string;
  correction: CorrectedLightingGapResult | null;
};

function buildLightingDirection(root: string, locationDirection: LocationDirection): LightingDirection {
  if (locationDirection.status !== 'DERIVED' || !locationDirection.location_id) {
    return {
      status: 'NOT_DERIVABLE',
      text: `NOT_DERIVABLE: no real matched location to pair lighting against (${locationDirection.text})`,
      correction: null,
    };
  }
  const correction = reanalyzeLightingGapWithAffinity(root, locationDirection.location_id);
  if (!correction || !correction.resolvable) {
    return {
      status: 'NOT_DERIVABLE',
      text: `NOT_DERIVABLE: ${correction?.correction_note ?? 'no real lighting pairing or location_affinity entry exists for this location'}`,
      correction,
    };
  }
  const profiles = loadLightingProfiles(root, correction.matched_lighting_ids);
  const text = profiles.map((p) => `${p.cluster_label}: ${p.atmosphere} (key_light=${p.key_light_color}, contrast=${p.contrast_profile})`).join(' | ');
  return { status: 'DERIVED', text, correction };
}

// ===========================================================================
// 6-7. Style direction (always NOT_DERIVABLE, per PHASE-002/003's own final
//      verification) + full Production Scenario assembly + Provenance.
// ===========================================================================

export type StyleDirection = { status: 'NOT_DERIVABLE'; text: 'NOT_DERIVABLE'; note: string };

function buildStyleDirection(root: string): StyleDirection {
  const verification = finalVerifyGonegiStyleDna(root);
  return { status: 'NOT_DERIVABLE', text: 'NOT_DERIVABLE', note: verification.final_verdict };
}

export type NetConflictEntry = SceneConflict & { corrected_by_dual_anchor_check?: boolean };

export type ProductionScenario = {
  scene_id: string;
  source: MovieSourceId;
  pass: boolean;
  errors: string[];
  ground_truth_priority: {
    applied_source_registry: SceneAwareKnowledgeSelection['applied_source_registry'];
    priority_reason: SceneAwareKnowledgeSelection['priority_reason'];
  };
  character_direction: CharacterDirection;
  camera_direction: FieldDirection;
  composition_direction: FieldDirection;
  blocking_direction: FieldDirection;
  location_direction: LocationDirection;
  lighting_direction: LightingDirection;
  style_direction: StyleDirection;
  conflict_state: ConflictState;
  net_conflicts: NetConflictEntry[];
  final_text: string;
  provenance: Record<string, string>;
};

/**
 * Corrects the participant/emotion conflicts PHASE-002's single-anchor
 * check raised, using PHASE-003's dual-anchor (all real listed anchors)
 * check -- never silently drops an entry; marks it `corrected_by_dual_
 * anchor_check: true` and keeps it visible in `net_conflicts` for full
 * transparency, while excluding it from the ACTIVE conflict count used by
 * `conflict_state`.
 */
function resolveNetConflicts(base: SceneConflict[], dual: ReturnType<typeof detectDualAnchorConflicts>): NetConflictEntry[] {
  return base.map((c) => {
    if (c.type === 'PARTICIPANT_ANCHOR_VS_BLOCKING' && dual.participant_conflict === false) {
      return { ...c, corrected_by_dual_anchor_check: true };
    }
    if ((c.type === 'EMOTION_ANCHOR_VS_BLOCKING' || c.type === 'EMOTION_ANCHOR_VS_SCENE') && dual.emotion_conflict === false) {
      return { ...c, corrected_by_dual_anchor_check: true };
    }
    return c;
  });
}

function buildFinalText(scenario: Omit<ProductionScenario, 'final_text' | 'provenance'>): string {
  const castText = scenario.character_direction.cast
    .map((c) => (c.resolved ? `${c.resolved.name}: ${c.resolved.visual_dna}` : `${c.raw_id}: NOT_DERIVABLE (${c.resolution_note})`))
    .join(' / ');

  return [
    `Character: ${castText || 'NOT_DERIVABLE'}`,
    `Blocking: ${scenario.blocking_direction.text}`,
    `Camera: ${scenario.camera_direction.text}`,
    `Composition: ${scenario.composition_direction.text}`,
    `Location: ${scenario.location_direction.text}`,
    `Lighting: ${scenario.lighting_direction.text}`,
    `Style: ${scenario.style_direction.text}`,
  ].join('\n');
}

/**
 * The item-6 deliverable: assembles one real Production Scenario for a
 * given scene, using PHASE-002 (binding)/PHASE-003 (priority + reconciled
 * conflicts/gaps) end to end. Every leaf value is either a real, cited
 * field or an explicit `NOT_DERIVABLE` string carrying its own real reason
 * -- never a templated guess.
 */
export function buildProductionScenario(
  projectRoot: string | undefined,
  source: MovieSourceId,
  sceneId: string,
  emotionSelection: KnowledgeSelection
): ProductionScenario {
  const root = projectRoot ?? resolveProjectRoot();
  const awareSelection = resolveSceneAwarePriority(root, source, sceneId, emotionSelection);
  const binding = awareSelection.ground_truth_binding;

  if (!binding.pass) {
    const empty = {
      scene_id: sceneId,
      source,
      pass: false,
      errors: binding.errors,
      ground_truth_priority: { applied_source_registry: awareSelection.applied_source_registry, priority_reason: awareSelection.priority_reason },
      character_direction: { cast: [], cast_raw_ids: [], cast_source_note: 'NOT_DERIVABLE: scene binding failed to resolve', fully_resolved: false },
      camera_direction: { id: null, text: 'NOT_DERIVABLE', raw: null },
      composition_direction: { id: null, text: 'NOT_DERIVABLE', raw: null },
      blocking_direction: { id: null, text: 'NOT_DERIVABLE', raw: null },
      location_direction: { location_id: null, status: 'NOT_DERIVABLE' as const, text: 'NOT_DERIVABLE: scene binding failed to resolve', gap: null },
      lighting_direction: { status: 'NOT_DERIVABLE' as const, text: 'NOT_DERIVABLE: scene binding failed to resolve', correction: null },
      style_direction: buildStyleDirection(root),
      conflict_state: buildConflictState([]),
      net_conflicts: [],
    };
    return { ...empty, final_text: buildFinalText(empty), provenance: { error: `scene binding failed: ${binding.errors.join('; ')}` } };
  }

  const sceneEmotion = loadSceneEmotionField(root, source, sceneId);
  const characterDirection = buildCharacterDirection(root, binding);
  const cameraDirection = buildCameraDirection(binding);
  const compositionDirection = buildCompositionDirection(binding);
  const blockingDirection = buildBlockingDirection(binding);
  const locationDirection = buildLocationDirection(root, source, binding.target_location_id);
  const lightingDirection = buildLightingDirection(root, locationDirection);
  const styleDirection = buildStyleDirection(root);

  const baseConflicts = detectSceneConflicts(binding, sceneEmotion);
  // The dual-anchor emotion check must compare against the SAME independent
  // signal PHASE-002's own check used, not `sceneEmotion` unconditionally:
  // for Titanic that's the bound blocking pattern's own `emotion_staging`
  // (bindings.emotion is a verbatim mirror of the anchor's own emotion, so
  // comparing against it would trivially never conflict, silently
  // "correcting" a real, unrelated conflict it has nothing to do with). For
  // Spirited Away, `sceneEmotion` (scene.emotion_state) already IS the
  // correct independent signal.
  const dualAnchorEmotionComparand =
    binding.source === 'titanic' ? ((binding.blocking?.emotion_staging as string | undefined) ?? sceneEmotion) : sceneEmotion;
  const dualAnchor = detectDualAnchorConflicts(root, binding, dualAnchorEmotionComparand);
  const netConflicts = resolveNetConflicts(baseConflicts, dualAnchor);
  const activeConflicts = netConflicts.filter((c) => !c.corrected_by_dual_anchor_check);
  const conflictState = buildConflictState(activeConflicts);

  const scenarioCore = {
    scene_id: sceneId,
    source,
    pass: true,
    errors: [],
    ground_truth_priority: { applied_source_registry: awareSelection.applied_source_registry, priority_reason: awareSelection.priority_reason },
    character_direction: characterDirection,
    camera_direction: cameraDirection,
    composition_direction: compositionDirection,
    blocking_direction: blockingDirection,
    location_direction: locationDirection,
    lighting_direction: lightingDirection,
    style_direction: styleDirection,
    conflict_state: conflictState,
    net_conflicts: netConflicts,
  };

  const provenance: Record<string, string> = {
    ground_truth_priority: awareSelection.provenance,
    character: characterDirection.cast_source_note,
    camera: `${binding.provenance.camera}`,
    composition: `${binding.provenance.composition}`,
    blocking: `${binding.provenance.blocking}`,
    location: locationDirection.status === 'DERIVED' ? `datasets/location/location-dna-library-v1.json -> ${binding.target_location_id}` : locationDirection.text,
    lighting: lightingDirection.status === 'DERIVED' ? `datasets/lighting/lighting-dna-library-v1.json -> ${lightingDirection.correction?.matched_lighting_ids.join(', ')}` : lightingDirection.text,
    style: styleDirection.note,
    conflicts: `PHASE-002 detectSceneConflicts + PHASE-003 detectDualAnchorConflicts, reconciled without silent removal (see net_conflicts)`,
  };

  return { ...scenarioCore, final_text: buildFinalText(scenarioCore), provenance };
}
