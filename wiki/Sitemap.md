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

### Next.js App Router

```typescript
// app/sitemap.xml/route.ts
import { ContentAPIAdapter, getArticleSitemapEntries, generateSitemap } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET() {
  const articles = await adapter.getAllArticles();
  const blogEntries = getArticleSitemapEntries(articles, 'https://example.com', '/blog');

  const entries = [
    { url: 'https://example.com/', priority: 1.0, changefreq: 'daily' as const },
    { url: 'https://example.com/blog', priority: 0.9, changefreq: 'weekly' as const },
    ...blogEntries,
  ];

  const xml = generateSitemap(entries);

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
