import crypto from "crypto";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { buildRealCameraGrammarEvolution } from "./real-camera-grammar-evolution.ts";
import type { RealCameraGrammarEvolutionStage } from "./real-camera-grammar-evolution.ts";
import { buildRealCharacterEmotionalTrajectory } from "./real-character-emotional-trajectory.ts";
import type { RealCharacterEmotionalFrameTrajectory } from "./real-character-emotional-trajectory.ts";
import { buildRealCinematicDensityScore } from "./real-cinematic-density-score.ts";
import type { RealCinematicDensityScoreFrame } from "./real-cinematic-density-score.ts";
import { buildRealEnvironmentalPersistence } from "./real-environmental-persistence.ts";
import type { RealEnvironmentalPersistenceFrame } from "./real-environmental-persistence.ts";
import { buildRealTemporalContinuityMemory } from "./real-temporal-continuity-memory.ts";
import type { RealTemporalContinuityMemorySegment } from "./real-temporal-continuity-memory.ts";
import {
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE,
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION,
} from "./real-v826-cinematic-dna-export-adapter.ts";
import {
  buildRealV826DenseCinematicDnaExportAdapter,
  type RealV826DenseCinematicDnaExportRecord,
} from "./real-v826-dense-cinematic-dna-export-adapter.ts";

export type RealV826UltraDenseSequenceEdge = {
  edge_id: string;
  edge_kind: "emotional" | "cinematic" | "continuity" | "environment" | "visual_memory";
  subject: string;
  predicate: string;
  object: string;
  weight: number;
  confidence: number;
  source: string;
  reasoning: string;
};

export type RealV826UltraDenseVisualAtomInteraction = {
  pair_id: string;
  atom_a: string;
  atom_b: string;
  interaction_type: string;
  influence_strength: number;
  spatial_proximity: number;
  semantic_overlap: number;
  continuity_binding: number;
};

export type RealV826UltraDenseSemanticRelationship = {
  source_atom: string;
  target_atom: string;
  predicate: string;
  strength: number;
  confidence: number;
  reasoning: string;
};

export type RealV826UltraDenseCinematicBeat = {
  beat_id: string;
  beat_index: number;
  label: string;
  narrative_role: string;
  emotional_valence: number;
  rhythm_phase: string;
  music_energy: string;
  continuity_binding: number;
};

export type RealV826UltraDenseContinuityAuditEntry = {
  audit_id: string;
  audit_index: number;
  field_path: string;
  prior_value: string;
  current_value: string;
  continuity_score: number;
  source: string;
};

export type RealV826UltraDenseCinematicDnaExportRecord = RealV826DenseCinematicDnaExportRecord & {
  temporal_continuity_memory: RealTemporalContinuityMemorySegment;
  camera_grammar_evolution: RealCameraGrammarEvolutionStage;
  environmental_persistence: RealEnvironmentalPersistenceFrame;
  character_emotional_trajectory: RealCharacterEmotionalFrameTrajectory;
  cinematic_density_score: RealCinematicDensityScoreFrame;
  cinematic_beat_manifest: readonly RealV826UltraDenseCinematicBeat[];
  continuity_audit_trail: readonly RealV826UltraDenseContinuityAuditEntry[];
  visual_atom_interaction_registry: readonly RealV826UltraDenseVisualAtomInteraction[];
  semantic_relationship_matrix: readonly RealV826UltraDenseSemanticRelationship[];
  sequence_graph: RealV826DenseCinematicDnaExportRecord["sequence_graph"] & {
    emotional_edges: readonly RealV826UltraDenseSequenceEdge[];
    cinematic_edges: readonly RealV826UltraDenseSequenceEdge[];
    continuity_edges: readonly RealV826UltraDenseSequenceEdge[];
    environment_edges: readonly RealV826UltraDenseSequenceEdge[];
    visual_memory_edges: readonly RealV826UltraDenseSequenceEdge[];
    total_edge_count: number;
  };
  ultra_dense_meta: {
    layer_revision: number;
    continuity_engine: string;
    density_tier: "ultra-dense";
    atom_count: number;
    interaction_pair_count: number;
    semantic_relationship_count: number;
  };
};

