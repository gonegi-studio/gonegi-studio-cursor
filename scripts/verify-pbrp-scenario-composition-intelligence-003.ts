import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { loadPbrpKnowledgeRepository } from '../services/pbrpKnowledgeRepository.js';
import { analyzeIntent } from '../services/pbrpIntentAnalyzer.js';
import { selectKnowledge } from '../services/pbrpKnowledgeSelector.js';
import {
  bindSceneGroundTruth,
  detectSceneConflicts,
  scanSceneRegistryConflicts,
  scanLocationLightingCoverage,
} from '../services/pbrpSceneGroundTruthBinder.js';
import {
  resolveSceneAwarePriority,
  buildConflictState,
  detectDualAnchorConflicts,
  reverifyLocationConnection,
  reanalyzeLightingGapWithAffinity,
  analyzeCastAuthoritySource,
  finalVerifyGonegiStyleDna,
} from '../services/pbrpSceneDataReconciliation.js';

/**
 * PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-003: Scene Data
 * Reconciliation & Ground-Truth Integration V1 -- validation.
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
const TITANIC_INPUT = 'A scene full of freedom, romance and wonder, set in bright clear daylight.';
const SPIRITED_INPUT = 'A scene full of wonder and disorientation, bathhouse arrival at night.';

// =========================================================================
// 1-2. Scene-bound binding wired into the selection path, priority applied
// =========================================================================
{
  const titanicSelection = selectKnowledge(loadPbrpKnowledgeRepository(projectRoot, 'titanic'), analyzeIntent(TITANIC_INPUT));
  const titanicAware = resolveSceneAwarePriority(projectRoot, 'titanic', TITANIC_SCENE_ID, titanicSelection);
  check('1_priority.titanic_ground_truth_applied', titanicAware.priority_reason === 'GROUND_TRUTH_RESOLVED_AND_APPLIED' && titanicAware.applied_source_registry === 'scene_ground_truth');
  check('1_priority.titanic_applied_camera_is_real_scene_bound', titanicAware.applied_camera_id === 'titanic_cam_009');
  check('2_priority.titanic_conflict_with_selector_resolved_by_priority', titanicAware.divergence?.composition_diverges === true, JSON.stringify(titanicAware.divergence));
  check('2_priority.titanic_emotion_selector_never_applied', titanicAware.applied_composition_id !== titanicAware.emotion_selector_reference.composition_id || titanicAware.emotion_selector_reference.composition_id === null);

  const spiritedSelection = selectKnowledge(loadPbrpKnowledgeRepository(projectRoot, 'spirited_away'), analyzeIntent(SPIRITED_INPUT));
  const spiritedAware = resolveSceneAwarePriority(projectRoot, 'spirited_away', SPIRITED_SCENE_ID, spiritedSelection);
  check('1_priority.spirited_ground_truth_applied', spiritedAware.priority_reason === 'GROUND_TRUTH_RESOLVED_AND_APPLIED' && spiritedAware.applied_source_registry === 'scene_ground_truth');
  check('1_priority.spirited_applied_composition_is_real_scene_bound', spiritedAware.applied_composition_id === 'spirited_comp_0001');
  check('2_priority.spirited_conflict_with_selector_resolved_by_priority', spiritedAware.divergence?.composition_diverges === true, JSON.stringify(spiritedAware.divergence));

  // Fallback path: a nonexistent scene id must fall back explicitly, not crash or silently fabricate a binding.
  const missingSceneAware = resolveSceneAwarePriority(projectRoot, 'titanic', 'scene_titanic_does_not_exist', titanicSelection);
  check('1_priority.fallback_path_used_for_unresolvable_scene', missingSceneAware.priority_reason === 'GROUND_TRUTH_UNAVAILABLE_FALLBACK_TO_EMOTION_SELECTOR' && missingSceneAware.applied_source_registry === 'emotion_keyword_selector');
  check('1_priority.fallback_is_disclosed_not_silent', missingSceneAware.provenance.includes('failed to resolve'));

  results['1-2_scene_aware_selection_samples'] = { titanic: titanicAware, spirited_away: spiritedAware };
}

// =========================================================================
// 3. Character/Blocking/Camera conflict -- explicit state, never resolved
// =========================================================================
{
  const titanicBinding = bindSceneGroundTruth(projectRoot, 'titanic', TITANIC_SCENE_ID);
  const titanicConflicts = detectSceneConflicts(titanicBinding, 'freedom, romance, wonder');
  const titanicState = buildConflictState(titanicConflicts);
  check('3_conflict_state.titanic_has_unresolved_conflicts', titanicState.has_unresolved_conflicts === true);
  check('3_conflict_state.titanic_policy_is_none_auto_resolved', titanicState.resolution_policy === 'NONE_AUTO_RESOLVED');
  check('3_conflict_state.titanic_both_real_values_preserved', titanicState.conflicts.every((c) => c.value_a.value.length > 0 && c.value_b.value.length > 0 && c.value_a.value !== c.value_b.value));

  const spiritedBinding = bindSceneGroundTruth(projectRoot, 'spirited_away', SPIRITED_SCENE_ID);
  const spiritedConflicts = detectSceneConflicts(spiritedBinding, 'loneliness, longing, vulnerability');
  const spiritedState = buildConflictState(spiritedConflicts);
  check('3_conflict_state.spirited_has_unresolved_conflicts', spiritedState.has_unresolved_conflicts === true);

  // Dual-anchor correction: re-checks against BOTH real listed anchors, not one heuristic "primary".
  const dualAnchor = detectDualAnchorConflicts(projectRoot, spiritedBinding, 'loneliness, longing, vulnerability');
  check('3_conflict_state.dual_anchor_checks_both_real_ids', dualAnchor.listed_anchor_ids.length === 2, JSON.stringify(dualAnchor.listed_anchor_ids));
  check('3_conflict_state.dual_anchor_participant_conflict_matches_expectation', dualAnchor.participant_conflict === false, 'bridge_crossing has participants=2, matching blocking.participant_count=2 -- must not be flagged once BOTH real anchors are checked');

  results['3_conflict_state_samples'] = { titanic: titanicState, spirited_away: spiritedState, dual_anchor: dualAnchor };
}

// =========================================================================
// 4. Titanic Location 13 GAP -- re-verification
// =========================================================================
{
  const lane = reverifyLocationConnection(projectRoot, 'titanic', 'gonegi_harbor_lane_01');
  const dock = reverifyLocationConnection(projectRoot, 'titanic', 'gonegi_harbor_dock_01');
  const hill = reverifyLocationConnection(projectRoot, 'titanic', 'gonegi_olive_hill_01');

  check('4_location_reverify.dock_coarse_type_found_via_cross_reference', dock?.coarse_type_resolvable === true && dock?.cross_reference_location_type === 'exterior_harbor', JSON.stringify(dock));
  check('4_location_reverify.hill_coarse_type_found_via_cross_reference', hill?.coarse_type_resolvable === true && hill?.cross_reference_location_type === 'exterior_hill', JSON.stringify(hill));
  check('4_location_reverify.dock_full_dna_still_not_resolvable', dock?.full_dna_resolvable === false);
  check('4_location_reverify.hill_full_dna_still_not_resolvable', hill?.full_dna_resolvable === false);
  check('4_location_reverify.lane_remains_fully_unresolvable', lane?.coarse_type_resolvable === false && lane?.full_dna_resolvable === false, JSON.stringify(lane));

  results['4_location_reverify_samples'] = { gonegi_harbor_lane_01: lane, gonegi_harbor_dock_01: dock, gonegi_olive_hill_01: hill };
}

// =========================================================================
// 5. Lighting pairing GAP -- precision correction
// =========================================================================
{
  const bakeryDining = reanalyzeLightingGapWithAffinity(projectRoot, 'family_bakery_dining_01');
  const danaWindow = reanalyzeLightingGapWithAffinity(projectRoot, 'dana_window_corner_01');
  check('5_lighting_correction.bakery_dining_now_resolvable_via_affinity', bakeryDining?.resolvable === true && bakeryDining?.resolved_via_location_affinity === true && bakeryDining?.resolved_via_pairing_table === false, JSON.stringify(bakeryDining));
  check('5_lighting_correction.dana_window_corner_still_genuinely_unresolvable', danaWindow?.resolvable === false, JSON.stringify(danaWindow));

  // Recompute full Titanic coverage with the corrected logic and compare
  // against PHASE-002's own (now-known-incomplete) pairing-only numbers.
  const scenes = JSON.parse(fs.readFileSync(path.join(projectRoot, 'datasets/movie_reconstruction/titanic/titanic-scene-registry.json'), 'utf8')).scenes as { gonegi_translation: { target_location_id?: string } }[];
  const locLib = JSON.parse(fs.readFileSync(path.join(projectRoot, 'datasets/location/location-dna-library-v1.json'), 'utf8')) as { locations: { location_id: string }[] };
  const locIds = new Set(locLib.locations.map((l) => l.location_id));
  let correctedLightOk = 0;
  for (const scene of scenes) {
    const id = scene.gonegi_translation.target_location_id;
    if (!id || !locIds.has(id)) continue;
    const corrected = reanalyzeLightingGapWithAffinity(projectRoot, id);
    if (corrected?.resolvable) correctedLightOk += 1;
  }
  check('5_lighting_correction.corrected_titanic_scene_count_higher_than_phase_002', correctedLightOk === 13, `corrected=${correctedLightOk}, expected 13 (PHASE-002 pairing-only count was 8)`);

  const oldCoverage = scanLocationLightingCoverage(projectRoot, 'titanic');
  check('5_lighting_correction.old_phase_002_coverage_still_reproducible_for_diff', oldCoverage.scenes_with_location_and_lighting_match === 8, String(oldCoverage.scenes_with_location_and_lighting_match));

  results['5_lighting_correction_samples'] = { family_bakery_dining_01: bakeryDining, dana_window_corner_01: danaWindow, corrected_titanic_light_ok_scene_count: correctedLightOk, phase_002_pairing_only_count: oldCoverage.scenes_with_location_and_lighting_match };
}

// =========================================================================
// 6. Spirited Away 260 ambiguous cast -- authoritative source analysis
// =========================================================================
{
  const analysis = analyzeCastAuthoritySource(projectRoot, 'spirited_away');
  check('6_cast_authority.all_300_scenes_checked', analysis.total_scenes_checked === 300, String(analysis.total_scenes_checked));
  check('6_cast_authority.zero_scenes_have_scene_level_authority', analysis.scenes_with_scene_level_authority === 0, String(analysis.scenes_with_scene_level_authority));
  check('6_cast_authority.all_300_scenes_show_dual_anchor_usage', analysis.scenes_with_dual_anchor_usage === 300, String(analysis.scenes_with_dual_anchor_usage));
  check('6_cast_authority.shot_level_authority_is_100_percent_real', analysis.shot_level_authority_is_100_percent_real === true);
  check('6_cast_authority.total_real_shots_matches_known_dataset_size', analysis.total_real_shots_checked === 2400, String(analysis.total_real_shots_checked));

  const titanicAnalysis = analyzeCastAuthoritySource(projectRoot, 'titanic');
  check('6_cast_authority.titanic_has_no_ambiguity_to_analyze', titanicAnalysis.total_scenes_checked === 0);

  results['6_cast_authority_analysis'] = { total_scenes_checked: analysis.total_scenes_checked, scenes_with_scene_level_authority: analysis.scenes_with_scene_level_authority, scenes_with_dual_anchor_usage: analysis.scenes_with_dual_anchor_usage, total_real_shots_checked: analysis.total_real_shots_checked, sample: analysis.sample };
}

// =========================================================================
// 7. Gonegi Style DNA -- final usable-source verification
// =========================================================================
{
  const finalVerification = finalVerifyGonegiStyleDna(projectRoot);
  check('7_style_final.no_live_structured_gonegi_keyed_library', finalVerification.live_structured_gonegi_keyed_library_found === false);
  check('7_style_final.style_dna_bundle_confirmed_live_correction_applied', finalVerification.style_dna_bundle_live_at_exports === true, 'corrects PHASE-002\'s "not live" claim');
  check('7_style_final.numerical_dna_found_but_source_video_keyed_only', finalVerification.numerical_style_dna_found === true && !finalVerification.numerical_style_dna_source_video_ids.some((id) => /gonegi/i.test(id)));
  check('7_style_final.approved_artstyle_text_found_and_disclosed', finalVerification.approved_artstyle_text_found === true && typeof finalVerification.approved_artstyle_text === 'string' && finalVerification.approved_artstyle_text.length > 0);
  check('7_style_final.still_not_resolvable_for_pbrp_style_slot', finalVerification.resolvable === false);
  check('7_style_final.no_style_data_generated_by_this_check', !finalVerification.approved_artstyle_note.toLowerCase().includes('generated'));

  results['7_style_final_verification'] = finalVerification;
}

// =========================================================================
// 8. Provenance
// =========================================================================
{
  const titanicAware = (results['1-2_scene_aware_selection_samples'] as { titanic: { provenance: string } }).titanic;
  check('8_provenance.scene_aware_selection_has_provenance_string', typeof titanicAware.provenance === 'string' && titanicAware.provenance.length > 0);
  const dock = (results['4_location_reverify_samples'] as { gonegi_harbor_dock_01: { verdict_note: string } }).gonegi_harbor_dock_01;
  check('8_provenance.location_reverify_cites_cross_reference_source', dock.verdict_note.includes('shotGrammar.ts'));
  const bakeryDining = (results['5_lighting_correction_samples'] as { family_bakery_dining_01: { correction_note: string } }).family_bakery_dining_01;
  check('8_provenance.lighting_correction_cites_what_changed', bakeryDining.correction_note.includes('PHASE-002'));
}

// =========================================================================
// PASS -> PASS Regression
// =========================================================================
{
  const binderSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpSceneGroundTruthBinder.ts'), 'utf8');
  const selectorSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpKnowledgeSelector.ts'), 'utf8');
  const composerSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpKnowledgeComposer.ts'), 'utf8');
  check('regression.binder_file_untouched_by_this_phase', !binderSrc.includes('pbrpSceneDataReconciliation'), 'PHASE-002\'s binder must not know about this phase\'s module');
  check('regression.selector_still_has_no_reconciliation_import', !selectorSrc.includes('pbrpSceneDataReconciliation') && !selectorSrc.includes('pbrpSceneGroundTruthBinder'));
  check('regression.composer_still_has_no_reconciliation_import', !composerSrc.includes('pbrpSceneDataReconciliation') && !composerSrc.includes('pbrpSceneGroundTruthBinder'));

  const reconciliationSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpSceneDataReconciliation.ts'), 'utf8');
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY|generateContent\(/i;
  check('regression.reconciliation_module_api_free', !apiPattern.test(reconciliationSrc));
  const usesSpatialGraphAPI = /parseRuntimeSpatialGraph\s*\(/.test(reconciliationSrc) || /\bmovieDataset\s*[:=]/.test(reconciliationSrc);
  check('regression.reconciliation_module_no_path_b', !usesSpatialGraphAPI);
  check('regression.reconciliation_module_read_only', !reconciliationSrc.includes('writeFileSync'));

  // Full-dataset scans from PHASE-002 must still run and agree with themselves.
  const titanicScan = scanSceneRegistryConflicts(projectRoot, 'titanic');
  const spiritedScan = scanSceneRegistryConflicts(projectRoot, 'spirited_away');
  check('regression.phase_002_titanic_scan_still_30_scenes', titanicScan.total_scenes === 30);
  check('regression.phase_002_spirited_scan_still_300_scenes', spiritedScan.total_scenes === 300);
}

// =========================================================================
// Compliance
// =========================================================================
{
  const reconciliationSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpSceneDataReconciliation.ts'), 'utf8');
  const importLines = reconciliationSrc.split('\n').filter((l) => /^\s*import\b/.test(l));
  check('compliance.no_ai_studio_import', !importLines.some((l) => l.includes('AIStudio-App') || l.includes('Gonegi-AIStudio')));
  check('compliance.no_pbrp_contract_file_reference', !importLines.some((l) => l.includes('E:\\PBRP') || l.includes('E:/PBRP')));
  check('compliance.no_shotgrammar_import_only_cross_reference', !importLines.some((l) => l.includes('shotGrammar')), 'must be a disclosed static cross-reference, not a live import/dependency');
}

// --- Report ---------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-scenario-composition-intelligence-003-report.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-003', generated_at: new Date().toISOString(), results, issues }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).filter((k) => results[k] === 'PASS' || (typeof results[k] === 'string' && (results[k] as string).startsWith('FAIL'))).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_003_V1' : 'FAIL_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_003_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) console.error(`[error] ${issue}`);
  process.exit(1);
}

process.exit(0);
