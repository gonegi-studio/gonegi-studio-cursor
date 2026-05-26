import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  GroundedValue,
  SEQ002_CANDIDATE_FIXTURE_BUILDER_VERSION,
  Seq002CandidateFixtureBuilderResult,
  Seq002FixtureBuildReport,
} from '../types';
import { loadCanonicalExportDataset } from './datasetCompletionAudit';
import {
  SEQ002_CANDIDATE_FIXTURE_OUTPUT_FILE,
  SEQ002_REQUIRED_SCENE_FIELDS,
  SEQ002_TARGET_SEQUENCE_ID,
} from './labImportIngestionContract';
import {
  applyPipelineBCertificationBridge,
  buildDeterministicBCertificationDonor,
} from './pipelineBCertificationBridge';
import {
  loadSeq002CandidateRecords,
  resetSeq002CandidateImportValidatorCache,
  runSeq002CandidateValidation,
} from './seq002CandidateImportValidator';
import { isEmptyValue } from './pipelineBridge';

export const SEQ002_CANDIDATE_FIXTURE_BUILDER_EPOCH = '2026-05-26T23:00:00.000Z';
export { SEQ002_CANDIDATE_FIXTURE_OUTPUT_FILE };

const FIXTURE_SCENE_COUNT = 6;

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function cloneScene(scene: CinematicExtractionResult): CinematicExtractionResult {
  return JSON.parse(JSON.stringify(scene)) as CinematicExtractionResult;
}

function ensureRelationshipGraph(scene: CinematicExtractionResult): void {
  if (!scene.relationship_graph) {
    scene.relationship_graph = [];
  }
  const defaults = [
    { subject: 'kiki', predicate: 'observes', object: 'harbor', weight: 0.82 },
    { subject: 'kiki', predicate: 'carries', object: 'parcel', weight: 0.76 },
    { subject: 'harbor', predicate: 'reflects', object: 'sky', weight: 0.55 },
    { subject: 'companion', predicate: 'follows', object: 'kiki', weight: 0.71 },
  ];
  while (scene.relationship_graph.length < 3) {
    scene.relationship_graph.push(defaults[scene.relationship_graph.length % defaults.length]);
  }
  const weighted = scene.relationship_graph.filter((e) => (e.weight ?? 0) > 0.4).length;
  if (weighted < 2) {
    scene.relationship_graph[0].weight = 0.82;
    scene.relationship_graph[1].weight = 0.76;
  }
}

function ensureCharacterPersistence(scene: CinematicExtractionResult, sceneIndex: number): void {
  if (!scene.visual_atoms) {
    scene.visual_atoms = [];
  }
  const hasSubject = scene.visual_atoms.some(
    (atom) =>
      atom.label?.includes('subject') ||
      atom.label?.includes('character') ||
      atom.label?.includes('witness')
  );
  if (!hasSubject) {
    scene.visual_atoms.unshift({
      atom_id: `SEQ002-FIX-ATOM-${String(sceneIndex + 1).padStart(3, '0')}`,
      label: 'subject_kiki_carryover',
      significance: 0.92,
      spatial_intelligence: {
        screen_position: 'center_middle',
        depth_layer: 'midground',
        framing: 'MCU',
        camera_relation: 'eye-level-gaze',
        focus_priority: 0.9,
      },
    });
  }
  if (!scene.character_persistence) {
    scene.character_persistence = {
      face_topology_lock: round6(0.91 + sceneIndex * 0.01),
      silhouette_persistence: round6(0.88 + sceneIndex * 0.005),
      outfit_continuity_graph: 'seq002_kiki_delivery_uniform',
      gaze_memory: 'harbor_horizon_tracking',
      micro_expression_carryover: round6(0.85 + sceneIndex * 0.01),
    };
  }
}

function ensureEmotionalCarryover(scene: CinematicExtractionResult, sceneIndex: number): void {
  if (!scene.emotional_carryover) {
    scene.emotional_carryover = {
      underlying_mood_base: 'anticipation_build',
      carryover_intensity: round6(0.85 + sceneIndex * 0.01),
      decay_ratio_per_frame: round6(0.02),
      emotional_resonance_active: true,
    };
  }
}

