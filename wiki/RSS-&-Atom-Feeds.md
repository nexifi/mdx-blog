# RSS & Atom Feeds

Generate RSS 2.0 and Atom 1.0 feeds for your blog articles.

## Import

```typescript
import { generateRSSFeed, generateAtomFeed } from '@nexifi/mdx-blog/server';
import type { RSSConfig, AtomConfig } from '@nexifi/mdx-blog';
```

---

## generateRSSFeed(articles, config)

Generates an RSS 2.0 feed XML string.

### RSSConfig

```typescript
interface RSSConfig {
  title: string;        // Feed title
  description: string;  // Feed description
  siteUrl: string;      // Site base URL
  blogPath: string;     // Blog base path
  language?: string;    // Default: 'fr'
  copyright?: string;   // Copyright notice
  managingEditor?: string;
  webMaster?: string;
  ttl?: number;         // Time-to-live in minutes (default: 60)
  imageUrl?: string;    // Feed image URL
}
```

### Example

```typescript
const rssFeed = generateRSSFeed(articles, {
  title: 'getMax Blog',
  description: 'Derniers articles sur le marketing digital',
  siteUrl: 'https://getmax.io',
  blogPath: '/blog',
  language: 'fr',
  copyright: '© 2024 getMax',
});
```

### Output Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>getMax Blog</title>
    <description>Derniers articles sur le marketing digital</description>
    <link>https://getmax.io/blog</link>
    <language>fr</language>
    <item>
      <title>Article Title</title>
      <link>https://getmax.io/blog/article-slug</link>
      <description><![CDATA[Article excerpt...]]></description>
      <pubDate>Mon, 15 Jan 2024 00:00:00 GMT</pubDate>
      <guid isPermaLink="true">https://getmax.io/blog/article-slug</guid>
      <category>Marketing</category>
    </item>
    ...
  </channel>
</rss>
```

---

## generateAtomFeed(articles, config)

Generates an Atom 1.0 feed XML string.

### AtomConfig

```typescript
interface AtomConfig {
  title: string;
  subtitle?: string;
  siteUrl: string;
  blogPath: string;
  authorName?: string;
  authorEmail?: string;
  id?: string;          // Feed ID (defaults to siteUrl)
}
```

### Example

```typescript
const atomFeed = generateAtomFeed(articles, {
  title: 'getMax Blog',
  subtitle: 'Marketing digital & IA',
  siteUrl: 'https://getmax.io',
  blogPath: '/blog',
  authorName: 'getMax Team',
  authorEmail: 'blog@getmax.io',
});
```

### Output Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>getMax Blog</title>
  <subtitle>Marketing digital &amp; IA</subtitle>
  <link href="https://getmax.io/blog" rel="alternate"/>
  <link href="https://getmax.io/blog/atom.xml" rel="self"/>
  <id>https://getmax.io</id>
  <entry>
    <title>Article Title</title>
    <link href="https://getmax.io/blog/article-slug"/>
    <id>https://getmax.io/blog/article-slug</id>
    <published>2024-01-15T00:00:00Z</published>
    <summary><![CDATA[Article excerpt...]]></summary>
    <category term="Marketing"/>
  </entry>
  ...
</feed>
```

---

## Framework Integration

### Next.js App Router

```typescript
// app/blog/rss.xml/route.ts
import { ContentAPIAdapter, generateRSSFeed } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET() {
  const articles = await adapter.getAllArticles();

  const rss = generateRSSFeed(articles, {
    title: 'getMax Blog',
    description: 'Les derniers articles de getMax',
    siteUrl: 'https://getmax.io',
    blogPath: '/blog',
    language: 'fr',
  });

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
```

```typescript
// app/blog/atom.xml/route.ts
import { ContentAPIAdapter, generateAtomFeed } from '@nexifi/mdx-blog/server';

const adapter = new ContentAPIAdapter({
  apiKey: process.env.CONTENT_API_KEY!,
  baseUrl: process.env.CONTENT_API_URL,
});

export async function GET() {
  const articles = await adapter.getAllArticles();

  const atom = generateAtomFeed(articles, {
    title: 'getMax Blog',
    subtitle: 'Marketing digital & IA',
    siteUrl: 'https://getmax.io',
    blogPath: '/blog',
    authorName: 'getMax',
  });

  return new Response(atom, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
```

### Add Feed Discovery Links

Add feed discovery `<link>` tags to your HTML `<head>`:

```html
<link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/blog/rss.xml" />
<link rel="alternate" type="application/atom+xml" title="Atom Feed" href="/blog/atom.xml" />
```

---

## Security

All feed content is properly escaped:
- Article titles and descriptions use `<![CDATA[...]]>` sections
- XML special characters (`&`, `<`, `>`, `"`, `'`) are escaped via `escapeXml()`
- No raw HTML is included in feed entries
