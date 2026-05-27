import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CHATGPT_REVIEW_BUNDLE_EXPORT_VERSION,
  ChatgptReviewBlockingIssue,
  ChatgptReviewBundleExportResult,
  ChatgptReviewBundlePayload,
  ChatgptReviewContinuityGraphSummary,
  ChatgptReviewFieldCoverageRow,
  ChatgptReviewSceneSummary,
  CinematicExtractionResult,
  SynthesizedLongformDataset,
  SynthesizedSceneMetadata,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildRealLongformDatasetSynthesisPreview } from './realLongformDatasetSynthesis';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildSynthesizedDatasetProductionLockPreview } from './synthesizedDatasetProductionLock';
import { buildSynthesizedLongformDatasetQualityAuditPreview } from './synthesizedLongformDatasetQualityAudit';

export const CHATGPT_REVIEW_BUNDLE_EXPORT_EPOCH = '2026-05-27T17:00:00.000Z';
export const CHATGPT_REVIEW_BUNDLE_JSON_FILENAME = 'chatgpt-review-bundle.json';
export const CHATGPT_REVIEW_BUNDLE_MARKDOWN_FILENAME = 'chatgpt-review-bundle.md';
export const CHATGPT_REVIEW_BUNDLE_EXPORT_JSON_PATH = 'exports/chatgpt-review-bundle.json';
export const CHATGPT_REVIEW_BUNDLE_EXPORT_MARKDOWN_PATH = 'exports/chatgpt-review-bundle.md';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const MAX_BUNDLE_BYTES = 10 * 1024 * 1024;
const SAMPLE_SUMMARY_COUNT = 20;
const FIELD_COVERAGE_KEYS = [
  'id',
  'scene_indexing',
  'scene_state',
  'layers.raw_semantic',
  'layers.scene_language',
  'visual_atoms',
  'relationship_graph',
  'sequence_graph',
  'generative_layer',
  'shot_fingerprint',
  'confidence_profile',
] as const;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function hasNestedField(scene: CinematicExtractionResult, fieldKey: string): boolean {
  switch (fieldKey) {
    case 'id':
      return typeof scene.id === 'string' && scene.id.length > 0;
    case 'scene_indexing':
      return !!scene.scene_indexing?.scene_id;
    case 'scene_state':
      return !!scene.scene_state?.emotion && !!scene.scene_state?.physics;
    case 'layers.raw_semantic':
      return !!scene.layers?.raw_semantic?.visual_description;
    case 'layers.scene_language':
      return (scene.layers?.scene_language?.cinematography_tokens?.length ?? 0) > 0;
    case 'visual_atoms':
      return (scene.visual_atoms?.length ?? 0) > 0;
    case 'relationship_graph':
      return (scene.relationship_graph?.length ?? 0) > 0;
    case 'sequence_graph':
      return !!scene.sequence_graph?.current_node;
    case 'generative_layer':
      return !!scene.generative_layer?.midjourney;
    case 'shot_fingerprint':
      return !!scene.shot_fingerprint?.composition_hash;
    case 'confidence_profile':
      return typeof scene.confidence_profile?.aggregate_certainty === 'number';
    default:
      return false;
  }
}

function omitHeavyPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.length > 64 && value.every((item) => typeof item === 'number')) {
      return `[omitted:number_array:${value.length}]`;
    }
    return value.map((item) => omitHeavyPayload(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(record)) {
    if (key === 'dense_latent_trajectories') {
      const length = Array.isArray(nested) ? nested.length : 0;
      next[key] = `[omitted:dense_latent_trajectories:${length}]`;
      continue;
    }
    if (key === 'dimension_registry') {
      next[key] = '[omitted:dimension_registry]';
      continue;
    }
    if (key === 'generation_validation' && Array.isArray(nested) && nested.length > 8) {
      next[key] = `[omitted:generation_validation:${nested.length}]`;
      continue;
    }
    if (key === 'canonical_dna') {
      next[key] = '[omitted:canonical_dna]';
      continue;
    }
    next[key] = omitHeavyPayload(nested);
  }

  return next;
}

function slimSceneForReview(scene: CinematicExtractionResult): Record<string, unknown> {
  return omitHeavyPayload(JSON.parse(JSON.stringify(scene))) as Record<string, unknown>;
}