function ensureCameraRhythmMemory(scene: CinematicExtractionResult, sceneIndex: number): void {
  if (!scene.camera_rhythm_memory && !scene.director_dna?.camera_motion) {
    scene.camera_rhythm_memory = {
      rhythm_continuity: round6(0.88 + sceneIndex * 0.01),
      velocity_delta_variance: round6(0.12),
      frame_rate_hz: 24,
      shutter_angle_deg: 180,
    };
  }
}

function grounded<T>(value: T): GroundedValue<T> {
  return {
    value,
    confidence: 0.92,
    source: 'inferred',
    reasoning: 'SEQ-002 fixture carryover from anchor terminal',
  };
}

function ensureTemporalBridge(scene: CinematicExtractionResult, sceneIndex: number): void {
  if (
    isEmptyValue(scene.production_v72?.temporal_bridge) &&
    isEmptyValue(scene.production_v82?.temporal_bridge) &&
    isEmptyValue(scene.temporal_bridge)
  ) {
    scene.production_v72 = scene.production_v72 ?? ({} as NonNullable<CinematicExtractionResult['production_v72']>);
    scene.production_v72.temporal_bridge = {
      inherits_motion_from: `SEQ002-PREV-${String(sceneIndex).padStart(3, '0')}`,
      gaze_vector_continuity: grounded(round6(0.88 + sceneIndex * 0.01)),
      emotional_decay_tau: grounded(round6(0.35)),
      spatial_anchor_offset: [0, 0, 0],
    };
  }
}

function applyPipelineBCertificationFields(
  scene: CinematicExtractionResult,
  sceneIndex: number
): void {
  const donor = buildDeterministicBCertificationDonor(sceneIndex + 100);
  scene.audit_summary = donor.audit_summary;
  scene.golden_record = donor.golden_record;
}

export function buildSeq002CandidateScenes(): {
  scenes: CinematicExtractionResult[];
  anchorTerminalSceneId: string;
  sequenceId: string;
} {
  const sequenceId = SEQ002_TARGET_SEQUENCE_ID;

  const { dataset: canonicalDataset } = loadCanonicalExportDataset();
  const { enrichedDataset } = applyPipelineBCertificationBridge(canonicalDataset, true, []);
  const anchorDataset = enrichedDataset.length > 0 ? enrichedDataset : canonicalDataset;
  const anchorTerminal = anchorDataset[anchorDataset.length - 1];
  const anchorTerminalSceneId = anchorTerminal.id;
  const anchorTerminalEnd = anchorTerminal.scene_indexing?.v_timestamp_end ?? 0;

  const scenes: CinematicExtractionResult[] = [];

  for (let i = 0; i < FIXTURE_SCENE_COUNT; i++) {
    const scene = cloneScene(anchorTerminal);
    const sceneId = `${sequenceId}-FIX-${String(i + 1).padStart(3, '0')}`;
    const start = round6(anchorTerminalEnd + i * 1.5);
    const end = round6(anchorTerminalEnd + (i + 1) * 1.5);

    scene.id = sceneId;
    scene.scene_indexing = {
      ...scene.scene_indexing,
      scene_id: sceneId,
      source_material: 'SEQ-002-lab-import-fixture',
      v_timestamp_start: start,
      v_timestamp_end: end,
    };
    scene.sequence_graph = {
      ...scene.sequence_graph,
      previous_node: i === 0 ? anchorTerminalSceneId : scenes[i - 1].id,
      current_node: sceneId,
      next_candidates: i < FIXTURE_SCENE_COUNT - 1 ? [{ id: `${sequenceId}-FIX-${String(i + 2).padStart(3, '0')}`, probability: 0.9 }] : [],
      transition_logic: {
        energy_delta: round6(0.1 + i * 0.02),
        camera_flow_vector: [0, 0.1 * (i + 1), 0.95],
        emotion_continuity: round6(0.88 + i * 0.02),
      },
    };

    ensureRelationshipGraph(scene);
    ensureCharacterPersistence(scene, i);
    ensureEmotionalCarryover(scene, i);
    ensureCameraRhythmMemory(scene, i);
    ensureTemporalBridge(scene, i);
    applyPipelineBCertificationFields(scene, i);

    scenes.push(scene);
  }

  return { scenes, anchorTerminalSceneId, sequenceId };
}

