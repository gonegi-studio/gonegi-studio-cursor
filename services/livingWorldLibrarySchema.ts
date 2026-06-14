export const LIVING_WORLD_SCAFFOLD_VERSION = '108A' as const;
export const LIVING_WORLD_SCAFFOLD_TYPE = 'living_world_library_scaffold' as const;

export const LIVING_WORLD_IDENTITY = 'GONEGI_MEDITERRANEAN' as const;
export const LIVING_WORLD_TYPE = 'early-1900s mediterranean harbor town' as const;

export const FORBIDDEN_WORLD_TOKENS = Object.freeze([
  'subway',
  'airport',
  'skyscraper',
  'cyberpunk',
  'torii',
  'tatami',
  'shrine',
  'japanese-town',
  'modern-city',
  'neon-city',
] as const);

export const LIVING_WORLD_LIBRARY_NAMES = Object.freeze([
  'emotion_grammar_library',
  'relationship_grammar_library',
  'crowd_grammar_library',
  'profession_grammar_library',
  'animal_behavior_library',
  'child_behavior_library',
  'weather_grammar_library',
  'time_grammar_library',
  'community_grammar_library',
  'harbor_activity_grammar_library',
  'market_grammar_library',
  'festival_grammar_library',
] as const);

export type LivingWorldLibraryName = (typeof LIVING_WORLD_LIBRARY_NAMES)[number];

export type LivingWorldGrammarItemBase = {
  pattern_id: string;
  world_identity: typeof LIVING_WORLD_IDENTITY;
  world_type: typeof LIVING_WORLD_TYPE;
  priority_score: number;
  source_refs?: readonly string[];
};

export type EmotionGrammarItem = LivingWorldGrammarItemBase & {
  emotion_type: string;
  expression_level: number;
  scene_function: string;
};

export type RelationshipGrammarItem = LivingWorldGrammarItemBase & {
  relationship_type: string;
  proximity_role: string;
  scene_function: string;
};

export type CrowdGrammarItem = LivingWorldGrammarItemBase & {
  crowd_density: string;
  movement_pattern: string;
  scene_function: string;
};

export type ProfessionGrammarItem = LivingWorldGrammarItemBase & {
  profession_role: string;
  work_activity: string;
  location_affinity: string;
};

export type AnimalBehaviorItem = LivingWorldGrammarItemBase & {
  animal_type: string;
  behavior: string;
  location_affinity: string;
  interaction_role: string;
  scene_function: string;
};

export type ChildBehaviorItem = LivingWorldGrammarItemBase & {
  behavior: string;
  location_affinity: string;
  interaction_role: string;
  scene_function: string;
};

export type WeatherGrammarItem = LivingWorldGrammarItemBase & {
  weather_type: string;
  atmosphere_effect: string;
  scene_function: string;
};

export type TimeGrammarItem = LivingWorldGrammarItemBase & {
  time_of_day: string;
  light_quality: string;
  scene_function: string;
};

export type CommunityGrammarItem = LivingWorldGrammarItemBase & {
  community_activity: string;
  gathering_type: string;
  scene_function: string;
};

export type HarborActivityGrammarItem = LivingWorldGrammarItemBase & {
  harbor_activity: string;
  dock_role: string;
  scene_function: string;
};

export type MarketGrammarItem = LivingWorldGrammarItemBase & {
  market_activity: string;
  stall_role: string;
  scene_function: string;
};

export type FestivalGrammarItem = LivingWorldGrammarItemBase & {
  festival_activity: string;
  celebration_role: string;
  scene_function: string;
};

export const ANIMAL_BEHAVIOR_GROUPS = Object.freeze({
  harbor_birds: Object.freeze([
    'seagull',
    'gull flock',
    'cormorant',
    'pelican',
    'pigeon',
    'sparrow',
    'swallow',
  ] as const),
  poultry_domestic_birds: Object.freeze([
    'chicken',
    'rooster',
    'duck',
    'goose',
    'muscovy_duck',
  ] as const),
  cats: Object.freeze([
    'street_cat',
    'bakery_cat',
    'window_cat',
    'roof_cat',
    'companion_cat',
  ] as const),
  dogs: Object.freeze([
    'harbor_dog',
    'market_dog',
    'shepherd_dog',
    'companion_dog',
  ] as const),
  small_mediterranean_animals: Object.freeze([
    'goat',
    'donkey',
    'sheep',
    'lizard',
    'butterfly',
  ] as const),
} as const);

