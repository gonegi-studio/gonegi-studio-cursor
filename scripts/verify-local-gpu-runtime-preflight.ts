import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PREFLIGHT_MD_PATH,
  PREFLIGHT_PASS_VERDICT,
  PREFLIGHT_REPORT_PATH,
  RUNTIME_REQUIREMENTS_PATH,
  writeLocalGpuPreflightReports,
} from '../services/localGpuRuntimePreflight.js';
import { READINESS_LEVELS } from '../services/runtimeReadinessEvaluator.js';
import { PROVIDER_REPORT_PATH } from '../services/videoRuntimeProviderValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!fs.existsSync(path.join(projectRoot, RUNTIME_REQUIREMENTS_PATH))) {
  console.error(`Missing runtime requirements: ${RUNTIME_REQUIREMENTS_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, PROVIDER_REPORT_PATH))) {
  console.error(
    'Missing upstream provider abstraction report. Run npm run verify:video-runtime-provider first.'
  );
  process.exit(1);
}

const report = writeLocalGpuPreflightReports(projectRoot);

console.log(report.final_verdict);
console.log(
  `readiness_level=${report.readiness_level} gpu=${report.gpu_model} vram_gb=${report.vram_gb} ram_gb=${report.ram_gb} storage_free_gb=${report.storage_free_gb}`
);
console.log(
  `node=${report.node_version} python=${report.python_version ?? 'not_detected'} git=${report.git_version ?? 'not_detected'}`
);
for (const profile of report.readiness_evaluation.profile_evaluations) {
  console.log(`  profile_${profile.profile}=${profile.met ? 'MET' : 'NOT_MET'}`);
}
console.log(`gpu_execution=${report.gpu_execution} inspection_only=${report.inspection_only}`);
console.log(`report=${PREFLIGHT_REPORT_PATH}`);
console.log(`markdown=${PREFLIGHT_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, PREFLIGHT_REPORT_PATH))) {
  console.error('Local GPU preflight JSON report missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, PREFLIGHT_MD_PATH))) {
  console.error('Local GPU preflight markdown report missing.');
  process.exit(1);
}

if (!READINESS_LEVELS.includes(report.readiness_level)) {
  console.error(`Invalid readiness_level: ${report.readiness_level}`);
  process.exit(1);
}

if (report.final_verdict !== PREFLIGHT_PASS_VERDICT) {
  process.exit(1);
}

if (report.gpu_execution !== false) {
  console.error('gpu_execution must remain false');
  process.exit(1);
}

process.exit(0);
