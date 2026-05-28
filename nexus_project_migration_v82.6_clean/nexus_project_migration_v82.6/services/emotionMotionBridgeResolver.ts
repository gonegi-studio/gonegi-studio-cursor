import fs from 'fs';
import path from 'path';
import { CompiledMotionBinding, EmotionMotionBridgeDefinition } from '../types';
import {
  EMOTION_MOTION_BRIDGE_ROOT,
  materializeCinematicSequenceCatalog,
} from './cinematic/cinematicSequence.fixtures';

let catalogReady = false;
const cache = new Map<string, EmotionMotionBridgeDefinition>();

function ensureCatalog(): void {
  if (catalogReady) return;
  materializeCinematicSequenceCatalog();
  catalogReady = true;
}

function readBridge(bridgeId: string): EmotionMotionBridgeDefinition {
  const cached = cache.get(bridgeId);
  if (cached) return cached;

  ensureCatalog();
  const indexPath = path.join(
    process.cwd(),
    EMOTION_MOTION_BRIDGE_ROOT,
    'emotion_motion_bridge.index.json'
  );
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
    bridges: Array<{ bridge_id: string; path: string }>;
  };
  const entry = index.bridges.find((item) => item.bridge_id === bridgeId);
  if (!entry) {
    throw new Error(`PHASE-32D unknown emotion_motion_bridge_id: ${bridgeId}`);
  }

  const bridge = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), entry.path), 'utf8')
  ) as EmotionMotionBridgeDefinition;
  cache.set(bridgeId, bridge);
  return bridge;
}

export function resolveEmotionMotionBridge(bridgeId: string): EmotionMotionBridgeDefinition {
  return readBridge(bridgeId);
}

export function toCompiledMotionBinding(
  bridge: EmotionMotionBridgeDefinition
): CompiledMotionBinding {
  return {
    bridge_id: bridge.bridge_id,
    emotion: bridge.emotion,
    body_motion: bridge.body_motion,
    pacing_behavior: bridge.pacing_behavior,
    eye_behavior: bridge.eye_behavior,
    spatial_behavior: bridge.spatial_behavior,
    cinematic_effect: bridge.cinematic_effect,
  };
}

export function listEmotionMotionBridgeIds(): string[] {
  ensureCatalog();
  const indexPath = path.join(
    process.cwd(),
    EMOTION_MOTION_BRIDGE_ROOT,
    'emotion_motion_bridge.index.json'
  );
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
    bridges: Array<{ bridge_id: string }>;
  };
  return index.bridges.map((item) => item.bridge_id).sort();
}
