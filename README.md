# APIs

[APIs documented here](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/ericpassmore/concertprogram/refs/heads/main/docs/schedule-api.yaml) follow the link for the Redocly rendering of OpenAPI docs.

## Schedule Flow (Refactor)

### Schema
- `database/init.sql` now includes the merged schedule migrations.
- New row-per-slot table: `schedule_slot_choice` stores `(performer_id, concert_series, year, slot_id, rank, not_available, created_at, updated_at)`.
- Legacy schedule table `performer_ranked_choice` has been removed from `database/init.sql`.
- Use `database/drop_legacy.sql` to drop legacy schedule objects in existing databases.

### Validation rules
- Confirm-only mode (single slot): submission must include either a confirmation check or a not-available check.
- Rank-choice mode (2–10 slots):
  - Ranks are optional, but if any are present there must be at least one rank `1`.
  - Ranks must be integers in `1..slotCount` and must be unique.
  - `not_available` slots cannot include a rank.

### Form field semantics
- Rank choice fields: `slot-<slotId>-rank`
- Not available checkbox: `slot-<slotId>-not-available`
- Confirm checkbox (single-slot mode): `slot-<slotId>-confirm`

# Download

- Clone repository from git `git clone https://github.com/ericpassmore/concertprogram`
- Update `.env` file
  - `.env.example` to create `.env` file
  - change `admin` and `password`, these are your admin website credentials

# Postgresql setup

## Install Postgresql

- Download following instructions on https://www.postgresql.org/download/
- Make new directory for logs
- Update path to postgresql
- Start following instructions on https://www.postgresql.org/docs/current/server-start.html

### For example on macos run

- `brew install postgresql@15`
- `mkdir -p ~/log/postgresql/`
- `export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"`
- `nohup postgres -D /opt/homebrew/var/postgresql@15 >~/log/postgresql/concert.log 2>&1 &`

## Create Database

- login `psql postgres`
- run [database/init.sql](database/init.sql) found in this repo
  - remember to change the password
  - you may not need to specify the `template` when creating the db
- logout & log back in with your username and password `psql -U concertchair -d pafe -P`
- check the tables are there run `\dt` on the command line

## Update ENV

- If `.env` does not exist, copy the `.env.example` to create `.env` file
- In `.env` update the database connection information, default port is `5432`

# Application Setup

- Must have node and npm installed
  - Follow instructions for nodejs install `https://nodejs.org/en/download/package-manager`
- Install packages `npm install`
- Run Build `npm run build`
- To view website `npm run preview`

## Upload to Vercel

Uploads are done via `vercel` command line.
After completing these steps, the CLI will show the URL for the production instance.

- Download and Install `npm i -g vercel@latest`
- Run `vercel` and follow prompts to link and deploy
