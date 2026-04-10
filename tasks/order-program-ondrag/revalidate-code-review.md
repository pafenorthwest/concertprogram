# Revalidate Code Review
- Task name: order-program-ondrag
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
- Generated at: 2026-04-10T03:11:03Z
- Base branch: main
- Diff mode: fallback
- Diff command: `git diff`
- Diff bytes: 13409

### Changed files
- `.codex/codex-config.yaml`
- `goals/task-manifest.csv`
- `src/lib/server/db.ts`
- `src/routes/api/program/+server.ts`
- `src/test/api/program-api.test.ts`

### Citation candidates (verify before use)
- `.codex/codex-config.yaml:18-18`
- `.codex/codex-config.yaml:21-22`
- `goals/task-manifest.csv:7-9`
- `src/lib/server/db.ts:1790-1794`
- `src/lib/server/db.ts:1796-1799`
- `src/lib/server/db.ts:1801-1814`
- `src/lib/server/db.ts:1816-1817`
- `src/lib/server/db.ts:1819-1819`
- `src/lib/server/db.ts:1822-1823`
- `src/lib/server/db.ts:1827-1830`
- `src/routes/api/program/+server.ts:12-12`
- `src/routes/api/program/+server.ts:3-3`
- `src/routes/api/program/+server.ts:49-128`
- `src/test/api/program-api.test.ts:141-141`
- `src/test/api/program-api.test.ts:165-165`
- `src/test/api/program-api.test.ts:2-5`
- `src/test/api/program-api.test.ts:209-291`
- `src/test/api/program-api.test.ts:72-114`
<!-- REVIEW-CONTEXT END -->

## Findings JSON
```json
[]
```

## Overall Correctness Verdict
- Verdict: patch is correct
- Confidence: 0.93
- Justification: The missing collection `POST /api/program` path is now implemented with explicit payload validation and transactional parameterized persistence, and the added regression test demonstrates the intended reorder-save behavior without regressing the existing program API flows.
