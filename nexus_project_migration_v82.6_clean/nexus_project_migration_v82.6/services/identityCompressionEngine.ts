import { DANA_SLOT_ID, GONEGI_SLOT_ID } from './characterSlotMap';
import { ResolvedCharacterIdentity } from '../types';

const SLOT_IDENTITY_PRESETS: Record<
  string,
  Pick<
    ResolvedCharacterIdentity,
    'face_core' | 'hair_core' | 'silhouette_core' | 'outfit_core' | 'age_core' | 'style_core'
  >
> = {
  [GONEGI_SLOT_ID]: {
    face_core: 'large grounded expressive amber-gaze eyes, classic Ghibli boy face topology',
    hair_core: 'messy matte jet-black hair',
    silhouette_core: 'compact youthful Mediterranean boy silhouette',
    outfit_core: 'harbor coat slate duster, off-white henley shirt, deep navy trousers, dark suspenders',
    age_core: 'soulful determined 11-year-old boy protagonist',
    style_core: 'gentle Ghibli realism, vitreous eye highlight integrity',
  },
  [DANA_SLOT_ID]: {
    face_core: 'warm olive gaze, vitreous amber highlights, identity-stable cheek and eye spacing',
    hair_core: 'soft auburn braid rhythm',
    silhouette_core: 'Mediterranean youth companion silhouette',
    outfit_core: 'seafoam linen wrap and harbor shawl',
    age_core: 'Mediterranean youth companion',
    style_core: 'hand-painted Ghibli cel-shading, soft friendship cadence',
  },
};

export const CHARACTER_DOMINANCE_LOCK =
  'CharacterBook auto-reference injection active, elite reference matching enabled, face topology lock, outfit continuity lock';

const IDENTITY_LOCK = CHARACTER_DOMINANCE_LOCK;

function tokenizeVisualDna(visualDna: string): string[] {
  return visualDna
    .replace(/\s+/g, ' ')
    .split(/[.,;]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 6)
    .slice(0, 8);
}

export function compressCharacterIdentity(
  slotId: string,
  name: string,
  visualDna: string | undefined
): Omit<ResolvedCharacterIdentity, 'id' | 'name' | 'image_anchor_ref' | 'source_visual_dna_ref'> {
  const preset = SLOT_IDENTITY_PRESETS[slotId];
  if (preset) {
    const compressed_identity = [
      `${name}:`,
      preset.face_core,
      preset.hair_core,
      preset.silhouette_core,
      preset.outfit_core,
    ].join(' ');

    return { ...preset, identity_lock: IDENTITY_LOCK, compressed_identity };
  }

  const tokens = visualDna ? tokenizeVisualDna(visualDna) : [`${name} canonical identity`];
  const compressed_identity = [`${name}:`, ...tokens.slice(0, 4)].join(' ');

  return {
    face_core: tokens[0] ?? 'identity-stable Ghibli face topology',
    hair_core: tokens[1] ?? 'hand-painted hair rhythm',
    silhouette_core: tokens[2] ?? 'stable character silhouette',
    outfit_core: tokens[3] ?? 'canonical outfit silhouette',
    age_core: tokens[4] ?? 'canonical age impression',
    style_core: 'gentle Ghibli realism',
    identity_lock: IDENTITY_LOCK,
    compressed_identity,
  };
}

export function formatCompressedIdentityBlock(identity: ResolvedCharacterIdentity): string {
  return identity.compressed_identity;
}

export function formatCharacterCoreLine(identity: ResolvedCharacterIdentity): string {
  const shortName = identity.name.replace(/\s+Main$/i, '');
  return `${shortName}: ${identity.face_core}, ${identity.hair_core}, ${identity.silhouette_core}, ${identity.outfit_core}`;
}
