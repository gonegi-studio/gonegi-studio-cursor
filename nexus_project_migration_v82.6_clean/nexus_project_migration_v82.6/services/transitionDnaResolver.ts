import fs from 'fs';
import path from 'path';
import { CompiledTransitionBinding, TransitionDnaDefinition } from '../types';
import {
  TRANSITION_DNA_ROOT,
  materializeCinematicSequenceCatalog,
} from './cinematic/cinematicSequence.fixtures';

let catalogReady = false;
const cache = new Map<string, TransitionDnaDefinition>();

function ensureCatalog(): void {
  if (catalogReady) return;
  materializeCinematicSequenceCatalog();
  catalogReady = true;
}

function readTransition(transitionId: string): TransitionDnaDefinition {
  const cached = cache.get(transitionId);
  if (cached) return cached;

  ensureCatalog();
  const indexPath = path.join(process.cwd(), TRANSITION_DNA_ROOT, 'transition_dna.index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
    transitions: Array<{ transition_id: string; path: string }>;
  };
  const entry = index.transitions.find((item) => item.transition_id === transitionId);
  if (!entry) {
    throw new Error(`PHASE-32C unknown transition_id: ${transitionId}`);
  }

  const transition = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), entry.path), 'utf8')
  ) as TransitionDnaDefinition;
  cache.set(transitionId, transition);
  return transition;
}

export function resolveTransitionDna(transitionId: string): TransitionDnaDefinition {
  return readTransition(transitionId);
}

export function buildContinuityGlue(transition: TransitionDnaDefinition): string {
  const keywords = [...transition.continuity_keywords].sort().join(', ');
  return [
    transition.emotional_bridge,
    transition.motion_bridge,
    transition.camera_shift,
    transition.lighting_shift,
    transition.pacing_shift,
    keywords,
  ]
    .filter(Boolean)
    .join(', ');
}

export function toCompiledTransitionBinding(
  transition: TransitionDnaDefinition
): CompiledTransitionBinding {
  return {
    transition_id: transition.transition_id,
    from_state: transition.from_state,
    to_state: transition.to_state,
    emotional_bridge: transition.emotional_bridge,
    motion_bridge: transition.motion_bridge,
    camera_shift: transition.camera_shift,
    lighting_shift: transition.lighting_shift,
    pacing_shift: transition.pacing_shift,
    continuity_glue: buildContinuityGlue(transition),
  };
}

export function listTransitionIds(): string[] {
  ensureCatalog();
  const indexPath = path.join(process.cwd(), TRANSITION_DNA_ROOT, 'transition_dna.index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
    transitions: Array<{ transition_id: string }>;
  };
  return index.transitions.map((item) => item.transition_id).sort();
}
