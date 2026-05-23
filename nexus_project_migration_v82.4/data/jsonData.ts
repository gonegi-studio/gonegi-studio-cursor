import type { MetaConfig, ProfileConfig, CharacterBook } from '../types';

const rawData = `
--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v1",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7,
    "plastic_to_wood": 0.6,
    "net_to_vine": 0.65,
    "rubber_to_stone": 0.7
  },
  "notes": "Initial wisdom based on the first successful transformation."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v2",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.08000000000000002
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7,
    "plastic_to_wood": 0.6,
    "net_to_vine": 0.65,
    "rubber_to_stone": 0.7
  },
  "notes": "Evolved to v2 based on profile FARM__OUTDOOR__SUNNY__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v3",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.08000000000000002
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7,
    "plastic_to_wood": 0.6,
    "net_to_vine": 0.65,
    "rubber_to_stone": 0.7
  },
  "notes": "Evolved to v3 based on profile FARM__INDOOR__MIXED__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v4",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.14400000000000002
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7,
    "plastic_to_wood": 0.6,
    "net_to_vine": 0.65,
    "rubber_to_stone": 0.7
  },
  "notes": "Evolved to v4 based on profile FARM__OUTDOOR__GOLDEN__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v5",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.19520000000000004
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7,
    "plastic_to_wood": 0.6,
    "net_to_vine": 0.65,
    "rubber_to_stone": 0.7
  },
  "notes": "Evolved to v5 based on profile FARM__OUTDOOR__SUNNY__ANIMALCLOSE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v6",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.23616000000000006
    }
  },
  "material_rules": {
    "metal_to_wood": 0.73,
    "plastic_to_wood": 0.61,
    "net_to_vine": 0.66,
    "rubber_to_stone": 0.71
  },
  "notes": "Evolved to v6 based on profile FARM__OUTDOOR__STRUCTURE__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v7",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.32892800000000005
    }
  },
  "material_rules": {
    "metal_to_wood": 0.724,
    "plastic_to_wood": 0.61,
    "net_to_vine": 0.66,
    "rubber_to_stone": 0.71
  },
  "notes": "Evolved to v7 based on profile FARM__OUTDOOR__GHIBLI_AIR__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v8",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.34314240000000007
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7192000000000001,
    "plastic_to_wood": 0.62,
    "net_to_vine": 0.67,
    "rubber_to_stone": 0.72
  },
  "notes": "Evolved to v8 based on profile FARM__OUTDOOR__GHIBLI_PALETTE__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v9",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.34314240000000007
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7153600000000001,
    "plastic_to_wood": 0.62,
    "net_to_vine": 0.67,
    "rubber_to_stone": 0.72
  },
  "notes": "Evolved to v9 based on profile FARM__INDOOR__MIXED__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v10",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.3545139200000001
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7122880000000001,
    "plastic_to_wood": 0.63,
    "net_to_vine": 0.68,
    "rubber_to_stone": 0.73
  },
  "notes": "Evolved to v10 based on profile FARM__OUTDOOR__GHIBLI_BRUSH__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v14.5",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.3636111360000001
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7098304000000002,
    "plastic_to_wood": 0.63,
    "net_to_vine": 0.68,
    "rubber_to_stone": 0.73
  },
  "notes": "Evolved to v14.5 based on profile FARM__OUTDOOR__GHIBLI_LIGHT__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "meta_id": "FARM__meta__v12",
  "palette_bank": [
    "pastel_earth_tones"
  ],
  "lighting_bank": {
    "indoor": {
      "rolloff": 0.5,
      "ambient_haze": 0.4000000000000001
    },
    "outdoor": {
      "rolloff": 0,
      "ambient_haze": 0.37088890880000014
    }
  },
  "material_rules": {
    "metal_to_wood": 0.7078643200000002,
    "plastic_to_wood": 0.64,
    "net_to_vine": 0.69,
    "rubber_to_stone": 0.74
  },
  "notes": "Evolved to v12 based on profile FARM__OUTDOOR__GHIBLI_FINAL__WIDE__1.0.0."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.5,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.4,
    "color_bleed": 0.5,
    "film_softness": 0.9,
    "grain": 0.12
  },
  "profile_overrides": {
    "contrast": 0.5,
    "air_haze": 0.4,
    "white_balance_cool": 0.1,
    "palette": "pastel_earth_tones"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__OUTDOOR__GHIBLI_FINAL__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "OUT-GHIBLI-FINAL",
  "scene": "outdoor",
  "notes": "지브리 감성 루프 5단계 – 최종 감성 조율. LUT 및 필름 곡선 적용."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.5,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.4,
    "color_bleed": 0.5,
    "film_softness": 0.6,
    "grain": 0.08
  },
  "profile_overrides": {
    "contrast": 0.6,
    "air_haze": 0.4,
    "white_balance_cool": -0.2,
    "palette": "pastel_earth_tones"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__OUTDOOR__GHIBLI_LIGHT__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "OUT-GHIBLI-LIGHT",
  "scene": "outdoor",
  "notes": "지브리 감성 루프 4단계 – 감정 기반 광량 분포. 따뜻한 광, 잔광."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.5,
  "painterly": {
    "stroke_depth": 0.9,
    "edge_soften": 0.6,
    "color_bleed": 0.6,
    "film_softness": 0.6,
    "grain": 0.08
  },
  "profile_overrides": {
    "contrast": 0.5,
    "air_haze": 0.4,
    "white_balance_cool": 0.1,
    "palette": "pastel_earth_tones"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__OUTDOOR__GHIBLI_BRUSH__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "OUT-GHIBLI-BRUSH",
  "scene": "outdoor",
  "notes": "지브리 감성 루프 3단계 – 붓터치 질감. 붓터치 기반 질감 및 회화적 디테일."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.5,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.5,
    "color_bleed": 0.5,
    "film_softness": 0.7,
    "grain": 0.08
  },
  "profile_overrides": {
    "contrast": 0.4,
    "air_haze": 0.4,
    "white_balance_cool": -0.05,
    "palette": "balanced_warm_tones"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__INDOOR__MIXED__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "INDOOR-MIXED",
  "scene": "indoor",
  "notes": "실내 혼합광 (백열등+자연광) 전용 프로필. 부드러운 톤과 균형잡힌 따뜻한 색감을 가집니다."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.85,
  "structure_weight": 0.5,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.4,
    "color_bleed": 0.5,
    "film_softness": 0.6,
    "grain": 0.08
  },
  "profile_overrides": {
    "contrast": 0.5,
    "air_haze": 0.4,
    "white_balance_cool": 0.1,
    "palette": "seasonal_farm_tones_vibrant"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__OUTDOOR__GHIBLI_PALETTE__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "OUT-GHIBLI-PALETTE",
  "scene": "outdoor",
  "notes": "지브리 감성 루프 2단계 – 팔레트 조화. 계절 색상 조화 및 감정 팔레트 설정."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.6,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.4,
    "color_bleed": 0.4,
    "film_softness": 0.8,
    "grain": 0.1
  },
  "profile_overrides": {
    "contrast": 0.35,
    "air_haze": 0.7,
    "white_balance_cool": 0.1,
    "palette": "soft_sky_tones"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__OUTDOOR__GHIBLI_AIR__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "OUT-GHIBLI-AIR",
  "scene": "outdoor",
  "notes": "지브리 감성 루프 1단계 – 공기톤. Preset: soft_atmosphere, Tone Map: film_curve, Guardrail: light_diffusion_fix."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.5,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.4,
    "color_bleed": 0.5,
    "film_softness": 0.6,
    "grain": 0.08
  },
  "remap": {
    "replacement_strength": 0.85
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__OUTDOOR__STRUCTURE__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "STRUCTURE-FIX",
  "scene": "outdoor",
  "notes": "Booster profile for scenes with high amounts of metal/plastic to remap to natural materials."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.4,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.4,
    "color_bleed": 0.5,
    "film_softness": 0.6,
    "grain": 0.08
  },
  "profile_overrides": {
    "contrast": 0.5,
    "air_haze": 0.4,
    "white_balance_cool": 0.1,
    "palette": "pastel_earth_tones"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": true
  },
  "profile_id": "FARM__OUTDOOR__SUNNY__ANIMALCLOSE__1.0.0",
  "profile_version": "1.0.0",
  "category": "SUBJECT-CLOSE",
  "scene": "outdoor",
  "notes": "For close-ups on animals, preserving texture while simplifying fur/feathers."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.5,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.4,
    "color_bleed": 0.5,
    "film_softness": 0.6,
    "grain": 0.08
  },
  "profile_overrides": {
    "contrast": 0.5,
    "air_haze": 0.4,
    "white_balance_cool": -0.1,
    "palette": "warm_golden_hour"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__OUTDOOR__GOLDEN__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "OUT-GOLDEN",
  "scene": "outdoor",
  "notes": "For golden hour scenes with long shadows and warm light."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.5,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.5,
    "color_bleed": 0.5,
    "film_softness": 0.7,
    "grain": 0.08
  },
  "profile_overrides": {
    "contrast": 0.4,
    "air_haze": 0.4,
    "white_balance_cool": -0.05,
    "palette": "balanced_warm_tones"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__INDOOR__MIXED__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "INDOOR-MIXED",
  "scene": "indoor",
  "notes": "실내 혼합광 (백열등+자연광) 전용 프로필. 부드러운 톤과 균형잡힌 따뜻한 색감을 가집니다."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.5,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.4,
    "color_bleed": 0.5,
    "film_softness": 0.6,
    "grain": 0.08
  },
  "profile_overrides": {
    "contrast": 0.5,
    "air_haze": 0.4,
    "white_balance_cool": 0.1,
    "palette": "pastel_earth_tones"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__OUTDOOR__SUNNY__WIDE__1.0.0",
  "profile_version": "1.0.0",
  "category": "OUT-SUNNY",
  "scene": "outdoor",
  "notes": "For bright, sunny days with clear contrast and vibrant greens."
}--- START OF FILE application/json ---

{
  "style_weight": 0.7,
  "color_weight": 0.6,
  "structure_weight": 0.7,
  "painterly": {
    "stroke_depth": 0.8,
    "edge_soften": 0.4,
    "color_bleed": 0.5,
    "film_softness": 0.6,
    "grain": 0.12
  },
  "profile_overrides": {
    "contrast": 0.5,
    "air_haze": 0.4,
    "white_balance_cool": 0.1,
    "palette": "pastel_earth_tones"
  },
  "remap": {
    "replacement_strength": 0.7
  },
  "subject": {
    "animal_closeup": false
  },
  "profile_id": "FARM__INDOOR__NIGHT__CLOSE__1.0.0",
  "profile_version": "1.0.0",
  "category": "OUT-NIGHT",
  "scene": "night",
  "notes": "For low-light, indoor, or night scenes with artificial lighting."
}`;

