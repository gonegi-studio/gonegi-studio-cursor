import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH,
} from './verticalAiProjectUnderstandingFoundationV1Engine.js';
import { PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH } from './projectBrainMasterSnapshotV1Engine.js';
import { REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH } from './repositoryIntelligenceBundleProductionCertificationV1Engine.js';
import { REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH } from './repositoryIntelligenceAccessProductionCertificationV1Engine.js';
import { AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH } from './agentRuntimeProductionCertificationV1Engine.js';
import { CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH } from './consumerIntegrationProductionCertificationV1Engine.js';
import { REPOSITORY_INVENTORY_V1_REGISTRY_PATH } from './repositoryInventoryImplementationV1Engine.js';
import { REPOSITORY_INTELLIGENCE_BUNDLE_V1_PATH } from './repositoryIntelligenceBundleIntegrationImplementationV1Engine.js';
import { REPOSITORY_INTELLIGENCE_ACCESS_CONTRACT_V1_PATH } from './repositoryIntelligenceAccessContractV1Engine.js';
import { createAccessApi, type AccessApi } from './repositoryIntelligenceAccessV1.js';

export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SEMVER = '1.0.0' as const;

/**
 * Public component identity of Project Understanding Runtime.
 * `understanding_runtime` is the only public orchestration surface; other
 * modules are internal and replaceable.
 */
export const PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS = [
  'repository_scanner',
  'component_resolver',
  'dependency_resolver',
  'duplicate_detector',
  'reuse_analyzer',
  'gap_detector',
  'understanding_runtime',
  'understanding_cache',
  'runtime_reproducibility',
  'understanding_evidence',
  'reference_resolver',
] as const;

export type ProjectUnderstandingRuntimeComponentId =
  (typeof PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS)[number];

export interface ScannedSurface {
  surface_id: string;
  kind: 'platform_core' | 'cil' | 'repository_intelligence' | 'foundation' | 'inventory';
  ref: string;
  present: boolean;
  fingerprint: string | null;
}

export interface RepositoryScanResult {
  surfaces: ScannedSurface[];
  surface_count: number;
  inventory_registry_present: boolean;
  scan_fingerprint: string;
  read_only: true;
  repository_mutated: false;
}

export interface ResolvedComponent {
  component_id: string;
  name: string;
  foundation_bound: boolean;
  runtime_bound: boolean;
  source_refs: string[];
  present: boolean;
}

export interface ComponentResolutionResult {
  components: ResolvedComponent[];
  resolved_count: number;
  resolution_fingerprint: string;
}

export interface DependencyEdge {
  from: string;
  to: string;
  kind: 'consumes' | 'follows' | 'requires';
}

export interface DependencyResolutionResult {
  edges: DependencyEdge[];
  acyclic: boolean;
  order: string[];
  dependency_fingerprint: string;
}

export interface DuplicateCandidate {
  signature: string;
  component_ids: string[];
  severity: 'info' | 'warning';
}

export interface DuplicateDetectionResult {
  duplicates: DuplicateCandidate[];
  duplicate_count: number;
  detection_fingerprint: string;
}

export interface ReuseCandidate {
  component_id: string;
  reuse_score: number;
  evidence: string[];
  create_proposed: false;
}

export interface ReuseAnalysisResult {
  candidates: ReuseCandidate[];
  reuse_before_create: true;
  analysis_fingerprint: string;
}

export interface GapRecord {
  gap_id: string;
  description: string;
  blocked_by_reuse: boolean;
  evidence: string[];
}

export interface GapDetectionResult {
  gaps: GapRecord[];
  gap_count: number;
  detection_fingerprint: string;
}

export interface ResolvedReferenceDescriptor {
  reference_id: string;
  source_ref: string;
  validated: boolean;
  fingerprint: string | null;
  resolved_fingerprint: string;
}

export interface ReferenceResolutionResult {
  references: ResolvedReferenceDescriptor[];
  resolution_fingerprint: string;
  reference_only: true;
}

export interface UnderstandingEvidenceBundle {
  evidence_items: Array<{ evidence_id: string; ref: string; fingerprint: string | null }>;
  evidence_precedes_conclusions: true;
  evidence_fingerprint: string;
}

export interface UnderstandingCacheEntry {
  cache_key: string;
  result_fingerprint: string;
  ephemeral: true;
}

