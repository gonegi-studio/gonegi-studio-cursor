import fs from 'node:fs';
import path from 'node:path';
import type {
  TestKikiActingGrammar,
  TestKikiCameraGrammar,
  TestKikiDailyLifeGrammar,
} from './testKikiExtractionSchema.js';

export const MORI_SOURCE_IDS = Object.freeze(['MORI_01', 'MORI_02', 'MORI_03'] as const);
export type MoriSourceId = (typeof MORI_SOURCE_IDS)[number];

export const MORI_GRAMMAR_CATALOG_VERSION = '104A' as const;
export const MORI_GRAMMAR_CATALOG_PATH = 'exports/mori-grammar-catalog.json' as const;
export const MORI_GRAMMAR_CATALOG_REPORT_PATH =
  'exports/mori-grammar-catalog-report.json' as const;

export type MoriObjectInteractionCandidate = {
  interaction_type: string;
  object_category: string;
  grip_style: string;
  interaction_phase: string;
};

export type MoriExtraActorCandidate = {
  actor_role: string;
  spatial_relation: string;
  activity_involvement: string;
  visibility_weight: string;
};

export type MoriAnimalCandidate = {
  animal_type: string;
  movement_state: string;
  subject_relation: string;
  framing_weight: string;
};

export type MoriSourcedCandidate<T> = T & {
  source_segment: MoriSourceId;
};

export type MoriGrammarCatalog = {
  catalog_type: 'grammar_catalog';
  catalog_version: typeof MORI_GRAMMAR_CATALOG_VERSION;
  sources: typeof MORI_SOURCE_IDS;
  camera_candidates: readonly MoriSourcedCandidate<TestKikiCameraGrammar>[];
  acting_candidates: readonly MoriSourcedCandidate<TestKikiActingGrammar>[];
  daily_life_candidates: readonly MoriSourcedCandidate<TestKikiDailyLifeGrammar>[];
  object_interaction_candidates: readonly MoriSourcedCandidate<MoriObjectInteractionCandidate>[];
  extra_actor_candidates: readonly MoriSourcedCandidate<MoriExtraActorCandidate>[];
  animal_candidates: readonly MoriSourcedCandidate<MoriAnimalCandidate>[];
  candidate_counts: {
    camera: number;
    acting: number;
    daily_life: number;
    object_interaction: number;
    extra_actor: number;
    animal: number;
  };
  source_candidate_counts: Record<
    MoriSourceId,
    {
      camera: number;
      acting: number;
      daily_life: number;
      object_interaction: number;
      extra_actor: number;
      animal: number;
    }
  >;
};

function withSource<T extends Record<string, string>>(
  source_segment: MoriSourceId,
  value: T
): MoriSourcedCandidate<T> {
  return Object.freeze({ source_segment, ...value });
}

const MORI_01_CAMERA: readonly TestKikiCameraGrammar[] = Object.freeze([
  { camera_distance: 'wide', camera_height: 'eye-level', camera_angle: 'three-quarter', lens_feeling: 'deep-focus', framing_type: 'forest-path', subject_position: 'path-center' },
  { camera_distance: 'mid', camera_height: 'ground-level', camera_angle: 'low-profile', lens_feeling: 'normal-neutral', framing_type: 'creek-edge', subject_position: 'bank-third' },
  { camera_distance: 'extreme-wide', camera_height: 'high', camera_angle: 'downward', lens_feeling: 'wide-expansive', framing_type: 'canopy-establish', subject_position: 'trail-dot' },
  { camera_distance: 'close', camera_height: 'waist-level', camera_angle: 'profile', lens_feeling: 'shallow-focus', framing_type: 'forage-detail', subject_position: 'hands-dominant' },
]);

