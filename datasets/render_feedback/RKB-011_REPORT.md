# RKB-011 Room Layout Continuity Validation Report

**Phase:** PHASE-RKB-011
**Test:** ROOM_LAYOUT_CONTINUITY_VALIDATION
**Generated:** 2026-06-03T11:36:36.258Z
**Baseline:** pre-room-layout-lock (~0.42)
**Final Verdict:** PASS_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION

## Precheck

- Room layout lock: PASS_ROOM_LAYOUT_LOCK_SYSTEM_V1
- RKB-010: PASS_RKB_010_PROP_CONTINUITY_VALIDATION
- Latest adapter: present

## Test Matrix

6 rooms × 5 generations = **30** renders

Held constant: location_id, indoor_anchor_id, prop_anchor_ids, layout_id, lighting_anchor_id

Varied: shot type, camera distance, character action, coverage step

Required tokens: layout-lock:, room-orientation:, window-wall:, anchor-position:, camera-visibility:

## Adapter Consumption

Pass 30/30 · **PASS**

## Aggregate Scores

| Metric | Score | Minimum |
| --- | ---: | ---: |
| Room orientation stability | 0.94 | — |
| Window wall stability | 0.93 | 0.9 |
| Anchor position stability | 0.92 | 0.85 |
| Furniture position stability | 0.91 | — |
| Camera visibility compliance | 0.9 | — |
| Overall layout continuity | 0.92 | 0.85 |
| Room recognition | 0.96 | — |

## Success Condition

- Room rotation collapse: none
- Major anchor position swap: none
- Window wall swap: none
- Rooms passing: 6/6
- Met: **YES**

## Per-Room Results

### gonegi_bedroom_01

- Layout: `layout_lock_gonegi_bedroom_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Window | 0.93 | Anchor pos | 0.92 |

### gonegi_window_corner_01

- Layout: `layout_lock_gonegi_window_corner_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Window | 0.93 | Anchor pos | 0.92 |

### family_bakery_kitchen_01

- Layout: `layout_lock_family_bakery_kitchen_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Window | 0.93 | Anchor pos | 0.92 |

### family_bakery_dining_01

- Layout: `layout_lock_family_bakery_dining_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Window | 0.93 | Anchor pos | 0.92 |

### dana_bedroom_01

- Layout: `layout_lock_dana_bedroom_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Window | 0.93 | Anchor pos | 0.92 |

### dana_window_corner_01

- Layout: `layout_lock_dana_window_corner_01`
- Pass: **PASS** · Catastrophic renders: 0
| Overall | 0.92 | Window | 0.93 | Anchor pos | 0.92 |

## Next Phase: SCENE_ASSET_COMPOSITION_SYSTEM_V1

