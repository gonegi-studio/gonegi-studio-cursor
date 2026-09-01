/**
 * [Scene Measurement Environment & Weather Analyzer]
 *
 * Real environment/weather evidence on top of sceneMeasurementEvidenceCore.ts
 * (ExtractedFrameEvidence, MeasuredValue, InferredValue,
 * buildMeasuredValue, buildInferredValue),
 * sceneMeasurementGeometryDetector.ts (detectFrameGeometry -- reusing
 * its FULL detection list this time, every detected class, not just the
 * primary subject sceneMeasurementCameraAnalyzer.ts picks), and
 * sceneMeasurementLightingAnalyzer.ts (measureFrameLighting, reused
 * verbatim). No new model, no new detector -- this task explicitly
 * scopes reuse to these three cores only, and everything here is
 * composition of their existing outputs, never a new pixel computation
 * or a new detection pass.
 *
 * ---------------------------------------------------------------------
 * MEASURED vs. INFERRED -- the dividing line this task specifies
 * ---------------------------------------------------------------------
 * MEASURED (measureFrameEnvironmentEvidence): every object coco-ssd
 * actually detected in the frame (class, bbox, its own real confidence
 * score -- reused verbatim from sceneMeasurementGeometryDetector.ts, not
 * recomputed), plus the frame's already-measured lighting statistics
 * (reused verbatim from sceneMeasurementLightingAnalyzer.ts). This is
 * direct detector/pixel output, assembled, not interpreted. The outer
 * MeasuredValue's confidence is 1.0 -- describing only that this
 * deterministic assembly step introduces no additional uncertainty of
 * its own; it does NOT assert that every individual detection is
 * certain. Each detected object's own real confidence is preserved
 * faithfully inside detectedObjects[i].confidence, never flattened away.
 *
 * INFERRED (interpretFrameEnvironment): indoor/outdoor placement and
 * weather are both judgments ABOUT what the measured evidence might
 * imply, never read directly off pixels. Indoor/outdoor is inferred from
 * which COCO object classes were actually detected (a 'dining table' or
 * 'couch' is real, if indirect, evidence for indoor; a 'car' or 'traffic
 * light' for outdoor) -- a real, defensible heuristic, though one that
 * honestly inherits any upstream detector misclassification (e.g. this
 * system's own earlier finding that a broom was once misclassified as
 * 'surfboard' at high confidence would, if it recurred, genuinely bias
 * this guess toward 'outdoor' -- an accepted, documented limitation, not
 * something silently filtered out, since doing so would mean this module
 * quietly overriding the detector's own reported confidence with its own
 * plausibility judgment).
 *
 * Weather is NEVER guessed at all here -- guess: null, confidence: null,
 * unconditionally, the same honesty precedent
 * sceneMeasurementCameraAnalyzer.ts already set for field-of-view.
 * Nothing measured in this system (object classes, generic lighting
 * statistics) is a genuine weather signal -- COCO has no rain/snow/cloud
 * classes, and inferring "overcast" from low contrast alone would be
 * fabricating a specific claim this system has no real basis for. This
 * is the intended use of this system's `confidence: number | null`
 * contract: weather estimation from a single frame with no dedicated
 * weather detector has no honest answer worth reporting.
 *
 * ---------------------------------------------------------------------
 * Titanic synthetic environment/weather -- explicitly not reused
 * ---------------------------------------------------------------------
 * This file never reads datasets/movie_reconstruction's environment
 * registries (e.g. titanic-environment-motion-registry.json) or any
 * weather-labeled field anywhere under datasets/movie_reconstruction/ --
 * this system's own earlier coverage assessment already found no real
 * per-scene weather field exists there at all, and the environment data
 * that does exist (Spirited Away's SpatialAnchor-derived
 * ENVIRONMENT_CONDITIONING entries) is a structurally separate data
 * model this file has no import path to. Every value here is computed
 * fresh from a real detector's real output for a real frame.
 *
 * No synthetic data enters this file: it only operates on
 * ExtractedFrameEvidence and measurements derived from it, all already
 * fail-closed-verified upstream.
 */

import {
  buildMeasuredValue,
  buildInferredValue,
  type ExtractedFrameEvidence,
  type MeasuredValue,
  type InferredValue,
} from './sceneMeasurementEvidenceCore.js';
import type { FrameGeometryMeasurementResult, BoundingBox } from './sceneMeasurementGeometryDetector.js';
import type { FrameLightingMeasurement } from './sceneMeasurementLightingAnalyzer.js';

const ENVIRONMENT_EVIDENCE_METHOD = 'environment-evidence-from-geometry-and-lighting-v1' as const;

export interface EnvironmentObjectEvidence {
  class: string;
  bbox: BoundingBox;
  /** The detection's own real confidence score, reused verbatim from
   *  sceneMeasurementGeometryDetector.ts -- never recomputed or
   *  replaced. null is preserved faithfully when the upstream detection
   *  itself carries no confidence value (ProvenanceLineageBase.confidence
   *  is `number | null` by contract); it is never coerced to 0 -- 0 would
   *  falsely assert "confidently not a match" when the honest state is
   *  "no confidence signal available". */
  confidence: number | null;
}

