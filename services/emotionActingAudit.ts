import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  writeGovernedReport,
} from './exportGovernance.js';
import { syncImageAppLatestUploadBundle } from './imageAppExportGovernance.js';
import {
  EMOTION_ACTING_ADAPTER_PATH,
  EMOTION_ACTING_INDEX_PATH,
  EMOTION_ACTING_LIBRARY_PATH,
  INITIAL_EMOTION_IDS,
  REQUIRED_EMOTION_FIELDS,
  REQUIRED_EMOTION_TOKENS,
  buildEmotionActingAdapterFromLibrary,
  loadEmotionActingAdapter,
  loadEmotionActingIndex,
  loadEmotionActingLibrary,
  resolveEmotionActingById,
  type EmotionActingRecord,
} from './emotionActing.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SHOT_GRAMMAR_LATEST_ADAPTER_PATH =
  'exports/image_app/latest/shot-grammar-adapter.json' as const;

export type EmotionActingVerdict =
  | 'PASS_EMOTION_ACTING_DNA_V1'
  | 'NEEDS_REFINEMENT'
  | 'FAIL_PRECHECK'
  | 'FAIL_EXPORT_NOT_GENERATED';

export type EmotionActingViolation = {
  code: string;
  message: string;
  field?: string;
};

export type EmotionActingAuditReport = {
  report_type: 'emotion_acting_adapter_audit';
  report_version: 'v1';
  phase: 'PHASE-EDA-001';
  generated_at: string;
  emotion_count: number;
  target_emotion_count: number;
  validation: {
    library_exists: boolean;
    index_exists: boolean;
    adapter_exists: boolean;
    adapter_synced_to_latest: boolean;
    required_emotions_present: boolean;
    required_tokens_exported: boolean;
    adapter_chain_complete: boolean;
    core_forbidden_rules_present: boolean;
    precheck_pass: boolean;
  };
  export_path: typeof EMOTION_ACTING_ADAPTER_PATH;
  report_path: string;
  library_path: typeof EMOTION_ACTING_LIBRARY_PATH;
  index_path: typeof EMOTION_ACTING_INDEX_PATH;
  final_verdict: EmotionActingVerdict;
  violations: readonly EmotionActingViolation[];
  next_phases: readonly string[];
};

const REPORT_FILE = 'emotion-acting-adapter-report.json';

const CORE_FORBIDDEN_RULES: Record<string, readonly string[]> = {
  hope: ['collapsed_posture', 'avoidance_gaze'],
  loneliness: ['confident_open_chest', 'high_energy_motion'],
  determination: ['passive_idle_pose'],
};

