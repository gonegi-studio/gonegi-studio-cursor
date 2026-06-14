import {
  getImagePromptPackSeedLibrary,
  IMAGE_PROMPT_PACK_SEED_COUNT,
  IMAGE_PROMPT_PACK_SONG_MASTER_ID,
  type ImagePromptPackEntry,
} from './imagePromptPackDefinitions.js';
import { type DailyLifeAnchor } from './narrativeBeatDefinitions.js';
import {
  getAnchorLocationMapping,
  getLocationsForStoryboardScene,
  type SeedLocationId,
} from './locationContinuityDefinitions.js';
import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import {
  getStoryboardSceneSeedLibrary,
  type StoryboardSceneEntry,
} from './storyboardLayerDefinitions.js';

export const IMAGE_ACTING_CAMERA_GRAMMAR_VERSION =
  'IMAGE-ACTING-CAMERA-GRAMMAR-PHASE-92-v1' as const;
export const IMAGE_ACTING_CAMERA_GRAMMAR_SEED_COUNT = IMAGE_PROMPT_PACK_SEED_COUNT;
export const IMAGE_ACTING_CAMERA_GRAMMAR_SONG_MASTER_ID = IMAGE_PROMPT_PACK_SONG_MASTER_ID;

export const ANTI_STATIC_POSE_RULES_BASE = [
  'no-direct-frontal-eye-contact-with-camera',
  'no-parade-rest-standing-posture',
  'no-decoration-only-background',
  'require-in-progress-body-action',
  'require-environment-touch-or-use',
  'no-ai-studio-generation',
] as const;

export const REQUIRED_IMAGE_ACTING_CAMERA_FIELDS = [
  'acting_camera_id',
  'image_prompt_pack_id',
  'storyboard_id',
  'scene_order',
  'acting_intent',
  'body_action',
  'gaze_direction',
  'hand_action',
  'posture_variation',
  'camera_angle',
  'camera_distance',
  'camera_movement_hint',
  'subject_blocking',
  'environment_interaction',
  'location_variation',
  'foreground_midground_background',
  'anti_static_pose_rules',
  'next_video_potential',
  'keywords',
] as const;

export type RequiredImageActingCameraField =
  (typeof REQUIRED_IMAGE_ACTING_CAMERA_FIELDS)[number];

export interface ImageActingCameraGrammarEntry {
  acting_camera_id: string;
  image_prompt_pack_id: string;
  storyboard_id: string;
  scene_order: number;
  acting_intent: string;
  body_action: string;
  gaze_direction: string;
  hand_action: string;
  posture_variation: string;
  camera_angle: string;
  camera_distance: string;
  camera_movement_hint: string;
  subject_blocking: string;
  environment_interaction: string;
  location_variation: string;
  foreground_midground_background: string[];
  anti_static_pose_rules: string[];
  next_video_potential: string[];
  keywords: string[];
}

export interface ImageActingCameraGrammarPreview {
  layer_version: typeof IMAGE_ACTING_CAMERA_GRAMMAR_VERSION;
  seed_count: typeof IMAGE_ACTING_CAMERA_GRAMMAR_SEED_COUNT;
  song_master_id: typeof IMAGE_ACTING_CAMERA_GRAMMAR_SONG_MASTER_ID;
  required_fields: RequiredImageActingCameraField[];
  anti_static_pose_rules_base: readonly string[];
  pipeline_chain: [
    'song_master',
    'emotion_timeline',
    'narrative_beat',
    'storyboard_scene',
    'image_prompt_pack',
    'image_acting_camera_grammar',
  ];
  seed_image_acting_camera_grammar: ImageActingCameraGrammarEntry[];
}

interface SceneActingProfile {
  acting_intent: string;
  body_action: string;
  gaze_direction: string;
  hand_action: string;
  posture_variation: string;
  subject_blocking: string;
  environment_interaction: string;
  location_variation_suffix: string;
  foreground: string;
  midground: string;
  background: string;
  next_video_potential: string[];
}