export function writeSeq002CandidateFixtureFile(scenes: CinematicExtractionResult[]): {
  outputPath: string;
  bytesWritten: number;
} {
  const outputPath = path.join(process.cwd(), SEQ002_CANDIDATE_FIXTURE_OUTPUT_FILE);
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const body = JSON.stringify(scenes, null, 2);
  fs.writeFileSync(outputPath, body, 'utf8');
  return { outputPath, bytesWritten: Buffer.byteLength(body, 'utf8') };
}

export function buildSeq002CandidateFixtureBuilder(
  writeFile: boolean = true
): Seq002CandidateFixtureBuilderResult {
  const { scenes, anchorTerminalSceneId, sequenceId } = buildSeq002CandidateScenes();

  if (writeFile) {
    writeSeq002CandidateFixtureFile(scenes);
    resetSeq002CandidateImportValidatorCache();
  }

  const { sourceFile, records } = writeFile
    ? loadSeq002CandidateRecords()
    : { sourceFile: SEQ002_CANDIDATE_FIXTURE_OUTPUT_FILE, records: scenes };

  const { dataset } = loadCanonicalExportDataset();
  const anchorTerminalEnd = dataset[dataset.length - 1]?.scene_indexing?.v_timestamp_end ?? 0;

  const validation = runSeq002CandidateValidation({
    sourceFile: writeFile ? sourceFile : null,
    records: writeFile ? records : scenes,
    requiredSceneFields: SEQ002_REQUIRED_SCENE_FIELDS,
    minScenes: 1,
    maxScenes: 20,
    anchorTerminalSceneId,
    anchorTerminalEnd,
    contractId: `LIC-FIXTURE-${anchorTerminalSceneId.slice(0, 8)}`,
    contractChecksumRef: 'fixture-build-inline',
    expansionGateBlocked: false,
    includeUpstreamChecks: false,
  });

  const auditCount = scenes.filter((s) => !isEmptyValue(s.audit_summary)).length;
  const goldenCount = scenes.filter((s) => !isEmptyValue(s.golden_record)).length;

  const fixture_build_report: Seq002FixtureBuildReport = {
    output_file: SEQ002_CANDIDATE_FIXTURE_OUTPUT_FILE,
    scene_count: scenes.length,
    anchor_terminal_scene_id: anchorTerminalSceneId,
    sequence_id: sequenceId,
    fixture_scene_ids: scenes.map((s) => s.id),
    pipeline_b_audit_coverage: round6(auditCount / scenes.length),
    pipeline_b_golden_coverage: round6(goldenCount / scenes.length),
    canonical_export_unchanged: true,
    fixture_only: true,
  };

  const builderCore = {
    schema_version: SEQ002_CANDIDATE_FIXTURE_BUILDER_VERSION,
    generated_at: SEQ002_CANDIDATE_FIXTURE_BUILDER_EPOCH,
    fixture_build_report,
    validator_verdict_after_build: validation.validation_verdict,
    approved_for_ingestion_after_build: validation.approved_for_ingestion,
    validation: {
      deterministic_fixture_checksum_stable: true,
      fixture_only: true as const,
      no_canonical_export_mutation: true as const,
      no_provider_calls: true as const,
      no_image_generation: true as const,
    },
  };

  const sceneIdHash = digest(scenes.map((s) => s.id));
  const fixture_checksum = digest([JSON.stringify(builderCore), sceneIdHash]);

  return {
    ...builderCore,
    fixture_checksum,
  };
}

let cachedBuilder: Seq002CandidateFixtureBuilderResult | null = null;

export function buildSeq002CandidateFixtureBuilderPreview(): Seq002CandidateFixtureBuilderResult {
  if (cachedBuilder) return cachedBuilder;
  cachedBuilder = buildSeq002CandidateFixtureBuilder(true);
  return cachedBuilder;
}

export function resetSeq002CandidateFixtureBuilderCache(): void {
  cachedBuilder = null;
}
