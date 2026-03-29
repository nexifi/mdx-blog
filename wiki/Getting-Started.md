# Getting Started

This guide walks you through adding `@nexifi/mdx-blog` to your project in under 10 minutes.

## Prerequisites

- **Node.js** ≥ 18.0.0
- **React** ≥ 17.0.0
- A **ContentMaster API key** (format: `ak_xxx`, `cm_live_xxx`, or `cm_test_xxx`)

## 1. Install the package

```bash
# npm
npm install @nexifi/mdx-blog react react-dom swr

# pnpm
pnpm add @nexifi/mdx-blog react react-dom swr

# yarn
yarn add @nexifi/mdx-blog react react-dom swr
```

## 2. Set environment variables

Create or update your `.env` file:

```env
CONTENT_API_KEY=ak_xxxxxxxxxxxxx
CONTENT_API_URL=https://api-growthos.nexifi.com/api/contentmaster/projects/<PROJECT_ID>/articles
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

## 3. Wrap your app with BlogProvider

The `BlogProvider` must be placed in your **root layout**, not in individual pages.

```tsx
// src/app/layout.tsx (Next.js App Router)
// or pages/_app.tsx (Next.js Pages Router)
// or app/root.tsx (Remix)

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
  }}
>
  {children}
</BlogProvider>
```

> ⚠️ **Common mistake**: Placing `BlogProvider` in a page file instead of the root layout causes the error `"useBlogClient must be used within a BlogProvider"`.

## 4. Create API routes

API routes proxy requests to the ContentMaster API. The `ContentAPIAdapter` handles authentication server-side.

```typescript
// app/api/blog/route.ts (Next.js App Router)
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

## 5. Create the blog list page

```tsx
import { BlogListPage, BlogListHead, BlogListSchema } from '@nexifi/mdx-blog';

export default function BlogPage() {
  return (
    <>
      <BlogListHead
        config={{ siteUrl: 'https://yoursite.com', siteName: 'MySite', blogPath: '/blog' }}
        title="Blog"
        description="Our latest articles"
      />
      <BlogListSchema
        config={{ siteUrl: 'https://yoursite.com', siteName: 'MySite', blogPath: '/blog' }}
        articles={[]}
      />
      <BlogListPage
        title="Blog"
        subtitle="Our latest articles"
        blogPath="/blog"
        perPage={9}
      />
    </>
  );
}
```

## 6. Create the article page

```tsx
'use client';
import { useArticle, ArticleLayout, ArticleHead, ArticleSchema } from '@nexifi/mdx-blog';

export default function ArticlePage({ slug }: { slug: string }) {
  const { article, isLoading, error } = useArticle(slug);

  if (isLoading) return <div>Loading...</div>;
  if (error || !article) return <div>Article not found</div>;

  return (
    <>
      <ArticleHead
        article={article}
        config={{ siteUrl: 'https://yoursite.com', siteName: 'MySite', blogPath: '/blog' }}
      />
      <ArticleSchema
        article={article}
        config={{ siteUrl: 'https://yoursite.com', siteName: 'MySite', blogPath: '/blog' }}
      />
      <ArticleLayout article={article}>
        <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
      </ArticleLayout>
    </>
  );
}
```

## 7. Configure Tailwind CSS

The package uses Tailwind CSS classes. Add the package to your content paths:

**Tailwind v4** (CSS-based config):
```css
@source "../../node_modules/@nexifi/mdx-blog/dist";
```

**Tailwind v3** (JS config):
```js
// tailwind.config.js
content: [
  // ... existing paths
  './node_modules/@nexifi/mdx-blog/**/*.{js,ts,jsx,tsx}',
],
```

## Next Steps

- [[Hooks]] — Learn about all available React hooks
- [[Components]] — Explore pre-built UI components
- [[SEO]] — Add JSON-LD structured data and meta tags
- [[Framework Guides]] — Framework-specific setup instructions
- [[MDX Widgets]] — Add interactive widgets to your articles
