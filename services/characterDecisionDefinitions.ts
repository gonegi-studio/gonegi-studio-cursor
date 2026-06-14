import {
  getCharacterContinuitySeedLibrary,
  SEED_CHARACTER_IDS,
  type SeedCharacterId,
} from './characterContinuityDefinitions.js';
import type { SeedEmotionDnaId } from './emotionDnaDefinitions.js';
import { getNarrativeBeatSeedLibrary, type NarrativeBeatEntry } from './narrativeBeatDefinitions.js';
import {
  getSrtEmotionIngestionSeedLibrary,
  SRT_EMOTION_INGESTION_ID,
  WORLD_DNA_PRIORITY_LAW,
  type EmotionTimelineSegment,
  type NarrativeIntentEntry,
  type SrtEmotionIngestionEntry,
} from './srtEmotionIngestionDefinitions.js';
import {
  STORYBOARD_SEED_COUNT,
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
  type StoryboardSceneEntry,
} from './storyboardLayerDefinitions.js';
import {
  getStoryOrchestrationById,
  STORY_ORCHESTRATION_ID,
} from './storyOrchestrationDefinitions.js';
import {
  getWorldContinuityById,
  WORLD_CONTINUITY_WORLD_ID,
} from './worldContinuityDefinitions.js';

export const CHARACTER_DECISION_VERSION = 'CHARACTER-DECISION-PHASE-97B-v1' as const;
export const CHARACTER_DECISION_SEED_COUNT = STORYBOARD_SEED_COUNT * SEED_CHARACTER_IDS.length;
export const CHARACTER_DECISION_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;

export const SEED_DECISION_TYPES = [
  'observe',
  'wait',
  'follow',
  'leave',
  'protect',
  'hide',
  'search',
  'return',
  'remember',
  'forgive',
] as const;

export type SeedDecisionType = (typeof SEED_DECISION_TYPES)[number];

export const REQUIRED_CHARACTER_DECISION_FIELDS = [
  'decision_id',
  'character_id',
  'emotion_id',
  'narrative_intent',
  'decision_type',
  'action_outcome',
  'world_constraints',
  'scene_bindings',
  'keywords',
] as const;

export type RequiredCharacterDecisionField =
  (typeof REQUIRED_CHARACTER_DECISION_FIELDS)[number];

export interface CharacterDecisionEntry {
  decision_id: string;
  character_id: SeedCharacterId;
  emotion_id: SeedEmotionDnaId;
  narrative_intent: string;
  decision_type: SeedDecisionType;
  action_outcome: string;
  world_constraints: string[];
  scene_bindings: string[];
  keywords: string[];
}

export interface CharacterDecisionPreview {
  layer_version: typeof CHARACTER_DECISION_VERSION;
  seed_count: typeof CHARACTER_DECISION_SEED_COUNT;
  song_master_id: typeof CHARACTER_DECISION_SONG_MASTER_ID;
  required_fields: RequiredCharacterDecisionField[];
  seed_decision_types: SeedDecisionType[];
  pipeline_chain: [
    'character_continuity',
    'srt_emotion_ingestion',
    'story_orchestration',
    'world_continuity',
    'character_decision',
  ];
  seed_character_decisions: CharacterDecisionEntry[];
}

interface DecisionProfile {
  decision_type: SeedDecisionType;
  action_outcome: string;
}

const DECISION_PROFILES: Record<
  SeedCharacterId,
  Record<string, DecisionProfile>