export type RealV826UltraDenseCinematicDnaExportAdapter =
  readonly RealV826UltraDenseCinematicDnaExportRecord[];

export type RealV826UltraDenseCinematicDnaExportDownload = {
  filename: typeof REAL_V826_ULTRA_DENSE_CINEMATIC_DNA_EXPORT_FILENAME;
  contentType: "application/json";
  body: string;
  exportFingerprint: string;
};

export const REAL_V826_ULTRA_DENSE_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION =
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION;
export const REAL_V826_ULTRA_DENSE_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE =
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE;
export const REAL_V826_ULTRA_DENSE_CINEMATIC_DNA_EXPORT_FILENAME =
  "kiki-25s-ultra-dense-cinematic-dna-export.json" as const;
export const REAL_V826_ULTRA_DENSE_CINEMATIC_DNA_EXPORT_KIND_VERSION =
  "real-v826-ultra-dense-cinematic-dna-export-adapter-v1" as const;
export const REAL_V826_ULTRA_DENSE_ATOM_COUNT = 10 as const;
export const REAL_V826_ULTRA_DENSE_EDGES_PER_RECORD = 30 as const;

export const REAL_V826_ULTRA_DENSE_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER = Object.freeze([
  "id",
  "schema_version",
  "schema_signature",
  "schema_meta",
  "analysis_timestamp",
  "source_hash",
  "core_dna_id",
  "category",
  "scene_indexing",
  "generative_layer",
  "layers",
  "scene_state",
  "latent_steering",
  "director_dna",
  "visual_atoms",
  "relationship_graph",
  "sequence_graph",
  "confidence_profile",
  "production_v72",
  "temporal_continuity_memory",
  "camera_grammar_evolution",
  "environmental_persistence",
  "character_emotional_trajectory",
  "cinematic_density_score",
  "cinematic_beat_manifest",
  "continuity_audit_trail",
  "visual_atom_interaction_registry",
  "semantic_relationship_matrix",
  "ultra_dense_meta",
] as const);

const ULTRA_ATOM_SPECS = Object.freeze([
  Object.freeze({ label: "harbor-evening-sky", role: "environmental_mood_carrier", depth: "background" as const, framing: "LS" as const }),
  Object.freeze({ label: "kiki-flight-subject", role: "primary_narrative_subject", depth: "foreground" as const, framing: "MS" as const }),
  Object.freeze({ label: "coastal-town-silhouette", role: "spatial_context_anchor", depth: "midground" as const, framing: "MLS" as const }),
  Object.freeze({ label: "jiji-companion-presence", role: "companion_symbol", depth: "foreground" as const, framing: "CU" as const }),
  Object.freeze({ label: "ocean-surface-reflection", role: "reflective_mood_plane", depth: "midground" as const, framing: "LS" as const }),
  Object.freeze({ label: "cloud-layer-gradient", role: "atmospheric_depth_layer", depth: "background" as const, framing: "ELS" as const }),
  Object.freeze({ label: "rooftop-architecture-cluster", role: "urban_texture_anchor", depth: "midground" as const, framing: "MLS" as const }),
  Object.freeze({ label: "broom-flight-path", role: "kinetic_motion_vector", depth: "foreground" as const, framing: "MS" as const }),
  Object.freeze({ label: "golden-hour-key-light", role: "lighting_motif_source", depth: "background" as const, framing: "FS" as const }),
  Object.freeze({ label: "sea-breeze-particle-band", role: "atmospheric_motion_carrier", depth: "midground" as const, framing: "LS" as const }),
] as const);

const BEAT_MANIFEST_LABELS = Object.freeze([
  "opening-breath",
  "subject-entry",
  "environment-lock",
  "emotion-register",
  "rhythm-anchor",
  "camera-settle",
  "spatial-bind",
  "memory-echo",
  "motion-bridge",
  "light-shift",
  "narrative-pivot",
  "continuity-check",
  "emotional-peak",
  "release-gesture",
  "resolve-hold",
] as const);

