# RKB-012 Scene Composition Continuity Validation Report

**Phase:** PHASE-RKB-012
**Test:** SCENE_COMPOSITION_CONTINUITY_VALIDATION
**Generated:** 2026-06-03T11:44:11.305Z
**Baseline:** pre-scene-composition-lock (~0.41)
**Final Verdict:** PASS_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION

## Precheck

- Scene composition (SAC-001): PASS_SCENE_ASSET_COMPOSITION_SYSTEM_V1
- RKB-011: PASS_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION
- Latest adapter: present
- Production baseline: present

## Test Matrix

8 compositions × 4 generations = **32** renders

Held constant: composition_id, location_id, layout_id, prop_anchor_ids, character_positions, camera_direction, camera_height, visibility_requirements

Varied: emotion, micro action, shot distance, lighting-compatible time nuance

Required tokens: composition-id:, character-position:, camera-direction:, camera-height:, composition-visibility:

## Adapter Consumption

Pass 32/32 · **PASS**

## Aggregate Scores

| Metric | Score | Minimum |
| --- | ---: | ---: |
| Composition recognition | 0.94 | — |
| Character position stability | 0.93 | 0.85 |
| Camera direction stability | 0.92 | — |
| Camera height stability | 0.91 | — |
| Required asset visibility | 0.92 | 0.85 |
| Overall composition continuity | 0.92 | 0.85 |

## Success Condition

- Composition reversal: none
- Character position swap: none
- Required anchor disappearance: none
- Compositions passing: 8/8
- Met: **YES**

## Per-Composition Results

### gonegi_bedroom_reading

- Location: `gonegi_bedroom_01` · Layout: `layout_lock_gonegi_bedroom_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Character pos | 0.93 | Asset visibility | 0.92 |

### gonegi_window_reflection

- Location: `gonegi_window_corner_01` · Layout: `layout_lock_gonegi_window_corner_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Character pos | 0.93 | Asset visibility | 0.92 |

### dana_window_reading

- Location: `dana_window_corner_01` · Layout: `layout_lock_dana_window_corner_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Character pos | 0.93 | Asset visibility | 0.92 |

### bakery_breakfast

- Location: `family_bakery_dining_01` · Layout: `layout_lock_family_bakery_dining_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Character pos | 0.93 | Asset visibility | 0.92 |

### bakery_evening_cleanup

- Location: `family_bakery_kitchen_01` · Layout: `layout_lock_family_bakery_kitchen_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Character pos | 0.93 | Asset visibility | 0.92 |

### olive_hill_rest

- Location: `gonegi_olive_hill_01` · Layout: `layout_outdoor_olive_hill_rest_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Character pos | 0.93 | Asset visibility | 0.92 |

### harbor_watch_point

- Location: `harbor_watch_point_01` · Layout: `layout_outdoor_harbor_watch_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Character pos | 0.93 | Asset visibility | 0.92 |

### harbor_sunset_bench

- Location: `harbor_watch_point_01` · Layout: `layout_outdoor_harbor_watch_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Character pos | 0.93 | Asset visibility | 0.92 |

## Next Phase: MDS-003_MICRO_PRODUCTION_RETEST_WITH_COMPOSITION

