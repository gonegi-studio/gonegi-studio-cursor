import fs from 'node:fs';
import path from 'node:path';
import {
  CANONICAL_ARTSTYLE_PATH,
  CANONICAL_CHARACTER_PROMPTS_PATH,
  CANONICAL_TIMESETTING_LIBRARY_PATH,
  COPY_ONLY_MODE,
  GENERATION_CONTEXT_DIR,
  GENERATION_CONTEXT_MANIFEST_PATH,
  GENERATION_CONTEXT_PHASE,
  GENERATION_CONTEXT_SYSTEM_ID,
  copyCanonicalArtStyle,
  copyCanonicalCharacterFieldFromGraph,
  copyCanonicalTimeSetting,
  loadCanonicalCharacterPrompts,
  loadGenerationContextManifest,
} from './generationContextLoader.js';
import { writeGenerationContextCanonicalFiles } from './generationContextBuilder.js';
import { loadMovieSpatialGraphDataset } from './movieSpatialGraphBuilder.js';
import {
  loadMovieImageAppNativeImportV4Dataset,
  resolveLockedTimeSettingId,
} from './movieTimeSettingLock.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GENERATION_CONTEXT_PASS_VERDICT = 'PASS_GENERATION_CONTEXT_V1' as const;
export const GENERATION_CONTEXT_FAIL_VERDICT = 'FAIL_GENERATION_CONTEXT_V1' as const;
export const GENERATION_CONTEXT_REPORT_PATH =
  'reports/generation_context/GENERATION_CONTEXT_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface GenerationContextReport {
  report_id: string;
  phase: typeof GENERATION_CONTEXT_PHASE;
  system_id: typeof GENERATION_CONTEXT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  canonical_prompt_library_created: boolean;
  copy_only_mode_enabled: boolean;
  character_drift_eliminated: boolean;
  artstyle_drift_eliminated: boolean;
  timesetting_drift_eliminated: boolean;
  checks: {
    canonical_artstyle_exists: boolean;
    canonical_character_exists: boolean;
    canonical_timesetting_exists: boolean;
    runtime_generation_detected: boolean;
    runtime_assembly_detected: boolean;
    copy_only_mode: boolean;
  };
  metrics: {
    artstyle_count: number;
    character_count: number;
    timesetting_count: number;
    copy_operations: number;
    assembly_operations: number;
    generation_operations: number;
  };
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function detectRuntimeGeneration(timeSetting: string, character: string, artStyle: string): boolean {
  if (timeSetting.includes('Sunrise, soft pink') || timeSetting.includes('Morning sunshine')) {
    return true;
  }
  if (/^Gonegi: .+\. .+\. .+\./.test(character)) {
    return true;
  }
  if (artStyle.includes('Mediterranean Reality Foundation:')) {
    return true;
  }
  return false;
}

