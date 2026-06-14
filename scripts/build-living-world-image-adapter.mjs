import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const corePath = path.join(ROOT, 'exports/shared/latest/living-world-core-v1-package.json');
const planPath = path.join(ROOT, 'datasets/living_world/living-world-adapter-boundary-plan.json');

if (!fs.existsSync(corePath) || !fs.existsSync(planPath)) {
  console.error('STOP missing dependencies');
  process.exit(1);
}

const core = JSON.parse(fs.readFileSync(corePath, 'utf8'));
const FORBIDDEN = [
  'character_dna',
  'style_core',
  'env_dna',
  'environment_dna',
  'master_prompt',
  'image_prompt',
  'negative_prompt',
];

function slimEmotion(p) {
  return {
    pattern_id: p.emotion_id,
    library: 'emotion',
    scene_function: p.scene_function,
    image_enrichment_role: 'emotional_context',
    core_features_bridge: {
      body_language: p.body_language,
      gaze_behavior: p.gaze_behavior,
      intensity_range: p.intensity_range,
    },
  };
}

function slimRelationship(p) {
  return {
    pattern_id: p.relationship_id,
    library: 'relationship',
    scene_function: p.scene_function,
    image_enrichment_role: 'social_atmosphere',
    core_features_bridge: {
      distance_behavior: p.distance_behavior,
      gaze_pattern: p.gaze_pattern,
      body_positioning: p.body_positioning,
    },
  };
}

function slimCrowd(p) {
  return {
    pattern_id: p.crowd_id,
    library: 'crowd',
    scene_function: p.scene_function,
    image_enrichment_role: 'social_density',
    core_features_bridge: {
      movement_pattern: p.movement_pattern,
      social_density: p.social_density,
      attention_direction: p.attention_direction,
    },
  };
}

function slimCommunity(p) {
  return {
    pattern_id: p.community_id,
    library: 'community',
    scene_function: p.scene_function,
    image_enrichment_role: 'community_gathering',
    core_features_bridge: {
      movement_flow: p.movement_flow,
      social_purpose: p.social_purpose,
      background_activity: p.background_activity,
    },
  };
}

function slimFestival(p) {
  return {
    pattern_id: p.festival_id,
    library: 'festival',
    scene_function: p.scene_function,
    image_enrichment_role: 'event_atmosphere',
    core_features_bridge: {
      event_type: p.event_type,
      background_activity: p.background_activity,
      economic_activity: p.economic_activity,
    },
  };
}

function slimProfession(p) {
  return {
    pattern_id: p.profession_id,
    library: 'profession',
    scene_function: p.scene_role,
    image_enrichment_role: 'background_life',
    core_features_bridge: {
      background_actor_use: p.background_actor_use,
      daily_actions: p.daily_actions,
      body_language: p.body_language,
    },
  };
}

function slimAnimal(p) {
  return {
    pattern_id: p.animal_id,
    library: 'animal',
    scene_function: p.scene_role,
    image_enrichment_role: 'background_life',
    core_features_bridge: {
      background_actor_use: p.background_actor_use,
      foreground_use: p.foreground_use,
      ambient_use: p.ambient_use,
    },
  };
}

function slimChild(p) {
  return {
    pattern_id: p.child_behavior_id,
    library: 'child',
    scene_function: p.scene_role,
    image_enrichment_role: 'background_life',
    core_features_bridge: {
      foreground_use: p.foreground_use,
      background_use: p.background_use,
      movement_pattern: p.movement_pattern,
    },
  };
}

function slimWeather(p) {
  return {
    pattern_id: p.weather_id,
    library: 'weather',
    scene_function: p.scene_function,
    image_enrichment_role: 'visual_atmosphere',
    core_features_bridge: {
      visual_effect: p.visual_effect,
      lighting_effect: p.lighting_effect,
      surface_effect: p.surface_effect,
    },
  };
}

function slimTime(p) {
  return {
    pattern_id: p.time_id,
    library: 'time',
    scene_function: p.scene_function,
    image_enrichment_role: 'temporal_atmosphere_still',
    core_features_bridge: {
      light_quality: p.light_quality,
      shadow_behavior: p.shadow_behavior,
      visibility_effect: p.visibility_effect,
    },
  };
}

