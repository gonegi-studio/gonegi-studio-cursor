import fs from 'node:fs';
import path from 'node:path';
import {
  RUNTIME_INTERFACE_COMPILER_PASS_VERDICT,
  RUNTIME_INTERFACE_COMPILER_REPORT_PATH,
} from './gonegiRuntimeInterfaceValidator.js';
import {
  STUB_EXECUTION_PHASE,
  GONEGI_RUNTIME_JOB_REGISTRY_PATH,
  GONEGI_RUNTIME_JOB_SCHEMA_PATH,
  GONEGI_RUNTIME_JOBS_DIR,
  SEED_GONEGI_RUNTIME_JOB_SPECS,
  type GonegiRuntimeJob,
  loadGonegiRuntimeJob,
} from './gonegiRuntimeStubExecutor.js';
import { loadGonegiRuntimeInterface } from './gonegiGpuPayloadToRuntimeInterfaceCompiler.js';
import { GONEGI_GPU_PAYLOADS_DIR, loadGonegiGpuPayload } from './gonegiMotionToGpuPayloadCompiler.js';
import { PROVIDER_REGISTRY_PATH } from './videoRuntimeProviderRegistry.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const STUB_EXECUTION_PASS_VERDICT = 'PASS_GONEGI_RUNTIME_STUB_EXECUTION_V2' as const;
export const STUB_EXECUTION_FAIL_VERDICT = 'FAIL_GONEGI_RUNTIME_STUB_EXECUTION_V2' as const;
export const STUB_EXECUTION_REPORT_PATH = 'reports/gonegi-runtime-stub-execution-report.json' as const;
export const STUB_EXECUTION_MD_PATH = 'reports/GONEGI_RUNTIME_STUB_EXECUTION.md' as const;

export type GonegiRuntimeJobValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  gonegi_runtime_job_id?: string;
};

export type GonegiRuntimeJobValidationResult = {
  gonegi_runtime_job_id: string;
  runtime_interface_id: string;
  status: 'PASS' | 'FAIL';
  issues: GonegiRuntimeJobValidationIssue[];
};

export type GonegiRuntimeStubExecutionReport = {
  report_id: string;
  phase: typeof STUB_EXECUTION_PHASE;
  timestamp: string;
  jobs: number;
  completed: number;
  failed: number;
  identity_locks: 'PASS' | 'FAIL';
  continuity: 'PASS' | 'FAIL';
  provider_safety: 'PASS' | 'FAIL';
  provider_activation: false;
  registry: 'PASS' | 'FAIL';
  job_validations: GonegiRuntimeJobValidationResult[];
  design_only: true;
  gpu_execution: false;
  simulation_only: true;
  final_verdict: typeof STUB_EXECUTION_PASS_VERDICT | typeof STUB_EXECUTION_FAIL_VERDICT;
  issues: GonegiRuntimeJobValidationIssue[];
};

function executionFlagsSafe(job: GonegiRuntimeJob): boolean {
  const flags = job.execution_flags;
  return (
    flags.design_only === true &&
    flags.gpu_execution === false &&
    flags.external_call_allowed === false &&
    flags.provider_activation === false &&
    flags.simulation_only === true &&
    flags.frame_extraction === false &&
    flags.ocr === false &&
    flags.generation === false
  );
}

