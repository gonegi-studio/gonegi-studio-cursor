import fs from 'fs';
import path from 'path';
import {
  EmotionMotionBridgeDefinition,
  ScenePackDefinition,
  ShotFingerprintDefinition,
  TransitionDnaDefinition,
} from '../../types';

export const SCENE_PACKS_ROOT = 'scene_packs';
export const TRANSITION_DNA_ROOT = 'transition_dna';
export const SHOT_FINGERPRINT_ROOT = 'shot_fingerprint';
export const EMOTION_MOTION_BRIDGE_ROOT = 'emotion_motion_bridge';

export const CANONICAL_SEQUENCE_SCENE_PACK_ID = 'walking_travel-harbor-terrace-001';
export const CANONICAL_SEQUENCE_TRANSITION_ID = 'walking_to_running';
export const CANONICAL_SEQUENCE_SHOT_ID = 'side_tracking';
export const CANONICAL_SEQUENCE_EMOTION_BRIDGE_ID = 'hope_forward_motion';

const SCENE_PACKS: ScenePackDefinition[] = [
  {
    scene_pack_id: 'emotional_dialogue-terrace-001',
    category: 'emotional_dialogue',
    emotional_tone: 'intimate restrained',
    action_core: 'two characters face each other with quiet dialogue cadence',
    camera_behavior: 'medium hold with soft push-in on emotional beats',
    continuity_role: 'dialogue_anchor',
    env_recommendation: ['late_afternoon', 'dusk'],
    transition_out_hint: ['silence_to_confession', 'hope_to_sadness'],
    fingerprint_seed: 'dialogue-terrace-v1',
    negative_guard: ['slideshow cut', 'random camera jump'],
  },
  {
    scene_pack_id: 'harbor_daily_life-market-001',
    category: 'harbor_daily_life',
    emotional_tone: 'warm observational',
    action_core: 'harbor market rhythm with background life motion',
    camera_behavior: 'wide to medium observational framing',
    continuity_role: 'establishment_breather',
    env_recommendation: ['morning', 'late_afternoon'],
    transition_out_hint: ['sunset_to_night', 'rain_to_clear'],
    fingerprint_seed: 'harbor-life-v1',
    negative_guard: ['empty plaza', 'frozen crowd'],
  },
  {
    scene_pack_id: CANONICAL_SEQUENCE_SCENE_PACK_ID,
    category: 'walking_travel',
    emotional_tone: 'hopeful companionship',
    action_core: 'companions walk together along harbor terrace with shared pace',
    camera_behavior: 'lateral tracking with stable horizon',
    continuity_role: 'travel_bridge',
    env_recommendation: ['late_afternoon', 'sunset'],
    transition_out_hint: ['walking_to_running', 'separation_to_reunion'],
    fingerprint_seed: 'walking-harbor-v1',
    negative_guard: ['slideshow cut', 'disconnected cuts', 'random camera jump'],
  },
  {
    scene_pack_id: 'labor_activity-dock-001',
    category: 'labor_activity',
    emotional_tone: 'grounded industrious',
    action_core: 'hands-on harbor labor with rhythmic body effort',
    camera_behavior: 'medium detail with grounded eye level',
    continuity_role: 'activity_anchor',
    env_recommendation: ['morning', 'late_afternoon'],
    transition_out_hint: ['walking_to_running', 'rain_to_clear'],
    fingerprint_seed: 'labor-dock-v1',
    negative_guard: ['static mannequin pose'],
  },
  {
    scene_pack_id: 'silent_emotion-window-001',
    category: 'silent_emotion',
    emotional_tone: 'melancholic interior',
    action_core: 'character holds still gaze with minimal dialogue',
    camera_behavior: 'static medium with micro drift',
    continuity_role: 'emotional_pause',
    env_recommendation: ['dusk', 'night'],
    transition_out_hint: ['silence_to_confession', 'sadness_to_hope'],
    fingerprint_seed: 'silent-window-v1',
    negative_guard: ['overacted expression', 'slideshow cut'],
  },
  {
    scene_pack_id: 'festival-plaza-001',
    category: 'festival',
    emotional_tone: 'joyful collective',
    action_core: 'festival crowd motion with character focal path',
    camera_behavior: 'wide establishing then medium follow',
    continuity_role: 'energy_lift',
    env_recommendation: ['late_afternoon', 'sunset'],
    transition_out_hint: ['hope_to_sadness', 'sunset_to_night'],
    fingerprint_seed: 'festival-plaza-v1',
    negative_guard: ['empty festival', 'chaotic jump cuts'],
  },
  {
    scene_pack_id: 'departure-pier-001',
    category: 'departure',
    emotional_tone: 'bittersweet separation',
    action_core: 'character turns toward leaving path at harbor edge',
    camera_behavior: 'rear follow with slow pullback',
    continuity_role: 'separation_setup',
    env_recommendation: ['dusk', 'sunset'],
    transition_out_hint: ['separation_to_reunion', 'hope_to_sadness'],
    fingerprint_seed: 'departure-pier-v1',
    negative_guard: ['random camera jump'],
  },
  {
    scene_pack_id: 'reunion-terrace-001',
    category: 'reunion',
    emotional_tone: 'relief and warmth',
    action_core: 'companions converge with recognition beat',
    camera_behavior: 'medium push-in on reunion beat',
    continuity_role: 'reunion_payoff',
    env_recommendation: ['late_afternoon', 'sunset'],
    transition_out_hint: ['separation_to_reunion', 'sadness_to_hope'],
    fingerprint_seed: 'reunion-terrace-v1',
    negative_guard: ['disconnected cuts'],
  },
  {
    scene_pack_id: 'rain_scene-street-001',
    category: 'rain_scene',
    emotional_tone: 'reflective damp calm',
    action_core: 'slow walk under rain sheen with umbrella rhythm',
    camera_behavior: 'side tracking with rain parallax',
    continuity_role: 'weather_shift',
    env_recommendation: ['rain', 'dusk'],
    transition_out_hint: ['rain_to_clear', 'sadness_to_hope'],
    fingerprint_seed: 'rain-street-v1',
    negative_guard: ['dry pavement mismatch'],
  },
  {
    scene_pack_id: 'dream_memory-haze-001',
    category: 'dream_memory',
    emotional_tone: 'soft nostalgic haze',
    action_core: 'memory-tinted motion with softened spatial logic',
    camera_behavior: 'floating medium with gentle drift',
    continuity_role: 'memory_insert',
    env_recommendation: ['dawn', 'dusk'],
    transition_out_hint: ['silence_to_confession', 'sunset_to_night'],
    fingerprint_seed: 'dream-haze-v1',
    negative_guard: ['harsh photoreal', 'slideshow cut'],
  },
];