export const ANIMAL_BEHAVIOR_EXAMPLE_VALUES = Object.freeze([
  'seagull_roof_perch',
  'seagull_window_watch',
  'pelican_pier_stand',
  'pigeon_square_peck',
  'chicken_courtyard_scratch',
  'rooster_morning_call',
  'duck_harbor_waddle',
  'goose_lane_guard',
  'muscovy_duck_courtyard_rest',
  'cat_window_sleep',
  'dog_dock_wait',
  'goat_hillside_graze',
] as const);

export const REQUIRED_POULTRY_HARBOR_BIRD_TYPES = Object.freeze([
  'chicken',
  'rooster',
  'duck',
  'goose',
  'muscovy_duck',
  'pigeon',
  'pelican',
] as const);

export type LivingWorldLibraries = {
  emotion_grammar_library: readonly EmotionGrammarItem[];
  relationship_grammar_library: readonly RelationshipGrammarItem[];
  crowd_grammar_library: readonly CrowdGrammarItem[];
  profession_grammar_library: readonly ProfessionGrammarItem[];
  animal_behavior_library: readonly AnimalBehaviorItem[];
  child_behavior_library: readonly ChildBehaviorItem[];
  weather_grammar_library: readonly WeatherGrammarItem[];
  time_grammar_library: readonly TimeGrammarItem[];
  community_grammar_library: readonly CommunityGrammarItem[];
  harbor_activity_grammar_library: readonly HarborActivityGrammarItem[];
  market_grammar_library: readonly MarketGrammarItem[];
  festival_grammar_library: readonly FestivalGrammarItem[];
};

export type LivingWorldLibraryScaffold = {
  scaffold_version: typeof LIVING_WORLD_SCAFFOLD_VERSION;
  scaffold_type: typeof LIVING_WORLD_SCAFFOLD_TYPE;
  world_identity: typeof LIVING_WORLD_IDENTITY;
  world_type: typeof LIVING_WORLD_TYPE;
  forbidden_world_tokens: typeof FORBIDDEN_WORLD_TOKENS;
  libraries: LivingWorldLibraries;
  animal_behavior_groups: typeof ANIMAL_BEHAVIOR_GROUPS;
  animal_behavior_examples: typeof ANIMAL_BEHAVIOR_EXAMPLE_VALUES;
  pattern_capacity: 'scaffold_only';
};

export function buildLivingWorldLibraryScaffold(): LivingWorldLibraryScaffold {
  return Object.freeze({
    scaffold_version: LIVING_WORLD_SCAFFOLD_VERSION,
    scaffold_type: LIVING_WORLD_SCAFFOLD_TYPE,
    world_identity: LIVING_WORLD_IDENTITY,
    world_type: LIVING_WORLD_TYPE,
    forbidden_world_tokens: FORBIDDEN_WORLD_TOKENS,
    libraries: Object.freeze({
      emotion_grammar_library: Object.freeze([]),
      relationship_grammar_library: Object.freeze([]),
      crowd_grammar_library: Object.freeze([]),
      profession_grammar_library: Object.freeze([]),
      animal_behavior_library: Object.freeze([]),
      child_behavior_library: Object.freeze([]),
      weather_grammar_library: Object.freeze([]),
      time_grammar_library: Object.freeze([]),
      community_grammar_library: Object.freeze([]),
      harbor_activity_grammar_library: Object.freeze([]),
      market_grammar_library: Object.freeze([]),
      festival_grammar_library: Object.freeze([]),
    }),
    animal_behavior_groups: ANIMAL_BEHAVIOR_GROUPS,
    animal_behavior_examples: ANIMAL_BEHAVIOR_EXAMPLE_VALUES,
    pattern_capacity: 'scaffold_only',
  });
}

export function getAllDefinedAnimalTypes(): readonly string[] {
  return Object.freeze([
    ...ANIMAL_BEHAVIOR_GROUPS.harbor_birds,
    ...ANIMAL_BEHAVIOR_GROUPS.poultry_domestic_birds,
    ...ANIMAL_BEHAVIOR_GROUPS.cats,
    ...ANIMAL_BEHAVIOR_GROUPS.dogs,
    ...ANIMAL_BEHAVIOR_GROUPS.small_mediterranean_animals,
  ]);
}