function validateJob(job: GonegiRuntimeJob, projectRoot: string): GonegiRuntimeJobValidationResult {
  const issues: GonegiRuntimeJobValidationIssue[] = [];

  const iface = loadGonegiRuntimeInterface(projectRoot, job.runtime_interface_id);
  if (!iface) {
    issues.push({
      code: 'RUNTIME_INTERFACE_MISSING',
      message: `Runtime interface ${job.runtime_interface_id} not found`,
      severity: 'error',
      gonegi_runtime_job_id: job.gonegi_runtime_job_id,
    });
  }

  const payload = loadGonegiGpuPayload(projectRoot, job.source_gpu_payload_id);
  if (!payload) {
    issues.push({
      code: 'GPU_PAYLOAD_MISSING',
      message: `GPU payload ${job.source_gpu_payload_id} not found`,
      severity: 'error',
      gonegi_runtime_job_id: job.gonegi_runtime_job_id,
    });
  }

  if (iface && payload) {
    const expectedPath = `${GONEGI_GPU_PAYLOADS_DIR}/${payload.gonegi_gpu_payload_id}.json`;
    if (iface.input_contract.artifact_path !== expectedPath) {
      issues.push({
        code: 'PAYLOAD_LINK_INVALID',
        message: 'Runtime interface payload link does not match GPU payload path',
        severity: 'error',
        gonegi_runtime_job_id: job.gonegi_runtime_job_id,
      });
    }

    if (job.payload_alignment_result !== 'PASS') {
      issues.push({
        code: 'PAYLOAD_ALIGNMENT_FAIL',
        message: 'payload_alignment_result must be PASS',
        severity: 'error',
        gonegi_runtime_job_id: job.gonegi_runtime_job_id,
      });
    }

    for (const lock of iface.identity_lock_contract.identity_locks) {
      if (!payload.identity_locks.includes(lock)) {
        issues.push({
          code: 'IDENTITY_LOCK_NOT_PRESERVED',
          message: `Identity lock missing from payload: ${lock}`,
          severity: 'error',
          gonegi_runtime_job_id: job.gonegi_runtime_job_id,
        });
        break;
      }
    }

    if (job.identity_lock_result !== 'PASS') {
      issues.push({
        code: 'IDENTITY_LOCK_RESULT_FAIL',
        message: 'identity_lock_result must be PASS',
        severity: 'error',
        gonegi_runtime_job_id: job.gonegi_runtime_job_id,
      });
    }

    for (const lock of iface.continuity_lock_contract.location_locks) {
      if (!payload.continuity_locks.location_locks.includes(lock)) {
        issues.push({
          code: 'CONTINUITY_LOCK_NOT_PRESERVED',
          message: 'Continuity location lock missing from payload',
          severity: 'error',
          gonegi_runtime_job_id: job.gonegi_runtime_job_id,
        });
        break;
      }
    }

    if (job.continuity_lock_result !== 'PASS') {
      issues.push({
        code: 'CONTINUITY_LOCK_RESULT_FAIL',
        message: 'continuity_lock_result must be PASS',
        severity: 'error',
        gonegi_runtime_job_id: job.gonegi_runtime_job_id,
      });
    }
  }

  const providerRegistryPath = path.join(projectRoot, PROVIDER_REGISTRY_PATH);
  if (fs.existsSync(providerRegistryPath)) {
    const registry = JSON.parse(fs.readFileSync(providerRegistryPath, 'utf8')) as {
      providers?: Array<{ provider_id: string }>;
    };
    const providerIds = new Set((registry.providers ?? []).map((p) => p.provider_id));
    if (!providerIds.has(job.provider_id)) {
      issues.push({
        code: 'PROVIDER_NOT_FOUND',
        message: `Provider ${job.provider_id} not found in registry`,
        severity: 'error',
        gonegi_runtime_job_id: job.gonegi_runtime_job_id,
      });
    }
  }

  if (job.provider_safety_result !== 'PASS') {
    issues.push({
      code: 'PROVIDER_SAFETY_FAIL',
      message: 'provider_safety_result must be PASS',
      severity: 'error',
      gonegi_runtime_job_id: job.gonegi_runtime_job_id,
    });
  }

  if (!executionFlagsSafe(job)) {
    issues.push({
      code: 'EXECUTION_FLAGS_UNSAFE',
      message: 'execution_flags must be simulation-only with no provider activation',
      severity: 'error',
      gonegi_runtime_job_id: job.gonegi_runtime_job_id,
    });
  }

  if (job.simulated_output.generated !== false) {
    issues.push({
      code: 'OUTPUT_GENERATED',
      message: 'simulated_output.generated must be false',
      severity: 'error',
      gonegi_runtime_job_id: job.gonegi_runtime_job_id,
    });
  }

  if (job.job_state !== 'SIMULATED_COMPLETE') {
    issues.push({
      code: 'JOB_NOT_COMPLETE',
      message: `Expected job_state SIMULATED_COMPLETE, got ${job.job_state}`,
      severity: 'error',
      gonegi_runtime_job_id: job.gonegi_runtime_job_id,
    });
  }

  if (job.production_status.production_registry) {
    issues.push({
      code: 'PRODUCTION_REGISTRY_LEAK',
      message: 'gonegi runtime jobs must not register in production runtime job registry',
      severity: 'error',
      gonegi_runtime_job_id: job.gonegi_runtime_job_id,
    });
  }

  return {
    gonegi_runtime_job_id: job.gonegi_runtime_job_id,
    runtime_interface_id: job.runtime_interface_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

export function validateGonegiRuntimeJobs(projectRoot?: string): GonegiRuntimeStubExecutionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GonegiRuntimeJobValidationIssue[] = [];
  const timestamp = new Date().toISOString();
  const jobValidations: GonegiRuntimeJobValidationResult[] = [];
  const loadedJobs: GonegiRuntimeJob[] = [];

  const upstreamReportPath = path.join(root, RUNTIME_INTERFACE_COMPILER_REPORT_PATH);
  if (!fs.existsSync(upstreamReportPath)) {
    issues.push({
      code: 'UPSTREAM_REPORT_MISSING',
      message: `Missing upstream report: ${RUNTIME_INTERFACE_COMPILER_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const upstream = JSON.parse(fs.readFileSync(upstreamReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (upstream.final_verdict !== RUNTIME_INTERFACE_COMPILER_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_RUNTIME_INTERFACE_NOT_PASS',
        message: `Upstream runtime interface compiler must pass: ${RUNTIME_INTERFACE_COMPILER_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, GONEGI_RUNTIME_JOB_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing registry: ${GONEGI_RUNTIME_JOB_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      gonegi_runtime_jobs?: Array<{ gonegi_runtime_job_id: string }>;
    };
    const registryIds = new Set(
      (registry.gonegi_runtime_jobs ?? []).map((e) => e.gonegi_runtime_job_id)
    );
    registryStatus =
      SEED_GONEGI_RUNTIME_JOB_SPECS.every((s) => registryIds.has(s.gonegi_runtime_job_id)) &&
      registryIds.size === SEED_GONEGI_RUNTIME_JOB_SPECS.length
        ? 'PASS'
        : 'FAIL';
    if (registryStatus === 'FAIL') {
      issues.push({
        code: 'REGISTRY_INCOMPLETE',
        message: 'Registry must list exactly 4 gonegi runtime jobs',
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, GONEGI_RUNTIME_JOB_SCHEMA_PATH))) {
    issues.push({
      code: 'SCHEMA_MISSING',
      message: `Missing schema: ${GONEGI_RUNTIME_JOB_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  for (const spec of SEED_GONEGI_RUNTIME_JOB_SPECS) {
    const job = loadGonegiRuntimeJob(root, spec.gonegi_runtime_job_id);
    if (!job) {
      issues.push({
        code: 'MISSING_RUNTIME_JOB',
        message: `Missing runtime job ${spec.gonegi_runtime_job_id}`,
        severity: 'error',
        gonegi_runtime_job_id: spec.gonegi_runtime_job_id,
      });
      jobValidations.push({
        gonegi_runtime_job_id: spec.gonegi_runtime_job_id,
        runtime_interface_id: spec.runtime_interface_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_RUNTIME_JOB',
            message: `Missing runtime job ${spec.gonegi_runtime_job_id}`,
            severity: 'error',
            gonegi_runtime_job_id: spec.gonegi_runtime_job_id,
          },
        ],
      });
      continue;
    }

    loadedJobs.push(job);
    const validation = validateJob(job, root);
    jobValidations.push(validation);
    issues.push(...validation.issues);
  }

  const completed = loadedJobs.filter((j) => j.job_state === 'SIMULATED_COMPLETE').length;
  const failed = loadedJobs.filter((j) => j.job_state === 'SIMULATED_FAILED').length;

  let identityLocks: 'PASS' | 'FAIL' = 'FAIL';
  let continuity: 'PASS' | 'FAIL' = 'FAIL';
  let providerSafety: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedJobs.length === SEED_GONEGI_RUNTIME_JOB_SPECS.length) {
    identityLocks = loadedJobs.every((j) => j.identity_lock_result === 'PASS') ? 'PASS' : 'FAIL';
    continuity = loadedJobs.every((j) => j.continuity_lock_result === 'PASS') ? 'PASS' : 'FAIL';
    providerSafety = loadedJobs.every((j) => j.provider_safety_result === 'PASS') ? 'PASS' : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedJobs.length === SEED_GONEGI_RUNTIME_JOB_SPECS.length &&
    registryStatus === 'PASS' &&
    completed === 4 &&
    failed === 0 &&
    identityLocks === 'PASS' &&
    continuity === 'PASS' &&
    providerSafety === 'PASS'
      ? STUB_EXECUTION_PASS_VERDICT
      : STUB_EXECUTION_FAIL_VERDICT;

  return {
    report_id: 'gonegi-runtime-stub-execution-report-v1',
    phase: STUB_EXECUTION_PHASE,
    timestamp,
    jobs: loadedJobs.length,
    completed,
    failed,
    identity_locks: identityLocks,
    continuity: continuity,
    provider_safety: providerSafety,
    provider_activation: false,
    registry: registryStatus,
    job_validations: jobValidations,
    design_only: true,
    gpu_execution: false,
    simulation_only: true,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: GonegiRuntimeStubExecutionReport): string {
  const lines = [
    '# Gonegi Runtime Stub Execution Summary',
    '',
    `**Phase:** ${STUB_EXECUTION_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| jobs | ${report.jobs} |`,
    `| completed | ${report.completed} |`,
    `| failed | ${report.failed} |`,
    `| identity_locks | ${report.identity_locks} |`,
    `| continuity | ${report.continuity} |`,
    `| provider_safety | ${report.provider_safety} |`,
    `| provider_activation | ${report.provider_activation} |`,
    `| simulation_only | ${report.simulation_only} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Job States',
    '',
    'QUEUED → VALIDATING → READY → SIMULATED_RUNNING → SIMULATED_COMPLETE',
    '',
    '## Simulated Jobs',
    '',
    '| gonegi_runtime_job_id | runtime_interface_id |',
    '|-----------------------|----------------------|',
  ];

  for (const spec of SEED_GONEGI_RUNTIME_JOB_SPECS) {
    lines.push(`| ${spec.gonegi_runtime_job_id} | ${spec.runtime_interface_id} |`);
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push(
    'runtime interface → stub execution → simulated job result → future provider/runtime readiness'
  );
  lines.push('```', '');

  if (report.job_validations.length > 0) {
    lines.push('## Job Validations', '');
    for (const v of report.job_validations) {
      lines.push(`- **${v.gonegi_runtime_job_id}** ← ${v.runtime_interface_id}: ${v.status}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.gonegi_runtime_job_id ? ` (${issue.gonegi_runtime_job_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${GONEGI_RUNTIME_JOB_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${GONEGI_RUNTIME_JOB_REGISTRY_PATH}\``);
  lines.push(`- Jobs: \`${GONEGI_RUNTIME_JOBS_DIR}/\``);
  lines.push(`- Report: \`${STUB_EXECUTION_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeGonegiRuntimeStubExecutionReport(
  projectRoot?: string
): GonegiRuntimeStubExecutionReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateGonegiRuntimeJobs(root);

  fs.writeFileSync(
    path.join(root, STUB_EXECUTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, STUB_EXECUTION_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
