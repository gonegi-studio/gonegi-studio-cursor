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
  DSC_BACKEND_ADAPTER_FOUNDATION_PHASE,
  DSC_BACKEND_ADAPTER_FOUNDATION_SYSTEM_ID,
  type DirectSpatialConditioningBackendAdapterFoundation,
} from './directSpatialConditioningBackendAdapterFoundationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-040: Direct Spatial Conditioning backend capability registry.
 *
 * DESIGN ONLY / READ-ONLY / BACKEND AGNOSTIC. Defines the registry surface that
 * governs how a backend declares and is matched against the PHASE-039 capability
 * contract:
 *   - a backend descriptor (what describe_capabilities must publish),
 *   - a capability schema (shape of one capability declaration),
 *   - a compatibility matrix (how declarations resolve to compatible/incompatible), and
 *   - capability versioning (how the capability set evolves).
 *
 * Registers no backend, implements no backend, evaluates no descriptor, and
 * performs no GPU, inference, or dataset modification. Every registered value is
 * derived read-only from the frozen PHASE-039 adapter foundation.
 */

export const DSC_BACKEND_CAPABILITY_REGISTRY_PHASE = 'PHASE-DSC-040' as const;
export const DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_CAPABILITY_REGISTRY_V1' as const;

export const BACKEND_CAPABILITY_REGISTRY_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const BACKEND_CAPABILITY_REGISTRY_PATH =
  `${BACKEND_CAPABILITY_REGISTRY_ROOT}/direct-spatial-conditioning-backend-capability-registry-v1.json` as const;

export const CAPABILITY_SET_ID = 'dsc-backend-capability-set-v1' as const;
export const CAPABILITY_SET_VERSION = '1.0' as const;

export type DeclarationState = 'supported' | 'unsupported' | 'undeclared';
export type CompatibilityOutcome = 'compatible' | 'incompatible';

export interface DescriptorField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface BackendDescriptorSpec {
  descriptor_id: 'dsc-backend-descriptor-v1';
  description: string;
  produced_by_method: 'describe_capabilities';
  adapter_interface_ref: 'dsc-backend-adapter-interface-v1';
  required_fields: DescriptorField[];
  optional_fields: [];
  identity_policy: 'opaque_backend_id_no_vendor_binding';
  additional_fields: false;
}

export interface CapabilityDeclarationField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface CapabilitySchemaSpec {
  schema_id: 'dsc-backend-capability-declaration-v1';
  description: string;
  capability_contract_ref: 'dsc-backend-capability-contract-v1';
  fields: CapabilityDeclarationField[];
  registered_capability_ids: string[];
  declaration_values: ['supported', 'unsupported'];
  unknown_capability_policy: 'reject_unregistered_capability_id';
  duplicate_capability_policy: 'reject_duplicate_capability_id';
  missing_capability_policy: 'treated_as_undeclared';
  additional_fields: false;
}

export interface CompatibilityMatrixRow {
  row_id: string;
  row_kind: 'capability' | 'structural';
  requirement: 'mandatory';
  required_value: string;
  source_ref: string;
  outcome_by_state: Record<DeclarationState, CompatibilityOutcome>;
  incompatibility_code: string;
}

export interface CompatibilityMatrix {
  matrix_id: 'dsc-backend-compatibility-matrix-v1';
  description: string;
  evaluated_by_method: 'check_compatibility';
  declaration_states: ['supported', 'unsupported', 'undeclared'];
  state_semantics: Record<DeclarationState, string>;
  outcome_values: ['compatible', 'incompatible'];
  rows: CompatibilityMatrixRow[];
  aggregation_rule: 'all_rows_must_resolve_compatible';
  evaluation: 'collect_all_incompatibility_codes';
  report_shape: {
    report_id: 'dsc-backend-compatibility-report-v1';
    required_fields: string[];
    outcome_values: ['compatible', 'incompatible'];
  };
  evaluates_backends_in_this_phase: false;
}

export interface CapabilityVersionEntry {
  capability_id: string;
  introduced_in_capability_set_version: string;
  current_version: string;
  status: 'active';
}

