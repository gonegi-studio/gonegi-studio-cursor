import fs from 'node:fs';
import path from 'node:path';
import { isValidEmotionId } from './emotionDnaDefinitions.js';
import { STORYBOARD_SEED_COUNT } from './storyboardLayerDefinitions.js';
import { STORY_ORCHESTRATION_ID } from './storyOrchestrationDefinitions.js';
import { getWorldContinuityById, WORLD_CONTINUITY_WORLD_ID } from './worldContinuityDefinitions.js';
import {
  ALLOWED_WAITING_PLACES,
  DEFAULT_WORLD_SETTING,
  FORBIDDEN_GENERIC_LOCATIONS,
  REQUIRED_SRT_EMOTION_INGESTION_FIELDS,
  SRT_EMOTION_INGESTION_ID,
  SRT_EMOTION_INGESTION_SEED_COUNT,
  SRT_EMOTION_INGESTION_VERSION,
  WORLD_DNA_LOCKED_DIMENSIONS,
  WORLD_DNA_PRIORITY_LAW,
  buildSrtEmotionIngestionPreview,
  containsForbiddenLocationToken,
  containsLockedDimensionOverride,
  findDuplicateCueIds,
  findDuplicateSegmentIndexes,
  getSrtEmotionIngestionSeedLibrary,
  parseSrtContent,
  SEED_SRT_CONTENT,
  type RequiredSrtEmotionIngestionField,
  type SrtEmotionIngestionEntry,
  type SrtEmotionIngestionPreview,
} from './srtEmotionIngestionDefinitions.js';

export type SrtEmotionIngestionAuditResult =
  | 'PASS'
  | 'FAIL_INGESTION_COMPLETENESS'
  | 'FAIL_SRT_SEGMENT'
  | 'FAIL_EMOTION_TIMELINE'
  | 'FAIL_NARRATIVE_INTENT'
  | 'FAIL_WORLD_CONSTRAINT'
  | 'FAIL_ORCHESTRATION_BINDING'
  | 'FAIL_WORLD_DNA_VIOLATION'
  | 'FAIL_DUPLICATE_SEGMENT';

export interface SrtEmotionIngestionViolation {
  code: SrtEmotionIngestionAuditResult;
  message: string;
  field?: string;
}

export interface SrtEmotionIngestionReport {
  auditTimestamp: string;
  auditResult: SrtEmotionIngestionAuditResult;
  violations: SrtEmotionIngestionViolation[];
}

const PREVIEW_FILE = 'srt-emotion-ingestion-preview.json';
const REPORT_FILE = 'srt-emotion-ingestion-report.json';

const FORBIDDEN_GENERATION_TOKENS = [
  'invoke:ai-studio',
  'call:ai-studio',
  'ai-studio-generate',
  'generate:image',
  'trigger:generation',
  'run:gpu',
] as const;

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

function auditIngestionCompleteness(
  entries: SrtEmotionIngestionEntry[]
): SrtEmotionIngestionViolation[] {
  const violations: SrtEmotionIngestionViolation[] = [];

  if (entries.length !== SRT_EMOTION_INGESTION_SEED_COUNT) {
    violations.push({
      code: 'FAIL_INGESTION_COMPLETENESS',
      message: `SRT emotion ingestion must contain exactly ${SRT_EMOTION_INGESTION_SEED_COUNT} entry`,
      field: 'seed_srt_emotion_ingestion.length',
    });
  }

  for (const entry of entries) {
    for (const field of REQUIRED_SRT_EMOTION_INGESTION_FIELDS) {
      const value = entry[field as RequiredSrtEmotionIngestionField];

      if (value === undefined || value === null) {
        violations.push({
          code: 'FAIL_INGESTION_COMPLETENESS',
          message: `Missing required field ${field} on ${entry.ingestion_id}`,
          field: `${entry.ingestion_id}.${field}`,
        });
        continue;
      }

      if (
        field === 'lyric_segments' ||
        field === 'emotion_timeline' ||
        field === 'narrative_intents' ||
        field === 'world_constraints' ||
        field === 'orchestration_bindings' ||
        field === 'keywords'
      ) {
        if (!Array.isArray(value) || value.length === 0) {
          violations.push({
            code: 'FAIL_INGESTION_COMPLETENESS',
            message: `Field ${field} must be a non-empty array on ${entry.ingestion_id}`,
            field: `${entry.ingestion_id}.${field}`,
          });
        }
        continue;
      }

      if (field === 'source_type') {
        if (value !== 'srt') {
          violations.push({
            code: 'FAIL_INGESTION_COMPLETENESS',
            message: 'source_type must be srt',
            field: `${entry.ingestion_id}.source_type`,
          });
        }
        continue;
      }

      if (!isNonEmptyString(value)) {
        violations.push({
          code: 'FAIL_INGESTION_COMPLETENESS',
          message: `Field ${field} must be a non-empty string on ${entry.ingestion_id}`,
          field: `${entry.ingestion_id}.${field}`,
        });
      }
    }

    if (entry.ingestion_id !== SRT_EMOTION_INGESTION_ID) {
      violations.push({
        code: 'FAIL_INGESTION_COMPLETENESS',
        message: `ingestion_id must be ${SRT_EMOTION_INGESTION_ID}`,
        field: `${entry.ingestion_id}.ingestion_id`,
      });
    }
  }

  const serialized = JSON.stringify(entries).toLowerCase();
  for (const token of FORBIDDEN_GENERATION_TOKENS) {
    if (serialized.includes(token)) {
      violations.push({
        code: 'FAIL_INGESTION_COMPLETENESS',
        message: `Forbidden generation token "${token}" found in ingestion layer`,
        field: 'ingestion',
      });
    }
  }

  return violations;
}