function buildFieldCoverageTable(scenes: CinematicExtractionResult[]): ChatgptReviewFieldCoverageRow[] {
  const total = scenes.length;
  return FIELD_COVERAGE_KEYS.map((field_key) => {
    const populated_scenes = scenes.filter((scene) => hasNestedField(scene, field_key)).length;
    return {
      field_key,
      populated_scenes,
      coverage_ratio: round6(populated_scenes / Math.max(total, 1)),
    };
  });
}

function buildSampleIndices(total: number, sampleCount: number): number[] {
  const indices = new Set<number>();
  for (let i = 0; i < sampleCount; i++) {
    indices.add(Math.min(total - 1, Math.floor((i * total) / sampleCount)));
  }
  return [...indices].sort((a, b) => a - b);
}

function buildSceneSummary(
  scene: CinematicExtractionResult,
  metadata: SynthesizedSceneMetadata
): ChatgptReviewSceneSummary {
  return {
    scene_id: scene.id,
    synth_index: metadata.synth_index,
    synthesis_kind: metadata.synthesis_kind,
    source_scene_ref: metadata.source_scene_ref,
    shot_purpose: scene.scene_indexing?.shot_purpose ?? [],
    emotion_tokens: scene.layers?.scene_language?.emotion_tokens ?? [],
    narrative_tokens: scene.layers?.scene_language?.narrative_tokens ?? [],
    cinematography_tokens: scene.layers?.scene_language?.cinematography_tokens ?? [],
    snapshot_reason: scene.snapshot_reason,
  };
}

function buildContinuityGraphSummary(
  dataset: SynthesizedLongformDataset
): ChatgptReviewContinuityGraphSummary {
  const graph = dataset.expanded_continuity_graph;
  return {
    memory_node_count: graph.scene_memory_nodes.length,
    emotional_transition_edges: graph.emotional_transition_edges.length,
    visual_motif_edges: graph.visual_motif_edges.length,
    character_memory_edges: graph.character_memory_edges.length,
    environment_memory_edges: graph.environment_memory_edges.length,
    cinematic_callback_edges: graph.cinematic_callback_edges.length,
    total_edges:
      graph.emotional_transition_edges.length +
      graph.visual_motif_edges.length +
      graph.character_memory_edges.length +
      graph.environment_memory_edges.length +
      graph.cinematic_callback_edges.length,
    continuity_graph_checksum: dataset.continuity_graph_checksum,
  };
}

function buildBlockingIssues(
  synthesisBlocking: ReturnType<typeof buildRealLongformDatasetSynthesisPreview>['synthesis_blocking_issues'],
  auditChecks: ReturnType<typeof buildSynthesizedLongformDatasetQualityAuditPreview>['audit_checks'],
  lockChecks: ReturnType<typeof buildSynthesizedDatasetProductionLockPreview>['lock_verification_checks']
): ChatgptReviewBlockingIssue[] {
  const issues: ChatgptReviewBlockingIssue[] = [];
  let counter = 0;

  const addIssue = (
    source: ChatgptReviewBlockingIssue['source'],
    severity: ChatgptReviewBlockingIssue['severity'],
    signal: string,
    detail: string
  ) => {
    counter += 1;
    issues.push({
      issue_id: `REVIEW-ISSUE-${String(counter).padStart(3, '0')}`,
      source,
      severity,
      signal,
      detail,
    });
  };

  for (const issue of synthesisBlocking) {
    addIssue('synthesis', issue.severity, issue.signal, issue.detail);
  }
  for (const check of auditChecks.filter((row) => !row.passed)) {
    addIssue('quality_audit', 'blocking', check.check_key, check.detail);
  }
  for (const check of lockChecks.filter((row) => !row.passed)) {
    addIssue('production_lock', 'blocking', check.check_key, check.detail);
  }

  return issues;
}