const TRANSITIONS: TransitionDnaDefinition[] = [
  {
    transition_id: 'sunset_to_night',
    from_state: 'warm sunset harbor',
    to_state: 'cool night harbor',
    emotional_bridge: 'nostalgia deepens into quiet resolve',
    motion_bridge: 'pace slows with shorter steps',
    camera_shift: 'wider hold then gentle settle',
    lighting_shift: 'golden ochre to indigo violet rim',
    pacing_shift: 'decelerate one beat',
    continuity_keywords: ['lighting continuity', 'horizon lock', 'palette drift'],
  },
  {
    transition_id: 'rain_to_clear',
    from_state: 'rain sheen street',
    to_state: 'clear reflective stone',
    emotional_bridge: 'tension releases into cautious hope',
    motion_bridge: 'umbrella lowers, stride opens',
    camera_shift: 'same axis tracking maintained',
    lighting_shift: 'diffuse gray to warm bounce return',
    pacing_shift: 'hold then lighten',
    continuity_keywords: ['weather continuity', 'ground reflection match'],
  },
  {
    transition_id: 'hope_to_sadness',
    from_state: 'open forward cadence',
    to_state: 'inward restrained cadence',
    emotional_bridge: 'hope folds into tender sadness',
    motion_bridge: 'shoulders lower, stride shortens',
    camera_shift: 'medium hold tightens slightly',
    lighting_shift: 'warm key softens, shadow depth increases',
    pacing_shift: 'decelerate half beat',
    continuity_keywords: ['eyeline continuity', 'spacing continuity'],
  },
  {
    transition_id: 'sadness_to_hope',
    from_state: 'inward restrained cadence',
    to_state: 'open forward cadence',
    emotional_bridge: 'sadness lifts into gentle hope',
    motion_bridge: 'chin lifts, stride lengthens',
    camera_shift: 'subtle push-in then stable tracking',
    lighting_shift: 'shadow depth eases, warm rim returns',
    pacing_shift: 'accelerate half beat',
    continuity_keywords: ['eyeline continuity', 'friendship spacing'],
  },
  {
    transition_id: CANONICAL_SEQUENCE_TRANSITION_ID,
    from_state: 'synchronized walking',
    to_state: 'shared travel momentum',
    emotional_bridge: 'companionship sustains through motion continuity',
    motion_bridge: 'maintain matched pace without abrupt speed jump',
    camera_shift: 'lateral tracking axis locked',
    lighting_shift: 'stable golden hour continuity',
    pacing_shift: 'hold gentle cadence',
    continuity_keywords: ['axis continuity', 'pace match', 'horizon lock'],
  },
  {
    transition_id: 'separation_to_reunion',
    from_state: 'parting distance',
    to_state: 'closing distance',
    emotional_bridge: 'separation resolves into reunion warmth',
    motion_bridge: 'paths converge with recognition pause',
    camera_shift: 'rear follow to medium reunion frame',
    lighting_shift: 'consistent warm key on faces',
    pacing_shift: 'decelerate into hold on reunion',
    continuity_keywords: ['distance continuity', 'eyeline match'],
  },
  {
    transition_id: 'silence_to_confession',
    from_state: 'held silence',
    to_state: 'spoken emotional release',
    emotional_bridge: 'silence breaks into vulnerable confession',
    motion_bridge: 'minimal gesture expands into expressive hands',
    camera_shift: 'static medium to soft push-in',
    lighting_shift: 'stable intimate key',
    pacing_shift: 'pause then single forward beat',
    continuity_keywords: ['framing continuity', 'spatial intimacy'],
  },
];

