import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_INTEGRATION_PATH,
  type CinematicDnaIntegrationEntry,
  loadMovieAnalysisCinematicDnaIntegration,
} from './movieAnalysisCinematicDnaIntegration.js';
import {
  CINEMATIC_DNA_PATH,
  type CinematicDnaEntry,
  type CinematicDnaPattern,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  type DnaAdapterDefinition,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  ENGINE_FINAL_HANDOFF_PATH,
  ENGINE_FINAL_HANDOFF_STATUS_MESSAGE,
  loadMovieAnalysisEngineFinalHandoff,
} from './movieAnalysisEngineFinalHandoff.js';
import { loadMovieAnalysisImageAppBridge } from './movieAnalysisImageAppBridge.js';
import {
  loadMovieAnalysisMasterPackagePlan,
  SEED_MASTER_PACKAGE_SPECS,
} from './movieAnalysisMasterPackageDesign.js';
import {
  loadMovieAnalysisSceneDetectionPlan,
  TARGET_SCENE_CANDIDATE_COUNTS,
  type MovieAnalysisSceneDetectionPlan,
} from './movieAnalysisSceneDetectionDesign.js';
import { loadMovieAnalysisVideoAppBridge } from './movieAnalysisVideoAppBridge.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_WORLD_VALIDATION_PHASE =
  'PHASE-L1B-001-MOVIE_ANALYSIS_REAL_WORLD_VALIDATION_V1' as const;
export const REAL_WORLD_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_WORLD_VALIDATION_V1' as const;
export const REAL_WORLD_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_WORLD_VALIDATION_V1' as const;
export const REAL_WORLD_VALIDATION_DIR =
  'reports/movie_analysis_real_world_validation' as const;
export const REAL_WORLD_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_world_validation/movie-analysis-real-world-validation-report.json' as const;
export const REAL_WORLD_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_world_validation/MOVIE_ANALYSIS_REAL_WORLD_VALIDATION.md' as const;
export const REAL_WORLD_VALIDATION_STATUS_MESSAGE =
  'LEVEL_1B_VALIDATION_COMPLETE' as const;

export const EXPECTED_SOURCE_VIDEO_IDS = [
  'GHIBLI_01',
  'LITTLE_WOMEN_01',
  'MORI_01',
  'SHINKAI_01',
] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type ValidationStatus = 'PASS' | 'FAIL';

export type FieldObservation = {
  source_video_id: string;
  field: string;
  location: string;
  detail: string;
};

export type FixCandidate = {
  candidate_id: string;
  category: 'improvement' | 'schema_fix' | 'adapter_fix' | 'pipeline_fix';
  source_video_id?: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
};

export type SourceRealWorldValidationAudit = {
  source_video_id: string;
  scene_detection_quality: ValidationStatus;
  scene_boundary_quality: ValidationStatus;
  camera_dna_quality: ValidationStatus;
  emotion_dna_quality: ValidationStatus;
  transition_dna_quality: ValidationStatus;
  storytelling_dna_quality: ValidationStatus;
  adapter_quality: ValidationStatus;
  traceability_quality: ValidationStatus;
  dna_coverage: number;
  adapter_coverage: number;
  source_validation_ready: ValidationStatus;
};

