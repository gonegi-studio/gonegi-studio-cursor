import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { type GpuRenderPayload } from './gpuRenderPayloadBuilder.js';
import { loadKeyframePlan } from './keyframePlanBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  loadVideoRuntimeInterface,
  SEED_VIDEO_RUNTIME_SPECS,
  type VideoRuntimeInterface,
} from './videoRuntimeInterfaceBuilder.js';
import {
  VIDEO_RUNTIME_PASS_VERDICT,
  VIDEO_RUNTIME_REPORT_PATH,
} from './videoRuntimeInterfaceValidator.js';

export const STUB_EXECUTION_PHASE = 'PHASE-24-VIDEO-RUNTIME-STUB-EXECUTION-001' as const;
export const RUNTIME_JOB_REGISTRY_PATH = 'datasets/video_runtime/runtime-job-registry.json' as const;
export const RUNTIME_JOB_SCHEMA_PATH = 'datasets/video_runtime/runtime-job.schema.json' as const;
export const STUB_EXECUTION_REPORT_PATH =
  'reports/video-runtime-stub-execution-report.json' as const;
export const STUB_EXECUTION_PASS_VERDICT = 'PASS_VIDEO_RUNTIME_STUB_EXECUTION_V1' as const;
export const STUB_EXECUTION_FAIL_VERDICT = 'FAIL_VIDEO_RUNTIME_STUB_EXECUTION_V1' as const;

export const RUNTIME_JOB_STATES = Object.freeze([
  'QUEUED',
  'VALIDATING',
  'READY',
  'SIMULATED_RUNNING',
  'SIMULATED_COMPLETE',
  'SIMULATED_FAILED',
] as const);

export type RuntimeJobState = (typeof RUNTIME_JOB_STATES)[number];

export const SEED_STUB_JOB_SPECS = Object.freeze(
  SEED_VIDEO_RUNTIME_SPECS.map((spec) => ({
    job_id: `runtime_job_${spec.runtime_interface_id.replace(/^video_runtime_/, '')}`,
    runtime_interface_id: spec.runtime_interface_id,
    gpu_payload_id: spec.source_gpu_payload_id,
  }))
);

export type StubValidationResult = {
  runtime_initialized: boolean;
  payload_valid: boolean;
  identity_lock_valid: boolean;
  motion_valid: boolean;
  render_queue_created: boolean;
  passed: boolean;
  issues: string[];
};

export type SimulationStep = {
  step: string;
  job_state: RuntimeJobState;
  passed: boolean;
  notes?: string;
};

export type VideoRuntimeJob = {
  job_id: string;
  phase: typeof STUB_EXECUTION_PHASE;
  runtime_interface_id: string;
  gpu_payload_id: string;
  job_state: RuntimeJobState;
  validation_result: StubValidationResult;
  identity_lock_status: 'PASS' | 'FAIL';
  continuity_lock_status: 'PASS' | 'FAIL';
  completion_status: 'PENDING' | 'COMPLETE' | 'FAILED';
  execution_flags: {
    gpu_execution: false;
    simulation_only: true;
    external_call_allowed: false;
  };
  simulation_trace: SimulationStep[];
  output_placeholder: string;
  built_at: string;
};

export type StubExecutionReport = {
  execution_id: string;
  phase: typeof STUB_EXECUTION_PHASE;
  timestamp: string;
  job_count: number;
  completed_jobs: number;
  failed_jobs: number;
  identity_lock_result: 'PASS' | 'FAIL';
  continuity_lock_result: 'PASS' | 'FAIL';
  runtime_safety_result: 'PASS' | 'FAIL';
  jobs: VideoRuntimeJob[];
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict: typeof STUB_EXECUTION_PASS_VERDICT | typeof STUB_EXECUTION_FAIL_VERDICT;
};

function validatePayloadAgainstInterface(
  iface: VideoRuntimeInterface,
  payload: GpuRenderPayload
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (iface.source_gpu_payload_id !== payload.gpu_payload_id) {
    issues.push('runtime interface gpu_payload_id mismatch');
  }
  if (iface.payload_summary.duration_seconds !== payload.duration_seconds) {
    issues.push('duration_seconds mismatch between interface and payload');
  }
  if (iface.payload_summary.keyframe_count !== payload.keyframes.length) {
    issues.push('keyframe_count mismatch between interface and payload');
  }
  if (iface.payload_summary.motion_segment_count !== payload.motion_segments.length) {
    issues.push('motion_segment_count mismatch between interface and payload');
  }
  if (iface.handshake.identity_lock_count !== payload.identity_locks.length) {
    issues.push('identity_lock_count mismatch in handshake');
  }
  if (payload.execution_flags.gpu_execution !== false) {
    issues.push('payload gpu_execution must be false');
  }
  if (payload.execution_flags.external_call_allowed !== false) {
    issues.push('payload external_call_allowed must be false');
  }

  return { valid: issues.length === 0, issues };
}

