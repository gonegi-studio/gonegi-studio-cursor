import fs from 'fs';
import path from 'path';
import {
  type CanonicalSlotId,
  getCanonicalCharacterName,
  matchesCanonicalCharacterName,
} from './characterSlotMap';
import { CHARACTER_IMAGE_ANCHOR_IMPORT_ROOT } from './runtimeImageAnchorResolver';

export const CHARACTER_ANCHOR_DNA_LOADER_VERSION = 'PHASE-33F-v1' as const;
export const CHARACTER_ANCHOR_INDEX_FILENAME = 'character_anchor.index.json';

export const CHARACTER_DNA_LOCK_BLOCK = `### [CHARACTER_DNA_LOCK]
Facial topology, eye spacing, hair silhouette,
head ratio, outfit structure, and companion anchors
from character_dna.json are IMMUTABLE.

style refs cannot override character identity.`;

const GONEGI_DNA_REQUIRED = ['Pazu-lookalike', 'sun-kissed tan', 'suspenders'] as const;
const DANA_DNA_REQUIRED = [
  'oceanic blue',
  'low twin ponytails',
  'Pale Cornflower Blue',
] as const;

const LEGACY_FORBIDDEN_IN_PROMPT = [
  'warm olive gaze',
  'seafoam linen wrap',
  'harbor shawl',
] as const;

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

export interface CharacterAnchorDnaDebug {
  source: 'character_anchor.index.json';
  loaded_slots: string[];
  name_slot_map: Record<string, string>;
  mismatches: string[];
  loaded_visual_dna_excerpt: Record<string, string>;
}

export interface CharacterAnchorDnaPreview {
  dna_source: 'character_anchor.index.json';
  injected_character_dna: InjectedCharacterDnaEntry[];
}

export interface CharacterAnchorRegistryLoadResult {
  ready: boolean;
  blocked_reason?: string;
  map: CharacterAnchorDNAMap;
  dna_debug: CharacterAnchorDnaDebug;
}

export type CharacterAnchorDNAMap = Map<string, CharacterAnchorDNARecord>;

let cachedRegistry: CharacterAnchorRegistryLoadResult | null = null;

function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase();
}

function excerptVisualDna(visualDna: string, maxLen = 160): string {
  return visualDna.length <= maxLen ? visualDna : `${visualDna.slice(0, maxLen)}…`;
}

function loadCharacterAnchorIndex(
  anchorRoot: string
): { name_slot_map: Record<string, string>; mismatches: string[] } {
  const indexPath = path.join(anchorRoot, CHARACTER_ANCHOR_INDEX_FILENAME);
  const mismatches: string[] = [];

  if (!fs.existsSync(indexPath)) {
    mismatches.push(`missing index file: ${CHARACTER_ANCHOR_INDEX_FILENAME}`);
    return { name_slot_map: {}, mismatches };
  }

  const raw = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as Record<string, string>;
  const name_slot_map: Record<string, string> = {};

  for (const [slotId, expectedName] of Object.entries(raw)) {
    try {
      getCanonicalCharacterName(slotId);
    } catch {
      mismatches.push(`index contains unknown slot_id: ${slotId}`);
      continue;
    }
    const canonical = String(expectedName).trim();
    if (!canonical) {
      mismatches.push(`index empty name for slot ${slotId}`);
      continue;
    }
    name_slot_map[slotId] = canonical;
  }

  return { name_slot_map, mismatches };
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
  const fileSlotId = String(raw.slot_id ?? raw.id ?? slotId).trim();
  if (!name || !visual_dna) return null;

  return {
    id: String(raw.id ?? slotId),
    name,
    visual_dna,
    height: raw.height != null ? String(raw.height) : undefined,
    relational_anchor:
      raw.relational_anchor != null ? String(raw.relational_anchor) : undefined,
    identity_laws: raw.identity_laws != null ? String(raw.identity_laws) : undefined,
    slot_id: fileSlotId as CanonicalSlotId,
    source_path: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
  };
}

