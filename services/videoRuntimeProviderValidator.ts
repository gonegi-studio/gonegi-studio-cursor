import fs from 'node:fs';
import path from 'node:path';
import type { GpuRenderPayload } from './gpuRenderPayloadBuilder.js';
import { SEED_GPU_PAYLOAD_SPECS, loadGpuRenderPayload } from './gpuRenderPayloadBuilder.js';
import {
  loadVideoRuntimeInterface,
  SEED_VIDEO_RUNTIME_SPECS,
  type VideoRuntimeInterface,
} from './videoRuntimeInterfaceBuilder.js';
import {
  STUB_EXECUTION_PASS_VERDICT,
  STUB_EXECUTION_REPORT_PATH,
} from './videoRuntimeStubExecutor.js';
import {
  buildCapabilityMatrix,
  getProviderById,
  listProviders,
  loadProviderRegistry,
  PROVIDER_REGISTRY_PATH,
  PROVIDER_SCHEMA_PATH,
  validateProviderCapabilities,
  type VideoRuntimeProvider,
} from './videoRuntimeProviderRegistry.js';
import {
  selectProvidersForSeedPayloads,
  type ProviderSelectionResult,
} from './videoRuntimeProviderSelector.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROVIDER_PASS_VERDICT = 'PASS_VIDEO_RUNTIME_PROVIDER_ABSTRACTION_V1' as const;
export const PROVIDER_FAIL_VERDICT = 'FAIL_VIDEO_RUNTIME_PROVIDER_ABSTRACTION_V1' as const;
export const PROVIDER_REPORT_PATH =
  'reports/video-runtime-provider-abstraction-report.json' as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type ProviderValidationResult = {
  provider_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type ProviderAbstractionReport = {
  abstraction_id: string;
  phase: 'PHASE-25-VIDEO-RUNTIME-PROVIDER-ABSTRACTION-001';
  timestamp: string;
  provider_count: number;
  registered_providers: string[];
  capability_matrix: ReturnType<typeof buildCapabilityMatrix>;
  recommended_provider_per_payload: ProviderSelectionResult[];
  provider_validations: ProviderValidationResult[];
  safety_status: 'PASS' | 'FAIL';
  selection_status: 'PASS' | 'FAIL';
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict: typeof PROVIDER_PASS_VERDICT | typeof PROVIDER_FAIL_VERDICT;
  issues: ValidationIssue[];
};

function validateUpstreamStubReport(projectRoot: string): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, STUB_EXECUTION_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM_REPORT',
      message: `Missing upstream stub report: ${STUB_EXECUTION_REPORT_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as { final_verdict?: string };
  if (report.final_verdict !== STUB_EXECUTION_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_NOT_PASS',
      message: `Upstream report must be ${STUB_EXECUTION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return issues;
}

function validateProviderSafety(provider: VideoRuntimeProvider): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (provider.status !== 'not_wired') {
    issues.push({
      code: 'PROVIDER_WIRED',
      message: `${provider.provider_id} must remain not_wired`,
      severity: 'error',
      field: 'status',
    });
  }
  if (provider.execution_flags.gpu_execution !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: `${provider.provider_id} gpu_execution must be false`,
      severity: 'error',
    });
  }
  if (provider.execution_flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: `${provider.provider_id} external_call_allowed must be false`,
      severity: 'error',
    });
  }
  if (provider.execution_flags.preparation_only !== true) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: `${provider.provider_id} preparation_only must be true`,
      severity: 'error',
    });
  }
  if (provider.wiring.executable !== null) {
    issues.push({
      code: 'WIRING_ACTIVE',
      message: `${provider.provider_id} executable must be null`,
      severity: 'error',
      field: 'wiring.executable',
    });
  }
  if (provider.wiring.endpoint !== null) {
    issues.push({
      code: 'WIRING_ACTIVE',
      message: `${provider.provider_id} endpoint must be null`,
      severity: 'error',
      field: 'wiring.endpoint',
    });
  }

  return issues;
}

