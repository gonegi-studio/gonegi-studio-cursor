import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { runAdapterAudit } from './auditors/adapterAuditor.js';
import { runContinuityAudit } from './auditors/continuityAuditor.js';
export {
  PROJECT_AUDITOR_BASELINE_PATH,
  PROJECT_AUDITOR_FAIL_VERDICT,
  PROJECT_AUDITOR_PASS_VERDICT,
  PROJECT_AUDITOR_PHASE,
  PROJECT_AUDITOR_REPORT_PATH,
} from './auditors/auditorShared.js';

import {
  CANONICAL_FIELD_PRIORITY,
  PROJECT_AUDITOR_BASELINE_PATH,
  PROJECT_AUDITOR_FAIL_VERDICT,
  PROJECT_AUDITOR_PASS_VERDICT,
  PROJECT_AUDITOR_PHASE,
  PROJECT_AUDITOR_REPORT_PATH,
  type AuditError,
  type AuditWarning,
  type RiskLevelLabel,
  collectScanInventory,
  riskLevelFromScore,
} from './auditors/auditorShared.js';
import {
  REQUIRED_DATASET_PAIRS,
  REQUIRED_STANDALONE_FILES,
  runDatasetIntegrityAudit,
} from './auditors/datasetIntegrityAuditor.js';
import { runIdentityAudit } from './auditors/identityAuditor.js';
import { runPriorityAudit } from './auditors/priorityAuditor.js';

export type ProjectAuditResult = {
  audit_id: string;
  timestamp: string;
  phase: typeof PROJECT_AUDITOR_PHASE;
  project_status: 'pass' | 'fail';
  identity_status: 'pass' | 'fail';
  continuity_status: 'pass' | 'fail';
  adapter_status: 'pass' | 'fail';
  priority_status: 'pass' | 'fail';
  integrity_status: 'pass' | 'fail';
  identity_risk_score: number;
  continuity_risk_score: number;
  adapter_risk_score: number;
  priority_risk_score: number;
  integrity_risk_score: number;
  risk_score: number;
  risk_level: RiskLevelLabel;
  final_verdict: typeof PROJECT_AUDITOR_PASS_VERDICT | typeof PROJECT_AUDITOR_FAIL_VERDICT;
  warnings: readonly AuditWarning[];
  errors: readonly AuditError[];
  inventory: ReturnType<typeof collectScanInventory>;
  submodule_details: Record<string, Record<string, unknown>>;
};

export type ProjectAuditorBaseline = {
  baseline_id: string;
  phase: typeof PROJECT_AUDITOR_PHASE;
  created_at: string;
  dataset_count: number;
  adapter_count: number;
  latest_count: number;
  verification_count: number;
  known_contracts: readonly string[];
  known_priority_rules: {
    canonical_field_priority: readonly string[];
    character_first_contract_path: string;
    identity_protection_phase: string;
  };
  required_dataset_pairs: typeof REQUIRED_DATASET_PAIRS;
  required_standalone_files: typeof REQUIRED_STANDALONE_FILES;
  scan_roots: readonly string[];
};

function newAuditId(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const suffix = crypto.randomBytes(3).toString('hex');
  return `project_audit_${stamp}_${suffix}`;
}

export function buildProjectAuditorBaseline(projectRoot: string): ProjectAuditorBaseline {
  const inventory = collectScanInventory(projectRoot);
  const latestDir = path.join(projectRoot, 'exports/image_app/latest');
  const adapterCount = fs.existsSync(latestDir)
    ? fs.readdirSync(latestDir).filter((n) => n.endsWith('.json')).length
    : 0;

  return {
    baseline_id: 'project-auditor-baseline-v1',
    phase: PROJECT_AUDITOR_PHASE,
    created_at: new Date().toISOString(),
    dataset_count: inventory.dataset_json_count,
    adapter_count: inventory.adapters_json_count,
    latest_count: inventory.latest_json_count,
    verification_count: inventory.verify_script_count,
    known_contracts: Object.freeze([
      'exports/image_app/latest/character-first-contract.json',
      'exports/image_app/latest/location-lighting-image-adapter.json',
      'exports/image_app/latest/indoor-location-anchor-adapter.json',
      'exports/export-manifest.json',
      'datasets/character/character-simple-v1.json',
    ]),
    known_priority_rules: {
      canonical_field_priority: CANONICAL_FIELD_PRIORITY,
      character_first_contract_path: 'exports/image_app/latest/character-first-contract.json',
      identity_protection_phase: 'PHASE-17-IDENTITY-PROTECTION-FRAMEWORK-001',
    },
    required_dataset_pairs: REQUIRED_DATASET_PAIRS,
    required_standalone_files: REQUIRED_STANDALONE_FILES,
    scan_roots: inventory.scan_roots,
  };
}

