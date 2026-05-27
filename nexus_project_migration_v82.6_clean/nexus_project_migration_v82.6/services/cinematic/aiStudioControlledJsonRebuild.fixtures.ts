import fs from 'fs';
import path from 'path';
import { CharacterEntry, MasterCoreDNASnapshot, SubCharacterEntry } from '../../types';
import { MEDITERRANEAN_CHRONICLES_DATA } from '../../src/data/jsonData';

export const MASTER_CORE_V175_VERSION = '17.5' as const;
export const MASTER_CORE_SNAPSHOT_FILENAME = 'MasterCore_DNA_Snapshot_2026-05-27(이미지생성앱용).json';
export const MASTER_CORE_IMPORT_DIR = 'mastercore_v175';
export const MASTER_STYLE_CORE_DIRNAME = 'master_style_core';

export const VITREOUS_ELEGANCE_PROTOCOL =
  'Vitreous Elegance Protocol: glass-glaze-soft eye highlight integrity, vitreous cel-shadow balance, mask fixation stable across frames, facial anchor laws must not be compressed away';

export const MEDITERRANEAN_REALITY_FOUNDATION =
  'Mediterranean Reality Foundation: picturesque harbor town with weathered white stone and terracotta roofs, nostalgic melancholic mood, emerald sea reflections, 1980s-1990s Studio Ghibli hand-drawn cel-animation, 0.4mm pencil line-art stability';

export const AMS_LAWS = [
  'AMS-01: opaque gouache layering with visible brush grain friction',
  'AMS-02: flat cel-shadow balance without photoreal bloom collapse',
  'AMS-03: hand-painted animation line weight 0.4mm stable pencil line-art',
  'AMS-04: warm harbor palette coherence without background modernization',
] as const;

const GRID_POSITIONS = [
  '1-1', '1-2', '1-3', '1-4', '1-5', '1-6',
  '2-1', '2-2', '2-3', '2-4', '2-5',
  '2-6-1', '2-6-2',
] as const;

const CHARACTER_DEFINITIONS: Array<{
  pos: (typeof GRID_POSITIONS)[number];
  name: string;
  visual_dna: string;
  type: string;
  elite_image_id?: string;
  dna_details?: CharacterEntry['dna_details'];
}> = [
  {
    pos: '1-1',
    name: 'Gonegi Main',
    visual_dna:
      'Rounded small cat silhouette, harbor coat slate duster, amber gaze lock, soft hand-painted fur grain, vitreous eye highlight integrity.',
    type: 'human',
    elite_image_id: 'elite-image-gonegi-main-v1',
    dna_details: {
      core_identity: 'protagonist',
      outfit: 'harbor coat slate duster',
      gaze_logic: { focus_intensity: 0.96, default_target: 'companion' },
      aura_fidelity: 0.98,
    },
  },
  {
    pos: '1-2',
    name: 'Harbor Elder',
    visual_dna:
      'Elder harbor witness, wool cardigan silhouette, lantern-warm rim light, muted amber palette, identity-stable Ghibli face topology.',
    type: 'human',
  },
  {
    pos: '1-3',
    name: 'Market Keeper',
    visual_dna:
      'Market keeper with terracotta apron, sun-worn hands, warm ochre skin tones, soft gouache cel-shadow on face planes.',
    type: 'human',
  },
  {
    pos: '1-4',
    name: 'Dock Worker',
    visual_dna:
      'Dock worker with rope-coil posture, navy work shirt, weathered Mediterranean tan, stable cheekbone and jaw anchor geometry.',
    type: 'human',
  },
  {
    pos: '1-5',
    name: 'Village Child',
    visual_dna:
      'Village child with linen dress, barefoot stance, bright curious gaze, hand-painted youth face with soft cel-shadow balance.',
    type: 'human',
  },
  {
    pos: '1-6',
    name: 'Choir Singer',
    visual_dna:
      'Choir singer with folded hymn book, pearl-gray shawl, gentle downward gaze, vitreous highlight on eyes under warm chapel light.',
    type: 'human',
  },
  {
    pos: '2-1',
    name: 'Dana',
    visual_dna:
      'Dana companion portrait anchor, warm olive gaze with vitreous amber highlights, soft auburn braid rhythm, Mediterranean youth face topology, hand-painted Ghibli cel-shading, identity-stable cheek and eye spacing.',
    type: 'human',
    elite_image_id: 'elite-image-dana-companion-v1',
    dna_details: {
      core_identity: 'companion',
      outfit: 'seafoam linen wrap and harbor shawl',
      gaze_logic: { focus_intensity: 0.94, default_target: 'protagonist' },
      aura_fidelity: 0.97,
    },
  },
  {
    pos: '2-2',
    name: 'Fisher Captain',
    visual_dna:
      'Fisher captain with salt-stiff coat, rope-burned palms, sun-creased brow, harbor amber palette with strong silhouette read.',
    type: 'human',
  },
  {
    pos: '2-3',
    name: 'Cafe Owner',
    visual_dna:
      'Cafe owner with rolled sleeves, espresso-stained apron, welcoming half-smile, warm interior rim light on facial planes.',
    type: 'human',
  },
  {
    pos: '2-4',
    name: 'Letter Carrier',
    visual_dna:
      'Letter carrier with canvas satchel, brisk walking rhythm, wind-touched hair, crisp cel-shadow under Mediterranean noon light.',
    type: 'human',
  },
  {
    pos: '2-5',
    name: 'Night Watch',
    visual_dna:
      'Night watch with oil lantern, long coat drape, cool navy rim light, charcoal shadow occlusion with flat cel-shading integrity.',
    type: 'human',
  },
  {
    pos: '2-6-1',
    name: 'Harbor Cat',
    visual_dna:
      'Harbor cat fauna anchor, compact feline silhouette, amber slit-pupil gloss, painterly fur grain with organic line weight.',
    type: 'animal',
  },
  {
    pos: '2-6-2',
    name: 'Seagull Pair',
    visual_dna:
      'Seagull pair fauna anchor, wing-span rhythm, white-blue gouache feather planes, painterly motion blur on wing tips.',
    type: 'animal',
  },
];

