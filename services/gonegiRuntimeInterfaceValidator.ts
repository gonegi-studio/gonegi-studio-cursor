import fs from 'node:fs';
import path from 'node:path';
import {
  GPU_PAYLOAD_COMPILER_PASS_VERDICT,
  GPU_PAYLOAD_COMPILER_REPORT_PATH,
} from './gonegiGpuPayloadValidator.js';
import {
  RUNTIME_INTERFACE_COMPILER_PHASE,
  GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH,
  GONEGI_RUNTIME_INTERFACE_SCHEMA_PATH,
  GONEGI_RUNTIME_INTERFACES_DIR,
  PROVIDER_WIRING_REGISTRY_PATH,
  SEED_GONEGI_RUNTIME_INTERFACE_SPECS,
  type GonegiRuntimeInterface,
  loadGonegiRuntimeInterface,
} from './gonegiGpuPayloadToRuntimeInterfaceCompiler.js';
import { GONEGI_GPU_PAYLOADS_DIR, loadGonegiGpuPayload } from './gonegiMotionToGpuPayloadCompiler.js';
import { PROVIDER_REGISTRY_PATH } from './videoRuntimeProviderRegistry.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RUNTIME_INTERFACE_COMPILER_PASS_VERDICT =
  'PASS_GONEGI_GPU_PAYLOAD_TO_RUNTIME_INTERFACE_V2' as const;
export const RUNTIME_INTERFACE_COMPILER_FAIL_VERDICT =
  'FAIL_GONEGI_GPU_PAYLOAD_TO_RUNTIME_INTERFACE_V2' as const;
export const RUNTIME_INTERFACE_COMPILER_REPORT_PATH =
  'reports/gonegi-gpu-payload-to-runtime-interface-report.json' as const;
export const RUNTIME_INTERFACE_COMPILER_MD_PATH =
  'reports/GONEGI_GPU_PAYLOAD_TO_RUNTIME_INTERFACE.md' as const;

export type GonegiRuntimeInterfaceValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  gonegi_runtime_interface_id?: string;
};

export type GonegiRuntimeInterfaceValidationResult = {
  gonegi_runtime_interface_id: string;
  source_gpu_payload_id: string;
  status: 'PASS' | 'FAIL';
  issues: GonegiRuntimeInterfaceValidationIssue[];
};

export type GonegiGpuPayloadToRuntimeInterfaceReport = {
  report_id: string;
  phase: typeof RUNTIME_INTERFACE_COMPILER_PHASE;
  timestamp: string;
  runtime_interfaces: number;
  payload_links: 'PASS' | 'FAIL';
  provider_hints: 'PASS' | 'FAIL';
  identity_locks: 'PASS' | 'FAIL';
  continuity: 'PASS' | 'FAIL';
  execution_safety: 'PASS' | 'FAIL';
  provider_activation: false;
  registry: 'PASS' | 'FAIL';
  interface_validations: GonegiRuntimeInterfaceValidationResult[];
  design_only: true;
  gpu_execution: false;
  final_verdict:
    | typeof RUNTIME_INTERFACE_COMPILER_PASS_VERDICT
    | typeof RUNTIME_INTERFACE_COMPILER_FAIL_VERDICT;
  issues: GonegiRuntimeInterfaceValidationIssue[];
};

function locksPreserved(
  source: { identity_locks: string[]; location_locks: string[]; composition_locks?: string[] },
  target: { identity_locks: string[]; location_locks: string[]; composition_locks?: string[] }
): boolean {
  for (const lock of source.identity_locks) {
    if (!target.identity_locks.includes(lock)) return false;
  }
  for (const lock of source.location_locks) {
    if (!target.location_locks.includes(lock)) return false;
  }
  for (const lock of source.composition_locks ?? []) {
    if (!(target.composition_locks ?? []).includes(lock)) return false;
  }
  return true;
}

function executionFlagsSafe(iface: GonegiRuntimeInterface): boolean {
  const flags = iface.execution_flags;
  return (
    flags.design_only === true &&
    flags.gpu_execution === false &&
    flags.external_call_allowed === false &&
    flags.provider_activation === false &&
    flags.preparation_only === true &&
    flags.frame_extraction === false &&
    flags.ocr === false &&
    flags.generation === false
  );
}