const SCENE_ACTING_PROFILES: SceneActingProfile[] = [
  {
    acting_intent: 'wait with restrained anticipation while tracking arrival cues',
    body_action: 'weight shift idle at platform edge',
    gaze_direction: 'off-camera toward arrival board and track gap',
    hand_action: 'hands clasped loosely holding ticket edge',
    posture_variation: 'slight forward lean at rest not parade rest',
    subject_blocking: 'subject left-third facing platform depth',
    environment_interaction: 'gloved hand rests on platform bench back',
    location_variation_suffix: 'station-canopy-wait-line-a',
    foreground: 'bench rail and ticket corner',
    midground: 'subject waiting profile',
    background: 'arrival board glow and track depth',
    next_video_potential: ['micro push-in on anticipation beat', 'platform wind ripple'],
  },
  {
    acting_intent: 'process memory isolation through object handling',
    body_action: 'collapsed inward while seated with album open',
    gaze_direction: 'downward at photo corner not lens',
    hand_action: 'thumb traces photo edge with pen nearby',
    posture_variation: 'curved spine over desk not upright pose',
    subject_blocking: 'subject center-low at writing desk',
    environment_interaction: 'letter paper and photo album actively held',
    location_variation_suffix: 'home-desk-memory-corner-b',
    foreground: 'photo album page curl',
    midground: 'subject hunched over desk',
    background: 'dim room shelf depth',
    next_video_potential: ['slow vertical settle on isolation', 'page corner flutter'],
  },
  {
    acting_intent: 'hesitate during quiet shared routine with unspoken tension',
    body_action: 'recoiled posture on bench with book half-open',
    gaze_direction: 'averted toward companion side not camera',
    hand_action: 'self-touch collar while holding book spine',
    posture_variation: 'seated asymmetry with knee angled away',
    subject_blocking: 'two-seat gap on park bench diagonal',
    environment_interaction: 'book pages and bench slat contact',
    location_variation_suffix: 'home-bench-reading-nook-c',
    foreground: 'book page edge',
    midground: 'subject profile on bench',
    background: 'park path soft blur',
    next_video_potential: ['static breath drift in window light', 'leaf fall drift'],
  },
  {
    acting_intent: 'pause at departure threshold before emotional distance widens',
    body_action: 'turned away half-step at doorway',
    gaze_direction: 'over shoulder toward interior light not lens',
    hand_action: 'hand on doorframe with bag strap grip',
    posture_variation: 'threshold pause with hip angled out',
    subject_blocking: 'subject framed in doorway vertical split',
    environment_interaction: 'doorframe touch and luggage handle use',
    location_variation_suffix: 'home-threshold-departure-d',
    foreground: 'door handle and strap',
    midground: 'subject in doorway silhouette',
    background: 'interior warm against exterior cool',
    next_video_potential: ['slow pullback through threshold', 'door micro movement'],
  },
  {
    acting_intent: 'hold longing while rain streaks frame absent bond',
    body_action: 'stationary weight shift at window seat',
    gaze_direction: 'through window reflection toward street not lens',
    hand_action: 'finger fidget on window ledge',
    posture_variation: 'seated curl toward glass pane',
    subject_blocking: 'subject right-third with window layer',
    environment_interaction: 'palm near condensation on glass',
    location_variation_suffix: 'home-rain-window-seat-e',
    foreground: 'rain streak on glass',
    midground: 'subject reflection overlap',
    background: 'grey street depth through pane',
    next_video_potential: ['reflection continuity hold', 'rain streak descent'],
  },
  {
    acting_intent: 'convert grief residue into hopeful forward movement',
    body_action: 'lightened stride mid-bridge crossing',
    gaze_direction: 'toward horizon line off-camera right',
    hand_action: 'open palm gesture at railing',
    posture_variation: 'walking momentum with open chest',
    subject_blocking: 'subject on bridge third-line toward vanishing point',
    environment_interaction: 'hand slides along bridge railing',
    location_variation_suffix: 'bridge-sunset-crossing-f',
    foreground: 'railing texture and hand',
    midground: 'subject in walking stride',
    background: 'sunset river span depth',
    next_video_potential: ['side tracking with stable horizon', 'sky gradient shift'],
  },
  {
    acting_intent: 'begin optimistic journey from morning routine into motion',
    body_action: 'light bounce readiness mounting bicycle',
    gaze_direction: 'down-forward along bike path not camera',
    hand_action: 'grip on handlebar with morning item in basket',
    posture_variation: 'one-foot on pedal launch posture',
    subject_blocking: 'diagonal street entry with bike foreground',
    environment_interaction: 'bicycle handlebar and basket actively used',
    location_variation_suffix: 'street-morning-bike-launch-g',
    foreground: 'handlebar and front wheel',
    midground: 'subject mounting bike',
    background: 'morning street perspective lines',
    next_video_potential: ['rear tracking dolly cadence', 'wheel rotation blur'],
  },
  {
    acting_intent: 'align rival tension into shared resolve under crossing pressure',
    body_action: 'purposeful stride frozen at crosswalk edge',
    gaze_direction: 'side-evaluate toward companion not lens',
    hand_action: 'half-raised hand signaling pause',
    posture_variation: 'squared shoulders in mid-step not attention pose',
    subject_blocking: 'two-subject stagger at crosswalk zebra',
    environment_interaction: 'foot on crosswalk stripe and signal pole proximity',
    location_variation_suffix: 'street-crosswalk-rival-align-h',
    foreground: 'crosswalk stripe geometry',
    midground: 'subjects in lateral tension',
    background: 'traffic blur and school gate depth',
    next_video_potential: ['side tracking axis lock', 'crosswalk signal pulse'],
  },
  {
    acting_intent: 'interrupt domestic chore with resolve to leave for duty',
    body_action: 'frozen mid-step between laundry and doorway',
    gaze_direction: 'downcast toward laundry basket then door angle not lens',
    hand_action: 'fabric fold paused in one hand',
    posture_variation: 'twisted torso between tasks not static stand',
    subject_blocking: 'subject between laundry foreground and door midground',
    environment_interaction: 'laundry fabric and doorframe both engaged',
    location_variation_suffix: 'home-laundry-threshold-i',
    foreground: 'fabric fold in hand',
    midground: 'subject pivot between zones',
    background: 'doorway light rectangle',
    next_video_potential: ['silhouette slow pullback', 'fabric tumble rhythm'],
  },
  {
    acting_intent: 'offer small care gesture that begins emotional healing',
    body_action: 'flanking escort pace while kneeling for pet care',
    gaze_direction: 'down-soft toward pet not camera',
    hand_action: 'offering hand with tea cup in other hand',
    posture_variation: 'crouched care posture with protective lean',
    subject_blocking: 'subject low-left with pet and cup triangle',
    environment_interaction: 'tea steam and pet fur touch active',
    location_variation_suffix: 'home-tea-pet-healing-j',
    foreground: 'tea cup steam curl',
    midground: 'subject crouched interaction',
    background: 'rain-muted window depth',
    next_video_potential: ['wide establishing rain hold', 'close hand detail on cup'],
  },
  {
    acting_intent: 'reopen trust through shared public market moment',
    body_action: 'forward lean open while reaching for market item',
    gaze_direction: 'toward stall vendor hand exchange not lens',
    hand_action: 'reach outward with music player in pocket bump',
    posture_variation: 'asymmetric step with shoulder opening',
    subject_blocking: 'subject at stall counter diagonal depth',
    environment_interaction: 'market produce and headphone cable actively touched',
    location_variation_suffix: 'street-market-trust-reopen-k',
    foreground: 'stall produce edge',
    midground: 'subject reaching gesture',
    background: 'market aisle bustle depth',
    next_video_potential: ['medium emotional push-in', 'crowd lateral drift'],
  },
  {
    acting_intent: 'transform waiting into reunion contact at arrival point',
    body_action: 'accelerated approach breaking into matched pace',
    gaze_direction: 'recognition lock toward approaching figure not lens',
    hand_action: 'hand clasp initiation mid-stride',
    posture_variation: 'running-to-walk settle with open arms',
    subject_blocking: 'converging subjects on shore path thirds',
    environment_interaction: 'shore foam edge and platform rail touched while moving',
    location_variation_suffix: 'shore-station-reunion-l',
    foreground: 'wet sand footprint trail',
    midground: 'subjects converging motion',
    background: 'harbor open horizon',
    next_video_potential: ['side tracking convergence', 'wave advance retreat'],
  },
  {
    acting_intent: 'frame bittersweet departure from elevated vantage',
    body_action: 'slow retreat steps at rooftop parapet',
    gaze_direction: 'upward skyline scan not camera lens',
    hand_action: 'reluctant hand release from parapet stone',
    posture_variation: 'wind-braced lean back not rigid stand',
    subject_blocking: 'subject small against skyline upper third',
    environment_interaction: 'parapet stone and bus stop sign below referenced',
    location_variation_suffix: 'rooftop-farewell-vista-m',
    foreground: 'parapet stone texture',
    midground: 'subject wind-braced silhouette',
    background: 'city grid depth planes',
    next_video_potential: ['slow pullback rim light', 'wind on clothing ripple'],
  },
  {
    acting_intent: 'practice mentor guidance during daily school walk',
    body_action: 'slightly forward mentor lead on campus path',
    gaze_direction: 'evaluative side glance toward student not lens',
    hand_action: 'hand on shoulder guide with cooking apron fold',
    posture_variation: 'walking instruction half-step behind not attention pose',
    subject_blocking: 'mentor-student stagger on campus walk line',
    environment_interaction: 'school gate arch and cooking towel prop in use',
    location_variation_suffix: 'school-mentor-walk-kitchen-n',
    foreground: 'apron fold and shoulder touch',
    midground: 'mentor-student walking pair',
    background: 'campus banner line depth',
    next_video_potential: ['rear follow walking cadence', 'student background flow'],
  },
  {
    acting_intent: 'perform quiet nightly ritual before redemptive reunion',
    body_action: 'kneeling flower care with upward star gaze',
    gaze_direction: 'upward to star field not camera',
    hand_action: 'watering can tilt with tentative reach',
    posture_variation: 'kneeling ritual posture with curved back',
    subject_blocking: 'subject low center with flower pot foreground',
    environment_interaction: 'water stream arc and planter soil actively used',
    location_variation_suffix: 'forest-clearing-star-ritual-o',
    foreground: 'water droplet sparkle on petals',
    midground: 'subject kneeling ritual',
    background: 'night tree ring and stars',
    next_video_potential: ['silhouette side tracking lift', 'star field subtle twinkle'],
  },
  {
    acting_intent: 'open protective new chapter through morning guardian routine',
    body_action: 'upright protective lean during flower watering',
    gaze_direction: 'soft downward check toward planter not lens',
    hand_action: 'hair comfort touch while holding watering can',
    posture_variation: 'guardian half-step behind with nurturing lean',
    subject_blocking: 'guardian-child offset in morning doorway light',
    environment_interaction: 'morning routine objects and flower pot actively used',
    location_variation_suffix: 'home-morning-guardian-reset-p',
    foreground: 'watering can spout and petals',
    midground: 'guardian nurturing gesture',
    background: 'morning doorway warm entry',
    next_video_potential: ['medium emotional hero hold', 'morning light sweep'],
  },
];