const jsonObjects = rawData
  .split('--- START OF FILE application/json ---')
  .map(s => s.trim())
  .filter(s => s.length > 0)
  .map(s => JSON.parse(s));

export const allData: Array<MetaConfig | ProfileConfig> = jsonObjects;

export const initialMetaConfigs: MetaConfig[] = jsonObjects.filter(
  (obj): obj is MetaConfig => 'meta_id' in obj
);

export const profileConfigs: ProfileConfig[] = jsonObjects.filter(
  (obj): obj is ProfileConfig => 'profile_id' in obj
);

export const MEDITERRANEAN_CHRONICLES_DATA: CharacterBook = {
  version: "5.1",
  characters: [],
  subCharacters: [],
  environmentDNA: {
    dawn: "Time & Light: Pre-dawn transitioning to early sunrise. Low-angle cool mist drifting from the sea with layered lavender haze (#E6E6FA). Shadows: Deep purple (#4B0082) and indigo (#1A1A1A) shadows applied strictly to occlusion areas. Sky & Clouds: Pale Blue sky (#E0FFFF) with massive white cumulonimbus clouds. Clouds feature Thistle (#D8BFD8) paint layering and cold rim light highlights in #F0F8FF. Atmosphere: Intense atmospheric perspective with heavy, visible hand-painted brush strokes and opaque gouache layering on distant elements.",
    morning: "Time & Light: Early Morning. High-angle crisp golden sunlight (#FFFACD) casting defined, sharp-edged deep indigo (#1A1A1A) 2D cel-shadows. Sky & Clouds: Vibrant sky-blue gradient (#00BFFF). Towering white cumulonimbus clouds feature a fresh golden rim light (#EEE8AA) on top edges, with light lavender (#E6E6FA) paint on the shaded undersides. Atmosphere: Clear air with high contrast. Distant hills are simplified into flat, painterly teal (#008080) shapes.",
    afternoon: "Time & Light: Mid-afternoon. Intense, vertical white sunlight (#FFFFFF) creating high-contrast lighting. Shadows: Sharp, minimal shadows in deep navy (#000080). Sky & Clouds: Deep cerulean sky (#007BA7) with scattered, fast-moving white clouds. Clouds have strong highlights and cool gray (#D3D3D3) bases. Atmosphere: High clarity, vibrant colors, and a sense of heat. Distant objects have sharp outlines.",
    late_afternoon: "Time & Light: Late afternoon. Warm, directional golden-orange light (#FF8C00) casting long, soft-edged shadows. Shadows: Warm terracotta (#E2725B) and deep brown (#5C4033). Sky & Clouds: Amber and gold gradient sky (#FFBF00) with wispy cirrus clouds catching the orange glow. Atmosphere: Hazy, warm, and nostalgic. Distant elements are bathed in a golden glow.",
    sunset: "Time & Light: Sunset. Low-angle, intense crimson and orange light (#DC143C, #FF4500). Shadows: Long, dramatic shadows in deep violet (#8A2BE2) and black. Sky & Clouds: Fiery sky with streaks of pink, orange, and purple. Clouds are dark silhouettes with brilliant fiery edges. Atmosphere: Dramatic, high-contrast, and emotionally charged.",
    night: "Time & Light: Night. Cool, silvery moonlight (#C0C0C0) and deep blue ambient light (#00008B). Shadows: Soft, diffused shadows in charcoal (#36454F) and black. Sky & Clouds: Deep indigo sky (#4B0082) with a faint glow from stars and a crescent moon. Wispy, translucent clouds. Atmosphere: Quiet, mysterious, and cool.",
    dream: "Time & Light: Ethereal, non-directional pastel light. Shifting colors of mint (#98FF98), rose (#FF007F), and lemon (#FFF700). Shadows: Soft, colorful shadows that blend into the environment. Sky & Clouds: Iridescent sky with floating, surreal cloud shapes in various pastel hues. Atmosphere: Surreal, weightless, and magical. Objects have soft, glowing outlines.",
    spiritual: "Time & Light: Radiant, golden-white light (#FFD700) emanating from within objects. Shadows: Minimal, soft shadows that seem to glow. Sky & Clouds: Luminous, clear sky with a single, massive, radiant cloud. Atmosphere: Transcendent, peaceful, and awe-inspiring. Distant elements are simplified into pure light shapes.",
    global: "Overall Aesthetic: Classic 1980s Studio Ghibli hand-painted style. Heavy use of opaque gouache, visible brushstrokes, and flat cel-shading for characters. Color Palette: Vibrant yet natural, with a focus on 'Ghibli Teal', 'Amber Soul' warmth, and 'Milky Bloom' highlights. Line Work: Soft, organic hand-drawn lines. Composition: Emphasis on nature, atmospheric perspective, and emotional resonance."
  }
};

