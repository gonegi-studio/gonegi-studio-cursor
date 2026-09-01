import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';
import { buildNativeScenarioDocument, type NativeScenarioSlot } from '../services/pbrpNativeScenarioAdapter.js';

/**
 * PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-002: Native Scenario
 * Consumer Validation V1.
 *
 * Validates PHASE-001's adapter output for real AI Studio Import Scenario
 * compatibility -- round-trip integrity, slot/version preservation, and
 * serialization stability, all checked programmatically against a
 * faithful local reproduction of the real import handler. Item 6 (실제
 * AI Studio Import 후 UI 반영 확인) requires a real human action this
 * script cannot perform or fabricate -- it generates the real artifact
 * file for that human step and stops there, exactly as PHASE-009 did for
 * real generation. No network call, no AIStudio-App file touched.
 */

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const issues: string[] = [];
const results: Record<string, unknown> = {};

function check(label: string, condition: boolean, detail?: string): void {
  results[label] = condition ? 'PASS' : `FAIL${detail ? `: ${detail}` : ''}`;
  if (!condition) {
    issues.push(`${label}${detail ? ` -- ${detail}` : ''}`);
  }
}

const TITANIC_INPUT = 'A scene full of freedom, romance and wonder, set in bright clear daylight.';
const SPIRITED_INPUT = 'A scene full of wonder and disorientation, bathhouse arrival at night.';
const GOLDEN_HOUR_INPUT = 'A tenderness and longing farewell scene at golden hour, with grief and impermanence, gentle rain in the air.';
const UNIFIED_ART_STYLE_STAND_IN = '[SYNTHETIC -- stands in for the real app-owned UNIFIED_ART_STYLE constant, not copied from AIStudio-App]';

/** Same faithful, local, read-only reproduction of the real slots-mapping logic used in PHASE-001's own verify script -- re-derived here independently rather than imported, so this phase's validation doesn't silently depend on PHASE-001's test code being correct. */
function simulateRealImportHandler(data: unknown): { recognized: boolean; newSlots: unknown[] | null } {
  if (!data || typeof data !== 'object') return { recognized: false, newSlots: null };
  const d = data as Record<string, unknown>;
  if (!d.slots || !Array.isArray(d.slots)) return { recognized: false, newSlots: null };
  const newSlots = (d.slots as unknown[]).map((raw, idx) => {
    const s = raw as Record<string, unknown>;
    if (s.versions) return s;
    return {
      id: s.id || idx + 1,
      activeVersionIndex: 0,
      versions: [{
        id: `${s.id || idx + 1}_v0`,
        artStyle: s.artStyle || UNIFIED_ART_STYLE_STAND_IN,
        timeSetting: s.timeSetting || '',
        scenario: s.scenario || '',
        character: s.character || '',
        status: s.status || 'idle',
        seed: s.seed,
        finalPrompt: s.finalPrompt,
        version: 1,
      }],
    };
  });
  return { recognized: true, newSlots };
}

const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
const spiritedRun = runPbrpRuntimeExecutionPreparation(projectRoot, SPIRITED_INPUT, 'ai_studio', 'spirited_away');
const goldenHourRun = runPbrpRuntimeExecutionPreparation(projectRoot, GOLDEN_HOUR_INPUT, 'ai_studio', 'titanic');

// =========================================================================
// 1. 실제 Import Handler round-trip
// =========================================================================
{
  const build = buildNativeScenarioDocument([titanicRun, spiritedRun, goldenHourRun]);
  check('1_round_trip.build_pass', build.pass === true, JSON.stringify(build.validation_errors));
  const jsonText = JSON.stringify(build.document);
  const sim = simulateRealImportHandler(JSON.parse(jsonText));
  check('1_round_trip.recognized', sim.recognized === true);
  check('1_round_trip.slot_count_matches', Array.isArray(sim.newSlots) && sim.newSlots.length === 3, `${sim.newSlots?.length}`);
}

