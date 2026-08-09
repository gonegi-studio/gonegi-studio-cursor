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
  type ProductionNativeScenarioBuildResult,
} from '../services/pbrpNativeScenarioFromProductionAdapter.js';
import type { NativeScenarioSlot } from '../services/pbrpNativeScenarioAdapter.js';

/**
 * PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-005: AI Studio Ready
 * Scenario Output V1 -- validation.
 *
 * Validates the new production-scenario -> Native Scenario adapter against
 * the same faithful, read-only reproduction of the REAL import-parsing
 * logic (`AIStudio-App/components/MusicDramaStudio.tsx`'s
 * `handleImportScenarioJSON`) that PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-
 * ADAPTER-001 verified its own adapter against -- never imports, calls, or
 * modifies that file. No network call, no Path-B.
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

/** Same faithful, local, read-only reproduction of the REAL slots-mapping logic used by PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-001's own verify script. */
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

const titanicSelection = selectKnowledge(loadPbrpKnowledgeRepository(projectRoot, 'titanic'), analyzeIntent('freedom romance wonder'));
const spiritedSelection = selectKnowledge(loadPbrpKnowledgeRepository(projectRoot, 'spirited_away'), analyzeIntent('wonder disorientation'));
const titanicScenario: ProductionScenario = buildProductionScenario(projectRoot, 'titanic', TITANIC_SCENE_ID, titanicSelection);
const spiritedScenario: ProductionScenario = buildProductionScenario(projectRoot, 'spirited_away', SPIRITED_SCENE_ID, spiritedSelection);

// =========================================================================
// 1. Uses PHASE-004's Production Scenario (not a re-derivation)
// =========================================================================
{
  check('1_uses_004.titanic_scenario_passes', titanicScenario.pass === true);
  check('1_uses_004.spirited_scenario_passes', spiritedScenario.pass === true);
}

// =========================================================================
// 6. Native Scenario 구조 -- real schema, recognized by the real import logic
// =========================================================================
const build: ProductionNativeScenarioBuildResult = buildNativeScenarioFromProductionScenarios([titanicScenario, spiritedScenario]);
{
  check('6_native_structure.build_pass', build.pass === true, JSON.stringify(build.validation_errors));
  check('6_native_structure.two_slots_produced', build.document?.slots.length === 2, `${build.document?.slots.length}`);
  check('6_native_structure.no_top_level_fields_beyond_slots', build.document ? Object.keys(build.document).sort().join(',') === 'slots' : false);
  const sim = simulateRealImportHandler(build.document);
  check('6_native_structure.recognized_by_real_import_logic', sim.recognized === true);
  check('6_native_structure.slot_count_preserved_through_real_handler', Array.isArray(sim.newSlots) && sim.newSlots.length === 2);
  const roundTripped = JSON.parse(JSON.stringify(build.document));
  const sim2 = simulateRealImportHandler(roundTripped);
  check('6_native_structure.round_trip_through_json_still_recognized', sim2.recognized === true);
  const firstSlot = sim2.newSlots?.[0] as NativeScenarioSlot | undefined;
  check('6_native_structure.pass_through_unmodified_since_versions_already_present', JSON.stringify(firstSlot) === JSON.stringify(build.document?.slots[0]), "real handler's `if (s.versions) return s;` branch must return our slot unchanged");
  check('6_native_structure.artstyle_correctly_omitted_not_fabricated', build.document ? !('artStyle' in build.document.slots[0].versions[0]) : false);
}

// =========================================================================
// Visual DNA 보존
// =========================================================================
{
  const s0 = build.document?.slots[0].versions[0];
  const s1 = build.document?.slots[1].versions[0];
  check('visual_dna.titanic_character_field_contains_real_visual_dna', !!s0?.character?.includes('Soulful and determined 11yo boy'), s0?.character?.slice(0, 80));
  check('visual_dna.titanic_character_field_contains_dana', !!s0?.character?.includes('Dana:'));
  check('visual_dna.spirited_character_field_contains_gonegi_and_dana_per_phase_003', !!s1?.character?.includes('Gonegi:') && !!s1?.character?.includes('Dana:'), s1?.character?.slice(0, 80));
  check('visual_dna.field_is_verbatim_not_semantic_only', !!s0?.character?.includes('Off-white henley shirt'), 'must be the real visual_dna text, not just semantic_meaning/emotion');
  check('visual_dna.scenario_text_also_carries_character_direction', !!s0?.scenario?.includes('Character:'));

  const companion = buildCharacterBookCompanionFromProductionScenarios([titanicScenario, spiritedScenario]);
  check('visual_dna.character_book_companion_deduplicated', companion.characters.length === 2, `${companion.characters.length}`);
  check('visual_dna.character_book_companion_shape_matches_real_schema', companion.characters.every((c) => typeof c.id === 'string' && typeof c.visual_dna === 'string'));
  results['character_book_companion'] = companion;
}

