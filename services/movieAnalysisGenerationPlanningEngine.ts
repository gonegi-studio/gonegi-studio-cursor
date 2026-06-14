import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
  SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  SHOT_ASSEMBLY_READY_STATUS,
  type ShotAssembly,
  type ShotAssemblyEngineArtifact,
  type ShotUnit,
} from './movieAnalysisShotAssemblyEngine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GENERATION_PLANNING_ENGINE_PHASE =
  'PHASE-LEVEL3-005-GENERATION_PLANNING_ENGINE_V1' as const;
export const GENERATION_PLANNING_ENGINE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_GENERATION_PLANNING_ENGINE_V1' as const;
export const GENERATION_PLANNING_ENGINE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_GENERATION_PLANNING_ENGINE_V1' as const;
export const GENERATION_PLANNING_READY_STATUS = 'GENERATION_PLANNING_READY' as const;
export const GENERATION_PLANNING_ENGINE_DIR =
  'reports/movie_analysis_generation_planning_engine' as const;
export const GENERATION_PLANNING_ENGINE_REPORT_PATH =
  'reports/movie_analysis_generation_planning_engine/movie-analysis-generation-planning-engine-report.json' as const;
export const GENERATION_PLANNING_ENGINE_MD_PATH =
  'reports/movie_analysis_generation_planning_engine/MOVIE_ANALYSIS_GENERATION_PLANNING_ENGINE.md' as const;
export const GENERATION_PLANNING_ENGINE_EXPORT_DIR =
  'exports/movie_analysis_generation_planning_engine' as const;
export const GENERATION_PLANNING_ENGINE_MANIFEST_PATH =
  'exports/movie_analysis_generation_planning_engine/movie-analysis-generation-planning-engine-manifest.json' as const;
export const GENERATION_PLANNING_ENGINE_ARTIFACT_PATH =
  'exports/movie_analysis_generation_planning_engine/generation-planning-engine.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type GenerationPlanningEngineIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  generation_plan_id?: string;
  unit_id?: string;
};

export type GenerationUnit = {
  unit_id: string;
  shot_id: string;
  generation_prompt_seed: string;
  visual_intent: string;
  adapter_requirements: string[];
  image_target: string;
  video_target: string;
  consistency_target: string;
  execution_ready: CertificationStatus;
};

export type PromptGenerationEntry = {
  unit_id: string;
  shot_id: string;
  prompt_seed: string;
  visual_intent: string;
  prompt_ready: CertificationStatus;
};

export type NegativePromptEntry = {
  unit_id: string;
  shot_id: string;
  negative_prompt_seed: string;
  negative_prompt_ready: CertificationStatus;
};

export type AdapterBindingEntry = {
  unit_id: string;
  shot_id: string;
  adapter_requirements: string[];
  binding_ready: CertificationStatus;
};

export type ConsistencyPlanEntry = {
  unit_id: string;
  shot_id: string;
  consistency_target: string;
  continuity_preserved: CertificationStatus;
};

export type QualityGateEntry = {
  unit_id: string;
  shot_id: string;
  gate_id: string;
  gate_label: string;
  gate_passed: CertificationStatus;
};

export type GenerationPlan = {
  generation_plan_id: string;
  shot_assembly_id: string;
  production_type: ShotAssembly['production_type'];
  generation_units: GenerationUnit[];
  image_generation_plan: {
    target_count: number;
    image_targets: string[];
    plan_ready: CertificationStatus;
  };
  video_generation_plan: {
    target_count: number;
    video_targets: string[];
    plan_ready: CertificationStatus;
  };
  prompt_generation_plan: {
    entry_count: number;
    entries: PromptGenerationEntry[];
    plan_ready: CertificationStatus;
  };
  negative_prompt_plan: {
    entry_count: number;
    entries: NegativePromptEntry[];
    plan_ready: CertificationStatus;
  };
  adapter_binding_plan: {
    entry_count: number;
    entries: AdapterBindingEntry[];
    plan_ready: CertificationStatus;
  };
  consistency_plan: {
    entry_count: number;
    entries: ConsistencyPlanEntry[];
    plan_ready: CertificationStatus;
  };
  quality_gate_plan: {
    entry_count: number;
    entries: QualityGateEntry[];
    plan_ready: CertificationStatus;
  };
  execution_readiness: CertificationStatus;
  traceability_chain: ShotAssembly['traceability_chain'];
  generation_plan_ready: CertificationStatus;
};

