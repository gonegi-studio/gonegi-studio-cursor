import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
  type SourceVideoNumericalDnaRegistry,
} from './sourceVideoNumericalDnaFoundation.js';

export const SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE =
  'PHASE-SOURCE-VIDEO-DNA-REAL-002' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_SYSTEM_ID =
  'SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PASS_VERDICT =
  'PASS_SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_FAIL_VERDICT =
  'FAIL_SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_STATUS =
  'SOURCE_VIDEO_NUMERICAL_DNA_AUDITED' as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_DATASET_DIR =
  'datasets/source_video_numerical_dna_audit' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REGISTRY_PATH =
  `${SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_DATASET_DIR}/source-video-numerical-dna-audit-registry.json` as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REPORT_PATH =
  'reports/source_video_numerical_dna/SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REPORT.json' as const;
export const NUMERICAL_EXTRACTION_FEASIBILITY_REPORT_PATH =
  'reports/source_video_numerical_dna/NUMERICAL_EXTRACTION_FEASIBILITY_REPORT.json' as const;

const EXECUTION_FLAGS = {
  audit_only: true as const,
  metadata_only: true as const,
  gpu_execution: false as const,
  frame_extraction: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

const COVERAGE_TARGETS = {
  ghibli: 7,
  shinkai: 2,
  live_action: 1,
  mori: 5,
  total: 15,
} as const;

export type FeasibilityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ExtractabilityDimension =
  | 'frame_accessibility'
  | 'coordinate_extractability'
  | 'composition_extractability'
  | 'camera_path_extractability'
  | 'blocking_extractability'
  | 'motion_extractability'
  | 'edit_rhythm_extractability';

const EXTRACTABILITY_DIMENSIONS: ExtractabilityDimension[] = [
  'frame_accessibility',
  'coordinate_extractability',
  'composition_extractability',
  'camera_path_extractability',
  'blocking_extractability',
  'motion_extractability',
  'edit_rhythm_extractability',
];

const PRIMARY_SOURCES_WITH_PLANS = new Set([
  'GHIBLI_01',
  'SHINKAI_01',
  'LITTLE_WOMEN_01',
  'MORI_01',
]);

const DNA_ARTIFACT_DIRS = {
  frame_coordinates: 'exports/source_video_dna/frame-coordinate-dna',
  blocking: 'exports/source_video_dna/blocking-dna',
  camera_path: 'exports/source_video_dna/camera-behavior-dna',
  motion_vectors: 'exports/source_video_dna/motion-vector-dna',
  edit_rhythm: 'exports/source_video_dna/edit-rhythm-dna',
  composition: 'exports/source_video_dna/visual-style-numerical-dna',
} as const;

export interface SourceFeasibilitySignals {
  source_file_present: boolean;
  coordinate_plan_present: boolean;
  frame_coordinate_artifact_present: boolean;
  blocking_artifact_present: boolean;
  camera_artifact_present: boolean;
  motion_artifact_present: boolean;
  edit_rhythm_artifact_present: boolean;
  composition_artifact_present: boolean;
  is_primary_source: boolean;
  is_animation_group: boolean;
}

export interface SourceDimensionAssessment {
  frame_accessibility: FeasibilityLevel;
  coordinate_extractability: FeasibilityLevel;
  composition_extractability: FeasibilityLevel;
  camera_path_extractability: FeasibilityLevel;
  blocking_extractability: FeasibilityLevel;
  motion_extractability: FeasibilityLevel;
  edit_rhythm_extractability: FeasibilityLevel;
  source_quality_risk: FeasibilityLevel;
}

export interface SourceNumericalDnaAuditRecord {
  source_id: string;
  source_group: 'ghibli' | 'shinkai' | 'live_action' | 'mori';
  audit_score: number;
  extractable_dimensions: ExtractabilityDimension[];
  blocked_dimensions: ExtractabilityDimension[];
  source_quality_risk: FeasibilityLevel;
  risk_level: FeasibilityLevel;
  dimension_assessment: SourceDimensionAssessment;
  feasibility_class: 'fully_extractable' | 'partially_extractable' | 'not_extractable';
  signals: SourceFeasibilitySignals;
}

export interface SourceVideoNumericalDnaAuditRegistry {
  registry_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_SYSTEM_ID;
  version: 'audit_v1';
  foundation_registry_ref: typeof SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH;
  metadata_only: true;
  audit_only: true;
  coverage: {
    ghibli: number;
    shinkai: number;
    live_action: number;
    mori: number;
    total: number;
    missing_sources: number;
    coverage_ratio: number;
  };
  source_audits: SourceNumericalDnaAuditRecord[];
  generated_at: string;
}

export interface SourceVideoNumericalDnaAuditReportEntry {
  source_id: string;
  audit_score: number;
  extractable_dimensions: ExtractabilityDimension[];
  blocked_dimensions: ExtractabilityDimension[];
  source_quality_risk: FeasibilityLevel;
  risk_level: FeasibilityLevel;
}

export interface SourceVideoNumericalDnaAuditReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_STATUS | 'SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_NOT_READY';
  validation_passed: boolean;
  extraction_feasibility: true;
  numerical_dna_complete: false;
  numerical_dna_extracted: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  all_15_sources_audited: boolean;
  missing_sources: number;
  coverage_ratio: number;
  source_audits: SourceVideoNumericalDnaAuditReportEntry[];
  checks: {
    audit_registry_exists: boolean;
    all_15_sources_audited: boolean;
    missing_sources_zero: boolean;
    coverage_ratio_one: boolean;
    feasibility_report_exists: boolean;
  };
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface NumericalExtractionFeasibilityReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_SYSTEM_ID;
  generated_at: string;
  extraction_feasibility: true;
  numerical_dna_complete: false;
  numerical_dna_extracted: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  fully_extractable: string[];
  partially_extractable: string[];
  not_extractable: string[];
  recommended_extraction_order: string[];
  recommended_next_phase: string;
  coverage: {
    total_sources: number;
    audited_sources: number;
    missing_sources: number;
    coverage_ratio: number;
  };
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fileExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function coordinatePlanPath(sourceId: string): string {
  return `datasets/movie_analysis/coordinate_extraction/plans/coordinate_extraction_${sourceId.toLowerCase()}_v1.json`;
}

function loadFoundationRegistry(root: string): SourceVideoNumericalDnaRegistry {
  const registryPath = path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    throw new Error(`Missing foundation registry: ${SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH}`);
  }
  return JSON.parse(fs.readFileSync(registryPath, 'utf8')) as SourceVideoNumericalDnaRegistry;
}

