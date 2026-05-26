import crypto from 'crypto';
import {
  CharacterBook,
  CharacterDNAIndexEntry,
  CharacterEntry,
  EnvironmentDNAIndexEntry,
  MASTER_CORE_DNA_ADAPTER_VERSION,
  MasterAssetIndexEntry,
  MasterCoreDNAAdapterDetection,
  MasterCoreDNAAdapterResult,
  MasterCoreDNASnapshot,
  MasterCoreAssetEntry,
  MasterCoreProfile,
  MasterCoreRenderRules,
  MasterCoreStyleCoreInput,
  MasterCoreStyleCoreMetrics,
  StyleCoreProfileOutput,
  SubCharacterEntry,
} from '../types';

export const MASTER_CORE_DNA_ADAPTER_EPOCH = '2026-05-26T13:00:00.000Z';

const GRID_POSITIONS = [
  '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
  '2-1', '2-2', '2-3', '2-4', '2-5',
  '2-6-1', '2-6-2',
] as const;

const ENVIRONMENT_DNA_SLOTS = [
  'dawn',
  'morning',
  'afternoon',
  'late_afternoon',
  'sunset',
  'night',
  'dream',
  'spiritual',
  'global',
] as const;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/** Normalizes flexible MasterCore snapshot shapes without mutating source data. */
export function normalizeMasterCoreDNASnapshot(raw: unknown): MasterCoreDNASnapshot {
  const root = asRecord(raw) ?? {};
  const characterBookRaw = asRecord(root.characterBook);
  const characterBook: CharacterBook | undefined = characterBookRaw
    ? (characterBookRaw as unknown as CharacterBook)
    : undefined;

  const characters =
    (characterBook?.characters as CharacterEntry[] | undefined) ??
    (Array.isArray(root.characters) ? (root.characters as CharacterEntry[]) : undefined);

  const subCharacters =
    (characterBook?.subCharacters as SubCharacterEntry[] | undefined) ??
    (Array.isArray(root.subCharacters) ? (root.subCharacters as SubCharacterEntry[]) : undefined);

  const environmentDNA =
    (characterBook?.environmentDNA as CharacterBook['environmentDNA']) ??
    (root.environmentDNA as CharacterBook['environmentDNA']) ??
    undefined;

  const styleCore =
    (root.styleCore as MasterCoreStyleCoreInput | undefined) ??
    (characterBook?.styleAnchor
      ? { styleAnchor: characterBook.styleAnchor }
      : undefined);

  const render_rules =
    (root.render_rules as MasterCoreRenderRules | string | undefined) ??
    (environmentDNA?.global ? { global: environmentDNA.global } : undefined);

  const masterAssetLibrary = Array.isArray(root.masterAssetLibrary)
    ? (root.masterAssetLibrary as MasterCoreAssetEntry[])
    : undefined;

  return {
    schema_version:
      typeof root.schema_version === 'string' ? root.schema_version : 'MasterCore_DNA_Snapshot',
    characterBook: characterBook
      ? {
          ...characterBook,
          characters: characters ?? characterBook.characters ?? [],
          subCharacters: subCharacters ?? characterBook.subCharacters ?? [],
          environmentDNA: environmentDNA ?? characterBook.environmentDNA,
        }
      : characters || subCharacters || environmentDNA
        ? {
            version: typeof root.version === 'string' ? root.version : '5.1',
            characters: characters ?? [],
            subCharacters: subCharacters ?? [],
            environmentDNA,
            master_image_id:
              typeof root.master_image_id === 'string'
                ? root.master_image_id
                : typeof characterBookRaw?.master_image_id === 'string'
                  ? characterBookRaw.master_image_id
                  : undefined,
            global_height_scale:
              typeof root.global_height_scale === 'string'
                ? root.global_height_scale
                : typeof characterBookRaw?.global_height_scale === 'string'
                  ? characterBookRaw.global_height_scale
                  : undefined,
            styleAnchor:
              typeof root.styleAnchor === 'string'
                ? root.styleAnchor
                : typeof characterBookRaw?.styleAnchor === 'string'
                  ? characterBookRaw.styleAnchor
                  : undefined,
          }
        : undefined,
    environmentDNA,
    styleCore,
    render_rules,
    masterAssetLibrary,
    global_height_scale:
      typeof root.global_height_scale === 'string'
        ? root.global_height_scale
        : characterBook?.global_height_scale,
    styleCoreMetrics: root.styleCoreMetrics as MasterCoreStyleCoreMetrics | undefined,
    master_image_id:
      typeof root.master_image_id === 'string'
        ? root.master_image_id
        : characterBook?.master_image_id,
    styleAnchor:
      typeof root.styleAnchor === 'string' ? root.styleAnchor : characterBook?.styleAnchor,
    characters,
    subCharacters,
  };
}