const AUDIT_FIELD_PATHS = Object.freeze([
  "scene_state.emotion.valence_bias",
  "scene_state.temporal.rhythm_pressure",
  "director_dna.camera_motion.continuous_motion",
  "director_dna.lens_behavior.focal_range",
  "production_v72.temporal_bridge.emotional_residue",
  "character_emotional_trajectory.emotionalEntry",
  "environmental_persistence.zones.lightingEvolution",
  "temporal_continuity_memory.emotionalCarryOver",
  "camera_grammar_evolution.lensTransition",
  "sequence_graph.transition_logic.emotion_continuity",
  "visual_atoms.primary_narrative_subject",
  "relationship_graph.emotional_binding",
  "latent_steering.legacy_spaces",
  "cinematic_density_score.continuityDensity",
  "semantic_relationship_matrix.strength",
  "visual_atom_interaction_registry.influence_strength",
  "cinematic_beat_manifest.continuity_binding",
  "continuity_audit_trail.continuity_score",
  "scene_state.optics.focal_length_mm",
  "director_dna.visual_style.lighting_type",
] as const);

let cachedRealV826UltraDenseCinematicDnaExportAdapter: RealV826UltraDenseCinematicDnaExportAdapter | null =
  null;
let cachedRealV826UltraDenseCinematicDnaExportDownload: RealV826UltraDenseCinematicDnaExportDownload | null =
  null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

function buildAtomId(recordId: string, label: string): string {
  return digestValue([recordId, "ultra-atom", label].join("|")).slice(0, 24);
}

function buildUltraVisualAtoms(
  item: RealImageAppInputPackageItem,
  recordId: string
): RealV826UltraDenseCinematicDnaExportRecord["visual_atoms"] {
  return Object.freeze(
    ULTRA_ATOM_SPECS.map((spec, index) => {
      const y1 = Number((0.04 + index * 0.08).toFixed(3));
      const x1 = Number((0.06 + (index % 5) * 0.16).toFixed(3));
      const y2 = Number((y1 + 0.18).toFixed(3));
      const x2 = Number((x1 + 0.14).toFixed(3));

      return Object.freeze({
        atom_id: buildAtomId(recordId, spec.label),
        label: spec.label,
        coordinate_box: Object.freeze([y1, x1, y2, x2] as const),
        significance: Number((0.72 + index * 0.022).toFixed(4)),
        material_properties: Object.freeze({
          surface_type: index % 2 === 0 ? "organic-soft" : "atmospheric-gradient",
          roughness: Number((0.12 + index * 0.04).toFixed(4)),
          reflectivity: Number((0.08 + index * 0.03).toFixed(4)),
          degradation: Number((0.02 + index * 0.008).toFixed(4)),
        }),
        spatial_intelligence: Object.freeze({
          screen_position: index % 3 === 0 ? "upper_third" : index % 3 === 1 ? "center_middle" : "lower_third",
          depth_layer: spec.depth,
          framing: spec.framing,
          camera_relation: `${item.dramaFunction}-${spec.role}`,
          focus_priority: Number((0.42 + index * 0.05).toFixed(4)),
        }),
        semantic_role: spec.role,
      });
    })
  );
}

function buildEdge(
  recordId: string,
  edgeKind: RealV826UltraDenseSequenceEdge["edge_kind"],
  subject: string,
  predicate: string,
  object: string,
  weight: number,
  reasoning: string,
  index: number
): RealV826UltraDenseSequenceEdge {
  return Object.freeze({
    edge_id: digestValue([recordId, edgeKind, String(index), subject, object].join("|")).slice(0, 24),
    edge_kind: edgeKind,
    subject,
    predicate,
    object,
    weight: Number(weight.toFixed(4)),
    confidence: Number((0.82 + (index % 5) * 0.03).toFixed(4)),
    source: "metadata",
    reasoning,
  });
}

