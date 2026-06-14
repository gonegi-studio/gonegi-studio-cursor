import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import type { SceneState } from './sceneStateBuilder.js';
import {
  CHARACTER_SOURCE,
  EMOTION_INDEX_SOURCE,
  LIGHTING_INDEX_SOURCE,
  LOCATION_INDEX_SOURCE,
  RELATIONSHIP_SOURCE,
  SCENE_STATE_PHASE,
} from './sceneStateBuilder.js';

export const SCENE_STATE_PASS_VERDICT = 'PASS_SCENE_STATE_FOUNDATION_V1' as const;
export const SCENE_STATE_FAIL_VERDICT = 'FAIL_SCENE_STATE_FOUNDATION_V1' as const;
export const SCENE_STATE_FOUNDATION_REPORT_PATH =
  'reports/scene-state-foundation-report.json' as const;

export const SCHEMA_PATH = 'datasets/state/scene-state.schema.json' as const;
export const PRIORITY_CONTRACT_PATH = 'datasets/state/scene-state-priority-contract.json' as const;
export const REGISTRY_PATH = 'datasets/state/scene-state-registry.json' as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type SceneStateValidationResult = {
  scene_state_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type SceneStateFoundationReport = {
  foundation_id: string;
  phase: typeof SCENE_STATE_PHASE;
  timestamp: string;
  state_count: number;
  priority_contract_status: 'PASS' | 'FAIL';
  validation_status: 'PASS' | 'FAIL';
  registry_status: 'PASS' | 'FAIL';
  scene_validations: SceneStateValidationResult[];
  issues: ValidationIssue[];
  final_verdict: typeof SCENE_STATE_PASS_VERDICT | typeof SCENE_STATE_FAIL_VERDICT;
};

type PriorityContract = {
  priority_order: Array<{ rank: number; layer: string; aliases: string[] }>;
  forbidden_overrides: string[];
};

type RegistryDoc = {
  scene_states: Array<{
    scene_state_id: string;
    state_path: string;
    status: string;
  }>;
  transition_edges?: Array<{
    from_scene_state_id: string;
    to_scene_state_id: string;
    transition_type: string;
    continuity_safe: boolean;
  }>;
};

const REQUIRED_LAYERS = [
  'identity_state',
  'character_state',
  'emotion_state',
  'relationship_state',
  'camera_state',
  'composition_state',
  'location_state',
  'environment_state',
  'lighting_state',
] as const;

function loadReferenceSets(root: string): {
  characterIds: Set<string>;
  locationIds: Set<string>;
  lightingIds: Set<string>;
  emotionIds: Set<string>;
  relationshipIds: Set<string>;
} {
  const characters = readJsonRecord(root, CHARACTER_SOURCE) as {
    characters?: Array<{ character_id: string }>;
  } | null;
  const locations = readJsonRecord(root, LOCATION_INDEX_SOURCE) as {
    entries?: Array<{ location_id: string }>;
  } | null;
  const lighting = readJsonRecord(root, LIGHTING_INDEX_SOURCE) as {
    entries?: Array<{ lighting_id: string }>;
  } | null;
  const emotions = readJsonRecord(root, EMOTION_INDEX_SOURCE) as {
    entries?: Array<{ emotion_id: string }>;
  } | null;
  const relationships = readJsonRecord(root, RELATIONSHIP_SOURCE) as {
    patterns?: Array<{ relationship_id: string }>;
  } | null;

  return {
    characterIds: new Set((characters?.characters ?? []).map((c) => c.character_id)),
    locationIds: new Set((locations?.entries ?? []).map((e) => e.location_id)),
    lightingIds: new Set((lighting?.entries ?? []).map((e) => e.lighting_id)),
    emotionIds: new Set((emotions?.entries ?? []).map((e) => e.emotion_id)),
    relationshipIds: new Set((relationships?.patterns ?? []).map((p) => p.relationship_id)),
  };
}

function isLayerPresent(state: SceneState, layer: string): boolean {
  const value = (state as Record<string, unknown>)[layer];
  return value !== null && value !== undefined && typeof value === 'object';
}

function validateMissingStates(state: SceneState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const layer of REQUIRED_LAYERS) {
    if (!isLayerPresent(state, layer)) {
      issues.push({
        code: 'MISSING_STATE_LAYER',
        message: `Missing required layer: ${layer}`,
        severity: 'error',
        field: layer,
      });
    }
  }
  if (!state.scene_state_id) {
    issues.push({
      code: 'MISSING_SCENE_STATE_ID',
      message: 'scene_state_id is required',
      severity: 'error',
      field: 'scene_state_id',
    });
  }
  if (state.character_state.active_character_ids.length === 0) {
    issues.push({
      code: 'EMPTY_CHARACTER_STATE',
      message: 'character_state.active_character_ids must not be empty',
      severity: 'error',
      field: 'character_state.active_character_ids',
    });
  }
  return issues;
}

