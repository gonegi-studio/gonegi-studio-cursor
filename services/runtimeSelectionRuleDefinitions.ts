import { RUNTIME_LIBRARY_CROSS_LINK_SCHEMA_VERSION } from './runtimeLibraryCrossLinkDefinitions.js';

export const RUNTIME_SELECTION_RULE_SCHEMA_VERSION =
  'RUNTIME-SELECTION-RULE-FINGERPRINT-v1' as const;

export interface RuntimeSelectionRule {
  rule_id: string;
  priority: number;
  shot_id: string;
  transition_id: string;
}

export interface RuntimeSelectionRuleFingerprint {
  schemaVersion: typeof RUNTIME_SELECTION_RULE_SCHEMA_VERSION;
  ruleIds: string[];
  rulePriorities: Record<string, number>;
  shotReferences: Record<string, string>;
  transitionReferences: Record<string, string>;
  crossLinkSchemaVersion: typeof RUNTIME_LIBRARY_CROSS_LINK_SCHEMA_VERSION;
  frozenAt: string;
}

const SELECTION_RULES: RuntimeSelectionRule[] = [
  {
    rule_id: 'SEL-wide-establishing-sunset',
    priority: 1,
    shot_id: 'wide_establishing',
    transition_id: 'sunset_to_night',
  },
  {
    rule_id: 'SEL-wide-establishing-rain',
    priority: 2,
    shot_id: 'wide_establishing',
    transition_id: 'rain_to_clear',
  },
  {
    rule_id: 'SEL-medium-emotional-confession',
    priority: 1,
    shot_id: 'medium_emotional',
    transition_id: 'silence_to_confession',
  },
  {
    rule_id: 'SEL-medium-emotional-hope-sadness',
    priority: 2,
    shot_id: 'medium_emotional',
    transition_id: 'hope_to_sadness',
  },
  {
    rule_id: 'SEL-side-tracking-walking',
    priority: 1,
    shot_id: 'side_tracking',
    transition_id: 'walking_to_running',
  },
  {
    rule_id: 'SEL-side-tracking-reunion',
    priority: 2,
    shot_id: 'side_tracking',
    transition_id: 'separation_to_reunion',
  },
  {
    rule_id: 'SEL-rear-follow-reunion',
    priority: 1,
    shot_id: 'rear_follow',
    transition_id: 'separation_to_reunion',
  },
  {
    rule_id: 'SEL-rear-follow-walking',
    priority: 2,
    shot_id: 'rear_follow',
    transition_id: 'walking_to_running',
  },
  {
    rule_id: 'SEL-overhead-isolation-hope-sadness',
    priority: 1,
    shot_id: 'overhead_isolation',
    transition_id: 'hope_to_sadness',
  },
  {
    rule_id: 'SEL-overhead-isolation-sunset',
    priority: 2,
    shot_id: 'overhead_isolation',
    transition_id: 'sunset_to_night',
  },
  {
    rule_id: 'SEL-window-reflection-confession',
    priority: 1,
    shot_id: 'window_reflection',
    transition_id: 'silence_to_confession',
  },
  {
    rule_id: 'SEL-window-reflection-hope',
    priority: 2,
    shot_id: 'window_reflection',
    transition_id: 'sadness_to_hope',
  },
  {
    rule_id: 'SEL-close-hand-hope-sadness',
    priority: 1,
    shot_id: 'close_hand_detail',
    transition_id: 'hope_to_sadness',
  },
  {
    rule_id: 'SEL-close-hand-sadness-hope',
    priority: 2,
    shot_id: 'close_hand_detail',
    transition_id: 'sadness_to_hope',
  },
  {
    rule_id: 'SEL-silhouette-reunion',
    priority: 1,
    shot_id: 'silhouette_distance',
    transition_id: 'separation_to_reunion',
  },
  {
    rule_id: 'SEL-silhouette-sunset',
    priority: 2,
    shot_id: 'silhouette_distance',
    transition_id: 'sunset_to_night',
  },
];

export function getRuntimeSelectionRules(): RuntimeSelectionRule[] {
  return SELECTION_RULES.map((rule) => ({ ...rule }));
}

export function buildRuntimeSelectionRuleFingerprint(frozenAt: string): RuntimeSelectionRuleFingerprint {
  const rules = getRuntimeSelectionRules();
  const rulePriorities: Record<string, number> = {};
  const shotReferences: Record<string, string> = {};
  const transitionReferences: Record<string, string> = {};

  for (const rule of rules) {
    rulePriorities[rule.rule_id] = rule.priority;
    shotReferences[rule.rule_id] = rule.shot_id;
    transitionReferences[rule.rule_id] = rule.transition_id;
  }

  return {
    schemaVersion: RUNTIME_SELECTION_RULE_SCHEMA_VERSION,
    ruleIds: rules.map((rule) => rule.rule_id).sort(),
    rulePriorities,
    shotReferences,
    transitionReferences,
    crossLinkSchemaVersion: RUNTIME_LIBRARY_CROSS_LINK_SCHEMA_VERSION,
    frozenAt,
  };
}

export function getRuntimeSelectionRulesById(): Map<string, RuntimeSelectionRule> {
  return new Map(getRuntimeSelectionRules().map((rule) => [rule.rule_id, rule]));
}

export function selectionRuleLinkKey(rule: RuntimeSelectionRule): string {
  return `${rule.shot_id}::${rule.transition_id}`;
}