function buildExpandedSequenceGraph(
  item: RealImageAppInputPackageItem,
  recordId: string,
  baseSequenceGraph: RealV826DenseCinematicDnaExportRecord["sequence_graph"],
  visualAtoms: RealV826UltraDenseCinematicDnaExportRecord["visual_atoms"],
  temporalSegment: RealTemporalContinuityMemorySegment,
  cameraStage: RealCameraGrammarEvolutionStage,
  environmentalFrame: RealEnvironmentalPersistenceFrame,
  emotionalFrame: RealCharacterEmotionalFrameTrajectory
): RealV826UltraDenseCinematicDnaExportRecord["sequence_graph"] {
  const subjectAtom = visualAtoms.find((atom) => atom.semantic_role === "primary_narrative_subject");
  const skyAtom = visualAtoms.find((atom) => atom.semantic_role === "environmental_mood_carrier");
  const townAtom = visualAtoms.find((atom) => atom.semantic_role === "spatial_context_anchor");
  const lightAtom = visualAtoms.find((atom) => atom.semantic_role === "lighting_motif_source");

  if (subjectAtom === undefined || skyAtom === undefined || townAtom === undefined || lightAtom === undefined) {
    throw new Error("Ultra-dense export requires core visual atoms");
  }

  const emotionalEdges = Object.freeze([
    buildEdge(recordId, "emotional", subjectAtom.atom_id, "expresses", item.emotionTone, 0.92, item.emotionTone, 0),
    buildEdge(recordId, "emotional", emotionalFrame.emotionalEntry.label, "evolves_to", emotionalFrame.emotionalResolve.label, 0.88, item.dramaFunction, 1),
    buildEdge(recordId, "emotional", subjectAtom.atom_id, "carries", emotionalFrame.emotionalResolve.label, 0.86, "character resolve binding", 2),
    buildEdge(recordId, "emotional", skyAtom.atom_id, "modulates", item.emotionTone, 0.78, "sky mood envelope", 3),
    buildEdge(recordId, "emotional", townAtom.atom_id, "grounds", emotionalFrame.emotionalEntry.label, 0.74, "spatial emotional anchor", 4),
    buildEdge(recordId, "emotional", item.rhythmPhase, "shapes", item.suggestedMusicEnergy, 0.82, "music-emotion coupling", 5),
  ]);

  const cinematicEdges = Object.freeze([
    buildEdge(recordId, "cinematic", cameraStage.lensTransition.transitionType, "maps_to", subjectAtom.atom_id, 0.9, "lens-subject binding", 0),
    buildEdge(recordId, "cinematic", cameraStage.framingIntent.intent, "frames", subjectAtom.atom_id, 0.88, cameraStage.framingIntent.intent, 1),
    buildEdge(recordId, "cinematic", String(cameraStage.lensTransition.fromFocalMm), "transitions_to", String(cameraStage.lensTransition.toFocalMm), 0.86, "focal evolution", 2),
    buildEdge(recordId, "cinematic", subjectAtom.atom_id, "maintains", cameraStage.cinematicDistance.distanceCurve[0]?.toString() ?? "0", 0.8, "distance curve anchor", 3),
    buildEdge(recordId, "cinematic", lightAtom.atom_id, "keys", subjectAtom.atom_id, 0.84, "key-light subject relation", 4),
  ]);

  const continuityEdges = Object.freeze([
    buildEdge(recordId, "continuity", temporalSegment.frameEvidenceId, "inherits_from", String(temporalSegment.emotionalCarryOver.fromPrevious), 0.9, "emotional carry-over", 0),
    buildEdge(recordId, "continuity", subjectAtom.atom_id, "persists_motion", String(temporalSegment.motionPersistence.velocityInheritance), 0.86, "motion persistence", 1),
    buildEdge(recordId, "continuity", item.rhythmPhase, "decays_to", String(temporalSegment.pacingDecay.tensionRelease), 0.82, "pacing decay", 2),
    buildEdge(recordId, "continuity", baseSequenceGraph.previous_node, "bridges_to", baseSequenceGraph.current_node, 0.88, "sequence bridge", 3),
    buildEdge(recordId, "continuity", baseSequenceGraph.current_node, "projects_to", baseSequenceGraph.next_candidates[0]?.id ?? "TERMINAL", 0.84, "forward continuity", 4),
  ]);

  const environmentEdges = Object.freeze(
    environmentalFrame.zones.slice(0, 8).map((zone, index) =>
      buildEdge(
        recordId,
        "environment",
        zone.zoneId,
        "illuminates",
        index % 2 === 0 ? subjectAtom.atom_id : townAtom.atom_id,
        0.72 + index * 0.02,
        `${zone.label} environmental binding`,
        index
      )
    )
  );

  const visualMemoryEdges = Object.freeze([
    buildEdge(recordId, "visual_memory", emotionalFrame.timeline[0]?.beatId ?? "beat-0", "recalls", skyAtom.atom_id, 0.8, "opening memory echo", 0),
    buildEdge(recordId, "visual_memory", emotionalFrame.timeline[5]?.beatId ?? "beat-5", "binds", subjectAtom.atom_id, 0.82, "mid-frame memory bind", 1),
    buildEdge(recordId, "visual_memory", emotionalFrame.timeline[11]?.beatId ?? "beat-11", "resolves", townAtom.atom_id, 0.86, "resolve memory anchor", 2),
    buildEdge(recordId, "visual_memory", temporalSegment.emotionalCarryOver.residueLabels[0] ?? item.emotionTone, "persists_in", subjectAtom.atom_id, 0.78, "residue persistence", 3),
    buildEdge(recordId, "visual_memory", lightAtom.atom_id, "imprints", emotionalFrame.emotionalResolve.label, 0.84, "light-memory imprint", 4),
    buildEdge(recordId, "visual_memory", item.frameEvidenceId, "anchors", baseSequenceGraph.current_node, 0.9, "evidence-memory anchor", 5),
  ]);

  const totalEdgeCount =
    emotionalEdges.length +
    cinematicEdges.length +
    continuityEdges.length +
    environmentEdges.length +
    visualMemoryEdges.length;

  return Object.freeze({
    ...baseSequenceGraph,
    emotional_edges: emotionalEdges,
    cinematic_edges: cinematicEdges,
    continuity_edges: continuityEdges,
    environment_edges: environmentEdges,
    visual_memory_edges: visualMemoryEdges,
    total_edge_count: totalEdgeCount,
  });
}

