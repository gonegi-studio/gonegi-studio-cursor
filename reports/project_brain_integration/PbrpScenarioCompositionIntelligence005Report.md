# AI Studio Ready Scenario Output V1 Report

**Phase:** PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-005
**Verdict:** `PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_005_V1` (38/38 checks) — PHASE-004's Production Scenario now converts into the same real, confirmed AI Studio Native Scenario JSON schema PHASE-ADAPTER-001 verified, with real Character Visual DNA, real scene-bound Camera/Composition/Blocking, real-only Location/Lighting, and every gap kept as an explicit `NOT_DERIVABLE`.

`services/pbrpNativeScenarioFromProductionAdapter.ts` is new and purely additive. It imports `pbrpProductionScenarioAssembler.ts` (PHASE-004) and reuses `pbrpNativeScenarioAdapter.ts`'s real, already-verified TYPES (`NativeScenarioDocument`/`NativeScenarioSlot`/`CharacterBookCompanion`) without modifying that file or any of its own functions — it is a second, parallel path into the identical real schema, not a replacement.

## 1. Uses PHASE-004's Production Scenario

Both test scenes' `ProductionScenario` objects (built via PHASE-004's `buildProductionScenario`, which itself runs PHASE-002/003's ground-truth-priority pipeline) are the sole input — nothing is re-derived from raw registries in this phase.

## 2. Real Character Visual DNA included

Unlike `pbrpNativeScenarioAdapter.ts`'s original `character` field (deliberately semantic/emotional PBRP data only, explicitly not `visual_dna` — a boundary that module's own header states), this phase's `character` field carries the real, verbatim `visual_dna` text PHASE-004 already resolved. Confirmed for both test scenes: Titanic's slot includes `"Soulful and determined 11yo boy..."` (Gonegi) and Dana's full description; Spirited Away's slot includes both Gonegi and Dana (per PHASE-003/004's cast-authority correction). This is a disclosed, deliberate difference from the older adapter, not a silent reinterpretation of it — both paths now coexist, serving different real callers.

## 3. Camera/Composition/Blocking included

Folded into `scenario`/`finalPrompt` via PHASE-004's `final_text` (the real schema has no dedicated camera/composition/blocking fields — confirmed by PHASE-ADAPTER-001's own exhaustive schema analysis — so, same as PHASE-001's original hand-composed scenario, this content lives in the free-text scenario field, not a fabricated new field).

## 4–5. Real-only Location/Lighting, NOT_DERIVABLE preserved

Both test scenes correctly disclose `Location: NOT_DERIVABLE: ...` and `Style: NOT_DERIVABLE` inside `scenario`, and an honest `"NOT_DERIVABLE: ..."` string in `timeSetting` (a confirmed non-generation-driving, round-tripped free-text field — safe to carry an honest disclosure without steering any real app behavior). `artStyle` is instead **omitted** entirely (not string-marked), matching PHASE-ADAPTER-001's own original precedent for a field the real app could actually apply as-is — a marker string there would be actively misleading if literally applied as the chosen art style. Verified the reverse path too: a third scene with a real Location+Lighting match produces a real `timeSetting` (`"Sunrise Bakery Bedroom: soft pink morning mist..."`), proving the "use only when real" rule works both ways.

## 6. AI Studio Native Scenario format

Validated against the same faithful, read-only reproduction of the real `handleImportScenarioJSON` logic PHASE-ADAPTER-001 built and verified (not imported, not modified): the output document is recognized, its slot count and pass-through behavior (`if (s.versions) return s`) match exactly, and it survives a full JSON round-trip and is still recognized identically.

## 7. Provenance

Every slot's `slot_sources` entry cites `PHASE-004` and the real `scene_id`, and explicitly states the `character` field's source is `visual_dna` (not semantic/emotional data) — disclosing the deliberate difference from the older adapter inline in the output's own metadata, not only in this report.

## A real bug found and fixed during this phase's own testing

`scene_titanic_02_crowd_departure_005`'s real anchor (`titanic_deck_to_interior_transition`) has **no `gonegi_characters` field at all** in `titanic-semantic-anchor-registry.json` — a genuine, structural data gap, not a bug. The first draft of this adapter's validation treated an empty resolved cast as a hard rejection (`MISSING_CHARACTER_DIRECTION`), which would have blocked an otherwise-valid scenario from producing any Native Scenario output at all — inconsistent with how this same phase already treats Location/Lighting/Style gaps (disclose as `NOT_DERIVABLE`, don't reject the whole scenario). Fixed: an empty cast is no longer a validation error; `buildCharacterField()` now emits `"NOT_DERIVABLE: <real cast_source_note>"` instead, consistent with every other gap in this pipeline.

Also fixed a naive substring check in this phase's own verify script: checking for the bare substring `location_id` would have false-positived on the honest NOT_DERIVABLE disclosure text itself (`"...has no target_location_id key..."`) — the same self-referential false-positive class flagged in earlier phases. Corrected to check for an actual fabricated JSON key (`"location_id":`), not any mention of the word.

## Verification

| Check | Titanic | Spirited Away |
|---|---|---|
| Native Scenario structure recognized by real import logic | ✅ | ✅ |
| Real Character Visual DNA in `character` field | ✅ Gonegi + Dana, verbatim | ✅ Gonegi + Dana, verbatim |
| `timeSetting` discloses real gap | ✅ `NOT_DERIVABLE: ...` | ✅ `NOT_DERIVABLE: ...` |
| `scenario` discloses Location/Style gaps | ✅ | ✅ |
| `artStyle` fabricated | ❌ (correctly omitted) | ❌ (correctly omitted) |

004 + core existing regression: `verify:pbrp-scenario-composition-intelligence-004` (46/46), `-003` (50/50), `-002` (53/53), `verify:pbrp-runtime-validation-v1` (82/82), `verify:pbrp-character-visual-dna-integrity-v1` (56/56), and `verify:pbrp-native-scenario-adapter-v1` (29/29, the older, still-untouched adapter) all re-verified green.

## Compliance

| 금지 | Status |
|---|---|
| 데이터 발명 | No value fabricated; `artStyle` omitted rather than string-marked, per the field's own real generation-relevance |
| 기존 데이터 수정 | Read-only; `pbrpNativeScenarioAdapter.ts`, `pbrpProductionScenarioAssembler.ts`, and every prior phase's module confirmed untouched |
| AI Studio 코드 수정 | Not touched |
| PBRP Contract 수정 | `E:\PBRP\*.txt` not touched |
| Project Brain 수정 | `project_brain/` untouched |
| Path-B/API 추가 | No network/LLM call pattern; no `parseRuntimeSpatialGraph`/`movieDataset` usage |

## Deliverables

| Artifact | Role |
|---|---|
| `services/pbrpNativeScenarioFromProductionAdapter.ts` | New, additive module: PHASE-004 Production Scenario -> real AI Studio Native Scenario JSON |
| `scripts/verify-pbrp-scenario-composition-intelligence-005.ts` | 38-check verification |
| `reports/project_brain_integration/pbrp-scenario-composition-intelligence-005-report.json` | Machine-readable results + full sample Native Scenario document |
| `reports/project_brain_integration/PbrpScenarioCompositionIntelligence005Report.md` | This document |
