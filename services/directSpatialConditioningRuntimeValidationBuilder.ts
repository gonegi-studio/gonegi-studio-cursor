import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  DSC_PACKET_GENERATION_PHASE,
  DSC_PACKET_GENERATION_SYSTEM_ID,
  GENERATION_PATH,
  type DirectSpatialConditioningPacketGeneration,
} from './directSpatialConditioningPacketGenerationBuilder.js';
import {
  DSC_RUNTIME_INTERFACE_PHASE,
  DSC_RUNTIME_INTERFACE_SYSTEM_ID,
  RUNTIME_INTERFACE_PATH,
  type DirectSpatialConditioningRuntimeInterface,
  type RuntimeApiMethodId,
} from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-037: Direct Spatial Conditioning runtime interface validation.
 *
 * DESIGN ONLY / VALIDATION ONLY. Specifies how the PHASE-036 runtime interface
 * must be validated: runtime API completeness, packet flow continuity,
 * interface contract integrity, and mandatory reuse of PHASE-035 packet
 * generation. Executes no runtime methods, performs no backend/GPU/inference
 * work, and modifies no dataset.
 */

export const DSC_RUNTIME_VALIDATION_PHASE = 'PHASE-DSC-037' as const;
export const DSC_RUNTIME_VALIDATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_RUNTIME_VALIDATION_V1' as const;

export const RUNTIME_VALIDATION_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const RUNTIME_VALIDATION_PATH =
  `${RUNTIME_VALIDATION_ROOT}/direct-spatial-conditioning-runtime-validation-v1.json` as const;

export type RuntimeValidationStage =
  | 'runtime_api'
  | 'packet_flow'
  | 'interface_contract'
  | 'generation_reuse';

export interface RuntimeValidationCheck {
  check_id: string;
  stage: RuntimeValidationStage;
  applies_to: string;
  description: string;
  predicate: string;
  severity: 'error';
}

