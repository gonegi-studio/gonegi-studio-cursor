export const BLOCKING_EXTRACTOR_ID = 'blocking_data' as const;

export interface BlockingExtractionPlaceholder {
  extractor_id: typeof BLOCKING_EXTRACTOR_ID;
  placeholder_only: true;
  metadata_only: true;
  real_extraction_enabled: false;
  status: 'foundation_ready';
  output_artifact_type: 'metadata_placeholder';
  description: 'Placeholder only — no blocking extraction performed.';
}

export function buildBlockingExtractionPlaceholder(): BlockingExtractionPlaceholder {
  return {
    extractor_id: BLOCKING_EXTRACTOR_ID,
    placeholder_only: true,
    metadata_only: true,
    real_extraction_enabled: false,
    status: 'foundation_ready',
    output_artifact_type: 'metadata_placeholder',
    description: 'Placeholder only — no blocking extraction performed.',
  };
}
