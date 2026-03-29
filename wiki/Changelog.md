# Changelog

All notable changes to `@nexifi/mdx-blog` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2026-03-29

### Breaking Changes

- **Removed CLI** — The `npx @nexifi/mdx-blog` install command and `npx @nexifi/mdx-blog validate` are no longer available. The AI-powered installation agent (OpenCode) and project analyzer have been removed.
- **Removed bin entries** — `nexifi-blog` and `mdx-blog` CLI binaries are no longer provided.
- **Removed `./cli` export** — The `@nexifi/mdx-blog/cli` sub-path no longer exists.
- **Removed runtime dependencies** — `@openai/agents`, `openai`, `zod` are no longer bundled. The package has zero runtime dependencies.

### Added

- **Multi-framework support** — Official support for Remix, Astro, Nuxt, SvelteKit, and plain React in addition to Next.js.
- **Framework-specific peer dependencies** — `@astrojs/react`, `@remix-run/react`, `@sveltejs/kit` as optional peer deps.
- **Updated documentation** — README, AGENTS.md rewritten with examples for all supported frameworks.

### Removed

- `src/cli/` directory (agent, analyzer, commands, types)
- `tsup.cli.config.ts`
- `build:cli`, `build:all`, `blog:validate` scripts
- OpenAI/Zod runtime dependencies

---

## [1.0.0] — 2026-03-24

Initial public release on npmjs.com.

### Core Features

- **Headless blog system** for Next.js (Pages & App Router)
- **`BlogProvider`** context with SWR-based React hooks
- **`ContentAPIAdapter`** server-side adapter with API key authentication
- **`BlogApiClient`** client-side API abstraction
- **Pre-built pages**: `BlogListPage`, `BlogArticlePage`, `ArticleLayout`
- **SSG factories**: `createGetStaticPaths()` and `createGetStaticProps()`

### SEO

- **JSON-LD schemas**: `ArticleSchema` and `BlogListSchema`
- **Meta tags**: `ArticleHead` and `BlogListHead`
- **Sitemap**: SSR + build-time generation
- **Sitemap Index**: for large sites
- **robots.txt**: `RobotsPage` + `createRobotsServerSideProps`
- **RSS/Atom feeds**: `generateRSSFeed`, `generateAtomFeed`

### Components & Widgets

- **MDX rendering**: `MDXProvider` with custom components, `ArticleCTA`, `Alert`
- **7 MDX widgets**: Newsletter, TableOfContents, AuthorBio, ProductCard, RelatedPosts, StatsBox, FeatureList
- **Image**: `BlogImage` with responsive srcset, lazy loading, blur placeholder
- **Image utilities**: `resolveImageUrl`, `generateSrcSet`, `generateSizes`, `computeHeight`, `buildImageObject`

### i18n

- **Labels system**: all UI strings overridable via `BlogProvider`'s `labels` prop
- **French defaults**
- **`mergeLabels()`** utility

### Security

- **XSS-safe JSON-LD**: `safeJsonLd()`
- **Slug sanitization**: `sanitizeSlug()`
- **Fetch timeout**: `fetchWithTimeout()`
- **XML injection protection**: `escapeXml()`
- **Browser guard**: `ContentAPIAdapter` throws if used client-side
- **API key format validation**

### Package Configuration

- **Dual ESM/CJS output** via tsup
- **`sideEffects: false`** for tree-shaking
- **Three entry points**: `.` (client), `./server` (server), `./mdx` (MDX)
- **Node.js ≥ 18.0.0**
