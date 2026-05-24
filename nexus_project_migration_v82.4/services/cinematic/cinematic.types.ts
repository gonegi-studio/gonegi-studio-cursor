/** Phase-2A: cinematic analysis layer — type scaffold only (zero-runtime) */

export type CinematicLayerVersion = "v1";

export type CinematicAnalysisScope = "scene" | "sequence" | "project";

export type CinematicModuleRef = {
  layer: "cinematic";
  version: CinematicLayerVersion;
  scope: CinematicAnalysisScope;
};

export const CINEMATIC_LAYER_VERSION: CinematicLayerVersion = "v1";

export const CINEMATIC_LAYER_NAMESPACE: Readonly<CinematicModuleRef> = Object.freeze({
  layer: "cinematic",
  version: CINEMATIC_LAYER_VERSION,
  scope: "scene",
});
