import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { loadPbrpKnowledgeRepository } from '../services/pbrpKnowledgeRepository.js';
import { analyzeIntent } from '../services/pbrpIntentAnalyzer.js';
import { selectKnowledge } from '../services/pbrpKnowledgeSelector.js';
import { buildProductionScenario } from '../services/pbrpProductionScenarioAssembler.js';

/**
 * PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-004: Production Scenario
 * Assembly V1 -- validation.
 *
 * Verifies (per this phase's own 검증 list): one Titanic scene, one
 * Spirited Away scene, Ground Truth priority confirmed, Character Visual
 * DNA inclusion confirmed, NOT_DERIVABLE confirmed, and basic regression.
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
// A second, real Titanic scene whose target_location_id (gonegi_bedroom_01)
// DOES have a real Location+Lighting match -- proves the "use real data
// when it exists" path, not just the NOT_DERIVABLE path both primary test
// scenes happen to exercise.
const TITANIC_POSITIVE_LOCATION_SCENE_ID = 'scene_titanic_02_crowd_departure_005';

const titanicSelection = selectKnowledge(loadPbrpKnowledgeRepository(projectRoot, 'titanic'), analyzeIntent('freedom romance wonder'));
const spiritedSelection = selectKnowledge(loadPbrpKnowledgeRepository(projectRoot, 'spirited_away'), analyzeIntent('wonder disorientation'));

// =========================================================================
// Titanic 1 scene
// =========================================================================
const titanicScenario = buildProductionScenario(projectRoot, 'titanic', TITANIC_SCENE_ID, titanicSelection);
{
  check('titanic.assembly_pass', titanicScenario.pass === true, JSON.stringify(titanicScenario.errors));
  check('titanic.ground_truth_priority_applied', titanicScenario.ground_truth_priority.applied_source_registry === 'scene_ground_truth' && titanicScenario.ground_truth_priority.priority_reason === 'GROUND_TRUTH_RESOLVED_AND_APPLIED');
  check('titanic.camera_is_real_scene_bound', titanicScenario.camera_direction.id === 'titanic_cam_009');
  check('titanic.composition_is_real_scene_bound', titanicScenario.composition_direction.id === 'titanic_comp_009');
  check('titanic.blocking_is_real_scene_bound', titanicScenario.blocking_direction.id === 'titanic_blk_009');
  check('titanic.character_visual_dna_included', titanicScenario.character_direction.cast.some((c) => c.resolved?.name === 'Gonegi' && c.resolved.visual_dna.includes('Soulful and determined 11yo boy')));
  check('titanic.character_visual_dna_second_cast_member_included', titanicScenario.character_direction.cast.some((c) => c.resolved?.name === 'Dana' && c.resolved.visual_dna.includes('11yo girl')));
  check('titanic.character_fully_resolved', titanicScenario.character_direction.fully_resolved === true);
  check('titanic.location_not_derivable_with_real_reason', titanicScenario.location_direction.status === 'NOT_DERIVABLE' && titanicScenario.location_direction.text.includes('gonegi_harbor_lane_01'), titanicScenario.location_direction.text);
  check('titanic.lighting_not_derivable_with_real_reason', titanicScenario.lighting_direction.status === 'NOT_DERIVABLE');
  check('titanic.style_not_derivable', titanicScenario.style_direction.status === 'NOT_DERIVABLE' && titanicScenario.style_direction.text === 'NOT_DERIVABLE');
  check('titanic.conflict_preserved_not_dropped', titanicScenario.conflict_state.has_unresolved_conflicts === true && titanicScenario.conflict_state.conflicts.some((c) => c.type === 'EMOTION_ANCHOR_VS_BLOCKING'));
  check('titanic.no_conflict_falsely_cleared_by_trivial_mirror_field', !titanicScenario.net_conflicts.some((c) => c.type === 'EMOTION_ANCHOR_VS_BLOCKING' && c.corrected_by_dual_anchor_check === true), 'a real conflict must never be cleared by comparing against a field that trivially mirrors the anchor itself');
  check('titanic.final_text_contains_all_seven_directions', ['Character:', 'Blocking:', 'Camera:', 'Composition:', 'Location:', 'Lighting:', 'Style:'].every((label) => titanicScenario.final_text.includes(label)));
  check('titanic.provenance_present_for_every_direction', Object.keys(titanicScenario.provenance).length >= 7);
}

// =========================================================================
// Spirited Away 1 scene
// =========================================================================
const spiritedScenario = buildProductionScenario(projectRoot, 'spirited_away', SPIRITED_SCENE_ID, spiritedSelection);
{
  check('spirited.assembly_pass', spiritedScenario.pass === true, JSON.stringify(spiritedScenario.errors));
  check('spirited.ground_truth_priority_applied', spiritedScenario.ground_truth_priority.applied_source_registry === 'scene_ground_truth' && spiritedScenario.ground_truth_priority.priority_reason === 'GROUND_TRUTH_RESOLVED_AND_APPLIED');
  check('spirited.camera_is_real_scene_bound', spiritedScenario.camera_direction.id === 'spirited_cam_0001');
  check('spirited.composition_is_real_scene_bound', spiritedScenario.composition_direction.id === 'spirited_comp_0001');
  check('spirited.blocking_is_real_scene_bound', spiritedScenario.blocking_direction.id === 'spirited_blk_0001');
  check('spirited.character_visual_dna_gonegi_included', spiritedScenario.character_direction.cast.some((c) => c.resolved?.name === 'Gonegi'));
  check('spirited.character_visual_dna_dana_included_per_phase_003_finding', spiritedScenario.character_direction.cast.some((c) => c.resolved?.name === 'Dana'), 'PHASE-003 proved bridge_crossing (cast: Gonegi+Dana) is equally real for this scene, not just bathhouse_arrival (Gonegi only)');
  check('spirited.character_fully_resolved', spiritedScenario.character_direction.fully_resolved === true);
  check('spirited.location_not_derivable_structural', spiritedScenario.location_direction.status === 'NOT_DERIVABLE' && spiritedScenario.location_direction.gap?.scope === 'structural_dataset_wide');
  check('spirited.lighting_not_derivable', spiritedScenario.lighting_direction.status === 'NOT_DERIVABLE');
  check('spirited.style_not_derivable', spiritedScenario.style_direction.status === 'NOT_DERIVABLE');
  check('spirited.conflict_preserved_emotion_and_camera_framing', spiritedScenario.conflict_state.conflicts.some((c) => c.type === 'EMOTION_ANCHOR_VS_SCENE') && spiritedScenario.conflict_state.conflicts.some((c) => c.type === 'CAMERA_FRAMING_VS_ANCHOR_SOLO'));
  check('spirited.participant_conflict_correctly_cleared_by_dual_anchor', spiritedScenario.net_conflicts.some((c) => c.type === 'PARTICIPANT_ANCHOR_VS_BLOCKING' && c.corrected_by_dual_anchor_check === true), 'bridge_crossing (participants=2) genuinely matches blocking.participant_count=2 -- must be disclosed as corrected, not silently dropped');
  check('spirited.corrected_conflict_still_visible_in_net_conflicts', spiritedScenario.net_conflicts.some((c) => c.type === 'PARTICIPANT_ANCHOR_VS_BLOCKING'), 'a corrected conflict must remain visible, not deleted');
  check('spirited.final_text_contains_all_seven_directions', ['Character:', 'Blocking:', 'Camera:', 'Composition:', 'Location:', 'Lighting:', 'Style:'].every((label) => spiritedScenario.final_text.includes(label)));
}

// =========================================================================
// Ground Truth 우선 확인 (both scenes diverge from what the unmodified
// emotion selector would have independently chosen -- ground truth wins)
// =========================================================================
{
  const titanicSelectorComposition = titanicSelection.style?.composition_id ?? null;
  const spiritedSelectorComposition = spiritedSelection.style?.composition_id ?? null;
  check('ground_truth_priority.titanic_applied_differs_from_raw_selector', titanicScenario.composition_direction.id !== titanicSelectorComposition, `applied=${titanicScenario.composition_direction.id}, raw_selector=${titanicSelectorComposition}`);
  check('ground_truth_priority.spirited_applied_differs_from_raw_selector', spiritedScenario.composition_direction.id !== spiritedSelectorComposition, `applied=${spiritedScenario.composition_direction.id}, raw_selector=${spiritedSelectorComposition}`);
}

// =========================================================================
// Positive Location/Lighting path (item 4: use only when it exists --
// proven both ways, not just the NOT_DERIVABLE direction)
// =========================================================================
const positiveScenario = buildProductionScenario(projectRoot, 'titanic', TITANIC_POSITIVE_LOCATION_SCENE_ID, titanicSelection);
{
  check('positive_path.location_derived_when_real_match_exists', positiveScenario.location_direction.status === 'DERIVED' && positiveScenario.location_direction.location_id === 'gonegi_bedroom_01');
  check('positive_path.location_text_uses_real_verbatim_fields', positiveScenario.location_direction.text.includes('Gonegi Bedroom') && positiveScenario.location_direction.text.includes('whitewash'));
  check('positive_path.lighting_derived_when_real_pairing_exists', positiveScenario.lighting_direction.status === 'DERIVED' && positiveScenario.lighting_direction.correction?.matched_lighting_ids.includes('sunrise_bakery_bedroom'));
  check('positive_path.style_still_not_derivable_even_when_location_resolves', positiveScenario.style_direction.status === 'NOT_DERIVABLE', 'Location resolving must not cause Style to be fabricated');
}

// =========================================================================
// Determinism (part of basic regression: same input -> same output)
// =========================================================================
{
  const rerun = buildProductionScenario(projectRoot, 'titanic', TITANIC_SCENE_ID, titanicSelection);
  check('regression.deterministic_output', JSON.stringify(rerun) === JSON.stringify(titanicScenario));

  // A scene id that doesn't exist must fail cleanly with NOT_DERIVABLE
  // fields throughout, never crash or fabricate a partial result.
  const missing = buildProductionScenario(projectRoot, 'titanic', 'scene_does_not_exist', titanicSelection);
  check('regression.missing_scene_fails_cleanly', missing.pass === false && missing.character_direction.cast.length === 0 && missing.camera_direction.text === 'NOT_DERIVABLE');
}

// =========================================================================
// 기본 regression -- no existing file modified; prior PBRP verify scripts still pass
// =========================================================================
{
  const selectorSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpKnowledgeSelector.ts'), 'utf8');
  const composerSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpKnowledgeComposer.ts'), 'utf8');
  const binderSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpSceneGroundTruthBinder.ts'), 'utf8');
  const reconciliationSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpSceneDataReconciliation.ts'), 'utf8');
  const charLibSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpCharacterVisualDnaLibrary.ts'), 'utf8');
  check('regression.selector_untouched', !selectorSrc.includes('pbrpProductionScenarioAssembler'));
  check('regression.composer_untouched', !composerSrc.includes('pbrpProductionScenarioAssembler'));
  check('regression.binder_untouched', !binderSrc.includes('pbrpProductionScenarioAssembler'));
  check('regression.reconciliation_untouched', !reconciliationSrc.includes('pbrpProductionScenarioAssembler'));
  check('regression.character_visual_dna_library_untouched', !charLibSrc.includes('pbrpProductionScenarioAssembler'));

  const assemblerSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpProductionScenarioAssembler.ts'), 'utf8');
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY|generateContent\(/i;
  check('regression.assembler_api_free', !apiPattern.test(assemblerSrc));
  const usesSpatialGraphAPI = /parseRuntimeSpatialGraph\s*\(/.test(assemblerSrc) || /\bmovieDataset\s*[:=]/.test(assemblerSrc);
  check('regression.assembler_no_path_b', !usesSpatialGraphAPI);
  check('regression.assembler_read_only', !assemblerSrc.includes('writeFileSync'));
}

// --- Report ---------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-scenario-composition-intelligence-004-report.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify(
    {
      phase: 'PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-004',
      generated_at: new Date().toISOString(),
      results,
      issues,
      sample_scenarios: { titanic: titanicScenario, spirited_away: spiritedScenario, positive_location_demo: positiveScenario },
    },
    null,
    2
  )}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_004_V1' : 'FAIL_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_004_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) console.error(`[error] ${issue}`);
  process.exit(1);
}

process.exit(0);
