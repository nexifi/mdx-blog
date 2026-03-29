# Framework Guides

Detailed integration instructions for each supported framework.

---

## Next.js App Router

The recommended setup for new Next.js projects.

### File Structure

```
src/
  app/
    layout.tsx              ← Root layout
    providers.tsx           ← 'use client' BlogProvider wrapper
    api/
      blog/
        route.ts            ← GET /api/blog (article list)
        [slug]/
          route.ts          ← GET /api/blog/:slug (single article)
    blog/
      page.tsx              ← Blog list page
      [slug]/
        page.tsx            ← Article page (server component wrapper)
        pageClient.tsx      ← Article page (client component)
```

### Step 1 — Providers

```tsx
// src/app/providers.tsx
'use client';

import { BlogProvider } from '@nexifi/mdx-blog';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BlogProvider
      config={{
        endpoints: {
          articles: '/api/blog',
          article: '/api/blog/:slug',
          categories: '/api/blog/categories',
        },
      }}
    >
      {children}
    </BlogProvider>
  );
}
```

### Step 2 — Root Layout

```tsx
// src/app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Step 3 — API Routes

See [[API Routes]] for complete examples.

### Step 4 — Blog List Page

```tsx
// src/app/blog/page.tsx
import { BlogListPage, BlogListHead, BlogListSchema } from '@nexifi/mdx-blog';

const seoConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
  siteName: 'My Site',
  blogPath: '/blog',
};

export default function BlogPage() {
  return (
    <>
      <BlogListHead config={seoConfig} title="Blog" description="Our latest articles" />
      <BlogListSchema config={seoConfig} articles={[]} />
      <BlogListPage title="Blog" blogPath="/blog" perPage={9} />
    </>
  );
}
```

### Step 5 — Article Page

```tsx
// src/app/blog/[slug]/page.tsx (Server Component)
import ArticlePageClient from './pageClient';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  return <ArticlePageClient slug={params.slug} />;
}
```

```tsx
// src/app/blog/[slug]/pageClient.tsx (Client Component)
'use client';

import { useArticle, ArticleLayout, ArticleHead, ArticleSchema } from '@nexifi/mdx-blog';

const seoConfig = {
  siteUrl: 'https://yoursite.com',
  siteName: 'My Site',
  blogPath: '/blog',
};

export default function ArticlePageClient({ slug }: { slug: string }) {
  const { article, isLoading, error } = useArticle(slug);

  if (isLoading) return <div className="py-20 text-center">Loading...</div>;
  if (error || !article) return <div className="py-20 text-center">Article not found</div>;

  return (
    <>
      <ArticleHead article={article} config={seoConfig} />
      <ArticleSchema article={article} config={seoConfig} />
      <ArticleLayout article={article}>
        <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
      </ArticleLayout>
    </>
  );
}
```

---

## Next.js App Router + i18n

For projects with locale-prefixed routes (like [getmax.io](https://getmax.io)).

### File Structure

```
src/
  app/
    [locale]/
      layout.tsx            ← Locale layout with BlogProvider
      providers.tsx         ← 'use client' with locale-aware labels
      blog/
        page.tsx            ← Blog list
        [slug]/
          page.tsx          ← Article page
    api/
      blog/
        route.ts
        [slug]/
          route.ts
```

### Providers with Locale

```tsx
// src/app/[locale]/providers.tsx
'use client';

import { BlogProvider } from '@nexifi/mdx-blog';
import { ReactNode } from 'react';

const labelsByLocale = {
  fr: undefined, // Use French defaults
  en: {
    home: 'Home',
    blog: 'Blog',
    backToBlog: 'Back to blog',
    readMore: 'Read more',
    // ...
  },
};

export function Providers({ children, locale }: { children: ReactNode; locale: string }) {
  return (
    <BlogProvider
      config={{
        endpoints: {
          articles: '/api/blog',
          article: '/api/blog/:slug',
        },
      }}
      labels={labelsByLocale[locale]}
    >
      {children}
    </BlogProvider>
  );
}
```

---

## Next.js Pages Router

Uses SSG factories for static generation.

### File Structure

```
pages/
  _app.tsx                  ← BlogProvider
  api/
    blog/
      index.ts              ← GET /api/blog
      [slug].ts             ← GET /api/blog/:slug
  blog/
    index.tsx               ← Blog list
    [slug].tsx              ← Article page (SSG)
  sitemap.xml.tsx           ← Sitemap (SSR)
  robots.txt.tsx            ← robots.txt (SSR)
