import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { loadPbrpKnowledgeRepository } from '../services/pbrpKnowledgeRepository.js';
import { analyzeIntent } from '../services/pbrpIntentAnalyzer.js';
import { selectKnowledge } from '../services/pbrpKnowledgeSelector.js';
import { buildProductionScenario, type ProductionScenario } from '../services/pbrpProductionScenarioAssembler.js';
import {
  buildNativeScenarioFromProductionScenarios,
  buildCharacterBookCompanionFromProductionScenarios,
} from '../services/pbrpNativeScenarioFromProductionAdapter.js';
import type { NativeScenarioSlot } from '../services/pbrpNativeScenarioAdapter.js';

/**
 * PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-005: Native Scenario
 * Materialization V1.
 *
 * PHASE-005's own verify script proved `buildNativeScenarioFromProductionScenarios`/
 * `buildCharacterBookCompanionFromProductionScenarios` produce a real,
 * import-handler-recognized document (38/38), but never wrote that document
 * anywhere a human could actually use it -- its own regression check
 * (`regression.new_adapter_read_only`) deliberately keeps the adapter
 * service itself a pure, file-free library. This script is the missing
 * materialization step, reusing the exact writer pattern PHASE-PBRP-AI-
 * STUDIO-NATIVE-SCENARIO-ADAPTER-002 already established for the identical
 * `{slots: [...]}` / `characterBook` schema (build in a script, write the
 * real artifact, stop -- the real "AI Studio Import" click is a human step
 * this script cannot perform or fabricate). No new writer abstraction: this
 * is the same two-line `fs.writeFileSync` idiom PHASE-ADAPTER-002 used, not
 * a shared service. The PHASE-005 adapter module itself is only imported,
 * never modified. Not wired into the release/Final Bundle chain -- that
 * chain has no asset for this schema and this script adds none.
 */

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const issues: string[] = [];
const results: Record<string, unknown> = {};

function check(label: string, condition: boolean, detail?: string): void {
  results[label] = condition ? 'PASS' : `FAIL${detail ? `: ${detail}` : ''}`;
  if (!condition) issues.push(`${label}${detail ? ` -- ${detail}` : ''}`);
}

const TITANIC_SCENE_ID = 'scene_titanic_02_dining_salon_008';
const SPIRITED_SCENE_ID = 'scene_spirited_away_bathhouse_arrival_0001';

/** Same faithful, local, read-only reproduction of the REAL slots-mapping logic (`handleImportScenarioJSON`) used by every prior phase's own verify script -- independently re-derived here, not imported, per this pipeline's own stated auditability convention. */
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
      versions: [{ id: `${s.id || idx + 1}_v0`, artStyle: s.artStyle, timeSetting: s.timeSetting, scenario: s.scenario, character: s.character, status: 'idle', finalPrompt: s.finalPrompt, version: 1 }],
    };
  });
  return { recognized: true, newSlots };
}

// Same real, already-004/005-validated scenes PHASE-005's own verify script
// uses -- not new fixtures, not the orphaned/unverified -006-* artifact.
const titanicSelection = selectKnowledge(loadPbrpKnowledgeRepository(projectRoot, 'titanic'), analyzeIntent('freedom romance wonder'));
const spiritedSelection = selectKnowledge(loadPbrpKnowledgeRepository(projectRoot, 'spirited_away'), analyzeIntent('wonder disorientation'));
const titanicScenario: ProductionScenario = buildProductionScenario(projectRoot, 'titanic', TITANIC_SCENE_ID, titanicSelection);
const spiritedScenario: ProductionScenario = buildProductionScenario(projectRoot, 'spirited_away', SPIRITED_SCENE_ID, spiritedSelection);

// =========================================================================
// 1. Real, passing PHASE-004 inputs (precondition for materialization)
// =========================================================================
check('1_inputs.titanic_scenario_passes', titanicScenario.pass === true);
check('1_inputs.spirited_scenario_passes', spiritedScenario.pass === true);

// =========================================================================
// 2. Build via PHASE-005's unmodified pure builders
// =========================================================================
const build = buildNativeScenarioFromProductionScenarios([titanicScenario, spiritedScenario]);
const companion = buildCharacterBookCompanionFromProductionScenarios([titanicScenario, spiritedScenario]);
check('2_build.native_scenario_pass', build.pass === true, JSON.stringify(build.validation_errors));
check('2_build.slot_count_matches_input', build.document?.slots.length === 2, `${build.document?.slots.length}`);
check('2_build.character_book_nonempty', companion.characters.length > 0, `${companion.characters.length}`);

