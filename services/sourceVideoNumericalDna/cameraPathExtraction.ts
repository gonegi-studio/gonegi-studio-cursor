export const CAMERA_PATH_EXTRACTOR_ID = 'camera_path' as const;

export interface CameraPathExtractionPlaceholder {
  extractor_id: typeof CAMERA_PATH_EXTRACTOR_ID;
  placeholder_only: true;
  metadata_only: true;
  real_extraction_enabled: false;
  status: 'foundation_ready';
  output_artifact_type: 'metadata_placeholder';
  description: 'Placeholder only — no camera path extraction performed.';
}

export function buildCameraPathExtractionPlaceholder(): CameraPathExtractionPlaceholder {
  return {
    extractor_id: CAMERA_PATH_EXTRACTOR_ID,
    placeholder_only: true,
    metadata_only: true,
    real_extraction_enabled: false,
    status: 'foundation_ready',
    output_artifact_type: 'metadata_placeholder',
    description: 'Placeholder only — no camera path extraction performed.',
  };
}