> = {
  'CHAR-gonagi': {
    waiting: {
      decision_type: 'wait',
      action_outcome: 'hold protective vigil without rushing the moment forward',
    },
    memory: {
      decision_type: 'remember',
      action_outcome: 'acknowledge shared past without forcing immediate contact',
    },
    discovery: {
      decision_type: 'observe',
      action_outcome: 'read friendship cue before intervening in the scene',
    },
    distance: {
      decision_type: 'protect',
      action_outcome: 'guard separation threshold while respecting departure space',
    },
    longing: {
      decision_type: 'wait',
      action_outcome: 'endure absence with quiet guardian vigil',
    },
    hope: {
      decision_type: 'follow',
      action_outcome: 'choose forward motion over retreat at the horizon beat',
    },
    journey: {
      decision_type: 'protect',
      action_outcome: 'lead morning departure with guardian cadence not direct scene jump',
    },
    conflict: {
      decision_type: 'protect',
      action_outcome: 'align rival tension into shared resolve under pressure',
    },
    sacrifice: {
      decision_type: 'leave',
      action_outcome: 'commit to duty despite domestic pull at home threshold',
    },
    healing: {
      decision_type: 'protect',
      action_outcome: 'offer tea and small care gesture before demanding response',
    },
    forgiveness: {
      decision_type: 'forgive',
      action_outcome: 'reopen trust through shared public action at market',
    },
    reunion: {
      decision_type: 'return',
      action_outcome: 'close distance with recognition rather than announcement',
    },
    departure: {
      decision_type: 'leave',
      action_outcome: 'release bond with bittersweet rooftop restraint',
    },
    growth: {
      decision_type: 'protect',
      action_outcome: 'guide student walk without overriding agency',
    },
    redemption: {
      decision_type: 'remember',
      action_outcome: 'perform star ritual before seeking forgiveness',
    },
    new_beginning: {
      decision_type: 'protect',
      action_outcome: 'reset guardian role through morning care routine',
    },
  },
  'CHAR-dana': {
    waiting: {
      decision_type: 'observe',
      action_outcome: 'track harbor arrival signals with held breath not direct scene cut',
    },
    memory: {
      decision_type: 'search',
      action_outcome: 'trace memory object to deepen isolation before acting',
    },
    discovery: {
      decision_type: 'hide',
      action_outcome: 'withdraw slightly then notice companion on bench',
    },
    distance: {
      decision_type: 'leave',
      action_outcome: 'pause at doorway threshold before emotional distance widens',
    },
    longing: {
      decision_type: 'search',
      action_outcome: 'seek window reflection for absent bond rather than confrontation',
    },
    hope: {
      decision_type: 'wait',
      action_outcome: 'hold horizon hope at bridge crossing before matching stride',
    },
    journey: {
      decision_type: 'follow',
      action_outcome: 'mount morning path with optimistic cadence behind guardian lead',
    },
    conflict: {
      decision_type: 'wait',
      action_outcome: 'signal crosswalk pause with honest tension before moving',
    },
    sacrifice: {
      decision_type: 'wait',
      action_outcome: 'freeze between laundry chore and duty choice',
    },
    healing: {
      decision_type: 'observe',
      action_outcome: 'accept tea and pet comfort with gradual softening',
    },
    forgiveness: {
      decision_type: 'follow',
      action_outcome: 'reach for market item as trust bridge after withdrawal',
    },
    reunion: {
      decision_type: 'follow',
      action_outcome: 'accelerate recognition into matched shore pace',
    },
    departure: {
      decision_type: 'observe',
      action_outcome: 'scan skyline while releasing parapet touch slowly',
    },
    growth: {
      decision_type: 'follow',
      action_outcome: 'receive mentor guidance with evaluative side glance',
    },
    redemption: {
      decision_type: 'wait',
      action_outcome: 'kneel for flower ritual under stars before reunion contact',
    },
    new_beginning: {
      decision_type: 'follow',
      action_outcome: 'accept guardian presence in morning doorway routine',
    },
  },
};

function getBeatForScene(scene: StoryboardSceneEntry): NarrativeBeatEntry {
  const beat = getNarrativeBeatSeedLibrary().find((entry) => entry.beat_id === scene.beat_id);
  if (!beat) {
    throw new Error(`Missing narrative beat for ${scene.storyboard_id}`);
  }
  return beat;
}