/**
 * [v13.5 CALIBRATION UNIT] CINEMATIC GOLDEN ANCHOR LUT
 * Standard Meters for autonomous latent calibration (32D Vector Space).
 */
export const GOLDEN_ANCHOR_LUT_V13_5 = {
  "HAL9000_CLOSEUP": {
    name: "HAL9000 Close-up (Intense)",
    description: "Maximum gaze stability, extreme focal compression, high dread.",
    cinematic_vector_32d: [
      0.98, 0.02, 0.95, 0.05, 0.1, 0.9, // Physics (Stillness/Focus)
      0.95, 0.1, 0.85, 0.05, 0.9,     // Emotion (Dread/Anticipation)
      0.99, 0.01, 0.1, 0.95,          // Perception (Saliency)
      0.2, 0.1, 0.1,                   // Narrative
      0.05, 0.01, 0.01, 0.9            // Temporal
      // ... padded to 32 dimensions
    ].concat(new Array(10).fill(0.5)),
    physics_signature: [0.98, 0.02, 0.95, 0.8, 0.1, 0.9]
  },
  "FINCHER_LOW_KEY": {
    name: "Fincher Low-Key (Green/Yellow)",
    description: "Deep shadows, high luminance contrast, clinical stillness.",
    cinematic_vector_32d: [
      0.85, 0.3, 0.7, 0.4, 0.8, 0.6,
      0.6, 0.8, 0.7, 0.4, 0.3,
      0.7, 0.2, 0.1, 0.6,
      0.8, 0.5, 0.2,
      0.1, 0.1, 0.1, 0.3
    ].concat(new Array(10).fill(0.5)),
    physics_signature: [0.85, 0.3, 0.7, 0.4, 0.8, 0.6]
  },
  "GHIBLI_MEADOW_OPEN": {
    name: "Ghibli Meadow (Airy)",
    description: "High chromatic entropy, low dread, extreme depth isolation (multi-plane).",
    cinematic_vector_32d: [
      0.4, 0.1, 0.9, 0.2, 0.95, 0.3,
      0.05, 0.1, 0.2, 0.95, 0.1,
      0.6, 0.1, 0.1, 0.4,
      0.1, 0.2, 0.1,
      0.2, 0.1, 0.1, 0.1
    ].concat(new Array(10).fill(0.5)),
    physics_signature: [0.4, 0.1, 0.9, 0.2, 0.95, 0.3]
  }
};

