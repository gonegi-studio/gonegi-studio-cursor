import fs from 'node:fs';
import path from 'node:path';
import { TRANSLATION_CONTRACT_PATH } from './gonegiWorldTranslationBuilder.js';
import { CHARACTER_SOURCE, IDENTITY_CONTRACT_SOURCE } from './sceneStateBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REPLACEMENT_PHASE =
  'PHASE-SOURCE-VIDEO-012-CHARACTER_REPLACEMENT_CONTRACT_V1' as const;
export const REPLACEMENT_STATIC_CONTRACT_PATH =
  'datasets/character_replacement/character-replacement-contract.json' as const;
export const REPLACEMENT_SCHEMA_PATH =
  'datasets/character_replacement/character-replacement.schema.json' as const;
export const REPLACEMENT_REGISTRY_PATH =
  'datasets/character_replacement/character-replacement-registry.json' as const;
export const REPLACEMENT_CONTRACT_PATH =
  'datasets/character_replacement/gonegi-master-character-replacement-v1.json' as const;
export const CHARACTER_ANCHOR_INDEX_PATH = CHARACTER_SOURCE;

export const REPLACEMENT_CONTRACT_ID = 'gonegi-master-character-replacement-v1' as const;
export const WORLD_IDENTITY = 'GONEGI_MEDITERRANEAN' as const;

const CORE_CANONICAL_IDS = ['gonegi', 'dana', 'gamja', 'aengdu'] as const;

export type ReplacementRule = {
  replacement_id: string;
  source_role: string;
  target_character_id: string;
  target_character_name: string;
  replacement_priority: number;
  identity_anchor_required: boolean;
  companion_rule: string | null;
  costume_lock_required: boolean;
  relationship_mapping: string;
  forbidden_replacements: string[];
  continuity_locks: string[];
};

export type CharacterReplacementContract = {
  contract_id: typeof REPLACEMENT_CONTRACT_ID;
  phase: typeof REPLACEMENT_PHASE;
  world_identity: typeof WORLD_IDENTITY;
  world_translation_contract_ref: string;
  character_anchor_index_ref: string;
  character_first_contract_ref: string;
  replacements: ReplacementRule[];
  companion_rules: {
    rules: string[];
    gonegi_gamja_pair: true;
    dana_aengdu_pair: true;
    no_companion_swap: true;
  };
  identity_rules: {
    identity_priority_rank: 1;
    no_source_override_of_canonical_cast: true;
    no_extra_gonegi_dana_duplication: true;
    absent_roles_must_not_appear: true;
    protected_character_ids: string[];
  };
  duplication_guard: {
    enabled: true;
    max_instances_per_character: 1;
    blocked_duplicate_roles: string[];
  };
  absent_character_rule: {
    strategy: 'inject_only_active_scene_characters';
    description: string;
  };
  core_character_links: {
    gonegi: 'linked';
    dana: 'linked';
    gamja: 'linked';
    aengdu: 'linked';
  };
  execution_flags: {
    design_only: true;
    gpu_execution: false;
    external_call_allowed: false;
    frame_extraction: false;
    ocr: false;
    generation: false;
  };
  built_at: string;
};

type StaticContract = {
  core_mappings: Record<string, string>;
  companion_rules: string[];
  forbidden_swaps: string[];
};

type CharacterAnchorIndex = {
  characters: Array<{
    character_id: string;
    display_name_en: string;
    role_type: string;
  }>;
};

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  frame_extraction: false as const,
  ocr: false as const,
  generation: false as const,
};

