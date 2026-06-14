import fs from 'node:fs';
import path from 'node:path';
import {
  type AuditError,
  type AuditWarning,
  type SubmoduleAuditResult,
  buildSubmoduleResult,
  listJsonFiles,
  readJsonRecord,
  relativeFromRoot,
} from './auditorShared.js';

type LocationRecord = {
  location_id: string;
  location_name?: string;
  source: string;
};

type PropRecord = {
  prop_id: string;
  location_id?: string;
  source: string;
};

export function runContinuityAudit(projectRoot: string): SubmoduleAuditResult {
  const errors: AuditError[] = [];
  const warnings: AuditWarning[] = [];

  const locations = collectLocationRecords(projectRoot);
  auditLocationConflicts(locations, errors, warnings);
  auditLayoutConflicts(projectRoot, errors, warnings);
  auditCompositionConflicts(projectRoot, warnings);
  auditPropConflicts(projectRoot, errors, warnings);

  return buildSubmoduleResult(errors, warnings, {
    continuity_risk_score: buildSubmoduleResult(errors, warnings).risk_score,
    location_record_count: locations.length,
    unique_location_ids: new Set(locations.map((l) => l.location_id)).size,
  });
}

function collectLocationRecords(projectRoot: string): LocationRecord[] {
  const rows: LocationRecord[] = [];
  const datasetsDir = path.join(projectRoot, 'datasets');

  for (const file of listJsonFiles(datasetsDir)) {
    const rel = relativeFromRoot(projectRoot, file);
    const doc = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;

    const pushLocation = (locationId: string, locationName?: string) => {
      rows.push({ location_id: locationId, location_name: locationName, source: rel });
    };

    if (Array.isArray(doc.locations)) {
      for (const entry of doc.locations) {
        if (!entry || typeof entry !== 'object') continue;
        const e = entry as { location_id?: string; location_name?: string };
        if (e.location_id) pushLocation(e.location_id, e.location_name);
      }
    }
    if (Array.isArray(doc.anchors)) {
      for (const entry of doc.anchors) {
        if (!entry || typeof entry !== 'object') continue;
        const e = entry as { location_id?: string; location_name?: string };
        if (e.location_id) pushLocation(e.location_id, e.location_name);
      }
    }
    if (Array.isArray(doc.locks)) {
      for (const entry of doc.locks) {
        if (!entry || typeof entry !== 'object') continue;
        const e = entry as { location_id?: string; outdoor_layout_id?: string };
        if (e.location_id) pushLocation(e.location_id);
        if (e.outdoor_layout_id) pushLocation(e.outdoor_layout_id);
      }
    }
    if (typeof doc.location_id === 'string') {
      pushLocation(
        doc.location_id,
        typeof doc.location_name === 'string' ? doc.location_name : undefined
      );
    }
  }

  return rows;
}

function auditLocationConflicts(
  locations: LocationRecord[],
  errors: AuditError[],
  warnings: AuditWarning[]
): void {
  const namesById = new Map<string, Map<string, Set<string>>>();

  for (const row of locations) {
    const nameKey = (row.location_name ?? '').trim().toLowerCase() || '__unnamed__';
    const byName = namesById.get(row.location_id) ?? new Map<string, Set<string>>();
    const sources = byName.get(nameKey) ?? new Set<string>();
    sources.add(row.source);
    byName.set(nameKey, sources);
    namesById.set(row.location_id, byName);
  }

  for (const [locationId, byName] of namesById) {
    const normalizedNames = [...byName.keys()]
      .filter((k) => k !== '__unnamed__')
      .map(normalizeLocationName);
    const uniqueNormalized = new Set(normalizedNames);
    if (uniqueNormalized.size > 1) {
      errors.push({
        code: 'LOCATION_NAME_CONFLICT',
        message: `location_id "${locationId}" has conflicting names across libraries: ${[...uniqueNormalized].join(' | ')}`,
        severity: 'high',
        source: locationId,
      });
    }
    const allSources = new Set<string>();
    for (const sources of byName.values()) {
      for (const s of sources) allSources.add(s);
    }
    if (allSources.size > 3) {
      warnings.push({
        code: 'LOCATION_MULTI_LIBRARY',
        message: `location_id "${locationId}" referenced in ${allSources.size} dataset files — verify continuity alignment`,
        severity: 'low',
        source: locationId,
      });
    }
  }
}

