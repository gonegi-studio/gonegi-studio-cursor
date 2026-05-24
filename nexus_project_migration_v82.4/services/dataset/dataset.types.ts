/** Phase-2A: dataset partition — type scaffold only (zero-runtime) */

export type DatasetPartition = "golden-set" | "scene-corpus" | "evidence-archive";

export type DatasetRecordRef = {
  partition: DatasetPartition;
  recordId: string;
  relativePath: string;
};

export type DatasetIndex = {
  version: "v1";
  partitions: readonly DatasetPartition[];
  records: readonly DatasetRecordRef[];
};

export const DATASET_INDEX_VERSION = "v1" as const;

export const DATASET_PARTITIONS: readonly DatasetPartition[] = Object.freeze([
  "golden-set",
  "scene-corpus",
  "evidence-archive",
]);
