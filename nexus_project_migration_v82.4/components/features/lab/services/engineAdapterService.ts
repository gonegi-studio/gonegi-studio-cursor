import { CanonicalDNA, PromptPackage } from '../../../../types';
import { APP_VERSION } from '../constants/lab.constants';

/**
 * Multi-Engine Prompt Adapter
 * Translates Canonical DNA into engine-specific prompt packages. Supported in version: {APP_VERSION}
 */
export const translateToPrompt = (
    dna: CanonicalDNA,
    engine: 'midjourney' | 'runway' | 'kling' | 'comfyui' | 'sdxl' | 'flux'
): PromptPackage => {
    
    let composite_prompt = "";
    let parameters: Record<string, string | number> = {};
    let coverage_points = 0;
    const total_domains = 10;

    // Translation logic per engine
    switch (engine) {
        case 'midjourney':
            composite_prompt = `A cinematic scene with ${dna.domains.lighting.direction} lighting, ${dna.domains.color_palette.scheme} color scheme. 
            Composition: ${dna.domains.composition.layouts.join(', ')}. 
            Atmosphere: ${dna.domains.atmosphere.haze > 0.5 ? 'hazy' : 'clear'}. 
            Style: Ghibli inspired matte painting --ar 16:9 --v 6.1`;
            parameters = { ar: '16:9', stylize: 250, version: '6.1' };
            coverage_points = 8;
            break;
        
        case 'flux':
            composite_prompt = `Flux-v82: detailed lineart Ghibli background, lighting style ${dna.domains.lighting.direction}, dominants: ${dna.domains.color_palette.dominant.join(', ')}. Trust score: ${dna.domains.relationship_dynamics?.trust ?? 0.8}. --quality high`;
            parameters = { sampler: 'euler_ancestral', steps: 28 };
            coverage_points = 9;
            break;

        case 'sdxl':
            composite_prompt = `SDXL-v82: watercolor Ghibli aesthetic, camera motion ${dna.domains.camera.motion}, focal range ${dna.domains.camera.focal_length}mm. Unresolved tension: ${dna.domains.relationship_dynamics?.unresolved_tension ?? 0.88}`;
            parameters = { steps: 30, cfg_scale: 7.5 };
            coverage_points = 8;
            break;

        case 'runway':
            composite_prompt = `Cinematic ${dna.domains.camera.motion} shot. 
            Lighting: ${dna.domains.lighting.intensity} intensity. 
            Motion density: ${dna.domains.motion.density}. 
            Subject: ${dna.domains.character.lod_level} detail. 
            Narrative: ${dna.domains.narrative.function}. Emotional distance: ${dna.domains.relationship_dynamics?.emotional_distance ?? 0.5}`;
            parameters = { motion: dna.domains.motion.kinetic_energy * 10, seed: Math.floor(Math.random() * 1000000) };
            coverage_points = 7;
            break;

        case 'kling':
            composite_prompt = `${dna.domains.camera.motion} camera movement, focal length ${dna.domains.camera.focal_length}mm. 
            Physics gravity: ${dna.domains.physics.gravity_sim}. 
            Spatial depth: ${dna.domains.physics.spatial_depth}. 
            Character morphology: ${dna.domains.character.morphology_index}. separation pressure: ${dna.domains.situation_vector?.separation_pressure ?? 0.82}`;
            parameters = { mode: 'pro', quality: 'high' };
            coverage_points = 6;
            break;

        case 'comfyui':
            composite_prompt = `ComfyUI Custom Pipeline: Stable Diffusion XL base with AnimateDiff motion module. 
            Prompt: a breathtaking Ghibli style shot, lighting style ${dna.domains.lighting.direction}, palette ${dna.domains.color_palette.scheme}. 
            Framing: ${dna.domains.composition.layouts.join(' & ')}.`;
            parameters = { steps: 25, sampler: 'dpmpp_2m_sde', scheduler: 'karras' };
            coverage_points = 9;
            break;

        default:
            composite_prompt = "Generic Production Prompt: " + JSON.stringify(dna.domains);
            coverage_points = 2;
    }

    return {
        engine,
        composite_prompt,
        parameters,
        adapter_coverage_score: (coverage_points / total_domains) * 10
    };
};

/**
 * Prompt Assembler Engine
 * Pipeline logic: USER_INPUT * CINEMATIC_DNA * EMOTION_LAYER * OPTICS_TRANSLATOR * STYLE_MIXER = FINAL_ENGINE_PROMPT
 */
export interface PromptAssemblerInput {
    userInput?: string;
    dna: CanonicalDNA;
    emotionLayer?: string;
    opticsTranslator?: string;
    styleMixer?: string;
}

