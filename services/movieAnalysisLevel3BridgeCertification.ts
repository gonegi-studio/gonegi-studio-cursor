import fs from 'node:fs';
import path from 'node:path';
import {
  CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
  CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
  CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisCharacterEvolutionValidation.js';
import {
  CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisCrossAppConsumptionCertification.js';
import {
  DATASET_NORMALIZATION_PASS_VERDICT,
  DATASET_NORMALIZATION_REPORT_PATH,
} from './movieAnalysisDatasetNormalization.js';
import {
  CONSUMER_BRIDGE_PASS_VERDICT,
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
  writeMovieAnalysisDatasetConsumerBridge,
} from './movieAnalysisDatasetConsumerBridge.js';
import {
  DATASET_EXPORT_PASS_VERDICT,
  DATASET_EXPORT_REPORT_PATH,
  DATASET_PATH,
} from './movieAnalysisDatasetExport.js';
import { DATASET_EXPORT_VALIDATION_REPORT_PATH } from './movieAnalysisDatasetExportValidator.js';
import {
  DNA_ADAPTER_CERTIFICATION_PASS_VERDICT,
  DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisDnaAdapterCertification.js';
import {
  DNA_TO_FRAME_VALIDATION_PASS_VERDICT,
  DNA_TO_FRAME_VALIDATION_REPORT_PATH,
} from './movieAnalysisDnaToFrameValidation.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  EXPORT_PACKAGE_PASS_VERDICT,
  EXPORT_REPORT_PATH,
} from './movieAnalysisExportPackage.js';
import {
  GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT,
  GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
  GENERATION_PIPELINE_CERTIFIED_STATUS,
} from './movieAnalysisGenerationPipelineCertification.js';
import {
  IMAGE_APP_CERTIFICATION_PASS_VERDICT,
  IMAGE_APP_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisImageAppCertification.js';
import {
  LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT,
  LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
  LEVEL2_COMPLETE_FINAL_STATUS,
} from './movieAnalysisLevel2CompletenessAudit.js';
import {
  LEVEL2_COMPLETE_STATUS,
  LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
} from './movieAnalysisLevel2MasterCertificationV3.js';
import {
  LEVEL2_COMPLETE_FINAL_PLUS_STATUS,
  LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT,
  LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
} from './movieAnalysisLevel2RobustnessAudit.js';
import {
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisLevel2EProductionScaleCertification.js';
import {
  MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisMultiEpisodeConsistencyValidation.js';
import {
  MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
  MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
  MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisMultiSeasonContinuityValidation.js';
import {
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisProductionBatchConsistencyValidation.js';
import {
  LEVEL2_COMPLETE_FINAL_MAX_STATUS,
  REAL_WORLD_GENERALIZATION_AUDIT_PASS_VERDICT,
  REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH,
  LEVEL2_REAL_WORLD_CERTIFIED_STATUS,
} from './movieAnalysisRealWorldGeneralizationAudit.js';
import {
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import {
  RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
  RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
  RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRuntimeScalabilityValidation.js';
import {
  SCENE_DETECTION_PASS_VERDICT,
  SCENE_DETECTION_REPORT_PATH,
} from './movieAnalysisSceneDetectionValidator.js';
import {
  STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
  STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
  STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisStoryArcConsistencyValidation.js';
import {
  VIDEO_APP_CERTIFICATION_PASS_VERDICT,
  VIDEO_APP_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisVideoAppCertification.js';
import {
  WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
  WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
  WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisWorldStateMemoryValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL3_BRIDGE_CERTIFICATION_PHASE =
  'PHASE-LEVEL3-BRIDGE-001-LEVEL2_TO_LEVEL3_TRANSITION_CERTIFICATION_V1' as const;
export const LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL3_BRIDGE_CERTIFICATION_V1' as const;
export const LEVEL3_BRIDGE_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL3_BRIDGE_CERTIFICATION_V1' as const;
export const LEVEL3_READY_STATUS = 'LEVEL3_READY' as const;
export const LEVEL3_ENTRY_APPROVED_STATUS = 'LEVEL3_ENTRY_APPROVED' as const;
export const LEVEL3_BRIDGE_CERTIFICATION_DIR =
  'reports/movie_analysis_level3_bridge' as const;
export const LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level3_bridge/movie-analysis-level3-bridge-certification-report.json' as const;
export const LEVEL3_BRIDGE_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level3_bridge/MOVIE_ANALYSIS_LEVEL3_BRIDGE_CERTIFICATION.md' as const;
export const LEVEL3_BRIDGE_CERTIFICATION_EXPORT_DIR =
  'exports/movie_analysis_level3_bridge' as const;
export const LEVEL3_BRIDGE_CERTIFICATION_MANIFEST_PATH =
  'exports/movie_analysis_level3_bridge/movie-analysis-level3-bridge-certification-manifest.json' as const;

export const LEVEL2_ASSET_COUNT = 12 as const;
export const LEVEL3_ENTRY_GATE_COUNT = 4 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level3BridgeCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  asset_id?: string;
  gate_id?: string;
};

export type Level2AssetAudit = {
  asset_id: string;
  asset_label: string;
  evidence_report_path: string;
  asset_ready: CertificationStatus;
};

export type Level3EntryGateResult = {
  gate_id: string;
  gate_label: string;
  from_stage: string;
  to_stage: string;
  gate_passed: CertificationStatus;
};

export type MovieAnalysisLevel3BridgeCertificationManifest = {
  manifest_id: string;
  phase: typeof LEVEL3_BRIDGE_CERTIFICATION_PHASE;
  generated_at: string;
  level2_asset_count: typeof LEVEL2_ASSET_COUNT;
  level3_entry_gate_count: typeof LEVEL3_ENTRY_GATE_COUNT;
  level2_assets_complete: boolean;
  production_ready: boolean;
  level3_entry_ready: boolean;
  level2_asset_audits: Level2AssetAudit[];
  level3_entry_gates: Level3EntryGateResult[];
  certification_status: typeof LEVEL3_READY_STATUS | null;
  final_output_status: typeof LEVEL3_ENTRY_APPROVED_STATUS | null;
};

export type MovieAnalysisLevel3BridgeCertificationReport = {
  report_id: string;
  phase: typeof LEVEL3_BRIDGE_CERTIFICATION_PHASE;
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
  level2_master_certification_v3_report_path: typeof LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH;
  level2_completeness_audit_report_path: typeof LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH;
  level2_robustness_audit_report_path: typeof LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH;
  real_world_generalization_audit_report_path: typeof REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH;
  level3_bridge_certification_export_dir: typeof LEVEL3_BRIDGE_CERTIFICATION_EXPORT_DIR;
  level3_bridge_certification_manifest_path: typeof LEVEL3_BRIDGE_CERTIFICATION_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  level2_asset_count: typeof LEVEL2_ASSET_COUNT;
  level3_entry_gate_count: typeof LEVEL3_ENTRY_GATE_COUNT;
  level2_assets_complete: boolean;
  production_asset_ready: CertificationStatus;
  dataset_export_ready: CertificationStatus;
  image_pipeline_ready: CertificationStatus;
  video_pipeline_ready: CertificationStatus;
  cross_module_ready: CertificationStatus;
  generation_ready: CertificationStatus;
  production_ready: boolean;
  dna_traceability_preserved: CertificationStatus;
  adapter_traceability_preserved: CertificationStatus;
  pipeline_traceability_preserved: CertificationStatus;
  cross_level_traceability_preserved: CertificationStatus;
  traceability_preserved: boolean;
  level2_asset_missing: boolean;
  export_failure: boolean;
  production_not_ready: boolean;
  image_pipeline_break: boolean;
  video_pipeline_break: boolean;
  traceability_loss: boolean;
  bridge_failure: boolean;
  level3_bridge_certification_ready: CertificationStatus;
  certification_status: typeof LEVEL3_READY_STATUS | null;
  final_output_status: typeof LEVEL3_ENTRY_APPROVED_STATUS | null;
  level3_entry_ready: boolean;
  level2_asset_audits: Level2AssetAudit[];
  level3_entry_gates: Level3EntryGateResult[];
  final_verdict:
    | typeof LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT
    | typeof LEVEL3_BRIDGE_CERTIFICATION_FAIL_VERDICT;
  issues: Level3BridgeCertificationIssue[];
};

type PrecheckSpec = {
  id: string;
  report_path: string;
  pass_verdict: string;
  status_message?: string;
  ready_field?: string;
};

const PRECHECK_SPECS: PrecheckSpec[] = [
  {
    id: 'LEVEL2_MASTER_V3',
    report_path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
    pass_verdict: LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
    status_message: LEVEL2_COMPLETE_STATUS,
    ready_field: 'level2_master_certification_v3_ready',
  },
  {
    id: 'LEVEL2_COMPLETENESS',
    report_path: LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
    pass_verdict: LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT,
    status_message: LEVEL2_COMPLETE_FINAL_STATUS,
    ready_field: 'level2_completeness_audit_ready',
  },
  {
    id: 'LEVEL2_ROBUSTNESS',
    report_path: LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
    pass_verdict: LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT,
    status_message: LEVEL2_COMPLETE_FINAL_PLUS_STATUS,
    ready_field: 'level2_robustness_audit_ready',
  },
  {
    id: 'REAL_WORLD_GENERALIZATION',
    report_path: REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH,
    pass_verdict: REAL_WORLD_GENERALIZATION_AUDIT_PASS_VERDICT,
    status_message: LEVEL2_REAL_WORLD_CERTIFIED_STATUS,
    ready_field: 'real_world_generalization_audit_ready',
  },
];

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
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

function datasetExportBuildPassed(report: Record<string, unknown> | null): boolean {
  if (!report) return false;
  if (report.final_verdict === DATASET_EXPORT_PASS_VERDICT) return true;
  return report.build_status === 'PASS';
}

function completenessTraceabilityPreserved(root: string): boolean {
  const completeness = loadReport<Record<string, unknown>>(
    root,
    LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH
  );
  if (fieldPass(completeness, 'traceability_preserved')) return true;
  if (
    !reportPassed(
      completeness,
      LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT,
      'level2_completeness_audit_ready'
    )
  ) {
    return false;
  }
  if (completeness?.gap_count !== 0) return false;

  const gapAudits = completeness?.gap_audits as
    | Array<{
        has_gap: boolean;
        checks?: Array<{ check_id: string; status: string }>;
      }>
    | undefined;
  if (!gapAudits) return false;

  return gapAudits.every((audit) => {
    const traceChecks = audit.checks?.filter((check) => check.check_id === 'traceability') ?? [];
    return traceChecks.length === 0 || traceChecks.every((check) => check.status === 'PASS');
  });
}

function fileExists(root: string, filePath: string): boolean {
  return fs.existsSync(path.join(root, filePath));
}

function auditLevel2Assets(root: string): Level2AssetAudit[] {
  const v3 = loadReport<Record<string, unknown>>(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH);

  const specs: Array<{
    asset_id: string;
    asset_label: string;
    evidence_report_path: string;
    ready: boolean;
  }> = [
    {
      asset_id: 'scene_detection',
      asset_label: 'Scene Detection',
      evidence_report_path: SCENE_DETECTION_REPORT_PATH,
      ready: reportPassed(loadReport(root, SCENE_DETECTION_REPORT_PATH), SCENE_DETECTION_PASS_VERDICT),
    },
    {
      asset_id: 'scene_segmentation',
      asset_label: 'Scene Segmentation',
      evidence_report_path: DATASET_NORMALIZATION_REPORT_PATH,
      ready: reportPassed(
        loadReport(root, DATASET_NORMALIZATION_REPORT_PATH),
        DATASET_NORMALIZATION_PASS_VERDICT,
        'dataset_normalization_ready'
      ),
    },
    {
      asset_id: 'character_dna',
      asset_label: 'Character DNA',
      evidence_report_path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
      ready: reportPassed(
        loadReport(root, CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH),
        CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
        'character_evolution_validation_ready'
      ),
    },
    {
      asset_id: 'location_dna',
      asset_label: 'Location DNA',
      evidence_report_path: WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
      ready: reportPassed(
        loadReport(root, WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH),
        WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
        'world_state_memory_validation_ready'
      ),
    },
    {
      asset_id: 'motion_dna',
      asset_label: 'Motion DNA',
      evidence_report_path: REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
      ready: reportPassed(
        loadReport(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH),
        REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'real_video_motion_consistency_validation_ready'
      ),
    },
    {
      asset_id: 'emotion_dna',
      asset_label: 'Emotion DNA',
      evidence_report_path: DNA_TO_FRAME_VALIDATION_REPORT_PATH,
      ready:
        reportPassed(
          loadReport(root, DNA_TO_FRAME_VALIDATION_REPORT_PATH),
          DNA_TO_FRAME_VALIDATION_PASS_VERDICT,
          'dna_to_frame_validation_ready'
        ) && fieldPass(loadReport(root, DNA_TO_FRAME_VALIDATION_REPORT_PATH), 'emotion_dna_alignment'),
    },
    {
      asset_id: 'story_arc',
      asset_label: 'Story Arc',
      evidence_report_path: STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
      ready: reportPassed(
        loadReport(root, STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH),
        STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'story_arc_consistency_validation_ready'
      ),
    },
    {
      asset_id: 'multi_episode',
      asset_label: 'Multi Episode',
      evidence_report_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
      ready: reportPassed(
        loadReport(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH),
        MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
        'multi_episode_consistency_validation_ready'
      ),
    },
    {
      asset_id: 'multi_season',
      asset_label: 'Multi Season',
      evidence_report_path: MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
      ready: reportPassed(
        loadReport(root, MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH),
        MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
        'multi_season_continuity_validation_ready'
      ),
    },
    {
      asset_id: 'runtime_scalability',
      asset_label: 'Runtime Scalability',
      evidence_report_path: RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
      ready: reportPassed(
        loadReport(root, RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH),
        RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
        'runtime_scalability_validation_ready'
      ),
    },
    {
      asset_id: 'traceability',
      asset_label: 'Traceability',
      evidence_report_path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
      ready:
        fieldPass(v3, 'dna_traceability_preserved') &&
        fieldPass(v3, 'adapter_traceability_preserved') &&
        fieldPass(v3, 'pipeline_traceability_preserved'),
    },
    {
      asset_id: 'adapter_binding',
      asset_label: 'Adapter Binding',
      evidence_report_path: DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
      ready: reportPassed(
        loadReport(root, DNA_ADAPTER_CERTIFICATION_REPORT_PATH),
        DNA_ADAPTER_CERTIFICATION_PASS_VERDICT
      ),
    },
  ];

  return specs.map((spec) => ({
    asset_id: spec.asset_id,
    asset_label: spec.asset_label,
    evidence_report_path: spec.evidence_report_path,
    asset_ready: toStatus(spec.ready),
  }));
}

function evaluateLevel3Gates(root: string): Level3EntryGateResult[] {
  const movieAnalysisReady = reportPassed(
    loadReport(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH),
    LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
    'level2_master_certification_v3_ready'
  );
  const datasetExportReady =
    datasetExportBuildPassed(loadReport(root, DATASET_EXPORT_REPORT_PATH)) &&
    fileExists(root, DATASET_PATH) &&
    reportPassed(loadReport(root, DATASET_EXPORT_VALIDATION_REPORT_PATH), DATASET_EXPORT_PASS_VERDICT);

  const imagePipelineReady =
    reportPassed(
      loadReport(root, IMAGE_APP_CERTIFICATION_REPORT_PATH),
      IMAGE_APP_CERTIFICATION_PASS_VERDICT
    ) && fileExists(root, IMAGE_CONSUMER_BRIDGE_PATH);

  const videoPipelineReady =
    reportPassed(
      loadReport(root, VIDEO_APP_CERTIFICATION_REPORT_PATH),
      VIDEO_APP_CERTIFICATION_PASS_VERDICT
    ) && fileExists(root, VIDEO_CONSUMER_BRIDGE_PATH);

  const consumerBridge = writeMovieAnalysisDatasetConsumerBridge(root);
  const futureStudioReady =
    reportPassed(
      loadReport(root, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH),
      CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
      'cross_app_consumption_certification_ready'
    ) &&
    consumerBridge.final_verdict === CONSUMER_BRIDGE_PASS_VERDICT &&
    reportPassed(loadReport(root, EXPORT_REPORT_PATH), EXPORT_PACKAGE_PASS_VERDICT);

  return [
    {
      gate_id: 'Gate-01',
      gate_label: 'Movie Analysis → Dataset Export',
      from_stage: 'Movie Analysis',
      to_stage: 'Dataset Export',
      gate_passed: toStatus(movieAnalysisReady && datasetExportReady),
    },
    {
      gate_id: 'Gate-02',
      gate_label: 'Dataset Export → Image Production',
      from_stage: 'Dataset Export',
      to_stage: 'Image Production',
      gate_passed: toStatus(datasetExportReady && imagePipelineReady),
    },
    {
      gate_id: 'Gate-03',
      gate_label: 'Dataset Export → Video Production',
      from_stage: 'Dataset Export',
      to_stage: 'Video Production',
      gate_passed: toStatus(datasetExportReady && videoPipelineReady),
    },
    {
      gate_id: 'Gate-04',
      gate_label: 'Dataset Export → Future Studio Pipeline',
      from_stage: 'Dataset Export',
      to_stage: 'Future Studio Pipeline',
      gate_passed: toStatus(datasetExportReady && futureStudioReady),
    },
  ];
}

function buildMarkdown(report: MovieAnalysisLevel3BridgeCertificationReport): string {
  const lines = [
    '# Movie Analysis Level3 Bridge Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }
  if (report.final_output_status) {
    lines.push(`## Final Output: ${report.final_output_status}`, '');
  }

  lines.push(
    '## Purpose',
    '',
    'Certify that all Movie Analysis assets are consumable by the Level3 Production Engine.',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| level2_assets_complete | ${report.level2_assets_complete} |`,
    `| production_ready | ${report.production_ready} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| level3_entry_ready | ${report.level3_entry_ready} |`,
    '',
    '## Level2 Asset Audit',
    ''
  );

  for (const asset of report.level2_asset_audits) {
    lines.push(`- ${asset.asset_id}: ${asset.asset_ready} (${asset.evidence_report_path})`);
  }

  lines.push('', '## Level3 Entry Gates', '');
  for (const gate of report.level3_entry_gates) {
    lines.push(`- ${gate.gate_id}: ${gate.gate_passed} (${gate.from_stage} → ${gate.to_stage})`);
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
  issues: Level3BridgeCertificationIssue[]
): MovieAnalysisLevel3BridgeCertificationReport {
  const report: MovieAnalysisLevel3BridgeCertificationReport = {
    report_id: 'movie-analysis-level3-bridge-certification-report-v1',
    phase: LEVEL3_BRIDGE_CERTIFICATION_PHASE,
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
    level2_master_certification_v3_report_path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
    level2_completeness_audit_report_path: LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
    level2_robustness_audit_report_path: LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
    real_world_generalization_audit_report_path: REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH,
    level3_bridge_certification_export_dir: LEVEL3_BRIDGE_CERTIFICATION_EXPORT_DIR,
    level3_bridge_certification_manifest_path: LEVEL3_BRIDGE_CERTIFICATION_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    level2_asset_count: LEVEL2_ASSET_COUNT,
    level3_entry_gate_count: LEVEL3_ENTRY_GATE_COUNT,
    level2_assets_complete: false,
    production_asset_ready: 'FAIL',
    dataset_export_ready: 'FAIL',
    image_pipeline_ready: 'FAIL',
    video_pipeline_ready: 'FAIL',
    cross_module_ready: 'FAIL',
    generation_ready: 'FAIL',
    production_ready: false,
    dna_traceability_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    pipeline_traceability_preserved: 'FAIL',
    cross_level_traceability_preserved: 'FAIL',
    traceability_preserved: false,
    level2_asset_missing: true,
    export_failure: true,
    production_not_ready: true,
    image_pipeline_break: true,
    video_pipeline_break: true,
    traceability_loss: true,
    bridge_failure: true,
    level3_bridge_certification_ready: 'FAIL',
    certification_status: null,
    final_output_status: null,
    level3_entry_ready: false,
    level2_asset_audits: [],
    level3_entry_gates: [],
    final_verdict: LEVEL3_BRIDGE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL3_BRIDGE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL3_BRIDGE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel3BridgeCertification(
  projectRoot?: string
): MovieAnalysisLevel3BridgeCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level3BridgeCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  for (const precheck of PRECHECK_SPECS) {
    const report = loadReport<Record<string, unknown>>(root, precheck.report_path);
    if (!report) {
      issues.push({
        code: 'PRECHECK_MISSING',
        message: `Missing ${precheck.report_path}`,
        severity: 'error',
      });
      return writeFailReport(root, timestamp, issues);
    }

    const passed = reportPassed(report, precheck.pass_verdict, precheck.ready_field);
    const statusOk = !precheck.status_message || report.certification_status === precheck.status_message;

    if (!passed || !statusOk) {
      issues.push({
        code: 'PRECHECK_FAIL',
        message: `Required ${precheck.pass_verdict} for ${precheck.id}`,
        severity: 'error',
      });
      return writeFailReport(root, timestamp, issues);
    }
  }

  const realWorld = loadReport<{
    final_certification_status: string | null;
    level3_entry_ready: boolean;
  }>(root, REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH);

  if (
    !realWorld ||
    realWorld.final_certification_status !== LEVEL2_COMPLETE_FINAL_MAX_STATUS ||
    realWorld.level3_entry_ready !== true
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Required ${LEVEL2_COMPLETE_FINAL_MAX_STATUS} from real-world generalization audit`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const v3 = loadReport<Record<string, unknown>>(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH);
  const level2AssetAudits = auditLevel2Assets(root);
  const level3EntryGates = evaluateLevel3Gates(root);

  const level2AssetsComplete = level2AssetAudits.every((asset) => asset.asset_ready === 'PASS');

  const productionAssetReady = toStatus(
    reportPassed(
      loadReport(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH),
      PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
      'production_batch_consistency_validation_ready'
    ) &&
      reportPassed(
        loadReport(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH),
        LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
        'level2e_production_scale_certification_ready'
      )
  );

  const datasetExportReady = toStatus(
    datasetExportBuildPassed(loadReport(root, DATASET_EXPORT_REPORT_PATH)) &&
      fileExists(root, DATASET_PATH) &&
      reportPassed(loadReport(root, DATASET_EXPORT_VALIDATION_REPORT_PATH), DATASET_EXPORT_PASS_VERDICT)
  );

  const imagePipelineReady = toStatus(
    reportPassed(
      loadReport(root, IMAGE_APP_CERTIFICATION_REPORT_PATH),
      IMAGE_APP_CERTIFICATION_PASS_VERDICT
    ) && fileExists(root, IMAGE_CONSUMER_BRIDGE_PATH)
  );

  const videoPipelineReady = toStatus(
    reportPassed(
      loadReport(root, VIDEO_APP_CERTIFICATION_REPORT_PATH),
      VIDEO_APP_CERTIFICATION_PASS_VERDICT
    ) && fileExists(root, VIDEO_CONSUMER_BRIDGE_PATH)
  );

  const crossModuleReady = toStatus(
    reportPassed(
      loadReport(root, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH),
      CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
      'cross_app_consumption_certification_ready'
    )
  );

  const generationReady = toStatus(
    (() => {
      const generation = loadReport<Record<string, unknown>>(
        root,
        GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH
      );
      return (
        generation?.final_verdict === GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT &&
        generation?.certification_status === GENERATION_PIPELINE_CERTIFIED_STATUS &&
        generation?.generation_pipeline_certification_ready === 'PASS'
      );
    })()
  );

  const productionReady =
    productionAssetReady === 'PASS' &&
    datasetExportReady === 'PASS' &&
    imagePipelineReady === 'PASS' &&
    videoPipelineReady === 'PASS' &&
    crossModuleReady === 'PASS' &&
    generationReady === 'PASS';

  const dnaTraceabilityPreserved = toStatus(fieldPass(v3, 'dna_traceability_preserved'));
  const adapterTraceabilityPreserved = toStatus(fieldPass(v3, 'adapter_traceability_preserved'));
  const pipelineTraceabilityPreserved = toStatus(fieldPass(v3, 'pipeline_traceability_preserved'));
  const crossLevelTraceabilityPreserved = toStatus(
    fieldPass(v3, 'dna_traceability_preserved') &&
      fieldPass(v3, 'adapter_traceability_preserved') &&
      fieldPass(v3, 'pipeline_traceability_preserved') &&
      completenessTraceabilityPreserved(root) &&
      fieldPass(
        loadReport(root, REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH),
        'traceability_preserved'
      )
  );
  const traceabilityPreserved =
    dnaTraceabilityPreserved === 'PASS' &&
    adapterTraceabilityPreserved === 'PASS' &&
    pipelineTraceabilityPreserved === 'PASS' &&
    crossLevelTraceabilityPreserved === 'PASS';

  const level2AssetMissing = !level2AssetsComplete;
  const exportFailure = datasetExportReady === 'FAIL';
  const productionNotReady = !productionReady;
  const imagePipelineBreak = imagePipelineReady === 'FAIL';
  const videoPipelineBreak = videoPipelineReady === 'FAIL';
  const traceabilityLoss = !traceabilityPreserved;
  const bridgeFailure =
    level2AssetMissing ||
    exportFailure ||
    productionNotReady ||
    imagePipelineBreak ||
    videoPipelineBreak ||
    traceabilityLoss ||
    level3EntryGates.some((gate) => gate.gate_passed === 'FAIL');

  const pass =
    !bridgeFailure &&
    level2AssetsComplete &&
    productionReady &&
    traceabilityPreserved &&
    level3EntryGates.every((gate) => gate.gate_passed === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const manifest: MovieAnalysisLevel3BridgeCertificationManifest = {
    manifest_id: 'movie-analysis-level3-bridge-certification-manifest-v1',
    phase: LEVEL3_BRIDGE_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level2_asset_count: LEVEL2_ASSET_COUNT,
    level3_entry_gate_count: LEVEL3_ENTRY_GATE_COUNT,
    level2_assets_complete: level2AssetsComplete,
    production_ready: productionReady,
    level3_entry_ready: pass,
    level2_asset_audits: level2AssetAudits,
    level3_entry_gates: level3EntryGates,
    certification_status: pass ? LEVEL3_READY_STATUS : null,
    final_output_status: pass ? LEVEL3_ENTRY_APPROVED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, LEVEL3_BRIDGE_CERTIFICATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL3_BRIDGE_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL3_BRIDGE_CERTIFICATION_EXPORT_DIR, 'level3-bridge-certification.json'),
    `${JSON.stringify(
      {
        level2_assets_complete: level2AssetsComplete,
        production_ready: productionReady,
        traceability_preserved: traceabilityPreserved,
        level3_entry_ready: pass,
        level2_asset_audits: level2AssetAudits,
        level3_entry_gates: level3EntryGates,
        certification_status: pass ? LEVEL3_READY_STATUS : null,
        final_output_status: pass ? LEVEL3_ENTRY_APPROVED_STATUS : null,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  const report: MovieAnalysisLevel3BridgeCertificationReport = {
    report_id: 'movie-analysis-level3-bridge-certification-report-v1',
    phase: LEVEL3_BRIDGE_CERTIFICATION_PHASE,
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
    level2_master_certification_v3_report_path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
    level2_completeness_audit_report_path: LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
    level2_robustness_audit_report_path: LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
    real_world_generalization_audit_report_path: REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH,
    level3_bridge_certification_export_dir: LEVEL3_BRIDGE_CERTIFICATION_EXPORT_DIR,
    level3_bridge_certification_manifest_path: LEVEL3_BRIDGE_CERTIFICATION_MANIFEST_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level2_asset_count: LEVEL2_ASSET_COUNT,
    level3_entry_gate_count: LEVEL3_ENTRY_GATE_COUNT,
    level2_assets_complete: level2AssetsComplete,
    production_asset_ready: productionAssetReady,
    dataset_export_ready: datasetExportReady,
    image_pipeline_ready: imagePipelineReady,
    video_pipeline_ready: videoPipelineReady,
    cross_module_ready: crossModuleReady,
    generation_ready: generationReady,
    production_ready: productionReady,
    dna_traceability_preserved: dnaTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    pipeline_traceability_preserved: pipelineTraceabilityPreserved,
    cross_level_traceability_preserved: crossLevelTraceabilityPreserved,
    traceability_preserved: traceabilityPreserved,
    level2_asset_missing: level2AssetMissing,
    export_failure: exportFailure,
    production_not_ready: productionNotReady,
    image_pipeline_break: imagePipelineBreak,
    video_pipeline_break: videoPipelineBreak,
    traceability_loss: traceabilityLoss,
    bridge_failure: bridgeFailure,
    level3_bridge_certification_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? LEVEL3_READY_STATUS : null,
    final_output_status: pass ? LEVEL3_ENTRY_APPROVED_STATUS : null,
    level3_entry_ready: pass,
    level2_asset_audits: level2AssetAudits,
    level3_entry_gates: level3EntryGates,
    final_verdict: pass
      ? LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT
      : LEVEL3_BRIDGE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL3_BRIDGE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL3_BRIDGE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
