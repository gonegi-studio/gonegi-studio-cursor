import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATION_BLUEPRINT_REGISTRY_PATH,
  GENERATION_BLUEPRINT_SCHEMA_PATH,
  type MovieAnalysisGenerationBlueprintPlan,
  loadMovieAnalysisGenerationBlueprintPlan,
} from './movieAnalysisGenerationBlueprintDesign.js';
import {
  FINAL_RUNTIME_BUNDLE_REGISTRY_PATH,
  FINAL_RUNTIME_BUNDLE_SCHEMA_PATH,
  type MovieAnalysisFinalRuntimeBundlePlan,
  loadMovieAnalysisFinalRuntimeBundlePlan,
} from './movieAnalysisFinalRuntimeBundleDesign.js';
import {
  MASTER_PACKAGE_REGISTRY_PATH,
  MASTER_PACKAGE_SCHEMA_PATH,
  SEED_MASTER_PACKAGE_SPECS,
  type MovieAnalysisMasterPackagePlan,
  loadMovieAnalysisMasterPackagePlan,
} from './movieAnalysisMasterPackageDesign.js';
import {
  MASTER_CHAIN_AUDIT_PASS_VERDICT,
  MASTER_CHAIN_AUDIT_REPORT_PATH,
} from './movieAnalysisMasterChainAudit.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CONSUMPTION_READINESS_AUDIT_PHASE =
  'PHASE-SOURCE-VIDEO-041-MOVIE_ANALYSIS_CONSUMPTION_READINESS_AUDIT_V1' as const;
export const CONSUMPTION_READINESS_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CONSUMPTION_READINESS_AUDIT_V1' as const;
export const CONSUMPTION_READINESS_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CONSUMPTION_READINESS_AUDIT_V1' as const;
export const CONSUMPTION_READINESS_AUDIT_REPORT_PATH =
  'reports/movie-analysis-consumption-readiness-audit-report.json' as const;
export const CONSUMPTION_READINESS_AUDIT_MD_PATH =
  'reports/MOVIE_ANALYSIS_CONSUMPTION_READINESS_AUDIT.md' as const;

export const EXPECTED_SOURCE_COUNT = 4 as const;

const IMAGE_APP_BLUEPRINT_SECTIONS = [
  'character_generation_structure',
  'emotion_generation_structure',
] as const;

const IMAGE_APP_BUNDLE_SECTIONS = ['character_bundle', 'emotion_bundle'] as const;

const IMAGE_APP_MASTER_ID_FIELDS = [
  'keyframe_preparation_id',
  'gonegi_state_mapping_id',
  'video_state_compilation_id',
] as const;

const VIDEO_APP_BLUEPRINT_SECTIONS = [
  'scene_generation_structure',
  'camera_generation_structure',
  'transition_generation_structure',
  'continuity_generation_structure',
] as const;

const VIDEO_APP_BUNDLE_SECTIONS = [
  'scene_bundle',
  'camera_bundle',
  'transition_bundle',
  'continuity_bundle',
  'runtime_bundle',
] as const;

const VIDEO_APP_MASTER_ID_FIELDS = [
  'video_blueprint_id',
  'temporal_flow_id',
  'sequence_assembly_id',
  'motion_plan_id',
] as const;

const GENERATION_BLUEPRINT_SECTIONS = [
  'scene_generation_structure',
  'character_generation_structure',
  'camera_generation_structure',
  'emotion_generation_structure',
  'transition_generation_structure',
  'continuity_generation_structure',
  'execution_readiness_structure',
] as const;

const FINAL_RUNTIME_BUNDLE_SECTIONS = [
  'scene_bundle',
  'character_bundle',
  'camera_bundle',
  'emotion_bundle',
  'transition_bundle',
  'continuity_bundle',
  'runtime_bundle',
  'safety_bundle',
] as const;

export type ConsumptionReadinessAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
  master_package_id?: string;
};

export type SourceConsumptionAudit = {
  source_video_id: string;
  master_package_id: string;
  final_runtime_bundle_id: string;
  generation_blueprint_id: string;
  image_app_consumable: boolean;
  video_app_consumable: boolean;
  id_traceable: boolean;
  required_sections_present: boolean;
  runtime_payload_blocked: boolean;
  generation_blocked: boolean;
  gpu_blocked: boolean;
};