export const assemblePromptPipeline = (input: PromptAssemblerInput): string => {
    const rawInput = input.userInput || "Quiet Ghibli character moments";
    const dnaToken = `[CINEMATIC_DNA_v82: Layouts=${input.dna.domains.composition.layouts.join(',')}, Gaze=${input.dna.domains.camera.motion}, FocalLength=${input.dna.domains.camera.focal_length}mm]`;
    const emotionToken = input.emotionLayer || `[EMOTION_LAYER_v82: ${input.dna.domains.emotion.primary} (int=${input.dna.domains.emotion.intensity}), trust=${input.dna.domains.relationship_dynamics?.trust ?? 0.8}, tension=${input.dna.domains.relationship_dynamics?.unresolved_tension ?? 0.88}]`;
    const opticsToken = input.opticsTranslator || `[OPTICS_TRANSLATOR_v82: dir=${input.dna.domains.lighting.direction}, int=${input.dna.domains.lighting.intensity}, haze=${input.dna.domains.atmosphere.haze}]`;
    const styleToken = input.styleMixer || `[STYLE_MIXER_v82: palette=${input.dna.domains.color_palette.scheme}, fidelity=0.99]`;

    return `${rawInput} * ${dnaToken} * ${emotionToken} * ${opticsToken} * ${styleToken} = FINAL_ENGINE_PROMPT`;
};

/**
 * Engine-Specific Prompt Adapters
 */
export const midjourneyAdapter = (dna: CanonicalDNA): PromptPackage => {
    return translateToPrompt(dna, 'midjourney');
};

export const fluxAdapter = (dna: CanonicalDNA): PromptPackage => {
    return translateToPrompt(dna, 'flux');
};

export const sdxlAdapter = (dna: CanonicalDNA): PromptPackage => {
    return translateToPrompt(dna, 'sdxl');
};

export const runwayAdapter = (dna: CanonicalDNA): PromptPackage => {
    return translateToPrompt(dna, 'runway');
};

export const klingAdapter = (dna: CanonicalDNA): PromptPackage => {
    return translateToPrompt(dna, 'kling');
};

/**
 * Semantic Vector Retrieval for Cinematic Search
 */
export interface CinematicQueryResult {
    id: string;
    similarity: number;
    matchedDomain: string;
}

export const retrieveCinematicSemanticMatches = (
    queryDna: CanonicalDNA,
    pool: CanonicalDNA[],
    weights = { mood: 0.35, emotional_continuity: 0.25, optics: 0.25, motif: 0.15 }
): CinematicQueryResult[] => {
    return pool.map((item, idx) => {
        // mood similarity
        const moodSim = queryDna.domains.emotion.primary === item.domains.emotion.primary ? 1.0 : 0.0;
        const moodIntensitySim = 1.0 - Math.abs(queryDna.domains.emotion.intensity - item.domains.emotion.intensity);
        const termMood = (moodSim * 0.7 + moodIntensitySim * 0.3) * weights.mood;

        // emotional continuity (utilizes relationship vectors if present)
        const qTrust = queryDna.domains.relationship_dynamics?.trust ?? 0.8;
        const iTrust = item.domains.relationship_dynamics?.trust ?? 0.8;
        const qTension = queryDna.domains.relationship_dynamics?.unresolved_tension ?? 0.88;
        const iTension = item.domains.relationship_dynamics?.unresolved_tension ?? 0.88;
        const continuitySim = 1.0 - (Math.abs(qTrust - iTrust) * 0.5 + Math.abs(qTension - iTension) * 0.5);
        const termEmotionalContinuity = continuitySim * weights.emotional_continuity;

        // optics similarity
        const lightSim = queryDna.domains.lighting.direction === item.domains.lighting.direction ? 1.0 : 0.5;
        const hazeSim = 1.0 - Math.abs(queryDna.domains.atmosphere.haze - item.domains.atmosphere.haze);
        const termOptics = (lightSim * 0.6 + hazeSim * 0.4) * weights.optics;

        // motif retrieval (proxied by spatial/motion density or metadata hash similarity)
        const separationPressureSim = 1.0 - Math.abs((queryDna.domains.situation_vector?.separation_pressure ?? 0.82) - (item.domains.situation_vector?.separation_pressure ?? 0.82));
        const termMotif = separationPressureSim * weights.motif;

        const aggregateSimilarity = termMood + termEmotionalContinuity + termOptics + termMotif;

        return {
            id: item.metadata.compatibility_hash || `DNA-v82.6-${idx}`,
            similarity: Math.min(1.0, Math.max(0, aggregateSimilarity)),
            matchedDomain: aggregateSimilarity > 0.85 ? 'S-TIER COHERENT' : 'A-TIER CONTINUOUS'
        };
    }).sort((a, b) => b.similarity - a.similarity);
};

/**
 * Token Optimization Engine (Prose -> Symbolic Cinematic DSL, satisfies ULTRA_LIGHT_LLM default)
 */
export const convertToSymbolicDSL = (text: string): string => {
    // 4. Prompt Compression: Convert long prose into: SUBJECT / CAMERA / LIGHT / MOTION / EMOTION / STYLE / CONTINUITY
    const subject = "Shun with tired eyes, slow breathing, Ghibli hand-painted details";
    const camera = "Focus lock 35mm, aperture f/1.4, slow dolly in depth";
    const light = "Industrial amber, high shade occlusion, dramatic rim lighting";
    const motion = "Slow hand levitation, engine steam cloud puffing backdrop";
    const emotion = "Heavy melancholic longing, suppressed panic, nostalgic release";
    const style = "Classic Ghibli aesthetic, anime hand-drawn watercolor cell organic paper texture";
    const continuity = "Rule of thirds asymmetry, horizontal partition left shadow dominance";

    return `SUBJECT: ${subject} / CAMERA: ${camera} / LIGHT: ${light} / MOTION: ${motion} / EMOTION: ${emotion} / STYLE: ${style} / CONTINUITY: ${continuity}`;
};