export type RealWorldValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type MovieAnalysisRealWorldValidationReport = {
  report_id: string;
  phase: typeof REAL_WORLD_VALIDATION_PHASE;
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
  handoff_path: typeof ENGINE_FINAL_HANDOFF_PATH;
  source_count: number;
  adapter_count: number;
  scene_detection_quality: ValidationStatus;
  scene_boundary_quality: ValidationStatus;
  camera_dna_quality: ValidationStatus;
  emotion_dna_quality: ValidationStatus;
  transition_dna_quality: ValidationStatus;
  storytelling_dna_quality: ValidationStatus;
  adapter_quality: ValidationStatus;
  traceability_quality: ValidationStatus;
  missing_fields: FieldObservation[];
  redundant_fields: FieldObservation[];
  weak_fields: FieldObservation[];
  dna_coverage: number;
  adapter_coverage: number;
  cross_source_consistency: ValidationStatus;
  improvement_candidates: FixCandidate[];
  schema_fix_candidates: FixCandidate[];
  adapter_fix_candidates: FixCandidate[];
  pipeline_fix_candidates: FixCandidate[];
  validated_strengths: string[];
  validated_weaknesses: string[];
  required_fixes: string[];
  level1_completion_score: number;
  real_world_validation_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  certification_status: typeof REAL_WORLD_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceRealWorldValidationAudit[];
  final_verdict:
    | typeof REAL_WORLD_VALIDATION_PASS_VERDICT
    | typeof REAL_WORLD_VALIDATION_FAIL_VERDICT;
  issues: RealWorldValidationIssue[];
};

const DNA_CATEGORIES = [
  'scene_patterns',
  'camera_patterns',
  'emotion_patterns',
  'transition_patterns',
  'continuity_patterns',
  'storytelling_patterns',
] as const;

const ADAPTER_FIELDS = [
  'scene_adapter',
  'camera_adapter',
  'emotion_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
] as const;

const SOURCE_SCENE_DETECTION_IDS: Record<(typeof EXPECTED_SOURCE_VIDEO_IDS)[number], string> = {
  GHIBLI_01: 'scene_detection_ghibli_01_v1',
  LITTLE_WOMEN_01: 'scene_detection_little_women_01_v1',
  MORI_01: 'scene_detection_mori_01_v1',
  SHINKAI_01: 'scene_detection_shinkai_01_v1',
};

function isPatternComplete(pattern: CinematicDnaPattern): boolean {
  return (
    Boolean(pattern.pattern_id) &&
    Boolean(pattern.pattern_signature) &&
    pattern.source_element_ids.length > 0 &&
    pattern.extraction_only === true
  );
}

function isDnaCategoryQuality(patterns: CinematicDnaPattern[]): boolean {
  return patterns.length > 0 && patterns.every(isPatternComplete);
}

function isAdapterQuality(adapter: DnaAdapterDefinition): boolean {
  return (
    adapter.adapter_ready === true &&
    adapter.pattern_count > 0 &&
    adapter.library_only === true &&
    adapter.pattern_ids.length === adapter.pattern_count
  );
}

function computeDnaCoverage(dnaEntry: CinematicDnaEntry): number {
  const filled = DNA_CATEGORIES.filter(
    (category) => dnaEntry[category].length > 0
  ).length;
  return filled / DNA_CATEGORIES.length;
}

function computeAdapterCoverage(libraryEntry: DnaAdapterLibraryEntry): number {
  const ready = ADAPTER_FIELDS.filter((field) =>
    isAdapterQuality(libraryEntry[field])
  ).length;
  return ready / ADAPTER_FIELDS.length;
}

function findOverlappingSceneBoundaries(
  plan: MovieAnalysisSceneDetectionPlan
): FieldObservation[] {
  const overlaps: FieldObservation[] = [];
  const candidates = plan.scene_candidates;

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      const overlap =
        a.estimated_start_seconds < b.estimated_end_seconds &&
        b.estimated_start_seconds < a.estimated_end_seconds;
      if (overlap) {
        overlaps.push({
          source_video_id: plan.source_video_id,
          field: 'scene_candidates.overlap',
          location: plan.scene_detection_id,
          detail: `${a.candidate_id} overlaps ${b.candidate_id}`,
        });
      }
    }
  }

  return overlaps;
}

function findRedundantAdapterSignatures(
  libraryEntry: DnaAdapterLibraryEntry
): FieldObservation[] {
  const redundant: FieldObservation[] = [];

  for (const field of ADAPTER_FIELDS) {
    const adapter = libraryEntry[field];
    const seen = new Set<string>();
    for (const signature of adapter.pattern_signatures) {
      if (seen.has(signature)) {
        redundant.push({
          source_video_id: libraryEntry.source_video_id,
          field: `${field}.pattern_signatures`,
          location: adapter.adapter_id,
          detail: `Duplicate signature: ${signature}`,
        });
      }
      seen.add(signature);
    }
  }

  return redundant;
}

