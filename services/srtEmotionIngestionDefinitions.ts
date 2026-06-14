import type { SeedEmotionDnaId } from './emotionDnaDefinitions.js';
import { getNarrativeBeatSeedLibrary, type NarrativeBeatEntry } from './narrativeBeatDefinitions.js';
import {
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
  type StoryboardSceneEntry,
} from './storyboardLayerDefinitions.js';
import {
  getStoryOrchestrationById,
  parseOutputStoryBeatToken,
  STORY_ORCHESTRATION_ID,
  type StoryOrchestrationEntry,
} from './storyOrchestrationDefinitions.js';
import {
  getWorldContinuityById,
  WORLD_CONTINUITY_WORLD_ID,
} from './worldContinuityDefinitions.js';

export const SRT_EMOTION_INGESTION_VERSION = 'SRT-EMOTION-INGESTION-PHASE-97A-v1' as const;
export const SRT_EMOTION_INGESTION_SEED_COUNT = 1 as const;
export const SRT_EMOTION_INGESTION_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;
export const SRT_EMOTION_INGESTION_ID = 'SRTING-song_master_01-v1' as const;

export const WORLD_DNA_PRIORITY_LAW = 'WORLD_DNA_PRIORITY_LAW' as const;
export const DEFAULT_WORLD_SETTING =
  'early 1900s Mediterranean harbor town' as const;

export const WORLD_DNA_LOCKED_DIMENSIONS = [
  'era',
  'architecture',
  'transportation',
  'clothing',
  'environment',
  'settlement_type',
] as const;

export const ALLOWED_WAITING_PLACES = [
  'harbor_pier',
  'lighthouse_path',
  'breakwater',
  'coastal_hill_road',
  'old_town_square',
  'stone_stair_alley',
] as const;

export const FORBIDDEN_GENERIC_LOCATIONS = [
  'train_station',
  'bus_stop',
  'modern_city',
  'subway',
  'airport',
] as const;

export const REQUIRED_SRT_EMOTION_INGESTION_FIELDS = [
  'ingestion_id',
  'source_type',
  'language_code',
  'lyric_segments',
  'emotion_timeline',
  'narrative_intents',
  'world_constraints',
  'orchestration_bindings',
  'keywords',
] as const;

export type RequiredSrtEmotionIngestionField =
  (typeof REQUIRED_SRT_EMOTION_INGESTION_FIELDS)[number];

