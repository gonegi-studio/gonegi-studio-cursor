import fs from 'node:fs';
import path from 'node:path';
import { BEHAVIOR_EMOTION_LINKAGE } from './emotionDnaDefinitions.js';
import {
  REQUIRED_SONG_MASTER_FIELDS,
  SEED_SONG_MASTER_IDS,
  SONG_MASTER_LANGUAGE,
  SONG_MASTER_LIBRARY_VERSION,
  SONG_MASTER_SEED_COUNT,
  SUPPORTED_LANGUAGE_CODES,
  buildSongMasterLibraryPreview,
  findDuplicateSongMasterIds,
  getGonagiGrammarUnitById,
  getMusicVideoGrammarUnit,
  getSongMasterSeedLibrary,
  isValidLanguageCode,
  isValidSongMasterId,
  isValidSongMasterKeyword,
  type EmotionTimelineSegment,
  type RequiredSongMasterField,
  type SeedEmotionDnaId,
  type SeedRelationshipDnaId,
  type SongMasterEntry,
  type SongMasterLibraryPreview,
  SEED_EMOTION_DNA_IDS,
  SEED_RELATIONSHIP_DNA_IDS,
} from './songMasterLibraryDefinitions.js';

export type SongMasterLibraryAuditResult =
  | 'PASS'
  | 'FAIL_SONG_MASTER_COMPLETENESS'
  | 'FAIL_EMOTION_TIMELINE'
  | 'FAIL_GRAMMAR_SEQUENCE'
  | 'FAIL_LANGUAGE_VARIANT'
  | 'FAIL_DURATION_CONFIGURATION'
  | 'FAIL_INVALID_REFERENCE'
  | 'FAIL_DUPLICATE_MASTER'
  | 'FAIL_KEYWORD_INTEGRITY';

export interface SongMasterLibraryViolation {
  code: SongMasterLibraryAuditResult;
  message: string;
  field?: string;
}

export interface SongMasterLibraryReport {
  auditTimestamp: string;
  auditResult: SongMasterLibraryAuditResult;
  violations: SongMasterLibraryViolation[];
}

const PREVIEW_FILE = 'song-master-library-preview.json';
const REPORT_FILE = 'song-master-library-report.json';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmotionId(value: string): value is SeedEmotionDnaId {
  return (SEED_EMOTION_DNA_IDS as readonly string[]).includes(value);
}

function isValidRelationshipId(value: string): value is SeedRelationshipDnaId {
  return (SEED_RELATIONSHIP_DNA_IDS as readonly string[]).includes(value);
}