export interface FrameEnvironmentMeasurement {
  /** Every object coco-ssd detected in this frame, not filtered to any
   *  particular class -- an empty array is a real, valid outcome (no
   *  environment-relevant object detected), never an error. */
  detectedObjects: readonly EnvironmentObjectEvidence[];
  lighting: FrameLightingMeasurement;
}

// Well-established, real COCO class associations -- not exhaustive, and
// deliberately excludes ambiguous classes (e.g. 'bench', 'potted plant')
// that plausibly occur both indoors and outdoors, rather than force a
// weak association into either list.
const INDOOR_ASSOCIATED_CLASSES = new Set([
  'chair', 'couch', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
  'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush',
  'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
]);
const OUTDOOR_ASSOCIATED_CLASSES = new Set([
  'car', 'bicycle', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bird',
  'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'kite',
  'surfboard', 'skis', 'snowboard',
]);

/**
 * Assembles real environment evidence for a single real frame from
 * ALREADY-COMPUTED geometry detections and lighting measurement -- both
 * passed in by the caller rather than re-derived here. Geometry and
 * lighting are each real ML/pixel computations; running them a second,
 * redundant time per component (as this function used to do internally)
 * wastes real inference cost for identical results on the same frame. A
 * caller assembling a full Scene Truth measures geometry/lighting exactly
 * once and shares both results across every component that needs them,
 * this one included.
 */
export async function measureFrameEnvironmentEvidence(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  geometry: FrameGeometryMeasurementResult,
  lighting: MeasuredValue<FrameLightingMeasurement>
): Promise<MeasuredValue<FrameEnvironmentMeasurement>> {
  const detectedObjects: EnvironmentObjectEvidence[] = geometry.detections.map((d) => ({
    class: d.value.class,
    bbox: d.value.bbox,
    confidence: d.confidence,
  }));

  return buildMeasuredValue(projectRoot, evidence, ENVIRONMENT_EVIDENCE_METHOD, 1.0, {
    detectedObjects: Object.freeze(detectedObjects),
    lighting: lighting.value,
  });
}

export type IndoorOutdoorGuess = 'indoor' | 'outdoor' | 'uncertain';

export interface IndoorOutdoorInterpretation {
  guess: IndoorOutdoorGuess | null;
  matchedIndoorClasses: readonly string[];
  matchedOutdoorClasses: readonly string[];
}

export interface WeatherInterpretation {
  guess: null;
}

export interface FrameEnvironmentInterpretation {
  indoorOutdoor: InferredValue<IndoorOutdoorInterpretation>;
  weather: InferredValue<WeatherInterpretation>;
}

/**
 * Interprets already-measured environment evidence into indoor/outdoor
 * and weather guesses -- never calls buildMeasuredValue.
 */
export function interpretFrameEnvironment(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  measured: FrameEnvironmentMeasurement
): FrameEnvironmentInterpretation {
  const indoorMatches = measured.detectedObjects.filter((o) => INDOOR_ASSOCIATED_CLASSES.has(o.class));
  const outdoorMatches = measured.detectedObjects.filter((o) => OUTDOOR_ASSOCIATED_CLASSES.has(o.class));

  // A null confidence contributes 0 to this MAX comparison only -- a
  // local arithmetic fallback for the aggregate strength calculation, not
  // a mutation of the stored EnvironmentObjectEvidence.confidence field
  // above, which keeps null faithfully.
  const maxConfidence = (objs: EnvironmentObjectEvidence[]): number => {
    const realConfidences = objs.map((o) => o.confidence).filter((c): c is number => typeof c === 'number');
    return realConfidences.length === 0 ? 0 : Math.max(...realConfidences);
  };

  const indoorStrength = maxConfidence(indoorMatches);
  const outdoorStrength = maxConfidence(outdoorMatches);

  let guess: IndoorOutdoorGuess | null;
  let confidence: number | null;

  if (indoorMatches.length === 0 && outdoorMatches.length === 0) {
    // No real evidence either way -- honestly null, not a coin-flip guess.
    guess = null;
    confidence = null;
  } else if (Math.abs(indoorStrength - outdoorStrength) < 0.1) {
    // Both sides have comparable-strength evidence -- genuinely
    // contested, reported as such rather than arbitrarily picking one.
    guess = 'uncertain';
    confidence = Math.max(indoorStrength, outdoorStrength);
  } else {
    guess = indoorStrength > outdoorStrength ? 'indoor' : 'outdoor';
    confidence = Math.max(indoorStrength, outdoorStrength);
  }

  const indoorOutdoor = buildInferredValue(
    projectRoot,
    evidence,
    'indoor-outdoor-guess-from-detected-object-classes-v1',
    confidence,
    {
      guess,
      matchedIndoorClasses: Object.freeze(indoorMatches.map((o) => o.class)),
      matchedOutdoorClasses: Object.freeze(outdoorMatches.map((o) => o.class)),
    }
  );

  // Weather is never guessed -- see file header. Honest null, not a
  // fabricated claim from indirect lighting statistics alone.
  const weather = buildInferredValue(
    projectRoot,
    evidence,
    'weather-guess-not-attempted-no-weather-detector-v1',
    null,
    { guess: null }
  );

  return { indoorOutdoor, weather };
}