export interface LyricSegment {
  segment_index: number;
  cue_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface EmotionTimelineSegment {
  segment_index: number;
  start_ms: number;
  end_ms: number;
  emotion_id: SeedEmotionDnaId;
  emotion_label: string;
  emotion_source: 'srt-emotion-only';
}

export interface NarrativeIntentEntry {
  segment_index: number;
  beat_type: string;
  narrative_function: string;
  intent: string;
  emotion_only: true;
}

export interface SrtEmotionIngestionEntry {
  ingestion_id: typeof SRT_EMOTION_INGESTION_ID;
  source_type: 'srt';
  language_code: string;
  lyric_segments: LyricSegment[];
  emotion_timeline: EmotionTimelineSegment[];
  narrative_intents: NarrativeIntentEntry[];
  world_constraints: string[];
  orchestration_bindings: string[];
  keywords: string[];
}

export interface SrtEmotionIngestionPreview {
  layer_version: typeof SRT_EMOTION_INGESTION_VERSION;
  seed_count: typeof SRT_EMOTION_INGESTION_SEED_COUNT;
  song_master_id: typeof SRT_EMOTION_INGESTION_SONG_MASTER_ID;
  required_fields: RequiredSrtEmotionIngestionField[];
  world_dna_priority_law: typeof WORLD_DNA_PRIORITY_LAW;
  default_world_setting: typeof DEFAULT_WORLD_SETTING;
  world_dna_locked_dimensions: readonly string[];
  allowed_waiting_places: readonly string[];
  forbidden_generic_locations: readonly string[];
  pipeline_chain: [
    'world_continuity',
    'story_orchestration',
    'srt_emotion_ingestion',
  ];
  seed_srt_emotion_ingestion: SrtEmotionIngestionEntry[];
}

interface ParsedSrtCue {
  cue_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

interface LyricSeedLine {
  text: string;
  emotion_label: string;
}

const SEED_SRT_LANGUAGE_CODE = 'ko' as const;

const LYRIC_SEED_LINES: LyricSeedLine[] = [
  { text: '고요한 마음, 너를 기다리네', emotion_label: 'quiet anticipation before change' },
  { text: '멀어진 기억 속에 남은 너', emotion_label: 'isolated memory ache' },
  { text: '말없이 스친 눈빛 하나', emotion_label: 'hesitant friendship discovery' },
  { text: '문 앞에서 멈춘 그대 이름', emotion_label: 'separation threshold ache' },
  { text: '비 내리는 창, 그리운 숨결', emotion_label: 'longing through absence' },
  { text: '노을 너머 희망을 걸어', emotion_label: 'hope rising at horizon' },
  { text: '아침빛에 새 길을 열고', emotion_label: 'optimistic journey forward' },
  { text: '마주 선 두 마음의 긴장', emotion_label: 'rival tension into resolve' },
  { text: '해야 할 일 앞에 선 채', emotion_label: 'resolve before sacrifice' },
  { text: '따뜻한 차 한 모금, 작은 위로', emotion_label: 'care offered in vulnerability' },
  { text: '다시 손 내밀며 믿음을', emotion_label: 'trust reopening after fracture' },
  { text: '드디어 닿은 두 손의 온기', emotion_label: 'reunion contact warmth' },
  { text: '높은 곳에서 작별 인사', emotion_label: 'bittersweet farewell gaze' },
  { text: '걸으며 배우는 작은 용기', emotion_label: 'mentor growth guidance' },
  { text: '별 아래 꽃에 물을 주며', emotion_label: 'redemptive nightly ritual' },
  { text: '새 아침, 다시 지켜 줄게', emotion_label: 'protective new beginning' },
];

export const SEED_SRT_CONTENT = buildSeedSrtDocument();

function msToSrtTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

function srtTimestampToMs(timestamp: string): number {
  const match = timestamp.trim().match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) {
    throw new Error(`Invalid SRT timestamp: ${timestamp}`);
  }
  const [, hours, minutes, seconds, millis] = match;
  return (
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1000 +
    Number(millis)
  );
}

function buildSeedSrtDocument(): string {
  const scenes = getStoryboardSceneSeedLibrary();
  const cues: string[] = [];
  let cursorMs = 0;

  for (let index = 0; index < LYRIC_SEED_LINES.length; index += 1) {
    const scene = scenes[index];
    const line = LYRIC_SEED_LINES[index];
    const durationMs = (scene?.scene_duration_seconds ?? 13) * 1000;
    const startMs = cursorMs;
    const endMs = cursorMs + durationMs;
    cursorMs = endMs;

    cues.push(
      String(index + 1),
      `${msToSrtTimestamp(startMs)} --> ${msToSrtTimestamp(endMs)}`,
      line.text,
      ''
    );
  }

  return `${cues.join('\n').trim()}\n`;
}

export function parseSrtContent(srtContent: string): ParsedSrtCue[] {
  const blocks = srtContent
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n\s*\n/);
  const cues: ParsedSrtCue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    const cueId = lines[0];
    const timingMatch = lines[1].match(
      /^(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})$/
    );
    if (!timingMatch) {
      throw new Error(`Invalid SRT timing line: ${lines[1]}`);
    }

    cues.push({
      cue_id: cueId,
      start_ms: srtTimestampToMs(timingMatch[1]),
      end_ms: srtTimestampToMs(timingMatch[2]),
      text: lines.slice(2).join(' '),
    });
  }

  return cues;
}

function getBeatForScene(scene: StoryboardSceneEntry): NarrativeBeatEntry {
  const beat = getNarrativeBeatSeedLibrary().find((entry) => entry.beat_id === scene.beat_id);
  if (!beat) {
    throw new Error(`Missing narrative beat for ${scene.storyboard_id}`);
  }
  return beat;
}

function buildLyricSegmentsFromParsed(parsed: ParsedSrtCue[]): LyricSegment[] {
  return parsed.map((cue, index) => ({
    segment_index: index + 1,
    cue_id: cue.cue_id,
    start_ms: cue.start_ms,
    end_ms: cue.end_ms,
    text: cue.text,
  }));
}

