import {
  BridgeCompletenessResult,
  BridgeReceipt,
  CinematicExtractionResult,
  GroundedValue,
  PIPELINE_BRIDGE_VERSION,
  PipelineBridgeMode,
  PipelineBridgeProvenance,
  VisualAtom,
} from '../types';
import {
  buildPipelineADonorSnapshot,
  type PipelineAExtractorContext,
} from './pipelineAExtractors';

export type { PipelineAExtractorContext };
export { buildPipelineADonorSnapshot };

export interface BridgePipelineOptions {
  mode?: PipelineBridgeMode;
  /** Record from the other pipeline to pull additive fields from. */
  donor?: CinematicExtractionResult;
  /** Optional Pipeline A extractor context — builds donor A-fields when no full donor is available. */
  pipelineAContext?: PipelineAExtractorContext;
  dryRun?: boolean;
}

export interface BridgePipelineResult {
  record: CinematicExtractionResult;
  receipt: BridgeReceipt;
  provenance: PipelineBridgeProvenance;
}

const A_TO_B_ROOT_FIELDS = [
  'continuity_memory',
  'emotional_carryover',
  'camera_rhythm_memory',
  'motif_persistence',
  'character_persistence',
  'recursive_merge_state',
  'validation_metrics',
  'audit_metrics',
  'confidence_profiles',
  'orchestration_states',
] as const;

const A_TO_B_EXTRACTION_FIELDS = [
  'intermediate_pipeline_states',
  'prompts_extraction',
  'configurations_extraction',
  'graphs_extraction',
  'raw_caches_extraction',
] as const;

const B_TO_A_ROOT_FIELDS = ['audit_summary', 'golden_record'] as const;

const B_PRODUCTION_VERSIONS = [
  'production_v73',
  'production_v74',
  'production_v75',
  'production_v76',
  'production_v77',
  'production_v78',
  'production_v79',
  'production_v80',
  'production_v82',
] as const;

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

function cloneRecord<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function relationshipEdgeKey(edge: {
  subject: string;
  predicate?: string;
  object?: string;
  relation?: string;
  target?: string;
}): string {
  const predicate = edge.predicate ?? edge.relation ?? '';
  const object = edge.object ?? edge.target ?? '';
  return `${edge.subject}|${predicate}|${object}`;
}

function unionVisualAtoms(target: VisualAtom[], donor: VisualAtom[]): VisualAtom[] {
  const merged = [...target];
  const seen = new Set(target.map((a) => a.atom_id));
  for (const atom of donor) {
    if (!atom.atom_id || seen.has(atom.atom_id)) continue;
    merged.push(atom);
    seen.add(atom.atom_id);
  }
  return merged;
}

function unionRelationshipGraph(
  target: CinematicExtractionResult['relationship_graph'],
  donor: CinematicExtractionResult['relationship_graph']
): CinematicExtractionResult['relationship_graph'] {
  const merged = [...target];
  const seen = new Set(target.map(relationshipEdgeKey));
  for (const edge of donor) {
    const key = relationshipEdgeKey(edge);
    if (seen.has(key)) continue;
    merged.push(edge);
    seen.add(key);
  }
  return merged;
}

function hasGroundedMetadata(record: CinematicExtractionResult): boolean {
  const checkGrounded = (val: unknown): boolean => {
    if (!val || typeof val !== 'object') return false;
    const g = val as GroundedValue<unknown>;
    return (
      'measurement_status' in g ||
      'reason_code' in g ||
      'evidence_sources' in g ||
      'probabilistic_uncertainty_band' in g ||
      ('source' in g && 'reasoning' in g && 'confidence' in g)
    );
  };

  const physics = record.scene_state?.physics;
  if (physics) {
    for (const metric of Object.values(physics)) {
      if (checkGrounded(metric)) return true;
    }
  }
  const emotion = record.scene_state?.emotion;
  if (emotion) {
    for (const metric of Object.values(emotion)) {
      if (checkGrounded(metric)) return true;
    }
  }
  if (record.audit_summary) return true;
  return false;
}

function hasPipelineAMemory(record: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(record.continuity_memory) ||
    !isEmptyValue(record.emotional_carryover) ||
    !isEmptyValue(record.camera_rhythm_memory) ||
    !isEmptyValue(record.motif_persistence) ||
    !isEmptyValue(record.character_persistence)
  );
}