export function loadCharacterAnchorRegistry(rootDir = process.cwd()): CharacterAnchorRegistryLoadResult {
  if (cachedRegistry) return cachedRegistry;

  const anchorRoot = path.join(rootDir, CHARACTER_IMAGE_ANCHOR_IMPORT_ROOT);
  const dna_debug: CharacterAnchorDnaDebug = {
    source: 'character_anchor.index.json',
    loaded_slots: [],
    name_slot_map: {},
    mismatches: [],
    loaded_visual_dna_excerpt: {},
  };

  if (!fs.existsSync(anchorRoot)) {
    dna_debug.mismatches.push(`missing anchor root: ${CHARACTER_IMAGE_ANCHOR_IMPORT_ROOT}`);
    cachedRegistry = { ready: false, blocked_reason: 'PHASE-33F anchor root missing', map: new Map(), dna_debug };
    return cachedRegistry;
  }

  const { name_slot_map, mismatches: indexMismatches } = loadCharacterAnchorIndex(anchorRoot);
  dna_debug.name_slot_map = name_slot_map;
  dna_debug.mismatches.push(...indexMismatches);

  const map: CharacterAnchorDNAMap = new Map();
  const slotIds = Object.keys(name_slot_map).sort() as CanonicalSlotId[];

  for (const slotId of slotIds) {
    const expectedName = name_slot_map[slotId];
    const slotPath = path.join(anchorRoot, slotId);
    const record = parseCharacterDnaFile(slotPath, slotId);

    if (!record) {
      continue;
    }

    if (record.slot_id !== slotId) {
      dna_debug.mismatches.push(
        `slot_id mismatch for ${slotId}: index expects ${slotId}, file has ${record.slot_id}`
      );
      continue;
    }

    if (record.name !== expectedName) {
      dna_debug.mismatches.push(
        `name mismatch for ${slotId}: index expects ${expectedName}, file has ${record.name}`
      );
      continue;
    }

    map.set(normalizeNameKey(record.name), { ...record, slot_id: slotId, name: expectedName });
    dna_debug.loaded_slots.push(slotId);
    dna_debug.loaded_visual_dna_excerpt[expectedName] = excerptVisualDna(record.visual_dna);
  }

  const ready = indexMismatches.length === 0 && dna_debug.mismatches.length === 0;
  cachedRegistry = {
    ready,
    blocked_reason: ready ? undefined : `PHASE-33F anchor index/DNA validation failed: ${dna_debug.mismatches.join('; ')}`,
    map,
    dna_debug,
  };
  return cachedRegistry;
}

export function loadCharacterAnchorDNAMap(rootDir = process.cwd()): CharacterAnchorDNAMap {
  return loadCharacterAnchorRegistry(rootDir).map;
}

export function buildCharacterAnchorDnaDebug(rootDir = process.cwd()): CharacterAnchorDnaDebug {
  return loadCharacterAnchorRegistry(rootDir).dna_debug;
}

export function resetCharacterAnchorDNAMapCache(): void {
  cachedRegistry = null;
}

export function getCharacterAnchorDNABySlot(slotId: string): CharacterAnchorDNARecord | null {
  const registry = loadCharacterAnchorRegistry();
  for (const record of registry.map.values()) {
    if (record.slot_id === slotId) return record;
  }
  return null;
}

export function getCharacterAnchorDNAByName(name: string): CharacterAnchorDNARecord | null {
  return loadCharacterAnchorRegistry().map.get(normalizeNameKey(name)) ?? null;
}

function includesAll(haystack: string, needles: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.every((needle) => lower.includes(needle.toLowerCase()));
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((needle) => lower.includes(needle.toLowerCase()));
}

export function validateIndexedDnaRecordContent(
  record: CharacterAnchorDNARecord
): { ready: boolean; blocked_reason?: string } {
  if (matchesCanonicalCharacterName(record.name, 'Gonegi')) {
    if (!includesAll(record.visual_dna, GONEGI_DNA_REQUIRED)) {
      return {
        ready: false,
        blocked_reason: `PHASE-33F Gonegi DNA missing required tokens: ${GONEGI_DNA_REQUIRED.join(', ')}`,
      };
    }
  }

  if (matchesCanonicalCharacterName(record.name, 'Dana')) {
    if (!includesAll(record.visual_dna, DANA_DNA_REQUIRED)) {
      return {
        ready: false,
        blocked_reason: `PHASE-33F Dana DNA missing required tokens: ${DANA_DNA_REQUIRED.join(', ')}`,
      };
    }
  }

  return { ready: true };
}

