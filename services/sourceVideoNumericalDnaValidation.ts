import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_FULL_EXPORT_PATH,
  buildSourceVideoNumericalDnaFullExport,
  type SourceFullExtractionRecord,
  type SourceVideoNumericalDnaFullExport,
} from './sourceVideoNumericalDnaFullExtraction.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
  type SourceVideoNumericalDnaRegistry,
} from './sourceVideoNumericalDnaFoundation.js';

export const SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE =
  'PHASE-SOURCE-VIDEO-DNA-REAL-006' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_SYSTEM_ID =
  'SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PASS_VERDICT =
  'PASS_SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_FAIL_VERDICT =
  'FAIL_SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_STATUS =
  'SOURCE_VIDEO_NUMERICAL_DNA_READY' as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_REPORT_PATH =
  'reports/source_video_numerical_dna/SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_REPORT.json' as const;
export const NUMERICAL_DNA_READINESS_REPORT_PATH =
  'reports/source_video_numerical_dna/NUMERICAL_DNA_READINESS_REPORT.json' as const;
export const NUMERICAL_DNA_TRACEABILITY_REPORT_PATH =
  'reports/source_video_numerical_dna/NUMERICAL_DNA_TRACEABILITY_REPORT.json' as const;

const ALL_SUBSYSTEMS = [
  'frame_coordinates',
  'composition_coordinates',
  'camera_path',
  'blocking_data',
  'motion_vectors',
  'edit_rhythm',
  'scene_remap',
] as const;

type SubsystemId = (typeof ALL_SUBSYSTEMS)[number];

type LinkagePair =
  | 'frame_coordinates↔composition_coordinates'
  | 'composition_coordinates↔camera_path'
  | 'camera_path↔blocking_data'
  | 'blocking_data↔motion_vectors'
  | 'motion_vectors↔edit_rhythm'
  | 'edit_rhythm↔scene_remap';

const LINKAGE_PAIRS: LinkagePair[] = [
  'frame_coordinates↔composition_coordinates',
  'composition_coordinates↔camera_path',
  'camera_path↔blocking_data',
  'blocking_data↔motion_vectors',
  'motion_vectors↔edit_rhythm',
  'edit_rhythm↔scene_remap',
];

const COVERAGE_TARGET = 15;
const VALIDATION_SCORE_THRESHOLD = 0.95;
const TRACEABILITY_SCORE_THRESHOLD = 0.95;
const LINEAGE_INTEGRITY_THRESHOLD = 0.95;
const CONFIDENCE_MIN = 0.7;
const CONFIDENCE_SPREAD_MAX = 0.12;

const EXECUTION_FLAGS = {
  validation_only: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  movie_reconstruction_validation: false as const,
  safe_create_only: true as const,
};

export interface SourceTraceabilityEntry {
  source_id: string;
  traceable_subsystems: SubsystemId[];
  untraceable_subsystems: SubsystemId[];
  traceability_score: number;
}

export interface NumericalDnaTraceabilityReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_SYSTEM_ID;
  generated_at: string;
  source_traceability: SourceTraceabilityEntry[];
  traceability_score: number;
  lineage_integrity_score: number;
}

export interface NumericalDnaReadinessReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_SYSTEM_ID;
  generated_at: string;
  numerical_dna_ready: boolean;
  remaining_blockers: string[];
  recommended_next_phase: string;
  movie_reconstruction_ready: false;
  conditioning_ready: false;
  gpu_ready: false;
}

export interface SourceVideoNumericalDnaValidationReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_STATUS | 'SOURCE_VIDEO_NUMERICAL_DNA_NOT_READY';
  validation_passed: boolean;
  all_7_subsystems_validated: boolean;
  validated_subsystems: SubsystemId[];
  broken_links: number;
  broken_link_details: string[];
  missing_fields: number;
  missing_field_details: string[];
  coverage_ratio: number;
  validation_score: number;
  cross_reference_integrity: boolean;
  confidence_consistency: boolean;
  field_completeness: boolean;
  source_coverage_integrity: boolean;
  numerical_dna_ready: boolean;
  movie_reconstruction_ready: false;
  conditioning_ready: false;
  gpu_ready: false;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T | null {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function loadFullExport(root: string): SourceVideoNumericalDnaFullExport {
  const existing = readJson<SourceVideoNumericalDnaFullExport>(
    root,
    SOURCE_VIDEO_NUMERICAL_DNA_FULL_EXPORT_PATH
  );
  if (
    existing &&
    existing.full_extraction_complete === true &&
    Array.isArray(existing.sources) &&
    existing.sources.length === COVERAGE_TARGET
  ) {
    return existing;
  }
  return buildSourceVideoNumericalDnaFullExport(root);
}

function loadFoundationRegistry(root: string): SourceVideoNumericalDnaRegistry {
  const registry = readJson<SourceVideoNumericalDnaRegistry>(
    root,
    SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH
  );
  if (!registry) {
    throw new Error(`Missing foundation registry: ${SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH}`);
  }
  return registry;
}

function validateSubsystem(source: SourceFullExtractionRecord, subsystem: SubsystemId): boolean {
  switch (subsystem) {
    case 'frame_coordinates':
      return source.frame_coordinates.frames.length > 0;
    case 'composition_coordinates':
      return source.composition_coordinates.frames.length > 0;
    case 'camera_path':
      return source.camera_path.segments.some((segment) => segment.path_samples.length > 0);
    case 'blocking_data':
      return source.blocking_data.frames.length > 0;
    case 'motion_vectors':
      return source.motion_vectors.frame_pairs.length > 0;
    case 'edit_rhythm':
      return source.edit_rhythm.edit_points.length > 0;
    case 'scene_remap':
      return source.scene_remap.scenes.length > 0;
  }
}

function validateLinkage(source: SourceFullExtractionRecord, linkage: LinkagePair): boolean {
  switch (linkage) {
    case 'frame_coordinates↔composition_coordinates': {
      const frameIndices = new Set(source.frame_coordinates.frames.map((frame) => frame.frame_index));
      const compositionIndices = new Set(
        source.composition_coordinates.frames.map((frame) => frame.frame_index)
      );
      if (frameIndices.size === 0 || compositionIndices.size === 0) return false;
      if (frameIndices.size !== compositionIndices.size) return false;
      for (const index of frameIndices) {
        if (!compositionIndices.has(index)) return false;
      }
      return true;
    }
    case 'composition_coordinates↔camera_path': {
      const compositionCount = source.composition_coordinates.frames.length;
      const pathSampleCount = source.camera_path.segments.reduce(
        (sum, segment) => sum + segment.path_samples.length,
        0
      );
      return compositionCount > 0 && pathSampleCount > 0;
    }
    case 'camera_path↔blocking_data': {
      const pathSampleCount = source.camera_path.segments.reduce(
        (sum, segment) => sum + segment.path_samples.length,
        0
      );
      return pathSampleCount > 0 && source.blocking_data.frames.length > 0;
    }
    case 'blocking_data↔motion_vectors':
      return (
        source.blocking_data.frames.length > 0 && source.motion_vectors.frame_pairs.length > 0
      );
    case 'motion_vectors↔edit_rhythm':
      return (
        source.motion_vectors.frame_pairs.length > 0 && source.edit_rhythm.edit_points.length > 0
      );
    case 'edit_rhythm↔scene_remap': {
      if (source.edit_rhythm.edit_points.length === 0 || source.scene_remap.scenes.length === 0) {
        return false;
      }
      return source.scene_remap.scenes.some((scene) =>
        scene.source_scene_id.toLowerCase().includes(source.source_video_id.toLowerCase())
      );
    }
  }
}

function countMissingFields(source: SourceFullExtractionRecord): string[] {
  const missing: string[] = [];
  const prefix = source.source_video_id;

  for (const frame of source.frame_coordinates.frames) {
    if (frame.frame_index === undefined) missing.push(`${prefix}.frame_coordinates.frame_index`);
    if (frame.timestamp_ms === undefined) missing.push(`${prefix}.frame_coordinates.timestamp_ms`);
    if (frame.normalized_x === undefined) missing.push(`${prefix}.frame_coordinates.normalized_x`);
    if (frame.normalized_y === undefined) missing.push(`${prefix}.frame_coordinates.normalized_y`);
    if (frame.confidence_score === undefined) {
      missing.push(`${prefix}.frame_coordinates.confidence_score`);
    }
  }

  for (const frame of source.composition_coordinates.frames) {
    if (!frame.subject_bbox) missing.push(`${prefix}.composition_coordinates.subject_bbox`);
    if (frame.horizon_line_y === undefined) {
      missing.push(`${prefix}.composition_coordinates.horizon_line_y`);
    }
  }

  for (const segment of source.camera_path.segments) {
    for (const sample of segment.path_samples) {
      if (!sample.camera_position) missing.push(`${prefix}.camera_path.camera_position`);
      if (!sample.camera_rotation) missing.push(`${prefix}.camera_path.camera_rotation`);
    }
  }

  for (const frame of source.blocking_data.frames) {
    if (frame.characters.length === 0) missing.push(`${prefix}.blocking_data.characters`);
  }

  for (const pair of source.motion_vectors.frame_pairs) {
    if (!pair.vector_field_ref) missing.push(`${prefix}.motion_vectors.vector_field_ref`);
    if (pair.dominant_motion_magnitude === undefined) {
      missing.push(`${prefix}.motion_vectors.dominant_motion_magnitude`);
    }
  }

  for (const point of source.edit_rhythm.edit_points) {
    if (point.shot_duration_ms === undefined) missing.push(`${prefix}.edit_rhythm.shot_duration_ms`);
    if (!point.cut_type) missing.push(`${prefix}.edit_rhythm.cut_type`);
  }

  for (const scene of source.scene_remap.scenes) {
    if (!scene.gonegi_scene_id) missing.push(`${prefix}.scene_remap.gonegi_scene_id`);
    if (!scene.remap_transform?.matrix) missing.push(`${prefix}.scene_remap.remap_transform`);
    if (Object.keys(scene.character_region_map).length === 0) {
      missing.push(`${prefix}.scene_remap.character_region_map`);
    }
  }

  return [...new Set(missing)];
}

function validateCrossReferences(source: SourceFullExtractionRecord, root: string): boolean {
  const id = source.source_video_id;
  if (source.frame_coordinates.source_video_id !== id) return false;
  if (source.composition_coordinates.source_video_id !== id) return false;
  if (source.camera_path.source_video_id !== id) return false;
  if (source.blocking_data.source_video_id !== id) return false;
  if (source.motion_vectors.source_video_id !== id) return false;
  if (source.edit_rhythm.source_video_id !== id) return false;
  if (source.scene_remap.source_video_id !== id) return false;

  for (const pair of source.motion_vectors.frame_pairs) {
    if (!pair.vector_field_ref.includes(id)) return false;
    const refPath = pair.vector_field_ref.split('#')[0];
    if (!fs.existsSync(path.join(root, refPath))) return false;
  }

  return true;
}

function validateConfidenceConsistency(source: SourceFullExtractionRecord): boolean {
  const scores = [
    source.frame_coordinates.confidence_score,
    source.composition_coordinates.confidence_score,
    source.camera_path.confidence_score,
    source.blocking_data.confidence_score,
    source.motion_vectors.confidence_score,
    source.edit_rhythm.confidence_score,
    source.scene_remap.confidence_score,
    source.confidence_score,
  ];

  if (scores.some((score) => score < CONFIDENCE_MIN)) return false;

  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return scores.every((score) => Math.abs(score - mean) <= CONFIDENCE_SPREAD_MAX);
}

function assessTraceability(
  root: string,
  source: SourceFullExtractionRecord
): SourceTraceabilityEntry {
  const traceable: SubsystemId[] = [];
  const untraceable: SubsystemId[] = [];

  for (const subsystem of ALL_SUBSYSTEMS) {
    const populated = validateSubsystem(source, subsystem);
    const crossRefOk = validateCrossReferences(source, root);
    if (populated && crossRefOk) {
      traceable.push(subsystem);
    } else {
      untraceable.push(subsystem);
    }
  }

  return {
    source_id: source.source_video_id,
    traceable_subsystems: traceable,
    untraceable_subsystems: untraceable,
    traceability_score: Number((traceable.length / ALL_SUBSYSTEMS.length).toFixed(4)),
  };
}

function computeLineageIntegrityScore(
  root: string,
  fullExport: SourceVideoNumericalDnaFullExport,
  foundation: SourceVideoNumericalDnaRegistry
): number {
  const registryIds = new Set(foundation.source_records.map((record) => record.source_video_id));
  let passed = 0;
  let total = 0;

  for (const source of fullExport.sources) {
    total += 1;
    const inRegistry = registryIds.has(source.source_video_id);
    const exportExists = fs.existsSync(path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_FULL_EXPORT_PATH));
    const motionRefsOk = source.motion_vectors.frame_pairs.every((pair) => {
      const refPath = pair.vector_field_ref.split('#')[0];
      return fs.existsSync(path.join(root, refPath));
    });
    if (inRegistry && exportExists && motionRefsOk && fullExport.full_extraction_complete) {
      passed += 1;
    }
  }

  return Number((passed / Math.max(total, 1)).toFixed(4));
}

