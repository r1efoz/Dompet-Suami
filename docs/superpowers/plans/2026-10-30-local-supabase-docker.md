# Local Supabase + Docker Development Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run Dompet Suami locally against isolated PostgreSQL in Docker through local Supabase, with no hosted database access during local development.

**Architecture:** Keep current `@supabase/supabase-js` browser data path. Add Supabase CLI configuration, migration and deterministic seed. Replace direct Vite dev command with a small Node launcher that starts/reuses pinned Supabase CLI, verifies local API host, then starts Vite with local URL and anon key overriding inherited values.

**Tech Stack:** Node.js built-ins, npm scripts, Vite, Supabase CLI `2.121.0`, Docker, PostgreSQL 17, existing `@supabase/supabase-js`.

**Spec:** `docs/superpowers/specs/2026-10-30-local-supabase-docker-design.md`

## Global Constraints

- Local app runtime must use only `localhost` or `127.0.0.1` Supabase API URL.
- Never fall back to hosted credentials for local development.
- Preserve current hosted Vercel environment behavior and database schema/API contract.
- Do not import hosted records or mutate hosted database.
- Keep CLI pinned to `2.121.0`; do not add runtime dependencies.
- Database reset must validate local target before destructive action.

---

### Task 1: Establish Supabase CLI project configuration and migration

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20261030000000_initial_schema.sql`
- Modify: `supabase/schema.sql` only if needed to avoid drift; retain as documented SQL path or make it clearly reference migration.

**Interfaces:**
- Produces local project `dompet-suami` using Supabase CLI and PostgreSQL major version 17.
- Migration creates `accounts`, `categories`, `transactions`, current constraints/indexes, category_id compatibility, and the current public RLS policies.

- [ ] **Step 1: Write schema parity check**

Create a Node built-in test `scripts/local-dev.check.mjs` that reads `supabase/schema.sql` and the migration and asserts required table/column/constraint/index/policy definitions exist in both. Use `node:assert/strict` and `node:fs`; keep this test-only step focused on the schema contract.

- [ ] **Step 2: Run check and confirm RED**

Run: `node scripts/local-dev.check.mjs`
Expected: FAIL because config/migration have not been created.

- [ ] **Step 3: Add local Supabase config and migration**

Create `supabase/config.toml` with project id `dompet-suami`, API port `54321`, DB port `54322`, and `db.major_version = 17`, with migrations enabled and seed path `./seed.sql`.

Create the migration by transferring the schema in `supabase/schema.sql` into migration form. Keep table definitions, `category_id` upgrade, indexes, RLS enablement, and all twelve existing policies. Make it safe on a fresh database; avoid duplicate indexes/policies on repeated migration runs (migrations themselves run once; use `if not exists` where schema.sql already supports existing databases).

- [ ] **Step 4: Run schema parity check**

Run: `node scripts/local-dev.check.mjs`
Expected: PASS and confirms all current application tables, types/checks, indexes, and policies are in migration.

- [ ] **Step 5: Verify diff**

Run: `git diff --check`
Expected: no whitespace errors.

### Task 2: Add deterministic local seed data

**Files:**
- Create: `supabase/seed.sql`
- Modify: `scripts/local-dev.check.mjs`

**Interfaces:**
- Seed contains only the default accounts and categories corresponding to `DEFAULT_ACCOUNTS` and `DEFAULT_CATEGORIES` in `src/lib/store.ts`.
- Seed is repeatable using `insert ... on conflict (id) do nothing`.
- No transaction records or hosted data.

- [ ] **Step 1: Extend check for seed contract**

Add assertions that seed inserts all default ids (`bank`, `cash`, `ewallet`; `salary`, `freelance`, `food`, `transport`, `utilities`, `entertainment`), inserts no transactions, and is conflict-safe.

- [ ] **Step 2: Run check and confirm RED**

Run: `node scripts/local-dev.check.mjs`
Expected: FAIL because seed is absent.

- [ ] **Step 3: Add repeatable seed**

Create `supabase/seed.sql` inserting default accounts/categories with matching name and type values from `src/lib/store.ts`; end each insert with `on conflict (id) do nothing`.

- [ ] **Step 4: Run check**

Run: `node scripts/local-dev.check.mjs`
Expected: PASS.

### Task 3: Implement isolated local development launcher

**Files:**
- Create: `scripts/dev.mjs`
- Create or modify: `scripts/local-dev.check.mjs`
- Modify: `package.json`

**Interfaces:**
- `npm run dev`: invoke `node scripts/dev.mjs`.
- `npm run db:start`: invoke `npx --yes supabase@2.121.0 start`.
- `npm run db:stop`: invoke `npx --yes supabase@2.121.0 stop`.
- `npm run db:reset`: invoke launcher safety check then `npx --yes supabase@2.121.0 db reset`.
- Launcher exports small pure functions for parsing `supabase status -o env` and validating a local API URL, guarded so importing in tests does not launch processes.

- [ ] **Step 1: Add failing launcher checks**

Extend `scripts/local-dev.check.mjs` to import launcher pure functions and assert:

```js
assert.equal(parseStatusEnv('API_URL="http://127.0.0.1:54321"\nANON_KEY="local"').API_URL, 'http://127.0.0.1:54321');
assert.equal(isLocalApiUrl('http://127.0.0.1:54321'), true);
assert.equal(isLocalApiUrl('http://localhost:54321'), true);
assert.equal(isLocalApiUrl('https://example.supabase.co'), false);
```

Also assert local env construction overwrites inherited `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with local values.

