import { type DailyLifeAnchor } from './narrativeBeatDefinitions.js';
import { getPromptPackPairSeedLibrary } from './promptPackPairingDefinitions.js';
import {
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
  type StoryboardSceneEntry,
} from './storyboardLayerDefinitions.js';

export const LOCATION_CONTINUITY_VERSION = 'LOCATION-CONTINUITY-PHASE-88-v1' as const;
export const LOCATION_CONTINUITY_SEED_COUNT = 8 as const;
export const LOCATION_CONTINUITY_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;

export const SEED_LOCATION_IDS = [
  'LOC-home',
  'LOC-station',
  'LOC-bridge',
  'LOC-street',
  'LOC-school',
  'LOC-shore',
  'LOC-rooftop',
  'LOC-forest',
] as const;

export type SeedLocationId = (typeof SEED_LOCATION_IDS)[number];

export const CONTINUITY_SCORE_MIN = 1 as const;
export const CONTINUITY_SCORE_MAX = 100 as const;

export const REQUIRED_LOCATION_CONTINUITY_FIELDS = [
  'location_id',
  'location_name',
  'environment_anchor',
  'architecture_anchor',
  'lighting_anchor',
  'weather_anchor',
  'color_anchor',
  'scene_references',
  'continuity_score',
] as const;

export type RequiredLocationContinuityField =
  (typeof REQUIRED_LOCATION_CONTINUITY_FIELDS)[number];

export interface LocationContinuityEntry {
  location_id: SeedLocationId;
  location_name: string;
  environment_anchor: string[];
  architecture_anchor: string[];
  lighting_anchor: string[];
  weather_anchor: string[];
  color_anchor: string[];
  scene_references: string[];
  continuity_score: number;
}

export interface LocationContinuityPreview {
  layer_version: typeof LOCATION_CONTINUITY_VERSION;
  seed_count: typeof LOCATION_CONTINUITY_SEED_COUNT;
  song_master_id: typeof LOCATION_CONTINUITY_SONG_MASTER_ID;
  required_fields: RequiredLocationContinuityField[];
  pipeline_chain: [
    'song_master',
    'emotion_timeline',
    'narrative_beat',
    'storyboard_scene',
    'image_prompt_pack',
    'video_prompt_pack',
    'prompt_pack_pair',
    'location_continuity',
  ];
  seed_location_continuity: LocationContinuityEntry[];
}

interface LocationSeedProfile {
  location_id: SeedLocationId;
  location_name: string;
  environment_anchor: string[];
  architecture_anchor: string[];
  lighting_anchor: string[];
  weather_anchor: string[];
  color_anchor: string[];
}

const ANCHOR_TO_LOCATION: Record<DailyLifeAnchor, SeedLocationId> = {
  window_gazing: 'LOC-home',
  rain_watching: 'LOC-home',
  tea_drinking: 'LOC-home',
  book_reading: 'LOC-home',
  walking_alone: 'LOC-street',
  bus_waiting: 'LOC-station',
  train_riding: 'LOC-station',
  letter_writing: 'LOC-home',
  photo_viewing: 'LOC-home',
  flower_watering: 'LOC-home',
  pet_care: 'LOC-home',
  market_visit: 'LOC-street',
  school_walk: 'LOC-school',
  bridge_crossing: 'LOC-bridge',
  sunset_watching: 'LOC-bridge',
  star_gazing: 'LOC-forest',
  room_cleaning: 'LOC-home',
  cooking: 'LOC-home',
  laundry: 'LOC-home',
  bicycle_riding: 'LOC-street',
  bench_sitting: 'LOC-home',
  forest_path: 'LOC-forest',
  shore_walking: 'LOC-shore',
  snow_watching: 'LOC-home',
  music_listening: 'LOC-home',
  earphone_walk: 'LOC-street',
  station_waiting: 'LOC-station',
  doorway_pause: 'LOC-home',
  rooftop_visit: 'LOC-rooftop',
  street_crossing: 'LOC-street',
  morning_routine: 'LOC-home',
  evening_return: 'LOC-home',
};