function resolveCharacters(snapshot: MasterCoreDNASnapshot): CharacterEntry[] {
  return snapshot.characterBook?.characters ?? snapshot.characters ?? [];
}

function resolveSubCharacters(snapshot: MasterCoreDNASnapshot): SubCharacterEntry[] {
  return snapshot.characterBook?.subCharacters ?? snapshot.subCharacters ?? [];
}

function resolveEnvironmentDNA(snapshot: MasterCoreDNASnapshot): CharacterBook['environmentDNA'] {
  return snapshot.environmentDNA ?? snapshot.characterBook?.environmentDNA;
}

export function buildCharacterDNAIndex(
  snapshot: MasterCoreDNASnapshot
): Record<string, CharacterDNAIndexEntry> {
  const index: Record<string, CharacterDNAIndexEntry> = {};

  for (const character of resolveCharacters(snapshot)) {
    const indexKey = digest(['character', character.id, character.grid_position ?? '', character.visual_dna]);
    index[character.id] = {
      index_key: indexKey,
      character_id: character.id,
      name: character.name,
      type: character.type,
      visual_dna: character.visual_dna ?? '',
      grid_position: character.grid_position,
      slot_index: character.slot_index,
      dna_details: character.dna_details,
      master_image_id: character.master_image_id,
      elite_image_id: character.elite_image_id,
      source: 'character',
    };
  }

  for (const sub of resolveSubCharacters(snapshot)) {
    const indexKey = digest(['sub_character', sub.id, sub.name, sub.visual_dna ?? sub.description]);
    index[sub.id] = {
      index_key: indexKey,
      character_id: sub.id,
      name: sub.name,
      type: 'sub_character',
      visual_dna: sub.visual_dna ?? sub.description ?? '',
      source: 'sub_character',
    };
  }

  return index;
}

export function buildEnvironmentDNAIndex(
  snapshot: MasterCoreDNASnapshot
): Record<string, EnvironmentDNAIndexEntry> {
  const env = resolveEnvironmentDNA(snapshot);
  const index: Record<string, EnvironmentDNAIndexEntry> = {};
  if (!env) return index;

  for (const slot of ENVIRONMENT_DNA_SLOTS) {
    const dnaText = env[slot];
    if (!dnaText) continue;
    index[slot] = {
      slot_key: slot,
      dna_text: dnaText,
      fingerprint: digest(['environment_dna', slot, dnaText]),
    };
  }

  return index;
}

export function buildStyleCoreProfile(snapshot: MasterCoreDNASnapshot): StyleCoreProfileOutput {
  const styleCore = snapshot.styleCore ?? {};
  const metrics = snapshot.styleCoreMetrics;
  const styleAnchor = styleCore.styleAnchor ?? snapshot.styleAnchor ?? snapshot.characterBook?.styleAnchor;
  const styleKey = styleCore.styleKey ?? 'gonegi-warm-cinematic';
  const materialKey = styleCore.materialKey ?? 'glass-glaze-soft';
  const lightingKey = styleCore.lightingKey ?? 'warm-harbor-golden';
  const brushworkKey = styleCore.brushworkKey ?? 'soft-handpainted-animation';
  const paletteKey = styleCore.paletteKey ?? 'warm-harbor-evening';
  const style_core_id = digest([
    MASTER_CORE_DNA_ADAPTER_VERSION,
    styleKey,
    materialKey,
    lightingKey,
    brushworkKey,
    paletteKey,
    styleAnchor ?? '',
  ]);

  return {
    style_core_id,
    styleKey,
    materialKey,
    lightingKey,
    brushworkKey,
    paletteKey,
    styleAnchor,
    styleStrength: styleCore.styleStrength ?? metrics?.palette_coherence ?? round6(0.992351),
    metrics,
  };
}