function providerHintValid(
  iface: GonegiRuntimeInterface,
  projectRoot: string
): GonegiRuntimeInterfaceValidationIssue[] {
  const issues: GonegiRuntimeInterfaceValidationIssue[] = [];
  const hint = iface.provider_hint;

  if (hint.provider_activation !== false) {
    issues.push({
      code: 'PROVIDER_ACTIVATION_ENABLED',
      message: 'provider_hint.provider_activation must be false',
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }

  const providerRegistryPath = path.join(projectRoot, PROVIDER_REGISTRY_PATH);
  if (fs.existsSync(providerRegistryPath)) {
    const registry = JSON.parse(fs.readFileSync(providerRegistryPath, 'utf8')) as {
      providers?: Array<{ provider_id: string }>;
    };
    const providerIds = new Set((registry.providers ?? []).map((p) => p.provider_id));
    if (!providerIds.has(hint.mapped_provider_id)) {
      issues.push({
        code: 'MAPPED_PROVIDER_INVALID',
        message: `mapped_provider_id ${hint.mapped_provider_id} not found in provider registry`,
        severity: 'error',
        gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
      });
    }
  }

  const wiringRegistryPath = path.join(projectRoot, PROVIDER_WIRING_REGISTRY_PATH);
  if (fs.existsSync(wiringRegistryPath)) {
    const wiringRegistry = JSON.parse(fs.readFileSync(wiringRegistryPath, 'utf8')) as {
      wiring_designs?: Array<{ wiring_id: string; provider_id: string }>;
    };
    const wiring = (wiringRegistry.wiring_designs ?? []).find(
      (w) => w.wiring_id === hint.wiring_id
    );
    if (!wiring) {
      issues.push({
        code: 'WIRING_ID_INVALID',
        message: `wiring_id ${hint.wiring_id} not found in provider wiring registry`,
        severity: 'error',
        gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
      });
    } else if (wiring.provider_id !== hint.mapped_provider_id) {
      issues.push({
        code: 'WIRING_PROVIDER_MISMATCH',
        message: 'wiring_id must reference mapped_provider_id',
        severity: 'error',
        gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
      });
    }
  }

  return issues;
}

function validateInterface(
  iface: GonegiRuntimeInterface,
  projectRoot: string
): GonegiRuntimeInterfaceValidationResult {
  const issues: GonegiRuntimeInterfaceValidationIssue[] = [];

  const payload = loadGonegiGpuPayload(projectRoot, iface.source_gpu_payload_id);
  if (!payload) {
    issues.push({
      code: 'SOURCE_PAYLOAD_MISSING',
      message: `Gonegi GPU payload ${iface.source_gpu_payload_id} not found`,
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }

  issues.push(...providerHintValid(iface, projectRoot));

  const input = iface.input_contract;
  if (
    !input.artifact_type ||
    !input.artifact_path ||
    !input.payload_schema ||
    !input.required_fields?.length
  ) {
    issues.push({
      code: 'INPUT_CONTRACT_INCOMPLETE',
      message: 'input_contract must be complete',
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }
  if (input.submission_allowed !== false) {
    issues.push({
      code: 'INPUT_SUBMISSION_ALLOWED',
      message: 'input_contract.submission_allowed must be false',
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }

  const output = iface.output_contract;
  if (!output.artifact_type || !output.output_path || !output.format) {
    issues.push({
      code: 'OUTPUT_CONTRACT_INCOMPLETE',
      message: 'output_contract must be complete',
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }
  if (output.generation_allowed !== false) {
    issues.push({
      code: 'OUTPUT_GENERATION_ALLOWED',
      message: 'output_contract.generation_allowed must be false',
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }

  const handshake = iface.handshake_contract;
  if (
    !handshake.payload_schema_version ||
    !handshake.reference_runtime_schema ||
    !handshake.preflight_checks?.length ||
    handshake.identity_lock_count < 1
  ) {
    issues.push({
      code: 'HANDSHAKE_CONTRACT_MISSING',
      message: 'handshake_contract must be present and complete',
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }

  if (payload) {
    const expectedPath = `${GONEGI_GPU_PAYLOADS_DIR}/${payload.gonegi_gpu_payload_id}.json`;
    if (iface.input_contract.artifact_path !== expectedPath) {
      issues.push({
        code: 'PAYLOAD_LINK_MISMATCH',
        message: 'input_contract.artifact_path must match source GPU payload path',
        severity: 'error',
        gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
      });
    }

    const sourceIdentity = new Set(payload.identity_locks);
    for (const lock of iface.identity_lock_contract.identity_locks) {
      if (!sourceIdentity.has(lock)) {
        issues.push({
          code: 'IDENTITY_LOCK_NOT_PRESERVED',
          message: `identity lock missing from source payload: ${lock}`,
          severity: 'error',
          gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
        });
        break;
      }
    }

    if (iface.identity_lock_contract.lock_count !== payload.identity_locks.length) {
      issues.push({
        code: 'IDENTITY_LOCK_COUNT_MISMATCH',
        message: 'identity_lock_contract.lock_count must match source payload',
        severity: 'error',
        gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
      });
    }

    if (!locksPreserved(payload.continuity_locks, iface.continuity_lock_contract)) {
      issues.push({
        code: 'CONTINUITY_LOCKS_NOT_PRESERVED',
        message: 'continuity_lock_contract must preserve all locks from source payload',
        severity: 'error',
        gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
      });
    }

    if (handshake.identity_lock_count !== payload.identity_locks.length) {
      issues.push({
        code: 'HANDSHAKE_LOCK_COUNT_MISMATCH',
        message: 'handshake_contract.identity_lock_count must match source payload',
        severity: 'error',
        gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
      });
    }
  }

  if (!executionFlagsSafe(iface)) {
    issues.push({
      code: 'EXECUTION_FLAGS_UNSAFE',
      message: 'execution_flags must be design-only with no provider activation',
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }

  if (iface.readiness_status !== 'design_only_not_wired') {
    issues.push({
      code: 'READINESS_NOT_DESIGN_ONLY',
      message: 'readiness_status must be design_only_not_wired',
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }

  if (iface.production_status.production_registry) {
    issues.push({
      code: 'PRODUCTION_REGISTRY_LEAK',
      message: 'gonegi runtime interfaces must not register in production runtime registry',
      severity: 'error',
      gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    });
  }

  return {
    gonegi_runtime_interface_id: iface.gonegi_runtime_interface_id,
    source_gpu_payload_id: iface.source_gpu_payload_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

export function validateGonegiRuntimeInterfaces(
  projectRoot?: string
): GonegiGpuPayloadToRuntimeInterfaceReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GonegiRuntimeInterfaceValidationIssue[] = [];
  const timestamp = new Date().toISOString();
  const interfaceValidations: GonegiRuntimeInterfaceValidationResult[] = [];
  const loadedInterfaces: GonegiRuntimeInterface[] = [];

  const upstreamReportPath = path.join(root, GPU_PAYLOAD_COMPILER_REPORT_PATH);
  if (!fs.existsSync(upstreamReportPath)) {
    issues.push({
      code: 'UPSTREAM_REPORT_MISSING',
      message: `Missing upstream report: ${GPU_PAYLOAD_COMPILER_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const upstream = JSON.parse(fs.readFileSync(upstreamReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (upstream.final_verdict !== GPU_PAYLOAD_COMPILER_PASS_VERDICT) {
      issues.push({
        code: 'UPSTREAM_GPU_PAYLOAD_COMPILER_NOT_PASS',
        message: `Upstream GPU payload compiler must pass: ${GPU_PAYLOAD_COMPILER_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  let registryStatus: 'PASS' | 'FAIL' = 'FAIL';
  const registryPath = path.join(root, GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH);
  if (!fs.existsSync(registryPath)) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing registry: ${GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH}`,
      severity: 'error',
    });
  } else {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
      gonegi_runtime_interfaces?: Array<{ gonegi_runtime_interface_id: string }>;
    };
    const registryIds = new Set(
      (registry.gonegi_runtime_interfaces ?? []).map((e) => e.gonegi_runtime_interface_id)
    );
    registryStatus =
      SEED_GONEGI_RUNTIME_INTERFACE_SPECS.every((s) =>
        registryIds.has(s.gonegi_runtime_interface_id)
      ) && registryIds.size === SEED_GONEGI_RUNTIME_INTERFACE_SPECS.length
        ? 'PASS'
        : 'FAIL';
    if (registryStatus === 'FAIL') {
      issues.push({
        code: 'REGISTRY_INCOMPLETE',
        message: 'Registry must list exactly 4 gonegi runtime interfaces',
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, GONEGI_RUNTIME_INTERFACE_SCHEMA_PATH))) {
    issues.push({
      code: 'SCHEMA_MISSING',
      message: `Missing schema: ${GONEGI_RUNTIME_INTERFACE_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  for (const spec of SEED_GONEGI_RUNTIME_INTERFACE_SPECS) {
    const iface = loadGonegiRuntimeInterface(root, spec.gonegi_runtime_interface_id);
    if (!iface) {
      issues.push({
        code: 'MISSING_RUNTIME_INTERFACE',
        message: `Missing runtime interface ${spec.gonegi_runtime_interface_id}`,
        severity: 'error',
        gonegi_runtime_interface_id: spec.gonegi_runtime_interface_id,
      });
      interfaceValidations.push({
        gonegi_runtime_interface_id: spec.gonegi_runtime_interface_id,
        source_gpu_payload_id: spec.source_gpu_payload_id,
        status: 'FAIL',
        issues: [
          {
            code: 'MISSING_RUNTIME_INTERFACE',
            message: `Missing runtime interface ${spec.gonegi_runtime_interface_id}`,
            severity: 'error',
            gonegi_runtime_interface_id: spec.gonegi_runtime_interface_id,
          },
        ],
      });
      continue;
    }

    loadedInterfaces.push(iface);
    const validation = validateInterface(iface, root);
    interfaceValidations.push(validation);
    issues.push(...validation.issues);
  }

  let payloadLinks: 'PASS' | 'FAIL' = 'FAIL';
  let providerHints: 'PASS' | 'FAIL' = 'FAIL';
  let identityLocks: 'PASS' | 'FAIL' = 'FAIL';
  let continuity: 'PASS' | 'FAIL' = 'FAIL';
  let executionSafety: 'PASS' | 'FAIL' = 'FAIL';

  if (loadedInterfaces.length === SEED_GONEGI_RUNTIME_INTERFACE_SPECS.length) {
    payloadLinks = loadedInterfaces.every((iface) => {
      const payload = loadGonegiGpuPayload(root, iface.source_gpu_payload_id);
      if (!payload) return false;
      return (
        iface.input_contract.artifact_path ===
        `${GONEGI_GPU_PAYLOADS_DIR}/${payload.gonegi_gpu_payload_id}.json`
      );
    })
      ? 'PASS'
      : 'FAIL';

    providerHints = loadedInterfaces.every((iface) => {
      const hintIssues = providerHintValid(iface, root);
      return hintIssues.length === 0 && iface.provider_hint.provider_activation === false;
    })
      ? 'PASS'
      : 'FAIL';

    identityLocks = loadedInterfaces.every((iface) => {
      const payload = loadGonegiGpuPayload(root, iface.source_gpu_payload_id);
      if (!payload) return false;
      return payload.identity_locks.every((lock) =>
        iface.identity_lock_contract.identity_locks.includes(lock)
      );
    })
      ? 'PASS'
      : 'FAIL';

    continuity = loadedInterfaces.every((iface) => {
      const payload = loadGonegiGpuPayload(root, iface.source_gpu_payload_id);
      return payload
        ? locksPreserved(payload.continuity_locks, iface.continuity_lock_contract)
        : false;
    })
      ? 'PASS'
      : 'FAIL';

    executionSafety = loadedInterfaces.every(
      (iface) =>
        executionFlagsSafe(iface) &&
        iface.provider_hint.provider_activation === false &&
        iface.execution_flags.provider_activation === false
    )
      ? 'PASS'
      : 'FAIL';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const final_verdict =
    errors.length === 0 &&
    loadedInterfaces.length === SEED_GONEGI_RUNTIME_INTERFACE_SPECS.length &&
    registryStatus === 'PASS' &&
    payloadLinks === 'PASS' &&
    providerHints === 'PASS' &&
    identityLocks === 'PASS' &&
    continuity === 'PASS' &&
    executionSafety === 'PASS'
      ? RUNTIME_INTERFACE_COMPILER_PASS_VERDICT
      : RUNTIME_INTERFACE_COMPILER_FAIL_VERDICT;

  return {
    report_id: 'gonegi-gpu-payload-to-runtime-interface-report-v1',
    phase: RUNTIME_INTERFACE_COMPILER_PHASE,
    timestamp,
    runtime_interfaces: loadedInterfaces.length,
    payload_links: payloadLinks,
    provider_hints: providerHints,
    identity_locks: identityLocks,
    continuity: continuity,
    execution_safety: executionSafety,
    provider_activation: false,
    registry: registryStatus,
    interface_validations: interfaceValidations,
    design_only: true,
    gpu_execution: false,
    final_verdict,
    issues,
  };
}

function buildMarkdown(report: GonegiGpuPayloadToRuntimeInterfaceReport): string {
  const lines = [
    '# Gonegi GPU Payload to Runtime Interface Summary',
    '',
    `**Phase:** ${RUNTIME_INTERFACE_COMPILER_PHASE}`,
    `**Verdict:** ${report.final_verdict}`,
    `**Timestamp:** ${report.timestamp}`,
    '',
    '## Pass Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| runtime_interfaces | ${report.runtime_interfaces} |`,
    `| payload_links | ${report.payload_links} |`,
    `| provider_hints | ${report.provider_hints} |`,
    `| identity_locks | ${report.identity_locks} |`,
    `| continuity | ${report.continuity} |`,
    `| execution_safety | ${report.execution_safety} |`,
    `| provider_activation | ${report.provider_activation} |`,
    `| design_only | ${report.design_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    '',
    '## Execution Flags',
    '',
    '- `gpu_execution=false`',
    '- `external_call_allowed=false`',
    '- `provider_activation=false`',
    '- `preparation_only=true`',
    '',
    '## Compiled Runtime Interfaces',
    '',
    '| gonegi_runtime_interface_id | source_gpu_payload_id |',
    '|---------------------------|------------------------|',
  ];

  for (const spec of SEED_GONEGI_RUNTIME_INTERFACE_SPECS) {
    lines.push(`| ${spec.gonegi_runtime_interface_id} | ${spec.source_gpu_payload_id} |`);
  }

  lines.push('', '## Pipeline Chain', '', '```');
  lines.push(
    'gonegi gpu payload → runtime interface → provider selection → stub execution → future video generation'
  );
  lines.push('```', '');

  if (report.interface_validations.length > 0) {
    lines.push('## Interface Validations', '');
    for (const v of report.interface_validations) {
      lines.push(`- **${v.gonegi_runtime_interface_id}** ← ${v.source_gpu_payload_id}: ${v.status}`);
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(
        `- [${issue.severity}] **${issue.code}**${issue.gonegi_runtime_interface_id ? ` (${issue.gonegi_runtime_interface_id})` : ''}: ${issue.message}`
      );
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Schema: \`${GONEGI_RUNTIME_INTERFACE_SCHEMA_PATH}\``);
  lines.push(`- Registry: \`${GONEGI_RUNTIME_INTERFACE_REGISTRY_PATH}\``);
  lines.push(`- Interfaces: \`${GONEGI_RUNTIME_INTERFACES_DIR}/\``);
  lines.push(`- Report: \`${RUNTIME_INTERFACE_COMPILER_REPORT_PATH}\``);
  lines.push('');

  return lines.join('\n');
}

export function writeGonegiRuntimeInterfaceReport(
  projectRoot?: string
): GonegiGpuPayloadToRuntimeInterfaceReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateGonegiRuntimeInterfaces(root);

  fs.writeFileSync(
    path.join(root, RUNTIME_INTERFACE_COMPILER_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, RUNTIME_INTERFACE_COMPILER_MD_PATH), buildMarkdown(report), 'utf8');

  return report;
}
