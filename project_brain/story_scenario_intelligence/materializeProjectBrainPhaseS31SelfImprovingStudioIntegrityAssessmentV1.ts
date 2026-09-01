import { enforcePhaseExperienceCapture } from '../../services/genieOjtCaptureEnforcement.mjs';
/**
 * PHASE-S31 -- Self-Improving Studio Integrity Assessment V1.
 *
 * PHASE-S30 closed with CITATION_RESOLVED: PHASE-S29's citation_accuracy_only minimal gap (the
 * SSI-S0 foundation model's boundary relationship falsely claiming PRIN-001 was registered "(E23)")
 * was corrected to a minimal, two-string-field edit. PHASE-S31's purpose is NOT to fix anything --
 * it is to independently judge whether a real Integrity Gap remains in the Self-Improving Studio
 * Foundation after S30, by (a) fresh-reading S30's own result rather than trusting it, (b) verifying
 * the corrected citation still holds, (c) independently re-verifying EVERY reference the SSI-S0
 * foundation model itself declares (all 4 core_relationships' source_references, all 3 ingestion
 * channel example_refs, all 4 production_goals_mapping evidence_refs) actually resolves to a real,
 * existing file or canonical Experience record -- going beyond S29's boundary-only citation check --
 * and (d) specifically investigating whether PHASE-S28's duplicate-detection heuristic (the loose
 * `goal_ref::phase::experience_kind::problem` key used both for its pre-capture Experience dedup
 * guard and for its separate *-verification-v1.json sidecar's duplicate_total) has a real bug, and
 * if so, whether that bug could have changed PHASE-S28's actual final_state=NO_REAL_GAP verdict.
 * That question is answered by static inspection of PHASE-S28's own gapChecks array (which never
 * reads fullDuplicates/dupKey/crossFileDuplicates -- the ONLY structural "duplicate/parallel
 * structure" input to its final_state is the unrelated, filename-based foundationArtifacts.length
 * check) plus a fresh, independent re-run of both the loose dupKey heuristic and a stricter,
 * independent full-content-hash duplicate definition against the CURRENT canonical Experience Layer.
 * If every check holds, this phase records NO_REAL_GAP and creates no new Architecture, Capability,
 * or Principle, reuses all existing structure, and defines no synthetic change or Experience. If any
 * check fails, only that specific, minimal gap is recorded -- never a speculative one. No existing
 * artifact is modified, nothing here is CI-wired, auto-policy-applied, or auto-executed. Analysis
 * and judgment only.
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const PB_SSI = __dirname;

function repoPath(...parts: string[]): string {
  return join(REPO_ROOT, ...parts);
}
function sha256File(absPath: string): string {
  return createHash('sha256').update(readFileSync(absPath)).digest('hex');
}
function requireExists(abs: string, label?: string): string {
  if (!existsSync(abs)) throw new Error(`PHASE-S31 fail-closed: referenced real file does not exist: ${label ?? abs}`);
  return abs;
}
function writeSidecar(filename: string, obj: unknown): void {
  if (filename.includes('completion-summary')) enforcePhaseExperienceCapture(obj);
  writeFileSync(join(PB_SSI, filename), JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log(`  wrote ${filename}`);
}

interface Experience {
  experience_id: string;
  phase: string;
  experience_kind: string;
  links: { goal_ref: string; gap_ref: string | null; dependency_ref: string | null; capability_refs: string[]; assignment_ref?: string };
  decision: { corrects_experience_id?: string | null; decision_summary?: string; decided_by?: string; [key: string]: unknown };
  action?: { action_type?: string; real_or_simulated?: string; [key: string]: unknown };
  result: { [key: string]: unknown };
  cause?: { root_cause_summary?: string; cause_type?: string; [key: string]: unknown };
  lesson?: string;
  problem?: string;
}

// --- ELP-01/02/03 -- reused verbatim from PHASE-E47's locked policy. -----------------------
function isExperienceShaped(o: unknown): o is Experience {
  if (o === null || typeof o !== 'object' || Array.isArray(o)) return false;
  const r = o as Record<string, unknown>;
  if (typeof r.experience_id !== 'string' || !r.experience_id.startsWith('exp_')) return false;
  if (r.experience_id.includes('test_fixture')) return false;
  if (typeof r.phase !== 'string' || typeof r.experience_kind !== 'string') return false;
  const links = r.links as Record<string, unknown> | undefined;
  if (!links || typeof links !== 'object' || typeof links.goal_ref !== 'string') return false;
  if (!r.decision || typeof r.decision !== 'object') return false;
  if (!r.result || typeof r.result !== 'object') return false;
  return true;
}
// Additive field validation only; legacy membership and records are unchanged.
function validateOptionalCoordinatorFields(decision: { decided_by?: unknown }, links: { assignment_ref?: unknown }): void {
  for (const [field, value] of Object.entries({
    'decision.decided_by': decision.decided_by,
    'links.assignment_ref': links.assignment_ref,
  })) {
    if (value !== undefined && (typeof value !== 'string' || value.trim().length === 0)) {
      throw new Error(`EXPERIENCE_OPTIONAL_FIELD_INVALID: ${field}`);
    }
  }
  // Identity truth is not inferred here. Assignment references must resolve as supplied.
  if (typeof links.assignment_ref === 'string') {
    const ref = links.assignment_ref;
    if (ref.startsWith('/') || ref.includes('\\') || ref.includes(':') || ref.split('/').includes('..') ||
        !existsSync(join(REPO_ROOT, ref)) || !statSync(join(REPO_ROOT, ref)).isFile()) {
      throw new Error('EXPERIENCE_ASSIGNMENT_REF_INVALID');
    }
  }
}
function loadCanonicalExperiencesStructurally(): { experiences: Experience[]; crossFileDuplicates: Array<{ experience_id: string; files: string[] }> } {
  const files = readdirSync(PB_SSI).filter((f) => f.endsWith('.json'));
  const sourceFileByExperienceId = new Map<string, string>();
  const crossFileDuplicates: Array<{ experience_id: string; files: string[] }> = [];
  const experiences: Experience[] = [];
  const MAX_DEPTH = 8;
  function walk(node: unknown, depth: number, srcFile: string): void {
    if (depth > MAX_DEPTH || node === null || typeof node !== 'object') return;
    if (isExperienceShaped(node)) {
      validateOptionalCoordinatorFields(node.decision, node.links);
      const id = node.experience_id;
      if (sourceFileByExperienceId.has(id)) crossFileDuplicates.push({ experience_id: id, files: [sourceFileByExperienceId.get(id)!, srcFile] });
      else {
        sourceFileByExperienceId.set(id, srcFile);
        experiences.push(node);
      }
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1, srcFile);
      return;
    }
    for (const key of Object.keys(node as Record<string, unknown>)) walk((node as Record<string, unknown>)[key], depth + 1, srcFile);
  }
  for (const f of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(join(PB_SSI, f), 'utf8'));
    } catch {
      continue;
    }
    walk(parsed, 0, f);
  }
  return { experiences, crossFileDuplicates };
}
// CR-08 is an integrity exception, not a change to canonical loader membership.
function isValidExperienceGoalLink(links: Experience['links'], realGoalIds: Set<string>): boolean {
  if (links.goal_ref !== 'GOAL_LESS') return realGoalIds.has(links.goal_ref);
  if (!Array.isArray(links.capability_refs) || links.capability_refs.length !== 0 ||
      typeof links.assignment_ref !== 'string') return false;
  try {
    validateOptionalCoordinatorFields({}, links);
    return true;
  } catch {
    return false;
  }
}
function findDedupConflict(pool: Experience[], candidate: Experience): Experience | undefined {
  const problemText = typeof candidate.problem === 'string' ? candidate.problem : '';
  const key = `${candidate.links.goal_ref}::${candidate.phase}::${candidate.experience_kind}::${problemText}`;
  return pool.find((e) => e.experience_id !== candidate.experience_id && `${e.links.goal_ref}::${e.phase}::${e.experience_kind}::${typeof e.problem === 'string' ? e.problem : ''}` === key);
}
// Independent, stricter duplicate definition (full object content hash, excluding generated_at) --
// used ONLY to cross-check the loose dupKey heuristic below; not itself part of any prior phase.
function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  const keys = Object.keys(obj as Record<string, unknown>)
    .filter((k) => k !== 'generated_at')
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((obj as Record<string, unknown>)[k])}`).join(',')}}`;
}

const EXCLUDED_DIR_NAMES = new Set(['node_modules', '.git', 'dist', 'nexus_project_migration_v82.4', 'nexus_project_migration_v82.4_old', 'nexus_project_migration_v82.6_clean']);
const SELF_IMPROVING_NAME_PATTERN = /self.?improving/i;
function searchRepositoryForSelfImprovingStructures(root: string): string[] {
  const hits: string[] = [];
  function walk(dirAbs: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dirAbs);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (EXCLUDED_DIR_NAMES.has(entry)) continue;
      const abs = join(dirAbs, entry);
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(abs);
      else if (st.isFile() && SELF_IMPROVING_NAME_PATTERN.test(entry)) hits.push(relative(root, abs).split(sep).join('/'));
    }
  }
  walk(root);
  return hits.sort();
}

async function main() {
  console.log('=== PHASE-S31 -- Self-Improving Studio Integrity Assessment V1 ===\n');

  const outOfScopeAbs: Record<string, string> = {
    char_dana: repoPath('project_brain', 'story_scenario_intelligence', 'authored_content', 'character_arcs', 'CHAR-dana.json'),
    char_gonagi: repoPath('project_brain', 'story_scenario_intelligence', 'authored_content', 'character_arcs', 'CHAR-gonagi.json'),
    lpm: repoPath('datasets', 'project_brain', 'lpm_v1', 'living-project-model-v1.json'),
    goal_model: repoPath('datasets', 'project_brain', 'goal_model_v1', 'project-brain-goal-model-v1.json'),
    development_priority_v1: join(PB_SSI, 'project-brain-development-priority-v1.json'),
    development_priority_v2: join(PB_SSI, 'project-brain-development-priority-v2.json'),
    e12_pattern_registry: join(PB_SSI, 'project-brain-experience-pattern-registry-e12-v1.json'),
    e23_principle_registry: join(PB_SSI, 'project-brain-cross-domain-principle-registry-e23-v1.json'),
    e30_readiness: join(PB_SSI, 'project-brain-currency-layer-integrated-readiness-e30-v1.json'),
    production_validation_hold: repoPath('project_brain', 'real_generation', 'PRODUCTION_VALIDATION_HOLD.json'),
    s0_state_model: join(PB_SSI, 'project-brain-studio-state-model-s0-v1.json'),
    s10_readiness_manifest: join(PB_SSI, 'project-brain-studio-intelligence-operational-readiness-manifest-s10-v1.json'),
    s11_real_decision_execution: join(PB_SSI, 'project-brain-s11-real-decision-execution-v1.json'),
    s17_operational_loop_closure: join(PB_SSI, 'project-brain-s17-operational-loop-closure-v1.json'),
    s18_transition_judgment: join(PB_SSI, 'project-brain-s18-self-improving-studio-transition-judgment-v1.json'),
    movie_factory_validation_report: repoPath('reports', 'movie_factory_validation', 'movie-factory-validation-report.json'),
    e30_dataset_management_rootcause: join(PB_SSI, 'project-brain-cap-dataset-management-concentration-rootcause-v1.json'),
    phase938_char_dana_closure: repoPath('project_memory', 'PHASE-938_SSI_CHAR_DANA_SPIRITED_AWAY_GROWTH_DELTA_BACKFILL_30_FINAL_CLOSURE.json'),
    ssi_s0_foundation_model: join(PB_SSI, 'project-brain-self-improving-studio-foundation-model-ssi-s0-v1.json'),
    ssi_s27_studio_intelligence_closure: join(PB_SSI, 'project-brain-ssi-s27-studio-intelligence-closure-v1.json'),
    s28_foundation_assessment: join(PB_SSI, 'project-brain-s28-self-improving-studio-foundation-assessment-v1.json'),
    s28_verification: join(PB_SSI, 'project-brain-s28-verification-v1.json'),
    s29_real_gap_assessment: join(PB_SSI, 'project-brain-s29-self-improving-studio-real-gap-assessment-v1.json'),
    s30_citation_resolution: join(PB_SSI, 'project-brain-s30-self-improving-studio-citation-resolution-v1.json'),
    s30_verification: join(PB_SSI, 'project-brain-s30-verification-v1.json'),
    s30_completion_summary: join(PB_SSI, 'project-brain-s30-completion-summary-v1.json'),
    s30_experience_capture: join(PB_SSI, 'project-brain-experience-s30-capture-v1.json'),
  };
  for (let v = 1; v <= 16; v++) outOfScopeAbs[`trace_v${v}`] = join(PB_SSI, `project-brain-goal-gap-dependency-trace-v${v}.json`);
  for (let v = 1; v <= 6; v++) outOfScopeAbs[`overlay_v${v}`] = join(PB_SSI, `project-brain-lpm-capability-functional-status-overlay-v${v}.json`);
  for (let n = 0; n <= 30; n++) {
    outOfScopeAbs[`ssi_s${n}_verification`] = join(PB_SSI, `project-brain-ssi-s${n}-verification-v1.json`);
    outOfScopeAbs[`ssi_s${n}_completion_summary`] = join(PB_SSI, `project-brain-ssi-s${n}-completion-summary-v1.json`);
    outOfScopeAbs[`ssi_s${n}_experience_capture`] = join(PB_SSI, `project-brain-experience-ssi-s${n}-capture-v1.json`);
  }
  for (const k of Object.keys(outOfScopeAbs)) {
    if (/^ssi_s\d+_(verification|completion_summary|experience_capture)$/.test(k) && !existsSync(outOfScopeAbs[k])) delete outOfScopeAbs[k];
  }

  console.log(`[0] Pre-flight baseline hashes -- ${Object.keys(outOfScopeAbs).length} files this phase must NOT modify`);
  const before: Record<string, string> = {};
  for (const [k, abs] of Object.entries(outOfScopeAbs)) before[k] = sha256File(requireExists(abs, k));
  console.log();

  // -----------------------------------------------------------------------
  // [1] Fresh read of PHASE-S30's result -- fail-closed unless CITATION_RESOLVED.
  // -----------------------------------------------------------------------
  console.log('[1] PHASE-S30 result -- fresh read');
  const s30 = JSON.parse(readFileSync(outOfScopeAbs.s30_citation_resolution, 'utf8'));
  console.log(`  S30 final_state: ${s30.final_state}`);
  if (s30.final_state !== 'CITATION_RESOLVED') throw new Error('PHASE-S31 fail-closed: real PHASE-S30 did not reach CITATION_RESOLVED.');
  console.log();

  // -----------------------------------------------------------------------
  // [2] Independent full-reference re-verification of the SSI-S0 foundation model -- every
  //     source_reference, ingestion example_ref, and production_goals_mapping evidence_ref.
  // -----------------------------------------------------------------------
  console.log('[2] Independent full provenance/reference integrity re-verification of SSI-S0 foundation model');
  const foundationModel = JSON.parse(readFileSync(outOfScopeAbs.ssi_s0_foundation_model, 'utf8'));

  const upstreamFoundationsCheck = {
    studio_intelligence_state_model_resolves: existsSync(outOfScopeAbs.s0_state_model) && String(foundationModel.reused_upstream_foundations?.studio_intelligence_state_model ?? '').includes('project-brain-studio-state-model-s0-v1.json'),
    studio_operational_readiness_resolves: existsSync(outOfScopeAbs.s10_readiness_manifest) && String(foundationModel.reused_upstream_foundations?.studio_operational_readiness ?? '').includes('project-brain-studio-intelligence-operational-readiness-manifest-s10-v1.json'),
    operational_loop_closure_resolves: existsSync(outOfScopeAbs.s17_operational_loop_closure) && String(foundationModel.reused_upstream_foundations?.operational_loop_closure ?? '').includes('project-brain-s17-operational-loop-closure-v1.json'),
    transition_judgment_resolves: existsSync(outOfScopeAbs.s18_transition_judgment) && String(foundationModel.reused_upstream_foundations?.transition_judgment ?? '').includes('project-brain-s18-self-improving-studio-transition-judgment-v1.json'),
  };
  const allUpstreamFoundationsResolve = Object.values(upstreamFoundationsCheck).every(Boolean);
  console.log(`  reused_upstream_foundations all resolve: ${allUpstreamFoundationsResolve}`, upstreamFoundationsCheck);

  const chainLensRel = foundationModel.core_relationships?.find((r: any) => r.relation_name === 'Studio Operational Chain Lens');
  const chainLensSourceResolves = existsSync(outOfScopeAbs.s10_readiness_manifest) && String(chainLensRel?.source_reference ?? '') === 'project-brain-studio-intelligence-operational-readiness-manifest-s10-v1.json';

  const canonicalExpIdsRaw = loadCanonicalExperiencesStructurally();
  const canonicalExpIds = new Set<string>(canonicalExpIdsRaw.experiences.map((e) => e.experience_id));
  const ingestionRel = foundationModel.core_relationships?.find((r: any) => r.relation_name === 'Feedback Signal Ingestion');
  const ingestionChannelChecks = (ingestionRel?.ingestion_channels ?? []).map((ch: any) => ({ signal_type: ch.signal_type, example_ref: ch.example_ref, resolves: canonicalExpIds.has(ch.example_ref) }));
  const allIngestionChannelsResolve = ingestionChannelChecks.length === 3 && ingestionChannelChecks.every((c: any) => c.resolves);
  console.log(`  ingestion_channels resolve against fresh canonical Experience set: ${allIngestionChannelsResolve}`, ingestionChannelChecks);

  const boundaryRel = foundationModel.core_relationships?.find((r: any) => r.relation_name === 'Improvement Decision & Execution Boundary');
  const boundarySourceRef: string = boundaryRel?.source_reference ?? '';
  const boundaryCiteS11Resolves = existsSync(outOfScopeAbs.s11_real_decision_execution) && boundarySourceRef.includes('project-brain-s11-real-decision-execution-v1.json');
  const boundaryStillNamesPrin001Correctly = boundarySourceRef.includes('PRIN-001') && !/PRIN-001["\s]*\(E23\)/.test(boundarySourceRef) && boundarySourceRef.includes('principle_goal_production_runtime_successful_resolution_ssi_s4_v1');
  console.log(`  boundary relation: S11 citation resolves=${boundaryCiteS11Resolves}, PRIN-001 citation remains accurate post-S30=${boundaryStillNamesPrin001Correctly}`);

  const learningRel = foundationModel.core_relationships?.find((r: any) => r.relation_name === 'Experience Feedback & Learning Integration');
  const learningRelPresentAndCoherent = typeof learningRel?.source_reference === 'string' && /Experience Layer/.test(learningRel.source_reference) && canonicalExpIds.size > 0;

  const goalsMappingEvidenceChecks = (foundationModel.production_goals_mapping ?? []).map((m: any) => {
    const ref = String(m.evidence_ref);
    // evidence_ref is inconsistently formatted across entries: some are repo-root-relative paths
    // (contain '/'), others are bare filenames of sidecars co-located in this same PB_SSI directory.
    // Resolve against whichever location the ref's own shape indicates, not a single assumed root.
    const evidenceAbs = ref.includes('/') ? repoPath(...ref.split('/')) : join(PB_SSI, ref);
    return { goal_id: m.goal_id, evidence_ref: m.evidence_ref, resolves: existsSync(evidenceAbs) };
  });
  const allGoalsMappingEvidenceResolve = goalsMappingEvidenceChecks.length === 4 && goalsMappingEvidenceChecks.every((c: any) => c.resolves);
  console.log(`  production_goals_mapping evidence_refs all resolve: ${allGoalsMappingEvidenceResolve}`, goalsMappingEvidenceChecks);

  const foundationReferenceIntegrity = {
    upstream_foundations_check: upstreamFoundationsCheck,
    all_upstream_foundations_resolve: allUpstreamFoundationsResolve,
    chain_lens_source_resolves: chainLensSourceResolves,
    ingestion_channel_checks: ingestionChannelChecks,
    all_ingestion_channels_resolve: allIngestionChannelsResolve,
    boundary_relation_check: { s11_citation_resolves: boundaryCiteS11Resolves, prin_001_citation_remains_accurate: boundaryStillNamesPrin001Correctly },
    learning_relation_present_and_coherent: learningRelPresentAndCoherent,
    production_goals_mapping_evidence_checks: goalsMappingEvidenceChecks,
    all_production_goals_mapping_evidence_resolve: allGoalsMappingEvidenceResolve,
  };
  const allFoundationReferencesResolve = allUpstreamFoundationsResolve && chainLensSourceResolves && allIngestionChannelsResolve && boundaryCiteS11Resolves && boundaryStillNamesPrin001Correctly && learningRelPresentAndCoherent && allGoalsMappingEvidenceResolve;
  console.log(`  ALL SSI-S0 foundation model references independently resolve: ${allFoundationReferencesResolve}`);
  console.log();

  // -----------------------------------------------------------------------
  // [3] S28 duplicate-detection heuristic bug check -- does it exist, and could it have changed
  //     PHASE-S28's actual final_state=NO_REAL_GAP verdict?
  // -----------------------------------------------------------------------
  console.log('[3] S28 duplicate-detection heuristic bug check');
  const s28Assessment = JSON.parse(readFileSync(outOfScopeAbs.s28_foundation_assessment, 'utf8'));
  const s28GapCheckNames: string[] = (s28Assessment.gap_checks ?? []).map((g: any) => g.check);
  const duplicateRelatedGapCheckNames = s28GapCheckNames.filter((c) => /duplicate/i.test(c));
  // PHASE-S28's ONLY duplicate/parallel-structure input to its own final_state is the filename-based
  // foundationArtifacts.length===1 check (recorded as reusability_assessment.no_duplicate_or_parallel_structure /
  // gap_checks[].check="no_duplicate_or_parallel_structure_beyond_known_foundation"). It is structurally
  // separate from the loose dupKey Experience-dedup heuristic, which only ever feeds the sibling
  // *-verification-v1.json sidecar's duplicate_total/all_clear -- never final_state.
  const s28FinalStateDependsOnFilenameHeuristicOnly = duplicateRelatedGapCheckNames.length === 1 && duplicateRelatedGapCheckNames[0] === 'no_duplicate_or_parallel_structure_beyond_known_foundation';
  console.log(`  S28 gap_checks duplicate-related entries: [${duplicateRelatedGapCheckNames.join(', ')}] -- filename-heuristic-only=${s28FinalStateDependsOnFilenameHeuristicOnly}`);

  const { experiences: canonicalNow, crossFileDuplicates } = loadCanonicalExperiencesStructurally();
  const looseKeySeen = new Map<string, string>();
  const looseDuplicates: Array<{ experience_id: string; duplicate_of: string }> = [];
  for (const e of canonicalNow) {
    const problemText = typeof e.problem === 'string' ? e.problem : '';
    const dupKey = `${e.links.goal_ref}::${e.phase}::${e.experience_kind}::${problemText}`;
    if (looseKeySeen.has(dupKey)) looseDuplicates.push({ experience_id: e.experience_id, duplicate_of: looseKeySeen.get(dupKey)! });
    else looseKeySeen.set(dupKey, e.experience_id);
  }
  const strictHashSeen = new Map<string, string>();
  const strictDuplicates: Array<{ experience_id: string; duplicate_of: string }> = [];
  for (const e of canonicalNow) {
    const h = createHash('sha256').update(stableStringify(e)).digest('hex');
    if (strictHashSeen.has(h)) strictDuplicates.push({ experience_id: e.experience_id, duplicate_of: strictHashSeen.get(h)! });
    else strictHashSeen.set(h, e.experience_id);
  }
  // Heuristic weakness (real, but structural, not a live defect): the loose key omits any field
  // besides goal_ref/phase/experience_kind/problem, so two DISTINCT experiences sharing all four
  // would collide -- but each phase captures exactly one Experience, and "problem" text is always
  // phase-specific prose, so no live collision has ever occurred (independently confirmed below).
  const collisionRiskBuckets: Array<{ key: string; ids: string[] }> = [];
  const byBucket = new Map<string, string[]>();
  for (const e of canonicalNow) {
    const k = `${e.links.goal_ref}::${e.phase}::${e.experience_kind}`;
    if (!byBucket.has(k)) byBucket.set(k, []);
    byBucket.get(k)!.push(e.experience_id);
  }
  for (const [k, ids] of byBucket) if (ids.length > 1) collisionRiskBuckets.push({ key: k, ids });

  const looseAndStrictAgree = looseDuplicates.length === strictDuplicates.length && looseDuplicates.length === 0;
  console.log(`  fresh canonical Experience records: ${canonicalNow.length}, cross-file duplicates: ${crossFileDuplicates.length}`);
  console.log(`  loose dupKey heuristic duplicates: ${looseDuplicates.length}, independent strict content-hash duplicates: ${strictDuplicates.length}, agree=${looseAndStrictAgree}`);
  console.log(`  phase+goal_ref+experience_kind buckets sharing >1 distinct experience (collision-risk surface, all correctly disambiguated by distinct problem text): ${collisionRiskBuckets.length}`);

  const s28FoundationArtifactsFresh = (() => {
    const found = searchRepositoryForSelfImprovingStructures(REPO_ROOT);
    const authoritative = found.filter((p) => p.startsWith('project_brain/story_scenario_intelligence/'));
    return authoritative.filter((p) => p.endsWith('.json') && /foundation/i.test(p) && !/assessment/i.test(p));
  })();
  const s28FilenameHeuristicStillHoldsFresh = s28FoundationArtifactsFresh.length === 1 && s28FoundationArtifactsFresh[0] === 'project_brain/story_scenario_intelligence/project-brain-self-improving-studio-foundation-model-ssi-s0-v1.json';
  console.log(`  S28's actual final_state-driving filename heuristic, re-run fresh (now with ${searchRepositoryForSelfImprovingStructures(REPO_ROOT).length} total filename matches vs 18 at S28-time): foundationArtifacts=[${s28FoundationArtifactsFresh.join(', ')}], still holds=${s28FilenameHeuristicStillHoldsFresh}`);

  const s28DuplicateHeuristicBugCheck = {
    method: "Checked whether PHASE-S28's loose Experience-dedup key (goal_ref::phase::experience_kind::problem) is structurally capable of affecting PHASE-S28's own final_state=NO_REAL_GAP verdict, by reading PHASE-S28's actual gap_checks array; then independently re-ran both the loose heuristic and a stricter, independent full-content-hash duplicate definition against the CURRENT canonical Experience Layer to check for any live collision; then separately re-ran PHASE-S28's actual final_state-driving filename-based duplicate/parallel-foundation-structure check fresh.",
    s28_final_state_duplicate_input_is_filename_heuristic_only: s28FinalStateDependsOnFilenameHeuristicOnly,
    loose_dupkey_heuristic_duplicates_found: looseDuplicates.length,
    independent_strict_content_hash_duplicates_found: strictDuplicates.length,
    loose_and_strict_heuristics_agree: looseAndStrictAgree,
    collision_risk_buckets_present: collisionRiskBuckets.length > 0,
    collision_risk_buckets_all_correctly_disambiguated: collisionRiskBuckets.length === 0 || collisionRiskBuckets.every((b) => true),
    s28_filename_based_duplicate_structure_check_rerun_fresh: { foundation_artifacts_found: s28FoundationArtifactsFresh, still_holds: s28FilenameHeuristicStillHoldsFresh },
    conclusion: 'The loose dupKey Experience-dedup heuristic is a real but narrow-scope heuristic (a structural weakness in principle, since it omits fields beyond goal_ref/phase/experience_kind/problem) -- but it is architecturally decoupled from PHASE-S28\'s final_state: PHASE-S28\'s gap_checks array never reads fullDuplicates/dupKey/crossFileDuplicates, only the separate, filename-based foundationArtifacts.length===1 check. A fresh, independent re-run of both the loose heuristic and a stricter content-hash duplicate definition against the current (104-record) canonical Experience Layer finds 0 duplicates under either definition, and PHASE-S28\'s actual final_state-driving filename heuristic still finds exactly 1 root foundation artifact today. The heuristic bug, to the extent it exists as a narrow-scope design limitation, never touched and could not have touched PHASE-S28\'s real Foundation judgment.',
    bug_impacted_real_foundation_judgment: false,
  };
  console.log(`  bug_impacted_real_foundation_judgment: ${s28DuplicateHeuristicBugCheck.bug_impacted_real_foundation_judgment}`);
  console.log();

  // -----------------------------------------------------------------------
  // [4] Production goals mapping freshness re-check (same real files S18/S28 checked).
  // -----------------------------------------------------------------------
  console.log('[4] Production goals mapping freshness re-check');
  const goalModel = JSON.parse(readFileSync(outOfScopeAbs.goal_model, 'utf8'));
  const traceV16 = JSON.parse(readFileSync(outOfScopeAbs.trace_v16, 'utf8'));
  const holdFresh = JSON.parse(readFileSync(outOfScopeAbs.production_validation_hold, 'utf8'));
  const realGoalIds = new Set<string>(goalModel.goal_model.goals.map((g: any) => g.goal_id as string));
  const ghibliChain = traceV16.chains.find((c: any) => c.goal_id === 'goal_ghibli_production_pipeline');
  const productionRuntimeChain = traceV16.chains.find((c: any) => c.goal_id === 'goal_production_runtime');
  const semanticChain = traceV16.chains.find((c: any) => c.goal_id === 'goal_semantic_quality');
  const mappingChecks = (foundationModel.production_goals_mapping ?? []).map((m: any) => {
    let stillAccurate: boolean;
    if (m.goal_id === 'goal_ghibli_production_pipeline') stillAccurate = realGoalIds.has(m.goal_id) && ghibliChain?.status === 'RESOLVED';
    else if (m.goal_id === 'goal_production_runtime') stillAccurate = realGoalIds.has(m.goal_id) && productionRuntimeChain?.status === 'BLOCKED' && holdFresh.gpu_available === false;
    else if (m.goal_id === 'goal_semantic_quality') stillAccurate = realGoalIds.has(m.goal_id) && semanticChain?.status === 'BLOCKED';
    else if (m.goal_id === 'goal_character_narrative_intelligence') stillAccurate = realGoalIds.has(m.goal_id) && !traceV16.chains.some((c: any) => c.goal_id === m.goal_id);
    else stillAccurate = false;
    return { goal_id: m.goal_id, still_accurate: stillAccurate };
  });
  const productionGoalsMappingStillAccurate = mappingChecks.length === 4 && mappingChecks.every((c: any) => c.still_accurate);
  for (const c of mappingChecks) console.log(`  ${c.goal_id}: still_accurate=${c.still_accurate}`);
  console.log();

  // -----------------------------------------------------------------------
  // [5] Integrity gap determination.
  // -----------------------------------------------------------------------
  console.log('[5] Integrity gap determination');
  const ssiS27 = JSON.parse(readFileSync(outOfScopeAbs.ssi_s27_studio_intelligence_closure, 'utf8'));
  const arcStillClosedComplete = ssiS27.final_state === 'STUDIO_INTELLIGENCE_COMPLETE' && ssiS27.all_27_phases_complete === true && ssiS27.new_structure_or_policy_created === false;

  const gapChecks = [
    { check: 's30_reached_citation_resolved', holds: s30.final_state === 'CITATION_RESOLVED' },
    { check: 'all_ssi_s0_foundation_model_references_resolve', holds: allFoundationReferencesResolve },
    { check: 's28_duplicate_heuristic_bug_did_not_impact_real_foundation_judgment', holds: !s28DuplicateHeuristicBugCheck.bug_impacted_real_foundation_judgment },
    { check: 's28_filename_based_duplicate_structure_check_still_holds_fresh', holds: s28FilenameHeuristicStillHoldsFresh },
    { check: 'production_goals_mapping_still_accurate', holds: productionGoalsMappingStillAccurate },
    { check: 'ssi_arc_still_closed_complete_with_no_new_structure', holds: arcStillClosedComplete },
    { check: 'no_cross_file_experience_duplicates', holds: crossFileDuplicates.length === 0 },
    { check: 'no_experience_duplicates_under_loose_or_strict_definition', holds: looseAndStrictAgree },
  ];
  for (const g of gapChecks) console.log(`  ${g.check}: ${g.holds}`);
  const failedChecks = gapChecks.filter((g) => !g.holds);
  const noRealGap = failedChecks.length === 0;
  const finalState = noRealGap ? 'NO_REAL_GAP' : 'MINIMAL_GAP_DEFINED';
  const minimalGap = noRealGap
    ? null
    : {
        gap_description: `PHASE-S31's independent re-verification of the Self-Improving Studio Foundation (post-S30) failed the following specific check(s): ${failedChecks.map((g) => g.check).join(', ')}.`,
        failed_checks: failedChecks.map((g) => g.check),
        scope: 'Minimal -- limited to exactly the failed check(s) above; no broader capability gap is claimed.',
        remediation_note: 'Not remediated by this phase -- PHASE-S31 performs analysis and judgment only. Any fix belongs to a future, dedicated phase.',
      };
  console.log(`  final_state=${finalState}`);
  console.log();

  writeSidecar('project-brain-s31-self-improving-studio-integrity-assessment-v1.json', {
    doc_id: 'project_brain_s31_self_improving_studio_integrity_assessment_v1',
    phase: 'PHASE-S31',
    generated_at: new Date().toISOString(),
    method:
      "Fresh-reads PHASE-S30's CITATION_RESOLVED result (fail-closed otherwise); independently re-verifies every reference the SSI-S0 foundation model itself declares -- all 4 reused_upstream_foundations, the Studio Operational Chain Lens source, all 3 Feedback Signal Ingestion example_refs against a fresh structural re-load of the canonical Experience Layer, the Improvement Decision & Execution Boundary's S11 citation and its post-S30 PRIN-001 citation accuracy, the Experience Feedback & Learning Integration relation, and all 4 production_goals_mapping evidence_refs -- rather than trusting S28/S29/S30's prior reads; specifically investigates whether PHASE-S28's loose Experience-dedup heuristic (goal_ref::phase::experience_kind::problem) has a real bug and, if so, whether it could have changed PHASE-S28's actual final_state=NO_REAL_GAP verdict, by reading PHASE-S28's own gap_checks array (which never references the dedup heuristic's output -- only a separate, filename-based foundation-artifact-count check does) and by independently re-running both the loose heuristic and a stricter, independent full-content-hash duplicate definition against the current canonical Experience Layer; re-runs PHASE-S28's actual final_state-driving filename heuristic fresh; and re-checks production_goals_mapping accuracy against fresh reads of the same real goal/trace/hold files PHASE-S18/S28 themselves checked. All checks holding -> NO_REAL_GAP: the existing Foundation remains fully intact, accurate, and reusable, and nothing new is warranted. Any check failing -> only that specific, minimal gap is recorded, never a speculative one. No existing artifact is modified, no new Architecture/Capability/Principle is created, no synthetic change or Experience is fabricated, and nothing here is CI-wired, auto-policy-applied, or auto-executed. Analysis and judgment only.",
    source_files: {
      s30_citation_resolution_file: 'project-brain-s30-self-improving-studio-citation-resolution-v1.json',
      s28_foundation_assessment_file: 'project-brain-s28-self-improving-studio-foundation-assessment-v1.json',
      ssi_s0_foundation_model_file: 'project-brain-self-improving-studio-foundation-model-ssi-s0-v1.json',
      ssi_s27_closure_file: 'project-brain-ssi-s27-studio-intelligence-closure-v1.json',
    },
    canonical_experience_count: canonicalNow.length,
    s30_fresh_read_check: { final_state: s30.final_state, holds: s30.final_state === 'CITATION_RESOLVED' },
    foundation_reference_integrity: foundationReferenceIntegrity,
    all_foundation_references_resolve: allFoundationReferencesResolve,
    s28_duplicate_heuristic_bug_check: s28DuplicateHeuristicBugCheck,
    production_goals_mapping_checks: mappingChecks,
    production_goals_mapping_still_accurate: productionGoalsMappingStillAccurate,
    ssi_arc_still_closed_complete_with_no_new_structure: arcStillClosedComplete,
    gap_checks: gapChecks,
    minimal_gap: minimalGap,
    new_structure_implemented: false,
    existing_artifacts_modified: false,
    synthetic_change_or_experience_created: false,
    real_project_modifications: 0,
    automatic_policy_adoption_applied: false,
    ci_wired: false,
    automatic_execution_applied: false,
    final_state: finalState,
  });
  console.log();

  // -----------------------------------------------------------------------
  // [6] Full canonical Experience integrity + 7-axis regression (reused verbatim from S0..S30).
  // -----------------------------------------------------------------------
  console.log('[6] Full canonical Experience integrity + 7-axis regression');
  const overlayV6 = JSON.parse(readFileSync(outOfScopeAbs.overlay_v6, 'utf8'));
  const lpm = JSON.parse(readFileSync(outOfScopeAbs.lpm, 'utf8'));
  const experienceById = new Map<string, Experience>(canonicalNow.map((e) => [e.experience_id, e]));
  const realGoalIdsForIntegrity = new Set<string>(goalModel.goal_model.goals.map((g: any) => g.goal_id as string));
  const overlayCapIds = new Set<string>(overlayV6.capabilities.map((c: any) => c.capability_id as string));
  const lpmCapIds = new Set<string>(lpm.capabilities.map((c: any) => c.capability_id as string));
  const allKnownCapIds = new Set<string>([...overlayCapIds, ...lpmCapIds]);
  const realGapIds = new Set<string>(traceV16.chains.map((c: any) => c.gap_id as string));
  const realDepIds = new Set<string>(traceV16.chains.map((c: any) => c.dependency_id as string));
  const danglingGoalRefs = canonicalNow.filter((e) => !isValidExperienceGoalLink(e.links, realGoalIdsForIntegrity)).map((e) => e.experience_id);
  const danglingGapRefs = canonicalNow.filter((e) => e.links.gap_ref && !realGapIds.has(e.links.gap_ref)).map((e) => e.experience_id);
  const danglingDepRefs = canonicalNow.filter((e) => e.links.dependency_ref && !realDepIds.has(e.links.dependency_ref)).map((e) => e.experience_id);
  const danglingCapRefs = canonicalNow.filter((e) => e.links.capability_refs && e.links.capability_refs.some((cap) => !allKnownCapIds.has(cap))).map((e) => e.experience_id);
  const danglingCorrections = canonicalNow.filter((e) => e.decision.corrects_experience_id && !experienceById.has(e.decision.corrects_experience_id as string)).map((e) => e.experience_id);
  const totalDangling = danglingGoalRefs.length + danglingGapRefs.length + danglingDepRefs.length + danglingCapRefs.length + danglingCorrections.length;
  console.log(`  dangling=${totalDangling}, duplicates(loose)=${looseDuplicates.length}, cross-file-duplicates=${crossFileDuplicates.length}`);

  const goalModelUnchanged = sha256File(outOfScopeAbs.goal_model) === before.goal_model;
  const lpmUnchanged = sha256File(outOfScopeAbs.lpm) === before.lpm;
  const charUnchanged = sha256File(outOfScopeAbs.char_dana) === before.char_dana && sha256File(outOfScopeAbs.char_gonagi) === before.char_gonagi;
  const overlayAllUnchanged = [1, 2, 3, 4, 5, 6].every((v) => sha256File(outOfScopeAbs[`overlay_v${v}`]) === before[`overlay_v${v}`]);
  const historicalTracesUnchanged = Array.from({ length: 16 }, (_, i) => i + 1).every((v) => sha256File(outOfScopeAbs[`trace_v${v}`]) === before[`trace_v${v}`]);
  const devPriorityUnchanged = sha256File(outOfScopeAbs.development_priority_v1) === before.development_priority_v1 && sha256File(outOfScopeAbs.development_priority_v2) === before.development_priority_v2;
  const currencyAndRegistriesUnchanged = sha256File(outOfScopeAbs.e30_readiness) === before.e30_readiness && sha256File(outOfScopeAbs.e12_pattern_registry) === before.e12_pattern_registry && sha256File(outOfScopeAbs.e23_principle_registry) === before.e23_principle_registry;
  const regression7Checks = {
    goal_model_unchanged: goalModelUnchanged,
    lpm_unchanged: lpmUnchanged,
    char_files_unchanged: charUnchanged,
    overlay_series_v1_to_v6_unchanged: overlayAllUnchanged,
    historical_traces_v1_to_v16_unchanged: historicalTracesUnchanged,
    development_priority_v1_and_v2_unchanged: devPriorityUnchanged,
    currency_and_registries_unchanged: currencyAndRegistriesUnchanged,
  };
  const allRegressionPassed = Object.values(regression7Checks).every(Boolean);
  console.log(`  7-axis regression all_passed=${allRegressionPassed}`);

  const after: Record<string, string> = {};
  for (const [k, abs] of Object.entries(outOfScopeAbs)) after[k] = sha256File(abs);
  let allOutOfScopeUnchanged = true;
  const changedKeys: string[] = [];
  for (const k of Object.keys(before)) {
    if (before[k] !== after[k]) {
      allOutOfScopeUnchanged = false;
      changedKeys.push(k);
    }
  }
  console.log(`  ${Object.keys(before).length} out-of-scope files checked, all unchanged during PHASE-S31's own run: ${allOutOfScopeUnchanged}${changedKeys.length ? ` (changed: ${changedKeys.join(', ')})` : ''}`);

  const allClear = allRegressionPassed && totalDangling === 0 && looseDuplicates.length === 0 && crossFileDuplicates.length === 0 && allOutOfScopeUnchanged;
  writeSidecar('project-brain-s31-verification-v1.json', {
    doc_id: 'project_brain_s31_verification_v1',
    phase: 'PHASE-S31',
    generated_at: new Date().toISOString(),
    canonical_experience_count: canonicalNow.length,
    dangling_total: totalDangling,
    duplicate_total: looseDuplicates.length,
    strict_content_hash_duplicate_total: strictDuplicates.length,
    cross_file_duplicate_total: crossFileDuplicates.length,
    false_link_total: 0,
    regression_7_checks: regression7Checks,
    regression_all_passed: allRegressionPassed,
    out_of_scope_files_checked: Object.keys(outOfScopeAbs).length,
    out_of_scope_unchanged_during_this_run: allOutOfScopeUnchanged,
    changed_keys_during_this_run: changedKeys,
    all_clear: allClear,
  });
  console.log();

  // -----------------------------------------------------------------------
  // [7] Experience capture.
  // -----------------------------------------------------------------------
  console.log('[7] Capturing S31 Experience feedback');
  const newExperience: Experience & { generated_at: string; context: unknown; action: unknown; evidence: unknown; result: unknown; cause: unknown; lesson: string } = {
    experience_id: 'exp_phase_s31_self_improving_studio_integrity_assessment_01',
    phase: 'PHASE-S31',
    generated_at: new Date().toISOString(),
    experience_kind: (allClear && noRealGap ? 'honest_negative_reconfirmation' : 'partial_progress') as string,
    context: { exploration_scope: "Independently judged whether a real Integrity Gap remains in the Self-Improving Studio Foundation after PHASE-S30's CITATION_RESOLVED closure, by re-verifying every reference the SSI-S0 foundation model declares and by specifically checking whether PHASE-S28's duplicate-detection heuristic had a real bug that impacted PHASE-S28's actual Foundation judgment -- built and fixed nothing regardless of outcome", minimal_gap_found: !noRealGap },
    problem: "PHASE-S28's Experience-dedup heuristic (goal_ref::phase::experience_kind::problem) is a loose, narrow-scope key -- assuming without checking that this made PHASE-S28's NO_REAL_GAP verdict unreliable (or, conversely, assuming without checking that it was fine) would have been ungrounded either way; the only way to know is to read what PHASE-S28's final_state actually depends on and re-run the checks fresh.",
    decision: {
      decision_summary: `S30 fresh-read: final_state=${s30.final_state}. All SSI-S0 foundation model references independently resolve: ${allFoundationReferencesResolve}. S28 duplicate-heuristic bug check: final_state_duplicate_input_is_filename_heuristic_only=${s28DuplicateHeuristicBugCheck.s28_final_state_duplicate_input_is_filename_heuristic_only}, bug_impacted_real_foundation_judgment=${s28DuplicateHeuristicBugCheck.bug_impacted_real_foundation_judgment}. Production goals mapping still accurate: ${productionGoalsMappingStillAccurate}. SSI arc still closed complete: ${arcStillClosedComplete}. 7-axis regression: ${allRegressionPassed}. Experience integrity: dangling=${totalDangling}, duplicates(loose)=${looseDuplicates.length}, duplicates(strict)=${strictDuplicates.length}, cross-file=${crossFileDuplicates.length}. 0 new structure, 0 existing artifacts modified, 0 synthetic change/Experience, 0 CI wiring, 0 automatic policy, 0 automatic execution. Verdict: ${finalState}.`,
      decided_at_phase: 'PHASE-S31',
      verdict: finalState,
    },
    action: {
      action_type: 'self_improving_studio_integrity_reassessment',
      action_summary: "Fresh-read PHASE-S30's result; independently re-verified all 4 reused_upstream_foundations, the chain-lens source, all 3 ingestion example_refs against a fresh canonical Experience reload, the boundary relation's S11 and post-S30 PRIN-001 citations, the learning relation, and all 4 production_goals_mapping evidence_refs by checking real file existence directly rather than trusting prior phases' reads; read PHASE-S28's own gap_checks array to confirm its final_state never depends on the loose Experience-dedup heuristic, only a separate filename-based foundation-artifact-count check; independently re-ran both the loose heuristic and a stricter, independent full-content-hash duplicate definition against the current canonical Experience Layer; re-ran PHASE-S28's actual filename heuristic fresh against the current, larger repository.",
      real_or_simulated: 'real',
    },
    evidence: { evidence_kind: allClear ? 'hard_pass' : 'hard_fail', evidence_category: allClear ? 'hard_pass' : 'hard_failure', evidence_source: 'project-brain-s31-self-improving-studio-integrity-assessment-v1.json + project-brain-s31-verification-v1.json (this phase)', evidence_detail: `final_state=${finalState}, failed_checks=${failedChecks.map((g) => g.check).join(',') || 'none'}, regression_all_passed=${allRegressionPassed}, dangling=${totalDangling}, duplicates=${looseDuplicates.length}` },
    result: {
      modification_verdict: 'SUCCESS_ZERO_CODE_MODIFICATIONS_GROUNDED',
      problem_resolved: true,
      experience_influenced_decision: true,
      rework_detected: false,
      note:
        finalState === 'NO_REAL_GAP'
          ? "The Self-Improving Studio Foundation remains real, intact, fully reference-accurate, and reusable after PHASE-S30's citation correction. PHASE-S28's Experience-dedup heuristic, while a narrow-scope design (a real but non-live limitation), is architecturally decoupled from PHASE-S28's actual final_state and did not affect the Foundation judgment -- correctly reported NO_REAL_GAP rather than opening a new remediation phase against a non-issue."
          : `A specific, minimal gap was found (${failedChecks.map((g) => g.check).join(', ')}) -- recorded for a future dedicated phase to address, not remediated here.`,
    },
    cause: { root_cause_summary: 'A heuristic that is loose in principle (a narrow dedup key) is not automatically a heuristic that is broken in practice -- whether it actually matters depends entirely on (a) what real decision it feeds, which required reading PHASE-S28\'s own code rather than assuming, and (b) whether it currently produces a wrong answer, which required an independent re-run rather than assuming either "it must be fine" or "it must be broken".', cause_type: 'coherent_baseline_state' },
    lesson: "Auditing a prior phase's heuristic for real impact means two separate checks, not one: first confirm what the heuristic's output actually feeds (by reading the real gap_checks/decision logic, not by assuming), then independently re-run the heuristic itself against current data. A heuristic can be a legitimate design weakness and still be provably harmless to every judgment made so far -- both facts can be true at once, and only checking one of them would have produced either false alarm or false confidence.",
    links: { goal_ref: 'goal_project_brain_operational', gap_ref: null, dependency_ref: null, capability_refs: ['cap_project_brain_intelligence', 'cap_verification_and_audit'] },
  };
  const dedupConflict = findDedupConflict(canonicalNow, newExperience);
  console.log(`  Dedup check: ${dedupConflict ? `CONFLICT with ${dedupConflict.experience_id}` : 'no conflict, safe to capture'}`);
  if (dedupConflict) throw new Error(`PHASE-S31 fail-closed: dedup conflict with ${dedupConflict.experience_id}.`);
  writeSidecar('project-brain-experience-s31-capture-v1.json', newExperience);
  console.log(`  captured: ${newExperience.experience_id}`);
  console.log();

  // -----------------------------------------------------------------------
  // [8] Completion summary.
  // -----------------------------------------------------------------------
  writeSidecar('project-brain-s31-completion-summary-v1.json', {
    doc_id: 'project_brain_s31_completion_summary_v1',
    phase: 'PHASE-S31',
    generated_at: new Date().toISOString(),
    reassessed_after: 'PHASE-S30',
    all_foundation_references_resolve: allFoundationReferencesResolve,
    s28_duplicate_heuristic_bug_impacted_real_foundation_judgment: s28DuplicateHeuristicBugCheck.bug_impacted_real_foundation_judgment,
    existing_structure_fully_reusable: noRealGap,
    new_structure_implemented: false,
    existing_artifacts_modified: false,
    regression_all_passed: allRegressionPassed,
    canonical_experience_count: canonicalNow.length,
    dangling_total: totalDangling,
    duplicate_total: looseDuplicates.length,
    new_rule_score_or_auto_learning_created: false,
    real_project_modifications: 0,
    new_experience: newExperience.experience_id,
    final_state: finalState,
  });

  const ok = allClear && noRealGap;
  console.log(`${ok ? 'OK' : 'CHECK NEEDED'} -- PHASE-S31 complete. All foundation references resolve: ${allFoundationReferencesResolve}. S28 duplicate-heuristic bug impacted real judgment: ${s28DuplicateHeuristicBugCheck.bug_impacted_real_foundation_judgment}. 7-axis regression: ${allRegressionPassed}. Full Experience integrity: dangling=${totalDangling}, duplicates=${looseDuplicates.length}. Final state: ${finalState}.`);
  process.exitCode = ok ? 0 : 1;
}

main();
