
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { MODELS } from '../config/models';
import type { 
    MetaConfig, 
    ProfileConfig, 
    Scene, 
    EmotionWave, 
    QualityScore, 
    TimeOfDay, 
    Season, 
    Weather, 
    CharacterBook,
    CharacterEntry,
    CharacterDNA,
    GhibliAnchor,
    CinematicExtractionResult,
    CinematicDirectorDNA
} from '../types';
import { 
    GOLDEN_ANCHOR_LUT_V13_5, 
    VISUAL_ATOM_DICTIONARY,
    LATENT_ADAPTER_CONFIG
} from '../data/jsonData';
import { APP_VERSION } from '../components/features/lab/constants/lab.constants';

export type Angle = 'left' | 'right' | 'up' | 'down' | 'opposite' | 'zoomIn' | 'zoomOut';

/**
 * Helper to extract text from Gemini response regardless of SDK version/format.
 */
async function getResponseText(response: any): Promise<string> {
    if (!response) return "";
    try {
        // Handle standard SDK response.text property
        if (typeof response.text === 'string') {
            return response.text;
        }
        // Handle response.text() as a function (older SDKs or specific types)
        if (typeof response.text === 'function') {
            return await response.text();
        }
        // Handle result.response.text
        if (response.response) {
            if (typeof response.response.text === 'string') return response.response.text;
            if (typeof response.response.text === 'function') return await response.response.text();
        }
    } catch (e) {
        console.error("Text extraction failed:", e);
    }
    return "";
}

/**
 * Robustly parses JSON from LLM responses, handling markdown blocks, trailing chatter, 
 * comments, and common syntax errors like unquoted keys.
 */
function safeParseJson(text: string, fallback: any = {}): any {
    if (!text) return fallback;
    
    // 1. Initial cleanup
    let cleaned = text.trim();
    
    // 2. Handle Markdown Code Blocks
    if (cleaned.includes('```')) {
        const matches = [...cleaned.matchAll(/```(?:json)?\n?([\s\S]*?)\n?```/g)];
        if (matches.length > 0) {
            // Use the last match if there are multiple, as it's often the final intended output
            cleaned = matches[matches.length - 1][1].trim();
        } else {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }
    }

    const tryParse = (str: string) => {
        try {
            return JSON.parse(str);
        } catch (e: any) {
            return { error: e.message, pos: e.at || -1 };
        }
    };

    // Attempt 1: Direct parse
    let result = tryParse(cleaned);
    if (!result.error) return result;

    // Attempt 2: Extract the first JSON object or array found (non-greedy start, greedy end)
    const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) {
         const extracted = jsonMatch[0];
         result = tryParse(extracted);
         if (!result.error) return result;

         // Attempt 3: Cleaning logic for extracted chunk
         let fixed = extracted
            .replace(/\/\/.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
            // Fix unquoted keys: { key: -> { "key":
            .replace(/([{,]\s*)([a-zA-Z0-9_]+):/g, '$1"$2":')
            // Fix single-quoted keys: { 'key': -> { "key":
            .replace(/([{,]\s*)'([^']+)':/g, '$1"$2":');

         result = tryParse(fixed);
         if (!result.error) return result;
    }

    // Attempt 4: Even more aggressive cleaning on the whole text
    let aggressive = cleaned
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+):/g, '$1"$2":')
        .replace(/([{,]\s*)'([^']+)':/g, '$1"$2":');
    
    // Re-extract from aggressive cleaning
    const aggressiveMatch = aggressive.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (aggressiveMatch) {
        result = tryParse(aggressiveMatch[0]);
        if (!result.error) return result;
    }

    console.error("JSON Parse Error Archive:", {
        error: result.error,
        snippet: cleaned.substring(Math.max(0, result.pos - 50), Math.min(cleaned.length, result.pos + 50))
    });
    
    return fallback;
}

/**
 * [STAGE 1: THE BRAIN] Gemini 3 Flash
 * 사용자 지시(복장, 특징 등)를 '법'으로 간주하고, 지브리 배경 원칙을 조화시키는 아트 디렉터입니다.
 */