export function runGenerationContextValidation(root: string): GenerationContextReport {
  const counts = writeGenerationContextCanonicalFiles(root);
  const issues: ValidationIssue[] = [];

  const manifestExists = fs.existsSync(path.join(root, GENERATION_CONTEXT_MANIFEST_PATH));
  const artstyleExists = fs.existsSync(path.join(root, CANONICAL_ARTSTYLE_PATH));
  const characterExists = fs.existsSync(path.join(root, CANONICAL_CHARACTER_PROMPTS_PATH));
  const timesettingExists = fs.existsSync(path.join(root, CANONICAL_TIMESETTING_LIBRARY_PATH));

  if (!manifestExists) {
    issues.push({ code: 'MANIFEST_MISSING', message: 'generation-context-manifest.json missing', severity: 'error' });
  }
  if (!artstyleExists) {
    issues.push({ code: 'ARTSTYLE_MISSING', message: 'canonical-artstyle.txt missing', severity: 'error' });
  }
  if (!characterExists) {
    issues.push({ code: 'CHARACTER_MISSING', message: 'canonical-character-prompts.json missing', severity: 'error' });
  }
  if (!timesettingExists) {
    issues.push({ code: 'TIMESETTING_MISSING', message: 'canonical-timesetting-library.json missing', severity: 'error' });
  }

  const manifest = manifestExists ? loadGenerationContextManifest(root) : null;
  if (manifest && !manifest.copy_only_mode) {
    issues.push({ code: 'COPY_ONLY_MODE_FALSE', message: 'manifest copy_only_mode must be true', severity: 'error' });
  }

  const characterLibrary = characterExists ? loadCanonicalCharacterPrompts(root) : null;
  const requiredCharacters = [
    'gonegi',
    'dana',
    'bardo',
    'mare',
    'elio',
    'serena',
    'kael',
    'zephyro',
    'charon',
    'pietro',
    'enzo',
    'aengdu',
    'gamja',
  ];
  for (const characterId of requiredCharacters) {
    if (!characterLibrary?.prompts[characterId]) {
      issues.push({
        code: 'CHARACTER_PROMPT_MISSING',
        message: `Missing canonical prompt for ${characterId}`,
        severity: 'error',
      });
    }
  }

  let copyOperations = 0;
  let assemblyOperations = 0;
  let generationOperations = 0;
  let runtimeGenerationDetected = false;
  let runtimeAssemblyDetected = false;

  const canonicalArtStyle = copyCanonicalArtStyle(root);
  copyOperations += 1;

  const graphDataset = loadMovieSpatialGraphDataset(root, 'titanic');
  const nativeImportV4 = loadMovieImageAppNativeImportV4Dataset(root, 'titanic');

  if (graphDataset && nativeImportV4) {
    for (let slotIndex = 0; slotIndex < 3; slotIndex += 1) {
      const slot = nativeImportV4.slots[slotIndex];
      const graph = graphDataset.spatial_graphs[slotIndex];
      if (!slot || !graph) continue;

      const timeSettingId = resolveLockedTimeSettingId(graph);
      const expectedCharacter = copyCanonicalCharacterFieldFromGraph(graph, root);
      const expectedTimeSetting = copyCanonicalTimeSetting(timeSettingId, root);

      copyOperations += 3;

      if (slot.artStyle !== canonicalArtStyle) {
        issues.push({
          code: 'ARTSTYLE_COPY_MISMATCH',
          message: `slot ${slotIndex}: artStyle does not match canonical copy`,
          severity: 'error',
        });
      }
      if (slot.character !== expectedCharacter) {
        issues.push({
          code: 'CHARACTER_COPY_MISMATCH',
          message: `slot ${slotIndex}: character does not match canonical copy`,
          severity: 'error',
        });
        runtimeAssemblyDetected = true;
        assemblyOperations += 1;
      }
      if (slot.timeSetting !== expectedTimeSetting) {
        issues.push({
          code: 'TIMESETTING_COPY_MISMATCH',
          message: `slot ${slotIndex}: timeSetting does not match canonical copy for ${timeSettingId}`,
          severity: 'error',
        });
        runtimeAssemblyDetected = true;
        assemblyOperations += 1;
      }

      if (detectRuntimeGeneration(slot.timeSetting, slot.character, slot.artStyle)) {
        runtimeGenerationDetected = true;
        generationOperations += 1;
        issues.push({
          code: 'RUNTIME_GENERATION_DETECTED',
          message: `slot ${slotIndex}: legacy generated prompt patterns detected`,
          severity: 'error',
        });
      }
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const canonicalPromptLibraryCreated =
    artstyleExists && characterExists && timesettingExists && manifestExists;
  const copyOnlyModeEnabled = COPY_ONLY_MODE && manifest?.copy_only_mode === true;
  const artstyleDriftEliminated = canonicalArtStyle.length > 0 && !runtimeGenerationDetected;
  const characterDriftEliminated =
    requiredCharacters.every((id) => Boolean(characterLibrary?.prompts[id])) &&
    !runtimeAssemblyDetected;
  const timesettingDriftEliminated = counts.timesetting_count > 0 && !runtimeGenerationDetected;

  const validationPassed =
    errors.length === 0 &&
    canonicalPromptLibraryCreated &&
    copyOnlyModeEnabled &&
    !runtimeGenerationDetected &&
    !runtimeAssemblyDetected;

  return {
    report_id: `generation_context_report_${Date.now().toString(36)}`,
    phase: GENERATION_CONTEXT_PHASE,
    system_id: GENERATION_CONTEXT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? GENERATION_CONTEXT_PASS_VERDICT : GENERATION_CONTEXT_FAIL_VERDICT,
    validation_passed: validationPassed,
    canonical_prompt_library_created: canonicalPromptLibraryCreated,
    copy_only_mode_enabled: copyOnlyModeEnabled,
    character_drift_eliminated: characterDriftEliminated,
    artstyle_drift_eliminated: artstyleDriftEliminated,
    timesetting_drift_eliminated: timesettingDriftEliminated,
    checks: {
      canonical_artstyle_exists: artstyleExists,
      canonical_character_exists: characterExists,
      canonical_timesetting_exists: timesettingExists,
      runtime_generation_detected: runtimeGenerationDetected,
      runtime_assembly_detected: runtimeAssemblyDetected,
      copy_only_mode: copyOnlyModeEnabled,
    },
    metrics: {
      artstyle_count: counts.artstyle_count,
      character_count: counts.character_count,
      timesetting_count: counts.timesetting_count,
      copy_operations: copyOperations,
      assembly_operations: assemblyOperations,
      generation_operations: generationOperations,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeGenerationContextReport(projectRoot?: string): GenerationContextReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runGenerationContextValidation(root);
  writeJson(root, GENERATION_CONTEXT_REPORT_PATH, report);
  return report;
}

export { SAFE_CREATE_POLICY, GENERATION_CONTEXT_DIR };