export interface UnderstandingRunResult {
  run_id: string;
  scan: RepositoryScanResult;
  components: ComponentResolutionResult;
  dependencies: DependencyResolutionResult;
  duplicates: DuplicateDetectionResult;
  reuse: ReuseAnalysisResult;
  gaps: GapDetectionResult;
  references: ReferenceResolutionResult;
  evidence: UnderstandingEvidenceBundle;
  cache: UnderstandingCacheEntry;
  result_fingerprint: string;
  reproducible: boolean;
  repository_first: true;
  reuse_before_create: true;
  write_authorized: false;
  human_approval_required_before_write: true;
  read_only: true;
  reference_only: true;
  ephemeral: true;
}

export interface UnderstandingRuntimeInterfaceDescription {
  version: string;
  component_ids: ProjectUnderstandingRuntimeComponentId[];
  public_surface: 'understanding_runtime';
  read_only: true;
  reference_only: true;
  repository_first: true;
  reuse_before_create: true;
  human_approval_required_before_write: true;
  write_authorized: false;
  implementation: true;
}

export interface UnderstandingRuntimeApi {
  describeInterface(): UnderstandingRuntimeInterfaceDescription;
  understand(runId?: string): UnderstandingRunResult;
  requestWrite(action: string): { authorized: false; reason: string; requires_human_approval: true };
}

export type UnderstandingRuntimeDeps = {
  createAccessApi?: (root: string) => AccessApi;
  createCache?: () => UnderstandingCache;
};

const CERTIFIED_SCAN_SURFACES: Array<Omit<ScannedSurface, 'present' | 'fingerprint'>> = [
  { surface_id: 'project_brain_master', kind: 'platform_core', ref: PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH },
  {
    surface_id: 'repository_intelligence_bundle_master',
    kind: 'platform_core',
    ref: REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
  },
  {
    surface_id: 'repository_intelligence_access_master',
    kind: 'platform_core',
    ref: REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
  },
  { surface_id: 'agent_runtime_master', kind: 'platform_core', ref: AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH },
  { surface_id: 'cil_master', kind: 'cil', ref: CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH },
  { surface_id: 'rib_bundle', kind: 'repository_intelligence', ref: REPOSITORY_INTELLIGENCE_BUNDLE_V1_PATH },
  {
    surface_id: 'access_contract',
    kind: 'repository_intelligence',
    ref: REPOSITORY_INTELLIGENCE_ACCESS_CONTRACT_V1_PATH,
  },
  { surface_id: 'inventory_registry', kind: 'inventory', ref: REPOSITORY_INVENTORY_V1_REGISTRY_PATH },
  {
    surface_id: 'understanding_foundation',
    kind: 'foundation',
    ref: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
  },
  {
    surface_id: 'understanding_component_model',
    kind: 'foundation',
    ref: VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
  },
  {
    surface_id: 'understanding_workflow',
    kind: 'foundation',
    ref: VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH,
  },
  {
    surface_id: 'understanding_architecture',
    kind: 'foundation',
    ref: VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH,
  },
  {
    surface_id: 'understanding_approval_gate',
    kind: 'foundation',
    ref: VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
  },
];

const FOUNDATION_TO_RUNTIME: Record<string, string[]> = {
  repository_discovery: ['repository_scanner'],
  repository_inventory: ['repository_scanner', 'component_resolver'],
  component_lookup: ['component_resolver'],
  reference_resolution: ['reference_resolver'],
  dependency_resolution: ['dependency_resolver'],
  duplicate_detection: ['duplicate_detector'],
  reuse_candidate_analysis: ['reuse_analyzer'],
  understanding_report: ['understanding_runtime'],
  gap_analysis: ['gap_detector'],
  approval_gate: ['understanding_runtime'],
  understanding_evidence: ['understanding_evidence', 'runtime_reproducibility'],
};

const PIPELINE_ORDER = [
  'repository_scanner',
  'reference_resolver',
  'component_resolver',
  'dependency_resolver',
  'duplicate_detector',
  'reuse_analyzer',
  'gap_detector',
  'understanding_evidence',
  'understanding_cache',
  'runtime_reproducibility',
  'understanding_runtime',
] as const;

function stableFingerprint(value: unknown): string {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonical);
    if (input && typeof input === 'object') {
      return Object.keys(input as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = canonical((input as Record<string, unknown>)[key]);
          return acc;
        }, {});
    }
    return input;
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex').slice(0, 16);
}

