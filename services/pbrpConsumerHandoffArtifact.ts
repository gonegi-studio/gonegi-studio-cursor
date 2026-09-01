import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { PbrpRuntimeExecutionResult } from './pbrpRuntimeOrchestrator.js';
import type { FinalPromptMetadata } from './pbrpAiAdapter.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-008: PBRP Consumer Handoff Validation V1.
 *
 * Builds a real, human-usable handoff artifact for manually copy-pasting a
 * PBRP-generated Final Prompt into a real AI Studio (or Claude) session for
 * result comparison -- per this phase's own "실제 AI Studio 호출은 하지
 * 않음 / 최종 Prompt를 AI Studio에 수동 전달하여 결과 비교 가능한
 * artifact 생성" requirement. This module makes no network call and does
 * not touch any real AI Studio consumer code; it only writes a file this
 * repository's own reports convention already uses.
 */

export const PBRP_CONSUMER_HANDOFF_PHASE = 'PHASE-PROJECT-BRAIN-INTEGRATION-008' as const;

export const HANDOFF_ARTIFACT_DIR = 'reports/project_brain_integration' as const;
export const HANDOFF_ARTIFACT_JSON_PATH = 'reports/project_brain_integration/pbrp-consumer-handoff-artifact-v1.json' as const;
export const HANDOFF_ARTIFACT_MD_PATH = 'reports/project_brain_integration/PBRP_CONSUMER_HANDOFF_ARTIFACT_V1.md' as const;

export type HandoffEntry = {
  consumer_id: string;
  format_id: string;
  rendered_text: string;
  rendered_text_sha256: string;
  positive_prompt: string;
  negative_prompt: string;
  metadata: FinalPromptMetadata;
};

export type HandoffArtifact = {
  artifact_id: 'pbrp-consumer-handoff-artifact-v1';
  phase: typeof PBRP_CONSUMER_HANDOFF_PHASE;
  generated_at: string;
  source_input: string;
  intent_id: string | null;
  selection_summary: {
    character_id: string | null;
    style_id: string | null;
    shot_id: string | null;
  };
  entries: HandoffEntry[];
  usage_note: string;
};

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Builds the artifact from one or more already-completed, PASS-ing
 * orchestrator runs for the *same input* against different consumers. Does
 * not itself run the pipeline -- pure assembly, so its output is fully
 * traceable back to exactly the `PbrpRuntimeExecutionResult` objects
 * passed in.
 */
export function buildConsumerHandoffArtifact(runs: PbrpRuntimeExecutionResult[]): HandoffArtifact {
  const passing = runs.filter((r) => r.pass && r.final_prompt);
  if (passing.length === 0) {
    throw new Error('PBRP_HANDOFF_NO_PASSING_RUNS: cannot build a handoff artifact with zero passing runs');
  }
  const first = passing[0];
  const sourceInputs = new Set(passing.map((r) => r.intent?.raw_input));
  if (sourceInputs.size > 1) {
    throw new Error('PBRP_HANDOFF_MIXED_INPUT: all runs passed to buildConsumerHandoffArtifact must share the same source input');
  }

  const entries: HandoffEntry[] = passing.map((r) => {
    const fp = r.final_prompt!;
    return {
      consumer_id: fp.consumer_id,
      format_id: fp.format_id,
      rendered_text: fp.rendered_text,
      rendered_text_sha256: sha256(fp.rendered_text),
      positive_prompt: fp.positive_prompt,
      negative_prompt: fp.negative_prompt,
      metadata: fp.metadata,
    };
  });

  return {
    artifact_id: 'pbrp-consumer-handoff-artifact-v1',
    phase: PBRP_CONSUMER_HANDOFF_PHASE,
    generated_at: new Date().toISOString(),
    source_input: first.intent?.raw_input ?? '',
    intent_id: first.intent?.intent_id ?? null,
    selection_summary: {
      character_id: first.selection?.character?.anchor_id ?? null,
      style_id: first.selection?.style?.composition_id ?? null,
      shot_id: first.selection?.shot?.shot_id ?? null,
    },
    entries,
    usage_note:
      'Copy an entry\'s rendered_text (or, for a positive/negative-split consumer, positive_prompt and negative_prompt separately) into the target consumer manually. This repository never submits these values to any external service itself. rendered_text_sha256 lets a reviewer confirm the pasted content was not altered in transit.',
  };
}

function renderMarkdown(artifact: HandoffArtifact): string {
  const lines: string[] = [
    '# PBRP Consumer Handoff Artifact V1',
    '',
    `Generated: ${artifact.generated_at}`,
    '',
    `Source input: \`${artifact.source_input}\``,
    '',
    `Selected: character=\`${artifact.selection_summary.character_id}\`, style=\`${artifact.selection_summary.style_id}\`, shot=\`${artifact.selection_summary.shot_id}\``,
    '',
    '> ' + artifact.usage_note,
    '',
  ];

  for (const entry of artifact.entries) {
    lines.push(`## Consumer: ${entry.consumer_id} (${entry.format_id})`);
    lines.push('');
    lines.push(`sha256: \`${entry.rendered_text_sha256}\``);
    lines.push('');
    lines.push('```text');
    lines.push(entry.rendered_text);
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

/** Writes both the machine-readable JSON and the human-readable Markdown handoff artifact. Read-only elsewhere -- only ever writes to its own two report paths. */
export function writeConsumerHandoffArtifact(projectRoot: string, artifact: HandoffArtifact): void {
  const dir = path.join(projectRoot, HANDOFF_ARTIFACT_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(projectRoot, HANDOFF_ARTIFACT_JSON_PATH), `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(projectRoot, HANDOFF_ARTIFACT_MD_PATH), renderMarkdown(artifact), 'utf8');
}