const LOCATION_SEED_PROFILES: LocationSeedProfile[] = [
  {
    location_id: 'LOC-home',
    location_name: 'Gonagi Home',
    environment_anchor: [
      'LOC-home',
      'domestic interior-exterior threshold',
      'daily-life lived-in warmth',
      'window light and entry path continuity',
    ],
    architecture_anchor: [
      'modest two-story residential facade',
      'wooden doorframe with familiar scratch mark',
      'interior window seat nook',
      'kitchen-living open plan sightline',
    ],
    lighting_anchor: [
      'warm interior practical lights',
      'late afternoon window key',
      'soft evening return glow',
    ],
    weather_anchor: [
      'rain visible through windows',
      'calm interior sheltered from exterior',
      'season-stable domestic atmosphere',
    ],
    color_anchor: [
      'muted cream walls',
      'warm wood tones',
      'soft pastel domestic accents',
    ],
  },
  {
    location_id: 'LOC-station',
    location_name: 'Harbor Transit Station',
    environment_anchor: [
      'LOC-station',
      'transit arrival-departure rhythm',
      'public waiting platform energy',
      'route signage and timetable continuity',
    ],
    architecture_anchor: [
      'covered platform canopy structure',
      'arrival board frame geometry',
      'bench row and ticket gate alignment',
      'train carriage door sightline',
    ],
    lighting_anchor: [
      'platform fluorescent mixed with sunset spill',
      'headlight approach glow',
      'waiting area soft fill',
    ],
    weather_anchor: [
      'open-air platform breeze',
      'occasional drizzle on canopy edge',
      'evening cool-down after sunset',
    ],
    color_anchor: [
      'steel grey platform tones',
      'warm amber arrival lights',
      'deep blue evening sky bleed',
    ],
  },
  {
    location_id: 'LOC-bridge',
    location_name: 'Sunset Crossing Bridge',
    environment_anchor: [
      'LOC-bridge',
      'river-span transitional path',
      'horizon-forward crossing space',
      'water reflection continuity below',
    ],
    architecture_anchor: [
      'suspension cable rhythm',
      'guardrail line perspective',
      'mid-span walkway geometry',
      'distant city silhouette backdrop',
    ],
    lighting_anchor: [
      'golden hour rim on railing',
      'long shadow stretch across deck',
      'warm sky gradient key',
    ],
    weather_anchor: [
      'light wind across open span',
      'clear sunset visibility',
      'stable crossing conditions',
    ],
    color_anchor: [
      'amber sunset wash',
      'cool river blue below',
      'warm stone deck tones',
    ],
  },
  {
    location_id: 'LOC-street',
    location_name: 'Neighborhood Street Grid',
    environment_anchor: [
      'LOC-street',
      'urban pedestrian flow path',
      'crosswalk and market edge continuity',
      'daily commute surface texture',
    ],
    architecture_anchor: [
      'shopfront row repetition',
      'crosswalk signal pole placement',
      'bike lane edge marking',
      'market stall canopy line',
    ],
    lighting_anchor: [
      'street-level mixed daylight',
      'storefront bounce fill',
      'late afternoon long shadows',
    ],
    weather_anchor: [
      'post-rain reflective pavement',
      'open sidewalk breeze',
      'market-hour ambient bustle',
    ],
    color_anchor: [
      'warm storefront signage hues',
      'grey pavement baseline',
      'green crosswalk accent stripes',
    ],
  },
  {
    location_id: 'LOC-school',
    location_name: 'Campus Walkway',
    environment_anchor: [
      'LOC-school',
      'institutional youth pathway',
      'mentor-student practice corridor',
      'campus gate to courtyard flow',
    ],
    architecture_anchor: [
      'school gate arch frame',
      'flagpole and banner line',
      'courtyard hedge boundary',
      'classroom wing sightline',
    ],
    lighting_anchor: [
      'morning campus side light',
      'open courtyard fill',
      'neutral institutional key',
    ],
    weather_anchor: [
      'clear school-day sky',
      'light campus wind on banners',
      'stable academic-hour calm',
    ],
    color_anchor: [
      'school uniform neutral palette',
      'green courtyard planting',
      'white concrete walkway base',
    ],
  },
  {
    location_id: 'LOC-shore',
    location_name: 'Harbor Shoreline',
    environment_anchor: [
      'LOC-shore',
      'coastal reunion approach path',
      'wave-edge rhythmic shoreline',
      'open horizon reunion space',
    ],
    architecture_anchor: [
      'wooden pier edge geometry',
      'breakwater stone line',
      'shore path railing continuity',
      'distant lighthouse silhouette',
    ],
    lighting_anchor: [
      'low sun glint on water',
      'warm rim on shoreline figures',
      'soft reflective fill from sea',
    ],
    weather_anchor: [
      'coastal breeze on clothing',
      'gentle wave motion constant',
      'post-sunset cooling air',
    ],
    color_anchor: [
      'sea blue-green gradient',
      'warm sand and stone tones',
      'sunset amber horizon band',
    ],
  },
  {
    location_id: 'LOC-rooftop',
    location_name: 'Apartment Rooftop',
    environment_anchor: [
      'LOC-rooftop',
      'elevated farewell vista point',
      'skyline contemplation space',
      'wind-exposed departure overlook',
    ],
    architecture_anchor: [
      'parapet wall height continuity',
      'water tank and antenna silhouette',
      'rooftop access door frame',
      'city grid depth planes',
    ],
    lighting_anchor: [
      'skyline haze backlight',
      'cool elevated ambient fill',
      'distant city light pricks at dusk',
    ],
    weather_anchor: [
      'strong rooftop wind ripple',
      'open-air exposure',
      'clear dusk visibility',
    ],
    color_anchor: [
      'cool blue-grey rooftop concrete',
      'warm distant city glow',
      'deep violet dusk sky',
    ],
  },
  {
    location_id: 'LOC-forest',
    location_name: 'Night Forest Clearing',
    environment_anchor: [
      'LOC-forest',
      'tree-lined quiet clearing',
      'star-gazing open canopy gap',
      'redemption ritual night space',
    ],
    architecture_anchor: [
      'natural tree ring boundary',
      'forest path entry sightline',
      'low stone seating circle',
      'branch frame overhead geometry',
    ],
    lighting_anchor: [
      'star field ambient glow',
      'soft moonless night fill',
      'subtle ground-level practical light',
    ],
    weather_anchor: [
      'still night air',
      'leaf rustle micro movement',
      'clear star visibility',
    ],
    color_anchor: [
      'deep forest green shadows',
      'cool night blue-black sky',
      'muted earth floor tones',
    ],
  },
];

