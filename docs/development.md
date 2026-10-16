# Development notes

The prototype is a React / TypeScript / Vite application. Records are validated with Zod and saved in browser localStorage. Every public export uses `projectProfile` to remove hidden contacts, metadata, entries and disabled sections before rendering. Templates do not receive a complete private draft.

Website rendering escapes text, restricts external links to HTTP/HTTPS and validates embedded photo types. Exported HTML contains no scripts. TeX content is escaped; source output does not accept arbitrary user TeX. Production server-side compilation will require an isolated worker and resource limits.

Before expanding this into a hosted multi-user service, add authentication, authorization, persistent storage, an upload policy, compiler isolation and deployment ownership checks. Do not treat a browser-local demo as a multi-tenant backend.

## GitHub connectivity on this machine

The browser and CLI do not necessarily use the same proxy. A direct connection to github.com timed out while explicit proxy requests succeeded. If the same issue recurs and the local proxy is still listening on port 7890:

```bash
HTTPS_PROXY=http://127.0.0.1:7890 HTTP_PROXY=http://127.0.0.1:7890 gh auth status
HTTPS_PROXY=http://127.0.0.1:7890 HTTP_PROXY=http://127.0.0.1:7890 git push
```

These variables apply only to the command. On the final upload, direct connectivity had recovered while the proxy rejected the larger Git upload with HTTP 400/408. This checkout therefore overrides the old global proxy locally (`git config --local http.proxy ''`, likewise for `https.proxy`) and uses a 64 MiB HTTP post buffer. Other repositories and the global proxy configuration are unchanged. If network routing changes again, check both routes before changing these settings.

No credential or token belongs in the repository. The repository is private; user-initiated public release can happen later.