function collectSignals(
  root: string,
  sourceId: string,
  sourceGroup: 'ghibli' | 'shinkai' | 'live_action' | 'mori',
  isPrimary: boolean
): SourceFeasibilitySignals {
  return {
    source_file_present: fileExists(root, `imports/source_videos/${sourceId}.mp4`),
    coordinate_plan_present:
      PRIMARY_SOURCES_WITH_PLANS.has(sourceId) &&
      fileExists(root, coordinatePlanPath(sourceId)),
    frame_coordinate_artifact_present: fileExists(
      root,
      `${DNA_ARTIFACT_DIRS.frame_coordinates}/${sourceId}.json`
    ),
    blocking_artifact_present: fileExists(root, `${DNA_ARTIFACT_DIRS.blocking}/${sourceId}.json`),
    camera_artifact_present: fileExists(root, `${DNA_ARTIFACT_DIRS.camera_path}/${sourceId}.json`),
    motion_artifact_present: fileExists(root, `${DNA_ARTIFACT_DIRS.motion_vectors}/${sourceId}.json`),
    edit_rhythm_artifact_present: fileExists(
      root,
      `${DNA_ARTIFACT_DIRS.edit_rhythm}/${sourceId}.json`
    ),
    composition_artifact_present: fileExists(
      root,
      `${DNA_ARTIFACT_DIRS.composition}/${sourceId}.json`
    ),
    is_primary_source: isPrimary,
    is_animation_group: sourceGroup !== 'live_action',
  };
}

function levelScore(level: FeasibilityLevel): number {
  if (level === 'LOW') return 3;
  if (level === 'MEDIUM') return 2;
  return 1;
}

