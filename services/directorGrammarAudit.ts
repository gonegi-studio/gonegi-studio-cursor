import fs from 'node:fs';
import path from 'node:path';
import {
  getImageActingCameraById,
} from './imageActingCameraGrammarDefinitions.js';
import {
  getFiveShotBundleSeedLibrary,
} from './fiveShotBundleDefinitions.js';
import {
  buildStoryDrivenImageAppExport,
  getAllBundledStoryboardIds,
  STORY_DRIVEN_IMAGE_APP_EXPORT_ID,
  STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT,
} from './storyDrivenImageAppExport.js';
import {
  ANTI_FLAT_SCENE_RULES_BASE,
  buildDirectorGrammarPreview,
  DIRECTOR_GRAMMAR_SEED_COUNT,
  DIRECTOR_GRAMMAR_SONG_MASTER_ID,
  DIRECTOR_GRAMMAR_VERSION,
  findDuplicateDirectorGrammarIds,
  getDirectorGrammarSeedLibrary,
  NARRATIVE_QUALITY_GATE_LAYER_VERSION,
  NARRATIVE_QUALITY_GATE_REPORT_PATH,
  REQUIRED_DIRECTOR_GRAMMAR_FIELDS,
  type DirectorGrammarEntry,
  type DirectorGrammarPreview,
  type RequiredDirectorGrammarField,
} from './directorGrammarDefinitions.js';

export type DirectorGrammarAuditResult =
  | 'PASS'
  | 'FAIL_DIRECTOR_GRAMMAR_COMPLETENESS'
  | 'FAIL_STORY_EXPORT_REFERENCE'
  | 'FAIL_BUNDLE_REFERENCE'
  | 'FAIL_ACTING_CAMERA_REFERENCE'
  | 'FAIL_DIRECTORIAL_INTENT'
  | 'FAIL_CAMERA_REASON'
  | 'FAIL_BLOCKING_REASON'
  | 'FAIL_EMOTIONAL_SUBTEXT'
  | 'FAIL_CUT_PURPOSE'
  | 'FAIL_FLAT_SCENE_GUARD';

export interface DirectorGrammarViolation {
  code: DirectorGrammarAuditResult;
  message: string;
  field?: string;
}

export interface DirectorGrammarReport {
  auditTimestamp: string;
  auditResult: DirectorGrammarAuditResult;
  layer_version: typeof DIRECTOR_GRAMMAR_VERSION;
  violations: DirectorGrammarViolation[];
}

const PREVIEW_FILE = 'director-grammar-preview.json';
const REPORT_FILE = 'director-grammar-report.json';

const MIN_DIRECTOR_FIELD_LENGTH = 40;

const FLAT_DIRECTOR_PATTERNS = [
  'show the scene',
  'generic shot',
  'standard framing',
  'no subtext',
  'placeholder',
] as const;

interface NarrativeQualityGateReportShape {
  auditResult: string;
  layer_version: string;
  scene_count: number;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isNonEmptyString(item))
  );
}

function loadNarrativeQualityGateReport(projectRoot: string): NarrativeQualityGateReportShape | null {
  const reportPath = path.join(projectRoot, NARRATIVE_QUALITY_GATE_REPORT_PATH);
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, 'utf8')) as NarrativeQualityGateReportShape;
}

