import {
  REPLAY_COMPARISON_INTELLIGENCE_INPUT_EXAMPLE,
  REPLAY_COMPARISON_INTELLIGENCE_OUTPUT_EXAMPLE,
} from "./replay-comparison-intelligence.fixtures.ts";
import { buildAutomatedVisualSignalAggregation } from "./automated-visual-signal-aggregator.ts";
import { buildReplayComparisonIntelligenceReport } from "./replay-comparison-intelligence.ts";
import { buildRealImageEvaluationIntake } from "./real-image-evaluation-intake.ts";
import {
  IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE,
} from "./image-generation-request.fixtures.ts";
import {
  MANUAL_REAL_IMAGE_INTAKE_JSON_EXAMPLE,
  REAL_IMAGE_EVALUATION_INTAKE_INPUT_EXAMPLE,
  REAL_IMAGE_EVALUATION_INTAKE_OUTPUT_EXAMPLE,
} from "./real-image-evaluation-intake.fixtures.ts";
import type { ManualRealImageEvaluationIntake } from "./real-image-evaluation-intake.ts";

export const MANUAL_REAL_IMAGE_INTAKE_JSON_002: ManualRealImageEvaluationIntake = Object.freeze({
  images: Object.freeze([
    Object.freeze({
      imageRef: "ai-studio-output-session-002",
      sortKey: "001",
      primary: true,
      visualNotes: Object.freeze(["session follow-up output", "glaze drift observed"] as const),
    }),
  ]),
  visualObservations: Object.freeze([
    "identity still aligned with gonegi primary anchor",
    "watercolor glaze softened further in follow-up session",
  ] as const),
  matchScores: Object.freeze({
    identityMatchScore: 0.89,
    anchorMatchScore: 0.86,
    paletteMatchScore: 0.76,
    glazeMatchScore: 0.68,
    lineWeightMatchScore: 0.81,
    poseMatchScore: 0.84,
    emotionMatchScore: 0.82,
  }),
  detectedBreaks: Object.freeze(["minor-glaze-softening", "session-glaze-drift"] as const),
  intakeIndex: 1,
});

export const REAL_IMAGE_EVALUATION_INTAKE_002 = buildRealImageEvaluationIntake({
  request: IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE,
  manualIntake: MANUAL_REAL_IMAGE_INTAKE_JSON_002,
  intakeIndex: 1,
});

export const AUTOMATED_VISUAL_SIGNAL_AGGREGATOR_INPUT_EXAMPLE = Object.freeze({
  intakes: Object.freeze([REAL_IMAGE_EVALUATION_INTAKE_002, REAL_IMAGE_EVALUATION_INTAKE_OUTPUT_EXAMPLE]),
  aggregationIndex: 0,
});

export const AUTOMATED_VISUAL_SIGNAL_AGGREGATION_OUTPUT_EXAMPLE = buildAutomatedVisualSignalAggregation(
  AUTOMATED_VISUAL_SIGNAL_AGGREGATOR_INPUT_EXAMPLE
);

export const AUTOMATED_VISUAL_SIGNAL_AGGREGATION_ID_EXPECTED = "visual-aggregation-001";

export const AUTOMATED_VISUAL_SIGNAL_INTAKE_IDS_EXPECTED = Object.freeze([
  "real-image-intake-001",
  "real-image-intake-002",
] as const);

export const REAL_IMAGE_EVALUATION_INTAKE_REGRESSION_EXAMPLE = buildRealImageEvaluationIntake(
  REAL_IMAGE_EVALUATION_INTAKE_INPUT_EXAMPLE
);

export const REAL_IMAGE_EVALUATION_INTAKE_REGRESSION_OUTPUT = REAL_IMAGE_EVALUATION_INTAKE_OUTPUT_EXAMPLE;

export const REPLAY_COMPARISON_INTELLIGENCE_REGRESSION_EXAMPLE = buildReplayComparisonIntelligenceReport(
  REPLAY_COMPARISON_INTELLIGENCE_INPUT_EXAMPLE
);

export const REPLAY_COMPARISON_INTELLIGENCE_REGRESSION_OUTPUT = REPLAY_COMPARISON_INTELLIGENCE_OUTPUT_EXAMPLE;
