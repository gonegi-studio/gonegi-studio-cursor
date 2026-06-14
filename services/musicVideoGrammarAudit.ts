import fs from 'node:fs';
import path from 'node:path';
import {
  MUSIC_VIDEO_GRAMMAR_SEED_COUNT,
  MUSIC_VIDEO_GRAMMAR_VERSION,
  REQUIRED_MUSIC_VIDEO_GRAMMAR_FIELDS,
  SEED_MUSIC_GRAMMAR_IDS,
  buildMusicVideoGrammarPreview,
  findDuplicateMusicGrammarIds,
  getGonagiGrammarUnit,
  getMusicVideoGrammarSeedLibrary,
  isValidBehaviorFocusId,
  isValidEmotionFocusId,
  isValidGrammarReference,
  isValidMusicGrammarId,
  isValidMusicVideoKeyword,
  isValidRelationshipFocusId,
  type MusicVideoGrammarPreview,
  type MusicVideoGrammarUnit,
  type RequiredMusicVideoGrammarField,
} from './musicVideoGrammarDefinitions.js';
import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import { getTransitionDnaLibrary } from './transitionDnaContractDefinitions.js';
import { loadVideoDatasetExport } from './videoDatasetExportAudit.js';

export type MusicVideoGrammarAuditResult =
  | 'PASS'
  | 'FAIL_MUSIC_GRAMMAR_COMPLETENESS'
  | 'FAIL_GRAMMAR_REFERENCE'
  | 'FAIL_BEHAVIOR_FOCUS'
  | 'FAIL_EMOTION_FOCUS'
  | 'FAIL_RELATIONSHIP_FOCUS'
  | 'FAIL_SHOT_AFFINITY'
  | 'FAIL_TRANSITION_AFFINITY'
  | 'FAIL_DUPLICATE_MUSIC_GRAMMAR'
  | 'FAIL_KEYWORD_INTEGRITY';

export interface MusicVideoGrammarViolation {
  code: MusicVideoGrammarAuditResult;
  message: string;
  field?: string;
}

export interface MusicVideoGrammarReport {
  auditTimestamp: string;
  auditResult: MusicVideoGrammarAuditResult;
  violations: MusicVideoGrammarViolation[];
}

const PREVIEW_FILE = 'music-video-grammar-preview.json';
const REPORT_FILE = 'music-video-grammar-report.json';

const VALID_SHOT_IDS = new Set(
  getShotFingerprintLibrary().map((entry) => entry.fingerprint_id)
);

const VALID_TRANSITION_IDS = new Set(
  getTransitionDnaLibrary().map((entry) => entry.transition_id)
);

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

function getVideoDatasetSceneIds(projectRoot: string): Set<string> {
  const exportData = loadVideoDatasetExport(projectRoot);
  if (!exportData) return new Set();
  return new Set(exportData.scene_records.map((record) => record.scene_id));
}