export type GenerationPlanningEngineArtifact = {
  engine_id: string;
  phase: typeof GENERATION_PLANNING_ENGINE_PHASE;
  generated_at: string;
  shot_assembly_artifact_path: typeof SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  generation_plans: GenerationPlan[];
  generation_planning_complete: boolean;
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

export type MovieAnalysisGenerationPlanningEngineManifest = {
  manifest_id: string;
  phase: typeof GENERATION_PLANNING_ENGINE_PHASE;
  generated_at: string;
  generation_plan_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  shot_assembly_consumed: CertificationStatus;
  generation_plan_complete: CertificationStatus;
  prompt_generation_ready: CertificationStatus;
  negative_prompt_plan_ready: CertificationStatus;
  adapter_binding_ready: CertificationStatus;
  consistency_plan_ready: CertificationStatus;
  quality_gate_plan_ready: CertificationStatus;
  execution_readiness_valid: CertificationStatus;
  traceability_preserved: boolean;
  certification_status: typeof GENERATION_PLANNING_READY_STATUS | null;
};

export type MovieAnalysisGenerationPlanningEngineReport = {
  report_id: string;
  phase: typeof GENERATION_PLANNING_ENGINE_PHASE;
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
  shot_assembly_engine_report_path: typeof SHOT_ASSEMBLY_ENGINE_REPORT_PATH;
  shot_assembly_engine_artifact_path: typeof SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  generation_planning_engine_export_dir: typeof GENERATION_PLANNING_ENGINE_EXPORT_DIR;
  generation_planning_engine_manifest_path: typeof GENERATION_PLANNING_ENGINE_MANIFEST_PATH;
  generation_planning_engine_artifact_path: typeof GENERATION_PLANNING_ENGINE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  generation_plan_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  shot_assembly_consumed: CertificationStatus;
  generation_plan_complete: CertificationStatus;
  prompt_generation_ready: CertificationStatus;
  negative_prompt_plan_ready: CertificationStatus;
  adapter_binding_ready: CertificationStatus;
  consistency_plan_ready: CertificationStatus;
  quality_gate_plan_ready: CertificationStatus;
  execution_readiness_valid: CertificationStatus;
  traceability_preserved: boolean;
  shot_assembly_missing: boolean;
  generation_plan_failure: boolean;
  prompt_seed_missing: boolean;
  negative_prompt_plan_missing: boolean;
  adapter_binding_loss: boolean;
  consistency_plan_missing: boolean;
  quality_gate_plan_missing: boolean;
  execution_not_ready: boolean;
  traceability_loss: boolean;
  generation_planning_engine_ready: CertificationStatus;
  certification_status: typeof GENERATION_PLANNING_READY_STATUS | null;
  generation_plans: GenerationPlan[];
  final_verdict:
    | typeof GENERATION_PLANNING_ENGINE_PASS_VERDICT
    | typeof GENERATION_PLANNING_ENGINE_FAIL_VERDICT;
  issues: GenerationPlanningEngineIssue[];
};

const NEGATIVE_PROMPT_BY_SHOT_TYPE: Record<string, string> = {
  layout_shot: 'blur, distortion, identity_reset',
  bridge_shot: 'continuity_break, scene_reset',
  hold_shot: 'motion_jitter, frame_drop',
  shift_shot: 'camera_jump, perspective_break',
  coverage_shot: 'incomplete_coverage, missing_subject',
};

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function imageTargetForShot(shot: ShotUnit): string {
  return shot.scene_id.replace('_scene_', '_character_');
}

function consistencyTargetForShot(shotAssembly: ShotAssembly, shotId: string): string {
  const link = shotAssembly.continuity_links.find((entry) => entry.linked_shot_ids.includes(shotId));
  return link?.continuity_target_id ?? `${shotId}_continuity_hold`;
}

function negativePromptForShot(shot: ShotUnit): string {
  const base = NEGATIVE_PROMPT_BY_SHOT_TYPE[shot.shot_type] ?? 'artifact, corruption';
  return `neg_${shot.generation_prompt_seed}_${base}`;
}

function buildGenerationUnit(shotAssembly: ShotAssembly, shot: ShotUnit, index: number): GenerationUnit {
  const unitId = `generation_unit_${shotAssembly.production_type}_${index + 1}`;
  const imageTarget = imageTargetForShot(shot);
  const videoTarget = shot.shot_id;
  const consistencyTarget = consistencyTargetForShot(shotAssembly, shot.shot_id);
  const executionReady =
    shot.execution_ready === 'PASS' &&
    shot.generation_prompt_seed.length > 0 &&
    shot.adapter_requirements.length > 0 &&
    imageTarget.length > 0 &&
    videoTarget.length > 0 &&
    consistencyTarget.length > 0;

  return {
    unit_id: unitId,
    shot_id: shot.shot_id,
    generation_prompt_seed: shot.generation_prompt_seed,
    visual_intent: shot.visual_intent,
    adapter_requirements: shot.adapter_requirements,
    image_target: imageTarget,
    video_target: videoTarget,
    consistency_target: consistencyTarget,
    execution_ready: toStatus(executionReady),
  };
}

function buildQualityGates(unit: GenerationUnit): QualityGateEntry[] {
  return [
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-PROMPT-SEED',
      gate_label: 'Prompt Seed Present',
      gate_passed: toStatus(unit.generation_prompt_seed.length > 0),
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-ADAPTER-BINDING',
      gate_label: 'Adapter Binding Present',
      gate_passed: toStatus(unit.adapter_requirements.length > 0),
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-CONSISTENCY-TARGET',
      gate_label: 'Consistency Target Present',
      gate_passed: toStatus(unit.consistency_target.length > 0),
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-EXECUTION-READY',
      gate_label: 'Execution Ready',
      gate_passed: unit.execution_ready,
    },
  ];
}