- [ ] **Step 2: Run check and confirm RED**

Run: `node scripts/local-dev.check.mjs`
Expected: FAIL because launcher module/functions do not exist.

- [ ] **Step 3: Implement launcher with Node built-ins**

Use `node:child_process` and `node:url` only. Launcher behavior:

1. Run `npx --yes supabase@2.121.0 status -o env`.
2. If local `API_URL`/`ANON_KEY` absent, run `npx --yes supabase@2.121.0 start`, then read status again.
3. Fail with a clear Docker/Supabase message if stack unavailable.
4. Reject any API URL whose hostname is not exactly `localhost` or `127.0.0.1`; never print secrets.
5. Spawn Vite CLI from local `node_modules` using current Node executable and inherited environment overridden with local Vite URL/key.
6. Forward SIGINT/SIGTERM to Vite and exit with its status.
7. For `db:reset`, check status and validate host before spawning `supabase db reset`; do not start or reset an unspecified hosted project.

Expose only testable pure helpers; do not build a generic process framework.

- [ ] **Step 4: Wire npm scripts**

Set scripts to:

```json
"dev": "node scripts/dev.mjs",
"db:start": "npx --yes supabase@2.121.0 start",
"db:stop": "npx --yes supabase@2.121.0 stop",
"db:reset": "node scripts/dev.mjs --reset",
"check:local": "node scripts/local-dev.check.mjs"
```

- [ ] **Step 5: Run local launcher checks**

Run: `npm run check:local`
Expected: PASS, including hostile hosted environment override and URL rejection cases.

### Task 4: Document local setup and safety behavior

**Files:**
- Modify: `README.md`
- Modify: `scripts/local-dev.check.mjs` only if documenting command names should be guarded by assertions.

**Interfaces:**
- Developer docs describe Docker prerequisite, supported Node version if known from current package constraints, local ports/API, commands, seed contents, and reset behavior.

- [ ] **Step 1: Write documentation assertions**

Add check assertions for documented `npm run dev`, `npm run db:start`, `npm run db:stop`, and `npm run db:reset` commands, plus explicit note that local data is not copied from hosted Supabase.

- [ ] **Step 2: Run check and confirm RED**

Run: `npm run check:local`
Expected: FAIL because README has not documented local Docker workflow.

- [ ] **Step 3: Add Local development README section**

Document: install Docker Desktop and dependencies; `npm run dev` starts/reuses local stack plus Vite; `npm run db:reset` destroys only local DB and reapplies migration/seed; `npm run db:stop` stops local services; default ports `54321` API and `54322` Postgres; only defaults are seeded; no hosted data used. Explain `.env` hosted values are overridden by local launcher.

- [ ] **Step 4: Run documentation check**

Run: `npm run check:local`
Expected: PASS.

### Task 5: End-to-end local verification

**Files:**
- Modify: `scripts/e2e.mjs` if required to add a stable local category-edit/persistence acceptance check; preserve existing checks.

**Interfaces:**
- Local test environment uses a dedicated local Supabase stack and never points to hosted URL.

- [ ] **Step 1: Run static/unit checks**

Run: `npm run check:local && npm run check && npm run build && git diff --check`
Expected: all commands exit 0.

- [ ] **Step 2: Start local Docker-backed stack and apply migration/seed**

Run: `npm run db:start && npm run db:reset`
Expected: Supabase local services healthy; reset applies migration/seed without hosted account interaction.

- [ ] **Step 3: Inspect local DB state**

Run: `npx --yes supabase@2.121.0 status -o env` and inspect only API URL/DB URL host, then query local DB with Supabase CLI or `docker exec` to confirm three accounts and six categories, zero transactions.
Expected: API host is local; seeded counts match.

- [ ] **Step 4: Smoke-test app persistence**

Run: `npm run dev` in a terminal, use Playwright at Vite URL to edit one seeded category, create one transaction if valid test data permits, reload, and confirm edits/data persist. Inspect browser network to ensure API requests target `127.0.0.1`/`localhost`, not `*.supabase.co`.
Expected: local API requests succeed and changes persist after reload.

- [ ] **Step 5: Verify restart persistence and reset isolation**

Stop and restart local Supabase, confirm edited data persists; run `npm run db:reset`, confirm only default account/category rows remain and transaction table is empty.
Expected: Docker volume persists across stop/start; reset is local-only and restores defaults.

- [ ] **Step 6: Run final project checks**

Run: `npm run check:local && npm run check && npm run build && git diff --check`
Expected: all pass. Report Docker-dependent checks separately if Docker is unavailable.

---

## Plan Self-Review

- Spec coverage: local stack, local-only credential validation, schema, seed, lifecycle commands, docs, no hosted reads/writes, persistence/reset smoke checks all have task coverage.
- No placeholders: each task defines files, interfaces, commands, and expected outcomes. Docker-dependent operations have explicit acceptance evidence.
- Type/interface consistency: launcher exports `parseStatusEnv`, `isLocalApiUrl`, and local env constructor; test imports same module; all npm scripts point to named files.
