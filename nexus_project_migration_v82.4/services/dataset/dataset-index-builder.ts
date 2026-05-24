import crypto from "crypto";
import type { EvidenceBundle } from "../evidence/evidence.types.ts";
import type { EvidenceKind } from "../evidence/evidence.types.ts";
import { serializeEvidenceBundle } from "../evidence/evidence-assembler.ts";
import type { DatasetIndex, DatasetPartition, DatasetRecordRef } from "./dataset.types.ts";
import { DATASET_INDEX_VERSION } from "./dataset.types.ts";

function resolvePartition(kind: EvidenceKind): DatasetPartition {
  switch (kind) {
    case "scene-dna":
      return "scene-corpus";
    case "checksum":
      return "golden-set";
    case "manifest-ref":
    case "export-snapshot":
      return "evidence-archive";
  }
}

function buildRecordFromArtifact(
  artifact: EvidenceBundle["artifacts"][number]
): DatasetRecordRef {
  return Object.freeze({
    partition: resolvePartition(artifact.kind),
    recordId: artifact.id,
    relativePath: artifact.sourcePath,
  });
}

function sortBundles(bundles: readonly EvidenceBundle[]): EvidenceBundle[] {
  return [...bundles].sort((a, b) =>
    serializeEvidenceBundle(a).localeCompare(serializeEvidenceBundle(b))
  );
}

export function buildDatasetIndex(bundles: readonly EvidenceBundle[]): DatasetIndex {
  const records: DatasetRecordRef[] = [];

  for (const bundle of sortBundles(bundles)) {
    const sortedArtifacts = [...bundle.artifacts].sort((a, b) => a.id.localeCompare(b.id));
    for (const artifact of sortedArtifacts) {
      records.push(buildRecordFromArtifact(artifact));
    }
  }

  records.sort((a, b) => {
    const partitionCmp = a.partition.localeCompare(b.partition);
    if (partitionCmp !== 0) {
      return partitionCmp;
    }
    return a.recordId.localeCompare(b.recordId);
  });

  const partitions = Object.freeze(
    [...new Set(records.map((record) => record.partition))].sort((a, b) => a.localeCompare(b))
  );

  return Object.freeze({
    version: DATASET_INDEX_VERSION,
    partitions,
    records: Object.freeze(records),
  });
}

export const DATASET_INDEX_KEY_ORDER = Object.freeze(["version", "partitions", "records"] as const);

export const DATASET_RECORD_KEY_ORDER = Object.freeze([
  "partition",
  "recordId",
  "relativePath",
] as const);

export function serializeDatasetIndex(index: DatasetIndex): string {
  const orderedRecords = [...index.records]
    .sort((a, b) => {
      const partitionCmp = a.partition.localeCompare(b.partition);
      if (partitionCmp !== 0) {
        return partitionCmp;
      }
      return a.recordId.localeCompare(b.recordId);
    })
    .map((record) => {
      const ordered: Record<string, unknown> = {};
      for (const key of DATASET_RECORD_KEY_ORDER) {
        ordered[key] = record[key as keyof DatasetRecordRef];
      }
      return ordered;
    });

  const ordered: Record<string, unknown> = {
    version: index.version,
    partitions: [...index.partitions].sort((a, b) => a.localeCompare(b)),
    records: orderedRecords,
  };

  return JSON.stringify(ordered);
}

export function computeDatasetFingerprint(index: DatasetIndex): string {
  return crypto.createHash("sha256").update(serializeDatasetIndex(index)).digest("hex");
}
