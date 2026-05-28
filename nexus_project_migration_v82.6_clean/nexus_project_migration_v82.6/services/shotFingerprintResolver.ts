import fs from 'fs';
import path from 'path';
import { CompiledShotBinding, ShotFingerprintDefinition } from '../types';
import {
  SHOT_FINGERPRINT_ROOT,
  materializeCinematicSequenceCatalog,
} from './cinematic/cinematicSequence.fixtures';

let catalogReady = false;
const cache = new Map<string, ShotFingerprintDefinition>();

function ensureCatalog(): void {
  if (catalogReady) return;
  materializeCinematicSequenceCatalog();
  catalogReady = true;
}

function readShot(shotId: string): ShotFingerprintDefinition {
  const cached = cache.get(shotId);
  if (cached) return cached;

  ensureCatalog();
  const indexPath = path.join(process.cwd(), SHOT_FINGERPRINT_ROOT, 'shot_fingerprint.index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
    shots: Array<{ shot_id: string; path: string }>;
  };
  const entry = index.shots.find((item) => item.shot_id === shotId);
  if (!entry) {
    throw new Error(`PHASE-32D unknown shot_id: ${shotId}`);
  }

  const shot = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), entry.path), 'utf8')
  ) as ShotFingerprintDefinition;
  cache.set(shotId, shot);
  return shot;
}

export function resolveShotFingerprint(shotId: string): ShotFingerprintDefinition {
  return readShot(shotId);
}

export function toCompiledShotBinding(shot: ShotFingerprintDefinition): CompiledShotBinding {
  return {
    shot_id: shot.shot_id,
    framing: shot.framing,
    lens_behavior: shot.lens_behavior,
    camera_motion: shot.camera_motion,
    subject_distance: shot.subject_distance,
    cinematic_role: shot.cinematic_role,
  };
}

export function listShotIds(): string[] {
  ensureCatalog();
  const indexPath = path.join(process.cwd(), SHOT_FINGERPRINT_ROOT, 'shot_fingerprint.index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
    shots: Array<{ shot_id: string }>;
  };
  return index.shots.map((item) => item.shot_id).sort();
}