export type MovieAnalysisConsumptionReadinessAuditReport = {
  report_id: string;
  phase: typeof CONSUMPTION_READINESS_AUDIT_PHASE;
  timestamp: string;
  source_count: number;
  schema_consistency: boolean;
  id_traceability: boolean;
  required_sections_present: boolean;
  image_app_consumable: boolean;
  video_app_consumable: boolean;
  runtime_payload_blocked: boolean;
  generation_blocked: boolean;
  gpu_blocked: boolean;
  source_audits: SourceConsumptionAudit[];
  final_verdict:
    | typeof CONSUMPTION_READINESS_AUDIT_PASS_VERDICT
    | typeof CONSUMPTION_READINESS_AUDIT_FAIL_VERDICT;
  issues: ConsumptionReadinessAuditIssue[];
};

type MasterPackageRegistry = {
  schema_path: string;
  master_package_plans: Array<{
    master_package_id: string;
    source_video_id: string;
    final_runtime_bundle_id: string;
    plan_path: string;
  }>;
};

type FinalRuntimeBundleRegistry = {
  schema_path: string;
  final_runtime_bundle_plans: Array<{
    final_runtime_bundle_id: string;
    source_video_id: string;
    execution_readiness_id: string;
    plan_path: string;
  }>;
};

type GenerationBlueprintRegistry = {
  schema_path: string;
  generation_blueprint_plans: Array<{
    generation_blueprint_id: string;
    source_video_id: string;
    generation_package_id: string;
    plan_path: string;
  }>;
};

