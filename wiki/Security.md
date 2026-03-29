# Security

`@nexifi/mdx-blog` includes built-in security measures to protect against common web vulnerabilities.

## Import

```typescript
import { sanitizeSlug, fetchWithTimeout, safeJsonLd, escapeXml } from '@nexifi/mdx-blog';
// Also available from:
import { sanitizeSlug, fetchWithTimeout, safeJsonLd, escapeXml } from '@nexifi/mdx-blog/server';
```

---

## safeJsonLd(data)

Safely serializes data for use in `<script type="application/ld+json">` tags. Prevents XSS attacks by escaping dangerous sequences.

### Escapes

| Pattern | Replacement | Reason |
|---------|-------------|--------|
| `</` | `<\/` | Prevents `</script>` injection |
| `<!--` | `<\!--` | Prevents HTML comment injection |
| `-->` | `--\>` | Prevents HTML comment close injection |
| `\u2028` | `\\u2028` | Unicode line separator |
| `\u2029` | `\\u2029` | Unicode paragraph separator |

### Usage

```tsx
import { safeJsonLd } from '@nexifi/mdx-blog';

const jsonLd = safeJsonLd({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: article.title,
  description: article.excerpt,
});

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: jsonLd }}
/>
```

> **Note**: The `ArticleSchema` and `BlogListSchema` components already use `safeJsonLd` internally.

---

## sanitizeSlug(slug)

Validates and sanitizes a URL slug parameter. Prevents path traversal and injection attacks.

### Rules

- Must be a non-empty string
- Cannot contain `..`, `/`, or `\` (path traversal)
- Must match: `^[a-zA-Z0-9][a-zA-Z0-9_-]*$`
- Only alphanumeric characters, hyphens, and underscores allowed
- Must start with an alphanumeric character

### Valid Slugs

```typescript
sanitizeSlug('my-article');        // → 'my-article'
sanitizeSlug('article_123');       // → 'article_123'
sanitizeSlug('My-Article-2024');   // → 'My-Article-2024'
```

### Invalid Slugs (throws Error)

```typescript
sanitizeSlug('');                  // Error: Slug must be a non-empty string
sanitizeSlug('../etc/passwd');     // Error: contains path traversal characters
sanitizeSlug('my/article');        // Error: contains path traversal characters
sanitizeSlug('-invalid');          // Error: contains invalid characters
sanitizeSlug('hello world');       // Error: contains invalid characters
```

### Where It's Used

`sanitizeSlug` is automatically called by:
- `BlogApiClient.getArticle(slug)`
- `ContentAPIAdapter.getArticleBySlug(slug)`

---

## fetchWithTimeout(url, options?, timeoutMs?)

Wraps `fetch()` with an AbortController-based timeout.

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `string` | — | Request URL |
| `options` | `RequestInit` | `{}` | Standard fetch options |
| `timeoutMs` | `number` | `10000` | Timeout in milliseconds |

### Behavior

- Creates an `AbortController` with a timeout
- If the request takes longer than `timeoutMs`, aborts and throws `"Request timed out after Xms"`
- Otherwise returns the normal `Response`
- Always cleans up the timeout in `finally`

### Example

```typescript
try {
  const response = await fetchWithTimeout('https://api.example.com/data', {}, 5000);
  const data = await response.json();
} catch (error) {
  if (error.message.includes('timed out')) {
    console.log('Request was too slow');
  }
}
```

---

## escapeXml(str)

Escapes XML special characters. Used in sitemap and RSS/Atom generation.

### Escapes

| Character | Replacement |
|-----------|-------------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&apos;` |

### Example

```typescript
import { escapeXml } from '@nexifi/mdx-blog';

escapeXml('Tom & Jerry');  // → 'Tom &amp; Jerry'
escapeXml('<script>');     // → '&lt;script&gt;'
```

---

## ContentAPIAdapter Browser Guard

`ContentAPIAdapter` checks for `window` at instantiation and **throws an error** if it detects a browser environment. This prevents accidental exposure of API keys in client-side code.

```typescript
// ❌ This will throw in the browser:
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';
const adapter = new ContentAPIAdapter({ apiKey: 'ak_...' });
// Error: ContentAPIAdapter cannot be used in the browser

// ✅ Only use in API routes, loaders, getServerSideProps, etc.
```

---

## API Key Validation

The `ContentAPIAdapter` validates API key format on instantiation:

```typescript
// ✅ Valid formats:
new ContentAPIAdapter({ apiKey: 'ak_xxxxxxxxxxxxx' });
new ContentAPIAdapter({ apiKey: 'cm_live_xxxxx' });
new ContentAPIAdapter({ apiKey: 'cm_test_xxxxx' });

// ❌ Invalid format — throws Error:
new ContentAPIAdapter({ apiKey: 'invalid_key' });
```

---

## Security Checklist

- [ ] API keys are in environment variables, not in client code
- [ ] `ContentAPIAdapter` is only used in API routes / server code
- [ ] `BlogProvider` uses local API routes (e.g., `/api/blog`), not the external API
- [ ] Tailwind content paths don't expose sensitive files
- [ ] JSON-LD output uses `safeJsonLd()` (automatic with schema components)
- [ ] Slugs are sanitized before API calls (automatic with hooks)
- [ ] RSS/Atom content is properly escaped (automatic)
