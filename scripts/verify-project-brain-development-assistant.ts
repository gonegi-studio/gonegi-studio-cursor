import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_PASS_VERDICT,
  buildProjectBrainDevelopmentAssistantReport,
} from '../services/ProjectBrainDevelopmentAssistantValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const start = Date.now();
const report = await buildProjectBrainDevelopmentAssistantReport(projectRoot);
const elapsedMs = Date.now() - start;

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log(`\nBuilt in ${elapsedMs}ms`);

console.log('\nTarget Analysis:');
console.log(`  ${report.result?.target?.service_relpath} — ${report.result?.target?.selection_reason}`);

console.log('\nModification Scope:');
console.log(`  file_size_bytes=${report.result?.scope?.file_size_bytes}`);
console.log(`  exported_symbols (${report.result?.scope?.exported_symbol_count}): ${report.result?.scope?.exported_symbols.join(', ')}`);

console.log('\nImpact Report:');
console.log(`  impacted_capability_count=${report.result?.plan?.impact.impacted_capability_count}`);

console.log('\nSafe Modification Plan:');
console.log(`  risk_level=${report.result?.plan?.risk_level}`);
report.result?.plan?.safety_checklist.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));

if (report.verdict !== PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_PASS_VERDICT) {
  console.error(`PROJECT BRAIN DEVELOPMENT ASSISTANT: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