function auditSongMasterCompleteness(entries: SongMasterEntry[]): SongMasterLibraryViolation[] {
  const violations: SongMasterLibraryViolation[] = [];

  if (entries.length !== SONG_MASTER_SEED_COUNT) {
    violations.push({
      code: 'FAIL_SONG_MASTER_COMPLETENESS',
      message: `Song master library must contain exactly ${SONG_MASTER_SEED_COUNT} entries`,
      field: 'seed_song_masters.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_SONG_MASTER_FIELDS) {
      const value = entry[field as RequiredSongMasterField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_SONG_MASTER_COMPLETENESS',
          message: `Missing required field ${field} on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'emotion_timeline' ||
        field === 'grammar_sequence' ||
        field === 'language_variants' ||
        field === 'keywords'
      ) {
        if (!Array.isArray(value) || value.length === 0) {
          violations.push({
            code: 'FAIL_SONG_MASTER_COMPLETENESS',
            message: `Field ${field} must be a non-empty array on song master ${entry.song_master_id}`,
            field: `${entry.song_master_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'current_duration_seconds' || field === 'target_duration_seconds') {
        if (typeof value !== 'number') {
          violations.push({
            code: 'FAIL_SONG_MASTER_COMPLETENESS',
            message: `Field ${field} must be a number on song master ${entry.song_master_id}`,
            field: `${entry.song_master_id}.${field}`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_SONG_MASTER_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.${field}`,
        });
      }
    }

    if (!isValidSongMasterId(entry.song_master_id)) {
      violations.push({
        code: 'FAIL_SONG_MASTER_COMPLETENESS',
        message: `Unexpected song_master_id: ${entry.song_master_id}`,
        field: `${entry.song_master_id}.song_master_id`,
      });
    }

    if (entry.master_language !== SONG_MASTER_LANGUAGE) {
      violations.push({
        code: 'FAIL_SONG_MASTER_COMPLETENESS',
        message: `master_language must be ${SONG_MASTER_LANGUAGE} on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.master_language`,
      });
    }
  }

  for (const songMasterId of SEED_SONG_MASTER_IDS) {
    if (!entries.some((entry) => entry.song_master_id === songMasterId)) {
      violations.push({
        code: 'FAIL_SONG_MASTER_COMPLETENESS',
        message: `Missing seed song master: ${songMasterId}`,
        field: songMasterId,
      });
    }
  }

  return violations;
}

function auditEmotionTimeline(entries: SongMasterEntry[]): SongMasterLibraryViolation[] {
  const violations: SongMasterLibraryViolation[] = [];

  for (const entry of entries) {
    const sorted = [...entry.emotion_timeline].sort((a, b) => a.start_time - b.start_time);

    if (sorted.length === 0) {
      violations.push({
        code: 'FAIL_EMOTION_TIMELINE',
        message: `emotion_timeline must not be empty on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.emotion_timeline`,
      });
      continue;
    }

    if (sorted[0]?.start_time !== 0) {
      violations.push({
        code: 'FAIL_EMOTION_TIMELINE',
        message: `emotion_timeline must start at 0 on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.emotion_timeline`,
      });
    }

    const lastSegment = sorted[sorted.length - 1];
    if (lastSegment && lastSegment.end_time !== entry.target_duration_seconds) {
      violations.push({
        code: 'FAIL_EMOTION_TIMELINE',
        message: `emotion_timeline must end at target_duration_seconds on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.emotion_timeline`,
      });
    }

    for (let index = 0; index < sorted.length; index++) {
      const segment = sorted[index] as EmotionTimelineSegment;
      const fieldPrefix = `${entry.song_master_id}.emotion_timeline[${index}]`;

      if (segment.start_time < 0 || segment.end_time <= segment.start_time) {
        violations.push({
          code: 'FAIL_EMOTION_TIMELINE',
          message: `Invalid timeline bounds on song master ${entry.song_master_id}`,
          field: fieldPrefix,
        });
      }

      if (index > 0) {
        const previous = sorted[index - 1] as EmotionTimelineSegment;
        if (segment.start_time !== previous.end_time) {
          violations.push({
            code: 'FAIL_EMOTION_TIMELINE',
            message: `emotion_timeline gap or overlap on song master ${entry.song_master_id}`,
            field: fieldPrefix,
          });
        }
      }

      const musicUnit = getMusicVideoGrammarUnit(segment.music_grammar_id);
      if (!musicUnit) {
        violations.push({
          code: 'FAIL_EMOTION_TIMELINE',
          message: `Unknown music_grammar_id "${segment.music_grammar_id}" in emotion_timeline on song master ${entry.song_master_id}`,
          field: `${fieldPrefix}.music_grammar_id`,
        });
        continue;
      }

      if (segment.grammar_id !== musicUnit.grammar_id) {
        violations.push({
          code: 'FAIL_EMOTION_TIMELINE',
          message: `grammar_id mismatch with music grammar on song master ${entry.song_master_id}`,
          field: `${fieldPrefix}.grammar_id`,
        });
      }

      if (!musicUnit.emotion_focus.includes(segment.emotion_id)) {
        violations.push({
          code: 'FAIL_EMOTION_TIMELINE',
          message: `emotion_id "${segment.emotion_id}" not supported by music grammar on song master ${entry.song_master_id}`,
          field: `${fieldPrefix}.emotion_id`,
        });
      }
    }

    const timelineEmotions = new Set(entry.emotion_timeline.map((segment) => segment.emotion_id));
    if (!timelineEmotions.has(entry.primary_emotion)) {
      violations.push({
        code: 'FAIL_EMOTION_TIMELINE',
        message: `primary_emotion must appear in emotion_timeline on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.primary_emotion`,
      });
    }
  }

  return violations;
}

function auditGrammarSequence(entries: SongMasterEntry[]): SongMasterLibraryViolation[] {
  const violations: SongMasterLibraryViolation[] = [];

  for (const entry of entries) {
    const timelineSequence = entry.emotion_timeline.map((segment) => segment.music_grammar_id);

    if (entry.grammar_sequence.length !== timelineSequence.length) {
      violations.push({
        code: 'FAIL_GRAMMAR_SEQUENCE',
        message: `grammar_sequence length must match emotion_timeline on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.grammar_sequence`,
      });
    }

    for (let index = 0; index < timelineSequence.length; index++) {
      if (entry.grammar_sequence[index] !== timelineSequence[index]) {
        violations.push({
          code: 'FAIL_GRAMMAR_SEQUENCE',
          message: `grammar_sequence order mismatch at index ${index} on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.grammar_sequence`,
        });
      }
    }

    for (const musicGrammarId of entry.grammar_sequence) {
      if (!getMusicVideoGrammarUnit(musicGrammarId)) {
        violations.push({
          code: 'FAIL_GRAMMAR_SEQUENCE',
          message: `Invalid grammar_sequence music grammar "${musicGrammarId}" on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.grammar_sequence`,
        });
      }
    }
  }

  return violations;
}

function auditLanguageVariants(entries: SongMasterEntry[]): SongMasterLibraryViolation[] {
  const violations: SongMasterLibraryViolation[] = [];

  for (const entry of entries) {
    if (entry.language_variants.length !== SUPPORTED_LANGUAGE_CODES.length) {
      violations.push({
        code: 'FAIL_LANGUAGE_VARIANT',
        message: `language_variants must contain exactly ${SUPPORTED_LANGUAGE_CODES.length} entries on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.language_variants`,
      });
    }

    const seenLanguages = new Set<string>();
    let hasEnglish = false;

    for (const variant of entry.language_variants) {
      if (!isValidLanguageCode(variant.language_code)) {
        violations.push({
          code: 'FAIL_LANGUAGE_VARIANT',
          message: `Unsupported language_code "${variant.language_code}" on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.language_variants`,
        });
      }

      if (seenLanguages.has(variant.language_code)) {
        violations.push({
          code: 'FAIL_LANGUAGE_VARIANT',
          message: `Duplicate language_code "${variant.language_code}" on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.language_variants`,
        });
      }
      seenLanguages.add(variant.language_code);

      if (variant.language_code === 'en') {
        hasEnglish = true;
        if (variant.duration_match_required !== true) {
          violations.push({
            code: 'FAIL_LANGUAGE_VARIANT',
            message: `English master variant must require duration match on song master ${entry.song_master_id}`,
            field: `${entry.song_master_id}.language_variants`,
          });
        }
      } else if (variant.duration_match_required !== false) {
        violations.push({
          code: 'FAIL_LANGUAGE_VARIANT',
          message: `Non-English variants must allow duration flexibility on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.language_variants`,
        });
      }

      if (variant.master_song_reference !== entry.song_master_id) {
        violations.push({
          code: 'FAIL_LANGUAGE_VARIANT',
          message: `master_song_reference must point to master song on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.language_variants`,
        });
      }
    }

    if (!hasEnglish) {
      violations.push({
        code: 'FAIL_LANGUAGE_VARIANT',
        message: `English language variant required on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.language_variants`,
      });
    }

    for (const languageCode of SUPPORTED_LANGUAGE_CODES) {
      if (!seenLanguages.has(languageCode)) {
        violations.push({
          code: 'FAIL_LANGUAGE_VARIANT',
          message: `Missing language variant "${languageCode}" on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.language_variants`,
        });
      }
    }
  }

  return violations;
}

function auditDurationConfiguration(entries: SongMasterEntry[]): SongMasterLibraryViolation[] {
  const violations: SongMasterLibraryViolation[] = [];

  for (const entry of entries) {
    if (entry.target_duration_seconds <= 0) {
      violations.push({
        code: 'FAIL_DURATION_CONFIGURATION',
        message: `target_duration_seconds must be positive on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.target_duration_seconds`,
      });
    }

    if (entry.current_duration_seconds < 0) {
      violations.push({
        code: 'FAIL_DURATION_CONFIGURATION',
        message: `current_duration_seconds must be zero or positive on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.current_duration_seconds`,
      });
    }

    if (entry.current_duration_seconds > entry.target_duration_seconds) {
      violations.push({
        code: 'FAIL_DURATION_CONFIGURATION',
        message: `current_duration_seconds must not exceed target_duration_seconds on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.current_duration_seconds`,
      });
    }
  }

  return violations;
}

function auditInvalidReferences(entries: SongMasterEntry[]): SongMasterLibraryViolation[] {
  const violations: SongMasterLibraryViolation[] = [];

  for (const entry of entries) {
    if (!isValidEmotionId(entry.primary_emotion)) {
      violations.push({
        code: 'FAIL_INVALID_REFERENCE',
        message: `Invalid primary_emotion "${entry.primary_emotion}" on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.primary_emotion`,
      });
    }

    if (!isValidRelationshipId(entry.primary_relationship)) {
      violations.push({
        code: 'FAIL_INVALID_REFERENCE',
        message: `Invalid primary_relationship "${entry.primary_relationship}" on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.primary_relationship`,
      });
    }

    for (const segment of entry.emotion_timeline) {
      if (!isValidEmotionId(segment.emotion_id)) {
        violations.push({
          code: 'FAIL_INVALID_REFERENCE',
          message: `Invalid emotion_id "${segment.emotion_id}" in emotion_timeline on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.emotion_timeline`,
        });
      }

      const grammarUnit = getGonagiGrammarUnitById(segment.grammar_id);
      if (!grammarUnit) {
        violations.push({
          code: 'FAIL_INVALID_REFERENCE',
          message: `Invalid grammar_id "${segment.grammar_id}" in emotion_timeline on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.emotion_timeline`,
        });
        continue;
      }

      if (grammarUnit.emotion_id !== segment.emotion_id) {
        violations.push({
          code: 'FAIL_INVALID_REFERENCE',
          message: `grammar_id emotion mismatch in emotion_timeline on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.emotion_timeline`,
        });
      }

      if (BEHAVIOR_EMOTION_LINKAGE[grammarUnit.behavior_id] !== segment.emotion_id) {
        violations.push({
          code: 'FAIL_INVALID_REFERENCE',
          message: `Behavior DNA linkage mismatch in emotion_timeline on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.emotion_timeline`,
        });
      }
    }

    const relationshipSeen = entry.emotion_timeline.some((segment) => {
      const grammarUnit = getGonagiGrammarUnitById(segment.grammar_id);
      return grammarUnit?.relationship_id === entry.primary_relationship;
    });

    if (!relationshipSeen) {
      violations.push({
        code: 'FAIL_INVALID_REFERENCE',
        message: `primary_relationship must appear in linked Gonagi grammar timeline on song master ${entry.song_master_id}`,
        field: `${entry.song_master_id}.primary_relationship`,
      });
    }
  }

  return violations;
}

function auditDuplicateMaster(entries: SongMasterEntry[]): SongMasterLibraryViolation[] {
  const duplicates = findDuplicateSongMasterIds(entries.map((entry) => entry.song_master_id));
  return duplicates.map((id) => ({
    code: 'FAIL_DUPLICATE_MASTER',
    message: `Duplicate song_master_id detected: ${id}`,
    field: 'song_master_id',
  }));
}

function auditKeywordIntegrity(entries: SongMasterEntry[]): SongMasterLibraryViolation[] {
  const violations: SongMasterLibraryViolation[] = [];

  for (const entry of entries) {
    const seen = new Set<string>();

    for (const keyword of entry.keywords) {
      if (!isValidSongMasterKeyword(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Invalid keyword "${keyword}" on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.keywords`,
        });
      }

      if (seen.has(keyword)) {
        violations.push({
          code: 'FAIL_KEYWORD_INTEGRITY',
          message: `Duplicate keyword "${keyword}" on song master ${entry.song_master_id}`,
          field: `${entry.song_master_id}.keywords`,
        });
      }
      seen.add(keyword);
    }
  }

  return violations;
}

function primaryFailure(
  violations: SongMasterLibraryViolation[]
): SongMasterLibraryAuditResult {
  const priority: SongMasterLibraryAuditResult[] = [
    'FAIL_SONG_MASTER_COMPLETENESS',
    'FAIL_DUPLICATE_MASTER',
    'FAIL_DURATION_CONFIGURATION',
    'FAIL_LANGUAGE_VARIANT',
    'FAIL_EMOTION_TIMELINE',
    'FAIL_GRAMMAR_SEQUENCE',
    'FAIL_INVALID_REFERENCE',
    'FAIL_KEYWORD_INTEGRITY',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditSongMasterLibrary(): SongMasterLibraryViolation[] {
  const entries = getSongMasterSeedLibrary();
  const violations: SongMasterLibraryViolation[] = [];

  violations.push(...auditSongMasterCompleteness(entries));
  violations.push(...auditDuplicateMaster(entries));
  violations.push(...auditDurationConfiguration(entries));
  violations.push(...auditLanguageVariants(entries));
  violations.push(...auditEmotionTimeline(entries));
  violations.push(...auditGrammarSequence(entries));
  violations.push(...auditInvalidReferences(entries));
  violations.push(...auditKeywordIntegrity(entries));

  return violations;
}

export function writeSongMasterLibraryPreview(
  projectRoot: string,
  preview: SongMasterLibraryPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeSongMasterLibraryReport(
  projectRoot: string,
  report: SongMasterLibraryReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runSongMasterLibraryAudit(projectRoot: string): SongMasterLibraryReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditSongMasterLibrary();

  const preview = buildSongMasterLibraryPreview();
  if (preview.library_version !== SONG_MASTER_LIBRARY_VERSION) {
    violations.push({
      code: 'FAIL_SONG_MASTER_COMPLETENESS',
      message: 'Preview library_version mismatch',
      field: 'library_version',
    });
  }

  writeSongMasterLibraryPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: SongMasterLibraryReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeSongMasterLibraryReport(projectRoot, report);
  return report;
}
