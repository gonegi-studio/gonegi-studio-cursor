# Team Contract V1 — Claude ↔ Codex

Governs how `agent-bridge-codex-v1.ts` is used. This is a behavior contract for
whichever agent is acting as Leader in a given task; it is not a system to be
executed. There is no queue, no session store, no scoring, no orchestrator, and
nothing here talks to Antigravity — those remain explicitly out of scope for V1.

## Roles

Claude and Codex are both Workers by default. For a single task, exactly one
of them holds temporary Leader status — the agent that owns the user's
conversation and decides whether delegation is needed at all. Leader status is
scoped to that one task and does not carry over. Neither agent is a permanent
Leader.

## Solo-first

The default is to do the work yourself. Calling the other agent as Worker is
justified only when there is a concrete reason — capability the Leader lacks
for this task, or genuinely independent execution the Leader wants cross-checked
— not as a routine step. If the Leader can do it directly, it does.

## Goal Lock

The task text handed to a Worker is the goal for that call, fixed at
delegation time. A Worker does not redefine, narrow, or expand the goal on its
own initiative. `agent-bridge-codex-v1.ts` echoes the exact task string back in
`result.command`, so the Leader can diff what it asked for against what was
actually sent — this is the mechanical half of Goal Lock; the semantic half
(did the returned message actually satisfy that goal) is the Leader's
judgment call, not something a script can certify.

## Scope Lock

A Worker's blast radius is bounded to the `cwd` and `sandbox` the Leader
supplied — no more. Default `sandbox` is `read-only`; anything wider
(`workspace-write`, `danger-full-access`) must be requested explicitly per
call, not assumed. The bridge exposes no flag to widen scope beyond the
declared `cwd` (no `--add-dir`), so scope-widening isn't something a Worker
call can do quietly.

## Ground Truth

Repository Reality > Verified Evidence > Agent Claim. A Worker's self-reported
`agentMessage` is a claim, not proof. The bridge separates that claim from the
raw `lastMessage` file and `stderr`/`exitCode` so the Leader has evidence
independent of the Worker's own narration — but the bridge does not itself
check the repository. That check is the Leader's job, always, after every
delegated call:

**Worker result → Leader → Leader validates against the repository/tests
independently → only then does the Leader treat the task as done.**

A Worker saying "done" is never sufficient on its own.

## Token Policy

Minimum-sufficient Agent/Model/Effort by default. No automatic escalation to
higher-cost models (Astra/Fable-tier or equivalent) — an escalation must be a
deliberate, justified choice at call time, never a default. The bridge passes
`--model`/`--effort` straight through with no forced default of its own,
deferring to whatever Codex's own config already resolves to (currently
`model_reasoning_effort = "low"`). Subscription usage only — no API keys, no
new billing surface; this was verified during the capability assessment and
the contract does not change it.

## Delegation / Return

One synchronous call, one return. The Leader sends a task; the Worker runs
once and returns exit code + status + evidence; the call ends. No persistent
session, no follow-up turns inside the same call, no background queue to poll.
If more work is needed, that is a new, separately-scoped call the Leader
decides to make — not a continuation the Worker initiates.

## Independent Validation

After a Worker call returns, the Leader checks the actual repository state
(git status/diff) and/or runs the relevant tests or verification scripts
itself before accepting the result. The Leader does not forward a Worker's
claim to the user unverified. If validation fails, the task is not done,
regardless of what `status` the bridge reported.

## Retry

Retry is a Leader decision, not an automatic behavior of the bridge — the
bridge itself never retries a call for you. On failure (`CLI_ERROR`,
`CODEX_FAILURE`, `TIMEOUT`, or a `SUCCESS` that fails independent validation),
the Leader may re-issue the *same* Goal/Scope once with a corrected or
clarified task. Retries are not unbounded: after one bounded rework attempt
within the same scope still fails, the Leader stops delegating and moves to
Stop/Escalation rather than looping.

## Stop / Escalation

The Leader stops delegating and hands the situation back to the human when:
- the goal is ambiguous enough that a Worker call would be guessing,
- a bounded retry within the same scope has already failed once,
- the task would require widening scope or sandbox beyond what was
  originally authorized,
