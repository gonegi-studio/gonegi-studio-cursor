import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IDENTITY_DRIFT_PASS_VERDICT,
  IDENTITY_DRIFT_REPORT_PATH,
  writeIdentityDriftPredictorReport,
} from '../services/identityDriftPredictor.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { report } = writeIdentityDriftPredictorReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `overall=${report.overall_identity_risk} (${report.overall_risk_level}) face=${report.face_risk} costume=${report.costume_risk} hairstyle=${report.hairstyle_risk} duplication=${report.duplication_risk} dilution=${report.anchor_dilution_risk}`
);
console.log(`critical=${report.critical_findings_count} actions=${report.recommended_actions.length}`);
console.log(`report=${IDENTITY_DRIFT_REPORT_PATH}`);

for (const finding of [
  ...report.dimensions.face.findings,
  ...report.dimensions.costume.findings,
  ...report.dimensions.hairstyle.findings,
  ...report.dimensions.duplication.findings,
  ...report.dimensions.anchor_dilution.findings,
].filter((f) => f.severity === 'critical' || f.severity === 'high')) {
  console.error(`[${finding.severity}] ${finding.code}: ${finding.message}`);
}

if (report.final_verdict !== IDENTITY_DRIFT_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