function parseRenderRuleKeys(render_rules: MasterCoreDNASnapshot['render_rules']): string[] {
  if (!render_rules) return [];
  if (typeof render_rules === 'string') return ['global'];
  return Object.keys(render_rules).filter((key) => !!render_rules[key]).sort();
}

export function buildMasterAssetIndex(
  snapshot: MasterCoreDNASnapshot,
  characterIndex: Record<string, CharacterDNAIndexEntry>
): Record<string, MasterAssetIndexEntry> {
  const index: Record<string, MasterAssetIndexEntry> = {};

  for (const asset of snapshot.masterAssetLibrary ?? []) {
    index[asset.asset_id] = {
      asset_id: asset.asset_id,
      asset_kind: asset.asset_kind,
      character_id: asset.character_id,
      label: asset.label,
      fingerprint: asset.fingerprint ?? digest(['asset', asset.asset_id, asset.asset_kind ?? '', asset.uri ?? '']),
      source: 'library',
    };
  }

  const masterImageId =
    snapshot.master_image_id ?? snapshot.characterBook?.master_image_id;
  if (masterImageId && !index[masterImageId]) {
    index[masterImageId] = {
      asset_id: masterImageId,
      asset_kind: 'master_image',
      label: 'master_book_image',
      fingerprint: digest(['master_image', masterImageId]),
      source: 'character_book',
    };
  }

  for (const entry of Object.values(characterIndex)) {
    if (entry.elite_image_id && !index[entry.elite_image_id]) {
      index[entry.elite_image_id] = {
        asset_id: entry.elite_image_id,
        asset_kind: 'elite_image',
        character_id: entry.character_id,
        label: `${entry.name}_elite`,
        fingerprint: digest(['elite_image', entry.elite_image_id, entry.character_id]),
        source: 'character_entry',
      };
    }
    if (entry.master_image_id && !index[entry.master_image_id]) {
      index[entry.master_image_id] = {
        asset_id: entry.master_image_id,
        asset_kind: 'master_image',
        character_id: entry.character_id,
        label: `${entry.name}_master`,
        fingerprint: digest(['character_master_image', entry.master_image_id, entry.character_id]),
        source: 'character_entry',
      };
    }
  }

  return index;
}

export function buildMasterCoreProfile(
  snapshot: MasterCoreDNASnapshot,
  characterIndex: Record<string, CharacterDNAIndexEntry>,
  environmentIndex: Record<string, EnvironmentDNAIndexEntry>,
  styleProfile: StyleCoreProfileOutput,
  assetIndex: Record<string, MasterAssetIndexEntry>
): MasterCoreProfile {
  const characters = resolveCharacters(snapshot);
  const subCharacters = resolveSubCharacters(snapshot);

  return {
    adapter_version: MASTER_CORE_DNA_ADAPTER_VERSION,
    book_version: snapshot.characterBook?.version,
    global_height_scale:
      snapshot.global_height_scale ?? snapshot.characterBook?.global_height_scale,
    style_anchor:
      snapshot.styleAnchor ??
      snapshot.characterBook?.styleAnchor ??
      styleProfile.styleAnchor,
    master_image_id:
      snapshot.master_image_id ?? snapshot.characterBook?.master_image_id,
    character_count: characters.length,
    sub_character_count: subCharacters.length,
    environment_slot_count: Object.keys(environmentIndex).length,
    style_core_id: styleProfile.style_core_id,
    render_rule_keys: parseRenderRuleKeys(snapshot.render_rules),
    asset_count: Object.keys(assetIndex).length,
  };
}