function auditMusicGrammarCompleteness(
  units: MusicVideoGrammarUnit[],
  projectRoot: string
): MusicVideoGrammarViolation[] {
  const violations: MusicVideoGrammarViolation[] = [];
  const videoSceneIds = getVideoDatasetSceneIds(projectRoot);

  if (units.length !== MUSIC_VIDEO_GRAMMAR_SEED_COUNT) {
    violations.push({
      code: 'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
      message: `Music video grammar library must contain exactly ${MUSIC_VIDEO_GRAMMAR_SEED_COUNT} units`,
      field: 'seed_music_video_grammar_units.length',
    });
  }

  for (const unit of units) {
    for (const field of REQUIRED_MUSIC_VIDEO_GRAMMAR_FIELDS) {
      const value = unit[field as RequiredMusicVideoGrammarField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
          message: `Missing required field ${field} on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'behavior_focus' ||
        field === 'emotion_focus' ||
        field === 'relationship_focus' ||
        field === 'shot_affinity' ||
        field === 'transition_affinity' ||
        field === 'video_dataset_usage' ||
        field === 'keywords'
      ) {
        if (!isStringArray(value)) {
          violations.push({
            code: 'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
            message: `Field ${field} must be a non-empty string array on music grammar ${unit.music_grammar_id}`,
            field: `${unit.music_grammar_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.${field}`,
        });
      }
    }

    if (!isValidMusicGrammarId(unit.music_grammar_id)) {
      violations.push({
        code: 'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
        message: `Unexpected seed music_grammar_id: ${unit.music_grammar_id}`,
        field: `${unit.music_grammar_id}.music_grammar_id`,
      });
    }

    if (videoSceneIds.size === 0) {
      violations.push({
        code: 'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
        message: 'Video dataset export not readable for video_dataset_usage validation',
        field: 'exports/video-dataset-export.json',
      });
    } else {
      for (const sceneId of unit.video_dataset_usage) {
        if (!videoSceneIds.has(sceneId)) {
          violations.push({
            code: 'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
            message: `Unknown video_dataset_usage scene_id "${sceneId}" on music grammar ${unit.music_grammar_id}`,
            field: `${unit.music_grammar_id}.video_dataset_usage`,
          });
        }
      }
    }
  }

  for (const musicGrammarId of SEED_MUSIC_GRAMMAR_IDS) {
    if (!units.some((unit) => unit.music_grammar_id === musicGrammarId)) {
      violations.push({
        code: 'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
        message: `Missing seed music video grammar unit: ${musicGrammarId}`,
        field: musicGrammarId,
      });
    }
  }

  return violations;
}

function auditGrammarReferences(units: MusicVideoGrammarUnit[]): MusicVideoGrammarViolation[] {
  const violations: MusicVideoGrammarViolation[] = [];

  for (const unit of units) {
    if (!isValidGrammarReference(unit.grammar_id)) {
      violations.push({
        code: 'FAIL_GRAMMAR_REFERENCE',
        message: `Invalid Gonagi grammar reference "${unit.grammar_id}" on music grammar ${unit.music_grammar_id}`,
        field: `${unit.music_grammar_id}.grammar_id`,
      });
      continue;
    }

    const grammarUnit = getGonagiGrammarUnit(unit.grammar_id);
    if (!grammarUnit) {
      violations.push({
        code: 'FAIL_GRAMMAR_REFERENCE',
        message: `Gonagi grammar unit not found for "${unit.grammar_id}" on music grammar ${unit.music_grammar_id}`,
        field: `${unit.music_grammar_id}.grammar_id`,
      });
    }
  }

  return violations;
}

function auditBehaviorFocus(units: MusicVideoGrammarUnit[]): MusicVideoGrammarViolation[] {
  const violations: MusicVideoGrammarViolation[] = [];

  for (const unit of units) {
    const grammarUnit = getGonagiGrammarUnit(unit.grammar_id);
    const seen = new Set<string>();

    for (const behaviorId of unit.behavior_focus) {
      if (!isValidBehaviorFocusId(behaviorId)) {
        violations.push({
          code: 'FAIL_BEHAVIOR_FOCUS',
          message: `Invalid behavior_focus "${behaviorId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.behavior_focus`,
        });
      }

      if (seen.has(behaviorId)) {
        violations.push({
          code: 'FAIL_BEHAVIOR_FOCUS',
          message: `Duplicate behavior_focus "${behaviorId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.behavior_focus`,
        });
      }
      seen.add(behaviorId);
    }

    if (grammarUnit && !unit.behavior_focus.includes(grammarUnit.behavior_id)) {
      violations.push({
        code: 'FAIL_BEHAVIOR_FOCUS',
        message: `behavior_focus must include linked Gonagi grammar behavior ${grammarUnit.behavior_id} on music grammar ${unit.music_grammar_id}`,
        field: `${unit.music_grammar_id}.behavior_focus`,
      });
    }
  }

  return violations;
}

function auditEmotionFocus(units: MusicVideoGrammarUnit[]): MusicVideoGrammarViolation[] {
  const violations: MusicVideoGrammarViolation[] = [];

  for (const unit of units) {
    const grammarUnit = getGonagiGrammarUnit(unit.grammar_id);
    const seen = new Set<string>();

    for (const emotionId of unit.emotion_focus) {
      if (!isValidEmotionFocusId(emotionId)) {
        violations.push({
          code: 'FAIL_EMOTION_FOCUS',
          message: `Invalid emotion_focus "${emotionId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.emotion_focus`,
        });
      }

      if (seen.has(emotionId)) {
        violations.push({
          code: 'FAIL_EMOTION_FOCUS',
          message: `Duplicate emotion_focus "${emotionId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.emotion_focus`,
        });
      }
      seen.add(emotionId);
    }

    if (grammarUnit && !unit.emotion_focus.includes(grammarUnit.emotion_id)) {
      violations.push({
        code: 'FAIL_EMOTION_FOCUS',
        message: `emotion_focus must include linked Gonagi grammar emotion ${grammarUnit.emotion_id} on music grammar ${unit.music_grammar_id}`,
        field: `${unit.music_grammar_id}.emotion_focus`,
      });
    }
  }

  return violations;
}

function auditRelationshipFocus(units: MusicVideoGrammarUnit[]): MusicVideoGrammarViolation[] {
  const violations: MusicVideoGrammarViolation[] = [];

  for (const unit of units) {
    const grammarUnit = getGonagiGrammarUnit(unit.grammar_id);
    const seen = new Set<string>();

    for (const relationshipId of unit.relationship_focus) {
      if (!isValidRelationshipFocusId(relationshipId)) {
        violations.push({
          code: 'FAIL_RELATIONSHIP_FOCUS',
          message: `Invalid relationship_focus "${relationshipId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.relationship_focus`,
        });
      }

      if (seen.has(relationshipId)) {
        violations.push({
          code: 'FAIL_RELATIONSHIP_FOCUS',
          message: `Duplicate relationship_focus "${relationshipId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.relationship_focus`,
        });
      }
      seen.add(relationshipId);
    }

    if (grammarUnit && !unit.relationship_focus.includes(grammarUnit.relationship_id)) {
      violations.push({
        code: 'FAIL_RELATIONSHIP_FOCUS',
        message: `relationship_focus must include linked Gonagi grammar relationship ${grammarUnit.relationship_id} on music grammar ${unit.music_grammar_id}`,
        field: `${unit.music_grammar_id}.relationship_focus`,
      });
    }
  }

  return violations;
}

