import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  BACKEND_ADAPTER_FOUNDATION_PATH,
} from './directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
  DSC_BACKEND_CAPABILITY_REGISTRY_PHASE,
  DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID,
  type CompatibilityOutcome,
  type DeclarationState,
  type DirectSpatialConditioningBackendCapabilityRegistry,
} from './directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-041: Direct Spatial Conditioning backend compatibility engine.
 *
 * DESIGN ONLY / READ-ONLY / BACKEND AGNOSTIC. Defines the evaluation engine that
 * a future check_compatibility implementation MUST follow when resolving a
 * backend descriptor against the frozen PHASE-040 capability registry:
 *   - evaluation flow (ordered stages),
 *   - registry lookup (which registry surfaces are read and how),
 *   - deterministic compatibility algorithm (state resolution + aggregation), and
 *   - report schema (shape of the compatibility report).
 *
 * Evaluates no backend, implements no backend, performs no GPU or inference
 * work, and modifies no dataset. Every algorithm step is declared, never
 * executed, in this phase. The PHASE-040 registry is reused by exact reference.
 */

export const DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE = 'PHASE-DSC-041' as const;
export const DSC_BACKEND_COMPATIBILITY_ENGINE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_COMPATIBILITY_ENGINE_V1' as const;

export const BACKEND_COMPATIBILITY_ENGINE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const BACKEND_COMPATIBILITY_ENGINE_PATH =
  `${BACKEND_COMPATIBILITY_ENGINE_ROOT}/direct-spatial-conditioning-backend-compatibility-engine-v1.json` as const;

export type EvaluationStageId =
  | 'bind_inputs'
  | 'lookup_registry'
  | 'validate_descriptor'
  | 'resolve_version'
  | 'resolve_rows'
  | 'aggregate_outcome'
  | 'emit_report';

export interface EvaluationStage {
  stage_id: EvaluationStageId;
  order: number;
  description: string;
  inputs: string[];
  outputs: string[];
  side_effects: 'none';
  executed_in_this_phase: false;
}

export interface RegistryLookupSurface {
  surface_id: string;
  registry_path: string;
  fields_read: string[];
  access: 'read_only';
  purpose: string;
}

export interface RegistryLookup {
  lookup_id: 'dsc-backend-registry-lookup-v1';
  description: string;
  capability_registry_ref: string;
  capability_registry_phase: typeof DSC_BACKEND_CAPABILITY_REGISTRY_PHASE;
  capability_registry_system_id: typeof DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID;
  access_mode: 'read_only_exact_reuse';
  surfaces: RegistryLookupSurface[];
  lookup_rules: string[];
  fails_closed_on: string[];
  caches: false;
  mutates_registry: false;
}

export interface AlgorithmStep {
  step_id: string;
  order: number;
  description: string;
  determinism: 'pure_function_of_inputs_and_registry';
  executed_in_this_phase: false;
}

export interface RowResolutionRule {
  row_kind: 'capability' | 'structural';
  declaration_source: string;
  supported_condition: string;
  unsupported_condition: string;
  undeclared_condition: string;
  outcome_table_ref: 'compatibility_matrix.rows[].outcome_by_state';
}

export interface DeterministicCompatibilityAlgorithm {
  algorithm_id: 'dsc-backend-compatibility-algorithm-v1';
  description: string;
  evaluated_by_method: 'check_compatibility';
  purity: 'deterministic_pure_function';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  backend_invocation: 'none';
  steps: AlgorithmStep[];
  version_resolution: {
    capability_set_id: typeof CAPABILITY_SET_ID;
    supported_versions_source: 'capability_versioning.supported_capability_set_versions';
    major_mismatch_outcome: 'incompatible';
    major_mismatch_code: 'DSC_BACKEND_INCOMPATIBLE_CAPABILITY_SET_MAJOR';
    unsupported_version_outcome: 'incompatible';
    unsupported_version_code: 'DSC_BACKEND_INCOMPATIBLE_CAPABILITY_SET_VERSION';
    minor_policy: 'compatible_if_major_matches_and_all_mandatory_rows_supported';
  };
  row_resolution: {
    matrix_ref: 'dsc-backend-compatibility-matrix-v1';
    aggregation_rule: 'all_rows_must_resolve_compatible';
    evaluation: 'collect_all_incompatibility_codes';
    rules: RowResolutionRule[];
    expected_row_count: number;
    expected_capability_rows: number;
    expected_structural_rows: number;
  };
  descriptor_validation: {
    unknown_capability_policy: 'reject_unregistered_capability_id';
    duplicate_capability_policy: 'reject_duplicate_capability_id';
    missing_capability_policy: 'treated_as_undeclared';
    unknown_capability_code: 'DSC_BACKEND_INCOMPATIBLE_UNKNOWN_CAPABILITY';
    duplicate_capability_code: 'DSC_BACKEND_INCOMPATIBLE_DUPLICATE_CAPABILITY';
    incomplete_descriptor_code: 'DSC_BACKEND_INCOMPATIBLE_INCOMPLETE_DESCRIPTOR';
  };
  tie_breakers: string[];
  evaluates_backends_in_this_phase: false;
}