function fingerprintFile(root: string, rel: string): string | null {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').slice(0, 16);
}

function readJson<T>(root: string, rel: string): T | null {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

export interface UnderstandingCache {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  get(key: string): UnderstandingCacheEntry | null;
  put(key: string, resultFingerprint: string): UnderstandingCacheEntry;
}

export function createUnderstandingCache(): UnderstandingCache {
  const store = new Map<string, UnderstandingCacheEntry>();
  return {
    id: 'understanding_cache',
    get(key: string) {
      return store.get(key) ?? null;
    },
    put(key: string, resultFingerprint: string) {
      const entry: UnderstandingCacheEntry = {
        cache_key: key,
        result_fingerprint: resultFingerprint,
        ephemeral: true,
      };
      store.set(key, entry);
      return entry;
    },
  };
}

export interface RepositoryScanner {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  scan(root: string): RepositoryScanResult;
}

export function createRepositoryScanner(): RepositoryScanner {
  return {
    id: 'repository_scanner',
    scan(root: string): RepositoryScanResult {
      const surfaces: ScannedSurface[] = CERTIFIED_SCAN_SURFACES.map((surface) => ({
        ...surface,
        present: fs.existsSync(path.join(root, surface.ref)),
        fingerprint: fingerprintFile(root, surface.ref),
      })).sort((a, b) => (a.surface_id < b.surface_id ? -1 : a.surface_id > b.surface_id ? 1 : 0));

      return {
        surfaces,
        surface_count: surfaces.length,
        inventory_registry_present: surfaces.some(
          (surface) => surface.surface_id === 'inventory_registry' && surface.present
        ),
        scan_fingerprint: stableFingerprint(
          surfaces.map((surface) => ({
            id: surface.surface_id,
            ref: surface.ref,
            present: surface.present,
            fingerprint: surface.fingerprint,
          }))
        ),
        read_only: true,
        repository_mutated: false,
      };
    },
  };
}

export interface ReferenceResolver {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  resolve(root: string, access: AccessApi, refs: string[]): ReferenceResolutionResult;
}

export function createReferenceResolver(): ReferenceResolver {
  return {
    id: 'reference_resolver',
    resolve(root: string, access: AccessApi, refs: string[]): ReferenceResolutionResult {
      const uniqueRefs = [...new Set(refs)].sort();
      const platformRefs = [
        'brain_reference:project-brain-master-snapshot-v1',
        'bundle_reference:repository-intelligence-bundle-v1',
      ];
      const accessResolved = platformRefs.map((referenceId) => {
        try {
          return access.resolve(referenceId);
        } catch {
          return null;
        }
      });

      const references: ResolvedReferenceDescriptor[] = [
        ...accessResolved
          .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
          .map((entry) => ({
            reference_id: entry.reference_id,
            source_ref: entry.source_ref,
            validated: entry.validated,
            fingerprint: entry.fingerprint,
            resolved_fingerprint: entry.resolved_fingerprint,
          })),
        ...uniqueRefs.map((sourceRef) => {
          const fingerprint = fingerprintFile(root, sourceRef);
          return {
            reference_id: `understanding_ref:${sourceRef}`,
            source_ref: sourceRef,
            validated: fingerprint !== null,
            fingerprint,
            resolved_fingerprint: fingerprint ?? 'missing',
          };
        }),
      ].sort((a, b) => (a.reference_id < b.reference_id ? -1 : a.reference_id > b.reference_id ? 1 : 0));

      return {
        references,
        resolution_fingerprint: stableFingerprint(references),
        reference_only: true,
      };
    },
  };
}

export interface ComponentResolver {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  resolve(root: string): ComponentResolutionResult;
}

export function createComponentResolver(): ComponentResolver {
  return {
    id: 'component_resolver',
    resolve(root: string): ComponentResolutionResult {
      const foundation = readJson<{
        components?: Array<{ component_id: string; name?: string }>;
      }>(root, VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH);

      const foundationComponents = foundation?.components ?? [];
      const components: ResolvedComponent[] = PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS.map(
        (runtimeId) => {
          const foundationBound = Object.entries(FOUNDATION_TO_RUNTIME).some(([, runtimeIds]) =>
            runtimeIds.includes(runtimeId)
          );
          const matchedFoundation = foundationComponents.filter((component) =>
            (FOUNDATION_TO_RUNTIME[component.component_id] ?? []).includes(runtimeId)
          );
          return {
            component_id: runtimeId,
            name: runtimeId
              .split('_')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' '),
            foundation_bound: foundationBound,
            runtime_bound: true,
            source_refs: [
              VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
              ...matchedFoundation.map((component) => `foundation:${component.component_id}`),
            ].sort(),
            present: true,
          };
        }
      ).sort((a, b) => (a.component_id < b.component_id ? -1 : a.component_id > b.component_id ? 1 : 0));

      return {
        components,
        resolved_count: components.length,
        resolution_fingerprint: stableFingerprint(components),
      };
    },
  };
}

