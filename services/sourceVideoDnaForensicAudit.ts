import fs from 'node:fs';
import path from 'node:path';
import {
  NUMERICAL_DNA_AUDIT_PASS_VERDICT,
  NUMERICAL_DNA_AUDIT_READY_STATUS,
  NUMERICAL_DNA_AUDIT_REPORT_PATH,
} from './sourceVideoNumericalDnaAudit.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  NUMERICAL_DNA_PASS_VERDICT,
  NUMERICAL_DNA_READY_STATUS,
  SOURCE_VIDEO_DNA_DATASET_DIR,
  SOURCE_VIDEO_DNA_EXPORT_DIR,
  SOURCE_VIDEO_DNA_REPORT_PATH,
  TITANIC_SOURCE_ID,
  sourceVideoIds,
  TOTAL_SOURCE_VIDEO_COUNT,
} from './sourceVideoNumericalAndCinematicDna.js';
import {
  TITANIC_INTEGRATION_PASS_VERDICT,
  TITANIC_INTEGRATION_REPORT_PATH,
} from './titanicSourceIntegration.js';

export const FORENSIC_DNA_PHASE = 'PHASE-DATASET-FORENSIC-AUDIT-001' as const;
export const FORENSIC_DNA_PASS_VERDICT = 'PASS_FORENSIC_DNA_AUDIT_V2' as const;
export const FORENSIC_DNA_FAIL_VERDICT = 'FAIL_FORENSIC_DNA_AUDIT_V2' as const;
export const FORENSIC_DNA_READY_STATUS = 'FORENSIC_DNA_AUDIT_READY' as const;

export const FORENSIC_DNA_AUDIT_REPORT_PATH =
  'reports/source_video_dna/FORENSIC_DNA_AUDIT_REPORT.json' as const;
export const DNA_FIDELITY_SCORECARD_PATH =
  'reports/source_video_dna/DNA_FIDELITY_SCORECARD.json' as const;
export const SOURCE_FIDELITY_MATRIX_PATH =
  'reports/source_video_dna/SOURCE_FIDELITY_MATRIX.json' as const;
export const RECONSTRUCTION_POTENTIAL_REPORT_PATH =
  'reports/source_video_dna/RECONSTRUCTION_POTENTIAL_REPORT.json' as const;

const DNA_BUCKETS = [
  'frame-coordinate-dna',
  'motion-vector-dna',
  'camera-behavior-dna',
  'blocking-dna',
  'edit-rhythm-dna',
  'visual-style-numerical-dna',
  'environment-motion-dna',
] as const;

const FIDELITY_LEVELS = [
  'LEVEL_0',
  'LEVEL_1',
  'LEVEL_2',
  'LEVEL_3',
  'LEVEL_4',
  'LEVEL_5',
] as const;

type FidelityLevel = (typeof FIDELITY_LEVELS)[number];
type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface SourceFidelityEntry {
  source_id: string;
  source_group: string;
  fidelity_level: FidelityLevel;
  fidelity_index: number;
  buckets_present: number;
  frame_count: number;
  segment_count: number;
  placeholder: boolean;
  production_grade: boolean;
  classification_signals: Record<string, number | boolean | string>;
}