function validateIdentityLocks(
  projectRoot: string,
  payload: GpuRenderPayload
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const keyframePlan = loadKeyframePlan(projectRoot, payload.source_keyframe_plan_id);

  if (!keyframePlan) {
    issues.push('keyframe plan missing for identity lock validation');
    return { valid: false, issues };
  }

  const baseline = keyframePlan.keyframes[0]?.continuity_locks.identity_locks ?? [];

  if (payload.identity_locks.length === 0) {
    issues.push('identity_locks must not be empty');
  }
  if (JSON.stringify(payload.identity_locks) !== JSON.stringify(baseline)) {
    issues.push('identity_locks must match keyframe plan baseline');
  }
  for (const kf of payload.keyframes) {
    if (!kf.scene_state_ref) {
      issues.push(`keyframe ${kf.keyframe_index} missing scene_state_ref`);
    }
  }

  return { valid: issues.length === 0, issues };
}

function validateContinuityLocks(
  projectRoot: string,
  payload: GpuRenderPayload
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const keyframePlan = loadKeyframePlan(projectRoot, payload.source_keyframe_plan_id);

  if (!keyframePlan) {
    issues.push('keyframe plan missing for continuity lock validation');
    return { valid: false, issues };
  }

  const baseline = keyframePlan.keyframes[0]?.continuity_locks;

  if (JSON.stringify(payload.location_locks) !== JSON.stringify(baseline?.location_locks ?? [])) {
    issues.push('location_locks must match keyframe plan baseline');
  }
  if (
    JSON.stringify(payload.composition_locks) !== JSON.stringify(baseline?.composition_locks ?? [])
  ) {
    issues.push('composition_locks must match keyframe plan baseline');
  }

  const expectedProps = (baseline?.composition_locks ?? []).filter((l) =>
    l.startsWith('prop_anchor:')
  );
  if (JSON.stringify(payload.prop_locks) !== JSON.stringify(expectedProps)) {
    issues.push('prop_locks must match keyframe prop anchors');
  }

  return { valid: issues.length === 0, issues };
}

function validateMotion(payload: GpuRenderPayload): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (payload.keyframes.length !== payload.motion_segments.length + 1) {
    issues.push(
      `keyframes (${payload.keyframes.length}) must equal motion_segments (${payload.motion_segments.length}) + 1`
    );
  }

  for (const segment of payload.motion_segments) {
    if (segment.to_keyframe !== segment.from_keyframe + 1) {
      issues.push(`segment ${segment.segment_id} must connect consecutive keyframes`);
    }
  }

  const segmentDuration = payload.motion_segments.reduce((s, seg) => s + seg.duration_seconds, 0);
  if (Math.abs(segmentDuration - payload.duration_seconds) > 0.02) {
    issues.push(
      `motion segment total ${segmentDuration}s != payload duration ${payload.duration_seconds}s`
    );
  }

  return { valid: issues.length === 0, issues };
}

function simulateRuntimeInitialization(
  iface: VideoRuntimeInterface
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (iface.readiness !== 'design_only') {
    issues.push('runtime interface must be design_only for stub execution');
  }
  if (iface.execution_flags.gpu_execution !== false) {
    issues.push('runtime interface gpu_execution must be false');
  }
  if (iface.execution_flags.external_call_allowed !== false) {
    issues.push('runtime interface external_call_allowed must be false');
  }
  if (iface.local_adapter.executable !== null || iface.remote_adapter.endpoint !== null) {
    issues.push('runtime adapters must remain unwired in stub execution');
  }

  return { valid: issues.length === 0, issues };
}