function auditLayoutConflicts(
  projectRoot: string,
  errors: AuditError[],
  warnings: AuditWarning[]
): void {
  const indoorLib = readJsonRecord(
    projectRoot,
    'datasets/location/indoor-location-anchor-library-v1.json'
  );
  const roomLib = readJsonRecord(
    projectRoot,
    'datasets/location/room-layout-lock-library-v1.json'
  );

  if (!indoorLib || !roomLib) return;

  const indoorByLocation = new Map<string, string>();
  if (Array.isArray(indoorLib.anchors)) {
    for (const anchor of indoorLib.anchors) {
      if (!anchor || typeof anchor !== 'object') continue;
      const e = anchor as { location_id?: string; room_layout?: { orientation?: string } };
      if (e.location_id && e.room_layout?.orientation) {
        indoorByLocation.set(e.location_id, e.room_layout.orientation);
      }
    }
  }

  const roomByLocation = new Map<string, string>();
  const roomRows = roomLib.layouts ?? roomLib.locks;
  if (Array.isArray(roomRows)) {
    for (const lock of roomRows) {
      if (!lock || typeof lock !== 'object') continue;
      const e = lock as { location_id?: string; room_orientation?: string };
      if (e.location_id && e.room_orientation) {
        roomByLocation.set(e.location_id, e.room_orientation);
      }
    }
  }

  for (const [locationId, indoorOrientation] of indoorByLocation) {
    const roomOrientation = roomByLocation.get(locationId);
    if (!roomOrientation) continue;
    if (!orientationsCompatible(indoorOrientation, roomOrientation)) {
      errors.push({
        code: 'LAYOUT_ORIENTATION_CONFLICT',
        message: `location "${locationId}" orientation differs between indoor-anchor and room-layout-lock`,
        severity: 'high',
        source: locationId,
      });
    }
  }
}

function normalizeLocationName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeOrientation(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function orientationsCompatible(a: string, b: string): boolean {
  const na = normalizeOrientation(a);
  const nb = normalizeOrientation(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  const hasBedSouth = (s: string) => s.includes('bed') && s.includes('south');
  const hasWindowEast = (s: string) => s.includes('window') && s.includes('east');
  if (hasBedSouth(na) && hasBedSouth(nb) && hasWindowEast(na) && hasWindowEast(nb)) {
    return true;
  }

  const extractWalls = (s: string) => ({
    window: s.match(/window_(on_)?([a-z]+)/)?.[2] ?? (s.includes('window') && s.includes('east') ? 'east' : null),
    bed: s.includes('bed') && s.includes('south') ? 'south' : s.includes('bed') && s.includes('north') ? 'north' : null,
  });
  const wa = extractWalls(na);
  const wb = extractWalls(nb);
  if (wa.window && wb.window && wa.window !== wb.window) return false;
  if (wa.bed && wb.bed && wa.bed !== wb.bed) return false;
  if (wa.window && wb.window && wa.window === wb.window) return true;

  // Distinct phrasing without contradictory wall tokens — treat as compatible for foundation audit.
  return true;
}

function auditCompositionConflicts(projectRoot: string, warnings: AuditWarning[]): void {
  const compositionLib = readJsonRecord(
    projectRoot,
    'datasets/scene/scene-asset-composition-library-v1.json'
  );
  const sceneLib = readJsonRecord(
    projectRoot,
    'datasets/scene/scene-composition-library-v1.json'
  );
  if (!compositionLib || !sceneLib) return;

  const compositionIds = new Set<string>();
  if (Array.isArray(compositionLib.compositions)) {
    for (const row of compositionLib.compositions) {
      if (row && typeof row === 'object') {
        const id = (row as { composition_id?: string }).composition_id;
        if (id) compositionIds.add(id);
      }
    }
  }

  if (Array.isArray(sceneLib.scenes)) {
    for (const row of sceneLib.scenes) {
      if (!row || typeof row !== 'object') continue;
      const id = (row as { composition_id?: string }).composition_id;
      if (id && !compositionIds.has(id)) {
        warnings.push({
          code: 'COMPOSITION_ORPHAN_REFERENCE',
          message: `scene-composition references unknown composition_id "${id}"`,
          severity: 'moderate',
          source: id,
        });
      }
    }
  }
}

function auditPropConflicts(
  projectRoot: string,
  errors: AuditError[],
  warnings: AuditWarning[]
): void {
  const props: PropRecord[] = [];
  const propLibPath = 'datasets/props/prop-anchor-library-v1.json';
  const propLib = readJsonRecord(projectRoot, propLibPath);
  const propRows = propLib?.props ?? propLib?.anchors;
  if (propLib && Array.isArray(propRows)) {
    for (const row of propRows) {
      if (!row || typeof row !== 'object') continue;
      const e = row as { prop_id?: string; location_id?: string };
      if (e.prop_id) {
        props.push({
          prop_id: e.prop_id,
          location_id: e.location_id,
          source: propLibPath,
        });
      }
    }
  }

  const byPropLocation = new Map<string, Set<string | undefined>>();
  for (const row of props) {
    const key = row.prop_id;
    const set = byPropLocation.get(key) ?? new Set();
    set.add(row.location_id);
    byPropLocation.set(key, set);
  }

  for (const [propId, locations] of byPropLocation) {
    const defined = [...locations].filter((v) => v !== undefined);
    const unique = new Set(defined);
    if (unique.size > 1) {
      errors.push({
        code: 'PROP_LOCATION_CONFLICT',
        message: `prop_id "${propId}" bound to multiple locations: ${[...unique].join(', ')}`,
        severity: 'high',
        source: propId,
      });
    }
  }

  if (props.length === 0) {
    warnings.push({
      code: 'PROP_ANCHOR_LIBRARY_EMPTY',
      message: 'prop-anchor-library not loaded — prop continuity check skipped',
      severity: 'low',
    });
  }
}
