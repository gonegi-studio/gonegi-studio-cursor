import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PPC_CONTRACT_IDS,
  PRODUCTION_PIPELINE_CONTRACTS_V1_PATH,
  PRODUCTION_PIPELINE_FOUNDATION_V1_PASS_VERDICT,
  PRODUCTION_PIPELINE_FOUNDATION_V1_REPORT_PATH,
  PRODUCTION_PIPELINE_FOUNDATION_V1_STATUS,
  PRODUCTION_PIPELINE_V1_PATH,
} from '../services/productionPipelineFoundationV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

for (const rel of [
  PRODUCTION_PIPELINE_V1_PATH,
  PRODUCTION_PIPELINE_CONTRACTS_V1_PATH,
  PRODUCTION_PIPELINE_FOUNDATION_V1_REPORT_PATH,
  'datasets/stage7/stage7_implementation_v1/stage7-implementation-v1.json',
]) {
  assertExists(rel);
}

const report = JSON.parse(
  fs.readFileSync(path.join(root, PRODUCTION_PIPELINE_FOUNDATION_V1_REPORT_PATH), 'utf8')
) as {
  production_pipeline_foundation_v1_passed: boolean;
  final_verdict: string;
  status: string;
  checks: Record<string, boolean>;
  contract_results: Array<{ contract_id: string; verdict: string }>;
};

const pipeline = JSON.parse(
  fs.readFileSync(path.join(root, PRODUCTION_PIPELINE_V1_PATH), 'utf8')
) as {
  materialized: boolean;
  nodes: Array<{ stage: string; connected: boolean }>;
  connections: unknown[];
};

const contracts = JSON.parse(
  fs.readFileSync(path.join(root, PRODUCTION_PIPELINE_CONTRACTS_V1_PATH), 'utf8')
) as { aggregate_verdict: string };

const implementation = JSON.parse(
  fs.readFileSync(path.join(root, 'datasets/stage7/stage7_implementation_v1/stage7-implementation-v1.json'), 'utf8')
) as {
  implementation_tracks: Array<{ track_id: string; status: string }>;
  production_pipeline_ref?: string;
};

if (!pipeline.materialized || pipeline.connections.length < 3) {
  console.error('PIPELINE FAIL');
  process.exit(1);
}

for (const stage of ['movie_analysis', 'movie_reconstruction', 'spatial_runtime']) {
  const node = pipeline.nodes.find((n) => n.stage === stage);
  if (!node?.connected) {
    console.error(`NODE FAIL: ${stage}`);
    process.exit(1);
  }
}

for (const contractId of PPC_CONTRACT_IDS) {
  const result = report.contract_results.find((r) => r.contract_id === contractId);
  if (!result || result.verdict !== 'PASS') {
    console.error(`CONTRACT FAIL: ${contractId}`);
    process.exit(1);
  }
}

if (contracts.aggregate_verdict !== 'PASS') {
  console.error('CONTRACTS AGGREGATE FAIL');
  process.exit(1);
}

const track = implementation.implementation_tracks.find((t) => t.track_id === 'track_production_pipeline');
if (!track || !['FOUNDATION_COMPLETE', 'PRODUCTION_VALIDATED'].includes(track.status)) {
  console.error('TRACK STATUS FAIL');
  process.exit(1);
}

for (const [key, value] of Object.entries(report.checks)) {
  if (value !== true) {
    console.error(`CHECK FAIL: ${key}`);
    process.exit(1);
  }
}

if (
  !report.production_pipeline_foundation_v1_passed ||
  report.final_verdict !== PRODUCTION_PIPELINE_FOUNDATION_V1_PASS_VERDICT
) {
  console.error('VERDICT FAIL');
  process.exit(1);
}

if (report.status !== PRODUCTION_PIPELINE_FOUNDATION_V1_STATUS) {
  console.error('STATUS FAIL');
  process.exit(1);
}

console.log(PRODUCTION_PIPELINE_FOUNDATION_V1_PASS_VERDICT);