export interface CapabilityVersioning {
  versioning_id: 'dsc-backend-capability-versioning-v1';
  description: string;
  scheme: 'major_minor';
  capability_set_id: typeof CAPABILITY_SET_ID;
  current_capability_set_version: typeof CAPABILITY_SET_VERSION;
  supported_capability_set_versions: string[];
  capability_versions: CapabilityVersionEntry[];
  compatibility_policy: {
    major_change: string;
    minor_change: string;
    major_mismatch: 'incompatible';
    minor_mismatch: 'compatible_if_major_matches_and_all_mandatory_rows_supported';
  };
  rules: string[];
  deprecation_policy: {
    deprecated_capabilities: [];
    removal_requires: 'major_capability_set_version_increment';
    notice_window: 'one_minor_version';
  };
}

export interface DirectSpatialConditioningBackendCapabilityRegistry {
  capability_registry_id: string;
  phase: typeof DSC_BACKEND_CAPABILITY_REGISTRY_PHASE;
  system_id: typeof DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID;
  mode: 'design_only_registry';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_CAPABILITY_REGISTRY_V1';
  adapter_foundation_ref: string;
  adapter_foundation_phase: typeof DSC_BACKEND_ADAPTER_FOUNDATION_PHASE;
  adapter_foundation_system_id: typeof DSC_BACKEND_ADAPTER_FOUNDATION_SYSTEM_ID;
  runtime_interface_ref: string;
  runtime_package_ref: string;
  sources_supported: string[];
  required_channels: ConditioningChannelId[];
  backend_descriptor: BackendDescriptorSpec;
  capability_schema: CapabilitySchemaSpec;
  compatibility_matrix: CompatibilityMatrix;
  capability_versioning: CapabilityVersioning;
  registered_backends: {
    count: 0;
    entries: [];
    registration_policy: string;
    registers_backends_in_this_phase: false;
  };
  design_constraints: {
    registry_only: true;
    read_only: true;
    backend_agnostic: true;
    reuses_adapter_foundation: true;
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

const STRUCTURAL_OUTCOMES: Record<DeclarationState, CompatibilityOutcome> = {
  supported: 'compatible',
  unsupported: 'incompatible',
  undeclared: 'incompatible',
};

function incompatibilityCode(rowId: string): string {
  return `DSC_BACKEND_INCOMPATIBLE_${rowId.toUpperCase()}`;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Build the design-only, read-only DSC backend capability registry.
 * Every registered capability, channel, frame, and shape value is derived from
 * the frozen PHASE-039 adapter foundation so the registry cannot drift from the
 * capability contract it governs.
 */
export function buildDirectSpatialConditioningBackendCapabilityRegistry(
  projectRoot?: string
): { capabilityRegistry: DirectSpatialConditioningBackendCapabilityRegistry } {
  const root = resolveProjectRoot(projectRoot);

  const adapterFoundation = readJson<DirectSpatialConditioningBackendAdapterFoundation>(
    root,
    BACKEND_ADAPTER_FOUNDATION_PATH
  );
  if (
    adapterFoundation.phase !== DSC_BACKEND_ADAPTER_FOUNDATION_PHASE ||
    adapterFoundation.system_id !== DSC_BACKEND_ADAPTER_FOUNDATION_SYSTEM_ID
  ) {
    throw new Error('PHASE-039 adapter foundation is missing or incompatible');
  }
  if (!adapterFoundation.design_constraints.backend_agnostic) {
    throw new Error('Adapter foundation must remain backend agnostic');
  }
  if (adapterFoundation.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
    throw new Error('Adapter foundation must reuse the PHASE-036 runtime interface');
  }

  const contract = adapterFoundation.capability_contract;
  if (contract.contract_id !== 'dsc-backend-capability-contract-v1') {
    throw new Error('Capability contract identity drifted');
  }
  if (
    JSON.stringify(contract.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Capability contract channels do not match foundation channels');
  }
  if (contract.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Capability contract spatial frame drifted');
  }
  if (contract.required_sources !== SOURCE_IDS.length) {
    throw new Error('Capability contract source count drifted from the certified corpus');
  }

  const registered_capability_ids = contract.required_capabilities.map(
    (capability) => capability.capability_id
  );
  if (new Set(registered_capability_ids).size !== registered_capability_ids.length) {
    throw new Error('Capability contract contains duplicate capability ids');
  }

  const adapterInterfaceVersion = adapterFoundation.backend_interface.version;
  const adaptedInputShapeRef = contract.adapted_input_shape_ref;

  const backend_descriptor: BackendDescriptorSpec = {
    descriptor_id: 'dsc-backend-descriptor-v1',
    description:
      'Shape a backend must publish from the PHASE-039 describe_capabilities method in order to be evaluated against the capability contract. Identity is opaque; no vendor, framework, or device binding is expressed.',
    produced_by_method: 'describe_capabilities',
    adapter_interface_ref: 'dsc-backend-adapter-interface-v1',
    required_fields: [
      {
        field: 'backend_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor, framework, or device semantics',
      },
      {
        field: 'backend_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'non-empty backend-owned version string',
      },
      {
        field: 'adapter_interface_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal the PHASE-039 backend interface version ${adapterInterfaceVersion}`,
      },
      {
        field: 'capability_set_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must be one of the supported capability set versions of ${CAPABILITY_SET_ID}`,
      },
      {
        field: 'declared_capabilities',
        type: 'array<dsc-backend-capability-declaration-v1>',
        required: true,
        nullable: false,
        constraint:
          'one declaration per registered capability id; unregistered or duplicate ids are rejected',
      },
      {
        field: 'declared_channels',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'must equal the six required channels in the fixed foundation order',
      },
      {
        field: 'declared_spatial_frame',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
      {
        field: 'declared_adapted_input_shape',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${adaptedInputShapeRef}`,
      },
    ],
    optional_fields: [],
    identity_policy: 'opaque_backend_id_no_vendor_binding',
    additional_fields: false,
  };

  const capability_schema: CapabilitySchemaSpec = {
    schema_id: 'dsc-backend-capability-declaration-v1',
    description:
      'Shape of a single capability declaration inside a backend descriptor, bound to the registered capability ids of the PHASE-039 capability contract.',
    capability_contract_ref: 'dsc-backend-capability-contract-v1',
    fields: [
      {
        field: 'capability_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must be one of registered_capability_ids',
      },
      {
        field: 'declared',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must be one of declaration_values',
      },
      {
        field: 'capability_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'major_minor version of the capability as published by the capability set',
      },
    ],
    registered_capability_ids,
    declaration_values: ['supported', 'unsupported'],
    unknown_capability_policy: 'reject_unregistered_capability_id',
    duplicate_capability_policy: 'reject_duplicate_capability_id',
    missing_capability_policy: 'treated_as_undeclared',
    additional_fields: false,
  };

  // One mandatory row per registered capability, plus the structural rows that
  // pin frame, channel coverage, adapted input shape, and interface version.
  const capabilityRows: CompatibilityMatrixRow[] = contract.required_capabilities.map(
    (capability) => ({
      row_id: capability.capability_id,
      row_kind: 'capability',
      requirement: 'mandatory',
      required_value: 'supported',
      source_ref: `capability_contract.required_capabilities.${capability.capability_id}`,
      outcome_by_state: { ...STRUCTURAL_OUTCOMES },
      incompatibility_code: incompatibilityCode(capability.capability_id),
    })
  );

  const structuralRows: CompatibilityMatrixRow[] = [
    {
      row_id: 'structural_spatial_frame',
      row_kind: 'structural',
      requirement: 'mandatory',
      required_value: SPATIAL_FRAME.frame_id,
      source_ref: 'capability_contract.spatial_frame_ref',
      outcome_by_state: { ...STRUCTURAL_OUTCOMES },
      incompatibility_code: incompatibilityCode('structural_spatial_frame'),
    },
    {
      row_id: 'structural_channel_coverage',
      row_kind: 'structural',
      requirement: 'mandatory',
      required_value: [...CONDITIONING_CHANNEL_IDS].join(','),
      source_ref: 'capability_contract.required_channels',
      outcome_by_state: { ...STRUCTURAL_OUTCOMES },
      incompatibility_code: incompatibilityCode('structural_channel_coverage'),
    },
    {
      row_id: 'structural_adapted_input_shape',
      row_kind: 'structural',
      requirement: 'mandatory',
      required_value: adaptedInputShapeRef,
      source_ref: 'capability_contract.adapted_input_shape_ref',
      outcome_by_state: { ...STRUCTURAL_OUTCOMES },
      incompatibility_code: incompatibilityCode('structural_adapted_input_shape'),
    },
    {
      row_id: 'structural_adapter_interface_version',
      row_kind: 'structural',
      requirement: 'mandatory',
      required_value: adapterInterfaceVersion,
      source_ref: 'backend_interface.version',
      outcome_by_state: { ...STRUCTURAL_OUTCOMES },
      incompatibility_code: incompatibilityCode('structural_adapter_interface_version'),
    },
  ];

  const compatibility_matrix: CompatibilityMatrix = {
    matrix_id: 'dsc-backend-compatibility-matrix-v1',
    description:
      'Resolution table mapping each mandatory registry row against a backend declaration state to a compatibility outcome. Evaluated by the PHASE-039 check_compatibility method; no backend is evaluated in this phase.',
    evaluated_by_method: 'check_compatibility',
    declaration_states: ['supported', 'unsupported', 'undeclared'],
    state_semantics: {
      supported:
        'backend declared the row and the declaration equals the required value',
      unsupported:
        'backend declared the row but the declaration does not equal the required value',
      undeclared: 'backend descriptor omitted the row entirely',
    },
    outcome_values: ['compatible', 'incompatible'],
    rows: [...capabilityRows, ...structuralRows],
    aggregation_rule: 'all_rows_must_resolve_compatible',
    evaluation: 'collect_all_incompatibility_codes',
    report_shape: {
      report_id: 'dsc-backend-compatibility-report-v1',
      required_fields: [
        'backend_id',
        'capability_set_version',
        'evaluated_rows',
        'failed_rows',
        'incompatibility_codes',
        'outcome',
      ],
      outcome_values: ['compatible', 'incompatible'],
    },
    evaluates_backends_in_this_phase: false,
  };

  const capability_versioning: CapabilityVersioning = {
    versioning_id: 'dsc-backend-capability-versioning-v1',
    description:
      'Version policy governing how the registered capability set evolves and how a backend declared capability_set_version is resolved against it.',
    scheme: 'major_minor',
    capability_set_id: CAPABILITY_SET_ID,
    current_capability_set_version: CAPABILITY_SET_VERSION,
    supported_capability_set_versions: [CAPABILITY_SET_VERSION],
    capability_versions: registered_capability_ids.map((capability_id) => ({
      capability_id,
      introduced_in_capability_set_version: CAPABILITY_SET_VERSION,
      current_version: CAPABILITY_SET_VERSION,
      status: 'active' as const,
    })),
    compatibility_policy: {
      major_change:
        'breaking: removing a capability, tightening a required value, or changing a structural row requires a new major capability_set_version',
      minor_change:
        'additive only: introducing a new optional capability or clarifying a description stays backward compatible within the same major',
      major_mismatch: 'incompatible',
      minor_mismatch: 'compatible_if_major_matches_and_all_mandatory_rows_supported',
    },
    rules: [
      'every registered capability carries a version drawn from the capability set version line',
      'a backend declaring an unsupported capability_set_version major is incompatible regardless of its declarations',
      'a newer backend minor version is accepted while every mandatory row still resolves compatible',
      'capability ids are immutable once published; renaming requires a major increment',
      'the registry never silently upgrades a backend declaration to a newer capability version',
    ],
    deprecation_policy: {
      deprecated_capabilities: [],
      removal_requires: 'major_capability_set_version_increment',
      notice_window: 'one_minor_version',
    },
  };

  const capabilityRegistry: DirectSpatialConditioningBackendCapabilityRegistry = {
    capability_registry_id: 'direct-spatial-conditioning-backend-capability-registry-v1',
    phase: DSC_BACKEND_CAPABILITY_REGISTRY_PHASE,
    system_id: DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID,
    mode: 'design_only_registry',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_CAPABILITY_REGISTRY_V1',
    adapter_foundation_ref: BACKEND_ADAPTER_FOUNDATION_PATH,
    adapter_foundation_phase: DSC_BACKEND_ADAPTER_FOUNDATION_PHASE,
    adapter_foundation_system_id: DSC_BACKEND_ADAPTER_FOUNDATION_SYSTEM_ID,
    runtime_interface_ref: RUNTIME_INTERFACE_PATH,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    backend_descriptor,
    capability_schema,
    compatibility_matrix,
    capability_versioning,
    registered_backends: {
      count: 0,
      entries: [],
      registration_policy:
        'descriptor registration is performed by future phases; this phase defines the registry surface only and binds to no backend',
      registers_backends_in_this_phase: false,
    },
    design_constraints: {
      registry_only: true,
      read_only: true,
      backend_agnostic: true,
      reuses_adapter_foundation: true,
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

  writeJson(root, BACKEND_CAPABILITY_REGISTRY_PATH, capabilityRegistry);
  return { capabilityRegistry };
}
