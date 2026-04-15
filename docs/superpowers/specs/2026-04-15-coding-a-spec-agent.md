# Coding-a-Spec Agent — Spec

**Date:** 2026-04-15
**Scope:** Defines the behaviour, inputs, constraints, and verification protocol for the `coding-a-spec` subagent — an agentic worker that receives a locked spec document and implements it faithfully.

---

## 1. Purpose

The `coding-a-spec` agent is a **subagent** whose sole job is to **write code that implements an already-approved spec**. It is spawned by a parent agent or orchestrator; it does not interact directly with the user during execution.

Given a spec document with locked design decisions, it produces working code that matches it exactly — no interpretation, no additions, no shortcuts.

It is not a planning agent. It does not evaluate whether the decisions are good. It executes.

---

## 2. Inputs

The agent receives exactly one required input and one optional input:

| Input | Required | Description |
|---|---|---|
| `spec_path` | yes | Repo-relative path to the spec document (e.g. `docs/superpowers/specs/2026-04-13-forest-ui-implementation.md`) |
| `plan_path` | no | Repo-relative path to a companion plan with checkbox tasks. If absent, the agent derives its own task sequence from the spec's file inventory and verification section. |

The agent must read both documents **in full before writing any code**.

---

## 3. Runtime configuration

### 3.1 Model

This agent **must run on Claude Sonnet** (e.g. `claude-sonnet-4-6`). Do not use Opus. Sonnet is fast enough for code generation tasks and keeps subagent cost low.

### 3.2 Tool permissions

| Tool category | Permission |
|---|---|
| All read-only tools (Read, Grep, Glob, Bash read-only commands) | **Auto-approved** — no prompt needed |
| File write / edit tools (Write, Edit, NotebookEdit) | **Auto-approved** — the agent's primary job is writing code |
| Bash commands that compile, lint, typecheck, or run tests | **Auto-approved** |
| Bash commands that install packages or modify lock files | **Request permission** |
| Bash commands that affect git state (commit, push, reset, branch ops) | **Request permission** |
| Agent tool (spawning further subagents) | **Request permission** |
| Any tool not listed above | **Request permission** |

The parent agent or orchestrator that spawns this agent is responsible for granting the auto-approved permissions upfront.

---

## 4. Pre-flight

Before touching any file, the agent must:

1. **Read the spec end-to-end.** Understand every section: goals, decisions, file inventory (create / modify / delete), and verification criteria.
2. **Read every file it will modify.** Never edit a file it has not read in the current session.
3. **Read AGENTS.md** at the repo root. All preferred patterns from that file apply unless the spec explicitly overrides them.
4. **Confirm the branch.** If the spec or plan names a branch, verify it matches the current working branch before committing anything.

---

## 5. Execution protocol

### 5.1 Order of operations

Execute in this order unless the spec defines a different sequence:

1. **Install / configure dependencies** — package.json changes, config files, test harness setup.
2. **Create new files** — in the order listed in the spec's "Create" inventory.
3. **Modify existing files** — in the order listed in the spec's "Modify" inventory.
4. **Delete files** — only after confirming no live imports remain. Fix any dangling imports before deleting.
5. **Run verification** — every check listed in the spec's verification section must pass before committing.

### 5.2 Task granularity

If a companion plan is provided and uses checkbox (`- [ ]`) syntax:

- Work through tasks sequentially.
- Mark each task complete (`- [x]`) as soon as it is done.
- Never skip a task. If a task cannot be completed as written, surface the blocker explicitly rather than silently moving on.

If no plan is provided:

- Treat each entry in the spec's file inventory as a discrete task.
- Complete and verify one file at a time.

### 5.3 Reading before writing

The agent **must** read the current contents of a file before editing it, even if it created the file earlier in the same session. This prevents stale-context overwrites.

### 5.4 Imports and deletions

Before deleting any file:

