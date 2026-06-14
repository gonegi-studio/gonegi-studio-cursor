import fs from 'node:fs';
import path from 'node:path';
import {
  CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisCrossAppConsumptionCertification.js';
import { DNA_ADAPTER_CERTIFICATION_PASS_VERDICT, DNA_ADAPTER_CERTIFICATION_REPORT_PATH } from './movieAnalysisDnaAdapterCertification.js';
import { DNA_ARCHIVE_AUDIT_PASS_VERDICT, DNA_ARCHIVE_AUDIT_REPORT_PATH } from './movieAnalysisDnaArchiveAudit.js';
import { DNA_ARCHIVE_PASS_VERDICT, DNA_ARCHIVE_REPORT_PATH } from './movieAnalysisDnaArchive.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  CHARACTER_REENTRY_VALIDATION_PASS_VERDICT,
  CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
} from './movieAnalysisCharacterReentryValidation.js';
import {
  LOCATION_REENTRY_VALIDATION_PASS_VERDICT,
  LOCATION_REENTRY_VALIDATION_REPORT_PATH,
} from './movieAnalysisLocationReentryValidation.js';
import {
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisLevel2EProductionScaleCertification.js';
import {
  LEVEL2_COMPLETE_STATUS,
  LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
} from './movieAnalysisLevel2MasterCertificationV3.js';
import {
  MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisMultiEpisodeConsistencyValidation.js';
import {
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisProductionBatchConsistencyValidation.js';
import {
  PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT,
  PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
} from './movieAnalysisProductionMemoryStressTest.js';
import {
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import {
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
  REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisRealVideoMasterCertification.js';
import {
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import {
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import {
  CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
  CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
  CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisCharacterEvolutionValidation.js';
import {
  MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
  MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
  MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisMultiSeasonContinuityValidation.js';
import {
  RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
  RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
  RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRelationshipEvolutionValidation.js';
import {
  RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
  RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
  RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRuntimeScalabilityValidation.js';
import {
  STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
  STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisStoryArcConsistencyValidation.js';
import {
  WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
  WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
  WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisWorldStateMemoryValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2_COMPLETENESS_AUDIT_PHASE =
  'PHASE-LEVEL2-GAP-AUDIT-001-LEVEL2_COMPLETENESS_AUDIT_V1' as const;
export const LEVEL2_COMPLETENESS_RECHECK_PHASE =
  'PHASE-LEVEL2-GAP-AUDIT-002-LEVEL2_COMPLETENESS_RECHECK_V1' as const;
export const LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2_COMPLETENESS_AUDIT_V1' as const;
export const LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT =
  'PASS_WITH_GAPS_MOVIE_ANALYSIS_LEVEL2_COMPLETENESS_AUDIT_V1' as const;
export const LEVEL2_COMPLETENESS_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2_COMPLETENESS_AUDIT_V1' as const;
export const LEVEL2_COMPLETE_FINAL_STATUS = 'LEVEL2_COMPLETE_FINAL' as const;
export const LEVEL2_COMPLETENESS_AUDIT_DIR =
  'reports/movie_analysis_level2_gap_audit' as const;
export const LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH =
  'reports/movie_analysis_level2_gap_audit/movie-analysis-level2-completeness-audit-report.json' as const;
export const LEVEL2_COMPLETENESS_AUDIT_MD_PATH =
  'reports/movie_analysis_level2_gap_audit/MOVIE_ANALYSIS_LEVEL2_COMPLETENESS_AUDIT.md' as const;
export const LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR =
  'exports/movie_analysis_level2_gap_audit' as const;
export const LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH =
  'exports/movie_analysis_level2_gap_audit/movie-analysis-level2-completeness-audit-manifest.json' as const;

export const LEVEL2_GAP_AUDIT_COUNT = 7 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type AuditStatus = 'PASS' | 'GAP';

export type Level2CompletenessAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  audit_id?: string;
  check_id?: string;
};

export type Level2GapCheckResult = {
  check_id: string;
  check_label: string;
  status: AuditStatus;
  covered: boolean;
  evidence_report_path: string | null;
  gap_reason: string | null;
};

export type Level2GapAuditResult = {
  audit_id: string;
  gap_category: string;
  gap_label: string;
  has_gap: boolean;
  checks: Level2GapCheckResult[];
};

export type MovieAnalysisLevel2CompletenessAuditManifest = {
  manifest_id: string;
  phase: typeof LEVEL2_COMPLETENESS_AUDIT_PHASE;
  generated_at: string;
  level2_gap_audit_count: typeof LEVEL2_GAP_AUDIT_COUNT;
  gap_count: number;
  gaps: string[];
  level3_entry_ready: boolean;
  gap_audits: Level2GapAuditResult[];
  certification_status: typeof LEVEL2_COMPLETE_FINAL_STATUS | null;
};

export type MovieAnalysisLevel2CompletenessAuditReport = {
  report_id: string;
  phase: typeof LEVEL2_COMPLETENESS_AUDIT_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: true;
  image_generation: true;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  level2_completeness_audit_export_dir: typeof LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR;
  level2_completeness_audit_manifest_path: typeof LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH;
  level2_master_certification_v3_report_path: typeof LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  level2_gap_audit_count: typeof LEVEL2_GAP_AUDIT_COUNT;
  gap_count: number;
  gaps: string[];
  level3_entry_ready: boolean;
  level2_complete_claim_validated: boolean;
  audit_failure: boolean;
  level2_completeness_audit_ready: AuditStatus;
  certification_status: typeof LEVEL2_COMPLETE_FINAL_STATUS | null;
  gap_audits: Level2GapAuditResult[];
  final_verdict:
    | typeof LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT
    | typeof LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT
    | typeof LEVEL2_COMPLETENESS_AUDIT_FAIL_VERDICT;
  issues: Level2CompletenessAuditIssue[];
};

type EvidenceContext = {
  characterReentry: Record<string, unknown> | null;
  locationReentry: Record<string, unknown> | null;
  multiEpisode: Record<string, unknown> | null;
  storyArc: Record<string, unknown> | null;
  productionBatch: Record<string, unknown> | null;
  productionMemory: Record<string, unknown> | null;
  l2eProductionScale: Record<string, unknown> | null;
  v3Master: Record<string, unknown> | null;
  realVideoMaster: Record<string, unknown> | null;
  videoIdentity: Record<string, unknown> | null;
  videoLocation: Record<string, unknown> | null;
  videoStyle: Record<string, unknown> | null;
  videoMotion: Record<string, unknown> | null;
  dnaAdapter: Record<string, unknown> | null;
  dnaArchive: Record<string, unknown> | null;
  dnaArchiveAudit: Record<string, unknown> | null;
  crossApp: Record<string, unknown> | null;
};

type RecheckEvidenceContext = EvidenceContext & {
  characterEvolution: Record<string, unknown> | null;
  relationshipEvolution: Record<string, unknown> | null;
  worldStateMemory: Record<string, unknown> | null;
  multiSeasonContinuity: Record<string, unknown> | null;
  runtimeScalability: Record<string, unknown> | null;
};

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function reportPassed(
  report: Record<string, unknown> | null,
  passVerdict: string,
  readyField?: string
): boolean {
  if (!report) return false;
  if (report.final_verdict !== passVerdict) return false;
  if (readyField && report[readyField] !== 'PASS') return false;
  return true;
}

function fieldPass(report: Record<string, unknown> | null, field: string): boolean {
  return report?.[field] === 'PASS';
}

function coveredCheck(
  checkId: string,
  checkLabel: string,
  covered: boolean,
  evidenceReportPath: string | null,
  gapReason: string | null
): Level2GapCheckResult {
  return {
    check_id: checkId,
    check_label: checkLabel,
    status: covered ? 'PASS' : 'GAP',
    covered,
    evidence_report_path: evidenceReportPath,
    gap_reason: covered ? null : gapReason,
  };
}

function buildEvidenceContext(root: string): EvidenceContext {
  return {
    characterReentry: loadReport(root, CHARACTER_REENTRY_VALIDATION_REPORT_PATH),
    locationReentry: loadReport(root, LOCATION_REENTRY_VALIDATION_REPORT_PATH),
    multiEpisode: loadReport(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH),
    storyArc: loadReport(root, STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH),
    productionBatch: loadReport(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH),
    productionMemory: loadReport(root, PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH),
    l2eProductionScale: loadReport(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH),
    v3Master: loadReport(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH),
    realVideoMaster: loadReport(root, REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH),
    videoIdentity: loadReport(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH),
    videoLocation: loadReport(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH),
    videoStyle: loadReport(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH),
    videoMotion: loadReport(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH),
    dnaAdapter: loadReport(root, DNA_ADAPTER_CERTIFICATION_REPORT_PATH),
    dnaArchive: loadReport(root, DNA_ARCHIVE_REPORT_PATH),
    dnaArchiveAudit: loadReport(root, DNA_ARCHIVE_AUDIT_REPORT_PATH),
    crossApp: loadReport(root, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH),
  };
}

function buildRecheckEvidenceContext(root: string): RecheckEvidenceContext {
  return {
    ...buildEvidenceContext(root),
    characterEvolution: loadReport(root, CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH),
    relationshipEvolution: loadReport(root, RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH),
    worldStateMemory: loadReport(root, WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH),
    multiSeasonContinuity: loadReport(root, MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH),
    runtimeScalability: loadReport(root, RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH),
  };
}

function l2gReportPassed(
  report: Record<string, unknown> | null,
  passVerdict: string,
  statusMessage: string,
  readyField: string
): boolean {
  if (!report) return false;
  return (
    report.final_verdict === passVerdict &&
    report.certification_status === statusMessage &&
    report[readyField] === 'PASS'
  );
}

function auditCharacterEvolutionGapRecheck(ctx: RecheckEvidenceContext): Level2GapAuditResult {
  const characterEvolutionPassed = l2gReportPassed(
    ctx.characterEvolution,
    CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
    CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
    'character_evolution_validation_ready'
  );

  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'identity_persistence',
      'identity persistence',
      characterEvolutionPassed &&
        fieldPass(ctx.characterEvolution, 'character_identity_preserved') &&
        fieldPass(ctx.characterEvolution, 'growth_memory_preserved'),
      CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
      'Character identity persistence is not certified by L2G-001'
    ),
    coveredCheck(
      'age_progression_readiness',
      'age progression readiness',
      characterEvolutionPassed && fieldPass(ctx.characterEvolution, 'age_progression_valid'),
      CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
      'Age progression readiness is not certified by L2G-001'
    ),
    coveredCheck(
      'costume_evolution_readiness',
      'costume evolution readiness',
      characterEvolutionPassed && fieldPass(ctx.characterEvolution, 'costume_evolution_valid'),
      CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
      'Costume evolution readiness is not certified by L2G-001'
    ),
    coveredCheck(
      'personality_evolution_readiness',
      'personality evolution readiness',
      characterEvolutionPassed && fieldPass(ctx.characterEvolution, 'personality_evolution_valid'),
      CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
      'Personality evolution readiness is not certified by L2G-001'
    ),
  ];

  return {
    audit_id: 'AUDIT-01',
    gap_category: 'CHARACTER_EVOLUTION_GAP',
    gap_label: 'Character Evolution',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditRelationshipEvolutionGapRecheck(ctx: RecheckEvidenceContext): Level2GapAuditResult {
  const relationshipEvolutionPassed = l2gReportPassed(
    ctx.relationshipEvolution,
    RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
    RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
    'relationship_evolution_validation_ready'
  );

  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'friendship',
      'friendship',
      relationshipEvolutionPassed && fieldPass(ctx.relationshipEvolution, 'friendship_progression'),
      RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
      'Friendship arc validation is not certified by L2G-002'
    ),
    coveredCheck(
      'conflict',
      'conflict',
      relationshipEvolutionPassed && fieldPass(ctx.relationshipEvolution, 'conflict_resolution_valid'),
      RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
      'Conflict-stage relationship progression is not certified by L2G-002'
    ),
    coveredCheck(
      'reconciliation',
      'reconciliation',
      relationshipEvolutionPassed && fieldPass(ctx.relationshipEvolution, 'cross_episode_callback_valid'),
      RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
      'Reconciliation and resolution callback are not certified by L2G-002'
    ),
    coveredCheck(
      'romance',
      'romance',
      relationshipEvolutionPassed && fieldPass(ctx.relationshipEvolution, 'romance_progression'),
      RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
      'Romance relationship evolution is not certified by L2G-002'
    ),
    coveredCheck(
      'family_bonds',
      'family bonds',
      relationshipEvolutionPassed && fieldPass(ctx.relationshipEvolution, 'family_bond_progression'),
      RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
      'Family bond evolution is not certified by L2G-002'
    ),
    coveredCheck(
      'long_term_change_support',
      'long-term change support',
      relationshipEvolutionPassed && fieldPass(ctx.relationshipEvolution, 'relationship_progression_valid'),
      RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
      'Long-term relationship change support is not certified by L2G-002'
    ),
  ];

  return {
    audit_id: 'AUDIT-02',
    gap_category: 'RELATIONSHIP_EVOLUTION_GAP',
    gap_label: 'Relationship Evolution',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditWorldStateMemoryGapRecheck(ctx: RecheckEvidenceContext): Level2GapAuditResult {
  const worldStateMemoryPassed = l2gReportPassed(
    ctx.worldStateMemory,
    WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
    WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
    'world_state_memory_validation_ready'
  );

  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'location_change_persistence',
      'location change persistence',
      worldStateMemoryPassed && fieldPass(ctx.worldStateMemory, 'world_event_persistence'),
      WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
      'Location change persistence is not certified by L2G-003'
    ),
    coveredCheck(
      'environment_event_persistence',
      'environment event persistence',
      worldStateMemoryPassed && fieldPass(ctx.worldStateMemory, 'environment_change_memory'),
      WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
      'Environment event persistence is not certified by L2G-003'
    ),
    coveredCheck(
      'world_history_persistence',
      'world history persistence',
      worldStateMemoryPassed && fieldPass(ctx.worldStateMemory, 'historical_memory_preserved'),
      WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
      'World history persistence is not certified by L2G-003'
    ),
    coveredCheck(
      'callback_persistence',
      'callback persistence',
      worldStateMemoryPassed && fieldPass(ctx.worldStateMemory, 'cross_episode_world_callback_valid'),
      WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
      'Cross-episode world callback persistence is not certified by L2G-003'
    ),
  ];

  return {
    audit_id: 'AUDIT-03',
    gap_category: 'WORLD_STATE_MEMORY_GAP',
    gap_label: 'World State Memory',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditLongFormNarrativeGapRecheck(ctx: RecheckEvidenceContext): Level2GapAuditResult {
  const multiEpisodePassed = reportPassed(
    ctx.multiEpisode,
    MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'multi_episode_consistency_validation_ready'
  );
  const storyArcPassed = reportPassed(
    ctx.storyArc,
    STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'story_arc_consistency_validation_ready'
  );
  const multiSeasonPassed = l2gReportPassed(
    ctx.multiSeasonContinuity,
    MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
    MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
    'multi_season_continuity_validation_ready'
  );

  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'multi_episode',
      'multi episode',
      multiEpisodePassed && fieldPass(ctx.multiEpisode, 'episode_to_episode_consistency'),
      MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Multi-episode narrative validation is not certified'
    ),
    coveredCheck(
      'multi_season',
      'multi season',
      multiSeasonPassed && fieldPass(ctx.multiSeasonContinuity, 'season_to_season_consistency'),
      MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
      'Multi-season narrative continuity is not certified by L2G-004'
    ),
    coveredCheck(
      'callback_chains',
      'callback chains',
      multiSeasonPassed &&
        multiEpisodePassed &&
        fieldPass(ctx.multiSeasonContinuity, 'long_term_callback'),
      MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
      'Callback chain validation is not certified by L2G-004'
    ),
    coveredCheck(
      'story_continuity',
      'story continuity',
      multiSeasonPassed &&
        storyArcPassed &&
        fieldPass(ctx.multiSeasonContinuity, 'series_arc_continuity') &&
        fieldPass(ctx.storyArc, 'story_progression_consistency'),
      MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
      'Story continuity validation is not certified by L2G-004'
    ),
  ];

  return {
    audit_id: 'AUDIT-04',
    gap_category: 'LONG_FORM_NARRATIVE_GAP',
    gap_label: 'Long Form Narrative',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditProductionScaleGapRecheck(ctx: RecheckEvidenceContext): Level2GapAuditResult {
  const runtimeScalabilityPassed = l2gReportPassed(
    ctx.runtimeScalability,
    RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
    RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
    'runtime_scalability_validation_ready'
  );

  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'batch_validation',
      'batch validation',
      reportPassed(
        ctx.productionBatch,
        PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'production_batch_consistency_validation_ready'
      ),
      PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Production batch validation is not certified'
    ),
    coveredCheck(
      'memory_stress',
      'memory stress',
      reportPassed(
        ctx.productionMemory,
        PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT,
        'production_memory_stress_test_ready'
      ),
      PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
      'Production memory stress validation is not certified'
    ),
    coveredCheck(
      'traceability',
      'traceability',
      reportPassed(
        ctx.l2eProductionScale,
        LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
        'level2e_production_scale_certification_ready'
      ) &&
        fieldPass(ctx.l2eProductionScale, 'traceability_preserved') &&
        fieldPass(ctx.v3Master, 'pipeline_traceability_preserved'),
      LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
      'Production-scale traceability is not certified'
    ),
    coveredCheck(
      'runtime_scalability',
      'runtime scalability',
      runtimeScalabilityPassed && fieldPass(ctx.runtimeScalability, 'runtime_scalability'),
      RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
      'Runtime scalability is not certified by L2G-005'
    ),
  ];

  return {
    audit_id: 'AUDIT-05',
    gap_category: 'PRODUCTION_SCALE_GAP',
    gap_label: 'Production Scale',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditCharacterEvolutionGap(ctx: EvidenceContext): Level2GapAuditResult {
  const characterReentryPassed = reportPassed(
    ctx.characterReentry,
    CHARACTER_REENTRY_VALIDATION_PASS_VERDICT,
    'character_reentry_validation_ready'
  );

  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'identity_persistence',
      'identity persistence',
      characterReentryPassed &&
        fieldPass(ctx.characterReentry, 'face_identity') &&
        fieldPass(ctx.characterReentry, 'hair_identity') &&
        fieldPass(ctx.characterReentry, 'identity_memory_preserved'),
      CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
      'Character identity persistence is not certified'
    ),
    coveredCheck(
      'age_progression_readiness',
      'age progression readiness',
      false,
      null,
      'No validation phase exists for age progression readiness'
    ),
    coveredCheck(
      'costume_evolution_readiness',
      'costume evolution readiness',
      false,
      null,
      'Only costume reentry persistence is validated; costume evolution readiness has no dedicated phase'
    ),
    coveredCheck(
      'personality_evolution_readiness',
      'personality evolution readiness',
      false,
      null,
      'No validation phase exists for personality evolution readiness'
    ),
  ];

  return {
    audit_id: 'AUDIT-01',
    gap_category: 'CHARACTER_EVOLUTION_GAP',
    gap_label: 'Character Evolution',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditRelationshipEvolutionGap(ctx: EvidenceContext): Level2GapAuditResult {
  const multiEpisodePassed = reportPassed(
    ctx.multiEpisode,
    MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'multi_episode_consistency_validation_ready'
  );

  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'friendship',
      'friendship',
      false,
      null,
      'No dedicated friendship arc validation; only generic relationship stages exist'
    ),
    coveredCheck(
      'conflict',
      'conflict',
      multiEpisodePassed &&
        fieldPass(ctx.multiEpisode, 'relationship_progression_preservation') &&
        !((ctx.multiEpisode?.relationship_regression as boolean) ?? true),
      MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Conflict-stage relationship progression is not certified'
    ),
    coveredCheck(
      'reconciliation',
      'reconciliation',
      multiEpisodePassed &&
        fieldPass(ctx.multiEpisode, 'cross_episode_callback') &&
        !((ctx.multiEpisode?.callback_failure as boolean) ?? true),
      MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Reconciliation and resolution callback are not certified'
    ),
    coveredCheck(
      'romance',
      'romance',
      false,
      null,
      'No validation phase exists for romance relationship evolution'
    ),
    coveredCheck(
      'family_bonds',
      'family bonds',
      false,
      null,
      'No validation phase exists for family bond evolution'
    ),
    coveredCheck(
      'long_term_change_support',
      'long-term change support',
      multiEpisodePassed && fieldPass(ctx.multiEpisode, 'relationship_progression_preservation'),
      MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Long-term relationship change support is not certified'
    ),
  ];

  return {
    audit_id: 'AUDIT-02',
    gap_category: 'RELATIONSHIP_EVOLUTION_GAP',
    gap_label: 'Relationship Evolution',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditWorldStateMemoryGap(ctx: EvidenceContext): Level2GapAuditResult {
  const locationReentryPassed = reportPassed(
    ctx.locationReentry,
    LOCATION_REENTRY_VALIDATION_PASS_VERDICT,
    'location_reentry_validation_ready'
  );

  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'location_change_persistence',
      'location change persistence',
      locationReentryPassed && fieldPass(ctx.locationReentry, 'location_memory_preserved'),
      LOCATION_REENTRY_VALIDATION_REPORT_PATH,
      'Location change persistence is not certified'
    ),
    coveredCheck(
      'environment_event_persistence',
      'environment event persistence',
      false,
      null,
      'No validation phase exists for environment event persistence'
    ),
    coveredCheck(
      'world_history_persistence',
      'world history persistence',
      false,
      null,
      'No validation phase exists for world history persistence'
    ),
    coveredCheck(
      'callback_persistence',
      'callback persistence',
      reportPassed(
        ctx.multiEpisode,
        MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'multi_episode_consistency_validation_ready'
      ) && fieldPass(ctx.multiEpisode, 'cross_episode_callback'),
      MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Cross-episode callback persistence is not certified'
    ),
  ];

  return {
    audit_id: 'AUDIT-03',
    gap_category: 'WORLD_STATE_MEMORY_GAP',
    gap_label: 'World State Memory',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditLongFormNarrativeGap(ctx: EvidenceContext): Level2GapAuditResult {
  const multiEpisodePassed = reportPassed(
    ctx.multiEpisode,
    MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'multi_episode_consistency_validation_ready'
  );
  const storyArcPassed = reportPassed(
    ctx.storyArc,
    STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
    'story_arc_consistency_validation_ready'
  );

  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'multi_episode',
      'multi episode',
      multiEpisodePassed && fieldPass(ctx.multiEpisode, 'episode_to_episode_consistency'),
      MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Multi-episode narrative validation is not certified'
    ),
    coveredCheck(
      'multi_season',
      'multi season',
      false,
      null,
      'No validation phase exists for multi-season narrative continuity'
    ),
    coveredCheck(
      'callback_chains',
      'callback chains',
      multiEpisodePassed &&
        storyArcPassed &&
        fieldPass(ctx.multiEpisode, 'cross_episode_callback'),
      MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Callback chain validation is not certified'
    ),
    coveredCheck(
      'story_continuity',
      'story continuity',
      multiEpisodePassed &&
        storyArcPassed &&
        fieldPass(ctx.multiEpisode, 'series_continuity') &&
        fieldPass(ctx.storyArc, 'story_progression_consistency') &&
        fieldPass(ctx.storyArc, 'callback_memory_consistency'),
      STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Story continuity validation is not certified'
    ),
  ];

  return {
    audit_id: 'AUDIT-04',
    gap_category: 'LONG_FORM_NARRATIVE_GAP',
    gap_label: 'Long Form Narrative',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditProductionScaleGap(ctx: EvidenceContext): Level2GapAuditResult {
  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'batch_validation',
      'batch validation',
      reportPassed(
        ctx.productionBatch,
        PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'production_batch_consistency_validation_ready'
      ),
      PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Production batch validation is not certified'
    ),
    coveredCheck(
      'memory_stress',
      'memory stress',
      reportPassed(
        ctx.productionMemory,
        PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT,
        'production_memory_stress_test_ready'
      ),
      PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
      'Production memory stress validation is not certified'
    ),
    coveredCheck(
      'traceability',
      'traceability',
      reportPassed(
        ctx.l2eProductionScale,
        LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
        'level2e_production_scale_certification_ready'
      ) &&
        fieldPass(ctx.l2eProductionScale, 'traceability_preserved') &&
        fieldPass(ctx.v3Master, 'pipeline_traceability_preserved'),
      LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
      'Production-scale traceability is not certified'
    ),
    coveredCheck(
      'runtime_scalability',
      'runtime scalability',
      false,
      null,
      'No validation phase exists for runtime scalability under production load'
    ),
  ];

  return {
    audit_id: 'AUDIT-05',
    gap_category: 'PRODUCTION_SCALE_GAP',
    gap_label: 'Production Scale',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditVideoPipelineGap(ctx: EvidenceContext): Level2GapAuditResult {
  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'identity',
      'identity',
      reportPassed(
        ctx.videoIdentity,
        REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'real_video_identity_consistency_validation_ready'
      ),
      REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Real video identity validation is not certified'
    ),
    coveredCheck(
      'location',
      'location',
      reportPassed(
        ctx.videoLocation,
        REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'real_video_location_consistency_validation_ready'
      ),
      REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Real video location validation is not certified'
    ),
    coveredCheck(
      'style',
      'style',
      reportPassed(
        ctx.videoStyle,
        REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'real_video_style_consistency_validation_ready'
      ),
      REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Real video style validation is not certified'
    ),
    coveredCheck(
      'motion',
      'motion',
      reportPassed(
        ctx.videoMotion,
        REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'real_video_motion_consistency_validation_ready'
      ),
      REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
      'Real video motion validation is not certified'
    ),
    coveredCheck(
      'video_certification',
      'video certification',
      reportPassed(
        ctx.realVideoMaster,
        REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
        'real_video_master_certification_ready'
      ) && fieldPass(ctx.realVideoMaster, 'l2f_tracks_complete'),
      REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
      'Real video master certification is not complete'
    ),
  ];

  return {
    audit_id: 'AUDIT-06',
    gap_category: 'VIDEO_PIPELINE_GAP',
    gap_label: 'Video Pipeline',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function auditDatasetEcosystemGap(ctx: EvidenceContext): Level2GapAuditResult {
  const checks: Level2GapCheckResult[] = [
    coveredCheck(
      'dna',
      'DNA',
      reportPassed(ctx.dnaAdapter, DNA_ADAPTER_CERTIFICATION_PASS_VERDICT) &&
        reportPassed(ctx.dnaArchive, DNA_ARCHIVE_PASS_VERDICT),
      DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
      'DNA packaging and certification chain is not complete'
    ),
    coveredCheck(
      'adapter',
      'Adapter',
      reportPassed(ctx.dnaAdapter, DNA_ADAPTER_CERTIFICATION_PASS_VERDICT),
      DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
      'Adapter certification is not complete'
    ),
    coveredCheck(
      'archive',
      'Archive',
      reportPassed(ctx.dnaArchive, DNA_ARCHIVE_PASS_VERDICT) &&
        reportPassed(ctx.dnaArchiveAudit, DNA_ARCHIVE_AUDIT_PASS_VERDICT),
      DNA_ARCHIVE_AUDIT_REPORT_PATH,
      'DNA archive audit is not complete'
    ),
    coveredCheck(
      'traceability',
      'Traceability',
      fieldPass(ctx.v3Master, 'dna_traceability_preserved') &&
        fieldPass(ctx.v3Master, 'adapter_traceability_preserved') &&
        fieldPass(ctx.v3Master, 'pipeline_traceability_preserved'),
      LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
      'Level2 traceability chain is not preserved'
    ),
    coveredCheck(
      'cross_linkage',
      'Cross linkage',
      reportPassed(
        ctx.crossApp,
        CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
        'cross_app_consumption_certification_ready'
      ) && fieldPass(ctx.v3Master, 'cross_track_consistency'),
      CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
      'Cross-app and cross-track linkage is not certified'
    ),
  ];

  return {
    audit_id: 'AUDIT-07',
    gap_category: 'DATASET_ECOSYSTEM_GAP',
    gap_label: 'Dataset Ecosystem',
    has_gap: checks.some((check) => check.status === 'GAP'),
    checks,
  };
}

function buildMarkdown(report: MovieAnalysisLevel2CompletenessAuditReport): string {
  const lines = [
    '# Movie Analysis Level 2 Completeness Audit',
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
    '## Goal',
    '',
    'Validate LEVEL2_COMPLETE claim, detect remaining gaps, and judge Level3 entry readiness.',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| gap_count | ${report.gap_count} |`,
    `| level3_entry_ready | ${report.level3_entry_ready} |`,
    `| level2_complete_claim_validated | ${report.level2_complete_claim_validated} |`,
    `| level2_completeness_audit_ready | ${report.level2_completeness_audit_ready} |`,
    '',
    '## Detected Gaps',
    ''
  );

  if (report.gaps.length === 0) {
    lines.push('- none', '');
  } else {
    report.gaps.forEach((gap, index) => {
      lines.push(`${index + 1}. ${gap}`);
    });
    lines.push('');
  }

  for (const audit of report.gap_audits) {
    lines.push(`## ${audit.audit_id} ${audit.gap_label}`, '');
    lines.push(`- gap_category: ${audit.gap_category}`);
    lines.push(`- has_gap: ${audit.has_gap}`, '');
    for (const check of audit.checks) {
      lines.push(
        `- ${check.check_id}: ${check.status} covered=${check.covered} evidence=${check.evidence_report_path ?? 'none'}${check.gap_reason ? ` reason=${check.gap_reason}` : ''}`
      );
    }
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

export function writeMovieAnalysisLevel2CompletenessAudit(
  projectRoot?: string
): MovieAnalysisLevel2CompletenessAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2CompletenessAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const v3Master = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    level2_master_certification_v3_ready: string;
    source_count: number;
    adapter_count: number;
  }>(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH);

  if (!v3Master) {
    issues.push({
      code: 'PRECHECK_MISSING',
      message: `Missing ${LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    v3Master.final_verdict !== LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT ||
    v3Master.certification_status !== LEVEL2_COMPLETE_STATUS ||
    v3Master.level2_master_certification_v3_ready !== 'PASS'
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: 'Level2 master certification V3 must be PASS with LEVEL2_COMPLETE status',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const ctx = buildEvidenceContext(root);
  const gapAudits: Level2GapAuditResult[] = [
    auditCharacterEvolutionGap(ctx),
    auditRelationshipEvolutionGap(ctx),
    auditWorldStateMemoryGap(ctx),
    auditLongFormNarrativeGap(ctx),
    auditProductionScaleGap(ctx),
    auditVideoPipelineGap(ctx),
    auditDatasetEcosystemGap(ctx),
  ];

  if (gapAudits.length !== LEVEL2_GAP_AUDIT_COUNT) {
    issues.push({
      code: 'AUDIT_FAILURE',
      message: `Expected ${LEVEL2_GAP_AUDIT_COUNT} gap audits`,
      severity: 'error',
    });
  }

  const gaps = gapAudits.filter((audit) => audit.has_gap).map((audit) => audit.gap_label);
  const gapCount = gaps.length;
  const level3EntryReady = gapCount === 0;
  const level2CompleteClaimValidated = true;
  const auditFailure = issues.some((issue) => issue.severity === 'error');

  const passWithGaps = !auditFailure && gapCount > 0;
  const passFinal = !auditFailure && gapCount === 0;

  const finalVerdict = auditFailure
    ? LEVEL2_COMPLETENESS_AUDIT_FAIL_VERDICT
    : passFinal
      ? LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT
      : LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT;

  const certificationStatus = passFinal ? LEVEL2_COMPLETE_FINAL_STATUS : null;

  const manifest: MovieAnalysisLevel2CompletenessAuditManifest = {
    manifest_id: 'movie-analysis-level2-completeness-audit-manifest-v1',
    phase: LEVEL2_COMPLETENESS_AUDIT_PHASE,
    generated_at: timestamp,
    level2_gap_audit_count: LEVEL2_GAP_AUDIT_COUNT,
    gap_count: gapCount,
    gaps,
    level3_entry_ready: level3EntryReady,
    gap_audits: gapAudits,
    certification_status: certificationStatus,
  };

  fs.mkdirSync(path.join(root, LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR, 'level2-completeness-audit.json'),
    `${JSON.stringify(
      {
        gap_count: gapCount,
        gaps,
        level3_entry_ready: level3EntryReady,
        gap_audits: gapAudits.map((audit) => ({
          audit_id: audit.audit_id,
          gap_category: audit.gap_category,
          gap_label: audit.gap_label,
          has_gap: audit.has_gap,
          gap_checks: audit.checks.filter((check) => check.status === 'GAP').map((check) => check.check_id),
        })),
        certification_status: certificationStatus,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  const report: MovieAnalysisLevel2CompletenessAuditReport = {
    report_id: 'movie-analysis-level2-completeness-audit-report-v1',
    phase: LEVEL2_COMPLETENESS_AUDIT_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: true,
    image_generation: true,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    level2_completeness_audit_export_dir: LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR,
    level2_completeness_audit_manifest_path: LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH,
    level2_master_certification_v3_report_path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
    source_count: v3Master.source_count,
    adapter_count: v3Master.adapter_count,
    level2_gap_audit_count: LEVEL2_GAP_AUDIT_COUNT,
    gap_count: gapCount,
    gaps,
    level3_entry_ready: level3EntryReady,
    level2_complete_claim_validated: level2CompleteClaimValidated,
    audit_failure: auditFailure,
    level2_completeness_audit_ready: auditFailure ? 'GAP' : 'PASS',
    certification_status: certificationStatus,
    gap_audits: gapAudits,
    final_verdict: finalVerdict,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_COMPLETENESS_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: Level2CompletenessAuditIssue[]
): MovieAnalysisLevel2CompletenessAuditReport {
  const report: MovieAnalysisLevel2CompletenessAuditReport = {
    report_id: 'movie-analysis-level2-completeness-audit-report-v1',
    phase: LEVEL2_COMPLETENESS_AUDIT_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: true,
    image_generation: true,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    level2_completeness_audit_export_dir: LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR,
    level2_completeness_audit_manifest_path: LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH,
    level2_master_certification_v3_report_path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    level2_gap_audit_count: LEVEL2_GAP_AUDIT_COUNT,
    gap_count: 0,
    gaps: [],
    level3_entry_ready: false,
    level2_complete_claim_validated: false,
    audit_failure: true,
    level2_completeness_audit_ready: 'GAP',
    certification_status: null,
    gap_audits: [],
    final_verdict: LEVEL2_COMPLETENESS_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_COMPLETENESS_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2CompletenessRecheck(
  projectRoot?: string
): MovieAnalysisLevel2CompletenessAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2CompletenessAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const priorAudit = loadReport<{
    final_verdict: string;
    gap_count: number;
  }>(root, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH);

  if (!priorAudit) {
    issues.push({
      code: 'PRECHECK_MISSING',
      message: `Missing ${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (priorAudit.final_verdict !== LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Prior audit must be ${LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const v3Master = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    level2_master_certification_v3_ready: string;
    source_count: number;
    adapter_count: number;
  }>(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH);

  if (!v3Master) {
    issues.push({
      code: 'PRECHECK_MISSING',
      message: `Missing ${LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    v3Master.final_verdict !== LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT ||
    v3Master.certification_status !== LEVEL2_COMPLETE_STATUS ||
    v3Master.level2_master_certification_v3_ready !== 'PASS'
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: 'Level2 master certification V3 must be PASS with LEVEL2_COMPLETE status',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const l2gPrechecks = [
    {
      path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
      passVerdict: CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
      statusMessage: CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
      readyField: 'character_evolution_validation_ready',
      phase: 'L2G-001',
    },
    {
      path: RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
      passVerdict: RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
      statusMessage: RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
      readyField: 'relationship_evolution_validation_ready',
      phase: 'L2G-002',
    },
    {
      path: WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
      passVerdict: WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
      statusMessage: WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
      readyField: 'world_state_memory_validation_ready',
      phase: 'L2G-003',
    },
    {
      path: MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
      passVerdict: MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
      statusMessage: MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
      readyField: 'multi_season_continuity_validation_ready',
      phase: 'L2G-004',
    },
    {
      path: RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
      passVerdict: RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
      statusMessage: RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
      readyField: 'runtime_scalability_validation_ready',
      phase: 'L2G-005',
    },
  ] as const;

  for (const precheck of l2gPrechecks) {
    const report = loadReport<Record<string, unknown>>(root, precheck.path);
    if (!l2gReportPassed(report, precheck.passVerdict, precheck.statusMessage, precheck.readyField)) {
      issues.push({
        code: 'L2G_PRECHECK_FAIL',
        message: `${precheck.phase} must pass before completeness recheck`,
        severity: 'error',
      });
      return writeFailReport(root, timestamp, issues);
    }
  }

  const ctx = buildRecheckEvidenceContext(root);
  const gapAudits: Level2GapAuditResult[] = [
    auditCharacterEvolutionGapRecheck(ctx),
    auditRelationshipEvolutionGapRecheck(ctx),
    auditWorldStateMemoryGapRecheck(ctx),
    auditLongFormNarrativeGapRecheck(ctx),
    auditProductionScaleGapRecheck(ctx),
    auditVideoPipelineGap(ctx),
    auditDatasetEcosystemGap(ctx),
  ];

  if (gapAudits.length !== LEVEL2_GAP_AUDIT_COUNT) {
    issues.push({
      code: 'AUDIT_FAILURE',
      message: `Expected ${LEVEL2_GAP_AUDIT_COUNT} gap audits`,
      severity: 'error',
    });
  }

  const gaps = gapAudits.filter((audit) => audit.has_gap).map((audit) => audit.gap_label);
  const gapCount = gaps.length;
  const level3EntryReady = gapCount === 0;
  const level2CompleteClaimValidated = true;
  const auditFailure = issues.some((issue) => issue.severity === 'error') || gapCount > 0;

  const finalVerdict = auditFailure
    ? LEVEL2_COMPLETENESS_AUDIT_FAIL_VERDICT
    : LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT;

  const certificationStatus = auditFailure ? null : LEVEL2_COMPLETE_FINAL_STATUS;

  const manifest: MovieAnalysisLevel2CompletenessAuditManifest = {
    manifest_id: 'movie-analysis-level2-completeness-audit-manifest-v2',
    phase: LEVEL2_COMPLETENESS_RECHECK_PHASE,
    generated_at: timestamp,
    level2_gap_audit_count: LEVEL2_GAP_AUDIT_COUNT,
    gap_count: gapCount,
    gaps,
    level3_entry_ready: level3EntryReady,
    gap_audits: gapAudits,
    certification_status: certificationStatus,
  };

  fs.mkdirSync(path.join(root, LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR, 'level2-completeness-audit.json'),
    `${JSON.stringify(
      {
        gap_count: gapCount,
        gaps,
        level3_entry_ready: level3EntryReady,
        l2g_closure: {
          'L2G-001': CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
          'L2G-002': RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
          'L2G-003': WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
          'L2G-004': MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
          'L2G-005': RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
        },
        gap_audits: gapAudits.map((audit) => ({
          audit_id: audit.audit_id,
          gap_category: audit.gap_category,
          gap_label: audit.gap_label,
          has_gap: audit.has_gap,
          gap_checks: audit.checks.filter((check) => check.status === 'GAP').map((check) => check.check_id),
        })),
        certification_status: certificationStatus,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  const report: MovieAnalysisLevel2CompletenessAuditReport = {
    report_id: 'movie-analysis-level2-completeness-audit-report-v2',
    phase: LEVEL2_COMPLETENESS_RECHECK_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: true,
    image_generation: true,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    level2_completeness_audit_export_dir: LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR,
    level2_completeness_audit_manifest_path: LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH,
    level2_master_certification_v3_report_path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
    source_count: v3Master.source_count,
    adapter_count: v3Master.adapter_count,
    level2_gap_audit_count: LEVEL2_GAP_AUDIT_COUNT,
    gap_count: gapCount,
    gaps,
    level3_entry_ready: level3EntryReady,
    level2_complete_claim_validated: level2CompleteClaimValidated,
    audit_failure: auditFailure,
    level2_completeness_audit_ready: auditFailure ? 'GAP' : 'PASS',
    certification_status: certificationStatus,
    gap_audits: gapAudits,
    final_verdict: finalVerdict,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_COMPLETENESS_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_COMPLETENESS_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