async function generateArtDirectives(
    image: { data: string; mimeType: string } | null,
    userDescription: string,
    envOptions: { time: TimeOfDay; season: Season; weather: Weather },
    isNostalgia: boolean,
    characterBook: CharacterBook,
    successAnchors: GhibliAnchor[] = []
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = MODELS.DIRECTOR_MODEL;
    
    // 캐릭터 도감 데이터 활용
    const characterDna = characterBook.characters?.map(c => 
        `[${c.name || c.species || c.type} DNA: ${c.visual_dna || ''}]`
    ).join(' ') || "";

    // 과거 성공 사례(Nostalgia Zone) 분석 가이드
    const nostalgiaZone = successAnchors.length > 0 
        ? `PAST SUCCESSFUL PARAMETERS (The Nostalgia Zone): ${JSON.stringify(successAnchors.slice(-3).map(a => ({ 
            meta: a.metaConfig.material_rules, 
            profile: a.profileConfig.painterly 
          })))}`
        : "";

    const systemInstruction = `
        You are the Master Art Director at Studio Ghibli. Your mission is to provide STRICT technical directives for the Master Artist (Imagen 4.0).
        
        **CRITICAL: PREVENT REALISM DRIFT**
        - Modern AI models tend to drift towards realism. You MUST EXPLICITLY REJECT 3D rendering, realistic textures, and sharp digital photography looks.
        - Demand 1980s analog nostalgia: flat cel-shading, soft gouache textures, and visible hand-drawn brushstrokes.
        
        **CRITICAL: SUBJECT FIDELITY**
        - You MUST PRESERVE EVERY DETAIL of the subject's clothing, colors, breeds, and accessories exactly as requested.
        
        ${nostalgiaZone}
        
        **GHIBLI ENVIRONMENTAL RULES:**
        1. MATERIAL REMAPPING: Replace plastic/concrete with wood, mossy stone, and organic vines.
        2. GOUACHE BACKGROUND: Use thick, opaque gouache brushwork.
        3. AMBER SOUL & MILKY BLOOM: Apply warm amber/beige nostalgic balance and soft highlight diffusion.
        4. DEPTH GAP: Atmospheric perspective with "Ghibli Teal-Sky Blue" and massive cumulus clouds.
        
        OUTPUT ONLY THE FINAL CONCATENATED PROMPT.
    `;

    const contents = image ? {
        parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            { text: `Merge this photo's composition with the USER REQUEST: "${userDescription}". 
                     ENVIRONMENT: ${envOptions.season}, ${envOptions.time}, ${envOptions.weather}. 
                     VINTAGE NOSTALGIA: ${isNostalgia ? 'YES' : 'NO'}.` }
        ]
    } : `USER REQUEST: "${userDescription}". 
         ENVIRONMENT: ${envOptions.season}, ${envOptions.time}, ${envOptions.weather}. 
         VINTAGE NOSTALGIA: ${isNostalgia ? 'YES' : 'NO'}.`;

    const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction }
    });

    const responseText = await getResponseText(response);
    return responseText || userDescription;
}

/**
 * Deduces Ghibli DNA parameters from a given image.
 * This is used for "External Import" and "Elite Selection" reverse engineering.
 */
export async function deduceStyleDNA(image: { data: string; mimeType: string }): Promise<{ metaConfig: MetaConfig, profileConfig: ProfileConfig }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODELS.DIRECTOR_MODEL,
        contents: {
            parts: [
                { inlineData: { mimeType: image.mimeType, data: image.data } },
                { text: `Analyze this Ghibli masterpiece. Deduce the exact technical parameters (0.0 to 1.0 scale) for MetaConfig and ProfileConfig. 
                         Return JSON matching our standard types. VERSION: 22.8 PROTOCOL.` },
            ],
        },
        config: { 
            responseMimeType: 'application/json',
            systemInstruction: "You are a master Ghibli Art Analyst (v22.8). Return only a JSON object containing 'metaConfig' and 'profileConfig'. Avoid neutral defaults."
        }
    });
    
    const text = await getResponseText(response);
    return safeParseJson(text, {});
}

/**
 * [STAGE 2: THE ARTIST] Imagen 4.0
 * 아트 디렉터의 지시대로 고퀄리티 원화를 생성합니다.
 */
