import crypto from "crypto";

export type LegacyDnaEmptyLayerKind = "visual_atoms" | "relationship_graph";

export type LegacyDnaObservedInferredSplitPlan = {
  observedFieldCount: number;
  inferredFieldCount: number;
  splitPolicy: "preserve-source-tags";
  normalizationTarget: "dataset-os-provenance-v1";
};

export type LegacyDnaConfidenceNormalizationPlan = {
  rawAuditScore: number;
  normalizedAuditScore: number;
  confidenceProfileTarget: number;
  auditScoreScale: "0-10-to-0-1";
};

export type LegacyDnaSequenceGraphAlignmentPlan = {
  alignmentPolicy: "25s-pilot-continuity-chain";
  previousNodeBinding: string;
  currentNodeBinding: string;
  nextCandidateBinding: string;
};

export type LegacyDnaUpgradeMapItem = {
  upgradeMapItemId: string;
  legacyRecordId: string;
  recordIndex: number;
  directorFamily: string;
  emptyLayers: readonly LegacyDnaEmptyLayerKind[];
  visualAtomsBackfillPlan: string;
  relationshipGraphBackfillPlan: string;
  observedInferredSplitPlan: LegacyDnaObservedInferredSplitPlan;
  confidenceNormalizationPlan: LegacyDnaConfidenceNormalizationPlan;
  sequenceGraphAlignmentPlan: LegacyDnaSequenceGraphAlignmentPlan;
  canonicalDnaBindingTarget: string;
  twentyFiveSecondCoverageLinkId: string | null;
  upgradeItemFingerprint: string;
};

export type LegacyDnaEmptyLayerDetectionSummary = {
  totalLegacyRecordCount: number;
  visualAtomsEmptyCount: number;
  relationshipGraphEmptyCount: number;
  dualEmptyLayerCount: number;
};

export type LegacyDnaUpgradeMap = {
  version: "v1";
  mapId: string;
  legacyDatasetVersion: "v82.6";
  targetDatasetOsBindingId: string;
  sourceFingerprint: string;
  mapVersion: typeof LEGACY_DNA_UPGRADE_MAP_KIND_VERSION;
  activeMapState: string;
  totalLegacyRecordCount: number;
  twentyFiveSecondCoverageLinkCount: number;
  emptyLayerDetection: LegacyDnaEmptyLayerDetectionSummary;
  items: readonly LegacyDnaUpgradeMapItem[];
};

export const LEGACY_DNA_UPGRADE_MAP_VERSION = "v1" as const;
export const LEGACY_DNA_UPGRADE_MAP_ID = "legacy-dna-upgrade-map-gonegi-harbor-25s-v1" as const;
export const LEGACY_DNA_UPGRADE_MAP_STATE = "25s-legacy-dna-upgrade-map-metadata-only" as const;
export const LEGACY_DNA_UPGRADE_MAP_KIND_VERSION = "legacy-dna-upgrade-map-v1" as const;
export const LEGACY_DNA_TARGET_DATASET_OS_BINDING_ID =
  "dataset-readiness-binding-gonegi-harbor-25s-v1" as const;
export const LEGACY_DNA_SOURCE_FINGERPRINT =
  "3397ecf7c62f94a60c8b05d175db34404150c707b3e8b3525acfdd5eae659589" as const;

