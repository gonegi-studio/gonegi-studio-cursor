import {
  getCharacterContinuitySeedLibrary,
  SEED_CHARACTER_IDS,
} from './characterContinuityDefinitions.js';
import {
  getNarrativeBeatSeedLibrary,
  NARRATIVE_BEAT_SEED_COUNT,
  type NarrativeBeatEntry,
} from './narrativeBeatDefinitions.js';
import {
  getLocationsForStoryboardScene,
  getLocationContinuitySeedLibrary,
  type SeedLocationId,
} from './locationContinuityDefinitions.js';
import {
  getSongMasterSeedLibrary,
  type SongMasterEntry,
} from './songMasterLibraryDefinitions.js';
import {
  STORYBOARD_SEED_COUNT,
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
  type StoryboardSceneEntry,
} from './storyboardLayerDefinitions.js';
import {
  getWorldContinuityById,
  WORLD_CONTINUITY_WORLD_ID,
} from './worldContinuityDefinitions.js';

export const STORY_ORCHESTRATION_VERSION = 'STORY-ORCHESTRATION-PHASE-96-v1' as const;
export const STORY_ORCHESTRATION_SEED_COUNT = 1 as const;
export const STORY_ORCHESTRATION_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;
export const STORY_ORCHESTRATION_ID = `ORCH-${STORYBOARD_SONG_MASTER_ID}` as const;

export const ANTI_REPETITION_RULES_BASE = [
  'no-consecutive-same-primary-location',
  'no-consecutive-same-daily-life-anchor',
  'no-consecutive-same-emotion-beat',
  'no-consecutive-same-behavior-pose-pattern',
  'no-static-mirror-scene-repeat',
  'no-beginner-loop-dialogue-pattern',
  'no-elementary-repetition-story-loop',
  'no-ai-studio-generation',
] as const;

export const REQUIRED_STORY_ORCHESTRATION_FIELDS = [
  'orchestration_id',
  'song_master_id',
  'world_id',
  'story_theme',
  'emotional_arc',
  'narrative_turns',
  'character_decisions',
  'daily_life_contrast',
  'scene_variation_rules',
  'anti_repetition_rules',
  'cinematic_influence_tags',
  'output_story_beats',
  'keywords',
] as const;

export type RequiredStoryOrchestrationField =
  (typeof REQUIRED_STORY_ORCHESTRATION_FIELDS)[number];

export interface StoryOrchestrationEntry {
  orchestration_id: typeof STORY_ORCHESTRATION_ID;
  song_master_id: typeof STORY_ORCHESTRATION_SONG_MASTER_ID;
  world_id: typeof WORLD_CONTINUITY_WORLD_ID;
  story_theme: string;
  emotional_arc: string[];
  narrative_turns: string[];
  character_decisions: string[];
  daily_life_contrast: string[];
  scene_variation_rules: string[];
  anti_repetition_rules: string[];
  cinematic_influence_tags: string[];
  output_story_beats: string[];
  keywords: string[];
}

export interface StoryOrchestrationPreview {
  layer_version: typeof STORY_ORCHESTRATION_VERSION;
  seed_count: typeof STORY_ORCHESTRATION_SEED_COUNT;
  song_master_id: typeof STORY_ORCHESTRATION_SONG_MASTER_ID;
  required_fields: RequiredStoryOrchestrationField[];
  anti_repetition_rules_base: readonly string[];
  pipeline_chain: [
    'song_master',
    'narrative_beat',
    'world_continuity',
    'character_continuity',
    'location_continuity',
    'story_orchestration',
  ];
  seed_story_orchestration: StoryOrchestrationEntry[];
}

const CHARACTER_DECISION_VERBS: Record<
  (typeof SEED_CHARACTER_IDS)[number],
  Record<string, string>