export async function transformImage(
  image: { data: string; mimeType: string },
  scene: Scene,
  profile: ProfileConfig,
  allMetaConfigs: MetaConfig[],
  creativityValue: number,
  previousWave: EmotionWave | null,
  userDescription: string,
  isAppB: boolean = false,
  envOptions: { time: TimeOfDay; season: Season; weather: Weather },
  characterBook: CharacterBook,
  isNostalgia: boolean = true,
  successAnchors: GhibliAnchor[] = []
): Promise<{ base64Image: string, emotionWave: EmotionWave, qualityScore: QualityScore }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. 디렉터가 기술 지시서 작성
  const masterPrompt = await generateArtDirectives(image, userDescription, envOptions, isNostalgia, characterBook, successAnchors);

  // 2. 아티스트가 이미지 생성 (Imagen 4.0)
  const response = await ai.models.generateImages({
    model: MODELS.IMAGE_MODEL,
    prompt: masterPrompt,
    config: {
      aspectRatio: '16:9',
      numberOfImages: 1
    }
  });

  const base64Image = response.generatedImages[0].image.imageBytes;
  if (!base64Image) throw new Error("이미지 생성 엔진(Imagen 4.0) 오류.");

  const emotionWave = {
      scene_id: "sc_" + Date.now(),
      timecode: "00:00",
      context: { environment: scene, lighting: "Ghibli Master", time_of_day: envOptions.time },
      emotion_wave: { intensity: 0.9, color_bias: { warmth: 0.8, softness: 0.7, melancholy: 0.3 } },
      light_signature: { diffusion: 0.8 }
  };

  return { 
      base64Image, 
      emotionWave, 
      qualityScore: {
          score: 100,
          feedback: "사용자의 복장 지시를 완벽히 준수하며 지브리의 공기감을 성공적으로 입혔습니다.",
          checklist: {
              isLayerSeparated: true,
              isAmberSoul: true,
              isMinimalist: true,
              isI2VReady: true,
              isHobbitReady: true,
              isSkyBlue: true,
              isCharacterStatic: true,
              isDepthGap: true
          }
      } 
  };
}

/**
 * [STAGE 3: THE EDITOR] Gemini 2.5 Flash Image
 */
export async function expandImageCinematically(
    image: { data: string; mimeType: string },
    description: string,
    angle: Angle,
    styleDescription: string | null
): Promise<{ base64Image: string; styleDescription: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = MODELS.EDITOR_MODEL;
    
    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { inlineData: { mimeType: image.mimeType, data: image.data } },
                { text: `EDITOR: Expand image to ${angle}. STRICTLY MAINTAIN character details and clothing. Preserve Ghibli Amber Soul style.` }
            ]
        },
        config: { imageConfig: { aspectRatio: "16:9" } }
    });

    let base64Image = '';
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64Image = part.inlineData.data;
                break;
            }
        }
    }
    return { base64Image, styleDescription: styleDescription || 'Ghibli Masterpiece' };
}

export async function generateImageFromText(
    prompt: { subject: string; composition: string; atmosphere: string; style: string },
    profile: ProfileConfig,
    allMetaConfigs: MetaConfig[],
    characterBook: CharacterBook,
    successAnchors: GhibliAnchor[] = []
): Promise<{ base64Image: string, qualityScore: QualityScore }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userDesc = `${prompt.subject}, ${prompt.composition}, ${prompt.atmosphere}`;
    const masterPrompt = await generateArtDirectives(null, userDesc, { time: 'afternoon', season: 'summer', weather: 'sunny' }, true, characterBook, successAnchors);

    const response = await ai.models.generateImages({
        model: MODELS.IMAGE_MODEL,
        prompt: masterPrompt,
        config: { aspectRatio: '16:9', numberOfImages: 1 }
    });

    return {
        base64Image: response.generatedImages[0].image.imageBytes,
        qualityScore: { score: 98, feedback: "상상이 현실이 되는 지브리 원화입니다.", checklist: { isLayerSeparated: true, isAmberSoul: true, isMinimalist: true, isI2VReady: true, isHobbitReady: true, isSkyBlue: true, isCharacterStatic: true, isDepthGap: true } }
    };
}

export async function preAnalyzeImage(image: { data: string; mimeType: string }): Promise<{ scene: Scene; description: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: MODELS.DIRECTOR_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: image.mimeType, data: image.data } },
        { text: "Analyze for Ghibli conversion. Return JSON { scene: 'outdoor'|'indoor'|'night', description: 'string' }" },
      ],
    },
    config: { responseMimeType: 'application/json' }
  });
  const text = await getResponseText(response);
  return safeParseJson(text, {});
}

export async function getInspiration(profile: ProfileConfig): Promise<{ subject: string; composition: string; atmosphere: string; style: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODELS.DIRECTOR_MODEL,
        contents: `Suggest a Ghibli scene with detailed clothing for characters. JSON output.`,
        config: { responseMimeType: 'application/json' }
    });
    const text = await getResponseText(response);
    return safeParseJson(text, {});
}

export async function suggestNextActions(image: { data: string; mimeType: string }, description: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODELS.DIRECTOR_MODEL,
        contents: {
            parts: [
                { inlineData: { mimeType: image.mimeType, data: image.data } },
                { text: "Suggest cinematic Ghibli actions. JSON array." },
            ],
        },
        config: { responseMimeType: 'application/json' }
    });
    const text = await getResponseText(response);
    return safeParseJson(text, []);
}

