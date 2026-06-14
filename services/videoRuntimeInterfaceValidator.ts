import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  GPU_PAYLOAD_PASS_VERDICT,
  GPU_PAYLOAD_REPORT_PATH,
} from './gpuRenderPayloadValidator.js';
import { loadGpuRenderPayload } from './gpuRenderPayloadBuilder.js';
import {
  RUNTIME_TARGETS,
  VIDEO_RUNTIME_PHASE,
  VIDEO_RUNTIME_REGISTRY_PATH,
  type VideoRuntimeInterface,
} from './videoRuntimeInterfaceBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_RUNTIME_PASS_VERDICT = 'PASS_VIDEO_RUNTIME_INTERFACE_DESIGN_V1' as const;
export const VIDEO_RUNTIME_FAIL_VERDICT = 'FAIL_VIDEO_RUNTIME_INTERFACE_DESIGN_V1' as const;
export const VIDEO_RUNTIME_REPORT_PATH =
  'reports/video-runtime-interface-design-report.json' as const;
export const VIDEO_RUNTIME_SCHEMA_PATH =
  'datasets/video_runtime/video-runtime-interface.schema.json' as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type VideoRuntimeInterfaceValidationResult = {
  runtime_interface_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type VideoRuntimeInterfaceDesignReport = {
  design_id: string;
  phase: typeof VIDEO_RUNTIME_PHASE;
  timestamp: string;
  interface_count: number;
  payload_link_status: 'PASS' | 'FAIL';
  local_adapter_status: 'PASS' | 'FAIL';
  remote_adapter_status: 'PASS' | 'FAIL';
  handshake_status: 'PASS' | 'FAIL';
  execution_safety_status: 'PASS' | 'FAIL';
  interface_validations: VideoRuntimeInterfaceValidationResult[];
  issues: ValidationIssue[];
  gpu_execution: false;
  design_only: true;
  final_verdict: typeof VIDEO_RUNTIME_PASS_VERDICT | typeof VIDEO_RUNTIME_FAIL_VERDICT;
};

function validateUpstreamGpuReport(projectRoot: string): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, GPU_PAYLOAD_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM_REPORT',
      message: `Missing upstream GPU payload report: ${GPU_PAYLOAD_REPORT_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    final_verdict?: string;
  };

  if (report.final_verdict !== GPU_PAYLOAD_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_NOT_PASS',
      message: `Upstream GPU payload report must be ${GPU_PAYLOAD_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return issues;
}

function validatePayloadLink(
  projectRoot: string,
  iface: VideoRuntimeInterface
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const payload = loadGpuRenderPayload(projectRoot, iface.source_gpu_payload_id);

  if (!payload) {
    issues.push({
      code: 'PAYLOAD_LINK_FAIL',
      message: `Missing GPU payload: ${iface.source_gpu_payload_id}`,
      severity: 'error',
      field: 'source_gpu_payload_id',
    });
    return issues;
  }

  if (
    iface.submission_contract.input_artifact_path !==
    `datasets/gpu_payload/payloads/${payload.gpu_payload_id}.json`
  ) {
    issues.push({
      code: 'PAYLOAD_LINK_FAIL',
      message: 'submission_contract.input_artifact_path must match GPU payload file path',
      severity: 'error',
      field: 'submission_contract.input_artifact_path',
    });
  }

  if (iface.payload_summary.duration_seconds !== payload.duration_seconds) {
    issues.push({
      code: 'PAYLOAD_SUMMARY_MISMATCH',
      message: 'payload_summary.duration_seconds must match GPU payload',
      severity: 'error',
      field: 'payload_summary.duration_seconds',
    });
  }
  if (iface.payload_summary.keyframe_count !== payload.keyframes.length) {
    issues.push({
      code: 'PAYLOAD_SUMMARY_MISMATCH',
      message: 'payload_summary.keyframe_count must match GPU payload',
      severity: 'error',
      field: 'payload_summary.keyframe_count',
    });
  }
  if (iface.payload_summary.motion_segment_count !== payload.motion_segments.length) {
    issues.push({
      code: 'PAYLOAD_SUMMARY_MISMATCH',
      message: 'payload_summary.motion_segment_count must match GPU payload',
      severity: 'error',
      field: 'payload_summary.motion_segment_count',
    });
  }
  if (iface.payload_summary.source_scene_state_id !== payload.source_scene_state_id) {
    issues.push({
      code: 'PAYLOAD_SUMMARY_MISMATCH',
      message: 'payload_summary.source_scene_state_id must match GPU payload',
      severity: 'error',
      field: 'payload_summary.source_scene_state_id',
    });
  }

  return issues;
}

function validateHandshake(
  projectRoot: string,
  iface: VideoRuntimeInterface
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const payload = loadGpuRenderPayload(projectRoot, iface.source_gpu_payload_id);
  if (!payload) return issues;

  if (iface.handshake.identity_lock_count !== payload.identity_locks.length) {
    issues.push({
      code: 'HANDSHAKE_FAIL',
      message: 'handshake.identity_lock_count must match GPU payload identity_locks',
      severity: 'error',
      field: 'handshake.identity_lock_count',
    });
  }

  const required = iface.handshake.required_lock_categories;
  if (
    !required.includes('identity_locks') ||
    !required.includes('location_locks') ||
    !required.includes('composition_locks')
  ) {
    issues.push({
      code: 'HANDSHAKE_FAIL',
      message: 'handshake.required_lock_categories must include identity, location, composition',
      severity: 'error',
      field: 'handshake.required_lock_categories',
    });
  }

  if (!iface.handshake.preflight_checks.some((c) => c.includes('identity_locks_present'))) {
    issues.push({
      code: 'HANDSHAKE_FAIL',
      message: 'preflight_checks must include identity_locks_present',
      severity: 'error',
      field: 'handshake.preflight_checks',
    });
  }

  return issues;
}

function validateLocalAdapter(iface: VideoRuntimeInterface): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (iface.local_adapter.runtime_kind !== 'local_gpu_stub') {
    issues.push({
      code: 'LOCAL_ADAPTER_FAIL',
      message: 'local_adapter.runtime_kind must be local_gpu_stub',
      severity: 'error',
    });
  }
  if (iface.local_adapter.executable !== null) {
    issues.push({
      code: 'LOCAL_ADAPTER_FAIL',
      message: 'local_adapter.executable must be null in design phase',
      severity: 'error',
      field: 'local_adapter.executable',
    });
  }
  if (iface.local_adapter.status !== 'not_wired') {
    issues.push({
      code: 'LOCAL_ADAPTER_FAIL',
      message: 'local_adapter.status must be not_wired',
      severity: 'error',
      field: 'local_adapter.status',
    });
  }

  return issues;
}