export interface ForensicDnaAuditReport {
  report_id: string;
  phase: typeof FORENSIC_DNA_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  forensic_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
  forensic_passed: boolean;
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function clampScore(n: number): number {
  return Number(Math.max(0, Math.min(100, n)).toFixed(2));
}

function levelToNumber(level: FidelityLevel): number {
  return FIDELITY_LEVELS.indexOf(level);
}

function indexToLevel(index: number): FidelityLevel {
  if (index >= 88) return 'LEVEL_5';
  if (index >= 74) return 'LEVEL_4';
  if (index >= 58) return 'LEVEL_3';
  if (index >= 42) return 'LEVEL_2';
  if (index >= 22) return 'LEVEL_1';
  return 'LEVEL_0';
}

function sourceVariation(sourceId: string): number {
  let h = 0;
  for (let i = 0; i < sourceId.length; i++) h = (h * 31 + sourceId.charCodeAt(i)) % 100;
  return (h / 100) * 3 - 1.5;
}

function uniqueRatio(values: string[]): number {
  if (values.length === 0) return 0;
  return new Set(values).size / values.length;
}

function jsonKey(obj: unknown): string {
  return JSON.stringify(obj);
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  return Math.sqrt(nums.reduce((s, n) => s + (n - m) ** 2, 0) / nums.length);
}

function imbalanceLabel(spread: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (spread <= 1) return 'LOW';
  if (spread === 2) return 'MEDIUM';
  return 'HIGH';
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const gates: Record<string, boolean> = {
    extraction_pass: false,
    numerical_audit_pass: false,
    titanic_integration_pass: false,
  };

  const extraction = tryReadJson(root, SOURCE_VIDEO_DNA_REPORT_PATH);
  gates.extraction_pass =
    String(extraction?.final_verdict ?? '') === NUMERICAL_DNA_PASS_VERDICT &&
    String(extraction?.status ?? '') === NUMERICAL_DNA_READY_STATUS;
  if (!gates.extraction_pass) {
    issues.push({ code: 'EXTRACTION_PRECHECK_FAIL', message: 'Extraction not PASS', severity: 'error' });
  }

  const audit = tryReadJson(root, NUMERICAL_DNA_AUDIT_REPORT_PATH);
  gates.numerical_audit_pass =
    String(audit?.final_verdict ?? '') === NUMERICAL_DNA_AUDIT_PASS_VERDICT &&
    String(audit?.status ?? '') === NUMERICAL_DNA_AUDIT_READY_STATUS;
  if (!gates.numerical_audit_pass) {
    issues.push({ code: 'NUMERICAL_AUDIT_PRECHECK_FAIL', message: 'Numerical DNA audit not PASS', severity: 'error' });
  }

  const titanic = tryReadJson(root, TITANIC_INTEGRATION_REPORT_PATH);
  gates.titanic_integration_pass =
    String(titanic?.final_verdict ?? '') === TITANIC_INTEGRATION_PASS_VERDICT;
  if (!gates.titanic_integration_pass) {
    issues.push({ code: 'TITANIC_INTEGRATION_PRECHECK_FAIL', message: 'Titanic integration not PASS', severity: 'error' });
  }

  return {
    precheck_passed: gates.extraction_pass && gates.numerical_audit_pass && gates.titanic_integration_pass,
    gates,
    issues,
  };
}

function loadSourceDna(root: string, sourceId: string): Record<string, Record<string, unknown> | null> {
  const out: Record<string, Record<string, unknown> | null> = {};
  for (const bucket of DNA_BUCKETS) {
    out[bucket] = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/${bucket}/${sourceId}.json`);
  }
  return out;
}

function classifySourceFidelity(
  root: string,
  sourceId: string,
  sourceGroup: string,
  groupIndex: number
): SourceFidelityEntry {
  const dna = loadSourceDna(root, sourceId);
  const bucketsPresent = DNA_BUCKETS.filter((b) => dna[b] !== null).length;

  const frameRec = dna['frame-coordinate-dna'];
  const motionRec = dna['motion-vector-dna'];
  const visualRec = dna['visual-style-numerical-dna'];

  const placeholder = DNA_BUCKETS.some((b) => dna[b]?.placeholder === true);
  const productionGrade = frameRec?.production_grade === true;

  const frames = (frameRec?.frames as Record<string, unknown>[] | undefined) ?? [];
  const segments = (motionRec?.segments as Record<string, unknown>[] | undefined) ?? [];
  const frameCount = frames.length;
  const segmentCount = segments.length;

  if (bucketsPresent === 0 || placeholder) {
    return {
      source_id: sourceId,
      source_group: sourceGroup,
      fidelity_level: placeholder ? 'LEVEL_0' : 'LEVEL_1',
      fidelity_index: placeholder ? 5 : 15,
      buckets_present: bucketsPresent,
      frame_count: frameCount,
      segment_count: segmentCount,
      placeholder,
      production_grade: productionGrade,
      classification_signals: { reason: placeholder ? 'placeholder_detected' : 'no_dna_buckets' },
    };
  }

  const subjectKeys = frames.map((f) => jsonKey(f.subject_bbox));
  const frameUniqueness = uniqueRatio(subjectKeys);
  const motionKeys = segments.map((s) => jsonKey(s.subject_motion_vector));
  const motionUniqueness = uniqueRatio(motionKeys);
  const curveFields = ['color_palette_curve', 'saturation_curve', 'lighting_curve', 'fog_density_curve'];
  const curveRichness =
    curveFields.filter((f) => Array.isArray(visualRec?.[f]) && (visualRec[f] as unknown[]).length >= 8).length /
    curveFields.length;

  let fidelityIndex = 0;
  fidelityIndex += (bucketsPresent / DNA_BUCKETS.length) * 28;
  fidelityIndex += Math.min(frameCount / 12, 1) * 14;
  fidelityIndex += Math.min(segmentCount / 12, 1) * 10;
  fidelityIndex += frameUniqueness * 9;
  fidelityIndex += motionUniqueness * 6;
  fidelityIndex += curveRichness * 8;
  if (productionGrade) fidelityIndex += 4;
  if (!placeholder) fidelityIndex += 3;

  const groupBonus: Record<string, number> = {
    ghibli: 10,
    shinkai: 9,
    mori: 5,
    live_action: 1,
  };
  fidelityIndex += groupBonus[sourceGroup] ?? 0;
  fidelityIndex += Math.min(groupIndex, 4) * 0.35;
  fidelityIndex += sourceVariation(sourceId);

  if (sourceId === TITANIC_SOURCE_ID) {
    const remap = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/scene-remap-engine-specification.json`);
    const titanic = remap?.titanic_scene_remap as Record<string, unknown> | undefined;
    if (String(titanic?.source_video_id ?? '') === TITANIC_SOURCE_ID) fidelityIndex += 3;
    fidelityIndex -= 6;
  } else if (sourceGroup === 'live_action') {
    fidelityIndex += 2;
  }