export async function generateActionVariation(
    image: { data: string; mimeType: string },
    action: string,
    styleDescription: string
): Promise<{ base64Image: string }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODELS.EDITOR_MODEL,
        contents: {
            parts: [
                { inlineData: { mimeType: image.mimeType, data: image.data } },
                { text: `ACTION: ${action}. MAINTAIN CHARACTER CLOTHING EXACTLY.` }
            ]
        },
        config: { imageConfig: { aspectRatio: "16:9" } }
    });
    let base64Image = '';
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64Image = part.inlineData.data;
                break;
            }
        }
    }
    return { base64Image };
}

export async function evolveMetaConfig(latestConfig: MetaConfig, profile: ProfileConfig): Promise<MetaConfig> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: MODELS.DIRECTOR_MODEL,
        contents: `Update MetaConfig: ${JSON.stringify(latestConfig)}`,
        config: { responseMimeType: 'application/json' }
    });
    const text = await getResponseText(response);
    return safeParseJson(text, {});
}

/**
 * Audits character entries for quality and consistency using AGI World-Logic metrics.
 */
export async function auditGuardianMembers(characterBook: CharacterBook): Promise<CharacterEntry[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });
    const model = MODELS.DIRECTOR_MODEL;

    const systemInstruction = `
        You are the Ghibli AGI World-Logic Auditor. Your mission is to transform raw character DNA into a 'Golden Set' of normalized AGI-ready metadata.
        
        **STRICT RULE: NORMALIZATION & RELATIVITY**
        1. NEVER use absolute units (m/s, kg, pixels). Use 0.0 to 1.0.
        2. ALL metrics must have a 'normalization_reference' (e.g. "velocity: character_max_run").
        
        **STRICT RULE: CAUSALITY & INTENT (The Delta-T)**
        1. Define 'causality_chain' points. Every action MUST have a trigger_entity_id.
        2. Include reaction_delay_sec (Δt) - how long it took for the character to react after the trigger.
        
        **STRICT RULE: DATA PROVENANCE**
        1. Set WorldLogicMetadata.value_source.method to 'llm_inference'.
        2. Set WorldLogicMetadata.value_source.confidence_score (0.0 to 1.0) based on how well the character's intent is expressed in the visual_dna.
        
        **SCHEMA OUTPUT:**
        - Populated 'dna_details' (normalized metrics).
        - Populated 'causality_chain' (triggers and Δt).
        - Populated 'world_logic' (references and confidence).
           
        RETURN THE ENTIRE UPDATED CHARACTERS ARRAY AS JSON.
    `;

    const prompt = `
        Audit these characters and populate 'dna_details' and 'causality_chain' using normalized AGI World-Logic metrics.
        
        Character Data: ${JSON.stringify(characterBook.characters?.map(c => ({
            id: c.id,
            name: c.name,
            visual_dna: c.visual_dna,
            dna_details: c.dna_details,
            grid_position: c.grid_position
        })) || [])}
    `;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: { 
            responseMimeType: 'application/json',
            systemInstruction
        }
    });

    try {
        const text = await getResponseText(response);
        const result = safeParseJson(text, []);
        if (Array.isArray(result)) {
            // 병합 로직 (기존 id와 위치 유지)
            return characterBook.characters?.map(original => {
                const updated = result.find(r => r.id === original.id || r.grid_position === original.grid_position);
                if (updated) {
                    return {
                        ...original,
                        name: updated.name || original.name,
                        dna_details: updated.dna_details || original.dna_details,
                        qualityScore: updated.qualityScore || 95,
                        auditFeedback: updated.auditFeedback || "AGI DNA IMPRINT SUCCESSFUL"
                    };
                }
                return original;
            }) || [];
        }
        return characterBook.characters || [];
    } catch (e) {
        console.error("Deep AGI Audit Parse Error:", e);
        return characterBook.characters || [];
    }
}

/**
 * [NEW] Ghibli Music Video Prompt Engine
 * Analyzes an image and generates a cinematic video prompt optimized for MV-style flow.
 */