const MORI_02_CAMERA: readonly TestKikiCameraGrammar[] = Object.freeze([
  { camera_distance: 'mid-wide', camera_height: 'eye-level', camera_angle: 'pan-follow', lens_feeling: 'deep-focus', framing_type: 'village-walk', subject_position: 'leading-third' },
  { camera_distance: 'mid-close', camera_height: 'shoulder-level', camera_angle: 'over-shoulder', lens_feeling: 'shallow-focus', framing_type: 'market-exchange', subject_position: 'stall-front' },
  { camera_distance: 'wide', camera_height: 'eye-level', camera_angle: 'two-shot', lens_feeling: 'normal-neutral', framing_type: 'porch-dialogue', subject_position: 'step-balanced' },
  { camera_distance: 'close', camera_height: 'table-level', camera_angle: 'downward-task', lens_feeling: 'macro-detail', framing_type: 'craft-surface', subject_position: 'work-dominant' },
]);

const MORI_03_CAMERA: readonly TestKikiCameraGrammar[] = Object.freeze([
  { camera_distance: 'wide', camera_height: 'low', camera_angle: 'upward', lens_feeling: 'wide-intimate', framing_type: 'lantern-evening', subject_position: 'lower-third' },
  { camera_distance: 'extreme-wide', camera_height: 'aerial', camera_angle: 'oblique', lens_feeling: 'deep-focus', framing_type: 'valley-bridge', subject_position: 'crossing-dot' },
  { camera_distance: 'mid', camera_height: 'eye-level', camera_angle: 'tracking', lens_feeling: 'normal-neutral', framing_type: 'rain-walk', subject_position: 'center-path' },
  { camera_distance: 'extreme-close', camera_height: 'eye-level', camera_angle: 'front', lens_feeling: 'shallow-focus', framing_type: 'reaction-close', subject_position: 'center' },
]);

const MORI_01_ACTING: readonly TestKikiActingGrammar[] = Object.freeze([
  { gaze_direction: 'downward-forage', head_direction: 'chin-down', hand_activity: 'basket-gather', posture: 'crouched-reach', body_weight_distribution: 'single-leg-lean' },
  { gaze_direction: 'toward-creek', head_direction: 'level', hand_activity: 'balance-arm', posture: 'stepping-stone', body_weight_distribution: 'in-motion-shift' },
  { gaze_direction: 'upward-canopy', head_direction: 'chin-up', hand_activity: 'at-side', posture: 'upright-pause', body_weight_distribution: 'even' },
]);

const MORI_02_ACTING: readonly TestKikiActingGrammar[] = Object.freeze([
  { gaze_direction: 'mutual-greeting', head_direction: 'slight-bow', hand_activity: 'gesture-open', posture: 'standing-respect', body_weight_distribution: 'toe-lean' },
  { gaze_direction: 'toward-task', head_direction: 'level', hand_activity: 'loom-shuttle', posture: 'seated-work', body_weight_distribution: 'centered' },
  { gaze_direction: 'toward-speaker', head_direction: 'slight-tilt', hand_activity: 'tea-cup-hold', posture: 'seated-relaxed', body_weight_distribution: 'rear-weighted' },
  { gaze_direction: 'toward-goods', head_direction: 'level', hand_activity: 'select-item', posture: 'standing-browse', body_weight_distribution: 'hip-counter' },
]);

const MORI_03_ACTING: readonly TestKikiActingGrammar[] = Object.freeze([
  { gaze_direction: 'toward-companion', head_direction: 'turn-in', hand_activity: 'offering-hand', posture: 'walking-pair', body_weight_distribution: 'in-step' },
  { gaze_direction: 'downward-lantern', head_direction: 'chin-down', hand_activity: 'lantern-raise', posture: 'standing-hold', body_weight_distribution: 'even' },
  { gaze_direction: 'off-camera-rain', head_direction: 'level', hand_activity: 'umbrella-brace', posture: 'waiting-stand', body_weight_distribution: 'centered' },
]);

const MORI_01_DAILY_LIFE: readonly TestKikiDailyLifeGrammar[] = Object.freeze([
  { activity: 'foraging', object_interaction: 'basket-gather', environmental_touchpoint: 'forest-floor' },
  { activity: 'fishing', object_interaction: 'rod-cast', environmental_touchpoint: 'creek-bank' },
  { activity: 'firewood-gather', object_interaction: 'bundle-carry', environmental_touchpoint: 'woodland-path' },
  { activity: 'mushroom-pick', object_interaction: 'hand-pick', environmental_touchpoint: 'moss-log' },
  { activity: 'creek-wade', object_interaction: 'none', environmental_touchpoint: 'shallow-water' },
  { activity: 'path-walk', object_interaction: 'walking-staff', environmental_touchpoint: 'forest-trail' },
  { activity: 'shrine-visit', object_interaction: 'bell-pull', environmental_touchpoint: 'shrine-steps' },
]);

