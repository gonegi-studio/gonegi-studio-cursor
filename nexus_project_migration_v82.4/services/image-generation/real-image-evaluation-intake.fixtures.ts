import {
  AUTOMATED_REPLAY_ORCHESTRATOR_INPUT_EXAMPLE,
  AUTOMATED_REPLAY_ORCHESTRATOR_OUTPUT_EXAMPLE,
} from "./automated-replay-orchestrator.fixtures.ts";
import { buildAutomatedReplayOrchestratorPlan } from "./automated-replay-orchestrator.ts";
import { IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE } from "./image-generation-request.fixtures.ts";
import {
  REPLAY_COMPARISON_INTELLIGENCE_INPUT_EXAMPLE,
  REPLAY_COMPARISON_INTELLIGENCE_OUTPUT_EXAMPLE,
} from "./replay-comparison-intelligence.fixtures.ts";
import { buildReplayComparisonIntelligenceReport } from "./replay-comparison-intelligence.ts";
import { buildRealImageEvaluationIntake } from "./real-image-evaluation-intake.ts";
import type { ManualRealImageEvaluationIntake } from "./real-image-evaluation-intake.ts";

export const MANUAL_REAL_IMAGE_INTAKE_JSON_EXAMPLE: ManualRealImageEvaluationIntake = Object.freeze({
  images: Object.freeze([
    Object.freeze({
      imageRef: "ai-studio-output-002",
      sortKey: "002",
      primary: false,
      visualNotes: Object.freeze(["secondary variant", "palette slightly warm"] as const),
    }),
    Object.freeze({
      imageRef: "ai-studio-output-001",
      sortKey: "001",
      primary: true,
      visualNotes: Object.freeze(["primary output", "identity aligned"] as const),
    }),
  ]),
  visualObservations: Object.freeze([
    "identity matches gonegi primary anchor",
    "watercolor glaze present with minor softening",
    "identity matches gonegi primary anchor",
  ] as const),
  matchScores: Object.freeze({
    identityMatchScore: 0.91,
    anchorMatchScore: 0.88,
    paletteMatchScore: 0.79,
    glazeMatchScore: 0.72,
    lineWeightMatchScore: 0.84,
    poseMatchScore: 0.86,
    emotionMatchScore: 0.84,
  }),
  detectedBreaks: Object.freeze(["minor-glaze-softening"] as const),
  intakeIndex: 0,
});

export const REAL_IMAGE_EVALUATION_INTAKE_INPUT_EXAMPLE = Object.freeze({
  request: IMAGE_GENERATION_REQUEST_OUTPUT_EXAMPLE,
  manualIntake: MANUAL_REAL_IMAGE_INTAKE_JSON_EXAMPLE,
  intakeIndex: 0,
});

export const REAL_IMAGE_EVALUATION_INTAKE_OUTPUT_EXAMPLE = buildRealImageEvaluationIntake(
  REAL_IMAGE_EVALUATION_INTAKE_INPUT_EXAMPLE
);

export const REAL_IMAGE_EVALUATION_INTAKE_ID_EXPECTED = "real-image-intake-001";

export const REAL_IMAGE_EVALUATION_INTAKE_IMAGE_REFS_EXPECTED = Object.freeze([
  "ai-studio-output-001",
  "ai-studio-output-002",
] as const);

export const REPLAY_COMPARISON_INTELLIGENCE_REGRESSION_EXAMPLE = buildReplayComparisonIntelligenceReport(
  REPLAY_COMPARISON_INTELLIGENCE_INPUT_EXAMPLE
);

export const AUTOMATED_REPLAY_ORCHESTRATOR_REGRESSION_EXAMPLE = buildAutomatedReplayOrchestratorPlan(
  AUTOMATED_REPLAY_ORCHESTRATOR_INPUT_EXAMPLE
);

export const REPLAY_COMPARISON_INTELLIGENCE_REGRESSION_OUTPUT = REPLAY_COMPARISON_INTELLIGENCE_OUTPUT_EXAMPLE;

export const AUTOMATED_REPLAY_ORCHESTRATOR_REGRESSION_OUTPUT = AUTOMATED_REPLAY_ORCHESTRATOR_OUTPUT_EXAMPLE;
