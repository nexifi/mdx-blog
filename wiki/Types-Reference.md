# Types Reference

Complete TypeScript type definitions exported by `@nexifi/mdx-blog`.

---

## Core Types

### Article

The main article type used throughout the package.

```typescript
interface Article extends ArticleMetadata {
  slug: string;
  content?: string;
}
```

### ArticleMetadata

Metadata for an article (without slug and content).

```typescript
interface ArticleMetadata {
  title: string;
  date: string;                    // ISO date string
  category: string;
  excerpt?: string;
  author?: string;
  authorTitle?: string;
  authorImage?: string;
  image?: string;
  imageWidth?: number;             // Explicit width (px) for OG/JSON-LD
  imageHeight?: number;            // Explicit height (px) for OG/JSON-LD
  imageBlurDataURL?: string;       // Base64 blur placeholder
  tags?: string[];
  readTime?: number;               // Minutes
  published?: boolean;
  status?: string;                 // 'published', 'ready', 'draft', etc.
}
```

---

## API Configuration

### BlogApiConfig

Configuration for `BlogApiClient` (client-side) and `BlogProvider`.

```typescript
interface BlogApiConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  endpoints?: {
    articles?: string;               // Default: '/articles'
    article?: string;                // Default: '/articles/:slug'
    categories?: string;             // Default: '/articles/categories'
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
  timeout?: number;                  // Default: 10000 (ms)
}
```

### ContentAPIConfig

Configuration for `ContentAPIAdapter` (server-side).

```typescript
interface ContentAPIConfig {
  apiKey: string;                    // ak_xxx, cm_live_xxx, or cm_test_xxx
  baseUrl?: string;                  // Default: 'https://api-growthos.nexifi.com'
  timeout?: number;                  // Default: 10000 (ms)
  defaultAuthor?: string;            // Default: 'Author'
}
```

---

## Pagination

### PaginationOptions

```typescript
interface PaginationOptions {
  page?: number;
  perPage?: number;
  category?: string | null;
}
```

### PaginatedResult

```typescript
interface PaginatedResult<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

---

## SEO Types

### SEOConfig

Used by `ArticleHead` and `BlogListHead`.

```typescript
interface SEOConfig {
  siteUrl: string;
  siteName: string;
  blogPath: string;
  locale?: string;                   // Default: 'fr_FR'
  twitterHandle?: string;
}
```

### SchemaConfig

Used by `ArticleSchema` and `BlogListSchema`.

```typescript
interface SchemaConfig {
  siteUrl: string;
  siteName: string;
  blogPath: string;
}
```

---

## Sitemap Types

### SitemapConfig

```typescript
interface SitemapConfig {
  // Configuration options for sitemap generation
}
```

### SitemapEntry

```typescript
interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: ChangeFrequency;
  priority?: number;                 // 0.0 to 1.0
  images?: SitemapImage[];
}
```

### SitemapImage

```typescript
interface SitemapImage {
  url: string;
  title?: string;
  caption?: string;
}
```

### ChangeFrequency

```typescript
type ChangeFrequency = 
  | 'always' 
  | 'hourly' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'yearly' 
  | 'never';
```

---

## Feed Types

### RSSConfig

```typescript
interface RSSConfig {
  title: string;
  description: string;
  siteUrl: string;
  blogPath: string;
  language?: string;
  copyright?: string;
  managingEditor?: string;
  webMaster?: string;
  ttl?: number;
  imageUrl?: string;
}
```

### AtomConfig

```typescript
interface AtomConfig {
  title: string;
  subtitle?: string;
  siteUrl: string;
  blogPath: string;
  authorName?: string;
  authorEmail?: string;
  id?: string;
}
```

---

## Image Types

### BlogImageProps

```typescript
interface BlogImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  siteUrl?: string;
  as?: React.ComponentType<any>;
  sizes?: string;
}
```

### ImageSource / ImageLoader

```typescript
type ImageSource = string;

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

type ImageLoader = (params: ImageLoaderParams) => string;
```

---

## Static Generation Types

### StaticSitemapConfig

```typescript
interface StaticSitemapConfig {
  siteUrl: string;
  blogPath: string;
  outputDir: string;
  adapter: ContentAPIAdapter;
  additionalPages?: SitemapEntry[];
}
```

### BuildTimeSEOConfig

```typescript
interface BuildTimeSEOConfig extends StaticSitemapConfig {
  rssConfig?: RSSConfig;
  atomConfig?: AtomConfig;
  llmsConfig?: LlmsConfig;
}
```

### LlmsConfig

```typescript
interface LlmsConfig {
  name: string;
  description: string;
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

## i18n Types

### Labels

See [[Internationalization]] for the complete `Labels` interface.

---

## Page Config Types (Pages Router)

### SitemapPageConfig

```typescript
interface SitemapPageConfig {
  siteUrl: string;
  blogPath: string;
  apiKey: string;
  apiUrl: string;
  additionalPages?: SitemapEntry[];
}
```

### RobotsPageConfig

```typescript
interface RobotsPageConfig {
  siteUrl: string;
  sitemapUrl?: string;
  disallowPaths?: string[];
}
```

### LlmsPageConfig

```typescript
interface LlmsPageConfig {
  siteUrl: string;
  blogPath: string;
  full?: boolean;
  llmsConfig: LlmsConfig;
}
```

---

## Validation

### ValidationError

```typescript
interface ValidationError {
  field: string;
  message: string;
}
```

### ArticleMetadataSchema

Runtime validation schema (no Zod dependency):

```typescript
const ArticleMetadataSchema = {
  parse: (data: any) => ArticleMetadata;       // Lenient, fills defaults
  validate: (data: any) => {                    // Strict, returns errors
    valid: boolean;
    errors: ValidationError[];
    data: ArticleMetadata;
  };
};
```
