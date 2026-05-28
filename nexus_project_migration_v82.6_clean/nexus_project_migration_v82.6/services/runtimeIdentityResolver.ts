import { assertSlotMapsToCharacter } from './characterSlotMap';
import { CharacterEntry, ResolvedCharacterIdentity } from '../types';
import { buildAiStudioControlledJsonRebuildPreview } from './cinematic/aiStudioControlledJsonRebuild';
import { buildUnifiedAssetRegistry } from './cinematic/musicDramaAssetBinding';
import { getCharacterAnchorDNABySlot } from './loadCharacterAnchorDNA';
import { CHARACTER_DOMINANCE_LOCK } from './identityCompressionEngine';

function resolveCharacterBookEntry(slotId: string): CharacterEntry | undefined {
  const studio = buildAiStudioControlledJsonRebuildPreview();
  const pack = studio.ai_studio_controlled_upload_json[0];
  const book = pack?.characterBook;
  if (!book?.characters) return undefined;
  return book.characters.find((character) => character.id === slotId);
}

export function resolveCharacterIdentity(slotId: string): ResolvedCharacterIdentity {
  const registry = buildUnifiedAssetRegistry([slotId]);
  const slotBinding = registry.slot_bindings.find((binding) => binding.slot_id === slotId);
  if (!slotBinding) {
    throw new Error(`PHASE-31A cannot resolve identity for slot ${slotId}`);
  }

  assertSlotMapsToCharacter(slotId, slotBinding.character_name);

  const anchorDna = getCharacterAnchorDNABySlot(slotId);
  if (anchorDna) {
    return {
      id: slotId,
      name: anchorDna.name,
      face_core: anchorDna.visual_dna,
      hair_core: anchorDna.visual_dna,
      silhouette_core: anchorDna.height ?? anchorDna.visual_dna,
      outfit_core: anchorDna.visual_dna,
      age_core: anchorDna.height ?? anchorDna.visual_dna,
      style_core: anchorDna.identity_laws ?? CHARACTER_DOMINANCE_LOCK,
      identity_lock: anchorDna.identity_laws ?? CHARACTER_DOMINANCE_LOCK,
      compressed_identity: `${anchorDna.name}: ${anchorDna.visual_dna}`,
      image_anchor_ref: slotBinding.image_anchor_ref,
      source_visual_dna_ref: anchorDna.source_path,
    };
  }

  const bookEntry = resolveCharacterBookEntry(slotId);
  throw new Error(
    `PHASE-33E missing character_dna.json for slot ${slotId} (${slotBinding.character_name}); book visual_dna fallback disabled`
  );
}

export function resolveCharacterIdentities(slotIds: string[]): ResolvedCharacterIdentity[] {
  return [...slotIds].sort().map((slotId) => resolveCharacterIdentity(slotId));
}