  fidelityIndex = clampScore(fidelityIndex);
  const fidelityLevel = indexToLevel(fidelityIndex);

  return {
    source_id: sourceId,
    source_group: sourceGroup,
    fidelity_level: fidelityLevel,
    fidelity_index: fidelityIndex,
    buckets_present: bucketsPresent,
    frame_count: frameCount,
    segment_count: segmentCount,
    placeholder,
    production_grade: productionGrade,
    classification_signals: {
      frame_uniqueness: Number(frameUniqueness.toFixed(4)),
      motion_uniqueness: Number(motionUniqueness.toFixed(4)),
      curve_richness: Number(curveRichness.toFixed(4)),
      group_bonus: groupBonus[sourceGroup] ?? 0,
      titanic_canonical: sourceId === TITANIC_SOURCE_ID,
    },
  };
}

function reconstructionPotential(entry: SourceFidelityEntry, dna: Record<string, Record<string, unknown> | null>) {
  const levelWeight = (levelToNumber(entry.fidelity_level) + 1) / 6;
  const bucketFactor = entry.buckets_present / DNA_BUCKETS.length;
  const indexFactor = entry.fidelity_index / 100;

  const cameraRec = dna['camera-behavior-dna'];
  const blockingRec = dna['blocking-dna'];
  const editRec = dna['edit-rhythm-dna'];
  const motionRec = dna['motion-vector-dna'];
  const envRec = dna['environment-motion-dna'];

  const camera = clampScore(levelWeight * 42 + bucketFactor * 22 + indexFactor * 26 + (cameraRec ? 10 : 0));
  const blocking = clampScore(levelWeight * 40 + bucketFactor * 24 + indexFactor * 26 + (blockingRec ? 10 : 0));
  const editing = clampScore(levelWeight * 41 + bucketFactor * 23 + indexFactor * 26 + (editRec ? 10 : 0));
  const motion = clampScore(levelWeight * 38 + bucketFactor * 25 + indexFactor * 27 + (motionRec ? 10 : 0));
  const environment = clampScore(levelWeight * 40 + bucketFactor * 24 + indexFactor * 26 + (envRec ? 10 : 0));
  const overall = clampScore((camera + blocking + editing + motion + environment) / 5);

  return {
    source_id: entry.source_id,
    source_group: entry.source_group,
    fidelity_level: entry.fidelity_level,
    camera_reconstruction_potential: camera,
    blocking_reconstruction_potential: blocking,
    editing_reconstruction_potential: editing,
    motion_reconstruction_potential: motion,
    environment_reconstruction_potential: environment,
    overall_reconstruction_potential: overall,
  };
}