- the action under consideration is destructive or hard to reverse
  (regardless of which agent would perform it), or
- cost/effort would need to exceed minimum-sufficient to proceed.

Escalation means surfacing the situation and evidence to the user — not
silently upgrading model/effort, not silently widening scope, and not looping
retries to route around the blocker.

## Team Token Budget Policy V1.1

Investigated whether Claude and Codex can each check their own current weekly
usage before starting or delegating work. Only empirically-confirmed
mechanisms are used below — nothing here is an estimate or a fake percentage.

**What's actually readable:**
- **Claude**: `claude -p "/usage"` (non-interactive) returns real numbers on
  demand — confirmed 2026-09-08: current session 17% used / resets Sep 8
  1:59pm, current week (all models) 66% used / resets Sep 10 ~9:59am
  (Asia/Seoul). Genuinely queryable before starting or delegating work.
- **Codex**: tested directly through `agent-bridge-codex-v1.ts` — asked a live
  `codex exec` run whether it has any tool to report its own usage, remaining
  quota, or reset time. It answered no such tool is available to it in that
  context, and correctly declined to guess. So Codex's real-time
  remaining/percentage is **not** machine-readable from where the bridge calls
  it. Only its reset day/time is known, and only because the user supplies it
  as a config value, not because it can be queried live.

**Policy** (extends, doesn't replace, existing Token Policy / Solo-first):
- Minimum-sufficient Agent/Model/Effort first; solo-first — unchanged.
- Before non-trivial work or delegation, the Leader may check its own
  remaining budget via the real query above (Claude only — Codex has none).
- Weigh remaining budget together with time-to-reset, not remaining budget
  alone: an agent close to its own reset can reasonably absorb more load even
  if its remaining number looks tight; an agent far from reset with little
  remaining should be preserved.
- Where there's a real choice, preserve whichever agent is genuinely low —
  don't spend down an already-scarce budget on work the other agent could do
  just as well.
- No automatic escalation to a higher-cost model/effort to save or route
  around a low budget — that's the Leader's explicit, justified call, never a
  default.
- No assumption of purchasing additional tokens/quota; budgets are whatever
  the current subscription already provides.

**Reset times** (user-configurable, not hardcoded constants):

| Agent | Reset (as told by user) | Reset (last live-observed) |
|---|---|---|
| Claude | Thursday 10:00 | 2026-09-08 query showed Sep 10 ~9:59am (Asia/Seoul) for the weekly window |
| Codex | Monday 11:40 | not observable — no live query exists |

These change whenever the user says so. Where Claude's own live number is
available, prefer it over the table at actual decision time — the table is a
necessary fallback for Codex, and a convenience fallback for Claude when
running a live check isn't practical in the moment.

No token governor, scoring system, or new orchestrator was built to support
this — it's a policy addition to the existing contract, applied by whichever
agent is Leader at the time, the same way every other clause here is.

## Cross-Agent Token Budget & Pace Policy V1.2

Extends V1.1. The point is not to hoard each agent's tokens separately — it's
to use Claude's and Codex's *different* remaining amounts and *different*
reset clocks together to get more real work done across the week than either
agent's schedule alone would allow.

**Verified status (2026-09-08, ~11:00 KST):**

| Agent | Short-term window | Weekly window | Weekly resets | Path used |
|---|---|---|---|---|
| Claude | session: 19% used, resets Sep 8 13:59 KST | 66% used | Sep 10 09:59 KST | `claude -p "/usage"` — live, on demand, works through the normal path |
| Codex | 5h window: 3% used, resets Sep 8 14:34:51 KST | 8% used | Sep 14 12:56:12 KST | last-observed only — see gap below |

**Real gap found on the Codex side, verified not assumed:** Codex's CLI does
compute and log real `rate_limits` (short-term `primary` + weekly `secondary`,
both with `used_percent` and `resets_at`) as a `token_count` event — confirmed
by reading a Codex session's own rollout log
(`~/.codex/sessions/.../rollout-*.jsonl`). But that event is **not** part of
`codex exec --json`'s stdout stream (checked directly: a fresh `--json` run's
stdout has only `thread.started`/`turn.started`/`item.completed`/
`turn.completed`, never `token_count`), and the rollout file it lives in is
never written at all when `--ephemeral` is set — which `agent-bridge-codex-v1.ts`
always sets. So today, through Bridge V1's actual path, Codex cannot return
live usage to a Leader; the table above's Codex row is a last-observed value
from a one-off non-ephemeral probe, not something Bridge currently delivers.
Per V1.1's own rule, this falls back to the user-provided reset config below.
**Closed 2026-09-08** (Codex Usage Relay V1.2): `agent-bridge-codex-v1.ts` now
runs without `--ephemeral`, reads the resulting rollout file's real
`token_count`/`rate_limits` event back into the result as `codexUsage`, and
deletes that rollout file before returning — verified end to end (SUCCESS and
CLI_ERROR paths both still behave exactly as before, `codexUsage` came back
`VERIFIED` with real short-term/weekly percentages and `resetsAt` on a live
call, and the rollout file was confirmed gone afterward, not left behind).
Both agents' real usage is live-verifiable through their normal path as of
this fix.