export function executeStubJob(
  projectRoot: string,
  iface: VideoRuntimeInterface,
  payload: GpuRenderPayload,
  jobId: string
): VideoRuntimeJob {
  const trace: SimulationStep[] = [];
  const allIssues: string[] = [];

  trace.push({
    step: 'job_queued',
    job_state: 'QUEUED',
    passed: true,
    notes: `Stub job ${jobId} enqueued for ${iface.runtime_interface_id}`,
  });

  trace.push({ step: 'runtime_initialization', job_state: 'VALIDATING', passed: true });
  const initResult = simulateRuntimeInitialization(iface);
  if (!initResult.valid) allIssues.push(...initResult.issues);
  trace[trace.length - 1].passed = initResult.valid;
  if (!initResult.valid) trace[trace.length - 1].notes = initResult.issues.join('; ');

  trace.push({ step: 'payload_validation', job_state: 'VALIDATING', passed: true });
  const payloadResult = validatePayloadAgainstInterface(iface, payload);
  if (!payloadResult.valid) allIssues.push(...payloadResult.issues);
  trace[trace.length - 1].passed = payloadResult.valid;
  if (!payloadResult.valid) trace[trace.length - 1].notes = payloadResult.issues.join('; ');

  trace.push({ step: 'identity_lock_validation', job_state: 'VALIDATING', passed: true });
  const identityResult = validateIdentityLocks(projectRoot, payload);
  if (!identityResult.valid) allIssues.push(...identityResult.issues);
  trace[trace.length - 1].passed = identityResult.valid;
  if (!identityResult.valid) trace[trace.length - 1].notes = identityResult.issues.join('; ');

  trace.push({ step: 'continuity_lock_validation', job_state: 'VALIDATING', passed: true });
  const continuityResult = validateContinuityLocks(projectRoot, payload);
  if (!continuityResult.valid) allIssues.push(...continuityResult.issues);
  trace[trace.length - 1].passed = continuityResult.valid;
  if (!continuityResult.valid) trace[trace.length - 1].notes = continuityResult.issues.join('; ');

  trace.push({ step: 'motion_validation', job_state: 'VALIDATING', passed: true });
  const motionResult = validateMotion(payload);
  if (!motionResult.valid) allIssues.push(...motionResult.issues);
  trace[trace.length - 1].passed = motionResult.valid;
  if (!motionResult.valid) trace[trace.length - 1].notes = motionResult.issues.join('; ');

  const validationPassed =
    initResult.valid &&
    payloadResult.valid &&
    identityResult.valid &&
    continuityResult.valid &&
    motionResult.valid;

  trace.push({
    step: 'render_queue_creation',
    job_state: 'READY',
    passed: validationPassed,
    notes: validationPassed
      ? `Simulated queue slot reserved for ${payload.gpu_payload_id}`
      : 'Queue creation skipped due to validation failure',
  });

  let jobState: RuntimeJobState = validationPassed ? 'READY' : 'SIMULATED_FAILED';
  let completionStatus: VideoRuntimeJob['completion_status'] = validationPassed
    ? 'PENDING'
    : 'FAILED';

  if (validationPassed) {
    trace.push({
      step: 'simulated_render_execution',
      job_state: 'SIMULATED_RUNNING',
      passed: true,
      notes: `Simulating ${payload.duration_seconds}s @ ${payload.fps_target}fps without GPU`,
    });

    trace.push({
      step: 'job_completion',
      job_state: 'SIMULATED_COMPLETE',
      passed: true,
      notes: `Output placeholder: ${iface.submission_contract.output_artifact_placeholder}`,
    });

    jobState = 'SIMULATED_COMPLETE';
    completionStatus = 'COMPLETE';
  }

  const validation_result: StubValidationResult = {
    runtime_initialized: initResult.valid,
    payload_valid: payloadResult.valid,
    identity_lock_valid: identityResult.valid,
    motion_valid: motionResult.valid,
    render_queue_created: validationPassed,
    passed: validationPassed,
    issues: allIssues,
  };

  return {
    job_id: jobId,
    phase: STUB_EXECUTION_PHASE,
    runtime_interface_id: iface.runtime_interface_id,
    gpu_payload_id: payload.gpu_payload_id,
    job_state: jobState,
    validation_result,
    identity_lock_status: identityResult.valid ? 'PASS' : 'FAIL',
    continuity_lock_status: continuityResult.valid ? 'PASS' : 'FAIL',
    completion_status: completionStatus,
    execution_flags: {
      gpu_execution: false,
      simulation_only: true,
      external_call_allowed: false,
    },
    simulation_trace: trace,
    output_placeholder: iface.submission_contract.output_artifact_placeholder,
    built_at: new Date().toISOString(),
  };
}

export function executeSeedStubJobs(projectRoot?: string): VideoRuntimeJob[] {
  const root = resolveProjectRoot(projectRoot);
  const jobs: VideoRuntimeJob[] = [];

  for (const spec of SEED_STUB_JOB_SPECS) {
    const iface = loadVideoRuntimeInterface(root, spec.runtime_interface_id);
    if (!iface) {
      throw new Error(`Missing runtime interface: ${spec.runtime_interface_id}`);
    }

    const payloadPath = iface.submission_contract.input_artifact_path;
    const absPayload = path.join(root, payloadPath);
    if (!fs.existsSync(absPayload)) {
      throw new Error(`Missing GPU payload file: ${payloadPath}`);
    }
    const payload = JSON.parse(fs.readFileSync(absPayload, 'utf8')) as GpuRenderPayload;

    jobs.push(executeStubJob(root, iface, payload, spec.job_id));
  }

  return jobs;
}

