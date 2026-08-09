# Production Scenario Assembly V1 Report

**Phase:** PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-004
**Verdict:** `PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_004_V1` (46/46 checks) — PHASE-002/003's Ground Truth and Reconciliation results are now connected into one real, code-generated Production Scenario, for both real test scenes.

`services/pbrpProductionScenarioAssembler.ts` is new and purely additive: it imports PHASE-002 (`pbrpSceneGroundTruthBinder.ts`), PHASE-003 (`pbrpSceneDataReconciliation.ts`), and `pbrpCharacterVisualDnaLibrary.ts` read-only. `pbrpKnowledgeSelector.ts`, `pbrpKnowledgeComposer.ts`, and every prior phase's module remain unmodified — confirmed by the verify script's source-text checks.

## 1. Scene-aware selection result used

Every scenario is built via `resolveSceneAwarePriority()` (PHASE-003) first — camera/composition/blocking come from the scene's own real ground-truth binding whenever it resolves, and the emotion-keyword selector's independently-computed answer is discarded (recorded only for the divergence check). Confirmed for both test scenes: the applied composition id differs from what the unmodified selector would have picked on its own.

## 2. Real Character Visual DNA connected

`buildCharacterDirection()` resolves every real cast id named by the scene's listed anchor(s) against the real `imports/character_image_anchors/*/character_dna.json` library (via the existing, unmodified `resolveCharacterByRawId`), and includes the full, verbatim `visual_dna` text — not a summary or paraphrase.

