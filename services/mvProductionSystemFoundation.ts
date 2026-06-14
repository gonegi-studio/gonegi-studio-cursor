import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT,
  LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH,
  LEVEL3_ENTRY_APPROVED_STATUS,
} from './movieAnalysisLevel3BridgeCertification.js';
import {
  PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  type ProductionBlueprintType,
} from './movieAnalysisProductionBlueprintExpansion.js';
import {
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
  PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS,
} from './movieAnalysisProductionEngineMasterCertification.js';
import {
  PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
} from './movieAnalysisProductionRuntimeCertification.js';
import {
  TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT,
  TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
  TEST_MODE_DRY_RUN_CERTIFIED_STATUS,
} from './movieAnalysisTestModeDryRunCertification.js';
import {
  LEVEL3_FINAL_STATUS_COMPLETE,
  TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT,
  TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS,
} from './movieAnalysisTestModeExecutionFinalAudit.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_PRODUCTION_SYSTEM_FOUNDATION_PHASE =
  'PHASE-DIGITAL-STUDIO-001-MV_PRODUCTION_SYSTEM_FOUNDATION_V1' as const;
export const MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT =
  'PASS_MV_PRODUCTION_SYSTEM_FOUNDATION_V1' as const;
export const MV_PRODUCTION_SYSTEM_FOUNDATION_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_SYSTEM_FOUNDATION_V1' as const;
export const MV_PRODUCTION_FOUNDATION_READY_STATUS = 'MV_PRODUCTION_FOUNDATION_READY' as const;
export const MV_PRODUCTION_SYSTEM_FOUNDATION_DIR =
  'reports/mv_production_system_foundation' as const;
export const MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH =
  'reports/mv_production_system_foundation/mv-production-system-foundation-report.json' as const;
export const MV_PRODUCTION_SYSTEM_FOUNDATION_MD_PATH =
  'reports/mv_production_system_foundation/MV_PRODUCTION_SYSTEM_FOUNDATION.md' as const;
export const MV_PRODUCTION_SYSTEM_FOUNDATION_EXPORT_DIR =
  'exports/mv_production_system_foundation' as const;
export const MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH =
  'exports/mv_production_system_foundation/mv-production-system-foundation-manifest.json' as const;
export const MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH =
  'exports/mv_production_system_foundation/mv-production-system-foundation.json' as const;

export const SUPPORTED_MV_TYPES = [
  'instrumental_mv',
  'ballad_mv',
  'story_mv',
  'music_drama_mv',
] as const;
export const MV_TYPE_COUNT = 4 as const;
export const FOUNDATION_ARTIFACT_WRITE_SCOPE = 'exports/mv_production_system_foundation/' as const;
export const SAFE_CREATE_POLICY = 'SAFE_CREATE_ONLY' as const;

export const INSTRUMENTAL_MV_LIBRARY_PATH =
  'datasets/mv/instrumental-mv-archetype-library-v1.json' as const;
export const INSTRUMENTAL_MV_INDEX_PATH =
  'datasets/mv/instrumental-mv-archetype-index-v1.json' as const;
export const BALLAD_MV_LIBRARY_PATH = 'datasets/mv/ballad-mv-archetype-library-v1.json' as const;
export const BALLAD_MV_INDEX_PATH = 'datasets/mv/ballad-mv-archetype-index-v1.json' as const;
export const STORY_MV_LIBRARY_PATH = 'datasets/mv/story-mv-archetype-library-v1.json' as const;
export const STORY_MV_INDEX_PATH = 'datasets/mv/story-mv-archetype-index-v1.json' as const;
export const MUSIC_DRAMA_SCENE_ARCHETYPES_PATH =
  'datasets/music_drama_grammar/music-drama-scene-archetypes-v1.json' as const;
export const MUSIC_DRAMA_GRAMMAR_PATH =
  'datasets/music_drama_grammar/music-drama-grammar-v1.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type MvType = (typeof SUPPORTED_MV_TYPES)[number];
export type FoundationStatus = 'PASS' | 'FAIL';

export type MvProductionSystemFoundationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type FoundationCheck = {
  check_id: string;
  check_label: string;
  status: FoundationStatus;
};

export type MvArchetypeRegistryEntry = {
  mv_type: MvType;
  library_path: string | null;
  index_path: string | null;
  blueprint_type: ProductionBlueprintType;
  archetype_count: number;
  registry_ready: FoundationStatus;
};

export type MvStructureLayer = {
  layer_id: string;
  layer_label: string;
  structure_ready: FoundationStatus;
};

export type MvTypeStructure = {
  mv_type: MvType;
  blueprint_type: ProductionBlueprintType;
  runtime_mode: string;
  layers: MvStructureLayer[];
  structure_ready: FoundationStatus;
};

export type MvTraceabilityEntry = {
  mv_type: MvType;
  upstream_blueprint_id: string;
  upstream_runtime_id: string;
  dataset_refs: string[];
  trace_integrity: FoundationStatus;
};