export function validateProvider(
  projectRoot: string | undefined,
  providerId: string
): ProviderValidationResult {
  const provider = getProviderById(projectRoot, providerId);
  const issues: ValidationIssue[] = [];

  if (!provider) {
    issues.push({
      code: 'PROVIDER_NOT_FOUND',
      message: `Provider not found: ${providerId}`,
      severity: 'error',
    });
    return { provider_id: providerId, valid: false, issues };
  }

  const capResult = validateProviderCapabilities(provider);
  for (const msg of capResult.issues) {
    issues.push({ code: 'CAPABILITY_INVALID', message: msg, severity: 'error' });
  }
  issues.push(...validateProviderSafety(provider));

  return {
    provider_id: providerId,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

function loadSeedPayloadPairs(projectRoot: string): Array<{
  payload: GpuRenderPayload;
  iface: VideoRuntimeInterface;
}> {
  const pairs: Array<{ payload: GpuRenderPayload; iface: VideoRuntimeInterface }> = [];

  for (const spec of SEED_VIDEO_RUNTIME_SPECS) {
    const iface = loadVideoRuntimeInterface(projectRoot, spec.runtime_interface_id);
    const payload = loadGpuRenderPayload(projectRoot, spec.source_gpu_payload_id);
    if (!iface || !payload) {
      throw new Error(`Missing pair for ${spec.runtime_interface_id}`);
    }
    pairs.push({ payload, iface });
  }

  return pairs;
}

export function runProviderAbstractionValidation(
  projectRoot: string
): ProviderAbstractionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [...validateUpstreamStubReport(root)];

  if (!fs.existsSync(path.join(root, PROVIDER_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${PROVIDER_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = loadProviderRegistry(root);
  if (!registry) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${PROVIDER_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const providers = listProviders(root);
  const provider_validations = providers.map((p) => validateProvider(root, p.provider_id));
  issues.push(...provider_validations.flatMap((v) => v.issues));

  const pairs = loadSeedPayloadPairs(root);
  const recommended_provider_per_payload = selectProvidersForSeedPayloads(root, pairs);

  const selectionFail = recommended_provider_per_payload.some(
    (s) => s.recommended_provider_id === 'none'
  );
  if (selectionFail) {
    issues.push({
      code: 'SELECTION_FAIL',
      message: 'Provider selection failed for one or more seed payloads',
      severity: 'error',
    });
  }

  for (const selection of recommended_provider_per_payload) {
    const provider = getProviderById(root, selection.recommended_provider_id);
    if (!provider) {
      issues.push({
        code: 'SELECTION_INVALID',
        message: `Recommended provider missing: ${selection.recommended_provider_id}`,
        severity: 'error',
      });
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const safetyFail = provider_validations.some((v) => !v.valid);
  const pass =
    errors.length === 0 &&
    providers.length >= 5 &&
    !selectionFail &&
    providers.every((p) => p.status === 'not_wired');

  return {
    abstraction_id: `provider_abs_${Date.now().toString(36)}`,
    phase: 'PHASE-25-VIDEO-RUNTIME-PROVIDER-ABSTRACTION-001',
    timestamp: new Date().toISOString(),
    provider_count: providers.length,
    registered_providers: providers.map((p) => p.provider_id),
    capability_matrix: buildCapabilityMatrix(providers),
    recommended_provider_per_payload,
    provider_validations,
    safety_status: safetyFail ? 'FAIL' : 'PASS',
    selection_status: selectionFail ? 'FAIL' : 'PASS',
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? PROVIDER_PASS_VERDICT : PROVIDER_FAIL_VERDICT,
    issues,
  };
}

export function writeProviderAbstractionReport(projectRoot: string): ProviderAbstractionReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runProviderAbstractionValidation(root);

  const payload = {
    ...report,
    report_type: 'video_runtime_provider_abstraction_report',
    report_version: 'v1',
    export_path: PROVIDER_REPORT_PATH,
    schema_path: PROVIDER_SCHEMA_PATH,
    registry_path: PROVIDER_REGISTRY_PATH,
    upstream_report_path: STUB_EXECUTION_REPORT_PATH,
    seed_payload_ids: SEED_GPU_PAYLOAD_SPECS.map((s) => s.gpu_payload_id),
    pipeline_chain:
      'Scene State → Video Shot State → Keyframe Plan → Motion Plan → GPU Render Payload → Video Runtime Interface → Stub Execution → Provider Abstraction',
    next_phase: 'PHASE-26 LOCAL_GPU_RUNTIME_PREFLIGHT_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROVIDER_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return report;
}
