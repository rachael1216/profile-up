<div align="center">

# Profile Up

### Academic website and curriculum vitae generation

个人学术网站与简历生成系统

[简体中文](README.zh-CN.md) · [Implementation](docs/development.md) · [Typography and classification sources](docs/references.md)

[![CI](https://github.com/rachael1216/profile-up/actions/workflows/ci.yml/badge.svg)](https://github.com/rachael1216/profile-up/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-304b38.svg)](LICENSE)

</div>

## Abstract

Profile Up provides a common authoring interface for academic websites and curricula vitae. Users enter biographical information, education, appointments, publications, projects, teaching materials and related records in Chinese and English. The system renders these records as a personal website or a CV with configurable typography and section order. Website publication uses a separate snapshot containing the entries selected for display; cloud drafts retain the complete editable record. The implementation combines browser-based editing and document export with authenticated cloud storage and website publication.

## Current implementation

| Component | Implemented behaviour |
|---|---|
| Authoring | Bilingual records, portraits, external links, section ordering and visibility controls |
| Website generation | Three visual styles; hosted personal pages at `/p/{slug}`; publication and withdrawal |
| CV generation | Six layout styles; Latin and Chinese fonts; configurable size, spacing, paper and portrait |
| Document export | Searchable PDF, editable DOCX, a XeLaTeX source project and a static website archive |
| Cloud storage | Drafts indexed by the authenticated account, with revision checks on updates |
| Recovery | Browser-local drafts and JSON import/export; local drafts are separated by account |

Templates are organised by visual and typographic style. Research-area references are maintained separately and identify their classification source, version and translation status.

## Architecture

The editor is implemented in React and TypeScript. Vinext serves the application and API routes on Cloudflare Workers. Cloudflare D1 stores editable drafts and published website snapshots. Hosted identity is supplied by the Sites authentication service; write operations require an authenticated account and a matching request origin.

The `projectProfile` function selects records for each output before rendering. Published pages use the website projection; CV exports use the CV projection. A cloud draft update increments its revision. An update based on an earlier revision is rejected, allowing the user to retain local work before loading the cloud record. A website is updated only when the user publishes again.

## Use

1. Sign in to the hosted workspace, or run the application locally.
2. Enter information in the content editor. Chinese and English content can be edited independently.
3. Select website and CV styles, typography and displayed sections.
4. Save the draft to the cloud. Publish the website to obtain its address.
5. Download the required CV or website files. A JSON backup preserves the full editable record.

Publication makes the selected website content accessible according to the deployment's access policy. Withdrawing a page retains its cloud draft and publication record. Changing the website slug and publishing again retires the previous address.

## Local installation

Node.js 22.13 or later is required. Node.js 24 LTS is used for local development.

```bash
git clone https://github.com/rachael1216/profile-up.git
cd profile-up
npm ci
npm run build
npm run db:local
npm run dev
```

Open `http://127.0.0.1:5173/`. The local sign-in flow provides a development identity; it is excluded from production. Local and hosted databases are separate.

On macOS, `启动 Profile Up.command` starts the local workspace in the background. It requires the dependencies and local database to have been prepared. After a computer restart, run the launcher again.

## Verification

```bash
npm run typecheck
npm test
npm run build
npm run db:local
npx playwright install chromium
npm run test:e2e
```

The tests cover record validation, output filtering, escaping, document export and the cloud save/publish workflow. These are software checks. Comparative usability, accessibility audits and studies of CV quality remain future evaluation tasks.

## Scope and limitations

This repository contains a research prototype. Institutional email verification, external account ownership verification, automatic publication import, custom domains and collaborative editing are under development. Cloud submissions are limited to 900 KB per draft; portraits are resized in the browser. Course videos are represented by external links.

PDF, Word and XeLaTeX use different layout engines. The browser preview illustrates the selected style; pagination and glyph appearance can differ in exported documents. Word resolves font names using the reader's installed fonts. The other exports embed or package redistributable fonts. Font sources and licences are documented in [references](docs/references.md).

No user study or benchmark result is reported for this version. Demonstration records describe fictional people and work.

## Licence

Application code is distributed under the [MIT licence](LICENSE). Fonts and vendored components retain their accompanying licences.
