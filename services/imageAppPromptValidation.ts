import fs from 'node:fs';
import path from 'node:path';
import { writeImageAppPromptCanonicalFiles } from './imageAppPromptBuilder.js';
import {
  CANONICAL_ARTSTYLE_PROMPT_PATH,
  CANONICAL_CHARACTER_PROMPTS_V2_PATH,
  CANONICAL_TIMESETTING_PROMPTS_PATH,
  copyImageAppArtStylePrompt,
  copyImageAppCharacterFieldFromGraph,
  copyImageAppTimeSettingPrompt,
  detectArtStyleIdOnly,
  detectCharacterDnaMarker,
  detectMetadataFields,
  detectTimesettingMetadataFormat,
  GENERATION_PROMPT_MANIFEST_PATH,
  IMAGE_APP_PROMPT_PHASE,
  IMAGE_APP_PROMPT_SYSTEM_ID,
  loadCanonicalCharacterPromptsV2,
  loadGenerationPromptManifest,
} from './imageAppPromptLoader.js';
import {
  loadMovieImageAppNativeImportV5Dataset,
  NATIVE_IMPORT_V5_OUTPUTS,
  writeMovieImageAppNativeImportV5Datasets,
} from './movieImageAppNativeImportBuilder.js';
import { loadMovieSpatialGraphDataset } from './movieSpatialGraphBuilder.js';
import { resolveLockedTimeSettingId } from './movieTimeSettingLock.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IMAGE_APP_PROMPT_PASS_VERDICT = 'PASS_CANONICAL_PROMPT_RESTORATION_V1' as const;
export const IMAGE_APP_PROMPT_FAIL_VERDICT = 'FAIL_CANONICAL_PROMPT_RESTORATION_V1' as const;
export const IMAGE_APP_PROMPT_REPORT_PATH =
  'reports/generation_context/IMAGE_APP_PROMPT_REPORT.json' as const;

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