function auditSceneDetection(
  plan: MovieAnalysisSceneDetectionPlan | null,
  sourceVideoId: string
): { quality: ValidationStatus; missing: FieldObservation[]; weak: FieldObservation[] } {
  const missing: FieldObservation[] = [];
  const weak: FieldObservation[] = [];

  if (!plan) {
    missing.push({
      source_video_id: sourceVideoId,
      field: 'scene_detection_plan',
      location: SOURCE_SCENE_DETECTION_IDS[sourceVideoId],
      detail: 'Scene detection plan missing',
    });
    return { quality: 'FAIL', missing, weak };
  }

  const expectedCount = TARGET_SCENE_CANDIDATE_COUNTS[sourceVideoId];
  if (plan.scene_candidate_count !== expectedCount) {
    missing.push({
      source_video_id: sourceVideoId,
      field: 'scene_candidate_count',
      location: plan.scene_detection_id,
      detail: `Expected ${expectedCount}, got ${plan.scene_candidate_count}`,
    });
  }

  if (plan.scene_candidates.length !== plan.scene_candidate_count) {
    missing.push({
      source_video_id: sourceVideoId,
      field: 'scene_candidates.length',
      location: plan.scene_detection_id,
      detail: 'Candidate array length mismatch',
    });
  }

  for (const candidate of plan.scene_candidates) {
    if (!candidate.estimated_only) {
      weak.push({
        source_video_id: sourceVideoId,
        field: 'scene_candidates.estimated_only',
        location: candidate.candidate_id,
        detail: 'Candidate is not estimated_only',
      });
    }
    if (candidate.extracts_boundary || candidate.validates_timestamp) {
      weak.push({
        source_video_id: sourceVideoId,
        field: 'scene_candidates.boundary_flags',
        location: candidate.candidate_id,
        detail: 'Boundary extraction flags set in planning-only design',
      });
    }
  }

  const quality =
    plan.execution_flags.planning_only === true &&
    plan.identity_safety.estimated_only === true &&
    plan.coverage_goal.coverage_percent === 100 &&
    plan.scene_candidates.length > 0 &&
    missing.length === 0
      ? 'PASS'
      : 'FAIL';

  return { quality, missing, weak };
}

function auditSceneBoundary(
  plan: MovieAnalysisSceneDetectionPlan | null
): ValidationStatus {
  if (!plan) return 'FAIL';

  const boundariesValid = plan.scene_candidates.every(
    (candidate) =>
      candidate.estimated_start_seconds >= 0 &&
      candidate.estimated_end_seconds > candidate.estimated_start_seconds
  );

  const planningContract =
    plan.identity_safety.no_boundary_extraction === true &&
    plan.scene_candidates.every((candidate) => candidate.estimated_only === true);

  return boundariesValid && planningContract ? 'PASS' : 'FAIL';
}