// =========================================================================
// NOT_DERIVABLE 보존
// =========================================================================
{
  const s0 = build.document?.slots[0].versions[0];
  const s1 = build.document?.slots[1].versions[0];
  check('not_derivable.titanic_timeSetting_discloses_gap', !!s0?.timeSetting?.includes('NOT_DERIVABLE'), s0?.timeSetting);
  check('not_derivable.spirited_timeSetting_discloses_gap', !!s1?.timeSetting?.includes('NOT_DERIVABLE'), s1?.timeSetting);
  check('not_derivable.titanic_scenario_text_discloses_location_gap', !!s0?.scenario?.includes('Location: NOT_DERIVABLE'));
  check('not_derivable.spirited_scenario_text_discloses_location_gap', !!s1?.scenario?.includes('Location: NOT_DERIVABLE'));
  check('not_derivable.both_scenario_texts_disclose_style_gap', !!s0?.scenario?.includes('Style: NOT_DERIVABLE') && !!s1?.scenario?.includes('Style: NOT_DERIVABLE'));
  // Substring-only checks would false-positive on the honest NOT_DERIVABLE
  // disclosure text itself (e.g. "...has no target_location_id key...") --
  // same self-referential false-positive class flagged in earlier phases.
  // Check for an actual fabricated JSON key, not any mention of the words.
  const serialized = JSON.stringify(build.document);
  check('not_derivable.no_fabricated_artstyle_field', !serialized.includes('"artStyle":'));
  check('not_derivable.no_fabricated_location_id_field', !serialized.includes('"location_id":'));
}

// =========================================================================
// Positive path: when PHASE-004 DOES have real Lighting, timeSetting must
// carry the real text, not a NOT_DERIVABLE marker (both directions proven).
// =========================================================================
{
  const positiveScenario = buildProductionScenario(projectRoot, 'titanic', 'scene_titanic_02_crowd_departure_005', titanicSelection);
  const positiveBuild = buildNativeScenarioFromProductionScenarios([positiveScenario]);
  const s = positiveBuild.document?.slots[0].versions[0];
  check('positive_path.timeSetting_carries_real_lighting_text_when_derived', !!s?.timeSetting && !s.timeSetting.includes('NOT_DERIVABLE') && s.timeSetting.includes('Sunrise Bakery Bedroom'), s?.timeSetting);
}

// =========================================================================
// Provenance 유지
// =========================================================================
{
  check('provenance.slot_sources_cite_phase_004', build.slot_sources.every((s) => s.scenario_source.includes('PHASE-004')));
  check('provenance.slot_sources_cite_real_scene_ids', build.slot_sources[0].scenario_source.includes(TITANIC_SCENE_ID) && build.slot_sources[1].scenario_source.includes(SPIRITED_SCENE_ID));
  check('provenance.character_source_discloses_visual_dna_not_semantic', build.slot_sources.every((s) => s.character_source.includes('visual_dna')));
}

// =========================================================================
// Input validation guard
// =========================================================================
{
  const failedScenario = buildProductionScenario(projectRoot, 'titanic', 'scene_does_not_exist', titanicSelection);
  const failedBuild = buildNativeScenarioFromProductionScenarios([failedScenario]);
  check('input_guard.rejects_failed_scenario', failedBuild.pass === false && failedBuild.document === null);
  const emptyBuild = buildNativeScenarioFromProductionScenarios([]);
  check('input_guard.rejects_empty_input', emptyBuild.pass === false && emptyBuild.validation_errors.some((e) => e.includes('EMPTY_INPUT')));
}

// =========================================================================
// Determinism
// =========================================================================
{
  const runs = Array.from({ length: 3 }, () =>
    buildNativeScenarioFromProductionScenarios([
      buildProductionScenario(projectRoot, 'titanic', TITANIC_SCENE_ID, titanicSelection),
      buildProductionScenario(projectRoot, 'spirited_away', SPIRITED_SCENE_ID, spiritedSelection),
    ])
  );
  check('determinism.3x_identical', runs.every((r) => JSON.stringify(r) === JSON.stringify(runs[0])));
}

// =========================================================================
// 004 + 핵심 기존 regression
// =========================================================================
{
  const assemblerSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpProductionScenarioAssembler.ts'), 'utf8');
  const oldAdapterSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpNativeScenarioAdapter.ts'), 'utf8');
  check('regression.production_assembler_untouched', !assemblerSrc.includes('pbrpNativeScenarioFromProductionAdapter'));
  check('regression.old_native_adapter_untouched', !oldAdapterSrc.includes('pbrpNativeScenarioFromProductionAdapter'));

  const newAdapterSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpNativeScenarioFromProductionAdapter.ts'), 'utf8');
  const importLines = newAdapterSrc.split('\n').filter((l) => /^\s*import\b/.test(l));
  check('regression.no_ai_studio_import', !importLines.some((l) => l.includes('AIStudio-App') || l.includes('Gonegi-AIStudio')));
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY|generateContent\(/i;
  check('regression.new_adapter_api_free', !apiPattern.test(newAdapterSrc));
  const usesSpatialGraphAPI = /parseRuntimeSpatialGraph\s*\(/.test(newAdapterSrc) || /\bmovieDataset\s*[:=]/.test(newAdapterSrc);
  check('regression.new_adapter_no_path_b', !usesSpatialGraphAPI);
  check('regression.new_adapter_read_only', !newAdapterSrc.includes('writeFileSync'));
}

// --- Report ---------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-scenario-composition-intelligence-005-report.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-005', generated_at: new Date().toISOString(), results, issues, sample_document: build.document, slot_sources: build.slot_sources }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_005_V1' : 'FAIL_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_005_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) console.error(`[error] ${issue}`);
  process.exit(1);
}

process.exit(0);