export interface DependencyResolver {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  resolve(): DependencyResolutionResult;
}

export function createDependencyResolver(): DependencyResolver {
  return {
    id: 'dependency_resolver',
    resolve(): DependencyResolutionResult {
      const edges: DependencyEdge[] = [
        { from: 'component_resolver', to: 'repository_scanner', kind: 'requires' },
        { from: 'reference_resolver', to: 'repository_scanner', kind: 'requires' },
        { from: 'dependency_resolver', to: 'component_resolver', kind: 'requires' },
        { from: 'duplicate_detector', to: 'component_resolver', kind: 'requires' },
        { from: 'reuse_analyzer', to: 'duplicate_detector', kind: 'follows' },
        { from: 'reuse_analyzer', to: 'component_resolver', kind: 'requires' },
        { from: 'gap_detector', to: 'reuse_analyzer', kind: 'follows' },
        { from: 'understanding_evidence', to: 'gap_detector', kind: 'follows' },
        { from: 'understanding_cache', to: 'understanding_evidence', kind: 'follows' },
        { from: 'runtime_reproducibility', to: 'understanding_cache', kind: 'follows' },
        { from: 'understanding_runtime', to: 'runtime_reproducibility', kind: 'consumes' },
      ].sort((a, b) => {
        const left = `${a.from}->${a.to}`;
        const right = `${b.from}->${b.to}`;
        return left < right ? -1 : left > right ? 1 : 0;
      });

      const indegree = new Map<string, number>();
      const adjacency = new Map<string, string[]>();
      for (const id of PIPELINE_ORDER) {
        indegree.set(id, 0);
        adjacency.set(id, []);
      }
      for (const edge of edges) {
        if (!indegree.has(edge.from) || !indegree.has(edge.to)) continue;
        adjacency.get(edge.to)!.push(edge.from);
        indegree.set(edge.from, (indegree.get(edge.from) ?? 0) + 1);
      }
      const ready = [...PIPELINE_ORDER].filter((id) => (indegree.get(id) ?? 0) === 0);
      const order: string[] = [];
      while (ready.length > 0) {
        ready.sort();
        const next = ready.shift()!;
        order.push(next);
        for (const neighbor of adjacency.get(next) ?? []) {
          const deg = (indegree.get(neighbor) ?? 0) - 1;
          indegree.set(neighbor, deg);
          if (deg === 0) ready.push(neighbor);
        }
      }
      const acyclic = order.length === PIPELINE_ORDER.length;

      return {
        edges,
        acyclic,
        order: acyclic ? order : [...PIPELINE_ORDER],
        dependency_fingerprint: stableFingerprint({ edges, order: acyclic ? order : [...PIPELINE_ORDER] }),
      };
    },
  };
}

export interface DuplicateDetector {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  detect(components: ResolvedComponent[]): DuplicateDetectionResult;
}

export function createDuplicateDetector(): DuplicateDetector {
  return {
    id: 'duplicate_detector',
    detect(components: ResolvedComponent[]): DuplicateDetectionResult {
      const byName = new Map<string, string[]>();
      for (const component of components) {
        const key = component.name.toLowerCase().replace(/\s+/g, '_');
        const list = byName.get(key) ?? [];
        list.push(component.component_id);
        byName.set(key, list);
      }
      const duplicates: DuplicateCandidate[] = [...byName.entries()]
        .filter(([, ids]) => ids.length > 1)
        .map(([signature, component_ids]) => ({
          signature,
          component_ids: [...component_ids].sort(),
          severity: 'warning' as const,
        }))
        .sort((a, b) => (a.signature < b.signature ? -1 : a.signature > b.signature ? 1 : 0));

      return {
        duplicates,
        duplicate_count: duplicates.length,
        detection_fingerprint: stableFingerprint(duplicates),
      };
    },
  };
}