function getIngestionEntry(): SrtEmotionIngestionEntry {
  const entry = getSrtEmotionIngestionSeedLibrary()[0];
  if (!entry) {
    throw new Error('Missing SRT emotion ingestion entry');
  }
  return entry;
}

function getEmotionTimelineSegment(
  ingestion: SrtEmotionIngestionEntry,
  segmentIndex: number
): EmotionTimelineSegment {
  const segment = ingestion.emotion_timeline.find(
    (entry) => entry.segment_index === segmentIndex
  );
  if (!segment) {
    throw new Error(`Missing emotion timeline segment ${segmentIndex}`);
  }
  return segment;
}

function getNarrativeIntent(
  ingestion: SrtEmotionIngestionEntry,
  segmentIndex: number
): NarrativeIntentEntry {
  const intent = ingestion.narrative_intents.find(
    (entry) => entry.segment_index === segmentIndex
  );
  if (!intent) {
    throw new Error(`Missing narrative intent for segment ${segmentIndex}`);
  }
  return intent;
}

function buildWorldConstraintsForDecision(
  ingestion: SrtEmotionIngestionEntry
): string[] {
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  const selected = ingestion.world_constraints.filter(
    (token) =>
      token.startsWith('law:') ||
      token.startsWith('world:') ||
      token.startsWith('locked-dimension:') ||
      token.startsWith('forbidden-from-lyrics:') ||
      token.startsWith('principle:')
  );

  if (world) {
    selected.push(`world:${world.world_id}`, `world-tone:${world.world_tone[0] ?? 'gonagi'}`);
  }

  return [...new Set(selected)].sort();
}

function buildSceneBindings(
  scene: StoryboardSceneEntry,
  emotionSegment: EmotionTimelineSegment,
  characterId: SeedCharacterId,
  ingestion: SrtEmotionIngestionEntry
): string[] {
  const order = String(scene.scene_order).padStart(2, '0');
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);
  const turn = orchestration?.narrative_turns.find((token) => token.startsWith(`turn:${order}:`));
  const storyBeat = orchestration?.output_story_beats.find((token) =>
    token.startsWith(`story-beat:${order}:`)
  );

  const bindings = [
    `storyboard:${scene.storyboard_id}`,
    `segment:${order}`,
    `emotion-timeline:segment-${order}:${emotionSegment.emotion_id}`,
    `srt-ingestion:${ingestion.ingestion_id}`,
    `orchestration:${STORY_ORCHESTRATION_ID}`,
    `continuity:CCN-${characterId}`,
    `decision-layer:emotion-to-decision-to-scene`,
  ];

  if (turn) bindings.push(`orchestration-turn:${turn}`);
  if (storyBeat) bindings.push(`orchestration-beat:${storyBeat}`);

  return bindings;
}

function buildDecisionEntry(
  scene: StoryboardSceneEntry,
  characterId: SeedCharacterId,
  ingestion: SrtEmotionIngestionEntry,
  worldConstraints: string[]
): CharacterDecisionEntry {
  const beat = getBeatForScene(scene);
  const profile = DECISION_PROFILES[characterId][beat.beat_type];
  if (!profile) {
    throw new Error(`Missing decision profile for ${characterId} beat ${beat.beat_type}`);
  }

  const emotionSegment = getEmotionTimelineSegment(ingestion, scene.scene_order);
  const narrativeIntent = getNarrativeIntent(ingestion, scene.scene_order);
  const order = String(scene.scene_order).padStart(2, '0');

  if (emotionSegment.emotion_id !== beat.emotion_id) {
    throw new Error(
      `Emotion timeline mismatch on segment ${scene.scene_order} for ${characterId}`
    );
  }

  return {
    decision_id: `DEC-${characterId}-segment-${order}`,
    character_id: characterId,
    emotion_id: emotionSegment.emotion_id,
    narrative_intent: narrativeIntent.intent,
    decision_type: profile.decision_type,
    action_outcome: profile.action_outcome,
    world_constraints: [...worldConstraints],
    scene_bindings: buildSceneBindings(scene, emotionSegment, characterId, ingestion),
    keywords: [
      'character-decision',
      CHARACTER_DECISION_SONG_MASTER_ID,
      characterId,
      `emotion:${emotionSegment.emotion_id}`,
      `decision:${profile.decision_type}`,
      `beat:${beat.beat_type}`,
      `segment:${order}`,
      `srt:${SRT_EMOTION_INGESTION_ID}`,
      `orchestration:${STORY_ORCHESTRATION_ID}`,
      WORLD_DNA_PRIORITY_LAW,
    ],
  };
}

