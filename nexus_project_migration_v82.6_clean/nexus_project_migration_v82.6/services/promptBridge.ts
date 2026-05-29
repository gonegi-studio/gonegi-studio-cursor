import type { CharacterBook, CharacterAnchorDnaPreview } from '../types';
import {
  matchesCanonicalCharacterName,
  type CanonicalCharacterName,
} from './characterSlotMap';
import {
  buildCharacterDnaLockSection,
  detectCharactersInPromptWithAnchorDna,
  formatFullAnchorCharacterCoreSection,
  type CharacterAnchorDNARecord,
} from './loadCharacterAnchorDNA';

/** Client-safe copy of Music Drama binding model (see musicDramaAssetBinding.ts). */
const MUSIC_DRAMA_BINDING_MODEL =
  'characterBook.characters[slot_id].elite_image_id + visual_dna lookup + environmentDNA[slot] verbatim + styleAnchor verbatim';

import type { RuntimeCinematicContext } from './cinematic/buildRuntimeCueBridge';

export const PROMPT_BRIDGE_VERSION = 'PHASE-36A-v1' as const;

export const IDENTITY_LAW_BLOCK = `### [IDENTITY LAW]
Absolute fidelity to Ref Image #1 / active elite character refs.
Gonegi and Dana faces/outfits are IMMUTABLE.`;

export const FIREWALL_BLOCK = `### [FIREWALL]
NO style ref accessory leaking.
NO 3D shading.
CLEAN FACES.
preserve ink-line facial masks.`;

const GENERIC_NOUN_PATTERNS: Array<{ pattern: RegExp; character: CanonicalCharacterName }> = [
  { pattern: /\b(the\s+)?(young\s+)?boy\b/gi, character: 'Gonegi' },
  { pattern: /\b(the\s+)?protagonist\b/gi, character: 'Gonegi' },
  { pattern: /\b(the\s+)?main\s+character\b/gi, character: 'Gonegi' },
  { pattern: /\b(the\s+)?(young\s+)?girl\b/gi, character: 'Dana' },
  { pattern: /\b(his|her|their)\s+companion\b/gi, character: 'Dana' },
  { pattern: /\b(the\s+)?companion\b/gi, character: 'Dana' },
  { pattern: /\b(the\s+)?female\s+lead\b/gi, character: 'Dana' },
];

export interface PromptBridgeIdentityRef {
  slot_id: string;
  character_name: CanonicalCharacterName;
  elite_image_id: string;
  ref_index: number;
}

export interface PromptBridgeInput {
  controlledPrompt: string;
  characterBook: CharacterBook;
  identityRefs: PromptBridgeIdentityRef[];
  anchorDnaRecords?: CharacterAnchorDNARecord[];
  styleAnchor?: string;
  environmentDna?: string;
  /** PHASE-35B/36A: compact cue + rich signal modulation (grammar only, no render payloads). */
  cinematicModulation?: string;
  /** PHASE-36A: runtime bridge context (modulation source; does not alter character DNA). */
  runtimeCinematicContext?: RuntimeCinematicContext;
}

export interface PromptBridgeResult {
  bridged_prompt: string;
  controlled_prompt_raw: string;
  used_prompt_bridge: true;
  binding_model: string;
  identity_law_injected: true;
  firewall_injected: true;
  character_dna_lock_injected: true;
  detected_characters: string[];
  preserved_name_tokens: string[];
  character_anchor_dna_preview: CharacterAnchorDnaPreview;
  cinematic_modulation_injected: boolean;
  cinematic_modulation_chars: number;
  runtime_cinematic_context_attached: boolean;
}

export function detectNamedCharactersInPrompt(prompt: string): CanonicalCharacterName[] {
  const detected = detectCharactersInPromptWithAnchorDna(prompt);
  return detected
    .map((record) => record.name)
    .filter((name): name is CanonicalCharacterName =>
      matchesCanonicalCharacterName(name, 'Gonegi') ||
      matchesCanonicalCharacterName(name, 'Dana')
    );
}