function auditSrtSegments(entry: SrtEmotionIngestionEntry): SrtEmotionIngestionViolation[] {
  const violations: SrtEmotionIngestionViolation[] = [];

  if (entry.lyric_segments.length !== STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_SRT_SEGMENT',
      message: `lyric_segments must contain ${STORYBOARD_SEED_COUNT} parsed SRT cues`,
      field: `${entry.ingestion_id}.lyric_segments`,
    });
  }

  let parsed;
  try {
    parsed = parseSrtContent(SEED_SRT_CONTENT);
  } catch (error) {
    violations.push({
      code: 'FAIL_SRT_SEGMENT',
      message: `Seed SRT content failed to parse: ${error instanceof Error ? error.message : String(error)}`,
      field: 'SEED_SRT_CONTENT',
    });
    return violations;
  }

  if (parsed.length !== entry.lyric_segments.length) {
    violations.push({
      code: 'FAIL_SRT_SEGMENT',
      message: 'Parsed SRT cue count must match lyric_segments length',
      field: `${entry.ingestion_id}.lyric_segments`,
    });
  }

  for (const segment of entry.lyric_segments) {
    if (!isNonEmptyString(segment.cue_id)) {
      violations.push({
        code: 'FAIL_SRT_SEGMENT',
        message: `Missing cue_id on segment ${segment.segment_index}`,
        field: `${entry.ingestion_id}.lyric_segments`,
      });
    }

    if (segment.end_ms <= segment.start_ms) {
      violations.push({
        code: 'FAIL_SRT_SEGMENT',
        message: `Invalid SRT timing on segment ${segment.segment_index}`,
        field: `${entry.ingestion_id}.lyric_segments`,
      });
    }

    if (!isNonEmptyString(segment.text)) {
      violations.push({
        code: 'FAIL_SRT_SEGMENT',
        message: `Missing lyric text on segment ${segment.segment_index}`,
        field: `${entry.ingestion_id}.lyric_segments`,
      });
    }

    const parsedCue = parsed.find((cue) => cue.cue_id === segment.cue_id);
    if (!parsedCue || parsedCue.text !== segment.text) {
      violations.push({
        code: 'FAIL_SRT_SEGMENT',
        message: `Segment ${segment.segment_index} must match parsed SRT content`,
        field: `${entry.ingestion_id}.lyric_segments`,
      });
    }
  }

  for (const cueId of findDuplicateCueIds(entry.lyric_segments.map((segment) => segment.cue_id))) {
    violations.push({
      code: 'FAIL_DUPLICATE_SEGMENT',
      message: `Duplicate SRT cue_id detected: ${cueId}`,
      field: `${entry.ingestion_id}.lyric_segments`,
    });
  }

  return violations;
}