function copyEmptyField(
  target: CinematicExtractionResult,
  donor: CinematicExtractionResult,
  field: string,
  receipt: BridgeReceipt,
  pipelineFieldList: string[]
): void {
  const targetVal = (target as Record<string, unknown>)[field];
  const donorVal = (donor as Record<string, unknown>)[field];

  if (isEmptyValue(donorVal)) {
    receipt.skipped_fields.push(`${field}:donor_empty`);
    return;
  }
  if (!isEmptyValue(targetVal)) {
    receipt.conflict_fields.push(field);
    return;
  }

  receipt.added_fields.push(field);
  pipelineFieldList.push(field);
  (target as Record<string, unknown>)[field] = cloneRecord(donorVal);
}

function archiveDualVariant(
  target: CinematicExtractionResult,
  donor: CinematicExtractionResult,
  field: 'canonical_dna' | 'production_v82',
  receipt: BridgeReceipt,
  direction: 'A_TO_B' | 'B_TO_A'
): void {
  const targetVal = (target as Record<string, unknown>)[field];
  const donorVal = (donor as Record<string, unknown>)[field];

  if (isEmptyValue(donorVal)) return;
  if (isEmptyValue(targetVal)) return;

  const archiveKey =
    field === 'canonical_dna'
      ? direction === 'A_TO_B'
        ? 'canonical_dna_pipeline_a_archive'
        : 'canonical_dna_pipeline_b_archive'
      : direction === 'A_TO_B'
        ? 'production_v82_pipeline_a_archive'
        : 'production_v82_pipeline_b_archive';

  const existingArchive = (target as Record<string, unknown>)[archiveKey];
  if (!isEmptyValue(existingArchive)) {
    receipt.skipped_fields.push(`${archiveKey}:already_archived`);
    return;
  }

  (target as Record<string, unknown>)[archiveKey] = cloneRecord(donorVal);
  receipt.archived_fields.push(archiveKey);
}

function applyDenseLatentTrajectories(
  target: CinematicExtractionResult,
  donor: CinematicExtractionResult,
  receipt: BridgeReceipt,
  pipelineFieldList: string[]
): void {
  const donorTrajectories = donor.latent_steering?.dense_latent_trajectories;
  if (isEmptyValue(donorTrajectories)) {
    receipt.skipped_fields.push('latent_steering.dense_latent_trajectories:donor_empty');
    return;
  }

  const existing = target.latent_steering?.dense_latent_trajectories;
  if (!isEmptyValue(existing)) {
    receipt.conflict_fields.push('latent_steering.dense_latent_trajectories');
    return;
  }

  if (!target.latent_steering) {
    target.latent_steering = {
      vectors: donor.latent_steering?.vectors ?? { semantic_16d: {} },
      engine_adapters: donor.latent_steering?.engine_adapters ?? {},
    };
  }

  target.latent_steering.dense_latent_trajectories = cloneRecord(donorTrajectories);
  receipt.added_fields.push('latent_steering.dense_latent_trajectories');
  pipelineFieldList.push('latent_steering.dense_latent_trajectories');
}

function applyMergeMetrics(
  target: CinematicExtractionResult,
  donor: CinematicExtractionResult,
  receipt: BridgeReceipt,
  pipelineFieldList: string[]
): void {
  for (const version of B_PRODUCTION_VERSIONS) {
    const donorLayer = (donor as Record<string, unknown>)[version] as Record<string, unknown> | undefined;
    const donorMetrics = donorLayer?.merge_metrics;
    if (isEmptyValue(donorMetrics)) continue;

    let targetLayer = (target as Record<string, unknown>)[version] as Record<string, unknown> | undefined;
    if (!targetLayer) {
      targetLayer = cloneRecord(donorLayer);
      (target as Record<string, unknown>)[version] = targetLayer;
      receipt.added_fields.push(version);
      pipelineFieldList.push(version);
      continue;
    }

    if (!isEmptyValue(targetLayer.merge_metrics)) {
      receipt.conflict_fields.push(`${version}.merge_metrics`);
      continue;
    }

    targetLayer.merge_metrics = cloneRecord(donorMetrics);
    receipt.added_fields.push(`${version}.merge_metrics`);
    pipelineFieldList.push(`${version}.merge_metrics`);
  }
}

