export const EDIT_RHYTHM_EXTRACTOR_ID = 'edit_rhythm' as const;

export interface EditRhythmExtractionPlaceholder {
  extractor_id: typeof EDIT_RHYTHM_EXTRACTOR_ID;
  placeholder_only: true;
  metadata_only: true;
  real_extraction_enabled: false;
  status: 'foundation_ready';
  output_artifact_type: 'metadata_placeholder';
  description: 'Placeholder only — no edit rhythm extraction performed.';
}

export function buildEditRhythmExtractionPlaceholder(): EditRhythmExtractionPlaceholder {
  return {
    extractor_id: EDIT_RHYTHM_EXTRACTOR_ID,
    placeholder_only: true,
    metadata_only: true,
    real_extraction_enabled: false,
    status: 'foundation_ready',
    output_artifact_type: 'metadata_placeholder',
    description: 'Placeholder only — no edit rhythm extraction performed.',
  };
}
