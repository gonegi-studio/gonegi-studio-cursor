import { MasterCoreRenderRules, MasterCoreStyleCoreInput } from '../../types';

export const LEGACY_CANONICAL_VIDEO_HASH = 'LEGACY-VIDEO-GONEGI-V1';
export const LEGACY_CANONICAL_VIDEO_TIMESTAMP = 1748365200000;

export interface LegacyVideoRecipeFixture {
  hash_id: string;
  source_engine: string;
  prompt_data: { positive: string; negative: string };
  hyper_parameters: {
    seed: number;
    denoising: number;
    motion_bucket: number;
    cfg: number;
    aspect_ratio: string;
  };
  pipeline_context: {
    model_checkpoint_hash: string;
    sampling_steps: number;
    scheduler: string;
  };
  source_ref: string;
  timestamp: number;
}

export interface LegacyAsmMotionAnalysisFixture {
  hash_id: string;
  source_engine: string;
  canvas_fit: { originalRatio: string; needsFit: boolean; scaleMode: string };
  timeline: string;
  motion_peak: number;
  quality: { total: number; eye_gloss: number; mask_fixation: number };
  physics_logic: { wind_force: number; gravity_scale: number; air_resistance: number };
  material_dna: {
    gouache_viscosity: number;
    brush_grain_density: number;
    edge_sharpness: number;
    aesthetic: string;
  };
  visual_tags: string[];
  timestamp: number;
}

export function buildCanonicalLegacyVideoRecipeFixture(): LegacyVideoRecipeFixture {
  return {
    hash_id: LEGACY_CANONICAL_VIDEO_HASH,
    source_engine: 'Veo',
    prompt_data: {
      positive:
        'Gonegi harbor dusk walk, warm gouache cel-shading, Mediterranean chronicle continuity, soft hand-painted animation.',
      negative: 'text, watermark, logo, photoreal, harsh contrast, modern UI',
    },
    hyper_parameters: {
      seed: 428157,
      denoising: 0.7,
      motion_bucket: 127,
      cfg: 7.5,
      aspect_ratio: '16:9',
    },
    pipeline_context: {
      model_checkpoint_hash: 'ghibli_v3_final_prod_4k',
      sampling_steps: 25,
      scheduler: 'Euler a',
    },
    source_ref: 'legacy-import-gonegi-seq002-anchor',
    timestamp: LEGACY_CANONICAL_VIDEO_TIMESTAMP,
  };
}

export function buildCanonicalLegacyAsmFixture(): LegacyAsmMotionAnalysisFixture {
  return {
    hash_id: LEGACY_CANONICAL_VIDEO_HASH,
    source_engine: 'Veo',
    canvas_fit: { originalRatio: '16:9', needsFit: false, scaleMode: 'fit' },
    timeline: '0-4s establish harbor; 4-8s companion motion crest; 8-12s rest cadence release',
    motion_peak: 0.82,
    quality: { total: 0.91, eye_gloss: 0.88, mask_fixation: 0.86 },
    physics_logic: { wind_force: 0.34, gravity_scale: 1.0, air_resistance: 0.05 },
    material_dna: {
      gouache_viscosity: 0.85,
      brush_grain_density: 0.52,
      edge_sharpness: 0.74,
      aesthetic: '80s Ghibli Nostalgia',
    },
    visual_tags: ['harbor_dusk', 'companion_motion', 'gouache_cel', 'warm_palette'],
    timestamp: LEGACY_CANONICAL_VIDEO_TIMESTAMP,
  };
}

export function buildCanonicalLegacyStyleCoreFixture(): MasterCoreStyleCoreInput {
  return {
    styleKey: 'gonegi-warm-cinematic',
    materialKey: 'glass-glaze-soft',
    lightingKey: 'warm-harbor-golden',
    brushworkKey: 'soft-handpainted-animation',
    paletteKey: 'warm-harbor-evening',
    styleAnchor: 'Ghibli Mediterranean Chronicles v5.1',
    styleStrength: 0.992351,
  };
}

export function buildCanonicalLegacyRenderRulesFixture(): MasterCoreRenderRules {
  return {
    global:
      'Preserve opaque gouache, visible brush grain, and warm harbor palette across all renders.',
    character:
      'Maintain Gonegi silhouette, amber gaze lock, and identity-stable face topology.',
    environment:
      'Harbor Mediterranean atmosphere with cel-shadow depth and painterly sky gradient.',
    composition: 'Rule-of-thirds subject placement with foreground-midground-background layering.',
  };
}