function auditShotAffinity(units: MusicVideoGrammarUnit[]): MusicVideoGrammarViolation[] {
  const violations: MusicVideoGrammarViolation[] = [];

  for (const unit of units) {
    const seen = new Set<string>();

    for (const shotId of unit.shot_affinity) {
      if (!VALID_SHOT_IDS.has(shotId)) {
        violations.push({
          code: 'FAIL_SHOT_AFFINITY',
          message: `Unknown shot_affinity "${shotId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.shot_affinity`,
        });
      }

      if (seen.has(shotId)) {
        violations.push({
          code: 'FAIL_SHOT_AFFINITY',
          message: `Duplicate shot_affinity "${shotId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.shot_affinity`,
        });
      }
      seen.add(shotId);
    }
  }

  return violations;
}

function auditTransitionAffinity(units: MusicVideoGrammarUnit[]): MusicVideoGrammarViolation[] {
  const violations: MusicVideoGrammarViolation[] = [];

  for (const unit of units) {
    const seen = new Set<string>();

    for (const transitionId of unit.transition_affinity) {
      if (!VALID_TRANSITION_IDS.has(transitionId)) {
        violations.push({
          code: 'FAIL_TRANSITION_AFFINITY',
          message: `Unknown transition_affinity "${transitionId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.transition_affinity`,
        });
      }

      if (seen.has(transitionId)) {
        violations.push({
          code: 'FAIL_TRANSITION_AFFINITY',
          message: `Duplicate transition_affinity "${transitionId}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.transition_affinity`,
        });
      }
      seen.add(transitionId);
    }
  }

  return violations;
}

function auditDuplicateMusicGrammar(
  units: MusicVideoGrammarUnit[]
): MusicVideoGrammarViolation[] {
  const duplicates = findDuplicateMusicGrammarIds(units.map((unit) => unit.music_grammar_id));
  return duplicates.map((id) => ({
    code: 'FAIL_DUPLICATE_MUSIC_GRAMMAR',
    message: `Duplicate music_grammar_id detected: ${id}`,
    field: 'music_grammar_id',
  }));
}

function auditKeywordIntegrity(units: MusicVideoGrammarUnit[]): MusicVideoGrammarViolation[] {
  const violations: MusicVideoGrammarViolation[] = [];

  for (const unit of units) {
    const seen = new Set<string>();

    for (const keyword of unit.keywords) {
      if (!isValidMusicVideoKeyword(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Invalid keyword "${keyword}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.keywords`,
        });
      }

      if (seen.has(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Duplicate keyword "${keyword}" on music grammar ${unit.music_grammar_id}`,
          field: `${unit.music_grammar_id}.keywords`,
        });
      }
      seen.add(keyword);
    }
  }

  return violations;
}

function primaryFailure(
  violations: MusicVideoGrammarViolation[]
): MusicVideoGrammarAuditResult {
  const priority: MusicVideoGrammarAuditResult[] = [
    'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
    'FAIL_DUPLICATE_MUSIC_GRAMMAR',
    'FAIL_GRAMMAR_REFERENCE',
    'FAIL_BEHAVIOR_FOCUS',
    'FAIL_EMOTION_FOCUS',
    'FAIL_RELATIONSHIP_FOCUS',
    'FAIL_SHOT_AFFINITY',
    'FAIL_TRANSITION_AFFINITY',
    'FAIL_KEYWORD_INTEGRITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditMusicVideoGrammar(projectRoot: string): MusicVideoGrammarViolation[] {
  const units = getMusicVideoGrammarSeedLibrary();
  const violations: MusicVideoGrammarViolation[] = [];

  violations.push(...auditMusicGrammarCompleteness(units, projectRoot));
  violations.push(...auditDuplicateMusicGrammar(units));
  violations.push(...auditGrammarReferences(units));
  violations.push(...auditBehaviorFocus(units));
  violations.push(...auditEmotionFocus(units));
  violations.push(...auditRelationshipFocus(units));
  violations.push(...auditShotAffinity(units));
  violations.push(...auditTransitionAffinity(units));
  violations.push(...auditKeywordIntegrity(units));

  return violations;
}

export function writeMusicVideoGrammarPreview(
  projectRoot: string,
  preview: MusicVideoGrammarPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeMusicVideoGrammarReport(
  projectRoot: string,
  report: MusicVideoGrammarReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runMusicVideoGrammarAudit(projectRoot: string): MusicVideoGrammarReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditMusicVideoGrammar(projectRoot);

  const preview = buildMusicVideoGrammarPreview();
  if (preview.grammar_version !== MUSIC_VIDEO_GRAMMAR_VERSION) {
    violations.push({
      code: 'FAIL_MUSIC_GRAMMAR_COMPLETENESS',
      message: 'Preview grammar_version mismatch',
      field: 'grammar_version',
    });
  }

  writeMusicVideoGrammarPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: MusicVideoGrammarReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeMusicVideoGrammarReport(projectRoot, report);
  return report;
}