function getLocationProfile(locationId: SeedLocationId): LocationSeedProfile {
  const profile = LOCATION_SEED_PROFILES.find((entry) => entry.location_id === locationId);
  if (!profile) {
    throw new Error(`Missing location profile for ${locationId}`);
  }
  return profile;
}

function resolveLocationsForScene(scene: StoryboardSceneEntry): SeedLocationId[] {
  const locations = scene.daily_life_anchor.map((anchor) => ANCHOR_TO_LOCATION[anchor]);
  return [...new Set(locations)];
}

function buildSceneReferenceTokens(storyboardId: string, pairId: string): string[] {
  return [`storyboard:${storyboardId}`, `pair:${pairId}`];
}

function resolveSceneReferencesForLocation(locationId: SeedLocationId): string[] {
  const pairs = getPromptPackPairSeedLibrary();
  const scenes = getStoryboardSceneSeedLibrary();
  const references: string[] = [];

  for (const scene of scenes) {
    if (!resolveLocationsForScene(scene).includes(locationId)) continue;

    const pair = pairs.find((entry) => entry.storyboard_id === scene.storyboard_id);
    if (!pair) continue;

    references.push(...buildSceneReferenceTokens(scene.storyboard_id, pair.pair_id));
  }

  return [...new Set(references)].sort();
}