export interface ReuseAnalyzer {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  analyze(components: ResolvedComponent[], duplicates: DuplicateDetectionResult): ReuseAnalysisResult;
}

export function createReuseAnalyzer(): ReuseAnalyzer {
  return {
    id: 'reuse_analyzer',
    analyze(components: ResolvedComponent[], duplicates: DuplicateDetectionResult): ReuseAnalysisResult {
      const duplicateIds = new Set(duplicates.duplicates.flatMap((entry) => entry.component_ids));
      const candidates: ReuseCandidate[] = components
        .map((component) => {
          const evidence = [
            `foundation_bound=${component.foundation_bound}`,
            `runtime_bound=${component.runtime_bound}`,
            `present=${component.present}`,
            `duplicate=${duplicateIds.has(component.component_id)}`,
          ];
          const reuse_score =
            (component.foundation_bound ? 0.4 : 0) +
            (component.runtime_bound ? 0.3 : 0) +
            (component.present ? 0.2 : 0) +
            (duplicateIds.has(component.component_id) ? 0.1 : 0);
          return {
            component_id: component.component_id,
            reuse_score: Number(reuse_score.toFixed(2)),
            evidence,
            create_proposed: false as const,
          };
        })
        .sort((a, b) =>
          a.component_id < b.component_id ? -1 : a.component_id > b.component_id ? 1 : 0
        );

      return {
        candidates,
        reuse_before_create: true,
        analysis_fingerprint: stableFingerprint(candidates),
      };
    },
  };
}

export interface GapDetector {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  detect(
    components: ComponentResolutionResult,
    reuse: ReuseAnalysisResult,
    scan: RepositoryScanResult
  ): GapDetectionResult;
}

export function createGapDetector(): GapDetector {
  return {
    id: 'gap_detector',
    detect(
      components: ComponentResolutionResult,
      reuse: ReuseAnalysisResult,
      scan: RepositoryScanResult
    ): GapDetectionResult {
      const gaps: GapRecord[] = [];
      for (const required of PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS) {
        const found = components.components.find((component) => component.component_id === required);
        if (!found || !found.present) {
          gaps.push({
            gap_id: `missing_runtime_component:${required}`,
            description: `Required runtime component not present: ${required}`,
            blocked_by_reuse: false,
            evidence: ['component_resolver'],
          });
        }
      }
      for (const surface of scan.surfaces) {
        if (!surface.present) {
          gaps.push({
            gap_id: `missing_surface:${surface.surface_id}`,
            description: `Certified scan surface missing: ${surface.ref}`,
            blocked_by_reuse: false,
            evidence: [`scan:${surface.surface_id}`],
          });
        }
      }
      const lowReuse = reuse.candidates.filter((candidate) => candidate.reuse_score < 0.5);
      for (const candidate of lowReuse) {
        gaps.push({
          gap_id: `low_reuse_confidence:${candidate.component_id}`,
          description: `Reuse confidence below threshold for ${candidate.component_id}`,
          blocked_by_reuse: true,
          evidence: candidate.evidence,
        });
      }

      const sorted = gaps.sort((a, b) => (a.gap_id < b.gap_id ? -1 : a.gap_id > b.gap_id ? 1 : 0));
      return {
        gaps: sorted,
        gap_count: sorted.length,
        detection_fingerprint: stableFingerprint(sorted),
      };
    },
  };
}

export interface UnderstandingEvidenceModule {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  collect(root: string, scan: RepositoryScanResult): UnderstandingEvidenceBundle;
}

export function createUnderstandingEvidenceModule(): UnderstandingEvidenceModule {
  return {
    id: 'understanding_evidence',
    collect(root: string, scan: RepositoryScanResult): UnderstandingEvidenceBundle {
      const evidence_items = [
        {
          evidence_id: 'foundation',
          ref: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
          fingerprint: fingerprintFile(root, VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH),
        },
        {
          evidence_id: 'approval_gate',
          ref: VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
          fingerprint: fingerprintFile(root, VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH),
        },
        ...scan.surfaces.map((surface) => ({
          evidence_id: `surface:${surface.surface_id}`,
          ref: surface.ref,
          fingerprint: surface.fingerprint,
        })),
      ].sort((a, b) => (a.evidence_id < b.evidence_id ? -1 : a.evidence_id > b.evidence_id ? 1 : 0));

      return {
        evidence_items,
        evidence_precedes_conclusions: true,
        evidence_fingerprint: stableFingerprint(evidence_items),
      };
    },
  };
}

