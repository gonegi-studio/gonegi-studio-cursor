import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  GENERATION_PLANNING_ENGINE_PASS_VERDICT,
  GENERATION_PLANNING_ENGINE_REPORT_PATH,
  GENERATION_PLANNING_READY_STATUS,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  type GenerationPlan,
  type GenerationPlanningEngineArtifact,
  type GenerationUnit,
} from './movieAnalysisGenerationPlanningEngine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PRODUCTION_RUNTIME_ENGINE_PHASE =
  'PHASE-LEVEL3-006-PRODUCTION_RUNTIME_ENGINE_V1' as const;
export const PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PRODUCTION_RUNTIME_ENGINE_V1' as const;
export const PRODUCTION_RUNTIME_ENGINE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PRODUCTION_RUNTIME_ENGINE_V1' as const;
export const PRODUCTION_RUNTIME_READY_STATUS = 'PRODUCTION_RUNTIME_READY' as const;
export const PRODUCTION_RUNTIME_ENGINE_DIR =
  'reports/movie_analysis_production_runtime_engine' as const;
export const PRODUCTION_RUNTIME_ENGINE_REPORT_PATH =
  'reports/movie_analysis_production_runtime_engine/movie-analysis-production-runtime-engine-report.json' as const;
export const PRODUCTION_RUNTIME_ENGINE_MD_PATH =
  'reports/movie_analysis_production_runtime_engine/MOVIE_ANALYSIS_PRODUCTION_RUNTIME_ENGINE.md' as const;
export const PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR =
  'exports/movie_analysis_production_runtime_engine' as const;
export const PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH =
  'exports/movie_analysis_production_runtime_engine/movie-analysis-production-runtime-engine-manifest.json' as const;
export const PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH =
  'exports/movie_analysis_production_runtime_engine/production-runtime-engine.json' as const;

export const RUNTIME_MODE_BY_PRODUCTION_TYPE = {
  mv_blueprint: 'mv_production_runtime',
  short_film_blueprint: 'short_film_production_runtime',
  episode_blueprint: 'episode_production_runtime',
  scene_sequence_blueprint: 'scene_sequence_production_runtime',
} as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';
export type RuntimeMode = (typeof RUNTIME_MODE_BY_PRODUCTION_TYPE)[keyof typeof RUNTIME_MODE_BY_PRODUCTION_TYPE];

export type ProductionRuntimeEngineIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  runtime_id?: string;
  unit_id?: string;
};

export type RuntimeUnit = {
  unit_id: string;
  generation_unit_ref: string;
  execution_order: number;
  image_target: string;
  video_target: string;
  adapter_requirements: string[];
  quality_gate_ref: string;
  runtime_ready: CertificationStatus;
};

export type ExecutionQueueEntry = {
  queue_order: number;
  runtime_unit_id: string;
  generation_unit_ref: string;
};

export type AdapterExecutionEntry = {
  runtime_unit_id: string;
  generation_unit_ref: string;
  adapter_requirements: string[];
  execution_ready: CertificationStatus;
};

export type ConsistencyRuntimeEntry = {
  runtime_unit_id: string;
  generation_unit_ref: string;
  consistency_target: string;
  continuity_preserved: CertificationStatus;
};

export type QualityGateRuntimeEntry = {
  runtime_unit_id: string;
  generation_unit_ref: string;
  gate_id: string;
  gate_label: string;
  gate_passed: CertificationStatus;
};

export type FailureRecoveryEntry = {
  runtime_unit_id: string;
  generation_unit_ref: string;
  retry_policy: string;
  fallback_unit_ref: string | null;
  recovery_ready: CertificationStatus;
};

