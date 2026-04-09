# Revalidate Code Review
- Task name: fix-forcemove-concert-list
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
- Generated at: 2026-04-09T21:27:35Z
- Base branch: clear_schedule_page
- Diff mode: fallback
- Diff command: `git diff`
- Diff bytes: 18996

### Changed files
- `.codex/codex-config.yaml`
- `goals/task-manifest.csv`
- `src/lib/server/db.ts`
- `src/test/api/program-api.test.ts`
- `src/test/db/import.concerto.test.ts`
- `src/test/db/lookupByCode-multi-class.test.ts`
- `src/test/db/program.test.ts`

### Citation candidates (verify before use)
- `.codex/codex-config.yaml:17-17`
- `.codex/codex-config.yaml:20-21`
- `goals/task-manifest.csv:7-7`
- `src/lib/server/db.ts:1839-1931`
- `src/test/api/program-api.test.ts:1-6`
- `src/test/api/program-api.test.ts:11-77`
- `src/test/api/program-api.test.ts:79-150`
- `src/test/api/program-api.test.ts:8-9`
- `src/test/db/import.concerto.test.ts:44-51`
- `src/test/db/import.concerto.test.ts:5-38`
- `src/test/db/lookupByCode-multi-class.test.ts:166-166`
- `src/test/db/lookupByCode-multi-class.test.ts:168-168`
- `src/test/db/lookupByCode-multi-class.test.ts:171-171`
- `src/test/db/lookupByCode-multi-class.test.ts:176-176`
- `src/test/db/lookupByCode-multi-class.test.ts:194-194`
- `src/test/db/lookupByCode-multi-class.test.ts:291-291`
- `src/test/db/lookupByCode-multi-class.test.ts:293-293`
- `src/test/db/lookupByCode-multi-class.test.ts:296-296`
- `src/test/db/lookupByCode-multi-class.test.ts:302-302`
- `src/test/db/lookupByCode-multi-class.test.ts:320-320`
- `src/test/db/program.test.ts:108-124`
- `src/test/db/program.test.ts:4-4`
- `src/test/db/program.test.ts:407-457`
- `src/test/db/program.test.ts:63-63`
<!-- REVIEW-CONTEXT END -->

## Findings JSON
```json
[]
```

## Overall Correctness Verdict
- Verdict: patch is correct
- Confidence: 0.89
- Justification: The change adds the missing program move route, persists Eastside and waitlist moves through the existing program model, and passes targeted plus full repo verification without introducing review findings.
