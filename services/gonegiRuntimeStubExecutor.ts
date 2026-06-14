import fs from 'node:fs';
import path from 'node:path';
import {
  GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH,
  type GonegiRuntimeInterface,
  loadGonegiRuntimeInterface,
  PROVIDER_WIRING_REGISTRY_PATH,
} from './gonegiGpuPayloadToRuntimeInterfaceCompiler.js';
import {
  GONEGI_GPU_PAYLOADS_DIR,
  type GonegiGpuPayload,
  loadGonegiGpuPayload,
} from './gonegiMotionToGpuPayloadCompiler.js';
import { loadGonegiKeyframePlan } from './gonegiVideoStateToKeyframeCompiler.js';
import { PROVIDER_REGISTRY_PATH } from './videoRuntimeProviderRegistry.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const STUB_EXECUTION_PHASE =
  'PHASE-SOURCE-VIDEO-019-GONEGI_RUNTIME_STUB_EXECUTION_V2' as const;
export const GONEGI_RUNTIME_JOB_SCHEMA_PATH =
  'datasets/gonegi_runtime_job/gonegi-runtime-job.schema.json' as const;
export const GONEGI_RUNTIME_JOB_REGISTRY_PATH =
  'datasets/gonegi_runtime_job/gonegi-runtime-job-registry.json' as const;
export const GONEGI_RUNTIME_JOBS_DIR = 'datasets/gonegi_runtime_job/jobs' as const;

export const RUNTIME_JOB_STATES = Object.freeze([
  'QUEUED',
  'VALIDATING',
  'READY',
  'SIMULATED_RUNNING',
  'SIMULATED_COMPLETE',
  'SIMULATED_FAILED',
] as const);

export type RuntimeJobState = (typeof RUNTIME_JOB_STATES)[number];

export const SEED_GONEGI_RUNTIME_JOB_SPECS = Object.freeze([
  {
    gonegi_runtime_job_id: 'gonegi_runtime_job_ghibli_kitchen_v1',
    runtime_interface_id: 'gonegi_runtime_ghibli_kitchen_v1',
    source_gpu_payload_id: 'gonegi_gpu_payload_ghibli_kitchen_v1',
  },
  {
    gonegi_runtime_job_id: 'gonegi_runtime_job_shinkai_sky_light_v1',
    runtime_interface_id: 'gonegi_runtime_shinkai_sky_light_v1',
    source_gpu_payload_id: 'gonegi_gpu_payload_shinkai_sky_light_v1',
  },
  {
    gonegi_runtime_job_id: 'gonegi_runtime_job_live_action_dialogue_v1',
    runtime_interface_id: 'gonegi_runtime_live_action_dialogue_v1',
    source_gpu_payload_id: 'gonegi_gpu_payload_live_action_dialogue_v1',
  },
  {
    gonegi_runtime_job_id: 'gonegi_runtime_job_mori_emotion_flow_v1',
    runtime_interface_id: 'gonegi_runtime_mori_emotion_flow_v1',
    source_gpu_payload_id: 'gonegi_gpu_payload_mori_emotion_flow_v1',
  },
] as const);

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  provider_activation: false as const,
  simulation_only: true as const,
  frame_extraction: false as const,
  ocr: false as const,
  generation: false as const,
};

export type ValidationStep = {
  step: string;
  job_state: RuntimeJobState;
  passed: boolean;
  notes?: string;
};

export type GonegiRuntimeJob = {
  gonegi_runtime_job_id: string;
  phase: typeof STUB_EXECUTION_PHASE;
  runtime_interface_id: string;
  source_gpu_payload_id: string;
  provider_id: string;
  job_state: RuntimeJobState;
  validation_steps: ValidationStep[];
  identity_lock_result: 'PASS' | 'FAIL';
  continuity_lock_result: 'PASS' | 'FAIL';
  payload_alignment_result: 'PASS' | 'FAIL';
  provider_safety_result: 'PASS' | 'FAIL';
  simulated_output: {
    output_path: string;
    format: 'mp4_placeholder';
    generated: false;
    duration_seconds: number;
    fps_target: number;
    simulation_notes: string;
  };
  execution_flags: typeof EXECUTION_FLAGS;
  production_status: {
    isolated: true;
    storage_domain: 'gonegi_runtime_job';
    production_registry: false;
    draft_status: 'gonegi_runtime_job_simulated_v1';
  };
  executed_at: string;
};