```

### _app.tsx

```tsx
import { BlogProvider } from '@nexifi/mdx-blog';

export default function App({ Component, pageProps }) {
  return (
    <BlogProvider
      config={{
        endpoints: {
          articles: '/api/blog',
          article: '/api/blog/:slug',
        },
      }}
    >
      <Component {...pageProps} />
    </BlogProvider>
  );
}
```

### SSG Article Page

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

---

## Remix

### File Structure

```
app/
  root.tsx                  ← BlogProvider
  routes/
    api.blog.tsx            ← Article list loader
    api.blog.$slug.tsx      ← Single article loader
    blog._index.tsx         ← Blog list page
    blog.$slug.tsx          ← Article page
```

### root.tsx

```tsx
import { BlogProvider } from '@nexifi/mdx-blog';
import { Outlet } from '@remix-run/react';

export default function App() {
  return (
    <html lang="fr">
      <body>
        <BlogProvider
          config={{
            endpoints: {
              articles: '/api/blog',
              article: '/api/blog/:slug',
            },
          }}
        >
          <Outlet />
        </BlogProvider>
      </body>
    </html>
  );
}
```

### API Routes

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
  return json(articles);
}
```

---

## Astro

### File Structure

```
src/
  layouts/
    BlogLayout.astro        ← Layout with BlogProvider
  pages/
    api/
      blog.ts               ← API endpoint
      blog/[slug].ts         ← Single article endpoint
    blog/
      index.astro            ← Blog list
      [slug].astro           ← Article page
  components/
    BlogWrapper.tsx          ← React island with BlogProvider
```

### React Island

```tsx
// src/components/BlogWrapper.tsx
import { BlogProvider, BlogListPage } from '@nexifi/mdx-blog';

export default function BlogWrapper() {
  return (
    <BlogProvider
      config={{
        endpoints: {
          articles: '/api/blog',
          article: '/api/blog/:slug',
        },
      }}
    >
      <BlogListPage title="Blog" blogPath="/blog" />
    </BlogProvider>
  );
}
```

### Astro Page

```astro
---
// src/pages/blog/index.astro
import Layout from '../../layouts/BlogLayout.astro';
import BlogWrapper from '../../components/BlogWrapper.tsx';
---

<Layout title="Blog">
  <BlogWrapper client:load />
</Layout>
```

### API Endpoint

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

---

## SvelteKit

SvelteKit can use the server utilities (`ContentAPIAdapter`, sitemap, RSS) but needs custom Svelte UI components.

### Server Routes

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

```typescript
// src/routes/api/blog/[slug]/+server.ts
import { json, error } from '@sveltejs/kit';
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';
import { CONTENT_API_KEY, CONTENT_API_URL } from '$env/static/private';

const adapter = new ContentAPIAdapter({
  apiKey: CONTENT_API_KEY,
  baseUrl: CONTENT_API_URL,
});

export async function GET({ params }) {
  const article = await adapter.getArticleBySlug(params.slug);
  if (!article) throw error(404, 'Not found');
  return json(article);
}
```

### Sitemap

```typescript
// src/routes/sitemap.xml/+server.ts
import { ContentAPIAdapter, getArticleSitemapEntries, generateSitemap } from '@nexifi/mdx-blog/server';

export async function GET() {
  const adapter = new ContentAPIAdapter({ ... });
  const articles = await adapter.getAllArticles();
  const entries = getArticleSitemapEntries(articles, 'https://example.com', '/blog');
  const xml = generateSitemap(entries);
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
```

---

## Design System Integration

### shadcn/ui

Wrap blog components with shadcn/ui components:
```tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
```

### Tailwind CSS Dark Mode

If your project supports dark mode, override Tailwind classes:
```css
/* Use dark: variants */
.prose { @apply dark:prose-invert; }
```

All package components use Tailwind utility classes that support `dark:` variants.
