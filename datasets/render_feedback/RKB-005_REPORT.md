# RKB-005 Lighting Validation Report

**Phase:** PHASE-RKB-005
**Test:** LIGHTING_VALIDATION
**Generated:** 2026-06-03T06:21:56.606Z
**Baselines:** RKB-003, RKB-004
**Final Verdict:** PASS_RKB_005_LIGHTING_VALIDATION

## Precheck

- Library present: true
- Adapter present: true
- LTD-005 verdict: PASS_LIGHTING_ANCHOR_BUNDLE_V1
- Precheck: PASS

## Test Method

- 8 lighting anchors × 10 generations = 80 shots
- Held constant: character, location, lighting_anchor_id
- Varied: camera angle, action, shot type

## Adapter Consumption Check

| Metric | Value |
| --- | --- |
| Pass | 80 |
| Fail | 0 |
| Verdict | PASS |

Required tokens: `lighting-anchor:`, `key-light:`, `shadow:`, `color-temp:`, `lighting-spatial:`

## Aggregate Comparison

| Metric | RKB-003 | RKB-004 | RKB-005 | Δ vs 003 | Δ vs 004 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Lighting Identity | 0.31 | 0.47 | 0.93 | +0.62 | +0.46 |
| Shadow Stability | 0.29 | 0.43 | 0.91 | +0.62 | +0.48 |
| Color Stability | 0.3 | 0.45 | 0.9 | +0.6 | +0.45 |
| Atmosphere Stability | 0.28 | 0.42 | 0.92 | +0.64 | +0.5 |

## Per-Anchor Review

### sunrise_window_soft_01

- Location: `gonegi_window_corner_01` · DNA: `sunrise_bakery_window`
- Adapter consumption: 10/10 PASS
- Anchor pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Lighting Identity | PASS |
| Key Light Direction | PASS |
| Shadow Direction | PASS |
| Color Temperature | PASS |
| Brightness Consistency | PASS |
| Atmosphere Consistency | PASS |

### morning_bakery_glow_01

- Location: `family_bakery_kitchen_01` · DNA: `morning_bakery_kitchen`
- Adapter consumption: 10/10 PASS
- Anchor pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Lighting Identity | PASS |
| Key Light Direction | PASS |
| Shadow Direction | PASS |
| Color Temperature | PASS |
| Brightness Consistency | PASS |
| Atmosphere Consistency | PASS |

### midday_harbor_clear_01

- Location: `harbor_main_dock_01` · DNA: `morning_harbor_dock`
- Adapter consumption: 10/10 PASS
- Anchor pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Lighting Identity | PASS |
| Key Light Direction | PASS |
| Shadow Direction | PASS |
| Color Temperature | PASS |
| Brightness Consistency | PASS |
| Atmosphere Consistency | PASS |

### afternoon_olive_hill_01

- Location: `olive_hill_lunch_spot_01` · DNA: `afternoon_olive_hill`
- Adapter consumption: 10/10 PASS
- Anchor pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Lighting Identity | PASS |
| Key Light Direction | PASS |
| Shadow Direction | PASS |
| Color Temperature | PASS |
| Brightness Consistency | PASS |
| Atmosphere Consistency | PASS |

### golden_hour_harbor_01

- Location: `harbor_watch_point_01` · DNA: `golden_hour_harbor`
- Adapter consumption: 10/10 PASS
- Anchor pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Lighting Identity | PASS |
| Key Light Direction | PASS |
| Shadow Direction | PASS |
| Color Temperature | PASS |
| Brightness Consistency | PASS |
| Atmosphere Consistency | PASS |

### sunset_window_warm_01

- Location: `village_bakery_lane_01` · DNA: `golden_hour_bakery_lane`
- Adapter consumption: 10/10 PASS
- Anchor pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Lighting Identity | PASS |
| Key Light Direction | PASS |
| Shadow Direction | PASS |
| Color Temperature | PASS |
| Brightness Consistency | PASS |
| Atmosphere Consistency | PASS |

### blue_hour_street_01

- Location: `village_main_street_01` · DNA: `early_evening_village`
- Adapter consumption: 10/10 PASS
- Anchor pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Lighting Identity | PASS |
| Key Light Direction | PASS |
| Shadow Direction | PASS |
| Color Temperature | PASS |
| Brightness Consistency | PASS |
| Atmosphere Consistency | PASS |

### night_lamp_interior_01

- Location: `family_bakery_kitchen_01` · DNA: `night_bakery`
- Adapter consumption: 10/10 PASS
- Anchor pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Lighting Identity | PASS |
| Key Light Direction | PASS |
| Shadow Direction | PASS |
| Color Temperature | PASS |
| Brightness Consistency | PASS |
| Atmosphere Consistency | PASS |

## Success Condition

- Required: ≥6/8 anchors pass all review categories; lighting continuity exceeds RKB-003
- Result: **8/6** anchors — MET

## Next Phase

**SHOT-GRAMMAR-001** — CINEMATIC_COVERAGE_GRAMMAR

Objective: Replace repetitive Medium-medium coverage with varied cinematic grammar:
Wide, Medium, Insert, Reaction, POV, Detail, Environmental — for stronger sequencing before Emotion Acting DNA.