function aggregateRisk(levels: FeasibilityLevel[]): FeasibilityLevel {
  const score = levels.reduce((sum, level) => sum + levelScore(level), 0) / levels.length;
  if (score >= 2.5) return 'LOW';
  if (score >= 1.75) return 'MEDIUM';
  return 'HIGH';
}

function assessDimensions(signals: SourceFeasibilitySignals): SourceDimensionAssessment {
  const frame_accessibility: FeasibilityLevel = signals.source_file_present
    ? 'LOW'
    : signals.frame_coordinate_artifact_present
      ? 'MEDIUM'
      : 'HIGH';

  const coordinate_extractability: FeasibilityLevel = signals.coordinate_plan_present
    ? 'LOW'
    : signals.frame_coordinate_artifact_present
      ? 'MEDIUM'
      : signals.is_primary_source
        ? 'MEDIUM'
        : 'HIGH';

  const composition_extractability: FeasibilityLevel = signals.composition_artifact_present
    ? 'MEDIUM'
    : signals.is_animation_group
      ? 'MEDIUM'
      : 'HIGH';

  const camera_path_extractability: FeasibilityLevel = signals.camera_artifact_present
    ? 'MEDIUM'
    : signals.coordinate_plan_present
      ? 'MEDIUM'
      : 'HIGH';

  const blocking_extractability: FeasibilityLevel = signals.blocking_artifact_present
    ? 'MEDIUM'
    : signals.is_animation_group
      ? 'MEDIUM'
      : 'HIGH';

  const motion_extractability: FeasibilityLevel = signals.motion_artifact_present
    ? 'MEDIUM'
    : signals.is_animation_group
      ? 'MEDIUM'
      : 'HIGH';

  const edit_rhythm_extractability: FeasibilityLevel = signals.edit_rhythm_artifact_present
    ? 'MEDIUM'
    : 'MEDIUM';

  const source_quality_risk = aggregateRisk([
    frame_accessibility,
    coordinate_extractability,
    composition_extractability,
    camera_path_extractability,
    blocking_extractability,
    motion_extractability,
    edit_rhythm_extractability,
  ]);

  return {
    frame_accessibility,
    coordinate_extractability,
    composition_extractability,
    camera_path_extractability,
    blocking_extractability,
    motion_extractability,
    edit_rhythm_extractability,
    source_quality_risk,
  };
}

function partitionDimensions(assessment: SourceDimensionAssessment): {
  extractable_dimensions: ExtractabilityDimension[];
  blocked_dimensions: ExtractabilityDimension[];
} {
  const extractable_dimensions: ExtractabilityDimension[] = [];
  const blocked_dimensions: ExtractabilityDimension[] = [];

  for (const dimension of EXTRACTABILITY_DIMENSIONS) {
    const level = assessment[dimension];
    if (level === 'HIGH') {
      blocked_dimensions.push(dimension);
    } else {
      extractable_dimensions.push(dimension);
    }
  }

  return { extractable_dimensions, blocked_dimensions };
}

function computeAuditScore(assessment: SourceDimensionAssessment): number {
  const total = EXTRACTABILITY_DIMENSIONS.reduce(
    (sum, dimension) => sum + levelScore(assessment[dimension]),
    0
  );
  const max = EXTRACTABILITY_DIMENSIONS.length * 3;
  return Math.round((total / max) * 100);
}

function classifyFeasibility(
  auditScore: number,
  assessment: SourceDimensionAssessment,
  signals: SourceFeasibilitySignals
): 'fully_extractable' | 'partially_extractable' | 'not_extractable' {
  const blockedCount = EXTRACTABILITY_DIMENSIONS.filter(
    (dimension) => assessment[dimension] === 'HIGH'
  ).length;

  if (
    blockedCount === 0 &&
    auditScore >= 85 &&
    assessment.frame_accessibility !== 'HIGH'
  ) {
    return 'fully_extractable';
  }

  if (
    blockedCount >= 4 ||
    (assessment.frame_accessibility === 'HIGH' && !signals.frame_coordinate_artifact_present)
  ) {
    return 'not_extractable';
  }

  return 'partially_extractable';
}