function validatePriorityContract(
  state: SceneState,
  contract: PriorityContract
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (state.identity_state.identity_priority_rank !== 1) {
    issues.push({
      code: 'PRIORITY_VIOLATION',
      message: 'identity_state must hold rank 1 priority',
      severity: 'error',
      field: 'identity_state.identity_priority_rank',
    });
  }

  const protectedIds = new Set(state.identity_state.protected_character_ids);
  for (const characterId of state.character_state.active_character_ids) {
    if (!protectedIds.has(characterId)) {
      issues.push({
        code: 'PRIORITY_VIOLATION',
        message: `character_state includes ${characterId} not protected by identity_state`,
        severity: 'error',
        field: 'identity_state.protected_character_ids',
      });
    }
  }

  const envWorld = state.environment_state.world_identity;
  if (envWorld && envWorld !== state.world_identity) {
    issues.push({
      code: 'PRIORITY_VIOLATION',
      message: 'environment_state.world_identity must not override scene world_identity',
      severity: 'error',
      field: 'environment_state.world_identity',
    });
  }

  const ranks = contract.priority_order.map((p) => p.layer);
  const identityIdx = ranks.indexOf('identity_state');
  const envIdx = ranks.indexOf('environment_state');
  if (identityIdx < 0 || envIdx < 0 || identityIdx >= envIdx) {
    issues.push({
      code: 'PRIORITY_CONTRACT_INVALID',
      message: 'Priority contract must rank identity_state above environment_state',
      severity: 'error',
      field: 'priority_order',
    });
  }

  return issues;
}

function validateOrphanReferences(
  state: SceneState,
  refs: ReturnType<typeof loadReferenceSets>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const id of state.character_state.active_character_ids) {
    if (!refs.characterIds.has(id)) {
      issues.push({
        code: 'ORPHAN_REFERENCE',
        message: `Unknown character_id: ${id}`,
        severity: 'error',
        field: 'character_state.active_character_ids',
      });
    }
  }

  if (!refs.locationIds.has(state.location_state.location_id)) {
    issues.push({
      code: 'ORPHAN_REFERENCE',
      message: `Unknown location_id: ${state.location_state.location_id}`,
      severity: 'error',
      field: 'location_state.location_id',
    });
  }

  if (!refs.lightingIds.has(state.lighting_state.lighting_id)) {
    issues.push({
      code: 'ORPHAN_REFERENCE',
      message: `Unknown lighting_id: ${state.lighting_state.lighting_id}`,
      severity: 'error',
      field: 'lighting_state.lighting_id',
    });
  }

  if (!refs.emotionIds.has(state.emotion_state.emotion_id)) {
    issues.push({
      code: 'ORPHAN_REFERENCE',
      message: `Unknown emotion_id: ${state.emotion_state.emotion_id}`,
      severity: 'error',
      field: 'emotion_state.emotion_id',
    });
  }

  if (
    state.relationship_state.relationship_id &&
    !refs.relationshipIds.has(state.relationship_state.relationship_id)
  ) {
    issues.push({
      code: 'ORPHAN_REFERENCE',
      message: `Unknown relationship_id: ${state.relationship_state.relationship_id}`,
      severity: 'error',
      field: 'relationship_state.relationship_id',
    });
  }

  return issues;
}

function validateTransitions(
  state: SceneState,
  knownStateIds: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!state.transition?.from_scene_state_id) return issues;

  if (!knownStateIds.has(state.transition.from_scene_state_id)) {
    issues.push({
      code: 'INVALID_TRANSITION',
      message: `transition.from_scene_state_id not registered: ${state.transition.from_scene_state_id}`,
      severity: 'error',
      field: 'transition.from_scene_state_id',
    });
  }

  if (state.transition.from_scene_state_id === state.scene_state_id) {
    issues.push({
      code: 'INVALID_TRANSITION',
      message: 'Scene cannot transition from itself',
      severity: 'error',
      field: 'transition.from_scene_state_id',
    });
  }

  return issues;
}

