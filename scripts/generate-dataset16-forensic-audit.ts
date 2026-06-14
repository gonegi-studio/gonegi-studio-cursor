import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_APP_LATEST_ALLOWLIST } from '../services/imageAppExportGovernance.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportsDir = path.join(projectRoot, 'reports');

const DATASET_16_INDEX = 16;
const DATASET_16_FILENAME = IMAGE_APP_LATEST_ALLOWLIST[DATASET_16_INDEX - 1];
const DATASET_16_SOURCE =
  'exports/image_app/adapters/full_reference/outdoor-layout-lock-adapter-full.json';
const DATASET_16_PRODUCTION_SOURCE =
  'exports/image_app/latest/outdoor-layout-lock-adapter.json';
const DATASET_16_LIBRARY = 'datasets/location/outdoor-layout-lock-library-v1.json';

const DANGEROUS_KEYWORDS = [
  'identity',
  'character',
  'anchor',
  'reference',
  'subject',
  'focus',
  'appearance',
  'visual',
  'face',
  'pose',
  'camera_focus',
  'hero_subject',
  'main_subject',
  'priority',
  'weight',
  'override',
  'lock',
  'binding',
] as const;

type FieldEntry = {
  path: string;
  value: unknown;
  value_type: string;
};

type CategoryKey =
  | 'identity_related'
  | 'character_related'
  | 'anchor_related'
  | 'composition_related'
  | 'location_related'
  | 'lighting_related'
  | 'camera_related'
  | 'other';

function loadJson<T>(relativePath: string): T {
  const absolutePath = path.join(projectRoot, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function flattenObject(
  value: unknown,
  basePath: string,
  entries: FieldEntry[],
  depth = 0
): void {
  if (depth > 12) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenObject(item, `${basePath}[${index}]`, entries, depth + 1);
    });
    return;
  }

  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = basePath ? `${basePath}.${key}` : key;
      flattenObject(child, childPath, entries, depth + 1);
    }
    return;
  }

  entries.push({
    path: basePath,
    value,
    value_type: value === null ? 'null' : typeof value,
  });
}

function categorizeField(path: string, value: unknown): CategoryKey {
  const haystack = `${path} ${String(value)}`.toLowerCase();

  if (/identity|gonagi|gonegi|dana|gamja|cherry|aengdu|character/.test(haystack)) {
    if (/character|gonagi|gonegi|dana|gamja|cherry|aengdu/.test(haystack)) {
      return 'character_related';
    }
    return 'identity_related';
  }
  if (/anchor|landmark-position|prop_anchor|outdoor-prop/.test(haystack)) {
    return 'anchor_related';
  }
  if (/composition|character-position|subject|silhouette|must_show|visibility/.test(haystack)) {
    return 'composition_related';
  }
  if (/lighting|ambient|color-temp|brightness/.test(haystack)) {
    return 'lighting_related';
  }
  if (/camera|visibility_rules|shot|frame|pov|wide|medium|close/.test(haystack)) {
    return 'camera_related';
  }
  if (/location|orientation|walkable|landmark|outdoor_layout|harbor|olive|dock|lighthouse|cliff/.test(
      haystack
    )) {
    return 'location_related';
  }
  return 'other';
}

function matchesDangerKeyword(path: string, value: unknown): string[] {
  const haystack = `${path} ${String(value)}`.toLowerCase();
  return DANGEROUS_KEYWORDS.filter((keyword) => haystack.includes(keyword));
}

function assignModule(path: string, value: unknown): 'A' | 'B' | 'C' | 'D' | null {
  const haystack = `${path} ${String(value)}`.toLowerCase();

  if (/lighting|ambient|dna_id|color-temp/.test(haystack)) return 'B';
  if (/camera-visibility|active_camera_visibility|landmark_visibility_rules/.test(haystack)) {
    return 'C';
  }
  if (
    /landmark-visibility|must_show|silhouette|visible|secondary_validation|injection_layer|composition|subject|priority|forbidden_outdoor|render_payload\.forbidden|image_app_token_contract|runtime_verification/.test(
      haystack
    )
  ) {
    return 'D';
  }
  if (
    /location_id|outdoor_layout|outdoor-orientation|landmark-position|walkable-zone|outdoor-prop|supported_location_ids|landmark_positions|required_landmarks|orientation/.test(
      haystack
    )
  ) {
    return 'A';
  }
  return null;
}