export interface RuntimeReproducibilityModule {
  readonly id: ProjectUnderstandingRuntimeComponentId;
  compare(left: string, right: string): { reproducible: boolean; left: string; right: string };
}

export function createRuntimeReproducibilityModule(): RuntimeReproducibilityModule {
  return {
    id: 'runtime_reproducibility',
    compare(left: string, right: string) {
      return { reproducible: left === right, left, right };
    },
  };
}

export function createUnderstandingRuntimeApi(
  root: string,
  deps: UnderstandingRuntimeDeps = {}
): UnderstandingRuntimeApi {
  const accessFactory = deps.createAccessApi ?? createAccessApi;
  const cacheFactory = deps.createCache ?? createUnderstandingCache;

  const scanner = createRepositoryScanner();
  const referenceResolver = createReferenceResolver();
  const componentResolver = createComponentResolver();
  const dependencyResolver = createDependencyResolver();
  const duplicateDetector = createDuplicateDetector();
  const reuseAnalyzer = createReuseAnalyzer();
  const gapDetector = createGapDetector();
  const evidenceModule = createUnderstandingEvidenceModule();
  const reproducibility = createRuntimeReproducibilityModule();
  const cache = cacheFactory();

  function runOnce(runId: string): UnderstandingRunResult {
    const access = accessFactory(root);
    const scan = scanner.scan(root);
    const references = referenceResolver.resolve(
      root,
      access,
      scan.surfaces.map((surface) => surface.ref)
    );
    const components = componentResolver.resolve(root);
    const dependencies = dependencyResolver.resolve();
    const duplicates = duplicateDetector.detect(components.components);
    const reuse = reuseAnalyzer.analyze(components.components, duplicates);
    const gaps = gapDetector.detect(components, reuse, scan);
    const evidence = evidenceModule.collect(root, scan);

    const result_fingerprint = stableFingerprint({
      scan: scan.scan_fingerprint,
      references: references.resolution_fingerprint,
      components: components.resolution_fingerprint,
      dependencies: dependencies.dependency_fingerprint,
      duplicates: duplicates.detection_fingerprint,
      reuse: reuse.analysis_fingerprint,
      gaps: gaps.detection_fingerprint,
      evidence: evidence.evidence_fingerprint,
    });

    const cacheEntry = cache.put(`understanding:${result_fingerprint}`, result_fingerprint);

    return {
      run_id: runId,
      scan,
      components,
      dependencies,
      duplicates,
      reuse,
      gaps,
      references,
      evidence,
      cache: cacheEntry,
      result_fingerprint,
      reproducible: true,
      repository_first: true,
      reuse_before_create: true,
      write_authorized: false,
      human_approval_required_before_write: true,
      read_only: true,
      reference_only: true,
      ephemeral: true,
    };
  }

  return {
    describeInterface() {
      return {
        version: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SEMVER,
        component_ids: [...PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS],
        public_surface: 'understanding_runtime',
        read_only: true,
        reference_only: true,
        repository_first: true,
        reuse_before_create: true,
        human_approval_required_before_write: true,
        write_authorized: false,
        implementation: true,
      };
    },
    understand(runId = 'understanding-run') {
      const first = runOnce(`${runId}:1`);
      const second = runOnce(`${runId}:2`);
      const compare = reproducibility.compare(first.result_fingerprint, second.result_fingerprint);
      return {
        ...first,
        run_id: runId,
        reproducible: compare.reproducible,
      };
    },
    requestWrite(action: string) {
      return {
        authorized: false as const,
        reason: `Write action '${action}' blocked: human approval required; Project Understanding Runtime is read-only`,
        requires_human_approval: true as const,
      };
    },
  };
}

export function createUnderstandingRuntimeRegistry() {
  return {
    runtime_id: 'vertical_ai_project_understanding_runtime',
    version: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SEMVER,
    component_ids: [...PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS],
    public_surface: 'understanding_runtime',
  };
}

export function exportUnderstandingRuntime(
  api: UnderstandingRuntimeApi,
  registry: ReturnType<typeof createUnderstandingRuntimeRegistry>
) {
  const iface = api.describeInterface();
  return {
    export_id: 'vertical_ai_project_understanding_runtime_export_v1',
    version: iface.version,
    component_ids: iface.component_ids,
    registry,
    interface: iface,
  };
}
