# Goals Extract

- Task name: repair-program-button
- Iteration: v0
- State: locked

## Goals (1-20, verifiable)

1. Reconstruct the intended `Program` export behavior from the locked
   `first-gen-program` task artifacts and current code so the regression is
   diagnosed against the original contract.
2. Determine the concrete root cause that prevents the admin `Program` button
   flow from generating a `.docx` document and document that cause in the task
   artifacts.
3. Repair the export path so selecting a supported concert from the admin
   program page once again returns a downloadable `.docx` document.
4. Keep the fix scoped to the admin program export surface and only the minimum
   supporting server/helper/test files required by the repair.
5. Add or update automated coverage that would fail on the identified
   regression and pass once the repair is in place.

## Non-goals (explicit exclusions)

- Reworking unrelated admin program ordering, filtering, drag-and-drop, or
  force-move behavior.
- Expanding the Word export feature beyond the behavior already approved in
  `first-gen-program`.

## Success criteria (objective checks)

> Tie each criterion to a goal number when possible.

- [G1] The current implementation and `first-gen-program` artifacts are
  reviewed closely enough to state the intended export behavior and compare it
  to the broken path.
- [G2] A specific failing condition in the present codebase is identified and
  recorded as the reason the `Program` button no longer generates a document.
- [G3][G4] A supported admin program selection produces a successful `.docx`
  response again without broadening the affected file surface beyond what the
  repair requires.
- [G5] Automated coverage exercises the repaired path or its root-cause guard
  and passes under the repository verification commands.