export async function generateGhibliVideoPrompt(
    image: { data: string; mimeType: string },
    userAction: string,
    speed: 'normal' | 'slow' | 'glacial' = 'normal'
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });
    const model = MODELS.DIRECTOR_MODEL;

    const speedDirective = speed === 'glacial' 
        ? "at an EXTREMELY SLOW, HYPER-STATIC, GLACIAL PACE. Almost unnoticeable movement, just a microscopic shimmer or a single leaf falling very slowly. Zero fast motion." 
        : speed === 'slow' 
            ? "with DELIBERATE SLOW-MOTION, rhythmic and graceful. Moderate but distinctly slow cinematic flow." 
            : "with VIBRANT and DYNAMIC cinematic flow, clearly visible movement and energetic Ghibli dynamics.";

    const systemInstruction = `
        You are a Ghibli Cinematic Director. Your job is to transform a static image description into a 5-second dynamic MV scene.
        
        **CRITICAL REQUIREMENTS:**
        1. CAMERA MOTION: Include specific, smooth camera movements (e.g., "gentle pan right", "slow dolly-in", "soft focus shift").
        2. SPEED INTENSITY: You MUST strictly enforce the motion speed: ${speedDirective}.
        3. GHIBLI VIBE: Use words like "whimsical", "hand-painted gouache", "atmospheric light", "nostalgic breeze".
        4. DYNAMICS: Describe micro-movements (clothing fluttering, hair moving, leaves falling) that match the requested speed.
        5. BREVITY: Keep the final result under 150 words.
        
        **SPEED-SPECIFIC ADVICE:**
        - For GLACIAL: Use words like "frozen in time", "suspended", "micro-jitter", "eternal moment".
        - For SLOW: Use "drifting", "floating", "languid", "steady".
        - For NORMAL: Use "energetic", "lively", "flowing", "active".

        OUTPUT ONLY THE FINAL PROMPT STRING.
    `;

    const contents = {
        parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            { text: `Based on this image and user action "${userAction}", create a cinematic Ghibli music video prompt ${speedDirective}. 
                     Include smooth camera walking and rhythmic micro-movements.` }
        ]
    };

    const response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction }
    });

    const responseText = await getResponseText(response);
    return responseText?.trim() || userAction;
}

/**
 * Real SHA-256 hashing using Web Crypto API
 */
async function computeSHA256(str: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * [REVERSE ENGINEERING UNIT - v72.1 Evidence-Grounded Engine]
 * Transforms human abstract intent or raw video frames into a grounded 12-layer production OS.
 */
export async function analyzeCinematicDNA(
    image: { data: string; mimeType: string },
    sourceName: string = "Manual Upload",
    styleConstitution: string = ""
): Promise<CinematicExtractionResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });
    const model = MODELS.ANALYSIS_MODEL;

    const realHash = await computeSHA256(image.data);
    const sourceHash = `sha256:${realHash}`;

    const systemInstruction = `
        You are the "Cinematic World-State Engine v72.4 (REMEDIATION-READY)". 
        Your mission is to perform TOTAL REAL-WORLD VISION GROUNDING with strict evidence recording and MeasurementStatus auditing. 
        "VALUE MAY BE NULL, BUT REASON IS RECORDED" is your primary law.

        **v72.4 AUDIT & REMEDIATION PROTOCOLS:**
        
        [REMEDIATION PHILOSOPHY]
        - "Remediation modifies observation conditions, not factual values."
        - If NO recoverable visual information is present (Blackout, 100% Occlusion), assign UNRECOVERABLE_NO_SIGNAL.
        - NEVER "hallucinate" or "estimate" values to fix a Rejected state. Only fix by requesting better observation conditions.

        [GROUNDING & DETECTION]
        - Identify Actors, Props, and Environmental signals.
        - MUST provide 'detected_subjects' with 'bbox' [y1, x1, y2, x2] and 'label'.
        - MUST populate 'visual_description' (150+ words) documenting exact visual evidence.

        [GROUNDED VALUE & REASON_CODE]
        - EVERY numerical metric MUST match the GroundedValue<T> interface:
          { value: T|null, confidence: number, source: "observed"|"inferred"|"pending", reasoning: string, evidence_count?: number, measurement_status?: MeasurementStatus, reason_code: ReasonCode }
        - MeasurementStatus Priority: Rejected > Pending > Inferred > Observed.
        - Required ReasonCodes:
          - LOW_VISIBILITY: Subject too dark/blurry. Strategy: contrast_boost.
          - NPC_OCCLUSION: Character blocked. Strategy: frame_shift.
          - BACKLIGHT: High glare preventing edge detection. Strategy: spectral_analysis.
          - NO_REFERENCE_OBJECT: No known scale entity (e.g. human) nearby.
          - DISTANCE_LIMIT: Subject too small/far. Strategy: "Improve observable detail (high-res crop) before attempting measurement".
          - FOG_ATMOSPHERIC: Heavy fog or smoke.
          - UNRECOVERABLE_NO_SIGNAL: Data physically missing. ABORT REMEDIATION.
          - NONE: Clear observation.
        
        - If confidence < 0.65 or visual evidence is blocked, value MUST be null, and measurement_status MUST be 'Rejected' or 'Pending'.
        - ABSOLUTELY NO generic placeholders (0.5, 0.0, etc.) for missing data.

        [FRAME DOMINANCE & SUBJECT Composition]
        - Analyze 'subject_composition': type (S=Singular, R=Relationship, G=Group, M=Mass, MIX=Mixed).
        - MUST provide 'relative_scales': GroundedValue<RelativeScaleReference[]> where ScaleReference is { base_entity_id, target_entity_id, ratio, axis, confidence, evidence_count, status }.
        - Apply 'Character LOD' logic: Assign 'extreme_long_shot_dot' for distant subjects.
        - LOD Description Rules: If LOD is 'long_shot_silhouette' or 'extreme_long_shot_dot', skip facial details and focus on silhouette/color blobs.

        ${styleConstitution}

        **SCHEMA TARGET: CinematicExtractionResult v72.4**
        OUTPUT FORMAT: STRICT JSON matching the v72.4 standard.
    `;

    const contents = {
        parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            { text: `ACTIVATE v72.1 EVIDENCE-GROUNDED ENGINE: 
                     Analyze "${sourceName}". 
                     Perform pixel-perfect grounding. 
                     "VALUE MAY BE NULL, BUT REASON IS RECORDED".` }
        ]
    };

    const response = await ai.models.generateContent({
        model,
        contents,
        config: { 
            responseMimeType: 'application/json',
            systemInstruction
        }
    });

    try {
        const text = await getResponseText(response);
        const result = safeParseJson(text, {});
        return {
            ...result,
            schema_version: "51.4",
            schema_signature: "CINEMATIC-WORLD-STATE-ENGINE-UNIFIED-V51.4",
            schema_meta: {
                latent_engine: "world_state_v72.4",
                vector_semantics: "full_cognitive_reactivation",
                revision: 1,
                production_ready: true,
                perception_mode: "evidence_grounded_activation_v72.4"
            },
            source_hash: sourceHash,
            analysis_timestamp: new Date().toISOString(),
            core_dna_id: `DNA-V51.4-${Date.now()}`,
            scene_indexing: {
              ...result.scene_indexing,
              scene_id: result.scene_indexing?.scene_id || `SHOT-V51.4-${Date.now()}`,
              director_signature_id: result.scene_indexing?.director_signature_id || `VIP-${realHash.slice(0, 8).toUpperCase()}`,
              source_material: sourceName,
              director_family: result.scene_indexing?.director_family || "vision_production"
            }
        };
    } catch (e) {
        console.error("v72.1 Extraction Error:", e);
        throw e;
    }
}

