import crypto from "crypto";

export function sortIntegrityChecksums(checksums: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(checksums).sort(([a], [b]) => a.localeCompare(b))
  );
}

export function computeIntegrityFingerprint<T extends { generated_at: string }>(manifest: T): string {
  const { generated_at, ...stable } = manifest;
  return crypto.createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}
