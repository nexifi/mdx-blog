# @nexifi/mdx-blog

[![CI](https://github.com/nexifi/mdx-blog/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nexifi/mdx-blog/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nexifi/mdx-blog)](https://www.npmjs.com/package/@nexifi/mdx-blog)
[![AI-Ready](https://img.shields.io/badge/AI--Ready-AGENTS.md-blue)](./AGENTS.md)
[![Showcase](https://img.shields.io/badge/Showcase-getmax.io-black)](https://getmax.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Complete headless blog toolkit — API client, React hooks, SEO components, sitemap, RSS, MDX widgets. Works with **Next.js**, **Remix**, **Astro**, **Nuxt**, **SvelteKit**, and any React app.

> **Powering [getmax.io](https://getmax.io)** — the AI-powered marketing OS by Nexifi. Site, SEO, campaigns, CRM — getMax creates, optimizes and converts 24/7.

## Installation

```bash
# Core (required)
npm install @nexifi/mdx-blog react react-dom swr

# Framework-specific (install what you use):
npm install next                     # Next.js
npm install @remix-run/react         # Remix
npm install @astrojs/react           # Astro

# Optional — for MDX rendering:
npm install next-mdx-remote @mdx-js/react remark-gfm rehype-highlight
```

---

## Architecture

```
@nexifi/mdx-blog
├── Main entry (.)          → React components, hooks, provider, types
├── Server entry (./server) → ContentAPIAdapter, sitemap, RSS, security (Node.js only)
└── MDX entry (./mdx)       → MDX-dependent components (ESM only)
```

| Import | Usage |
|--------|-------|
| `@nexifi/mdx-blog` | Client-side: React components, hooks, provider, i18n, SEO, images |
| `@nexifi/mdx-blog/server` | Server-side: ContentAPIAdapter, sitemap, RSS, security utilities |
| `@nexifi/mdx-blog/mdx` | MDX rendering: BlogArticlePage, MDXProvider, SSG factories (ESM only) |

---

## Features

| Feature | Description |
|---------|-------------|
| **BlogProvider** | React context with SWR caching, i18n labels |
| **7 React hooks** | `useArticles`, `useArticle`, `useCategories`, `usePagination`, `useRelatedArticles`, `useArticlesByTag`, `useSearch` |
| **Pre-built pages** | `BlogListPage` (category filters, pagination), `BlogArticlePage` (MDX + SEO) |
| **7 MDX widgets** | `Newsletter`, `TableOfContents`, `AuthorBio`, `ProductCard`, `RelatedPosts`, `StatsBox`, `FeatureList` |
| **SEO** | `ArticleSchema` / `BlogListSchema` (JSON-LD), `ArticleHead` / `BlogListHead` (meta tags, OG, Twitter Cards) |
| **Sitemap** | XML sitemap generation (runtime SSR + build-time), sitemap index, robots.txt |
| **RSS/Atom** | `generateRSSFeed`, `generateAtomFeed` with media extensions |
| **llms.txt** | Build-time [llmstxt.org](https://llmstxt.org) file generation |
| **Images** | `BlogImage` (responsive, lazy, blur placeholder, srcset), image utilities |
| **Server adapter** | `ContentAPIAdapter` (API key auth, server-only guard) |
| **Security** | XSS-safe JSON-LD, slug sanitization, fetch timeout, CDATA escaping, XML injection protection |
| **i18n** | All UI strings overridable via labels (French defaults) |
| **TypeScript** | Fully typed, strict mode |
| **Tree-shakeable** | ESM + CJS dual output, `sideEffects: false` |

---

## CLI — AI-Powered Installation

The package includes an AI agent (powered by [@openai/agents](https://github.com/openai/openai-agents-js)) that can autonomously integrate `@nexifi/mdx-blog` into your project:

```bash
# Install with AI agent (requires OPENAI_API_KEY)
npx @nexifi/mdx-blog install

# Dry-run — preview what the agent would do
npx @nexifi/mdx-blog install --dry-run

# Validate an existing integration
npx @nexifi/mdx-blog validate
```

### Commands

| Command | Description |
|---------|-------------|
| `install` / `setup` / `init` | Run the AI agent to integrate the blog into your project |
| `validate` / `check` | Static validation of an existing integration (no API key needed) |
| `help` | Show available commands |
| `version` | Show package version |

### Install Options

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview the integration prompt without running the agent |
| `--verbose` | Show detailed agent activity |
| `--quiet` | Minimal output |
| `--model <model>` | OpenAI model to use (default: `gpt-4.1`) |
| `--keep-on-failure` | Keep changes even if the agent fails (default: rollback) |

The agent analyzes your project structure (framework, router, styling, conventions), reads your AGENTS.md, and generates a complete integration — including provider setup, API routes, blog pages, Tailwind config, and environment variables.

---

## Supported Frameworks

| Framework | Router | How to use |
|-----------|--------|------------|
| **Next.js** | App Router | React components + Route Handlers for API |
| **Next.js** | Pages Router | React components + API routes + SSG factories |
| **Remix** | v2 | React components + loaders/actions for data |
| **Astro** | v4+ | React components via `@astrojs/react` + API endpoints |
| **Nuxt** | v3 | React components via islands + server routes |
| **SvelteKit** | v2 | Server utilities (sitemap, RSS, ContentAPIAdapter) + custom UI |
| **Plain React** | Any | React components + your own API layer |

> The React components (hooks, provider, pages, SEO) work in any React environment.
> The server utilities (ContentAPIAdapter, sitemap, RSS) work in any Node.js runtime.

---

## Showcase: getmax.io

[**getmax.io**](https://getmax.io) is the reference production implementation of `@nexifi/mdx-blog`:

- **Framework**: Next.js 15 App Router
- **i18n**: Locale-prefixed routes (`/fr/blog`, `/en/blog`) with `[locale]` segment
- **Styling**: Tailwind CSS v4 with `@source` directive
- **Features used**: Full blog with MDX rendering, JSON-LD SEO, sitemap, RSS/Atom, `BlogProvider` with French labels, `ContentAPIAdapter` for server-side data fetching, `BlogImage` responsive images
- **Architecture**: `src/app/[locale]/blog/page.tsx` (list) + `src/app/[locale]/blog/[slug]/page.tsx` (article)
- **API routes**: `src/app/api/blog/route.ts` + `src/app/api/blog/[slug]/route.ts`

> getMax is the AI-powered marketing operating system — site, SEO, campaigns, CRM and analytics in a single console. Built by [Nexifi](https://nexifi.com).

---

## Quick Start

### 1. Wrap your app with BlogProvider

```tsx
import { BlogProvider } from '@nexifi/mdx-blog';

<BlogProvider
  config={{
    endpoints: {
      articles: '/api/blog',
      article: '/api/blog/:slug',
      categories: '/api/blog/categories',
    },
  }}
  labels={{
    home: 'Home',
    blog: 'Blog',
    readMore: 'Read more',
    backToBlog: 'Back to blog',
  }}
>
  {children}
</BlogProvider>
```

### 2. Create API routes (server-side only)

> **`ContentAPIAdapter` must ONLY be used server-side.** It throws if instantiated in the browser.

#### Next.js App Router

```typescript
// app/api/blog/route.ts
import { NextResponse } from 'next/server';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET() {
  const articles = await adapter.getAllArticles();
  return NextResponse.json(articles, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
```

#### Next.js Pages Router

```typescript
// pages/api/blog/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const articles = await adapter.getAllArticles();
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.json(articles);
}
```

#### Remix

```typescript
// app/routes/api.blog.tsx
import { json } from '@remix-run/node';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function loader() {
  const articles = await adapter.getAllArticles();
  return json(articles, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
```

#### Astro

```typescript
// src/pages/api/blog.ts
import type { APIRoute } from 'astro';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: import.meta.env.CONTENT_API_KEY,
  baseUrl: import.meta.env.CONTENT_API_URL,
});

export const GET: APIRoute = async () => {
  const articles = await adapter.getAllArticles();
  return new Response(JSON.stringify(articles), {
    headers: { 'Content-Type': 'application/json' },
  });
};
```

#### SvelteKit

```typescript
// src/routes/api/blog/+server.ts
import { json } from '@sveltejs/kit';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';
import { CONTENT_API_KEY, CONTENT_API_URL } from '$env/static/private';

const adapter = new ContentAPIAdapter({
  apiKey: CONTENT_API_KEY,
  baseUrl: CONTENT_API_URL,
});

export async function GET() {
  const articles = await adapter.getAllArticles();
  return json(articles);
}
```

### 3. Blog list page

```tsx
import { BlogListPage, BlogListHead, BlogListSchema } from '@nexifi/mdx-blog';

const seoConfig = { siteUrl: 'https://getmax.io', siteName: 'getMax', blogPath: '/blog' };

export default function Blog() {
  return (
    <>
      <BlogListHead config={seoConfig} title="Blog" description="Our latest articles" />
      <BlogListSchema config={seoConfig} articles={[]} />
      <BlogListPage title="Blog" blogPath="/blog" perPage={9} />
    </>
  );
}
```

### 4. Article page with SSG (Next.js Pages Router)

```tsx
// pages/blog/[slug].tsx
import { BlogArticlePage, createGetStaticPaths, createGetStaticProps } from '@nexifi/mdx-blog/mdx';

export const getStaticPaths = createGetStaticPaths({ articlesEndpoint: '/api/blog' });
export const getStaticProps = createGetStaticProps({
  articlesEndpoint: '/api/blog',
  articleEndpoint: '/api/blog/:slug',
  revalidateSeconds: 3600,
  relatedCount: 3,
});

export default BlogArticlePage;
```

### 5. Tailwind CSS

**Tailwind v4** — add to your main CSS:
```css
@source "../../node_modules/@nexifi/mdx-blog/dist";
```

**Tailwind v3** — add to `tailwind.config.js`:
```js
content: [
  './node_modules/@nexifi/mdx-blog/**/*.{js,ts,jsx,tsx}',
],
```

### 6. Environment Variables

```env
CONTENT_API_KEY=ak_xxxxxxxxxxxxx
CONTENT_API_URL=https://api-growthos.nexifi.com/api/contentmaster/projects/<PROJECT_ID>/articles
NEXT_PUBLIC_SITE_URL=https://getmax.io
```

---

## i18n / Labels

All UI text is configurable via `BlogProvider`'s `labels` prop. French defaults are built-in.

```tsx
<BlogProvider
  config={config}
  labels={{
    home: 'Home', blog: 'Blog', backToBlog: 'Back to blog',
    readMore: 'Read more', readArticle: 'Read article',
    relatedArticles: 'Related articles',
    tags: 'Tags:', share: 'Share:', minRead: 'min read',
    allArticles: 'All articles',
    previous: 'Previous', next: 'Next',
    pageXofY: (c, t) => `Page ${c} of ${t}`,
    articleCount: (n) => `${n} article${n > 1 ? 's' : ''}`,
    blogSubtitle: 'Discover our latest articles',
    loading: 'Loading...', noArticlesFound: 'No articles found.',
    newsletterTitle: 'Subscribe to our newsletter',
    tableOfContents: 'Table of Contents',
    // ... see Labels interface for all 30+ keys
  }}
/>
```

---

## SEO

### JSON-LD Structured Data

```tsx
import { ArticleSchema, BlogListSchema } from '@nexifi/mdx-blog';

<ArticleSchema article={article} config={{
  siteUrl: 'https://getmax.io', siteName: 'getMax', blogPath: '/blog',
}} />

<BlogListSchema config={schemaConfig} articles={articles} />
```

### Meta Tags (Open Graph, Twitter Cards)

```tsx
import { ArticleHead, BlogListHead } from '@nexifi/mdx-blog';

<ArticleHead article={article} config={{
  siteUrl: 'https://getmax.io', siteName: 'getMax',
  twitterHandle: '@getmaxio', blogPath: '/blog',
}} />
```

### Build-Time Sitemap + robots.txt + llms.txt

```typescript
import { generateBuildTimeSEO } from '@nexifi/mdx-blog/server';

await generateBuildTimeSEO({
  siteUrl: 'https://getmax.io',
  apiKey: process.env.CONTENT_API_KEY,
  blogPath: '/blog',
  outputDir: './public',
  staticPages: [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/fr', priority: 1.0, changefreq: 'daily' },
    { path: '/fr/blog', priority: 0.9, changefreq: 'daily' },
    { path: '/fr/integrations', priority: 0.8, changefreq: 'weekly' },
    { path: '/fr/mcp', priority: 0.8, changefreq: 'weekly' },
  ],
  llmsConfig: {
    name: 'getMax', description: 'Votre croissance marketing en pilote automatique. Site, SEO, campagnes, CRM : getMax crée, optimise et convertit 24/7.',
    services: ['Site web & Landing Pages', 'SEO & Référencement', 'CRM & Nurturing', 'Publicité & Acquisition', 'Analytics & Reporting', 'Marketing Automation'],
  },
});
```

### SSR llms.txt (Pages Router)

```tsx
// pages/llms.txt.tsx
import { LlmsPage, createLlmsServerSideProps } from '@nexifi/mdx-blog/server';

export default LlmsPage;
export const getServerSideProps = createLlmsServerSideProps({
  siteUrl: 'https://getmax.io',
  blogPath: '/blog',
  llmsConfig: {
    name: 'getMax',
    description: 'AI-powered marketing operating system.',
    contact: { email: 'hello@getmax.io' },
    services: [
      { title: 'SEO', url: 'https://getmax.io/seo', description: 'AI-driven SEO' },
    ],
  },
});

// pages/llms-full.txt.tsx — same but with full: true
```

### App Router / Remix / Astro — llms.txt

```typescript
// app/llms.txt/route.ts (Next.js App Router)
import { generateLlmsTxt, ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({ apiKey: process.env.CONTENT_API_KEY! });

export async function GET() {
  const articles = await adapter.getAllArticles();
  const { llmsTxt } = generateLlmsTxt(
    { name: 'getMax', description: 'AI-powered marketing OS.' },
    articles, 'https://getmax.io', '/blog',
  );
  return new Response(llmsTxt, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
}
```

### RSS / Atom Feeds

```typescript
import { generateRSSFeed, generateAtomFeed } from '@nexifi/mdx-blog/server';

const rss = generateRSSFeed(articles, {
  siteUrl: 'https://getmax.io', title: 'Blog getMax',
  description: 'Votre croissance marketing en pilote automatique — articles SEO, acquisition et CRM', blogPath: '/blog', language: 'fr',
});
```

---

## API Reference

### Provider & Context

| Export | Type | Description |
|--------|------|-------------|
| `BlogProvider` | Component | Root context provider — config + labels |
| `useBlogClient()` | Hook | Access the `BlogApiClient` instance |
| `useLabels()` | Hook | Access the current labels (i18n) |

### Hooks

| Hook | Returns | Description |
|------|---------|-------------|
| `useArticles()` | `{ articles, isLoading, error, refresh }` | All published articles (SWR cached) |
| `useArticle(slug)` | `{ article, isLoading, error, refresh }` | Single article by slug |
| `useCategories()` | `{ categories, isLoading, error, refresh }` | Available categories |
| `useRelatedArticles(slug, limit?)` | `{ relatedArticles, isLoading, error }` | Related articles (same category/tags) |
| `usePagination(options?)` | `{ items, pagination, setPage, setCategory }` | Client-side pagination + category filter |
| `useArticlesByTag(tag)` | `{ articles, isLoading, error }` | Articles by tag |
| `useSearch(query, options?)` | `{ results, isSearching, totalResults }` | Client-side full-text search |

### Page Components

| Component | Key Props | Description |
|-----------|-----------|-------------|
| `BlogListPage` | `title`, `blogPath`, `perPage`, `showCategories`, `ImageComponent` | Full blog listing with category filters + pagination |
| `BlogArticlePage` | `article`, `mdxSource`, `relatedArticles`, `seoConfig` | Full article page with MDX rendering (via `./mdx`) |
| `ArticleLayout` | `article`, `children`, `showBreadcrumb`, `showShareButtons`, `showTags` | Article layout wrapper |
| `ArticlePlaceholder` | `category`, `icon` | Gradient placeholder when article has no image |

### SEO Components

| Component | Key Props | Description |
|-----------|-----------|-------------|
| `ArticleHead` | `article`, `config: SEOConfig` | `<head>` meta tags (OG, Twitter, canonical) |
| `BlogListHead` | `config: SEOConfig`, `title`, `description` | Blog index meta tags |
| `ArticleSchema` | `article`, `config: SchemaConfig` | JSON-LD: BlogPosting + BreadcrumbList + WebPage |
| `BlogListSchema` | `config: SchemaConfig`, `articles` | JSON-LD: CollectionPage + ItemList |

### MDX Components (`@nexifi/mdx-blog/mdx`)

| Component | Description |
|-----------|-------------|
| `BlogArticlePage` | Full article page with MDX rendering |
| `MDXProvider` | Wraps MDX content with styled HTML elements + all widgets |
| `ArticleCTA` | Call-to-action block (3 variants: primary, secondary, success) |
| `Alert` | Callout box (info, warning, success, danger, tip) |
| `createGetStaticPaths(config)` | SSG factory for Next.js `getStaticPaths` |
| `createGetStaticProps(config)` | SSG factory for Next.js `getStaticProps` with MDX serialization |

### Widgets (usable in MDX content)

| Widget | Key Props | Description |
|--------|-----------|-------------|
| `Newsletter` | `onSubmit`, `apiEndpoint`, `variant` | Email signup (inline, card, minimal) |
| `TableOfContents` | `maxDepth`, `collapsible` | Auto-generated TOC with active heading tracking |
| `AuthorBio` | `name`, `bio`, `links`, `variant` | Author card (compact or full) |
| `ProductCard` | `name`, `price`, `rating`, `link` | E-commerce product card |
| `RelatedPosts` | `posts: Article[]`, `maxPosts` | Related articles block |
| `StatsBox` | `stats: StatItem[]`, `variant` | Statistics display (horizontal, vertical, grid) |
| `FeatureList` | `features`, `variant` | Feature/advantage list (list, grid, compact) |

### Image

| Export | Type | Description |
|--------|------|-------------|
| `BlogImage` | Component | Responsive image with lazy load, blur, srcset, error fallback |
| `resolveImageUrl` | Function | Resolve relative images to absolute URLs |
| `generateSrcSet` | Function | Generate `srcset` string |
| `generateSizes` | Function | Generate `sizes` attribute |
| `computeHeight` | Function | Compute height from width + aspect ratio |
| `buildImageObject` | Function | Build JSON-LD ImageObject |
| `isExternalImage` | Function | Check if URL is external |

### Server Adapter (`@nexifi/mdx-blog/server`)

| Export | Description |
|--------|-------------|
| `ContentAPIAdapter` | Server-only HTTP client with API key auth (throws in browser) |
| `.getAllArticles()` | Fetch all published articles |
| `.getArticleBySlug(slug)` | Fetch single article |
| `.updateArticleStatus(id, status)` | Update article status |
| `.transformArticle(data)` | Transform raw API data to `Article` |

### Sitemap & SEO Utilities (`@nexifi/mdx-blog/server`)

| Export | Description |
|--------|-------------|
| `generateSitemap(articles, config)` | Generate XML sitemap from articles |
| `buildSitemapXML(entries)` | Build XML from custom entries |
| `generateSitemapIndex(sitemaps, siteUrl)` | Sitemap index for large sites |
| `getArticleSitemapEntries(articles, blogPath?)` | Entries for `next-sitemap` integration |
| `generateRobotsTxt(siteUrl, options?)` | Generate robots.txt |
| `generateStaticSitemap(config)` | Build-time sitemap with article fetch |
| `generateSitemapOnBuild(options)` | Write sitemap.xml to disk |
| `generateBuildTimeSEO(config)` | Full pipeline: sitemap + robots + llms.txt |
| `generateLlmsTxt(config, articles, baseUrl, blogPath)` | Generate llms.txt + llms-full.txt content |
| `LlmsPage` | SSR page component for llms.txt (Pages Router) |
| `createLlmsServerSideProps(config)` | Factory for llms.txt getServerSideProps |
| `generateRSSFeed(articles, config)` | RSS 2.0 XML |
| `generateAtomFeed(articles, config)` | Atom 1.0 XML |

### Security

| Export | Description |
|--------|-------------|
| `safeJsonLd(data)` | XSS-safe JSON serialization for `<script type="application/ld+json">` |
| `sanitizeSlug(slug)` | Validate slug (alphanumeric + hyphens, no path traversal) |
| `fetchWithTimeout(url, options, timeout?)` | Fetch with configurable timeout (default: 10s) |
| `escapeXml(str)` | Escape XML special characters |

---

## Security

| Protection | Implementation |
|------------|----------------|
| XSS in JSON-LD | `safeJsonLd()` escapes `</script>`, `<!--`, `-->`, `\u2028`, `\u2029` |
| Slug injection | `sanitizeSlug()` validates alphanumeric + hyphens, blocks path traversal |
| Fetch timeout | `fetchWithTimeout()` prevents hanging requests (default: 10s) |
| API key exposure | `ContentAPIAdapter` throws if instantiated in browser |
| Auth header warning | `BlogApiClient` warns if `Authorization` header used client-side |
| XML injection | `escapeXml()` applied to all sitemap interpolation |
| CDATA breakout | RSS/Atom feeds escape `]]>` sequences in CDATA sections |

---

## License

MIT © [Nexifi](https://nexifi.com) — Powering [getMax](https://getmax.io)
