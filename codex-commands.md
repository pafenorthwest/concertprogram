# Codex Commands Manifest

This file pins the canonical verification commands for this repository so they do not drift.

## Node / TypeScript (npm or bun)

- Package manager:
  - Preferred: npm
  - Lockfile: package-lock.json

- Lint:
  - Command: npm run lint

- Format:
  - Command: npm run format

- Build:
  - Command: npm run build

- Test:
  - Command: npm run test

- Dev Server:
  - Command: npm run dev

## Notes

- Update this manifest only when the repository’s canonical commands change.
- Tasks must also copy the chosen commands into `/tasks/<task-name>/spec.md` under “Verification Commands”.
