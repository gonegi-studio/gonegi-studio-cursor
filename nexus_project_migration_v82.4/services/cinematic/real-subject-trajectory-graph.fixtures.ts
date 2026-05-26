import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealSubjectTrajectoryGraph,
  computeRealSubjectTrajectoryGraphFingerprint,
} from "./real-subject-trajectory-graph.ts";

export const REAL_SUBJECT_TRAJECTORY_GRAPH_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_SUBJECT_TRAJECTORY_GRAPH_OUTPUT_EXAMPLE = buildRealSubjectTrajectoryGraph(
  REAL_SUBJECT_TRAJECTORY_GRAPH_INPUT_EXAMPLE.realImageAppInputPackage
);

export const REAL_SUBJECT_TRAJECTORY_GRAPH_FINGERPRINT =
  computeRealSubjectTrajectoryGraphFingerprint(
    REAL_SUBJECT_TRAJECTORY_GRAPH_OUTPUT_EXAMPLE
  );