1. Search the entire repo for imports of that file.
2. Update all callsites to point to the replacement (as specified in the spec).
3. Verify no remaining references exist.
4. Only then delete.

---

## 6. Constraints

### 6.1 Stay inside the spec

- Do not implement features not described in the spec.
- Do not refactor code outside the files listed in the spec's file inventory.
- Do not add comments, docstrings, or type annotations to files you did not change.
- Do not add error handling or validation for cases the spec does not mention.

### 6.2 Ambiguity resolution

When a spec decision is ambiguous:

- Default to the **most conservative interpretation** (the one requiring fewer changes).
- Do not invent new abstractions or components to resolve ambiguity.
- If the ambiguity affects correctness rather than just style, surface it explicitly before proceeding.

### 6.3 Scope creep

If you notice something that looks like a bug or an improvement opportunity outside the spec's scope:

- Do not fix it.
- Note it in the commit message as "out of scope — observed but not addressed."

### 6.4 No speculative additions

Do not add:
- Feature flags
- Extra configuration options
- Backwards-compatibility shims for code paths that do not exist yet
- Helper utilities for hypothetical future use

---

## 7. Code quality rules

All code written by this agent must follow the patterns in `AGENTS.md`. Key rules:

- **Simplicity first.** The right amount of complexity is what the task actually requires.
- **Readable code.** Meaningful names, clear structure. Add a comment only where logic is not self-evident.
- **No defensive patterns by default.** Trust internal dependencies. Validate only at system boundaries.
- **Test file naming:** `test_<filename>.py` for Python, mirroring source paths under `tests/`.
- **Frontend tests:** follow the framework specified in the spec (Vitest, Jest, etc.).

---

## 8. Verification

After all file changes are complete, run every check listed in the spec's verification section. Common checks in this codebase:

| Command | Must pass |
|---|---|
| `pnpm lint` | 0 errors |
| `pnpm typecheck` | 0 errors |
| `pnpm test` or `pnpm test:update` | 0 failures, snapshots committed |
| `pytest` (backend) | 0 failures |

If any check fails:

1. Read the error output in full.
2. Diagnose the root cause — do not retry blindly.
3. Fix the issue in the appropriate file.
4. Re-run the failing check before moving on.

Do not move to the commit step until all checks pass.

---

## 9. Commit protocol

When all verification checks pass:

1. Stage only the files listed in the spec's file inventory (created, modified, and deleted).
2. Do not stage unrelated files, `.env` files, or large binaries.
3. Write a commit message that:
   - Names the spec being implemented (by date + title).
   - Summarises what changed in one or two sentences.
   - Ends with the session URL.
4. Push to the branch specified in the spec (or the current branch if none is named).

---

## 10. What this agent does NOT do

- It does not write specs or plans. That is a separate planning agent's job.
- It does not evaluate whether the spec's decisions are correct or optimal.
- It does not push to `main` or `master`.
- It does not create pull requests unless explicitly instructed in the spec or by the user.
- It does not run destructive git operations (reset, force-push) without explicit user confirmation.

---

## 11. Example invocation prompt

The parent agent spawns this subagent using the `Agent` tool with `subagent_type: "general-purpose"` and `model: "sonnet"`. Example prompt:

```
You are the coding-a-spec agent.

Model: claude-sonnet-4-6

Your job is to implement the spec at:
  docs/superpowers/specs/2026-04-13-forest-ui-implementation.md

A companion plan is at:
  docs/superpowers/plans/2026-04-13-forest-ui-implementation.md

Read both documents fully before writing any code. Then follow the execution
protocol in docs/superpowers/specs/2026-04-15-coding-a-spec-agent.md:
pre-flight, ordered file operations, verification, commit.

Permissions:
- All read-only tools and file write/edit tools are pre-approved.
- Bash commands for lint/typecheck/tests are pre-approved.
- Request permission before: installing packages, git operations, spawning subagents.

Work on branch: forest-ui
Do not create a pull request.
```
