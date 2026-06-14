import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  PREFLIGHT_PASS_VERDICT,
  PREFLIGHT_REPORT_PATH,
} from './localGpuRuntimePreflight.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  buildSeedWiringDesigns,
  SEED_WIRING_SPECS,
  WIRING_REGISTRY_PATH,
  WIRING_SCHEMA_PATH,
  type ProviderWiringDesign,
  type ReadinessAwareRecommendation,
} from './videoProviderWiringDesigner.js';
import { getProviderById } from './videoRuntimeProviderRegistry.js';

export const WIRING_PASS_VERDICT = 'PASS_VIDEO_PROVIDER_WIRING_DESIGN_V1' as const;
export const WIRING_FAIL_VERDICT = 'FAIL_VIDEO_PROVIDER_WIRING_DESIGN_V1' as const;
export const WIRING_REPORT_PATH = 'reports/video-provider-wiring-design-report.json' as const;
export const WIRING_MD_PATH = 'reports/VIDEO_PROVIDER_WIRING_DESIGN.md' as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type WiringDesignValidation = {
  wiring_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type ProviderWiringDesignReport = {
  design_id: string;
  phase: 'PHASE-27-VIDEO-PROVIDER-WIRING-DESIGN-001';
  timestamp: string;
  machine_readiness: ReadinessAwareRecommendation['machine_readiness'];
  provider_wiring_count: number;
  local_provider_status: ReadinessAwareRecommendation['local_providers_status'];
  remote_provider_status: ReadinessAwareRecommendation['remote_providers_status'];
  recommended_future_path: string;
  activation_safety_status: 'PASS' | 'FAIL';
  wiring_designs: ProviderWiringDesign[];
  wiring_validations: WiringDesignValidation[];
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict: typeof WIRING_PASS_VERDICT | typeof WIRING_FAIL_VERDICT;
  issues: ValidationIssue[];
};

function validateUpstreamPreflight(projectRoot: string): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, PREFLIGHT_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM_REPORT',
      message: `Missing preflight report: ${PREFLIGHT_REPORT_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as { final_verdict?: string };
  if (report.final_verdict !== PREFLIGHT_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_NOT_PASS',
      message: `Preflight report must be ${PREFLIGHT_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return issues;
}

function validateRegistry(projectRoot: string, designs: ProviderWiringDesign[]): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, WIRING_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${WIRING_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = readJsonRecord(root, WIRING_REGISTRY_PATH) as {
    wiring_designs?: Array<{ wiring_id: string; design_path: string }>;
  } | null;

  if (!registry?.wiring_designs?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${WIRING_REGISTRY_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const builtIds = new Set(designs.map((d) => d.wiring_id));
  for (const entry of registry.wiring_designs) {
    if (!builtIds.has(entry.wiring_id)) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry missing built design: ${entry.wiring_id}`,
        severity: 'error',
      });
    }
    if (!fs.existsSync(path.join(root, entry.design_path))) {
      issues.push({
        code: 'MISSING_DESIGN_FILE',
        message: `Design file missing: ${entry.design_path}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function validateWiringDesign(
  projectRoot: string,
  design: ProviderWiringDesign,
  machineReadiness: ReadinessAwareRecommendation['machine_readiness']
): WiringDesignValidation {
  const issues: ValidationIssue[] = [];
  const provider = getProviderById(projectRoot, design.provider_id);

  if (!provider) {
    issues.push({
      code: 'PROVIDER_NOT_FOUND',
      message: `Provider not found: ${design.provider_id}`,
      severity: 'error',
    });
  }

  if (design.activation_status !== 'design_only') {
    issues.push({
      code: 'ACTIVATION_UNSAFE',
      message: 'activation_status must be design_only',
      severity: 'error',
    });
  }
  if (design.safety_contract.gpu_execution !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'gpu_execution must be false',
      severity: 'error',
    });
  }
  if (design.safety_contract.external_call_allowed !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'external_call_allowed must be false',
      severity: 'error',
    });
  }
  if (design.safety_contract.executable !== null) {
    issues.push({
      code: 'WIRING_ACTIVE',
      message: 'executable must be null',
      severity: 'error',
    });
  }
  if (design.safety_contract.endpoint !== null) {
    issues.push({
      code: 'WIRING_ACTIVE',
      message: 'endpoint must be null',
      severity: 'error',
    });
  }
  if (!design.output_contract.video_job_request_stub) {
    issues.push({
      code: 'CONTRACT_INCOMPLETE',
      message: 'output_contract.video_job_request_stub required',
      severity: 'error',
    });
  }
  if (!design.output_contract.expected_artifact_stub) {
    issues.push({
      code: 'CONTRACT_INCOMPLETE',
      message: 'output_contract.expected_artifact_stub required',
      severity: 'error',
    });
  }

  if (design.runtime_target === 'local' && machineReadiness === 'NOT_READY') {
    if (design.execution_status !== 'blocked_for_execution') {
      issues.push({
        code: 'READINESS_VIOLATION',
        message: 'NOT_READY machine must block local provider execution',
        severity: 'error',
      });
    }
    if (!design.safety_contract.local_execution_blocked) {
      issues.push({
        code: 'READINESS_VIOLATION',
        message: 'local_execution_blocked must be true on NOT_READY machine',
        severity: 'error',
      });
    }
  }

  if (design.runtime_target === 'remote') {
    if (design.execution_status !== 'design_only_possible') {
      issues.push({
        code: 'REMOTE_STATUS_INVALID',
        message: 'remote providers must be design_only_possible',
        severity: 'error',
      });
    }
  }

  return {
    wiring_id: design.wiring_id,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function renderWiringDesignMarkdown(report: ProviderWiringDesignReport): string {
  const designLines = report.wiring_designs
    .map(
      (d) =>
        `- **${d.wiring_id}** (\`${d.provider_id}\`): ${d.execution_status} · activation=${d.activation_status}`
    )
    .join('\n');

  return [
    '# Video Provider Wiring Design',
    '',
    '## Verdict',
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| **Verdict** | ${report.final_verdict} |`,
    `| **Machine readiness** | ${report.machine_readiness} |`,
    `| **Local provider status** | ${report.local_provider_status} |`,
    `| **Remote provider status** | ${report.remote_provider_status} |`,
    `| **Activation safety** | ${report.activation_safety_status} |`,
    `| **GPU execution** | ${report.gpu_execution} |`,
    `| **External calls** | ${report.external_call_allowed} |`,
    '',
    '## Recommended Future Path',
    '',
    report.recommended_future_path,
    '',
    '## Wiring Designs',
    '',
    designLines,
    '',
    '## Input / Output Contracts',
    '',
    'All designs accept:',
    '- GPU Render Payload (`datasets/gpu_payload/payloads/{gpu_payload_id}.json`)',
    '- Video Runtime Interface (`datasets/video_runtime/interfaces/{runtime_interface_id}.json`)',
    '- Provider ID',
    '',
    'All designs emit stub artifacts only:',
    '- `video_job_request_stub` — not submitted',
    '- `expected_artifact_stub` — not generated',
    '',
    '## Safety',
    '',
    '- Design only — no provider activation, no GPU execution, no network calls.',
    '- Local providers blocked on NOT_READY machines until hardware upgrade.',
    '- Remote GPU rental and commercial API paths remain design-only until PHASE-28.',
    '',
    `*Generated ${report.timestamp} · ${report.phase}*`,
    '',
  ].join('\n');
}

export function runProviderWiringValidation(projectRoot: string): ProviderWiringDesignReport {
  const root = resolveProjectRoot(projectRoot);
  const { designs, recommendation } = buildSeedWiringDesigns(root);

  const issues: ValidationIssue[] = [
    ...validateUpstreamPreflight(root),
    ...validateRegistry(root, designs),
  ];

  const wiring_validations = designs.map((d) =>
    validateWiringDesign(root, d, recommendation.machine_readiness)
  );
  issues.push(...wiring_validations.flatMap((v) => v.issues));

  const localDesigns = designs.filter((d) => d.runtime_target === 'local');
  const remoteDesigns = designs.filter((d) => d.runtime_target === 'remote');

  if (recommendation.machine_readiness === 'NOT_READY') {
    const localNotBlocked = localDesigns.some(
      (d) => d.execution_status !== 'blocked_for_execution'
    );
    if (localNotBlocked) {
      issues.push({
        code: 'LOCAL_NOT_BLOCKED',
        message: 'All local providers must be blocked_for_execution on NOT_READY machine',
        severity: 'error',
      });
    }
  }

  const remoteNotDesignOnly = remoteDesigns.some(
    (d) => d.execution_status !== 'design_only_possible'
  );
  if (remoteNotDesignOnly) {
    issues.push({
      code: 'REMOTE_NOT_DESIGN_ONLY',
      message: 'All remote providers must be design_only_possible',
      severity: 'error',
    });
  }

  const safetyFail = wiring_validations.some((v) => !v.valid);
  const errors = issues.filter((i) => i.severity === 'error');
  const pass =
    errors.length === 0 &&
    designs.length === SEED_WIRING_SPECS.length &&
    !safetyFail &&
    recommendation.local_providers_status ===
      (recommendation.machine_readiness === 'NOT_READY'
        ? 'blocked_for_execution'
        : recommendation.local_providers_status);

  return {
    design_id: `wiring_design_${Date.now().toString(36)}`,
    phase: 'PHASE-27-VIDEO-PROVIDER-WIRING-DESIGN-001',
    timestamp: new Date().toISOString(),
    machine_readiness: recommendation.machine_readiness,
    provider_wiring_count: designs.length,
    local_provider_status: recommendation.local_providers_status,
    remote_provider_status: recommendation.remote_providers_status,
    recommended_future_path: recommendation.recommended_future_path,
    activation_safety_status: safetyFail ? 'FAIL' : 'PASS',
    wiring_designs: designs,
    wiring_validations,
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? WIRING_PASS_VERDICT : WIRING_FAIL_VERDICT,
    issues,
  };
}

export function writeProviderWiringDesignReport(
  projectRoot: string
): ProviderWiringDesignReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runProviderWiringValidation(root);

  const payload = {
    ...report,
    report_type: 'video_provider_wiring_design_report',
    report_version: 'v1',
    export_path: WIRING_REPORT_PATH,
    markdown_path: WIRING_MD_PATH,
    schema_path: WIRING_SCHEMA_PATH,
    registry_path: WIRING_REGISTRY_PATH,
    upstream_report_path: PREFLIGHT_REPORT_PATH,
    pipeline_chain:
      'Local GPU Preflight → Provider Wiring Design',
    next_phase: 'PHASE-28 REMOTE_GPU_PROVIDER_SELECTION_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, WIRING_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, WIRING_MD_PATH),
    `${renderWiringDesignMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
