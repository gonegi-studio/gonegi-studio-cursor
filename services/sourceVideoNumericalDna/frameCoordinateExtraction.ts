export const FRAME_COORDINATE_EXTRACTOR_ID = 'frame_coordinates' as const;

export interface FrameCoordinateExtractionPlaceholder {
  extractor_id: typeof FRAME_COORDINATE_EXTRACTOR_ID;
  placeholder_only: true;
  metadata_only: true;
  real_extraction_enabled: false;
  status: 'foundation_ready';
  output_artifact_type: 'metadata_placeholder';
  description: 'Placeholder only — no frame coordinate extraction performed.';
}

export function buildFrameCoordinateExtractionPlaceholder(): FrameCoordinateExtractionPlaceholder {
  return {
    extractor_id: FRAME_COORDINATE_EXTRACTOR_ID,
    placeholder_only: true,
    metadata_only: true,
    real_extraction_enabled: false,
    status: 'foundation_ready',
    output_artifact_type: 'metadata_placeholder',
    description: 'Placeholder only — no frame coordinate extraction performed.',
  };
}
