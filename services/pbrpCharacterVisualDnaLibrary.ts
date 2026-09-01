import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

/**
 * PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-004: Character Visual DNA +
 * Source-Aware Integrity V1.
 *
 * Reads the repository's real, existing, already-complete Character Visual
 * DNA -- `imports/character_image_anchors/*\/character_dna.json` (13 real
 * files, one per Gonegi-world character), found during PHASE-003's
 * read-only analysis. This is the "full Character DNA" that
 * `datasets/character/character-simple-v1.json`'s own rules explicitly
 * say not to reconstruct, and whose shape is a near-1:1 structural match
 * to AI Studio's real `CharacterEntry` type (confirmed against
 * `AIStudio-App/types.ts`: `id`/`name`/`visual_dna`/`master_image_id`/
 * `elite_image_id`/`type`/`grid_position`).
 *
 * Read-only: this module never writes to `imports/`. The only
 * transformation performed is renaming the raw `character_id` key to `id`
 * (the one real field-name mismatch against `CharacterEntry`) -- every
 * other field, especially `visual_dna`, is copied verbatim. No wording is
 * rewritten, regenerated, or invented anywhere in this file.
 */

export const PBRP_CHARACTER_VISUAL_DNA_LIBRARY_PHASE = 'PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-004' as const;

const CHARACTER_IMAGE_ANCHORS_DIR = 'imports/character_image_anchors' as const;

/** Mirrors AIStudio-App's real `CharacterEntry` (types.ts). Hand-copied, not imported -- same principle as pbrpAiStudioInputTranslator.ts. */
export type AiStudioCharacterEntry = {
  id: string;
  name: string;
  visual_dna: string;
  master_image_id?: string;
  elite_image_id?: string;
  type: string;
  grid_position?: string;
};

type RawCharacterDnaFile = {
  character_id: string;
  name: string;
  type: string;
  visual_dna: string;
  master_image_id?: string;
  elite_image_id?: string;
  grid_position?: string;
};

/**
 * Loads all 13 real character_dna.json files (directory enumerated at
 * runtime, not a hardcoded list, so this doesn't silently drift from the
 * real directory contents). The only change from the raw file content is
 * `character_id` -> `id`; every other field, including the full
 * `visual_dna` narrative text, is copied byte-for-byte.
 */
export function loadCharacterVisualDnaLibrary(projectRoot?: string): AiStudioCharacterEntry[] {
  const root = projectRoot ?? resolveProjectRoot();
  const dir = path.join(root, CHARACTER_IMAGE_ANCHORS_DIR);
  const slotDirs = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

  return slotDirs.map((slotDir) => {
    const filePath = path.join(dir, slotDir, 'character_dna.json');
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as RawCharacterDnaFile;
    return {
      id: raw.character_id,
      name: raw.name,
      visual_dna: raw.visual_dna,
      master_image_id: raw.master_image_id,
      elite_image_id: raw.elite_image_id,
      type: raw.type,
      grid_position: raw.grid_position,
    };
  });
}

/**
 * Known, explicitly-disclosed spelling/format variants between the
 * semantic anchor registries' raw cast ids and this library's real
 * `name` field. NOT a general fuzzy-matcher -- only the one variant found
 * during PHASE-003's analysis and corroborated by two independent real
 * sources: `gonegi_translation_ref` values use "gonegi" spelling (e.g.
 * `"gonegi_dana_harbor_bow_pose_v1"`), and
 * `datasets/world_translation/gonegi-master-world-translation-v1.json`'s
 * own `character_translation.mappings` uses plain `"gonegi"`. Any raw id
 * not covered by this table is resolved by prefix-stripping + case-
 * insensitive name match alone; if that still fails, it is reported as
 * unresolved, never guessed.
 */
const KNOWN_SPELLING_VARIANTS: Record<string, string> = {
  gonagi: 'gonegi',
};

export type CharacterResolution = {
  raw_id: string;
  resolved: AiStudioCharacterEntry | null;
  resolution_note: string;
};

/**
 * Resolves one raw cast id (e.g. `"CHAR-gonagi"`, as found in
 * `gonegi_characters`) to its real Character Visual DNA entry. Never
 * fabricates a match -- returns `resolved: null` with a disclosed reason
 * if no real entry corresponds.
 */
export function resolveCharacterByRawId(library: AiStudioCharacterEntry[], rawId: string): CharacterResolution {
  const stripped = rawId.replace(/^CHAR-/i, '');
  const normalized = KNOWN_SPELLING_VARIANTS[stripped.toLowerCase()] ?? stripped;
  const match = library.find((c) => c.name.toLowerCase() === normalized.toLowerCase());

  if (match) {
    const variantNote = KNOWN_SPELLING_VARIANTS[stripped.toLowerCase()]
      ? ` (applied known spelling variant '${stripped}' -> '${normalized}')`
      : '';
    return {
      raw_id: rawId,
      resolved: match,
      resolution_note: `matched by name (case-insensitive) after stripping 'CHAR-' prefix${variantNote}`,
    };
  }

  return {
    raw_id: rawId,
    resolved: null,
    resolution_note: `UNRESOLVED: no Character Visual DNA library entry has name matching '${normalized}' (stripped from '${rawId}') -- not fabricated`,
  };
}