function applyProductionStack(
  target: CinematicExtractionResult,
  donor: CinematicExtractionResult,
  receipt: BridgeReceipt,
  pipelineFieldList: string[]
): void {
  for (const version of B_PRODUCTION_VERSIONS) {
    const donorVal = (donor as Record<string, unknown>)[version];
    if (isEmptyValue(donorVal)) continue;

    const targetVal = (target as Record<string, unknown>)[version];
    if (!isEmptyValue(targetVal)) {
      if (version === 'production_v82') {
        archiveDualVariant(target, donor, 'production_v82', receipt, 'B_TO_A');
      } else {
        receipt.conflict_fields.push(version);
      }
      continue;
    }

    (target as Record<string, unknown>)[version] = cloneRecord(donorVal);
    receipt.added_fields.push(version);
    pipelineFieldList.push(version);
  }
}

function applyArrayUnions(
  target: CinematicExtractionResult,
  donor: CinematicExtractionResult,
  receipt: BridgeReceipt,
  pipelineFieldList: string[]
): void {
  if (isEmptyValue(target.visual_atoms) && !isEmptyValue(donor.visual_atoms)) {
    target.visual_atoms = cloneRecord(donor.visual_atoms);
    receipt.added_fields.push('visual_atoms');
    pipelineFieldList.push('visual_atoms');
  } else if (!isEmptyValue(target.visual_atoms) && !isEmptyValue(donor.visual_atoms)) {
    const before = target.visual_atoms.length;
    target.visual_atoms = unionVisualAtoms(target.visual_atoms, donor.visual_atoms);
    if (target.visual_atoms.length > before) {
      receipt.added_fields.push('visual_atoms:union');
      pipelineFieldList.push('visual_atoms:union');
    }
  }

  if (isEmptyValue(target.relationship_graph) && !isEmptyValue(donor.relationship_graph)) {
    target.relationship_graph = cloneRecord(donor.relationship_graph);
    receipt.added_fields.push('relationship_graph');
    pipelineFieldList.push('relationship_graph');
  } else if (!isEmptyValue(target.relationship_graph) && !isEmptyValue(donor.relationship_graph)) {
    const before = target.relationship_graph.length;
    target.relationship_graph = unionRelationshipGraph(target.relationship_graph, donor.relationship_graph);
    if (target.relationship_graph.length > before) {
      receipt.added_fields.push('relationship_graph:union');
      pipelineFieldList.push('relationship_graph:union');
    }
  }
}

function applyAtoB(
  target: CinematicExtractionResult,
  donor: CinematicExtractionResult,
  receipt: BridgeReceipt,
  pipelineAFields: string[]
): void {
  for (const field of A_TO_B_ROOT_FIELDS) {
    copyEmptyField(target, donor, field, receipt, pipelineAFields);
  }
  for (const field of A_TO_B_EXTRACTION_FIELDS) {
    copyEmptyField(target, donor, field, receipt, pipelineAFields);
  }

  applyDenseLatentTrajectories(target, donor, receipt, pipelineAFields);

  if (!isEmptyValue(donor.canonical_dna) && !isEmptyValue(target.canonical_dna)) {
    archiveDualVariant(target, donor, 'canonical_dna', receipt, 'A_TO_B');
  } else if (isEmptyValue(target.canonical_dna) && !isEmptyValue(donor.canonical_dna)) {
    target.canonical_dna = cloneRecord(donor.canonical_dna);
    receipt.added_fields.push('canonical_dna');
    pipelineAFields.push('canonical_dna');
  }

  if (!isEmptyValue(donor.production_v82) && !isEmptyValue(target.production_v82)) {
    archiveDualVariant(target, donor, 'production_v82', receipt, 'A_TO_B');
  }
}

function applyBtoA(
  target: CinematicExtractionResult,
  donor: CinematicExtractionResult,
  receipt: BridgeReceipt,
  pipelineBFields: string[]
): void {
  for (const field of B_TO_A_ROOT_FIELDS) {
    copyEmptyField(target, donor, field, receipt, pipelineBFields);
  }

  applyProductionStack(target, donor, receipt, pipelineBFields);
  applyMergeMetrics(target, donor, receipt, pipelineBFields);

  if (!isEmptyValue(donor.canonical_dna) && !isEmptyValue(target.canonical_dna)) {
    archiveDualVariant(target, donor, 'canonical_dna', receipt, 'B_TO_A');
  } else if (isEmptyValue(target.canonical_dna) && !isEmptyValue(donor.canonical_dna)) {
    target.canonical_dna = cloneRecord(donor.canonical_dna);
    receipt.added_fields.push('canonical_dna');
    pipelineBFields.push('canonical_dna');
  }
}