**Daily baseline pace:** `100% ÷ 7 ≈ 14.29%/day`, per agent, per window. This
is a reference line only, never a quota — nothing enforces it and nothing
blocks work for being under or over it.

**Routing rule**, symmetric for either agent as Leader (checked at the start
of non-trivial work or before delegating, using whichever side has a
live-verified number — Claude today, Codex once its gap above is closed):

1. For each agent, compute `remaining% ÷ time-to-reset` and compare to the
   14.29%/day baseline.
2. Burning faster than baseline → preserve that agent; prefer the other, or
   go solo.
3. Well under baseline (plenty of slack for the time left) → that agent can
   be prioritized for upcoming work.
4. Close to its own reset *and* still holding meaningful remaining budget →
   actively good candidate for suitable real tasks now, since unused budget
   doesn't carry over.
5. The moment an agent's window resets, re-evaluate fresh — don't reason from
   its pre-reset numbers.
6. Task fit and quality bar are decided **first**. Token state only chooses
   between agents/models/effort levels that already clear that bar — an
   unsuitable agent is never assigned just because it has tokens to spare.

**Unchanged from V1.1 / Team Contract V1:** solo-first, minimum-sufficient
model/effort, no auto-escalation to a costlier model to manage budget, no
assumption that more tokens can be bought, and no manufacturing work (for
either agent) just to spend down or exercise a budget check. No governor,
scoring system, queue, or new orchestrator was built — this is a policy
section in the existing contract, applied by whichever agent is Leader.

## Explicitly out of scope for V1

No GENIE-style learning/adapter layer, no task queue, no persisted session
state, no scoring system, no Antigravity integration, no general-purpose
orchestrator. If a future version needs any of these, that is a new,
separately-scoped decision — not an extension made quietly inside this
contract.

## Mechanical enforcement map

| Contract clause | Enforced by |
|---|---|
| Goal Lock (mechanical half) | `result.command` echoes the exact task string |
| Scope Lock | `--sandbox` (default `read-only`), `-C <cwd>`, no scope-widening flag exposed |
| Ground Truth (evidence separation) | `agentMessage` vs `lastMessage` vs `stderr`/`exitCode` returned distinctly |
| Token Policy | `--model`/`--effort` pass-through only, no forced default, no auto-escalation |
| Delegation / Return | single `spawn` → single `exit` handler → one JSON result, process exits |
| Retry (bounded, Leader-driven) | not implemented in code by design — retries are a Leader action, never automatic |
| Stop / Escalation | not implemented in code by design — this is judgment, not mechanism |

No changes were made to `agent-bridge-codex-v1.ts` to produce this contract —
its existing single-call, evidence-returning, no-default-escalation behavior
already satisfies every clause above that a script can mechanically satisfy.
The remaining clauses (Ground Truth's repository check, Retry's bound,
Stop/Escalation) are Leader judgment calls by design and are not meant to be
encoded in the tool.