> = {
  'CHAR-gonagi': {
    waiting: 'hold-space-without-rushing-the-moment',
    memory: 'acknowledge-past-without-forcing-contact',
    discovery: 'observe-friendship-cue-before-speaking',
    distance: 'accept-separation-threshold-with-respect',
    longing: 'endure-absence-with-quiet-vigil',
    hope: 'choose-forward-motion-over-retreat',
    journey: 'lead-departure-with-optimistic-cadence',
    conflict: 'align-rival-energy-into-shared-resolve',
    sacrifice: 'commit-to-duty-despite-domestic-pull',
    healing: 'offer-small-care-gesture-first',
    forgiveness: 'reopen-trust-through-shared-public-action',
    reunion: 'close-distance-with-recognition-not-announcement',
    departure: 'release-with-bittersweet-restraint',
    growth: 'guide-without-overriding-student-agency',
    redemption: 'perform-ritual-before-seeking-forgiveness',
    new_beginning: 'reset-guardian-role-through-morning-care',
  },
  'CHAR-dana': {
    waiting: 'track-arrival-signals-with-held-breath',
    memory: 'trace-memory-object-to-feel-isolation',
    discovery: 'withdraw-slightly-then-notice-companion',
    distance: 'pause-at-threshold-before-leaving',
    longing: 'seek-reflection-in-window-rather-than-confrontation',
    hope: 'match-bridge-crossing-with-lightened-stride',
    journey: 'mount-bike-with-morning-optimism',
    conflict: 'signal-pause-at-crosswalk-with-honest-tension',
    sacrifice: 'freeze-between-chore-and-duty-choice',
    healing: 'accept-tea-and-pet-comfort-with-softening',
    forgiveness: 'reach-for-market-item-as-trust-bridge',
    reunion: 'accelerate-recognition-into-shared-pace',
    departure: 'scan-skyline-while-releasing-parapet-touch',
    growth: 'receive-mentor-guidance-with-evaluative-glance',
    redemption: 'kneel-for-flower-ritual-under-stars',
    new_beginning: 'accept-guardian-presence-in-morning-routine',
  },
};

function getSongMasterForOrchestration(): SongMasterEntry {
  const songMaster = getSongMasterSeedLibrary().find(
    (entry) => entry.song_master_id === STORY_ORCHESTRATION_SONG_MASTER_ID
  );
  if (!songMaster) {
    throw new Error(`Missing song master ${STORY_ORCHESTRATION_SONG_MASTER_ID}`);
  }
  return songMaster;
}

function getBeatForScene(scene: StoryboardSceneEntry): NarrativeBeatEntry {
  const beat = getNarrativeBeatSeedLibrary().find((entry) => entry.beat_id === scene.beat_id);
  if (!beat) {
    throw new Error(`Missing narrative beat ${scene.beat_id} for ${scene.storyboard_id}`);
  }
  return beat;
}

function buildStoryTheme(songMaster: SongMasterEntry): string {
  return `Guardian-companion bond arc from ${songMaster.primary_emotion} through daily-life ritual contrast to relational reunion and protective renewal`;
}

function buildEmotionalArc(songMaster: SongMasterEntry): string[] {
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  const beats = getNarrativeBeatSeedLibrary();

  const arc = [
    `theme-emotion:${songMaster.primary_emotion}`,
    `theme-relationship:${songMaster.primary_relationship}`,
    ...songMaster.emotion_timeline.map(
      (segment) =>
        `timeline:${segment.start_time}-${segment.end_time}s:${segment.emotion_id}:${segment.music_grammar_id}`
    ),
  ];

  if (world) {
    arc.push(...world.emotional_world_arc.map((token) => `world-arc:${token}`));
  }

  arc.push(...beats.map((beat, index) => `beat-${String(index + 1).padStart(2, '0')}:${beat.emotion_id}:${beat.beat_type}`));

  return [...new Set(arc)];
}

function buildNarrativeTurns(scenes: StoryboardSceneEntry[]): string[] {
  return scenes.map((scene) => {
    const beat = getBeatForScene(scene);
    const order = String(scene.scene_order).padStart(2, '0');
    return `turn:${order}:${beat.beat_id}:${beat.narrative_function}:${beat.daily_life_anchor.join('+')}`;
  });
}

function buildCharacterDecisions(scenes: StoryboardSceneEntry[]): string[] {
  const decisions: string[] = [];

  for (const scene of scenes) {
    const beat = getBeatForScene(scene);
    for (const characterId of SEED_CHARACTER_IDS) {
      const verb = CHARACTER_DECISION_VERBS[characterId][beat.beat_type];
      if (!verb) continue;
      decisions.push(
        `decision:${scene.storyboard_id}:${characterId}:${beat.beat_type}:${verb}`
      );
      decisions.push(
        `continuity:CCN-${characterId}:scene:${scene.storyboard_id}:function:${beat.narrative_function}`
      );
    }
  }

  return decisions;
}