// =========================================================================
// 2. slots 순서/개수 보존 -- exactly the 1~3 slot range item 6's real
//    human test will exercise
// =========================================================================
{
  for (const n of [1, 2, 3]) {
    const inputs = [titanicRun, spiritedRun, goldenHourRun].slice(0, n);
    const build = buildNativeScenarioDocument(inputs);
    const sim = simulateRealImportHandler(JSON.parse(JSON.stringify(build.document)));
    check(`2_slot_count.n${n}.count_correct`, Array.isArray(sim.newSlots) && sim.newSlots.length === n, `${sim.newSlots?.length}`);
    const ids = (sim.newSlots as NativeScenarioSlot[] | null)?.map((s) => s.id).join(',');
    const expectedIds = Array.from({ length: n }, (_, i) => i + 1).join(',');
    check(`2_slot_count.n${n}.ids_sequential`, ids === expectedIds, `${ids} vs expected ${expectedIds}`);
  }
}

// =========================================================================
// 3. scenario / character / timeSetting 보존
// =========================================================================
{
  const build = buildNativeScenarioDocument([titanicRun, spiritedRun, goldenHourRun]);
  const jsonText = JSON.stringify(build.document);
  const sim = simulateRealImportHandler(JSON.parse(jsonText));
  const slots = sim.newSlots as NativeScenarioSlot[];
  const runs = [titanicRun, spiritedRun, goldenHourRun];
  slots.forEach((slot, i) => {
    const v = slot.versions[0];
    check(`3_field_preservation.slot${i}.scenario_matches`, v.scenario === runs[i].final_prompt?.positive_prompt);
    check(`3_field_preservation.slot${i}.character_references_real_anchor`, !!runs[i].selection?.character?.anchor_id && !!v.character?.includes(runs[i].selection!.character!.anchor_id));
    check(`3_field_preservation.slot${i}.timeSetting_carries_real_descriptor`, !!v.timeSetting?.includes(runs[i].scene_context!.lighting.descriptor));
  });
}

// =========================================================================
// 4. versions 구조 보존
// =========================================================================
{
  const build = buildNativeScenarioDocument([titanicRun]);
  const jsonText = JSON.stringify(build.document);
  const sim = simulateRealImportHandler(JSON.parse(jsonText));
  const slot = (sim.newSlots as NativeScenarioSlot[])[0];
  check('4_versions_structure.activeVersionIndex_zero', slot.activeVersionIndex === 0);
  check('4_versions_structure.exactly_one_version', Array.isArray(slot.versions) && slot.versions.length === 1);
  const v = slot.versions[0];
  const requiredKeys = ['id', 'scenario', 'character', 'timeSetting', 'status', 'finalPrompt', 'version'];
  check('4_versions_structure.all_required_keys_present', requiredKeys.every((k) => k in v), JSON.stringify(Object.keys(v)));
  check('4_versions_structure.version_number_is_1', v.version === 1);
  check('4_versions_structure.status_is_idle', v.status === 'idle');
  check('4_versions_structure.version_id_follows_convention', v.id === `${slot.id}_v0`, v.id);
}

// =========================================================================
// 5. JSON 재직렬화 안정성 -- stringify -> parse -> stringify again must be
//    byte-identical (no key-order drift, no precision loss, no data loss)
// =========================================================================
{
  const build = buildNativeScenarioDocument([titanicRun, spiritedRun, goldenHourRun]);
  const first = JSON.stringify(build.document);
  const reparsed = JSON.parse(first);
  const second = JSON.stringify(reparsed);
  check('5_reserialization.stable_across_one_cycle', first === second);
  const thirdCycle = JSON.stringify(JSON.parse(second));
  check('5_reserialization.stable_across_two_cycles', second === thirdCycle);
}

