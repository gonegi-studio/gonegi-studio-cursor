import { StyleBible } from '../../../../types';
import { APP_VERSION } from '../constants/lab.constants';

/**
 * Style Bible Injection Engine
 * Converts the project constitution into a prompt fragment for Gemini.
 */
export const injectStyleConstitution = (bible: StyleBible | null): string => {
    if (!bible || bible.sample_count < 5) return "";

    return `
[PROJECT STYLE CONSTITUTION ${APP_VERSION} ACTIVE]
The following project-wide aesthetic rules are MANDATORY for this analysis:
- Project Identity: ${bible.project_name}
- Statistical Confidence Index (SBCI): ${(bible.sbci_score * 100).toFixed(0)}%
- Target Lens Profile: ${bible.signature.lens_range[0]}-${bible.signature.lens_range[1]}mm calibrated optics
- Signature Color Palette: ${bible.signature.dominant_palette.join(', ')}
- Dominant Lighting Profile: ${bible.signature.lighting_profile}
- Aesthetic Anchors: ${bible.signature.global_style_tags.join(', ')}

ANALYTICAL DIRECTIVE: Prioritize identifying these established project patterns in the current shot to ensure world-state continuity across all segments.
`;
};
