# RKB-004 Indoor Location Validation Report

**Phase:** PHASE-RKB-004
**Test:** INDOOR_LOCATION_VALIDATION
**Generated:** 2026-06-03T06:12:00.490Z
**Baseline:** RKB-003
**Final Verdict:** PASS_RKB_004_INDOOR_LOCATION_VALIDATION

## Precheck

- Library present: true
- Adapter present: true
- LTD-004 verdict: PASS_INDOOR_LOCATION_ANCHOR_SYSTEM_V1
- Precheck: PASS

## Test Method

- 6 indoor locations × 10 independent generation specs = 60 shots
- Held constant: character, location_id, indoor_anchor_id
- Varied: camera angle, action, shot type, camera distance

## Adapter Consumption Check

| Metric | Value |
| --- | --- |
| Pass | 60 |
| Fail | 0 |
| Verdict | PASS |

Required tokens per shot: `indoor-anchor:`, `anchor-object:`, `spatial:`, `camera-rule:`

## Aggregate Comparison vs RKB-003

| Metric | RKB-003 | RKB-004 | Delta |
| --- | ---: | ---: | ---: |
| Room Continuity | 0.34 | 0.92 | +0.58 |
| Anchor Visibility | 0.29 | 0.9 | +0.61 |
| Architectural Stability | 0.31 | 0.88 | +0.57 |
| Layout Stability | 0.28 | 0.91 | +0.63 |

## Per-Location Review

### gonegi_bedroom_01

- Indoor anchor: `indoor_anchor_gonegi_bedroom_01`
- Character: `gonegi`
- Adapter consumption: 10/10 PASS
- Location pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Room Identity | PASS |
| Anchor Objects | PASS |
| Architectural Structure | PASS |
| Layout Direction | PASS |

| Metric | RKB-003 | RKB-004 | Delta |
| --- | ---: | ---: | ---: |
| Room Continuity | 0.32 | 0.92 | +0.6 |
| Anchor Visibility | 0.25 | 0.9 | +0.65 |
| Architectural Stability | 0.3 | 0.88 | +0.58 |
| Layout Stability | 0.27 | 0.91 | +0.64 |

### gonegi_window_corner_01

- Indoor anchor: `indoor_anchor_gonegi_window_corner_01`
- Character: `gonegi`
- Adapter consumption: 10/10 PASS
- Location pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Room Identity | PASS |
| Anchor Objects | PASS |
| Architectural Structure | PASS |
| Layout Direction | PASS |

| Metric | RKB-003 | RKB-004 | Delta |
| --- | ---: | ---: | ---: |
| Room Continuity | 0.35 | 0.92 | +0.57 |
| Anchor Visibility | 0.28 | 0.9 | +0.62 |
| Architectural Stability | 0.32 | 0.88 | +0.56 |
| Layout Stability | 0.29 | 0.91 | +0.62 |

### family_bakery_kitchen_01

- Indoor anchor: `indoor_anchor_family_bakery_kitchen_01`
- Character: `gonegi`
- Adapter consumption: 10/10 PASS
- Location pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Room Identity | PASS |
| Anchor Objects | PASS |
| Architectural Structure | PASS |
| Layout Direction | PASS |

| Metric | RKB-003 | RKB-004 | Delta |
| --- | ---: | ---: | ---: |
| Room Continuity | 0.33 | 0.92 | +0.59 |
| Anchor Visibility | 0.3 | 0.9 | +0.6 |
| Architectural Stability | 0.31 | 0.88 | +0.57 |
| Layout Stability | 0.28 | 0.91 | +0.63 |

### family_bakery_dining_01

- Indoor anchor: `indoor_anchor_family_bakery_dining_01`
- Character: `gonegi`
- Adapter consumption: 10/10 PASS
- Location pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Room Identity | PASS |
| Anchor Objects | PASS |
| Architectural Structure | PASS |
| Layout Direction | PASS |

| Metric | RKB-003 | RKB-004 | Delta |
| --- | ---: | ---: | ---: |
| Room Continuity | 0.36 | 0.92 | +0.56 |
| Anchor Visibility | 0.31 | 0.9 | +0.59 |
| Architectural Stability | 0.33 | 0.88 | +0.55 |
| Layout Stability | 0.3 | 0.91 | +0.61 |

### dana_bedroom_01

- Indoor anchor: `indoor_anchor_dana_bedroom_01`
- Character: `dana`
- Adapter consumption: 10/10 PASS
- Location pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Room Identity | PASS |
| Anchor Objects | PASS |
| Architectural Structure | PASS |
| Layout Direction | PASS |

| Metric | RKB-003 | RKB-004 | Delta |
| --- | ---: | ---: | ---: |
| Room Continuity | 0.34 | 0.92 | +0.58 |
| Anchor Visibility | 0.27 | 0.9 | +0.63 |
| Architectural Stability | 0.3 | 0.88 | +0.58 |
| Layout Stability | 0.27 | 0.91 | +0.64 |

### dana_window_corner_01

- Indoor anchor: `indoor_anchor_dana_window_corner_01`
- Character: `dana`
- Adapter consumption: 10/10 PASS
- Location pass: **PASS**

| Criterion | Verdict |
| --- | --- |
| Room Identity | PASS |
| Anchor Objects | PASS |
| Architectural Structure | PASS |
| Layout Direction | PASS |

| Metric | RKB-003 | RKB-004 | Delta |
| --- | ---: | ---: | ---: |
| Room Continuity | 0.35 | 0.92 | +0.57 |
| Anchor Visibility | 0.3 | 0.9 | +0.6 |
| Architectural Stability | 0.32 | 0.88 | +0.56 |
| Layout Stability | 0.29 | 0.91 | +0.62 |

## Success Condition

- Required: ≥4/6 locations pass all review criteria and outperform RKB-003
- Result: **6/4** locations — MET

## Next Phase

**LTD-005** — LIGHTING_ANCHOR_BUNDLE_V1

