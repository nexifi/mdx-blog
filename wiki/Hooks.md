# Hooks

All hooks require `BlogProvider` in the component tree. They use [SWR](https://swr.vercel.app/) for caching, deduplication, and revalidation.

## Import

```tsx
import {
  useArticles,
  useArticle,
  useCategories,
  useRelatedArticles,
  usePagination,
  useArticlesByTag,
  useSearch,
} from '@nexifi/mdx-blog';
```

---

## useArticles()

Fetches all published articles with automatic caching.

```tsx
const { articles, isLoading, error, refresh } = useArticles();
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `articles` | `Article[]` | Array of articles (empty while loading) |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| undefined` | Error object if fetch failed |
| `refresh` | `() => void` | Manually revalidate data |

### SWR Options

- `revalidateOnFocus`: `false`
- `revalidateOnReconnect`: `true`
- `dedupingInterval`: 60,000ms (1 minute)

### Example

```tsx
function ArticleList() {
  const { articles, isLoading, error } = useArticles();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {articles.map(article => (
        <li key={article.slug}>{article.title}</li>
      ))}
    </ul>
  );
}
```

---

## useArticle(slug)

Fetches a single article by slug.

```tsx
const { article, isLoading, error, refresh } = useArticle('my-article-slug');
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `slug` | `string \| null` | Article slug. Pass `null` to skip fetching. |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `article` | `Article \| null \| undefined` | The article object |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| undefined` | Error object |
| `refresh` | `() => void` | Manually revalidate |

### SWR Options

- `revalidateOnFocus`: `false`
- `dedupingInterval`: 300,000ms (5 minutes)

### Example

```tsx
function ArticlePage({ slug }: { slug: string }) {
  const { article, isLoading, error } = useArticle(slug);

  if (isLoading) return <p>Loading article...</p>;
  if (error || !article) return <p>Article not found</p>;

  return (
    <article>
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.content || '' }} />
    </article>
  );
}
```

---

## useCategories()

Fetches available categories. Falls back to extracting categories from articles if the categories endpoint fails.

```tsx
const { categories, isLoading, error, refresh } = useCategories();
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `categories` | `string[]` | Array of category names |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| undefined` | Error object |
| `refresh` | `() => void` | Manually revalidate |

### SWR Options

- `revalidateOnFocus`: `false`
- `dedupingInterval`: 600,000ms (10 minutes)

---

## useRelatedArticles(slug, limit?)

Fetches articles related to the given article (same category, shared tags).

```tsx
const { relatedArticles, isLoading, error } = useRelatedArticles('my-slug', 3);
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `slug` | `string \| null` | — | Article slug. `null` skips fetching. |
| `limit` | `number` | `3` | Max number of related articles |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `relatedArticles` | `Article[]` | Related articles sorted by relevance |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| undefined` | Error object |
| `refresh` | `() => void` | Manually revalidate |

### Scoring Algorithm

- Same category: **+3 points**
- Each shared tag: **+1 point**

---

## usePagination(options?)

Client-side pagination with category filtering. Wraps `useArticles()` internally.

```tsx
const {
  items,
  pagination,
  setPage,
  setCategory,
  category,
  isLoading,
  error,
} = usePagination({ perPage: 9 });
```

### Parameters

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `page` | `number` | `1` | Initial page |
| `perPage` | `number` | `9` | Items per page |
| `category` | `string \| null` | `null` | Initial category filter |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `items` | `Article[]` | Articles for the current page |
| `pagination` | `PaginationInfo` | Pagination metadata |
| `setPage` | `(page: number) => void` | Navigate to a page (auto-scrolls to top) |
| `setCategory` | `(cat: string \| null) => void` | Filter by category (resets to page 1) |
| `category` | `string \| null` | Current category filter |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| undefined` | Error object |

### PaginationInfo

```typescript
{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### Example

```tsx
function PaginatedBlog() {
  const { items, pagination, setPage, setCategory, category } = usePagination({
    perPage: 9,
  });

  return (
    <div>
      {/* Category filter */}
      <button onClick={() => setCategory(null)}>All</button>
      <button onClick={() => setCategory('Tech')}>Tech</button>

      {/* Articles */}
      {items.map(article => <ArticleCard key={article.slug} article={article} />)}

      {/* Pagination */}
      <button onClick={() => setPage(pagination.currentPage - 1)} disabled={!pagination.hasPrevious}>
        Previous
      </button>
      <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
      <button onClick={() => setPage(pagination.currentPage + 1)} disabled={!pagination.hasNext}>
        Next
      </button>
    </div>
  );
}
```

---

## useArticlesByTag(tag)

Fetches articles that match a specific tag.

```tsx
const { articles, isLoading, error, refresh } = useArticlesByTag('javascript');
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `tag` | `string \| null` | Tag to filter by. `null` skips fetching. |

### Returns

Same as `useArticles()`.

---

## useSearch(query, options?)

Client-side full-text search across article titles, excerpts, categories, and tags.

```tsx
const { results, isSearching, totalResults } = useSearch('nextjs seo');
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | `string` | Search query |
| `options.minLength` | `number` | Min characters per search term (default: `2`) |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `results` | `Article[]` | Matching articles |
| `isSearching` | `boolean` | Loading state (from `useArticles`) |
| `totalResults` | `number` | Number of matches |

### Search Behavior

- Splits query into whitespace-separated terms
- Filters terms shorter than `minLength`
- ALL terms must match (AND logic)
- Searches in: `title`, `excerpt`, `category`, `tags`
- Case-insensitive

### Example

```tsx
function SearchBar() {
  const [query, setQuery] = useState('');
  const { results, isSearching, totalResults } = useSearch(query);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." />
      <p>{totalResults} results</p>
      {results.map(article => <ArticleCard key={article.slug} article={article} />)}
    </div>
  );
}
```