export function runProjectAudit(projectRoot?: string): ProjectAuditResult {
  const root = resolveProjectRoot(projectRoot);
  const timestamp = new Date().toISOString();
  const audit_id = newAuditId();

  const identity = runIdentityAudit(root);
  const continuity = runContinuityAudit(root);
  const adapter = runAdapterAudit(root);
  const priority = runPriorityAudit(root);
  const integrity = runDatasetIntegrityAudit(root);

  const warnings = Object.freeze([
    ...identity.warnings,
    ...continuity.warnings,
    ...adapter.warnings,
    ...priority.warnings,
    ...integrity.warnings,
  ]);

  const errors = Object.freeze([
    ...identity.errors,
    ...continuity.errors,
    ...adapter.errors,
    ...priority.errors,
    ...integrity.errors,
  ]);

  const risk_score = Math.max(
    identity.risk_score,
    continuity.risk_score,
    adapter.risk_score,
    priority.risk_score,
    integrity.risk_score
  );

  const hasCritical = errors.some((e) => e.severity === 'critical');
  const pass =
    !hasCritical &&
    risk_score < 61 &&
    identity.status === 'pass' &&
    continuity.status === 'pass' &&
    adapter.status === 'pass' &&
    priority.status === 'pass' &&
    integrity.status === 'pass';

  const inventory = collectScanInventory(root);

  return {
    audit_id,
    timestamp,
    phase: PROJECT_AUDITOR_PHASE,
    project_status: pass ? 'pass' : 'fail',
    identity_status: identity.status,
    continuity_status: continuity.status,
    adapter_status: adapter.status,
    priority_status: priority.status,
    integrity_status: integrity.status,
    identity_risk_score: identity.risk_score,
    continuity_risk_score: continuity.risk_score,
    adapter_risk_score: adapter.risk_score,
    priority_risk_score: priority.risk_score,
    integrity_risk_score: integrity.risk_score,
    risk_score,
    risk_level: riskLevelFromScore(risk_score),
    final_verdict: pass ? PROJECT_AUDITOR_PASS_VERDICT : PROJECT_AUDITOR_FAIL_VERDICT,
    warnings,
    errors,
    inventory,
    submodule_details: {
      identity: identity.details,
      continuity: continuity.details,
      adapter: adapter.details,
      priority: priority.details,
      integrity: integrity.details,
    },
  };
}

export function writeProjectAuditReports(projectRoot?: string): {
  result: ProjectAuditResult;
  baseline: ProjectAuditorBaseline;
  reportPath: string;
  baselinePath: string;
} {
  const root = resolveProjectRoot(projectRoot);
  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const result = runProjectAudit(root);
  const baseline = buildProjectAuditorBaseline(root);

  const reportPayload = {
    ...result,
    report_type: 'project_auditor_report',
    report_version: 'v1',
    export_path: PROJECT_AUDITOR_REPORT_PATH,
    baseline_path: PROJECT_AUDITOR_BASELINE_PATH,
    next_phase: 'PHASE-AUDITOR-002 DATASET_CONFLICT_DETECTOR',
  };

  const reportPath = path.join(root, PROJECT_AUDITOR_REPORT_PATH);
  const baselinePath = path.join(root, PROJECT_AUDITOR_BASELINE_PATH);

  fs.writeFileSync(reportPath, `${JSON.stringify(reportPayload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');

  return { result, baseline, reportPath, baselinePath };
}
