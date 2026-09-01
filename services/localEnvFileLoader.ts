import fs from 'node:fs';
import path from 'node:path';

const LOCAL_ENV_FILE_CANDIDATES = ['.env.local', '.env'] as const;

export interface LocalEnvFileLoadResult {
  loaded_from: string | null;
  keys_applied: string[];
}

/**
 * PHASE-AGENT-CONNECTOR-002: loads real API credentials from a local,
 * gitignored file (never committed — see .gitignore) into process.env for
 * this process only. Only key NAMES are ever returned or logged — values
 * are read into process.env directly and never surface in any return value,
 * console output, or report. An already-set real environment variable (e.g.
 * from an inline `KEY=value command` prefix) always takes precedence and is
 * never overwritten by the file.
 */
export function loadLocalEnvFile(root: string): LocalEnvFileLoadResult {
  for (const filename of LOCAL_ENV_FILE_CANDIDATES) {
    const abs = path.join(root, filename);
    if (!fs.existsSync(abs)) continue;

    const raw = fs.readFileSync(abs, 'utf8');
    const keysApplied: string[] = [];
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!key) continue;
      if (process.env[key] === undefined) {
        process.env[key] = value;
        keysApplied.push(key);
      }
    }
    return { loaded_from: filename, keys_applied: keysApplied };
  }
  return { loaded_from: null, keys_applied: [] };
}