function auditEmotionTimeline(entry: SrtEmotionIngestionEntry): SrtEmotionIngestionViolation[] {
  const violations: SrtEmotionIngestionViolation[] = [];

  if (entry.emotion_timeline.length !== STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_EMOTION_TIMELINE',
      message: `emotion_timeline must contain ${STORYBOARD_SEED_COUNT} segments`,
      field: `${entry.ingestion_id}.emotion_timeline`,
    });
  }

  if (entry.emotion_timeline.length !== entry.lyric_segments.length) {
    violations.push({
      code: 'FAIL_EMOTION_TIMELINE',
      message: 'emotion_timeline must align one-to-one with lyric_segments',
      field: `${entry.ingestion_id}.emotion_timeline`,
    });
  }

  for (const timeline of entry.emotion_timeline) {
    if (!isValidEmotionId(timeline.emotion_id)) {
      violations.push({
        code: 'FAIL_EMOTION_TIMELINE',
        message: `Invalid emotion_id on segment ${timeline.segment_index}`,
        field: `${entry.ingestion_id}.emotion_timeline`,
      });
    }

    if (timeline.emotion_source !== 'srt-emotion-only') {
      violations.push({
        code: 'FAIL_EMOTION_TIMELINE',
        message: `emotion_source must be srt-emotion-only on segment ${timeline.segment_index}`,
        field: `${entry.ingestion_id}.emotion_timeline`,
      });
    }

    const lyric = entry.lyric_segments.find(
      (segment) => segment.segment_index === timeline.segment_index
    );
    if (!lyric) {
      violations.push({
        code: 'FAIL_EMOTION_TIMELINE',
        message: `Missing lyric segment for emotion timeline segment ${timeline.segment_index}`,
        field: `${entry.ingestion_id}.emotion_timeline`,
      });
      continue;
    }

    if (timeline.start_ms !== lyric.start_ms || timeline.end_ms !== lyric.end_ms) {
      violations.push({
        code: 'FAIL_EMOTION_TIMELINE',
        message: `Emotion timeline timing must match SRT segment ${timeline.segment_index}`,
        field: `${entry.ingestion_id}.emotion_timeline`,
      });
    }
  }

  return violations;
}

function auditNarrativeIntent(entry: SrtEmotionIngestionEntry): SrtEmotionIngestionViolation[] {
  const violations: SrtEmotionIngestionViolation[] = [];

  if (entry.narrative_intents.length !== STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_NARRATIVE_INTENT',
      message: `narrative_intents must contain ${STORYBOARD_SEED_COUNT} entries`,
      field: `${entry.ingestion_id}.narrative_intents`,
    });
  }

  for (const intent of entry.narrative_intents) {
    if (!intent.emotion_only) {
      violations.push({
        code: 'FAIL_NARRATIVE_INTENT',
        message: `narrative_intents must remain emotion-only on segment ${intent.segment_index}`,
        field: `${entry.ingestion_id}.narrative_intents`,
      });
    }

    if (!isNonEmptyString(intent.intent) || !intent.intent.startsWith('emotion-intent:')) {
      violations.push({
        code: 'FAIL_NARRATIVE_INTENT',
        message: `Invalid emotion intent token on segment ${intent.segment_index}`,
        field: `${entry.ingestion_id}.narrative_intents`,
      });
    }

    if (!isNonEmptyString(intent.narrative_function) || !isNonEmptyString(intent.beat_type)) {
      violations.push({
        code: 'FAIL_NARRATIVE_INTENT',
        message: `Missing narrative metadata on segment ${intent.segment_index}`,
        field: `${entry.ingestion_id}.narrative_intents`,
      });
    }
  }

  return violations;
}

