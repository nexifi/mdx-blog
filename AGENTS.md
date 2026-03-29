# @nexifi/mdx-blog — AI Agent Integration Instructions

> This file is read by AI coding agents (GitHub Copilot, Claude, Cursor, Windsurf, etc.)
> to understand how to integrate this package into a project.
> **Shipped with the package** — included in the `files` array of package.json.

---

## Package Identity

- **Name**: `@nexifi/mdx-blog`
- **Registry**: npmjs.com (public)
- **License**: MIT
- **Node**: >=18.0.0
- **Type**: ESM-first (`"type": "module"`)

## Reference Implementation: getmax.io

[**getmax.io**](https://getmax.io) is the canonical production implementation of `@nexifi/mdx-blog`. Study its patterns when integrating into similar projects.

| Aspect | Details |
|--------|--------|
| **URL** | [https://getmax.io](https://getmax.io) |
| **Framework** | Next.js 15, App Router |
| **i18n** | Locale-prefixed routes: `/fr/blog`, `/en/blog` (segment: `[locale]`) |
| **Styling** | Tailwind CSS v4 (`@source` directive) |
| **Blog structure** | `src/app/[locale]/blog/page.tsx` + `src/app/[locale]/blog/[slug]/page.tsx` |
| **API routes** | `src/app/api/blog/route.ts` + `src/app/api/blog/[slug]/route.ts` |
| **BlogProvider** | Wrapped in `src/app/[locale]/layout.tsx` via a `'use client'` providers file |
| **Server adapter** | `ContentAPIAdapter` in API routes only |
| **Features** | MDX rendering, JSON-LD SEO, sitemap, RSS/Atom, responsive images, i18n labels |

> **getMax** is the AI-powered marketing operating system by [Nexifi](https://nexifi.com). Site, SEO, campaigns, CRM — getMax creates, optimizes and converts 24/7. Sans agence, sans dev, sans complexité.
>
> - **AI Agents**: Max (coordinateur), Léa (SEO & Contenu), Hugo (Ads & Acquisition), Sophie (CRM & Nurturing), Lucas (Site & Landing Pages), Emma (Analytics & Reporting)
> - **Apps**: Site web, Marketing, Local, Social, Publicité, Référencement, Rapports, CRM, Automatisations
> - **Console**: [console.nexifi.com](https://console.nexifi.com)
> - **Pricing**: From 79€/month (Indépendant) to 359€/month (Scale-up) + Enterprise

## What This Package Does

`@nexifi/mdx-blog` is a complete headless blog toolkit for any frontend framework:

- **API client** (`BlogApiClient`) with SWR-based React hooks
- **Server adapter** (`ContentAPIAdapter`) for API key authentication (server-only)
- **Pre-built UI components**: `BlogListPage`, `BlogArticlePage`, `ArticleLayout`
- **7 MDX widgets**: `Newsletter`, `TableOfContents`, `AuthorBio`, `ProductCard`, `RelatedPosts`, `StatsBox`, `FeatureList`
- **SEO components**: JSON-LD (`ArticleSchema`, `BlogListSchema`), meta tags (`ArticleHead`, `BlogListHead`)
- **Sitemap**: XML sitemap (SSR + build-time), robots.txt, llms.txt
- **RSS/Atom**: Feed generation (`generateRSSFeed`, `generateAtomFeed`)
- **Image**: `BlogImage` (responsive, lazy, blur, srcset)
- **i18n**: All UI strings overridable via `labels` (French defaults)
- **Security**: XSS-safe JSON-LD, slug sanitization, fetch timeout, XML injection protection

## Supported Frameworks

| Framework | Status | Notes |
|-----------|--------|-------|
| **Next.js** (App Router) | Full support | React components + Route Handlers |
| **Next.js** (Pages Router) | Full support | React components + API routes + SSG factories |
| **Remix** v2 | Full support | React components + loaders/actions |
| **Astro** v4+ | Full support | React components via `@astrojs/react` + API endpoints |
| **Nuxt** v3 | Supported | React components via islands + server routes |
| **SvelteKit** v2 | Server utilities | ContentAPIAdapter, sitemap, RSS (custom UI for Svelte) |
| **Plain React** | Full support | React components + any API layer |

## Entry Points

| Import | When to use |
|--------|-------------|
| `@nexifi/mdx-blog` | Client-side: components, hooks, provider, types, SEO, images, widgets |
| `@nexifi/mdx-blog/server` | Server-side only: ContentAPIAdapter, sitemap, RSS, security |
| `@nexifi/mdx-blog/mdx` | MDX rendering: BlogArticlePage, MDXProvider, SSG factories (ESM only) |

## Installation

```bash
# Core (always required)
npm install @nexifi/mdx-blog react react-dom swr

# Framework-specific (install what you need):
npm install next                  # Next.js
npm install @remix-run/react      # Remix
npm install @astrojs/react        # Astro

# Optional — for MDX rendering:
npm install next-mdx-remote @mdx-js/react remark-gfm rehype-highlight
```

## Required Environment Variables

```env
CONTENT_API_KEY=ak_xxxxxxxxxxxxx
CONTENT_API_URL=https://api-growthos.nexifi.com/api/contentmaster/projects/<PROJECT_ID>/articles
NEXT_PUBLIC_SITE_URL=https://getmax.io
```

---

## Integration Steps (follow in order)

### Step 1 — Wrap app with BlogProvider

Place in your root layout, `_app.tsx`, `App` component, or equivalent:

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
    backToBlog: 'Retour au blog',
    readMore: 'Lire la suite',
    // Override any label — see Labels interface
  }}
>
  {children}
</BlogProvider>
```

### Step 2 — Create API routes (server-side ONLY)

**CRITICAL**: `ContentAPIAdapter` must ONLY be used server-side (API routes, loaders, getServerSideProps, getStaticProps). NEVER import it in client/browser code — it throws at instantiation if `window` is defined.

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

```typescript
// app/api/blog/[slug]/route.ts
import { NextResponse } from 'next/server';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const article = await adapter.getArticleBySlug(params.slug);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(article);
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
  try {
    const articles = await adapter.getAllArticles();
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json(articles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
}
```

```typescript
// pages/api/blog/[slug].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const article = await adapter.getArticleBySlug(req.query.slug as string);
    if (!article) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json(article);
  } catch {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
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

### Step 3 — Create blog list page

```tsx
// Works in any React framework
import { BlogListPage, BlogListHead, BlogListSchema } from '@nexifi/mdx-blog';

const seoConfig = {
  siteUrl: 'https://getmax.io',
  siteName: 'getMax',
  blogPath: '/blog',
};

export default function BlogPage() {
  return (
    <>
      <BlogListHead config={seoConfig} title="Blog" description="Nos derniers articles" />
      <BlogListSchema config={seoConfig} articles={[]} />
      <BlogListPage
        title="Blog"
        subtitle="Nos derniers articles"
        blogPath="/blog"
        perPage={9}
      />
    </>
  );
}
```

### Step 4 — Create blog article page

#### Next.js Pages Router (with SSG)

```tsx
// pages/blog/[slug].tsx
import { BlogArticlePage, createGetStaticPaths, createGetStaticProps } from '@nexifi/mdx-blog/mdx';

export const getStaticPaths = createGetStaticPaths({
  articlesEndpoint: '/api/blog',
});

export const getStaticProps = createGetStaticProps({
  articlesEndpoint: '/api/blog',
  articleEndpoint: '/api/blog/:slug',
  revalidateSeconds: 3600,
  relatedCount: 3,
});

export default BlogArticlePage;
```

#### Next.js App Router / Remix / Astro

For App Router and other frameworks, create a client component that uses the hooks:

```tsx
'use client';
import { useArticle, ArticleLayout, ArticleHead, ArticleSchema } from '@nexifi/mdx-blog';

export default function ArticlePage({ slug }: { slug: string }) {
  const { article, isLoading, error } = useArticle(slug);

  if (isLoading) return <div>Loading...</div>;
  if (error || !article) return <div>Article not found</div>;

  return (
    <>
      <ArticleHead article={article} config={{ siteUrl: 'https://getmax.io', siteName: 'getMax', blogPath: '/blog' }} />
      <ArticleSchema article={article} config={{ siteUrl: 'https://getmax.io', siteName: 'getMax', blogPath: '/blog' }} />
      <ArticleLayout article={article}>
        <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
      </ArticleLayout>
    </>
  );
}
```

### Step 5 — Tailwind CSS configuration

**Tailwind v4** (no `content` array):
```css
/* In your main CSS file (e.g., app/globals.css) */
@source "../../node_modules/@nexifi/mdx-blog/dist";
```

**Tailwind v3**:
```js
// tailwind.config.js
content: [
  // ... existing paths
  './node_modules/@nexifi/mdx-blog/**/*.{js,ts,jsx,tsx}',
],
```

### Step 6 — Environment variables

```env
CONTENT_API_KEY=ak_xxxxxxxxxxxxx
CONTENT_API_URL=https://api-growthos.nexifi.com/api/contentmaster/projects/<PROJECT_ID>/articles
NEXT_PUBLIC_SITE_URL=https://getmax.io
```

---

## Complete Exports Reference

### Client-side (`@nexifi/mdx-blog`)

```typescript
// Provider & Context
import { BlogProvider, useBlogClient, useLabels } from '@nexifi/mdx-blog';

// Hooks
import {
  useArticles, useArticle, useCategories,
  useRelatedArticles, usePagination, useArticlesByTag, useSearch,
} from '@nexifi/mdx-blog';

// Page Components
import { BlogListPage, ArticleLayout } from '@nexifi/mdx-blog';

// SEO Components
import {
  ArticleHead, BlogListHead,
  ArticleSchema, BlogListSchema,
} from '@nexifi/mdx-blog';

// Widgets (for MDX content)
import {
  Newsletter, TableOfContents, AuthorBio,
  ProductCard, RelatedPosts, StatsBox, FeatureList,
} from '@nexifi/mdx-blog';

// Image
import { BlogImage } from '@nexifi/mdx-blog';
import {
  resolveImageUrl, generateSrcSet, generateSizes,
  computeHeight, buildImageObject, isExternalImage, getExternalOrigin,
  DEFAULT_WIDTHS, ASPECT_RATIOS,
} from '@nexifi/mdx-blog';

// Other Components
import { ArticlePlaceholder, getIconForCategory } from '@nexifi/mdx-blog';

// Security (also available from /server)
import { sanitizeSlug, fetchWithTimeout, safeJsonLd, escapeXml } from '@nexifi/mdx-blog';

// RSS/Atom (also available from /server)
import { generateRSSFeed, generateAtomFeed } from '@nexifi/mdx-blog';

// Sitemap
import { generateSitemap, buildSitemapXML, generateSitemapIndex, getArticleSitemapEntries, generateRobotsTxt } from '@nexifi/mdx-blog';

// i18n
import { defaultLabels, mergeLabels } from '@nexifi/mdx-blog';

// Types
import type {
  Article, ArticleMetadata, BlogApiConfig,
  PaginatedResult, PaginationOptions, ValidationError,
  SEOConfig, SchemaConfig, SitemapConfig, SitemapEntry, SitemapImage,
  ChangeFrequency, RSSConfig, AtomConfig,
  StaticSitemapConfig, BuildTimeSEOConfig, LlmsConfig,
  BlogImageProps, ImageSource, ImageLoader, ImageLoaderParams,
  Labels, SitemapPageConfig, RobotsPageConfig, ContentAPIConfig,
} from '@nexifi/mdx-blog';
```

### Server-side (`@nexifi/mdx-blog/server`)

```typescript
import {
  ContentAPIAdapter,
  generateSitemap, buildSitemapXML, generateSitemapIndex,
  getArticleSitemapEntries, generateRobotsTxt,
  generateStaticSitemap, generateSitemapOnBuild, generateBuildTimeSEO,
  generateRSSFeed, generateAtomFeed,
  sanitizeSlug, fetchWithTimeout, safeJsonLd, escapeXml,
  resolveImageUrl, generateSrcSet, generateSizes,
  computeHeight, buildImageObject, isExternalImage, getExternalOrigin,
  DEFAULT_WIDTHS, ASPECT_RATIOS,
  ArticleMetadataSchema,
} from '@nexifi/mdx-blog/server';
```

### MDX-dependent (`@nexifi/mdx-blog/mdx`)

```typescript
import {
  BlogArticlePage,
  createGetStaticPaths,
  createGetStaticProps,
  MDXProvider,
  ArticleCTA,
  Alert,
} from '@nexifi/mdx-blog/mdx';
```

---

## Key Rules for Integration

1. **`ContentAPIAdapter` is server-only** — never import in client components. It throws if `window` is defined.
2. **`BlogProvider` must wrap any page** that uses hooks (`useArticles`, `useArticle`, etc.) or components.
3. **API routes proxy to `ContentAPIAdapter`** — client hooks call your local API routes, never the external API directly.
4. **Match the project's existing code style** — import style (alias vs relative), naming conventions, export patterns.
5. **Always add the package to Tailwind content paths** if the project uses Tailwind CSS (v3: `content[]`, v4: `@source` directive).
6. **Use TypeScript** if the project uses TypeScript.
7. **Handle loading and error states** in pages using the `isLoading` and `error` returned by hooks.
8. **API key format**: must start with `ak_`, `cm_live_`, or `cm_test_`.
9. **Labels**: override any French default by passing a partial `labels` object to `BlogProvider`.
10. **Peer dependencies**: `react`, `react-dom`, `swr` are required. Everything else is optional — install what your framework needs.
11. **Reference getmax.io** as the canonical integration example — study its `src/app/[locale]/blog/` structure for Next.js App Router + i18n projects.

---

## Adaptation Guide

### i18n / Locale Routing

If the project uses i18n with locale-prefixed routes (e.g., `/fr/blog`, `/en/blog`):
- Place blog pages **inside** the `[locale]` segment: `src/app/[locale]/blog/page.tsx`
- Place `BlogProvider` in `src/app/[locale]/layout.tsx` (via a `'use client'` providers wrapper) — NOT in individual pages
- Pass locale-aware labels to `BlogProvider` from the i18n system
- Internal blog links should include the locale prefix
- **Reference**: [getmax.io](https://getmax.io) uses exactly this pattern with `/fr/blog` and `/en/blog`

### Tailwind v4 (no config file)

Tailwind v4 does **not** use a `content` array in `tailwind.config.*`. Add a `@source` directive in the CSS:
```css
@source "../../node_modules/@nexifi/mdx-blog/dist";
```

### Design System Integration

Wrap blog components with your project's design system:
- **shadcn/ui**: Use `<Card>`, `<Button>`, `<Badge>` from `@/components/ui/`
- **Chakra UI**: Use `<Box>`, `<Heading>`, `<Text>`, `<Badge>`, `<SimpleGrid>`
- **Mantine**: Use `<Paper>`, `<Title>`, `<Text>`, `<Badge>`, `<Card>`
- **Material UI**: Use `<Paper>`, `<Typography>`, `<Chip>`, `<Grid>`, `<Card>`
- **DaisyUI**: Use DaisyUI classes: `card`, `badge`, `btn`, `hero`

### Dark Mode

If the project supports dark mode:
- Use Tailwind `dark:` variants
- Use CSS variables for theming
- Do NOT hard-code colors

---

## ContentAPIAdapter API

```typescript
const adapter = new ContentAPIAdapter({
  apiKey: string,           // Required: ak_xxx, cm_live_xxx, or cm_test_xxx
  baseUrl?: string,         // Default: https://api-growthos.nexifi.com
  timeout?: number,         // Default: 10000 (ms)
  defaultAuthor?: string,   // Default: 'Author'
});

await adapter.getAllArticles();                        // → Article[]
await adapter.getArticleBySlug('my-article');          // → Article | null
await adapter.updateArticleStatus('id', 'published'); // → void
adapter.transformArticle(rawData);                     // → Article
ContentAPIAdapter.transformArticle(rawData);           // Static version
```

## BlogApiClient API (used by hooks internally)

```typescript
const client = new BlogApiClient({
  baseUrl?: string,
  headers?: Record<string, string>,
  endpoints?: { articles?, article?, categories? },
  timeout?: number,       // Default: 10000
  transform?: { articles?, article? },
  cache?: { revalidateOnFocus?, dedupingInterval?, ... },
});

await client.getArticles();                  // → Article[]
await client.getArticle('slug');             // → Article | null
await client.getCategories();                // → string[]
await client.getArticlesByTag('tag');         // → Article[]
await client.getArticlesByCategory('cat');    // → Article[]
await client.getRelatedArticles('slug', 3);  // → Article[]
```

## Article Type

```typescript
interface Article {
  slug: string;
  title: string;
  date: string;
  category: string;
  content?: string;
  excerpt?: string;
  author?: string;
  authorTitle?: string;
  authorImage?: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageBlurDataURL?: string;
  tags?: string[];
  readTime?: number;
  published?: boolean;
  status?: string;
}
```