export type ProductionRuntimePackage = {
  runtime_id: string;
  runtime_mode: RuntimeMode;
  generation_plan_refs: string[];
  runtime_units: RuntimeUnit[];
  execution_queue: ExecutionQueueEntry[];
  image_runtime_plan: {
    target_count: number;
    image_targets: string[];
    plan_ready: CertificationStatus;
  };
  video_runtime_plan: {
    target_count: number;
    video_targets: string[];
    plan_ready: CertificationStatus;
  };
  adapter_execution_plan: {
    entry_count: number;
    entries: AdapterExecutionEntry[];
    plan_ready: CertificationStatus;
  };
  consistency_runtime_plan: {
    entry_count: number;
    entries: ConsistencyRuntimeEntry[];
    plan_ready: CertificationStatus;
  };
  quality_gate_runtime_plan: {
    entry_count: number;
    entries: QualityGateRuntimeEntry[];
    plan_ready: CertificationStatus;
  };
  failure_recovery_plan: {
    entry_count: number;
    entries: FailureRecoveryEntry[];
    plan_ready: CertificationStatus;
  };
  runtime_readiness: CertificationStatus;
  traceability_chain: GenerationPlan['traceability_chain'];
  runtime_package_ready: CertificationStatus;
};

export type ProductionRuntimeEngineArtifact = {
  engine_id: string;
  phase: typeof PRODUCTION_RUNTIME_ENGINE_PHASE;
  generated_at: string;
  generation_planning_artifact_path: typeof GENERATION_PLANNING_ENGINE_ARTIFACT_PATH;
  runtime_packages: ProductionRuntimePackage[];
  runtime_package_complete: boolean;
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
  };
};

export type MovieAnalysisProductionRuntimeEngineManifest = {
  manifest_id: string;
  phase: typeof PRODUCTION_RUNTIME_ENGINE_PHASE;
  generated_at: string;
  runtime_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  generation_plan_consumed: CertificationStatus;
  runtime_package_complete: CertificationStatus;
  execution_queue_valid: CertificationStatus;
  adapter_execution_ready: CertificationStatus;
  quality_gate_ready: CertificationStatus;
  failure_recovery_ready: CertificationStatus;
  runtime_mode_valid: CertificationStatus;
  runtime_readiness_valid: CertificationStatus;
  traceability_preserved: boolean;
  certification_status: typeof PRODUCTION_RUNTIME_READY_STATUS | null;
};

export type MovieAnalysisProductionRuntimeEngineReport = {
  report_id: string;
  phase: typeof PRODUCTION_RUNTIME_ENGINE_PHASE;
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
  generation_planning_engine_report_path: typeof GENERATION_PLANNING_ENGINE_REPORT_PATH;
  generation_planning_engine_artifact_path: typeof GENERATION_PLANNING_ENGINE_ARTIFACT_PATH;
  production_runtime_engine_export_dir: typeof PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR;
  production_runtime_engine_manifest_path: typeof PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH;
  production_runtime_engine_artifact_path: typeof PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  runtime_package_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  generation_plan_consumed: CertificationStatus;
  runtime_package_complete: CertificationStatus;
  execution_queue_valid: CertificationStatus;
  adapter_execution_ready: CertificationStatus;
  quality_gate_ready: CertificationStatus;
  failure_recovery_ready: CertificationStatus;
  runtime_mode_valid: CertificationStatus;
  runtime_readiness_valid: CertificationStatus;
  traceability_preserved: boolean;
  generation_plan_missing: boolean;
  runtime_package_failure: boolean;
  execution_queue_invalid: boolean;
  adapter_execution_failure: boolean;
  quality_gate_missing: boolean;
  failure_recovery_missing: boolean;
  runtime_mode_invalid: boolean;
  runtime_not_ready: boolean;
  traceability_loss: boolean;
  production_runtime_engine_ready: CertificationStatus;
  certification_status: typeof PRODUCTION_RUNTIME_READY_STATUS | null;
  runtime_packages: ProductionRuntimePackage[];
  final_verdict:
    | typeof PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT
    | typeof PRODUCTION_RUNTIME_ENGINE_FAIL_VERDICT;
  issues: ProductionRuntimeEngineIssue[];
};

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function runtimeModeForPlan(plan: GenerationPlan): RuntimeMode | null {
  return RUNTIME_MODE_BY_PRODUCTION_TYPE[plan.production_type] ?? null;
}

function qualityGateRefForUnit(plan: GenerationPlan, unit: GenerationUnit): string {
  const executionGate = plan.quality_gate_plan.entries.find(
    (entry) => entry.unit_id === unit.unit_id && entry.gate_id === 'GATE-EXECUTION-READY'
  );
  return executionGate?.gate_id ?? 'GATE-EXECUTION-READY';
}