function validateRemoteAdapter(iface: VideoRuntimeInterface): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (iface.remote_adapter.runtime_kind !== 'remote_api_stub') {
    issues.push({
      code: 'REMOTE_ADAPTER_FAIL',
      message: 'remote_adapter.runtime_kind must be remote_api_stub',
      severity: 'error',
    });
  }
  if (iface.remote_adapter.endpoint !== null) {
    issues.push({
      code: 'REMOTE_ADAPTER_FAIL',
      message: 'remote_adapter.endpoint must be null in design phase',
      severity: 'error',
      field: 'remote_adapter.endpoint',
    });
  }
  if (iface.remote_adapter.status !== 'not_wired') {
    issues.push({
      code: 'REMOTE_ADAPTER_FAIL',
      message: 'remote_adapter.status must be not_wired',
      severity: 'error',
      field: 'remote_adapter.status',
    });
  }

  return issues;
}

function validateExecutionSafety(iface: VideoRuntimeInterface): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (iface.execution_flags.gpu_execution !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
    });
  }
  if (iface.execution_flags.preparation_only !== true) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'execution_flags.preparation_only must be true',
      severity: 'error',
    });
  }
  if (iface.execution_flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
    });
  }
  if (iface.submission_contract.submission_allowed !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'submission_contract.submission_allowed must be false',
      severity: 'error',
    });
  }
  if (iface.readiness !== 'design_only') {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'readiness must be design_only',
      severity: 'error',
      field: 'readiness',
    });
  }

  return issues;
}