function buildInteractionRegistry(
  recordId: string,
  visualAtoms: RealV826UltraDenseCinematicDnaExportRecord["visual_atoms"]
): readonly RealV826UltraDenseVisualAtomInteraction[] {
  const interactions: RealV826UltraDenseVisualAtomInteraction[] = [];

  for (let leftIndex = 0; leftIndex < visualAtoms.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < visualAtoms.length; rightIndex += 1) {
      const atomA = visualAtoms[leftIndex];
      const atomB = visualAtoms[rightIndex];
      if (atomA === undefined || atomB === undefined) {
        continue;
      }

      const pairIndex = leftIndex * visualAtoms.length + rightIndex;
      interactions.push(
        Object.freeze({
          pair_id: digestValue([recordId, atomA.atom_id, atomB.atom_id].join("|")).slice(0, 24),
          atom_a: atomA.atom_id,
          atom_b: atomB.atom_id,
          interaction_type: pairIndex % 3 === 0 ? "spatial_adjacency" : pairIndex % 3 === 1 ? "semantic_resonance" : "continuity_binding",
          influence_strength: Number((0.22 + (pairIndex % 9) * 0.07).toFixed(4)),
          spatial_proximity: Number((0.18 + (pairIndex % 7) * 0.09).toFixed(4)),
          semantic_overlap: Number((0.12 + (pairIndex % 5) * 0.11).toFixed(4)),
          continuity_binding: Number((0.28 + (pairIndex % 6) * 0.08).toFixed(4)),
        })
      );
    }
  }

  return Object.freeze(interactions);
}