type ProviderEntry = {
  provider_id: string;
  status?: string;
  execution_flags?: {
    gpu_execution?: boolean;
    external_call_allowed?: boolean;
    preparation_only?: boolean;
  };
  wiring?: { executable: null; endpoint: null };
};

function validatePayloadAlignment(
  iface: GonegiRuntimeInterface,
  payload: GonegiGpuPayload
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  if (iface.source_gpu_payload_id !== payload.gonegi_gpu_payload_id) {
    issues.push('runtime interface source_gpu_payload_id mismatch');
  }
  const expectedPath = `${GONEGI_GPU_PAYLOADS_DIR}/${payload.gonegi_gpu_payload_id}.json`;
  if (iface.input_contract.artifact_path !== expectedPath) {
    issues.push('input_contract artifact_path must match source GPU payload path');
  }
  if (iface.handshake_contract.identity_lock_count !== payload.identity_locks.length) {
    issues.push('handshake identity_lock_count mismatch');
  }
  if (payload.keyframes.length !== payload.motion_segments.length + 1) {
    issues.push('keyframes must equal motion_segments + 1');
  }

  return { passed: issues.length === 0, issues };
}

function validateIdentityLocks(
  projectRoot: string,
  iface: GonegiRuntimeInterface,
  payload: GonegiGpuPayload
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  const keyframePlan = loadGonegiKeyframePlan(projectRoot, payload.source_keyframe_plan_id);

  if (!keyframePlan) {
    issues.push('gonegi keyframe plan missing for identity lock validation');
    return { passed: false, issues };
  }

  const baseline = keyframePlan.keyframes[0]?.continuity_locks.identity_locks ?? [];
  const contractLocks = iface.identity_lock_contract.identity_locks;

  if (payload.identity_locks.length === 0) {
    issues.push('identity_locks must not be empty');
  }
  for (const lock of contractLocks) {
    if (!payload.identity_locks.includes(lock)) {
      issues.push(`contract identity lock missing from payload: ${lock}`);
      break;
    }
  }
  for (const lock of baseline) {
    if (!payload.identity_locks.includes(lock)) {
      issues.push(`keyframe baseline identity lock missing from payload: ${lock}`);
      break;
    }
  }

  return { passed: issues.length === 0, issues };
}

function validateContinuityLocks(
  projectRoot: string,
  iface: GonegiRuntimeInterface,
  payload: GonegiGpuPayload
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  const keyframePlan = loadGonegiKeyframePlan(projectRoot, payload.source_keyframe_plan_id);

  if (!keyframePlan) {
    issues.push('gonegi keyframe plan missing for continuity lock validation');
    return { passed: false, issues };
  }

  const baseline = keyframePlan.keyframes[0]?.continuity_locks;
  const contract = iface.continuity_lock_contract;

  for (const lock of contract.identity_locks) {
    if (!payload.continuity_locks.identity_locks.includes(lock)) {
      issues.push(`contract identity continuity lock missing from payload`);
      break;
    }
  }
  for (const lock of contract.location_locks) {
    if (!payload.continuity_locks.location_locks.includes(lock)) {
      issues.push(`contract location lock missing from payload`);
      break;
    }
  }
  for (const lock of contract.composition_locks ?? []) {
    if (!(payload.continuity_locks.composition_locks ?? []).includes(lock)) {
      issues.push(`contract composition lock missing from payload`);
      break;
    }
  }

  if (baseline) {
    for (const lock of baseline.location_locks) {
      if (!payload.continuity_locks.location_locks.includes(lock)) {
        issues.push('payload location_locks must preserve keyframe baseline');
        break;
      }
    }
  }

  return { passed: issues.length === 0, issues };
}