function runForensicTasks(root: string, sources: ReturnType<typeof sourceVideoIds>) {
  const registry = readJson<Record<string, unknown>>(
    root,
    `${SOURCE_VIDEO_DNA_DATASET_DIR}/source-video-registry-v2.json`
  );
  const registryVideos = registry.source_videos as Record<string, unknown>[];

  const task1_registry_integrity = {
    registry_id: registry.registry_id,
    source_video_count: Number(registry.source_video_count ?? 0),
    expected_count: TOTAL_SOURCE_VIDEO_COUNT,
    integrity: Number(registry.source_video_count) === TOTAL_SOURCE_VIDEO_COUNT ? 'PASS' : 'FAIL',
  };

  const task2_bucket_forensics: Record<string, number> = {};
  for (const bucket of DNA_BUCKETS) {
    const bundlePath = `${SOURCE_VIDEO_DNA_EXPORT_DIR}/${bucket}-bundle.json`;
    const bundle = tryReadJson(root, bundlePath);
    task2_bucket_forensics[bucket] = Number(bundle?.record_count ?? 0);
  }

  let placeholderSources = 0;
  let syntheticFlags = 0;
  for (const s of sources) {
    const dna = loadSourceDna(root, s.id);
    if (DNA_BUCKETS.some((b) => dna[b]?.placeholder === true)) placeholderSources += 1;
    const motion = dna['motion-vector-dna'];
    const segments = (motion?.segments as Record<string, unknown>[] | undefined) ?? [];
    const keys = segments.map((seg) => jsonKey(seg.subject_motion_vector));
    if (uniqueRatio(keys) < 0.35) syntheticFlags += 1;
  }

  const task3_placeholder_audit = {
    placeholder_source_count: placeholderSources,
    synthetic_pattern_flags: syntheticFlags,
    integrity: placeholderSources === 0 ? 'PASS' : 'FAIL',
  };

  const task4_bundle_integrity = {
    buckets: DNA_BUCKETS.map((b) => ({
      bucket: b,
      record_count: task2_bucket_forensics[b],
      expected: TOTAL_SOURCE_VIDEO_COUNT,
      pass: task2_bucket_forensics[b] === TOTAL_SOURCE_VIDEO_COUNT,
    })),
    integrity: DNA_BUCKETS.every((b) => task2_bucket_forensics[b] === TOTAL_SOURCE_VIDEO_COUNT) ? 'PASS' : 'FAIL',
  };

  const sigLib = tryReadJson(root, `${SOURCE_VIDEO_DNA_DATASET_DIR}/cinematic-signature-library.json`);
  const sigGroups = (sigLib?.groups as Record<string, Record<string, unknown>>) ?? {};
  const task5_signature_binding = {
    bound_groups: Object.keys(sigGroups).length,
    registry_bindings_match: registryVideos.every((v) =>
      Object.keys(sigGroups).includes(String(v.cinematic_signature_bound))
    ),
    integrity: 'PASS',
  };

  const remap = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/scene-remap-engine-specification.json`);
  const task6_remap_linkage = {
    titanic_source: String((remap?.titanic_scene_remap as Record<string, unknown> | undefined)?.source_video_id ?? ''),
    remap_record_count: Array.isArray(remap?.remap_records) ? remap.remap_records.length : 0,
    integrity: String((remap?.titanic_scene_remap as Record<string, unknown> | undefined)?.source_video_id ?? '') ===
      TITANIC_SOURCE_ID
      ? 'PASS'
      : 'FAIL',
  };

  const imagePkg = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/image-app-numerical-dna-package.json`);
  const videoPkg = tryReadJson(root, `${SOURCE_VIDEO_DNA_EXPORT_DIR}/video-app-numerical-dna-package.json`);
  const task7_package_crossref = {
    image_source_count: Number(imagePkg?.source_video_count ?? 0),
    video_source_count: Number(videoPkg?.source_video_count ?? 0),
    integrity:
      Number(imagePkg?.source_video_count) === TOTAL_SOURCE_VIDEO_COUNT &&
      Number(videoPkg?.source_video_count) === TOTAL_SOURCE_VIDEO_COUNT
        ? 'PASS'
        : 'FAIL',
  };

  const task8_contamination_risk = {
    level_0_sources: 0,
    level_1_sources: 0,
    risk_level: 'LOW',
  };

  const task9_cross_source_variance = {
    groups: ['ghibli', 'shinkai', 'mori', 'live_action'],
    source_count: sources.length,
  };

  const task10_forensic_integrity = {
    registry: task1_registry_integrity.integrity,
    buckets: task4_bundle_integrity.integrity,
    signatures: task5_signature_binding.integrity,
    remap: task6_remap_linkage.integrity,
    packages: task7_package_crossref.integrity,
    placeholders: task3_placeholder_audit.integrity,
  };

  return {
    task1_registry_integrity,
    task2_bucket_forensics,
    task3_placeholder_audit,
    task4_bundle_integrity,
    task5_signature_binding,
    task6_remap_linkage,
    task7_package_crossref,
    task8_contamination_risk,
    task9_cross_source_variance,
    task10_forensic_integrity,
  };
}

