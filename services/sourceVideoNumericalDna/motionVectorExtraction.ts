export const MOTION_VECTOR_EXTRACTOR_ID = 'motion_vectors' as const;

export interface MotionVectorExtractionPlaceholder {
  extractor_id: typeof MOTION_VECTOR_EXTRACTOR_ID;
  placeholder_only: true;
  metadata_only: true;
  real_extraction_enabled: false;
  status: 'foundation_ready';
  output_artifact_type: 'metadata_placeholder';
  description: 'Placeholder only — no motion vector extraction performed.';
}

export function buildMotionVectorExtractionPlaceholder(): MotionVectorExtractionPlaceholder {
  return {
    extractor_id: MOTION_VECTOR_EXTRACTOR_ID,
    placeholder_only: true,
    metadata_only: true,
    real_extraction_enabled: false,
    status: 'foundation_ready',
    output_artifact_type: 'metadata_placeholder',
    description: 'Placeholder only — no motion vector extraction performed.',
  };
}