export function getCharacterDecisionSeedLibrary(): CharacterDecisionEntry[] {
  const ingestion = getIngestionEntry();
  const scenes = getStoryboardSceneSeedLibrary();
  const worldConstraints = buildWorldConstraintsForDecision(ingestion);
  const decisions: CharacterDecisionEntry[] = [];

  for (const scene of scenes) {
    for (const characterId of SEED_CHARACTER_IDS) {
      decisions.push(buildDecisionEntry(scene, characterId, ingestion, worldConstraints));
    }
  }

  return decisions
    .sort((left, right) => {
      const leftSegment = left.scene_bindings.find((token) => token.startsWith('segment:'));
      const rightSegment = right.scene_bindings.find((token) => token.startsWith('segment:'));
      const segmentCompare = (leftSegment ?? '').localeCompare(rightSegment ?? '');
      if (segmentCompare !== 0) return segmentCompare;
      return left.character_id.localeCompare(right.character_id);
    })
    .map((entry) => ({
      ...entry,
      world_constraints: [...entry.world_constraints],
      scene_bindings: [...entry.scene_bindings],
      keywords: [...entry.keywords],
    }));
}

export function buildCharacterDecisionPreview(): CharacterDecisionPreview {
  return {
    layer_version: CHARACTER_DECISION_VERSION,
    seed_count: CHARACTER_DECISION_SEED_COUNT,
    song_master_id: CHARACTER_DECISION_SONG_MASTER_ID,
    required_fields: [...REQUIRED_CHARACTER_DECISION_FIELDS],
    seed_decision_types: [...SEED_DECISION_TYPES],
    pipeline_chain: [
      'character_continuity',
      'srt_emotion_ingestion',
      'story_orchestration',
      'world_continuity',
      'character_decision',
    ],
    seed_character_decisions: getCharacterDecisionSeedLibrary(),
  };
}

export function findDuplicateDecisionIds(decisionIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of decisionIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getCharacterDecisionById(
  decisionId: string
): CharacterDecisionEntry | undefined {
  return getCharacterDecisionSeedLibrary().find((entry) => entry.decision_id === decisionId);
}

export function getCharacterDecisionsForSegment(segmentOrder: number): CharacterDecisionEntry[] {
  const order = String(segmentOrder).padStart(2, '0');
  return getCharacterDecisionSeedLibrary().filter((entry) =>
    entry.scene_bindings.some((token) => token === `segment:${order}`)
  );
}

export function getCharacterDecisionsByCharacterId(
  characterId: SeedCharacterId
): CharacterDecisionEntry[] {
  return getCharacterDecisionSeedLibrary().filter((entry) => entry.character_id === characterId);
}

export function isValidDecisionType(value: string): value is SeedDecisionType {
  return (SEED_DECISION_TYPES as readonly string[]).includes(value);
}

export function getCharacterContinuityIdForCharacter(characterId: SeedCharacterId): string {
  return `CCN-${characterId}`;
}

export function validateCharacterContinuityReference(characterId: SeedCharacterId): boolean {
  return getCharacterContinuitySeedLibrary().some(
    (entry) => entry.character_id === characterId
  );
}

export function getEmotionTimelineReferenceToken(
  segmentIndex: number,
  emotionId: SeedEmotionDnaId
): string {
  const order = String(segmentIndex).padStart(2, '0');
  return `emotion-timeline:segment-${order}:${emotionId}`;
}