export function validateSceneState(
  state: SceneState,
  contract: PriorityContract,
  refs: ReturnType<typeof loadReferenceSets>,
  knownStateIds: Set<string>
): SceneStateValidationResult {
  const issues = [
    ...validateMissingStates(state),
    ...validatePriorityContract(state, contract),
    ...validateOrphanReferences(state, refs),
    ...validateTransitions(state, knownStateIds),
  ];

  return {
    scene_state_id: state.scene_state_id,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function validatePriorityContractFile(projectRoot: string): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const contract = readJsonRecord(root, PRIORITY_CONTRACT_PATH) as PriorityContract | null;
  if (!contract?.priority_order?.length) {
    issues.push({
      code: 'MISSING_PRIORITY_CONTRACT',
      message: `Missing or empty ${PRIORITY_CONTRACT_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const layers = contract.priority_order.map((p) => p.layer);
  const expected = [
    'identity_state',
    'character_state',
    'emotion_state',
    'relationship_state',
    'camera_state',
    'composition_state',
    'location_state',
    'environment_state',
  ];

  for (let i = 0; i < expected.length; i += 1) {
    if (layers[i] !== expected[i]) {
      issues.push({
        code: 'PRIORITY_ORDER_MISMATCH',
        message: `Expected rank ${i + 1} layer ${expected[i]}, got ${layers[i] ?? 'missing'}`,
        severity: 'error',
        field: 'priority_order',
      });
    }
  }

  return issues;
}

export function validateRegistry(
  projectRoot: string,
  states: SceneState[]
): { issues: ValidationIssue[]; registry: RegistryDoc | null } {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  const registry = readJsonRecord(root, REGISTRY_PATH) as RegistryDoc | null;
  if (!registry?.scene_states?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing or empty ${REGISTRY_PATH}`,
      severity: 'error',
    });
    return { issues, registry };
  }

  const ids = registry.scene_states.map((s) => s.scene_state_id);
  const duplicateIds = ids.filter((id, idx) => ids.indexOf(id) !== idx);
  for (const dup of [...new Set(duplicateIds)]) {
    issues.push({
      code: 'DUPLICATE_STATE',
      message: `Duplicate scene_state_id in registry: ${dup}`,
      severity: 'error',
      field: 'scene_states',
    });
  }

  const stateIdSet = new Set(states.map((s) => s.scene_state_id));
  for (const entry of registry.scene_states) {
    if (!stateIdSet.has(entry.scene_state_id)) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry entry missing built state: ${entry.scene_state_id}`,
        severity: 'error',
        field: 'scene_states',
      });
    }
    const absPath = path.join(root, entry.state_path);
    if (!fs.existsSync(absPath)) {
      issues.push({
        code: 'MISSING_STATE_FILE',
        message: `Registry state_path missing on disk: ${entry.state_path}`,
        severity: 'error',
        field: entry.state_path,
      });
    }
  }

  const knownIds = new Set(registry.scene_states.map((s) => s.scene_state_id));
  for (const edge of registry.transition_edges ?? []) {
    if (!knownIds.has(edge.from_scene_state_id) || !knownIds.has(edge.to_scene_state_id)) {
      issues.push({
        code: 'INVALID_TRANSITION_EDGE',
        message: `Transition edge references unknown state: ${edge.from_scene_state_id} -> ${edge.to_scene_state_id}`,
        severity: 'error',
        field: 'transition_edges',
      });
    }
  }

  return { issues, registry };
}

export function runSceneStateFoundationValidation(
  projectRoot: string,
  states: SceneState[]
): SceneStateFoundationReport {
  const root = resolveProjectRoot(projectRoot);
  const contract = readJsonRecord(root, PRIORITY_CONTRACT_PATH) as PriorityContract;
  const refs = loadReferenceSets(root);

  const contractIssues = validatePriorityContractFile(root);
  const { issues: registryIssues, registry } = validateRegistry(root, states);

  const knownStateIds = new Set([
    ...(registry?.scene_states ?? []).map((s) => s.scene_state_id),
    ...states.map((s) => s.scene_state_id),
  ]);

  const scene_validations = states.map((state) =>
    validateSceneState(state, contract, refs, knownStateIds)
  );

  const issues = [
    ...contractIssues,
    ...registryIssues,
    ...scene_validations.flatMap((v) => v.issues),
  ];

  const errors = issues.filter((i) => i.severity === 'error');
  const priority_contract_status = contractIssues.length === 0 ? 'PASS' : 'FAIL';
  const registry_status = registryIssues.length === 0 ? 'PASS' : 'FAIL';
  const validation_status =
    scene_validations.every((v) => v.valid) && errors.length === 0 ? 'PASS' : 'FAIL';

  const pass =
    priority_contract_status === 'PASS' &&
    registry_status === 'PASS' &&
    validation_status === 'PASS';

  return {
    foundation_id: `scene_state_foundation_${Date.now().toString(36)}`,
    phase: SCENE_STATE_PHASE,
    timestamp: new Date().toISOString(),
    state_count: states.length,
    priority_contract_status,
    validation_status,
    registry_status,
    scene_validations,
    issues,
    final_verdict: pass ? SCENE_STATE_PASS_VERDICT : SCENE_STATE_FAIL_VERDICT,
  };
}

export function writeSceneStateFoundationReport(
  projectRoot: string,
  states: SceneState[]
): SceneStateFoundationReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runSceneStateFoundationValidation(root, states);

  const payload = {
    ...report,
    report_type: 'scene_state_foundation_report',
    report_version: 'v1',
    export_path: SCENE_STATE_FOUNDATION_REPORT_PATH,
    schema_path: SCHEMA_PATH,
    priority_contract_path: PRIORITY_CONTRACT_PATH,
    registry_path: REGISTRY_PATH,
    next_phase: 'PHASE-19 SCENE_STATE_TO_VIDEO_PREPARATION_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, SCENE_STATE_FOUNDATION_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return report;
}
