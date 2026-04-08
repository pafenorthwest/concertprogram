# Revalidate Code Review
- Task name: apostrophy-bug-comments
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
- Generated at: 2026-04-08T05:03:57Z
- Base branch: clear_schedule_page
- Diff mode: base-branch
- Diff command: `git diff clear_schedule_page...HEAD`
- Diff bytes: 200827

### Changed files
- `.codex/codex-config.yaml`
- `.codex/prompts/self-improve-skills-triage.md`
- `.codex/prompts/self-improve-skills.md`
- `.codex/rules/default.rules`
- `.codex/rules/git-safe.rules`
- `.codex/scripts/gh-auth-check.sh`
- `.codex/scripts/gh-wrap.sh`
- `.codex/scripts/goals-extract.sh`
- `.codex/scripts/goals-validate.sh`
- `.codex/scripts/resolve-codex-root.sh`
- `database/init.sql`
- `goals/apostrophy-bug-comments/establish-goals.v0.md`
- `goals/apostrophy-bug-comments/goals.v0.md`
- `goals/clear-instructions-schedule/goals.v0.md`
- `goals/first-gen-program/goals.v1.md`
- `goals/task-manifest.csv`
- `goals/upsert-on-import/establish-goals.v0.md`
- `goals/upsert-on-import/goals.v0.md`
- `src/lib/programExport.ts`
- `src/lib/server/db.ts`
- `src/lib/server/programDocx.ts`
- `src/routes/admin/program/+page.svelte`
- `src/routes/api/program/+server.ts`
- `src/routes/schedule/+page.svelte`
- `src/test/api/schedule-page.test.ts`
- `src/test/db/import.test.ts`
- `src/test/db/lookupByCode-multi-class.test.ts`
- `src/test/lib/programDocx.test.ts`
- `src/test/lib/programExport.test.ts`
- `static/templates/pafe-eastside-concerts-template.docx`
- `tasks/apostrophy-bug-comments/.complexity-lock.json`
- `tasks/apostrophy-bug-comments/.scope-lock.md`
- `tasks/apostrophy-bug-comments/complexity-signals.json`
- `tasks/apostrophy-bug-comments/final-phase.md`
- `tasks/apostrophy-bug-comments/lifecycle-state.md`
- `tasks/apostrophy-bug-comments/phase-1.md`
- `tasks/apostrophy-bug-comments/phase-2.md`
- `tasks/apostrophy-bug-comments/phase-3.md`
- `tasks/apostrophy-bug-comments/phase-plan.md`
- `tasks/apostrophy-bug-comments/risk-acceptance.md`
- `tasks/apostrophy-bug-comments/spec.md`
- `tasks/clear-instructions-schedule/audit-log.md`
- `tasks/clear-instructions-schedule/retention.min.json`
- `tasks/clear-instructions-schedule/spec.md`
- `tasks/first-gen-program/audit-log.md`
- `tasks/first-gen-program/goal-versions.diff`
- `tasks/first-gen-program/retention.min.json`
- `tasks/first-gen-program/risk-acceptance.md`
- `tasks/first-gen-program/spec.md`
- `tasks/upsert-on-import/.complexity-lock.json`
- `tasks/upsert-on-import/.scope-lock.md`
- `tasks/upsert-on-import/complexity-signals.json`
- `tasks/upsert-on-import/final-phase.md`
- `tasks/upsert-on-import/lifecycle-state.md`
- `tasks/upsert-on-import/phase-1.md`
- `tasks/upsert-on-import/phase-2.md`
- `tasks/upsert-on-import/phase-3.md`
- `tasks/upsert-on-import/phase-plan.md`
- `tasks/upsert-on-import/risk-acceptance.md`
- `tasks/upsert-on-import/spec.md`

