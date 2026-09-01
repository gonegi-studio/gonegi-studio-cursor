import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  AGENT_GOVERNANCE_PASS_VERDICT,
  buildAgentGovernanceReport,
} from '../services/AgentGovernanceEngine.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildAgentGovernanceReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nGoverned calls:');
report.governed_calls.forEach((call, index) => {
  console.log(
    `  call ${index + 1}: ok=${call.ok} approval=${call.approval.decision} budget_ok=${call.budget.ok} rate_limit_ok=${call.rate_limit.ok} emergency_stop=${call.emergency_stop_engaged} dispatch=${call.dispatch ? (call.dispatch.ok ? 'ok' : call.dispatch.detail) : 'null'}`
  );
});

console.log('\nAudit log:');
report.audit_entries.forEach((entry) => {
  console.log(`  #${entry.sequence} [${entry.decision}] ${entry.action_id}: ${entry.detail}`);
});

if (report.verdict !== AGENT_GOVERNANCE_PASS_VERDICT) {
  console.error(`AGENT GOVERNANCE FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