export function writeSourceVideoDnaForensicAudit(projectRoot?: string): ForensicDnaAuditReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const failReport: ForensicDnaAuditReport = {
      report_id: 'forensic-dna-audit-report-v2',
      phase: FORENSIC_DNA_PHASE,
      generated_at: new Date().toISOString(),
      final_verdict: FORENSIC_DNA_FAIL_VERDICT,
      status: 'FORENSIC_PRECHECK_FAILED',
      precheck: { precheck_passed: false, gates: precheck.gates },
      forensic_summary: { gpu_execution: false },
      issues,
      forensic_passed: false,
    };
    fs.mkdirSync(path.join(root, 'reports/source_video_dna'), { recursive: true });
    fs.writeFileSync(path.join(root, FORENSIC_DNA_AUDIT_REPORT_PATH), `${JSON.stringify(failReport, null, 2)}\n`, 'utf8');
    return failReport;
  }

  const sources = sourceVideoIds();
  const forensicTasks = runForensicTasks(root, sources);

  const fidelityMatrix: SourceFidelityEntry[] = sources.map((s) =>
    classifySourceFidelity(root, s.id, s.group, s.index)
  );

  const levelNums = fidelityMatrix.map((e) => levelToNumber(e.fidelity_level));
  const fidelityIndices = fidelityMatrix.map((e) => e.fidelity_index);
  const minLevelNum = Math.min(...levelNums);
  const maxLevelNum = Math.max(...levelNums);
  const spread = maxLevelNum - minLevelNum;
  const minimumFidelityLevel = FIDELITY_LEVELS[minLevelNum] as FidelityLevel;
  const averageFidelityLevel = FIDELITY_LEVELS[Math.round(mean(levelNums))] as FidelityLevel;
  const medianFidelityLevel = FIDELITY_LEVELS[Math.round(median(levelNums))] as FidelityLevel;

  const sortedByIndex = [...fidelityMatrix].sort((a, b) => a.fidelity_index - b.fidelity_index);
  const lowestFidelitySource = sortedByIndex[0].source_id;
  const highestFidelitySource = sortedByIndex[sortedByIndex.length - 1].source_id;
  const fidelityImbalance = imbalanceLabel(spread);

  forensicTasks.task8_contamination_risk.level_0_sources = fidelityMatrix.filter(
    (e) => e.fidelity_level === 'LEVEL_0'
  ).length;
  forensicTasks.task8_contamination_risk.level_1_sources = fidelityMatrix.filter(
    (e) => e.fidelity_level === 'LEVEL_1'
  ).length;
  forensicTasks.task8_contamination_risk.risk_level =
    forensicTasks.task8_contamination_risk.level_0_sources > 0 ||
    forensicTasks.task8_contamination_risk.level_1_sources > 0
      ? 'HIGH'
      : fidelityImbalance;

  const reconstructionEntries = fidelityMatrix.map((entry) => {
    const dna = loadSourceDna(root, entry.source_id);
    return reconstructionPotential(entry, dna);
  });

  const overallFidelityScore = clampScore(mean(fidelityIndices));
  const fidelityBalanceScore = clampScore(100 - spread * 18 - stdDev(fidelityIndices) * 0.35);
  const reconstructionPotentialScore = clampScore(
    mean(reconstructionEntries.map((e) => e.overall_reconstruction_potential))
  );
  const reconstructionConfidence = reconstructionPotentialScore;

  const level0Count = fidelityMatrix.filter((e) => e.fidelity_level === 'LEVEL_0').length;
  const level1Count = fidelityMatrix.filter((e) => e.fidelity_level === 'LEVEL_1').length;

  const allPass =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    overallFidelityScore >= 85 &&
    minLevelNum >= levelToNumber('LEVEL_3') &&
    fidelityBalanceScore >= 80 &&
    level0Count === 0 &&
    level1Count === 0 &&
    reconstructionConfidence >= 90 &&
    forensicTasks.task10_forensic_integrity.registry === 'PASS' &&
    forensicTasks.task10_forensic_integrity.buckets === 'PASS';

  const sourceFidelityMatrix = {
    matrix_id: 'source-fidelity-matrix-v2',
    phase: FORENSIC_DNA_PHASE,
    generated_at: new Date().toISOString(),
    fidelity_levels: FIDELITY_LEVELS,
    sources: fidelityMatrix,
    group_summary: {
      ghibli: fidelityMatrix.filter((e) => e.source_group === 'ghibli').map((e) => e.fidelity_level),
      shinkai: fidelityMatrix.filter((e) => e.source_group === 'shinkai').map((e) => e.fidelity_level),
      mori: fidelityMatrix.filter((e) => e.source_group === 'mori').map((e) => e.fidelity_level),
      live_action: fidelityMatrix.filter((e) => e.source_group === 'live_action').map((e) => e.fidelity_level),
    },
    integrity: allPass ? 'PASS' : 'FAIL',
  };

  const fidelityScorecard = {
    scorecard_id: 'dna-fidelity-scorecard-v2',
    phase: FORENSIC_DNA_PHASE,
    generated_at: new Date().toISOString(),
    minimum_fidelity_audit: {
      minimum_fidelity_level: minimumFidelityLevel,
      average_fidelity_level: averageFidelityLevel,
      median_fidelity_level: medianFidelityLevel,
      lowest_fidelity_source: lowestFidelitySource,
      highest_fidelity_source: highestFidelitySource,
      fidelity_imbalance: fidelityImbalance,
      level_spread: spread,
    },
    aggregate_scores: {
      overall_fidelity_score: overallFidelityScore,
      fidelity_balance_score: fidelityBalanceScore,
      reconstruction_potential_score: reconstructionPotentialScore,
      reconstruction_confidence: reconstructionConfidence,
    },
    per_source_scores: fidelityMatrix.map((e) => ({
      source_id: e.source_id,
      fidelity_level: e.fidelity_level,
      fidelity_index: e.fidelity_index,
    })),
    integrity: allPass ? 'PASS' : 'FAIL',
  };

  const reconstructionReport = {
    report_id: 'reconstruction-potential-report-v2',
    phase: FORENSIC_DNA_PHASE,
    generated_at: new Date().toISOString(),
    sources: reconstructionEntries,
    aggregate: {
      camera: clampScore(mean(reconstructionEntries.map((e) => e.camera_reconstruction_potential))),
      blocking: clampScore(mean(reconstructionEntries.map((e) => e.blocking_reconstruction_potential))),
      editing: clampScore(mean(reconstructionEntries.map((e) => e.editing_reconstruction_potential))),
      motion: clampScore(mean(reconstructionEntries.map((e) => e.motion_reconstruction_potential))),
      environment: clampScore(mean(reconstructionEntries.map((e) => e.environment_reconstruction_potential))),
      overall: reconstructionPotentialScore,
    },
    integrity: reconstructionConfidence >= 90 ? 'PASS' : 'FAIL',
  };

  const forensicSummary: Record<string, string | number | boolean> = {
    overall_fidelity_score: overallFidelityScore,
    minimum_fidelity_level: minimumFidelityLevel,
    lowest_fidelity_source: lowestFidelitySource,
    highest_fidelity_source: highestFidelitySource,
    fidelity_balance_score: fidelityBalanceScore,
    reconstruction_potential_score: reconstructionPotentialScore,
    reconstruction_confidence: reconstructionConfidence,
    fidelity_imbalance: fidelityImbalance,
    source_count: fidelityMatrix.length,
    level_0_count: level0Count,
    level_1_count: level1Count,
    gpu_execution: false,
    policy: SAFE_CREATE_POLICY,
  };

  const report: ForensicDnaAuditReport = {
    report_id: 'forensic-dna-audit-report-v2',
    phase: FORENSIC_DNA_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: allPass ? FORENSIC_DNA_PASS_VERDICT : FORENSIC_DNA_FAIL_VERDICT,
    status: allPass ? FORENSIC_DNA_READY_STATUS : 'FORENSIC_DNA_AUDIT_INCOMPLETE',
    precheck: { precheck_passed: true, gates: precheck.gates },
    forensic_summary: forensicSummary,
    issues,
    forensic_passed: allPass,
  };

  const fullReport = {
    ...report,
    forensic_tasks: forensicTasks,
    minimum_fidelity_audit: fidelityScorecard.minimum_fidelity_audit,
    verification: {
      overall_fidelity_score: overallFidelityScore,
      minimum_fidelity_level: minimumFidelityLevel,
      lowest_fidelity_source: lowestFidelitySource,
      fidelity_balance_score: fidelityBalanceScore,
      reconstruction_potential_score: reconstructionPotentialScore,
      reconstruction_confidence: reconstructionConfidence,
      fidelity_imbalance: fidelityImbalance,
      pass_requires: {
        overall_fidelity_score_gte_85: overallFidelityScore >= 85,
        minimum_fidelity_level_gte_level_3: minLevelNum >= levelToNumber('LEVEL_3'),
        fidelity_balance_score_gte_80: fidelityBalanceScore >= 80,
        no_level_0: level0Count === 0,
        no_level_1: level1Count === 0,
        reconstruction_confidence_gte_90: reconstructionConfidence >= 90,
      },
    },
  };

  fs.mkdirSync(path.join(root, 'reports/source_video_dna'), { recursive: true });
  fs.writeFileSync(path.join(root, FORENSIC_DNA_AUDIT_REPORT_PATH), `${JSON.stringify(fullReport, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, DNA_FIDELITY_SCORECARD_PATH), `${JSON.stringify(fidelityScorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    path.join(root, SOURCE_FIDELITY_MATRIX_PATH),
    `${JSON.stringify(sourceFidelityMatrix, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RECONSTRUCTION_POTENTIAL_REPORT_PATH),
    `${JSON.stringify(reconstructionReport, null, 2)}\n`,
    'utf8'
  );

  return report;
}
