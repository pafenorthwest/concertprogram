# Revalidate Code Review
- Task name: radio-select-piece
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
- Generated at: 2026-03-08T20:58:39Z
- Base branch: schedule_refactor
- Diff mode: fallback
- Diff command: `git diff`
- Diff bytes: 18382

### Changed files
- `src/lib/server/db.ts`
- `src/routes/api/performance/pieces/clear/+server.ts`
- `src/routes/api/performance/pieces/select/+server.ts`
- `src/routes/schedule/+page.server.ts`
- `src/routes/schedule/+page.svelte`
- `src/test/api/schedule-page.test.ts`
- `src/test/db/lookupByCode-multi-class.test.ts`

### Citation candidates (verify before use)
- `src/lib/server/db.ts:1064-1065`
- `src/routes/api/performance/pieces/clear/+server.ts:3-3`
- `src/routes/api/performance/pieces/clear/+server.ts:33-33`
- `src/routes/api/performance/pieces/select/+server.ts:3-3`
- `src/routes/api/performance/pieces/select/+server.ts:33-33`
- `src/routes/schedule/+page.server.ts:133-133`
- `src/routes/schedule/+page.server.ts:135-135`
- `src/routes/schedule/+page.server.ts:16-16`
- `src/routes/schedule/+page.server.ts:161-161`
- `src/routes/schedule/+page.server.ts:162-162`
- `src/routes/schedule/+page.server.ts:195-201`
- `src/routes/schedule/+page.server.ts:56-56`
- `src/routes/schedule/+page.server.ts:64-64`
- `src/routes/schedule/+page.svelte:302-302`
- `src/routes/schedule/+page.svelte:340-340`
- `src/routes/schedule/+page.svelte:376-378`
- `src/routes/schedule/+page.svelte:44-45`
- `src/routes/schedule/+page.svelte:455-455`
- `src/routes/schedule/+page.svelte:491-493`
- `src/routes/schedule/+page.svelte:655-655`
- `src/routes/schedule/+page.svelte:90-90`
- `src/routes/schedule/+page.svelte:96-104`
- `src/test/api/schedule-page.test.ts:141-141`
- `src/test/api/schedule-page.test.ts:149-149`
- `src/test/api/schedule-page.test.ts:152-177`
- `src/test/api/schedule-page.test.ts:259-259`
- `src/test/db/lookupByCode-multi-class.test.ts:18-18`
- `src/test/db/lookupByCode-multi-class.test.ts:676-779`
- `src/test/db/lookupByCode-multi-class.test.ts:74-91`
<!-- REVIEW-CONTEXT END -->

## Findings JSON
```json
[]
```

## Overall Correctness Verdict
- Verdict: patch is correct
- Confidence: 0.91
- Justification: The schedule flow now consistently requires a selected performance piece whenever the merged same-series context exposes multiple candidates, the server-side submit path enforces the same rule, and the integer casts in `getPerformancePieceSelectionSummary` align runtime types with the new guard so the check actually triggers. The updated DB and page tests cover both the required-selection path and successful submission after selection.
