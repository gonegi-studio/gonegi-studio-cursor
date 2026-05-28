import type { CharacterBook } from '../types';
import {
  matchesCanonicalCharacterName,
  type CanonicalCharacterName,
} from './characterSlotMap';
import {
  compressCharacterIdentity,
  formatCharacterCoreLine,
  formatCompressedIdentityBlock,
} from './identityCompressionEngine';
/** Client-safe copy of Music Drama binding model (see musicDramaAssetBinding.ts). */
const MUSIC_DRAMA_BINDING_MODEL =
  'characterBook.characters[slot_id].elite_image_id + visual_dna lookup + environmentDNA[slot] verbatim + styleAnchor verbatim';

export const PROMPT_BRIDGE_VERSION = 'PHASE-33C-v1' as const;

export const IDENTITY_LAW_BLOCK = `### [IDENTITY LAW]
Absolute fidelity to Ref Image #1 / active elite character refs.
Gonegi and Dana faces/outfits are IMMUTABLE.`;

export const FIREWALL_BLOCK = `### [FIREWALL]
NO style ref accessory leaking.
NO 3D shading.
CLEAN FACES.
preserve ink-line facial masks.`;

const LOCKED_CHARACTER_NAMES: CanonicalCharacterName[] = ['Gonegi', 'Dana'];

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
  styleAnchor?: string;
  environmentDna?: string;
}

export interface PromptBridgeResult {
  bridged_prompt: string;
  controlled_prompt_raw: string;
  used_prompt_bridge: true;
  binding_model: string;
  identity_law_injected: true;
  firewall_injected: true;
  detected_characters: CanonicalCharacterName[];
  preserved_name_tokens: CanonicalCharacterName[];
}

export function detectNamedCharactersInPrompt(prompt: string): CanonicalCharacterName[] {
  const detected: CanonicalCharacterName[] = [];
  for (const name of LOCKED_CHARACTER_NAMES) {
    const re = new RegExp(`\\b${name}\\b`, 'i');
    if (re.test(prompt)) {
      detected.push(name);
    }
  }
  return detected;
}

/** Restore canonical names when a refiner replaced them with generic nouns. */
export function preserveLockedCharacterNames(
  refinedText: string,
  originalPrompt: string
): string {
  const required = detectNamedCharactersInPrompt(originalPrompt);
  if (required.length === 0) return refinedText;

  let output = refinedText;
  for (const name of required) {
    const token = new RegExp(`\\b${name}\\b`, 'i');
    if (token.test(output)) continue;

    const replacements = GENERIC_NOUN_PATTERNS.filter((entry) => entry.character === name);
    for (const { pattern } of replacements) {
      if (pattern.test(output)) {
        output = output.replace(pattern, name);
        break;
      }
    }
  }

  for (const name of required) {
    if (!new RegExp(`\\b${name}\\b`, 'i').test(output)) {
      output = `${name} — ${output}`;
    }
  }

  return output;
}

function toResolvedIdentity(
  ref: PromptBridgeIdentityRef,
  book: CharacterBook
) {
  const entry =
    book.characters?.find((c) => matchesCanonicalCharacterName(c.name, ref.character_name)) ??
    book.characters?.find((c) => ref.slot_id.endsWith(c.grid_position ?? ''));
  const compressed = compressCharacterIdentity(
    ref.slot_id,
    ref.character_name,
    entry?.visual_dna ?? ''
  );
  return {
    id: ref.slot_id,
    name: ref.character_name,
    ...compressed,
    image_anchor_ref: ref.elite_image_id,
    source_visual_dna_ref: `app:characterBook.characters.${ref.slot_id}.visual_dna`,
  };
}

function buildCharacterCoreBlock(identityRefs: PromptBridgeIdentityRef[], book: CharacterBook): string {
  const lines = identityRefs.map((ref) => formatCharacterCoreLine(toResolvedIdentity(ref, book)));
  const identityBlocks = identityRefs.map((ref) =>
    formatCompressedIdentityBlock(toResolvedIdentity(ref, book))
  );
  return ['[CHARACTER_CORE]', ...lines, ...identityBlocks].join('\n');
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
    const detected = detectNamedCharactersInPrompt(input.controlledPrompt);
    const preserved = preserveLockedCharacterNames(input.controlledPrompt, input.controlledPrompt);

    const characterCore = buildCharacterCoreBlock(input.identityRefs, input.characterBook);
    const referenceTriggers = buildReferenceTriggerBlock(input.identityRefs);

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
      detected_characters: detected,
      preserved_name_tokens: detectNamedCharactersInPrompt(preserved),
    };
  }
}
