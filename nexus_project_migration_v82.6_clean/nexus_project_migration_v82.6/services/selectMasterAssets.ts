import type { CharacterBook, GhibliAnchor } from '../types';
import {
  DANA_SLOT_ID,
  GONEGI_SLOT_ID,
  gridPositionToSlotId,
  matchesCanonicalCharacterName,
  type CanonicalCharacterName,
} from './characterSlotMap';
import { detectNamedCharactersInPrompt, type PromptBridgeIdentityRef } from './promptBridge';
import {
  detectCharactersInPromptWithAnchorDna,
  validateAnchorDnaForCharacters,
} from './loadCharacterAnchorDNA';

export const SELECT_MASTER_ASSETS_VERSION = 'PHASE-33E-v1' as const;

export type MasterAssetReadiness = 'READY' | 'NOT_READY';

export type MasterReferenceKind = 'identity' | 'style';

export interface MasterReferenceOrderEntry {
  kind: MasterReferenceKind;
  ref_id: string;
  slot_id?: string;
  character_name?: string;
}

export interface SelectMasterAssetsInput {
  controlledPrompt: string;
  characterBook: CharacterBook;
  styleAnchors?: GhibliAnchor[];
}

export interface SelectMasterAssetsResult {
  readiness: MasterAssetReadiness;
  blocked_reason?: string;
  detected_characters: CanonicalCharacterName[];
  injected_elite_image_ids: string[];
  reference_order: MasterReferenceOrderEntry[];
  identity_refs: PromptBridgeIdentityRef[];
  style_ref_ids: string[];
  used_prompt_bridge: false;
}

function findBookCharacter(book: CharacterBook, name: CanonicalCharacterName) {
  return book.characters?.find((c) => matchesCanonicalCharacterName(c.name, name));
}

function resolveIdentityRef(
  book: CharacterBook,
  name: CanonicalCharacterName,
  slotId: typeof GONEGI_SLOT_ID | typeof DANA_SLOT_ID,
  refIndex: number
): PromptBridgeIdentityRef | null {
  const entry = findBookCharacter(book, name);
  const eliteId = entry?.elite_image_id?.trim();
  if (!eliteId) return null;

  return {
    slot_id: slotId,
    character_name: name,
    elite_image_id: eliteId,
    ref_index: refIndex,
  };
}

export function selectMasterAssets(input: SelectMasterAssetsInput): SelectMasterAssetsResult {
  const anchorDetected = detectCharactersInPromptWithAnchorDna(input.controlledPrompt);
  const detected = detectNamedCharactersInPrompt(input.controlledPrompt);
  const identity_refs: PromptBridgeIdentityRef[] = [];
  const missingElite: CanonicalCharacterName[] = [];
  let refIndex = 1;

  const requiredNames =
    anchorDetected.length > 0
      ? anchorDetected.map((record) => record.name)
      : detected;

  const dnaValidation = validateAnchorDnaForCharacters(
    requiredNames.map((name) => ({
      name,
      slot_id:
        name === 'Gonegi' ? GONEGI_SLOT_ID : name === 'Dana' ? DANA_SLOT_ID : undefined,
    }))
  );

  if (!dnaValidation.ready) {
    return {
      readiness: 'NOT_READY',
      blocked_reason: `PHASE-33E character_dna.json missing for: ${dnaValidation.missing.join(', ')}`,
      detected_characters: detected,
      injected_elite_image_ids: [],
      reference_order: [],
      identity_refs: [],
      style_ref_ids: [],
      used_prompt_bridge: false,
    };
  }

  const targets =
    anchorDetected.length > 0
      ? anchorDetected
          .filter((record) => record.name === 'Gonegi' || record.name === 'Dana')
          .map((record) => ({
            name: record.name as CanonicalCharacterName,
            slotId:
              record.slot_id === GONEGI_SLOT_ID || record.slot_id === DANA_SLOT_ID
                ? record.slot_id
                : record.name === 'Gonegi'
                  ? GONEGI_SLOT_ID
                  : DANA_SLOT_ID,
          }))
      : requiredNames
          .filter((name): name is CanonicalCharacterName => name === 'Gonegi' || name === 'Dana')
          .map((name) => ({
            name,
            slotId: name === 'Gonegi' ? GONEGI_SLOT_ID : DANA_SLOT_ID,
          }));

  for (const { name, slotId } of targets) {
    const ref = resolveIdentityRef(input.characterBook, name, slotId, refIndex);
    if (ref) {
      identity_refs.push(ref);
      refIndex += 1;
    } else {
      missingElite.push(name);
    }
  }

  const style_ref_ids: string[] = [];
  if (input.characterBook.master_image_id) {
    style_ref_ids.push(input.characterBook.master_image_id);
  }
  for (const anchor of input.styleAnchors ?? []) {
    if (anchor.id && !style_ref_ids.includes(anchor.id)) {
      style_ref_ids.push(anchor.id);
    }
  }

  const reference_order: MasterReferenceOrderEntry[] = [
    ...identity_refs.map((ref) => ({
      kind: 'identity' as const,
      ref_id: ref.elite_image_id,
      slot_id: ref.slot_id,
      character_name: ref.character_name,
    })),
    ...style_ref_ids.map((ref_id) => ({
      kind: 'style' as const,
      ref_id,
    })),
  ];

  const injected_elite_image_ids = identity_refs.map((r) => r.elite_image_id);

  if (missingElite.length > 0) {
    return {
      readiness: 'NOT_READY',
      blocked_reason: `PHASE-33C elite_image_id missing for: ${missingElite.join(', ')}`,
      detected_characters: detected,
      injected_elite_image_ids,
      reference_order,
      identity_refs,
      style_ref_ids,
      used_prompt_bridge: false,
    };
  }

  for (const ref of identity_refs) {
    const entry = findBookCharacter(input.characterBook, ref.character_name);
    if (entry?.grid_position) {
      try {
        gridPositionToSlotId(entry.grid_position);
      } catch {
        return {
          readiness: 'NOT_READY',
          blocked_reason: `PHASE-33C invalid grid slot for ${ref.character_name}`,
          detected_characters: detected,
          injected_elite_image_ids,
          reference_order,
          identity_refs,
          style_ref_ids,
          used_prompt_bridge: false,
        };
      }
    }
  }

  return {
    readiness: 'READY',
    detected_characters: detected,
    injected_elite_image_ids,
    reference_order,
    identity_refs,
    style_ref_ids,
    used_prompt_bridge: false,
  };
}
