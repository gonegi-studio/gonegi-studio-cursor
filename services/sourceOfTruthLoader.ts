import { MovieSpatialGraph } from './movieSpatialGraphBuilder.js';
import { resolveCharacterId } from './movieCharacterDNALock.js';
import {
  APPROVED_ORIGINALS_DIR,
  APPROVED_ORIGINALS_MANIFEST_PATH,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
  APPROVED_ORIGINALS_ARTSTYLE_REF,
  APPROVED_ORIGINALS_CHARACTER_REF,
  APPROVED_ORIGINALS_TIMESETTING_REF,
  assertApprovedOriginalsPresent,
  copyApprovedOriginalArtStyle,
  copyApprovedOriginalCharacterField,
  copyApprovedOriginalCharacterPrompt,
  copyApprovedOriginalTimeSettingPrompt,
  approvedOriginalCharacterPromptRefs,
  approvedOriginalTimeSettingPromptRef,
  loadApprovedOriginalCharacterPrompts,
  loadApprovedOriginalTimeSettingPrompts,
  loadApprovedOriginalsManifest,
  approvedOriginalsFilesExist,
} from './approvedOriginalsLoader.js';
import {
  FORBIDDEN_LEGACY_SOURCE_PREFIXES,
  isForbiddenLegacySourceRef,
} from './forbiddenLegacySourcePaths.js';

export const SOURCE_OF_TRUTH_PHASE = 'PHASE-GENERATION-CONTEXT-008' as const;
export const SOURCE_OF_TRUTH_SYSTEM_ID = 'FINAL_SOURCE_LOCK_V1' as const;

export const SOURCE_OF_TRUTH_DIR = APPROVED_ORIGINALS_DIR;
export const SOURCE_OF_TRUTH_MANIFEST_PATH = APPROVED_ORIGINALS_MANIFEST_PATH;
export const SOURCE_OF_TRUTH_ARTSTYLE_PATH = ARTSTYLE_APPROVED_PATH;
export const SOURCE_OF_TRUTH_CHARACTER_PROMPTS_PATH = CHARACTER_APPROVED_PATH;
export const SOURCE_OF_TRUTH_TIMESETTING_PROMPTS_PATH = TIMESETTING_APPROVED_PATH;

export const SOURCE_OF_TRUTH_ARTSTYLE_REF = APPROVED_ORIGINALS_ARTSTYLE_REF;
export const SOURCE_OF_TRUTH_CHARACTER_PROMPT_REF = APPROVED_ORIGINALS_CHARACTER_REF;
export const SOURCE_OF_TRUTH_TIMESETTING_PROMPT_REF = APPROVED_ORIGINALS_TIMESETTING_REF;

export const SOURCE_OF_TRUTH_COPY_ONLY_MODE = true as const;
export const FORBIDDEN_LEGACY_SOURCE_PATHS = FORBIDDEN_LEGACY_SOURCE_PREFIXES;

export type SourceOfTruthCharacterPrompts = Record<string, string>;
export type SourceOfTruthTimeSettingPrompts = Record<string, string>;

export function loadSourceOfTruthManifest(root: string) {
  return loadApprovedOriginalsManifest(root);
}

export function loadSourceOfTruthCharacterPrompts(root: string): SourceOfTruthCharacterPrompts {
  return loadApprovedOriginalCharacterPrompts(root);
}

export function loadSourceOfTruthTimeSettingPrompts(root: string): SourceOfTruthTimeSettingPrompts {
  return loadApprovedOriginalTimeSettingPrompts(root);
}

export function copySourceOfTruthArtStyle(projectRoot?: string): string {
  return copyApprovedOriginalArtStyle(projectRoot);
}

export function copySourceOfTruthCharacterPrompt(
  characterId: string,
  projectRoot?: string
): string {
  return copyApprovedOriginalCharacterPrompt(characterId, projectRoot);
}

export function copySourceOfTruthCharacterField(
  characterIds: readonly string[],
  projectRoot?: string
): string {
  return copyApprovedOriginalCharacterField(characterIds, projectRoot);
}

export function copySourceOfTruthCharacterFieldFromGraph(
  graph: MovieSpatialGraph,
  projectRoot?: string
): string {
  const characterIds = graph.character_nodes.map((node) => resolveCharacterId(node.character_id));
  return copyApprovedOriginalCharacterField(characterIds, projectRoot);
}

export function copySourceOfTruthTimeSettingPrompt(
  timeSettingId: string,
  projectRoot?: string
): string {
  return copyApprovedOriginalTimeSettingPrompt(timeSettingId, projectRoot);
}

export function sourceOfTruthCharacterPromptRefs(characterIds: readonly string[]): string {
  return approvedOriginalCharacterPromptRefs(characterIds);
}

export function sourceOfTruthTimeSettingPromptRef(timeSettingId: string): string {
  return approvedOriginalTimeSettingPromptRef(timeSettingId);
}

export function sourceOfTruthFilesExist(root: string): boolean {
  return approvedOriginalsFilesExist(root);
}

export function assertApprovedOriginalsSourceLock(projectRoot?: string): void {
  assertApprovedOriginalsPresent(projectRoot);
}

export function assertNoForbiddenLegacySourceRef(sourceRef: string, context: string): void {
  if (isForbiddenLegacySourceRef(sourceRef)) {
    throw new Error(`Forbidden legacy source reference in ${context}: ${sourceRef}`);
  }
}

export {
  APPROVED_ORIGINALS_DIR,
  APPROVED_ORIGINALS_MANIFEST_PATH,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
  FORBIDDEN_LEGACY_SOURCE_PREFIXES,
  isForbiddenLegacySourceRef,
};
