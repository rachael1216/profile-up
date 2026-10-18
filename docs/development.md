# Development and interaction model

## Product flow

The public workspace serves two outputs: personal academic websites and academic CVs. Product accounts use independent email and phone verification through Supabase Auth and application sessions; delivery activation is tracked separately in `authentication.md`. Creating the first profile records its account association. Users can create, rename on save, copy and switch among up to 30 profiles. Copying uses the saved cloud record and does not copy attachments or publication state. Existing version 0.3 cloud drafts can be imported explicitly; their original records remain intact.

Each profile contains bilingual content, website settings, CV settings and the identifiers of files selected for website publication. Local storage keys contain both account and profile IDs. Switching profiles mounts a separate editor and preserves the previous local draft. Cloud saves are explicit. Loading a cloud version retains an option to restore the preceding local edit.

The website builder selects a slug, title, visual template, typography and visible modules and entries. Publication uses the saved revision and stores a filtered snapshot. Further draft edits do not change the live page until publication. Changing the slug retires the old address. Withdrawal retains the draft and snapshot while returning 404 for the page and its public file routes.

The CV studio independently selects sections and typography. Its six templates are visual styles: classic academic, compact, editorial serif, traditional serif, centered minimal and modern sans. PDF export compiles the generated TeX with XeLaTeX; source export packages that same TeX with its selected fonts and portrait. Word is an additional editable format. See [TeX runtime](tex-runtime.md).

## Data model

| Table | Purpose |
|---|---|
| `accounts` | Site-scoped identity and application account creation time |
| `profiles` | UUID, owner, display label, validated document, revision and timestamps |
| `profile_sites` | Profile-bound slug, filtered document, selected file metadata, source revision and publication state |
| `profile_files` | UUID, profile, owner, R2 object key, original filename, category, bytes and creation time |
| `drafts`, `published_sites` | Preserved version 0.3 records and existing page compatibility |

Files are stored in R2 using generated object keys. Filenames never select storage paths. Original deployed migrations are immutable; new migrations append schema changes. There are no seeded user records or application-data backfills in SQL. Deployment applies the checked-in Drizzle migrations. The local migration helper additionally records their hashes and rejects changes to an applied file.

## API

| Route | Behaviour |
|---|---|
| `GET /api/profiles` | List the authenticated account's profile summaries |
| `POST /api/profiles` | Create an empty profile, copy an owned profile or explicitly import the legacy draft |
| `GET /api/profiles/{id}` | Read an owned cloud profile |
| `PUT /api/profiles/{id}` | Save validated content and optional label at the expected revision |
| `GET /api/profiles/{id}/site` | Read the owned publication status |
| `POST /api/profiles/{id}/site` | Publish the saved revision and selected owned files |
| `DELETE /api/profiles/{id}/site` | Withdraw the page and its public attachment routes |
| `GET /api/profiles/{id}/files` | List owned attachment metadata |
| `POST /api/profiles/{id}/files` | Upload a bounded PDF body with filename and category query parameters |
| `GET /api/files/{id}` | Download an owned private PDF |
| `DELETE /api/files/{id}` | Remove owned metadata and object; existing public download then returns 404 |
| `GET /p/{slug}` | Anonymous access to a published snapshot |
| `GET /p/{slug}/files/{id}` | Anonymous download only when the file belongs to that published snapshot |

Legacy draft reads and saves remain available for recovery. New publication through the legacy `/api/site` POST returns 410; the user imports that draft into a profile first. The legacy publication status and withdrawal endpoints remain available.

## Ownership and validation

Every private operation derives the owner from hosted identity and checks the profile or file against it. Bodies cannot select an owner. An unauthenticated private request returns 401; an authenticated request for another account's record returns 404. Mutations require the same Origin as the request URL. JSON is bounded to 900,000 bytes and parsed with the versioned Zod schema. Conditional updates reject stale revisions with 409.

PDF uploads accept `application/pdf`, a PDF filename and `%PDF-` signature; this is a format gate, not a complete PDF semantic parser. Each file is bounded to 10 MiB. Conditional metadata insertion enforces 50 files per profile and 100 MiB per account under concurrent requests. Failed insertion removes the newly uploaded object. Private and public downloads use attachment disposition, no-store caching, nosniff and a sandbox policy.

At publication, the server independently verifies every selected file belongs to the same profile and account. Selection takes effect only upon publication. Public download checks the published snapshot on every request, so withdrawal revokes it immediately. Public pages contain escaped HTML, restricted links and no executable scripts. `projectProfile` removes disabled sections, hidden entries, aliases and hidden contacts before rendering.

## Runtime and verification

`.openai/hosting.json` binds D1 as `DB` and R2 as `BUCKET`. The Cloudflare assets binding serves the pinned compiler and package files. The large unmodified ICU data file is stored in two static parts, each below the static-asset size limit; a read-only route streams them back in order with the original byte length.

Local sign-in simulation is restricted to loopback development and excluded from production. End-to-end tests use real local D1 and R2, separate anonymous and authenticated browser contexts, and a second independent-session fixture for ownership-denial checks. No real user documents are used in tests. Type checks, validation tests, browser workflows and actual TeX compilation are separate checks. They do not establish usability, accessibility conformance or publication-quality CV effectiveness.

Source, migrations, tests and documentation are retained in the original GitHub repository. Runtime credentials, local databases and generated test files are excluded. The deployed Site source is synchronised from the exact packaged commit.

## Interface revision (v0.5)

The workspace uses a white and grey palette and plain operational copy. Research interests are free text. Discipline selection and the separate ACM entry were removed; the optional writing reference links to the official MOE catalogue. Legacy `fieldIds` remain readable in old backups but no longer control the editor. Website and CV visual templates remain independent of disciplines.