export function writeRuntimeJobs(
  projectRoot: string,
  jobs: VideoRuntimeJob[],
  storageDir = 'datasets/video_runtime/runtime-jobs'
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const absDir = path.join(root, storageDir);
  fs.mkdirSync(absDir, { recursive: true });

  const written: string[] = [];
  for (const job of jobs) {
    const rel = `${storageDir}/${job.job_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(job, null, 2)}\n`, 'utf8');
    written.push(rel);
  }
  return written;
}

function validateUpstreamInterfaceReport(projectRoot: string): string[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: string[] = [];
  const reportPath = path.join(root, VIDEO_RUNTIME_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push(`Missing upstream report: ${VIDEO_RUNTIME_REPORT_PATH}`);
    return issues;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as { final_verdict?: string };
  if (report.final_verdict !== VIDEO_RUNTIME_PASS_VERDICT) {
    issues.push(`Upstream report must be ${VIDEO_RUNTIME_PASS_VERDICT}`);
  }

  return issues;
}

function validateRegistry(projectRoot: string, jobs: VideoRuntimeJob[]): string[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: string[] = [];

  if (!fs.existsSync(path.join(root, RUNTIME_JOB_SCHEMA_PATH))) {
    issues.push(`Missing schema: ${RUNTIME_JOB_SCHEMA_PATH}`);
  }

  const registry = readJsonRecord(root, RUNTIME_JOB_REGISTRY_PATH) as {
    runtime_jobs?: Array<{ job_id: string; job_path: string }>;
  } | null;

  if (!registry?.runtime_jobs?.length) {
    issues.push(`Missing registry: ${RUNTIME_JOB_REGISTRY_PATH}`);
    return issues;
  }

  const builtIds = new Set(jobs.map((j) => j.job_id));
  for (const entry of registry.runtime_jobs) {
    if (!builtIds.has(entry.job_id)) {
      issues.push(`Registry missing built job: ${entry.job_id}`);
    }
    if (!fs.existsSync(path.join(root, entry.job_path))) {
      issues.push(`Job file missing: ${entry.job_path}`);
    }
  }

  return issues;
}

export function runStubExecutionValidation(
  projectRoot: string,
  jobs: VideoRuntimeJob[]
): StubExecutionReport {
  const upstreamIssues = validateUpstreamInterfaceReport(projectRoot);
  const registryIssues = validateRegistry(projectRoot, jobs);

  const completed_jobs = jobs.filter((j) => j.completion_status === 'COMPLETE').length;
  const failed_jobs = jobs.filter((j) => j.completion_status === 'FAILED').length;

  const identityFail = jobs.some((j) => j.identity_lock_status === 'FAIL');
  const continuityFail = jobs.some((j) => j.continuity_lock_status === 'FAIL');
  const safetyFail = jobs.some(
    (j) =>
      j.execution_flags.gpu_execution !== false ||
      j.execution_flags.external_call_allowed !== false ||
      j.execution_flags.simulation_only !== true
  );

  const structuralFail =
    upstreamIssues.length > 0 ||
    registryIssues.length > 0 ||
    failed_jobs > 0 ||
    identityFail ||
    continuityFail ||
    safetyFail;

  const pass = !structuralFail && jobs.length === 3 && completed_jobs === 3;

  return {
    execution_id: `stub_exec_${Date.now().toString(36)}`,
    phase: STUB_EXECUTION_PHASE,
    timestamp: new Date().toISOString(),
    job_count: jobs.length,
    completed_jobs,
    failed_jobs,
    identity_lock_result: identityFail ? 'FAIL' : 'PASS',
    continuity_lock_result: continuityFail ? 'FAIL' : 'PASS',
    runtime_safety_result: safetyFail ? 'FAIL' : 'PASS',
    jobs,
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? STUB_EXECUTION_PASS_VERDICT : STUB_EXECUTION_FAIL_VERDICT,
  };
}

export function writeStubExecutionReport(
  projectRoot: string,
  jobs: VideoRuntimeJob[]
): StubExecutionReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runStubExecutionValidation(root, jobs);

  const payload = {
    ...report,
    report_type: 'video_runtime_stub_execution_report',
    report_version: 'v1',
    export_path: STUB_EXECUTION_REPORT_PATH,
    schema_path: RUNTIME_JOB_SCHEMA_PATH,
    registry_path: RUNTIME_JOB_REGISTRY_PATH,
    upstream_report_path: VIDEO_RUNTIME_REPORT_PATH,
    pipeline_chain:
      'Scene State → Video Shot State → Keyframe Plan → Motion Plan → GPU Render Payload → Video Runtime Interface → Stub Execution',
    next_phase: 'PHASE-25 VIDEO_RUNTIME_PROVIDER_ABSTRACTION_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, STUB_EXECUTION_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return report;
}
