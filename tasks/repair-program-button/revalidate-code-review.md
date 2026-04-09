# Revalidate Code Review
- Task name: repair-program-button
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
- Generated at: 2026-04-09T22:34:37Z
- Base branch: clear_schedule_page
- Diff mode: fallback
- Diff command: `git diff`
- Diff bytes: 7518

### Changed files
- `.codex/codex-config.yaml`
- `goals/task-manifest.csv`
- `src/lib/server/programDocx.ts`
- `src/test/api/program-api.test.ts`
- `src/test/lib/programDocx.test.ts`

### Citation candidates (verify before use)
- `.codex/codex-config.yaml:18-18`
- `goals/task-manifest.csv:7-8`
- `src/lib/server/programDocx.ts:1-2`
- `src/lib/server/programDocx.ts:107-107`
- `src/lib/server/programDocx.ts:109-116`
- `src/lib/server/programDocx.ts:118-118`
- `src/lib/server/programDocx.ts:4-4`
- `src/test/api/program-api.test.ts:2-2`
- `src/test/api/program-api.test.ts:5-5`
- `src/test/api/program-api.test.ts:9-9`
- `src/test/api/program-api.test.ts:92-131`
- `src/test/lib/programDocx.test.ts:0-0`
- `src/test/lib/programDocx.test.ts:4-4`
- `src/test/lib/programDocx.test.ts:78-81`
<!-- REVIEW-CONTEXT END -->

## Findings JSON
```json
[]
```

## Overall Correctness Verdict
- Verdict: patch is correct
- Confidence: 0.93
- Justification: The repair removes the external `zip`/`unzip` runtime dependency
  from DOCX generation, keeps the export surface scoped to the original
  feature, and adds route-level coverage for the selected-concert DOCX path.