function validateProviderSafety(
  projectRoot: string,
  iface: GonegiRuntimeInterface
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  const providerId = iface.provider_hint.mapped_provider_id;

  if (iface.provider_hint.provider_activation !== false) {
    issues.push('provider_hint.provider_activation must be false');
  }
  if (iface.execution_flags.provider_activation !== false) {
    issues.push('runtime interface execution_flags.provider_activation must be false');
  }

  const registryPath = path.join(projectRoot, PROVIDER_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push('provider registry missing');
    return { passed: false, issues };
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
    providers?: ProviderEntry[];
  };
  const provider = registry.providers?.find((p) => p.provider_id === providerId);
  if (!provider) {
    issues.push(`provider ${providerId} not found in registry`);
  } else {
    if (provider.status !== 'not_wired') {
      issues.push(`provider ${providerId} must remain not_wired`);
    }
    if (provider.execution_flags?.gpu_execution !== false) {
      issues.push('provider gpu_execution must be false');
    }
    if (provider.execution_flags?.external_call_allowed !== false) {
      issues.push('provider external_call_allowed must be false');
    }
    if (provider.wiring?.executable !== null || provider.wiring?.endpoint !== null) {
      issues.push('provider wiring must remain unwired');
    }
  }

  const wiringPath = path.join(projectRoot, PROVIDER_WIRING_REGISTRY_PATH);
  if (fs.existsSync(wiringPath)) {
    const wiringRegistry = JSON.parse(fs.readFileSync(wiringPath, 'utf8')) as {
      wiring_designs?: Array<{ wiring_id: string; provider_id: string; status?: string }>;
    };
    const wiring = wiringRegistry.wiring_designs?.find(
      (w) => w.wiring_id === iface.provider_hint.wiring_id
    );
    if (!wiring) {
      issues.push(`wiring ${iface.provider_hint.wiring_id} not found`);
    } else if (wiring.provider_id !== providerId) {
      issues.push('wiring provider_id mismatch');
    }
  }

  return { passed: issues.length === 0, issues };
}

function validateRuntimeInterface(iface: GonegiRuntimeInterface): { passed: boolean; issues: string[] } {
  const issues: string[] = [];

  if (iface.readiness_status !== 'design_only_not_wired') {
    issues.push('runtime interface must be design_only_not_wired');
  }
  if (iface.execution_flags.gpu_execution !== false) {
    issues.push('runtime interface gpu_execution must be false');
  }
  if (iface.execution_flags.external_call_allowed !== false) {
    issues.push('runtime interface external_call_allowed must be false');
  }
  if (iface.input_contract.submission_allowed !== false) {
    issues.push('input_contract.submission_allowed must be false');
  }
  if (iface.output_contract.generation_allowed !== false) {
    issues.push('output_contract.generation_allowed must be false');
  }

  return { passed: issues.length === 0, issues };
}