const MORI_02_DAILY_LIFE: readonly TestKikiDailyLifeGrammar[] = Object.freeze([
  { activity: 'weaving', object_interaction: 'loom-shuttle', environmental_touchpoint: 'workroom-loom' },
  { activity: 'pottery', object_interaction: 'clay-shape', environmental_touchpoint: 'wheel-bench' },
  { activity: 'herb-dry', object_interaction: 'bundle-hang', environmental_touchpoint: 'eave-line' },
  { activity: 'meal-prep', object_interaction: 'mortar-grind', environmental_touchpoint: 'kitchen-hearth' },
  { activity: 'tea-serve', object_interaction: 'tea-pot-pour', environmental_touchpoint: 'tatami-table' },
  { activity: 'garden-tend', object_interaction: 'hand-weed', environmental_touchpoint: 'garden-bed' },
  { activity: 'mending', object_interaction: 'needle-thread', environmental_touchpoint: 'porch-seat' },
  { activity: 'storytelling', object_interaction: 'none', environmental_touchpoint: 'hearth-circle' },
]);

const MORI_03_DAILY_LIFE: readonly TestKikiDailyLifeGrammar[] = Object.freeze([
  { activity: 'ferry-wait', object_interaction: 'ticket-hold', environmental_touchpoint: 'river-dock' },
  { activity: 'rain-shelter', object_interaction: 'umbrella-prop', environmental_touchpoint: 'veranda-edge' },
  { activity: 'lantern-light', object_interaction: 'lantern-hold', environmental_touchpoint: 'evening-path' },
  { activity: 'bridge-cross', object_interaction: 'rail-guide', environmental_touchpoint: 'wooden-bridge' },
  { activity: 'honey-harvest', object_interaction: 'jar-fill', environmental_touchpoint: 'apiary-stand' },
  { activity: 'seed-sow', object_interaction: 'seed-scatter', environmental_touchpoint: 'field-row' },
  { activity: 'festival-help', object_interaction: 'banner-carry', environmental_touchpoint: 'village-square' },
  { activity: 'letter-deliver', object_interaction: 'envelope-handoff', environmental_touchpoint: 'lane-threshold' },
]);

const MORI_01_OBJECT: readonly MoriObjectInteractionCandidate[] = Object.freeze([
  { interaction_type: 'gather', object_category: 'forage-basket', grip_style: 'handle-carry', interaction_phase: 'collecting' },
  { interaction_type: 'cast', object_category: 'fishing-rod', grip_style: 'dual-hand-cast', interaction_phase: 'casting' },
  { interaction_type: 'carry', object_category: 'firewood-bundle', grip_style: 'arm-craddle', interaction_phase: 'transport' },
  { interaction_type: 'pick', object_category: 'wild-mushroom', grip_style: 'pinch-lift', interaction_phase: 'harvest' },
  { interaction_type: 'pull', object_category: 'shrine-bell', grip_style: 'rope-pull', interaction_phase: 'ringing' },
]);

const MORI_02_OBJECT: readonly MoriObjectInteractionCandidate[] = Object.freeze([
  { interaction_type: 'weave', object_category: 'loom-shuttle', grip_style: 'shuttle-pass', interaction_phase: 'weaving' },
  { interaction_type: 'shape', object_category: 'clay-lump', grip_style: 'palm-mold', interaction_phase: 'forming' },
  { interaction_type: 'grind', object_category: 'mortar-pesto', grip_style: 'pestle-grind', interaction_phase: 'preparing' },
  { interaction_type: 'pour', object_category: 'tea-pot', grip_style: 'handle-tilt', interaction_phase: 'serving' },
  { interaction_type: 'hang', object_category: 'herb-bundle', grip_style: 'twine-bind', interaction_phase: 'drying' },
  { interaction_type: 'stitch', object_category: 'fabric-patch', grip_style: 'needle-thread', interaction_phase: 'mending' },
]);

