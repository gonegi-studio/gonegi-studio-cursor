import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';
import { loadCharacterVisualDnaLibrary, resolveCharacterByRawId, type AiStudioCharacterEntry } from '../services/pbrpCharacterVisualDnaLibrary.js';
import { resolveCharacterCastForSlots } from '../services/pbrpNativeScenarioAdapter.js';
import { auditConsistencyRuleAgainstSource } from '../services/pbrpKnowledgeComposer.js';

/**
 * PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-004: Character Visual DNA +
 * Source-Aware Integrity V1.
 *
 * Validates the real Character Visual DNA connection (items 1-5) and the
 * source-aware consistency-rule audit (items 6-7), against real repository
 * data only. No network call, no AIStudio-App file touched, no Path-B.
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

const TITANIC_BOW = 'A scene full of freedom, romance and wonder, set in bright clear daylight.';
const TITANIC_SUNSET = 'A tenderness and longing farewell scene at golden hour, with grief and impermanence, gentle rain in the air.';
const SPIRITED_BATHHOUSE = 'A scene full of wonder and disorientation, bathhouse arrival at night.';

const library = loadCharacterVisualDnaLibrary(projectRoot);
check('setup.library_loaded', library.length === 13, `${library.length}`);

const titanicBowRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_BOW, 'ai_studio', 'titanic');
const titanicSunsetRun = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_SUNSET, 'ai_studio', 'titanic');
const spiritedRun = runPbrpRuntimeExecutionPreparation(projectRoot, SPIRITED_BATHHOUSE, 'ai_studio', 'spirited_away');

// =========================================================================
// Titanic 2인 캐릭터 매핑
// =========================================================================
{
  const cast = resolveCharacterCastForSlots([titanicBowRun], library);
  check('titanic_2_character.pass', cast.pass === true);
  check('titanic_2_character.raw_cast_is_gonegi_dana', JSON.stringify(cast.slot_cast[0]?.raw_gonegi_characters) === JSON.stringify(['CHAR-gonagi', 'CHAR-dana']), JSON.stringify(cast.slot_cast[0]?.raw_gonegi_characters));
  check('titanic_2_character.resolved_count_is_2', cast.slot_cast[0]?.resolved_count === 2, `${cast.slot_cast[0]?.resolved_count}`);
  check('titanic_2_character.unresolved_count_is_0', cast.slot_cast[0]?.unresolved_count === 0);
  check('titanic_2_character.fully_resolved', cast.fully_resolved === true);
  const names = cast.slot_cast[0]?.resolutions.map((r) => r.resolved?.name).sort();
  check('titanic_2_character.names_are_gonegi_and_dana', JSON.stringify(names) === JSON.stringify(['Dana', 'Gonegi']), JSON.stringify(names));

  // Same check for the second Titanic test slot (different anchor, same real cast).
  const cast2 = resolveCharacterCastForSlots([titanicSunsetRun], library);
  check('titanic_2_character.sunset_slot_also_2_characters', cast2.slot_cast[0]?.resolved_count === 2, `${cast2.slot_cast[0]?.resolved_count}`);
}

// =========================================================================
// Spirited Away Gonegi 단독 매핑
// =========================================================================
{
  const cast = resolveCharacterCastForSlots([spiritedRun], library);
  check('spirited_solo_character.pass', cast.pass === true);
  check('spirited_solo_character.raw_cast_is_gonegi_only', JSON.stringify(cast.slot_cast[0]?.raw_gonegi_characters) === JSON.stringify(['CHAR-gonagi']), JSON.stringify(cast.slot_cast[0]?.raw_gonegi_characters));
  check('spirited_solo_character.resolved_count_is_1', cast.slot_cast[0]?.resolved_count === 1, `${cast.slot_cast[0]?.resolved_count}`);
  check('spirited_solo_character.resolved_name_is_gonegi', cast.slot_cast[0]?.resolutions[0]?.resolved?.name === 'Gonegi', cast.slot_cast[0]?.resolutions[0]?.resolved?.name);
  check('spirited_solo_character.dana_not_present', !cast.character_book_companion?.characters.some((c) => c.name === 'Dana'));
}

// =========================================================================
// visual_dna 실제 전달 확인
// =========================================================================
{
  const cast = resolveCharacterCastForSlots([titanicBowRun], library);
  const gonegiEntry = cast.character_book_companion?.characters.find((c) => c.name === 'Gonegi');
  const rawLibraryEntry = library.find((c) => c.name === 'Gonegi')!;
  check('visual_dna_delivery.gonegi_present', !!gonegiEntry);
  check('visual_dna_delivery.visual_dna_matches_raw_file_verbatim', gonegiEntry?.visual_dna === rawLibraryEntry.visual_dna);
  check('visual_dna_delivery.visual_dna_nonempty', !!gonegiEntry?.visual_dna && gonegiEntry.visual_dna.length > 100, `${gonegiEntry?.visual_dna.length}`);
  check('visual_dna_delivery.not_replaced_by_semantic_note', !gonegiEntry?.visual_dna.includes('freedom, romance, wonder') || gonegiEntry.visual_dna.includes('Ghibli'), 'visual_dna must be the real character appearance text, not the PBRP scene-anchor emotion/semantic_meaning text');
  // Direct read-back from the raw file, independent of the loader, to
  // confirm no transformation altered the text.
  const rawFileContent = fs.readFileSync(path.join(projectRoot, 'imports/character_image_anchors/slot_1-1/character_dna.json'), 'utf8');
  const rawParsed = JSON.parse(rawFileContent);
  check('visual_dna_delivery.matches_disk_file_independently_reread', gonegiEntry?.visual_dna === rawParsed.visual_dna);
}

// =========================================================================
// CharacterEntry 구조 검증
// =========================================================================
{
  const cast = resolveCharacterCastForSlots([titanicBowRun, spiritedRun], library);
  const companion = cast.character_book_companion!;
  check('character_entry_structure.deduplicated', companion.characters.length === 2, `${companion.characters.length} (expected Gonegi + Dana, deduplicated across both slots since Gonegi appears in both)`);
  for (const entry of companion.characters) {
    const keys = Object.keys(entry).sort();
    check(`character_entry_structure.${entry.name}.has_id`, 'id' in entry && typeof entry.id === 'string');
    check(`character_entry_structure.${entry.name}.has_name`, 'name' in entry && typeof entry.name === 'string');
    check(`character_entry_structure.${entry.name}.has_visual_dna`, 'visual_dna' in entry && typeof entry.visual_dna === 'string');
    check(`character_entry_structure.${entry.name}.has_type`, 'type' in entry && typeof entry.type === 'string');
    check(`character_entry_structure.${entry.name}.no_extraneous_keys`, keys.every((k) => ['id', 'name', 'visual_dna', 'master_image_id', 'elite_image_id', 'type', 'grid_position'].includes(k)), JSON.stringify(keys));
  }
  // Round-trip through JSON, matching the real handleImportJSON shape
  // `{characters: [...]}`, assigned directly and untransformed.
  const jsonText = JSON.stringify(companion);
  const reparsed = JSON.parse(jsonText) as { characters: AiStudioCharacterEntry[] };
  check('character_entry_structure.json_round_trip_stable', JSON.stringify(reparsed) === jsonText);
  check('character_entry_structure.has_characters_key_matching_real_import_shape', 'characters' in reparsed && Array.isArray(reparsed.characters));
}

// =========================================================================
// source contamination 검증 -- source-aware audit (items 6-7)
// =========================================================================
{
  const titanicAudit = auditConsistencyRuleAgainstSource(titanicBowRun.selection!, titanicBowRun.scene_context!.consistency);
  const spiritedAudit = auditConsistencyRuleAgainstSource(spiritedRun.selection!, spiritedRun.scene_context!.consistency);

  check('source_contamination.titanic_field_absent_as_expected', titanicAudit.anchor_generic_harbor_regression_field === null);
  check('source_contamination.titanic_matches_expectation', titanicAudit.field_matches_expectation === true);
  check('source_contamination.spirited_field_present_false', spiritedAudit.anchor_generic_harbor_regression_field === false);
  check('source_contamination.spirited_matches_expectation', spiritedAudit.field_matches_expectation === true);
  check('source_contamination.both_mention_harbor_identically', titanicAudit.hardcoded_wording_mentions_harbor === true && spiritedAudit.hardcoded_wording_mentions_harbor === true, 'confirms the fixed template is applied identically regardless of source -- the underlying mechanism found in the read-only analysis');

  // Fresh, independent read of the real project rules file -- not reused
  // from the prior conversation's analysis, re-verified here.
  const rulesPath = path.join(projectRoot, 'datasets/movie_reconstruction/world-translation-rules.json');
  let rulesContent: { forbidden_outcomes?: string[] } = {};
  try {
    rulesContent = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    check('source_contamination.project_rules_file_readable', true);
  } catch (e) {
    check('source_contamination.project_rules_file_readable', false, e instanceof Error ? e.message : 'read error');
  }
  const forbiddenOutcomes = rulesContent.forbidden_outcomes ?? [];
  const genericHarborListed = forbiddenOutcomes.some((o) => o.toLowerCase().includes('generic harbor'));
  check('source_contamination.generic_harbor_scene_is_real_forbidden_outcome', genericHarborListed, JSON.stringify(forbiddenOutcomes));

  // The actual, disclosed finding: the mechanism is source-agnostic by
  // construction (same rule_text object for every source), which is
  // confirmed here directly, not just asserted from memory.
  check('source_contamination.rule_text_identical_across_sources', titanicBowRun.scene_context!.consistency.rule_text === spiritedRun.scene_context!.consistency.rule_text);
  check('source_contamination.negative_rules_identical_across_sources', JSON.stringify(titanicBowRun.final_prompt!.negative_prompt) === JSON.stringify(spiritedRun.final_prompt!.negative_prompt));
}

// =========================================================================
// Unresolved-reference honesty check: a raw id with no real match must be
// reported, never silently dropped or guessed.
// =========================================================================
{
  const fakeLibrary: AiStudioCharacterEntry[] = [];
  const res = resolveCharacterByRawId(fakeLibrary, 'CHAR-nonexistent_character');
  check('unresolved_honesty.reports_null_not_fabricated', res.resolved === null);
  check('unresolved_honesty.note_discloses_reason', res.resolution_note.startsWith('UNRESOLVED:'), res.resolution_note);
}

// =========================================================================
// Deterministic 반복성
// =========================================================================
{
  const runs = Array.from({ length: 5 }, () => {
    const r1 = runPbrpRuntimeExecutionPreparation(projectRoot, TITANIC_BOW, 'ai_studio', 'titanic');
    const r2 = runPbrpRuntimeExecutionPreparation(projectRoot, SPIRITED_BATHHOUSE, 'ai_studio', 'spirited_away');
    const lib = loadCharacterVisualDnaLibrary(projectRoot);
    return JSON.stringify(resolveCharacterCastForSlots([r1, r2], lib));
  });
  check('determinism.5x_identical', runs.every((r) => r === runs[0]));
}

// =========================================================================
// Compliance
// =========================================================================
{
  const filesToScan = ['services/pbrpCharacterVisualDnaLibrary.ts', 'services/pbrpNativeScenarioAdapter.ts', 'services/pbrpKnowledgeComposer.ts', 'services/pbrpKnowledgeRepository.ts'];
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY|generateContent\(/i;
  for (const rel of filesToScan) {
    const content = fs.readFileSync(path.join(projectRoot, rel), 'utf8');
    check(`compliance.api_free.${rel}`, !apiPattern.test(content));
    const importLines = content.split('\n').filter((l) => /^\s*import\b/.test(l));
    check(`compliance.no_ai_studio_app_import.${rel}`, !importLines.some((l) => l.includes('AIStudio-App') || l.includes('Gonegi-AIStudio')));
    const usesSpatialGraphAPI = /parseRuntimeSpatialGraph\s*\(/.test(content) || /\bmovieDataset\s*[:=]/.test(content);
    check(`compliance.no_path_b.${rel}`, !usesSpatialGraphAPI);
  }
  // Confirm no write calls anywhere near the character library reader --
  // it must stay strictly read-only against imports/.
  const libSrc = fs.readFileSync(path.join(projectRoot, 'services/pbrpCharacterVisualDnaLibrary.ts'), 'utf8');
  check('compliance.character_library_has_no_write_calls', !libSrc.includes('writeFileSync') && !libSrc.includes('mkdirSync'));
}

// --- Report ---------------------------------------------------------------
const REPORT_PATH = 'reports/project_brain_integration/pbrp-character-visual-dna-integrity-v1-report.json';
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-004', generated_at: new Date().toISOString(), results, issues }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_004_V1' : 'FAIL_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_004_V1');
console.log([`total_checks=${checkCount}`, `pass_count=${checkCount - failCount}`, `fail_count=${failCount}`].join(' | '));

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
