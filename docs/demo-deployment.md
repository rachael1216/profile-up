# Demo deployment and domain

The demo supports password registration with an email or phone identifier, cloud profiles, private PDF attachments and public personal websites. Identifiers are unverified. The application does not require SMTP or SMS delivery for this mode.

## Public entry address

The requested public address must contain a Profile Up name and must not use a GPT domain. A Cloudflare Worker named `profileup` is prepared in `gateway/`. Its actual `workers.dev` address depends on the owner's Cloudflare account and is recorded only after deployment succeeds. No independent public entry address has been assigned yet. Buying a domain is optional.

The owner needs to register or sign in to Cloudflare, then authorise Wrangler on this computer:

```sh
npx wrangler login --scopes account:read user:read workers:write
npm run deploy:gateway
npx wrangler secret put GATEWAY_SHARED_SECRET --config gateway/wrangler.jsonc
```

OAuth links expire. If one expires during account registration, finish account registration first and run the login command again. Do not put OAuth tokens or API tokens in chat, GitHub or tracked configuration.

## Existing application and data

The entry Worker forwards requests to the existing application. The application, D1 database and R2 files remain in the current Sites deployment; changing the entry hostname does not migrate or clear data. This is an independent entry domain, rather than a complete hosting migration. The existing upstream hostname is recorded explicitly in `gateway/wrangler.jsonc` for maintenance.

The browser uses the entry origin for the editor, account page, API requests, downloads and personal pages. Host-only session cookies are retained on that origin. Public URLs and redirects returned by the application are rewritten to the entry origin. Changing domains requires signing in again because browser cookies are bound to a host; cloud records remain available to the same account.

A shared secret stored in both runtime environments authenticates the forwarded visitor IP. This preserves per-visitor limits across Cloudflare zones; unauthenticated IP forwarding headers are ignored. The gateway refuses to serve until its secret is configured. This credential is never returned to the browser.

The entry Worker rejects mutations whose Origin does not match the entry origin before translating valid same-origin requests for the backend. It never accepts an arbitrary upstream hostname. Private response cache controls pass through unchanged. PDF files, fonts and TeX resources stream without text modification.

## Release checks

1. Deploy the application version with migration `0004_oval_captain_britain.sql` and `AUTH_DEMO_PASSWORD_ENABLED=true`.
2. Deploy the entry Worker after Cloudflare authorisation, configure its shared secret to match the application runtime and record the actual returned URL.
3. Through that URL, register an email account, save a profile, upload a PDF and publish a personal page.
4. Sign out, open a fresh browser session and sign in again. Confirm that saved text and the private PDF persist.
5. Confirm another account cannot read private profiles or PDFs, and that public personal-page links use the entry domain.
6. Update README links and the repository website field only after the entry URL is live.

The gateway uses Cloudflare's Workers free plan within its quotas. A later full migration to the owner's infrastructure is a separate deployment and data-transfer task. See [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [workers.dev addresses](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).