export interface DirectSpatialConditioningRuntimeValidation {
  validation_specification_id: string;
  phase: typeof DSC_RUNTIME_VALIDATION_PHASE;
  system_id: typeof DSC_RUNTIME_VALIDATION_SYSTEM_ID;
  mode: 'design_only_validation';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_RUNTIME_VALIDATION_V1';
  runtime_interface_ref: string;
  runtime_interface_phase: typeof DSC_RUNTIME_INTERFACE_PHASE;
  runtime_interface_system_id: typeof DSC_RUNTIME_INTERFACE_SYSTEM_ID;
  generation_ref: string;
  generation_phase: typeof DSC_PACKET_GENERATION_PHASE;
  generation_system_id: typeof DSC_PACKET_GENERATION_SYSTEM_ID;
  validation_procedure: {
    ordered_stages: RuntimeValidationStage[];
    evaluation: 'collect_all_failures';
    accept_condition: 'zero failed checks across all stages';
    outcome_values: ['accepted', 'rejected'];
  };
  runtime_api_checks: RuntimeValidationCheck[];
  packet_flow_checks: RuntimeValidationCheck[];
  interface_contract_checks: RuntimeValidationCheck[];
  generation_reuse_checks: RuntimeValidationCheck[];
  expected_api_methods: RuntimeApiMethodId[];
  expected_packet_flow: string[];
  design_constraints: {
    validation_only: true;
    reuses_runtime_interface: true;
    reuses_packet_generation: true;
    backend: 'none';
    gpu: false;
    inference: false;
    executes_runtime_methods_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const EXPECTED_API_METHODS: RuntimeApiMethodId[] = [
  'list_sources',
  'generate_packet',
  'validate_packet',
  'produce_validated_packet',
];

const EXPECTED_PACKET_FLOW = [
  'packet_input -> generate_packet -> assembled_packet_candidate',
  'assembled_packet_candidate -> validate_packet -> validation_result',
  'packet_input -> produce_validated_packet -> validated_conditioning_packet',
  'validated_conditioning_packet.outcome in [accepted, rejected]',
];

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function check(
  check_id: string,
  stage: RuntimeValidationStage,
  applies_to: string,
  description: string,
  predicate: string
): RuntimeValidationCheck {
  return { check_id, stage, applies_to, description, predicate, severity: 'error' };
}

function buildRuntimeApiChecks(
  runtimeInterface: DirectSpatialConditioningRuntimeInterface
): RuntimeValidationCheck[] {
  const checks: RuntimeValidationCheck[] = [
    check(
      'API_IDENTITY',
      'runtime_api',
      'runtime_api',
      'Runtime API must be dsc-runtime-api-v1 / v1 / in_process_function_surface.',
      'api_id === "dsc-runtime-api-v1" AND version === "v1" AND transport === "in_process_function_surface"'
    ),
    check(
      'API_METHOD_COUNT',
      'runtime_api',
      'runtime_api.methods',
      'Runtime API must expose exactly four mandatory methods.',
      'methods.length === 4'
    ),
    check(
      'API_METHOD_SET',
      'runtime_api',
      'runtime_api.methods',
      'Runtime API method set must equal the mandatory method set.',
      'methods[].method_id === [list_sources, generate_packet, validate_packet, produce_validated_packet]'
    ),
  ];

  for (const method of runtimeInterface.runtime_api.methods) {
    const id = method.method_id.toUpperCase();
    checks.push(
      check(
        `API_SIDE_EFFECTS_${id}`,
        'runtime_api',
        `runtime_api.methods.${method.method_id}`,
        `${method.method_id} must declare side_effects=none.`,
        'side_effects === "none"'
      ),
      check(
        `API_NO_BACKEND_${id}`,
        'runtime_api',
        `runtime_api.methods.${method.method_id}`,
        `${method.method_id} must not require a backend.`,
        'requires_backend === false'
      ),
      check(
        `API_NO_GPU_${id}`,
        'runtime_api',
        `runtime_api.methods.${method.method_id}`,
        `${method.method_id} must not require a GPU.`,
        'requires_gpu === false'
      ),
      check(
        `API_NO_INFERENCE_${id}`,
        'runtime_api',
        `runtime_api.methods.${method.method_id}`,
        `${method.method_id} must not perform inference.`,
        'performs_inference === false'
      ),
      check(
        `API_SIGNATURE_${id}`,
        'runtime_api',
        `runtime_api.methods.${method.method_id}`,
        `${method.method_id} must declare a non-empty signature and description.`,
        'signature.length > 0 AND description.length > 0'
      )
    );
  }

  return checks;
}

function buildPacketFlowChecks(
  runtimeInterface: DirectSpatialConditioningRuntimeInterface,
  generation: DirectSpatialConditioningPacketGeneration
): RuntimeValidationCheck[] {
  return [
    check(
      'FLOW_INPUT_SURFACE',
      'packet_flow',
      'packet_input',
      'Packet input surface must be dsc_runtime_packet_input_v1.',
      'packet_input.surface_id === "dsc_runtime_packet_input_v1"'
    ),
    check(
      'FLOW_INPUT_FIELDS',
      'packet_flow',
      'packet_input.required_fields',
      'Packet input must require exactly source_video_id and packet_id.',
      'required_fields[].field === [source_video_id, packet_id]'
    ),
    check(
      'FLOW_INPUT_NO_OPTIONAL',
      'packet_flow',
      'packet_input.optional_fields',
      'Packet input must declare no optional fields.',
      'optional_fields.length === 0'
    ),
    check(
      'FLOW_INPUT_CHANNEL_ORDER',
      'packet_flow',
      'packet_input.accepted_packet_shape.channel_order',
      'Accepted packet channel order must match the six foundation channels.',
      `channel_order === ${JSON.stringify(CONDITIONING_CHANNEL_IDS)}`
    ),
    check(
      'FLOW_INPUT_SPATIAL_FRAME',
      'packet_flow',
      'packet_input.accepted_packet_shape.spatial_frame_ref',
      'Accepted packet spatial frame must equal the locked foundation frame.',
      `spatial_frame_ref === "${SPATIAL_FRAME.frame_id}"`
    ),
    check(
      'FLOW_GENERATE_TO_CANDIDATE',
      'packet_flow',
      'runtime_api.methods.generate_packet',
      'generate_packet must accept packet input and produce assembled_packet_candidate.',
      'input_ref === "dsc_runtime_packet_input_v1" AND output_ref === "assembled_packet_candidate"'
    ),
    check(
      'FLOW_VALIDATE_TO_RESULT',
      'packet_flow',
      'runtime_api.methods.validate_packet',
      'validate_packet must accept assembled_packet_candidate and produce validation_result.',
      'input_ref === "assembled_packet_candidate" AND output_ref === "validation_result"'
    ),
    check(
      'FLOW_PRODUCE_TO_VALIDATED',
      'packet_flow',
      'runtime_api.methods.produce_validated_packet',
      'produce_validated_packet must accept packet input and produce validated output surface.',
      'input_ref === "dsc_runtime_packet_input_v1" AND output_ref === "dsc_runtime_validated_output_v1"'
    ),
    check(
      'FLOW_OUTPUT_SURFACE',
      'packet_flow',
      'validated_output',
      'Validated output surface must be dsc_runtime_validated_output_v1.',
      'validated_output.surface_id === "dsc_runtime_validated_output_v1"'
    ),
    check(
      'FLOW_OUTPUT_KIND',
      'packet_flow',
      'validated_output.artifact_kind',
      'Validated output artifact kind must equal generation validated_packet_output.artifact_kind.',
      `artifact_kind === "${generation.validated_packet_output.artifact_kind}"`
    ),
    check(
      'FLOW_OUTPUT_OUTCOMES',
      'packet_flow',
      'validated_output.outcome_values',
      'Validated output outcomes must be accepted and rejected.',
      'outcome_values === ["accepted", "rejected"]'
    ),
    check(
      'FLOW_OUTPUT_EMBEDDING',
      'packet_flow',
      'validated_output',
      'Validated output must embed accepted packets and rejection codes without materialization.',
      'accepted_packet_embedded === true AND rejection_codes_embedded === true AND materializes_tensors === false AND materializes_frames === false'
    ),
    check(
      'FLOW_INPUT_GENERATION_STEP',
      'packet_flow',
      'packet_input.generation_input_alignment',
      'Packet input must align to generation step bind_generation_inputs.',
      'maps_to_generation_step === "bind_generation_inputs"'
    ),
    check(
      'FLOW_OUTPUT_GENERATION_STEP',
      'packet_flow',
      'validated_output.generation_output_alignment',
      'Validated output must align to generation step produce_validated_packet.',
      'maps_to_generation_step === "produce_validated_packet"'
    ),
    check(
      'FLOW_METHOD_STEP_GENERATE',
      'packet_flow',
      'runtime_api.methods.generate_packet.generation_step_ref',
      'generate_packet must reuse generation step execute_assembly_order.',
      'generation_step_ref === "execute_assembly_order"'
    ),
    check(
      'FLOW_METHOD_STEP_VALIDATE',
      'packet_flow',
      'runtime_api.methods.validate_packet.generation_step_ref',
      'validate_packet must reuse generation step apply_packet_validation.',
      'generation_step_ref === "apply_packet_validation"'
    ),
    check(
      'FLOW_METHOD_STEP_PRODUCE',
      'packet_flow',
      'runtime_api.methods.produce_validated_packet.generation_step_ref',
      'produce_validated_packet must reuse generation step produce_validated_packet.',
      'generation_step_ref === "produce_validated_packet"'
    ),
    check(
      'FLOW_SOURCES_COUNT',
      'packet_flow',
      'sources_supported',
      'Runtime interface must support the certified 15-source corpus.',
      `sources_supported.length === ${SOURCE_IDS.length}`
    ),
  ];
}

function buildInterfaceContractChecks(
  runtimeInterface: DirectSpatialConditioningRuntimeInterface
): RuntimeValidationCheck[] {
  return [
    check(
      'CONTRACT_ID',
      'interface_contract',
      'interface_contract.contract_id',
      'Interface contract id must be dsc-runtime-interface-contract-v1.',
      'contract_id === "dsc-runtime-interface-contract-v1"'
    ),
    check(
      'CONTRACT_MANDATORY_METHODS',
      'interface_contract',
      'interface_contract.mandatory_methods',
      'Interface contract must lock all four mandatory API methods.',
      'mandatory_methods === [list_sources, generate_packet, validate_packet, produce_validated_packet]'
    ),
    check(
      'CONTRACT_PACKET_INPUT_REF',
      'interface_contract',
      'interface_contract.packet_input_surface_ref',
      'Interface contract must reference the packet input surface.',
      `packet_input_surface_ref === "${runtimeInterface.packet_input.surface_id}"`
    ),
    check(
      'CONTRACT_VALIDATED_OUTPUT_REF',
      'interface_contract',
      'interface_contract.validated_output_surface_ref',
      'Interface contract must reference the validated output surface.',
      `validated_output_surface_ref === "${runtimeInterface.validated_output.surface_id}"`
    ),
    check(
      'CONTRACT_GENERATION_REF',
      'interface_contract',
      'interface_contract.generation_ref',
      'Interface contract must reference the PHASE-035 generation specification.',
      `generation_ref === "${GENERATION_PATH}"`
    ),
    check(
      'CONTRACT_RUNTIME_PACKAGE_REF',
      'interface_contract',
      'interface_contract.runtime_package_ref',
      'Interface contract must reference the certified PHASE-027 runtime package.',
      `runtime_package_ref === "${RUNTIME_PACKAGE_PATH}"`
    ),
    check(
      'CONTRACT_GUARANTEES',
      'interface_contract',
      'interface_contract.guarantees',
      'Interface contract must declare at least five guarantees.',
      'guarantees.length >= 5'
    ),
    check(
      'CONTRACT_FORBIDDEN',
      'interface_contract',
      'interface_contract.forbidden',
      'Interface contract must forbid backend, GPU, inference, materialization, dataset modification, and placeholders.',
      'forbidden covers backend, gpu, inference, tensor/frame materialization, dataset modification, placeholders'
    ),
  ];
}

function buildGenerationReuseChecks(
  runtimeInterface: DirectSpatialConditioningRuntimeInterface,
  generation: DirectSpatialConditioningPacketGeneration
): RuntimeValidationCheck[] {
  return [
    check(
      'REUSE_GENERATION_REF',
      'generation_reuse',
      'generation_ref',
      'Runtime interface must reuse the PHASE-035 generation specification by exact path.',
      `generation_ref === "${GENERATION_PATH}"`
    ),
    check(
      'REUSE_GENERATION_PHASE',
      'generation_reuse',
      'generation_phase',
      'Runtime interface generation_phase must equal PHASE-DSC-035.',
      `generation_phase === "${DSC_PACKET_GENERATION_PHASE}"`
    ),
    check(
      'REUSE_GENERATION_SYSTEM',
      'generation_reuse',
      'generation_system_id',
      'Runtime interface generation_system_id must equal DIRECT_SPATIAL_CONDITIONING_PACKET_GENERATION_V1.',
      `generation_system_id === "${DSC_PACKET_GENERATION_SYSTEM_ID}"`
    ),
    check(
      'REUSE_GENERATION_POLICY',
      'generation_reuse',
      'generation.generation_procedure.generation_policy',
      'Reused generation policy must remain assemble_then_validate.',
      'generation_policy === "assemble_then_validate"'
    ),
    check(
      'REUSE_OUTPUT_FIELDS',
      'generation_reuse',
      'validated_output.required_fields',
      'Validated output required fields must exactly match generation validated_packet_output.required_fields.',
      'validated_output.required_fields === generation.validated_packet_output.required_fields'
    ),
    check(
      'REUSE_OUTPUT_KIND',
      'generation_reuse',
      'validated_output.artifact_kind',
      'Validated output artifact kind must exactly match generation validated_packet_output.artifact_kind.',
      `artifact_kind === "${generation.validated_packet_output.artifact_kind}"`
    ),
    check(
      'REUSE_PACKET_SHAPE',
      'generation_reuse',
      'packet_input.accepted_packet_shape',
      'Accepted packet shape must match generation generated_packet_instance type/version/sections.',
      'packet_type/version/required_sections equal generation.generated_packet_instance'
    ),
    check(
      'REUSE_RUNTIME_PACKAGE',
      'generation_reuse',
      'runtime_package_ref',
      'Runtime interface and generation must share the certified runtime package reference.',
      `runtime_package_ref === generation.runtime_package_ref === "${RUNTIME_PACKAGE_PATH}"`
    ),
    check(
      'REUSE_SOURCES',
      'generation_reuse',
      'sources_supported',
      'Runtime interface sources_supported must equal generation sources_supported.',
      'runtimeInterface.sources_supported === generation.sources_supported'
    ),
    check(
      'REUSE_CONSTRAINT_FLAG',
      'generation_reuse',
      'design_constraints.reuses_packet_generation',
      'Runtime interface must declare reuses_packet_generation=true.',
      `reuses_packet_generation === ${runtimeInterface.design_constraints.reuses_packet_generation}`
    ),
  ];
}

/**
 * Build the design-only runtime interface validation specification.
 * Derives checks from the frozen PHASE-036 interface and PHASE-035 generation.
 */
export function buildDirectSpatialConditioningRuntimeValidation(projectRoot?: string): {
  validation: DirectSpatialConditioningRuntimeValidation;
} {
  const root = resolveProjectRoot(projectRoot);

  const runtimeInterface = readJson<DirectSpatialConditioningRuntimeInterface>(
    root,
    RUNTIME_INTERFACE_PATH
  );
  if (
    runtimeInterface.phase !== DSC_RUNTIME_INTERFACE_PHASE ||
    runtimeInterface.system_id !== DSC_RUNTIME_INTERFACE_SYSTEM_ID
  ) {
    throw new Error('PHASE-036 runtime interface is missing or incompatible');
  }

  const generation = readJson<DirectSpatialConditioningPacketGeneration>(
    root,
    GENERATION_PATH
  );
  if (
    generation.phase !== DSC_PACKET_GENERATION_PHASE ||
    generation.system_id !== DSC_PACKET_GENERATION_SYSTEM_ID
  ) {
    throw new Error('PHASE-035 packet generation is missing or incompatible');
  }

  if (runtimeInterface.generation_ref !== GENERATION_PATH) {
    throw new Error('Runtime interface must reuse PHASE-035 generation by path');
  }

  const validation: DirectSpatialConditioningRuntimeValidation = {
    validation_specification_id: 'direct-spatial-conditioning-runtime-validation-v1',
    phase: DSC_RUNTIME_VALIDATION_PHASE,
    system_id: DSC_RUNTIME_VALIDATION_SYSTEM_ID,
    mode: 'design_only_validation',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_RUNTIME_VALIDATION_V1',
    runtime_interface_ref: RUNTIME_INTERFACE_PATH,
    runtime_interface_phase: DSC_RUNTIME_INTERFACE_PHASE,
    runtime_interface_system_id: DSC_RUNTIME_INTERFACE_SYSTEM_ID,
    generation_ref: GENERATION_PATH,
    generation_phase: DSC_PACKET_GENERATION_PHASE,
    generation_system_id: DSC_PACKET_GENERATION_SYSTEM_ID,
    validation_procedure: {
      ordered_stages: [
        'runtime_api',
        'packet_flow',
        'interface_contract',
        'generation_reuse',
      ],
      evaluation: 'collect_all_failures',
      accept_condition: 'zero failed checks across all stages',
      outcome_values: ['accepted', 'rejected'],
    },
    runtime_api_checks: buildRuntimeApiChecks(runtimeInterface),
    packet_flow_checks: buildPacketFlowChecks(runtimeInterface, generation),
    interface_contract_checks: buildInterfaceContractChecks(runtimeInterface),
    generation_reuse_checks: buildGenerationReuseChecks(runtimeInterface, generation),
    expected_api_methods: EXPECTED_API_METHODS,
    expected_packet_flow: EXPECTED_PACKET_FLOW,
    design_constraints: {
      validation_only: true,
      reuses_runtime_interface: true,
      reuses_packet_generation: true,
      backend: 'none',
      gpu: false,
      inference: false,
      executes_runtime_methods_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, RUNTIME_VALIDATION_PATH, validation);
  return { validation };
}