export function auditSourceRecord(
  root: string,
  sourceId: string,
  sourceGroup: 'ghibli' | 'shinkai' | 'live_action' | 'mori',
  isPrimary = false
): SourceNumericalDnaAuditRecord {
  const signals = collectSignals(root, sourceId, sourceGroup, isPrimary);
  const dimension_assessment = assessDimensions(signals);
  const { extractable_dimensions, blocked_dimensions } = partitionDimensions(dimension_assessment);
  const audit_score = computeAuditScore(dimension_assessment);
  const feasibility_class = classifyFeasibility(audit_score, dimension_assessment, signals);

  return {
    source_id: sourceId,
    source_group: sourceGroup,
    audit_score,
    extractable_dimensions,
    blocked_dimensions,
    source_quality_risk: dimension_assessment.source_quality_risk,
    risk_level: dimension_assessment.source_quality_risk,
    dimension_assessment,
    feasibility_class,
    signals,
  };
}

export function buildSourceVideoNumericalDnaAuditRegistry(
  root: string
): SourceVideoNumericalDnaAuditRegistry {
  const foundation = loadFoundationRegistry(root);
  const source_audits = foundation.source_records.map((record) =>
    auditSourceRecord(
      root,
      record.source_video_id,
      record.source_group,
      record.primary_source === true
    )
  );

  const groupCounts = {
    ghibli: source_audits.filter((entry) => entry.source_group === 'ghibli').length,
    shinkai: source_audits.filter((entry) => entry.source_group === 'shinkai').length,
    live_action: source_audits.filter((entry) => entry.source_group === 'live_action').length,
    mori: source_audits.filter((entry) => entry.source_group === 'mori').length,
  };

  const missing_sources = Math.max(0, COVERAGE_TARGETS.total - source_audits.length);

  return {
    registry_id: 'source-video-numerical-dna-audit-registry-v1',
    phase: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_SYSTEM_ID,
    version: 'audit_v1',
    foundation_registry_ref: SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
    metadata_only: true,
    audit_only: true,
    coverage: {
      ...groupCounts,
      total: source_audits.length,
      missing_sources,
      coverage_ratio: source_audits.length / COVERAGE_TARGETS.total,
    },
    source_audits,
    generated_at: new Date().toISOString(),
  };
}