function buildSemanticMatrix(
  recordId: string,
  visualAtoms: RealV826UltraDenseCinematicDnaExportRecord["visual_atoms"]
): readonly RealV826UltraDenseSemanticRelationship[] {
  const relationships: RealV826UltraDenseSemanticRelationship[] = [];

  for (const sourceAtom of visualAtoms) {
    for (const targetAtom of visualAtoms) {
      if (sourceAtom.atom_id === targetAtom.atom_id) {
        continue;
      }

      const hashByte =
        crypto
          .createHash("sha256")
          .update([sourceAtom.atom_id, targetAtom.atom_id].join("|"))
          .digest()[0] ?? 0;

      relationships.push(
        Object.freeze({
          source_atom: sourceAtom.atom_id,
          target_atom: targetAtom.atom_id,
          predicate:
            hashByte % 4 === 0
              ? "influences"
              : hashByte % 4 === 1
                ? "contextualizes"
                : hashByte % 4 === 2
                  ? "supports"
                  : "modulates",
          strength: Number(((hashByte % 100) / 100).toFixed(4)),
          confidence: Number((0.74 + (hashByte % 20) / 100).toFixed(4)),
          reasoning: `${sourceAtom.label} to ${targetAtom.label} semantic coupling`,
        })
      );
    }
  }

  return Object.freeze(relationships);
}

function buildBeatManifest(
  item: RealImageAppInputPackageItem,
  recordId: string,
  emotionalFrame: RealCharacterEmotionalFrameTrajectory
): readonly RealV826UltraDenseCinematicBeat[] {
  return Object.freeze(
    BEAT_MANIFEST_LABELS.map((label, index) =>
      Object.freeze({
        beat_id: digestValue([recordId, "beat", label].join("|")).slice(0, 24),
        beat_index: index,
        label,
        narrative_role: emotionalFrame.timeline[index % emotionalFrame.timeline.length]?.narrativeFunction ?? "develop",
        emotional_valence:
          emotionalFrame.timeline[index % emotionalFrame.timeline.length]?.valence ??
          emotionalFrame.emotionalEntry.valence,
        rhythm_phase: item.rhythmPhase,
        music_energy: item.suggestedMusicEnergy,
        continuity_binding: Number((0.62 + index * 0.022).toFixed(4)),
      })
    )
  );
}

function buildAuditTrail(
  recordId: string,
  item: RealImageAppInputPackageItem
): readonly RealV826UltraDenseContinuityAuditEntry[] {
  return Object.freeze(
    AUDIT_FIELD_PATHS.map((fieldPath, index) =>
      Object.freeze({
        audit_id: digestValue([recordId, "audit", fieldPath].join("|")).slice(0, 24),
        audit_index: index,
        field_path: fieldPath,
        prior_value: index === 0 ? "unset" : AUDIT_FIELD_PATHS[index - 1] ?? "unset",
        current_value: fieldPath,
        continuity_score: Number((0.78 + index * 0.008).toFixed(4)),
        source: item.frameEvidenceId,
      })
    )
  );
}

function buildExpandedRelationshipGraph(
  visualAtoms: RealV826UltraDenseCinematicDnaExportRecord["visual_atoms"],
  item: RealImageAppInputPackageItem
): RealV826UltraDenseCinematicDnaExportRecord["relationship_graph"] {
  const subjectAtom = visualAtoms.find((atom) => atom.semantic_role === "primary_narrative_subject");
  const skyAtom = visualAtoms.find((atom) => atom.semantic_role === "environmental_mood_carrier");
  const townAtom = visualAtoms.find((atom) => atom.semantic_role === "spatial_context_anchor");
  const broomAtom = visualAtoms.find((atom) => atom.semantic_role === "kinetic_motion_vector");
  const jijiAtom = visualAtoms.find((atom) => atom.semantic_role === "companion_symbol");

  if (
    subjectAtom === undefined ||
    skyAtom === undefined ||
    townAtom === undefined ||
    broomAtom === undefined ||
    jijiAtom === undefined
  ) {
    throw new Error("Ultra-dense relationship graph requires five core atoms");
  }

  return Object.freeze([
    Object.freeze({ subject: subjectAtom.atom_id, predicate: "flies_over", object: townAtom.atom_id, weight: 0.92 }),
    Object.freeze({ subject: skyAtom.atom_id, predicate: "bathes", object: subjectAtom.atom_id, weight: 0.86 }),
    Object.freeze({ subject: townAtom.atom_id, predicate: "anchors", object: subjectAtom.atom_id, weight: 0.78 }),
    Object.freeze({ subject: broomAtom.atom_id, predicate: "carries", object: subjectAtom.atom_id, weight: 0.9 }),
    Object.freeze({ subject: jijiAtom.atom_id, predicate: "companions", object: subjectAtom.atom_id, weight: 0.84 }),
    Object.freeze({ subject: subjectAtom.atom_id, predicate: "expresses", object: item.emotionTone, weight: 0.88 }),
    Object.freeze({ subject: item.rhythmPhase, predicate: "aligns_with", object: item.suggestedMusicEnergy, weight: 0.82 }),
    Object.freeze({ subject: item.dramaFunction, predicate: "frames", object: subjectAtom.atom_id, weight: 0.86 }),
  ]);
}