export const LEGACY_V826_DNA_RECORD_CATALOG = Object.freeze([
  Object.freeze({
    legacyRecordId: "SCENE-LUMET-COURTROOM-CLIMAX",
    directorFamily: "Lumet-Courtroom",
    rawAuditScore: 9.75,
    observedFieldCount: 18,
    inferredFieldCount: 6,
    sequencePreviousNode: "SCENE-LUMET-COURTROOM-INT-04",
    sequenceCurrentNode: "SCENE-LUMET-COURTROOM-CLIMAX",
    sequenceNextNode: "SCENE-LUMET-COURTROOM-OUTRO",
    twentyFiveSecondCoverageLinkId: null,
    canonicalDnaBindingTarget: "character-dna-binding-gonegi-harbor-25s-v1",
  }),
  ...Array.from({ length: 6 }, (_, index) =>
    Object.freeze({
      legacyRecordId: `SCENE-LUMET-VAR-${index + 1}`,
      directorFamily: "Lumet-Courtroom",
      rawAuditScore: 9.75,
      observedFieldCount: 18,
      inferredFieldCount: 6,
      sequencePreviousNode: `SCENE-LUMET-VAR-${index}`,
      sequenceCurrentNode: `SCENE-LUMET-VAR-${index + 1}`,
      sequenceNextNode: `SCENE-LUMET-VAR-${index + 2}`,
      twentyFiveSecondCoverageLinkId: null,
      canonicalDnaBindingTarget: "character-dna-binding-gonegi-harbor-25s-v1",
    })
  ),
  Object.freeze({
    legacyRecordId: "SCENE-MENDES-1917-TRENCH-TRACKING",
    directorFamily: "Mendes-Deakins",
    rawAuditScore: 9.68,
    observedFieldCount: 20,
    inferredFieldCount: 5,
    sequencePreviousNode: "SCENE-MENDES-1917-INTRO",
    sequenceCurrentNode: "SCENE-MENDES-1917-TRENCH-TRACKING",
    sequenceNextNode: "SCENE-MENDES-1917-RESOLVE",
    twentyFiveSecondCoverageLinkId: null,
    canonicalDnaBindingTarget: "style-core-binding-gonegi-harbor-25s-v1",
  }),
  ...Array.from({ length: 6 }, (_, index) =>
    Object.freeze({
      legacyRecordId: `SCENE-MENDES-VAR-${index + 1}`,
      directorFamily: "Mendes-Deakins",
      rawAuditScore: 9.68,
      observedFieldCount: 20,
      inferredFieldCount: 5,
      sequencePreviousNode: `SCENE-MENDES-VAR-${index}`,
      sequenceCurrentNode: `SCENE-MENDES-VAR-${index + 1}`,
      sequenceNextNode: `SCENE-MENDES-VAR-${index + 2}`,
      twentyFiveSecondCoverageLinkId: null,
      canonicalDnaBindingTarget: "style-core-binding-gonegi-harbor-25s-v1",
    })
  ),
  Object.freeze({
    legacyRecordId: "GONEGI-HARBOR-25S-SEGMENT-001",
    directorFamily: "Gonegi-Harbor-Pilot",
    rawAuditScore: 9.9,
    observedFieldCount: 12,
    inferredFieldCount: 4,
    sequencePreviousNode: "gonegi-harbor-pilot-intro",
    sequenceCurrentNode: "segment-001",
    sequenceNextNode: "segment-002",
    twentyFiveSecondCoverageLinkId: "gonegi-harbor-25s-queue-0",
    canonicalDnaBindingTarget: "image-app-final-input-package-gonegi-harbor-25s-v1",
  }),
  Object.freeze({
    legacyRecordId: "GONEGI-HARBOR-25S-SEGMENT-002",
    directorFamily: "Gonegi-Harbor-Pilot",
    rawAuditScore: 9.88,
    observedFieldCount: 12,
    inferredFieldCount: 4,
    sequencePreviousNode: "segment-001",
    sequenceCurrentNode: "segment-002",
    sequenceNextNode: "segment-003",
    twentyFiveSecondCoverageLinkId: "gonegi-harbor-25s-queue-1",
    canonicalDnaBindingTarget: "image-app-final-input-package-gonegi-harbor-25s-v1",
  }),
  Object.freeze({
    legacyRecordId: "GONEGI-HARBOR-25S-SEGMENT-003",
    directorFamily: "Gonegi-Harbor-Pilot",
    rawAuditScore: 9.86,
    observedFieldCount: 12,
    inferredFieldCount: 4,
    sequencePreviousNode: "segment-002",
    sequenceCurrentNode: "segment-003",
    sequenceNextNode: "gonegi-harbor-pilot-outro",
    twentyFiveSecondCoverageLinkId: "gonegi-harbor-25s-queue-2",
    canonicalDnaBindingTarget: "image-app-final-input-package-gonegi-harbor-25s-v1",
  }),
  Object.freeze({
    legacyRecordId: "GOLDEN-GSET-001-SHUN-SILHOUETTE",
    directorFamily: "Golden-Set-Reference",
    rawAuditScore: 9.72,
    observedFieldCount: 8,
    inferredFieldCount: 2,
    sequencePreviousNode: "golden-set-intro",
    sequenceCurrentNode: "gset_001_shun_silhouette",
    sequenceNextNode: "gset_002_steam_stack_angle",
    twentyFiveSecondCoverageLinkId: null,
    canonicalDnaBindingTarget: LEGACY_DNA_TARGET_DATASET_OS_BINDING_ID,
  }),
  Object.freeze({
    legacyRecordId: "GOLDEN-GSET-002-STEAM-STACK-ANGLE",
    directorFamily: "Golden-Set-Reference",
    rawAuditScore: 9.7,
    observedFieldCount: 8,
    inferredFieldCount: 2,
    sequencePreviousNode: "gset_001_shun_silhouette",
    sequenceCurrentNode: "gset_002_steam_stack_angle",
    sequenceNextNode: "gset_003_narrative_bridge_close",
    twentyFiveSecondCoverageLinkId: null,
    canonicalDnaBindingTarget: LEGACY_DNA_TARGET_DATASET_OS_BINDING_ID,
  }),
] as const);