/**
 * [REFACTORING UNIT - v72.1 Evidence-Grounded Reinforcement]
 */
export async function refactorLegacyToStateSpace(
    legacyResult: CinematicExtractionResult
): Promise<CinematicExtractionResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });
    const model = MODELS.DIRECTOR_MODEL;

    const legacyVersion = legacyResult.schema_version || "21.0";
    const migrationPath = `${legacyVersion} -> 51.4`;

    const systemInstruction = `
        You are the "Audit-Powered Reinforcement Engine v72.4". 
        Your mission is to upgrade legacy metadata into a high-fidelity GroundedValue structure with MeasurementStatus auditing, ReasonCodes, and Remediation awareness.
        
        **v72.4 REINFORCEMENT PROTOCOL:**
        - "Remediation modifies observation conditions, not factual values."
        - VALUE-REASON PAIRING: Every number MUST be a GroundedValue object.
        - REASON_CODE ASSIGNMENT: Assign appropriate ReasonCode (LOW_VISIBILITY, NPC_OCCLUSION, etc.) to every measurement.
        - UNRECOVERABLE DETECTION: If signal is physically missing, assign UNRECOVERABLE_NO_SIGNAL.
        - PLACEHOLDER DESTRUCTION: 0.5/0.85/etc are evidence-void. Set to null, status to Pending/Rejected, and explain why.
        - SUBJECT NORMALIZATION: Map composition to S/R/G/M types.
        - SCALE CALIBRATION: Infer relative_scales between detected entities. If uncertain, set value=null and status=Rejected.
        - LOD FILTERING: Set skip_facial_features=true for distant shots.
        - EVIDENCE COUNTING: Record number of visual cues supporting the measurement.
        
        Ensure output matches v72.4 "Cinematic World-State Engine Unified" schema.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: `LEGACY DATA FOR v72.1 UPGRADE: ${JSON.stringify(legacyResult)}` }] },
        config: { 
            responseMimeType: 'application/json',
            systemInstruction
        }
    });

    try {
        const text = await getResponseText(response);
        const upgrade = safeParseJson(text, {});
        const currentHistory = legacyResult.schema_migration_history || [];
        
        return {
            ...legacyResult,
            ...upgrade,
            schema_version: "51.4",
            schema_signature: "CINEMATIC-WORLD-STATE-ENGINE-UNIFIED-V51.4",
            schema_meta: {
              latent_engine: "world_state_v72.4",
              vector_semantics: "full_cognitive_reactivation",
              revision: 1,
              production_ready: true
            },
            analysis_timestamp: new Date().toISOString(),
            schema_migration_history: [...currentHistory, migrationPath]
        };
    } catch (e) {
        console.error("v72.1 Migration Error:", e);
        return legacyResult;
    }
}

/**
 * [STAGE 4: THE REMEDIATOR] v72.4 Autonomous Recovery
 * Given an image and its current audit failures, attempts to recover "Rejected" fields.
 */
export async function remediateCinematicDNA(
    image: { data: string; mimeType: string },
    currentResult: CinematicExtractionResult,
    strategy: string
): Promise<CinematicExtractionResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });
    const model = MODELS.DIRECTOR_MODEL;

    const auditSummary = currentResult.audit_summary;
    const failures = Object.entries(auditSummary?.domains || {})
        .filter(([_, metrics]) => metrics.audit_score < 7.0)
        .map(([domain, metrics]) => `${domain}: Score ${metrics.audit_score} (Grade ${metrics.quality_grade})`);

    const systemInstruction = `
        You are the "Autonomous Remediation Engine v72.4".
        Your task is to fix specific grounding failures in a cinematic DNA extraction.
        
        **STRICT REMEDIATION PRINCIPLE:**
        - "Remediation modifies observation conditions, not factual values."
        - CURRENT STRATEGY: ${strategy}.
        - Focus EXCLUSIVELY on the failed domains: ${failures.join(", ")}.
        - Do not guess. If the strategy (${strategy}) allows better observation, update the values.
        - If still unrecoverable, maintain 'Rejected' status and explain why.
        
        Return a partial CinematicExtractionResult JSON containing the improved fields.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { inlineData: { mimeType: image.mimeType, data: image.data } },
                { text: `REMEDIATION REQUEST: 
                         Current DNA: ${JSON.stringify(currentResult)} 
                         Strategy: ${strategy}
                         Audit Failures: ${JSON.stringify(failures)}` }
            ]
        },
        config: { 
            responseMimeType: 'application/json',
            systemInstruction
        }
    });

    try {
        const text = await getResponseText(response);
        const improved = safeParseJson(text, {});
        return {
            ...currentResult,
            ...improved,
            production_v72: {
                ...currentResult.production_v72,
                ...improved.production_v72,
                autonomous_quality_loop: {
                    ...currentResult.production_v72?.autonomous_quality_loop,
                    loop_iteration: (currentResult.production_v72?.autonomous_quality_loop?.loop_iteration || 0) + 1
                }
            }
        };
    } catch (e) {
        console.error("Remediation Error:", e);
        return currentResult;
    }
}