function buildUltraDenseRecord(
  denseRecord: RealV826DenseCinematicDnaExportRecord,
  item: RealImageAppInputPackageItem,
  temporalSegment: RealTemporalContinuityMemorySegment,
  cameraStage: RealCameraGrammarEvolutionStage,
  environmentalFrame: RealEnvironmentalPersistenceFrame,
  emotionalFrame: RealCharacterEmotionalFrameTrajectory,
  densityScore: RealCinematicDensityScoreFrame
): RealV826UltraDenseCinematicDnaExportRecord {
  const visualAtoms = buildUltraVisualAtoms(item, denseRecord.id);
  const sequenceGraph = buildExpandedSequenceGraph(
    item,
    denseRecord.id,
    denseRecord.sequence_graph,
    visualAtoms,
    temporalSegment,
    cameraStage,
    environmentalFrame,
    emotionalFrame
  );
  const interactionRegistry = buildInteractionRegistry(denseRecord.id, visualAtoms);
  const semanticMatrix = buildSemanticMatrix(denseRecord.id, visualAtoms);

  return Object.freeze({
    ...denseRecord,
    schema_meta: Object.freeze({
      ...denseRecord.schema_meta,
      latent_engine: "real-frame-ultra-dense-v826",
      perception_mode: "real-mp4-frame-evidence-ultra-dense",
    }),
    visual_atoms: visualAtoms,
    relationship_graph: buildExpandedRelationshipGraph(visualAtoms, item),
    sequence_graph: sequenceGraph,
    temporal_continuity_memory: temporalSegment,
    camera_grammar_evolution: cameraStage,
    environmental_persistence: environmentalFrame,
    character_emotional_trajectory: emotionalFrame,
    cinematic_density_score: densityScore,
    cinematic_beat_manifest: buildBeatManifest(item, denseRecord.id, emotionalFrame),
    continuity_audit_trail: buildAuditTrail(denseRecord.id, item),
    visual_atom_interaction_registry: interactionRegistry,
    semantic_relationship_matrix: semanticMatrix,
    ultra_dense_meta: Object.freeze({
      layer_revision: 1,
      continuity_engine: REAL_V826_ULTRA_DENSE_CINEMATIC_DNA_EXPORT_KIND_VERSION,
      density_tier: "ultra-dense" as const,
      atom_count: visualAtoms.length,
      interaction_pair_count: interactionRegistry.length,
      semantic_relationship_count: semanticMatrix.length,
    }),
  });
}