export interface ImageAppPromptReport {
  report_id: string;
  phase: typeof IMAGE_APP_PROMPT_PHASE;
  system_id: typeof IMAGE_APP_PROMPT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  image_app_prompt_library_created: boolean;
  artstyle_prompt_restored: boolean;
  character_prompt_restored: boolean;
  timesetting_prompt_restored: boolean;
  database_format_removed: boolean;
  image_app_ready: boolean;
  checks: {
    artstyle_exact_prompt_match: boolean;
    character_exact_prompt_match: boolean;
    timesetting_exact_prompt_match: boolean;
    prompt_library_loaded: boolean;
    database_record_leak: boolean;
    metadata_leak: boolean;
    artstyle_id_only: boolean;
    exact_prompt_present: boolean;
    character_dna_marker_present: boolean;
    metadata_fields_present: boolean;
    plain_prompt_only: boolean;
    timesetting_metadata_format: boolean;
    plain_prompt_format: boolean;
  };
  metrics: {
    artstyle_prompt_count: number;
    character_prompt_count: number;
    timesetting_prompt_count: number;
    v5_slot_samples_checked: number;
  };
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function runImageAppPromptValidation(root: string): ImageAppPromptReport {
  const counts = writeImageAppPromptCanonicalFiles(root);
  const issues: ValidationIssue[] = [];

  const manifestExists = fs.existsSync(path.join(root, GENERATION_PROMPT_MANIFEST_PATH));
  const artstyleExists = fs.existsSync(path.join(root, CANONICAL_ARTSTYLE_PROMPT_PATH));
  const characterExists = fs.existsSync(path.join(root, CANONICAL_CHARACTER_PROMPTS_V2_PATH));
  const timesettingExists = fs.existsSync(path.join(root, CANONICAL_TIMESETTING_PROMPTS_PATH));

  if (!manifestExists) {
    issues.push({ code: 'PROMPT_MANIFEST_MISSING', message: 'generation-prompt-manifest.json missing', severity: 'error' });
  }
  if (!artstyleExists) {
    issues.push({ code: 'ARTSTYLE_PROMPT_MISSING', message: 'canonical-artstyle-prompt.txt missing', severity: 'error' });
  }
  if (!characterExists) {
    issues.push({ code: 'CHARACTER_PROMPT_MISSING', message: 'canonical-character-prompts-v2.json missing', severity: 'error' });
  }
  if (!timesettingExists) {
    issues.push({ code: 'TIMESETTING_PROMPT_MISSING', message: 'canonical-timesetting-prompts.json missing', severity: 'error' });
  }

  const manifest = manifestExists ? loadGenerationPromptManifest(root) : null;
  if (manifest && !manifest.copy_only_mode) {
    issues.push({ code: 'COPY_ONLY_MODE_FALSE', message: 'prompt manifest copy_only_mode must be true', severity: 'error' });
  }

  const characterPrompts = characterExists ? loadCanonicalCharacterPromptsV2(root) : null;
  const requiredCharacters = [
    'gonegi', 'dana', 'bardo', 'mare', 'elio', 'serena', 'kael', 'zephyro', 'charon', 'pietro', 'enzo', 'aengdu', 'gamja',
  ];
  for (const characterId of requiredCharacters) {
    if (!characterPrompts?.[characterId]) {
      issues.push({
        code: 'CHARACTER_PROMPT_ENTRY_MISSING',
        message: `Missing plain character prompt for ${characterId}`,
        severity: 'error',
      });
    }
  }

  writeMovieImageAppNativeImportV5Datasets(root);

  const canonicalArtStyle = copyImageAppArtStylePrompt(root);
  const artstyleIdOnly = detectArtStyleIdOnly(canonicalArtStyle);
  const exactPromptPresent = canonicalArtStyle.length > 0 && !artstyleIdOnly;

  if (artstyleIdOnly) {
    issues.push({
      code: 'ARTSTYLE_ID_ONLY',
      message: 'canonical-artstyle-prompt.txt contains style ID or alias instead of approved sentence',
      severity: 'error',
    });
  }

  let characterDnaMarkerPresent = false;
  let metadataFieldsPresent = false;
  let plainPromptOnly = true;

  if (characterPrompts) {
    for (const [characterId, prompt] of Object.entries(characterPrompts)) {
      if (detectCharacterDnaMarker(prompt)) {
        characterDnaMarkerPresent = true;
        plainPromptOnly = false;
        issues.push({
          code: 'CHARACTER_DNA_MARKER_PRESENT',
          message: `${characterId}: character prompt contains CHARACTER_DNA marker`,
          severity: 'error',
        });
      }
      if (detectMetadataFields(prompt)) {
        metadataFieldsPresent = true;
        plainPromptOnly = false;
        issues.push({
          code: 'CHARACTER_METADATA_FIELDS_PRESENT',
          message: `${characterId}: character prompt contains metadata field syntax`,
          severity: 'error',
        });
      }
    }
  }

  let timesettingMetadataFormat = false;
  let plainPromptFormat = true;
  if (timesettingExists) {
    const timePrompts = JSON.parse(
      fs.readFileSync(path.join(root, CANONICAL_TIMESETTING_PROMPTS_PATH), 'utf8')
    ) as Record<string, string>;
    for (const [timeId, prompt] of Object.entries(timePrompts)) {
      if (detectTimesettingMetadataFormat(prompt)) {
        timesettingMetadataFormat = true;
        plainPromptFormat = false;
        issues.push({
          code: 'TIMESETTING_METADATA_FORMAT',
          message: `${timeId}: timesetting prompt uses database metadata format`,
          severity: 'error',
        });
      }
    }
  }

  let artstyleExactMatch = true;
  let characterExactMatch = true;
  let timesettingExactMatch = true;
  let databaseRecordLeak = false;
  let metadataLeak = false;
  let v5SlotSamplesChecked = 0;

  const graphDataset = loadMovieSpatialGraphDataset(root, 'titanic');
  const nativeImportV5 = loadMovieImageAppNativeImportV5Dataset(root, 'titanic');

  if (graphDataset && nativeImportV5) {
    for (let slotIndex = 0; slotIndex < 3; slotIndex += 1) {
      const slot = nativeImportV5.slots[slotIndex];
      const graph = graphDataset.spatial_graphs[slotIndex];
      if (!slot || !graph) continue;

      v5SlotSamplesChecked += 1;
      const timeSettingId = resolveLockedTimeSettingId(graph);
      const expectedCharacter = copyImageAppCharacterFieldFromGraph(graph, root);
      const expectedTimeSetting = copyImageAppTimeSettingPrompt(timeSettingId, root);

      if (slot.artStyle !== canonicalArtStyle) {
        artstyleExactMatch = false;
        issues.push({
          code: 'V5_ARTSTYLE_PROMPT_MISMATCH',
          message: `slot ${slotIndex}: artStyle does not match canonical prompt copy`,
          severity: 'error',
        });
      }
      if (slot.character !== expectedCharacter) {
        characterExactMatch = false;
        issues.push({
          code: 'V5_CHARACTER_PROMPT_MISMATCH',
          message: `slot ${slotIndex}: character does not match canonical prompt copy`,
          severity: 'error',
        });
      }
      if (slot.timeSetting !== expectedTimeSetting) {
        timesettingExactMatch = false;
        issues.push({
          code: 'V5_TIMESETTING_PROMPT_MISMATCH',
          message: `slot ${slotIndex}: timeSetting does not match canonical prompt copy`,
          severity: 'error',
        });
      }

      if (detectArtStyleIdOnly(slot.artStyle)) {
        databaseRecordLeak = true;
        issues.push({ code: 'V5_ARTSTYLE_ID_LEAK', message: `slot ${slotIndex}: artStyle ID leak in v5 export`, severity: 'error' });
      }
      if (detectCharacterDnaMarker(slot.character) || detectMetadataFields(slot.character)) {
        databaseRecordLeak = true;
        metadataLeak = true;
        issues.push({ code: 'V5_CHARACTER_DATABASE_LEAK', message: `slot ${slotIndex}: character database format in v5 export`, severity: 'error' });
      }
      if (detectTimesettingMetadataFormat(slot.timeSetting)) {
        databaseRecordLeak = true;
        metadataLeak = true;
        issues.push({ code: 'V5_TIMESETTING_DATABASE_LEAK', message: `slot ${slotIndex}: timesetting database format in v5 export`, severity: 'error' });
      }
    }
  }

  const promptLibraryLoaded =
    manifestExists && artstyleExists && characterExists && timesettingExists;
  const imageAppPromptLibraryCreated = promptLibraryLoaded;
  const artstylePromptRestored = exactPromptPresent && artstyleExactMatch;
  const characterPromptRestored =
    plainPromptOnly && !characterDnaMarkerPresent && characterExactMatch;
  const timesettingPromptRestored = plainPromptFormat && !timesettingMetadataFormat && timesettingExactMatch;
  const databaseFormatRemoved = !databaseRecordLeak && !metadataLeak;
  const imageAppReady =
    artstylePromptRestored && characterPromptRestored && timesettingPromptRestored && databaseFormatRemoved;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    imageAppPromptLibraryCreated &&
    artstylePromptRestored &&
    characterPromptRestored &&
    timesettingPromptRestored &&
    databaseFormatRemoved &&
    imageAppReady;

  return {
    report_id: `image_app_prompt_report_${Date.now().toString(36)}`,
    phase: IMAGE_APP_PROMPT_PHASE,
    system_id: IMAGE_APP_PROMPT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? IMAGE_APP_PROMPT_PASS_VERDICT : IMAGE_APP_PROMPT_FAIL_VERDICT,
    validation_passed: validationPassed,
    image_app_prompt_library_created: imageAppPromptLibraryCreated,
    artstyle_prompt_restored: artstylePromptRestored,
    character_prompt_restored: characterPromptRestored,
    timesetting_prompt_restored: timesettingPromptRestored,
    database_format_removed: databaseFormatRemoved,
    image_app_ready: imageAppReady,
    checks: {
      artstyle_exact_prompt_match: artstyleExactMatch,
      character_exact_prompt_match: characterExactMatch,
      timesetting_exact_prompt_match: timesettingExactMatch,
      prompt_library_loaded: promptLibraryLoaded,
      database_record_leak: databaseRecordLeak,
      metadata_leak: metadataLeak,
      artstyle_id_only: artstyleIdOnly,
      exact_prompt_present: exactPromptPresent,
      character_dna_marker_present: characterDnaMarkerPresent,
      metadata_fields_present: metadataFieldsPresent,
      plain_prompt_only: plainPromptOnly,
      timesetting_metadata_format: timesettingMetadataFormat,
      plain_prompt_format: plainPromptFormat,
    },
    metrics: {
      artstyle_prompt_count: counts.artstyle_prompt_count,
      character_prompt_count: counts.character_prompt_count,
      timesetting_prompt_count: counts.timesetting_prompt_count,
      v5_slot_samples_checked: v5SlotSamplesChecked,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeImageAppPromptReport(projectRoot?: string): ImageAppPromptReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runImageAppPromptValidation(root);
  writeJson(root, IMAGE_APP_PROMPT_REPORT_PATH, report);
  return report;
}

export { SAFE_CREATE_POLICY, NATIVE_IMPORT_V5_OUTPUTS };