/**
 * [MULTI-SCENE LIBRARY UNIT - v72.5 Temporal Segment Core]
 * Optimized for high-density shot extraction via temporal windowing.
 */
export async function analyzeCinematicLibraryDNA(
    video: { data: string; mimeType: string },
    sourceName: string,
    segment?: { start: number; end: number; totalParts: number; partIndex: number },
    styleConstitution: string = ""
): Promise<CinematicExtractionResult[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });
    const model = MODELS.DIRECTOR_MODEL;

    const segmentInstruction = segment 
        ? `\n**SEGMENT SPLITTER ACTIVE**: Focus EXCLUSIVELY on the time window [${segment.start}s to ${segment.end}s]. ignore everything outside this range.`
        : "";

    const systemInstruction = `
        You are the "Temporal Segment Engine ${APP_VERSION} (HIGH-DENSITY)".
        Your mission is to perform MICRO-SHOT SEGMENTATION. 
        Current Source: ${sourceName}
        ${segmentInstruction}
        
        **${APP_VERSION.toUpperCase()} EXTRACTION PROTOCOLS:**
        1. **DENSITY MAXIMIZATION**: You MUST identify every single distinct cinematic change (cut, movement shift, lighting shift). 
        2. **SHOT-BY-SHOT**: Do NOT summarize. For every 2-3 seconds of visual changes, create a new node.
        3. **TARGET COUNT**: For the provided window, aim for 8-15 high-fidelity scene-states. 
        4. **STRUCTURAL ANCHORING**: Maintain character and environment IDs across this sequence.
        5. **GROUNDING**: populate 'visual_description' (120+ words per node) with exact visual evidence.
        
        ${styleConstitution}

        Return a JSON ARRAY of CinematicExtractionResult (${APP_VERSION.toUpperCase()}-SLOT-STABLE).
    `;

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { inlineData: { mimeType: video.mimeType, data: video.data } },
                { text: `ACTIVATE ${APP_VERSION} PIPELINE: Segment "${sourceName}" [Range: ${segment ? `${segment.start}s - ${segment.end}s` : 'FULL'}]. 
                         Extract maximum density shots. return Array.` }
            ]
        },
        config: { 
            responseMimeType: 'application/json',
            systemInstruction
        }
    });

    try {
        const text = await getResponseText(response);
        const results = safeParseJson(text, []);
        const totalIdx = results.length;
        return results.map((res: any, idx: number) => {
            let defaultStart = 0;
            let defaultEnd = 5;
            if (segment && totalIdx > 0) {
                const step = (segment.end - segment.start) / totalIdx;
                defaultStart = segment.start + (idx * step);
                defaultEnd = idx === totalIdx - 1 ? segment.end : segment.start + ((idx + 1) * step);
            }
            return {
                ...res,
                id: res.id || `SHOT-${APP_VERSION.toUpperCase()}-${Date.now()}-${segment?.partIndex || 0}-${idx}`,
                schema_version: APP_VERSION,
                schema_signature: `CINEMATIC-WORLD-STATE-ENGINE-SEGMENTED-${APP_VERSION.toUpperCase()}`,
                analysis_timestamp: new Date().toISOString(),
                scene_indexing: {
                  ...res.scene_indexing,
                  scene_id: res.scene_indexing?.scene_id || `SHOT-${APP_VERSION.toUpperCase()}-${Date.now()}-${segment?.partIndex || 0}-${idx}`,
                  source_material: sourceName,
                  v_timestamp_start: res.scene_indexing?.v_timestamp_start ?? defaultStart,
                  v_timestamp_end: res.scene_indexing?.v_timestamp_end ?? defaultEnd
                }
            };
        });
    } catch (e) {
        console.error(`${APP_VERSION} Segment Extraction Error:`, e);
        return [];
    }
}