const SHOTS: ShotFingerprintDefinition[] = [
  {
    shot_id: 'wide_establishing',
    framing: 'wide establishing',
    lens_behavior: 'deep focus harbor planes',
    camera_motion: 'slow panoramic settle',
    subject_distance: 'far to mid',
    cinematic_role: 'establish geography',
    continuity_bias: ['horizon lock', 'depth planes stable'],
  },
  {
    shot_id: 'medium_emotional',
    framing: 'medium two-shot',
    lens_behavior: 'gentle focus falloff',
    camera_motion: 'micro push-in on beat',
    subject_distance: 'mid',
    cinematic_role: 'emotional dialogue hold',
    continuity_bias: ['eyeline match', 'shoulder line stable'],
  },
  {
    shot_id: CANONICAL_SEQUENCE_SHOT_ID,
    framing: 'medium lateral two-shot',
    lens_behavior: 'parallel tracking plane',
    camera_motion: 'side tracking with stable horizon',
    subject_distance: 'mid',
    cinematic_role: 'travel companionship',
    continuity_bias: ['axis lock', 'pace match', 'no jump cut'],
  },
  {
    shot_id: 'rear_follow',
    framing: 'rear follow medium',
    lens_behavior: 'shallow depth on subject',
    camera_motion: 'rear tracking dolly cadence',
    subject_distance: 'mid-close',
    cinematic_role: 'departure or pursuit',
    continuity_bias: ['path continuity', 'back silhouette stable'],
  },
  {
    shot_id: 'overhead_isolation',
    framing: 'high overhead',
    lens_behavior: 'graphic composition read',
    camera_motion: 'slow vertical settle',
    subject_distance: 'far',
    cinematic_role: 'isolation emphasis',
    continuity_bias: ['geometry continuity'],
  },
  {
    shot_id: 'window_reflection',
    framing: 'interior window medium',
    lens_behavior: 'reflection layer readable',
    camera_motion: 'static with breath drift',
    subject_distance: 'mid-close',
    cinematic_role: 'inner emotion mirror',
    continuity_bias: ['reflection continuity'],
  },
  {
    shot_id: 'close_hand_detail',
    framing: 'close hand detail',
    lens_behavior: 'macro emotional gesture',
    camera_motion: 'minimal hold',
    subject_distance: 'close',
    cinematic_role: 'gesture beat',
    continuity_bias: ['hand anatomy stable'],
  },
  {
    shot_id: 'silhouette_distance',
    framing: 'silhouette long shot',
    lens_behavior: 'rim light separation',
    camera_motion: 'slow pullback',
    subject_distance: 'far',
    cinematic_role: 'emotional distance',
    continuity_bias: ['rim continuity', 'horizon lock'],
  },
];