function buildRuntimeUnit(
  plan: GenerationPlan,
  unit: GenerationUnit,
  index: number
): RuntimeUnit {
  const runtimeUnitId = `runtime_unit_${plan.production_type}_${index + 1}`;
  const qualityGateRef = qualityGateRefForUnit(plan, unit);
  const runtimeReady =
    unit.execution_ready === 'PASS' &&
    unit.image_target.length > 0 &&
    unit.video_target.length > 0 &&
    unit.adapter_requirements.length > 0 &&
    qualityGateRef.length > 0;

  return {
    unit_id: runtimeUnitId,
    generation_unit_ref: unit.unit_id,
    execution_order: index + 1,
    image_target: unit.image_target,
    video_target: unit.video_target,
    adapter_requirements: unit.adapter_requirements,
    quality_gate_ref: qualityGateRef,
    runtime_ready: toStatus(runtimeReady),
  };
}

function buildRuntimePackage(plan: GenerationPlan): ProductionRuntimePackage {
  const runtimeMode = runtimeModeForPlan(plan);
  const runtimeUnits = plan.generation_units.map((unit, index) =>
    buildRuntimeUnit(plan, unit, index)
  );

  const executionQueue: ExecutionQueueEntry[] = runtimeUnits.map((unit, index) => ({
    queue_order: index + 1,
    runtime_unit_id: unit.unit_id,
    generation_unit_ref: unit.generation_unit_ref,
  }));

  const adapterEntries: AdapterExecutionEntry[] = runtimeUnits.map((unit) => ({
    runtime_unit_id: unit.unit_id,
    generation_unit_ref: unit.generation_unit_ref,
    adapter_requirements: unit.adapter_requirements,
    execution_ready: toStatus(unit.adapter_requirements.length > 0),
  }));

  const consistencyEntries: ConsistencyRuntimeEntry[] = plan.generation_units.map((unit) => {
    const runtimeUnit = runtimeUnits.find((entry) => entry.generation_unit_ref === unit.unit_id);
    return {
      runtime_unit_id: runtimeUnit?.unit_id ?? unit.unit_id,
      generation_unit_ref: unit.unit_id,
      consistency_target: unit.consistency_target,
      continuity_preserved: toStatus(unit.consistency_target.length > 0),
    };
  });

  const qualityEntries: QualityGateRuntimeEntry[] = plan.quality_gate_plan.entries.map((entry) => {
    const runtimeUnit = runtimeUnits.find((unit) => unit.generation_unit_ref === entry.unit_id);
    return {
      runtime_unit_id: runtimeUnit?.unit_id ?? entry.unit_id,
      generation_unit_ref: entry.unit_id,
      gate_id: entry.gate_id,
      gate_label: entry.gate_label,
      gate_passed: entry.gate_passed,
    };
  });

  const failureEntries: FailureRecoveryEntry[] = runtimeUnits.map((unit, index) => ({
    runtime_unit_id: unit.unit_id,
    generation_unit_ref: unit.generation_unit_ref,
    retry_policy: 'retry_once_then_fallback',
    fallback_unit_ref: index > 0 ? runtimeUnits[index - 1].unit_id : null,
    recovery_ready: toStatus(unit.runtime_ready === 'PASS'),
  }));

  const imageTargets = runtimeUnits.map((unit) => unit.image_target);
  const videoTargets = runtimeUnits.map((unit) => unit.video_target);

  const adapterPlanReady = toStatus(adapterEntries.every((entry) => entry.execution_ready === 'PASS'));
  const consistencyPlanReady = toStatus(
    consistencyEntries.every((entry) => entry.continuity_preserved === 'PASS')
  );
  const qualityGatePlanReady = toStatus(qualityEntries.every((entry) => entry.gate_passed === 'PASS'));
  const failureRecoveryPlanReady = toStatus(
    failureEntries.every((entry) => entry.recovery_ready === 'PASS')
  );
  const runtimeReadiness = toStatus(runtimeUnits.every((unit) => unit.runtime_ready === 'PASS'));

  const runtimePackageReady = toStatus(
    runtimeMode !== null &&
      runtimeUnits.length === plan.generation_units.length &&
      adapterPlanReady === 'PASS' &&
      consistencyPlanReady === 'PASS' &&
      qualityGatePlanReady === 'PASS' &&
      failureRecoveryPlanReady === 'PASS' &&
      runtimeReadiness === 'PASS' &&
      plan.traceability_chain.trace_integrity === 'PASS'
  );

  const productionSlug = plan.production_type.replace('_blueprint', '');

  return {
    runtime_id: `production_runtime_${productionSlug}_v1`,
    runtime_mode: runtimeMode ?? 'mv_production_runtime',
    generation_plan_refs: [plan.generation_plan_id],
    runtime_units: runtimeUnits,
    execution_queue: executionQueue,
    image_runtime_plan: {
      target_count: imageTargets.length,
      image_targets: imageTargets,
      plan_ready: toStatus(imageTargets.length > 0),
    },
    video_runtime_plan: {
      target_count: videoTargets.length,
      video_targets: videoTargets,
      plan_ready: toStatus(videoTargets.length > 0),
    },
    adapter_execution_plan: {
      entry_count: adapterEntries.length,
      entries: adapterEntries,
      plan_ready: adapterPlanReady,
    },
    consistency_runtime_plan: {
      entry_count: consistencyEntries.length,
      entries: consistencyEntries,
      plan_ready: consistencyPlanReady,
    },
    quality_gate_runtime_plan: {
      entry_count: qualityEntries.length,
      entries: qualityEntries,
      plan_ready: qualityGatePlanReady,
    },
    failure_recovery_plan: {
      entry_count: failureEntries.length,
      entries: failureEntries,
      plan_ready: failureRecoveryPlanReady,
    },
    runtime_readiness: runtimeReadiness,
    traceability_chain: plan.traceability_chain,
    runtime_package_ready: runtimePackageReady,
  };
}

