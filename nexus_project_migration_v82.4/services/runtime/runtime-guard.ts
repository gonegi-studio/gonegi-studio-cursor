import fs from "node:fs";

const BLOCKED_SYNC = Object.freeze([
  "writeFileSync",
  "appendFileSync",
  "mkdirSync",
  "rmSync",
] as const);

const BLOCKED_ASYNC = Object.freeze(["writeFile", "appendFile", "mkdir", "rm"] as const);

let readonlyDepth = 0;
let patched = false;

function guardError(method: string): Error {
  return new Error(`[NEXUS] Runtime readonly guard blocked fs.${method}`);
}

function installRuntimeGuardPatches(): void {
  if (patched) {
    return;
  }
  patched = true;

  for (const method of BLOCKED_SYNC) {
    const original = fs[method].bind(fs);
    (fs as Record<string, unknown>)[method] = (...args: unknown[]) => {
      if (readonlyDepth > 0) {
        throw guardError(method);
      }
      return original(...args);
    };
  }

  for (const method of BLOCKED_ASYNC) {
    const original = fs.promises[method].bind(fs.promises);
    (fs.promises as Record<string, unknown>)[method] = (...args: unknown[]) => {
      if (readonlyDepth > 0) {
        throw guardError(`promises.${method}`);
      }
      return original(...args);
    };
  }
}

export function runWithRuntimeReadonlyGuard<T>(fn: () => T): T {
  installRuntimeGuardPatches();
  readonlyDepth += 1;
  try {
    return fn();
  } finally {
    readonlyDepth -= 1;
  }
}
