# SSG Factories

Static Site Generation (SSG) factories for **Next.js Pages Router**. These provide zero-config static generation for blog pages.

## Import

```typescript
import {
  BlogArticlePage,
  createGetStaticPaths,
  createGetStaticProps,
} from '@nexifi/mdx-blog/mdx';
```

> **Note**: These are only available from the `@nexifi/mdx-blog/mdx` entry point (ESM only). Requires `next-mdx-remote`, `@mdx-js/react`, `remark-gfm`, and `rehype-highlight` as dependencies.

---

## createGetStaticPaths(config)

Creates a `getStaticPaths` function that fetches all article slugs for static generation.

### Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `articlesEndpoint` | `string` | `'/api/blog'` | API endpoint to fetch articles |
| `fallback` | `boolean \| 'blocking'` | `'blocking'` | Next.js fallback behavior |

### Example

```typescript
export const getStaticPaths = createGetStaticPaths({
  articlesEndpoint: '/api/blog',
  fallback: 'blocking',
});
```

### Generated Output

```typescript
{
  paths: [
    { params: { slug: 'article-1' } },
    { params: { slug: 'article-2' } },
    // ...
  ],
  fallback: 'blocking',
}
```

---

## createGetStaticProps(config)

Creates a `getStaticProps` function that fetches article data and serializes MDX content.

### Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `articlesEndpoint` | `string` | `'/api/blog'` | Endpoint for article list |
| `articleEndpoint` | `string` | `'/api/blog/:slug'` | Endpoint for single article |
| `revalidateSeconds` | `number` | `3600` | ISR revalidation period |
| `relatedCount` | `number` | `3` | Number of related articles |

### Example

```typescript
export const getStaticProps = createGetStaticProps({
  articlesEndpoint: '/api/blog',
  articleEndpoint: '/api/blog/:slug',
  revalidateSeconds: 3600,  // Revalidate every hour
  relatedCount: 3,
});
```

### Generated Output

```typescript
{
  props: {
    article: { /* Article data */ },
    mdxSource: { /* Serialized MDX */ },
    relatedArticles: [ /* Related articles */ ],
  },
  revalidate: 3600,
}
```

---

## BlogArticlePage

A complete article page component that renders MDX content with layout, SEO, and related articles.

### Usage

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

// That's it! BlogArticlePage handles everything:
// - Article layout with hero image
// - MDX content rendering with custom components
// - JSON-LD structured data
// - Meta tags
// - Related articles section
export default BlogArticlePage;
```

### What BlogArticlePage Includes

- `ArticleLayout` — Full article layout with breadcrumb, hero, author, share buttons
- `ArticleHead` — OG/Twitter meta tags
- `ArticleSchema` — JSON-LD structured data
- MDX rendering via `next-mdx-remote`
- All 7 MDX widgets available in content
- Related articles section

---

## Complete Pages Router Setup

### Blog List Page

```tsx
// pages/blog/index.tsx
import { BlogListPage, BlogListHead, BlogListSchema } from '@nexifi/mdx-blog';

export default function BlogPage() {
  return (
    <>
      <BlogListHead
        config={{ siteUrl: 'https://example.com', siteName: 'My Site', blogPath: '/blog' }}
        title="Blog"
        description="Our latest articles"
      />
      <BlogListSchema
        config={{ siteUrl: 'https://example.com', siteName: 'My Site', blogPath: '/blog' }}
        articles={[]}
      />
      <BlogListPage title="Blog" blogPath="/blog" perPage={9} />
    </>
  );
}
```

### Blog Article Page

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

### API Routes

```typescript
// pages/api/blog/index.ts
// pages/api/blog/[slug].ts
// (See [[API Routes]] for full examples)
```

### Provider

```tsx
// pages/_app.tsx
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
