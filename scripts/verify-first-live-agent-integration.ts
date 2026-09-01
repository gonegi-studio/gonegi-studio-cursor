import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { loadLocalEnvFile } from '../services/localEnvFileLoader.js';
import {
  FIRST_LIVE_AGENT_INTEGRATION_PASS_VERDICT,
  validateFirstLiveAgentIntegration,
} from '../services/firstLiveAgentIntegrationValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const envLoad = loadLocalEnvFile(projectRoot);
if (envLoad.loaded_from) {
  // Key NAMES only — never values — are ever printed.
  console.log(`local_env_file=${envLoad.loaded_from} keys_applied=[${envLoad.keys_applied.join(', ')}]`);
} else {
  console.log('local_env_file=none (no .env.local or .env found)');
}

const report = await validateFirstLiveAgentIntegration(projectRoot);

console.log(report.verdict);
console.log(
  [
    `live_connection_pass=${report.live_connection_pass_ok}`,
    `request_pass=${report.request_pass_ok}`,
    `response_pass=${report.response_pass_ok}`,
    `runtime_pass=${report.runtime_pass_ok}`,
    `end_to_end_pass=${report.end_to_end_pass_ok}`,
    `repository_pass=${report.repository_pass_ok}`,
  ].join(' | ')
);

console.log('providers:');
for (const provider of report.providers) {
  const r = provider.result;
  if (r.ok) {
    console.log(
      `  - ${provider.provider}: OK model=${r.model} http_status=${r.http_status} latency_ms=${r.latency_ms} content="${r.content}"`
    );
  } else {
    console.log(
      `  - ${provider.provider}: ${r.kind}${r.http_status ? ` http_status=${r.http_status}` : ''} — ${r.message}`
    );
  }
}

for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

if (report.verdict !== FIRST_LIVE_AGENT_INTEGRATION_PASS_VERDICT) {
  console.error(`FIRST LIVE AGENT CONNECTOR: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