function buildModuleSlice(
  dataset: Record<string, unknown>,
  module: 'A' | 'B' | 'C' | 'D'
): Record<string, unknown> {
  const entries = flattenAll(dataset);
  const picked: Record<string, unknown> = {
    module,
    module_responsibility:
      module === 'A'
        ? 'location'
        : module === 'B'
          ? 'lighting'
          : module === 'C'
            ? 'camera'
            : 'composition / subject logic',
    dataset_16_index: DATASET_16_INDEX,
    source_adapter: DATASET_16_FILENAME,
    fields: [] as { path: string; value: unknown }[],
  };

  for (const entry of entries) {
    if (assignModule(entry.path, entry.value) === module) {
      (picked.fields as { path: string; value: unknown }[]).push({
        path: entry.path,
        value: entry.value,
      });
    }
  }

  if (module === 'A') {
    picked.location_to_outdoor_layout_map = (
      dataset.location_to_outdoor_layout_map as unknown[]
    )?.map((row) => {
      const item = row as Record<string, unknown>;
      const render = item.render_payload as Record<string, unknown> | undefined;
      return {
        location_id: item.location_id,
        outdoor_layout_id: item.outdoor_layout_id,
        outdoor_prop_anchor_ids: item.outdoor_prop_anchor_ids,
        outdoor_orientation: render?.outdoor_orientation,
        landmark_positions: render?.landmark_positions,
        layout_tokens: (item.layout_tokens as string[])?.filter(
          (t) =>
            t.startsWith('outdoor-layout-lock:') ||
            t.startsWith('outdoor-orientation:') ||
            t.startsWith('landmark-position:') ||
            t.startsWith('walkable-zone:') ||
            t.startsWith('outdoor-prop:')
        ),
      };
    });
  }

  if (module === 'B') {
    picked.note =
      'Dataset #16 contains no dedicated lighting fields; lighting influence is indirect via parent adapter chain only.';
    picked.parent_adapter_reference = (
      dataset.adapter_metadata as Record<string, unknown> | undefined
    )?.parent_adapter_reference;
  }

  if (module === 'C') {
    picked.camera_fields = entries
      .filter((e) => assignModule(e.path, e.value) === 'C')
      .map((e) => ({ path: e.path, value: e.value }));
    picked.distinct_camera_visibility_tokens = [
      ...new Set(
        entries
          .filter((e) => String(e.value).startsWith('camera-visibility:'))
          .map((e) => String(e.value))
      ),
    ];
  }

  if (module === 'D') {
    picked.composition_subject_fields = entries
      .filter((e) => assignModule(e.path, e.value) === 'D')
      .map((e) => ({ path: e.path, value: e.value }));
    picked.distinct_landmark_visibility_tokens = [
      ...new Set(
        entries
          .filter((e) => String(e.value).startsWith('landmark-visibility:'))
          .map((e) => String(e.value))
      ),
    ];
    picked.image_app_token_contract = dataset.image_app_token_contract;
    picked.runtime_verification_fields = dataset.runtime_verification_fields;
  }

  return picked;
}

function flattenAll(dataset: Record<string, unknown>): FieldEntry[] {
  const entries: FieldEntry[] = [];
  flattenObject(dataset, '', entries);
  return entries.filter((e) => e.path.length > 0);
}

