import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  BACKEND_CERTIFICATION_CHECKS,
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_DESIGN_LAYERS,
  BACKEND_PROTECTED_ARTIFACTS,
  DSC_BACKEND_DESIGN_CERTIFICATION_PHASE,
  buildDirectSpatialConditioningBackendDesignCertification,
  type BackendCertificationCheckId,
} from '../services/directSpatialConditioningBackendDesignCertificationBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_DESIGN_CERTIFICATION_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_DESIGN_CERTIFICATION_V1' as const;

function sha256(relativePath: string): string | null {
  const full = path.join(projectRoot, relativePath);
  if (!fs.existsSync(full)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
}

// Outer immutability snapshot: certification must not touch any certified artifact.
const before = new Map(
  BACKEND_PROTECTED_ARTIFACTS.map((artifact) => [artifact, sha256(artifact)])
);

for (const artifact of BACKEND_PROTECTED_ARTIFACTS) {
  if (before.get(artifact) === null) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing certified artifact ${artifact}`);
    process.exit(1);
  }
}

let certification;
try {
  certification =
    buildDirectSpatialConditioningBackendDesignCertification(projectRoot).certification;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`CERTIFICATION FAILED: ${(error as Error).message}`);
  process.exit(1);
}

const mutatedArtifacts = BACKEND_PROTECTED_ARTIFACTS.filter(
  (artifact) => before.get(artifact) !== sha256(artifact)
);

const checkStatus = new Map<BackendCertificationCheckId, boolean>();
for (const entry of certification.checks) checkStatus.set(entry.check, entry.passed);
const missingChecks = BACKEND_CERTIFICATION_CHECKS.filter((id) => !checkStatus.has(id));
const failedChecks = certification.checks.filter((entry) => !entry.passed);

const unresolvedLinks = certification.evidence_chain.filter(
  (link) => !link.resolved || !link.matches_expected
);

const neutrality = certification.backend_neutrality;
const backendNeutral =
  neutrality.backend_agnostic &&
  neutrality.backends_implemented === 0 &&
  neutrality.backends_registered === 0 &&
  neutrality.backends_routed === 0 &&
  neutrality.backends_executed === 0;

const validationPassed =
  certification.certified &&
  certification.error_count === 0 &&
  missingChecks.length === 0 &&
  failedChecks.length === 0 &&
  unresolvedLinks.length === 0 &&
  mutatedArtifacts.length === 0 &&
  backendNeutral &&
  certification.upstream_certified_system.dsc_certified;

const report = {
  report_id: `dsc_backend_design_certification_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_DESIGN_CERTIFICATION_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  certified: validationPassed,
  certified_system: certification.certified_system,
  mode: certification.mode,
  layers_certified: [...BACKEND_DESIGN_LAYERS],
  checks_required: [...BACKEND_CERTIFICATION_CHECKS],
  checks: certification.checks.map((entry) => ({
    check: entry.check,
    passed: entry.passed,
    detail: entry.detail,
    error_count: entry.errors.length,
    errors: entry.errors,
  })),
  evidence_chain_links: certification.evidence_chain.length,
  evidence_chain_unresolved: unresolvedLinks.length,
  artifact_digest_count: certification.artifact_digests.length,
  protected_artifacts_unmodified: mutatedArtifacts.length === 0,
  backend_neutral: backendNeutral,
  backend_neutrality: certification.backend_neutrality,
  upstream_certified_system: certification.upstream_certified_system,
  integrity_method: certification.integrity_method,
  artifacts: {
    certification: BACKEND_DESIGN_CERTIFICATION_PATH,
  },
  error_count: certification.error_count,
  missing_checks: missingChecks,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_DESIGN_CERTIFICATION_PRODUCTION_REPORT.json';
fs.mkdirSync(path.dirname(path.join(projectRoot, reportPath)), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, reportPath),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);

console.log(report.final_verdict);
console.log(
  [
    `certified_system=${report.certified_system}`,
    `layers=${report.layers_certified.length}`,
    `checks=${report.checks.length}/${BACKEND_CERTIFICATION_CHECKS.length}`,
    `evidence_links=${report.evidence_chain_links}`,
    `digests=${report.artifact_digest_count}`,
    `backend_neutral=${report.backend_neutral}`,
    `protected_unmodified=${report.protected_artifacts_unmodified}`,
    `error_count=${report.error_count}`,
  ].join(' | ')
);

if (!validationPassed) {
  for (const entry of failedChecks) {
    for (const error of entry.errors) {
      console.error(`[error] ${entry.check}: ${error}`);
    }
  }
  for (const link of unresolvedLinks) {
    console.error(`[error] evidence_chain: ${link.from_layer}.${link.field}`);
  }
  for (const artifact of mutatedArtifacts) {
    console.error(`[error] mutated: ${artifact}`);
  }
  for (const missing of missingChecks) {
    console.error(`[error] missing_check: ${missing}`);
  }
  process.exit(1);
}

process.exit(0);