const SHOT_CAMERA_PROFILE: Record<
  string,
  { camera_angle: string; camera_distance: string; camera_movement_hint: string }
> = {
  wide_establishing: {
    camera_angle: 'high three-quarter establishing angle',
    camera_distance: 'far to mid establishing',
    camera_movement_hint: 'slow panoramic settle',
  },
  medium_emotional: {
    camera_angle: 'eye-level intimate angle',
    camera_distance: 'mid two-shot distance',
    camera_movement_hint: 'micro push-in on beat',
  },
  side_tracking: {
    camera_angle: 'lateral profile tracking angle',
    camera_distance: 'mid lateral distance',
    camera_movement_hint: 'side tracking with stable horizon',
  },
  rear_follow: {
    camera_angle: 'rear over-shoulder follow angle',
    camera_distance: 'mid-close follow distance',
    camera_movement_hint: 'rear tracking dolly cadence',
  },
  overhead_isolation: {
    camera_angle: 'top-down graphic isolation angle',
    camera_distance: 'far overhead distance',
    camera_movement_hint: 'slow vertical settle',
  },
  window_reflection: {
    camera_angle: 'interior reflection layered angle',
    camera_distance: 'mid-close reflection distance',
    camera_movement_hint: 'static with breath drift',
  },
  close_hand_detail: {
    camera_angle: 'low hand-level macro angle',
    camera_distance: 'close gesture distance',
    camera_movement_hint: 'minimal hold on gesture',
  },
  silhouette_distance: {
    camera_angle: 'backlit long low angle',
    camera_distance: 'far silhouette distance',
    camera_movement_hint: 'slow pullback',
  },
};

