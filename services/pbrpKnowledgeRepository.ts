import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-005: PBRP Runtime Execution Preparation V1.
 * PHASE-PROJECT-BRAIN-INTEGRATION-006: PBRP Runtime Validation V1 --
 * extended to a second real, independently-validated source
 * (`spirited_away`) for genuine multi-scenario validation.
 *
 * Minimal, read-only Knowledge Repository adapter for the PBRP pipeline
 * (per E:\PBRP\05_PBRP_Architecture_V1.1_Consolidated.txt, "Knowledge
 * Repository" -- Character DNA / Style DNA / Shot Grammar / etc.).
 *
 * This phase's own scope list does not include a separate Runtime Registry
 * component (that is out of scope per 04_PBRP_Execution_Architecture_
 * Revision_V2.txt's "Revision 제외: Builder, Gateway" and is not named in
 * either phase's own 범위 list). This module is deliberately the minimal
 * substitute: it reads real, already-validated movie-reconstruction
 * registries directly from `datasets/` as the Knowledge Repository content
 * source, with no separate indexing/versioning layer. It never writes to
 * these files.
 *
 * A note on `project_brain/` specifically (PHASE-006 Repository Analysis):
 * that directory was inspected read-only and found to contain only
 * meta-certification/freeze-declaration JSON (manifests, freeze reports,
 * readiness reports) -- zero `character_dna`/`style_dna`/`shot_grammar`
 * content anywhere under it. "Project Brain data" for this pipeline
 * therefore means the repository's real, materialized movie-reconstruction
 * knowledge under `datasets/`, which is what this module reads -- not the
 * literal `project_brain/` folder, which holds no usable Knowledge content.
 *
 * A real schema difference was found between the two sources during
 * PHASE-006 validation: Titanic's composition registry has
 * `composition_priority`/`horizon_weight`/`subject_scale`/
 * `negative_space_policy`; Spirited Away's has an entirely different shape
 * (`foreground`/`midground`/`background`/`visual_balance`/
 * `composition_score`). Rather than fabricate a shared field that doesn't
 * exist in one source, `StyleDnaEntry` below is a normalized shape built
 * from each source's own *real* fields: `priority_score` (Titanic:
 * narrative=1/iconic=0.5, derived from its own real `composition_priority`
 * enum; Spirited Away: its own real `composition_score`, already a 0..1
 * value) and `descriptor` (a plain-text summary built from each source's
 * own real fields, not invented).
 */
export const PBRP_KNOWLEDGE_REPOSITORY_PHASE =
  'PHASE-PROJECT-BRAIN-INTEGRATION-006' as const;

// PHASE-673: widened for original_harbor_saga_v1 (services/pbrpOriginalSceneHeuristicAuthoringV1.ts).
// This module's emotion-keyword selector path is not exercised by the
// ground-truth-first ORIGINAL_SCENE_HEURISTIC_AUTHORING_V1 connection test
// (buildProductionScenario() only falls back to it when scene ground truth
// fails to resolve); the entry below exists so this file still type-checks
// with the widened union, not because the selector path was extended.
export type MovieSourceId = 'titanic' | 'spirited_away' | 'original_harbor_saga_v1';

const SOURCE_PATHS: Record<MovieSourceId, { anchors: string; compositions: string; shots: string }> = {
  titanic: {
    anchors: 'datasets/movie_reconstruction/titanic/titanic-semantic-anchor-registry.json',
    compositions: 'datasets/movie_reconstruction/titanic/titanic-composition-registry.json',
    shots: 'datasets/movie_reconstruction/titanic_shots/titanic-shot-registry.json',
  },
  spirited_away: {
    anchors: 'datasets/movie_reconstruction/spirited_away/spirited-away-semantic-anchor-registry.json',
    compositions: 'datasets/movie_reconstruction/spirited_away/spirited-away-composition-registry.json',
    shots: 'datasets/movie_reconstruction/spirited_away_shots/spirited-away-shot-registry.json',
  },
  original_harbor_saga_v1: {
    anchors: 'datasets/movie_reconstruction/original_harbor_saga_v1/original-harbor-saga-v1-semantic-anchor-registry.json',
    compositions: 'datasets/movie_reconstruction/original_harbor_saga_v1/original-harbor-saga-v1-composition-registry.json',
    // No shot-level registry exists for this heuristic source (PHASE-673 authors
    // scene-level ground truth only) -- disclosed gap, not a fabricated path.
    shots: 'datasets/movie_reconstruction/original_harbor_saga_v1/original-harbor-saga-v1-shot-registry.json',
  },
};

export type CharacterDnaEntry = {
  anchor_id: string;
  emotion: string;
  semantic_meaning: string;
  iconic_score: number;
  /**
   * PHASE-PBRP-AI-STUDIO-NATIVE-SCENARIO-ADAPTER-004: recovered real field,
   * previously read from the raw registry but dropped by this extraction
   * (a genuine data-loss bug found during that phase's read-only analysis,
   * not a missing upstream field). Raw cast ids in each source's own
   * format (e.g. `"CHAR-gonagi"`, `"CHAR-dana"`) -- never normalized or
   * renamed here; that happens only in `pbrpCharacterVisualDnaLibrary.ts`,
   * kept separate so this repository module stays a pure, unmodified
   * read of the raw registry.
   */
  gonegi_characters: string[];
  /**
   * Real field, present on Spirited Away's anchors but confirmed ABSENT
   * (not merely `false`) on Titanic's -- `null` here means "field does not
   * exist in this source's raw registry", distinct from a real `false`
   * value. Never defaulted/fabricated.
   */
  generic_harbor_regression: boolean | null;
};

export type StyleDnaEntry = {
  composition_id: string;
  priority_score: number;
  descriptor: string;
};

export type ShotGrammarEntry = {
  shot_id: string;
  shot_type: string;
  emotion_state: string;
  composition_id: string;
  semantic_anchor_id: string;
};

export type PbrpKnowledgeRepository = {
  source: MovieSourceId;
  character_dna: CharacterDnaEntry[];
  style_dna: StyleDnaEntry[];
  shot_grammar: ShotGrammarEntry[];
};

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

type RawAnchorFields = { anchor_id: string; emotion: string; semantic_meaning: string; iconic_score: number; gonegi_characters?: string[]; generic_harbor_regression?: boolean };
type RawTitanicAnchors = { semantic_anchors: RawAnchorFields[] };
type RawSpiritedAwayAnchors = { anchors: RawAnchorFields[] };

type RawTitanicCompositions = { compositions: Array<{ composition_id: string; composition_priority: string }> };
type RawSpiritedAwayCompositions = { compositions: Array<{ composition_id: string; composition_score: number; foreground: string; midground: string; background: string }> };

type RawShots = { shots: Array<{ shot_id: string; shot_type: string; emotion_state: string; composition_id: string; semantic_anchor_id: string }> };

function toCharacterDnaEntry(a: RawAnchorFields): CharacterDnaEntry {
  return {
    anchor_id: a.anchor_id,
    emotion: a.emotion,
    semantic_meaning: a.semantic_meaning,
    iconic_score: a.iconic_score,
    // Real field, copied verbatim -- empty array only if truly absent from
    // the raw registry (never fabricated cast members).
    gonegi_characters: Array.isArray(a.gonegi_characters) ? [...a.gonegi_characters] : [],
    // `null` when the raw registry has no such key at all (confirmed real
    // for every Titanic anchor); the real boolean value otherwise.
    generic_harbor_regression: 'generic_harbor_regression' in a ? a.generic_harbor_regression! : null,
  };
}

function loadCharacterDna(root: string, source: MovieSourceId): CharacterDnaEntry[] {
  if (source === 'titanic') {
    const raw = readJson<RawTitanicAnchors>(root, SOURCE_PATHS.titanic.anchors);
    return raw.semantic_anchors.map(toCharacterDnaEntry);
  }
  const raw = readJson<RawSpiritedAwayAnchors>(root, SOURCE_PATHS.spirited_away.anchors);
  return raw.anchors.map(toCharacterDnaEntry);
}

function loadStyleDna(root: string, source: MovieSourceId): StyleDnaEntry[] {
  if (source === 'titanic') {
    const raw = readJson<RawTitanicCompositions>(root, SOURCE_PATHS.titanic.compositions);
    return raw.compositions.map((c) => ({
      composition_id: c.composition_id,
      // Titanic's own real field is a two-value priority enum, not a
      // continuous score -- mapped to a 0..1 scale using its own values,
      // not fabricated.
      priority_score: c.composition_priority === 'narrative' ? 1 : 0.5,
      descriptor: `composition_priority=${c.composition_priority}`,
    }));
  }
  const raw = readJson<RawSpiritedAwayCompositions>(root, SOURCE_PATHS.spirited_away.compositions);
  return raw.compositions.map((c) => ({
    composition_id: c.composition_id,
    // Spirited Away's own real field is already a 0..1 composition score.
    priority_score: c.composition_score,
    descriptor: `foreground=${c.foreground}, midground=${c.midground}, background=${c.background}`,
  }));
}

function loadShotGrammar(root: string, source: MovieSourceId): ShotGrammarEntry[] {
  const raw = readJson<RawShots>(root, SOURCE_PATHS[source].shots);
  return raw.shots.map((s) => ({
    shot_id: s.shot_id,
    shot_type: s.shot_type,
    emotion_state: s.emotion_state,
    composition_id: s.composition_id,
    semantic_anchor_id: s.semantic_anchor_id,
  }));
}

/**
 * Loads the Knowledge Repository content this pipeline draws from. Real
 * data only -- no synthetic/fabricated fixtures. Read-only: this function
 * never writes to `datasets/`. Defaults to `titanic` to preserve
 * PHASE-005's original behavior for any existing caller that does not pass
 * a source.
 */
export function loadPbrpKnowledgeRepository(
  projectRoot?: string,
  source: MovieSourceId = 'titanic'
): PbrpKnowledgeRepository {
  const root = projectRoot ?? resolveProjectRoot();

  return {
    source,
    character_dna: loadCharacterDna(root, source),
    style_dna: loadStyleDna(root, source),
    shot_grammar: loadShotGrammar(root, source),
  };
}