const REPLACEMENT_SPECS: Array<{
  source_role: string;
  target_id: string;
  target_name: string;
  priority: number;
  companion_rule: string | null;
  relationship_mapping: string;
  costume_lock: boolean;
  forbidden: string[];
}> = [
  {
    source_role: 'protagonist_a',
    target_id: 'gonegi',
    target_name: 'Gonegi',
    priority: 1,
    companion_rule: 'gonegi_must_keep_gamja_nearby_when_scene_allows',
    relationship_mapping: 'primary_protagonist',
    costume_lock: true,
    forbidden: ['dana', 'gamja', 'aengdu'],
  },
  {
    source_role: 'protagonist_b',
    target_id: 'dana',
    target_name: 'Dana',
    priority: 1,
    companion_rule: 'dana_must_keep_aengdu_nearby_when_scene_allows',
    relationship_mapping: 'secondary_protagonist',
    costume_lock: true,
    forbidden: ['gonegi', 'gamja', 'aengdu'],
  },
  {
    source_role: 'solitary_figure',
    target_id: 'dana',
    target_name: 'Dana',
    priority: 2,
    companion_rule: 'dana_must_keep_aengdu_nearby_when_scene_allows',
    relationship_mapping: 'solitary_contemplation',
    costume_lock: true,
    forbidden: ['gonegi', 'gamja'],
  },
  {
    source_role: 'child_observer',
    target_id: 'gonegi',
    target_name: 'Gonegi',
    priority: 2,
    companion_rule: 'gonegi_must_keep_gamja_nearby_when_scene_allows',
    relationship_mapping: 'child_observer_wonder',
    costume_lock: true,
    forbidden: ['dana', 'aengdu'],
  },
  {
    source_role: 'animal_companion_a',
    target_id: 'gamja',
    target_name: 'Gamja',
    priority: 1,
    companion_rule: 'paired_with_gonegi_only',
    relationship_mapping: 'gonegi_animal_companion',
    costume_lock: true,
    forbidden: ['aengdu', 'dana'],
  },
  {
    source_role: 'animal_companion_b',
    target_id: 'aengdu',
    target_name: 'Aengdu',
    priority: 1,
    companion_rule: 'paired_with_dana_only',
    relationship_mapping: 'dana_animal_companion',
    costume_lock: true,
    forbidden: ['gamja', 'gonegi'],
  },
  {
    source_role: 'background_adult',
    target_id: 'living_world_background_actor',
    target_name: 'Living World Background Actor',
    priority: 3,
    companion_rule: null,
    relationship_mapping: 'living_world_background',
    costume_lock: false,
    forbidden: ['gonegi', 'dana', 'gamja', 'aengdu'],
  },
  {
    source_role: 'crowd_member',
    target_id: 'living_world_crowd_actor',
    target_name: 'Living World Crowd Actor',
    priority: 4,
    companion_rule: null,
    relationship_mapping: 'living_world_crowd',
    costume_lock: false,
    forbidden: ['gonegi', 'dana', 'gamja', 'aengdu'],
  },
  {
    source_role: 'sister_a',
    target_id: 'dana',
    target_name: 'Dana',
    priority: 2,
    companion_rule: 'dana_must_keep_aengdu_nearby_when_scene_allows',
    relationship_mapping: 'sibling_dialogue',
    costume_lock: true,
    forbidden: ['gonegi', 'gamja'],
  },
  {
    source_role: 'sister_b',
    target_id: 'gonegi',
    target_name: 'Gonegi',
    priority: 2,
    companion_rule: 'gonegi_must_keep_gamja_nearby_when_scene_allows',
    relationship_mapping: 'sibling_dialogue',
    costume_lock: true,
    forbidden: ['dana', 'aengdu'],
  },
  {
    source_role: 'walker_companion',
    target_id: 'gonegi',
    target_name: 'Gonegi',
    priority: 2,
    companion_rule: 'gonegi_must_keep_gamja_nearby_when_scene_allows',
    relationship_mapping: 'companion_walk',
    costume_lock: true,
    forbidden: ['dana', 'aengdu'],
  },
];