export function buildMasterCoreV175Snapshot(): MasterCoreDNASnapshot {
  const environmentDNA = MEDITERRANEAN_CHRONICLES_DATA.environmentDNA;

  const characters: CharacterEntry[] = CHARACTER_DEFINITIONS.map((def, idx) => ({
    id: `slot_${def.pos}`,
    name: def.name,
    visual_dna: def.visual_dna,
    type: def.type,
    grid_position: def.pos,
    slot_index: idx,
    dna_details: def.dna_details,
    elite_image_id: def.elite_image_id,
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
    masterCore_version: MASTER_CORE_V175_VERSION,
    characterBook: {
      version: '17.5',
      master_image_id: 'master-image-gonegi-book-v1',
      global_height_scale: '1.0 gonegi_height_unit',
      styleAnchor: 'Ghibli Mediterranean Chronicles v17.5',
      characters,
      subCharacters,
      environmentDNA,
      globalEnvironmentDNA: MEDITERRANEAN_CHRONICLES_DATA.globalEnvironmentDNA,
    },
    environmentDNA,
    styleCore: {
      styleKey: 'gonegi-warm-cinematic',
      materialKey: 'glass-glaze-soft',
      lightingKey: 'warm-harbor-golden',
      brushworkKey: 'soft-handpainted-animation',
      paletteKey: 'warm-harbor-evening',
      styleAnchor: 'Ghibli Mediterranean Chronicles v17.5',
      styleStrength: 0.992351,
    },
    render_rules: {
      global:
        'Classic 1980s Studio Ghibli hand-painted style with opaque gouache, visible brushstrokes, and emotional resonance.',
      character: 'Preserve face topology lock and outfit continuity across scenes. Image anchor overrides prompt compression.',
      environment: 'Apply time-of-day ENV DNA slot without overwriting scene physics.',
      composition: 'Golden ratio framing with atmospheric perspective depth planes.',
      vitreous_elegance: VITREOUS_ELEGANCE_PROTOCOL,
      mediterranean_reality: MEDITERRANEAN_REALITY_FOUNDATION,
    },
    masterAssetLibrary: [
      {
        asset_id: 'master-image-gonegi-book-v1',
        asset_kind: 'master_image',
        label: 'Gonegi Master Book Image',
        character_id: 'slot_1-1',
      },
      {
        asset_id: 'elite-image-gonegi-main-v1',
        asset_kind: 'elite_image',
        label: 'Gonegi Elite Image Anchor',
        character_id: 'slot_1-1',
      },
      {
        asset_id: 'elite-image-dana-companion-v1',
        asset_kind: 'elite_image',
        label: 'Dana Elite Image Anchor',
        character_id: 'slot_2-1',
      },
      {
        asset_id: 'style-anchor-ghibli-med-v175',
        asset_kind: 'style_anchor',
        label: 'Ghibli Mediterranean Style Anchor v17.5',
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
    styleAnchor: 'Ghibli Mediterranean Chronicles v17.5',
    character_anchor_priority: 'image_anchor_over_prompt',
  };
}

export function buildMasterStyleCoreTree(): Record<string, unknown> {
  const snapshot = buildMasterCoreV175Snapshot();
  return {
    'vitreous_elegance_protocol.json': {
      protocol_id: 'VEP-v175',
      label: 'Vitreous Elegance Protocol',
      directive: VITREOUS_ELEGANCE_PROTOCOL,
      enforcement: 'hard',
    },
    'mediterranean_reality_foundation.json': {
      foundation_id: 'MRF-v175',
      label: 'Mediterranean Reality Foundation',
      directive: MEDITERRANEAN_REALITY_FOUNDATION,
      enforcement: 'hard',
    },
    'ams_laws.json': {
      ams_version: 'AMS-v175',
      laws: AMS_LAWS,
    },
    'style_core_manifest.json': {
      masterCore_version: MASTER_CORE_V175_VERSION,
      styleCore: snapshot.styleCore,
      styleCoreMetrics: snapshot.styleCoreMetrics,
      styleAnchor: snapshot.styleAnchor,
    },
  };
}

export function materializeMasterCoreV175Package(importsRoot: string): string {
  const packageRoot = path.join(importsRoot, MASTER_CORE_IMPORT_DIR);
  const styleCoreRoot = path.join(packageRoot, MASTER_STYLE_CORE_DIRNAME);
  fs.mkdirSync(styleCoreRoot, { recursive: true });

  const snapshot = buildMasterCoreV175Snapshot();
  fs.writeFileSync(
    path.join(packageRoot, MASTER_CORE_SNAPSHOT_FILENAME),
    JSON.stringify(snapshot, null, 2),
    'utf8'
  );

  for (const [filename, payload] of Object.entries(buildMasterStyleCoreTree())) {
    fs.writeFileSync(path.join(styleCoreRoot, filename), JSON.stringify(payload, null, 2), 'utf8');
  }

  return packageRoot;
}
