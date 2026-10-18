# Demo accounts and verified authentication

## Current deployment state

Profile Up is a public demo. Anonymous visitors can edit example or personal records, compare templates and export websites and CVs. Cloud profiles, private PDF files and publication require an authenticated account.

The application implements real email and SMS one-time-code flows through Supabase Auth. It does not generate demonstration verification codes or report delivery when a channel is disabled. The Supabase project is connected and its publishable key is configured. Public SMTP and SMS senders remain unconfigured; both OTP channels therefore remain disabled. ChatGPT sign-in has been removed from the product. Existing records owned by that earlier identity are preserved; they are not automatically reassigned.

## Password demo

The current public demo accepts a normalised email or phone identifier and a 12–128 character password. Registration and sign-in are separate actions. It does not send codes or claim that identifier ownership is verified. No password recovery is offered while ownership verification is unavailable; the registration form states this before account creation.

`demo_credentials` stores a random application owner ID, the identifier, a unique random 32-byte salt and a scrypt hash. Scrypt uses N=32768, r=8, p=3, a 64-byte output and a 64 MiB allocation ceiling. Passwords are neither truncated nor logged. Unknown identifiers perform the same derivation before returning the same login error as a wrong password. Native Cloudflare Worker compatibility is checked by browser integration tests.

Password sessions reuse the host-bound HttpOnly session mechanism. Registration is limited to five requests per IP per hour, three per identifier per ten minutes and 100 globally per day; login permits 30 per IP and ten per identifier per ten minutes. Limits apply before password derivation. Duplicate registration does not alter the existing account or password. Each account retains its profiles, private attachments and publication snapshots across sign-out and later sign-in.

Demo identities remain separate from verified OTP identities. Matching an unverified identifier never transfers records to a subsequently verified user. A future account-linking flow must prove access to the existing account and the newly verified contact.

## Verified OTP flow

1. A visitor chooses email or phone and requests a code. Chinese mainland numbers can be entered as eleven digits; international numbers include their country code. The server normalises the destination.
2. The same-origin API checks channel activation, optional CAPTCHA and persistent request limits. It asks Supabase Auth to send an actual code, allowing creation of an unverified provider identity. No Profile Up account or session is created at this point.
3. A successful provider response creates a ten-minute D1 challenge bound to a random HttpOnly browser cookie. The browser receives only its challenge ID and masked destination.
4. Verification allows at most five attempts per challenge. The server calls Supabase `verifyOtp` and then validates the resulting access token with `getUser`. The confirmed email or phone must match the original destination.
5. A successful, unused challenge creates the application account and an eight-hour random session. Only the token's SHA-256 digest is stored in D1. The production cookie is host-bound, Secure and HttpOnly. Provider access and refresh tokens are not returned to the browser or stored in Profile Up.
6. Sign-out deletes the application session, clears its cookies and returns to the public demo. The product does not accept platform ChatGPT identity as an authentication fallback.

An email/phone account is separate from an existing ChatGPT account. They are not merged by a matching email address. Export/import can transfer user-selected text records; linking verified identities and migrating file ownership are separate future tasks.

## Records and controls

`auth_users` maps the provider's project-scoped subject to an application owner ID. `auth_sessions` stores token digests and expiry. `auth_challenges` stores browser-bound destinations, attempts, expiry and consumption state. `auth_limits` stores time-window counters using hashed keys; raw IP addresses are not retained in those keys.

Sending is limited to five requests per client IP per ten minutes, one per destination per minute, and six per destination per hour. The demo defaults to 25 SMS requests and 200 email requests per day across the application. Attempts count towards the budget even if an upstream request fails. Provider rate limits and available balances apply in addition. The SMS daily ceiling is configurable, with an application maximum of 1,000. Expired session, challenge and rate records are removed during successful sends.

All auth mutations require a matching Origin and accept at most 8 KiB of JSON. Provider configuration is server-only. Expired or invalid application cookies yield an anonymous session. Platform identity headers are ignored. Public profile and attachment permissions continue to be checked against the authenticated owner and publication snapshot.

The local tests use an injected HTTP transport for provider protocol checks and local D1 session fixtures for cookie isolation and revocation. Those fixtures do not add a test code or verification bypass to deployed code. Live mail/SMS delivery remains an independent acceptance check.

## Required configuration

| Site runtime key | Purpose |
|---|---|
| `SUPABASE_URL` | HTTPS origin of the selected Supabase project |
| `SUPABASE_PUBLISHABLE_KEY` | Project publishable key, retained in server configuration |
| `AUTH_DEMO_PASSWORD_ENABLED` | `true` to allow the explicitly unverified password demo |
| `AUTH_EMAIL_ENABLED` | `true` only after public email delivery is configured and checked |
| `AUTH_SMS_ENABLED` | `true` only after the SMS provider and target regions are configured and checked |
| `AUTH_SMS_DAILY_LIMIT` | Default `25` for this demo |
| `TURNSTILE_SITE_KEY` | Optional public site key when Turnstile is enabled in Supabase |

Store production values through Sites environment settings, marking keys and credentials as secrets. Keep local values in an untracked `.dev.vars` file. `.env.example` documents names only. A saved version must be deployed after changing runtime settings.

Profile Up does not need a Supabase `service_role` key. SMTP passwords, SMS provider credentials and the Turnstile secret belong in the authentication provider's secure settings, not in Profile Up source or client bundles.

## Activation procedure

1. Connect the Supabase plugin and select an existing project, or create a dedicated `Profile Up` project after confirming its organisation and cost. The user must perform account registration, legal acceptance and any payment setup.
2. Enable Email Auth. Configure custom SMTP with a verified sender, host, port, username and password. Include `{{ .Token }}` in the login email template so it contains the six-digit code. Keep automatic email confirmation disabled. Set OTP expiry to ten minutes.
3. Enable Phone Auth with an SMS provider. Configure its credentials and SMS template in Supabase. The sender must support +86 as the primary destination and the international regions intended for the demo. Test accounts restricted to pre-approved numbers are insufficient for public registration. A provider supported by Supabase can be used directly; a different domestic provider requires a separately configured Send SMS hook.
4. Set the Site URL to the selected public entry origin; see [deployment and domain setup](demo-deployment.md). If using CAPTCHA, configure Turnstile in Supabase and its site key in Profile Up. Use appropriate provider spending and send limits.
5. Add the project URL and publishable key to Sites. Enable each channel only when its sender configuration is ready, then deploy the saved application version.
6. Obtain codes at an owner-authorised email, a mainland Chinese number and an international number. Check first registration, repeat login, resend cooldown, expired/wrong codes, sign-out, cloud profile access and cross-account denial. Do not declare live sending complete from mocked tests.

## References

- [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless): email codes share the magic-link mechanism; the email template determines which is presented.
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp): the built-in sender is restricted to team addresses, so an open public demo needs its own SMTP delivery service.
- [Supabase phone authentication](https://supabase.com/docs/guides/auth/phone-login): phone authentication requires a configured SMS provider.
- [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits).
- [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

- [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