const libs = core.libraries;
const adapter = {
  package_type: 'living_world_image_adapter',
  adapter_version: 'v1',
  source_core: 'exports/shared/latest/living-world-core-v1-package.json',
  target_app: 'image_app',
  world_identity: core.world_identity,
  world_type: core.world_type,
  compatibility: {
    cinematic_dna_lab: true,
    music_drama_studio: true,
    scene_generator: true,
  },
  cinematic_dna_lab_compatibility_shape: {
    metadata_supported: true,
    collections_supported: true,
    scene_indexing_bridge: true,
    core_features_bridge: true,
  },
  source_audit: core.source_audit,
  referenced_libraries: Object.keys(libs),
  transform: {
    scene_enrichment: {
      emotion: libs.emotion.patterns.map(slimEmotion),
      relationship: libs.relationship.patterns.map(slimRelationship),
      crowd: libs.crowd.patterns.map(slimCrowd),
      community: libs.community.patterns.map(slimCommunity),
      festival: libs.festival.patterns.map(slimFestival),
    },
    background_life: {
      profession: libs.profession.patterns.map(slimProfession),
      animal: libs.animal.patterns.map(slimAnimal),
      child: libs.child.patterns.map(slimChild),
      crowd: libs.crowd.patterns.map((p) => ({
        pattern_id: p.crowd_id,
        library: 'crowd',
        scene_function: p.scene_function,
        image_enrichment_role: 'ambient_crowd_layer',
        core_features_bridge: {
          movement_pattern: p.movement_pattern,
          social_density: p.social_density,
        },
      })),
    },
    atmosphere: {
      weather: libs.weather.patterns.map(slimWeather),
      time: libs.time.patterns.map(slimTime),
    },
  },
  image_usage_rules: [
    'enrich still image scenes only',
    'do not generate prompts directly',
    'do not override Character DNA',
    'do not override Style Core',
    'do not override ENV DNA',
    'do not control video continuity',
  ],
  next_step:
    'PHASE-TEST-1 Image App small test only 1~3 still images No batch generation',
};

const packagePath = path.join(
  ROOT,
  'exports/image_app/latest/living-world-image-adapter.json'
);
const reportPath = path.join(
  ROOT,
  'exports/image_app/reports/living-world-image-adapter-report.json'
);
fs.mkdirSync(path.dirname(packagePath), { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(packagePath, `${JSON.stringify(adapter)}\n`, 'utf8');
const stat = fs.statSync(packagePath);
JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const blob = JSON.stringify(adapter).toLowerCase();
const checks = {
  source_core_parse: true,
  all_10_libraries_referenced: adapter.referenced_libraries.length === 10,
  no_character_dna: !blob.includes('character_dna'),
  no_style_core: !blob.includes('style_core'),
  no_env_dna: !blob.includes('env_dna') && !blob.includes('environment_dna'),
  no_prompt_field: !FORBIDDEN.some((token) => blob.includes(token)),
  target_app_image_app: adapter.target_app === 'image_app',
  cinematic_dna_lab_compatibility_shape_exists:
    !!adapter.cinematic_dna_lab_compatibility_shape,
  next_step_exists: !!adapter.next_step,
  json_valid: true,
  file_size_gt_zero: stat.size > 0,
};

const pass = Object.values(checks).every(Boolean);
const report = {
  report_version: '108P',
  generated_at: new Date().toISOString(),
  package_path: 'exports/image_app/latest/living-world-image-adapter.json',
  referenced_library_count: adapter.referenced_libraries.length,
  file_size: stat.size,
  checks,
  cinematic_dna_lab_compatibility_shape:
    adapter.cinematic_dna_lab_compatibility_shape,
  next_step: adapter.next_step,
  verdict: pass
    ? 'PASS_IMAGE_APP_LIVING_WORLD_ADAPTER'
    : 'FAIL_IMAGE_APP_LIVING_WORLD_ADAPTER',
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(
  JSON.stringify({
    libs: report.referenced_library_count,
    size: stat.size,
    shape: adapter.cinematic_dna_lab_compatibility_shape,
    next: adapter.next_step,
    verdict: report.verdict,
  })
);