function auditWorldConstraint(entry: SrtEmotionIngestionEntry): SrtEmotionIngestionViolation[] {
  const violations: SrtEmotionIngestionViolation[] = [];
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);

  if (!entry.world_constraints.includes(`law:${WORLD_DNA_PRIORITY_LAW}`)) {
    violations.push({
      code: 'FAIL_WORLD_CONSTRAINT',
      message: 'world_constraints must declare WORLD_DNA_PRIORITY_LAW',
      field: `${entry.ingestion_id}.world_constraints`,
    });
  }

  if (!entry.world_constraints.some((token) => token.includes(DEFAULT_WORLD_SETTING.replace(/\s+/g, '-')))) {
    violations.push({
      code: 'FAIL_WORLD_CONSTRAINT',
      message: 'world_constraints must declare default Mediterranean harbor world',
      field: `${entry.ingestion_id}.world_constraints`,
    });
  }

  for (const dimension of WORLD_DNA_LOCKED_DIMENSIONS) {
    if (!entry.world_constraints.includes(`locked-dimension:${dimension}`)) {
      violations.push({
        code: 'FAIL_WORLD_CONSTRAINT',
        message: `world_constraints must lock dimension ${dimension}`,
        field: `${entry.ingestion_id}.world_constraints`,
      });
    }
  }

  for (const place of ALLOWED_WAITING_PLACES) {
    if (!entry.world_constraints.includes(`allowed-waiting:${place}`)) {
      violations.push({
        code: 'FAIL_WORLD_CONSTRAINT',
        message: `world_constraints must allow waiting place ${place}`,
        field: `${entry.ingestion_id}.world_constraints`,
      });
    }
  }

  for (const place of FORBIDDEN_GENERIC_LOCATIONS) {
    if (!entry.world_constraints.includes(`forbidden-from-lyrics:${place}`)) {
      violations.push({
        code: 'FAIL_WORLD_CONSTRAINT',
        message: `world_constraints must forbid lyric location ${place}`,
        field: `${entry.ingestion_id}.world_constraints`,
      });
    }
  }

  if (!entry.world_constraints.includes('principle:no-lyric-based-location-generation')) {
    violations.push({
      code: 'FAIL_WORLD_CONSTRAINT',
      message: 'world_constraints must forbid lyric-based location generation',
      field: `${entry.ingestion_id}.world_constraints`,
    });
  }

  if (!entry.world_constraints.includes(`world:${WORLD_CONTINUITY_WORLD_ID}`)) {
    violations.push({
      code: 'FAIL_WORLD_CONSTRAINT',
      message: 'world_constraints must reference world continuity',
      field: `${entry.ingestion_id}.world_constraints`,
    });
  }

  if (world && !entry.world_constraints.some((token) => token.startsWith('world-tone:'))) {
    violations.push({
      code: 'FAIL_WORLD_CONSTRAINT',
      message: 'world_constraints must include world tone tokens from continuity',
      field: `${entry.ingestion_id}.world_constraints`,
    });
  }

  return violations;
}

function auditOrchestrationBinding(entry: SrtEmotionIngestionEntry): SrtEmotionIngestionViolation[] {
  const violations: SrtEmotionIngestionViolation[] = [];

  if (!entry.orchestration_bindings.includes(`orchestration:${STORY_ORCHESTRATION_ID}`)) {
    violations.push({
      code: 'FAIL_ORCHESTRATION_BINDING',
      message: `orchestration_bindings must reference ${STORY_ORCHESTRATION_ID}`,
      field: `${entry.ingestion_id}.orchestration_bindings`,
    });
  }

  if (entry.orchestration_bindings.length < STORYBOARD_SEED_COUNT) {
    violations.push({
      code: 'FAIL_ORCHESTRATION_BINDING',
      message: 'orchestration_bindings must cover all lyric segments',
      field: `${entry.ingestion_id}.orchestration_bindings`,
    });
  }

  for (let index = 1; index <= STORYBOARD_SEED_COUNT; index += 1) {
    const order = String(index).padStart(2, '0');
    const hasSegmentBinding = entry.orchestration_bindings.some((token) =>
      token.startsWith(`binding:segment-${order}:`)
    );
    if (!hasSegmentBinding) {
      violations.push({
        code: 'FAIL_ORCHESTRATION_BINDING',
        message: `Missing orchestration binding for segment ${order}`,
        field: `${entry.ingestion_id}.orchestration_bindings`,
      });
    }
  }

  if (!entry.keywords.includes(`orchestration:${STORY_ORCHESTRATION_ID}`)) {
    violations.push({
      code: 'FAIL_ORCHESTRATION_BINDING',
      message: 'keywords must reference story orchestration id',
      field: `${entry.ingestion_id}.keywords`,
    });
  }

  return violations;
}

function auditWorldDnaViolation(entry: SrtEmotionIngestionEntry): SrtEmotionIngestionViolation[] {
  const violations: SrtEmotionIngestionViolation[] = [];

  for (const segment of entry.lyric_segments) {
    const forbidden = containsForbiddenLocationToken(segment.text);
    if (forbidden) {
      violations.push({
        code: 'FAIL_WORLD_DNA_VIOLATION',
        message: `Lyric segment ${segment.segment_index} contains forbidden location token "${forbidden}"`,
        field: `${entry.ingestion_id}.lyric_segments`,
      });
    }

    const override = containsLockedDimensionOverride(segment.text);
    if (override) {
      violations.push({
        code: 'FAIL_WORLD_DNA_VIOLATION',
        message: `Lyric segment ${segment.segment_index} attempts world override "${override}"`,
        field: `${entry.ingestion_id}.lyric_segments`,
      });
    }
  }

  for (const intent of entry.narrative_intents) {
    const forbidden = containsForbiddenLocationToken(intent.intent);
    if (forbidden) {
      violations.push({
        code: 'FAIL_WORLD_DNA_VIOLATION',
        message: `Narrative intent must not encode location token "${forbidden}"`,
        field: `${entry.ingestion_id}.narrative_intents`,
      });
    }
  }

  const serialized = JSON.stringify(entry).toLowerCase();
  if (serialized.includes('lyric-based-location') && !serialized.includes('no-lyric-based-location-generation')) {
    violations.push({
      code: 'FAIL_WORLD_DNA_VIOLATION',
      message: 'Ingestion must explicitly forbid lyric-based location generation',
      field: `${entry.ingestion_id}.world_constraints`,
    });
  }

  return violations;
}

