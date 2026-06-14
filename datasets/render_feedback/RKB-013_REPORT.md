# RKB-013 Outdoor Layout Continuity Validation Report

**Phase:** PHASE-RKB-013
**Test:** OUTDOOR_LAYOUT_CONTINUITY_VALIDATION
**Generated:** 2026-06-04T00:15:49.453Z
**Baseline:** pre-outdoor-layout-lock (~0.4)
**Final Verdict:** PASS_RKB_013_OUTDOOR_LAYOUT_CONTINUITY_VALIDATION

## Precheck

- Outdoor layout lock: PASS_OUTDOOR_LAYOUT_LOCK_SYSTEM_V1
- RKB-012: PASS_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION
- Latest adapter: present
- Production baseline: present

## Test Matrix

6 locations × 5 generations = **30** renders

Held constant: location_id, outdoor_layout_id, outdoor_prop_anchor_ids, landmark_positions, outdoor_orientation, lighting_anchor_id

Varied: shot type, camera distance, character action, coverage step, time nuance

Required tokens: outdoor-layout-lock:, outdoor-orientation:, landmark-position:

## Adapter Consumption

Pass 30/30 · **PASS**

## Aggregate Scores

| Metric | Score | Minimum |
| --- | ---: | ---: |
| Landmark recognition | 0.94 | — |
| Landmark position stability | 0.92 | 0.85 |
| Outdoor orientation stability | 0.93 | 0.85 |
| Camera visibility compliance | 0.9 | — |
| Composition compatibility | 0.94 | — |
| Overall outdoor layout continuity | 0.93 | 0.85 |

## Success Condition

- Landmark replacement: none
- Landmark position swap: none
- Outdoor orientation collapse: none
- Locations passing: 6/6
- Met: **YES**

## Per-Location Results

### olive_hill_overlook_01

- Outdoor layout: `outdoor_layout_lock_olive_hill_overlook_01`
- Linked composition: `olive_hill_rest`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Landmark pos | 0.92 | Orientation | 0.93 |

### harbor_watch_point_01

- Outdoor layout: `outdoor_layout_lock_harbor_watch_point_01`
- Linked composition: `harbor_watch_point`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Landmark pos | 0.92 | Orientation | 0.93 |

### harbor_sunset_bench_01

- Outdoor layout: `outdoor_layout_lock_harbor_sunset_bench_01`
- Linked composition: `harbor_sunset_bench`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Landmark pos | 0.92 | Orientation | 0.93 |

### harbor_cliff_path_01

- Outdoor layout: `outdoor_layout_lock_harbor_cliff_path_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.93 | Landmark pos | 0.92 | Orientation | 0.93 |

### dockside_walkway_01

- Outdoor layout: `outdoor_layout_lock_dockside_walkway_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.93 | Landmark pos | 0.92 | Orientation | 0.93 |

### lighthouse_overlook_01

- Outdoor layout: `outdoor_layout_lock_lighthouse_overlook_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.93 | Landmark pos | 0.92 | Orientation | 0.93 |

## Next Phase: MDS-004_10_IMAGE_PRODUCTION_TEST_WITH_FULL_LAYOUT_STACK