/**
 * [v13.5 ENGINE ADAPTERS] LATENT STEERING CONFIG
 * Bias parameters for translating intent vectors to engine-specific parameters.
 */
export const LATENT_ADAPTER_CONFIG = {
  midjourney: {
    stylization_range: [0, 1000],
    weird_range: [0, 3000],
    chaos_range: [0, 100],
    aspect_ratio: "16:9"
  },
  video_diffusion: {
    motion_bucket_range: [1, 255],
    fps_standard: 24,
    temporal_consistency_weight: 0.95
  }
};

/**
 * [v13.1 FEEDBACK LOOP] ENGINE INTERPRETATION MATRIX
 * Mapping visual atoms to engine-specific biases for autonomous calibration.
 */
export const CINEMATIC_ENGINE_INTERPRETATION_MATRIX = {
  "midjourney_v6": {
    "hard_side": { contrast_bias: 0.72, saturation_bias: 0.1, sharpness_bias: 0.8 },
    "soft_top": { contrast_bias: 0.3, saturation_bias: -0.1, sharpness_bias: 0.4 },
    "anamorphic": { aspect_ratio_penalty: 0, flare_intensity: 0.9, focal_compression_mult: 1.2 }
  },
  "flux_pro": {
    "hard_side": { contrast_bias: 0.65, saturation_bias: 0.05, sharpness_bias: 0.9 },
    "soft_top": { contrast_bias: 0.2, saturation_bias: 0.0, sharpness_bias: 0.3 },
    "anamorphic": { aspect_ratio_penalty: 0, flare_intensity: 0.4, focal_compression_mult: 1.0 }
  }
};