// =========================================================================
// 6. 실제 AI Studio Import 후 UI 반영 확인 -- Human-in-the-loop, deferred.
//    Generates the real artifact; does not and cannot fabricate the human
//    confirmation step.
// =========================================================================
const HUMAN_TEST_ARTIFACT_PATH = 'reports/project_brain_integration/pbrp-native-scenario-import-v1.json';
{
  const build = buildNativeScenarioDocument([titanicRun, spiritedRun, goldenHourRun]);
  check('6_human_in_the_loop.artifact_buildable', build.pass === true && build.document !== null);
  if (build.document) {
    fs.mkdirSync(path.join(projectRoot, 'reports/project_brain_integration'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, HUMAN_TEST_ARTIFACT_PATH), `${JSON.stringify(build.document, null, 2)}\n`, 'utf8');
    check('6_human_in_the_loop.artifact_written', fs.existsSync(path.join(projectRoot, HUMAN_TEST_ARTIFACT_PATH)));
  }
  // The actual UI-reflection confirmation is NOT claimed here -- see report.
  results['6_human_in_the_loop.ui_reflection_confirmed'] = 'PENDING (requires real human action in AIStudio-App, not performed by this script)';
}

// =========================================================================
// 7. Deterministic 반복성
// =========================================================================
{
  const runs = Array.from({ length: 5 }, () => {
    const t = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
    const s = runPbrpRuntimeExecutionPreparation(projectRoot, SPIRITED_INPUT, 'ai_studio', 'spirited_away');
    const g = runPbrpRuntimeExecutionPreparation(projectRoot, GOLDEN_HOUR_INPUT, 'ai_studio', 'titanic');
    return JSON.stringify(buildNativeScenarioDocument([t, s, g]).document);
  });
  check('7_determinism.5x_identical', runs.every((r) => r === runs[0]));
}

// =========================================================================
// Compliance
// =========================================================================
{
  const adapterContent = fs.readFileSync(path.join(projectRoot, 'services/pbrpNativeScenarioAdapter.ts'), 'utf8');
  const importLines = adapterContent.split('\n').filter((l) => /^\s*import\b/.test(l));
  check('compliance.no_ai_studio_app_import', !importLines.some((l) => l.includes('AIStudio-App') || l.includes('Gonegi-AIStudio')));
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY|generateContent\(/i;
  check('compliance.api_free', !apiPattern.test(adapterContent));
  const usesSpatialGraphAPI = /parseRuntimeSpatialGraph\s*\(/.test(adapterContent) || /\bmovieDataset\s*[:=]/.test(adapterContent);
  check('compliance.no_path_b', !usesSpatialGraphAPI);
  const build = buildNativeScenarioDocument([titanicRun]);
  const serialized = JSON.stringify(build.document);
  const forbiddenInventedFields = ['location_id', 'lighting_id', 'shot_type', 'composition_id', 'movie_dataset_condition', 'fixed_foundation_layer'];
  check('compliance.no_invented_fields', forbiddenInventedFields.every((f) => !serialized.includes(f)), serialized);
}

// --- Report ---------------------------------------------------------------
const REPORT_PATH = 'reports/project_brain_integration/pbrp-native-scenario-consumer-validation-v1-report.json';
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-002', generated_at: new Date().toISOString(), results, issues, human_test_artifact: HUMAN_TEST_ARTIFACT_PATH }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

// Deliberately NOT the phase's own PASS_TARGET string: this script only
// covers the 6 automated items (1-5, 7) plus compliance and the external
// 2-run regression check (item 8). Item 6's real UI-reflection confirmation
// requires genuine human action this script cannot perform or fabricate --
// printing the literal phase PASS_TARGET here would misrepresent an
// automated-only result as the full phase verdict. See the phase report for
// the actual, honest phase status.
console.log(issues.length === 0 ? 'PASS_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_002_AUTOMATED_ITEMS_V1' : 'FAIL_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_002_AUTOMATED_ITEMS_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`, `item_6_status=PENDING_HUMAN_ACTION`, `human_test_artifact=${HUMAN_TEST_ARTIFACT_PATH}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
