import fs from 'node:fs';
import path from 'node:path';
import {
  PIPELINE_AUDIT_PHASE,
  PIPELINE_CHAIN_SPECS,
  buildTraceMap,
  runSourceVideoToGonegiPipelineAudit,
  type SourceVideoToGonegiPipelineAudit,
} from './sourceVideoToGonegiPipelineAuditor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PIPELINE_AUDIT_PASS_VERDICT =
  'PASS_SOURCE_VIDEO_TO_GONEGI_PIPELINE_AUDIT_V1' as const;
export const PIPELINE_AUDIT_FAIL_VERDICT =
  'FAIL_SOURCE_VIDEO_TO_GONEGI_PIPELINE_AUDIT_V1' as const;
export const PIPELINE_AUDIT_REPORT_PATH =
  'reports/source-video-to-gonegi-pipeline-audit-report.json' as const;
export const PIPELINE_AUDIT_MD_PATH =
  'reports/SOURCE_VIDEO_TO_GONEGI_PIPELINE_AUDIT.md' as const;
export const PIPELINE_TRACE_MAP_PATH =
  'reports/source-video-to-gonegi-trace-map.json' as const;

export type PipelineAuditValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  chain_id?: string;
};

export type PipelineAuditValidationReport = SourceVideoToGonegiPipelineAudit & {
  chains: number;
  design_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  final_verdict:
    | typeof PIPELINE_AUDIT_PASS_VERDICT
    | typeof PIPELINE_AUDIT_FAIL_VERDICT;
};

function validatePipelineAudit(
  audit: SourceVideoToGonegiPipelineAudit
): PipelineAuditValidationIssue[] {
  const issues: PipelineAuditValidationIssue[] = [];

  if (audit.chain_traces.length !== 4) {
    issues.push({
      code: 'CHAIN_COUNT_MISMATCH',
      message: `Expected 4 chains, got ${audit.chain_traces.length}`,
      severity: 'error',
    });
  }

  if (audit.runtime_job_count !== 4) {
    issues.push({
      code: 'RUNTIME_JOB_COUNT_MISMATCH',
      message: `Expected 4 runtime jobs, got ${audit.runtime_job_count}`,
      severity: 'error',
    });
  }

  if (audit.missing_links.length > 0) {
    issues.push({
      code: 'MISSING_LINKS',
      message: `Found ${audit.missing_links.length} missing or broken links`,
      severity: 'error',
    });
  }

  if (audit.orphan_records.length > 0) {
    issues.push({
      code: 'ORPHAN_RECORDS',
      message: `Found ${audit.orphan_records.length} orphan records`,
      severity: 'error',
    });
  }

  if (audit.identity_status !== 'PASS') {
    issues.push({
      code: 'IDENTITY_FAIL',
      message: 'Identity locks not preserved across pipeline',
      severity: 'error',
    });
  }

  if (audit.continuity_status !== 'PASS') {
    issues.push({
      code: 'CONTINUITY_FAIL',
      message: 'Continuity locks not preserved across pipeline',
      severity: 'error',
    });
  }

  if (audit.traceability_status !== 'PASS') {
    issues.push({
      code: 'TRACEABILITY_FAIL',
      message: 'Translation or replacement trace not preserved',
      severity: 'error',
    });
  }

  if (audit.execution_safety_status !== 'PASS') {
    issues.push({
      code: 'EXECUTION_SAFETY_FAIL',
      message: 'Execution safety flags violated in pipeline',
      severity: 'error',
    });
  }

  if (audit.chain_status !== 'PASS') {
    issues.push({
      code: 'CHAIN_STATUS_FAIL',
      message: 'One or more pipeline chains failed link validation',
      severity: 'error',
    });
  }

  for (const trace of audit.chain_traces) {
    if (trace.link_status !== 'PASS') {
      issues.push({
        code: 'CHAIN_LINK_FAIL',
        message: `${trace.chain_id}: ${trace.issues.join('; ')}`,
        severity: 'error',
        chain_id: trace.chain_id,
      });
    }
  }

  const expectedCounts: Array<[keyof SourceVideoToGonegiPipelineAudit, number]> = [
    ['segment_count', 4],
    ['coordinate_count', 4],
    ['state_draft_count', 4],
    ['gonegi_state_count', 4],
    ['video_state_count', 4],
    ['keyframe_plan_count', 4],
    ['motion_plan_count', 4],
    ['gpu_payload_count', 4],
    ['runtime_interface_count', 4],
    ['runtime_job_count', 4],
  ];

  for (const [field, expected] of expectedCounts) {
    const actual = audit[field];
    if (typeof actual === 'number' && actual !== expected) {
      issues.push({
        code: 'STAGE_COUNT_MISMATCH',
        message: `${field} expected ${expected}, got ${actual}`,
        severity: 'error',
      });
    }
  }

  if (audit.source_count !== 15) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected 15 active source videos, got ${audit.source_count}`,
      severity: 'error',
    });
  }

  return issues;
}

function buildMarkdown(report: PipelineAuditValidationReport): string {
  const lines = [
    '# Source Video → Gonegi Pipeline Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| chains | ${report.chains} |`,
    `| source_count | ${report.source_count} |`,
    `| segment_count | ${report.segment_count} |`,
    `| coordinate_count | ${report.coordinate_count} |`,
    `| state_draft_count | ${report.state_draft_count} |`,
    `| gonegi_state_count | ${report.gonegi_state_count} |`,
    `| video_state_count | ${report.video_state_count} |`,
    `| keyframe_plan_count | ${report.keyframe_plan_count} |`,
    `| motion_plan_count | ${report.motion_plan_count} |`,
    `| gpu_payload_count | ${report.gpu_payload_count} |`,
    `| runtime_interface_count | ${report.runtime_interface_count} |`,
    `| runtime_job_count | ${report.runtime_job_count} |`,
    `| missing_links | ${report.missing_links.length} |`,
    `| orphan_records | ${report.orphan_records.length} |`,
    `| identity | ${report.identity_status} |`,
    `| continuity | ${report.continuity_status} |`,
    `| traceability | ${report.traceability_status} |`,
    `| execution_safety | ${report.execution_safety_status} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| design_only | ${report.design_only} |`,
    '',
    '## Pipeline Chain',
    '',
    '```',
    'source_video_final_set',
    '  → director_grammar',
    '  → director_blend',
    '  → video_state_defaults',
    '  → scene_segments',
    '  → source_video_coordinates',
    '  → source_video_state_drafts',
    '  → world_translation',
    '  → character_replacement',
    '  → gonegi_states',
    '  → gonegi_video_states',
    '  → gonegi_keyframe_plans',
    '  → gonegi_motion_plans',
    '  → gonegi_gpu_payloads',
    '  → gonegi_runtime_interfaces',
    '  → gonegi_runtime_jobs',
    '```',
    '',
    '## Chain Traces',
    '',
  ];

  for (const chain of PIPELINE_CHAIN_SPECS) {
    const trace = report.chain_traces.find((t) => t.chain_id === chain.chain_id);
    lines.push(`### ${chain.chain_id}`);
    lines.push('');
    lines.push(
      `${chain.source_video_id} → ${chain.segment_id} → ${chain.coordinate_record_id} → ${chain.state_draft_id} → ${chain.gonegi_state_id} → ${chain.gonegi_video_state_id} → ${chain.keyframe_plan_id} → ${chain.motion_plan_id} → ${chain.gpu_payload_id} → ${chain.runtime_interface_id} → ${chain.runtime_job_id}`
    );
    lines.push('');
    lines.push(`- link_status: ${trace?.link_status ?? 'UNKNOWN'}`);
    if (trace?.issues.length) {
      for (const issue of trace.issues) {
        lines.push(`- issue: ${issue}`);
      }
    }
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
    lines.push('');
  }

  lines.push('## Artifacts', '');
  lines.push(`- Report: \`${PIPELINE_AUDIT_REPORT_PATH}\``);
  lines.push(`- Trace map: \`${PIPELINE_TRACE_MAP_PATH}\``);

  return lines.join('\n');
}

