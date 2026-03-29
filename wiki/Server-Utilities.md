# Server Utilities

Server-only utilities exported from `@nexifi/mdx-blog/server`. These must never be imported in client/browser code.

## Import

```typescript
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';
import type { ContentAPIConfig } from '@nexifi/mdx-blog/server';
```

---

## ContentAPIAdapter

Server-side HTTP client that communicates with the ContentMaster API. Handles authentication, article transformation, and status management.

### Constructor

```typescript
const adapter = new ContentAPIAdapter({
  apiKey: string,           // Required — ak_xxx, cm_live_xxx, or cm_test_xxx
  baseUrl?: string,         // Default: 'https://api-growthos.nexifi.com'
  timeout?: number,         // Default: 10000 (ms)
  defaultAuthor?: string,   // Default: 'Author'
});
```

### Methods

#### getAllArticles()

Fetches all published articles, sorted by date (newest first).

```typescript
const articles: Article[] = await adapter.getAllArticles();
```

**Behavior:**
- Fetches from the configured `baseUrl`
- Filters to only `published` or `ready` status articles
- Sorts by date descending
- Normalizes field names (snake_case → camelCase)

#### getArticleBySlug(slug)

Fetches a single article by its slug.

```typescript
const article: Article | null = await adapter.getArticleBySlug('my-article');
```

**Behavior:**
- Sanitizes the slug via `sanitizeSlug()`
- Returns `null` if article not found
- Normalizes the response data

#### updateArticleStatus(id, status)

Updates an article's status (e.g., from `draft` to `published`).

```typescript
await adapter.updateArticleStatus('article-id', 'published');
```

#### transformArticle(rawData) — Static

Transforms raw API response data into an `Article` object. Available as both instance and static method.

```typescript
const article = ContentAPIAdapter.transformArticle(rawApiData);
// or
const article = adapter.transformArticle(rawApiData);
```

### Field Mapping

The adapter normalizes API response fields:

| API Response | Article Field |
|-------------|---------------|
| `author_title` | `authorTitle` |
| `author_image` | `authorImage` |
| `read_time` | `readTime` |
| `image_width` | `imageWidth` |
| `image_height` | `imageHeight` |
| `image_blur_data_url` | `imageBlurDataURL` |

### Security

- **Browser guard**: Throws if `window` is defined
- **API key validation**: Must match `ak_*`, `cm_live_*`, or `cm_test_*` format
- **Slug sanitization**: All slug parameters are validated
- **Fetch timeout**: Configurable timeout via AbortController

### Example Usage (API Route)

```typescript
// app/api/blog/route.ts
import { NextResponse } from 'next/server';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET() {
  try {
    const articles = await adapter.getAllArticles();
    return NextResponse.json(articles, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
```

---

## BlogApiClient

Client-side API client used internally by hooks. Unlike `ContentAPIAdapter`, it calls **your local API routes** (not the external API directly).

```typescript
import { BlogApiClient } from '@nexifi/mdx-blog';

const client = new BlogApiClient({
  baseUrl: '',  // Empty = relative URLs (recommended)
  endpoints: {
    articles: '/api/blog',
    article: '/api/blog/:slug',
    categories: '/api/blog/categories',
  },
  timeout: 10000,
});
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getArticles()` | `Promise<Article[]>` | Fetch all articles |
| `getArticle(slug)` | `Promise<Article \| null>` | Fetch single article |
| `getCategories()` | `Promise<string[]>` | Fetch categories |
| `getArticlesByTag(tag)` | `Promise<Article[]>` | Filter by tag |
| `getArticlesByCategory(cat)` | `Promise<Article[]>` | Filter by category |
| `getRelatedArticles(slug, limit?)` | `Promise<Article[]>` | Get related articles |

### Data Flow

```
BlogApiClient → /api/blog (your API route) → ContentAPIAdapter → ContentMaster API
  (browser)        (server)                     (server)           (external)
```

### Response Normalization

The client normalizes API responses:
- Handles `data` wrapper objects (e.g., `{ articles: [...] }`, `{ data: [...] }`)
- Filters to `published` or `ready` status
- Sorts by date (newest first)
- Normalizes field names (snake_case → camelCase)

### Custom Transformers

Override the default response transformation:

```typescript
const client = new BlogApiClient({
  endpoints: { articles: '/api/blog', article: '/api/blog/:slug' },
  transform: {
    articles: (data) => data.items.map(transformMyArticle),
    article: (data) => transformMyArticle(data.item),
  },
});
```

---

## Pages Router Helpers

Pre-built page components for Next.js Pages Router SSR:

### SitemapPage + createSitemapServerSideProps

```tsx
// pages/sitemap.xml.tsx
import { SitemapPage, createSitemapServerSideProps } from '@nexifi/mdx-blog/server';
export default SitemapPage;
export const getServerSideProps = createSitemapServerSideProps({ ... });
```

### RobotsPage + createRobotsServerSideProps

```tsx
// pages/robots.txt.tsx
import { RobotsPage, createRobotsServerSideProps } from '@nexifi/mdx-blog/server';
export default RobotsPage;
export const getServerSideProps = createRobotsServerSideProps({ ... });
```

### LlmsPage + createLlmsServerSideProps

```tsx
// pages/llms.txt.tsx
import { LlmsPage, createLlmsServerSideProps } from '@nexifi/mdx-blog/server';
export default LlmsPage;
export const getServerSideProps = createLlmsServerSideProps({ ... });
```

See [[Sitemap]], [[llms.txt]] for detailed configuration.