function buildDailyLifeContrast(scenes: StoryboardSceneEntry[]): string[] {
  const contrasts: string[] = [];

  for (let index = 1; index < scenes.length; index += 1) {
    const previous = scenes[index - 1];
    const current = scenes[index];
    const previousPrimary = previous.daily_life_anchor[0] ?? 'none';
    const currentPrimary = current.daily_life_anchor[0] ?? 'none';
    const previousLocation = getLocationsForStoryboardScene(previous.storyboard_id)[0] ?? 'unknown';
    const currentLocation = getLocationsForStoryboardScene(current.storyboard_id)[0] ?? 'unknown';

    contrasts.push(
      `contrast:scene-${String(previous.scene_order).padStart(2, '0')}-to-${String(current.scene_order).padStart(2, '0')}:${previousPrimary}->${currentPrimary}:${previousLocation}->${currentLocation}`
    );
  }

  contrasts.push(
    ...scenes.map((scene) => {
      const beat = getBeatForScene(scene);
      return `anchor-set:${scene.storyboard_id}:${beat.daily_life_anchor.join('+')}:must-not-repeat-previous-primary`;
    })
  );

  return contrasts;
}

function buildSceneVariationRules(scenes: StoryboardSceneEntry[]): string[] {
  const rules: string[] = [
    'vary-primary-shot-between-consecutive-scenes',
    'alternate-interior-exterior-when-location-allows',
    'shift-time-of-day-band-every-three-scenes',
    'rotate-character-blocking-side-each-scene',
    'change-environment-interaction-prop-each-scene',
  ];

  for (const scene of scenes) {
    const locations = getLocationsForStoryboardScene(scene.storyboard_id);
    const primaryShot = scene.shot_affinity[0] ?? 'medium_emotional';
    rules.push(
      `scene-rule:${scene.storyboard_id}:location:${locations.join('+')}:shot:${primaryShot}`
    );
  }

  return rules;
}

function buildAntiRepetitionRules(scenes: StoryboardSceneEntry[]): string[] {
  return [
    ...ANTI_REPETITION_RULES_BASE,
    ...scenes.map(
      (scene) =>
        `scene-guard:${scene.storyboard_id}:no-repeat-previous-location-emotion-pose`
    ),
  ];
}

function buildCinematicInfluenceTags(
  songMaster: SongMasterEntry,
  scenes: StoryboardSceneEntry[]
): string[] {
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  const tags = new Set<string>([
    'influence:cinematic-music-video-realism',
    'influence:gonagi-visual-grammar',
    'influence:daily-life-anchor-motif',
    `influence:song-master:${songMaster.song_master_id}`,
    `influence:video-profile:${songMaster.video_profile}`,
  ]);

  if (world) {
    for (const tone of world.world_tone) tags.add(`influence:tone:${tone}`);
    for (const motif of world.recurring_motifs) tags.add(`influence:${motif}`);
  }

  for (const scene of scenes) {
    const beat = getBeatForScene(scene);
    for (const camera of beat.camera_affinity) tags.add(`influence:camera:${camera}`);
    for (const music of beat.music_affinity) tags.add(`influence:music:${music}`);
    for (const shot of scene.shot_affinity) tags.add(`influence:shot:${shot}`);
  }

  return [...tags].sort();
}

function buildOutputStoryBeats(scenes: StoryboardSceneEntry[]): string[] {
  return scenes.map((scene) => {
    const beat = getBeatForScene(scene);
    const order = String(scene.scene_order).padStart(2, '0');
    return `story-beat:${order}:${beat.beat_id}:${scene.storyboard_id}:${beat.beat_type}:${beat.emotion_id}:${beat.narrative_function}`;
  });
}

function buildKeywords(songMaster: SongMasterEntry): string[] {
  return [
    ...songMaster.keywords,
    'story-orchestration',
    STORY_ORCHESTRATION_SONG_MASTER_ID,
    `world:${WORLD_CONTINUITY_WORLD_ID}`,
    'narrative-grammar-driven',
    'anti-elementary-repetition',
  ];
}