export interface ReportFieldDefinition {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface CompatibilityReportSchema {
  report_schema_id: 'dsc-backend-compatibility-report-schema-v1';
  report_id: 'dsc-backend-compatibility-report-v1';
  description: string;
  encoding: 'application/json';
  registry_report_shape_ref: 'compatibility_matrix.report_shape';
  required_fields: ReportFieldDefinition[];
  outcome_values: ['compatible', 'incompatible'];
  row_result_shape: {
    fields: string[];
    declaration_states: ['supported', 'unsupported', 'undeclared'];
    outcome_values: ['compatible', 'incompatible'];
  };
  ordering: {
    evaluated_rows: 'registry_matrix_row_order';
    failed_rows: 'registry_matrix_row_order';
    incompatibility_codes: 'first_failure_order_then_lexicographic';
  };
  additional_fields: false;
  materializes_tensors: false;
  materializes_frames: false;
}

export interface DirectSpatialConditioningBackendCompatibilityEngine {
  compatibility_engine_id: string;
  phase: typeof DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE;
  system_id: typeof DSC_BACKEND_COMPATIBILITY_ENGINE_SYSTEM_ID;
  mode: 'design_only_engine';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_COMPATIBILITY_ENGINE_V1';
  capability_registry_ref: string;
  capability_registry_phase: typeof DSC_BACKEND_CAPABILITY_REGISTRY_PHASE;
  capability_registry_system_id: typeof DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID;
  adapter_foundation_ref: string;
  runtime_interface_ref: string;
  runtime_package_ref: string;
  sources_supported: string[];
  required_channels: ConditioningChannelId[];
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  evaluation_flow: {
    flow_id: 'dsc-backend-compatibility-evaluation-flow-v1';
    description: string;
    ordered_stages: EvaluationStage[];
    accept_condition: 'zero incompatibility codes after aggregate_outcome';
    reject_condition: 'one or more incompatibility codes collected';
    outcome_values: ['compatible', 'incompatible'];
  };
  registry_lookup: RegistryLookup;
  deterministic_algorithm: DeterministicCompatibilityAlgorithm;
  report_schema: CompatibilityReportSchema;
  design_constraints: {
    engine_only: true;
    read_only: true;
    backend_agnostic: true;
    reuses_capability_registry: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    evaluates_backends_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const EVALUATION_STAGES: EvaluationStage[] = [
  {
    stage_id: 'bind_inputs',
    order: 1,
    description:
      'Bind the backend descriptor and the adapted conditioning input reference as immutable evaluation inputs. No backend is invoked.',
    inputs: ['backend_descriptor', 'adapted_conditioning_input_ref'],
    outputs: ['bound_evaluation_inputs'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'lookup_registry',
    order: 2,
    description:
      'Load the frozen PHASE-040 capability registry surfaces required by the algorithm through the registry lookup specification.',
    inputs: ['bound_evaluation_inputs', 'capability_registry_ref'],
    outputs: ['registry_snapshot'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'validate_descriptor',
    order: 3,
    description:
      'Validate descriptor completeness against the backend descriptor and capability declaration schemas; reject unknown or duplicate capability ids.',
    inputs: ['bound_evaluation_inputs', 'registry_snapshot'],
    outputs: ['validated_descriptor', 'descriptor_rejection_codes'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'resolve_version',
    order: 4,
    description:
      'Resolve the declared capability_set_version against the registry versioning policy before any matrix row is evaluated.',
    inputs: ['validated_descriptor', 'registry_snapshot'],
    outputs: ['version_resolution', 'version_rejection_codes'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'resolve_rows',
    order: 5,
    description:
      'For every mandatory matrix row, determine the declaration state and map it to a compatibility outcome using the frozen outcome table.',
    inputs: ['validated_descriptor', 'registry_snapshot', 'version_resolution'],
    outputs: ['evaluated_rows', 'row_incompatibility_codes'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'aggregate_outcome',
    order: 6,
    description:
      'Aggregate descriptor, version, and row codes under all_rows_must_resolve_compatible; collect every code without short-circuit mutation of inputs.',
    inputs: [
      'descriptor_rejection_codes',
      'version_rejection_codes',
      'row_incompatibility_codes',
      'evaluated_rows',
    ],
    outputs: ['outcome', 'failed_rows', 'incompatibility_codes'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'emit_report',
    order: 7,
    description:
      'Emit the compatibility report conforming to the report schema. Report emission is the only output of the engine.',
    inputs: [
      'validated_descriptor',
      'version_resolution',
      'evaluated_rows',
      'failed_rows',
      'incompatibility_codes',
      'outcome',
    ],
    outputs: ['compatibility_report'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
];

const ALGORITHM_STEPS: AlgorithmStep[] = [
  {
    step_id: 'assert_descriptor_fields_present',
    order: 1,
    description:
      'Require every backend_descriptor.required_fields entry to be present and non-null; missing fields emit DSC_BACKEND_INCOMPATIBLE_INCOMPLETE_DESCRIPTOR.',
    determinism: 'pure_function_of_inputs_and_registry',
    executed_in_this_phase: false,
  },
  {
    step_id: 'index_declared_capabilities',
    order: 2,
    description:
      'Build a capability_id -> declaration map; reject unregistered ids and duplicate ids before any row is resolved.',
    determinism: 'pure_function_of_inputs_and_registry',
    executed_in_this_phase: false,
  },
  {
    step_id: 'resolve_capability_set_version',
    order: 3,
    description:
      'Compare declared capability_set_version major against the registry current major; unsupported or major-mismatched versions are incompatible.',
    determinism: 'pure_function_of_inputs_and_registry',
    executed_in_this_phase: false,
  },
  {
    step_id: 'resolve_capability_rows',
    order: 4,
    description:
      'For each capability matrix row, state = supported if declared==supported, unsupported if declared==unsupported, undeclared if missing; map through outcome_by_state.',
    determinism: 'pure_function_of_inputs_and_registry',
    executed_in_this_phase: false,
  },
  {
    step_id: 'resolve_structural_rows',
    order: 5,
    description:
      'For each structural matrix row, compare the declared structural field to the frozen required_value; equality yields supported, inequality unsupported, absence undeclared.',
    determinism: 'pure_function_of_inputs_and_registry',
    executed_in_this_phase: false,
  },
  {
    step_id: 'collect_and_aggregate',
    order: 6,
    description:
      'Concatenate all incompatibility codes in first-failure order then lexicographic within a stage; outcome is compatible iff the code list is empty.',
    determinism: 'pure_function_of_inputs_and_registry',
    executed_in_this_phase: false,
  },
  {
    step_id: 'project_report',
    order: 7,
    description:
      'Project the aggregated result into the fixed report schema fields without adding, omitting, or reordering beyond the declared ordering policy.',
    determinism: 'pure_function_of_inputs_and_registry',
    executed_in_this_phase: false,
  },
];

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Build the design-only, read-only DSC backend compatibility engine.
 * Reuses the PHASE-040 capability registry by exact reference; writes only the
 * engine artifact. No backend is evaluated and no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningBackendCompatibilityEngine(
  projectRoot?: string
): { compatibilityEngine: DirectSpatialConditioningBackendCompatibilityEngine } {
  const root = resolveProjectRoot(projectRoot);

  const capabilityRegistry = readJson<DirectSpatialConditioningBackendCapabilityRegistry>(
    root,
    BACKEND_CAPABILITY_REGISTRY_PATH
  );
  if (
    capabilityRegistry.phase !== DSC_BACKEND_CAPABILITY_REGISTRY_PHASE ||
    capabilityRegistry.system_id !== DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID
  ) {
    throw new Error('PHASE-040 capability registry is missing or incompatible');
  }
  if (!capabilityRegistry.design_constraints.backend_agnostic) {
    throw new Error('Capability registry must remain backend agnostic');
  }
  if (!capabilityRegistry.design_constraints.read_only) {
    throw new Error('Capability registry must remain read-only');
  }
  if (
    JSON.stringify(capabilityRegistry.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Capability registry channels do not match foundation channels');
  }
  if (
    JSON.stringify(capabilityRegistry.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Capability registry sources_supported drifted from the certified corpus');
  }

  const matrix = capabilityRegistry.compatibility_matrix;
  if (matrix.matrix_id !== 'dsc-backend-compatibility-matrix-v1') {
    throw new Error('Compatibility matrix identity drifted');
  }
  if (matrix.aggregation_rule !== 'all_rows_must_resolve_compatible') {
    throw new Error('Compatibility matrix aggregation rule drifted');
  }
  if (matrix.report_shape.report_id !== 'dsc-backend-compatibility-report-v1') {
    throw new Error('Compatibility report identity drifted');
  }

  const capabilityRows = matrix.rows.filter((row) => row.row_kind === 'capability');
  const structuralRows = matrix.rows.filter((row) => row.row_kind === 'structural');
  if (capabilityRows.length !== capabilityRegistry.capability_schema.registered_capability_ids.length) {
    throw new Error('Capability matrix rows drifted from registered capability ids');
  }

  const versioning = capabilityRegistry.capability_versioning;
  if (
    versioning.capability_set_id !== CAPABILITY_SET_ID ||
    versioning.current_capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Capability set version identity drifted');
  }

  const registry_lookup: RegistryLookup = {
    lookup_id: 'dsc-backend-registry-lookup-v1',
    description:
      'Read-only lookup of the frozen PHASE-040 capability registry surfaces required by the compatibility algorithm. Lookup never mutates the registry and never caches across evaluations.',
    capability_registry_ref: BACKEND_CAPABILITY_REGISTRY_PATH,
    capability_registry_phase: DSC_BACKEND_CAPABILITY_REGISTRY_PHASE,
    capability_registry_system_id: DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID,
    access_mode: 'read_only_exact_reuse',
    surfaces: [
      {
        surface_id: 'backend_descriptor',
        registry_path: 'backend_descriptor',
        fields_read: [
          'descriptor_id',
          'required_fields',
          'produced_by_method',
          'identity_policy',
        ],
        access: 'read_only',
        purpose: 'Validate that the inbound descriptor matches the registered shape.',
      },
      {
        surface_id: 'capability_schema',
        registry_path: 'capability_schema',
        fields_read: [
          'registered_capability_ids',
          'declaration_values',
          'unknown_capability_policy',
          'duplicate_capability_policy',
          'missing_capability_policy',
        ],
        access: 'read_only',
        purpose: 'Index and validate declared capabilities against registered ids.',
      },
      {
        surface_id: 'compatibility_matrix',
        registry_path: 'compatibility_matrix',
        fields_read: [
          'rows',
          'outcome_values',
          'aggregation_rule',
          'evaluation',
          'report_shape',
        ],
        access: 'read_only',
        purpose: 'Provide mandatory rows and the frozen outcome table for row resolution.',
      },
      {
        surface_id: 'capability_versioning',
        registry_path: 'capability_versioning',
        fields_read: [
          'capability_set_id',
          'current_capability_set_version',
          'supported_capability_set_versions',
          'compatibility_policy',
        ],
        access: 'read_only',
        purpose: 'Resolve the declared capability_set_version before matrix evaluation.',
      },
    ],
    lookup_rules: [
      'lookup always reads BACKEND_CAPABILITY_REGISTRY_PATH by exact path',
      'missing registry artifact fails closed with no outcome emitted',
      'registry phase and system_id must equal PHASE-DSC-040 identities',
      'lookup returns an immutable snapshot; algorithm steps never write back',
      'no network, device, or backend call is permitted during lookup',
    ],
    fails_closed_on: [
      'missing_capability_registry',
      'phase_or_system_id_mismatch',
      'backend_agnostic_constraint_violated',
      'matrix_or_versioning_identity_drift',
    ],
    caches: false,
    mutates_registry: false,
  };

  const deterministic_algorithm: DeterministicCompatibilityAlgorithm = {
    algorithm_id: 'dsc-backend-compatibility-algorithm-v1',
    description:
      'Pure, seedless, time-independent algorithm that resolves a backend descriptor against the PHASE-040 matrix and versioning surfaces. Declared only; never executed in this phase.',
    evaluated_by_method: 'check_compatibility',
    purity: 'deterministic_pure_function',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    backend_invocation: 'none',
    steps: ALGORITHM_STEPS,
    version_resolution: {
      capability_set_id: CAPABILITY_SET_ID,
      supported_versions_source: 'capability_versioning.supported_capability_set_versions',
      major_mismatch_outcome: 'incompatible',
      major_mismatch_code: 'DSC_BACKEND_INCOMPATIBLE_CAPABILITY_SET_MAJOR',
      unsupported_version_outcome: 'incompatible',
      unsupported_version_code: 'DSC_BACKEND_INCOMPATIBLE_CAPABILITY_SET_VERSION',
      minor_policy: 'compatible_if_major_matches_and_all_mandatory_rows_supported',
    },
    row_resolution: {
      matrix_ref: 'dsc-backend-compatibility-matrix-v1',
      aggregation_rule: 'all_rows_must_resolve_compatible',
      evaluation: 'collect_all_incompatibility_codes',
      rules: [
        {
          row_kind: 'capability',
          declaration_source: 'declared_capabilities[capability_id].declared',
          supported_condition: 'declaration equals supported',
          unsupported_condition: 'declaration equals unsupported',
          undeclared_condition: 'capability_id absent from declared_capabilities',
          outcome_table_ref: 'compatibility_matrix.rows[].outcome_by_state',
        },
        {
          row_kind: 'structural',
          declaration_source:
            'declared_spatial_frame | declared_channels | declared_adapted_input_shape | adapter_interface_version',
          supported_condition: 'declared value equals row.required_value',
          unsupported_condition: 'declared value present but not equal to row.required_value',
          undeclared_condition: 'structural field absent from descriptor',
          outcome_table_ref: 'compatibility_matrix.rows[].outcome_by_state',
        },
      ],
      expected_row_count: matrix.rows.length,
      expected_capability_rows: capabilityRows.length,
      expected_structural_rows: structuralRows.length,
    },
    descriptor_validation: {
      unknown_capability_policy: 'reject_unregistered_capability_id',
      duplicate_capability_policy: 'reject_duplicate_capability_id',
      missing_capability_policy: 'treated_as_undeclared',
      unknown_capability_code: 'DSC_BACKEND_INCOMPATIBLE_UNKNOWN_CAPABILITY',
      duplicate_capability_code: 'DSC_BACKEND_INCOMPATIBLE_DUPLICATE_CAPABILITY',
      incomplete_descriptor_code: 'DSC_BACKEND_INCOMPATIBLE_INCOMPLETE_DESCRIPTOR',
    },
    tie_breakers: [
      'stages execute strictly in evaluation_flow order',
      'matrix rows resolve in registry matrix row order',
      'within a stage, incompatibility codes sort lexicographically after first-failure order',
      'empty incompatibility_codes is the sole compatible outcome',
    ],
    evaluates_backends_in_this_phase: false,
  };

  // Report schema locks the PHASE-040 report_shape fields and expands them with
  // typed constraints so emit_report cannot drift from the registry contract.
  const registryReportFields = matrix.report_shape.required_fields;
  const reportFieldConstraints: Record<string, { type: string; constraint: string }> = {
    backend_id: {
      type: 'string',
      constraint: 'opaque backend_id copied from the validated descriptor',
    },
    capability_set_version: {
      type: 'string',
      constraint: 'declared capability_set_version after version resolution',
    },
    evaluated_rows: {
      type: 'array<row_result>',
      constraint: 'one entry per matrix row, ordered by registry matrix row order',
    },
    failed_rows: {
      type: 'array<string>',
      constraint: 'row_ids whose outcome is incompatible, in registry matrix row order',
    },
    incompatibility_codes: {
      type: 'array<string>',
      constraint:
        'collected codes in first-failure order then lexicographic; empty iff outcome is compatible',
    },
    outcome: {
      type: 'string',
      constraint: 'must be one of outcome_values',
    },
  };

  const required_fields: ReportFieldDefinition[] = registryReportFields.map((field) => {
    const spec = reportFieldConstraints[field];
    if (!spec) {
      throw new Error(`Registry report field ${field} has no engine constraint`);
    }
    return {
      field,
      type: spec.type,
      required: true,
      nullable: false,
      constraint: spec.constraint,
    };
  });

  const report_schema: CompatibilityReportSchema = {
    report_schema_id: 'dsc-backend-compatibility-report-schema-v1',
    report_id: 'dsc-backend-compatibility-report-v1',
    description:
      'Typed report schema for the compatibility report emitted by emit_report. Field set is locked to the PHASE-040 matrix report_shape; additional fields are forbidden.',
    encoding: 'application/json',
    registry_report_shape_ref: 'compatibility_matrix.report_shape',
    required_fields,
    outcome_values: ['compatible', 'incompatible'],
    row_result_shape: {
      fields: [
        'row_id',
        'row_kind',
        'declaration_state',
        'outcome',
        'incompatibility_code_or_null',
      ],
      declaration_states: ['supported', 'unsupported', 'undeclared'],
      outcome_values: ['compatible', 'incompatible'],
    },
    ordering: {
      evaluated_rows: 'registry_matrix_row_order',
      failed_rows: 'registry_matrix_row_order',
      incompatibility_codes: 'first_failure_order_then_lexicographic',
    },
    additional_fields: false,
    materializes_tensors: false,
    materializes_frames: false,
  };

  // Exhaustiveness: every matrix outcome/state must remain available to the engine.
  const expectedStates: DeclarationState[] = ['supported', 'unsupported', 'undeclared'];
  const expectedOutcomes: CompatibilityOutcome[] = ['compatible', 'incompatible'];
  if (JSON.stringify(matrix.declaration_states) !== JSON.stringify(expectedStates)) {
    throw new Error('Matrix declaration states drifted');
  }
  if (JSON.stringify(matrix.outcome_values) !== JSON.stringify(expectedOutcomes)) {
    throw new Error('Matrix outcome values drifted');
  }

  const compatibilityEngine: DirectSpatialConditioningBackendCompatibilityEngine = {
    compatibility_engine_id: 'direct-spatial-conditioning-backend-compatibility-engine-v1',
    phase: DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE,
    system_id: DSC_BACKEND_COMPATIBILITY_ENGINE_SYSTEM_ID,
    mode: 'design_only_engine',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_COMPATIBILITY_ENGINE_V1',
    capability_registry_ref: BACKEND_CAPABILITY_REGISTRY_PATH,
    capability_registry_phase: DSC_BACKEND_CAPABILITY_REGISTRY_PHASE,
    capability_registry_system_id: DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID,
    adapter_foundation_ref: BACKEND_ADAPTER_FOUNDATION_PATH,
    runtime_interface_ref: RUNTIME_INTERFACE_PATH,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    evaluation_flow: {
      flow_id: 'dsc-backend-compatibility-evaluation-flow-v1',
      description:
        'Ordered evaluation stages a future check_compatibility implementation must execute. Stages are declared only; none are executed in this phase.',
      ordered_stages: EVALUATION_STAGES,
      accept_condition: 'zero incompatibility codes after aggregate_outcome',
      reject_condition: 'one or more incompatibility codes collected',
      outcome_values: ['compatible', 'incompatible'],
    },
    registry_lookup,
    deterministic_algorithm,
    report_schema,
    design_constraints: {
      engine_only: true,
      read_only: true,
      backend_agnostic: true,
      reuses_capability_registry: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      evaluates_backends_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, BACKEND_COMPATIBILITY_ENGINE_PATH, compatibilityEngine);
  return { compatibilityEngine };
}