function isExecutionQueueValid(runtimePackage: ProductionRuntimePackage): boolean {
  return (
    runtimePackage.execution_queue.length === runtimePackage.runtime_units.length &&
    runtimePackage.execution_queue.every((entry, index) => {
      const unit = runtimePackage.runtime_units[index];
      return (
        entry.queue_order === index + 1 &&
        entry.runtime_unit_id === unit?.unit_id &&
        entry.generation_unit_ref === unit?.generation_unit_ref
      );
    })
  );
}

function isRuntimeModeValid(runtimePackage: ProductionRuntimePackage): boolean {
  return Object.values(RUNTIME_MODE_BY_PRODUCTION_TYPE).includes(runtimePackage.runtime_mode);
}

function buildMarkdown(report: MovieAnalysisProductionRuntimeEngineReport): string {
  const lines = [
    '# Movie Analysis Production Runtime Engine',
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
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| generation_plan_consumed | ${report.generation_plan_consumed} |`,
    `| runtime_package_complete | ${report.runtime_package_complete} |`,
    `| execution_queue_valid | ${report.execution_queue_valid} |`,
    `| adapter_execution_ready | ${report.adapter_execution_ready} |`,
    `| quality_gate_ready | ${report.quality_gate_ready} |`,
    `| failure_recovery_ready | ${report.failure_recovery_ready} |`,
    `| runtime_mode_valid | ${report.runtime_mode_valid} |`,
    `| runtime_readiness_valid | ${report.runtime_readiness_valid} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Runtime Packages',
    ''
  );

  for (const runtimePackage of report.runtime_packages) {
    lines.push(
      `- ${runtimePackage.runtime_id}: ready=${runtimePackage.runtime_package_ready} mode=${runtimePackage.runtime_mode} units=${runtimePackage.runtime_units.length}`
    );
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
  issues: ProductionRuntimeEngineIssue[]
): MovieAnalysisProductionRuntimeEngineReport {
  const report: MovieAnalysisProductionRuntimeEngineReport = {
    report_id: 'movie-analysis-production-runtime-engine-report-v1',
    phase: PRODUCTION_RUNTIME_ENGINE_PHASE,
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
    generation_planning_engine_report_path: GENERATION_PLANNING_ENGINE_REPORT_PATH,
    generation_planning_engine_artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    production_runtime_engine_export_dir: PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR,
    production_runtime_engine_manifest_path: PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
    production_runtime_engine_artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    runtime_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    generation_plan_consumed: 'FAIL',
    runtime_package_complete: 'FAIL',
    execution_queue_valid: 'FAIL',
    adapter_execution_ready: 'FAIL',
    quality_gate_ready: 'FAIL',
    failure_recovery_ready: 'FAIL',
    runtime_mode_valid: 'FAIL',
    runtime_readiness_valid: 'FAIL',
    traceability_preserved: false,
    generation_plan_missing: true,
    runtime_package_failure: true,
    execution_queue_invalid: true,
    adapter_execution_failure: true,
    quality_gate_missing: true,
    failure_recovery_missing: true,
    runtime_mode_invalid: true,
    runtime_not_ready: true,
    traceability_loss: true,
    production_runtime_engine_ready: 'FAIL',
    certification_status: null,
    runtime_packages: [],
    final_verdict: PRODUCTION_RUNTIME_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_RUNTIME_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisProductionRuntimeEngine(
  projectRoot?: string
): MovieAnalysisProductionRuntimeEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProductionRuntimeEngineIssue[] = [];
  const timestamp = new Date().toISOString();

  const planningReport = loadReport<Record<string, unknown>>(
    root,
    GENERATION_PLANNING_ENGINE_REPORT_PATH
  );
  const planningArtifactPath = path.join(root, GENERATION_PLANNING_ENGINE_ARTIFACT_PATH);
  const generationPlanMissing =
    !planningReport ||
    planningReport.final_verdict !== GENERATION_PLANNING_ENGINE_PASS_VERDICT ||
    planningReport.certification_status !== GENERATION_PLANNING_READY_STATUS ||
    !fs.existsSync(planningArtifactPath);

  if (generationPlanMissing) {
    issues.push({
      code: 'GENERATION_PLAN_MISSING',
      message: `Required ${GENERATION_PLANNING_ENGINE_PASS_VERDICT} with ${GENERATION_PLANNING_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const planningArtifact = JSON.parse(
    fs.readFileSync(planningArtifactPath, 'utf8')
  ) as GenerationPlanningEngineArtifact;

  if (!planningArtifact.generation_planning_complete || planningArtifact.generation_plans.length === 0) {
    issues.push({
      code: 'GENERATION_PLAN_NOT_READY',
      message: 'Generation planning engine artifact is not complete',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const runtimePackages = planningArtifact.generation_plans.map((plan) => buildRuntimePackage(plan));

  for (const runtimePackage of runtimePackages) {
    if (runtimePackage.runtime_package_ready === 'FAIL') {
      issues.push({
        code: 'RUNTIME_PACKAGE_FAILURE',
        message: `Runtime package failed for ${runtimePackage.runtime_id}`,
        severity: 'error',
        runtime_id: runtimePackage.runtime_id,
      });
    }
  }

  const generationPlanConsumed = toStatus(
    !generationPlanMissing && planningArtifact.generation_planning_complete
  );
  const runtimePackageComplete = toStatus(
    runtimePackages.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
      runtimePackages.every((runtimePackage) => runtimePackage.runtime_package_ready === 'PASS')
  );
  const executionQueueValid = toStatus(
    runtimePackages.every((runtimePackage) => isExecutionQueueValid(runtimePackage))
  );
  const adapterExecutionReady = toStatus(
    runtimePackages.every((runtimePackage) => runtimePackage.adapter_execution_plan.plan_ready === 'PASS')
  );
  const qualityGateReady = toStatus(
    runtimePackages.every((runtimePackage) => runtimePackage.quality_gate_runtime_plan.plan_ready === 'PASS')
  );
  const failureRecoveryReady = toStatus(
    runtimePackages.every((runtimePackage) => runtimePackage.failure_recovery_plan.plan_ready === 'PASS')
  );
  const runtimeModeValid = toStatus(
    runtimePackages.every((runtimePackage) => isRuntimeModeValid(runtimePackage))
  );
  const runtimeReadinessValid = toStatus(
    runtimePackages.every((runtimePackage) => runtimePackage.runtime_readiness === 'PASS')
  );
  const traceabilityPreserved =
    runtimePackages.every((runtimePackage) => runtimePackage.traceability_chain.trace_integrity === 'PASS') &&
    adapterExecutionReady === 'PASS' &&
    qualityGateReady === 'PASS';

  const runtimePackageFailure = runtimePackageComplete === 'FAIL';
  const executionQueueInvalid = executionQueueValid === 'FAIL';
  const adapterExecutionFailure = adapterExecutionReady === 'FAIL';
  const qualityGateMissing = qualityGateReady === 'FAIL';
  const failureRecoveryMissing = failureRecoveryReady === 'FAIL';
  const runtimeModeInvalid = runtimeModeValid === 'FAIL';
  const runtimeNotReady = runtimeReadinessValid === 'FAIL';
  const traceabilityLoss = !traceabilityPreserved;

  const pass =
    generationPlanConsumed === 'PASS' &&
    runtimePackageComplete === 'PASS' &&
    executionQueueValid === 'PASS' &&
    adapterExecutionReady === 'PASS' &&
    qualityGateReady === 'PASS' &&
    failureRecoveryReady === 'PASS' &&
    runtimeModeValid === 'PASS' &&
    runtimeReadinessValid === 'PASS' &&
    traceabilityPreserved &&
    !runtimePackageFailure &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: ProductionRuntimeEngineArtifact = {
    engine_id: 'production-runtime-engine-v1',
    phase: PRODUCTION_RUNTIME_ENGINE_PHASE,
    generated_at: timestamp,
    generation_planning_artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    runtime_packages: runtimePackages,
    runtime_package_complete: pass,
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
    },
  };

  const manifest: MovieAnalysisProductionRuntimeEngineManifest = {
    manifest_id: 'movie-analysis-production-runtime-engine-manifest-v1',
    phase: PRODUCTION_RUNTIME_ENGINE_PHASE,
    generated_at: timestamp,
    runtime_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    generation_plan_consumed: generationPlanConsumed,
    runtime_package_complete: runtimePackageComplete,
    execution_queue_valid: executionQueueValid,
    adapter_execution_ready: adapterExecutionReady,
    quality_gate_ready: qualityGateReady,
    failure_recovery_ready: failureRecoveryReady,
    runtime_mode_valid: runtimeModeValid,
    runtime_readiness_valid: runtimeReadinessValid,
    traceability_preserved: traceabilityPreserved,
    certification_status: pass ? PRODUCTION_RUNTIME_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisProductionRuntimeEngineReport = {
    report_id: 'movie-analysis-production-runtime-engine-report-v1',
    phase: PRODUCTION_RUNTIME_ENGINE_PHASE,
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
    generation_planning_engine_report_path: GENERATION_PLANNING_ENGINE_REPORT_PATH,
    generation_planning_engine_artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    production_runtime_engine_export_dir: PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR,
    production_runtime_engine_manifest_path: PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
    production_runtime_engine_artifact_path: PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    runtime_package_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    generation_plan_consumed: generationPlanConsumed,
    runtime_package_complete: runtimePackageComplete,
    execution_queue_valid: executionQueueValid,
    adapter_execution_ready: adapterExecutionReady,
    quality_gate_ready: qualityGateReady,
    failure_recovery_ready: failureRecoveryReady,
    runtime_mode_valid: runtimeModeValid,
    runtime_readiness_valid: runtimeReadinessValid,
    traceability_preserved: traceabilityPreserved,
    generation_plan_missing: false,
    runtime_package_failure: runtimePackageFailure,
    execution_queue_invalid: executionQueueInvalid,
    adapter_execution_failure: adapterExecutionFailure,
    quality_gate_missing: qualityGateMissing,
    failure_recovery_missing: failureRecoveryMissing,
    runtime_mode_invalid: runtimeModeInvalid,
    runtime_not_ready: runtimeNotReady,
    traceability_loss: traceabilityLoss,
    production_runtime_engine_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_RUNTIME_READY_STATUS : null,
    runtime_packages: runtimePackages,
    final_verdict: pass
      ? PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT
      : PRODUCTION_RUNTIME_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_RUNTIME_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_RUNTIME_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
