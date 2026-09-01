// CR-16: explicit prospective feedback only. No inference, mutation or promotion.
const check = (ok, detail) => { if (!ok) throw new Error(`CAUSAL_FEEDBACK_INVALID: ${detail}`); };
const text = value => typeof value === 'string' && value.trim().length > 0;

export function validateCauseOutcomeFeedback(decision, experienceId, generatedAt, canonicalExperiences) {
  if (decision == null) return; // Existing base contracts own missing decision validation.
  const notePresent = Object.hasOwn(decision, 'cause_review_note');
  const testedPresent = Object.hasOwn(decision, 'intervention_tested_claimed_cause');
  if (!notePresent && !testedPresent) return; // No defaults or retroactive requirements.
  if (testedPresent) check(typeof decision.intervention_tested_claimed_cause === 'boolean',
    'intervention_tested_claimed_cause must be boolean');
  if (!notePresent) return; // The optional boolean does not invent a review or correction.
  check(text(decision.cause_review_note), 'cause_review_note must be non-empty text');
  const ref = decision.corrects_experience_id;
  check(text(ref) && ref !== experienceId, 'CR-06 requires a non-self correction reference');
  const matches = canonicalExperiences.filter(e => e.experience_id === ref);
  check(matches.length === 1, 'CR-06 reference must resolve exactly once');
  const previousTime = Date.parse(matches[0].generated_at);
  const currentTime = Date.parse(generatedAt);
  check(Number.isFinite(previousTime) && Number.isFinite(currentTime) && previousTime < currentTime,
    'CR-06 correction target must be earlier');
  // Text and boolean are author assertions, not proof that an intervention isolated
  // the claimed cause. Outcome success/failure never supplies either field.
}