function buildStoryOrchestrationEntry(): StoryOrchestrationEntry {
  const songMaster = getSongMasterForOrchestration();
  const scenes = getStoryboardSceneSeedLibrary();
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);

  if (!world) {
    throw new Error(`Missing world continuity ${WORLD_CONTINUITY_WORLD_ID}`);
  }

  if (scenes.length !== STORYBOARD_SEED_COUNT) {
    throw new Error(`Expected ${STORYBOARD_SEED_COUNT} storyboard scenes for orchestration`);
  }

  if (getNarrativeBeatSeedLibrary().length !== NARRATIVE_BEAT_SEED_COUNT) {
    throw new Error(`Expected ${NARRATIVE_BEAT_SEED_COUNT} narrative beats for orchestration`);
  }

  return {
    orchestration_id: STORY_ORCHESTRATION_ID,
    song_master_id: STORY_ORCHESTRATION_SONG_MASTER_ID,
    world_id: WORLD_CONTINUITY_WORLD_ID,
    story_theme: buildStoryTheme(songMaster),
    emotional_arc: buildEmotionalArc(songMaster),
    narrative_turns: buildNarrativeTurns(scenes),
    character_decisions: buildCharacterDecisions(scenes),
    daily_life_contrast: buildDailyLifeContrast(scenes),
    scene_variation_rules: buildSceneVariationRules(scenes),
    anti_repetition_rules: buildAntiRepetitionRules(scenes),
    cinematic_influence_tags: buildCinematicInfluenceTags(songMaster, scenes),
    output_story_beats: buildOutputStoryBeats(scenes),
    keywords: buildKeywords(songMaster),
  };
}

export function getStoryOrchestrationSeedLibrary(): StoryOrchestrationEntry[] {
  const entry = buildStoryOrchestrationEntry();
  return [
    {
      ...entry,
      emotional_arc: [...entry.emotional_arc],
      narrative_turns: [...entry.narrative_turns],
      character_decisions: [...entry.character_decisions],
      daily_life_contrast: [...entry.daily_life_contrast],
      scene_variation_rules: [...entry.scene_variation_rules],
      anti_repetition_rules: [...entry.anti_repetition_rules],
      cinematic_influence_tags: [...entry.cinematic_influence_tags],
      output_story_beats: [...entry.output_story_beats],
      keywords: [...entry.keywords],
    },
  ];
}

export function buildStoryOrchestrationPreview(): StoryOrchestrationPreview {
  return {
    layer_version: STORY_ORCHESTRATION_VERSION,
    seed_count: STORY_ORCHESTRATION_SEED_COUNT,
    song_master_id: STORY_ORCHESTRATION_SONG_MASTER_ID,
    required_fields: [...REQUIRED_STORY_ORCHESTRATION_FIELDS],
    anti_repetition_rules_base: [...ANTI_REPETITION_RULES_BASE],
    pipeline_chain: [
      'song_master',
      'narrative_beat',
      'world_continuity',
      'character_continuity',
      'location_continuity',
      'story_orchestration',
    ],
    seed_story_orchestration: getStoryOrchestrationSeedLibrary(),
  };
}

export function findDuplicateOrchestrationIds(orchestrationIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of orchestrationIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getStoryOrchestrationById(
  orchestrationId: string
): StoryOrchestrationEntry | undefined {
  return getStoryOrchestrationSeedLibrary().find(
    (entry) => entry.orchestration_id === orchestrationId
  );
}

export function getSongMasterById(songMasterId: string) {
  return getSongMasterSeedLibrary().find((entry) => entry.song_master_id === songMasterId);
}

export function getNarrativeBeatById(beatId: string): NarrativeBeatEntry | undefined {
  return getNarrativeBeatSeedLibrary().find((beat) => beat.beat_id === beatId);
}

export function getCharacterContinuityIdsForOrchestration(): string[] {
  return getCharacterContinuitySeedLibrary().map((entry) => entry.continuity_id);
}

export function getLocationContinuityIdsForOrchestration(): SeedLocationId[] {
  return getLocationContinuitySeedLibrary().map((entry) => entry.location_id);
}

export function getStoryboardSceneById(storyboardId: string): StoryboardSceneEntry | undefined {
  return getStoryboardSceneSeedLibrary().find((scene) => scene.storyboard_id === storyboardId);
}

export function parseOutputStoryBeatToken(token: string): {
  sceneOrder: string;
  beatId: string;
  storyboardId: string;
  beatType: string;
} | null {
  const parts = token.split(':');
  if (parts.length < 6 || parts[0] !== 'story-beat') return null;
  return {
    sceneOrder: parts[1],
    beatId: parts[2],
    storyboardId: parts[3],
    beatType: parts[4],
  };
}

export function parseDailyLifeContrastPair(token: string): {
  fromAnchor: string;
  toAnchor: string;
} | null {
  const match = token.match(/^contrast:scene-\d+-to-\d+:([^:]+)->([^:]+):/);
  if (!match) return null;
  return { fromAnchor: match[1], toAnchor: match[2] };
}
