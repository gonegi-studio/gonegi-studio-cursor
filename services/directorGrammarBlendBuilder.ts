import fs from 'node:fs';
import path from 'node:path';
import {
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  EXTRACTABLE_FAMILIES,
  FAMILY_GRAMMAR_PATHS,
  type DirectorGrammarProfile,
  type ExtractableFamily,
  type GrammarBlock,
} from './directorGrammarExtractor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const BLEND_PHASE = 'PHASE-SOURCE-VIDEO-006-DIRECTOR_GRAMMAR_BLEND_CONTRACT_V1' as const;
export const BLEND_CONTRACT_PATH = 'datasets/director_blend/director-grammar-blend-contract.json' as const;
export const BLEND_REGISTRY_PATH = 'datasets/director_blend/director-grammar-blend-registry.json' as const;
export const BLEND_SCHEMA_PATH = 'datasets/director_blend/director-grammar-blend.schema.json' as const;
export const BLEND_PROFILE_PATH = 'datasets/director_blend/gonegi-master-director-blend-v1.json' as const;

export type BlendedGrammarBlock = GrammarBlock & {
  source_family: ExtractableFamily;
  source_grammar_id: string;
};

export type DirectorGrammarBlendProfile = {
  blend_id: string;
  phase: typeof BLEND_PHASE;
  base_style_family: ExtractableFamily;
  camera_family: ExtractableFamily;
  lighting_family: ExtractableFamily;
  blocking_family: ExtractableFamily;
  emotion_family: ExtractableFamily;
  motion_family: ExtractableFamily;
  environment_family: ExtractableFamily;
  priority_order: string[];
  conflict_resolution: {
    strategy: 'contract_priority_wins';
    resolved_conflicts: number;
    unresolved_conflicts: 0;
    rules: string[];
  };
  compatibility_score: number;
  source_grammar_refs: Record<ExtractableFamily, string>;
  blended_grammar: {
    visual_style: BlendedGrammarBlock;
    camera_grammar: BlendedGrammarBlock;
    lighting_grammar: BlendedGrammarBlock;
    blocking_grammar: BlendedGrammarBlock;
    emotion_grammar: BlendedGrammarBlock;
    motion_grammar: BlendedGrammarBlock;
    environment_grammar: BlendedGrammarBlock;
  };
  execution_flags: {
    design_only: true;
    gpu_execution: false;
    external_call_allowed: false;
  };
  built_at: string;
};

type BlendContract = {
  blend_id: string;
  family_assignment: {
    base_style_family: ExtractableFamily;
    camera_family: ExtractableFamily;
    lighting_family: ExtractableFamily;
    blocking_family: ExtractableFamily;
    emotion_family: ExtractableFamily;
    motion_family: ExtractableFamily;
    environment_family: ExtractableFamily;
  };
  priority_order: string[];
  conflict_resolution_rules: string[];
  identity_priority_rank: number;
  minimum_compatibility_score: number;
};

const GRAMMAR_BLOCK_KEYS = {
  visual_style: 'visual_style',
  camera_grammar: 'camera_grammar',
  lighting_grammar: 'lighting_grammar',
  blocking_grammar: 'blocking_grammar',
  emotion_grammar: 'emotion_grammar',
  motion_grammar: 'motion_grammar',
  environment_grammar: 'environment_grammar',
} as const;

type GrammarBlockKey = keyof typeof GRAMMAR_BLOCK_KEYS;

const DIMENSION_FAMILY_MAP: Record<GrammarBlockKey, keyof BlendContract['family_assignment']> = {
  visual_style: 'base_style_family',
  camera_grammar: 'camera_family',
  lighting_grammar: 'lighting_family',
  blocking_grammar: 'blocking_family',
  emotion_grammar: 'emotion_family',
  motion_grammar: 'motion_family',
  environment_grammar: 'environment_family',
};

export function loadDirectorGrammarProfile(
  projectRoot: string,
  family: ExtractableFamily
): DirectorGrammarProfile | null {
  const root = resolveProjectRoot(projectRoot);
  const rel = FAMILY_GRAMMAR_PATHS[family];
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as DirectorGrammarProfile;
}

export function loadAllDirectorGrammars(
  projectRoot: string
): Record<ExtractableFamily, DirectorGrammarProfile> | null {
  const grammars = {} as Record<ExtractableFamily, DirectorGrammarProfile>;
  for (const family of EXTRACTABLE_FAMILIES) {
    const profile = loadDirectorGrammarProfile(projectRoot, family);
    if (!profile) return null;
    grammars[family] = profile;
  }
  return grammars;
}

export function loadBlendContract(projectRoot?: string): BlendContract | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, BLEND_CONTRACT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as BlendContract;
}