### Citation candidates (verify before use)
- `.codex/codex-config.yaml:12-14`
- `.codex/codex-config.yaml:19-20`
- `.codex/codex-config.yaml:4-8`
- `.codex/prompts/self-improve-skills-triage.md:1-101`
- `.codex/prompts/self-improve-skills.md:1-137`
- `.codex/rules/default.rules:2-2`
- `.codex/rules/default.rules:4-5`
- `.codex/rules/git-safe.rules:121-121`
- `.codex/rules/git-safe.rules:123-123`
- `.codex/rules/git-safe.rules:125-270`
- `.codex/scripts/gh-auth-check.sh:1-216`
- `.codex/scripts/gh-wrap.sh:1-254`
- `.codex/scripts/goals-extract.sh:29-37`
- `.codex/scripts/goals-extract.sh:44-44`
- `.codex/scripts/goals-extract.sh:46-46`
- `.codex/scripts/goals-extract.sh:48-48`
- `.codex/scripts/goals-validate.sh:29-41`
- `.codex/scripts/resolve-codex-root.sh:16-16`
- `.codex/scripts/resolve-codex-root.sh:30-33`
- `.codex/scripts/resolve-codex-root.sh:37-39`
- `database/init.sql:312-316`
- `goals/apostrophy-bug-comments/establish-goals.v0.md:1-71`
- `goals/apostrophy-bug-comments/goals.v0.md:1-28`
- `goals/clear-instructions-schedule/goals.v0.md:1-29`
- `goals/first-gen-program/goals.v1.md:1-34`
- `goals/task-manifest.csv:3-6`
- `goals/upsert-on-import/establish-goals.v0.md:1-71`
- `goals/upsert-on-import/goals.v0.md:1-28`
- `src/lib/programExport.ts:1-44`
- `src/lib/server/db.ts:1682-1682`
- `src/lib/server/db.ts:1696-1696`
- `src/lib/server/db.ts:750-752`
- `src/lib/server/db.ts:754-757`
- `src/lib/server/db.ts:759-770`
- `src/lib/server/db.ts:771-771`
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
- `src/routes/schedule/+page.svelte:110-119`
- `src/routes/schedule/+page.svelte:267-274`
- `src/routes/schedule/+page.svelte:360-425`
- `src/routes/schedule/+page.svelte:428-429`
- `src/routes/schedule/+page.svelte:46-50`
- `src/routes/schedule/+page.svelte:462-462`
- `src/routes/schedule/+page.svelte:465-465`
- `src/routes/schedule/+page.svelte:472-475`
- `src/routes/schedule/+page.svelte:505-506`
- `src/routes/schedule/+page.svelte:519-523`
- `src/routes/schedule/+page.svelte:530-532`
- `src/routes/schedule/+page.svelte:541-606`
- `src/routes/schedule/+page.svelte:609-610`
- `src/routes/schedule/+page.svelte:643-643`
- `src/routes/schedule/+page.svelte:651-654`
- `src/routes/schedule/+page.svelte:656-657`
- `src/routes/schedule/+page.svelte:691-692`
- `src/routes/schedule/+page.svelte:705-709`
- `src/routes/schedule/+page.svelte:716-716`
- `src/routes/schedule/+page.svelte:810-810`
- `src/routes/schedule/+page.svelte:817-884`
- `src/routes/schedule/+page.svelte:905-910`
- `src/routes/schedule/+page.svelte:98-98`
- `src/test/api/schedule-page.test.ts:152-155`
- `src/test/api/schedule-page.test.ts:16-16`
- `src/test/api/schedule-page.test.ts:221-231`
- `src/test/api/schedule-page.test.ts:247-250`
- `src/test/api/schedule-page.test.ts:257-267`
- `src/test/api/schedule-page.test.ts:270-276`
- `src/test/api/schedule-page.test.ts:28-81`
- `src/test/api/schedule-page.test.ts:306-306`
- `src/test/api/schedule-page.test.ts:308-308`
- `src/test/api/schedule-page.test.ts:369-369`
- `src/test/api/schedule-page.test.ts:372-372`
- `src/test/api/schedule-page.test.ts:413-429`
- `src/test/api/schedule-page.test.ts:431-455`
- `src/test/api/schedule-page.test.ts:457-516`
- `src/test/api/schedule-page.test.ts:5-5`
- `src/test/api/schedule-page.test.ts:520-563`
- `src/test/api/schedule-page.test.ts:565-703`
- `src/test/api/schedule-page.test.ts:9-9`
- `src/test/db/import.test.ts:158-245`
- `src/test/db/import.test.ts:9-9`
- `src/test/db/lookupByCode-multi-class.test.ts:73-74`
- `src/test/db/lookupByCode-multi-class.test.ts:81-81`
- `src/test/db/lookupByCode-multi-class.test.ts:849-898`
- `src/test/lib/programDocx.test.ts:1-96`
- `src/test/lib/programExport.test.ts:1-23`
- `tasks/apostrophy-bug-comments/.complexity-lock.json:1-23`
- `tasks/apostrophy-bug-comments/.scope-lock.md:1-12`
- `tasks/apostrophy-bug-comments/complexity-signals.json:1-24`
- `tasks/apostrophy-bug-comments/final-phase.md:1-70`
- `tasks/apostrophy-bug-comments/lifecycle-state.md:1-4`
- `tasks/apostrophy-bug-comments/phase-1.md:1-43`
- `tasks/apostrophy-bug-comments/phase-2.md:1-45`
- `tasks/apostrophy-bug-comments/phase-3.md:1-47`
- `tasks/apostrophy-bug-comments/phase-plan.md:1-25`
- `tasks/apostrophy-bug-comments/risk-acceptance.md:1-11`
- `tasks/apostrophy-bug-comments/spec.md:1-188`
- `tasks/clear-instructions-schedule/audit-log.md:1-18`
- `tasks/clear-instructions-schedule/retention.min.json:1-1`
- `tasks/clear-instructions-schedule/spec.md:1-202`
- `tasks/first-gen-program/audit-log.md:1-18`
- `tasks/first-gen-program/goal-versions.diff:1-28`
- `tasks/first-gen-program/retention.min.json:1-1`
- `tasks/first-gen-program/risk-acceptance.md:1-11`
- `tasks/first-gen-program/spec.md:1-230`
- `tasks/upsert-on-import/.complexity-lock.json:1-23`
- `tasks/upsert-on-import/.scope-lock.md:1-13`
- `tasks/upsert-on-import/complexity-signals.json:1-24`
- `tasks/upsert-on-import/final-phase.md:1-65`
- `tasks/upsert-on-import/lifecycle-state.md:1-4`
- `tasks/upsert-on-import/phase-1.md:1-44`
- `tasks/upsert-on-import/phase-2.md:1-46`
- `tasks/upsert-on-import/phase-3.md:1-55`
- `tasks/upsert-on-import/phase-plan.md:1-22`
- `tasks/upsert-on-import/risk-acceptance.md:1-11`
- `tasks/upsert-on-import/spec.md:1-191`
<!-- REVIEW-CONTEXT END -->

## Findings JSON
```json
[]
```

## Overall Correctness Verdict
- Verdict: patch is correct
- Confidence: 0.89
- Justification: The schedule comment update now uses a parameterized query for the affected persistence path, the apostrophe regression case is covered in automated tests, and the pinned branch verification commands (`npm run lint`, `npm run build`, `npm run test`) all passed on 2026-04-08.
