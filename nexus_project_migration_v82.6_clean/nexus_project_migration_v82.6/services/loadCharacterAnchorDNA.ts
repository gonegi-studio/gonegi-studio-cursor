import fs from 'fs';
import path from 'path';
import {
  CANONICAL_CHARACTER_SLOT_MAP,
  type CanonicalCharacterName,
  type CanonicalSlotId,
  matchesCanonicalCharacterName,
} from './characterSlotMap';
import { CHARACTER_IMAGE_ANCHOR_IMPORT_ROOT } from './runtimeImageAnchorResolver';

export const CHARACTER_ANCHOR_DNA_LOADER_VERSION = 'PHASE-33E-v1' as const;

export const CHARACTER_DNA_LOCK_BLOCK = `### [CHARACTER_DNA_LOCK]
Facial topology, eye spacing, hair silhouette,
head ratio, outfit structure, and companion anchors
from character_dna.json are IMMUTABLE.

style refs cannot override character identity.`;

export interface CharacterAnchorDNARecord {
  id: string;
  name: string;
  visual_dna: string;
  height?: string;
  relational_anchor?: string;
  identity_laws?: string;
  slot_id: CanonicalSlotId;
  source_path: string;
}

export interface InjectedCharacterDnaEntry {
  name: string;
  slot_id: string;
  dna_loaded: boolean;
}

export interface CharacterAnchorDnaPreview {
  dna_source: 'anchor_slot_json';
  injected_character_dna: InjectedCharacterDnaEntry[];
}

export type CharacterAnchorDNAMap = Map<string, CharacterAnchorDNARecord>;

let cachedMap: CharacterAnchorDNAMap | null = null;

function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase();
}

function parseCharacterDnaFile(
  slotDir: string,
  slotId: CanonicalSlotId
): CharacterAnchorDNARecord | null {
  const filePath = path.join(slotDir, 'character_dna.json');
  if (!fs.existsSync(filePath)) return null;

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  const name = String(raw.name ?? '').trim();
  const visual_dna = String(raw.visual_dna ?? '').trim();
  if (!name || !visual_dna) return null;

  return {
    id: String(raw.id ?? slotId),
    name,
    visual_dna,
    height: raw.height != null ? String(raw.height) : undefined,
    relational_anchor:
      raw.relational_anchor != null ? String(raw.relational_anchor) : undefined,
    identity_laws: raw.identity_laws != null ? String(raw.identity_laws) : undefined,
    slot_id: slotId,
    source_path: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
  };
}

export function loadCharacterAnchorDNAMap(rootDir = process.cwd()): CharacterAnchorDNAMap {
  if (cachedMap) return cachedMap;

  const map: CharacterAnchorDNAMap = new Map();
  const anchorRoot = path.join(rootDir, CHARACTER_IMAGE_ANCHOR_IMPORT_ROOT);
  if (!fs.existsSync(anchorRoot)) {
    cachedMap = map;
    return map;
  }

  const slotDirs = fs
    .readdirSync(anchorRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name in CANONICAL_CHARACTER_SLOT_MAP)
    .sort() as CanonicalSlotId[];

  for (const slotId of slotDirs) {
    const slotPath = path.join(anchorRoot, slotId);
    const record = parseCharacterDnaFile(slotPath, slotId);
    if (!record) continue;
    map.set(normalizeNameKey(record.name), record);
  }

  cachedMap = map;
  return map;
}

export function resetCharacterAnchorDNAMapCache(): void {
  cachedMap = null;
}

export function getCharacterAnchorDNABySlot(slotId: string): CharacterAnchorDNARecord | null {
  const map = loadCharacterAnchorDNAMap();
  for (const record of map.values()) {
    if (record.slot_id === slotId) return record;
  }
  return null;
}

export function getCharacterAnchorDNAByName(name: string): CharacterAnchorDNARecord | null {
  return loadCharacterAnchorDNAMap().get(normalizeNameKey(name)) ?? null;
}

/** Detect only characters named in prompt that have anchor DNA entries. */
export function detectCharactersInPromptWithAnchorDna(prompt: string): CharacterAnchorDNARecord[] {
  const map = loadCharacterAnchorDNAMap();
  const detected: CharacterAnchorDNARecord[] = [];

  for (const record of map.values()) {
    const token = new RegExp(`\\b${record.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (token.test(prompt)) {
      detected.push(record);
    }
  }

  return detected.sort((a, b) => a.slot_id.localeCompare(b.slot_id));
}

export function validateAnchorDnaForCharacters(
  characters: Array<{ name: string; slot_id?: string }>
): { ready: boolean; missing: string[]; records: CharacterAnchorDNARecord[] } {
  const missing: string[] = [];
  const records: CharacterAnchorDNARecord[] = [];

  for (const character of characters) {
    const byName = getCharacterAnchorDNAByName(character.name);
    const bySlot = character.slot_id ? getCharacterAnchorDNABySlot(character.slot_id) : null;
    const record = byName ?? bySlot;
    if (!record) {
      missing.push(character.name);
      continue;
    }
    records.push(record);
  }

  return { ready: missing.length === 0, missing, records };
}

export function buildInjectedCharacterDnaPreview(
  records: CharacterAnchorDNARecord[]
): CharacterAnchorDnaPreview {
  return {
    dna_source: 'anchor_slot_json',
    injected_character_dna: records.map((record) => ({
      name: record.name,
      slot_id: record.slot_id,
      dna_loaded: true,
    })),
  };
}

export function formatFullAnchorCharacterCoreSection(records: CharacterAnchorDNARecord[]): string {
  const lines = ['[CHARACTER_CORE]'];
  for (const record of records) {
    lines.push(`${record.name}: ${record.visual_dna}`);
    if (record.height) {
      lines.push(`${record.name} height: ${record.height}`);
    }
    if (record.relational_anchor) {
      lines.push(`${record.name} relational_anchor: ${record.relational_anchor}`);
    }
    if (record.identity_laws) {
      lines.push(`${record.name} identity_laws: ${record.identity_laws}`);
    }
  }
  return lines.join('. ');
}

export function buildCharacterDnaLockSection(): string {
  return CHARACTER_DNA_LOCK_BLOCK;
}

export function resolveSlotIdsForDetectedCharacters(
  prompt: string,
  fallbackSlotIds: string[] = []
): string[] {
  const detected = detectCharactersInPromptWithAnchorDna(prompt);
  if (detected.length > 0) {
    return detected.map((r) => r.slot_id);
  }
  return [...fallbackSlotIds].sort();
}

export function assertCanonicalAnchorDnaReady(slotIds: string[]): void {
  const missing = slotIds.filter((slotId) => !getCharacterAnchorDNABySlot(slotId));
  if (missing.length > 0) {
    throw new Error(
      `PHASE-33E missing character_dna.json for slot(s): ${missing.join(', ')}`
    );
  }
}

export function matchesCanonicalName(
  name: string,
  canonical: CanonicalCharacterName
): boolean {
  return matchesCanonicalCharacterName(name, canonical);
}