function auditDuplicateSegment(entry: SrtEmotionIngestionEntry): SrtEmotionIngestionViolation[] {
  const violations: SrtEmotionIngestionViolation[] = [];

  for (const index of findDuplicateSegmentIndexes(
    entry.lyric_segments.map((segment) => segment.segment_index)
  )) {
    violations.push({
      code: 'FAIL_DUPLICATE_SEGMENT',
      message: `Duplicate segment_index detected: ${index}`,
      field: `${entry.ingestion_id}.lyric_segments`,
    });
  }

  const timelineIndexes = entry.emotion_timeline.map((segment) => segment.segment_index);
  for (const index of findDuplicateSegmentIndexes(timelineIndexes)) {
    violations.push({
      code: 'FAIL_DUPLICATE_SEGMENT',
      message: `Duplicate emotion_timeline segment_index detected: ${index}`,
      field: `${entry.ingestion_id}.emotion_timeline`,
    });
  }

  return violations;
}

function primaryFailure(
  violations: SrtEmotionIngestionViolation[]
): SrtEmotionIngestionAuditResult {
  const priority: SrtEmotionIngestionAuditResult[] = [
    'FAIL_INGESTION_COMPLETENESS',
    'FAIL_DUPLICATE_SEGMENT',
    'FAIL_SRT_SEGMENT',
    'FAIL_WORLD_DNA_VIOLATION',
    'FAIL_EMOTION_TIMELINE',
    'FAIL_NARRATIVE_INTENT',
    'FAIL_WORLD_CONSTRAINT',
    'FAIL_ORCHESTRATION_BINDING',
  ];

  for (const code of priority) {
    if (violations.some((violation) => violation.code === code)) return code;
  }
  return 'PASS';
}

export function auditSrtEmotionIngestion(projectRoot: string): SrtEmotionIngestionViolation[] {
  void projectRoot;
  const entries = getSrtEmotionIngestionSeedLibrary();
  const violations: SrtEmotionIngestionViolation[] = [];

  violations.push(...auditIngestionCompleteness(entries));

  for (const entry of entries) {
    violations.push(...auditDuplicateSegment(entry));
    violations.push(...auditSrtSegments(entry));
    violations.push(...auditWorldDnaViolation(entry));
    violations.push(...auditEmotionTimeline(entry));
    violations.push(...auditNarrativeIntent(entry));
    violations.push(...auditWorldConstraint(entry));
    violations.push(...auditOrchestrationBinding(entry));
  }

  return violations;
}

export function writeSrtEmotionIngestionPreview(
  projectRoot: string,
  preview: SrtEmotionIngestionPreview
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const previewPath = path.join(exportsDir, PREVIEW_FILE);
  fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8');
  return previewPath;
}

export function writeSrtEmotionIngestionReport(
  projectRoot: string,
  report: SrtEmotionIngestionReport
): string {
  const exportsDir = path.join(projectRoot, 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  const reportPath = path.join(exportsDir, REPORT_FILE);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

export function runSrtEmotionIngestionAudit(projectRoot: string): SrtEmotionIngestionReport {
  const auditTimestamp = new Date().toISOString();
  const violations = auditSrtEmotionIngestion(projectRoot);

  const preview = buildSrtEmotionIngestionPreview();
  if (preview.layer_version !== SRT_EMOTION_INGESTION_VERSION) {
    violations.push({
      code: 'FAIL_INGESTION_COMPLETENESS',
      message: 'Preview layer_version mismatch',
      field: 'layer_version',
    });
  }

  writeSrtEmotionIngestionPreview(projectRoot, preview);

  const auditResult = violations.length === 0 ? 'PASS' : primaryFailure(violations);

  const report: SrtEmotionIngestionReport = {
    auditTimestamp,
    auditResult,
    violations,
  };

  writeSrtEmotionIngestionReport(projectRoot, report);
  return report;
}