function loadStaticContract(projectRoot: string): StaticContract | null {
  const abs = path.join(projectRoot, REPLACEMENT_STATIC_CONTRACT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as StaticContract;
}

function loadCharacterAnchorIndex(projectRoot: string): CharacterAnchorIndex | null {
  const abs = path.join(projectRoot, CHARACTER_ANCHOR_INDEX_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as CharacterAnchorIndex;
}

function characterExists(index: CharacterAnchorIndex, characterId: string): boolean {
  if (characterId.startsWith('living_world_')) return true;
  return index.characters.some((c) => c.character_id === characterId);
}

function buildReplacementRule(spec: (typeof REPLACEMENT_SPECS)[number]): ReplacementRule {
  const anchorRequired = CORE_CANONICAL_IDS.includes(
    spec.target_id as (typeof CORE_CANONICAL_IDS)[number]
  );

  return {
    replacement_id: `replacement_${spec.source_role}_v1`,
    source_role: spec.source_role,
    target_character_id: spec.target_id,
    target_character_name: spec.target_name,
    replacement_priority: spec.priority,
    identity_anchor_required: anchorRequired,
    companion_rule: spec.companion_rule,
    costume_lock_required: spec.costume_lock,
    relationship_mapping: spec.relationship_mapping,
    forbidden_replacements: [...spec.forbidden, 'gamja_to_aengdu', 'aengdu_to_gamja'],
    continuity_locks: anchorRequired
      ? [
          `identity:character_identity:${spec.target_id}`,
          `character_reference:${spec.target_name}`,
          `identity_lock:preserve_${spec.target_id}_silhouette`,
        ]
      : [`living_world_actor:${spec.target_id}`, 'identity_lock:no_canonical_cast_override'],
  };
}

export function buildCharacterReplacementContract(
  projectRoot?: string
): CharacterReplacementContract {
  const root = resolveProjectRoot(projectRoot);

  const staticContract = loadStaticContract(root);
  if (!staticContract) {
    throw new Error(`Missing static contract: ${REPLACEMENT_STATIC_CONTRACT_PATH}`);
  }

  const anchorIndex = loadCharacterAnchorIndex(root);
  if (!anchorIndex) {
    throw new Error(`Missing character anchor index: ${CHARACTER_ANCHOR_INDEX_PATH}`);
  }

  if (!fs.existsSync(path.join(root, TRANSLATION_CONTRACT_PATH))) {
    throw new Error(`Missing world translation contract: ${TRANSLATION_CONTRACT_PATH}`);
  }

  if (!fs.existsSync(path.join(root, IDENTITY_CONTRACT_SOURCE))) {
    throw new Error(`Missing character-first contract: ${IDENTITY_CONTRACT_SOURCE}`);
  }

  for (const id of CORE_CANONICAL_IDS) {
    if (!characterExists(anchorIndex, id)) {
      throw new Error(`Canonical character missing from anchor index: ${id}`);
    }
  }

  for (const [sourceRole, targetId] of Object.entries(staticContract.core_mappings)) {
    const spec = REPLACEMENT_SPECS.find((s) => s.source_role === sourceRole);
    if (spec && spec.target_id !== targetId) {
      throw new Error(
        `Static contract mapping mismatch for ${sourceRole}: expected ${spec.target_id}, got ${targetId}`
      );
    }
  }

  const replacements = REPLACEMENT_SPECS.map(buildReplacementRule);

  return {
    contract_id: REPLACEMENT_CONTRACT_ID,
    phase: REPLACEMENT_PHASE,
    world_identity: WORLD_IDENTITY,
    world_translation_contract_ref: TRANSLATION_CONTRACT_PATH,
    character_anchor_index_ref: CHARACTER_ANCHOR_INDEX_PATH,
    character_first_contract_ref: IDENTITY_CONTRACT_SOURCE,
    replacements,
    companion_rules: {
      rules: [...staticContract.companion_rules],
      gonegi_gamja_pair: true,
      dana_aengdu_pair: true,
      no_companion_swap: true,
    },
    identity_rules: {
      identity_priority_rank: 1,
      no_source_override_of_canonical_cast: true,
      no_extra_gonegi_dana_duplication: true,
      absent_roles_must_not_appear: true,
      protected_character_ids: [...CORE_CANONICAL_IDS],
    },
    duplication_guard: {
      enabled: true,
      max_instances_per_character: 1,
      blocked_duplicate_roles: ['gonegi', 'dana', 'gamja', 'aengdu'],
    },
    absent_character_rule: {
      strategy: 'inject_only_active_scene_characters',
      description:
        'Only characters present in the active scene may be injected; absent source roles must not appear in the translated state.',
    },
    core_character_links: {
      gonegi: 'linked',
      dana: 'linked',
      gamja: 'linked',
      aengdu: 'linked',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: new Date().toISOString(),
  };
}

export function writeCharacterReplacementContract(
  projectRoot?: string
): CharacterReplacementContract {
  const root = resolveProjectRoot(projectRoot);
  const contract = buildCharacterReplacementContract(root);
  fs.writeFileSync(
    path.join(root, REPLACEMENT_CONTRACT_PATH),
    `${JSON.stringify(contract, null, 2)}\n`,
    'utf8'
  );
  return contract;
}

export function loadCharacterReplacementContract(
  projectRoot?: string
): CharacterReplacementContract | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, REPLACEMENT_CONTRACT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as CharacterReplacementContract;
}