const EMOTION_BRIDGES: EmotionMotionBridgeDefinition[] = [
  {
    bridge_id: 'sadness_slow_walk',
    emotion: 'sadness',
    body_motion: 'slow walk with lowered gaze',
    pacing_behavior: 'decelerated step cadence',
    eye_behavior: 'downward vitreous gaze',
    spatial_behavior: 'increased interpersonal distance',
    cinematic_effect: 'melancholic continuity',
  },
  {
    bridge_id: CANONICAL_SEQUENCE_EMOTION_BRIDGE_ID,
    emotion: 'hope',
    body_motion: 'forward walk with open posture',
    pacing_behavior: 'steady synchronized cadence',
    eye_behavior: 'warm forward gaze with companion awareness',
    spatial_behavior: 'close friendship spacing',
    cinematic_effect: 'uplifting travel continuity',
  },
  {
    bridge_id: 'fear_frozen_pose',
    emotion: 'fear',
    body_motion: 'frozen pose with micro tremor',
    pacing_behavior: 'halted cadence',
    eye_behavior: 'wide cautious gaze',
    spatial_behavior: 'defensive spacing',
    cinematic_effect: 'suspense hold',
  },
  {
    bridge_id: 'warmth_close_distance',
    emotion: 'warmth',
    body_motion: 'lean-in proximity with soft gesture',
    pacing_behavior: 'paused intimate cadence',
    eye_behavior: 'soft mutual gaze',
    spatial_behavior: 'close companion spacing',
    cinematic_effect: 'tender connection continuity',
  },
  {
    bridge_id: 'loneliness_backward_motion',
    emotion: 'loneliness',
    body_motion: 'slow backward drift in frame',
    pacing_behavior: 'retreating cadence',
    eye_behavior: 'averted gaze',
    spatial_behavior: 'widening empty space',
    cinematic_effect: 'isolating continuity',
  },
];

function writeJson(filePath: string, payload: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

export function materializeCinematicSequenceCatalog(): void {
  const root = process.cwd();

  const sceneIndex = {
    schema_version: 'SCENE-PACK-INDEX-v1',
    packs: SCENE_PACKS.map((pack) => ({
      scene_pack_id: pack.scene_pack_id,
      category: pack.category,
      path: `${SCENE_PACKS_ROOT}/${pack.category}/${pack.scene_pack_id}.json`,
    })),
  };
  writeJson(path.join(root, SCENE_PACKS_ROOT, 'scene_packs.index.json'), sceneIndex);
  for (const pack of SCENE_PACKS) {
    writeJson(
      path.join(root, SCENE_PACKS_ROOT, pack.category, `${pack.scene_pack_id}.json`),
      pack
    );
  }

  const transitionIndex = {
    schema_version: 'TRANSITION-DNA-INDEX-v1',
    transitions: TRANSITIONS.map((t) => ({
      transition_id: t.transition_id,
      path: `${TRANSITION_DNA_ROOT}/${t.transition_id}.json`,
    })),
  };
  writeJson(path.join(root, TRANSITION_DNA_ROOT, 'transition_dna.index.json'), transitionIndex);
  for (const transition of TRANSITIONS) {
    writeJson(
      path.join(root, TRANSITION_DNA_ROOT, `${transition.transition_id}.json`),
      transition
    );
  }

  const shotIndex = {
    schema_version: 'SHOT-FINGERPRINT-INDEX-v1',
    shots: SHOTS.map((s) => ({
      shot_id: s.shot_id,
      path: `${SHOT_FINGERPRINT_ROOT}/${s.shot_id}.json`,
    })),
  };
  writeJson(path.join(root, SHOT_FINGERPRINT_ROOT, 'shot_fingerprint.index.json'), shotIndex);
  for (const shot of SHOTS) {
    writeJson(path.join(root, SHOT_FINGERPRINT_ROOT, `${shot.shot_id}.json`), shot);
  }

  const bridgeIndex = {
    schema_version: 'EMOTION-MOTION-BRIDGE-INDEX-v1',
    bridges: EMOTION_BRIDGES.map((b) => ({
      bridge_id: b.bridge_id,
      path: `${EMOTION_MOTION_BRIDGE_ROOT}/${b.bridge_id}.json`,
    })),
  };
  writeJson(
    path.join(root, EMOTION_MOTION_BRIDGE_ROOT, 'emotion_motion_bridge.index.json'),
    bridgeIndex
  );
  for (const bridge of EMOTION_BRIDGES) {
    writeJson(
      path.join(root, EMOTION_MOTION_BRIDGE_ROOT, `${bridge.bridge_id}.json`),
      bridge
    );
  }
}