function isSubstantiveDirectorField(value: string): boolean {
  if (value.trim().length < MIN_DIRECTOR_FIELD_LENGTH) return false;
  const normalized = value.toLowerCase();
  return !FLAT_DIRECTOR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function auditDirectorGrammarCompleteness(
  entries: DirectorGrammarEntry[]
): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];

  if (entries.length !== DIRECTOR_GRAMMAR_SEED_COUNT) {
    violations.push({
      code: 'FAIL_DIRECTOR_GRAMMAR_COMPLETENESS',
      message: `Director grammar layer must contain exactly ${DIRECTOR_GRAMMAR_SEED_COUNT} entries`,
      field: 'seed_director_grammar.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_DIRECTOR_GRAMMAR_FIELDS) {
      const value = entry[field as RequiredDirectorGrammarField];
      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_DIRECTOR_GRAMMAR_COMPLETENESS',
          message: `Missing required field ${field} on ${entry.director_grammar_id}`,
          field: `${entry.director_grammar_id}.${field}`,
        });
        continue;
      }

      if (field === 'visual_motif_usage' || field === 'anti_flat_scene_rules' || field === 'keywords') {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_DIRECTOR_GRAMMAR_COMPLETENESS',
            message: `${field} must be a non-empty string array on ${entry.director_grammar_id}`,
            field: `${entry.director_grammar_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'scene_order') {
        if (typeof value !== 'number' || value < 1) {
          violations.push({
            code: 'FAIL_DIRECTOR_GRAMMAR_COMPLETENESS',
            message: `scene_order must be a positive number on ${entry.director_grammar_id}`,
            field: `${entry.director_grammar_id}.scene_order`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_DIRECTOR_GRAMMAR_COMPLETENESS',
          message: `${field} must be a non-empty string on ${entry.director_grammar_id}`,
          field: `${entry.director_grammar_id}.${field}`,
        });
      }
    }
  }

  const duplicates = findDuplicateDirectorGrammarIds(entries.map((entry) => entry.director_grammar_id));
  for (const duplicate of duplicates) {
    violations.push({
      code: 'FAIL_DIRECTOR_GRAMMAR_COMPLETENESS',
      message: `Duplicate director_grammar_id ${duplicate}`,
      field: 'director_grammar_id',
    });
  }

  return violations;
}

function auditStoryExportReference(
  projectRoot: string,
  entries: DirectorGrammarEntry[]
): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];
  const gateReport = loadNarrativeQualityGateReport(projectRoot);

  if (!gateReport) {
    violations.push({
      code: 'FAIL_STORY_EXPORT_REFERENCE',
      message: `Missing narrative quality gate report at ${NARRATIVE_QUALITY_GATE_REPORT_PATH}`,
      field: 'narrative_quality_gate_report',
    });
    return violations;
  }

  if (gateReport.auditResult !== 'PASS') {
    violations.push({
      code: 'FAIL_STORY_EXPORT_REFERENCE',
      message: 'Narrative quality gate must pass before director grammar',
      field: 'narrative_quality_gate_report.auditResult',
    });
  }

  if (gateReport.layer_version !== NARRATIVE_QUALITY_GATE_LAYER_VERSION) {
    violations.push({
      code: 'FAIL_STORY_EXPORT_REFERENCE',
      message: `Expected narrative quality gate version ${NARRATIVE_QUALITY_GATE_LAYER_VERSION}`,
      field: 'narrative_quality_gate_report.layer_version',
    });
  }

  const storyExport = buildStoryDrivenImageAppExport();
  if (storyExport.export_id !== STORY_DRIVEN_IMAGE_APP_EXPORT_ID) {
    violations.push({
      code: 'FAIL_STORY_EXPORT_REFERENCE',
      message: `Story driven export id must be ${STORY_DRIVEN_IMAGE_APP_EXPORT_ID}`,
      field: 'story_driven_export.export_id',
    });
  }

  if (!storyExport.story_engine_ready) {
    violations.push({
      code: 'FAIL_STORY_EXPORT_REFERENCE',
      message: 'Story driven export must be story_engine_ready',
      field: 'story_driven_export.story_engine_ready',
    });
  }

  for (const entry of entries) {
    const payload = storyExport.image_generation_payloads.find(
      (item) => item.storyboard_id === entry.storyboard_id
    );
    if (!payload) {
      violations.push({
        code: 'FAIL_STORY_EXPORT_REFERENCE',
        message: `Missing story driven payload for ${entry.storyboard_id}`,
        field: `${entry.director_grammar_id}.storyboard_id`,
      });
      continue;
    }

    if (!entry.keywords.includes(`story-driven-export:${STORY_DRIVEN_IMAGE_APP_EXPORT_ID}`)) {
      violations.push({
        code: 'FAIL_STORY_EXPORT_REFERENCE',
        message: `Keywords must reference story driven export on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.keywords`,
      });
    }

    if (!entry.keywords.includes(`payload:${payload.payload_id}`)) {
      violations.push({
        code: 'FAIL_STORY_EXPORT_REFERENCE',
        message: `Keywords must reference payload ${payload.payload_id}`,
        field: `${entry.director_grammar_id}.keywords`,
      });
    }

    if (!entry.keywords.includes(`narrative-quality-gate:${NARRATIVE_QUALITY_GATE_LAYER_VERSION}`)) {
      violations.push({
        code: 'FAIL_STORY_EXPORT_REFERENCE',
        message: 'Keywords must reference narrative quality gate version',
        field: `${entry.director_grammar_id}.keywords`,
      });
    }
  }

  return violations;
}

function auditBundleReference(entries: DirectorGrammarEntry[]): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];
  const bundles = getFiveShotBundleSeedLibrary();
  const bundleById = new Map(bundles.map((bundle) => [bundle.bundle_id, bundle] as const));
  const bundledStoryboardIds = new Set(getAllBundledStoryboardIds());

  for (const entry of entries) {
    const bundle = bundleById.get(entry.bundle_id);
    if (!bundle) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `Unknown bundle ${entry.bundle_id} on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.bundle_id`,
      });
      continue;
    }

    if (!bundle.scene_ids.includes(entry.storyboard_id)) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `${entry.storyboard_id} is not in bundle ${entry.bundle_id}`,
        field: `${entry.director_grammar_id}.storyboard_id`,
      });
    }

    if (!entry.keywords.some((keyword) => keyword === `bundle:${entry.bundle_id}`)) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `Keywords must reference bundle ${entry.bundle_id}`,
        field: `${entry.director_grammar_id}.keywords`,
      });
    }

    if (!entry.keywords.some((keyword) => keyword.startsWith('bundle-role:'))) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `Keywords must declare bundle role on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.keywords`,
      });
    }
  }

  for (const storyboardId of bundledStoryboardIds) {
    if (!entries.some((entry) => entry.storyboard_id === storyboardId)) {
      violations.push({
        code: 'FAIL_BUNDLE_REFERENCE',
        message: `Missing director grammar for bundled storyboard ${storyboardId}`,
        field: 'seed_director_grammar',
      });
    }
  }

  return violations;
}

function auditActingCameraReference(entries: DirectorGrammarEntry[]): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];

  for (const entry of entries) {
    const expectedActingId = `IAC-${entry.storyboard_id}`;
    const actingKeyword = entry.keywords.find((keyword) => keyword.startsWith('acting-camera:'));
    const actingId = actingKeyword?.slice('acting-camera:'.length);

    if (actingId !== expectedActingId) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `acting-camera keyword must be ${expectedActingId} on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.keywords`,
      });
    }

    const acting = getImageActingCameraById(expectedActingId);
    if (!acting) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `Missing acting camera grammar ${expectedActingId}`,
        field: `${entry.director_grammar_id}.keywords`,
      });
      continue;
    }

    if (acting.scene_order !== entry.scene_order) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `scene_order mismatch with acting camera on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.scene_order`,
      });
    }

    if (!entry.camera_reason.includes(acting.camera_angle)) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `camera_reason must reference acting camera angle on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.camera_reason`,
      });
    }

    if (!entry.blocking_reason.includes(acting.subject_blocking)) {
      violations.push({
        code: 'FAIL_ACTING_CAMERA_REFERENCE',
        message: `blocking_reason must reference acting subject_blocking on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.blocking_reason`,
      });
    }
  }

  return violations;
}

function auditDirectorialIntent(entries: DirectorGrammarEntry[]): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];
  for (const entry of entries) {
    if (!isSubstantiveDirectorField(entry.directorial_intent)) {
      violations.push({
        code: 'FAIL_DIRECTORIAL_INTENT',
        message: `directorial_intent lacks master-shot specificity on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.directorial_intent`,
      });
    }
  }
  return violations;
}

function auditCameraReason(entries: DirectorGrammarEntry[]): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];
  for (const entry of entries) {
    if (!isSubstantiveDirectorField(entry.camera_reason)) {
      violations.push({
        code: 'FAIL_CAMERA_REASON',
        message: `camera_reason lacks dramatic justification on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.camera_reason`,
      });
    }
  }
  return violations;
}

function auditBlockingReason(entries: DirectorGrammarEntry[]): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];
  for (const entry of entries) {
    if (!isSubstantiveDirectorField(entry.blocking_reason)) {
      violations.push({
        code: 'FAIL_BLOCKING_REASON',
        message: `blocking_reason lacks spatial motivation on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.blocking_reason`,
      });
    }
  }
  return violations;
}

function auditEmotionalSubtext(entries: DirectorGrammarEntry[]): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];
  for (const entry of entries) {
    if (!isSubstantiveDirectorField(entry.emotional_subtext)) {
      violations.push({
        code: 'FAIL_EMOTIONAL_SUBTEXT',
        message: `emotional_subtext lacks beneath-the-surface reading on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.emotional_subtext`,
      });
    }
    if (!entry.emotional_subtext.toLowerCase().includes('under')) {
      violations.push({
        code: 'FAIL_EMOTIONAL_SUBTEXT',
        message: `emotional_subtext must articulate hidden layer on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.emotional_subtext`,
      });
    }
  }
  return violations;
}

function auditCutPurpose(entries: DirectorGrammarEntry[]): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];
  for (const entry of entries) {
    if (!isSubstantiveDirectorField(entry.cut_purpose)) {
      violations.push({
        code: 'FAIL_CUT_PURPOSE',
        message: `cut_purpose lacks edit rhythm motivation on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.cut_purpose`,
      });
    }
    if (!entry.keywords.some((keyword) => keyword.startsWith('bundle-role:'))) {
      violations.push({
        code: 'FAIL_CUT_PURPOSE',
        message: `cut_purpose must align with declared bundle role on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.cut_purpose`,
      });
    }
  }
  return violations;
}

function auditFlatSceneGuard(entries: DirectorGrammarEntry[]): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];

  for (const entry of entries) {
    for (const rule of ANTI_FLAT_SCENE_RULES_BASE) {
      if (!entry.anti_flat_scene_rules.includes(rule)) {
        violations.push({
          code: 'FAIL_FLAT_SCENE_GUARD',
          message: `anti_flat_scene_rules must include ${rule} on ${entry.director_grammar_id}`,
          field: `${entry.director_grammar_id}.anti_flat_scene_rules`,
        });
      }
    }

    if (entry.anti_flat_scene_rules.length < ANTI_FLAT_SCENE_RULES_BASE.length + 2) {
      violations.push({
        code: 'FAIL_FLAT_SCENE_GUARD',
        message: `anti_flat_scene_rules must include scene-specific guards on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.anti_flat_scene_rules`,
      });
    }

    if (entry.visual_motif_usage.length < 2) {
      violations.push({
        code: 'FAIL_FLAT_SCENE_GUARD',
        message: `visual_motif_usage must include at least two motifs on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.visual_motif_usage`,
      });
    }

    if (!isNonEmptyString(entry.silence_or_action)) {
      violations.push({
        code: 'FAIL_FLAT_SCENE_GUARD',
        message: `silence_or_action must declare pacing choice on ${entry.director_grammar_id}`,
        field: `${entry.director_grammar_id}.silence_or_action`,
      });
    }
  }

  return violations;
}

function primaryFailure(violations: DirectorGrammarViolation[]): DirectorGrammarAuditResult {
  const priority: DirectorGrammarAuditResult[] = [
    'FAIL_DIRECTOR_GRAMMAR_COMPLETENESS',
    'FAIL_STORY_EXPORT_REFERENCE',
    'FAIL_BUNDLE_REFERENCE',
    'FAIL_ACTING_CAMERA_REFERENCE',
    'FAIL_DIRECTORIAL_INTENT',
    'FAIL_CAMERA_REASON',
    'FAIL_BLOCKING_REASON',
    'FAIL_EMOTIONAL_SUBTEXT',
    'FAIL_CUT_PURPOSE',
    'FAIL_FLAT_SCENE_GUARD',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditDirectorGrammar(
  projectRoot: string,
  entries: DirectorGrammarEntry[]
): DirectorGrammarViolation[] {
  const violations: DirectorGrammarViolation[] = [];
  violations.push(...auditDirectorGrammarCompleteness(entries));
  violations.push(...auditStoryExportReference(projectRoot, entries));
  violations.push(...auditBundleReference(entries));
  violations.push(...auditActingCameraReference(entries));
  violations.push(...auditDirectorialIntent(entries));
  violations.push(...auditCameraReason(entries));
  violations.push(...auditBlockingReason(entries));
  violations.push(...auditEmotionalSubtext(entries));
  violations.push(...auditCutPurpose(entries));
  violations.push(...auditFlatSceneGuard(entries));
  return violations;
}

export function writeDirectorGrammarPreview(
  projectRoot: string,
  preview: DirectorGrammarPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeDirectorGrammarReport(
  projectRoot: string,
  report: DirectorGrammarReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runDirectorGrammarAudit(projectRoot: string): DirectorGrammarReport {
  const auditTimestamp = new Date().toISOString();
  const preview = buildDirectorGrammarPreview();
  const violations = auditDirectorGrammar(projectRoot, preview.seed_director_grammar);

  writeDirectorGrammarPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);
  const report: DirectorGrammarReport = {
    auditTimestamp,
    auditResult,
    layer_version: DIRECTOR_GRAMMAR_VERSION,
    violations,
  };

  writeDirectorGrammarReport(projectRoot, report);
  return report;
}
