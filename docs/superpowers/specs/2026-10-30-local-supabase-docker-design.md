# Local Supabase + Docker Development Design

## Goal

Run Dompet Suami locally against an isolated PostgreSQL database in Docker, using the same local Supabase development model as Coa Converter, without contacting the hosted Supabase project during local development.

## Current state

- The browser app uses `@supabase/supabase-js` in `src/lib/supabase.ts`.
- `src/lib/store.ts` sends all account, category, and transaction CRUD through Supabase REST.
- `supabase/schema.sql` defines the three application tables and public RLS policies, but project has no Supabase CLI config, migrations, local stack scripts, or seed.
- Coa Converter starts a local Supabase stack with pinned Supabase CLI (`2.121.0`) and Docker, reads local API values from `supabase status -o env`, and builds/runs against that URL and anon key.

## Decision

Use Supabase CLI local development stack, backed by Docker PostgreSQL, rather than a bare PostgreSQL container. Keep the app's existing Supabase REST client and schema contract unchanged. This mirrors Coa Converter and exercises the same API/data path as hosted use while local credentials point only at localhost.

Local app execution must not silently fall back to hosted credentials. A local dev command obtains URL/anon key from the running local stack and starts Vite with those values. If Docker or local Supabase is unavailable, startup fails with a clear message; it must not use `.env` hosted credentials as fallback.

## Data and schema

- Move the canonical schema into a timestamped Supabase migration under `supabase/migrations/` so `supabase start`/`supabase db reset` can provision local tables reproducibly.
- Preserve the existing `accounts`, `categories`, and `transactions` columns, constraints, indexes, and RLS policies from `supabase/schema.sql`.
- Add a deterministic local seed for default accounts and categories only. Do not seed transactions or copy hosted/user data.
- Keep `supabase/schema.sql` synchronized only if it remains a documented hosted SQL setup path; otherwise make it a compatibility wrapper/document pointing at migration to avoid schema drift.

## Runtime flow

1. `npm run dev` invokes a local development launcher.
2. Launcher checks whether the local Supabase API is running; starts pinned Supabase CLI stack with Docker if not.
3. Launcher reads `API_URL` and `ANON_KEY` from local `supabase status -o env` and validates URL host is local (`127.0.0.1`/`localhost`).
4. Launcher runs Vite with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set to local values, overriding any hosted values inherited from shell or `.env`.
5. Browser connects via Supabase REST to local stack. App code remains environment-agnostic; production Vercel continues using hosted env values.

Use existing Node built-ins and installed dependencies; no new runtime database library or custom API server.

## Developer commands and lifecycle

- `npm run dev`: start/reuse local Supabase stack and run Vite on the existing default URL.
- `npm run db:start`: start local Supabase stack explicitly.
- `npm run db:stop`: stop local stack.
- `npm run db:reset`: apply migrations and seed local database; destructive to local DB only.
- Document Docker requirement, local credentials/ports, reset semantics, and that hosted data is never imported.

Pin the Supabase CLI version to match Coa Converter (`2.121.0`) using `npx --yes supabase@2.121.0`; avoid adding a package dependency solely for the CLI.

## Safety boundaries

- Local launcher must reject non-local `API_URL` before starting the frontend.
- Local environment values must override inherited `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `db:reset` is explicitly local-only and must verify local project/API target before destructive action.
- Do not read, print, change, or copy `.envrc`, hosted keys, or remote account configuration.
- No hosted migration, deployment, or data mutation as part of this work.

## Testing and acceptance

- Static checks prove local launcher selects/validates local credentials and overrides hosted env values.
- Verify SQL migration contains the current schema constraints and open access RLS policies.
- With Docker available: start the stack, verify health and local API URL, reset DB, query seeded account/category rows, then launch Vite and verify its runtime points at local API.
- Run existing `npm run check`, `npm run build`, and relevant UI checks.
- A local smoke test should create/edit a category and transaction, reload, and confirm persistence in the local database.
- Test stop/start persistence through Docker volume, and reset clears app data then restores only defaults.

## Out of scope

- Replacing Supabase client with direct PostgreSQL access.
- Creating an application backend or ORM.
- Importing or syncing hosted Supabase records.
- Changing production Vercel configuration or hosted database.
- Redesigning UI or changing transaction/account/category business behavior.