**A real, disclosed refinement surfaced here**: for the Spirited Away test scene, PHASE-001 originally reported "Gonegi only" as cast (using only the `bathhouse_arrival` anchor's `gonegi_characters: ["CHAR-gonagi"]`). PHASE-003's cast-authority analysis later proved `bridge_crossing` (`gonegi_characters: ["CHAR-gonagi", "CHAR-dana"]`) is equally, genuinely real for this exact scene — so this assembler includes the **union** of both real anchors' cast, resolving to **Gonegi AND Dana**, both fully matched to real Visual DNA. This is a disclosed correction carried through from PHASE-003, not a new arbitrary choice.

## 3. Real Camera/Composition/Blocking connected

Each direction is built from the scene's own real, scene-bound registry entry (`titanic_cam_009`/`titanic_comp_009`/`titanic_blk_009` for the Titanic scene; `spirited_cam_0001`/`spirited_comp_0001`/`spirited_blk_0001` for Spirited Away), formatted as fixed-label joins of real field values only — no adjective, mood word, or description beyond what each field's own real value already states.

## 4–5. Location/Lighting used only when real, NOT_DERIVABLE otherwise

Both primary test scenes exercise the `NOT_DERIVABLE` path (Titanic's `gonegi_harbor_lane_01` has no real library match; Spirited Away has no `target_location_id` field at all — both carry their exact PHASE-002/003 gap reason in the output, never a bare "NOT_DERIVABLE"). To prove the *other* direction isn't dead code, a third scene (`scene_titanic_02_crowd_departure_005`, real `target_location_id: gonegi_bedroom_01`) was verified to produce real `DERIVED` text for both Location (`"Gonegi Bedroom (domestic_interior): low wooden bed frame, sun-washed whitewash walls, ..."`) and Lighting (`"Sunrise Bakery Bedroom: soft pink morning mist..."`, using PHASE-003's corrected `location_affinity`-aware lookup) — real field text only, and Style remained correctly `NOT_DERIVABLE` even though Location/Lighting resolved, proving one gap resolving doesn't cause another to be fabricated.

## 6. Final Production Scenario

`buildFinalText()` assembles a fixed, seven-line, labeled template (`Character:`/`Blocking:`/`Camera:`/`Composition:`/`Location:`/`Lighting:`/`Style:`) — a deterministic join of only the real values already computed above, deliberately not an embellished prose composition (unlike PHASE-001's manually-written narrative), since this is now reusable, unattended code rather than a one-off hand composition.

## Conflict reconciliation carried through, not silently re-decided

Reused PHASE-002's `detectSceneConflicts` and PHASE-003's `detectDualAnchorConflicts`, reconciled via `net_conflicts` (every conflict stays visible; a `corrected_by_dual_anchor_check` flag marks — never deletes — an entry the more precise dual-anchor check clears). Found and fixed one subtlety during this phase's own testing: the dual-anchor emotion check must compare against the *same independent signal* PHASE-002's own check used (blocking's `emotion_staging` for Titanic, scene's `emotion_state` for Spirited Away) — not Titanic's `bindings.emotion`, which is a verbatim mirror of the anchor's own emotion and would trivially "clear" an unrelated real conflict. Verified: Titanic's real anchor-vs-blocking emotion conflict remains correctly unresolved; Spirited Away's real participant conflict is correctly marked `corrected_by_dual_anchor_check: true` (bridge_crossing's own real `participants: 2` matches the blocking data) while still visible in `net_conflicts`, and its emotion + camera-framing conflicts remain correctly unresolved.

## 7. Provenance

Every scenario's `provenance` map cites the exact real source for each direction (`pbrpSceneDataReconciliation` provenance string for priority, the anchor(s) used for cast, the exact registry file + id for camera/composition/blocking, the gap reason or matched file+ids for location/lighting, and PHASE-002/003's final style verdict text for style).

## Verification

| Check | Titanic (`scene_titanic_02_dining_salon_008`) | Spirited Away (`scene_spirited_away_bathhouse_arrival_0001`) |
|---|---|---|
| Ground Truth priority applied | ✅ `titanic_comp_009` (selector would have picked `titanic_comp_001`) | ✅ `spirited_comp_0001` (selector would have picked `spirited_comp_0005`) |
| Visual DNA included | ✅ Gonegi + Dana, full verbatim text | ✅ Gonegi + Dana, full verbatim text |
| NOT_DERIVABLE confirmed | ✅ Location, Lighting, Style — each with its exact real reason | ✅ Location, Lighting, Style — each with its exact real reason |
| Conflict preserved | ✅ `EMOTION_ANCHOR_VS_BLOCKING` | ✅ `EMOTION_ANCHOR_VS_SCENE`, `CAMERA_FRAMING_VS_ANCHOR_SOLO` |
| Determinism | ✅ identical JSON across repeated runs | ✅ |

Basic regression: `pbrpKnowledgeSelector.ts`/`pbrpKnowledgeComposer.ts`/PHASE-002/003's modules confirmed untouched; PHASE-002 (53/53), PHASE-003 (50/50), `verify:pbrp-runtime-validation-v1` (82/82), and `verify:pbrp-character-visual-dna-integrity-v1` (56/56) all re-verified green.

## Compliance

| 금지 | Status |
|---|---|
| 데이터 발명 | No value fabricated; every text field is a fixed-label join of real, cited values or an explicit `NOT_DERIVABLE` with a real reason |
| 기존 원본 데이터 수정 | All reads are read-only |
| AI Studio 수정 | Not touched |
| Project Brain 수정 | `project_brain/` untouched |
| PBRP Contract 수정 | `E:\PBRP\*.txt` not touched |
| API 추가 | No network/LLM call pattern present |
| Path-B 구현 | No `parseRuntimeSpatialGraph`/`movieDataset` usage |

## Deliverables

| Artifact | Role |
|---|---|
| `services/pbrpProductionScenarioAssembler.ts` | New, additive module: connects PHASE-002/003 outputs + real Character Visual DNA into one final Production Scenario |
| `scripts/verify-pbrp-scenario-composition-intelligence-004.ts` | 46-check verification |
| `reports/project_brain_integration/pbrp-scenario-composition-intelligence-004-report.json` | Machine-readable results + full sample scenario output for both test scenes and the positive-location demo scene |
| `reports/project_brain_integration/PbrpScenarioCompositionIntelligence004Report.md` | This document |