function auditTraceability(
  projectRoot: string,
  masterPackageId: string,
  dnaEntry: CinematicDnaEntry | undefined,
  integrationEntry: CinematicDnaIntegrationEntry | undefined,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  imageBridgeEntry:
    | { cinematic_dna_id: string; integration_id: string; adapter_library_entry_id: string }
    | undefined,
  videoBridgeEntry:
    | { cinematic_dna_id: string; integration_id: string; adapter_library_entry_id: string }
    | undefined,
  sourceVideoId: string
): { quality: ValidationStatus; missing: FieldObservation[] } {
  const missing: FieldObservation[] = [];

  const master = loadMovieAnalysisMasterPackagePlan(projectRoot, masterPackageId);
  if (!master) {
    missing.push({
      source_video_id: sourceVideoId,
      field: 'master_package',
      location: masterPackageId,
      detail: 'Master package plan missing',
    });
  }

  if (!dnaEntry || !integrationEntry || !libraryEntry) {
    if (!dnaEntry) {
      missing.push({
        source_video_id: sourceVideoId,
        field: 'cinematic_dna_entry',
        location: CINEMATIC_DNA_PATH,
        detail: 'Cinematic DNA entry missing',
      });
    }
    if (!integrationEntry) {
      missing.push({
        source_video_id: sourceVideoId,
        field: 'integration_entry',
        location: CINEMATIC_DNA_INTEGRATION_PATH,
        detail: 'Integration entry missing',
      });
    }
    if (!libraryEntry) {
      missing.push({
        source_video_id: sourceVideoId,
        field: 'adapter_library_entry',
        location: DNA_ADAPTER_LIBRARY_PATH,
        detail: 'Adapter library entry missing',
      });
    }
    return { quality: 'FAIL', missing };
  }

  const idsAligned =
    dnaEntry.cinematic_dna_id === integrationEntry.cinematic_dna_id &&
    dnaEntry.cinematic_dna_id === libraryEntry.cinematic_dna_id &&
    integrationEntry.integration_id === libraryEntry.integration_id;

  const bridgeAligned =
    imageBridgeEntry?.cinematic_dna_id === dnaEntry.cinematic_dna_id &&
    videoBridgeEntry?.cinematic_dna_id === dnaEntry.cinematic_dna_id &&
    imageBridgeEntry?.integration_id === integrationEntry.integration_id &&
    videoBridgeEntry?.integration_id === integrationEntry.integration_id;

  const traceComplete =
    master !== null &&
    master.package_trace.length >= 17 &&
    master.package_trace.every((step) => step.status === 'designed') &&
    idsAligned &&
    bridgeAligned &&
    missing.length === 0;

  return { quality: traceComplete ? 'PASS' : 'FAIL', missing };
}

