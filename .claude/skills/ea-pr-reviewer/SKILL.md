---
name: ea-pr-reviewer
description: Review Chainlink External Adapter (EA) changes in external-adapters-js using the EAF—production code quality, unit tests (isolated business logic only), and integration tests (TestAdapter end-to-end). Use whenever the user asks for EA PR review, adapter code review, EAF correctness, or to validate unit/integration tests under packages/sources. Also use for pre-merge review, diff-scoped review, or “is this adapter production-ready?” even if they do not say “skill” or “reviewer.”
---

# EA PR reviewer

Merged rubric for **code review**, **unit test validation**, and **integration test validation** for source adapters in the **external-adapters-js** monorepo.

## Repository assumptions

- Root = monorepo root. Adapters live under `packages/sources/<adapter>/` (`src/`, `test/unit/`, `test/integration/`, etc.).
- EAF sources: after `yarn install`, under `.yarn/unplugged/@chainlink-external-adapter-framework-npm-*/node_modules/@chainlink/external-adapter-framework/` (details in `references/eaf-framework-paths.md`).

## Scoping

- If the user names **paths**, a **diff**, or an **adapter**, infer `packages/sources/<adapter>/` from paths when possible.
- Review **only what is in scope** for the **change under review**:
  - If **no files** under `test/integration/**` are in the stated PR/diff scope, or the user explicitly says **integration tests were not modified**, then in **`full` mode** set `integration_tests` to **`approved: true`** and **`rationale: ""`**. Do **not** run the full integration rubric to fail that dimension for pre-existing suite gaps. You may add **one optional sentence** in `## Summary` (not in `rationale`) if you want to note technical debt in unchanged tests.
  - For **unit tests:** if the user says unit tests were **untouched** and no `test/unit/**` paths are in the stated PR/diff scope, set `unit_tests` to **`approved: true`** and **`rationale: ""`**. If **any** `test/unit/**` path **is** in scope, apply the **full** unit rubric for the adapter (including completeness of isolated business logic such as other exports in `src/` modules that lack unit coverage)—do **not** set `approved: true` only because the edited test file itself is reasonable.
  - If the user asks for a **standalone** integration or unit review (single mode), always apply the corresponding reference fully—even if files were unchanged—because the question is about the suite quality, not PR scope.
- When given a file list or diff, prioritize **those files plus minimal surrounding context**. When asked for a **full** adapter review **with no PR scope stated**, read the whole package areas that matter (`src/`, `config/`, `transport/`, `endpoint/`, tests) and apply all rubrics.

### Code review depth (`full` mode, transport-related PRs)

If the user says **`src/`** changed, **transport** changed, or the diff touches `packages/sources/<adapter>/src/transport/**`, you **must** read **every** `*.ts` file under `packages/sources/<adapter>/src/transport/` (recursively) before returning `code_review.approved: true`. While reading, actively check: optional chaining / guards on nested fields from external messages (WS/JSON), and safe indexing on provider arrays (e.g. `[0]` on possibly empty arrays). If any transport file was not read, set `code_review.approved: false` and say which paths were skipped.

## Routing

Determine **mode** from the user message:

| Mode          | When                                                      | Load                                                      |
| ------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `code`        | Code/production review only, no test validation requested | `references/code-review.md`                               |
| `unit`        | Unit tests only                                           | `references/unit-tests.md`                                |
| `integration` | Integration tests only                                    | `references/integration-tests.md`                         |
| `full`        | PR / branch review, or scope unclear                      | All three references, in order: code → integration → unit |

Read the relevant reference file(s) before judging. Use `references/eaf-framework-paths.md` whenever you need to look up framework file locations.

## Outputs

### Single mode (`code`, `unit`, or `integration`)

Return:

- `approved`: boolean
- `rationale`: string — **empty string when `approved` is true** for `unit` and `integration` (save tokens). For `code`, when `approved` is true, `rationale` may be empty or a brief note; when false, use detailed feedback with `[file:line] category: description. Fix: suggestion` per issue.

### Full mode (`full`)

Return a single structured result:

- `code_review`: `{ "approved": boolean, "rationale": string }`
- `integration_tests`: `{ "approved": boolean, "rationale": string }` — empty `rationale` when approved
- `unit_tests`: `{ "approved": boolean, "rationale": string }` — empty `rationale` when approved
- `overall_approved`: boolean — `true` only if all three `approved` values are `true`

Apply **unchanged** dimensions as above (approved with empty rationale, or a one-line “no integration test changes in scope”).

### Optional human summary

After structured output, you may add a short **Markdown** block titled `## Summary` suitable for pasting into a GitHub PR comment: verdict, blockers, and next steps—no more than a few bullets.

## Conduct

- **Validators:** never edit files; analysis only (unit and integration modes, and test portions of full mode).
- **Code review mode:** still read-only unless the user explicitly asks you to apply fixes.
- Do **not** produce long meta-narratives about your process, tool usage, or internal checklists. Deliver the verdict and structured fields (and optional short summary) only.

## Reference index

| File                                | Content                   |
| ----------------------------------- | ------------------------- |
| `references/eaf-framework-paths.md` | Unplugged EAF paths       |
| `references/code-review.md`         | Production code checklist |
| `references/integration-tests.md`   | Integration test rubric   |
| `references/unit-tests.md`          | Unit test rubric          |