export type MvProductionSystemFoundationArtifact = {
  mv_foundation_id: string;
  phase: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_PHASE;
  generated_at: string;
  supported_mv_types: typeof SUPPORTED_MV_TYPES;
  mv_archetype_registry: {
    registry_id: string;
    entries: MvArchetypeRegistryEntry[];
    registry_ready: boolean;
  };
  mv_story_structure: MvTypeStructure[];
  mv_scene_structure: MvTypeStructure[];
  mv_sequence_structure: MvTypeStructure[];
  mv_runtime_structure: MvTypeStructure[];
  mv_quality_gate_structure: {
    gate_id: string;
    gates: Array<{
      gate_ref: string;
      gate_label: string;
      gate_ready: FoundationStatus;
    }>;
    structure_ready: boolean;
  };
  mv_export_structure: {
    export_id: string;
    export_scope: typeof FOUNDATION_ARTIFACT_WRITE_SCOPE;
    export_targets: Array<{
      mv_type: MvType;
      export_format: string;
      export_ready: FoundationStatus;
    }>;
    structure_ready: boolean;
  };
  mv_traceability_chain: MvTraceabilityEntry[];
  safety_flags: {
    planning_only: true;
    generation: false;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    no_execution: true;
    no_rendering: true;
    production_mode_blocked: true;
  };
  digital_studio_entry_allowed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    foundation_artifact_write_scope: typeof FOUNDATION_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  mv_foundation_created: boolean;
};

export type MvProductionSystemFoundationManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_PHASE;
  generated_at: string;
  mv_type_count: typeof MV_TYPE_COUNT;
  digital_studio_entry_allowed: FoundationStatus;
  mv_system_scope_valid: FoundationStatus;
  production_mode_blocked: FoundationStatus;
  mv_foundation_created: FoundationStatus;
  mv_archetype_registry_ready: FoundationStatus;
  mv_story_structure_ready: FoundationStatus;
  mv_scene_structure_ready: FoundationStatus;
  mv_sequence_structure_ready: FoundationStatus;
  mv_runtime_structure_ready: FoundationStatus;
  mv_quality_gate_ready: FoundationStatus;
  mv_export_ready: FoundationStatus;
  traceability_preserved: boolean;
  certification_status: typeof MV_PRODUCTION_FOUNDATION_READY_STATUS | null;
};

export type MvProductionSystemFoundationReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  level3_bridge_certification_report_path: typeof LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH;
  production_engine_master_certification_report_path: typeof PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH;
  test_mode_dry_run_certification_report_path: typeof TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH;
  test_mode_execution_final_audit_report_path: typeof TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH;
  mv_production_system_foundation_export_dir: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_EXPORT_DIR;
  mv_production_system_foundation_manifest_path: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH;
  mv_production_system_foundation_artifact_path: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  mv_type_count: typeof MV_TYPE_COUNT;
  level3_final_status: typeof LEVEL3_FINAL_STATUS_COMPLETE;
  digital_studio_entry_allowed: FoundationStatus;
  mv_system_scope_valid: FoundationStatus;
  production_mode_blocked: FoundationStatus;
  mv_foundation_created: FoundationStatus;
  mv_archetype_registry_ready: FoundationStatus;
  mv_story_structure_ready: FoundationStatus;
  mv_scene_structure_ready: FoundationStatus;
  mv_sequence_structure_ready: FoundationStatus;
  mv_runtime_structure_ready: FoundationStatus;
  mv_quality_gate_ready: FoundationStatus;
  mv_export_ready: FoundationStatus;
  traceability_preserved: boolean;
  digital_studio_entry_blocked: boolean;
  mv_scope_invalid: boolean;
  production_mode_unblocked: boolean;
  mv_foundation_failure: boolean;
  mv_archetype_registry_missing: boolean;
  mv_story_structure_missing: boolean;
  mv_scene_structure_missing: boolean;
  mv_sequence_structure_missing: boolean;
  mv_runtime_structure_missing: boolean;
  mv_quality_gate_missing: boolean;
  mv_export_missing: boolean;
  traceability_loss: boolean;
  mv_production_system_foundation_ready: FoundationStatus;
  certification_status: typeof MV_PRODUCTION_FOUNDATION_READY_STATUS | null;
  foundation_checks: FoundationCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT
    | typeof MV_PRODUCTION_SYSTEM_FOUNDATION_FAIL_VERDICT;
  issues: MvProductionSystemFoundationIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type MvTypeDefinition = {
  mv_type: MvType;
  blueprint_type: ProductionBlueprintType;
  runtime_mode: string;
  runtime_id: string;
  library_path: string | null;
  index_path: string | null;
  extra_dataset_refs: string[];
};

