import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MASTER_STYLE_CORE_DIR = 'master_style_core' as const;
export const CANONICAL_ARTSTYLE_PATH = `${MASTER_STYLE_CORE_DIR}/canonical-artstyle.json` as const;
export const CANONICAL_ARTSTYLE_REF =
  `${CANONICAL_ARTSTYLE_PATH}#CANONICAL_GONEGI_ARTSTYLE` as const;

export const CANONICAL_GONEGI_ARTSTYLE_CONSTANT_KEY = 'CANONICAL_GONEGI_ARTSTYLE' as const;

export const ARTSTYLE_EXPANSION_MARKERS = [
  'Mediterranean Reality Foundation:',
  'Vitreous Elegance Protocol:',
  'AMS-01:',
  'AMS-02:',
  'AMS-03:',
  'AMS-04:',
] as const;

export const FORBIDDEN_GENERATED_ART_STYLES = [
  'Hand-painted Studio Ghibli-inspired cinematic illustration, warm Mediterranean Gonegi world tone, soft watercolor backgrounds, expressive character eyes, preserved period interior grammar without Titanic world identity.',
  'Hand-painted Studio Ghibli-inspired cinematic illustration, Mediterranean Gonegi mythic tone, luminous spirit-world atmosphere, soft layered backgrounds, expressive character eyes.',
] as const;

export interface CanonicalArtStyleRecord {
  canonical_id: string;
  phase: string;
  system_id: string;
  constant_key: typeof CANONICAL_GONEGI_ARTSTYLE_CONSTANT_KEY;
  CANONICAL_GONEGI_ARTSTYLE: string;
  identity_lock: {
    gonegi_visual_identity: string;
    variant_policy: 'exactly_one';
    expansion_forbidden: boolean;
  };
  forbidden_expansion_sources: string[];
  lock_enforcement: 'hard';
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

export function loadCanonicalArtStyleRecord(root: string): CanonicalArtStyleRecord {
  const record = readJson<CanonicalArtStyleRecord>(root, CANONICAL_ARTSTYLE_PATH);
  if (record.constant_key !== CANONICAL_GONEGI_ARTSTYLE_CONSTANT_KEY) {
    throw new Error(
      `${CANONICAL_ARTSTYLE_PATH}: constant_key must be ${CANONICAL_GONEGI_ARTSTYLE_CONSTANT_KEY}`
    );
  }
  if (
    typeof record.CANONICAL_GONEGI_ARTSTYLE !== 'string' ||
    record.CANONICAL_GONEGI_ARTSTYLE.trim().length === 0
  ) {
    throw new Error(`${CANONICAL_ARTSTYLE_PATH}: CANONICAL_GONEGI_ARTSTYLE is missing or empty`);
  }
  return record;
}

export function loadCanonicalGonegiArtStyle(projectRoot?: string): string {
  const root = resolveProjectRoot(projectRoot);
  return loadCanonicalArtStyleRecord(root).CANONICAL_GONEGI_ARTSTYLE;
}

export function resolveCanonicalGonegiArtStyle(root: string): { value: string; ref: string } {
  const record = loadCanonicalArtStyleRecord(root);
  return {
    value: record.CANONICAL_GONEGI_ARTSTYLE,
    ref: CANONICAL_ARTSTYLE_REF,
  };
}

export function detectArtStyleExpansion(artStyle: string): boolean {
  return ARTSTYLE_EXPANSION_MARKERS.some((marker) => artStyle.includes(marker));
}

export function isForbiddenGeneratedArtStyle(artStyle: string): boolean {
  return FORBIDDEN_GENERATED_ART_STYLES.includes(
    artStyle as (typeof FORBIDDEN_GENERATED_ART_STYLES)[number]
  );
}

export function collectArtStyleVariants(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
