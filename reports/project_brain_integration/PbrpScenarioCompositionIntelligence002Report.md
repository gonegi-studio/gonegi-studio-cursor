# Scene Ground-Truth Binding & Data Gap Resolution V1 Report

**Phase:** PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-002
**Verdict:** `PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_002_V1` — real Scene Ground Truth binding established in code, real conflicts detected (not resolved), real GAPs analyzed precisely and classified resolvable/not-resolvable, PASS→PASS regression confirmed against every existing PBRP verify script.

This phase turns PHASE-001's by-hand finding into a real, generic, read-only code module (`services/pbrpSceneGroundTruthBinder.ts`) and verifies it (`scripts/verify-pbrp-scenario-composition-intelligence-002.ts`, 53/53 checks). It does **not** modify `pbrpKnowledgeSelector.ts`, `pbrpKnowledgeComposer.ts`, `AIStudio-App/`, any `E:\PBRP\*.txt` contract file, or `project_brain/` — everything here is new, additive, and purely read-only against `datasets/`.

## 1–2. Real Scene Ground-Truth Binding (Titanic + Spirited Away)

`bindSceneGroundTruth(root, source, sceneId)` reads a scene's own real bindings first, before any emotion-based reasoning:

| Field | Titanic (`scene_titanic_02_dining_salon_008`) | Spirited Away (`scene_spirited_away_bathhouse_arrival_0001`) |
|---|---|---|
| Camera (real, scene-bound) | `titanic_cam_009` (`bindings.camera_pattern_id`) | `spirited_cam_0001` (`camera_id`) |
| Composition (real, scene-bound) | `titanic_comp_009` | `spirited_comp_0001` |
| Blocking (real, scene-bound) | `titanic_blk_009` | `spirited_blk_0001` |
| Primary anchor | `titanic_bow_pose` — `direct_field` (Titanic names exactly one anchor) | `bathhouse_arrival` — `scene_category_match` (see below) |

**Real schema difference confirmed and handled, not papered over**: Titanic scenes carry all three pattern ids inside one `bindings` object and name their anchor directly (`bindings.semantic_anchor_id`). Spirited Away scenes carry the three ids as flat top-level fields and list **two** semantic anchors per scene (`semantic_anchor_ids: [a, b]`) with no field marking either as primary. This phase's non-invented resolution rule: if the scene's own `scene_category` equals one of its two listed anchor ids, that one is primary (uses the scene's own real self-classification). Confirmed real for only **40 of 300** Spirited Away scenes — the primary anchor is genuinely `ambiguous_multiple_candidates` for the other 260, and the binder returns `null` rather than guessing.

**New finding this phase**: Spirited Away's own camera/composition/blocking registries carry a `scene_id` back-reference (Titanic's do not). Checked bidirectionally across all 300 scenes — **zero back-reference mismatches** found; every scene's forward reference and every pattern's own claimed owner agree.

## 3. Comparison against the existing emotion-keyword selector

Using the exact real inputs already verified in PHASE-001/004 (`"...freedom, romance and wonder..."` / `"...wonder and disorientation, bathhouse arrival..."`), `selectKnowledge()` (unmodified) still independently re-selects from the *separate* `*-shot-registry.json`:

| Scene | Ground truth (scene-bound) | Emotion selector (unmodified) | Diverges |
|---|---|---|---|
| Titanic | `titanic_comp_009` | `titanic_comp_001` (+ `shot_titanic_00078`) | ✅ confirmed |
| Spirited Away | `spirited_comp_0001` | `spirited_comp_0005` (+ `shot_spirited_00162`) | ✅ confirmed |

**Precise finding**: the ground truth's camera reference is a `camera_pattern_id` from `*-camera-registry.json`; the selector's shot reference is a `shot_id` from an entirely different registry, `*-shot-registry.json`. These are two non-overlapping id namespaces, not "right vs. wrong" — the `composition_id` namespace is the one genuinely shared between both paths, which is why `composition_diverges` is this phase's primary divergence signal.

Ground truth is never adjusted toward the selector's answer; `resolveGroundTruthSceneScenario()` treats the selector's output purely as an attached, disclosed comparison value.

## 4. Character/Blocking/Camera Conflict Detection

