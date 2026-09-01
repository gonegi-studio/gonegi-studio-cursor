import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';
import {
  buildNativeScenarioDocument,
  type NativeScenarioDocument,
  type NativeScenarioSlot,
} from '../services/pbrpNativeScenarioAdapter.js';

/**
 * PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-001: PBRP -> AI Studio
 * Native Scenario JSON Adapter V1 -- validation.
 *
 * Validates the adapter's output against a faithful, read-only local
 * reproduction of the REAL import-parsing logic in
 * `AIStudio-App/components/MusicDramaStudio.tsx:1289-1315`
 * (`handleImportScenarioJSON`'s `data.slots` branch) -- never imports,
 * calls, or modifies that file. No network call, no Path-B.
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
const UNIFIED_ART_STYLE_STAND_IN = '[SYNTHETIC -- stands in for the real app-owned UNIFIED_ART_STYLE constant, not copied from AIStudio-App]';

/**
 * Faithful, local, read-only reproduction of the REAL slots-mapping logic
 * from `handleImportScenarioJSON` (exact structure, confirmed against the
 * real file during this phase's own analysis). Used only to test what the
 * real app would actually do with this adapter's output -- never imports
 * from or calls AIStudio-App.
 */
function simulateRealImportHandler(data: unknown): { recognized: boolean; newSlots: unknown[] | null; modeApplied: boolean; conceptApplied: boolean } {
  if (!data || typeof data !== 'object') return { recognized: false, newSlots: null, modeApplied: false, conceptApplied: false };
  const d = data as Record<string, unknown>;
  if (!d.slots || !Array.isArray(d.slots)) return { recognized: false, newSlots: null, modeApplied: false, conceptApplied: false };

  const modeApplied = !!d.mode;
  const conceptApplied = !!d.concept;

  const newSlots = (d.slots as unknown[]).map((raw, idx) => {
    const s = raw as Record<string, unknown>;
    if (s.versions) return s; // real code: pre-built slots pass through untouched
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

  return { recognized: true, newSlots, modeApplied, conceptApplied };
}

const titanicRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
const spiritedRun = runPbrpRuntimeExecutionPreparation(projectRoot, SPIRITED_INPUT, 'ai_studio', 'spirited_away');

// =========================================================================
// 1. 실제 업로드 파일 구조와 동일한 Schema
// =========================================================================
{
  const build = buildNativeScenarioDocument([titanicRun, spiritedRun]);
  check('1_schema.build_pass', build.pass === true, JSON.stringify(build.validation_errors));
  const sim = simulateRealImportHandler(build.document);
  check('1_schema.recognized_by_real_import_logic', sim.recognized === true);
  check('1_schema.no_top_level_fields_beyond_slots', build.document ? Object.keys(build.document).sort().join(',') === 'slots' : false, build.document ? Object.keys(build.document).join(',') : 'null');
}

// =========================================================================
// 2. Titanic / Spirited Away 실제 데이터 기반 변환
// =========================================================================
{
  const build = buildNativeScenarioDocument([titanicRun, spiritedRun]);
  check('2_real_data.two_slots_produced', build.document?.slots.length === 2, `${build.document?.slots.length}`);
  const s0 = build.document?.slots[0].versions[0];
  const s1 = build.document?.slots[1].versions[0];
  check('2_real_data.slot0_scenario_matches_titanic_final_prompt', s0?.scenario === titanicRun.final_prompt?.positive_prompt);
  check('2_real_data.slot1_scenario_matches_spirited_final_prompt', s1?.scenario === spiritedRun.final_prompt?.positive_prompt);
  check('2_real_data.slot0_character_references_real_anchor', !!s0?.character?.includes('titanic_bow_pose'), s0?.character);
  check('2_real_data.slot1_character_references_real_anchor', !!s1?.character?.includes('bathhouse_arrival'), s1?.character);
}

// =========================================================================
// 3. Character / Location / Lighting / Style 보존
// =========================================================================
{
  const build = buildNativeScenarioDocument([titanicRun, spiritedRun]);
  const s0 = build.document?.slots[0].versions[0];
  check('3_preservation.character_present', !!s0?.character && s0.character.length > 0);
  check('3_preservation.timeSetting_carries_real_lighting_data', !!s0?.timeSetting?.includes(titanicRun.scene_context!.lighting.descriptor), s0?.timeSetting);
  // "Location"/"Style" as separate fields: confirmed absent from the real
  // schema (see file header) -- correct absence, not a gap in coverage.
  check('3_preservation.no_fabricated_location_field', !JSON.stringify(build.document).includes('location_id'));
  check('3_preservation.artStyle_correctly_omitted_not_fabricated', build.document ? !('artStyle' in build.document.slots[0].versions[0]) : false);
}

// =========================================================================
// 4. Movie Dataset 조건 보존
// =========================================================================
{
  // This item's real premise does not hold: `movie_dataset_condition` does
  // not exist anywhere in the real, non-Path-B schema (confirmed via
  // direct repository-wide grep before implementation began). "Preserved"
  // here means correctly, deliberately never fabricated -- verified as an
  // absence, per the direction chosen for this phase.
  const build = buildNativeScenarioDocument([titanicRun, spiritedRun]);
  const serialized = JSON.stringify(build.document);
  check('4_movie_dataset_condition.correctly_absent_not_fabricated', !serialized.includes('movie_dataset_condition'));
  // Checks actual USAGE (import or call), not bare mention -- the adapter's
  // own header comment legitimately *names* parseRuntimeSpatialGraph to
  // explain why Path-B is excluded, which a plain substring check would
  // wrongly flag (same self-referential false-positive class as PHASE-007
  // and PHASE-003's earlier findings; recognized immediately this time).
  const adapterSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpNativeScenarioAdapter.ts'), 'utf8');
  const adapterImportLines = adapterSrc.split('\n').filter((l) => /^\s*import\b/.test(l));
  const actuallyImportsSpatialParser = adapterImportLines.some((l) => l.includes('parseRuntimeSpatialGraph') || l.includes('spatialParser'));
  const actuallyCallsIt = /parseRuntimeSpatialGraph\s*\(/.test(adapterSrc);
  check('4_movie_dataset_condition.no_path_b_reference_in_adapter', !actuallyImportsSpatialParser && !actuallyCallsIt);
}

// =========================================================================
// 5. Slot 순서·개수 보존
// =========================================================================
{
  const build3 = buildNativeScenarioDocument([titanicRun, spiritedRun, titanicRun]);
  check('5_slot_order.count_matches_input', build3.document?.slots.length === 3, `${build3.document?.slots.length}`);
  check('5_slot_order.order_preserved_slot0', build3.document?.slots[0].versions[0].scenario === titanicRun.final_prompt?.positive_prompt);
  check('5_slot_order.order_preserved_slot1', build3.document?.slots[1].versions[0].scenario === spiritedRun.final_prompt?.positive_prompt);
  check('5_slot_order.order_preserved_slot2', build3.document?.slots[2].versions[0].scenario === titanicRun.final_prompt?.positive_prompt);
  check('5_slot_order.ids_sequential', build3.document?.slots.map((s) => s.id).join(',') === '1,2,3', build3.document?.slots.map((s) => s.id).join(','));
}

// =========================================================================
// 6. JSON Import 구조 검증 -- full round-trip through the real handler logic
// =========================================================================
{
  const build = buildNativeScenarioDocument([titanicRun, spiritedRun]);
  const jsonText = JSON.stringify(build.document);
  const parsedBack = JSON.parse(jsonText);
  const sim = simulateRealImportHandler(parsedBack);
  check('6_import_structure.round_trip_recognized', sim.recognized === true);
  check('6_import_structure.slot_count_preserved_through_json_round_trip', Array.isArray(sim.newSlots) && sim.newSlots.length === 2, `${sim.newSlots?.length}`);
  const firstSlot = sim.newSlots?.[0] as NativeScenarioSlot | undefined;
  check('6_import_structure.pass_through_unmodified_since_versions_already_present', JSON.stringify(firstSlot) === JSON.stringify(build.document?.slots[0]), 'real handler\'s `if (s.versions) return s;` branch should return our slot unchanged');
  check('6_import_structure.no_mode_concept_applied', sim.modeApplied === false && sim.conceptApplied === false, 'we omit these fields, so the real handler must not think it applied them');
}

// =========================================================================
// 7. Deterministic 출력
// =========================================================================
{
  const runs = Array.from({ length: 5 }, () => {
    const t = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_INPUT, 'ai_studio', 'titanic');
    const s = runPbrpRuntimeExecutionPreparation(projectRoot, SPIRITED_INPUT, 'ai_studio', 'spirited_away');
    return buildNativeScenarioDocument([t, s]);
  });
  const serialized = runs.map((r) => JSON.stringify(r));
  check('7_determinism.5x_identical', serialized.every((s) => s === serialized[0]));
}

// =========================================================================
// Input validation guard (mirrors prior phases' rigor)
// =========================================================================
{
  const failedRun = runPbrpRuntimeExecutionPreparation(projectRoot, 'A quiet abstract scene about mathematics and geometry.', 'ai_studio', 'titanic');
  const build = buildNativeScenarioDocument([failedRun]);
  check('input_guard.rejects_failed_run', build.pass === false && build.document === null);
  const emptyBuild = buildNativeScenarioDocument([]);
  check('input_guard.rejects_empty_input', emptyBuild.pass === false && emptyBuild.validation_errors.some((e) => e.includes('EMPTY_INPUT')));
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
  // Same actual-usage check as above, not a bare substring match -- the
  // module's own doc comment names both terms to explain their exclusion.
  const usesSpatialGraphAPI = /parseRuntimeSpatialGraph\s*\(/.test(adapterContent) || /\bmovieDataset\s*[:=]/.test(adapterContent);
  check('compliance.no_path_b', !usesSpatialGraphAPI);
}

// --- Report ---------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-native-scenario-adapter-v1-report.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-001', generated_at: new Date().toISOString(), results, issues }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_001_V1' : 'FAIL_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_001_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