function buildEmotionTimeline(
  segments: LyricSegment[],
  scenes: StoryboardSceneEntry[]
): EmotionTimelineSegment[] {
  return segments.map((segment) => {
    const scene = scenes[segment.segment_index - 1];
    if (!scene) {
      throw new Error(`Missing storyboard scene for segment ${segment.segment_index}`);
    }
    const beat = getBeatForScene(scene);
    const seedLine = LYRIC_SEED_LINES[segment.segment_index - 1];

    return {
      segment_index: segment.segment_index,
      start_ms: segment.start_ms,
      end_ms: segment.end_ms,
      emotion_id: beat.emotion_id,
      emotion_label: seedLine?.emotion_label ?? beat.beat_type,
      emotion_source: 'srt-emotion-only',
    };
  });
}

function buildNarrativeIntents(scenes: StoryboardSceneEntry[]): NarrativeIntentEntry[] {
  return scenes.map((scene) => {
    const beat = getBeatForScene(scene);
    return {
      segment_index: scene.scene_order,
      beat_type: beat.beat_type,
      narrative_function: beat.narrative_function,
      intent: `emotion-intent:${beat.beat_type}:${beat.narrative_function}`,
      emotion_only: true,
    };
  });
}

function buildWorldConstraints(): string[] {
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  if (!world) {
    throw new Error(`Missing world continuity ${WORLD_CONTINUITY_WORLD_ID}`);
  }

  const constraints = [
    `law:${WORLD_DNA_PRIORITY_LAW}`,
    `world:${world.world_id}`,
    `song-master:${world.song_master_id}`,
    `default-world:${DEFAULT_WORLD_SETTING.replace(/\s+/g, '-')}`,
    'principle:lyrics-provide-emotion-only',
    'principle:lyrics-cannot-override-world-dna',
    'principle:no-lyric-based-location-generation',
    'principle:no-lyric-based-world-generation',
    ...WORLD_DNA_LOCKED_DIMENSIONS.map((dimension) => `locked-dimension:${dimension}`),
    ...ALLOWED_WAITING_PLACES.map((place) => `allowed-waiting:${place}`),
    ...FORBIDDEN_GENERIC_LOCATIONS.map((place) => `forbidden-from-lyrics:${place}`),
    ...world.world_tone.map((tone) => `world-tone:${tone}`),
    ...world.recurring_motifs.map((motif) => `world-motif:${motif}`),
  ];

  return [...new Set(constraints)].sort();
}

function buildOrchestrationBindings(
  orchestration: StoryOrchestrationEntry,
  segments: LyricSegment[]
): string[] {
  const bindings: string[] = [
    `orchestration:${orchestration.orchestration_id}`,
    `world:${orchestration.world_id}`,
    `song-master:${orchestration.song_master_id}`,
  ];

  for (const segment of segments) {
    const order = String(segment.segment_index).padStart(2, '0');
    const turn = orchestration.narrative_turns.find((token) => token.startsWith(`turn:${order}:`));
    const storyBeat = orchestration.output_story_beats.find((token) =>
      token.startsWith(`story-beat:${order}:`)
    );

    bindings.push(`binding:segment-${order}:${orchestration.orchestration_id}`);
    if (turn) bindings.push(`binding:segment-${order}:turn:${turn}`);
    if (storyBeat) {
      const parsed = parseOutputStoryBeatToken(storyBeat);
      if (parsed) {
        bindings.push(
          `binding:segment-${order}:storyboard:${parsed.storyboardId}:beat:${parsed.beatId}`
        );
      }
    }
  }

  return bindings;
}

function buildKeywords(): string[] {
  return [
    'srt-emotion-ingestion',
    SRT_EMOTION_INGESTION_SONG_MASTER_ID,
    `world:${WORLD_CONTINUITY_WORLD_ID}`,
    `orchestration:${STORY_ORCHESTRATION_ID}`,
    WORLD_DNA_PRIORITY_LAW,
    'emotion-only-srt',
    'no-ai-studio-generation',
  ];
}

