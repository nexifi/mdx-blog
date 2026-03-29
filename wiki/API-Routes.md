# API Routes

API routes act as a **proxy layer** between your frontend (React hooks) and the external ContentMaster API. This architecture keeps your API key secret on the server.

```
Browser → Your API Route → ContentAPIAdapter → ContentMaster API
         (public)          (server-only)        (authenticated)
```

> ⚠️ **CRITICAL**: `ContentAPIAdapter` must ONLY be used server-side (API routes, loaders, getServerSideProps, getStaticProps). It throws an error if instantiated in the browser.

## Next.js App Router

### List articles

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
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

### Get single article

```typescript
// app/api/blog/[slug]/route.ts
import { NextResponse } from 'next/server';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const article = await adapter.getArticleBySlug(params.slug);
  if (!article) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(article);
}
```

## Next.js Pages Router

### List articles

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

### Get single article

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

## Remix

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
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
```

```typescript
// app/routes/api.blog.$slug.tsx
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function loader({ params }: LoaderFunctionArgs) {
  const article = await adapter.getArticleBySlug(params.slug!);
  if (!article) throw new Response('Not found', { status: 404 });
  return json(article);
}
```

## Astro

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

## SvelteKit

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

## Caching Strategy

All examples include HTTP caching headers. Recommended values:

| Header | Value | Meaning |
|--------|-------|---------|
| `s-maxage` | `300` | CDN cache for 5 minutes |
| `stale-while-revalidate` | `600` | Serve stale for 10 min while revalidating |

Adjust these based on how frequently your content updates.

## Endpoint Configuration

Your API routes must match the endpoints configured in `BlogProvider`:

```tsx
<BlogProvider config={{
  endpoints: {
    articles: '/api/blog',           // → app/api/blog/route.ts
    article: '/api/blog/:slug',      // → app/api/blog/[slug]/route.ts
    categories: '/api/blog/categories', // Optional
  },
}}>
```

The `:slug` placeholder in the `article` endpoint is automatically replaced by the hook with the actual slug value.
