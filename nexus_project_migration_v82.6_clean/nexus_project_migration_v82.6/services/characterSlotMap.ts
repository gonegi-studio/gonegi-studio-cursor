export const CANONICAL_CHARACTER_SLOT_MAP = {
  'slot_1-1': 'Gonegi',
  'slot_1-2': 'Dana',
  'slot_1-3': 'Bardo',
  'slot_1-4': 'Mare',
  'slot_1-5': 'Elio',
  'slot_1-6': 'Serena',
  'slot_2-1': 'Kael',
  'slot_2-2': 'Zephyro',
  'slot_2-3': 'Charon',
  'slot_2-4': 'Pietro',
  'slot_2-5': 'Enzo',
  'slot_2-6-1': 'Aengdu',
  'slot_2-6-2': 'Gamja',
} as const;

export type CanonicalSlotId = keyof typeof CANONICAL_CHARACTER_SLOT_MAP;
export type CanonicalCharacterName = (typeof CANONICAL_CHARACTER_SLOT_MAP)[CanonicalSlotId];

export const GONEGI_SLOT_ID: CanonicalSlotId = 'slot_1-1';
export const DANA_SLOT_ID: CanonicalSlotId = 'slot_1-2';
export const KAEL_SLOT_ID: CanonicalSlotId = 'slot_2-1';

export const CANONICAL_TEST_CHARACTER_SLOTS = [GONEGI_SLOT_ID, DANA_SLOT_ID] as const;

export class CharacterSlotMappingError extends Error {
  constructor(message: string) {
    super(`PHASE-31C deterministic slot mapping error: ${message}`);
    this.name = 'CharacterSlotMappingError';
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function getCanonicalCharacterName(slotId: string): CanonicalCharacterName {
  const canonical = CANONICAL_CHARACTER_SLOT_MAP[slotId as CanonicalSlotId];
  if (!canonical) {
    throw new CharacterSlotMappingError(`unknown slot_id ${slotId}`);
  }
  return canonical;
}

export function matchesCanonicalCharacterName(
  actualName: string,
  canonicalName: CanonicalCharacterName
): boolean {
  const actual = normalizeName(actualName);
  const canonical = normalizeName(canonicalName);
  if (actual === canonical) return true;
  if (canonical === 'gonegi' && actual.startsWith('gonegi')) return true;
  return actual.includes(canonical);
}

export function assertSlotMapsToCharacter(slotId: string, characterName: string): void {
  if (slotId === KAEL_SLOT_ID && matchesCanonicalCharacterName(characterName, 'Dana')) {
    throw new CharacterSlotMappingError('slot_2-1 must resolve to Kael, never Dana');
  }

  if (
    matchesCanonicalCharacterName(characterName, 'Dana') &&
    slotId !== DANA_SLOT_ID
  ) {
    throw new CharacterSlotMappingError(
      `Dana must resolve only from slot_1-2, not ${slotId}`
    );
  }

  if (slotId === GONEGI_SLOT_ID && !matchesCanonicalCharacterName(characterName, 'Gonegi')) {
    throw new CharacterSlotMappingError(
      `Gonegi must resolve only from slot_1-1, got ${characterName}`
    );
  }

  if (slotId === DANA_SLOT_ID && !matchesCanonicalCharacterName(characterName, 'Dana')) {
    throw new CharacterSlotMappingError(
      `Dana must resolve only from slot_1-2, got ${characterName}`
    );
  }

  const expected = getCanonicalCharacterName(slotId);
  if (!matchesCanonicalCharacterName(characterName, expected)) {
    throw new CharacterSlotMappingError(
      `slot ${slotId} must resolve to ${expected}, got ${characterName}`
    );
  }
}

/** App grid_position (e.g. 1-1) → canonical export slot_id (slot_1-1). */
export function gridPositionToSlotId(gridPosition: string): CanonicalSlotId {
  const normalized = gridPosition.startsWith('slot_') ? gridPosition : `slot_${gridPosition}`;
  if (!(normalized in CANONICAL_CHARACTER_SLOT_MAP)) {
    throw new CharacterSlotMappingError(`invalid grid_position ${gridPosition}`);
  }
  return normalized as CanonicalSlotId;
}

export function resolveFaceLockFilename(slotId: string): string | null {
  if (slotId === GONEGI_SLOT_ID) return 'gonegi_face_lock.png';
  if (slotId === DANA_SLOT_ID) return 'dana_face_lock.png';
  return null;
}

export function assertCanonicalExportSlotMapping(payload: {
  character_image_anchors: Array<{ slot_id: string; elite_image_id?: string }>;
  character_bindings: Array<{ slot_id: string; character_name: string }>;
}): void {
  for (const binding of payload.character_bindings) {
    assertSlotMapsToCharacter(binding.slot_id, binding.character_name);
  }

  const anchorSlots = payload.character_image_anchors.map((a) => a.slot_id);
  if (!anchorSlots.includes(GONEGI_SLOT_ID)) {
    throw new CharacterSlotMappingError('export missing Gonegi anchor at slot_1-1');
  }
  if (!anchorSlots.includes(DANA_SLOT_ID)) {
    throw new CharacterSlotMappingError('export missing Dana anchor at slot_1-2');
  }

  const danaOn21 = payload.character_image_anchors.find(
    (a) =>
      a.slot_id === KAEL_SLOT_ID &&
      (a.elite_image_id?.toLowerCase().includes('dana') ?? false)
  );
  if (danaOn21) {
    throw new CharacterSlotMappingError('export must not bind Dana elite image to slot_2-1');
  }

  const danaBindingOn21 = payload.character_bindings.find(
    (b) =>
      b.slot_id === KAEL_SLOT_ID && matchesCanonicalCharacterName(b.character_name, 'Dana')
  );
  if (danaBindingOn21) {
    throw new CharacterSlotMappingError('export must not contain slot_2-1 Dana binding');
  }
}
