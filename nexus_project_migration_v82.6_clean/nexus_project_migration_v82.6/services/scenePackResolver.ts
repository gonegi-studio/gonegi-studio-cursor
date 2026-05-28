import fs from 'fs';
import path from 'path';
import { CompiledScenePackBinding, ScenePackDefinition } from '../types';
import {
  SCENE_PACKS_ROOT,
  materializeCinematicSequenceCatalog,
} from './cinematic/cinematicSequence.fixtures';

let catalogReady = false;
const packCache = new Map<string, ScenePackDefinition>();

function ensureCatalog(): void {
  if (catalogReady) return;
  materializeCinematicSequenceCatalog();
  catalogReady = true;
}

function readPack(scenePackId: string): ScenePackDefinition {
  const cached = packCache.get(scenePackId);
  if (cached) return cached;

  ensureCatalog();
  const indexPath = path.join(process.cwd(), SCENE_PACKS_ROOT, 'scene_packs.index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
    packs: Array<{ scene_pack_id: string; path: string }>;
  };
  const entry = index.packs.find((pack) => pack.scene_pack_id === scenePackId);
  if (!entry) {
    throw new Error(`PHASE-32B unknown scene_pack_id: ${scenePackId}`);
  }

  const pack = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), entry.path), 'utf8')
  ) as ScenePackDefinition;
  packCache.set(scenePackId, pack);
  return pack;
}

export function resolveScenePack(scenePackId: string): ScenePackDefinition {
  return readPack(scenePackId);
}

export function toCompiledScenePackBinding(pack: ScenePackDefinition): CompiledScenePackBinding {
  return {
    scene_pack_id: pack.scene_pack_id,
    category: pack.category,
    emotional_tone: pack.emotional_tone,
    action_core: pack.action_core,
    continuity_role: pack.continuity_role,
    fingerprint_seed: pack.fingerprint_seed,
  };
}

export function listScenePackIds(): string[] {
  ensureCatalog();
  const indexPath = path.join(process.cwd(), SCENE_PACKS_ROOT, 'scene_packs.index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
    packs: Array<{ scene_pack_id: string }>;
  };
  return index.packs.map((pack) => pack.scene_pack_id).sort();
}