function readJson<T>(projectRoot: string, relativePath: string): T | null {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function readScorecardVerdict(relativePath: string, root: string): string | null {
  const doc = readJson<{ final_verdict?: string }>(root, relativePath);
  return doc?.final_verdict ?? null;
}

export function runEmotionActingPrecheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  if (!fs.existsSync(path.join(root, SHOT_GRAMMAR_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${SHOT_GRAMMAR_LATEST_ADAPTER_PATH}`);
  }

  const rkb004 = readScorecardVerdict('datasets/render_feedback/RKB-004_SCORECARD.json', root);
  if (rkb004 !== 'PASS_RKB_004_INDOOR_LOCATION_VALIDATION') {
    violations.push(`Expected PASS_RKB_004_INDOOR_LOCATION_VALIDATION, got ${rkb004 ?? 'missing'}`);
  }

  const rkb005 = readScorecardVerdict('datasets/render_feedback/RKB-005_SCORECARD.json', root);
  if (rkb005 !== 'PASS_RKB_005_LIGHTING_VALIDATION') {
    violations.push(`Expected PASS_RKB_005_LIGHTING_VALIDATION, got ${rkb005 ?? 'missing'}`);
  }

  const rkb006 = readScorecardVerdict('datasets/render_feedback/RKB-006_SCORECARD.json', root);
  if (rkb006 !== 'PASS_RKB_006_COVERAGE_VALIDATION') {
    violations.push(`Expected PASS_RKB_006_COVERAGE_VALIDATION, got ${rkb006 ?? 'missing'}`);
  }

  return { pass: violations.length === 0, violations };
}

function hasRequiredFields(emotion: EmotionActingRecord): boolean {
  return REQUIRED_EMOTION_FIELDS.every((field) => {
    const value = emotion[field as keyof EmotionActingRecord];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  });
}

function hasCoreForbiddenRules(emotion: EmotionActingRecord): boolean {
  const required = CORE_FORBIDDEN_RULES[emotion.emotion_id];
  if (!required) return true;
  return required.every((rule) => emotion.forbidden_behaviors.includes(rule));
}

function entryExportsRequiredTokens(
  entry: ReturnType<typeof loadEmotionActingAdapter>['emotion_to_profile_map'][number]
): boolean {
  const tokenBlob = [
    ...entry.acting_tokens,
    ...entry.render_payload.acting_tokens,
  ].join('\n');

  return REQUIRED_EMOTION_TOKENS.every((prefix) => tokenBlob.includes(prefix));
}

function auditEmotionActingSystem(projectRoot?: string): EmotionActingAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const violations: EmotionActingViolation[] = [];
  let jsonParseResult: 'valid' | 'invalid' = 'valid';

  const precheck = runEmotionActingPrecheck(root);
  if (!precheck.pass) {
    for (const message of precheck.violations) {
      violations.push({ code: 'FAIL_PRECHECK', message });
    }
    return finalizeReport(violations, 'FAIL_PRECHECK', 0);
  }

  let library: ReturnType<typeof loadEmotionActingLibrary>;
  let index: ReturnType<typeof loadEmotionActingIndex>;

  try {
    library = loadEmotionActingLibrary(root);
    index = loadEmotionActingIndex(root);
  } catch (error) {
    jsonParseResult = 'invalid';
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: error instanceof Error ? error.message : 'Emotion acting JSON parse failed',
    });
    return finalizeReport(violations, 'FAIL_EXPORT_NOT_GENERATED', 0, jsonParseResult);
  }

  const emotionIds = new Set<string>();
  let duplicateIds = 0;

  for (const emotion of library.emotions) {
    if (emotionIds.has(emotion.emotion_id)) duplicateIds += 1;
    emotionIds.add(emotion.emotion_id);

    if (!hasRequiredFields(emotion)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Emotion ${emotion.emotion_id} missing required schema fields`,
        field: emotion.emotion_id,
      });
    }
    if (!hasCoreForbiddenRules(emotion)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Emotion ${emotion.emotion_id} missing core forbidden behaviors`,
        field: emotion.emotion_id,
      });
    }
  }

  for (const target of INITIAL_EMOTION_IDS) {
    if (!emotionIds.has(target)) {
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Initial emotion missing: ${target}`,
        field: target,
      });
    }
  }

  if (duplicateIds > 0) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Duplicate emotion_id entries in library',
    });
  }

  if (index.entries.length !== library.emotions.length) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'Index entry count must match library emotion count',
    });
  }

  const rebuiltAdapter = buildEmotionActingAdapterFromLibrary(library, index);
  publishGovernedExport({
    projectRoot: root,
    relativePath: EMOTION_ACTING_ADAPTER_PATH,
    datasetName: 'emotion-acting-adapter',
    datasetVersion: 'v1',
    datasetType: 'emotion_acting_image_adapter',
    content: rebuiltAdapter,
    archivePrevious: false,
  });

  syncImageAppLatestUploadBundle(root);

  const latestAdapterPath = path.join(root, 'exports/image_app/latest/emotion-acting-adapter.json');
  const adaptersAdapterPath = path.join(root, EMOTION_ACTING_ADAPTER_PATH);
  const adapterSynced =
    fs.existsSync(latestAdapterPath) &&
    fs.existsSync(adaptersAdapterPath) &&
    fs.readFileSync(latestAdapterPath, 'utf8') === fs.readFileSync(adaptersAdapterPath, 'utf8');

  if (!adapterSynced) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'emotion-acting-adapter.json must be synced to exports/image_app/latest/',
      field: 'latest/emotion-acting-adapter.json',
    });
  }

  const adapter = loadEmotionActingAdapter(root);
  const tokensExported = adapter.emotion_to_profile_map.every(entryExportsRequiredTokens);
  if (!tokensExported) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message:
        'emotion_to_profile_map entries must export emotion-id, eye-behavior, gaze-pattern, mouth-behavior, body-tension, hand-behavior, movement-energy tokens',
      field: 'emotion_to_profile_map',
    });
  }

  let resolverOk = true;
  for (const emotionId of INITIAL_EMOTION_IDS) {
    const resolution = resolveEmotionActingById(emotionId, 'close', root);
    if (!resolution) {
      resolverOk = false;
      violations.push({
        code: 'NEEDS_REFINEMENT',
        message: `Resolver failed for emotion_id ${emotionId}`,
        field: emotionId,
      });
    }
  }

  const adapterChainComplete =
    Array.isArray(rebuiltAdapter.adapter_responsibility_chain) &&
    (rebuiltAdapter.adapter_responsibility_chain as string[]).length === 4;

  if (!adapterChainComplete) {
    violations.push({
      code: 'NEEDS_REFINEMENT',
      message: 'adapter_responsibility_chain must contain four resolution steps',
    });
  }

  const requiredEmotionsPresent = INITIAL_EMOTION_IDS.every((id) => emotionIds.has(id));
  const forbiddenRulesOk = !violations.some((v) =>
    v.message.includes('core forbidden behaviors')
  );

  const verdict: EmotionActingVerdict =
    violations.length === 0 ? 'PASS_EMOTION_ACTING_DNA_V1' : 'NEEDS_REFINEMENT';

  const report = finalizeReport(violations, verdict, library.emotions.length, jsonParseResult, {
    library_exists: true,
    index_exists: true,
    adapter_exists: fs.existsSync(path.join(root, EMOTION_ACTING_ADAPTER_PATH)),
    adapter_synced_to_latest: adapterSynced,
    required_emotions_present: requiredEmotionsPresent,
    required_tokens_exported: tokensExported && resolverOk,
    adapter_chain_complete: adapterChainComplete,
    core_forbidden_rules_present: forbiddenRulesOk,
    precheck_pass: precheck.pass,
  });

  writeGovernedReport(root, IMAGE_APP_REPORTS_DIR, REPORT_FILE, report);
  return report;
}