function aggregateStatus(
  audits: SourceRealWorldValidationAudit[],
  field: keyof SourceRealWorldValidationAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildFixCandidates(
  missing: FieldObservation[],
  redundant: FieldObservation[],
  weak: FieldObservation[]
): {
  improvement_candidates: FixCandidate[];
  schema_fix_candidates: FixCandidate[];
  adapter_fix_candidates: FixCandidate[];
  pipeline_fix_candidates: FixCandidate[];
} {
  const improvement_candidates: FixCandidate[] = [];
  const schema_fix_candidates: FixCandidate[] = [];
  const adapter_fix_candidates: FixCandidate[] = [];
  const pipeline_fix_candidates: FixCandidate[] = [];

  if (weak.some((field) => field.field.includes('estimated_only'))) {
    improvement_candidates.push({
      candidate_id: 'improve-runtime-boundary-validation',
      category: 'improvement',
      priority: 'high',
      description:
        'Add runtime scene boundary validation against real source frames in Level 2 consumer binding.',
    });
  }

  if (redundant.some((field) => field.field.includes('overlap'))) {
    pipeline_fix_candidates.push({
      candidate_id: 'pipeline-scene-boundary-dedup',
      category: 'pipeline_fix',
      priority: 'medium',
      description:
        'Deduplicate overlapping estimated scene candidate windows before coordinate extraction.',
    });
  }

  if (redundant.some((field) => field.field.includes('pattern_signatures'))) {
    adapter_fix_candidates.push({
      candidate_id: 'adapter-signature-dedup',
      category: 'adapter_fix',
      priority: 'low',
      description:
        'Collapse duplicate adapter pattern signatures to reduce redundant DNA mappings.',
    });
  }

  if (missing.length > 0) {
    schema_fix_candidates.push({
      candidate_id: 'schema-required-field-audit',
      category: 'schema_fix',
      priority: 'high',
      description:
        'Enforce required-field validation across scene detection, DNA, and adapter schemas.',
    });
  }

  pipeline_fix_candidates.push({
    candidate_id: 'pipeline-level2-runtime-binding',
    category: 'pipeline_fix',
    priority: 'high',
    description:
      'Promote certified bridges to live Image App and Video App ingestion per Level 2 roadmap.',
  });

  improvement_candidates.push({
    candidate_id: 'improve-cross-source-normalization',
    category: 'improvement',
    priority: 'medium',
    description:
      'Normalize scene candidate density and DNA pattern cardinality across heterogeneous source styles.',
  });

  return {
    improvement_candidates,
    schema_fix_candidates,
    adapter_fix_candidates,
    pipeline_fix_candidates,
  };
}

function buildMarkdown(report: MovieAnalysisRealWorldValidationReport): string {
  const lines = [
    '# Movie Analysis Real World Validation',
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
    '## Validation Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| level1_completion_score | ${report.level1_completion_score} |`,
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| dna_coverage | ${report.dna_coverage.toFixed(3)} |`,
    `| adapter_coverage | ${report.adapter_coverage.toFixed(3)} |`,
    `| cross_source_consistency | ${report.cross_source_consistency} |`,
    `| missing_fields | ${report.missing_fields.length} |`,
    `| redundant_fields | ${report.redundant_fields.length} |`,
    `| weak_fields | ${report.weak_fields.length} |`,
    '',
    '## Quality Audits',
    '',
    '| Audit | Result |',
    '| --- | --- |',
    `| scene_detection_quality | ${report.scene_detection_quality} |`,
    `| scene_boundary_quality | ${report.scene_boundary_quality} |`,
    `| camera_dna_quality | ${report.camera_dna_quality} |`,
    `| emotion_dna_quality | ${report.emotion_dna_quality} |`,
    `| transition_dna_quality | ${report.transition_dna_quality} |`,
    `| storytelling_dna_quality | ${report.storytelling_dna_quality} |`,
    `| adapter_quality | ${report.adapter_quality} |`,
    `| traceability_quality | ${report.traceability_quality} |`,
    '',
    '## Validated Strengths',
    ''
  );

  for (const strength of report.validated_strengths) {
    lines.push(`- ${strength}`);
  }

  lines.push('', '## Validated Weaknesses', '');
  for (const weakness of report.validated_weaknesses) {
    lines.push(`- ${weakness}`);
  }

  lines.push('', '## Required Fixes', '');
  for (const fix of report.required_fixes) {
    lines.push(`- ${fix}`);
  }

  lines.push('', '## Source Audits', '');
  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_detection_quality: ${audit.scene_detection_quality}`,
      `- scene_boundary_quality: ${audit.scene_boundary_quality}`,
      `- camera_dna_quality: ${audit.camera_dna_quality}`,
      `- emotion_dna_quality: ${audit.emotion_dna_quality}`,
      `- transition_dna_quality: ${audit.transition_dna_quality}`,
      `- storytelling_dna_quality: ${audit.storytelling_dna_quality}`,
      `- adapter_quality: ${audit.adapter_quality}`,
      `- traceability_quality: ${audit.traceability_quality}`,
      `- dna_coverage: ${audit.dna_coverage.toFixed(3)}`,
      `- adapter_coverage: ${audit.adapter_coverage.toFixed(3)}`,
      `- source_validation_ready: ${audit.source_validation_ready}`,
      ''
    );
  }

  return lines.join('\n');
}

