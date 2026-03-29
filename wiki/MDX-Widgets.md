# MDX Widgets

7 pre-built widgets you can use inside MDX content or any React page.

## Import

```tsx
import {
  Newsletter,
  TableOfContents,
  AuthorBio,
  ProductCard,
  RelatedPosts,
  StatsBox,
  FeatureList,
} from '@nexifi/mdx-blog';
```

---

## Newsletter

Email subscription form with built-in states (idle, loading, success, error).

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `endpoint` | `string` | — | POST endpoint for subscription |
| `title` | `string` | From labels | Section title |
| `description` | `string` | From labels | Description text |
| `placeholder` | `string` | From labels | Email input placeholder |
| `buttonText` | `string` | From labels | Submit button text |
| `successMessage` | `string` | From labels | Success message after subscribe |

### Example

```tsx
<Newsletter
  endpoint="/api/newsletter"
  title="Stay Updated"
  description="Get our latest articles in your inbox"
  buttonText="Subscribe"
/>
```

### Behavior

1. Shows email input + submit button
2. On submit, POSTs `{ email }` to the endpoint
3. Shows success message on 2xx response
4. Shows error message on failure
5. Validates email format before submission

---

## TableOfContents

Auto-generated table of contents from headings.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `TOCItem[]` | **required** | Heading items |
| `title` | `string` | From labels | Section title |

### TOCItem

```typescript
interface TOCItem {
  id: string;      // HTML id of the heading element
  text: string;    // Heading text
  level: number;   // Heading level (2 = h2, 3 = h3)
}
```

### Example

```tsx
<TableOfContents
  items={[
    { id: 'introduction', text: 'Introduction', level: 2 },
    { id: 'getting-started', text: 'Getting Started', level: 2 },
    { id: 'installation', text: 'Installation', level: 3 },
    { id: 'configuration', text: 'Configuration', level: 3 },
    { id: 'conclusion', text: 'Conclusion', level: 2 },
  ]}
/>
```

### Features

- Nested indentation based on heading level
- Clickable links that smooth-scroll to the heading
- Styled card with border

---

## AuthorBio

Author information card with avatar, name, title, and bio.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | Author name |
| `title` | `string` | — | Author title/role |
| `bio` | `string` | — | Short biography |
| `image` | `string` | — | Avatar image URL |
| `twitter` | `string` | — | Twitter handle (without @) |
| `linkedin` | `string` | — | LinkedIn URL |
| `website` | `string` | — | Personal website URL |

### Example

```tsx
<AuthorBio
  name="Marie Dupont"
  title="Head of Content"
  bio="Marie writes about marketing strategy and SEO."
  image="/images/authors/marie.jpg"
  twitter="mariedupont"
  linkedin="https://linkedin.com/in/mariedupont"
/>
```

---

## ProductCard

Product showcase card with image, description, price, and CTA button.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | Product name |
| `description` | `string` | — | Product description |
| `image` | `string` | — | Product image URL |
| `price` | `string` | — | Price text (e.g., "€49/month") |
| `url` | `string` | — | Product link URL |
| `rating` | `number` | — | Rating (0-5) |
| `reviewCount` | `number` | — | Number of reviews |

### Example

```tsx
<ProductCard
  name="getMax Pro"
  description="AI-powered marketing automation"
  image="/images/products/getmax-pro.jpg"
  price="€79/month"
  url="https://getmax.io/pricing"
  rating={4.8}
  reviewCount={124}
/>
```

### Features

- Star rating display
- Review count
- Hover effects
- CTA button linking to product URL

---

## RelatedPosts

Grid of related article cards.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `posts` | `Article[]` | **required** | Related articles |
| `title` | `string` | From labels | Section title |
| `blogPath` | `string` | `"/blog"` | Base URL for article links |

### Example

```tsx
<RelatedPosts
  posts={relatedArticles}
  title="You might also like"
  blogPath="/blog"
/>
```

---

## StatsBox

Highlight key statistics in a grid.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stats` | `StatItem[]` | **required** | Statistics to display |

### StatItem

```typescript
interface StatItem {
  value: string;    // e.g., "99%", "10K+", "24/7"
  label: string;    // Description
}
```

### Example

```tsx
<StatsBox
  stats={[
    { value: '10K+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' },
    { value: '150+', label: 'Countries' },
  ]}
/>
```

---

## FeatureList

Showcase features with icons, titles, and descriptions.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `features` | `FeatureItem[]` | **required** | Features to display |
| `title` | `string` | From labels | Section title |

### FeatureItem

```typescript
interface FeatureItem {
  title: string;
  description: string;
  icon?: string;     // Emoji or text icon
}
```

### Example

```tsx
<FeatureList
  title="Why Choose Us"
  features={[
    { title: 'Fast', description: 'Sub-second load times', icon: '⚡' },
    { title: 'Secure', description: 'Enterprise-grade security', icon: '🔒' },
    { title: 'Scalable', description: 'Grows with your traffic', icon: '📈' },
  ]}
/>
```

---

## Using Widgets in MDX

When using the `MDXProvider` from `@nexifi/mdx-blog/mdx`, widgets are automatically available in your MDX content:

```mdx
# My Article

Some introductory text.

<TableOfContents items={[
  { id: 'section-1', text: 'Section 1', level: 2 },
  { id: 'section-2', text: 'Section 2', level: 2 },
]} />

## Section 1

Content here...

<StatsBox stats={[
  { value: '99%', label: 'Satisfaction' },
  { value: '50+', label: 'Integrations' },
]} />

## Section 2

More content...

<Newsletter endpoint="/api/subscribe" />
```