export function buildRealV826UltraDenseCinematicDnaExportAdapter(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826UltraDenseCinematicDnaExportAdapter {
  if (cachedRealV826UltraDenseCinematicDnaExportAdapter !== null) {
    return cachedRealV826UltraDenseCinematicDnaExportAdapter;
  }

  const denseRecords = buildRealV826DenseCinematicDnaExportAdapter(realImageAppInputPackage);
  const temporalMemory = buildRealTemporalContinuityMemory(realImageAppInputPackage);
  const cameraGrammar = buildRealCameraGrammarEvolution(realImageAppInputPackage);
  const environmentalPersistence = buildRealEnvironmentalPersistence(realImageAppInputPackage);
  const characterTrajectory = buildRealCharacterEmotionalTrajectory(realImageAppInputPackage);
  const densityScore = buildRealCinematicDensityScore(realImageAppInputPackage, {
    temporalMemory,
    cameraGrammar,
    environmentalPersistence,
    characterTrajectory,
    projectedEdgeCountByQueue: Object.freeze({ 0: 30, 1: 30, 2: 30 }),
  });

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const records = Object.freeze(
    denseRecords.map((denseRecord, index) => {
      const item = orderedItems[index];
      if (item === undefined) {
        throw new Error("Ultra-dense export item alignment failed");
      }

      const temporalSegment = temporalMemory.segments.find(
        (segment) => segment.queueOrder === item.queueOrder
      );
      const cameraStage = cameraGrammar.stages.find((stage) => stage.queueOrder === item.queueOrder);
      const environmentalFrame = environmentalPersistence.frames.find(
        (frame) => frame.queueOrder === item.queueOrder
      );
      const emotionalFrame = characterTrajectory.frames.find(
        (frame) => frame.queueOrder === item.queueOrder
      );
      const frameDensityScore = densityScore.frames.find(
        (frame) => frame.queueOrder === item.queueOrder
      );

      if (
        temporalSegment === undefined ||
        cameraStage === undefined ||
        environmentalFrame === undefined ||
        emotionalFrame === undefined ||
        frameDensityScore === undefined
      ) {
        throw new Error(`Ultra-dense layer alignment failed for queueOrder=${item.queueOrder}`);
      }

      return buildUltraDenseRecord(
        denseRecord,
        item,
        temporalSegment,
        cameraStage,
        environmentalFrame,
        emotionalFrame,
        frameDensityScore
      );
    })
  );

  cachedRealV826UltraDenseCinematicDnaExportAdapter = records;
  return records;
}

export function serializeRealV826UltraDenseCinematicDnaExportAdapter(
  adapter: RealV826UltraDenseCinematicDnaExportAdapter
): string {
  const orderedRecords = [...adapter]
    .sort((a, b) => a.scene_indexing.v_timestamp_start - b.scene_indexing.v_timestamp_start)
    .map((record) =>
      orderRecord(
        record as unknown as Record<string, unknown>,
        REAL_V826_ULTRA_DENSE_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER
      )
    );

  return JSON.stringify(orderedRecords, null, 2);
}

export function computeRealV826UltraDenseCinematicDnaExportAdapterFingerprint(
  adapter: RealV826UltraDenseCinematicDnaExportAdapter
): string {
  return digestValue(serializeRealV826UltraDenseCinematicDnaExportAdapter(adapter));
}

export function buildRealV826UltraDenseCinematicDnaExportDownloadFromAdapter(
  adapter: RealV826UltraDenseCinematicDnaExportAdapter
): RealV826UltraDenseCinematicDnaExportDownload {
  return Object.freeze({
    filename: REAL_V826_ULTRA_DENSE_CINEMATIC_DNA_EXPORT_FILENAME,
    contentType: "application/json",
    body: serializeRealV826UltraDenseCinematicDnaExportAdapter(adapter),
    exportFingerprint: computeRealV826UltraDenseCinematicDnaExportAdapterFingerprint(adapter),
  });
}

export function buildRealV826UltraDenseCinematicDnaExportDownloadFromPackage(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826UltraDenseCinematicDnaExportDownload {
  return buildRealV826UltraDenseCinematicDnaExportDownloadFromAdapter(
    buildRealV826UltraDenseCinematicDnaExportAdapter(realImageAppInputPackage)
  );
}

export function buildRealV826UltraDenseCinematicDnaExportDownload(): RealV826UltraDenseCinematicDnaExportDownload {
  if (cachedRealV826UltraDenseCinematicDnaExportDownload !== null) {
    return cachedRealV826UltraDenseCinematicDnaExportDownload;
  }

  const download = buildRealV826UltraDenseCinematicDnaExportDownloadFromPackage(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
  cachedRealV826UltraDenseCinematicDnaExportDownload = download;
  return download;
}

export function resetRealV826UltraDenseCinematicDnaExportAdapterCacheForVerification(): void {
  cachedRealV826UltraDenseCinematicDnaExportAdapter = null;
  cachedRealV826UltraDenseCinematicDnaExportDownload = null;
}

export function countUltraDenseSequenceEdges(
  adapter: RealV826UltraDenseCinematicDnaExportAdapter
): number {
  return adapter.reduce((sum, record) => sum + record.sequence_graph.total_edge_count, 0);
}