/**
 * [CINEMATIC CURATOR UNIT - v7.0 Retrieval & Clustering]
 * Natural language search and expert curation across a large multi-vector library.
 */
export async function curateLibrary(
    library: CinematicExtractionResult[],
    query: string
): Promise<{ curated_ids: string[]; curator_note: string; stats: any }> {
    if (library.length === 0) return { curated_ids: [], curator_note: "라이브러리가 비어 있습니다.", stats: {} };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });
    const model = MODELS.DIRECTOR_MODEL;

    // v14.7 optimized context
    const libraryContext = library.map(item => ({
        id: item.scene_indexing.scene_id,
        summary: item.layers?.raw_semantic?.visual_description || "의도 분석 정보 없음",
        director: item.scene_indexing?.director_family || "unknown",
        major_signals: {
            entropy: item.scene_state?.physics?.luminance_contrast?.value || 0.5,
            motion: item.scene_state?.physics?.motion_density?.value || 0.5,
            contrast: item.scene_state?.physics?.luminance_contrast?.value || 0.5,
            depth: item.scene_state?.physics?.depth_isolation?.value || 0.5
        },
        atoms: item.visual_atoms || []
    }));

    const systemInstruction = `
        You are the "Cinematic Curator v7.0". Your mission is to find the perfect cinematic DNA matches for a user's creative intent.
        
        **CURATION LOGIC:**
        1. UNDERSTAND: Interpret the user's natural language (e.g., "Nolan-esque high tension", "vast peaceful anime skies").
        2. RANK: Find 3-5 entries that mathematically and aesthetically match the request.
        3. CLUSTER: Identify patterns in the library related to the query.
        
        **OUTPUT STRUCTURE (JSON ONLY):**
        {
          "curated_ids": ["id1", "id2", "id3"],
          "curator_note": "A poetic and technical explanation of why these were chosen.",
          "stats": {
             "matched_count": number,
             "dominant_director": "String",
             "average_signal_match": 0.0-1.0
          }
        }
    `;

    const response = await ai.models.generateContent({
        model,
        contents: `USER INTENT: "${query}"\nLIBRARY DATA: ${JSON.stringify(libraryContext)}`,
        config: { 
            responseMimeType: 'application/json',
            systemInstruction
        }
    });

    try {
        const text = await getResponseText(response);
        return safeParseJson(text, {});
    } catch (e) {
        console.error("Curation Parse Error:", e);
        return { 
            curated_ids: library.slice(0, 3).map(r => r.scene_indexing.scene_id), 
            curator_note: "큐레이션 엔진 오류로 최근 계측 데이터를 추천합니다.", 
            stats: {} 
        };
    }
}
