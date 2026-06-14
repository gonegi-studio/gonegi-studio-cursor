# RKB-010 Prop Continuity Validation Report

**Phase:** PHASE-RKB-010
**Test:** PROP_CONTINUITY_VALIDATION
**Generated:** 2026-06-03T11:29:01.426Z
**Baseline:** pre-prop-anchor (~0.38)
**Final Verdict:** PASS_RKB_010_PROP_CONTINUITY_VALIDATION

## Precheck

- Prop anchor system: PASS_PROP_ANCHOR_SYSTEM_V1
- Latest adapter: present
- PRODUCTION_READY_BASELINE_001: present

## Test Matrix

| Scope | Value |
| --- | --- |
| Locations | 4 |
| Generations per location | 5 |
| Total renders | 20 |

### Location A — gonegi_bedroom_01
Props: ship_model_01, wildflower_vase_01, aged_wood_chair_01

### Location B — dana_window_corner_01
Props: reading_chair_01, geranium_pot_01, teacup_01, sketchbook_01

### Location C — family_bakery_dining_01
Props: bread_basket_01, pine_table_01

### Location D — family_bakery_kitchen_01
Props: brick_oven_01, copper_kettle_01, rolling_pin_01

## Adapter Consumption

Pass 20/20 · Verdict **PASS**

Required prefixes: prop-anchor:, prop-shape:, prop-material:, prop-color:, prop-priority:

## Aggregate Scores

| Metric | Score | Minimum |
| --- | ---: | ---: |
| Shape stability | 0.94 | 0.85 |
| Material stability | 0.93 | 0.85 |
| Color stability | 0.92 | 0.85 |
| Recognition stability | 0.91 | 0.85 |
| Visibility stability | 0.9 | 0.85 |
| Overall prop continuity | 0.92 | 0.85 |
| Room recognition | 0.96 | 0.85 |

## Success Condition

- Catastrophic prop replacement: none
- Major color drift: none
- Major shape drift: none
- Locations passing: 4/4
- Met: **YES**

## Per-Location Results

### Location A — gonegi_bedroom_01

- Location pass: **PASS**
- Catastrophic renders: 0

| Prop | Overall | Shape | Material | Color | Pass |
| --- | ---: | ---: | ---: | ---: | --- |
| ship_model_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |
| wildflower_vase_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |
| aged_wood_chair_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |

### Location B — dana_window_corner_01

- Location pass: **PASS**
- Catastrophic renders: 0

| Prop | Overall | Shape | Material | Color | Pass |
| --- | ---: | ---: | ---: | ---: | --- |
| reading_chair_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |
| geranium_pot_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |
| teacup_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |
| sketchbook_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |

### Location C — family_bakery_dining_01

- Location pass: **PASS**
- Catastrophic renders: 0

| Prop | Overall | Shape | Material | Color | Pass |
| --- | ---: | ---: | ---: | ---: | --- |
| bread_basket_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |
| pine_table_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |

### Location D — family_bakery_kitchen_01

- Location pass: **PASS**
- Catastrophic renders: 0

| Prop | Overall | Shape | Material | Color | Pass |
| --- | ---: | ---: | ---: | ---: | --- |
| brick_oven_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |
| copper_kettle_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |
| rolling_pin_01 | 0.92 | 0.94 | 0.93 | 0.92 | PASS |

## Next Phase: ROOM_LAYOUT_LOCK_SYSTEM_V1

