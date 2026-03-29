# llms.txt

Generate `llms.txt` and `llms-full.txt` files following the [llmstxt.org](https://llmstxt.org) standard. These files help AI assistants (ChatGPT, Claude, Perplexity, etc.) understand your site's content and structure.

## Import

```typescript
import { generateLlmsTxt } from '@nexifi/mdx-blog/server';
import type { LlmsConfig } from '@nexifi/mdx-blog';
```

---

## LlmsConfig

```typescript
interface LlmsConfig {
  name: string;                // Site or company name
  description: string;          // Short description
  contact?: {
    email?: string;
    url?: string;
  };
  services?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
}
```

---

## generateLlmsTxt(config, articles, siteUrl, blogPath)

Returns both `llms.txt` (summary) and `llms-full.txt` (detailed) content.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `LlmsConfig` | Site information |
| `articles` | `Article[]` | Published articles |
| `siteUrl` | `string` | Site base URL |
| `blogPath` | `string` | Blog base path |

### Returns

```typescript
{
  llmsTxt: string;      // Summary version
  llmsFullTxt: string;  // Detailed version with article content
}
```

---

## Framework Integration

### Next.js App Router

```typescript
// app/llms.txt/route.ts
import { ContentAPIAdapter, generateLlmsTxt } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET() {
  const articles = await adapter.getAllArticles();

  const { llmsTxt } = generateLlmsTxt(
    {
      name: 'getMax',
      description: 'AI-powered marketing operating system.',
      contact: { email: 'hello@getmax.io', url: 'https://getmax.io' },
      services: [
        {
          title: 'Site Web',
          url: 'https://getmax.io/site',
          description: 'Création de sites web optimisés.',
        },
        {
          title: 'SEO',
          url: 'https://getmax.io/seo',
          description: 'Référencement naturel automatisé.',
        },
      ],
    },
    articles,
    'https://getmax.io',
    '/blog',
  );

  return new Response(llmsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
```

```typescript
// app/llms-full.txt/route.ts
import { ContentAPIAdapter, generateLlmsTxt } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET() {
  const articles = await adapter.getAllArticles();

  const { llmsFullTxt } = generateLlmsTxt(
    {
      name: 'getMax',
      description: 'AI-powered marketing operating system.',
    },
    articles,
    'https://getmax.io',
    '/blog',
  );

  return new Response(llmsFullTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
```

### Next.js Pages Router

```tsx
// pages/llms.txt.tsx
import { LlmsPage, createLlmsServerSideProps } from '@nexifi/mdx-blog/server';

export default LlmsPage;

export const getServerSideProps = createLlmsServerSideProps({
  siteUrl: 'https://getmax.io',
  blogPath: '/blog',
  llmsConfig: {
    name: 'getMax',
    description: 'AI-powered marketing operating system.',
    contact: { email: 'hello@getmax.io' },
    services: [
      {
        title: 'Site Web',
        url: 'https://getmax.io/site',
        description: 'Création de sites web optimisés.',
      },
    ],
  },
});
```

```tsx
// pages/llms-full.txt.tsx  — same, add `full: true`
import { LlmsPage, createLlmsServerSideProps } from '@nexifi/mdx-blog/server';

export default LlmsPage;

export const getServerSideProps = createLlmsServerSideProps({
  siteUrl: 'https://getmax.io',
  blogPath: '/blog',
  full: true, // ← generates llms-full.txt content
  llmsConfig: {
    name: 'getMax',
    description: 'AI-powered marketing operating system.',
  },
});
```

---

## Output Example

### llms.txt

```
# getMax

> AI-powered marketing operating system.

## Contact
- Email: hello@getmax.io
- URL: https://getmax.io

## Services
- [Site Web](https://getmax.io/site): Création de sites web optimisés.
- [SEO](https://getmax.io/seo): Référencement naturel automatisé.

## Blog Articles
- [How to Optimize SEO](https://getmax.io/blog/optimize-seo): Learn the best practices...
- [Marketing Automation Guide](https://getmax.io/blog/marketing-automation): Complete guide to...
```

### llms-full.txt

Same as `llms.txt` but includes the full article content (stripped of HTML) for each blog post.

---

## Caching

Recommended `Cache-Control` for llms.txt:

```
public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400
```

This caches for 24 hours, which is appropriate since llms.txt content changes infrequently.
