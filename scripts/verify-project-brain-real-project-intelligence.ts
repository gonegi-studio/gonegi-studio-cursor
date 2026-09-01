import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_PASS_VERDICT,
  buildProjectBrainRealProjectIntelligenceReport,
} from '../services/ProjectBrainRealProjectIntelligenceValidator.js';
import { runVerificationSemanticsClassifierSelfTest } from '../services/ProjectBrainVerificationSemanticsClassifier.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const start = Date.now();
const classifierSelfTest = runVerificationSemanticsClassifierSelfTest();
const report = await buildProjectBrainRealProjectIntelligenceReport(projectRoot);
const elapsedMs = Date.now() - start;

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log(`\nBuilt in ${elapsedMs}ms`);
console.log(`[${classifierSelfTest.ok ? 'PASS' : 'FAIL'}] verification_semantics_classifier: ${classifierSelfTest.detail}`);
console.log(`Entity graph: ${report.entity_graph?.entities.length ?? 0} entities, ${report.entity_graph?.edges.length ?? 0} edges`);

console.log('\nTop 10 most-used real services (Dependency Graph):');
report.dependency_graph.slice(0, 10).forEach((u) => console.log(`  ${u.used_by_capabilities.length}x  ${u.service_relpath}`));

console.log(`\nCapability Graph: ${report.capability_graph.length} real distinctive relations found`);
report.capability_graph.slice(0, 10).forEach((r) => console.log(`  ${r.capability_a} <-> ${r.capability_b}  via [${r.shared_distinctive_services.join(', ')}]`));

console.log('\nGap Analysis:');
console.log(
  `  Missing Capability Detection: ${report.missing_capabilities?.missing_capability_count}/${report.missing_capabilities?.total_real_services} real services (${report.missing_capabilities?.missing_capability_percentage}%) have no registered verify:* or proven assert-and-exit coverage`
);
console.log(`  Dead Capability Detection: ${report.dead_capabilities?.dead_capability_count} real capabilities import zero real services`);
if ((report.dead_capabilities?.dead_capability_count ?? 0) > 0) {
  report.dead_capabilities?.dead_capabilities.slice(0, 10).forEach((c) => console.log(`    - ${c}`));
}

if (report.verdict !== PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_PASS_VERDICT || !classifierSelfTest.ok) {
  console.error(`PROJECT BRAIN REAL PROJECT INTELLIGENCE: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