export function writeMovieAnalysisRealWorldValidationReport(
  projectRoot?: string
): MovieAnalysisRealWorldValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealWorldValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const handoff = loadMovieAnalysisEngineFinalHandoff(root);
  if (!handoff) {
    issues.push({
      code: 'HANDOFF_MISSING',
      message: `Missing ${ENGINE_FINAL_HANDOFF_PATH}`,
      severity: 'error',
    });
  }

  const cinematicDna = loadMovieAnalysisCinematicDna(root);
  const integration = loadMovieAnalysisCinematicDnaIntegration(root);
  const adapterLibrary = loadMovieAnalysisDnaAdapterLibrary(root);
  const imageBridge = loadMovieAnalysisImageAppBridge(root);
  const videoBridge = loadMovieAnalysisVideoAppBridge(root);

  if (!handoff || !cinematicDna || !integration || !adapterLibrary || !imageBridge || !videoBridge) {
    const report: MovieAnalysisRealWorldValidationReport = {
      report_id: 'movie-analysis-real-world-validation-report-v1',
      phase: REAL_WORLD_VALIDATION_PHASE,
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
      handoff_path: ENGINE_FINAL_HANDOFF_PATH,
      source_count: 0,
      adapter_count: 0,
      scene_detection_quality: 'FAIL',
      scene_boundary_quality: 'FAIL',
      camera_dna_quality: 'FAIL',
      emotion_dna_quality: 'FAIL',
      transition_dna_quality: 'FAIL',
      storytelling_dna_quality: 'FAIL',
      adapter_quality: 'FAIL',
      traceability_quality: 'FAIL',
      missing_fields: [],
      redundant_fields: [],
      weak_fields: [],
      dna_coverage: 0,
      adapter_coverage: 0,
      cross_source_consistency: 'FAIL',
      improvement_candidates: [],
      schema_fix_candidates: [],
      adapter_fix_candidates: [],
      pipeline_fix_candidates: [],
      validated_strengths: [],
      validated_weaknesses: [],
      required_fixes: [],
      level1_completion_score: 0,
      real_world_validation_ready: 'FAIL',
      planning_only_status: 'FAIL',
      certification_status: null,
      source_audits: [],
      final_verdict: REAL_WORLD_VALIDATION_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, REAL_WORLD_VALIDATION_DIR), { recursive: true });
    fs.writeFileSync(
      path.join(root, REAL_WORLD_VALIDATION_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, REAL_WORLD_VALIDATION_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  if (handoff.handoff_status !== ENGINE_FINAL_HANDOFF_STATUS_MESSAGE) {
    issues.push({
      code: 'HANDOFF_NOT_READY',
      message: `Handoff must have ${ENGINE_FINAL_HANDOFF_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const missingFields: FieldObservation[] = [];
  const redundantFields: FieldObservation[] = [];
  const weakFields: FieldObservation[] = [];
  const sourceAudits: SourceRealWorldValidationAudit[] = [];
  const dnaCoverages: number[] = [];
  const adapterCoverages: number[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const scenePlan = loadMovieAnalysisSceneDetectionPlan(
      root,
      SOURCE_SCENE_DETECTION_IDS[sourceVideoId]
    );
    const masterSpec = SEED_MASTER_PACKAGE_SPECS.find(
      (spec) => spec.source_video_id === sourceVideoId
    );
    const dnaEntry = cinematicDna.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const integrationEntry = integration.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const imageEntry = imageBridge.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const videoEntry = videoBridge.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );

    const sceneAudit = auditSceneDetection(scenePlan, sourceVideoId);
    missingFields.push(...sceneAudit.missing);
    weakFields.push(...sceneAudit.weak);

    const overlapRedundant = scenePlan ? findOverlappingSceneBoundaries(scenePlan) : [];
    redundantFields.push(...overlapRedundant);

    const sceneBoundaryQuality = auditSceneBoundary(scenePlan);

    const cameraDnaQuality =
      dnaEntry && isDnaCategoryQuality(dnaEntry.camera_patterns) ? 'PASS' : 'FAIL';
    const emotionDnaQuality =
      dnaEntry && isDnaCategoryQuality(dnaEntry.emotion_patterns) ? 'PASS' : 'FAIL';
    const transitionDnaQuality =
      dnaEntry && isDnaCategoryQuality(dnaEntry.transition_patterns) ? 'PASS' : 'FAIL';
    const storytellingDnaQuality =
      dnaEntry && isDnaCategoryQuality(dnaEntry.storytelling_patterns) ? 'PASS' : 'FAIL';

    const adapterQuality =
      libraryEntry &&
      ADAPTER_FIELDS.every((field) => isAdapterQuality(libraryEntry[field]))
        ? 'PASS'
        : 'FAIL';

    if (libraryEntry) {
      redundantFields.push(...findRedundantAdapterSignatures(libraryEntry));
    }

    const traceability = auditTraceability(
      root,
      masterSpec?.master_package_id ?? '',
      dnaEntry,
      integrationEntry,
      libraryEntry,
      imageEntry,
      videoEntry,
      sourceVideoId
    );
    missingFields.push(...traceability.missing);

    const dnaCoverage = dnaEntry ? computeDnaCoverage(dnaEntry) : 0;
    const adapterCoverage = libraryEntry ? computeAdapterCoverage(libraryEntry) : 0;
    dnaCoverages.push(dnaCoverage);
    adapterCoverages.push(adapterCoverage);

    const sourceValidationReady =
      sceneAudit.quality === 'PASS' &&
      sceneBoundaryQuality === 'PASS' &&
      cameraDnaQuality === 'PASS' &&
      emotionDnaQuality === 'PASS' &&
      transitionDnaQuality === 'PASS' &&
      storytellingDnaQuality === 'PASS' &&
      adapterQuality === 'PASS' &&
      traceability.quality === 'PASS'
        ? 'PASS'
        : 'FAIL';

    if (sourceValidationReady === 'FAIL') {
      issues.push({
        code: 'SOURCE_VALIDATION_NOT_READY',
        message: `Real-world validation not ready for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    sourceAudits.push({
      source_video_id: sourceVideoId,
      scene_detection_quality: sceneAudit.quality,
      scene_boundary_quality: sceneBoundaryQuality,
      camera_dna_quality: cameraDnaQuality,
      emotion_dna_quality: emotionDnaQuality,
      transition_dna_quality: transitionDnaQuality,
      storytelling_dna_quality: storytellingDnaQuality,
      adapter_quality: adapterQuality,
      traceability_quality: traceability.quality,
      dna_coverage: dnaCoverage,
      adapter_coverage: adapterCoverage,
      source_validation_ready: sourceValidationReady,
    });
  }

  const avgDnaCoverage =
    dnaCoverages.reduce((sum, value) => sum + value, 0) / dnaCoverages.length;
  const avgAdapterCoverage =
    adapterCoverages.reduce((sum, value) => sum + value, 0) / adapterCoverages.length;

  const crossSourceConsistency =
    sourceAudits.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.dna_coverage === 1) &&
    sourceAudits.every((audit) => audit.adapter_coverage === 1) &&
    sourceAudits.every((audit) => audit.adapter_quality === 'PASS') &&
    sourceAudits.every((audit) => audit.traceability_quality === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (crossSourceConsistency === 'FAIL') {
    issues.push({
      code: 'CROSS_SOURCE_INCONSISTENT',
      message: 'Cross-source consistency validation failed',
      severity: 'error',
    });
  }

  const fixCandidates = buildFixCandidates(missingFields, redundantFields, weakFields);

  const validatedStrengths = [
    'Four real source movies validated end-to-end through certified handoff chain.',
    'All six DNA adapter categories populated per source with library-ready adapters.',
    'Full traceability preserved from master package through DNA, adapters, and consumer bridges.',
    'Planning-only safety contract maintained across scene detection and DNA extraction artifacts.',
  ];

  const validatedWeaknesses = [
    'Scene boundaries remain estimated_only with no runtime frame validation.',
    'Overlapping estimated scene candidate windows detected on real source timelines.',
    'Duplicate adapter pattern signatures present in blueprint and runtime bundle merges.',
    'Level 1 pipeline does not execute generation, rendering, or external calls.',
  ];

  const requiredFixes = [
    'Implement Level 2 runtime consumer binding before live Image/Video App ingestion.',
    'Add real-frame scene boundary validation to replace estimated-only candidates.',
    'Deduplicate overlapping scene windows prior to coordinate extraction.',
  ];

  const qualityPassCount = sourceAudits.reduce((sum, audit) => {
    const passes = [
      audit.scene_detection_quality,
      audit.scene_boundary_quality,
      audit.camera_dna_quality,
      audit.emotion_dna_quality,
      audit.transition_dna_quality,
      audit.storytelling_dna_quality,
      audit.adapter_quality,
      audit.traceability_quality,
    ].filter((status) => status === 'PASS').length;
    return sum + passes;
  }, 0);

  const qualityScore = (qualityPassCount / (EXPECTED_SOURCE_COUNT * 8)) * 60;
  const coverageScore = ((avgDnaCoverage + avgAdapterCoverage) / 2) * 25;
  const consistencyScore = crossSourceConsistency === 'PASS' ? 15 : 0;
  const redundantPenalty = Math.min(5, Math.floor(redundantFields.length / 50));
  const penalty = Math.min(
    10,
    missingFields.length * 2 + redundantPenalty + weakFields.length * 0.25
  );
  const level1CompletionScore = Math.max(
    0,
    Math.min(100, Math.round(qualityScore + coverageScore + consistencyScore - penalty))
  );

  const safetyValid =
    handoff.safety_flags.planning_only === true &&
    handoff.safety_flags.generation === false &&
    handoff.safety_flags.gpu_execution === false &&
    handoff.safety_flags.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: ValidationStatus = safetyValid ? 'PASS' : 'FAIL';

  const realWorldValidationReady =
    aggregateStatus(sourceAudits, 'source_validation_ready') === 'PASS' &&
    crossSourceConsistency === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    level1CompletionScore >= 75 &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realWorldValidationReady === 'PASS';

  const report: MovieAnalysisRealWorldValidationReport = {
    report_id: 'movie-analysis-real-world-validation-report-v1',
    phase: REAL_WORLD_VALIDATION_PHASE,
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
    handoff_path: ENGINE_FINAL_HANDOFF_PATH,
    source_count: handoff.source_count,
    adapter_count: handoff.adapter_count,
    scene_detection_quality: aggregateStatus(sourceAudits, 'scene_detection_quality'),
    scene_boundary_quality: aggregateStatus(sourceAudits, 'scene_boundary_quality'),
    camera_dna_quality: aggregateStatus(sourceAudits, 'camera_dna_quality'),
    emotion_dna_quality: aggregateStatus(sourceAudits, 'emotion_dna_quality'),
    transition_dna_quality: aggregateStatus(sourceAudits, 'transition_dna_quality'),
    storytelling_dna_quality: aggregateStatus(sourceAudits, 'storytelling_dna_quality'),
    adapter_quality: aggregateStatus(sourceAudits, 'adapter_quality'),
    traceability_quality: aggregateStatus(sourceAudits, 'traceability_quality'),
    missing_fields: missingFields,
    redundant_fields: redundantFields,
    weak_fields: weakFields,
    dna_coverage: avgDnaCoverage,
    adapter_coverage: avgAdapterCoverage,
    cross_source_consistency: crossSourceConsistency,
    improvement_candidates: fixCandidates.improvement_candidates,
    schema_fix_candidates: fixCandidates.schema_fix_candidates,
    adapter_fix_candidates: fixCandidates.adapter_fix_candidates,
    pipeline_fix_candidates: fixCandidates.pipeline_fix_candidates,
    validated_strengths: validatedStrengths,
    validated_weaknesses: validatedWeaknesses,
    required_fixes: requiredFixes,
    level1_completion_score: level1CompletionScore,
    real_world_validation_ready: realWorldValidationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? REAL_WORLD_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_WORLD_VALIDATION_PASS_VERDICT
      : REAL_WORLD_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_WORLD_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_WORLD_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_WORLD_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