export function validateCompiledPromptDnaContent(
  prompt: string,
  records: CharacterAnchorDNARecord[]
): { ready: boolean; blocked_reason?: string } {
  const lower = prompt.toLowerCase();

  for (const record of records) {
    const content = validateIndexedDnaRecordContent(record);
    if (!content.ready) return content;

    if (matchesCanonicalCharacterName(record.name, 'Gonegi')) {
      if (!includesAll(prompt, GONEGI_DNA_REQUIRED)) {
        return {
          ready: false,
          blocked_reason: `PHASE-33F Gonegi prompt missing required tokens: ${GONEGI_DNA_REQUIRED.join(', ')}`,
        };
      }
    }

    if (matchesCanonicalCharacterName(record.name, 'Dana')) {
      if (!includesAll(prompt, DANA_DNA_REQUIRED)) {
        return {
          ready: false,
          blocked_reason: `PHASE-33F Dana prompt missing required tokens: ${DANA_DNA_REQUIRED.join(', ')}`,
        };
      }
    }
  }

  if (includesAny(prompt, LEGACY_FORBIDDEN_IN_PROMPT)) {
    return {
      ready: false,
      blocked_reason: `PHASE-33F prompt contains legacy DNA wording: ${LEGACY_FORBIDDEN_IN_PROMPT.join(', ')}`,
    };
  }

  return { ready: true };
}

export function detectCharactersInPromptWithAnchorDna(prompt: string): CharacterAnchorDNARecord[] {
  const registry = loadCharacterAnchorRegistry();
  if (!registry.ready) return [];

  const detected: CharacterAnchorDNARecord[] = [];
  for (const record of registry.map.values()) {
    const token = new RegExp(`\\b${record.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (token.test(prompt)) {
      detected.push(record);
    }
  }

  return detected.sort((a, b) => a.slot_id.localeCompare(b.slot_id));
}

export function validateAnchorDnaForCharacters(
  characters: Array<{ name: string; slot_id?: string }>
): {
  ready: boolean;
  missing: string[];
  records: CharacterAnchorDNARecord[];
  blocked_reason?: string;
  dna_debug: CharacterAnchorDnaDebug;
} {
  const registry = loadCharacterAnchorRegistry();
  if (!registry.ready) {
    return {
      ready: false,
      missing: characters.map((c) => c.name),
      records: [],
      blocked_reason: registry.blocked_reason,
      dna_debug: registry.dna_debug,
    };
  }

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

    const content = validateIndexedDnaRecordContent(record);
    if (!content.ready) {
      return {
        ready: false,
        missing,
        records,
        blocked_reason: content.blocked_reason,
        dna_debug: registry.dna_debug,
      };
    }

    records.push(record);
  }

  return {
    ready: missing.length === 0,
    missing,
    records,
    dna_debug: registry.dna_debug,
  };
}

export function buildInjectedCharacterDnaPreview(
  records: CharacterAnchorDNARecord[]
): CharacterAnchorDnaPreview {
  return {
    dna_source: 'character_anchor.index.json',
    injected_character_dna: records.map((record) => ({
      name: record.name,
      slot_id: record.slot_id,
      dna_loaded: true,
    })),
  };
}

/** Verbatim visual_dna only — no compression or generated facial summaries. */
export function formatFullAnchorCharacterCoreSection(records: CharacterAnchorDNARecord[]): string {
  const lines = ['[CHARACTER_CORE]'];
  for (const record of records) {
    lines.push(`${record.name}: ${record.visual_dna}`);
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
  const registry = loadCharacterAnchorRegistry();
  if (!registry.ready) {
    throw new Error(registry.blocked_reason ?? 'PHASE-33F anchor registry NOT_READY');
  }

  const missing = slotIds.filter((slotId) => !getCharacterAnchorDNABySlot(slotId));
  if (missing.length > 0) {
    throw new Error(`PHASE-33F missing indexed character_dna.json for slot(s): ${missing.join(', ')}`);
  }
}