let cachedLegacyDnaUpgradeMap: LegacyDnaUpgradeMap | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

function detectEmptyLayers(): readonly LegacyDnaEmptyLayerKind[] {
  return Object.freeze(["visual_atoms", "relationship_graph"]);
}

function normalizeAuditScore(rawAuditScore: number): number {
  return Number((rawAuditScore / 10).toFixed(6));
}

function resolveVisualAtomsBackfillPlan(legacyRecordId: string): string {
  return [
    "backfill-visual-atoms-from-scene-language",
    legacyRecordId,
    "cinematography-narrative-emotion-tokens",
  ].join("|");
}

function resolveRelationshipGraphBackfillPlan(legacyRecordId: string): string {
  return [
    "backfill-relationship-graph-from-director-dna",
    legacyRecordId,
    "subject-predicate-object-edges",
  ].join("|");
}

function computeUpgradeMapItemId(recordIndex: number, legacyRecordId: string): string {
  return digestValue(
    [
      LEGACY_DNA_UPGRADE_MAP_KIND_VERSION,
      "upgrade-map-item",
      String(recordIndex),
      legacyRecordId,
    ].join("|")
  );
}

function computeUpgradeItemFingerprint(
  item: Omit<LegacyDnaUpgradeMapItem, "upgradeItemFingerprint">
): string {
  return digestValue(
    [
      LEGACY_DNA_UPGRADE_MAP_KIND_VERSION,
      item.upgradeMapItemId,
      String(item.recordIndex),
      item.legacyRecordId,
      item.directorFamily,
      item.emptyLayers.join(","),
      item.visualAtomsBackfillPlan,
      item.relationshipGraphBackfillPlan,
      JSON.stringify(item.observedInferredSplitPlan),
      JSON.stringify(item.confidenceNormalizationPlan),
      JSON.stringify(item.sequenceGraphAlignmentPlan),
      item.canonicalDnaBindingTarget,
      item.twentyFiveSecondCoverageLinkId ?? "none",
    ].join("|")
  );
}

function buildLegacyDnaUpgradeMapItem(
  record: (typeof LEGACY_V826_DNA_RECORD_CATALOG)[number],
  recordIndex: number
): LegacyDnaUpgradeMapItem {
  const emptyLayers = detectEmptyLayers();
  const normalizedAuditScore = normalizeAuditScore(record.rawAuditScore);

  const baseItem: Omit<LegacyDnaUpgradeMapItem, "upgradeItemFingerprint"> = {
    upgradeMapItemId: computeUpgradeMapItemId(recordIndex, record.legacyRecordId),
    legacyRecordId: record.legacyRecordId,
    recordIndex,
    directorFamily: record.directorFamily,
    emptyLayers,
    visualAtomsBackfillPlan: resolveVisualAtomsBackfillPlan(record.legacyRecordId),
    relationshipGraphBackfillPlan: resolveRelationshipGraphBackfillPlan(record.legacyRecordId),
    observedInferredSplitPlan: Object.freeze({
      observedFieldCount: record.observedFieldCount,
      inferredFieldCount: record.inferredFieldCount,
      splitPolicy: "preserve-source-tags",
      normalizationTarget: "dataset-os-provenance-v1",
    }),
    confidenceNormalizationPlan: Object.freeze({
      rawAuditScore: record.rawAuditScore,
      normalizedAuditScore,
      confidenceProfileTarget: normalizedAuditScore,
      auditScoreScale: "0-10-to-0-1",
    }),
    sequenceGraphAlignmentPlan: Object.freeze({
      alignmentPolicy: "25s-pilot-continuity-chain",
      previousNodeBinding: record.sequencePreviousNode,
      currentNodeBinding: record.sequenceCurrentNode,
      nextCandidateBinding: record.sequenceNextNode,
    }),
    canonicalDnaBindingTarget: record.canonicalDnaBindingTarget,
    twentyFiveSecondCoverageLinkId: record.twentyFiveSecondCoverageLinkId,
  };

  return Object.freeze({
    ...baseItem,
    upgradeItemFingerprint: computeUpgradeItemFingerprint(baseItem),
  });
}

