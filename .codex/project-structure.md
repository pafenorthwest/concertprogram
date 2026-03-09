# Concertprogram Project Structure

## Metadata
- Name: `concertprogram`
- Type: `SvelteKit full-stack web app`
- Language/Runtime: `TypeScript`, `Node.js`, `SvelteKit`, `PostgreSQL`
- Package Manager: `npm`

## Layout
```text
/
├── .codex/                    # Repo-local Codex artifacts
├── .github/                   # GitHub configuration
├── .svelte-kit/               # Generated SvelteKit build artifacts
├── .vercel/                   # Vercel project metadata
├── .vscode/                   # Editor settings
├── database/
│   ├── clear.sql              # Local data reset script
│   ├── drop_legacy.sql        # Legacy schema cleanup
│   ├── init.sql               # Baseline schema for fresh databases
│   ├── migrations/            # Forward-only schema changes
│   └── prod_trigger_overlay.sql
├── docs/                      # Project documentation and API specs
├── node_modules/              # Installed dependencies
├── scripts/                   # Repo utility scripts
├── src/
│   ├── app.d.ts               # App-level type declarations
│   ├── app.html               # HTML shell template
│   ├── hooks.server.ts        # Global server hooks
│   ├── lib/
│   │   ├── authz.ts
│   │   ├── cache.ts
│   │   ├── clientUtils.ts     # Browser-safe helpers
│   │   ├── navigation.ts
│   │   ├── constants/         # Shared constant sets
│   │   ├── server/            # Server-only business logic and data access
│   │   │   ├── apiAuth.ts
│   │   │   ├── common.ts
│   │   │   ├── db.ts          # PostgreSQL queries and persistence helpers
│   │   │   ├── featureFlags.ts
│   │   │   ├── import.ts
│   │   │   ├── login.ts
│   │   │   ├── lottery.ts
│   │   │   ├── performer.ts
│   │   │   ├── performerLookup.ts
│   │   │   ├── program.ts
│   │   │   ├── review.ts
│   │   │   ├── scheduleMapper.ts
│   │   │   ├── scheduleRepository.ts
│   │   │   ├── scheduleValidator.ts
│   │   │   ├── session.ts
│   │   │   └── slotCatalog.ts
│   │   └── types/
│   │       └── schedule.ts    # Shared schedule view-model types
│   ├── routes/
│   │   ├── +layout.server.ts
│   │   ├── +layout.svelte
│   │   ├── +page.server.ts
│   │   ├── +page.svelte
│   │   ├── +error.svelte
│   │   ├── about/
│   │   ├── landing/
│   │   ├── login/
│   │   ├── logout/
│   │   ├── schedule/          # Performer scheduling flow
│   │   ├── verify/
│   │   ├── admin/             # Staff/admin UI areas
│   │   │   ├── accompanist/
│   │   │   ├── class/
│   │   │   ├── composer/
│   │   │   ├── list/
│   │   │   ├── lottery/
│   │   │   ├── musicalpiece/
│   │   │   ├── performer/
│   │   │   ├── program/
│   │   │   ├── review/
│   │   │   └── users/
│   │   └── api/               # HTTP endpoints
│   │       ├── accompanist/
│   │       ├── contributor/
│   │       ├── import/
│   │       ├── lottery/
│   │       ├── musicalpiece/
│   │       ├── performer/
│   │       ├── performance/
│   │       │   └── pieces/
│   │       ├── program/
│   │       ├── review/
│   │       └── searchPerformer/
│   └── test/
│       ├── api/               # Endpoint and route-level tests
│       ├── db/                # Database and persistence tests
│       ├── lib/               # Unit tests for shared logic
│       └── setup.ts           # Vitest global setup
├── static/                    # Static assets served directly
├── tasks/                     # Task notes and implementation artifacts
├── test-data/                 # Seed/sample data for tests and imports
├── AGENTS.md
├── README.md
├── codex-commands.md
├── eslint.config.js
├── package.json
├── package-lock.json
├── svelte.config.js
├── tsconfig.json
└── vite.config.ts
```

## Actions
- Add new user-facing pages under `src/routes/<segment>/` using SvelteKit conventions such as `+page.svelte` and `+page.server.ts`.
- Add new API endpoints under `src/routes/api/<resource>/+server.ts`. Nested resource actions belong under nested route folders, for example `src/routes/api/performance/pieces/select/+server.ts`.
- Put server-only domain logic, database access, auth, import flows, and scheduling services under `src/lib/server/`.
- Put browser-safe shared helpers under `src/lib/` and shared type definitions under `src/lib/types/`.
- Add database schema baseline changes to `database/init.sql` when the shape of a fresh database changes.
- Add forward-only schema changes to `database/migrations/` for existing databases. Name migration files with a sortable date prefix.
- Keep one-off SQL utilities and cleanup scripts in `database/`, not in `src/`.
- Add admin UI pages under `src/routes/admin/<area>/`.
- Add tests under `src/test/` in the closest matching area:
  - API and route tests in `src/test/api/`
  - DB and persistence tests in `src/test/db/`
  - Pure logic and mapper/validator tests in `src/test/lib/`
- Put static files such as images or downloadable assets in `static/`.
- Put external docs and API specifications in `docs/`.
- Keep top-level config changes in the repository root next to `package.json`, `vite.config.ts`, `svelte.config.js`, and `tsconfig.json`.

## Verification
- Lint: `npm run lint`
- Build: `npm run build`
- Test: `npm run test`

## Constraints
- Follow SvelteKit file-based routing and naming conventions.
- Keep server-only code out of client-facing modules; server logic belongs in `src/lib/server/` or server route files.
- Route handlers must live under `src/routes/` and API handlers must live under `src/routes/api/`.
- Database changes should update both the baseline schema in `database/init.sql` and a forward migration in `database/migrations/` when applicable.
- New tests should be added in the matching `src/test/` area for the layer being changed.
- Prefer extending existing domain modules over introducing duplicate service layers in new locations.

## Success Criteria
- The document reflects the current repository layout at a useful contributor level.
- Contributors can tell where to place pages, APIs, server logic, database changes, tests, static assets, and docs.
- Verification commands are pinned to the repo’s standard `npm` scripts.

## Non-Goals
- Exhaustively documenting every file in the repository.
- Defining Codex workflow, task lifecycle, or planning process.
- Changing build, test, routing, or database behavior.
