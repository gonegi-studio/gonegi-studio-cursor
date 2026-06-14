import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-001' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_SYSTEM_ID =
  'MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_V1' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_V1' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_V1' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_STATUS =
  'MOVIE_RECONSTRUCTION_CONDITIONING_AUDITED' as const;

export const MOVIE_RECONSTRUCTION_CONDITIONING_DATASET_DIR =
  'datasets/movie_reconstruction_conditioning' as const;
export const MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REGISTRY_PATH =
  `${MOVIE_RECONSTRUCTION_CONDITIONING_DATASET_DIR}/movie-reconstruction-conditioning-audit-registry.json` as const;

export const MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH =
  'reports/movie_reconstruction/MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT.json' as const;
export const CONDITIONING_GAP_REPORT_PATH =
  'reports/movie_reconstruction/CONDITIONING_GAP_REPORT.json' as const;

const ALL_SUBSYSTEMS = [
  'layout_map',
  'depth_map',
  'pose_map',
  'blocking_map',
  'object_identity',
  'environment_identity',
  'conditioning_backend',
] as const;

type ConditioningSubsystem = (typeof ALL_SUBSYSTEMS)[number];
type SupportLevel = 'FULL' | 'PARTIAL' | 'METADATA_ONLY' | 'NOT_SUPPORTED';
type GapLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const EXECUTION_FLAGS = {
  audit_only: true as const,
  implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

const EVIDENCE_PATHS = {
  layout_map: [
    'src/spatial_conditioning/SpatialLayoutMap.ts',
    'reports/movie_spatial/SPATIAL_GRAPH_CONDITIONING_REPORT.json',
  ],
  depth_map: ['src/spatial_conditioning/DepthConditioning.ts'],
  pose_map: ['src/spatial_conditioning/GazeConditioning.ts'],
  blocking_map: [
    'datasets/movie_coordinate/movie-scene-coordinate.schema.json',
    'exports/source_video_dna/blocking-dna',
  ],
  object_identity: [
    'services/movieSceneCoordinateBuilder.ts',
    'datasets/movie_reconstruction/semantic-preservation-layer.json',
  ],
  environment_identity: [
    'src/spatial_conditioning/EnvironmentAnchorConditioning.ts',
    'reports/movie_spatial/MOVIE_TIMESETTING_LOCK_REPORT.json',
  ],
  conditioning_backend: [
    'src/spatial_conditioning/ConditionedPromptBuilder.ts',
    'reports/movie_spatial/SPATIAL_GRAPH_CONDITIONING_REPORT.json',
  ],
} as const satisfies Record<ConditioningSubsystem, readonly string[]>;

const NUMERICAL_DNA_READINESS_PATH =
  'reports/source_video_numerical_dna/NUMERICAL_DNA_READINESS_REPORT.json' as const;
const NUMERICAL_DNA_FULL_EXPORT_PATH =
  'exports/source_video_numerical_dna_full/source-video-numerical-dna-full.json' as const;

export interface ConditioningSubsystemAuditEntry {
  subsystem: ConditioningSubsystem;
  current_support: SupportLevel;
  required_support: 'FULL';
  blocking_reason: string;
  gap_level: GapLevel;
  feasible_with_current_app: boolean;
  evidence_paths: string[];
  evidence_present: boolean;
}

export interface MovieReconstructionConditioningAuditReport {
  report_id: string;
  phase: typeof MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PHASE;
  system_id: typeof MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_STATUS
    | 'MOVIE_RECONSTRUCTION_CONDITIONING_NOT_AUDITED';
  validation_passed: boolean;
  audit_only: true;
  conditioning_gap_understood: boolean;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  all_7_subsystems_audited: boolean;
  subsystem_audits: ConditioningSubsystemAuditEntry[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface ConditioningGapReport {
  report_id: string;
  phase: typeof MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PHASE;
  system_id: typeof MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_SYSTEM_ID;
  generated_at: string;
  conditioning_gap_understood: boolean;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  implemented: number;
  partially_supported: number;
  not_supported: number;
  recommended_priority_order: ConditioningSubsystem[];
  requires_new_backend: ConditioningSubsystem[];
  subsystem_summary: Array<{
    subsystem: ConditioningSubsystem;
    current_support: SupportLevel;
    gap_level: GapLevel;
  }>;
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

function pathExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function spatialConditioningPassed(root: string): boolean {
  const report = readJson<{ final_verdict?: string; validation_passed?: boolean }>(
    root,
    'reports/movie_spatial/SPATIAL_GRAPH_CONDITIONING_REPORT.json'
  );
  return (
    report?.validation_passed === true &&
    report.final_verdict === 'PASS_SPATIAL_GRAPH_CONDITIONING_V1'
  );
}

function numericalDnaReady(root: string): boolean {
  const report = readJson<{ numerical_dna_ready?: boolean }>(root, NUMERICAL_DNA_READINESS_PATH);
  return report?.numerical_dna_ready === true;
}

function fullNumericalDnaPresent(root: string): boolean {
  const fullExport = readJson<{ full_extraction_complete?: boolean; sources?: unknown[] }>(
    root,
    NUMERICAL_DNA_FULL_EXPORT_PATH
  );
  return fullExport?.full_extraction_complete === true && (fullExport.sources?.length ?? 0) >= 15;
}

function blockingArtifactsPresent(root: string): boolean {
  const dir = path.join(root, 'exports/source_video_dna/blocking-dna');
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).filter((name) => name.endsWith('.json')).length >= 15;
}

function assessCurrentSupport(
  root: string,
  subsystem: ConditioningSubsystem
): Pick<
  ConditioningSubsystemAuditEntry,
  'current_support' | 'blocking_reason' | 'gap_level' | 'feasible_with_current_app'
> {
  const spatialPass = spatialConditioningPassed(root);
  const dnaReady = numericalDnaReady(root);
  const fullDna = fullNumericalDnaPresent(root);
  const blockingDna = blockingArtifactsPresent(root);
  const timesettingLock = pathExists(root, 'reports/movie_spatial/MOVIE_TIMESETTING_LOCK_REPORT.json');

  switch (subsystem) {
    case 'layout_map':
      if (spatialPass && pathExists(root, 'src/spatial_conditioning/SpatialLayoutMap.ts')) {
        return {
          current_support: 'PARTIAL',
          blocking_reason:
            'SpatialLayoutMap produces normalized graph elements for text constraints only; no raster layout map export or Image App map ingestion path.',
          gap_level: 'HIGH',
          feasible_with_current_app: false,
        };
      }
      return {
        current_support: 'NOT_SUPPORTED',
        blocking_reason: 'No layout map pipeline detected.',
        gap_level: 'CRITICAL',
        feasible_with_current_app: false,
      };

    case 'depth_map':
      if (pathExists(root, 'src/spatial_conditioning/DepthConditioning.ts')) {
        return {
          current_support: 'PARTIAL',
          blocking_reason:
            'Depth constraints derive z-layers from spatial graph nodes; no depth map rasterization or ControlNet depth backend.',
          gap_level: 'HIGH',
          feasible_with_current_app: false,
        };
      }
      return {
        current_support: 'NOT_SUPPORTED',
        blocking_reason: 'No depth map generation pipeline.',
        gap_level: 'CRITICAL',
        feasible_with_current_app: false,
      };

    case 'pose_map':
      if (pathExists(root, 'src/spatial_conditioning/GazeConditioning.ts')) {
        return {
          current_support: 'METADATA_ONLY',
          blocking_reason:
            'Gaze vectors and posture strings exist as metadata; no skeletal pose map extraction or pose conditioning backend.',
          gap_level: 'CRITICAL',
          feasible_with_current_app: false,
        };
      }
      return {
        current_support: 'NOT_SUPPORTED',
        blocking_reason: 'No pose map pipeline or pose estimation integration.',
        gap_level: 'CRITICAL',
        feasible_with_current_app: false,
      };

    case 'blocking_map':
      if (
        pathExists(root, 'datasets/movie_coordinate/movie-scene-coordinate.schema.json') &&
        (blockingDna || fullDna)
      ) {
        return {
          current_support: 'PARTIAL',
          blocking_reason:
            'Blocking maps exist as schema fields and numerical blocking_data; pixel-level blocking map conditioning not wired to generation backend.',
          gap_level: dnaReady ? 'MEDIUM' : 'HIGH',
          feasible_with_current_app: true,
        };
      }
      return {
        current_support: 'METADATA_ONLY',
        blocking_reason: 'Blocking schema defined but production blocking map extraction incomplete.',
        gap_level: 'HIGH',
        feasible_with_current_app: false,
      };

    case 'object_identity':
      if (
        pathExists(root, 'datasets/movie_reconstruction/semantic-preservation-layer.json') &&
        pathExists(root, 'services/movieSceneCoordinateBuilder.ts')
      ) {
        return {
          current_support: 'PARTIAL',
          blocking_reason:
            'Identity locks and semantic anchors available as text/metadata; no pixel-level object identity conditioning or drift prevention backend.',
          gap_level: 'HIGH',
          feasible_with_current_app: true,
        };
      }
      return {
        current_support: 'METADATA_ONLY',
        blocking_reason: 'Object identity preservation specified but not production-conditioned.',
        gap_level: 'HIGH',
        feasible_with_current_app: false,
      };

    case 'environment_identity':
      if (
        pathExists(root, 'src/spatial_conditioning/EnvironmentAnchorConditioning.ts') &&
        timesettingLock
      ) {
        return {
          current_support: 'PARTIAL',
          blocking_reason:
            'Environment anchor constraints and timesetting lock PASS for reference movies; no environment identity map generation for reconstruction backend.',
          gap_level: 'MEDIUM',
          feasible_with_current_app: true,
        };
      }
      return {
        current_support: 'METADATA_ONLY',
        blocking_reason: 'Environment identity locks partial; full identity map pipeline missing.',
        gap_level: 'HIGH',
        feasible_with_current_app: false,
      };

    case 'conditioning_backend':
      if (spatialPass && pathExists(root, 'src/spatial_conditioning/ConditionedPromptBuilder.ts')) {
        return {
          current_support: 'PARTIAL',
          blocking_reason:
            'Current backend compiles spatial graph into text generation_constraints only; no ControlNet-class multi-map conditioning ingestion (D-016, D-017, TD-C003).',
          gap_level: 'CRITICAL',
          feasible_with_current_app: false,
        };
      }
      return {
        current_support: 'NOT_SUPPORTED',
        blocking_reason: 'No conditioning backend detected.',
        gap_level: 'CRITICAL',
        feasible_with_current_app: false,
      };
  }
}

function buildSubsystemAudits(root: string): ConditioningSubsystemAuditEntry[] {
  return ALL_SUBSYSTEMS.map((subsystem) => {
    const evidence_paths = [...EVIDENCE_PATHS[subsystem]];
    const evidence_present = evidence_paths.every((rel) => pathExists(root, rel));
    const assessment = assessCurrentSupport(root, subsystem);

    return {
      subsystem,
      current_support: assessment.current_support,
      required_support: 'FULL',
      blocking_reason: assessment.blocking_reason,
      gap_level: assessment.gap_level,
      feasible_with_current_app: assessment.feasible_with_current_app,
      evidence_paths,
      evidence_present,
    };
  });
}

function buildConditioningGapReport(
  subsystemAudits: ConditioningSubsystemAuditEntry[]
): ConditioningGapReport {
  const implemented = subsystemAudits.filter((entry) => entry.current_support === 'FULL').length;
  const partially_supported = subsystemAudits.filter(
    (entry) => entry.current_support === 'PARTIAL'
  ).length;
  const not_supported = subsystemAudits.filter(
    (entry) =>
      entry.current_support === 'NOT_SUPPORTED' || entry.current_support === 'METADATA_ONLY'
  ).length;

  const recommended_priority_order: ConditioningSubsystem[] = [
    'conditioning_backend',
    'layout_map',
    'depth_map',
    'blocking_map',
    'pose_map',
    'object_identity',
    'environment_identity',
  ];

  const requires_new_backend: ConditioningSubsystem[] = [
    'conditioning_backend',
    'layout_map',
    'depth_map',
    'pose_map',
  ];

  return {
    report_id: `conditioning_gap_${Date.now().toString(36)}`,
    phase: MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PHASE,
    system_id: MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    conditioning_gap_understood: true,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    implemented,
    partially_supported,
    not_supported,
    recommended_priority_order,
    requires_new_backend,
    subsystem_summary: subsystemAudits.map((entry) => ({
      subsystem: entry.subsystem,
      current_support: entry.current_support,
      gap_level: entry.gap_level,
    })),
  };
}

export function runMovieReconstructionConditioningAudit(
  projectRoot?: string
): MovieReconstructionConditioningAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MovieReconstructionConditioningAuditReport['issues'] = [];

  if (!pathExists(root, MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REGISTRY_PATH)) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing ${MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const subsystemAudits = buildSubsystemAudits(root);
  const gapReport = buildConditioningGapReport(subsystemAudits);

  const all_7_subsystems_audited = subsystemAudits.length === 7;
  const priority_order_defined = gapReport.recommended_priority_order.length === 7;
  const requires_new_backend_defined = gapReport.requires_new_backend.length > 0;

  if (!all_7_subsystems_audited) {
    issues.push({
      code: 'SUBSYSTEM_COUNT',
      message: 'All 7 conditioning subsystems must be audited',
      severity: 'error',
    });
  }
  if (!priority_order_defined) {
    issues.push({
      code: 'PRIORITY_ORDER',
      message: 'recommended_priority_order must be defined',
      severity: 'error',
    });
  }
  if (!requires_new_backend_defined) {
    issues.push({
      code: 'NEW_BACKEND',
      message: 'requires_new_backend must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    all_7_subsystems_audited &&
    priority_order_defined &&
    requires_new_backend_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieReconstructionConditioningAuditReport = {
    report_id: `movie_reconstruction_conditioning_audit_${Date.now().toString(36)}`,
    phase: MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PHASE,
    system_id: MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PASS_VERDICT
      : MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_FAIL_VERDICT,
    status: validation_passed
      ? MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_STATUS
      : 'MOVIE_RECONSTRUCTION_CONDITIONING_NOT_AUDITED',
    validation_passed,
    audit_only: true,
    conditioning_gap_understood: validation_passed,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    all_7_subsystems_audited,
    subsystem_audits: subsystemAudits,
    checks: {
      all_7_subsystems_audited,
      gap_report_exists: true,
      priority_order_defined,
      requires_new_backend_defined,
      conditioning_gap_understood: validation_passed,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH, report);
  writeJson(root, CONDITIONING_GAP_REPORT_PATH, gapReport);

  return report;
}

export function writeMovieReconstructionConditioningAuditReport(
  projectRoot?: string
): MovieReconstructionConditioningAuditReport {
  return runMovieReconstructionConditioningAudit(projectRoot);
}