function buildLocationVariation(
  storyboardId: string,
  anchors: DailyLifeAnchor[],
  suffix: string
): string {
  const locations = getLocationsForStoryboardScene(storyboardId);
  const primaryLocation = locations[0] ?? getAnchorLocationMapping(anchors[0]);
  const anchorToken = anchors.map((anchor) => anchor).join('+');
  return `${primaryLocation}:${anchorToken}:${suffix}`;
}

function buildAntiStaticPoseRules(sceneOrder: number): string[] {
  return [
    ...ANTI_STATIC_POSE_RULES_BASE,
    `scene-order:${sceneOrder}`,
    'no-similar-location-repeat-as-previous-scene',
  ];
}

function buildImageActingCameraEntry(
  pack: ImagePromptPackEntry,
  scene: StoryboardSceneEntry,
  profile: SceneActingProfile
): ImageActingCameraGrammarEntry {
  const primaryShot = pack.shot_affinity[0] ?? 'medium_emotional';
  const camera = SHOT_CAMERA_PROFILE[primaryShot] ?? SHOT_CAMERA_PROFILE.medium_emotional;
  const shotLibrary = getShotFingerprintLibrary();
  const shotEntry = shotLibrary.find((entry) => entry.fingerprint_id === primaryShot);

  return {
    acting_camera_id: `IAC-${pack.storyboard_id}`,
    image_prompt_pack_id: pack.prompt_pack_id,
    storyboard_id: pack.storyboard_id,
    scene_order: pack.scene_order,
    acting_intent: profile.acting_intent,
    body_action: profile.body_action,
    gaze_direction: profile.gaze_direction,
    hand_action: profile.hand_action,
    posture_variation: profile.posture_variation,
    camera_angle: camera.camera_angle,
    camera_distance: camera.camera_distance,
    camera_movement_hint: shotEntry
      ? String(shotEntry.fields.camera_motion)
      : camera.camera_movement_hint,
    subject_blocking: profile.subject_blocking,
    environment_interaction: profile.environment_interaction,
    location_variation: buildLocationVariation(
      pack.storyboard_id,
      pack.daily_life_anchor,
      profile.location_variation_suffix
    ),
    foreground_midground_background: [
      `foreground:${profile.foreground}`,
      `midground:${profile.midground}`,
      `background:${profile.background}`,
    ],
    anti_static_pose_rules: buildAntiStaticPoseRules(pack.scene_order),
    next_video_potential: [...profile.next_video_potential],
    keywords: [
      ...pack.keywords.filter((keyword) => !keyword.startsWith('image-prompt-pack')),
      'image-acting-camera-grammar',
      `shot:${primaryShot}`,
      `behavior:${pack.behavior_id}`,
      IMAGE_ACTING_CAMERA_GRAMMAR_SONG_MASTER_ID,
    ],
  };
}