export function createBridgeReceipt(
  mode: PipelineBridgeMode,
  dryRun: boolean,
  added: string[] = [],
  skipped: string[] = [],
  conflicts: string[] = [],
  archived: string[] = []
): BridgeReceipt {
  return {
    added_fields: [...added],
    skipped_fields: [...skipped],
    conflict_fields: [...conflicts],
    archived_fields: [...archived],
    dry_run: dryRun,
    mode,
    bridged_at: new Date().toISOString(),
    bridge_version: PIPELINE_BRIDGE_VERSION,
  };
}

/**
 * Optional post-pass bridge — never replaces Pipeline A or B engines.
 * Fills empty fields from donor using empty-only merge rules.
 */
export function bridgePipelineRecord(
  record: CinematicExtractionResult,
  options: BridgePipelineOptions = {}
): BridgePipelineResult {
  const mode: PipelineBridgeMode = options.mode ?? 'BIDIRECTIONAL';
  const dryRun = mode === 'DRY_RUN' || options.dryRun === true;

  let effectiveDonor = options.donor;
  if (options.pipelineAContext) {
    const aSnapshot = buildPipelineADonorSnapshot(options.pipelineAContext);
    effectiveDonor = {
      ...aSnapshot,
      ...(options.donor ?? {}),
    } as CinematicExtractionResult;
  }

  const donor = effectiveDonor;

  const receipt = createBridgeReceipt(mode, dryRun);
  const pipelineAFields: string[] = [];
  const pipelineBFields: string[] = [];

  if (!donor) {
    receipt.skipped_fields.push('donor:missing');
    const provenance: PipelineBridgeProvenance = {
      pipeline_a_fields: [],
      pipeline_b_fields: [],
      bridged_at: receipt.bridged_at,
      bridge_version: PIPELINE_BRIDGE_VERSION,
      mode,
    };
    return { record, receipt, provenance };
  }

  const working = dryRun ? cloneRecord(record) : record;

  const runAtoB = mode === 'A_TO_B' || mode === 'BIDIRECTIONAL' || mode === 'DRY_RUN';
  const runBtoA = mode === 'B_TO_A' || mode === 'BIDIRECTIONAL' || mode === 'DRY_RUN';

  if (runAtoB) {
    applyAtoB(working, donor, receipt, pipelineAFields);
  }
  if (runBtoA) {
    applyBtoA(working, donor, receipt, pipelineBFields);
  }

  applyArrayUnions(working, donor, receipt, runAtoB ? pipelineAFields : pipelineBFields);

  const provenance: PipelineBridgeProvenance = {
    pipeline_a_fields: pipelineAFields,
    pipeline_b_fields: pipelineBFields,
    bridged_at: receipt.bridged_at,
    bridge_version: PIPELINE_BRIDGE_VERSION,
    mode,
  };

  working.pipeline_bridge_provenance = provenance;

  if (dryRun) {
    return { record, receipt, provenance };
  }

  return { record: working, receipt, provenance };
}

/**
 * Diagnostics for unified pipeline completeness — does not gate export density.
 */
export function validateBridgeCompleteness(
  record: CinematicExtractionResult
): BridgeCompletenessResult {
  const checks = {
    has_pipeline_a_memory: hasPipelineAMemory(record),
    has_pipeline_b_audit: !isEmptyValue(record.audit_summary) || !isEmptyValue(record.golden_record),
    has_visual_atoms: !isEmptyValue(record.visual_atoms),
    has_relationship_graph: !isEmptyValue(record.relationship_graph),
    has_dense_trajectories: !isEmptyValue(record.latent_steering?.dense_latent_trajectories),
    has_grounded_metadata: hasGroundedMetadata(record),
  };

  const weights = Object.values(checks).filter(Boolean).length;
  const bridge_score = Math.round((weights / 6) * 1000) / 1000;

  return { ...checks, bridge_score };
}