`detectSceneConflicts()` compares real sourced fields and reports both values — it never tie-breaks. Run across **every** scene in both registries (not just the two named test scenes):

| Conflict type | Titanic (30 scenes) | Spirited Away (300 scenes) |
|---|---|---|
| `EMOTION_ANCHOR_VS_BLOCKING` (anchor emotion vs. bound blocking's `emotion_staging`) | **26 / 30** | n/a (field doesn't exist on this source's blocking) |
| `EMOTION_ANCHOR_VS_SCENE` (primary anchor emotion vs. scene's own `emotion_state`) | n/a | **34 / 40** determinable scenes |
| `PARTICIPANT_ANCHOR_VS_BLOCKING` (anchor `participants` vs. blocking's real participant count) | **4 / 30** | **30 / 40** determinable scenes |
| `CAMERA_FRAMING_VS_ANCHOR_SOLO` (camera framing implies 2+ figures vs. solo anchor) | n/a (no such framing text on this source) | **5 / 40** determinable scenes |
| `AMBIGUOUS_PRIMARY_ANCHOR` (no field marks either listed anchor as primary) | 0 (Titanic is always unambiguous) | **260 / 300** |

Both named test scenes reproduce PHASE-001's disclosed conflicts exactly:
- Titanic `scene_titanic_02_dining_salon_008`: `EMOTION_ANCHOR_VS_BLOCKING` (`"freedom, romance, wonder"` vs. `"longing, social tension, destiny"`); participant count is consistent here (2 vs. 2) — correctly **not** flagged.
- Spirited Away `scene_spirited_away_bathhouse_arrival_0001`: `EMOTION_ANCHOR_VS_SCENE` (`"wonder, disorientation, courage"` vs. `"loneliness, longing, vulnerability"`), `PARTICIPANT_ANCHOR_VS_BLOCKING` (1 vs. 2), and `CAMERA_FRAMING_VS_ANCHOR_SOLO` (`medium_two_shot` vs. solo anchor).

**Honest scope note**: the 87%/85% conflict rates above show PHASE-001's two disclosed conflicts were not edge cases — they are the dataset's normal condition. `AMBIGUOUS_PRIMARY_ANCHOR` at 260/300 means cast/participant conflict-checking is only even possible for 40 of Spirited Away's 300 scenes today; the other 260 need a real primary-anchor field added upstream before conflict detection can run on them at all (not something this phase's own "no invention" boundary permits fabricating).

## 5. Location / Lighting / Gonegi Style DNA GAP — precise analysis + resolvable/not-resolvable verdict

### Location DNA (Titanic — per-scene; Spirited Away — structural)
Full 30-scene Titanic scan: **17/30 scenes** have a target location id with a real exact match in the 4 real location libraries; **13/30** do not, across only 3 recurring ids (`gonegi_harbor_lane_01`, `gonegi_olive_hill_01`, `gonegi_harbor_dock_01`).

**Precise new finding**: those 3 unmatched ids are not random — each has real, lexically-related sibling ids in the same library (e.g. `gonegi_harbor_lane_01` shares the token `harbor` with 18 real entries including `harbor_main_dock_01`, `village_harbor_road_01`, `stone_path_to_harbor_01`, and shares `lane` with `village_bakery_lane_01`/`shared_memory_lane_01`). **Verdict: NOT_RESOLVABLE** — no field anywhere links the `gonegi_`-prefixed scene-registry naming convention to the library's own unprefixed domain naming; adopting a lexical neighbor would be an invented mapping, not a resolution. Listed as candidates only.

Spirited Away: **structural, exhaustive** — `gonegi_translation` has no `target_location_id` key on any of the 300 real scenes. **Verdict: NOT_RESOLVABLE** — there is no real field to connect.

### Lighting DNA (downstream of, but distinct from, the Location gap)
Of Titanic's 17 scenes with a real matched location, only **8/17** also have a real lighting pairing in `lighting-dna-library-v1.json`'s 27-entry pairing table — `family_bakery_dining_01` and `dana_window_corner_01` are real, matched locations with **zero** real lighting pairing. **New precise finding**: a real Location match does not imply a real Lighting match; these are two independent gaps, not one gap with a single fix. Net: **8/30** Titanic scenes have full real Location+Lighting coverage; **22/30** do not. **Verdict: NOT_RESOLVABLE** without a new real pairing entry upstream.

### Gonegi Style DNA
Confirms PHASE-001's "not found anywhere" verdict and goes one level deeper: a file literally named `style_dna_bundle.json` **does** exist in this repository, but only inside `datasets/repository_intelligence/cleanup-rollback-snapshot-v1/` — a backup snapshot of files deleted from the live `exports/` tree during a prior, user-approved cleanup (its own `rollback_snapshot_manifest.json` confirms this file's original path was `exports/image_app/latest_v5/style_dna_bundle.json`, not live today). Read on its own content merits, it is **not** a visual Style DNA library either — its only real content is `embedded_adapters` referencing Music Drama Grammar Core sections (`consumption_mode: "reference_only"`, `generates_prompts: false`), with zero color/palette/texture/render-style fields. **Verdict: NOT_RESOLVABLE** — neither fact (archived location, non-visual content) closes the gap.

## 6. Provenance

Every binding's `provenance` map cites the real file path + real id it read (`datasets/movie_reconstruction/{titanic,spirited_away}/*.json`); verified by direct string check in the verify script. No field in this module's output is written back into any source dataset — everything is read-only.

## 7. PASS → PASS Regression

- `services/pbrpKnowledgeSelector.ts` and `services/pbrpKnowledgeComposer.ts` are untouched and contain zero references to the new module (checked by source-text grep in the verify script).
- Every pre-existing PBRP verify script re-run after this phase's changes still passes unmodified:

| Script | Result |
|---|---|
| `verify:pbrp-runtime-execution-preparation-v1` | `PASS_PROJECT_BRAIN_INTEGRATION_005_RUNTIME_EXECUTION_PREPARATION_V1` |
| `verify:pbrp-runtime-validation-v1` | `PASS_PROJECT_BRAIN_INTEGRATION_006_PBRP_RUNTIME_VALIDATION_V1` (82/82) |
| `verify:pbrp-native-scenario-adapter-v1` | `PASS_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_001_V1` (29/29) |
| `verify:pbrp-native-scenario-consumer-validation-v1` | `PASS_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_002_AUTOMATED_ITEMS_V1` (34/34) |
| `verify:pbrp-character-visual-dna-integrity-v1` | `PASS_PBRP_AI_STUDIO_NATIVE_SCENARIO_ADAPTER_004_V1` (56/56) |
| This phase's own new script | `PASS_PBRP_SCENARIO_COMPOSITION_INTELLIGENCE_002_V1` (53/53) |

`resolveGroundTruthSceneScenario()` run twice for each test scene produces byte-identical JSON (deterministic).

## Compliance

| 조건 | Status |
|---|---|
| 데이터 발명 금지 | No value in this module is fabricated; missing data stays `null`/`resolvable:false` with a cited reason |
| 충돌 임의 해결 금지 | `detectSceneConflicts()` only detects and reports both real values — never merges or tie-breaks |
| 없는 Location/Lighting/Style 생성 금지 | Confirmed absent; near-name candidates are listed, never adopted |
| AI Studio 수정 금지 | Not touched |
| PBRP Contract 수정 금지 | `E:\PBRP\*.txt` not touched; not imported |
| Project Brain 원본 수정 금지 | `project_brain/` untouched; all dataset reads read-only |
| Path-B 금지 | No `parseRuntimeSpatialGraph`/`movieDataset` usage (checked by regex in verify script) |
| API 금지 | No network/LLM call pattern present (checked by regex in verify script) |

## Deliverables

| Artifact | Role |
|---|---|
| `services/pbrpSceneGroundTruthBinder.ts` | New, additive, read-only module: scene binding, conflict detection, Location/Lighting/Style GAP analysis, emotion-selector comparison, dataset-wide scans |
| `scripts/verify-pbrp-scenario-composition-intelligence-002.ts` | 53-check verification (binding, comparison, conflict detection, GAP detection, provenance, PASS→PASS regression, compliance) |
| `reports/project_brain_integration/pbrp-scenario-composition-intelligence-002-report.json` | Machine-readable check results + full dataset-wide scan output |
| `reports/project_brain_integration/PbrpScenarioCompositionIntelligence002Report.md` | This document |
