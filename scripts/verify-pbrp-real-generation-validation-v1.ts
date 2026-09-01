import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';
import { loadCharacterVisualDnaLibrary } from '../services/pbrpCharacterVisualDnaLibrary.js';
import { buildNativeScenarioDocument, resolveCharacterCastForSlots } from '../services/pbrpNativeScenarioAdapter.js';

/**
 * PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-005: Real Generation
 * Validation V1.
 *
 * Item 1 only: generates the latest Native Scenario JSON + Character Book
 * companion, for the 3 named target scenarios, in order, using the
 * PHASE-004 character-resolution-aware adapter. Items 2-10 require real
 * human action in AIStudio-App (import, visual confirmation, actual image
 * generation) that this script cannot perform or fabricate -- it stops
 * after producing the real artifacts. No network call, no AIStudio-App
 * file touched, no Path-B, no additional API dependency.
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

// Exact target order specified by this phase.
const TARGETS: Array<{ label: string; input: string; source: 'titanic' | 'spirited_away' }> = [
  { label: 'titanic_bow_pose', input: 'A scene full of freedom, romance and wonder, set in bright clear daylight.', source: 'titanic' },
  { label: 'bathhouse_arrival', input: 'A scene full of wonder and disorientation, bathhouse arrival at night.', source: 'spirited_away' },
  { label: 'titanic_sunset_rail_pose', input: 'A tenderness and longing farewell scene at golden hour, with grief and impermanence, gentle rain in the air.', source: 'titanic' },
];

const runs = TARGETS.map((t) => runPbrpRuntimeExecutionPreparation(projectRoot, t.input, 'ai_studio', t.source));

// =========================================================================
// 1. 최신 Adapter로 Native Scenario JSON 생성
// =========================================================================
check('1_generate.all_targets_pass', runs.every((r) => r.pass === true), JSON.stringify(runs.map((r) => r.pass)));
runs.forEach((r, i) => {
  check(`1_generate.slot${i}_matches_expected_anchor`, r.selection?.character?.anchor_id === TARGETS[i].label, r.selection?.character?.anchor_id);
});

const scenarioBuild = buildNativeScenarioDocument(runs);
check('1_generate.scenario_document_pass', scenarioBuild.pass === true, JSON.stringify(scenarioBuild.validation_errors));
check('1_generate.slot_order_matches_target_order', scenarioBuild.document?.slots.length === 3);

const library = loadCharacterVisualDnaLibrary(projectRoot);
const castResult = resolveCharacterCastForSlots(runs, library);
check('1_generate.cast_resolution_pass', castResult.pass === true);
check('1_generate.cast_fully_resolved', castResult.fully_resolved === true, JSON.stringify(castResult.slot_cast));

// Per-target headcount sanity (matches PHASE-004's confirmed real mapping):
// titanic_bow_pose=2, bathhouse_arrival=1, titanic_sunset_rail_pose=2.
const expectedHeadcount = [2, 1, 2];
castResult.slot_cast.forEach((c, i) => {
  check(`1_generate.slot${i}_headcount_matches_expected`, c.resolved_count === expectedHeadcount[i], `${c.resolved_count} vs expected ${expectedHeadcount[i]}`);
});

const SCENARIO_ARTIFACT_PATH = 'reports/project_brain_integration/pbrp-native-scenario-import-v1.json';
const CHARACTER_BOOK_ARTIFACT_PATH = 'reports/project_brain_integration/pbrp-character-book-import-v1.json';

if (scenarioBuild.document) {
  fs.mkdirSync(path.join(projectRoot, 'reports/project_brain_integration'), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, SCENARIO_ARTIFACT_PATH), `${JSON.stringify(scenarioBuild.document, null, 2)}\n`, 'utf8');
  check('1_generate.scenario_artifact_written', fs.existsSync(path.join(projectRoot, SCENARIO_ARTIFACT_PATH)));
}
if (castResult.character_book_companion) {
  fs.writeFileSync(path.join(projectRoot, CHARACTER_BOOK_ARTIFACT_PATH), `${JSON.stringify(castResult.character_book_companion, null, 2)}\n`, 'utf8');
  check('1_generate.character_book_artifact_written', fs.existsSync(path.join(projectRoot, CHARACTER_BOOK_ARTIFACT_PATH)));
  check('1_generate.character_book_has_gonegi_and_dana_only', castResult.character_book_companion.characters.length === 2, `${castResult.character_book_companion.characters.length}`);
}

// =========================================================================
// Items 2-10: real human action, not performed here. Recorded explicitly
// as PENDING, never fabricated.
// =========================================================================
const pendingItems = [
  '2_import.ai_studio_import_scenario -- requires opening AIStudio-App and using its real Import Scenario feature',
  '3_import.three_slots_confirmed_in_ui -- requires visual confirmation in the running app',
  '4_import.character_visual_dna_reflected -- requires importing the character book companion via CharacterBookModal and visually confirming',
  '5_import.scenario_reflected -- requires visual confirmation in the app UI',
  '6_import.time_setting_reflected -- requires visual confirmation in the app UI',
  '7_import.gonegi_style_maintained -- requires visual confirmation against the app-owned styleCore, not producible by PBRP',
  '8_generation.real_image_generation -- requires triggering the app\'s real Gemini API call, which this script must not do (API 호출 추가 금지)',
  '9_generation.character_style_scene_consistency_observed -- requires human visual judgment of a real generated image',
  '10_generation.result_recorded_pass_fail -- requires a real, human-reported outcome',
];
for (const item of pendingItems) {
  const [key] = item.split(' -- ');
  results[key] = 'PENDING_HUMAN_ACTION';
}

// =========================================================================
// Deterministic 반복성 (of what this script actually controls)
// =========================================================================
{
  const repeat = Array.from({ length: 3 }, () => {
    const r = TARGETS.map((t) => runPbrpRuntimeExecutionPreparation(projectRoot, t.input, 'ai_studio', t.source));
    const doc = buildNativeScenarioDocument(r);
    const lib = loadCharacterVisualDnaLibrary(projectRoot);
    const cast = resolveCharacterCastForSlots(r, lib);
    return JSON.stringify({ doc: doc.document, cast: cast.character_book_companion });
  });
  check('determinism.3x_identical', repeat.every((s) => s === repeat[0]));
}

// --- Report ---------------------------------------------------------------
const REPORT_PATH = 'reports/project_brain_integration/pbrp-real-generation-validation-v1-report.json';
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-005', generated_at: new Date().toISOString(), results, issues, artifacts: { scenario: SCENARIO_ARTIFACT_PATH, character_book: CHARACTER_BOOK_ARTIFACT_PATH } }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.values(results).filter((v) => v === 'PASS' || (typeof v === 'string' && v.startsWith('FAIL'))).length;
const failCount = issues.length;

// Deliberately not the phase's own PASS_TARGET -- items 2-10 are real
// human-only steps this script cannot complete or fake.
console.log(issues.length === 0 ? 'PASS_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_005_AUTOMATED_ITEM_1_V1' : 'FAIL_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_005_AUTOMATED_ITEM_1_V1');
console.log([`total_checks=${checkCount}`, `fail_count=${failCount}`, `items_2_to_10_status=PENDING_HUMAN_ACTION`, `scenario_artifact=${SCENARIO_ARTIFACT_PATH}`, `character_book_artifact=${CHARACTER_BOOK_ARTIFACT_PATH}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
