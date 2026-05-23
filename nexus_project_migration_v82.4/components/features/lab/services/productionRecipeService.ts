import { CanonicalDNA, PromptPackage, ProductionRecipe, CinematicExtractionResult } from '../../../../types';
import { APP_VERSION } from '../constants/lab.constants';

/**
 * Production Recipe System
 * Stores successful generation settings for 100% reproducibility. Active under {APP_VERSION}
 */
export const createRecipe = (
    result: CinematicExtractionResult,
    promptPkg: PromptPackage,
    settings: {
        model_version: string;
        seed: number;
        negative_prompt?: string;
        sampler?: string;
        cfg_scale?: number;
        steps?: number;
    }
): ProductionRecipe => {
    if (!result.canonical_dna) {
        throw new Error("CANONICAL DNA REQUIRED FOR RECIPE CAPTURE");
    }

    // Get latest RGS score if available
    const rgs_score = result.generation_validation && result.generation_validation.length > 0 
        ? result.generation_validation[result.generation_validation.length - 1].rgs_total 
        : 0;

    return {
        recipe_id: `RECIPE-${result.id}-${Date.now()}`,
        source_id: result.id,
        canonical_dna: result.canonical_dna,
        prompt_package: promptPkg,
        engine_settings: settings,
        rgs_score: rgs_score,
        created_at: new Date().toISOString(),
        label: `${result.scene_indexing.source_material} - ${promptPkg.engine.toUpperCase()} Master`
    };
};

/**
 * Calculates Recipe Stability Score based on the number of high-quality recipes relative to total items.
 */
export const calculateRecipeStability = (recipes: ProductionRecipe[], totalItems: number): number => {
    if (totalItems === 0) return 0;
    const highQualityRecipes = recipes.filter(r => r.rgs_score >= 8.5).length;
    const stability = (highQualityRecipes / totalItems) * 10;
    return Math.min(10, stability);
};
