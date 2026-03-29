# BlogProvider

The `BlogProvider` component is the **root configuration layer** for `@nexifi/mdx-blog`. It creates a React context that provides the API client and i18n labels to all descendant components and hooks.

## Import

```tsx
import { BlogProvider, useBlogClient, useLabels } from '@nexifi/mdx-blog';
```

## Usage

```tsx
<BlogProvider
  config={{
    endpoints: {
      articles: '/api/blog',
      article: '/api/blog/:slug',
      categories: '/api/blog/categories',
    },
  }}
  labels={{
    backToBlog: 'Back to blog',
    readMore: 'Read more',
  }}
>
  {children}
</BlogProvider>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `BlogApiConfig` | ✅ | API client configuration |
| `labels` | `Partial<Labels>` | ❌ | Override default i18n labels (French defaults) |
| `children` | `ReactNode` | ✅ | Your application tree |

## BlogApiConfig

```typescript
interface BlogApiConfig {
  baseUrl?: string;                    // Default: '' (relative URLs)
  headers?: Record<string, string>;    // Custom HTTP headers
  endpoints?: {
    articles?: string;                 // Default: '/articles'
    article?: string;                  // Default: '/articles/:slug'
    categories?: string;               // Default: '/articles/categories'
  };
  cache?: {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    dedupingInterval?: number;
    focusThrottleInterval?: number;
  };
  transform?: {
    articles?: (data: any) => Article[];
    article?: (data: any) => Article;
  };
  timeout?: number;                    // Default: 10000 (ms)
}
```

## Placement Rules

### ✅ Correct — Root layout

```tsx
// src/app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// src/app/providers.tsx
'use client';
import { BlogProvider } from '@nexifi/mdx-blog';

export function Providers({ children }) {
  return (
    <BlogProvider config={{ endpoints: { articles: '/api/blog', article: '/api/blog/:slug' } }}>
      {children}
    </BlogProvider>
  );
}
```

### ❌ Wrong — Individual page

```tsx
// src/app/blog/page.tsx — DON'T DO THIS
export default function BlogPage() {
  return (
    <BlogProvider config={...}>
      <BlogListPage />
    </BlogProvider>
  );
}
```

### With i18n (locale-prefixed routes)

For projects like getmax.io with `[locale]` segments:

```tsx
// src/app/[locale]/providers.tsx
'use client';
import { BlogProvider } from '@nexifi/mdx-blog';

export function Providers({ children, labels }) {
  return (
    <BlogProvider
      config={{
        endpoints: {
          articles: '/api/blog',
          article: '/api/blog/:slug',
          categories: '/api/blog/categories',
        },
      }}
      labels={labels}
    >
      {children}
    </BlogProvider>
  );
}
```

```tsx
// src/app/[locale]/layout.tsx
import { Providers } from './providers';

export default function LocaleLayout({ children, params }) {
  const labels = params.locale === 'en'
    ? { backToBlog: 'Back to blog', readMore: 'Read more' }
    : undefined; // French defaults

  return <Providers labels={labels}>{children}</Providers>;
}
```

## Context Hooks

### useBlogClient()

Returns the `BlogApiClient` instance. Throws if used outside `BlogProvider`.

```tsx
import { useBlogClient } from '@nexifi/mdx-blog';

function MyComponent() {
  const client = useBlogClient();
  // Use client.getArticles(), client.getArticle(slug), etc.
}
```

### useLabels()

Returns the merged labels object. Safe to use outside `BlogProvider` (returns French defaults).

```tsx
import { useLabels } from '@nexifi/mdx-blog';

function MyComponent() {
  const labels = useLabels();
  return <button>{labels.readMore}</button>;
}
```

## Performance Notes

- The `BlogApiClient` instance is **memoized** — it only re-creates when the serialized `config` changes.
- Labels are memoized via `React.useMemo`.
- The client uses SWR internally for request deduplication and caching.

## Troubleshooting

### "useBlogClient must be used within a BlogProvider"

This error means a hook or component is rendered outside the `BlogProvider` tree.

**Checklist:**
1. Is `BlogProvider` in the **layout** (not just a page)?
2. Is the providers file marked `'use client'`?
3. Is there a Suspense/Error boundary between `BlogProvider` and the consumer that might break React context?