function buildGenerationPlan(shotAssembly: ShotAssembly): GenerationPlan {
  const generationUnits = shotAssembly.shot_units.map((shot, index) =>
    buildGenerationUnit(shotAssembly, shot, index)
  );

  const promptEntries: PromptGenerationEntry[] = generationUnits.map((unit) => ({
    unit_id: unit.unit_id,
    shot_id: unit.shot_id,
    prompt_seed: unit.generation_prompt_seed,
    visual_intent: unit.visual_intent,
    prompt_ready: toStatus(unit.generation_prompt_seed.length > 0 && unit.visual_intent.length > 0),
  }));

  const negativeEntries: NegativePromptEntry[] = generationUnits.map((unit) => {
    const shot = shotAssembly.shot_units.find((entry) => entry.shot_id === unit.shot_id);
    const negativePromptSeed = shot ? negativePromptForShot(shot) : `neg_${unit.shot_id}`;
    return {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      negative_prompt_seed: negativePromptSeed,
      negative_prompt_ready: toStatus(negativePromptSeed.length > 0),
    };
  });

  const adapterEntries: AdapterBindingEntry[] = generationUnits.map((unit) => ({
    unit_id: unit.unit_id,
    shot_id: unit.shot_id,
    adapter_requirements: unit.adapter_requirements,
    binding_ready: toStatus(unit.adapter_requirements.length > 0),
  }));

  const consistencyEntries: ConsistencyPlanEntry[] = generationUnits.map((unit) => ({
    unit_id: unit.unit_id,
    shot_id: unit.shot_id,
    consistency_target: unit.consistency_target,
    continuity_preserved: toStatus(unit.consistency_target.length > 0),
  }));

  const qualityEntries = generationUnits.flatMap((unit) => buildQualityGates(unit));

  const imageTargets = generationUnits.map((unit) => unit.image_target);
  const videoTargets = generationUnits.map((unit) => unit.video_target);

  const promptPlanReady = toStatus(promptEntries.every((entry) => entry.prompt_ready === 'PASS'));
  const negativePlanReady = toStatus(
    negativeEntries.every((entry) => entry.negative_prompt_ready === 'PASS')
  );
  const adapterPlanReady = toStatus(adapterEntries.every((entry) => entry.binding_ready === 'PASS'));
  const consistencyPlanReady = toStatus(
    consistencyEntries.every((entry) => entry.continuity_preserved === 'PASS')
  );
  const qualityGatePlanReady = toStatus(qualityEntries.every((entry) => entry.gate_passed === 'PASS'));
  const executionReadiness = toStatus(
    generationUnits.every((unit) => unit.execution_ready === 'PASS')
  );

  const generationPlanReady = toStatus(
    generationUnits.length === shotAssembly.shot_units.length &&
      promptPlanReady === 'PASS' &&
      negativePlanReady === 'PASS' &&
      adapterPlanReady === 'PASS' &&
      consistencyPlanReady === 'PASS' &&
      qualityGatePlanReady === 'PASS' &&
      executionReadiness === 'PASS' &&
      shotAssembly.traceability_chain.trace_integrity === 'PASS'
  );

  const productionSlug = shotAssembly.production_type.replace('_blueprint', '');

  return {
    generation_plan_id: `generation_plan_${productionSlug}_v1`,
    shot_assembly_id: shotAssembly.shot_assembly_id,
    production_type: shotAssembly.production_type,
    generation_units: generationUnits,
    image_generation_plan: {
      target_count: imageTargets.length,
      image_targets: imageTargets,
      plan_ready: toStatus(imageTargets.length > 0),
    },
    video_generation_plan: {
      target_count: videoTargets.length,
      video_targets: videoTargets,
      plan_ready: toStatus(videoTargets.length > 0),
    },
    prompt_generation_plan: {
      entry_count: promptEntries.length,
      entries: promptEntries,
      plan_ready: promptPlanReady,
    },
    negative_prompt_plan: {
      entry_count: negativeEntries.length,
      entries: negativeEntries,
      plan_ready: negativePlanReady,
    },
    adapter_binding_plan: {
      entry_count: adapterEntries.length,
      entries: adapterEntries,
      plan_ready: adapterPlanReady,
    },
    consistency_plan: {
      entry_count: consistencyEntries.length,
      entries: consistencyEntries,
      plan_ready: consistencyPlanReady,
    },
    quality_gate_plan: {
      entry_count: qualityEntries.length,
      entries: qualityEntries,
      plan_ready: qualityGatePlanReady,
    },
    execution_readiness: executionReadiness,
    traceability_chain: shotAssembly.traceability_chain,
    generation_plan_ready: generationPlanReady,
  };
}

