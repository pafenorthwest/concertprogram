# Phase 2 — Persist Program Placement

## Objective

Store the selected destination so the program rebuild reflects a move to a specific Eastside concert or the waitlist after reload.

## Code areas impacted
- `src/lib/server/db.ts`
- Program route/helper code added in Phase 1

## Work items
- [x] Identify the minimal persistence update needed for an Eastside concert-number move.
- [x] Identify the minimal persistence update needed for a waitlist move.
- [x] Ensure the persistence path does not change unrelated program export or scheduling behavior.

## Deliverables
- Persistence logic that updates Eastside and waitlist placement in a way the program build can read back.

## Gate (must pass before proceeding)
Program data rebuilds reflect the requested destination after a force-move operation.
- [x] Eastside destination persistence implemented.
- [x] Waitlist persistence implemented.

## Verification steps
- [x] Command: `npm run test -- src/test/db/program.test.ts`
  - Expected: moved entries appear in the requested Eastside concert or the waitlist

## Risks and mitigations
- Risk: touching the wrong persistence fields could break normal program construction.
- Mitigation: use the existing program data model and keep the write set minimal and reversible.