// =========================================================================
// 3. Consumer schema validation -- same faithful import-handler simulation
//    every prior phase in this subsystem validates against
// =========================================================================
{
  const sim = simulateRealImportHandler(build.document);
  check('3_consumer_schema.recognized_by_real_import_logic', sim.recognized === true);
  check('3_consumer_schema.slot_count_preserved', Array.isArray(sim.newSlots) && sim.newSlots.length === 2, `${sim.newSlots?.length}`);
  const roundTripped = JSON.parse(JSON.stringify(build.document));
  const sim2 = simulateRealImportHandler(roundTripped);
  check('3_consumer_schema.round_trip_through_json_still_recognized', sim2.recognized === true);
  const firstSlot = sim2.newSlots?.[0] as NativeScenarioSlot | undefined;
  check('3_consumer_schema.pass_through_unmodified_since_versions_already_present', JSON.stringify(firstSlot) === JSON.stringify(build.document?.slots[0]));
  check('3_consumer_schema.character_book_shape_matches_real_schema', companion.characters.every((c) => typeof c.id === 'string' && typeof c.visual_dna === 'string'));
}

// =========================================================================
// 4. Materialize -- reusing PHASE-ADAPTER-002's exact writer idiom, not a
//    new abstraction. Two standalone artifacts a human can directly import
//    into the real AI Studio app (Scenario JSON, Character Book JSON).
// =========================================================================
const REPORT_DIR = 'reports/project_brain_integration';
const NATIVE_SCENARIO_ARTIFACT_PATH = `${REPORT_DIR}/pbrp-scenario-composition-intelligence-005-native-scenario-import.json`;
const CHARACTER_BOOK_ARTIFACT_PATH = `${REPORT_DIR}/pbrp-scenario-composition-intelligence-005-character-book-import.json`;

fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });

if (build.pass && build.document) {
  fs.writeFileSync(path.join(projectRoot, NATIVE_SCENARIO_ARTIFACT_PATH), `${JSON.stringify(build.document, null, 2)}\n`, 'utf8');
  check('4_materialize.native_scenario_artifact_written', fs.existsSync(path.join(projectRoot, NATIVE_SCENARIO_ARTIFACT_PATH)));
} else {
  check('4_materialize.native_scenario_artifact_written', false, 'build did not pass; artifact not written');
}

fs.writeFileSync(path.join(projectRoot, CHARACTER_BOOK_ARTIFACT_PATH), `${JSON.stringify(companion, null, 2)}\n`, 'utf8');
check('4_materialize.character_book_artifact_written', fs.existsSync(path.join(projectRoot, CHARACTER_BOOK_ARTIFACT_PATH)));

// =========================================================================
// 5. Regression -- unmodified adapter, no Final Bundle wiring added
// =========================================================================
{
  const adapterSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpNativeScenarioFromProductionAdapter.ts'), 'utf8');
  check('5_regression.adapter_still_read_only', !adapterSrc.includes('writeFileSync'));
  const finalBundleSrc = fs.readFileSync(path.join(projectRoot, 'services/releaseHandoffFinalBundle.ts'), 'utf8');
  check('5_regression.final_bundle_untouched', !finalBundleSrc.includes('pbrpNativeScenarioFromProductionAdapter') && !finalBundleSrc.includes('NativeScenario'));
}

// --- Report ---------------------------------------------------------------
const REPORT_PATH = `${REPORT_DIR}/pbrp-scenario-composition-intelligence-005-materialization-report.json`;
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify(
    {
      phase: 'PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-005-MATERIALIZATION',
      generated_at: new Date().toISOString(),
      results,
      issues,
      native_scenario_artifact: NATIVE_SCENARIO_ARTIFACT_PATH,
      character_book_artifact: CHARACTER_BOOK_ARTIFACT_PATH,
      human_action_required: 'Import native_scenario_artifact via the real AI Studio app\'s Import Scenario JSON action; import character_book_artifact via its Character Book JSON import action. This script cannot perform or verify that UI step.',
    },
    null,
    2
  )}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_005_MATERIALIZATION_V1' : 'FAIL_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_005_MATERIALIZATION_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`, `native_scenario_artifact=${NATIVE_SCENARIO_ARTIFACT_PATH}`, `character_book_artifact=${CHARACTER_BOOK_ARTIFACT_PATH}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) console.error(`[error] ${issue}`);
  process.exit(1);
}

process.exit(0);