const MORI_03_OBJECT: readonly MoriObjectInteractionCandidate[] = Object.freeze([
  { interaction_type: 'hold', object_category: 'ferry-ticket', grip_style: 'paper-pinch', interaction_phase: 'waiting' },
  { interaction_type: 'shelter', object_category: 'rain-umbrella', grip_style: 'handle-grip', interaction_phase: 'open-hold' },
  { interaction_type: 'light', object_category: 'paper-lantern', grip_style: 'pole-raise', interaction_phase: 'illumination' },
  { interaction_type: 'guide', object_category: 'bridge-rail', grip_style: 'light-touch', interaction_phase: 'crossing' },
  { interaction_type: 'fill', object_category: 'honey-jar', grip_style: 'jar-hold', interaction_phase: 'harvesting' },
  { interaction_type: 'deliver', object_category: 'letter-envelope', grip_style: 'two-hand-pass', interaction_phase: 'handoff' },
]);

const MORI_01_EXTRA: readonly MoriExtraActorCandidate[] = Object.freeze([
  { actor_role: 'forest-ranger', spatial_relation: 'trail-ahead', activity_involvement: 'path-guidance', visibility_weight: 'medium' },
  { actor_role: 'shrine-keeper', spatial_relation: 'step-above', activity_involvement: 'quiet-greet', visibility_weight: 'low' },
]);

const MORI_02_EXTRA: readonly MoriExtraActorCandidate[] = Object.freeze([
  { actor_role: 'village-elder', spatial_relation: 'porch-seated', activity_involvement: 'story-share', visibility_weight: 'medium' },
  { actor_role: 'market-neighbor', spatial_relation: 'stall-beside', activity_involvement: 'trade-chat', visibility_weight: 'medium' },
  { actor_role: 'craft-teacher', spatial_relation: 'bench-across', activity_involvement: 'skill-guide', visibility_weight: 'high' },
]);

const MORI_03_EXTRA: readonly MoriExtraActorCandidate[] = Object.freeze([
  { actor_role: 'ferry-operator', spatial_relation: 'dock-side', activity_involvement: 'boarding-call', visibility_weight: 'medium' },
  { actor_role: 'festival-helper', spatial_relation: 'square-near', activity_involvement: 'setup-coord', visibility_weight: 'medium' },
  { actor_role: 'travel-companion', spatial_relation: 'walk-alongside', activity_involvement: 'shared-route', visibility_weight: 'high' },
]);

const MORI_01_ANIMAL: readonly MoriAnimalCandidate[] = Object.freeze([
  { animal_type: 'forest-deer', movement_state: 'step-clearing', subject_relation: 'midground-cross', framing_weight: 'environmental' },
  { animal_type: 'river-fish', movement_state: 'surface-break', subject_relation: 'water-near', framing_weight: 'accent' },
  { animal_type: 'crow-pair', movement_state: 'branch-hop', subject_relation: 'canopy-above', framing_weight: 'background-accent' },
]);

const MORI_02_ANIMAL: readonly MoriAnimalCandidate[] = Object.freeze([
  { animal_type: 'village-cat', movement_state: 'porch-rest', subject_relation: 'doorway-near', framing_weight: 'midground' },
  { animal_type: 'goose-duo', movement_state: 'yard-walk', subject_relation: 'garden-edge', framing_weight: 'background' },
]);

const MORI_03_ANIMAL: readonly MoriAnimalCandidate[] = Object.freeze([
  { animal_type: 'fox-glance', movement_state: 'edge-watch', subject_relation: 'path-distance', framing_weight: 'background-accent' },
  { animal_type: 'owl-perch', movement_state: 'still-observe', subject_relation: 'branch-overhang', framing_weight: 'midground' },
]);

function tagSource<T extends Record<string, string>>(
  source: MoriSourceId,
  items: readonly T[]
): readonly MoriSourcedCandidate<T>[] {
  return Object.freeze(items.map((item) => withSource(source, item)));
}