export function runSourceVideoNumericalDnaValidation(
  projectRoot?: string
): SourceVideoNumericalDnaValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SourceVideoNumericalDnaValidationReport['issues'] = [];
  const fullExport = loadFullExport(root);
  const foundation = loadFoundationRegistry(root);

  const validated_subsystems: SubsystemId[] = [];
  for (const subsystem of ALL_SUBSYSTEMS) {
    const allValid = fullExport.sources.every((source) => validateSubsystem(source, subsystem));
    if (allValid) validated_subsystems.push(subsystem);
  }

  const broken_link_details: string[] = [];
  for (const source of fullExport.sources) {
    for (const linkage of LINKAGE_PAIRS) {
      if (!validateLinkage(source, linkage)) {
        broken_link_details.push(`${source.source_video_id}:${linkage}`);
      }
    }
  }

  const missing_field_details: string[] = [];
  for (const source of fullExport.sources) {
    missing_field_details.push(...countMissingFields(source));
  }

  const cross_reference_integrity = fullExport.sources.every((source) =>
    validateCrossReferences(source, root)
  );
  const confidence_consistency = fullExport.sources.every((source) =>
    validateConfidenceConsistency(source)
  );
  const field_completeness = missing_field_details.length === 0;

  const registryIds = new Set(foundation.source_records.map((record) => record.source_video_id));
  const exportSourceIds = new Set(fullExport.sources.map((source) => source.source_video_id));
  const source_coverage_integrity =
    fullExport.coverage.coverage_ratio === 1 &&
    fullExport.coverage.missing_sources === 0 &&
    fullExport.coverage.total === COVERAGE_TARGET &&
    foundation.coverage.missing_records === 0 &&
    [...registryIds].every((id) => exportSourceIds.has(id));

  const coverage_ratio = fullExport.coverage.coverage_ratio;
  const broken_links = broken_link_details.length;
  const missing_fields = missing_field_details.length;
  const all_7_subsystems_validated = validated_subsystems.length === 7;

  const subsystemScore = validated_subsystems.length / ALL_SUBSYSTEMS.length;
  const linkageScore =
    1 -
    broken_links / Math.max(LINKAGE_PAIRS.length * fullExport.sources.length, 1);
  const fieldScore = field_completeness ? 1 : Math.max(0, 1 - missing_fields / 100);
  const coverageScore = source_coverage_integrity ? 1 : coverage_ratio;
  const crossRefScore = cross_reference_integrity ? 1 : 0;
  const confidenceScore = confidence_consistency ? 1 : 0;

  const validation_score = Number(
    (
      subsystemScore * 0.25 +
      linkageScore * 0.25 +
      fieldScore * 0.15 +
      coverageScore * 0.15 +
      crossRefScore * 0.1 +
      confidenceScore * 0.1
    ).toFixed(4)
  );

  const sourceTraceability = fullExport.sources.map((source) => assessTraceability(root, source));
  const traceability_score = Number(
    (
      sourceTraceability.reduce((sum, entry) => sum + entry.traceability_score, 0) /
      Math.max(sourceTraceability.length, 1)
    ).toFixed(4)
  );
  const lineage_integrity_score = computeLineageIntegrityScore(root, fullExport, foundation);

  if (!all_7_subsystems_validated) {
    issues.push({
      code: 'SUBSYSTEMS_INCOMPLETE',
      message: 'Not all 7 subsystems validated across all sources',
      severity: 'error',
    });
  }
  if (broken_links > 0) {
    issues.push({
      code: 'BROKEN_LINKS',
      message: `Found ${broken_links} broken subsystem linkages`,
      severity: 'error',
    });
  }
  if (missing_fields > 0) {
    issues.push({
      code: 'MISSING_FIELDS',
      message: `Found ${missing_fields} missing required fields`,
      severity: 'error',
    });
  }
  if (!cross_reference_integrity) {
    issues.push({
      code: 'CROSS_REFERENCE',
      message: 'Cross-reference integrity check failed',
      severity: 'error',
    });
  }
  if (!confidence_consistency) {
    issues.push({
      code: 'CONFIDENCE',
      message: 'Confidence consistency check failed',
      severity: 'error',
    });
  }
  if (!source_coverage_integrity || coverage_ratio !== 1) {
    issues.push({
      code: 'COVERAGE',
      message: 'Source coverage integrity check failed',
      severity: 'error',
    });
  }
  if (validation_score < VALIDATION_SCORE_THRESHOLD) {
    issues.push({
      code: 'VALIDATION_SCORE',
      message: `validation_score ${validation_score} below threshold ${VALIDATION_SCORE_THRESHOLD}`,
      severity: 'error',
    });
  }
  if (traceability_score < TRACEABILITY_SCORE_THRESHOLD) {
    issues.push({
      code: 'TRACEABILITY',
      message: `traceability_score ${traceability_score} below threshold ${TRACEABILITY_SCORE_THRESHOLD}`,
      severity: 'error',
    });
  }
  if (lineage_integrity_score < LINEAGE_INTEGRITY_THRESHOLD) {
    issues.push({
      code: 'LINEAGE',
      message: `lineage_integrity_score ${lineage_integrity_score} below threshold ${LINEAGE_INTEGRITY_THRESHOLD}`,
      severity: 'error',
    });
  }

  const numerical_dna_ready =
    all_7_subsystems_validated &&
    broken_links === 0 &&
    missing_fields === 0 &&
    coverage_ratio === 1 &&
    validation_score >= VALIDATION_SCORE_THRESHOLD &&
    traceability_score >= TRACEABILITY_SCORE_THRESHOLD &&
    lineage_integrity_score >= LINEAGE_INTEGRITY_THRESHOLD &&
    cross_reference_integrity &&
    confidence_consistency &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const validation_passed = numerical_dna_ready;

  const validationReport: SourceVideoNumericalDnaValidationReport = {
    report_id: `source_video_numerical_dna_validation_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PASS_VERDICT
      : SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_FAIL_VERDICT,
    status: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_STATUS
      : 'SOURCE_VIDEO_NUMERICAL_DNA_NOT_READY',
    validation_passed,
    all_7_subsystems_validated,
    validated_subsystems,
    broken_links,
    broken_link_details,
    missing_fields,
    missing_field_details,
    coverage_ratio,
    validation_score,
    cross_reference_integrity,
    confidence_consistency,
    field_completeness,
    source_coverage_integrity,
    numerical_dna_ready,
    movie_reconstruction_ready: false,
    conditioning_ready: false,
    gpu_ready: false,
    checks: {
      all_7_subsystems_validated,
      broken_links_zero: broken_links === 0,
      missing_fields_zero: missing_fields === 0,
      coverage_ratio_one: coverage_ratio === 1,
      validation_score_threshold: validation_score >= VALIDATION_SCORE_THRESHOLD,
      traceability_score_threshold: traceability_score >= TRACEABILITY_SCORE_THRESHOLD,
      lineage_integrity_threshold: lineage_integrity_score >= LINEAGE_INTEGRITY_THRESHOLD,
      cross_reference_integrity,
      confidence_consistency,
      field_completeness,
      source_coverage_integrity,
      numerical_dna_ready,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  const readinessReport: NumericalDnaReadinessReport = {
    report_id: `numerical_dna_readiness_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    numerical_dna_ready,
    remaining_blockers: numerical_dna_ready
      ? []
      : issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message),
    recommended_next_phase: numerical_dna_ready
      ? 'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-001'
      : 'PHASE-SOURCE-VIDEO-DNA-REAL-006_SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_V1',
    movie_reconstruction_ready: false,
    conditioning_ready: false,
    gpu_ready: false,
  };

  const traceabilityReport: NumericalDnaTraceabilityReport = {
    report_id: `numerical_dna_traceability_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    source_traceability: sourceTraceability,
    traceability_score,
    lineage_integrity_score,
  };

  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_REPORT_PATH, validationReport);
  writeJson(root, NUMERICAL_DNA_READINESS_REPORT_PATH, readinessReport);
  writeJson(root, NUMERICAL_DNA_TRACEABILITY_REPORT_PATH, traceabilityReport);

  return validationReport;
}

export function writeSourceVideoNumericalDnaValidationReport(
  projectRoot?: string
): SourceVideoNumericalDnaValidationReport {
  return runSourceVideoNumericalDnaValidation(projectRoot);
}
