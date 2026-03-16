# Revalidate Code Review
- Task name: first-gen-program
- Findings status: none

## Reviewer Prompt
You are acting as a reviewer for a proposed code change made by another engineer.
Focus on issues that impact correctness, performance, security, maintainability, or developer experience.
Flag only actionable issues introduced by the pull request.
When you flag an issue, provide a short, direct explanation and cite the affected file and line range.
Prioritize severe issues and avoid nit-level comments unless they block understanding of the diff.
After listing findings, produce an overall correctness verdict ("patch is correct" or "patch is incorrect") with a concise justification and a confidence score between 0 and 1.
Ensure that file citations and line numbers are exactly correct using the tools available; if they are incorrect your comments will be rejected.

## Output Schema
```json
[
  {
    "file": "path/to/file",
    "line_range": "10-25",
    "severity": "high",
    "explanation": "Short explanation."
  }
]
```

## Review Context (auto-generated)
<!-- REVIEW-CONTEXT START -->
- Generated at: 2026-03-16T04:02:38Z
- Base branch: 6d114ebabbf46508f0a42ccc152f53f6e7b2ec6a
- Diff mode: fallback
- Diff command: `git diff`
- Diff bytes: 69364

### Changed files
- `goals/first-gen-program/establish-goals.v0.md`
- `goals/first-gen-program/establish-goals.v1.md`
- `goals/first-gen-program/goals.v0.md`
- `goals/first-gen-program/goals.v1.md`
- `goals/task-manifest.csv`
- `src/lib/programExport.ts`
- `src/lib/server/programDocx.ts`
- `src/routes/admin/program/+page.svelte`
- `src/routes/api/program/+server.ts`
- `src/test/lib/programDocx.test.ts`
- `src/test/lib/programExport.test.ts`
- `static/templates/pafe-eastside-concerts-template.docx`
- `tasks/first-gen-program/.complexity-lock.json`
- `tasks/first-gen-program/.scope-lock.md`
- `tasks/first-gen-program/complexity-signals.json`
- `tasks/first-gen-program/final-phase.md`
- `tasks/first-gen-program/lifecycle-state.md`
- `tasks/first-gen-program/phase-1.md`
- `tasks/first-gen-program/phase-2.md`
- `tasks/first-gen-program/phase-3.md`
- `tasks/first-gen-program/phase-plan.md`
- `tasks/first-gen-program/revalidate-code-review.md`
- `tasks/first-gen-program/risk-acceptance.md`
- `tasks/first-gen-program/spec.md`

### Citation candidates (verify before use)
- `goals/first-gen-program/establish-goals.v0.md:1-82`
- `goals/first-gen-program/establish-goals.v1.md:1-82`
- `goals/first-gen-program/goals.v0.md:1-34`
- `goals/first-gen-program/goals.v1.md:1-34`
- `goals/task-manifest.csv:4-4`
- `src/lib/programExport.ts:1-44`
- `src/lib/server/programDocx.ts:1-200`
- `src/routes/admin/program/+page.svelte:147-152`
- `src/routes/admin/program/+page.svelte:163-168`
- `src/routes/admin/program/+page.svelte:3-3`
- `src/routes/admin/program/+page.svelte:30-30`
- `src/routes/admin/program/+page.svelte:37-37`
- `src/routes/admin/program/+page.svelte:41-52`
- `src/routes/admin/program/+page.svelte:9-9`
- `src/routes/api/program/+server.ts:10-10`
- `src/routes/api/program/+server.ts:13-13`
- `src/routes/api/program/+server.ts:176-179`
- `src/routes/api/program/+server.ts:2-2`
- `src/routes/api/program/+server.ts:22-26`
- `src/routes/api/program/+server.ts:32-37`
- `src/routes/api/program/+server.ts:47-92`
- `src/test/lib/programDocx.test.ts:1-96`
- `src/test/lib/programExport.test.ts:1-23`
- `tasks/first-gen-program/.complexity-lock.json:1-23`
- `tasks/first-gen-program/.scope-lock.md:1-14`
- `tasks/first-gen-program/complexity-signals.json:1-25`
- `tasks/first-gen-program/final-phase.md:1-59`
- `tasks/first-gen-program/lifecycle-state.md:1-4`
- `tasks/first-gen-program/phase-1.md:1-56`
- `tasks/first-gen-program/phase-2.md:1-51`
- `tasks/first-gen-program/phase-3.md:1-25`
- `tasks/first-gen-program/phase-plan.md:1-26`
- `tasks/first-gen-program/revalidate-code-review.md:1-106`
- `tasks/first-gen-program/risk-acceptance.md:1-11`
- `tasks/first-gen-program/spec.md:1-230`
<!-- REVIEW-CONTEXT END -->

## Findings JSON
```json
[]
```

## Overall Correctness Verdict
- Verdict: patch is correct
- Confidence: 0.86
- Justification: Reviewed the current working-tree diff for the CSV button change, selected-concert DOCX export path, DOCX template rendering, and the added focused tests. The remaining patch matches the locked goals, the performer-name and age runs now align with the template structure, and the latest `npm run lint`, `npm run build`, and `npm run test` all pass.