export function buildSrtEmotionIngestionEntry(): SrtEmotionIngestionEntry {
  const parsed = parseSrtContent(SEED_SRT_CONTENT);
  const scenes = getStoryboardSceneSeedLibrary();
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);

  if (!orchestration) {
    throw new Error(`Missing story orchestration ${STORY_ORCHESTRATION_ID}`);
  }

  if (parsed.length !== scenes.length) {
    throw new Error('Seed SRT cue count must match storyboard scene count');
  }

  const lyricSegments = buildLyricSegmentsFromParsed(parsed);

  return {
    ingestion_id: SRT_EMOTION_INGESTION_ID,
    source_type: 'srt',
    language_code: SEED_SRT_LANGUAGE_CODE,
    lyric_segments: lyricSegments,
    emotion_timeline: buildEmotionTimeline(lyricSegments, scenes),
    narrative_intents: buildNarrativeIntents(scenes),
    world_constraints: buildWorldConstraints(),
    orchestration_bindings: buildOrchestrationBindings(orchestration, lyricSegments),
    keywords: buildKeywords(),
  };
}

export function getSrtEmotionIngestionSeedLibrary(): SrtEmotionIngestionEntry[] {
  const entry = buildSrtEmotionIngestionEntry();
  return [
    {
      ...entry,
      lyric_segments: entry.lyric_segments.map((segment) => ({ ...segment })),
      emotion_timeline: entry.emotion_timeline.map((segment) => ({ ...segment })),
      narrative_intents: entry.narrative_intents.map((intent) => ({ ...intent })),
      world_constraints: [...entry.world_constraints],
      orchestration_bindings: [...entry.orchestration_bindings],
      keywords: [...entry.keywords],
    },
  ];
}

export function buildSrtEmotionIngestionPreview(): SrtEmotionIngestionPreview {
  return {
    layer_version: SRT_EMOTION_INGESTION_VERSION,
    seed_count: SRT_EMOTION_INGESTION_SEED_COUNT,
    song_master_id: SRT_EMOTION_INGESTION_SONG_MASTER_ID,
    required_fields: [...REQUIRED_SRT_EMOTION_INGESTION_FIELDS],
    world_dna_priority_law: WORLD_DNA_PRIORITY_LAW,
    default_world_setting: DEFAULT_WORLD_SETTING,
    world_dna_locked_dimensions: [...WORLD_DNA_LOCKED_DIMENSIONS],
    allowed_waiting_places: [...ALLOWED_WAITING_PLACES],
    forbidden_generic_locations: [...FORBIDDEN_GENERIC_LOCATIONS],
    pipeline_chain: [
      'world_continuity',
      'story_orchestration',
      'srt_emotion_ingestion',
    ],
    seed_srt_emotion_ingestion: getSrtEmotionIngestionSeedLibrary(),
  };
}

export function findDuplicateCueIds(cueIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const cueId of cueIds) {
    if (seen.has(cueId)) duplicates.add(cueId);
    seen.add(cueId);
  }

  return [...duplicates].sort();
}

export function findDuplicateSegmentIndexes(segmentIndexes: readonly number[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();

  for (const index of segmentIndexes) {
    if (seen.has(index)) duplicates.add(index);
    seen.add(index);
  }

  return [...duplicates].sort((left, right) => left - right);
}

export function getSrtEmotionIngestionById(
  ingestionId: string
): SrtEmotionIngestionEntry | undefined {
  return getSrtEmotionIngestionSeedLibrary().find((entry) => entry.ingestion_id === ingestionId);
}

export function containsForbiddenLocationToken(text: string): string | null {
  const normalized = text.toLowerCase().replace(/\s+/g, '_');
  for (const forbidden of FORBIDDEN_GENERIC_LOCATIONS) {
    if (normalized.includes(forbidden)) return forbidden;
  }
  return null;
}

export function containsLockedDimensionOverride(text: string): string | null {
  const normalized = text.toLowerCase();
  const overridePatterns = [
    'modern_city',
    'subway',
    'airport',
    'train_station',
    'bus_stop',
    'skyscraper',
    'highway',
  ];
  for (const pattern of overridePatterns) {
    if (normalized.includes(pattern)) return pattern;
  }
  return null;
}

export function validateLyricEmotionOnly(text: string): boolean {
  return containsForbiddenLocationToken(text) === null;
}