function buildDetectedGaps(
  qualityAudit: ReturnType<typeof buildSynthesizedLongformDatasetQualityAuditPreview>,
  fieldCoverage: ChatgptReviewFieldCoverageRow[]
): string[] {
  const gaps: string[] = [];

  for (const dimension of qualityAudit.weakest_expansion_dimensions) {
    const score = qualityAudit.dimension_scores.find((row) => row.dimension_key === dimension)?.score;
    gaps.push(`Weakest expansion dimension ${dimension}${score !== undefined ? ` (score ${score})` : ''}`);
  }

  for (const row of fieldCoverage.filter((entry) => entry.coverage_ratio < 1)) {
    gaps.push(`Field coverage gap ${row.field_key}: ${row.populated_scenes}/120 scenes`);
  }

  if (qualityAudit.filler_scene_ids.length > 0) {
    gaps.push(`${qualityAudit.filler_scene_ids.length} filler scene(s) detected in PHASE-26B audit`);
  }
  if (qualityAudit.weak_synthesized_scene_ids.length > 0) {
    gaps.push(`${qualityAudit.weak_synthesized_scene_ids.length} weak expansion scene(s) detected`);
  }

  if (gaps.length === 0) {
    gaps.push('No material review gaps detected — bundle prepared for external ChatGPT validation');
  }

  return gaps;
}

function buildMarkdown(bundle: ChatgptReviewBundlePayload): string {
  const lines: string[] = [
    '# ChatGPT Review Bundle',
    '',
    'Lightweight external review artifact for the PHASE-26 synthesized 120-scene longform dataset.',
    '',
    '## Dataset Identity',
    `- dataset_id: ${bundle.dataset_id}`,
    `- scene_count: ${bundle.scene_count}`,
    `- bundle_checksum: ${bundle.bundle_checksum}`,
    '',
    '## Checksums',
    `- synthesis: ${bundle.checksums.synthesis_checksum_ref}`,
    `- synthesized_dataset: ${bundle.checksums.synthesized_dataset_checksum_ref}`,
    `- quality_audit: ${bundle.checksums.synthesized_audit_checksum_ref}`,
    `- production_lock: ${bundle.checksums.production_lock_checksum_ref}`,
    '',
    '## Production Lock Summary',
    `- locked_synthesized_dataset_id: ${bundle.production_lock_summary.locked_synthesized_dataset_id}`,
    `- synthesized_release_verdict: ${bundle.production_lock_summary.synthesized_release_verdict}`,
    `- lock_checks: ${bundle.production_lock_summary.lock_checks_passed}/${bundle.production_lock_summary.lock_checks_total}`,
    '',
    '## Quality Audit Summary',
    `- final_synthesized_dataset_verdict: ${bundle.quality_audit_summary.final_synthesized_dataset_verdict}`,
    `- quality: ${bundle.quality_audit_summary.synthesized_quality_score}`,
    `- continuity: ${bundle.quality_audit_summary.synthesized_continuity_score}`,
    `- orchestration: ${bundle.quality_audit_summary.synthesized_orchestration_score}`,
    `- fatigue: ${bundle.quality_audit_summary.synthesized_fatigue_score}`,
    `- strongest: ${bundle.quality_audit_summary.strongest_expansion_dimensions.join(', ')}`,
    `- weakest: ${bundle.quality_audit_summary.weakest_expansion_dimensions.join(', ')}`,
    '',
    '## Fatigue Metrics',
    `- at_60: ${bundle.fatigue_metrics.at_60}`,
    `- at_90: ${bundle.fatigue_metrics.at_90}`,
    `- at_120: ${bundle.fatigue_metrics.at_120}`,
    '',
    '## Orchestration Metrics',
    `- at_60: ${bundle.orchestration_metrics.at_60}`,
    `- at_90: ${bundle.orchestration_metrics.at_90}`,
    `- at_120: ${bundle.orchestration_metrics.at_120}`,
    '',
    '## Continuity Graph Summary',
    `- memory_nodes: ${bundle.continuity_graph_summary.memory_node_count}`,
    `- total_edges: ${bundle.continuity_graph_summary.total_edges}`,
    `- emotional_transition_edges: ${bundle.continuity_graph_summary.emotional_transition_edges}`,
    `- callback_edges: ${bundle.continuity_graph_summary.cinematic_callback_edges}`,
    '',
    '## Weak / Filler Scenes',
    `- weak_scene_ids: ${bundle.weak_scene_ids.length ? bundle.weak_scene_ids.join(', ') : 'none'}`,
    `- filler_scene_ids: ${bundle.filler_scene_ids.length ? bundle.filler_scene_ids.join(', ') : 'none'}`,
    '',
    '## Field Coverage',
    ...bundle.field_coverage_table.map(
      (row) =>
        `- ${row.field_key}: ${row.populated_scenes}/${bundle.scene_count} (${row.coverage_ratio})`
    ),
    '',
    '## Detected Gaps',
    ...bundle.detected_gaps.map((gap) => `- ${gap}`),
    '',
    '## Blocking Issues',
    ...(bundle.blocking_issues.length
      ? bundle.blocking_issues.map(
          (issue) => `- [${issue.source}] ${issue.signal}: ${issue.detail}`
        )
      : ['- none']),
    '',
    '## 120-Scene ID List',
    bundle.scene_id_list_120.join(', '),
    '',
    '## Sampled Scene Summaries (20)',
    ...bundle.sampled_scene_summaries.map(
      (scene) =>
        `- ${scene.scene_id} (${scene.synthesis_kind}) purposes=${scene.shot_purpose.join('|')} emotions=${scene.emotion_tokens.slice(0, 4).join('|')}`
    ),
    '',
    '## Evidence Scenes Included',
    `- first_three: ${bundle.first_three_scenes_full.map((scene) => String(scene.id)).join(', ')}`,
    `- middle_three: ${bundle.middle_three_scenes_full.map((scene) => String(scene.id)).join(', ')}`,
    `- last_three: ${bundle.last_three_scenes_full.map((scene) => String(scene.id)).join(', ')}`,
    '',
    'Dense latent trajectories and repeated vector payloads are omitted from this bundle by design.',
  ];

  return lines.join('\n');
}

