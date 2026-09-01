import {
  buildSourceVideoNumericalDnaMveExport,
  type SourceVideoNumericalDnaMveExport,
} from './sourceVideoNumericalDnaMveExtraction.js';
import {
  buildSourceVideoNumericalDnaFullExport,
  type SourceVideoNumericalDnaFullExport,
} from './sourceVideoNumericalDnaFullExtraction.js';
import {
  validateNumericalCinematographyDnaCompletion,
  NUMERICAL_DNA_COMPLETION_PASS_VERDICT,
  type NumericalDnaCompletionReport,
} from './numericalCinematographyDnaCompletionValidator.js';

export const MISSING_GEOMETRY_RECOVERY_PHASE = 'PHASE-NUMERICAL-DNA-REAL-007' as const;
export const MISSING_GEOMETRY_RECOVERY_TARGETS = [
  'GHIBLI_03',
  'MORI_02',
  'MORI_03',
  'MORI_04',
] as const;
export const MISSING_GEOMETRY_RECOVERY_PASS_VERDICT = NUMERICAL_DNA_COMPLETION_PASS_VERDICT;

export interface MissingGeometryRecoverySourceStatus {
  source_video_id: string;
  geometry_recovered: boolean;
  coordinate_recovered: boolean;
  frame_count: number;
  recovered_fields: string[];
  error?: string;
}

export interface MissingGeometryRecoveryReport {
  phase: string;
  targets: readonly string[];
  gates: {
    geometry_pass: { pass: boolean; detail: string };
    coordinate_pass: { pass: boolean; detail: string };
    dna_pass: { pass: boolean; detail: string };
    runtime_pass: { pass: boolean; detail: string };
    end_to_end_pass: { pass: boolean; detail: string };
  };
  per_source: MissingGeometryRecoverySourceStatus[];
  verdict: string;
  completion: NumericalDnaCompletionReport;
}

function findFailure(
  exportResult: { extraction_failures?: Array<{ source_video_id: string; error: string }> } | undefined,
  sourceId: string
): string | undefined {
  return exportResult?.extraction_failures?.find((f) => f.source_video_id === sourceId)?.error;
}

export function validateMissingGeometryRecovery(root: string): MissingGeometryRecoveryReport {
  let mve: SourceVideoNumericalDnaMveExport | undefined;
  let mveError: string | undefined;
  try {
    mve = buildSourceVideoNumericalDnaMveExport(root);
  } catch (error) {
    mveError = error instanceof Error ? error.message : String(error);
  }

  let full: SourceVideoNumericalDnaFullExport | undefined;
  let fullError: string | undefined;
  try {
    full = buildSourceVideoNumericalDnaFullExport(root);
  } catch (error) {
    fullError = error instanceof Error ? error.message : String(error);
  }

  const per_source: MissingGeometryRecoverySourceStatus[] = MISSING_GEOMETRY_RECOVERY_TARGETS.map(
    (sourceId) => {
      const mveSource = mve?.sources.find((s) => s.source_video_id === sourceId);
      const mveSourceError = mveError ?? findFailure(mve, sourceId);
      const fullSource = full?.sources.find((s) => s.source_video_id === sourceId);
      const fullSourceError = fullError ?? findFailure(full, sourceId);

      return {
        source_video_id: sourceId,
        geometry_recovered: !!mveSource && !mveSourceError,
        coordinate_recovered: !!fullSource && !fullSourceError,
        frame_count: mveSource?.frame_coordinates.frames.length ?? 0,
        recovered_fields: mveSource
          ? Object.keys(mveSource.composition_coordinates.frames[0] ?? {}).filter(
              (key) => (mveSource.composition_coordinates.frames[0] as Record<string, unknown>)[key] !== undefined
            )
          : [],
        error: mveSourceError ?? fullSourceError,
      };
    }
  );

  const geometryPassOk = per_source.every((s) => s.geometry_recovered);
  const coordinatePassOk = per_source.every((s) => s.coordinate_recovered);

  const completion = validateNumericalCinematographyDnaCompletion(root);
  const dnaPassOk = completion.numerical_dna_pass_ok;
  const runtimePassOk = completion.runtime_pass_ok;
  const endToEndPassOk = completion.end_to_end_pass_ok;

  const allPass = geometryPassOk && coordinatePassOk && dnaPassOk && runtimePassOk && endToEndPassOk;

  return {
    phase: MISSING_GEOMETRY_RECOVERY_PHASE,
    targets: MISSING_GEOMETRY_RECOVERY_TARGETS,
    gates: {
      geometry_pass: {
        pass: geometryPassOk,
        detail: `${per_source.filter((s) => s.geometry_recovered).length}/${MISSING_GEOMETRY_RECOVERY_TARGETS.length} targets produced real geometric frame data at the MVE stage`,
      },
      coordinate_pass: {
        pass: coordinatePassOk,
        detail: `${per_source.filter((s) => s.coordinate_recovered).length}/${MISSING_GEOMETRY_RECOVERY_TARGETS.length} targets reached full extraction (frame_coordinates + composition_coordinates)`,
      },
      dna_pass: {
        pass: dnaPassOk,
        detail: `numerical_dna_pass_ok=${dnaPassOk} (full completion validator: coverage_ratio=${completion.evidence.validation.coverage_ratio}, validation_score=${completion.evidence.validation.validation_score})`,
      },
      runtime_pass: {
        pass: runtimePassOk,
        detail: `runtime_pass_ok=${runtimePassOk} (all pipeline stages executed without throwing)`,
      },
      end_to_end_pass: {
        pass: endToEndPassOk,
        detail: `end_to_end_pass_ok=${endToEndPassOk}`,
      },
    },
    per_source,
    verdict: allPass ? MISSING_GEOMETRY_RECOVERY_PASS_VERDICT : completion.verdict,
    completion,
  };
}