export function writeSourceVideoToGonegiPipelineAuditReport(
  projectRoot?: string
): PipelineAuditValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const audit = runSourceVideoToGonegiPipelineAudit(root);
  const validationIssues = validatePipelineAudit(audit);
  const allIssues = [...audit.issues, ...validationIssues];

  const pass =
    audit.chain_status === 'PASS' &&
    audit.runtime_job_count === 4 &&
    audit.missing_links.length === 0 &&
    audit.orphan_records.length === 0 &&
    audit.identity_status === 'PASS' &&
    audit.continuity_status === 'PASS' &&
    audit.traceability_status === 'PASS' &&
    audit.execution_safety_status === 'PASS' &&
    validationIssues.filter((i) => i.severity === 'error').length === 0;

  const report: PipelineAuditValidationReport = {
    ...audit,
    chains: audit.chain_traces.length,
    design_only: true,
    gpu_execution: false,
    external_call_allowed: false,
    final_verdict: pass ? PIPELINE_AUDIT_PASS_VERDICT : PIPELINE_AUDIT_FAIL_VERDICT,
    issues: allIssues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const reportPayload = {
    report_id: report.report_id,
    phase: report.phase,
    timestamp: report.timestamp,
    chain_status: report.chain_status,
    source_count: report.source_count,
    segment_count: report.segment_count,
    coordinate_count: report.coordinate_count,
    state_draft_count: report.state_draft_count,
    gonegi_state_count: report.gonegi_state_count,
    video_state_count: report.video_state_count,
    keyframe_plan_count: report.keyframe_plan_count,
    motion_plan_count: report.motion_plan_count,
    gpu_payload_count: report.gpu_payload_count,
    runtime_interface_count: report.runtime_interface_count,
    runtime_job_count: report.runtime_job_count,
    identity_status: report.identity_status,
    continuity_status: report.continuity_status,
    traceability_status: report.traceability_status,
    execution_safety_status: report.execution_safety_status,
    missing_links: report.missing_links,
    orphan_records: report.orphan_records,
    chains: report.chains,
    design_only: report.design_only,
    gpu_execution: report.gpu_execution,
    external_call_allowed: report.external_call_allowed,
    final_verdict: report.final_verdict,
    stage_statuses: report.stage_statuses,
    chain_traces: report.chain_traces,
    issues: report.issues,
  };

  fs.writeFileSync(
    path.join(root, PIPELINE_AUDIT_REPORT_PATH),
    `${JSON.stringify(reportPayload, null, 2)}\n`,
    'utf8'
  );

  fs.writeFileSync(path.join(root, PIPELINE_TRACE_MAP_PATH), `${JSON.stringify(buildTraceMap(audit), null, 2)}\n`, 'utf8');

  fs.writeFileSync(path.join(root, PIPELINE_AUDIT_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