function countBySource(
  catalog: Pick<
    MoriGrammarCatalog,
    | 'camera_candidates'
    | 'acting_candidates'
    | 'daily_life_candidates'
    | 'object_interaction_candidates'
    | 'extra_actor_candidates'
    | 'animal_candidates'
  >
): MoriGrammarCatalog['source_candidate_counts'] {
  const init = () =>
    Object.freeze({
      camera: 0,
      acting: 0,
      daily_life: 0,
      object_interaction: 0,
      extra_actor: 0,
      animal: 0,
    });

  const counts: Record<MoriSourceId, ReturnType<typeof init>> = {
    MORI_01: init(),
    MORI_02: init(),
    MORI_03: init(),
  };

  const buckets: Array<[keyof ReturnType<typeof init>, readonly { source_segment: MoriSourceId }[]]> =
    [
      ['camera', catalog.camera_candidates],
      ['acting', catalog.acting_candidates],
      ['daily_life', catalog.daily_life_candidates],
      ['object_interaction', catalog.object_interaction_candidates],
      ['extra_actor', catalog.extra_actor_candidates],
      ['animal', catalog.animal_candidates],
    ];

  for (const [key, items] of buckets) {
    for (const item of items) {
      counts[item.source_segment] = Object.freeze({
        ...counts[item.source_segment],
        [key]: counts[item.source_segment][key] + 1,
      });
    }
  }

  return counts;
}

export function buildMoriGrammarCatalog(): MoriGrammarCatalog {
  const camera_candidates = Object.freeze([
    ...tagSource('MORI_01', MORI_01_CAMERA),
    ...tagSource('MORI_02', MORI_02_CAMERA),
    ...tagSource('MORI_03', MORI_03_CAMERA),
  ]);
  const acting_candidates = Object.freeze([
    ...tagSource('MORI_01', MORI_01_ACTING),
    ...tagSource('MORI_02', MORI_02_ACTING),
    ...tagSource('MORI_03', MORI_03_ACTING),
  ]);
  const daily_life_candidates = Object.freeze([
    ...tagSource('MORI_01', MORI_01_DAILY_LIFE),
    ...tagSource('MORI_02', MORI_02_DAILY_LIFE),
    ...tagSource('MORI_03', MORI_03_DAILY_LIFE),
  ]);
  const object_interaction_candidates = Object.freeze([
    ...tagSource('MORI_01', MORI_01_OBJECT),
    ...tagSource('MORI_02', MORI_02_OBJECT),
    ...tagSource('MORI_03', MORI_03_OBJECT),
  ]);
  const extra_actor_candidates = Object.freeze([
    ...tagSource('MORI_01', MORI_01_EXTRA),
    ...tagSource('MORI_02', MORI_02_EXTRA),
    ...tagSource('MORI_03', MORI_03_EXTRA),
  ]);
  const animal_candidates = Object.freeze([
    ...tagSource('MORI_01', MORI_01_ANIMAL),
    ...tagSource('MORI_02', MORI_02_ANIMAL),
    ...tagSource('MORI_03', MORI_03_ANIMAL),
  ]);

  const partial = {
    catalog_type: 'grammar_catalog' as const,
    catalog_version: MORI_GRAMMAR_CATALOG_VERSION,
    sources: MORI_SOURCE_IDS,
    camera_candidates,
    acting_candidates,
    daily_life_candidates,
    object_interaction_candidates,
    extra_actor_candidates,
    animal_candidates,
    candidate_counts: Object.freeze({
      camera: camera_candidates.length,
      acting: acting_candidates.length,
      daily_life: daily_life_candidates.length,
      object_interaction: object_interaction_candidates.length,
      extra_actor: extra_actor_candidates.length,
      animal: animal_candidates.length,
    }),
  };

  return Object.freeze({
    ...partial,
    source_candidate_counts: countBySource(partial),
  });
}

export function writeMoriGrammarCatalog(projectRoot: string): MoriGrammarCatalog {
  const catalog = buildMoriGrammarCatalog();
  fs.mkdirSync(path.join(projectRoot, 'exports'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, MORI_GRAMMAR_CATALOG_PATH),
    `${JSON.stringify(catalog)}\n`,
    'utf8'
  );
  return catalog;
}
