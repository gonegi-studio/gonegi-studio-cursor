# RKB-006 Coverage Validation Report

**Phase:** PHASE-RKB-006
**Test:** COVERAGE_VALIDATION
**Generated:** 2026-06-03T07:07:24.501Z
**Baselines:** RKB-004, RKB-005, pre-SHOT-GRAMMAR
**Final Verdict:** PASS_RKB_006_COVERAGE_VALIDATION

## Precheck

- Shot Grammar verdict: PASS_CINEMATIC_COVERAGE_GRAMMAR_V1
- RKB-004 verdict: PASS_RKB_004_INDOOR_LOCATION_VALIDATION
- RKB-005 verdict: PASS_RKB_005_LIGHTING_VALIDATION
- Latest adapter present: true
- Precheck: PASS

## Test Method

- 4 representative scenes × 10 generations = 40 test renders
- Scene A: Gonegi bakery morning
- Scene B: Dana window reading
- Scene C: Harbor dock activity
- Scene D: Olive hill lunch
- Held constant: character, location, lighting_anchor, scene_goal
- Varied: coverage sequence step, camera position, shot progression

## Adapter Consumption Check

| Metric | Value |
| --- | --- |
| Pass | 40 |
| Fail | 0 |
| Verdict | PASS |

Required tokens: `coverage-id:`, `shot-type:`, `coverage-step:`, `coverage-purpose:`, `forbidden-repeat:`, `anchor-visibility:`

## Medium Chain Reduction

| Metric | Value |
| --- | --- |
| Pre-SHOT triple-medium chains (total) | 32 |
| RKB-006 triple-medium chains (total) | 0 |
| Reduction rate | 100% |
| Target | >80% |
| Met | YES |

## Aggregate Coverage Diversity

| Pre-SHOT | RKB-006 | Improvement |
| ---: | ---: | ---: |
| 0.14 | 0.68 | +0.54 |

## Per-Scene Review

### Gonegi bakery morning (`scene_a`)

- Coverage: `coverage_pattern_01_establishing_insert_reaction`
- Sequence: establishing → medium → insert → reaction → wide
- Unique shot types: establishing, medium, insert, reaction, wide
- Medium triple chains: 0 (pre-SHOT baseline 8)
- Adapter consumption: 10/10 PASS
- Scene pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Coverage Diversity | PASS |
| Medium Chain Reduction | PASS |
| Cinematic Feel | PASS |
| Anchor Preservation | PASS |

### Dana window reading (`scene_b`)

- Coverage: `coverage_pattern_03_pov_insert_chain`
- Sequence: wide → insert → pov → reaction → medium
- Unique shot types: wide, insert, pov, reaction, medium
- Medium triple chains: 0 (pre-SHOT baseline 8)
- Adapter consumption: 10/10 PASS
- Scene pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Coverage Diversity | PASS |
| Medium Chain Reduction | PASS |
| Cinematic Feel | PASS |
| Anchor Preservation | PASS |

### Harbor dock activity (`scene_c`)

- Coverage: `coverage_pattern_02_environmental_close`
- Sequence: wide → environmental → medium → close → reaction
- Unique shot types: wide, environmental, medium, close, reaction
- Medium triple chains: 0 (pre-SHOT baseline 8)
- Adapter consumption: 10/10 PASS
- Scene pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Coverage Diversity | PASS |
| Medium Chain Reduction | PASS |
| Cinematic Feel | PASS |
| Anchor Preservation | PASS |

### Olive hill lunch (`scene_d`)

- Coverage: `coverage_pattern_02_environmental_close`
- Sequence: wide → environmental → medium → close → reaction
- Unique shot types: wide, environmental, medium, close, reaction
- Medium triple chains: 0 (pre-SHOT baseline 8)
- Adapter consumption: 10/10 PASS
- Scene pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Coverage Diversity | PASS |
| Medium Chain Reduction | PASS |
| Cinematic Feel | PASS |
| Anchor Preservation | PASS |

## Success Condition

- Coverage diversity exceeds pre-SHOT baseline; medium chains reduced >80%; location and lighting retained
- Result: **4/4** scenes — MET

## Next Phase

**EDA-001** — EMOTION_ACTING_DNA_V1