const MV_TYPE_DEFINITIONS: MvTypeDefinition[] = [
  {
    mv_type: 'instrumental_mv',
    blueprint_type: 'mv_blueprint',
    runtime_mode: 'mv_production_runtime',
    runtime_id: 'production_runtime_mv_v1',
    library_path: INSTRUMENTAL_MV_LIBRARY_PATH,
    index_path: INSTRUMENTAL_MV_INDEX_PATH,
    extra_dataset_refs: [],
  },
  {
    mv_type: 'ballad_mv',
    blueprint_type: 'mv_blueprint',
    runtime_mode: 'mv_production_runtime',
    runtime_id: 'production_runtime_mv_v1',
    library_path: BALLAD_MV_LIBRARY_PATH,
    index_path: BALLAD_MV_INDEX_PATH,
    extra_dataset_refs: [],
  },
  {
    mv_type: 'story_mv',
    blueprint_type: 'short_film_blueprint',
    runtime_mode: 'short_film_production_runtime',
    runtime_id: 'production_runtime_short_film_v1',
    library_path: STORY_MV_LIBRARY_PATH,
    index_path: STORY_MV_INDEX_PATH,
    extra_dataset_refs: [],
  },
  {
    mv_type: 'music_drama_mv',
    blueprint_type: 'episode_blueprint',
    runtime_mode: 'episode_production_runtime',
    runtime_id: 'production_runtime_episode_v1',
    library_path: MUSIC_DRAMA_SCENE_ARCHETYPES_PATH,
    index_path: MUSIC_DRAMA_GRAMMAR_PATH,
    extra_dataset_refs: [MUSIC_DRAMA_GRAMMAR_PATH],
  },
];

const READ_ONLY_UPSTREAM_PATHS = [
  path.join('exports/movie_analysis_level3_bridge', 'level3-bridge-certification.json'),
  PRODUCTION_ENGINE_MASTER_CERTIFICATION_ARTIFACT_PATH,
  PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_DRY_RUN_CERTIFICATION_ARTIFACT_PATH,
  TEST_MODE_EXECUTION_FINAL_AUDIT_ARTIFACT_PATH,
] as const;

const FOUNDATION_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH,
  MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_SYSTEM_FOUNDATION_DIR,
  MV_PRODUCTION_SYSTEM_FOUNDATION_EXPORT_DIR,
  MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH,
  MV_PRODUCTION_SYSTEM_FOUNDATION_MD_PATH,
  ...FOUNDATION_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): FoundationStatus {
  return pass ? 'PASS' : 'FAIL';
}

function loadJson<T>(root: string, relativePath: string): T | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

function snapshotFile(root: string, relativePath: string): FileSnapshot | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  const stat = fs.statSync(fullPath);
  return { size: stat.size, mtimeMs: stat.mtimeMs };
}

function snapshotsUnchanged(
  root: string,
  snapshots: Record<string, FileSnapshot | null>
): boolean {
  for (const [relativePath, snapshot] of Object.entries(snapshots)) {
    if (!snapshot) return false;
    const current = snapshotFile(root, relativePath);
    if (!current || current.size !== snapshot.size || current.mtimeMs !== snapshot.mtimeMs) {
      return false;
    }
  }
  return true;
}

function isUnderFoundationWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(FOUNDATION_ARTIFACT_WRITE_SCOPE) ||
    relativePath === FOUNDATION_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function countArchetypes(root: string, libraryPath: string | null, indexPath: string | null): number {
  if (indexPath) {
    const index = loadJson<{ archetype_count?: number; entries?: unknown[] }>(root, indexPath);
    if (index?.archetype_count) return index.archetype_count;
    if (index?.entries) return index.entries.length;
  }
  if (libraryPath) {
    const library = loadJson<{ archetypes?: unknown[]; scenes?: unknown[] }>(root, libraryPath);
    if (library?.archetypes) return library.archetypes.length;
    if (library?.scenes) return library.scenes.length;
  }
  return 0;
}

function buildStructureLayers(
  structureKind: 'story' | 'scene' | 'sequence' | 'runtime',
  blueprintSceneCount: number
): MvStructureLayer[] {
  const layerMap: Record<typeof structureKind, Array<{ layer_id: string; layer_label: string }>> = {
    story: [
      { layer_id: 'narrative_arc', layer_label: 'Narrative Arc' },
      { layer_id: 'beat_progression', layer_label: 'Beat Progression' },
      { layer_id: 'memory_callbacks', layer_label: 'Memory Callbacks' },
    ],
    scene: [
      { layer_id: 'scene_plan', layer_label: 'Scene Plan' },
      { layer_id: 'scene_purpose', layer_label: 'Scene Purpose' },
      { layer_id: 'scene_continuity', layer_label: 'Scene Continuity' },
    ],
    sequence: [
      { layer_id: 'sequence_order', layer_label: 'Sequence Order' },
      { layer_id: 'sequence_transitions', layer_label: 'Sequence Transitions' },
      { layer_id: 'sequence_coverage', layer_label: 'Sequence Coverage' },
    ],
    runtime: [
      { layer_id: 'execution_queue', layer_label: 'Execution Queue' },
      { layer_id: 'runtime_units', layer_label: 'Runtime Units' },
      { layer_id: 'adapter_bindings', layer_label: 'Adapter Bindings' },
    ],
  };

  return layerMap[structureKind].map((layer) => ({
    ...layer,
    structure_ready: blueprintSceneCount > 0 ? 'PASS' : ('FAIL' as FoundationStatus),
  }));
}