/**
 * [v13.1 SEMANTIC ATOMS] VISUAL ATOM DICTIONARY
 * Normalized visual descriptors for generative steering.
 */
export const VISUAL_ATOM_DICTIONARY = {
  light_types: ['hard_side', 'soft_top', 'rim_back', 'natural_diffused', 'practical_point'],
  lens_profiles: ['anamorphic', 'spherical', 'vintage', 'broadcast', 'macro'],
  surfaces: ['wet_reflective', 'matte_diffuse', 'metallic', 'organic_soft']
};

export const CINEMATIC_GOLDEN_ANCHORS = {
  "ANCHOR-GHIBLI-STATIC": {
    name: "The Ghibli Stillness",
    description: "Maximum stillness, minimal entropy, intimate subjective distance.",
    retrieval_vector_8d: [0.1, 0.95, 0.1, 0.2, 0.1, 0.2, 0.1, 0.95],
    canonical_vector_64d: new Array(64).fill(0).map((_, i) => i < 8 ? [0.1, 0.95, 0.1, 0.2, 0.1, 0.2, 0.1, 0.95][i] : 0.5),
    representative_style: "Ghibli Masterpiece (Totoro Bus Stop)"
  },
  "ANCHOR-NOLAN-TENSION": {
    name: "The Nolan Pressure",
    description: "High tension, high cognitive load, complex framing.",
    retrieval_vector_8d: [0.6, 0.3, 0.9, 0.5, 0.6, 0.8, 0.9, 0.4],
    canonical_vector_64d: new Array(64).fill(0).map((_, i) => i < 8 ? [0.6, 0.3, 0.9, 0.5, 0.6, 0.8, 0.9, 0.4][i] : 0.5),
    representative_style: "Oppenheimer / Interstellar"
  },
  "ANCHOR-WES-SYMMETRY": {
    name: "The Wes Symmetry",
    description: "Perfect gaze stability, high insignificance, rigid framing.",
    retrieval_vector_8d: [0.3, 0.8, 0.3, 0.9, 0.85, 0.95, 0.4, 0.9],
    canonical_vector_64d: new Array(64).fill(0).map((_, i) => i < 8 ? [0.3, 0.8, 0.3, 0.9, 0.85, 0.95, 0.4, 0.9][i] : 0.5),
    representative_style: "The Grand Budapest Hotel"
  }
};
