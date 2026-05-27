import fs from 'fs';
import path from 'path';
import { buildCanonicalMasterCoreDNASnapshot } from '../masterCoreDNAAdapter';

export const MIGRATION_PACKAGE_DIRNAME = 'cursor_migration_export_v1_fix';
export const MIGRATION_PACKAGE_ZIP = 'cursor_migration_export_v1_fix.zip';
export const MIGRATION_SESSION_COUNT = 5;

const SESSION_IDS = [
  'GEN-SES-001',
  'GEN-SES-002',
  'GEN-SES-003',
  'GEN-SES-004',
  'GEN-SES-005',
] as const;

export function buildCanonicalGenerationSessionRegistry() {
  return {
    schema_version: 'cursor_migration_export_v1_fix',
    registry_kind: 'generation_session_registry',
    canonical: true,
    sessions: SESSION_IDS.map((session_id, index) => ({
      session_id,
      scene_intent_ref: `scene-intent-${String(index + 1).padStart(3, '0')}`,
      prompt_assembly_ref: `prompt_assemblies/${session_id}.json`,
      render_state_ref: `render_states/${session_id}.json`,
      quality_history_ref: `quality_history/${session_id}.json`,
      sample_asset_ref: `sample_assets/${session_id}.png`,
    })),
  };
}

function buildPromptAssembly(sessionId: string, index: number) {
  return {
    session_id: sessionId,
    prompt: `Gonegi harbor scene ${index + 1}, warm gouache cel-shading, Mediterranean continuity.`,
    negative_prompt: 'text, watermark, logo, photoreal, harsh contrast',
    seed: 428100 + index,
    cfg: 7.5,
    sampler: 'euler_a',
    aspect_ratio: '16:9',
    model_hash: 'ghibli_v3_final_prod_4k',
  };
}

function buildRenderState(sessionId: string, index: number) {
  return {
    session_id: sessionId,
    render_status: 'completed',
    denoise: 0.7,
    steps: 28,
    output_asset: `sample_assets/${sessionId}.png`,
    continuity_seed: `CONT-SEED-${String(index + 1).padStart(3, '0')}`,
  };
}

function buildQualityHistory(sessionId: string, index: number) {
  return {
    session_id: sessionId,
    qa_record_id: `QA-${sessionId}`,
    style_drift_score: round6(0.08 + index * 0.01),
    identity_drift_score: round6(0.06 + index * 0.008),
    environment_drift_score: round6(0.07 + index * 0.009),
    overall_alignment_score: round6(0.9 - index * 0.01),
    verdict: 'pass',
  };
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

export function buildFixtureMigrationPackageTree(): Record<string, unknown> {
  const snapshot = buildCanonicalMasterCoreDNASnapshot();

  const files: Record<string, unknown> = {
    'session_manifests/generation_session_registry.json': buildCanonicalGenerationSessionRegistry(),
    'mirrors/generation_session_registry.json': {
      ...buildCanonicalGenerationSessionRegistry(),
      canonical: false,
      mirror_only: true,
      mirror_of: 'session_manifests/generation_session_registry.json',
    },
    'styleCore/styleCore.json': snapshot.styleCore,
    'characterDNA/characterBook.json': snapshot.characterBook,
    'environmentDNA/environmentDNA.json': snapshot.environmentDNA,
    'render_rules/render_rules.json': snapshot.render_rules,
  };

  SESSION_IDS.forEach((sessionId, index) => {
    files[`prompt_assemblies/${sessionId}.json`] = buildPromptAssembly(sessionId, index);
    files[`render_states/${sessionId}.json`] = buildRenderState(sessionId, index);
    files[`quality_history/${sessionId}.json`] = buildQualityHistory(sessionId, index);
    files[`sample_assets/${sessionId}.json`] = {
      session_id: sessionId,
      asset_path: `sample_assets/${sessionId}.png`,
      asset_kind: 'image/png',
      placeholder: true,
      byte_size: 0,
    };
  });

  return files;
}

export function materializeFixtureMigrationPackage(importsRoot: string): string {
  const packageRoot = path.join(importsRoot, MIGRATION_PACKAGE_DIRNAME);
  const tree = buildFixtureMigrationPackageTree();

  for (const [relativePath, payload] of Object.entries(tree)) {
    const filePath = path.join(packageRoot, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  return packageRoot;
}
