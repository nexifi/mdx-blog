# Sitemap

Generate XML sitemaps, sitemap indexes, and robots.txt files for search engine optimization.

## Import

```typescript
// Server-side utilities
import {
  generateSitemap,
  buildSitemapXML,
  generateSitemapIndex,
  getArticleSitemapEntries,
  generateRobotsTxt,
} from '@nexifi/mdx-blog/server';

// Types
import type {
  SitemapConfig,
  SitemapEntry,
  SitemapImage,
  ChangeFrequency,
} from '@nexifi/mdx-blog';
```

---

## generateSitemap(entries, config?)

Generates a complete XML sitemap string from an array of entries.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `entries` | `SitemapEntry[]` | URL entries for the sitemap |
| `config` | `SitemapConfig` | Optional configuration |

### SitemapEntry

```typescript
interface SitemapEntry {
  url: string;
  lastmod?: string;           // ISO date string
  changefreq?: ChangeFrequency;
  priority?: number;          // 0.0 to 1.0
  images?: SitemapImage[];
}

interface SitemapImage {
  url: string;
  title?: string;
  caption?: string;
}

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
```

### Example

```typescript
const xml = generateSitemap([
  { url: 'https://example.com/', priority: 1.0, changefreq: 'daily' },
  { url: 'https://example.com/about', priority: 0.8, changefreq: 'monthly' },
  { url: 'https://example.com/blog', priority: 0.9, changefreq: 'weekly' },
]);
```

---

## buildSitemapXML(entries)

Low-level function that builds the XML string from entries without config processing. Used internally by `generateSitemap`.

---

## generateSitemapIndex(sitemapUrls)

Generates a sitemap index XML for large sites with multiple sitemaps.

```typescript
const xml = generateSitemapIndex([
  'https://example.com/sitemap-pages.xml',
  'https://example.com/sitemap-blog.xml',
  'https://example.com/sitemap-products.xml',
]);
```

---

## getArticleSitemapEntries(articles, siteUrl, blogPath)

Converts an array of articles into sitemap entries.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `articles` | `Article[]` | Articles to include |
| `siteUrl` | `string` | Base site URL |
| `blogPath` | `string` | Blog base path (e.g., `/blog`) |

### Example

```typescript
const entries = getArticleSitemapEntries(
  articles,
  'https://example.com',
  '/blog'
);
// → [{ url: 'https://example.com/blog/my-article', lastmod: '...', images: [...] }]
```

---

## generateRobotsTxt(siteUrl, options?)

Generates a `robots.txt` file content.

```typescript
const robotsTxt = generateRobotsTxt('https://example.com', {
  sitemapUrl: 'https://example.com/sitemap.xml',
  disallowPaths: ['/api/', '/admin/'],
});
```

---

## Static Sitemap Generation (Build Time)

For build-time generation (e.g., in `next.config.js` or build scripts):

```typescript
import {
  generateStaticSitemap,
  generateSitemapOnBuild,
  generateBuildTimeSEO,
} from '@nexifi/mdx-blog/server';
```

### generateStaticSitemap(config)

```typescript
await generateStaticSitemap({
  siteUrl: 'https://example.com',
  blogPath: '/blog',
  outputDir: './public',
  adapter: contentAPIAdapter,
  additionalPages: [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/about', changefreq: 'monthly', priority: 0.8 },
  ],
});
```

### generateSitemapOnBuild(config)

Wrapper that generates sitemap + robots.txt in one call.

### generateBuildTimeSEO(config)

Generates sitemap + robots.txt + llms.txt + RSS + Atom in one call.

---

## Framework Integration

### Next.js App Router — `sitemap.ts` (recommended, build-time)

The recommended approach uses Next.js's native `sitemap.ts` convention. Articles are fetched **at build time**, ensuring fast crawler responses and no runtime API calls. Use `revalidate` for ISR.

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

// Revalidate every hour (ISR) — remove for fully static
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await adapter.getAllArticles();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...articles
      .filter((a) => a.published !== false)
      .map((article) => ({
        url: `${siteUrl}/blog/${article.slug}`,
        lastModified: new Date(article.date),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
  ];
}
```

#### robots.ts (build-time)

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

### Next.js App Router — Route Handler (dynamic, per-request)

Use this approach only if you need the sitemap to reflect changes in real time without waiting for revalidation.

```typescript
// app/sitemap.xml/route.ts
import { ContentAPIAdapter, generateSitemap } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET() {
  const articles = await adapter.getAllArticles();
  const xml = generateSitemap(articles, {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com',
    blogPath: '/blog',
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
```

### Next.js Pages Router

```tsx
// pages/sitemap.xml.tsx
import { SitemapPage, createSitemapServerSideProps } from '@nexifi/mdx-blog/server';

export default SitemapPage;

export const getServerSideProps = createSitemapServerSideProps({
  siteUrl: 'https://example.com',
  blogPath: '/blog',
  apiKey: process.env.CONTENT_API_KEY!,
  apiUrl: process.env.CONTENT_API_URL,
  additionalPages: [
    { url: '/', changefreq: 'daily', priority: 1.0 },
  ],
});
```

### robots.txt (Pages Router)

```tsx
// pages/robots.txt.tsx
import { RobotsPage, createRobotsServerSideProps } from '@nexifi/mdx-blog/server';

export default RobotsPage;

export const getServerSideProps = createRobotsServerSideProps({
  siteUrl: 'https://example.com',
  sitemapUrl: 'https://example.com/sitemap.xml',
  disallowPaths: ['/api/', '/admin/'],
});
```
