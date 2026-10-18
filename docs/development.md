# Implementation notes

## Runtime

The application uses the Sites Vinext integration with React and TypeScript. The Worker entrypoint and Vite plugin are retained from the supplied starter. `.openai/hosting.json` binds Cloudflare D1 as `DB`; unused R2 storage is disabled. The generated deployment contains the Worker and static assets.

The root server component reads dispatch-provided identity and supplies the client with a display name and a Site-scoped account ID. Draft keys in browser storage include that ID. The offline draft can be imported explicitly after signing in.

## Records and publication

`drafts` stores a complete validated profile for each account, its revision and update time. A conditional upsert accepts an existing record only at the revision supplied by the client. A conflict returns HTTP 409 without changing the stored record. The UI retains local edits, fetches the latest cloud record and requires loading that record before further cloud saves. Loading a cloud record offers restoration of the preceding local draft.

`published_sites` stores a filtered profile snapshot, the owner, slug, source revision and publication state. `POST /api/site` publishes the saved revision. Republishing a changed slug removes the previous route. Withdrawal changes the publication state without deleting the draft or snapshot.

| Route | Access and purpose |
|---|---|
| `GET /api/draft` | Authenticated account's draft |
| `PUT /api/draft` | Authenticated account; same origin; validated profile and revision |
| `GET /api/site` | Authenticated account's publication status |
| `POST /api/site` | Authenticated account; same origin; saved draft revision |
| `DELETE /api/site` | Authenticated account; same origin; withdrawal |
| `GET /p/{slug}` | Published website snapshot; deployment audience also applies |

Server operations derive the owner from hosted identity. Request bodies do not select an account. Cloud submissions are limited to 900,000 bytes. Draft API responses disable caching. Published pages disable caching to make withdrawal effective without waiting for a cached response to expire.

## Rendering and export

`projectProfile` removes disabled modules, hidden entries, author aliases and hidden contacts before rendering. Website rendering escapes text, accepts HTTP/HTTPS external links and validates embedded portrait types. Published HTML contains no scripts. The generated page uses root-relative font paths; ZIP exports retain relative paths.

PDF generation remains in the browser. DOCX contains native paragraphs and styles. XeLaTeX source is escaped and downloaded for local compilation; this deployment does not execute arbitrary TeX on the server.

## Local checks

Run `npm run build`, then `npm run db:local` to apply generated migrations to `.wrangler/state`. The local migration helper records applied file hashes and rejects edits to applied SQL. Production migrations are applied by the Sites deployment workflow. Keep SQL, Drizzle snapshots and the migration journal in source control.

The local sign-in simulation is limited to loopback development and is excluded from production. The cloud end-to-end tests exercise this local identity with real D1 persistence. The public-route tests use a separate anonymous browser context.

## Network routing

On this machine, the local proxy at `127.0.0.1:7890` has been needed intermittently for GitHub downloads. Direct uploads succeeded when the proxy rejected larger Git requests. Repository-local routing settings do not alter global configuration. Diagnose the active route before changing proxy settings. Credentials, local databases and runtime caches are excluded from source control.