function finalizeReport(
  violations: EmotionActingViolation[],
  verdict: EmotionActingVerdict,
  emotionCount: number,
  _jsonParseResult: 'valid' | 'invalid' = 'valid',
  validation?: EmotionActingAuditReport['validation']
): EmotionActingAuditReport {
  return {
    report_type: 'emotion_acting_adapter_audit',
    report_version: 'v1',
    phase: 'PHASE-EDA-001',
    generated_at: new Date().toISOString(),
    emotion_count: emotionCount,
    target_emotion_count: INITIAL_EMOTION_IDS.length,
    validation: {
      library_exists: validation?.library_exists ?? false,
      index_exists: validation?.index_exists ?? false,
      adapter_exists: validation?.adapter_exists ?? false,
      adapter_synced_to_latest: validation?.adapter_synced_to_latest ?? false,
      required_emotions_present: validation?.required_emotions_present ?? false,
      required_tokens_exported: validation?.required_tokens_exported ?? false,
      adapter_chain_complete: validation?.adapter_chain_complete ?? false,
      core_forbidden_rules_present: validation?.core_forbidden_rules_present ?? false,
      precheck_pass: validation?.precheck_pass ?? false,
    },
    export_path: EMOTION_ACTING_ADAPTER_PATH,
    report_path: `${IMAGE_APP_REPORTS_DIR}/${REPORT_FILE}`,
    library_path: EMOTION_ACTING_LIBRARY_PATH,
    index_path: EMOTION_ACTING_INDEX_PATH,
    final_verdict: verdict,
    violations: Object.freeze([...violations]),
    next_phases: Object.freeze(['RKB-007 EMOTION_ACTING_VALIDATION', 'MV-DATASET-001 INSTRUMENTAL_MV_DATASET_V1']),
  };
}

export function runEmotionActingAudit(projectRoot?: string): EmotionActingAuditReport {
  return auditEmotionActingSystem(projectRoot);
}
