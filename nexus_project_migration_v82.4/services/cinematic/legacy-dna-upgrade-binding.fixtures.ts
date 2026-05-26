import { DATASET_LOCK_MANIFEST_OUTPUT_EXAMPLE } from "./dataset-lock-manifest.fixtures.ts";
import { DATASET_READINESS_BINDING_OUTPUT_EXAMPLE } from "./dataset-readiness-binding.fixtures.ts";
import { LEGACY_DNA_UPGRADE_MAP_OUTPUT_EXAMPLE } from "./legacy-dna-upgrade-map.fixtures.ts";
import {
  buildLegacyDnaUpgradeBinding,
  computeLegacyDnaUpgradeBindingFingerprint,
} from "./legacy-dna-upgrade-binding.ts";

export const LEGACY_DNA_UPGRADE_BINDING_INPUT_EXAMPLE = Object.freeze({
  legacyDnaUpgradeMap: LEGACY_DNA_UPGRADE_MAP_OUTPUT_EXAMPLE,
  datasetReadinessBinding: DATASET_READINESS_BINDING_OUTPUT_EXAMPLE,
  datasetLockManifest: DATASET_LOCK_MANIFEST_OUTPUT_EXAMPLE,
});

export const LEGACY_DNA_UPGRADE_BINDING_OUTPUT_EXAMPLE = buildLegacyDnaUpgradeBinding(
  LEGACY_DNA_UPGRADE_BINDING_INPUT_EXAMPLE.legacyDnaUpgradeMap,
  LEGACY_DNA_UPGRADE_BINDING_INPUT_EXAMPLE.datasetReadinessBinding,
  LEGACY_DNA_UPGRADE_BINDING_INPUT_EXAMPLE.datasetLockManifest
);

export const LEGACY_DNA_UPGRADE_BINDING_FINGERPRINT = computeLegacyDnaUpgradeBindingFingerprint(
  LEGACY_DNA_UPGRADE_BINDING_OUTPUT_EXAMPLE
);

export const LEGACY_DNA_UPGRADE_BINDING_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  legacyRecordId: "SCENE-LUMET-COURTROOM-CLIMAX",
  legacySchemaVersion: "v82.6" as const,
  targetDatasetQueue: "legacy-archive-slot-00",
  upgradePriority: "deferred" as const,
  bindingStatus: "legacy-unbound-metadata" as const,
});

export const LEGACY_DNA_UPGRADE_BINDING_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  bindingRootId: "legacy-dna-upgrade-binding-gonegi-harbor-25s-v1",
  bindingVersion: "legacy-dna-upgrade-binding-v1" as const,
  activeBindingState: "25s-legacy-dna-upgrade-binding-metadata-only",
  totalLegacyBindingCount: 19,
  twentyFiveSecondLinkCount: 3,
});