export function getImageActingCameraGrammarSeedLibrary(): ImageActingCameraGrammarEntry[] {
  const packs = getImagePromptPackSeedLibrary();
  const scenes = getStoryboardSceneSeedLibrary();

  return packs.map((pack) => {
    const scene = scenes.find((entry) => entry.storyboard_id === pack.storyboard_id);
    if (!scene) {
      throw new Error(`Missing storyboard scene for image pack ${pack.prompt_pack_id}`);
    }

    const profile = SCENE_ACTING_PROFILES[pack.scene_order - 1];
    if (!profile) {
      throw new Error(`Missing acting profile for scene order ${pack.scene_order}`);
    }

    const entry = buildImageActingCameraEntry(pack, scene, profile);
    return {
      ...entry,
      foreground_midground_background: [...entry.foreground_midground_background],
      anti_static_pose_rules: [...entry.anti_static_pose_rules],
      next_video_potential: [...entry.next_video_potential],
      keywords: [...entry.keywords],
    };
  });
}

export function buildImageActingCameraGrammarPreview(): ImageActingCameraGrammarPreview {
  return {
    layer_version: IMAGE_ACTING_CAMERA_GRAMMAR_VERSION,
    seed_count: IMAGE_ACTING_CAMERA_GRAMMAR_SEED_COUNT,
    song_master_id: IMAGE_ACTING_CAMERA_GRAMMAR_SONG_MASTER_ID,
    required_fields: [...REQUIRED_IMAGE_ACTING_CAMERA_FIELDS],
    anti_static_pose_rules_base: [...ANTI_STATIC_POSE_RULES_BASE],
    pipeline_chain: [
      'song_master',
      'emotion_timeline',
      'narrative_beat',
      'storyboard_scene',
      'image_prompt_pack',
      'image_acting_camera_grammar',
    ],
    seed_image_acting_camera_grammar: getImageActingCameraGrammarSeedLibrary(),
  };
}

