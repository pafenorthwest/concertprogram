# Revalidate Code Review
- Task name: stabilize-schedule-page-tests
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
- Generated at: 2026-04-12T15:34:29Z
- Base branch: main
- Diff mode: fallback
- Diff command: `git diff`
- Diff bytes: 9816

### Changed files
- `.codex/codex-config.yaml`
- `goals/task-manifest.csv`
- `src/lib/server/programDocx.ts`
- `src/test/api/schedule-page.test.ts`
- `src/test/db/program.test.ts`
- `src/test/lib/programDocx.test.ts`

### Citation candidates (verify before use)
- `.codex/codex-config.yaml:20-21`
- `goals/task-manifest.csv:9-12`
- `src/lib/server/programDocx.ts:168-168`
- `src/lib/server/programDocx.ts:173-173`
- `src/test/api/schedule-page.test.ts:11-11`
- `src/test/api/schedule-page.test.ts:180-180`
- `src/test/api/schedule-page.test.ts:193-193`
- `src/test/api/schedule-page.test.ts:3-3`
- `src/test/api/schedule-page.test.ts:39-40`
- `src/test/api/schedule-page.test.ts:52-53`
- `src/test/api/schedule-page.test.ts:74-75`
- `src/test/db/program.test.ts:257-257`
- `src/test/db/program.test.ts:264-283`
- `src/test/db/program.test.ts:289-289`
- `src/test/db/program.test.ts:294-302`
- `src/test/db/program.test.ts:304-304`
- `src/test/db/program.test.ts:306-314`
- `src/test/lib/programDocx.test.ts:27-27`
- `src/test/lib/programDocx.test.ts:29-29`
<!-- REVIEW-CONTEXT END -->

## Findings JSON
```json
[]
```

## Overall Correctness Verdict
- Verdict: patch is correct
- Confidence: 0.93
- Justification: The scoped change is limited to the schedule-page test file. Refreshing cached concert-time data after seeding and cleanup removes order-dependent state, and the longer action waits match the existing `?/add` navigation path without changing product behavior. The targeted file test and full repo lint/build/test verification all passed after the update.