function validateRegistry(
  projectRoot: string,
  interfaces: VideoRuntimeInterface[]
): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, VIDEO_RUNTIME_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${VIDEO_RUNTIME_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = readJsonRecord(root, VIDEO_RUNTIME_REGISTRY_PATH) as {
    runtime_interfaces?: Array<{
      runtime_interface_id: string;
      source_gpu_payload_id: string;
      interface_path: string;
    }>;
  } | null;

  if (!registry?.runtime_interfaces?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${VIDEO_RUNTIME_REGISTRY_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const builtIds = new Set(interfaces.map((i) => i.runtime_interface_id));
  for (const entry of registry.runtime_interfaces) {
    if (!builtIds.has(entry.runtime_interface_id)) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry missing built interface: ${entry.runtime_interface_id}`,
        severity: 'error',
      });
    }
    if (!fs.existsSync(path.join(root, entry.interface_path))) {
      issues.push({
        code: 'MISSING_INTERFACE_FILE',
        message: `Interface file missing: ${entry.interface_path}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function validateVideoRuntimeInterface(
  projectRoot: string,
  iface: VideoRuntimeInterface
): VideoRuntimeInterfaceValidationResult {
  const issues = [
    ...(iface.phase !== VIDEO_RUNTIME_PHASE
      ? [
          {
            code: 'PHASE_MISMATCH',
            message: `phase must be ${VIDEO_RUNTIME_PHASE}`,
            severity: 'error' as const,
          },
        ]
      : []),
    ...(!RUNTIME_TARGETS.includes(iface.runtime_target)
      ? [
          {
            code: 'INVALID_RUNTIME_TARGET',
            message: `runtime_target must be one of ${RUNTIME_TARGETS.join(', ')}`,
            severity: 'error' as const,
            field: 'runtime_target',
          },
        ]
      : []),
    ...validatePayloadLink(projectRoot, iface),
    ...validateHandshake(projectRoot, iface),
    ...validateLocalAdapter(iface),
    ...validateRemoteAdapter(iface),
    ...validateExecutionSafety(iface),
  ];

  return {
    runtime_interface_id: iface.runtime_interface_id,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function runVideoRuntimeInterfaceValidation(
  projectRoot: string,
  interfaces: VideoRuntimeInterface[]
): VideoRuntimeInterfaceDesignReport {
  const upstreamIssues = validateUpstreamGpuReport(projectRoot);
  const registryIssues = validateRegistry(projectRoot, interfaces);
  const interface_validations = interfaces.map((i) =>
    validateVideoRuntimeInterface(projectRoot, i)
  );
  const issues = [
    ...upstreamIssues,
    ...registryIssues,
    ...interface_validations.flatMap((v) => v.issues),
  ];
  const errors = issues.filter((i) => i.severity === 'error');

  const payloadLinkErrors = errors.filter((e) =>
    ['PAYLOAD_LINK_FAIL', 'PAYLOAD_SUMMARY_MISMATCH', 'MISSING_UPSTREAM_REPORT', 'UPSTREAM_NOT_PASS'].includes(
      e.code
    )
  );
  const localErrors = errors.filter((e) => e.code === 'LOCAL_ADAPTER_FAIL');
  const remoteErrors = errors.filter((e) => e.code === 'REMOTE_ADAPTER_FAIL');
  const handshakeErrors = errors.filter((e) => e.code === 'HANDSHAKE_FAIL');
  const executionErrors = errors.filter((e) => e.code === 'EXECUTION_UNSAFE');

  const pass = errors.length === 0;

  return {
    design_id: `video_runtime_design_${Date.now().toString(36)}`,
    phase: VIDEO_RUNTIME_PHASE,
    timestamp: new Date().toISOString(),
    interface_count: interfaces.length,
    payload_link_status: payloadLinkErrors.length === 0 ? 'PASS' : 'FAIL',
    local_adapter_status: localErrors.length === 0 ? 'PASS' : 'FAIL',
    remote_adapter_status: remoteErrors.length === 0 ? 'PASS' : 'FAIL',
    handshake_status: handshakeErrors.length === 0 ? 'PASS' : 'FAIL',
    execution_safety_status: executionErrors.length === 0 ? 'PASS' : 'FAIL',
    interface_validations,
    issues,
    gpu_execution: false,
    design_only: true,
    final_verdict: pass ? VIDEO_RUNTIME_PASS_VERDICT : VIDEO_RUNTIME_FAIL_VERDICT,
  };
}

export function writeVideoRuntimeInterfaceDesignReport(
  projectRoot: string,
  interfaces: VideoRuntimeInterface[]
): VideoRuntimeInterfaceDesignReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runVideoRuntimeInterfaceValidation(root, interfaces);

  const payload = {
    ...report,
    report_type: 'video_runtime_interface_design_report',
    report_version: 'v1',
    export_path: VIDEO_RUNTIME_REPORT_PATH,
    schema_path: VIDEO_RUNTIME_SCHEMA_PATH,
    registry_path: VIDEO_RUNTIME_REGISTRY_PATH,
    upstream_report_path: GPU_PAYLOAD_REPORT_PATH,
    pipeline_chain:
      'Scene State → Video Shot State → Keyframe Plan → Motion Plan → GPU Render Payload → Video Runtime Interface',
    next_phase: 'PHASE-24 VIDEO_RUNTIME_STUB_EXECUTION_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_RUNTIME_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return report;
}
