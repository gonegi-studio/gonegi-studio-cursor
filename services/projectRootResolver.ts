import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_FOLDER_NAME = 'Gonegi-Studio-Cursor' as const;
export const EXPORTS_DIR_NAME = 'exports' as const;

const DESKTOP_FOLDER_NAMES = ['바탕 화면', 'Desktop'] as const;

export function findPackageJsonRoot(startDir?: string): string {
  let current = path.resolve(startDir ?? process.cwd());

  if (fs.existsSync(path.join(current, 'package.json'))) {
    return current;
  }

  while (true) {
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
    if (fs.existsSync(path.join(current, 'package.json'))) {
      return current;
    }
  }

  return path.resolve(startDir ?? process.cwd());
}

function isGonegiProjectRoot(dir: string): boolean {
  return (
    path.basename(dir) === PROJECT_FOLDER_NAME &&
    fs.existsSync(path.join(dir, EXPORTS_DIR_NAME)) &&
    fs.existsSync(path.join(dir, '.git'))
  );
}

function findGonegiRootFromPath(startDir: string): string | null {
  let current = path.resolve(startDir);

  while (true) {
    if (isGonegiProjectRoot(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

export function discoverGonegiStudioRoot(): string | null {
  const userProfile = process.env.USERPROFILE;
  if (!userProfile) {
    return null;
  }

  const oneDriveRoot = path.join(userProfile, 'OneDrive');
  if (!fs.existsSync(oneDriveRoot)) {
    return null;
  }

  for (const desktopName of DESKTOP_FOLDER_NAMES) {
    const candidate = path.join(oneDriveRoot, desktopName, PROJECT_FOLDER_NAME);
    if (isGonegiProjectRoot(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function resolveProjectRoot(startDir?: string): string {
  const start = path.resolve(startDir ?? process.cwd());

  const gonegiFromPath = findGonegiRootFromPath(start);
  if (gonegiFromPath) {
    return gonegiFromPath;
  }

  if (fs.existsSync(path.join(start, 'package.json'))) {
    const discovered = discoverGonegiStudioRoot();
    if (discovered) {
      return discovered;
    }
    return start;
  }

  const packageRoot = findPackageJsonRoot(start);
  const discovered = discoverGonegiStudioRoot();
  if (discovered) {
    return discovered;
  }

  return packageRoot;
}

export function resolveExportsRoot(startDir?: string): string {
  return path.join(resolveProjectRoot(startDir), EXPORTS_DIR_NAME);
}

export function resolveProjectRelativePath(relativePath: string, startDir?: string): string {
  return path.join(resolveProjectRoot(startDir), relativePath);
}

export function resolveExportsRelativePath(relativePath: string, startDir?: string): string {
  return path.join(resolveExportsRoot(startDir), relativePath);
}

export function isForbiddenExportAbsolutePath(absolutePath: string): boolean {
  const normalized = path.normalize(absolutePath);
  const exportRoot = path.normalize(resolveExportsRoot());
  const wrongHomeGonegi = path.normalize(
    path.join(process.env.USERPROFILE ?? '', PROJECT_FOLDER_NAME, EXPORTS_DIR_NAME)
  );

  if (normalized.includes(wrongHomeGonegi)) {
    return true;
  }

  return !normalized.startsWith(exportRoot);
}

export function resolveExportAssetPathOrThrow(relativeExportPath: string, startDir?: string): string {
  const projectRoot = resolveProjectRoot(startDir);
  const packageRoot = findPackageJsonRoot(startDir);
  const candidates = [
    path.join(projectRoot, relativeExportPath),
    path.join(packageRoot, relativeExportPath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Missing export asset: ${relativeExportPath}`);
}

export function resolveScriptProjectRoot(importMetaUrl: string): string {
  const scriptDir = path.dirname(fileURLToPath(importMetaUrl));
  return resolveProjectRoot(scriptDir);
}

export function getProjectRootDiagnostics(startDir?: string): {
  process_cwd: string;
  resolved_project_root: string;
  resolved_export_root: string;
  package_json_root: string;
  discovered_gonegi_root: string | null;
} {
  return {
    process_cwd: process.cwd(),
    resolved_project_root: resolveProjectRoot(startDir),
    resolved_export_root: resolveExportsRoot(startDir),
    package_json_root: findPackageJsonRoot(startDir),
    discovered_gonegi_root: discoverGonegiStudioRoot(),
  };
}

/** @deprecated use findPackageJsonRoot */
export function findWorkspaceRoot(startDir?: string): string {
  return findPackageJsonRoot(startDir);
}
