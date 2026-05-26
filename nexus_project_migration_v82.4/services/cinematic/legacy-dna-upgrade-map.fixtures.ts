import {
  buildLegacyDnaUpgradeMap,
  computeLegacyDnaUpgradeMapFingerprint,
  LEGACY_V826_DNA_RECORD_CATALOG,
} from "./legacy-dna-upgrade-map.ts";

export const LEGACY_DNA_UPGRADE_MAP_OUTPUT_EXAMPLE = buildLegacyDnaUpgradeMap();

export const LEGACY_DNA_UPGRADE_MAP_FINGERPRINT = computeLegacyDnaUpgradeMapFingerprint(
  LEGACY_DNA_UPGRADE_MAP_OUTPUT_EXAMPLE
);

export const LEGACY_DNA_UPGRADE_MAP_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  legacyRecordId: "SCENE-LUMET-COURTROOM-CLIMAX",
  recordIndex: 0,
  directorFamily: "Lumet-Courtroom",
  emptyLayers: Object.freeze(["visual_atoms", "relationship_graph"]),
  visualAtomsBackfillPlan:
    "backfill-visual-atoms-from-scene-language|SCENE-LUMET-COURTROOM-CLIMAX|cinematography-narrative-emotion-tokens",
  canonicalDnaBindingTarget: "character-dna-binding-gonegi-harbor-25s-v1",
  twentyFiveSecondCoverageLinkId: null,
});

export const LEGACY_DNA_UPGRADE_MAP_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  mapId: "legacy-dna-upgrade-map-gonegi-harbor-25s-v1",
  legacyDatasetVersion: "v82.6" as const,
  mapVersion: "legacy-dna-upgrade-map-v1" as const,
  activeMapState: "25s-legacy-dna-upgrade-map-metadata-only",
  totalLegacyRecordCount: LEGACY_V826_DNA_RECORD_CATALOG.length,
  twentyFiveSecondCoverageLinkCount: 3,
});

export const LEGACY_DNA_UPGRADE_MAP_EMPTY_LAYER_OUTPUT_EXAMPLE = Object.freeze({
  totalLegacyRecordCount: 19,
  visualAtomsEmptyCount: 19,
  relationshipGraphEmptyCount: 19,
  dualEmptyLayerCount: 19,
});
