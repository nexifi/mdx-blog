# Changelog

All notable changes to `@nexifi/mdx-blog` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-29

### Breaking Changes

- **Removed CLI** — The `npx @nexifi/mdx-blog` install command and `npx @nexifi/mdx-blog validate` are no longer available. The AI-powered installation agent (OpenCode) and project analyzer have been removed.
- **Removed bin entries** — `nexifi-blog` and `mdx-blog` CLI binaries are no longer provided.
- **Removed `./cli` export** — The `@nexifi/mdx-blog/cli` sub-path no longer exists.
- **Removed runtime dependencies** — `@openai/agents`, `openai`, `zod` are no longer bundled. The package has zero runtime dependencies.

### Added

- **Multi-framework support** — Official support for Remix, Astro, Nuxt, SvelteKit, and plain React in addition to Next.js.
- **Framework-specific peer dependencies** — `@astrojs/react`, `@remix-run/react`, `@sveltejs/kit` as optional peer deps.
- **Updated documentation** — README, AGENTS.md rewritten with examples for all supported frameworks (Next.js App/Pages Router, Remix, Astro, SvelteKit).

### Removed

- `src/cli/` directory (agent, analyzer, commands, types)
- `tsup.cli.config.ts`
- `build:cli`, `build:all`, `blog:validate` scripts
- OpenAI/Zod runtime dependencies

---

## [1.0.0] - 2026-03-24

Initial public release on npmjs.com.

### Core Features

- **Headless blog system** for Next.js (Pages & App Router)
- **`BlogProvider`** context with SWR-based React hooks (`useArticles`, `useArticle`, `useCategories`, `useRelatedArticles`, `usePagination`, `useArticlesByTag`, `useSearch`)
- **`ContentAPIAdapter`** server-side adapter with HMAC API key authentication
- **`BlogApiClient`** client-side API abstraction used by hooks
- **Pre-built pages**: `BlogListPage`, `BlogArticlePage`, `ArticleLayout` with placeholder support
- **SSG factories**: `createGetStaticPaths()` and `createGetStaticProps()` for zero-config static generation

### SEO

- **JSON-LD schemas**: `ArticleSchema` (Article structured data) and `BlogListSchema` (ItemList)
- **Meta tags**: `ArticleHead` and `BlogListHead` components
- **Sitemap**: SSR (`SitemapPage`, `createSitemapServerSideProps`) and build-time (`generateStaticSitemap`, `generateSitemapOnBuild`, `generateBuildTimeSEO`)
- **Sitemap Index**: `generateSitemapIndex` for large sites
- **robots.txt**: `RobotsPage` + `createRobotsServerSideProps`
- **RSS/Atom feeds**: `generateRSSFeed`, `generateAtomFeed`

### Components & Widgets

- **MDX rendering**: `MDXProvider` with custom components, `ArticleCTA`, `Alert`
- **7 MDX widgets**: `Newsletter`, `TableOfContents`, `AuthorBio`, `ProductCard`, `RelatedPosts`, `StatsBox`, `FeatureList`
- **Image**: `BlogImage` with responsive srcset, lazy loading, blur placeholder, aspect ratio computation
- **Image utilities**: `resolveImageUrl`, `generateSrcSet`, `generateSizes`, `computeHeight`, `buildImageObject`, `isExternalImage`, `getExternalOrigin`

### i18n

- **Labels system**: all UI strings overridable via `BlogProvider`'s `labels` prop
- **French defaults**: `defaultLabels` in `src/i18n/defaults.ts`
- **`mergeLabels()`** utility for partial overrides

### Security

- **XSS-safe JSON-LD**: `safeJsonLd()` escapes `</script>` sequences in `dangerouslySetInnerHTML`
- **Slug sanitization**: `sanitizeSlug()` prevents path traversal and injection via regex validation
- **Fetch timeout**: `fetchWithTimeout()` with configurable timeout (default: 10s)
- **XML injection protection**: `escapeXml()` for sitemap generation
- **`ContentAPIAdapter` browser guard**: throws `Error` if instantiated client-side (`window` check)
- **API key format validation**: accepts `ak_*`, `cm_live_*`, `cm_test_*` prefixes only

### Package Configuration

- **Dual ESM/CJS output** via tsup (`"type": "module"`, exports field)
- **`sideEffects: false`** for tree-shaking
- **Three entry points**: `.` (client), `./server` (server), `./mdx` (MDX components)
- **`engines.node >= 18.0.0`**
- **Peer dependencies**: `react`, `react-dom`, `swr` (required); `next`, `next-mdx-remote`, `@mdx-js/react`, `remark-gfm`, `rehype-highlight` (optional)
- **No bundled runtime** — all runtime deps are peer dependencies
