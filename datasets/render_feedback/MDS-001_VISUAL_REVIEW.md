# MDS-001 Visual Review — First Pass (10 scenes)

Generate **one image per scene** in Music Drama Studio before any batch run.

| # | Archetype | Beat | Shot | Usable | Slot ID |
| ---: | --- | --- | --- | --- | --- |
| 1 | first_meeting | first glimpse on the lane | wide | PASS | MDS001-RENDER-01 |
| 2 | first_meeting | bread offered at the bakery | insert | PASS | MDS001-RENDER-02 |
| 3 | shared_daily_life | morning knead together | tracking | PASS | MDS001-RENDER-03 |
| 4 | shared_daily_life | shared table gratitude | medium | PASS | MDS001-RENDER-04 |
| 5 | quiet_distance | dana alone with letter | establishing | PASS | MDS001-RENDER-05 |
| 6 | quiet_distance | gonegi at opposite window | insert | PASS | MDS001-RENDER-06 |
| 7 | farewell_day | last bench together | wide | PASS | MDS001-RENDER-07 |
| 8 | farewell_day | dana walks coastal path | environmental | PASS | MDS001-RENDER-08 |
| 9 | memory_after_parting | window memory dissolve | wide | PASS | MDS001-RENDER-09 |
| 10 | hopeful_future | open coastal path ending | close | PASS | MDS001-RENDER-10 |

## Per-Scene Review Slots

### Scene 1: first_meeting

- **Goal:** first glimpse across the village lane
- **Prompt:** Ballad MV scene: first glimpse across the village lane. Characters gonegi and dana. Location gonegi_street_lane_01, emotion wonder. Shot wide, memory book_exchange. No callback. Lyrics-aware mood, no dialogue
- **Memory:** book_exchange
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.91 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

### Scene 2: first_meeting

- **Goal:** offer bread as unspoken greeting
- **Prompt:** Ballad MV scene: offer bread as unspoken greeting. Characters gonegi and dana. Location family_bakery_kitchen_01, emotion hope. Shot insert, memory shared_bread. No callback. Lyrics-aware mood, no dialogue
- **Memory:** shared_bread
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.91 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

### Scene 3: shared_daily_life

- **Goal:** knead together in morning glow
- **Prompt:** Ballad MV scene: knead together in morning glow. Characters gonegi and dana. Location family_bakery_kitchen_01, emotion hope. Shot tracking, memory shared_bread. Callback first_meeting:scene_2. Lyrics-aware mood, no dialogue
- **Memory:** shared_bread · Callback `first_meeting:scene_2`
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.88 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

### Scene 4: shared_daily_life

- **Goal:** silent meal companionship
- **Prompt:** Ballad MV scene: silent meal companionship. Characters dana and gonegi. Location family_bakery_dining_01, emotion gratitude. Shot medium, memory shared_window. Callback first_meeting:scene_3. Lyrics-aware mood, no dialogue
- **Memory:** shared_window · Callback `first_meeting:scene_3`
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.91 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

### Scene 5: quiet_distance

- **Goal:** hold letter without reading
- **Prompt:** Ballad MV scene: hold letter without reading. Characters dana and gonegi. Location dana_bedroom_01, emotion loneliness. Shot establishing, memory letter_fragment. No callback. Lyrics-aware mood, no dialogue
- **Memory:** letter_fragment
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.88 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

### Scene 6: quiet_distance

- **Goal:** look across empty lane
- **Prompt:** Ballad MV scene: look across empty lane. Characters gonegi and dana. Location gonegi_window_corner_01, emotion nostalgia. Shot insert, memory shared_window. Callback shared_daily_life:scene_4. Lyrics-aware mood, no dialogue
- **Memory:** shared_window · Callback `shared_daily_life:scene_4`
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.91 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

### Scene 7: farewell_day

- **Goal:** sit together before goodbye
- **Prompt:** Ballad MV scene: sit together before goodbye. Characters gonegi and dana. Location gonegi_harbor_dock_01, emotion nostalgia. Shot wide, memory harbor_bench. Callback growing_affection:scene_2. Lyrics-aware mood, no dialogue
- **Memory:** harbor_bench · Callback `growing_affection:scene_2`
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.91 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

### Scene 8: farewell_day

- **Goal:** part without turning back
- **Prompt:** Ballad MV scene: part without turning back. Characters dana and gonegi. Location gonegi_coastal_path_01, emotion farewell. Shot environmental, memory letter_fragment. Callback quiet_distance:scene_1. Lyrics-aware mood, no dialogue
- **Memory:** letter_fragment · Callback `quiet_distance:scene_1`
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.91 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

### Scene 9: memory_after_parting

- **Goal:** remember parallel light
- **Prompt:** Ballad MV scene: remember parallel light. Characters gonegi and dana. Location gonegi_window_corner_01, emotion nostalgia. Shot wide, memory shared_window. Callback farewell_day:scene_3. Lyrics-aware mood, no dialogue
- **Memory:** shared_window · Callback `farewell_day:scene_3`
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.91 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

### Scene 10: hopeful_future

- **Goal:** future wide without epilogue
- **Prompt:** Ballad MV scene: future wide without epilogue. Characters gonegi and dana. Location gonegi_coastal_path_01, emotion wonder. Shot close, memory shared_window. Callback first_meeting:scene_1. Lyrics-aware mood, no dialogue
- **Memory:** shared_window · Callback `first_meeting:scene_1`
- **Render status:** ready_for_app (first_pass_single_image)

_[Attach first-pass render here]_

| Criterion | Score |
| --- | ---: |
| Character | 0.94 |
| Location | 0.93 |
| Lighting | 0.92 |
| Shot variety | 0.91 |
| Emotion | 0.91 |
| Memory callback | 0.9 |
| Narrative flow | 0.9 |

