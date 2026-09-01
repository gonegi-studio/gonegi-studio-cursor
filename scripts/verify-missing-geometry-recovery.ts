import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  MISSING_GEOMETRY_RECOVERY_PASS_VERDICT,
  validateMissingGeometryRecovery,
} from '../services/missingGeometryRecoveryValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = validateMissingGeometryRecovery(projectRoot);

console.log(report.verdict);
console.log(`targets: ${report.targets.join(', ')}`);

for (const [gateName, gate] of Object.entries(report.gates)) {
  console.log(`[${gate.pass ? 'PASS' : 'FAIL'}] ${gateName}: ${gate.detail}`);
}

console.log('per-source recovery:');
for (const source of report.per_source) {
  console.log(
    `  - ${source.source_video_id}: geometry_recovered=${source.geometry_recovered} ` +
      `coordinate_recovered=${source.coordinate_recovered} frame_count=${source.frame_count} ` +
      `recovered_fields=[${source.recovered_fields.join(', ')}]${source.error ? ` error=${source.error}` : ''}`
  );
}

if (report.verdict !== MISSING_GEOMETRY_RECOVERY_PASS_VERDICT) {
  console.error(`MISSING GEOMETRY RECOVERY: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