function loadRegistry<T>(projectRoot: string, relPath: string): T | null {
  const abs = path.join(projectRoot, relPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function sectionsPresent(
  plan: Record<string, unknown>,
  sections: readonly string[]
): boolean {
  return sections.every((section) => {
    const value = plan[section];
    return Array.isArray(value) && value.length > 0;
  });
}

function isRuntimePayloadBlocked(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan
): boolean {
  return (
    master.safety_summary.no_execution === true &&
    master.safety_summary.no_rendering === true &&
    master.execution_flags.runtime_execution === false &&
    bundle.execution_flags.runtime_execution === false &&
    bundle.execution_flags.final_runtime_bundle_only === true &&
    bundle.runtime_bundle.every((e) => e.final_runtime_bundle_only === true)
  );
}

function isGenerationBlocked(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan,
  blueprint: MovieAnalysisGenerationBlueprintPlan
): boolean {
  return (
    master.execution_flags.video_generation === false &&
    master.execution_flags.image_generation === false &&
    master.safety_summary.video_generation === false &&
    master.safety_summary.image_generation === false &&
    bundle.execution_flags.video_generation === false &&
    bundle.execution_flags.image_generation === false &&
    blueprint.execution_flags.video_generation === false &&
    blueprint.execution_flags.image_generation === false &&
    blueprint.execution_flags.generation_blueprint_only === true
  );
}

function isGpuBlocked(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan,
  blueprint: MovieAnalysisGenerationBlueprintPlan
): boolean {
  const safetyGpuBlocked = bundle.safety_bundle.some((e) =>
    e.estimated_bundle_value.includes('no_gpu')
  );
  return (
    master.execution_flags.gpu_execution === false &&
    master.safety_summary.gpu_execution === false &&
    bundle.execution_flags.gpu_execution === false &&
    blueprint.execution_flags.gpu_execution === false &&
    master.readiness_summary.gpu_ready === false &&
    safetyGpuBlocked
  );
}

function isImageAppConsumable(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan,
  blueprint: MovieAnalysisGenerationBlueprintPlan
): boolean {
  const masterIds = IMAGE_APP_MASTER_ID_FIELDS.every((field) => Boolean(master[field]));
  const blueprintSections = sectionsPresent(blueprint, IMAGE_APP_BLUEPRINT_SECTIONS);
  const bundleSections = sectionsPresent(bundle, IMAGE_APP_BUNDLE_SECTIONS);
  const designOnly =
    master.execution_flags.planning_only === true &&
    blueprint.execution_flags.estimated_only === true;

  return masterIds && blueprintSections && bundleSections && designOnly;
}

function isVideoAppConsumable(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan,
  blueprint: MovieAnalysisGenerationBlueprintPlan
): boolean {
  const masterIds = VIDEO_APP_MASTER_ID_FIELDS.every((field) => Boolean(master[field]));
  const blueprintSections = sectionsPresent(blueprint, VIDEO_APP_BLUEPRINT_SECTIONS);
  const bundleSections = sectionsPresent(bundle, VIDEO_APP_BUNDLE_SECTIONS);
  const traceReady = master.package_trace.length >= 17 && master.readiness_summary.chain_complete;

  return masterIds && blueprintSections && bundleSections && traceReady;
}

function auditSource(
  master: MovieAnalysisMasterPackagePlan,
  bundle: MovieAnalysisFinalRuntimeBundlePlan,
  blueprint: MovieAnalysisGenerationBlueprintPlan,
  issues: ConsumptionReadinessAuditIssue[]
): SourceConsumptionAudit {
  const idTraceable =
    master.final_runtime_bundle_id === bundle.final_runtime_bundle_id &&
    master.generation_blueprint_id === blueprint.generation_blueprint_id &&
    master.source_video_id === bundle.source_video_id &&
    master.source_video_id === blueprint.source_video_id;

  if (!idTraceable) {
    issues.push({
      code: 'ID_TRACE_MISMATCH',
      message: `ID trace mismatch for ${master.master_package_id}`,
      severity: 'error',
      source_video_id: master.source_video_id,
      master_package_id: master.master_package_id,
    });
  }

  const requiredSections =
    sectionsPresent(blueprint, GENERATION_BLUEPRINT_SECTIONS) &&
    sectionsPresent(bundle, FINAL_RUNTIME_BUNDLE_SECTIONS) &&
    Boolean(master.package_trace?.length) &&
    Boolean(master.readiness_summary) &&
    Boolean(master.safety_summary);

  if (!requiredSections) {
    issues.push({
      code: 'REQUIRED_SECTIONS_MISSING',
      message: `Required consumption sections missing for ${master.master_package_id}`,
      severity: 'error',
      source_video_id: master.source_video_id,
      master_package_id: master.master_package_id,
    });
  }

  const imageConsumable = isImageAppConsumable(master, bundle, blueprint);
  const videoConsumable = isVideoAppConsumable(master, bundle, blueprint);
  const runtimeBlocked = isRuntimePayloadBlocked(master, bundle);
  const generationBlocked = isGenerationBlocked(master, bundle, blueprint);
  const gpuBlocked = isGpuBlocked(master, bundle, blueprint);

  if (!imageConsumable) {
    issues.push({
      code: 'IMAGE_APP_NOT_CONSUMABLE',
      message: `Image App cannot consume ${master.master_package_id}`,
      severity: 'error',
      source_video_id: master.source_video_id,
      master_package_id: master.master_package_id,
    });
  }
  if (!videoConsumable) {
    issues.push({
      code: 'VIDEO_APP_NOT_CONSUMABLE',
      message: `Video App cannot consume ${master.master_package_id}`,
      severity: 'error',
      source_video_id: master.source_video_id,
      master_package_id: master.master_package_id,
    });
  }
  if (!runtimeBlocked) {
    issues.push({
      code: 'RUNTIME_PAYLOAD_NOT_BLOCKED',
      message: `Runtime payload not blocked for ${master.master_package_id}`,
      severity: 'error',
      source_video_id: master.source_video_id,
      master_package_id: master.master_package_id,
    });
  }
  if (!generationBlocked) {
    issues.push({
      code: 'GENERATION_NOT_BLOCKED',
      message: `Generation not blocked for ${master.master_package_id}`,
      severity: 'error',
      source_video_id: master.source_video_id,
      master_package_id: master.master_package_id,
    });
  }
  if (!gpuBlocked) {
    issues.push({
      code: 'GPU_NOT_BLOCKED',
      message: `GPU execution not blocked for ${master.master_package_id}`,
      severity: 'error',
      source_video_id: master.source_video_id,
      master_package_id: master.master_package_id,
    });
  }

  return {
    source_video_id: master.source_video_id,
    master_package_id: master.master_package_id,
    final_runtime_bundle_id: bundle.final_runtime_bundle_id,
    generation_blueprint_id: blueprint.generation_blueprint_id,
    image_app_consumable: imageConsumable,
    video_app_consumable: videoConsumable,
    id_traceable: idTraceable,
    required_sections_present: requiredSections,
    runtime_payload_blocked: runtimeBlocked,
    generation_blocked: generationBlocked,
    gpu_blocked: gpuBlocked,
  };
}

function buildMarkdown(report: MovieAnalysisConsumptionReadinessAuditReport): string {
  const lines = [
    '# Movie Analysis Consumption Readiness Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Audit Checks',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| schema_consistency | ${report.schema_consistency} |`,
    `| id_traceability | ${report.id_traceability} |`,
    `| required_sections_present | ${report.required_sections_present} |`,
    `| image_app_consumable | ${report.image_app_consumable} |`,
    `| video_app_consumable | ${report.video_app_consumable} |`,
    `| runtime_payload_blocked | ${report.runtime_payload_blocked} |`,
    `| generation_blocked | ${report.generation_blocked} |`,
    `| gpu_blocked | ${report.gpu_blocked} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(`### ${audit.source_video_id}`);
    lines.push('');
    lines.push(`- master_package_id: ${audit.master_package_id}`);
    lines.push(`- final_runtime_bundle_id: ${audit.final_runtime_bundle_id}`);
    lines.push(`- generation_blueprint_id: ${audit.generation_blueprint_id}`);
    lines.push(`- image_app_consumable: ${audit.image_app_consumable}`);
    lines.push(`- video_app_consumable: ${audit.video_app_consumable}`);
    lines.push(`- id_traceable: ${audit.id_traceable}`);
    lines.push(`- required_sections_present: ${audit.required_sections_present}`);
    lines.push(`- runtime_payload_blocked: ${audit.runtime_payload_blocked}`);
    lines.push(`- generation_blocked: ${audit.generation_blocked}`);
    lines.push(`- gpu_blocked: ${audit.gpu_blocked}`);
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function writeMovieAnalysisConsumptionReadinessAuditReport(
  projectRoot?: string
): MovieAnalysisConsumptionReadinessAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ConsumptionReadinessAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const masterRegistry = loadRegistry<MasterPackageRegistry>(root, MASTER_PACKAGE_REGISTRY_PATH);
  const bundleRegistry = loadRegistry<FinalRuntimeBundleRegistry>(
    root,
    FINAL_RUNTIME_BUNDLE_REGISTRY_PATH
  );
  const blueprintRegistry = loadRegistry<GenerationBlueprintRegistry>(
    root,
    GENERATION_BLUEPRINT_REGISTRY_PATH
  );

  if (!masterRegistry) {
    issues.push({
      code: 'MASTER_PACKAGE_REGISTRY_MISSING',
      message: `Missing ${MASTER_PACKAGE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }
  if (!bundleRegistry) {
    issues.push({
      code: 'FINAL_RUNTIME_BUNDLE_REGISTRY_MISSING',
      message: `Missing ${FINAL_RUNTIME_BUNDLE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }
  if (!blueprintRegistry) {
    issues.push({
      code: 'GENERATION_BLUEPRINT_REGISTRY_MISSING',
      message: `Missing ${GENERATION_BLUEPRINT_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const schemaPaths = [
    MASTER_PACKAGE_SCHEMA_PATH,
    FINAL_RUNTIME_BUNDLE_SCHEMA_PATH,
    GENERATION_BLUEPRINT_SCHEMA_PATH,
  ];
  const schemaConsistent =
    masterRegistry !== null &&
    bundleRegistry !== null &&
    blueprintRegistry !== null &&
    schemaPaths.every((schemaPath) => fs.existsSync(path.join(root, schemaPath))) &&
    masterRegistry.schema_path === MASTER_PACKAGE_SCHEMA_PATH &&
    bundleRegistry.schema_path === FINAL_RUNTIME_BUNDLE_SCHEMA_PATH &&
    blueprintRegistry.schema_path === GENERATION_BLUEPRINT_SCHEMA_PATH &&
    masterRegistry.master_package_plans.length === EXPECTED_SOURCE_COUNT &&
    bundleRegistry.final_runtime_bundle_plans.length === EXPECTED_SOURCE_COUNT &&
    blueprintRegistry.generation_blueprint_plans.length === EXPECTED_SOURCE_COUNT;

  if (!schemaConsistent) {
    issues.push({
      code: 'SCHEMA_INCONSISTENT',
      message: 'Registry schema paths or plan counts are inconsistent',
      severity: 'error',
    });
  }

  const chainAuditPath = path.join(root, MASTER_CHAIN_AUDIT_REPORT_PATH);
  if (!fs.existsSync(chainAuditPath)) {
    issues.push({
      code: 'MASTER_CHAIN_AUDIT_MISSING',
      message: `Missing ${MASTER_CHAIN_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const chainAudit = JSON.parse(fs.readFileSync(chainAuditPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (chainAudit.final_verdict !== MASTER_CHAIN_AUDIT_PASS_VERDICT) {
      issues.push({
        code: 'MASTER_CHAIN_AUDIT_NOT_PASS',
        message: `${MASTER_CHAIN_AUDIT_REPORT_PATH} must have ${MASTER_CHAIN_AUDIT_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  const sourceAudits: SourceConsumptionAudit[] = [];

  for (const spec of SEED_MASTER_PACKAGE_SPECS) {
    const master = loadMovieAnalysisMasterPackagePlan(root, spec.master_package_id);
    if (!master) {
      issues.push({
        code: 'MASTER_PACKAGE_PLAN_MISSING',
        message: `Missing master package plan: ${spec.master_package_id}`,
        severity: 'error',
        master_package_id: spec.master_package_id,
      });
      continue;
    }

    const bundle = loadMovieAnalysisFinalRuntimeBundlePlan(root, master.final_runtime_bundle_id);
    if (!bundle) {
      issues.push({
        code: 'FINAL_RUNTIME_BUNDLE_PLAN_MISSING',
        message: `Missing final runtime bundle plan: ${master.final_runtime_bundle_id}`,
        severity: 'error',
        source_video_id: master.source_video_id,
      });
      continue;
    }

    const blueprint = loadMovieAnalysisGenerationBlueprintPlan(
      root,
      master.generation_blueprint_id
    );
    if (!blueprint) {
      issues.push({
        code: 'GENERATION_BLUEPRINT_PLAN_MISSING',
        message: `Missing generation blueprint plan: ${master.generation_blueprint_id}`,
        severity: 'error',
        source_video_id: master.source_video_id,
      });
      continue;
    }

    sourceAudits.push(auditSource(master, bundle, blueprint, issues));
  }

  const idTraceability =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.id_traceable);

  const requiredSectionsPresent =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.required_sections_present);

  const imageAppConsumable =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.image_app_consumable);

  const videoAppConsumable =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.video_app_consumable);

  const runtimePayloadBlocked =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.runtime_payload_blocked);

  const generationBlocked =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.generation_blocked);

  const gpuBlocked =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.gpu_blocked);

  const pass =
    schemaConsistent &&
    idTraceability &&
    requiredSectionsPresent &&
    imageAppConsumable &&
    videoAppConsumable &&
    runtimePayloadBlocked &&
    generationBlocked &&
    gpuBlocked &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisConsumptionReadinessAuditReport = {
    report_id: 'movie-analysis-consumption-readiness-audit-report-v1',
    phase: CONSUMPTION_READINESS_AUDIT_PHASE,
    timestamp,
    source_count: sourceAudits.length,
    schema_consistency: schemaConsistent,
    id_traceability: idTraceability,
    required_sections_present: requiredSectionsPresent,
    image_app_consumable: imageAppConsumable,
    video_app_consumable: videoAppConsumable,
    runtime_payload_blocked: runtimePayloadBlocked,
    generation_blocked: generationBlocked,
    gpu_blocked: gpuBlocked,
    source_audits: sourceAudits,
    final_verdict: pass
      ? CONSUMPTION_READINESS_AUDIT_PASS_VERDICT
      : CONSUMPTION_READINESS_AUDIT_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, CONSUMPTION_READINESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CONSUMPTION_READINESS_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