export function buildMasterCoreDNAAdapterDetection(
  snapshot: MasterCoreDNASnapshot,
  characterIndex: Record<string, CharacterDNAIndexEntry>,
  environmentIndex: Record<string, EnvironmentDNAIndexEntry>,
  styleProfile: StyleCoreProfileOutput,
  assetIndex: Record<string, MasterAssetIndexEntry>
): MasterCoreDNAAdapterDetection {
  const characters = resolveCharacters(snapshot);
  const subCharacters = resolveSubCharacters(snapshot);
  const masterImageId =
    snapshot.master_image_id ?? snapshot.characterBook?.master_image_id;

  return {
    characters_detected: characters.length + subCharacters.length,
    sub_characters_detected: subCharacters.length,
    environment_dna_detected: Object.keys(environmentIndex).length > 0,
    style_core_detected: !!styleProfile.styleKey && styleProfile.styleKey.length > 0,
    master_image_asset_detected:
      !!masterImageId &&
      Object.values(assetIndex).some(
        (asset) => asset.asset_kind === 'master_image' && asset.asset_id === masterImageId
      ),
    render_rules_detected: parseRenderRuleKeys(snapshot.render_rules).length > 0,
  };
}

/**
 * Pure adapter — maps MasterCore DNA snapshot into dataset-OS-ready indexes.
 * Additive only; does not mutate input or rewrite datasets.
 */
export function adaptMasterCoreDNA(snapshotInput: MasterCoreDNASnapshot | unknown): MasterCoreDNAAdapterResult {
  const snapshot = normalizeMasterCoreDNASnapshot(snapshotInput);
  const character_dna_index = buildCharacterDNAIndex(snapshot);
  const environment_dna_index = buildEnvironmentDNAIndex(snapshot);
  const style_core_profile = buildStyleCoreProfile(snapshot);
  const master_asset_index = buildMasterAssetIndex(snapshot, character_dna_index);
  const master_core_profile = buildMasterCoreProfile(
    snapshot,
    character_dna_index,
    environment_dna_index,
    style_core_profile,
    master_asset_index
  );
  const detection = buildMasterCoreDNAAdapterDetection(
    snapshot,
    character_dna_index,
    environment_dna_index,
    style_core_profile,
    master_asset_index
  );

  const exportCore = {
    schema_version: MASTER_CORE_DNA_ADAPTER_VERSION,
    generated_at: MASTER_CORE_DNA_ADAPTER_EPOCH,
    master_core_profile,
    character_dna_index,
    environment_dna_index,
    style_core_profile,
    master_asset_index,
    detection,
  };

  const export_checksum = digest([JSON.stringify(exportCore)]);

  return {
    ...exportCore,
    export_checksum,
  };
}

