# Components

Pre-built React components for rendering blog pages.

## Import

```tsx
import {
  BlogListPage,
  ArticleLayout,
  ArticlePlaceholder,
  getIconForCategory,
} from '@nexifi/mdx-blog';
```

---

## BlogListPage

A complete, responsive blog listing page with category filtering, pagination, loading states, and error handling.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"Blog"` | Page heading |
| `subtitle` | `string` | From labels | Subtitle below heading |
| `blogPath` | `string` | `"/blog"` | Base URL for article links |
| `perPage` | `number` | `9` | Articles per page |
| `showCategories` | `boolean` | `true` | Show category filter buttons |
| `emptyMessage` | `string` | From labels | Message when no articles found |
| `loadingMessage` | `string` | From labels | Loading indicator text |
| `renderError` | `(error: Error) => ReactNode` | Built-in | Custom error renderer |
| `ImageComponent` | `React.ComponentType` | `<img>` | Custom image component (e.g., `next/image`) |
| `siteUrl` | `string` | — | Site URL for resolving relative image paths |

### Features

- **Responsive grid**: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
- **Category filtering**: Pill buttons extracted from articles
- **Pagination**: Page numbers with ellipsis, previous/next buttons
- **Loading skeleton**: Animated spinner
- **Error state**: Built-in error display or custom via `renderError`
- **Image fallback**: `ArticlePlaceholder` when no image available

### Example

```tsx
import { BlogListPage } from '@nexifi/mdx-blog';

export default function BlogPage() {
  return (
    <BlogListPage
      title="Our Blog"
      subtitle="Latest articles and insights"
      blogPath="/blog"
      perPage={12}
      showCategories={true}
    />
  );
}
```

---

## ArticleLayout

A complete article page layout with hero image, author info, share buttons, tags, breadcrumb, and related articles section.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `article` | `Article` | **required** | The article to display |
| `relatedArticles` | `Article[]` | `[]` | Related articles to show |
| `children` | `ReactNode` | **required** | Article content (HTML/MDX) |
| `siteTitle` | `string` | `""` | Site title for breadcrumb |
| `blogPath` | `string` | `"/blog"` | Base blog URL |
| `homePath` | `string` | `"/"` | Home page URL |
| `showBreadcrumb` | `boolean` | `true` | Show breadcrumb navigation |
| `showBackButton` | `boolean` | `true` | Show "Back to blog" link |
| `showShareButtons` | `boolean` | `true` | Show social share buttons |
| `showTags` | `boolean` | `true` | Show article tags |
| `showRelatedArticles` | `boolean` | `true` | Show related articles section |
| `ImageComponent` | `React.ComponentType` | `<img>` | Custom image component |
| `siteUrl` | `string` | — | Site URL for image resolution |

### Layout Structure

```
┌─────────────────────────────────────────┐
│ Breadcrumb: Home / Blog / Article Title │
│ ← Back to blog                          │
├─────────────────────────────────────────┤
│                                         │
│            Hero Image                   │
│                            [Category]   │
│                                         │
├─────────────────────────────────────────┤
│ 📅 Date • 5 min read                   │
│                                         │
│ Article Title (h1)                      │
│                                         │
│ Article excerpt                         │
│                                         │
│ 👤 Author Name                         │
│    Author Title                         │
│─────────────────────────────────────────│
│ Share: 📘 🐦 💼 💬 📧                   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │       Article Content (children)    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Tags: tag1  tag2  tag3                  │
├─────────────────────────────────────────┤
│ Related Articles                        │
│ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │ Card 1 │ │ Card 2 │ │ Card 3 │      │
│ └────────┘ └────────┘ └────────┘      │
└─────────────────────────────────────────┘
```

### Share Buttons

Built-in share links for:
- Facebook
- Twitter/X
- LinkedIn
- WhatsApp
- Email

### Example

```tsx
import { ArticleLayout } from '@nexifi/mdx-blog';

<ArticleLayout
  article={article}
  relatedArticles={related}
  blogPath="/blog"
  showShareButtons={true}
>
  <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
</ArticleLayout>
```

---

## ArticlePlaceholder

A gradient placeholder shown when an article has no featured image.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `category` | `string` | Category name (determines gradient colors) |
| `title` | `string` | Article title displayed on the placeholder |
| `icon` | `ReactNode` | Icon to display (use `getIconForCategory()`) |

### getIconForCategory(category)

Maps category names to SVG icons:

| Category | Icon |
|----------|------|
| `SEO` | 🔍 Search icon |
| `Marketing` | 📢 Megaphone icon |
| `Technologie` | 💻 Code icon |
| `Business` | 💼 Briefcase icon |
| `Design` | 🎨 Palette icon |
| `Guide` | 📖 Book icon |
| Default | 📄 Document icon |

### Example

```tsx
import { ArticlePlaceholder, getIconForCategory } from '@nexifi/mdx-blog';

<ArticlePlaceholder
  category="SEO"
  title="How to Optimize Your Blog"
  icon={getIconForCategory('SEO')}
/>
```
