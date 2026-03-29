# MDX Rendering

Components for rendering MDX content with custom styling and interactive widgets.

## Import

```typescript
import {
  BlogArticlePage,
  MDXProvider,
  ArticleCTA,
  Alert,
  createGetStaticPaths,
  createGetStaticProps,
} from '@nexifi/mdx-blog/mdx';
```

> **ESM only** — The `@nexifi/mdx-blog/mdx` entry point requires ESM. CJS `require()` is not supported.

---

## MDXProvider

Provides custom component mappings for MDX content rendering. Styles standard HTML elements (headings, paragraphs, links, code blocks, etc.) and provides the 7 MDX widgets.

### Component Mappings

| MDX Element | Styled As |
|-------------|-----------|
| `h1` | Large bold heading with margin |
| `h2` | Medium bold heading with margin |
| `h3` | Small bold heading with margin |
| `p` | Paragraph with gray text and line height |
| `a` | Blue link with underline on hover |
| `ul` / `ol` | Styled lists with spacing |
| `blockquote` | Blue left-border with italic text |
| `code` | Inline code with gray background |
| `pre` | Code block with dark background and overflow scroll |
| `img` | Full-width image with rounded corners |
| `table` | Full-width bordered table |
| `hr` | Styled horizontal rule |

### Available Widgets in MDX

All 7 widgets are automatically available inside MDX content:

- `<Newsletter />`
- `<TableOfContents />`
- `<AuthorBio />`
- `<ProductCard />`
- `<RelatedPosts />`
- `<StatsBox />`
- `<FeatureList />`

### Usage

```tsx
import { MDXProvider } from '@nexifi/mdx-blog/mdx';
import { MDXRemote } from 'next-mdx-remote';

function ArticleContent({ mdxSource }) {
  return (
    <MDXProvider>
      <MDXRemote {...mdxSource} />
    </MDXProvider>
  );
}
```

---

## ArticleCTA

A call-to-action banner component for embedding in articles.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **required** | CTA heading |
| `description` | `string` | — | CTA description |
| `buttonText` | `string` | **required** | Button label |
| `buttonUrl` | `string` | **required** | Button link URL |
| `variant` | `"blue" \| "green" \| "purple"` | `"blue"` | Color scheme |

### Example

```tsx
<ArticleCTA
  title="Ready to get started?"
  description="Try getMax free for 14 days."
  buttonText="Start Free Trial"
  buttonUrl="https://getmax.io/signup"
  variant="blue"
/>
```

### In MDX Content

```mdx
## Conclusion

That's everything you need to know about SEO optimization.

<ArticleCTA
  title="Boost your SEO with getMax"
  description="Our AI handles your SEO 24/7."
  buttonText="Try for free"
  buttonUrl="https://getmax.io/signup"
  variant="green"
/>
```

---

## Alert

An alert/notification banner for embedding in articles.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `"info" \| "warning" \| "success" \| "error"` | `"info"` | Alert type (controls color) |
| `title` | `string` | — | Alert heading |
| `children` | `ReactNode` | **required** | Alert content |

### Color Scheme

| Type | Colors |
|------|--------|
| `info` | Blue background, blue border |
| `warning` | Yellow background, yellow border |
| `success` | Green background, green border |
| `error` | Red background, red border |

### Example

```tsx
<Alert type="warning" title="Important">
  Make sure to back up your data before proceeding.
</Alert>
```

### In MDX Content

```mdx
<Alert type="info" title="Tip">
  You can combine multiple widgets in a single article for maximum engagement.
</Alert>

<Alert type="warning">
  This feature requires Next.js 14 or later.
</Alert>
```

---

## BlogArticlePage

See [[SSG Factories]] for complete documentation of the `BlogArticlePage` component and its companion `createGetStaticPaths` / `createGetStaticProps` factories.

---

## Custom MDX Components

You can extend the default component mappings by wrapping `MDXProvider`:

```tsx
import { MDXProvider } from '@nexifi/mdx-blog/mdx';
import { MDXRemote } from 'next-mdx-remote';

const customComponents = {
  // Override or add components
  YouTube: ({ id }) => (
    <iframe
      src={`https://www.youtube.com/embed/${id}`}
      className="w-full aspect-video rounded-lg"
      allowFullScreen
    />
  ),
  Tweet: ({ id }) => (
    <div className="flex justify-center">
      <blockquote className="twitter-tweet"><a href={`https://twitter.com/x/status/${id}`}></a></blockquote>
    </div>
  ),
};

function ArticleContent({ mdxSource }) {
  return (
    <MDXProvider components={customComponents}>
      <MDXRemote {...mdxSource} components={customComponents} />
    </MDXProvider>
  );
}
```
