# ea-pr-reviewer — iteration 1 benchmark (manual aggregate)

Runs: 3 evals × (with skill | without skill), real adapter **`packages/sources/tiingo`**.

| Eval               | with_skill pass rate | without_skill pass rate | Notes                                                                                                                                                                                                                        |
| ------------------ | -------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| full-pr-scoped     | 3/4 (75%)            | 3/4 (75%)               | **Skill:** structured JSON ✓; **fails** “unchanged integration” assertion—executor re-reviewed integration suite and set `approved: false` despite PR not touching `test/integration/**`. **Baseline:** no JSON structure ✗. |
| integration-tiingo | 3/3 (100%)           | 2/3 (67%)               | **Skill:** `approved` + `rationale` JSON ✓. **Baseline:** strong narrative, **no** strict JSON ✗.                                                                                                                            |
| unit-tiingo        | 3/3 (100%)           | 2/3 (67%)               | Same pattern: skill enforces structured output; both reach similar technical conclusions.                                                                                                                                    |

**Mean assertion pass rate (simple average of eval pass rates):**

- **with_skill:** ~92%
- **without_skill:** ~70%

## Skill critique (for next iteration)

1. **Scoping conflict:** In **full** mode, when the user says integration tests were **not modified**, SKILL.md says mark that dimension **unchanged** with `approved: true` and empty rationale. The with-skill run still failed `integration_tests` for pre-existing suite gaps. **Tighten SKILL.md** so “unchanged in this PR” → skip deep integration rubric or force `approved: true` with a one-line “unchanged” rationale.

2. **Evals:** Replace fictional `example-adapter` / `my-adapter` in `evals/evals.json` with **`tiingo`** (or another real package) so local/CI runs match this benchmark layout.

## Artifacts

- `full-pr-scoped/{with_skill,without_skill}/outputs/{response,transcript}.md` + `grading.json`
- `integration-tiingo/...`
- `unit-tiingo/...`
- Per-eval `eval_metadata.json` with assertions

## Skill-creator viewer

The stock `aggregate_benchmark.py` layout uses `eval-N/with_skill/run-1/grading.json`. This iteration uses **named** eval folders instead. To use `generate_review.py`, either restructure to `eval-0/run-1` or open the `response.md` files directly under the paths above.
