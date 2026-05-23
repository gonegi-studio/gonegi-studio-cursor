/**
 * NEXUS OS Golden Set Images Collection (v82.5)
 * High-fidelity reference keys and synthetic asset placeholders for cinematic verification.
 */

export interface GoldenSetImage {
  id: string;
  name: string;
  description: string;
  category: "lighting" | "composition" | "scale" | "atmosphere";
  mockUrl: string;
  resolution: { width: number; height: number };
  calibrationScores: {
    luminance: number;
    gazeVectorConfidence: number;
    spatialSymmetry: number;
  };
}

export const GOLDEN_SET_IMAGES: GoldenSetImage[] = [
  {
    id: "gset_001_shun_silhouette",
    name: "Shun Volumetric Silhouette",
    description: "Atmospheric backlit frame of the character Shun standing near mechanical valves under low key lighting.",
    category: "atmosphere",
    mockUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1025&auto=format&fit=crop",
    resolution: { width: 1920, height: 1080 },
    calibrationScores: {
      luminance: 0.12,
      gazeVectorConfidence: 0.98,
      spatialSymmetry: 0.76
    }
  },
  {
    id: "gset_002_steam_stack_angle",
    name: "Steam Valve Angle Frame",
    description: "Industrial close-up showing volumetric steam plumes in cold morning sunlight with strong depth of field.",
    category: "lighting",
    mockUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1070&auto=format&fit=crop",
    resolution: { width: 1920, height: 1080 },
    calibrationScores: {
      luminance: 0.65,
      gazeVectorConfidence: 0.45,
      spatialSymmetry: 0.88
    }
  },
  {
    id: "gset_003_narrative_bridge_close",
    name: "Causal Connection Close-Up",
    description: "High-contrast focal transition frame optimized for facial emotion tracking and gaze vector calibration.",
    category: "scale",
    mockUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1170&auto=format&fit=crop",
    resolution: { width: 3840, height: 2160 },
    calibrationScores: {
      luminance: 0.45,
      gazeVectorConfidence: 0.99,
      spatialSymmetry: 0.52
    }
  }
];

export function getGoldenImageById(id: string): GoldenSetImage | undefined {
  return GOLDEN_SET_IMAGES.find(img => img.id === id);
}