function buildEmptyLayerDetectionSummary(
  items: readonly LegacyDnaUpgradeMapItem[]
): LegacyDnaEmptyLayerDetectionSummary {
  const visualAtomsEmptyCount = items.filter((item) =>
    item.emptyLayers.includes("visual_atoms")
  ).length;
  const relationshipGraphEmptyCount = items.filter((item) =>
    item.emptyLayers.includes("relationship_graph")
  ).length;
  const dualEmptyLayerCount = items.filter(
    (item) =>
      item.emptyLayers.includes("visual_atoms") &&
      item.emptyLayers.includes("relationship_graph")
  ).length;

  return Object.freeze({
    totalLegacyRecordCount: items.length,
    visualAtomsEmptyCount,
    relationshipGraphEmptyCount,
    dualEmptyLayerCount,
  });
}

export function buildLegacyDnaUpgradeMap(): LegacyDnaUpgradeMap {
  if (cachedLegacyDnaUpgradeMap !== null) {
    return cachedLegacyDnaUpgradeMap;
  }

  if (LEGACY_V826_DNA_RECORD_CATALOG.length !== 19) {
    throw new Error("Legacy dna upgrade map requires nineteen legacy v82.6 records");
  }

  const items = Object.freeze(
    LEGACY_V826_DNA_RECORD_CATALOG.map((record, recordIndex) =>
      buildLegacyDnaUpgradeMapItem(record, recordIndex)
    )
  );

  const twentyFiveSecondCoverageLinkCount = items.filter(
    (item) => item.twentyFiveSecondCoverageLinkId !== null
  ).length;

  const upgradeMap = Object.freeze({
    version: LEGACY_DNA_UPGRADE_MAP_VERSION,
    mapId: LEGACY_DNA_UPGRADE_MAP_ID,
    legacyDatasetVersion: "v82.6" as const,
    targetDatasetOsBindingId: LEGACY_DNA_TARGET_DATASET_OS_BINDING_ID,
    sourceFingerprint: LEGACY_DNA_SOURCE_FINGERPRINT,
    mapVersion: LEGACY_DNA_UPGRADE_MAP_KIND_VERSION,
    activeMapState: LEGACY_DNA_UPGRADE_MAP_STATE,
    totalLegacyRecordCount: items.length,
    twentyFiveSecondCoverageLinkCount,
    emptyLayerDetection: buildEmptyLayerDetectionSummary(items),
    items,
  });

  cachedLegacyDnaUpgradeMap = upgradeMap;
  return upgradeMap;
}

export const LEGACY_DNA_UPGRADE_MAP_ITEM_KEY_ORDER = Object.freeze([
  "upgradeMapItemId",
  "legacyRecordId",
  "recordIndex",
  "directorFamily",
  "emptyLayers",
  "visualAtomsBackfillPlan",
  "relationshipGraphBackfillPlan",
  "observedInferredSplitPlan",
  "confidenceNormalizationPlan",
  "sequenceGraphAlignmentPlan",
  "canonicalDnaBindingTarget",
  "twentyFiveSecondCoverageLinkId",
  "upgradeItemFingerprint",
] as const);

export const LEGACY_DNA_UPGRADE_MAP_KEY_ORDER = Object.freeze([
  "version",
  "mapId",
  "legacyDatasetVersion",
  "targetDatasetOsBindingId",
  "sourceFingerprint",
  "mapVersion",
  "activeMapState",
  "totalLegacyRecordCount",
  "twentyFiveSecondCoverageLinkCount",
  "emptyLayerDetection",
  "items",
] as const);

export function serializeLegacyDnaUpgradeMap(upgradeMap: LegacyDnaUpgradeMap): string {
  const orderedItems = [...upgradeMap.items]
    .sort((a, b) => a.recordIndex - b.recordIndex)
    .map((item) => orderRecord(item, LEGACY_DNA_UPGRADE_MAP_ITEM_KEY_ORDER));

  const orderedMap: Record<string, unknown> = {};
  for (const key of LEGACY_DNA_UPGRADE_MAP_KEY_ORDER) {
    if (key === "items") {
      orderedMap.items = orderedItems;
    } else if (key === "emptyLayerDetection") {
      orderedMap.emptyLayerDetection = orderRecord(
        upgradeMap.emptyLayerDetection,
        Object.freeze([
          "totalLegacyRecordCount",
          "visualAtomsEmptyCount",
          "relationshipGraphEmptyCount",
          "dualEmptyLayerCount",
        ])
      );
    } else {
      orderedMap[key] = upgradeMap[key as keyof LegacyDnaUpgradeMap];
    }
  }

  return JSON.stringify(orderedMap);
}

export function computeLegacyDnaUpgradeMapFingerprint(
  upgradeMap: LegacyDnaUpgradeMap
): string {
  return digestValue(serializeLegacyDnaUpgradeMap(upgradeMap));
}

export function resetLegacyDnaUpgradeMapCacheForVerification(): void {
  cachedLegacyDnaUpgradeMap = null;
}