function buildMarkdown(report: MovieAnalysisGenerationPlanningEngineReport): string {
  const lines = [
    '# Movie Analysis Generation Planning Engine',
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
    `| shot_assembly_consumed | ${report.shot_assembly_consumed} |`,
    `| generation_plan_complete | ${report.generation_plan_complete} |`,
    `| prompt_generation_ready | ${report.prompt_generation_ready} |`,
    `| negative_prompt_plan_ready | ${report.negative_prompt_plan_ready} |`,
    `| adapter_binding_ready | ${report.adapter_binding_ready} |`,
    `| consistency_plan_ready | ${report.consistency_plan_ready} |`,
    `| quality_gate_plan_ready | ${report.quality_gate_plan_ready} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Generation Plans',
    ''
  );

  for (const plan of report.generation_plans) {
    lines.push(
      `- ${plan.generation_plan_id}: ready=${plan.generation_plan_ready} units=${plan.generation_units.length}`
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
  issues: GenerationPlanningEngineIssue[]
): MovieAnalysisGenerationPlanningEngineReport {
  const report: MovieAnalysisGenerationPlanningEngineReport = {
    report_id: 'movie-analysis-generation-planning-engine-report-v1',
    phase: GENERATION_PLANNING_ENGINE_PHASE,
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
    shot_assembly_engine_report_path: SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
    shot_assembly_engine_artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    generation_planning_engine_export_dir: GENERATION_PLANNING_ENGINE_EXPORT_DIR,
    generation_planning_engine_manifest_path: GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
    generation_planning_engine_artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    generation_plan_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    shot_assembly_consumed: 'FAIL',
    generation_plan_complete: 'FAIL',
    prompt_generation_ready: 'FAIL',
    negative_prompt_plan_ready: 'FAIL',
    adapter_binding_ready: 'FAIL',
    consistency_plan_ready: 'FAIL',
    quality_gate_plan_ready: 'FAIL',
    execution_readiness_valid: 'FAIL',
    traceability_preserved: false,
    shot_assembly_missing: true,
    generation_plan_failure: true,
    prompt_seed_missing: true,
    negative_prompt_plan_missing: true,
    adapter_binding_loss: true,
    consistency_plan_missing: true,
    quality_gate_plan_missing: true,
    execution_not_ready: true,
    traceability_loss: true,
    generation_planning_engine_ready: 'FAIL',
    certification_status: null,
    generation_plans: [],
    final_verdict: GENERATION_PLANNING_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, GENERATION_PLANNING_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, GENERATION_PLANNING_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GENERATION_PLANNING_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisGenerationPlanningEngine(
  projectRoot?: string
): MovieAnalysisGenerationPlanningEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GenerationPlanningEngineIssue[] = [];
  const timestamp = new Date().toISOString();

  const shotAssemblyReport = loadReport<Record<string, unknown>>(
    root,
    SHOT_ASSEMBLY_ENGINE_REPORT_PATH
  );
  const shotAssemblyArtifactPath = path.join(root, SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH);
  const shotAssemblyMissing =
    !shotAssemblyReport ||
    shotAssemblyReport.final_verdict !== SHOT_ASSEMBLY_ENGINE_PASS_VERDICT ||
    shotAssemblyReport.certification_status !== SHOT_ASSEMBLY_READY_STATUS ||
    !fs.existsSync(shotAssemblyArtifactPath);

  if (shotAssemblyMissing) {
    issues.push({
      code: 'SHOT_ASSEMBLY_MISSING',
      message: `Required ${SHOT_ASSEMBLY_ENGINE_PASS_VERDICT} with ${SHOT_ASSEMBLY_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const shotAssemblyArtifact = JSON.parse(
    fs.readFileSync(shotAssemblyArtifactPath, 'utf8')
  ) as ShotAssemblyEngineArtifact;

  if (!shotAssemblyArtifact.shot_assembly_complete || shotAssemblyArtifact.shot_assemblies.length === 0) {
    issues.push({
      code: 'SHOT_ASSEMBLY_NOT_READY',
      message: 'Shot assembly engine artifact is not complete',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const generationPlans = shotAssemblyArtifact.shot_assemblies.map((shotAssembly) =>
    buildGenerationPlan(shotAssembly)
  );

  for (const plan of generationPlans) {
    if (plan.generation_plan_ready === 'FAIL') {
      issues.push({
        code: 'GENERATION_PLAN_FAILURE',
        message: `Generation plan failed for ${plan.generation_plan_id}`,
        severity: 'error',
        generation_plan_id: plan.generation_plan_id,
      });
    }
  }

  const shotAssemblyConsumed = toStatus(
    !shotAssemblyMissing && shotAssemblyArtifact.shot_assembly_complete
  );
  const generationPlanComplete = toStatus(
    generationPlans.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
      generationPlans.every((plan) => plan.generation_plan_ready === 'PASS')
  );
  const promptGenerationReady = toStatus(
    generationPlans.every((plan) => plan.prompt_generation_plan.plan_ready === 'PASS')
  );
  const negativePromptPlanReady = toStatus(
    generationPlans.every((plan) => plan.negative_prompt_plan.plan_ready === 'PASS')
  );
  const adapterBindingReady = toStatus(
    generationPlans.every((plan) => plan.adapter_binding_plan.plan_ready === 'PASS')
  );
  const consistencyPlanReady = toStatus(
    generationPlans.every((plan) => plan.consistency_plan.plan_ready === 'PASS')
  );
  const qualityGatePlanReady = toStatus(
    generationPlans.every((plan) => plan.quality_gate_plan.plan_ready === 'PASS')
  );
  const executionReadinessValid = toStatus(
    generationPlans.every((plan) => plan.execution_readiness === 'PASS')
  );
  const traceabilityPreserved =
    generationPlans.every((plan) => plan.traceability_chain.trace_integrity === 'PASS') &&
    promptGenerationReady === 'PASS' &&
    adapterBindingReady === 'PASS';

  const generationPlanFailure = generationPlanComplete === 'FAIL';
  const promptSeedMissing = promptGenerationReady === 'FAIL';
  const negativePromptPlanMissing = negativePromptPlanReady === 'FAIL';
  const adapterBindingLoss = adapterBindingReady === 'FAIL';
  const consistencyPlanMissing = consistencyPlanReady === 'FAIL';
  const qualityGatePlanMissing = qualityGatePlanReady === 'FAIL';
  const executionNotReady = executionReadinessValid === 'FAIL';
  const traceabilityLoss = !traceabilityPreserved;

  const pass =
    shotAssemblyConsumed === 'PASS' &&
    generationPlanComplete === 'PASS' &&
    promptGenerationReady === 'PASS' &&
    negativePromptPlanReady === 'PASS' &&
    adapterBindingReady === 'PASS' &&
    consistencyPlanReady === 'PASS' &&
    qualityGatePlanReady === 'PASS' &&
    executionReadinessValid === 'PASS' &&
    traceabilityPreserved &&
    !generationPlanFailure &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: GenerationPlanningEngineArtifact = {
    engine_id: 'generation-planning-engine-v1',
    phase: GENERATION_PLANNING_ENGINE_PHASE,
    generated_at: timestamp,
    shot_assembly_artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    generation_plans: generationPlans,
    generation_planning_complete: pass,
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

  const manifest: MovieAnalysisGenerationPlanningEngineManifest = {
    manifest_id: 'movie-analysis-generation-planning-engine-manifest-v1',
    phase: GENERATION_PLANNING_ENGINE_PHASE,
    generated_at: timestamp,
    generation_plan_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    shot_assembly_consumed: shotAssemblyConsumed,
    generation_plan_complete: generationPlanComplete,
    prompt_generation_ready: promptGenerationReady,
    negative_prompt_plan_ready: negativePromptPlanReady,
    adapter_binding_ready: adapterBindingReady,
    consistency_plan_ready: consistencyPlanReady,
    quality_gate_plan_ready: qualityGatePlanReady,
    execution_readiness_valid: executionReadinessValid,
    traceability_preserved: traceabilityPreserved,
    certification_status: pass ? GENERATION_PLANNING_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, GENERATION_PLANNING_ENGINE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, GENERATION_PLANNING_ENGINE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GENERATION_PLANNING_ENGINE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisGenerationPlanningEngineReport = {
    report_id: 'movie-analysis-generation-planning-engine-report-v1',
    phase: GENERATION_PLANNING_ENGINE_PHASE,
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
    shot_assembly_engine_report_path: SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
    shot_assembly_engine_artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    generation_planning_engine_export_dir: GENERATION_PLANNING_ENGINE_EXPORT_DIR,
    generation_planning_engine_manifest_path: GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
    generation_planning_engine_artifact_path: GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    generation_plan_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    shot_assembly_consumed: shotAssemblyConsumed,
    generation_plan_complete: generationPlanComplete,
    prompt_generation_ready: promptGenerationReady,
    negative_prompt_plan_ready: negativePromptPlanReady,
    adapter_binding_ready: adapterBindingReady,
    consistency_plan_ready: consistencyPlanReady,
    quality_gate_plan_ready: qualityGatePlanReady,
    execution_readiness_valid: executionReadinessValid,
    traceability_preserved: traceabilityPreserved,
    shot_assembly_missing: false,
    generation_plan_failure: generationPlanFailure,
    prompt_seed_missing: promptSeedMissing,
    negative_prompt_plan_missing: negativePromptPlanMissing,
    adapter_binding_loss: adapterBindingLoss,
    consistency_plan_missing: consistencyPlanMissing,
    quality_gate_plan_missing: qualityGatePlanMissing,
    execution_not_ready: executionNotReady,
    traceability_loss: traceabilityLoss,
    generation_planning_engine_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? GENERATION_PLANNING_READY_STATUS : null,
    generation_plans: generationPlans,
    final_verdict: pass
      ? GENERATION_PLANNING_ENGINE_PASS_VERDICT
      : GENERATION_PLANNING_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, GENERATION_PLANNING_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, GENERATION_PLANNING_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GENERATION_PLANNING_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
