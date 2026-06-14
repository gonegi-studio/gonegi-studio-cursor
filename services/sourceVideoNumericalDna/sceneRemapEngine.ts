export const SCENE_REMAP_EXTRACTOR_ID = 'scene_remap' as const;

export interface SceneRemapEnginePlaceholder {
  extractor_id: typeof SCENE_REMAP_EXTRACTOR_ID;
  placeholder_only: true;
  metadata_only: true;
  real_extraction_enabled: false;
  status: 'foundation_ready';
  output_artifact_type: 'metadata_placeholder';
  description: 'Placeholder only — no scene remap engine execution performed.';
}

export function buildSceneRemapEnginePlaceholder(): SceneRemapEnginePlaceholder {
  return {
    extractor_id: SCENE_REMAP_EXTRACTOR_ID,
    placeholder_only: true,
    metadata_only: true,
    real_extraction_enabled: false,
    status: 'foundation_ready',
    output_artifact_type: 'metadata_placeholder',
    description: 'Placeholder only — no scene remap engine execution performed.',
  };
}
