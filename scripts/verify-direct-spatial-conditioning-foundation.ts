import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE,
  FOUNDATION_PATH,
  SPATIAL_CONDITIONING_CHANNELS,
  buildDirectSpatialConditioningFoundation,
  type DirectSpatialConditioningFoundation,
} from '../services/directSpatialConditioningFoundationBuilder.js';
import {
  MASTER_MANIFEST_PATH,
  MASTER_PACKAGE_PATH,
} from '../services/movieReconstructionMasterPackageBuilder.js';
import { CERTIFICATION_PATH } from '../services/movieReconstructionProductionCertificationBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_FOUNDATION_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_FOUNDATION_V1' as const;

interface Issue {
  code: string;
  message: string;
}
const issues: Issue[] = [];

function sha256File(rel: string): string | null {
  const full = path.join(projectRoot, rel);
  if (!fs.existsSync(full)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
}

// Snapshot upstream verified artifacts BEFORE building to prove design-only
// (this phase must not modify any existing dataset/artifact).
const UPSTREAM_PROTECTED = [
  MASTER_PACKAGE_PATH,
  MASTER_MANIFEST_PATH,
  CERTIFICATION_PATH,
];
const preHashes = new Map<string, string | null>();
for (const rel of UPSTREAM_PROTECTED) preHashes.set(rel, sha256File(rel));

let foundation: DirectSpatialConditioningFoundation;
try {
  foundation = buildDirectSpatialConditioningFoundation(projectRoot).foundation;
} catch (err) {
  console.error(FAIL_VERDICT);
  console.error(`FOUNDATION FAILED: ${(err as Error).message}`);
  process.exit(1);
}

// Upstream unchanged after build.
for (const rel of UPSTREAM_PROTECTED) {
  if (preHashes.get(rel) !== sha256File(rel)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: rel });
  }
}

// Structural / design-only checks.
if (foundation.phase !== DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE)
  issues.push({ code: 'PHASE', message: foundation.phase });
if (foundation.mode !== 'design_only')
  issues.push({ code: 'MODE', message: foundation.mode });
if (foundation.target !== PASS_VERDICT)
  issues.push({ code: 'TARGET', message: foundation.target });

// Design constraints must forbid backend / gpu / inference / mutation / placeholders.
const dc = foundation.design_constraints;
if (dc.backend !== 'none') issues.push({ code: 'BACKEND', message: dc.backend });
if (dc.gpu !== false) issues.push({ code: 'GPU', message: `${dc.gpu}` });
if (dc.inference !== false)
  issues.push({ code: 'INFERENCE', message: `${dc.inference}` });
if (dc.modifies_existing_datasets !== false)
  issues.push({ code: 'DATASET_MUTATION', message: `${dc.modifies_existing_datasets}` });
if (dc.placeholders !== false)
  issues.push({ code: 'PLACEHOLDERS_FLAG', message: `${dc.placeholders}` });

// Exactly 6 conditioning channels, unique ids, all backend/gpu/inference-free.
if (foundation.channels.length !== 6)
  issues.push({ code: 'CHANNEL_COUNT', message: `${foundation.channels.length}` });
const seen = new Set<string>();
for (const ch of foundation.channels) {
  if (seen.has(ch.channel_id))
    issues.push({ code: 'DUPLICATE_CHANNEL', message: ch.channel_id });
  seen.add(ch.channel_id);
  if (ch.direction !== 'conditioning_input')
    issues.push({ code: 'DIRECTION', message: ch.channel_id });
  if (ch.determinism !== 'design_only_no_inference')
    issues.push({ code: 'DETERMINISM', message: ch.channel_id });
  if (ch.requires_backend || ch.requires_gpu || ch.performs_inference)
    issues.push({ code: 'CHANNEL_RUNTIME_FLAG', message: ch.channel_id });
  if (
    ch.upstream.verified_source_verdict !==
    'PASS_VERIFIED_MOVIE_RECONSTRUCTION_PRODUCTION_CERTIFICATION_V1'
  )
    issues.push({ code: 'UNVERIFIED_UPSTREAM', message: ch.channel_id });
  if (!ch.value_space.components.length)
    issues.push({ code: 'EMPTY_VALUE_SPACE', message: ch.channel_id });
}