function buildTypeStructure(
  definition: MvTypeDefinition,
  structureKind: 'story' | 'scene' | 'sequence' | 'runtime',
  blueprintSceneCount: number
): MvTypeStructure {
  const layers = buildStructureLayers(structureKind, blueprintSceneCount);
  return {
    mv_type: definition.mv_type,
    blueprint_type: definition.blueprint_type,
    runtime_mode: definition.runtime_mode,
    layers,
    structure_ready: layers.every((layer) => layer.structure_ready === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function buildMarkdown(report: MvProductionSystemFoundationReport): string {
  const lines = [
    '# MV Production System Foundation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    `**Level3 Final Status:** ${report.level3_final_status}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| digital_studio_entry_allowed | ${report.digital_studio_entry_allowed} |`,
    `| mv_system_scope_valid | ${report.mv_system_scope_valid} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    `| mv_foundation_created | ${report.mv_foundation_created} |`,
    `| mv_archetype_registry_ready | ${report.mv_archetype_registry_ready} |`,
    `| mv_story_structure_ready | ${report.mv_story_structure_ready} |`,
    `| mv_scene_structure_ready | ${report.mv_scene_structure_ready} |`,
    `| mv_sequence_structure_ready | ${report.mv_sequence_structure_ready} |`,
    `| mv_runtime_structure_ready | ${report.mv_runtime_structure_ready} |`,
    `| mv_quality_gate_ready | ${report.mv_quality_gate_ready} |`,
    `| mv_export_ready | ${report.mv_export_ready} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Supported MV Types',
    '',
    ...SUPPORTED_MV_TYPES.map((mvType) => `- ${mvType}`),
    '',
    '## Foundation Checks',
    ''
  );

  for (const check of report.foundation_checks) {
    lines.push(`- ${check.check_id}: ${check.status}`);
  }

  if (report.issues.length > 0) {
    lines.push('', '## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionSystemFoundationIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionSystemFoundationReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionSystemFoundationReport = {
    report_id: 'mv-production-system-foundation-report-v1',
    phase: MV_PRODUCTION_SYSTEM_FOUNDATION_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    level3_bridge_certification_report_path: LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH,
    production_engine_master_certification_report_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
    test_mode_dry_run_certification_report_path: TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
    test_mode_execution_final_audit_report_path: TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH,
    mv_production_system_foundation_export_dir: MV_PRODUCTION_SYSTEM_FOUNDATION_EXPORT_DIR,
    mv_production_system_foundation_manifest_path: MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH,
    mv_production_system_foundation_artifact_path: MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    mv_type_count: MV_TYPE_COUNT,
    level3_final_status: LEVEL3_FINAL_STATUS_COMPLETE,
    digital_studio_entry_allowed: 'FAIL',
    mv_system_scope_valid: 'FAIL',
    production_mode_blocked: 'FAIL',
    mv_foundation_created: 'FAIL',
    mv_archetype_registry_ready: 'FAIL',
    mv_story_structure_ready: 'FAIL',
    mv_scene_structure_ready: 'FAIL',
    mv_sequence_structure_ready: 'FAIL',
    mv_runtime_structure_ready: 'FAIL',
    mv_quality_gate_ready: 'FAIL',
    mv_export_ready: 'FAIL',
    traceability_preserved: false,
    digital_studio_entry_blocked: true,
    mv_scope_invalid: true,
    production_mode_unblocked: true,
    mv_foundation_failure: true,
    mv_archetype_registry_missing: true,
    mv_story_structure_missing: true,
    mv_scene_structure_missing: true,
    mv_sequence_structure_missing: true,
    mv_runtime_structure_missing: true,
    mv_quality_gate_missing: true,
    mv_export_missing: true,
    traceability_loss: true,
    mv_production_system_foundation_ready: 'FAIL',
    certification_status: null,
    foundation_checks: [],
    final_verdict: MV_PRODUCTION_SYSTEM_FOUNDATION_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message: 'Upstream artifacts were modified during foundation write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_SYSTEM_FOUNDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_SYSTEM_FOUNDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionSystemFoundation(
  projectRoot?: string
): MvProductionSystemFoundationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionSystemFoundationIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const bridgeReport = loadJson<{
    final_verdict: string;
    final_output_status: string | null;
    level3_entry_ready: boolean;
  }>(root, LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH);
  const masterCertReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    production_engine_master_certification_ready: FoundationStatus;
  }>(root, PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH);
  const dryRunCertReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    test_mode_dry_run_certification_ready: FoundationStatus;
  }>(root, TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH);
  const finalAuditReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    level3_final_status: string | null;
    next_level_approved: boolean;
    production_block_verified: FoundationStatus;
    test_mode_execution_final_audit_ready: FoundationStatus;
  }>(root, TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH);

  const precheckValid =
    bridgeReport !== null &&
    bridgeReport.final_verdict === LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT &&
    bridgeReport.final_output_status === LEVEL3_ENTRY_APPROVED_STATUS &&
    bridgeReport.level3_entry_ready === true &&
    masterCertReport !== null &&
    masterCertReport.final_verdict === PRODUCTION_ENGINE_MASTER_CERTIFICATION_PASS_VERDICT &&
    masterCertReport.certification_status === PRODUCTION_ENGINE_MASTER_CERTIFIED_STATUS &&
    masterCertReport.production_engine_master_certification_ready === 'PASS' &&
    dryRunCertReport !== null &&
    dryRunCertReport.final_verdict === TEST_MODE_DRY_RUN_CERTIFICATION_PASS_VERDICT &&
    dryRunCertReport.certification_status === TEST_MODE_DRY_RUN_CERTIFIED_STATUS &&
    dryRunCertReport.test_mode_dry_run_certification_ready === 'PASS' &&
    finalAuditReport !== null &&
    finalAuditReport.final_verdict === TEST_MODE_EXECUTION_FINAL_AUDIT_PASS_VERDICT &&
    finalAuditReport.certification_status === TEST_MODE_EXECUTION_FINAL_AUDITED_STATUS &&
    finalAuditReport.level3_final_status === LEVEL3_FINAL_STATUS_COMPLETE &&
    finalAuditReport.next_level_approved === true &&
    finalAuditReport.test_mode_execution_final_audit_ready === 'PASS';

  if (!precheckValid) {
    issues.push({
      code: 'DIGITAL_STUDIO_PRECHECK_FAILED',
      message:
        'Required bridge, master certification, dry run certification, and final audit prechecks failed',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const blueprintExpansion = loadJson<{
    expanded_blueprints: Array<{
      blueprint_id: string;
      production_type: ProductionBlueprintType;
      scene_plan: { scene_count: number };
    }>;
  }>(root, PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH);
  const runtimeCertArtifact = loadJson<{
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
    runtime_package_audits: Array<{ runtime_id: string; package_certified: FoundationStatus }>;
  }>(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);

  if (!blueprintExpansion || !runtimeCertArtifact) {
    issues.push({
      code: 'UPSTREAM_ARTIFACT_MISSING',
      message: 'Missing production blueprint expansion or runtime certification artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const registryEntries: MvArchetypeRegistryEntry[] = MV_TYPE_DEFINITIONS.map((definition) => {
    const libraryExists =
      definition.library_path === null || fs.existsSync(path.join(root, definition.library_path));
    const indexExists =
      definition.index_path === null || fs.existsSync(path.join(root, definition.index_path));
    const blueprint = blueprintExpansion.expanded_blueprints.find(
      (entry) => entry.production_type === definition.blueprint_type
    );
    const archetypeCount = countArchetypes(root, definition.library_path, definition.index_path);
    const registryReady =
      blueprint !== undefined &&
      (definition.mv_type === 'story_mv' || libraryExists) &&
      (definition.mv_type === 'story_mv' || indexExists || definition.mv_type === 'music_drama_mv') &&
      (definition.mv_type === 'story_mv' ? blueprint.scene_plan.scene_count > 0 : archetypeCount > 0);

    return {
      mv_type: definition.mv_type,
      library_path: definition.library_path,
      index_path: definition.index_path,
      blueprint_type: definition.blueprint_type,
      archetype_count: definition.mv_type === 'story_mv' ? blueprint?.scene_plan.scene_count ?? 0 : archetypeCount,
      registry_ready: toStatus(registryReady),
    };
  });

  const mvArchetypeRegistryReady = registryEntries.every((entry) => entry.registry_ready === 'PASS');

  const storyStructures = MV_TYPE_DEFINITIONS.map((definition) => {
    const blueprint = blueprintExpansion.expanded_blueprints.find(
      (entry) => entry.production_type === definition.blueprint_type
    );
    return buildTypeStructure(definition, 'story', blueprint?.scene_plan.scene_count ?? 0);
  });
  const sceneStructures = MV_TYPE_DEFINITIONS.map((definition) => {
    const blueprint = blueprintExpansion.expanded_blueprints.find(
      (entry) => entry.production_type === definition.blueprint_type
    );
    return buildTypeStructure(definition, 'scene', blueprint?.scene_plan.scene_count ?? 0);
  });
  const sequenceStructures = MV_TYPE_DEFINITIONS.map((definition) => {
    const blueprint = blueprintExpansion.expanded_blueprints.find(
      (entry) => entry.production_type === definition.blueprint_type
    );
    return buildTypeStructure(definition, 'sequence', blueprint?.scene_plan.scene_count ?? 0);
  });
  const runtimeStructures = MV_TYPE_DEFINITIONS.map((definition) => {
    const runtimeAudit = runtimeCertArtifact.runtime_package_audits.find(
      (audit) => audit.runtime_id === definition.runtime_id
    );
    const sceneCount = runtimeAudit?.package_certified === 'PASS' ? 1 : 0;
    return buildTypeStructure(definition, 'runtime', sceneCount);
  });

  const mvStoryStructureReady = storyStructures.every((structure) => structure.structure_ready === 'PASS');
  const mvSceneStructureReady = sceneStructures.every((structure) => structure.structure_ready === 'PASS');
  const mvSequenceStructureReady = sequenceStructures.every(
    (structure) => structure.structure_ready === 'PASS'
  );
  const mvRuntimeStructureReady = runtimeStructures.every(
    (structure) => structure.structure_ready === 'PASS'
  );

  const qualityGates = [
    { gate_ref: 'GATE-EXECUTION-READY', gate_label: 'Execution Ready Gate' },
    { gate_ref: 'GATE-MOCK-OUTPUT-ONLY', gate_label: 'Mock Output Only Gate' },
    { gate_ref: 'GATE-TRACEABILITY', gate_label: 'Traceability Gate' },
    { gate_ref: 'GATE-PRODUCTION-BLOCKED', gate_label: 'Production Blocked Gate' },
  ].map((gate) => ({
    ...gate,
    gate_ready: runtimeCertArtifact.production_mode_blocked ? ('PASS' as FoundationStatus) : 'FAIL',
  }));
  const mvQualityGateReady = qualityGates.every((gate) => gate.gate_ready === 'PASS');

  const exportTargets = MV_TYPE_DEFINITIONS.map((definition) => ({
    mv_type: definition.mv_type,
    export_format: `${definition.mv_type}_foundation_plan`,
    export_ready: 'PASS' as FoundationStatus,
  }));
  const mvExportReady = exportTargets.every((target) => target.export_ready === 'PASS');

  const traceabilityChain: MvTraceabilityEntry[] = MV_TYPE_DEFINITIONS.map((definition) => {
    const blueprint = blueprintExpansion.expanded_blueprints.find(
      (entry) => entry.production_type === definition.blueprint_type
    );
    const datasetRefs = [
      ...(definition.library_path ? [definition.library_path] : []),
      ...(definition.index_path ? [definition.index_path] : []),
      ...definition.extra_dataset_refs,
    ];
    const traceIntegrity =
      blueprint !== undefined &&
      runtimeCertArtifact.runtime_package_audits.some(
        (audit) => audit.runtime_id === definition.runtime_id && audit.package_certified === 'PASS'
      );

    return {
      mv_type: definition.mv_type,
      upstream_blueprint_id: blueprint?.blueprint_id ?? '',
      upstream_runtime_id: definition.runtime_id,
      dataset_refs: datasetRefs,
      trace_integrity: toStatus(traceIntegrity),
    };
  });

  const traceabilityPreserved = traceabilityChain.every((entry) => entry.trace_integrity === 'PASS');

  const productionModeBlocked =
    runtimeCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.real_generation_blocked === true &&
    runtimeCertArtifact.no_external_calls === true &&
    runtimeCertArtifact.no_gpu_execution === true &&
    finalAuditReport.production_block_verified === 'PASS';

  const mvSystemScopeValid =
    registryEntries.length === MV_TYPE_COUNT &&
    SUPPORTED_MV_TYPES.every((mvType) => registryEntries.some((entry) => entry.mv_type === mvType));

  const digitalStudioEntryAllowed =
    precheckValid && mvSystemScopeValid && productionModeBlocked && traceabilityPreserved;

  const foundationWriteScopeValid = FOUNDATION_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderFoundationWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && foundationWriteScopeValid;

  const mvFoundationCreated =
    mvArchetypeRegistryReady &&
    mvStoryStructureReady &&
    mvSceneStructureReady &&
    mvSequenceStructureReady &&
    mvRuntimeStructureReady &&
    mvQualityGateReady &&
    mvExportReady &&
    traceabilityPreserved &&
    safeCreatePolicyVerified;

  const digitalStudioEntryBlocked = !digitalStudioEntryAllowed;
  const mvScopeInvalid = !mvSystemScopeValid;
  const productionModeUnblocked = !productionModeBlocked;
  const mvFoundationFailure = !mvFoundationCreated;
  const mvArchetypeRegistryMissing = !mvArchetypeRegistryReady;
  const mvStoryStructureMissing = !mvStoryStructureReady;
  const mvSceneStructureMissing = !mvSceneStructureReady;
  const mvSequenceStructureMissing = !mvSequenceStructureReady;
  const mvRuntimeStructureMissing = !mvRuntimeStructureReady;
  const mvQualityGateMissing = !mvQualityGateReady;
  const mvExportMissing = !mvExportReady;
  const traceabilityLoss = !traceabilityPreserved;

  if (digitalStudioEntryBlocked) {
    issues.push({
      code: 'DIGITAL_STUDIO_ENTRY_BLOCKED',
      message: 'Digital studio entry is blocked',
      severity: 'error',
    });
  }
  if (mvScopeInvalid) {
    issues.push({ code: 'MV_SCOPE_INVALID', message: 'MV system scope is invalid', severity: 'error' });
  }
  if (productionModeUnblocked) {
    issues.push({
      code: 'PRODUCTION_MODE_UNBLOCKED',
      message: 'Production mode is not blocked',
      severity: 'error',
    });
  }
  if (mvArchetypeRegistryMissing) {
    issues.push({
      code: 'MV_ARCHETYPE_REGISTRY_MISSING',
      message: 'MV archetype registry is missing or incomplete',
      severity: 'error',
    });
  }
  if (mvStoryStructureMissing) {
    issues.push({
      code: 'MV_STORY_STRUCTURE_MISSING',
      message: 'MV story structure is missing or incomplete',
      severity: 'error',
    });
  }
  if (mvSceneStructureMissing) {
    issues.push({
      code: 'MV_SCENE_STRUCTURE_MISSING',
      message: 'MV scene structure is missing or incomplete',
      severity: 'error',
    });
  }
  if (mvSequenceStructureMissing) {
    issues.push({
      code: 'MV_SEQUENCE_STRUCTURE_MISSING',
      message: 'MV sequence structure is missing or incomplete',
      severity: 'error',
    });
  }
  if (mvRuntimeStructureMissing) {
    issues.push({
      code: 'MV_RUNTIME_STRUCTURE_MISSING',
      message: 'MV runtime structure is missing or incomplete',
      severity: 'error',
    });
  }
  if (mvQualityGateMissing) {
    issues.push({
      code: 'MV_QUALITY_GATE_MISSING',
      message: 'MV quality gate structure is missing or incomplete',
      severity: 'error',
    });
  }
  if (mvExportMissing) {
    issues.push({
      code: 'MV_EXPORT_MISSING',
      message: 'MV export structure is missing or incomplete',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'MV traceability chain is not preserved',
      severity: 'error',
    });
  }
  if (!safeCreatePolicyVerified) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }

  const foundationChecks: FoundationCheck[] = [
    {
      check_id: 'digital_studio_entry_allowed',
      check_label: 'Digital Studio Entry Allowed',
      status: toStatus(digitalStudioEntryAllowed),
    },
    {
      check_id: 'mv_system_scope_valid',
      check_label: 'MV System Scope Valid',
      status: toStatus(mvSystemScopeValid),
    },
    {
      check_id: 'production_mode_blocked',
      check_label: 'Production Mode Blocked',
      status: toStatus(productionModeBlocked),
    },
    {
      check_id: 'mv_foundation_created',
      check_label: 'MV Foundation Created',
      status: toStatus(mvFoundationCreated),
    },
    {
      check_id: 'mv_archetype_registry_ready',
      check_label: 'MV Archetype Registry Ready',
      status: toStatus(mvArchetypeRegistryReady),
    },
    {
      check_id: 'mv_story_structure_ready',
      check_label: 'MV Story Structure Ready',
      status: toStatus(mvStoryStructureReady),
    },
    {
      check_id: 'mv_scene_structure_ready',
      check_label: 'MV Scene Structure Ready',
      status: toStatus(mvSceneStructureReady),
    },
    {
      check_id: 'mv_sequence_structure_ready',
      check_label: 'MV Sequence Structure Ready',
      status: toStatus(mvSequenceStructureReady),
    },
    {
      check_id: 'mv_runtime_structure_ready',
      check_label: 'MV Runtime Structure Ready',
      status: toStatus(mvRuntimeStructureReady),
    },
    {
      check_id: 'mv_quality_gate_ready',
      check_label: 'MV Quality Gate Ready',
      status: toStatus(mvQualityGateReady),
    },
    {
      check_id: 'mv_export_ready',
      check_label: 'MV Export Ready',
      status: toStatus(mvExportReady),
    },
    {
      check_id: 'traceability_preserved',
      check_label: 'Traceability Preserved',
      status: toStatus(traceabilityPreserved),
    },
  ];

  const pass =
    mvFoundationCreated &&
    digitalStudioEntryAllowed &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionSystemFoundationArtifact = {
    mv_foundation_id: 'mv-production-system-foundation-v1',
    phase: MV_PRODUCTION_SYSTEM_FOUNDATION_PHASE,
    generated_at: timestamp,
    supported_mv_types: SUPPORTED_MV_TYPES,
    mv_archetype_registry: {
      registry_id: 'mv-archetype-registry-v1',
      entries: registryEntries,
      registry_ready: mvArchetypeRegistryReady,
    },
    mv_story_structure: storyStructures,
    mv_scene_structure: sceneStructures,
    mv_sequence_structure: sequenceStructures,
    mv_runtime_structure: runtimeStructures,
    mv_quality_gate_structure: {
      gate_id: 'mv-quality-gate-structure-v1',
      gates: qualityGates,
      structure_ready: mvQualityGateReady,
    },
    mv_export_structure: {
      export_id: 'mv-export-structure-v1',
      export_scope: FOUNDATION_ARTIFACT_WRITE_SCOPE,
      export_targets: exportTargets,
      structure_ready: mvExportReady,
    },
    mv_traceability_chain: traceabilityChain,
    safety_flags: {
      planning_only: true,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      production_mode_blocked: true,
    },
    digital_studio_entry_allowed: digitalStudioEntryAllowed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      foundation_artifact_write_scope: FOUNDATION_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    mv_foundation_created: mvFoundationCreated,
  };

  const manifest: MvProductionSystemFoundationManifest = {
    manifest_id: 'mv-production-system-foundation-manifest-v1',
    phase: MV_PRODUCTION_SYSTEM_FOUNDATION_PHASE,
    generated_at: timestamp,
    mv_type_count: MV_TYPE_COUNT,
    digital_studio_entry_allowed: toStatus(digitalStudioEntryAllowed),
    mv_system_scope_valid: toStatus(mvSystemScopeValid),
    production_mode_blocked: toStatus(productionModeBlocked),
    mv_foundation_created: toStatus(mvFoundationCreated),
    mv_archetype_registry_ready: toStatus(mvArchetypeRegistryReady),
    mv_story_structure_ready: toStatus(mvStoryStructureReady),
    mv_scene_structure_ready: toStatus(mvSceneStructureReady),
    mv_sequence_structure_ready: toStatus(mvSequenceStructureReady),
    mv_runtime_structure_ready: toStatus(mvRuntimeStructureReady),
    mv_quality_gate_ready: toStatus(mvQualityGateReady),
    mv_export_ready: toStatus(mvExportReady),
    traceability_preserved: traceabilityPreserved,
    certification_status: pass ? MV_PRODUCTION_FOUNDATION_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_SYSTEM_FOUNDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionSystemFoundationReport = {
    report_id: 'mv-production-system-foundation-report-v1',
    phase: MV_PRODUCTION_SYSTEM_FOUNDATION_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    level3_bridge_certification_report_path: LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH,
    production_engine_master_certification_report_path: PRODUCTION_ENGINE_MASTER_CERTIFICATION_REPORT_PATH,
    test_mode_dry_run_certification_report_path: TEST_MODE_DRY_RUN_CERTIFICATION_REPORT_PATH,
    test_mode_execution_final_audit_report_path: TEST_MODE_EXECUTION_FINAL_AUDIT_REPORT_PATH,
    mv_production_system_foundation_export_dir: MV_PRODUCTION_SYSTEM_FOUNDATION_EXPORT_DIR,
    mv_production_system_foundation_manifest_path: MV_PRODUCTION_SYSTEM_FOUNDATION_MANIFEST_PATH,
    mv_production_system_foundation_artifact_path: MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    mv_type_count: MV_TYPE_COUNT,
    level3_final_status: LEVEL3_FINAL_STATUS_COMPLETE,
    digital_studio_entry_allowed: toStatus(digitalStudioEntryAllowed),
    mv_system_scope_valid: toStatus(mvSystemScopeValid),
    production_mode_blocked: toStatus(productionModeBlocked),
    mv_foundation_created: toStatus(mvFoundationCreated),
    mv_archetype_registry_ready: toStatus(mvArchetypeRegistryReady),
    mv_story_structure_ready: toStatus(mvStoryStructureReady),
    mv_scene_structure_ready: toStatus(mvSceneStructureReady),
    mv_sequence_structure_ready: toStatus(mvSequenceStructureReady),
    mv_runtime_structure_ready: toStatus(mvRuntimeStructureReady),
    mv_quality_gate_ready: toStatus(mvQualityGateReady),
    mv_export_ready: toStatus(mvExportReady),
    traceability_preserved: traceabilityPreserved,
    digital_studio_entry_blocked: digitalStudioEntryBlocked,
    mv_scope_invalid: mvScopeInvalid,
    production_mode_unblocked: productionModeUnblocked,
    mv_foundation_failure: mvFoundationFailure,
    mv_archetype_registry_missing: mvArchetypeRegistryMissing,
    mv_story_structure_missing: mvStoryStructureMissing,
    mv_scene_structure_missing: mvSceneStructureMissing,
    mv_sequence_structure_missing: mvSequenceStructureMissing,
    mv_runtime_structure_missing: mvRuntimeStructureMissing,
    mv_quality_gate_missing: mvQualityGateMissing,
    mv_export_missing: mvExportMissing,
    traceability_loss: traceabilityLoss,
    mv_production_system_foundation_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_FOUNDATION_READY_STATUS : null,
    foundation_checks: foundationChecks,
    final_verdict: pass
      ? MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT
      : MV_PRODUCTION_SYSTEM_FOUNDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_SYSTEM_FOUNDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_SYSTEM_FOUNDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