export function executeGonegiStubJob(
  projectRoot: string,
  iface: GonegiRuntimeInterface,
  payload: GonegiGpuPayload,
  jobId: string
): GonegiRuntimeJob {
  const steps: ValidationStep[] = [];

  steps.push({
    step: 'job_queued',
    job_state: 'QUEUED',
    passed: true,
    notes: `Stub job ${jobId} enqueued for ${iface.gonegi_runtime_interface_id}`,
  });

  steps.push({ step: 'runtime_interface_validation', job_state: 'VALIDATING', passed: true });
  const ifaceResult = validateRuntimeInterface(iface);
  steps[steps.length - 1].passed = ifaceResult.passed;
  if (!ifaceResult.passed) steps[steps.length - 1].notes = ifaceResult.issues.join('; ');

  steps.push({ step: 'payload_alignment_validation', job_state: 'VALIDATING', passed: true });
  const alignmentResult = validatePayloadAlignment(iface, payload);
  steps[steps.length - 1].passed = alignmentResult.passed;
  if (!alignmentResult.passed) steps[steps.length - 1].notes = alignmentResult.issues.join('; ');

  steps.push({ step: 'identity_lock_validation', job_state: 'VALIDATING', passed: true });
  const identityResult = validateIdentityLocks(projectRoot, iface, payload);
  steps[steps.length - 1].passed = identityResult.passed;
  if (!identityResult.passed) steps[steps.length - 1].notes = identityResult.issues.join('; ');

  steps.push({ step: 'continuity_lock_validation', job_state: 'VALIDATING', passed: true });
  const continuityResult = validateContinuityLocks(projectRoot, iface, payload);
  steps[steps.length - 1].passed = continuityResult.passed;
  if (!continuityResult.passed) steps[steps.length - 1].notes = continuityResult.issues.join('; ');

  steps.push({ step: 'provider_safety_validation', job_state: 'VALIDATING', passed: true });
  const providerResult = validateProviderSafety(projectRoot, iface);
  steps[steps.length - 1].passed = providerResult.passed;
  if (!providerResult.passed) steps[steps.length - 1].notes = providerResult.issues.join('; ');

  const allPassed =
    ifaceResult.passed &&
    alignmentResult.passed &&
    identityResult.passed &&
    continuityResult.passed &&
    providerResult.passed;

  steps.push({
    step: 'simulated_queue_ready',
    job_state: 'READY',
    passed: allPassed,
    notes: allPassed
      ? `Simulated queue slot reserved for ${payload.gonegi_gpu_payload_id}`
      : 'Queue creation skipped due to validation failure',
  });

  let jobState: RuntimeJobState = allPassed ? 'READY' : 'SIMULATED_FAILED';

  if (allPassed) {
    steps.push({
      step: 'simulated_render_execution',
      job_state: 'SIMULATED_RUNNING',
      passed: true,
      notes: `Simulating ${payload.duration_seconds}s @ ${payload.fps_target}fps without GPU or provider activation`,
    });
    steps.push({
      step: 'job_completion',
      job_state: 'SIMULATED_COMPLETE',
      passed: true,
      notes: `Output placeholder: ${iface.output_contract.output_path}`,
    });
    jobState = 'SIMULATED_COMPLETE';
  }

  return {
    gonegi_runtime_job_id: jobId,
    phase: STUB_EXECUTION_PHASE,
    runtime_interface_id: iface.gonegi_runtime_interface_id,
    source_gpu_payload_id: payload.gonegi_gpu_payload_id,
    provider_id: iface.provider_hint.mapped_provider_id,
    job_state: jobState,
    validation_steps: steps,
    identity_lock_result: identityResult.passed ? 'PASS' : 'FAIL',
    continuity_lock_result: continuityResult.passed ? 'PASS' : 'FAIL',
    payload_alignment_result: alignmentResult.passed ? 'PASS' : 'FAIL',
    provider_safety_result: providerResult.passed ? 'PASS' : 'FAIL',
    simulated_output: {
      output_path: iface.output_contract.output_path,
      format: 'mp4_placeholder',
      generated: false,
      duration_seconds: payload.duration_seconds,
      fps_target: payload.fps_target,
      simulation_notes: allPassed
        ? 'Design-only stub execution completed without GPU, generation, or provider activation'
        : 'Simulation aborted due to validation failure',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    production_status: {
      isolated: true,
      storage_domain: 'gonegi_runtime_job',
      production_registry: false,
      draft_status: 'gonegi_runtime_job_simulated_v1',
    },
    executed_at: new Date().toISOString(),
  };
}

export function executeAllGonegiStubJobs(projectRoot?: string): GonegiRuntimeJob[] {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH))) {
    throw new Error(`Missing runtime interface registry: ${GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH}`);
  }
  if (!fs.existsSync(path.join(root, PROVIDER_REGISTRY_PATH))) {
    throw new Error(`Missing provider registry: ${PROVIDER_REGISTRY_PATH}`);
  }
  if (!fs.existsSync(path.join(root, PROVIDER_WIRING_REGISTRY_PATH))) {
    throw new Error(`Missing provider wiring registry: ${PROVIDER_WIRING_REGISTRY_PATH}`);
  }

  const jobs: GonegiRuntimeJob[] = [];
  for (const spec of SEED_GONEGI_RUNTIME_JOB_SPECS) {
    const iface = loadGonegiRuntimeInterface(root, spec.runtime_interface_id);
    if (!iface) {
      throw new Error(`Missing runtime interface: ${spec.runtime_interface_id}`);
    }

    const payload = loadGonegiGpuPayload(root, spec.source_gpu_payload_id);
    if (!payload) {
      throw new Error(`Missing GPU payload: ${spec.source_gpu_payload_id}`);
    }

    jobs.push(executeGonegiStubJob(root, iface, payload, spec.gonegi_runtime_job_id));
  }

  return jobs;
}

export function writeGonegiRuntimeJobs(projectRoot?: string): {
  jobs: GonegiRuntimeJob[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const jobs = executeAllGonegiStubJobs(root);
  const outDir = path.join(root, GONEGI_RUNTIME_JOBS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const job of jobs) {
    const rel = `${GONEGI_RUNTIME_JOBS_DIR}/${job.gonegi_runtime_job_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(job, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { jobs, written };
}

export function loadGonegiRuntimeJob(
  projectRoot: string,
  gonegiRuntimeJobId: string
): GonegiRuntimeJob | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GONEGI_RUNTIME_JOBS_DIR, `${gonegiRuntimeJobId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GonegiRuntimeJob;
}
