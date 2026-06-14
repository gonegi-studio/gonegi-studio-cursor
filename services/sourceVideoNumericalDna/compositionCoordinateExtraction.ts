export const COMPOSITION_COORDINATE_EXTRACTOR_ID = 'composition_coordinates' as const;

export interface CompositionCoordinateExtractionPlaceholder {
  extractor_id: typeof COMPOSITION_COORDINATE_EXTRACTOR_ID;
  placeholder_only: true;
  metadata_only: true;
  real_extraction_enabled: false;
  status: 'foundation_ready';
  output_artifact_type: 'metadata_placeholder';
  description: 'Placeholder only — no composition coordinate extraction performed.';
}

export function buildCompositionCoordinateExtractionPlaceholder(): CompositionCoordinateExtractionPlaceholder {
  return {
    extractor_id: COMPOSITION_COORDINATE_EXTRACTOR_ID,
    placeholder_only: true,
    metadata_only: true,
    real_extraction_enabled: false,
    status: 'foundation_ready',
    output_artifact_type: 'metadata_placeholder',
    description: 'Placeholder only — no composition coordinate extraction performed.',
  };
}