function calculateContinuityScore(sceneReferences: string[], totalPairs: number): number {
  const pairCount = sceneReferences.filter((reference) => reference.startsWith('pair:')).length;
  if (totalPairs === 0) return CONTINUITY_SCORE_MIN;

  const rawScore = Math.round((pairCount / totalPairs) * CONTINUITY_SCORE_MAX);
  return Math.min(CONTINUITY_SCORE_MAX, Math.max(CONTINUITY_SCORE_MIN, rawScore));
}

function buildLocationContinuity(locationId: SeedLocationId): LocationContinuityEntry {
  const profile = getLocationProfile(locationId);
  const sceneReferences = resolveSceneReferencesForLocation(locationId);
  const pairCount = getPromptPackPairSeedLibrary().length;

  return {
    location_id: profile.location_id,
    location_name: profile.location_name,
    environment_anchor: [...profile.environment_anchor],
    architecture_anchor: [...profile.architecture_anchor],
    lighting_anchor: [...profile.lighting_anchor],
    weather_anchor: [...profile.weather_anchor],
    color_anchor: [...profile.color_anchor],
    scene_references: sceneReferences,
    continuity_score: calculateContinuityScore(sceneReferences, pairCount),
  };
}

export function getLocationContinuitySeedLibrary(): LocationContinuityEntry[] {
  return SEED_LOCATION_IDS.map((locationId) => {
    const entry = buildLocationContinuity(locationId);
    return {
      ...entry,
      environment_anchor: [...entry.environment_anchor],
      architecture_anchor: [...entry.architecture_anchor],
      lighting_anchor: [...entry.lighting_anchor],
      weather_anchor: [...entry.weather_anchor],
      color_anchor: [...entry.color_anchor],
      scene_references: [...entry.scene_references],
    };
  });
}

export function buildLocationContinuityPreview(): LocationContinuityPreview {
  return {
    layer_version: LOCATION_CONTINUITY_VERSION,
    seed_count: LOCATION_CONTINUITY_SEED_COUNT,
    song_master_id: LOCATION_CONTINUITY_SONG_MASTER_ID,
    required_fields: [...REQUIRED_LOCATION_CONTINUITY_FIELDS],
    pipeline_chain: [
      'song_master',
      'emotion_timeline',
      'narrative_beat',
      'storyboard_scene',
      'image_prompt_pack',
      'video_prompt_pack',
      'prompt_pack_pair',
      'location_continuity',
    ],
    seed_location_continuity: getLocationContinuitySeedLibrary(),
  };
}

export function findDuplicateLocationIds(locationIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of locationIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getLocationContinuityById(
  locationId: SeedLocationId
): LocationContinuityEntry | undefined {
  return getLocationContinuitySeedLibrary().find((entry) => entry.location_id === locationId);
}

export function isValidLocationId(value: string): value is SeedLocationId {
  return SEED_LOCATION_IDS.includes(value as SeedLocationId);
}

export function getStoryboardSceneById(storyboardId: string): StoryboardSceneEntry | undefined {
  return getStoryboardSceneSeedLibrary().find((scene) => scene.storyboard_id === storyboardId);
}

export function getPromptPackPairByStoryboardId(storyboardId: string) {
  return getPromptPackPairSeedLibrary().find((pair) => pair.storyboard_id === storyboardId);
}

export function getLocationsForStoryboardScene(storyboardId: string): SeedLocationId[] {
  const scene = getStoryboardSceneById(storyboardId);
  if (!scene) return [];
  return resolveLocationsForScene(scene);
}

export function getAnchorLocationMapping(anchor: DailyLifeAnchor): SeedLocationId {
  return ANCHOR_TO_LOCATION[anchor];
}