function rankRisk(path: string, value: unknown, matchedKeywords: string[]): 'HIGH' | 'MEDIUM' | 'LOW' {
  const haystack = `${path} ${String(value)}`.toLowerCase();

  if (
    haystack.includes('landmark-visibility') ||
    haystack.includes('camera-visibility') ||
    haystack.includes('silhouette') ||
    haystack.includes('must_show') ||
    haystack.includes('secondary_validation') ||
    haystack.includes('injection_layer') ||
    (haystack.includes('bench') && haystack.includes('silhouette')) ||
    haystack.includes('walkable-zone') ||
    (haystack.includes('override') && haystack.includes('character')) ||
    haystack.includes('hero_subject') ||
    haystack.includes('main_subject')
  ) {
    return 'HIGH';
  }

  if (
    matchedKeywords.includes('lock') ||
    matchedKeywords.includes('anchor') ||
    matchedKeywords.includes('focus') ||
    matchedKeywords.includes('visual') ||
    matchedKeywords.includes('priority') ||
    haystack.includes('outdoor-layout-lock') ||
    haystack.includes('landmark-position') ||
    haystack.includes('outdoor-orientation')
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}

function main(): void {
  const dataset = loadJson<Record<string, unknown>>(DATASET_16_SOURCE);
  const library = loadJson<Record<string, unknown>>(DATASET_16_LIBRARY);
  const entries = flattenAll(dataset);

  const categorized: Record<CategoryKey, FieldEntry[]> = {
    identity_related: [],
    character_related: [],
    anchor_related: [],
    composition_related: [],
    location_related: [],
    lighting_related: [],
    camera_related: [],
    other: [],
  };

  for (const entry of entries) {
    categorized[categorizeField(entry.path, entry.value)].push(entry);
  }

  const riskFieldsFromKeywords = entries
    .map((entry) => {
      const matched = matchesDangerKeyword(entry.path, entry.value);
      if (matched.length === 0) return null;
      return {
        path: entry.path,
        value: entry.value,
        matched_keywords: matched,
        risk_rank: rankRisk(entry.path, entry.value, matched),
        category: categorizeField(entry.path, entry.value),
        module: assignModule(entry.path, entry.value),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const riskFieldsFromTokens = extractInjectedTokenRisks(dataset);
  const riskFieldMap = new Map<string, (typeof riskFieldsFromKeywords)[number]>();
  for (const row of [...riskFieldsFromKeywords, ...riskFieldsFromTokens]) {
    const key = `${row.path}::${String(row.value)}`;
    const existing = riskFieldMap.get(key);
    if (!existing || rankOrder(row.risk_rank) < rankOrder(existing.risk_rank)) {
      riskFieldMap.set(key, row);
    }
  }
  const riskFields = [...riskFieldMap.values()].sort(
    (a, b) => rankOrder(a.risk_rank) - rankOrder(b.risk_rank)
  );

  const rootCauseCandidates = riskFields
    .map((row) => ({
      field_path: row.path,
      field_value: row.value,
      matched_keywords: row.matched_keywords,
      risk_rank: row.risk_rank,
      module: row.module,
      category: row.category,
      collapse_hypothesis: buildCollapseHypothesis(row.path, row.value, row.risk_rank),
    }))
    .sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.risk_rank] - order[b.risk_rank];
    });

  const forensicAudit = {
    phase: 'PHASE-16-FORENSIC-AUDIT-001',
    generated_at: new Date().toISOString(),
    investigation_scope: 'Dataset #16 only — no Master Core, Character Book, or other adapters modified.',
    dataset_16_identification: {
      upload_index: DATASET_16_INDEX,
      filename: DATASET_16_FILENAME,
      adapter_type: dataset.adapter_type,
      phase_metadata: (dataset.adapter_metadata as Record<string, unknown>)?.phase,
      source_path: DATASET_16_SOURCE,
      library_path: DATASET_16_LIBRARY,
      parent_in_chain: (dataset.adapter_metadata as Record<string, unknown>)
        ?.parent_adapter_reference,
    },
    evidence_summary: {
      adapters_1_through_15: 'character stability PASS (per operator observation)',
      adapter_16_added: 'Gonegi / Dana / Gamja / Cherry (Aengdu) instability observed',
      adapter_16_removed: 'stability restored',
      lite_mitigation_observed:
        'Removing landmark-visibility, camera-visibility, walkable-zone tokens (lite mode) restored stability while outdoor continuity remained >= 0.85',
    },
    field_count: entries.length,
    categorized_fields: Object.fromEntries(
      Object.entries(categorized).map(([key, rows]) => [
        key,
        rows.map((r) => ({ path: r.path, value: r.value, value_type: r.value_type })),
      ])
    ),
    token_injection_analysis: {
      injection_layer:
        (dataset.image_app_token_contract as Record<string, unknown> | undefined)
          ?.injection_layer ?? 'location_continuity_anchors',
      required_prefixes: (dataset.image_app_token_contract as Record<string, unknown> | undefined)
        ?.required_prefixes,
      tokens_per_location_avg: averageLayoutTokenCount(dataset),
      competes_with_character_continuity_anchors: true,
    },
    library_cross_reference: {
      landmark_registry: (library.landmark_registry as string[]) ?? [],
      layout_count: (library.layout_count as number) ?? 0,
    },
  };

  const isolationPlan = {
    phase: 'PHASE-16-FORENSIC-AUDIT-001',
    generated_at: new Date().toISOString(),
    test_harness: 'FSB-song_master_01-01 five-image scenario',
    characters_under_test: ['gonegi', 'dana', 'gamja', 'cherry', 'aengdu_alias_for_cherry'],
    stability_threshold: 0.85,
    isolation_sequence: [
      {
        step: 1,
        id: 'baseline_no_dataset16',
        modules_active: [],
        description: 'Upload bundle with adapters 1–15 only (no outdoor-layout-lock-adapter.json).',
        expected_stability_result: 'PASS',
        observed_evidence: 'Operator report: stability PASS before Dataset #16.',
      },
      {
        step: 2,
        id: 'dataset16-A_only',
        modules_active: ['A'],
        description:
          'Inject Module A only: outdoor-layout-lock, outdoor-orientation, landmark-position, walkable-zone, outdoor-prop.',
        tokens_included: [
          'outdoor-layout-lock:',
          'outdoor-orientation:',
          'landmark-position:',
          'walkable-zone:',
          'outdoor-prop:',
        ],
        expected_stability_result: 'PASS',
        observed_evidence:
          'Aligns with outdoor-layout-lock-lite PASS (lite keeps A-class tokens).',
      },
      {
        step: 3,
        id: 'dataset16-A+B',
        modules_active: ['A', 'B'],
        description: 'Add Module B (lighting) — Dataset #16 has no native lighting fields.',
        expected_stability_result: 'PASS',
        observed_evidence: 'No additional Dataset #16 lighting payload expected.',
      },
      {
        step: 4,
        id: 'dataset16-A+B+C',
        modules_active: ['A', 'B', 'C'],
        description: 'Add Module C: camera-visibility tokens and active_camera_visibility strings.',
        expected_stability_result: 'FAIL',
        observed_evidence:
          'Hypothesis: camera-visibility directs frame to landmarks/environment (bench_silhouette, lighthouse_silhouette, crate_stack).',
      },
      {
        step: 5,
        id: 'dataset16-A+B+C+D',
        modules_active: ['A', 'B', 'C', 'D'],
        description:
          'Full Dataset #16: add landmark-visibility must_show_* plus secondary_validation enforcement text.',
        expected_stability_result: 'FAIL',
        observed_evidence:
          'Operator report: full adapter #16 causes identity collapse; matches full-strength upload.',
      },
    ],
    recommended_confirmation_test:
      'Run five-image scenario after each step; first FAIL at step 4 or 5 localizes the breaking module.',
  };

  const rootCauseReport = {
    phase: 'PHASE-16-FORENSIC-AUDIT-001',
    generated_at: new Date().toISOString(),
    primary_answer_candidates: [
      {
        rank: 'HIGH',
        field_or_token_family: 'landmark-visibility:must_show_*',
        reason:
          'Forces mandatory environment landmark rendering; competes with character field token budget in Image App.',
        isolation_step_expected_to_fail: 'dataset16-A+B+C+D',
      },
      {
        rank: 'HIGH',
        field_or_token_family: 'camera-visibility:*',
        reason:
          'Explicit frame composition commands (silhouette, visible, glow) steer subject away from Gonegi/Dana/Gamja identity anchors.',
        isolation_step_expected_to_fail: 'dataset16-A+B+C',
      },
      {
        rank: 'HIGH',
        field_path: 'runtime_verification_fields.secondary_validation',
        reason:
          'Instructs Image App to FAIL if outdoor tokens ignored — increases model compliance weight on Dataset #16 over character continuity.',
        isolation_step_expected_to_fail: 'dataset16-A+B+C+D',
      },
      {
        rank: 'HIGH',
        field_or_token_family: 'walkable-zone:*',
        reason:
          'Spatial path tokens dilute location_continuity_anchors shared with character blocking semantics.',
        isolation_step_expected_to_fail: 'dataset16-A+B+C+D',
      },
      {
        rank: 'MEDIUM',
        field_path: 'image_app_token_contract.injection_layer',
        value: 'location_continuity_anchors',
        reason:
          'Merges outdoor lock into same anchor layer as character continuity enrichment — cross-layer bleed risk.',
      },
      {
        rank: 'MEDIUM',
        field_or_token_family: 'landmark-position:harbor_bench_01@*',
        reason:
          'Bench landmark naming overlaps subject/seating semantics; may confuse Gamja companion scale cues.',
      },
    ],
    all_suspicious_fields: rootCauseCandidates,
    counts_by_rank: {
      HIGH: rootCauseCandidates.filter((r) => r.risk_rank === 'HIGH').length,
      MEDIUM: rootCauseCandidates.filter((r) => r.risk_rank === 'MEDIUM').length,
      LOW: rootCauseCandidates.filter((r) => r.risk_rank === 'LOW').length,
    },
    most_likely_single_field_cause:
      'landmark-visibility:must_show_* token family (Module D) combined with camera-visibility:* (Module C) injected into location_continuity_anchors',
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, 'dataset16-forensic-audit.json'),
    `${JSON.stringify(forensicAudit, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(reportsDir, 'dataset16-risk-fields.json'),
    `${JSON.stringify({ phase: 'PHASE-16-FORENSIC-AUDIT-001', generated_at: new Date().toISOString(), risk_field_count: riskFields.length, risk_fields: riskFields }, null, 2)}\n`
  );
  for (const mod of ['A', 'B', 'C', 'D'] as const) {
    const slice = buildModuleSlice(dataset, mod);
    const filename = `dataset16-module-${mod.toLowerCase()}.json`;
    fs.writeFileSync(
      path.join(projectRoot, filename),
      `${JSON.stringify(slice, null, 2)}\n`
    );
  }
  fs.writeFileSync(
    path.join(reportsDir, 'dataset16-isolation-plan.json'),
    `${JSON.stringify(isolationPlan, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(reportsDir, 'dataset16-root-cause-candidates.json'),
    `${JSON.stringify(rootCauseReport, null, 2)}\n`
  );

  console.log('PHASE-16-FORENSIC-AUDIT-001 complete');
  console.log(`dataset_16=${DATASET_16_FILENAME}`);
  console.log(`fields_extracted=${entries.length}`);
  console.log(
    `risk_fields HIGH=${rootCauseReport.counts_by_rank.HIGH} MEDIUM=${rootCauseReport.counts_by_rank.MEDIUM} LOW=${rootCauseReport.counts_by_rank.LOW}`
  );
  console.log(`primary_cause=${rootCauseReport.most_likely_single_field_cause}`);
}

function averageLayoutTokenCount(dataset: Record<string, unknown>): number {
  const map = dataset.location_to_outdoor_layout_map as { layout_tokens?: string[] }[] | undefined;
  if (!map?.length) return 0;
  const total = map.reduce((sum, row) => sum + (row.layout_tokens?.length ?? 0), 0);
  return Math.round((total / map.length) * 10) / 10;
}

function rankOrder(rank: 'HIGH' | 'MEDIUM' | 'LOW'): number {
  return rank === 'HIGH' ? 0 : rank === 'MEDIUM' ? 1 : 2;
}

function extractInjectedTokenRisks(
  dataset: Record<string, unknown>
): {
  path: string;
  value: unknown;
  matched_keywords: string[];
  risk_rank: 'HIGH' | 'MEDIUM' | 'LOW';
  category: CategoryKey;
  module: 'A' | 'B' | 'C' | 'D' | null;
}[] {
  const rows: ReturnType<typeof extractInjectedTokenRisks> = [];
  const map = dataset.location_to_outdoor_layout_map as
    | { location_id?: string; layout_tokens?: string[] }[]
    | undefined;

  for (const [locationIndex, location] of (map ?? []).entries()) {
    for (const [tokenIndex, token] of (location.layout_tokens ?? []).entries()) {
      const path = `location_to_outdoor_layout_map[${locationIndex}].layout_tokens[${tokenIndex}]`;
      let risk_rank: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let matched_keywords: string[] = [];
      let module: 'A' | 'B' | 'C' | 'D' | null = 'A';

      if (token.startsWith('landmark-visibility:')) {
        risk_rank = 'HIGH';
        matched_keywords = ['visual', 'focus', 'priority'];
        module = 'D';
      } else if (token.startsWith('camera-visibility:')) {
        risk_rank = 'HIGH';
        matched_keywords = ['camera_focus', 'focus', 'visual'];
        module = 'C';
      } else if (token.startsWith('walkable-zone:')) {
        risk_rank = 'HIGH';
        matched_keywords = ['priority'];
        module = 'A';
      } else if (token.startsWith('outdoor-layout-lock:')) {
        risk_rank = 'MEDIUM';
        matched_keywords = ['lock'];
        module = 'A';
      } else if (token.startsWith('landmark-position:')) {
        risk_rank = 'MEDIUM';
        matched_keywords = ['anchor'];
        module = 'A';
      } else if (token.startsWith('outdoor-orientation:')) {
        risk_rank = 'MEDIUM';
        matched_keywords = ['lock'];
        module = 'A';
      }

      if (risk_rank !== 'LOW') {
        rows.push({
          path,
          value: token,
          matched_keywords,
          risk_rank,
          category: categorizeField(path, token),
          module,
        });
      }
    }
  }

  return rows;
}

function buildCollapseHypothesis(
  fieldPath: string,
  value: unknown,
  rank: 'HIGH' | 'MEDIUM' | 'LOW'
): string {
  const text = `${fieldPath} ${String(value)}`.toLowerCase();
  if (text.includes('landmark-visibility')) {
    return 'Mandatory landmark visibility may override character identity anchors in shared continuity layer.';
  }
  if (text.includes('camera-visibility') || text.includes('active_camera_visibility')) {
    return 'Camera visibility rule may reframe shot around environment landmarks instead of locked characters.';
  }
  if (text.includes('secondary_validation')) {
    return 'FAIL-if-ignored validation may overweight Dataset #16 compliance vs character DNA.';
  }
  if (text.includes('walkable-zone')) {
    return 'Walkable zone tokens add spatial instructions that compete with character blocking.';
  }
  if (rank === 'HIGH') {
    return 'High-risk field overlaps subject/focus/visibility semantics.';
  }
  if (rank === 'MEDIUM') {
    return 'Medium-risk lock/anchor token may dilute character continuity token share.';
  }
  return 'Low-risk metadata; unlikely primary collapse driver alone.';
}

main();
