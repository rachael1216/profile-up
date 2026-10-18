# TeX runtime and reproducibility

Profile Up generates `main.tex` from the selected CV projection and compiles it with XeLaTeX, followed by dvipdfmx. The browser download and the source-project download use the same source generator. Six style presets change margins, headings, name alignment and vertical spacing; all accept the same editable records and font settings. Browser HTML and Word previews are approximate; the downloaded PDF is the typeset result.

## Components

- WasmTex SDK: `corca-ai/wasmtex` at commit `ba65fe20ae1fed88d2cde6e6afb6a3235f55ac9e`, retained in `vendor/wasmtex` with its MIT licence and notices. The local package metadata removes editor-only peers and build hooks; SDK files are unmodified.
- Browser engines: the verified TeX Live 2025 engine release served by upstream on 18 October 2026. Only XeTeX, dvipdfmx and their runtime helpers are distributed by this application. Their original bytes, manifests, build receipts and component licences are retained under `public/wasmtex`.
- Package files: a fixed subset from `https://texlive.corca.ai/snapshots/2025-92e10d3241a312f0/2025/`. `public/texlive/2025/PROFILEUP-MANIFEST.json` records each byte length, SHA-256 and available upstream package provenance. The upstream provenance has `completion-metadata` scope; it does not cover all runtime files. The manifest distinguishes those files rather than claiming full upstream verification.
- ICU 68.2 data: original 28,566,176-byte file, split into two static parts to satisfy the host's per-asset limit. The read-only route concatenates the parts without changing bytes; the manifest records both part hashes and the reconstructed hash.
- Selected Latin and Chinese fonts are supplied as project files. Their licences are packaged with source exports and described in `references.md`.

TeX compilation runs on the visitor's device in dedicated Web Workers. It does not invoke a remote compiler, run shell commands on the cloud server or submit CV source to another website. Runtime assets are requested from this Site. A 180-second client timeout terminates compiler workers. Errors are shown in the workspace; the implementation does not substitute a different PDF layout engine after a failed TeX compile.

## Updating assets

The existing package files support Profile Up's fixed generated source. Arbitrary user-authored TeX projects and arbitrary packages are outside this version's scope. A new generated package dependency must be acquired, recorded and tested before deployment. `scripts/cache-tex-mirror.mjs` is a loopback-only development acquisition helper; it accepts only GET paths, caches upstream files and is not part of the deployed Worker. Do not start it for normal application use.

For an engine update, acquire a verified upstream asset set using its sync procedure, retain its exact manifests and licences, then update the SDK and selected-engine inventory together. Do not mix format and engine builds. Engine source is available at the exact release URL linked from `/wasmtex/index.html`; it is independent of the private application repository. TeX package headers and the upstream source-archive references preserve their individual notices; the engine SDK's MIT licence does not relicense them.

## Verification

With the local application running, `npm run verify:tex` compiles all six academic styles using the same engines and bundled mirror, writes PDF, source and logs under `test-results/tex-audit`, and rejects compilation errors or missing characters. The browser tests additionally compile Chinese and English PDFs and all five Latin font options. Render generated PDFs with Poppler and inspect page boundaries, especially section headings and dated entries. These tests establish functional output, not a comparative evaluation of CV quality.