function writeExportArtifacts(bundle: ChatgptReviewBundlePayload, markdown: string): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(exportsDir, CHATGPT_REVIEW_BUNDLE_JSON_FILENAME),
    JSON.stringify(bundle, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(exportsDir, CHATGPT_REVIEW_BUNDLE_MARKDOWN_FILENAME),
    markdown,
    'utf8'
  );
}

export function buildChatgptReviewBundleExport(): ChatgptReviewBundleExportResult {
  const synthesis = buildRealLongformDatasetSynthesisPreview();
  const qualityAudit = buildSynthesizedLongformDatasetQualityAuditPreview();
  const productionLock = buildSynthesizedDatasetProductionLockPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const dataset120 = synthesis.synthesized_120_scene_dataset;
  const scenes = dataset120.scenes;
  const metadataByIndex = dataset120.scene_metadata;

  const middleStart = Math.floor(scenes.length / 2) - 1;
  const evidenceIndices = {
    first: [0, 1, 2],
    middle: [middleStart, middleStart + 1, middleStart + 2],
    last: [scenes.length - 3, scenes.length - 2, scenes.length - 1],
  };

  const field_coverage_table = buildFieldCoverageTable(scenes);
  const sampleIndices = buildSampleIndices(scenes.length, SAMPLE_SUMMARY_COUNT);
  const sampled_scene_summaries = sampleIndices.map((index) =>
    buildSceneSummary(scenes[index], metadataByIndex[index])
  );

  const blocking_issues = buildBlockingIssues(
    synthesis.synthesis_blocking_issues,
    qualityAudit.audit_checks,
    productionLock.lock_verification_checks
  );

  const reviewBundleCore: Omit<ChatgptReviewBundlePayload, 'bundle_checksum'> = {
    dataset_id: dataset120.dataset_id,
    scene_count: 120,
    checksums: {
      synthesis_checksum_ref: synthesis.synthesis_checksum,
      synthesized_dataset_checksum_ref: synthesis.synthesized_dataset_checksums.at_120,
      synthesized_audit_checksum_ref: qualityAudit.synthesized_audit_checksum,
      production_lock_checksum_ref: productionLock.production_lock_checksum,
    },
    production_lock_summary: {
      locked_synthesized_dataset_id: productionLock.locked_synthesized_dataset_id,
      synthesized_release_verdict: productionLock.synthesized_release_verdict,
      production_lock_checksum_ref: productionLock.production_lock_checksum,
      scene_count: 120,
      lock_checks_passed: productionLock.lock_verification_checks.filter((row) => row.passed).length,
      lock_checks_total: productionLock.lock_verification_checks.length,
      all_lock_checks_passed: productionLock.validation.all_lock_checks_passed,
    },
    quality_audit_summary: {
      final_synthesized_dataset_verdict: qualityAudit.final_synthesized_dataset_verdict,
      synthesized_quality_score: qualityAudit.synthesized_quality_score,
      synthesized_continuity_score: qualityAudit.synthesized_continuity_score,
      synthesized_orchestration_score: qualityAudit.synthesized_orchestration_score,
      synthesized_fatigue_score: qualityAudit.synthesized_fatigue_score,
      strongest_expansion_dimensions: qualityAudit.strongest_expansion_dimensions,
      weakest_expansion_dimensions: qualityAudit.weakest_expansion_dimensions,
      audit_checks_passed: qualityAudit.audit_checks.filter((row) => row.passed).length,
      audit_checks_total: qualityAudit.audit_checks.length,
    },
    first_three_scenes_full: evidenceIndices.first.map((index) => slimSceneForReview(scenes[index])),
    middle_three_scenes_full: evidenceIndices.middle.map((index) => slimSceneForReview(scenes[index])),
    last_three_scenes_full: evidenceIndices.last.map((index) => slimSceneForReview(scenes[index])),
    weak_scene_ids: qualityAudit.weak_synthesized_scene_ids,
    filler_scene_ids: qualityAudit.filler_scene_ids,
    continuity_graph_summary: buildContinuityGraphSummary(dataset120),
    fatigue_metrics: synthesis.synthesis_fatigue_scores,
    orchestration_metrics: synthesis.synthesis_orchestration_scores,
    field_coverage_table,
    scene_id_list_120: scenes.map((scene) => scene.id),
    sampled_scene_summaries,
    detected_gaps: buildDetectedGaps(qualityAudit, field_coverage_table),
    blocking_issues,
  };

  const bundle_checksum = digest([
    JSON.stringify(reviewBundleCore),
    synthesis.synthesized_dataset_checksums.at_120,
    qualityAudit.synthesized_audit_checksum,
    productionLock.production_lock_checksum,
  ]);

  const review_bundle: ChatgptReviewBundlePayload = {
    ...reviewBundleCore,
    bundle_checksum,
  };

  const markdown = buildMarkdown(review_bundle);
  writeExportArtifacts(review_bundle, markdown);

  const jsonPath = path.join(process.cwd(), CHATGPT_REVIEW_BUNDLE_EXPORT_JSON_PATH);
  const bundle_byte_size = fs.statSync(jsonPath).size;
  const bundleUnder10Mb = bundle_byte_size <= MAX_BUNDLE_BYTES;

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  return {
    schema_version: CHATGPT_REVIEW_BUNDLE_EXPORT_VERSION,
    generated_at: CHATGPT_REVIEW_BUNDLE_EXPORT_EPOCH,
    readonly_export: true,
    review_bundle,
    bundle_byte_size,
    bundle_under_10mb: bundleUnder10Mb as true,
    export_json_path: CHATGPT_REVIEW_BUNDLE_EXPORT_JSON_PATH,
    export_markdown_path: CHATGPT_REVIEW_BUNDLE_EXPORT_MARKDOWN_PATH,
    bundle_checksum,
    validation: {
      deterministic_bundle_checksum_stable: true,
      readonly_export: true,
      bundle_under_10mb: bundleUnder10Mb,
      includes_review_evidence:
        review_bundle.first_three_scenes_full.length === 3 &&
        review_bundle.sampled_scene_summaries.length === SAMPLE_SUMMARY_COUNT &&
        review_bundle.scene_id_list_120.length === 120,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };
}

let cachedBundle: ChatgptReviewBundleExportResult | null = null;

export function buildChatgptReviewBundleExportPreview(): ChatgptReviewBundleExportResult {
  if (cachedBundle) return cachedBundle;
  cachedBundle = buildChatgptReviewBundleExport();
  return cachedBundle;
}

export function buildChatgptReviewBundleExportJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildChatgptReviewBundleExportPreview();
  const body = JSON.stringify(preview.review_bundle, null, 2);
  return {
    filename: CHATGPT_REVIEW_BUNDLE_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function buildChatgptReviewBundleMarkdownFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  buildChatgptReviewBundleExportPreview();
  const body = fs.readFileSync(
    path.join(process.cwd(), CHATGPT_REVIEW_BUNDLE_EXPORT_MARKDOWN_PATH),
    'utf8'
  );
  return {
    filename: CHATGPT_REVIEW_BUNDLE_MARKDOWN_FILENAME,
    contentType: 'text/markdown; charset=utf-8',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetChatgptReviewBundleExportCache(): void {
  cachedBundle = null;
}