// Channel set must equal the declared registry set.
if (
  JSON.stringify([...seen].sort()) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS].sort())
)
  issues.push({ code: 'CHANNEL_SET_MISMATCH', message: [...seen].join(',') });

// Output contract must not materialize anything in this phase.
const oc = foundation.output_contract;
if (oc.materializes_tensors || oc.materializes_frames || oc.emitted_by_this_phase)
  issues.push({ code: 'OUTPUT_MATERIALIZATION', message: 'design-only violated' });
if (oc.channel_ids.length !== 6)
  issues.push({ code: 'OUTPUT_CHANNELS', message: `${oc.channel_ids.length}` });

// Input contract must be read-only and reference the certified system.
const ic = foundation.input_contract;
if (ic.source_system !== 'MOVIE_RECONSTRUCTION_V1')
  issues.push({ code: 'SOURCE_SYSTEM', message: ic.source_system });
if (!ic.read_only || !ic.no_dataset_modification)
  issues.push({ code: 'INPUT_NOT_READONLY', message: 'input contract' });
if (ic.sources_supported !== 15)
  issues.push({ code: 'SOURCES_SUPPORTED', message: `${ic.sources_supported}` });
if (!fs.existsSync(path.join(projectRoot, ic.certification_ref)))
  issues.push({ code: 'CERT_REF_MISSING', message: ic.certification_ref });
if (!fs.existsSync(path.join(projectRoot, ic.master_package_ref)))
  issues.push({ code: 'MASTER_REF_MISSING', message: ic.master_package_ref });

// No placeholders anywhere: scan serialized artifact for forbidden tokens / empties.
const serialized = JSON.stringify(foundation);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD', 'null', '""']) {
  if (serialized.includes(token))
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
}

// Foundation artifact must exist on disk.
if (!fs.existsSync(path.join(projectRoot, FOUNDATION_PATH)))
  issues.push({ code: 'ARTIFACT_MISSING', message: FOUNDATION_PATH });

const validationPassed =
  issues.length === 0 &&
  foundation.channels.length === SPATIAL_CONDITIONING_CHANNELS.length;

const report = {
  report_id: `direct_spatial_conditioning_foundation_${Date.now().toString(36)}`,
  phase: DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: foundation.mode,
  channels: foundation.channels.map((c) => ({
    channel_id: c.channel_id,
    upstream_slot: c.upstream.consumption_slot,
    integrated_layer: c.upstream.integrated_layer,
  })),
  channel_count: foundation.channels.length,
  spatial_frame: foundation.spatial_frame.frame_id,
  design_constraints: foundation.design_constraints,
  upstream_protected_unmodified: UPSTREAM_PROTECTED.every(
    (rel) => preHashes.get(rel) === sha256File(rel)
  ),
  artifacts: {
    foundation: FOUNDATION_PATH,
    schema:
      'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-foundation.schema.json',
    registry:
      'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-foundation-implementation-registry-v1.json',
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

fs.mkdirSync(path.join(projectRoot, 'reports/numerical_cinematography'), {
  recursive: true,
});
fs.writeFileSync(
  path.join(
    projectRoot,
    'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_FOUNDATION_VALIDATION_REPORT.json'
  ),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);

console.log(report.final_verdict);
console.log(
  [
    `mode=${report.mode}`,
    `channels=${report.channel_count}`,
    `spatial_frame=${report.spatial_frame}`,
    `upstream_unmodified=${report.upstream_protected_unmodified}`,
    `error_count=${report.error_count}`,
  ].join(' | ')
);

if (!validationPassed) {
  for (const issue of issues) console.error(`[error] ${issue.code}: ${issue.message}`);
  process.exit(1);
}

process.exit(0);
