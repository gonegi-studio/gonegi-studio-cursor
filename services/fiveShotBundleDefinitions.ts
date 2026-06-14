import {
  getCharacterDecisionSeedLibrary,
  type CharacterDecisionEntry,
} from './characterDecisionDefinitions.js';
import {
  getImageActingCameraById,
  type ImageActingCameraGrammarEntry,
} from './imageActingCameraGrammarDefinitions.js';
import {
  getLocationContinuityById,
  getLocationsForStoryboardScene,
  type SeedLocationId,
} from './locationContinuityDefinitions.js';
import {
  getSrtEmotionIngestionSeedLibrary,
  DEFAULT_WORLD_SETTING,
  FORBIDDEN_GENERIC_LOCATIONS,
  WORLD_DNA_PRIORITY_LAW,
} from './srtEmotionIngestionDefinitions.js';
import {
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

export const FIVE_SHOT_BUNDLE_VERSION = 'FIVE-SHOT-BUNDLE-PHASE-97C-v1' as const;
export const FIVE_SHOT_BUNDLE_SIZE = 5 as const;
export const FIVE_SHOT_BUNDLE_SEED_COUNT = 3 as const;
export const FIVE_SHOT_BUNDLE_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;
export const FIVE_SHOT_BUNDLE_FINALE_SCENE_ID = 'SBD-song_master_01-16' as const;

export const BUNDLE_SHOT_ROLES = [
  'establish',
  'observe',
  'emotional_change',
  'interaction',
  'transition',
] as const;

export type BundleShotRole = (typeof BUNDLE_SHOT_ROLES)[number];

export const REQUIRED_FIVE_SHOT_BUNDLE_FIELDS = [
  'bundle_id',
  'world_id',
  'location_id',
  'scene_ids',
  'character_decisions',
  'emotional_progression',
  'acting_progression',
  'camera_progression',
  'bundle_transition_out',
  'keywords',
] as const;

export type RequiredFiveShotBundleField = (typeof REQUIRED_FIVE_SHOT_BUNDLE_FIELDS)[number];

export interface FiveShotBundleEntry {
  bundle_id: string;
  world_id: typeof WORLD_CONTINUITY_WORLD_ID;
  location_id: SeedLocationId;
  scene_ids: string[];
  character_decisions: string[];
  emotional_progression: string[];
  acting_progression: string[];
  camera_progression: string[];
  bundle_transition_out: string;
  keywords: string[];
}

export interface FiveShotBundlePreview {
  layer_version: typeof FIVE_SHOT_BUNDLE_VERSION;
  seed_count: typeof FIVE_SHOT_BUNDLE_SEED_COUNT;
  bundle_size: typeof FIVE_SHOT_BUNDLE_SIZE;
  song_master_id: typeof FIVE_SHOT_BUNDLE_SONG_MASTER_ID;
  required_fields: RequiredFiveShotBundleField[];
  bundle_shot_roles: BundleShotRole[];
  default_world_setting: typeof DEFAULT_WORLD_SETTING;
  forbidden_generic_locations: readonly string[];
  pipeline_chain: [
    'storyboard_scene',
    'character_decision',
    'story_orchestration',
    'world_continuity',
    'location_continuity',
    'five_shot_bundle',
  ];
  seed_five_shot_bundles: FiveShotBundleEntry[];
}

interface BundleConfig {
  bundle_id: string;
  location_id: SeedLocationId;
  scene_orders: [number, number, number, number, number];
  bundle_transition_out: string;
  harbor_place_token: string;
}

const BUNDLE_CONFIGS: BundleConfig[] = [
  {
    bundle_id: 'FSB-song_master_01-01',
    location_id: 'LOC-station',
    scene_orders: [1, 2, 3, 4, 5],
    bundle_transition_out:
      'big-scene:bridge-crossing:SBD-song_master_01-06:exit-harbor-home threshold into coastal road hope beat',
    harbor_place_token: 'harbor_pier',
  },
  {
    bundle_id: 'FSB-song_master_01-02',
    location_id: 'LOC-bridge',
    scene_orders: [6, 7, 8, 9, 10],
    bundle_transition_out:
      'big-scene:market-trust:SBD-song_master_01-11:exit-street-bridge arc into public forgiveness beat',
    harbor_place_token: 'coastal_hill_road',
  },
  {
    bundle_id: 'FSB-song_master_01-03',
    location_id: 'LOC-shore',
    scene_orders: [11, 12, 13, 14, 15],
    bundle_transition_out:
      `big-scene:guardian-reset:${FIVE_SHOT_BUNDLE_FINALE_SCENE_ID}:exit-shore-rooftop arc into morning finale`,
    harbor_place_token: 'breakwater',
  },
];

function getSceneByOrder(sceneOrder: number): StoryboardSceneEntry {
  const scene = getStoryboardSceneSeedLibrary().find((entry) => entry.scene_order === sceneOrder);
  if (!scene) {
    throw new Error(`Missing storyboard scene order ${sceneOrder}`);
  }
  return scene;
}

function getActingForScene(storyboardId: string): ImageActingCameraGrammarEntry {
  const acting = getImageActingCameraById(`IAC-${storyboardId}`);
  if (!acting) {
    throw new Error(`Missing acting camera grammar for ${storyboardId}`);
  }
  return acting;
}

function getDecisionsForScene(sceneOrder: number): CharacterDecisionEntry[] {
  const order = String(sceneOrder).padStart(2, '0');
  return getCharacterDecisionSeedLibrary().filter((entry) =>
    entry.scene_bindings.some((token) => token === `segment:${order}`)
  );
}

function getEmotionForSegment(segmentIndex: number): string {
  const ingestion = getSrtEmotionIngestionSeedLibrary()[0];
  const segment = ingestion?.emotion_timeline.find(
    (entry) => entry.segment_index === segmentIndex
  );
  return segment?.emotion_id ?? 'unknown';
}

function buildEmotionalProgression(scenes: StoryboardSceneEntry[]): string[] {
  return scenes.map((scene, index) => {
    const role = BUNDLE_SHOT_ROLES[index];
    const emotion = getEmotionForSegment(scene.scene_order);
    return `${role}:${emotion}:segment-${String(scene.scene_order).padStart(2, '0')}`;
  });
}

function buildActingProgression(scenes: StoryboardSceneEntry[]): string[] {
  return scenes.map((scene, index) => {
    const role = BUNDLE_SHOT_ROLES[index];
    const acting = getActingForScene(scene.storyboard_id);
    return `${role}:${acting.acting_intent}`;
  });
}

function buildCameraProgression(scenes: StoryboardSceneEntry[]): string[] {
  return scenes.map((scene, index) => {
    const role = BUNDLE_SHOT_ROLES[index];
    const acting = getActingForScene(scene.storyboard_id);
    const primaryShot = scene.shot_affinity[0] ?? 'medium_emotional';
    const bundleDistance = `${acting.camera_distance} [${role}]`;
    return `${role}:${acting.camera_angle}|${bundleDistance}|${acting.gaze_direction}|shot:${primaryShot}`;
  });
}

function buildCharacterDecisionIds(scenes: StoryboardSceneEntry[]): string[] {
  const decisionIds: string[] = [];
  for (const scene of scenes) {
    const decisions = getDecisionsForScene(scene.scene_order);
    decisionIds.push(...decisions.map((entry) => entry.decision_id));
  }
  return decisionIds.sort();
}

function buildBundleKeywords(
  config: BundleConfig,
  scenes: StoryboardSceneEntry[]
): string[] {
  return [
    'five-shot-bundle',
    FIVE_SHOT_BUNDLE_SONG_MASTER_ID,
    config.bundle_id,
    `world:${WORLD_CONTINUITY_WORLD_ID}`,
    `location:${config.location_id}`,
    `harbor-place:${config.harbor_place_token}`,
    `orchestration:${STORY_ORCHESTRATION_ID}`,
    WORLD_DNA_PRIORITY_LAW,
    `default-world:${DEFAULT_WORLD_SETTING.replace(/\s+/g, '-')}`,
    'world-preservation:no-modern-transport',
    ...FORBIDDEN_GENERIC_LOCATIONS.map((place) => `forbidden:${place}`),
    ...scenes.map((scene) => `storyboard:${scene.storyboard_id}`),
    ...BUNDLE_SHOT_ROLES.map((role) => `bundle-role:${role}`),
    'no-ai-studio-generation',
  ];
}

function validateBundleLocation(config: BundleConfig, scenes: StoryboardSceneEntry[]): void {
  for (const scene of scenes) {
    const locations = getLocationsForStoryboardScene(scene.storyboard_id);
    if (!locations.includes(config.location_id)) {
      const hasAdjacentHarbor =
        config.location_id === 'LOC-station' &&
        locations.some((location) => location === 'LOC-home' || location === 'LOC-station');
      const hasCoastalLink =
        config.location_id === 'LOC-bridge' &&
        locations.some((location) =>
          ['LOC-bridge', 'LOC-street', 'LOC-home', 'LOC-school'].includes(location)
        );
      const hasShoreLink =
        config.location_id === 'LOC-shore' &&
        locations.some((location) =>
          ['LOC-shore', 'LOC-street', 'LOC-station', 'LOC-rooftop', 'LOC-home', 'LOC-forest', 'LOC-school'].includes(
            location
          )
        );
      if (!hasAdjacentHarbor && !hasCoastalLink && !hasShoreLink) {
        throw new Error(
          `Scene ${scene.storyboard_id} is not compatible with bundle location ${config.location_id}`
        );
      }
    }
  }
}

function buildFiveShotBundleEntry(config: BundleConfig): FiveShotBundleEntry {
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  if (!orchestration) {
    throw new Error(`Missing story orchestration ${STORY_ORCHESTRATION_ID}`);
  }
  if (!world) {
    throw new Error(`Missing world continuity ${WORLD_CONTINUITY_WORLD_ID}`);
  }

  const location = getLocationContinuityById(config.location_id);
  if (!location) {
    throw new Error(`Missing location continuity ${config.location_id}`);
  }

  const scenes = config.scene_orders.map((order) => getSceneByOrder(order));
  validateBundleLocation(config, scenes);

  return {
    bundle_id: config.bundle_id,
    world_id: WORLD_CONTINUITY_WORLD_ID,
    location_id: config.location_id,
    scene_ids: scenes.map((scene) => scene.storyboard_id),
    character_decisions: buildCharacterDecisionIds(scenes),
    emotional_progression: buildEmotionalProgression(scenes),
    acting_progression: buildActingProgression(scenes),
    camera_progression: buildCameraProgression(scenes),
    bundle_transition_out: config.bundle_transition_out,
    keywords: buildBundleKeywords(config, scenes),
  };
}

export function getFiveShotBundleSeedLibrary(): FiveShotBundleEntry[] {
  return BUNDLE_CONFIGS.map((config) => {
    const entry = buildFiveShotBundleEntry(config);
    return {
      ...entry,
      scene_ids: [...entry.scene_ids],
      character_decisions: [...entry.character_decisions],
      emotional_progression: [...entry.emotional_progression],
      acting_progression: [...entry.acting_progression],
      camera_progression: [...entry.camera_progression],
      keywords: [...entry.keywords],
    };
  });
}

export function buildFiveShotBundlePreview(): FiveShotBundlePreview {
  return {
    layer_version: FIVE_SHOT_BUNDLE_VERSION,
    seed_count: FIVE_SHOT_BUNDLE_SEED_COUNT,
    bundle_size: FIVE_SHOT_BUNDLE_SIZE,
    song_master_id: FIVE_SHOT_BUNDLE_SONG_MASTER_ID,
    required_fields: [...REQUIRED_FIVE_SHOT_BUNDLE_FIELDS],
    bundle_shot_roles: [...BUNDLE_SHOT_ROLES],
    default_world_setting: DEFAULT_WORLD_SETTING,
    forbidden_generic_locations: [...FORBIDDEN_GENERIC_LOCATIONS],
    pipeline_chain: [
      'storyboard_scene',
      'character_decision',
      'story_orchestration',
      'world_continuity',
      'location_continuity',
      'five_shot_bundle',
    ],
    seed_five_shot_bundles: getFiveShotBundleSeedLibrary(),
  };
}

export function findDuplicateBundleIds(bundleIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of bundleIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getFiveShotBundleById(bundleId: string): FiveShotBundleEntry | undefined {
  return getFiveShotBundleSeedLibrary().find((entry) => entry.bundle_id === bundleId);
}

export function getAllBundledSceneIds(): string[] {
  return getFiveShotBundleSeedLibrary().flatMap((entry) => entry.scene_ids);
}

export function parseCameraProgressionToken(token: string): {
  role: string;
  cameraAngle: string;
  cameraDistance: string;
  bundleCameraDistance: string;
  gazeDirection: string;
  primaryShot: string;
} | null {
  const match = token.match(/^([^:]+):([^|]+)\|([^|]+)\|([^|]+)\|shot:(.+)$/);
  if (!match) return null;
  const bundleCameraDistance = match[3];
  const cameraDistance = bundleCameraDistance.replace(/\s\[[^\]]+\]$/, '');
  return {
    role: match[1],
    cameraAngle: match[2],
    cameraDistance,
    bundleCameraDistance,
    gazeDirection: match[4],
    primaryShot: match[5],
  };
}

export function containsForbiddenWorldToken(text: string): string | null {
  const sanitized = text
    .replace(/forbidden:[a-z_]+/gi, '')
    .replace(/forbidden-from-lyrics:[a-z_]+/gi, '');
  const normalized = sanitized.toLowerCase().replace(/\s+/g, '_');
  for (const forbidden of FORBIDDEN_GENERIC_LOCATIONS) {
    if (normalized.includes(forbidden)) return forbidden;
  }
  if (normalized.includes('modern_transport')) return 'modern_transport';
  return null;
}

export function getPrimaryDailyLifeAnchor(scene: StoryboardSceneEntry): string {
  return scene.daily_life_anchor[0] ?? 'none';
}

export function getBundleShotRole(index: number): BundleShotRole {
  return BUNDLE_SHOT_ROLES[index] ?? 'establish';
}