function blendBlock(
  profile: DirectorGrammarProfile,
  blockKey: GrammarBlockKey
): BlendedGrammarBlock {
  const block = profile[blockKey];
  return {
    ...block,
    source_family: profile.source_family,
    source_grammar_id: profile.grammar_id,
  };
}

function computeCompatibilityScore(
  grammars: Record<ExtractableFamily, DirectorGrammarProfile>,
  contract: BlendContract
): number {
  const familiesUsed = new Set(Object.values(contract.family_assignment));
  const familyCoverage = familiesUsed.size / EXTRACTABLE_FAMILIES.length;

  let constraintHarmony = 0;
  let checks = 0;
  for (const dim of Object.keys(GRAMMAR_BLOCK_KEYS) as GrammarBlockKey[]) {
    const familyKey = contract.family_assignment[DIMENSION_FAMILY_MAP[dim]];
    const profile = grammars[familyKey];
    const hasIdentityGuard = profile[dim].constraints.some(
      (c) => c.includes('identity') || c.includes('preserve') || c.includes('no-')
    );
    if (hasIdentityGuard) constraintHarmony += 1;
    checks += 1;
  }

  const harmonyRatio = checks > 0 ? constraintHarmony / checks : 0;
  const score = 0.55 * familyCoverage + 0.45 * harmonyRatio;
  return Math.round(Math.min(1, Math.max(0, score)) * 100) / 100;
}

export function buildDirectorGrammarBlend(projectRoot?: string): DirectorGrammarBlendProfile {
  const root = resolveProjectRoot(projectRoot);
  const contract = loadBlendContract(root);
  if (!contract) {
    throw new Error(`Missing blend contract: ${BLEND_CONTRACT_PATH}`);
  }

  const grammars = loadAllDirectorGrammars(root);
  if (!grammars) {
    throw new Error('Missing one or more director grammar profiles');
  }

  const source_grammar_refs = Object.fromEntries(
    EXTRACTABLE_FAMILIES.map((f) => [f, grammars[f].grammar_id])
  ) as Record<ExtractableFamily, string>;

  const assign = contract.family_assignment;

  const blended_grammar = {
    visual_style: blendBlock(grammars[assign.base_style_family], 'visual_style'),
    camera_grammar: blendBlock(grammars[assign.camera_family], 'camera_grammar'),
    lighting_grammar: blendBlock(grammars[assign.lighting_family], 'lighting_grammar'),
    blocking_grammar: blendBlock(grammars[assign.blocking_family], 'blocking_grammar'),
    emotion_grammar: blendBlock(grammars[assign.emotion_family], 'emotion_grammar'),
    motion_grammar: blendBlock(grammars[assign.motion_family], 'motion_grammar'),
    environment_grammar: blendBlock(grammars[assign.environment_family], 'environment_grammar'),
  };

  const compatibility_score = computeCompatibilityScore(grammars, contract);

  return {
    blend_id: contract.blend_id,
    phase: BLEND_PHASE,
    base_style_family: assign.base_style_family,
    camera_family: assign.camera_family,
    lighting_family: assign.lighting_family,
    blocking_family: assign.blocking_family,
    emotion_family: assign.emotion_family,
    motion_family: assign.motion_family,
    environment_family: assign.environment_family,
    priority_order: [...contract.priority_order],
    conflict_resolution: {
      strategy: 'contract_priority_wins',
      resolved_conflicts: 0,
      unresolved_conflicts: 0,
      rules: [...contract.conflict_resolution_rules],
    },
    compatibility_score,
    source_grammar_refs,
    blended_grammar,
    execution_flags: {
      design_only: true,
      gpu_execution: false,
      external_call_allowed: false,
    },
    built_at: new Date().toISOString(),
  };
}

export function writeDirectorGrammarBlend(projectRoot?: string): DirectorGrammarBlendProfile {
  const root = resolveProjectRoot(projectRoot);
  const profile = buildDirectorGrammarBlend(root);
  fs.writeFileSync(
    path.join(root, BLEND_PROFILE_PATH),
    `${JSON.stringify(profile, null, 2)}\n`,
    'utf8'
  );
  return profile;
}

export function verifyDirectorGrammarPrecheck(projectRoot?: string): string[] {
  const root = resolveProjectRoot(projectRoot);
  const missing: string[] = [];

  const required = [
    'datasets/director_grammar/ghibli-director-grammar.json',
    'datasets/director_grammar/shinkai-director-grammar.json',
    'datasets/director_grammar/live-action-director-grammar.json',
    'datasets/director_grammar/mori-director-grammar.json',
    DIRECTOR_GRAMMAR_REGISTRY_PATH,
  ];

  for (const rel of required) {
    if (!fs.existsSync(path.join(root, rel))) {
      missing.push(rel);
    }
  }

  return missing;
}
