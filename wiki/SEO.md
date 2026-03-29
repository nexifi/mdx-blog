# SEO

`@nexifi/mdx-blog` provides comprehensive SEO support including JSON-LD structured data, Open Graph meta tags, and Twitter Cards.

## Import

```tsx
import {
  ArticleHead,
  BlogListHead,
  ArticleSchema,
  BlogListSchema,
} from '@nexifi/mdx-blog';

import type { SEOConfig, SchemaConfig } from '@nexifi/mdx-blog';
```

---

## SEO Config

Both head and schema components require a config object:

```typescript
interface SEOConfig {
  siteUrl: string;      // e.g., 'https://getmax.io'
  siteName: string;     // e.g., 'getMax'
  blogPath: string;     // e.g., '/blog'
  locale?: string;      // e.g., 'fr_FR' (default: 'fr_FR')
  twitterHandle?: string; // e.g., '@getmax'
}
```

---

## ArticleHead

Renders `<meta>` tags for a single article page. Includes Open Graph, Twitter Card, and article-specific metadata.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `article` | `Article` | The article to generate meta for |
| `config` | `SEOConfig` | SEO configuration |

### Generated Tags

- `<title>`
- `<meta name="description">`
- `<meta property="og:title">`
- `<meta property="og:description">`
- `<meta property="og:url">`
- `<meta property="og:image">`
- `<meta property="og:image:width">`
- `<meta property="og:image:height">`
- `<meta property="og:type" content="article">`
- `<meta property="og:site_name">`
- `<meta property="og:locale">`
- `<meta property="article:published_time">`
- `<meta property="article:author">`
- `<meta property="article:section">`
- `<meta property="article:tag">` (one per tag)
- `<meta name="twitter:card" content="summary_large_image">`
- `<meta name="twitter:title">`
- `<meta name="twitter:description">`
- `<meta name="twitter:image">`
- `<link rel="canonical">`

### Example

```tsx
import { ArticleHead } from '@nexifi/mdx-blog';

<ArticleHead
  article={article}
  config={{
    siteUrl: 'https://getmax.io',
    siteName: 'getMax',
    blogPath: '/blog',
    locale: 'fr_FR',
    twitterHandle: '@getmax',
  }}
/>
```

---

## BlogListHead

Renders `<meta>` tags for the blog listing page.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `config` | `SEOConfig` | SEO configuration |
| `title` | `string` | Page title |
| `description` | `string` | Page description |

### Example

```tsx
import { BlogListHead } from '@nexifi/mdx-blog';

<BlogListHead
  config={{
    siteUrl: 'https://getmax.io',
    siteName: 'getMax',
    blogPath: '/blog',
  }}
  title="Blog"
  description="Découvrez nos derniers articles"
/>
```

---

## ArticleSchema

Renders JSON-LD structured data for an article page (`Article` schema type).

### Props

| Prop | Type | Description |
|------|------|-------------|
| `article` | `Article` | The article |
| `config` | `SchemaConfig` | Schema configuration |

### Generated Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "description": "Article excerpt...",
  "image": {
    "@type": "ImageObject",
    "url": "https://example.com/image.jpg",
    "width": 1200,
    "height": 630
  },
  "datePublished": "2024-01-15",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Site Name"
  },
  "mainEntityOfPage": "https://example.com/blog/article-slug",
  "articleSection": "Category"
}
```

### Example

```tsx
import { ArticleSchema } from '@nexifi/mdx-blog';

<ArticleSchema
  article={article}
  config={{
    siteUrl: 'https://getmax.io',
    siteName: 'getMax',
    blogPath: '/blog',
  }}
/>
```

---

## BlogListSchema

Renders JSON-LD structured data for the blog listing page (`ItemList` schema type).

### Props

| Prop | Type | Description |
|------|------|-------------|
| `articles` | `Article[]` | List of articles |
| `config` | `SchemaConfig` | Schema configuration |

### Generated Schema

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://example.com/blog/article-slug",
      "name": "Article Title"
    }
  ]
}
```

### Example

```tsx
import { BlogListSchema } from '@nexifi/mdx-blog';

<BlogListSchema
  articles={articles}
  config={{
    siteUrl: 'https://getmax.io',
    siteName: 'getMax',
    blogPath: '/blog',
  }}
/>
```

---

## Security

All JSON-LD output is XSS-safe. The `safeJsonLd()` utility escapes `</script>` sequences, HTML comments, and Unicode line/paragraph separators to prevent injection attacks.

```typescript
import { safeJsonLd } from '@nexifi/mdx-blog';

const jsonLd = safeJsonLd({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: article.title,
  // ...
});

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: jsonLd }}
/>
```

## Complete Article Page with SEO

```tsx
'use client';
import {
  useArticle,
  ArticleLayout,
  ArticleHead,
  ArticleSchema,
} from '@nexifi/mdx-blog';

const seoConfig = {
  siteUrl: 'https://getmax.io',
  siteName: 'getMax',
  blogPath: '/blog',
  locale: 'fr_FR',
};

export default function ArticlePage({ slug }: { slug: string }) {
  const { article, isLoading } = useArticle(slug);

  if (isLoading) return <div>Loading...</div>;
  if (!article) return <div>Not found</div>;

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
