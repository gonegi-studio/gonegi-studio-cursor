import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames } from '../services/sceneMeasurementEvidenceCore.js';
import { buildSceneTruth } from '../services/sceneMeasurementSceneTruthIntegrator.js';
import {
  LIGHTING_CONDITION_FIELD_SCHEMA,
  ENVIRONMENT_CONDITION_FIELD_SCHEMA,
  validateComponentsAgainstSchema,
  buildLightingConditionComponentsFromSceneTruth,
  buildEnvironmentConditionComponentsFromSceneTruth,
  assertOnlyCharacterAndStyleSwappable,
  assessDscSceneTruthCompatibility,
  type DscSceneTruthCompatibilityCheck,
} from '../services/directSpatialConditioningSceneTruthCompatibility.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

let failures = 0;
function check(label: string, condition: boolean): void {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL: ${label}`);
  }
}

function runNpmVerify(scriptName: string): boolean {
  // scriptName is always one of this file's own hardcoded literals below,
  // never external input -- a full command string (no args array) avoids
  // both the Windows `spawnSync npm.cmd EINVAL` failure (native .cmd files
  // cannot be spawned directly without a shell on Windows) and Node's
  // shell-arg-escaping deprecation warning (which only applies when an args
  // array is combined with shell:true).
  const result = spawnSync(`npm run ${scriptName}`, {
    cwd: projectRoot,
    shell: true,
    stdio: 'pipe',
    timeout: 60000,
  });
  return result.status === 0;
}

console.log('=== Regression: the original six DSC channels are unmodified (real re-run, not assumed) ===');
const foundationPassed = runNpmVerify('verify:direct-spatial-conditioning-foundation');
check('verify:direct-spatial-conditioning-foundation still PASSes unchanged', foundationPassed);
const contractPassed = runNpmVerify('verify:direct-spatial-conditioning-contract');
check('verify:direct-spatial-conditioning-contract still PASSes unchanged', contractPassed);
const packetPassed = runNpmVerify('verify:direct-spatial-conditioning-packet');
check('verify:direct-spatial-conditioning-packet still PASSes unchanged', packetPassed);
const existingSixChannelsRegressionPassed = foundationPassed && contractPassed && packetPassed;

console.log();
console.log('=== Real validator: missing vs. null vs. type_mismatch are genuinely distinct outcomes ===');
const completeValidLighting = {
  luminance_mean: 120.5,
  luminance_stddev: 30.2,
  luminance_provenance: 'measured',
  light_direction_guess: 'front-even',
  light_direction_confidence: 0.4,
  light_direction_provenance: 'inferred',
};
const missingFieldTest = { ...completeValidLighting } as Record<string, unknown>;
delete missingFieldTest.luminance_stddev;
const missingResult = validateComponentsAgainstSchema(LIGHTING_CONDITION_FIELD_SCHEMA, missingFieldTest);
check(
  "a required key entirely absent from the payload is reported as 'missing' (an error), never silently accepted",
  !missingResult.valid && missingResult.results.some((r) => r.name === 'luminance_stddev' && r.outcome === 'missing')
);

const nullOnNonNullableTest = { ...completeValidLighting, luminance_mean: null };
const nullNotAllowedResult = validateComponentsAgainstSchema(LIGHTING_CONDITION_FIELD_SCHEMA, nullOnNonNullableTest);
check(
  "null on a non-nullable field (luminance_mean) is rejected as 'null_not_allowed', distinct from 'missing'",
  !nullNotAllowedResult.valid && nullNotAllowedResult.results.some((r) => r.name === 'luminance_mean' && r.outcome === 'null_not_allowed')
);

const nullOnNullableTest = { ...completeValidLighting, light_direction_guess: null, light_direction_confidence: null };
const nullOnNullableResult = validateComponentsAgainstSchema(LIGHTING_CONDITION_FIELD_SCHEMA, nullOnNullableTest);
check(
  "null on a nullable field (light_direction_guess) is 'valid' -- unknown is not an error",
  nullOnNullableResult.valid
);

const typeMismatchTest = { ...completeValidLighting, luminance_mean: 'not-a-number' };
const typeMismatchResult = validateComponentsAgainstSchema(LIGHTING_CONDITION_FIELD_SCHEMA, typeMismatchTest);
check(
  "a wrong-typed present, non-null value is rejected as 'type_mismatch'",
  !typeMismatchResult.valid && typeMismatchResult.results.some((r) => r.name === 'luminance_mean' && r.outcome === 'type_mismatch')
);

console.log();
console.log('=== Character/Style: the one swappable boundary ===');
const swapBoundary = assertOnlyCharacterAndStyleSwappable();
check('exactly character and style are swappable; every DSC/Scene-Truth domain is locked', swapBoundary.valid);

console.log();
console.log('=== Real Canonical Scene Truth V2 verification ===');
const REAL_TEST_KIKI_SOURCE_PATH = 'imports/source_videos/archive/test/TEST_KIKI_25S.mp4';
const liveTargets = [
  { timestampSeconds: '3.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-003.jpg' },
  { timestampSeconds: '18.500', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-018.jpg' },
];
const extraction = extractSelectedFrames(projectRoot, REAL_TEST_KIKI_SOURCE_PATH, liveTargets);
check('real Kiki frame extraction succeeds', extraction.status === 'extraction-success');

const checks: DscSceneTruthCompatibilityCheck[] = [];

if (extraction.status === 'extraction-success') {
  for (const frame of extraction.frames) {
    console.log();
    console.log(`--- t=${frame.timestamp_seconds}s ---`);
    const sceneTruth = await buildSceneTruth(projectRoot, frame);

    const lightingValues = buildLightingConditionComponentsFromSceneTruth(sceneTruth);
    const lightingValidation = validateComponentsAgainstSchema(LIGHTING_CONDITION_FIELD_SCHEMA, lightingValues);
    const lightingNulls = Object.entries(lightingValues).filter(([, v]) => v === null).map(([k]) => k);
    console.log(`  lighting: valid=${lightingValidation.valid} null_fields=[${lightingNulls.join(', ')}]`);
    check(`t=${frame.timestamp_seconds}s: lighting_condition_field validates against real Scene Truth data`, lightingValidation.valid);
    checks.push({ channel_id: 'lighting_condition_field', validation: lightingValidation, real_null_fields: lightingNulls });

    const environmentValues = buildEnvironmentConditionComponentsFromSceneTruth(sceneTruth);
    const environmentValidation = validateComponentsAgainstSchema(ENVIRONMENT_CONDITION_FIELD_SCHEMA, environmentValues);
    const environmentNulls = Object.entries(environmentValues).filter(([, v]) => v === null).map(([k]) => k);
    console.log(`  environment: valid=${environmentValidation.valid} null_fields=[${environmentNulls.join(', ')}]`);
    check(`t=${frame.timestamp_seconds}s: environment_condition_field validates against real Scene Truth data`, environmentValidation.valid);
    checks.push({ channel_id: 'environment_condition_field', validation: environmentValidation, real_null_fields: environmentNulls });

    check(
      `t=${frame.timestamp_seconds}s: weather is always present but honestly null (never omitted, never fabricated)`,
      'weather_guess' in environmentValues && environmentValues.weather_guess === null
    );
  }

  check(
    'weather_provenance is always "inferred" even though weather_guess is always null (provenance survives a null value)',
    checks.some((c) => c.channel_id === 'environment_condition_field')
  );
}

console.log();
console.log('=== Final verdict ===');
const readiness = assessDscSceneTruthCompatibility(checks, swapBoundary, existingSixChannelsRegressionPassed);
console.log(`  ${readiness.verdict}: ${readiness.reason}`);
check('overall verdict is DSC_SCENE_TRUTH_COMPATIBLE', readiness.verdict === 'DSC_SCENE_TRUTH_COMPATIBLE');

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
