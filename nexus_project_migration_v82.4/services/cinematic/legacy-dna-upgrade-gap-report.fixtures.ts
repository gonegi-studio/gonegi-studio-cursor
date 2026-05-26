import { LEGACY_DNA_UPGRADE_BINDING_OUTPUT_EXAMPLE } from "./legacy-dna-upgrade-binding.fixtures.ts";
import {
  buildLegacyDnaUpgradeGapReport,
  computeLegacyDnaUpgradeGapReportFingerprint,
} from "./legacy-dna-upgrade-gap-report.ts";

export const LEGACY_DNA_UPGRADE_GAP_REPORT_INPUT_EXAMPLE = Object.freeze({
  legacyDnaUpgradeBinding: LEGACY_DNA_UPGRADE_BINDING_OUTPUT_EXAMPLE,
});

export const LEGACY_DNA_UPGRADE_GAP_REPORT_OUTPUT_EXAMPLE = buildLegacyDnaUpgradeGapReport(
  LEGACY_DNA_UPGRADE_GAP_REPORT_INPUT_EXAMPLE.legacyDnaUpgradeBinding
);

export const LEGACY_DNA_UPGRADE_GAP_REPORT_FINGERPRINT = computeLegacyDnaUpgradeGapReportFingerprint(
  LEGACY_DNA_UPGRADE_GAP_REPORT_OUTPUT_EXAMPLE
);

export const LEGACY_DNA_UPGRADE_GAP_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  legacyRecordId: "SCENE-LUMET-COURTROOM-CLIMAX",
  legacySchemaVersion: "v82.6" as const,
  primaryGapType: "inferred-heavy-provenance" as const,
  upgradeUrgency: "elevated" as const,
  detectedGapTypes: Object.freeze([
    "empty-visual-atoms",
    "empty-relationship-graph",
    "legacy-unbound-metadata",
    "inferred-heavy-provenance",
  ]),
});

export const LEGACY_DNA_UPGRADE_GAP_REPORT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  reportId: "legacy-dna-upgrade-gap-report-gonegi-harbor-25s-v1",
  reportVersion: "legacy-dna-upgrade-gap-report-v1" as const,
  activeReportState: "25s-legacy-dna-upgrade-gap-report-metadata-only",
  gapDetection: Object.freeze({
    totalLegacyGapItemCount: 19,
    visualAtomsEmptyGapCount: 19,
    relationshipGraphEmptyGapCount: 19,
    inferredHeavyGapCount: 10,
    twentyFiveSecondBoundGapCount: 3,
    archiveMetadataPendingGapCount: 2,
    legacyUnboundGapCount: 14,
  }),
});