export function findDuplicateActingCameraIds(
  actingCameraIds: readonly string[]
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of actingCameraIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getImageActingCameraById(
  actingCameraId: string
): ImageActingCameraGrammarEntry | undefined {
  return getImageActingCameraGrammarSeedLibrary().find(
    (entry) => entry.acting_camera_id === actingCameraId
  );
}

export function getImageActingCameraByImagePromptPackId(
  imagePromptPackId: string
): ImageActingCameraGrammarEntry | undefined {
  return getImageActingCameraGrammarSeedLibrary().find(
    (entry) => entry.image_prompt_pack_id === imagePromptPackId
  );
}

export function getImagePromptPackById(promptPackId: string): ImagePromptPackEntry | undefined {
  return getImagePromptPackSeedLibrary().find((pack) => pack.prompt_pack_id === promptPackId);
}

export function getStoryboardSceneById(storyboardId: string): StoryboardSceneEntry | undefined {
  return getStoryboardSceneSeedLibrary().find((scene) => scene.storyboard_id === storyboardId);
}

export function isOffLensGaze(gazeDirection: string): boolean {
  const normalized = gazeDirection.toLowerCase();
  return (
    normalized.includes('not lens') ||
    normalized.includes('not camera') ||
    normalized.includes('off-camera')
  );
}

export function isForbiddenFrontalGaze(gazeDirection: string): boolean {
  const normalized = gazeDirection.toLowerCase();
  return (
    normalized.includes('straight at camera') ||
    normalized.includes('direct frontal gaze') ||
    normalized.includes('looking at camera') ||
    normalized.includes('eye contact with camera') ||
    normalized.includes('facing camera')
  );
}

export function isForbiddenStaticPosture(postureVariation: string): boolean {
  const normalized = postureVariation.toLowerCase();
  if (normalized.includes('not parade rest') || normalized.includes('not parade-rest')) {
    return (
      normalized.includes('at attention') ||
      normalized.includes('standing straight facing camera')
    );
  }
  return (
    normalized.includes('at attention') ||
    normalized.includes('parade rest') ||
    normalized.includes('standing straight facing camera')
  );
}

export function getLocationVariationSuffix(locationVariation: string): string {
  const parts = locationVariation.split(':');
  return parts[parts.length - 1] ?? locationVariation;
}

export function getPrimaryShotForEntry(entry: ImageActingCameraGrammarEntry): string {
  const shotKeyword = entry.keywords.find((keyword) => keyword.startsWith('shot:'));
  return shotKeyword?.slice('shot:'.length) ?? '';
}

export function getLocationsForActingEntry(entry: ImageActingCameraGrammarEntry): SeedLocationId[] {
  return getLocationsForStoryboardScene(entry.storyboard_id);
}