/** Restore canonical names when a refiner replaced them with generic nouns. */
export function preserveLockedCharacterNames(
  refinedText: string,
  originalPrompt: string
): string {
  const required = detectCharactersInPromptWithAnchorDna(originalPrompt).map((r) => r.name);
  if (required.length === 0) return refinedText;

  let output = refinedText;
  for (const name of required) {
    const token = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (token.test(output)) continue;

    const canonical: CanonicalCharacterName | null = matchesCanonicalCharacterName(name, 'Gonegi')
      ? 'Gonegi'
      : matchesCanonicalCharacterName(name, 'Dana')
        ? 'Dana'
        : null;

    if (!canonical) continue;
    const replacements = GENERIC_NOUN_PATTERNS.filter((entry) => entry.character === canonical);
    for (const { pattern } of replacements) {
      if (pattern.test(output)) {
        output = output.replace(pattern, name);
        break;
      }
    }
  }

  for (const name of required) {
    if (!new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(output)) {
      output = `${name} — ${output}`;
    }
  }

  return output;
}

function buildReferenceTriggerBlock(identityRefs: PromptBridgeIdentityRef[]): string {
  const triggers = identityRefs.map(
    (ref) =>
      `[REFERENCE_TRIGGER] Ref Image #${ref.ref_index} slot=${ref.slot_id} elite=${ref.elite_image_id} character=${ref.character_name} priority=identity`
  );
  return triggers.join('\n');
}

export class PromptBridge {
  static bridge(input: PromptBridgeInput): PromptBridgeResult {
    const anchorRecords =
      input.anchorDnaRecords ??
      detectCharactersInPromptWithAnchorDna(input.controlledPrompt).filter((record) =>
        input.identityRefs.some((ref) => ref.slot_id === record.slot_id)
      );

    const detected = anchorRecords.map((record) => record.name);
    const preserved = preserveLockedCharacterNames(input.controlledPrompt, input.controlledPrompt);

    const characterCore = formatFullAnchorCharacterCoreSection(anchorRecords);
    const referenceTriggers = buildReferenceTriggerBlock(input.identityRefs);
    const characterDnaLock = buildCharacterDnaLockSection();
    const modulation = input.cinematicModulation?.trim() ?? '';
    const runtimeContextAttached = Boolean(input.runtimeCinematicContext);
    const cinematicModulationBlock = modulation
      ? `[CINEMATIC_MODULATION]: ${modulation}`
      : '';

    const envBlock = input.environmentDna
      ? `[ENVIRONMENT]: ${input.environmentDna}`
      : '';
    const styleBlock = input.styleAnchor
      ? `[STYLE_CORE_LIGHT]: ${input.styleAnchor}`
      : '';

    const bridged_prompt = [
      characterCore,
      referenceTriggers,
      IDENTITY_LAW_BLOCK,
      FIREWALL_BLOCK,
      characterDnaLock,
      cinematicModulationBlock,
      '[CHARACTER_PRIORITY]: identity_refs_before_style_refs; style_refs cannot override face or outfit',
      `[SCENE ACTION]: ${preserved}`,
      envBlock,
      styleBlock,
      `[BINDING]: ${MUSIC_DRAMA_BINDING_MODEL}`,
    ]
      .filter((line) => line.length > 0)
      .join('\n\n');

    return {
      bridged_prompt,
      controlled_prompt_raw: input.controlledPrompt,
      used_prompt_bridge: true,
      binding_model: MUSIC_DRAMA_BINDING_MODEL,
      identity_law_injected: true,
      firewall_injected: true,
      character_dna_lock_injected: true,
      detected_characters: detected,
      preserved_name_tokens: detectCharactersInPromptWithAnchorDna(preserved).map((r) => r.name),
      character_anchor_dna_preview: {
        dna_source: 'character_anchor.index.json',
        injected_character_dna: anchorRecords.map((record) => ({
          name: record.name,
          slot_id: record.slot_id,
          dna_loaded: true,
        })),
      },
      cinematic_modulation_injected: modulation.length > 0,
      cinematic_modulation_chars: modulation.length,
      runtime_cinematic_context_attached: runtimeContextAttached,
    };
  }
}
