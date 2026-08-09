# Scene Data Reconciliation & Ground-Truth Integration V1 Report

**Phase:** PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-003
**Verdict:** `PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_003_V1` (50/50 checks) — Scene Ground Truth is now wired into PBRP's selection path with an explicit priority rule, every real conflict is preserved (never auto-resolved), and every PHASE-002 GAP has been re-verified — including two real corrections to PHASE-002's own analysis, disclosed below rather than silently fixed.

`services/pbrpSceneDataReconciliation.ts` is new and purely additive: it imports PHASE-002's `pbrpSceneGroundTruthBinder.ts` read-only and never modifies `pbrpKnowledgeSelector.ts` or `pbrpKnowledgeComposer.ts`. AI Studio, `project_brain/`, and `E:\PBRP\*.txt` remain untouched.

## Correcting PHASE-002: two findings this phase overturned

This phase's own "재검증" instruction surfaced two real mistakes in PHASE-002's report, both disclosed here rather than quietly patched:

1. **Lighting DNA**: PHASE-002 checked only `lighting-dna-library-v1.json`'s `section_4_location_pairing.pairings` table and concluded `family_bakery_dining_01` had zero real lighting connection. It missed a second real field in the *same file* — each `lighting_profiles[]` entry has its own `location_affinity` array, and `sunrise_bakery_bedroom`'s real `location_affinity` already includes `family_bakery_dining_01`. Corrected Titanic coverage: **13/30 scenes** now have a real Location+Lighting match (was 8/30 under PHASE-002's incomplete check) — only `dana_window_corner_01` remains genuinely unresolved by any real field in either the pairing table or every profile's `location_affinity`.
2. **Gonegi Style DNA**: PHASE-002 concluded `style_dna_bundle.json` was "not live" because it appears in `cleanup-rollback-snapshot-v1`. Verified this phase: the file is confirmed **live** at `exports/image_app/latest_v5/style_dna_bundle.json` — git-tracked, not pending deletion, last modified 2026-06-14 (before the snapshot was even taken on 2026-06-29), and absent from the real cleanup-execution record (`project-repository-safe-cleanup-execution-v1.json`). The rollback snapshot records cleanup *candidates*, not confirmed deletions. Its content classification is unchanged: still a Music Drama Grammar Core adapter/reference bundle, not a visual Style DNA library — so the gap verdict is unchanged, but the *reason* was wrong and is corrected here.

## 1–2. Scene-bound binding wired into PBRP's selection path, with explicit priority

`resolveSceneAwarePriority()` is the new entry point: it always resolves a scene's real ground-truth binding first; if it resolves, camera/composition/blocking are applied from it unconditionally, and the emotion-keyword selector (`selectKnowledge()`, unmodified) is run purely for comparison, never applied. This is a fixed, disclosed, deterministic rule — not a per-call choice:

| Scene | Applied registry | Applied composition | Emotion selector's own answer | Priority reason |
|---|---|---|---|---|
| Titanic (`..._dining_salon_008`) | `scene_ground_truth` | `titanic_comp_009` | `titanic_comp_001` (discarded) | `GROUND_TRUTH_RESOLVED_AND_APPLIED` |
| Spirited Away (`..._bathhouse_arrival_0001`) | `scene_ground_truth` | `spirited_comp_0001` | `spirited_comp_0005` (discarded) | `GROUND_TRUTH_RESOLVED_AND_APPLIED` |
| Nonexistent scene id (guard test) | `emotion_keyword_selector` | selector's own answer | — | `GROUND_TRUTH_UNAVAILABLE_FALLBACK_TO_EMOTION_SELECTOR` (explicitly disclosed, not silent) |

## 3. Character/Blocking/Camera conflict — explicit state, never auto-resolved

`buildConflictState()` wraps PHASE-002's conflict list into `{ has_unresolved_conflicts, conflicts, resolution_policy: 'NONE_AUTO_RESOLVED' }` — both real values of every conflict are carried forward untouched; confirmed both test scenes still carry `has_unresolved_conflicts: true`.

**Correction to PHASE-002's own conflict-checking precision**: PHASE-002 compared each scene against one heuristically-chosen "primary" anchor, which left 260/300 Spirited Away scenes entirely unchecked (`AMBIGUOUS_PRIMARY_ANCHOR`). This phase's `detectDualAnchorConflicts()` instead checks a scene's real blocking/emotion data against **all** of its real listed anchors, flagging a conflict only when *neither* real anchor agrees — strictly more accurate, and still zero invention. For the Spirited Away test scene, checking against both real anchors (`bathhouse_arrival` AND `bridge_crossing`) shows the participant count (2) genuinely matches `bridge_crossing`'s own real `participants: 2` — so this is not a hard, unresolvable conflict once the correct comparison set is used, and is now reported that way rather than as a flat mismatch against one arbitrarily-chosen anchor.

## 4. Titanic Location 13 GAP — re-verification

Re-checked the 3 unmatched target location ids (`gonegi_harbor_lane_01`, `gonegi_harbor_dock_01`, `gonegi_olive_hill_01`) against every real source in the repository, including one PHASE-002 never checked: `services/shotGrammar.ts` (an unrelated RKB-006 Coverage Grammar subsystem) has its own private `LOCATION_ID_TO_TYPE` constant that independently uses **the exact same ids**:

| Location id | Location DNA library | shotGrammar.ts cross-reference | Verdict |
|---|---|---|---|
| `gonegi_harbor_dock_01` | no exact match | `exterior_harbor` (real, coarse type) | Coarse type **resolvable**; full DNA (visual/architectural/color anchors) still NOT_RESOLVABLE |
| `gonegi_olive_hill_01` | no exact match | `exterior_hill` (real, coarse type) | Coarse type **resolvable**; full DNA still NOT_RESOLVABLE |
| `gonegi_harbor_lane_01` | no exact match | not present in that map either | Remains fully NOT_RESOLVABLE — no real source anywhere names this exact id |

This module never imports `shotGrammar.ts` (verified by the verify script's compliance check) — the cross-reference is a disclosed, verbatim, read-only reproduction of that file's real constant, kept static rather than a live dependency, since the two subsystems are otherwise unrelated.

## 5. Lighting pairing GAP — precision correction

See the correction above. `reanalyzeLightingGapWithAffinity()` unions `section_4_location_pairing.pairings` and every `lighting_profiles[].location_affinity` array. Net effect: Titanic's real Location+Lighting-covered scene count corrects from **8/30 to 13/30**; `dana_window_corner_01` is the only real, matched location with genuinely zero lighting connection via either field, confirmed by an exhaustive text search of the entire lighting library (0 occurrences).

## 6. Spirited Away 260 ambiguous cast — authoritative source analysis

Went one level more granular than PHASE-002: `spirited-away-shot-registry.json` gives each of a scene's 8 real shots its own real, singular `semantic_anchor_id` (and a real `scene_id` back-reference, same pattern as camera/composition/blocking). Aggregating this across **all 300 scenes / 2,400 real shots**:

- **0 of 300** scenes have a determinable single scene-level authoritative anchor.
- **300 of 300** scenes genuinely and evenly use **both** of their listed anchors — exactly 4 of 8 shots each, with zero exceptions.
- **100% of the 2,400 real shots** have their own unambiguous, non-null `semantic_anchor_id` — full authority exists, but only at shot granularity.

**Answer to item 6**: an authoritative source determination is **not possible at scene level for any scene** (not just the 260 PHASE-002 flagged) — real data refutes the premise that a single scene-level primary anchor exists, rather than merely lacking evidence for one. It **is** fully possible at shot level, for every real shot. This also means PHASE-002's `scene_category`-match heuristic (which did pick one id for 40/300 scenes) was a real, disclosed, valid choice, but never an *exclusive* one — the anchor it didn't pick is equally real and equally used for that same scene.

## 7. Gonegi Style DNA — final usable-source verification

Broadened the search beyond PHASE-002's `datasets/`-only scope to include `exports/`, and re-verified every prior candidate:

| Candidate | Status |
|---|---|
| Structured, Gonegi-world-keyed Style DNA library | Confirmed absent, `datasets/` and `exports/` both checked |
| `style_dna_bundle.json` | Confirmed **live** (correction above); content still a grammar/adapter reference bundle, not visual style DNA |
| `exports/source_video_dna/visual-style-numerical-dna/*.json` | Real, structured numerical curves (color/saturation/contrast/brightness/lighting/shadow/color-temperature/fog/depth) for 16 source videos — but keyed by `source_video_id` (e.g. `GHIBLI_01`, `TITANIC_02`), never by a Gonegi-world identity; answers "what did the source movie look like," not "what should Gonegi-world renders look like" |
| `datasets/generation_context/approved_originals/artstyle-approved.txt` | Real, live, single global plain-text style description, loadable via the real `services/approvedOriginalsLoader.ts` — but unstructured (no per-id/per-scene schema) and its only confirmed real consumers are `movie_spatial` (Path-B) exports; PBRP has never consumed it, and wiring it in now would cross this phase's own Path-B boundary, so it is reported, not integrated |

**Final verdict, unchanged from PHASE-002 but now for the right, fully-checked reasons**: NOT_RESOLVABLE for PBRP's Style Direction slot as scoped. No data was generated to fill this gap.

## 8. Provenance

Every reconciliation result cites its real source: `resolveSceneAwarePriority()`'s `provenance` string names the exact scene id and binder; `reverifyLocationConnection()`'s `verdict_note` names `services/shotGrammar.ts` explicitly when used; `reanalyzeLightingGapWithAffinity()`'s `correction_note` names exactly what PHASE-002 checked vs. what this phase added. Verified by direct string assertions in the verify script.

## PASS → PASS Regression

- `pbrpKnowledgeSelector.ts`, `pbrpKnowledgeComposer.ts`, and PHASE-002's `pbrpSceneGroundTruthBinder.ts` are all confirmed to contain zero references to this phase's new module.
- PHASE-002's own verify script re-run: `PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_002_V1` (53/53).
- `verify:pbrp-runtime-validation-v1`: 82/82 unchanged.
- `verify:pbrp-character-visual-dna-integrity-v1`: 56/56 unchanged.
- This phase's own dataset-wide scans (30 Titanic scenes, 300 Spirited Away scenes, 2,400 Spirited Away shots) reproduce the same totals every run.

## Compliance

| 조건 | Status |
|---|---|
| 데이터 발명 금지 | No value fabricated; corrections cite the exact real field that was missed, not a guess |
| 충돌 임의 해결 금지 | `buildConflictState`/`detectDualAnchorConflicts` only detect and disclose; no merge/tie-break |
| 후보 Location 자동 채택 금지 | shotGrammar.ts cross-reference is reported as a coarse-type fact only, never adopted as full Location DNA |
| Style DNA 생성 금지 | Confirmed absent; the one real global text candidate is disclosed, not synthesized into a DNA-shaped library |
| AI Studio 수정 금지 | Not touched |
| Project Brain 수정 금지 | `project_brain/` untouched |
| PBRP Contract 수정 금지 | `E:\PBRP\*.txt` not touched |
| Path-B 금지 | No `parseRuntimeSpatialGraph`/`movieDataset` usage; `artstyle-approved.txt`'s Path-B-adjacent usage history is reported, not integrated into |
| API 금지 | No network/LLM call pattern present |

## Deliverables

| Artifact | Role |
|---|---|
| `services/pbrpSceneDataReconciliation.ts` | New, additive module: priority-aware selection, conflict-state preservation, dual-anchor conflict detection, Location/Lighting GAP re-verification, cast-authority analysis, final Style DNA verification |
| `scripts/verify-pbrp-scenario-composition-intelligence-003.ts` | 50-check verification |
| `reports/project_brain_integration/pbrp-scenario-composition-intelligence-003-report.json` | Machine-readable results |
| `reports/project_brain_integration/PbrpScenarioCompositionIntelligence003Report.md` | This document |
