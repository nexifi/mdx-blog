import * as React from "react";
import useSWR from "swr";
import { useBlogClient } from "./provider";
import { Article, PaginatedResult, PaginationOptions } from "./types";

/**
 * Hook pour récupérer tous les articles avec cache automatique
 *
 * @example
 * ```tsx
 * const { articles, isLoading, error } = useArticles();
 * ```
 */
export function useArticles() {
  const client = useBlogClient();

  const { data, error, isLoading, mutate } = useSWR<Article[]>(
    "/articles",
    () => client.getArticles(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    },
  );

  return {
    articles: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook pour récupérer un article spécifique
 *
 * @example
 * ```tsx
 * const { article, isLoading, error } = useArticle('mon-slug');
 * ```
 */
export function useArticle(slug: string | null) {
  const client = useBlogClient();

  const { data, error, isLoading, mutate } = useSWR<Article | null>(
    slug ? `/articles/${slug}` : null,
    () => (slug ? client.getArticle(slug) : null),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    },
  );

  return {
    article: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook pour récupérer les catégories
 *
 * @example
 * ```tsx
 * const { categories, isLoading } = useCategories();
 * ```
 */
export function useCategories() {
  const client = useBlogClient();

  const { data, error, isLoading, mutate } = useSWR<string[]>(
    "/articles/categories",
    () => client.getCategories(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 600000, // 10 minutes
    },
  );

  return {
    categories: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook pour récupérer les articles connexes
 *
 * @example
 * ```tsx
 * const { relatedArticles, isLoading } = useRelatedArticles('mon-slug', 3);
 * ```
 */
export function useRelatedArticles(slug: string | null, limit: number = 3) {
  const client = useBlogClient();

  const { data, error, isLoading, mutate } = useSWR<Article[]>(
    slug ? `/articles/${slug}/related` : null,
    () => (slug ? client.getRelatedArticles(slug, limit) : []),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    },
  );

  return {
    relatedArticles: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook pour pagination côté client
 *
 * @example
 * ```tsx
 * const { articles, pagination, setPage, setCategory } = usePagination({
 *   perPage: 9,
 * });
 * ```
 */
export function usePagination(options: PaginationOptions = {}) {
  const { articles, isLoading, error } = useArticles();
  const [page, setPage] = React.useState(options.page || 1);
  const [category, setCategory] = React.useState<string | null>(
    options.category || null,
  );
  const perPage = options.perPage || 9;

  // Filtrer par catégorie
  const filteredArticles = React.useMemo(() => {
    if (!category || category === "Tous les articles") {
      return articles;
    }
    return articles.filter((article: Article) => article.category === category);
  }, [articles, category]);

  // Calculer la pagination
  const paginatedResult: PaginatedResult<Article> = React.useMemo(() => {
    const totalItems = filteredArticles.length;
    const totalPages = Math.ceil(totalItems / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    return {
      items: filteredArticles.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        perPage,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }, [filteredArticles, page, perPage]);

  return {
    ...paginatedResult,
    isLoading,
    error,
    setPage: (newPage: number) => {
      setPage(newPage);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    setCategory: (newCategory: string | null) => {
      setCategory(newCategory);
      setPage(1); // Reset à la première page
    },
    category,
  };
}

/**
 * Hook pour recherche d'articles par tag
 *
 * @example
 * ```tsx
 * const { articles, isLoading } = useArticlesByTag('bordeaux');
 * ```
 */
export function useArticlesByTag(tag: string | null) {
  const client = useBlogClient();

  const { data, error, isLoading, mutate } = useSWR<Article[]>(
    tag ? `/articles/tag/${tag}` : null,
    () => (tag ? client.getArticlesByTag(tag) : []),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    },
  );

  return {
    articles: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Hook pour recherche textuelle d'articles (côté client)
 * Filtre par titre, excerpt et tags.
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState('');
 * const { results, isSearching } = useSearch(query);
 * ```
 */
export function useSearch(query: string, options?: { minLength?: number }) {
  const { articles, isLoading } = useArticles();
  const minLength = options?.minLength ?? 2;

  const results = React.useMemo(() => {
    if (!query || query.trim().length < minLength) {
      return articles;
    }

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= minLength);

    if (terms.length === 0) return articles;

    return articles.filter((article) => {
      const haystack = [
        article.title,
        article.excerpt,
        article.category,
        ...(article.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });
  }, [articles, query, minLength]);

  return {
    results,
    isSearching: isLoading,
    totalResults: results.length,
  };
}