/** Deterministic canonical MasterCore_DNA_Snapshot for adapter preview. */
export function buildCanonicalMasterCoreDNASnapshot(): MasterCoreDNASnapshot {
  const environmentDNA = {
    dawn: 'Pre-dawn cool mist with lavender haze and deep indigo occlusion shadows.',
    morning: 'Crisp golden sunlight with sharp cel-shadows and vibrant sky-blue gradient.',
    afternoon: 'Vertical white sunlight, deep cerulean sky, high clarity heat atmosphere.',
    late_afternoon: 'Warm golden-orange directional light with terracotta shadows.',
    sunset: 'Low crimson-orange light with dramatic violet shadows and fiery sky.',
    night: 'Cool silvery moonlight with charcoal shadows and deep indigo sky.',
    dream: 'Ethereal pastel light with soft colorful shadows and surreal clouds.',
    spiritual: 'Radiant golden-white inner light with luminous clear sky.',
    global:
      'Classic 1980s Studio Ghibli hand-painted style with opaque gouache, visible brushstrokes, and emotional resonance.',
  };

  const characters: CharacterEntry[] = GRID_POSITIONS.map((pos, idx) => ({
    id: `slot_${pos}`,
    name: idx === 0 ? 'Gonegi Main' : idx >= 11 ? 'ANIMALS (FAUNA)' : `Guardian ${pos}`,
    visual_dna:
      idx === 0
        ? 'Rounded small cat silhouette, harbor coat slate duster, amber gaze lock, soft hand-painted fur grain.'
        : idx >= 11
          ? 'Fauna companion silhouette, organic line weight, painterly fur or wing texture.'
          : `Guardian slot ${pos} visual DNA with Ghibli cel-shading and identity-stable face topology.`,
    type: idx >= 11 ? 'animal' : 'human',
    grid_position: pos,
    slot_index: idx,
    dna_details:
      idx === 0
        ? {
            core_identity: 'protagonist',
            outfit: 'harbor coat slate duster',
            gaze_logic: { focus_intensity: 0.96, default_target: 'companion' },
            aura_fidelity: 0.98,
          }
        : undefined,
    elite_image_id: idx === 0 ? 'elite-image-gonegi-main-v1' : undefined,
  }));

  const subCharacters: SubCharacterEntry[] = [
    {
      id: 'npc_harbor_keeper',
      name: 'Harbor Keeper',
      description: 'Background witness with warm tungsten rim light.',
      visual_dna: 'Elderly harbor keeper, wool cardigan, lantern glow, muted amber palette.',
      image_id: 'npc-image-harbor-keeper-v1',
    },
  ];

  return {
    schema_version: 'MasterCore_DNA_Snapshot',
    characterBook: {
      version: '5.1',
      master_image_id: 'master-image-gonegi-book-v1',
      global_height_scale: '1.0 gonegi_height_unit',
      styleAnchor: 'Ghibli Mediterranean Chronicles v5.1',
      characters,
      subCharacters,
      environmentDNA,
    },
    environmentDNA,
    styleCore: {
      styleKey: 'gonegi-warm-cinematic',
      materialKey: 'glass-glaze-soft',
      lightingKey: 'warm-harbor-golden',
      brushworkKey: 'soft-handpainted-animation',
      paletteKey: 'warm-harbor-evening',
      styleAnchor: 'Ghibli Mediterranean Chronicles v5.1',
      styleStrength: 0.992351,
    },
    render_rules: {
      global: environmentDNA.global,
      character: 'Preserve face topology lock and outfit continuity across scenes.',
      environment: 'Apply time-of-day ENV DNA slot without overwriting scene physics.',
      composition: 'Golden ratio framing with atmospheric perspective depth planes.',
    },
    masterAssetLibrary: [
      {
        asset_id: 'master-image-gonegi-book-v1',
        asset_kind: 'master_image',
        label: 'Gonegi Master Book Image',
        fingerprint: digest(['library', 'master-image-gonegi-book-v1']),
      },
      {
        asset_id: 'style-anchor-ghibli-med-v51',
        asset_kind: 'style_anchor',
        label: 'Ghibli Mediterranean Style Anchor',
        fingerprint: digest(['library', 'style-anchor-ghibli-med-v51']),
      },
    ],
    global_height_scale: '1.0 gonegi_height_unit',
    styleCoreMetrics: {
      contrast_norm: 0.84,
      warmth_norm: 0.91,
      brushwork_density: 0.88,
      palette_coherence: 0.992351,
      material_fidelity: 0.93,
      lighting_consistency: 0.89,
    },
    master_image_id: 'master-image-gonegi-book-v1',
    styleAnchor: 'Ghibli Mediterranean Chronicles v5.1',
  };
}

let cachedPreview: MasterCoreDNAAdapterResult | null = null;

export function buildMasterCoreDNAAdapterPreview(): MasterCoreDNAAdapterResult {
  if (cachedPreview) return cachedPreview;
  cachedPreview = adaptMasterCoreDNA(buildCanonicalMasterCoreDNASnapshot());
  return cachedPreview;
}

export function resetMasterCoreDNAAdapterCache(): void {
  cachedPreview = null;
}
