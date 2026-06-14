export const RUNTIME_CONTRACT_BOUNDARY = 'STAGE-8→STAGE-9' as const;
export const FINGERPRINT_SCHEMA_VERSION = 'RUNTIME-CONTRACT-FINGERPRINT-v1';

export const STAGE_EIGHT_ID = 'STAGE-8' as const;
export const STAGE_NINE_ID = 'STAGE-9' as const;

export interface RuntimeStageContract {
  stage_id: string;
  contract_id: string;
  depends_on: string | null;
  planned_inputs: readonly string[];
  planned_outputs: readonly string[];
}

export interface ConsumerContract {
  stage_id: typeof STAGE_EIGHT_ID;
  contract_id: 'consumer_integration';
  depends_on: 'STAGE-7';
  next_stage_hint: typeof STAGE_NINE_ID;
  planned_inputs: readonly string[];
  planned_outputs: readonly string[];
}

export interface RuntimeContractFingerprint {
  schemaVersion: typeof FINGERPRINT_SCHEMA_VERSION;
  boundary: typeof RUNTIME_CONTRACT_BOUNDARY;
  stageIds: string[];
  contractIds: string[];
  dependencyGraph: Record<string, string | null>;
  plannedInputs: Record<string, string[]>;
  plannedOutputs: Record<string, string[]>;
  consumerContract: ConsumerContract;
  frozenAt: string;
}

const STAGE_CONTRACTS: RuntimeStageContract[] = [
  {
    stage_id: STAGE_EIGHT_ID,
    contract_id: 'consumer_integration',
    depends_on: 'STAGE-7',
    planned_inputs: ['image_dataset_export', 'video_dataset_export'],
    planned_outputs: ['image_app_v17_handoff', 'video_app_v82_6_handoff'],
  },
  {
    stage_id: STAGE_NINE_ID,
    contract_id: 'gpu_integration',
    depends_on: STAGE_EIGHT_ID,
    planned_inputs: ['video_dataset_export', 'gpu_render_plan'],
    planned_outputs: ['gpu_pipeline_handoff', 'future_gpu_pipeline_ref'],
  },
];

const CONSUMER_CONTRACT: ConsumerContract = {
  stage_id: STAGE_EIGHT_ID,
  contract_id: 'consumer_integration',
  depends_on: 'STAGE-7',
  next_stage_hint: STAGE_NINE_ID,
  planned_inputs: [
    'consumer_input_plan_stub',
    'image_app_v17_reference_stub',
    'video_app_v82_6_reference_stub',
    'export_boundary_reference_stub',
  ],
  planned_outputs: [
    'image_app_handoff_plan_stub',
    'video_app_handoff_plan_stub',
    'consumer_boundary_report_stub',
    'consumer_integration_bundle_stub',
  ],
};

export function getRuntimeStageContracts(): RuntimeStageContract[] {
  return STAGE_CONTRACTS.map((contract) => ({
    ...contract,
    planned_inputs: [...contract.planned_inputs],
    planned_outputs: [...contract.planned_outputs],
  }));
}

export function getConsumerContract(): ConsumerContract {
  return {
    ...CONSUMER_CONTRACT,
    planned_inputs: [...CONSUMER_CONTRACT.planned_inputs],
    planned_outputs: [...CONSUMER_CONTRACT.planned_outputs],
  };
}

export function buildRuntimeContractFingerprint(frozenAt: string): RuntimeContractFingerprint {
  const contracts = getRuntimeStageContracts();
  const consumerContract = getConsumerContract();

  const dependencyGraph: Record<string, string | null> = {};
  const plannedInputs: Record<string, string[]> = {};
  const plannedOutputs: Record<string, string[]> = {};

  for (const contract of contracts) {
    dependencyGraph[contract.stage_id] = contract.depends_on;
    plannedInputs[contract.stage_id] = [...contract.planned_inputs];
    plannedOutputs[contract.stage_id] = [...contract.planned_outputs];
  }

  return {
    schemaVersion: FINGERPRINT_SCHEMA_VERSION,
    boundary: RUNTIME_CONTRACT_BOUNDARY,
    stageIds: contracts.map((contract) => contract.stage_id),
    contractIds: contracts.map((contract) => contract.contract_id),
    dependencyGraph,
    plannedInputs,
    plannedOutputs,
    consumerContract,
    frozenAt,
  };
}