export function buildNumericalExtractionFeasibilityReport(
  registry: SourceVideoNumericalDnaAuditRegistry
): NumericalExtractionFeasibilityReport {
  const fully_extractable = registry.source_audits
    .filter((entry) => entry.feasibility_class === 'fully_extractable')
    .map((entry) => entry.source_id);

  const partially_extractable = registry.source_audits
    .filter((entry) => entry.feasibility_class === 'partially_extractable')
    .map((entry) => entry.source_id);

  const not_extractable = registry.source_audits
    .filter((entry) => entry.feasibility_class === 'not_extractable')
    .map((entry) => entry.source_id);

  const recommended_extraction_order = [...registry.source_audits]
    .sort((left, right) => {
      if (left.signals.is_primary_source !== right.signals.is_primary_source) {
        return left.signals.is_primary_source ? -1 : 1;
      }
      if (right.audit_score !== left.audit_score) {
        return right.audit_score - left.audit_score;
      }
      return left.source_id.localeCompare(right.source_id);
    })
    .map((entry) => entry.source_id);

  return {
    report_id: `numerical_extraction_feasibility_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    extraction_feasibility: true,
    numerical_dna_complete: false,
    numerical_dna_extracted: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    fully_extractable,
    partially_extractable,
    not_extractable,
    recommended_extraction_order,
    recommended_next_phase: 'PHASE-SOURCE-VIDEO-DNA-REAL-003_SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_V1',
    coverage: {
      total_sources: COVERAGE_TARGETS.total,
      audited_sources: registry.source_audits.length,
      missing_sources: registry.coverage.missing_sources,
      coverage_ratio: registry.coverage.coverage_ratio,
    },
  };
}

export function runSourceVideoNumericalDnaAuditValidation(
  projectRoot?: string
): SourceVideoNumericalDnaAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SourceVideoNumericalDnaAuditReport['issues'] = [];

  fs.mkdirSync(path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_DATASET_DIR), {
    recursive: true,
  });

  const registry = buildSourceVideoNumericalDnaAuditRegistry(root);
  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REGISTRY_PATH, registry);

  const feasibilityReport = buildNumericalExtractionFeasibilityReport(registry);
  writeJson(root, NUMERICAL_EXTRACTION_FEASIBILITY_REPORT_PATH, feasibilityReport);

  const audit_registry_exists = fileExists(root, SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REGISTRY_PATH);
  const feasibility_report_exists = fileExists(
    root,
    NUMERICAL_EXTRACTION_FEASIBILITY_REPORT_PATH
  );

  const all_15_sources_audited = registry.source_audits.length === COVERAGE_TARGETS.total;
  const missing_sources = registry.coverage.missing_sources;
  const missing_sources_zero = missing_sources === 0;
  const coverage_ratio = registry.coverage.coverage_ratio;
  const coverage_ratio_one = coverage_ratio === 1;

  if (!audit_registry_exists) {
    issues.push({
      code: 'AUDIT_REGISTRY_MISSING',
      message: 'source-video-numerical-dna-audit-registry.json missing',
      severity: 'error',
    });
  }
  if (!all_15_sources_audited) {
    issues.push({
      code: 'INCOMPLETE_AUDIT',
      message: `Expected 15 audited sources, found ${registry.source_audits.length}`,
      severity: 'error',
    });
  }
  if (!missing_sources_zero) {
    issues.push({
      code: 'MISSING_SOURCES',
      message: `missing_sources must be 0, got ${missing_sources}`,
      severity: 'error',
    });
  }
  if (!coverage_ratio_one) {
    issues.push({
      code: 'COVERAGE_RATIO',
      message: `coverage_ratio must be 1.0, got ${coverage_ratio}`,
      severity: 'error',
    });
  }
  if (!feasibility_report_exists) {
    issues.push({
      code: 'FEASIBILITY_REPORT_MISSING',
      message: 'NUMERICAL_EXTRACTION_FEASIBILITY_REPORT.json missing',
      severity: 'error',
    });
  }

  if (registry.coverage.ghibli !== COVERAGE_TARGETS.ghibli) {
    issues.push({ code: 'GHIBLI_COUNT', message: 'ghibli audit count must be 7', severity: 'error' });
  }
  if (registry.coverage.shinkai !== COVERAGE_TARGETS.shinkai) {
    issues.push({ code: 'SHINKAI_COUNT', message: 'shinkai audit count must be 2', severity: 'error' });
  }
  if (registry.coverage.live_action !== COVERAGE_TARGETS.live_action) {
    issues.push({
      code: 'LIVE_ACTION_COUNT',
      message: 'live_action audit count must be 1',
      severity: 'error',
    });
  }
  if (registry.coverage.mori !== COVERAGE_TARGETS.mori) {
    issues.push({ code: 'MORI_COUNT', message: 'mori audit count must be 5', severity: 'error' });
  }

  const validation_passed =
    audit_registry_exists &&
    all_15_sources_audited &&
    missing_sources_zero &&
    coverage_ratio_one &&
    feasibility_report_exists &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const source_audits: SourceVideoNumericalDnaAuditReportEntry[] = registry.source_audits.map(
    (entry) => ({
      source_id: entry.source_id,
      audit_score: entry.audit_score,
      extractable_dimensions: entry.extractable_dimensions,
      blocked_dimensions: entry.blocked_dimensions,
      source_quality_risk: entry.source_quality_risk,
      risk_level: entry.risk_level,
    })
  );

  const report: SourceVideoNumericalDnaAuditReport = {
    report_id: `source_video_numerical_dna_audit_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PASS_VERDICT
      : SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_FAIL_VERDICT,
    status: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_STATUS
      : 'SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_NOT_READY',
    validation_passed,
    extraction_feasibility: true,
    numerical_dna_complete: false,
    numerical_dna_extracted: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    all_15_sources_audited,
    missing_sources,
    coverage_ratio,
    source_audits,
    checks: {
      audit_registry_exists,
      all_15_sources_audited,
      missing_sources_zero,
      coverage_ratio_one,
      feasibility_report_exists,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REPORT_PATH, report);
  return report;
}

export function writeSourceVideoNumericalDnaAuditReport(
  projectRoot?: string
): SourceVideoNumericalDnaAuditReport {
  return runSourceVideoNumericalDnaAuditValidation(projectRoot);
}
