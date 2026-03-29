import { Article, BlogApiConfig } from "./types";
import { sanitizeSlug, fetchWithTimeout } from "./utils/security";

/**
 * BlogApiClient always uses relative URLs by default (empty string base).
 *
 * This client is designed to call LOCAL API routes (e.g., `/api/blog`) that proxy
 * to ContentAPIAdapter server-side. It should NEVER call the external ContentMaster
 * API directly — that would expose the API key and cause CORS errors.
 *
 * If you need an absolute base URL (e.g., for SSR where relative URLs don't work),
 * pass `baseUrl` explicitly in the BlogApiConfig.
 */

/**
 * Client API pour charger les articles depuis une API REST
 *
 * @example
 * ```ts
 * // Avec l'API par défaut (ContentMaster)
 * const client = new BlogApiClient();
 *
 * // Avec une API custom
 * const client = new BlogApiClient({
 *   baseUrl: 'https://my-api.com/v1',
 *   headers: { Authorization: 'Bearer token' }
 * });
 * ```
 */
export class BlogApiClient {
  private baseUrl: string;
  private config: Required<Pick<BlogApiConfig, "endpoints">> &
    Pick<BlogApiConfig, "headers" | "transform" | "timeout">;

  constructor(config: BlogApiConfig = {}) {
    // Warn if auth headers are being used in the browser
    if (
      typeof window !== "undefined" &&
      config.headers &&
      (config.headers as Record<string, string>)["Authorization"]
    ) {
      console.warn(
        "[mdx-blog] WARNING: BlogApiClient is being used in the browser with Authorization headers. " +
          "This exposes credentials in the client bundle. Use ContentAPIAdapter (server-only) instead.",
      );
    }
    this.baseUrl = (config.baseUrl || "").replace(/\/+$/, "");
    this.config = {
      headers: config.headers,
      endpoints: {
        articles: "/articles",
        article: "/articles/:slug",
        categories: "/articles/categories",
        ...config.endpoints,
      },
      transform: config.transform,
      timeout: config.timeout ?? 10000,
    };
  }

  /**
   * Effectue une requête HTTP avec timeout
   */
  private async fetch<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...this.config.headers,
    };

    const response = await fetchWithTimeout(
      url,
      { headers },
      this.config.timeout,
    );

    if (!response.ok) {
      throw new Error(
        `API error: ${response.status} ${response.statusText} - ${url}`,
      );
    }

    return response.json();
  }

  /**
   * Récupère tous les articles
   */
  async getArticles(): Promise<Article[]> {
    try {
      const endpoint = this.config.endpoints.articles || "/articles";
      const data = await this.fetch<any>(endpoint);

      // Utiliser le transformateur personnalisé si disponible
      if (this.config.transform?.articles) {
        return this.config.transform.articles(data);
      }

      // Transformation par défaut
      const articles = Array.isArray(data)
        ? data
        : data.articles || data.data || [];

      return articles
        .map((item: any) => this.normalizeArticle(item))
        .filter(
          (article: Article) =>
            article.status === "published" || article.status === "ready",
        )
        .sort(
          (a: Article, b: Article) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    } catch (error) {
      console.error("Error fetching articles:", (error as Error).message);
      throw error;
    }
  }

  /**
   * Récupère un article par son slug
   */
  async getArticle(slug: string): Promise<Article | null> {
    try {
      const safeSlug = sanitizeSlug(slug);
      const endpoint = (
        this.config.endpoints.article || "/articles/:slug"
      ).replace(":slug", safeSlug);
      const data = await this.fetch<any>(endpoint);

      // Utiliser le transformateur personnalisé si disponible
      if (this.config.transform?.article) {
        return this.config.transform.article(data);
      }

      // Transformation par défaut
      return this.normalizeArticle(data.data || data.article || data);
    } catch (error) {
      console.error(`Error fetching article ${slug}:`, error);
      return null;
    }
  }

  /**
   * Récupère les catégories disponibles
   */
  async getCategories(): Promise<string[]> {
    try {
      const endpoint =
        this.config.endpoints.categories || "/articles/categories";
      const data = await this.fetch<any>(endpoint);

      if (Array.isArray(data)) {
        return data;
      }

      return data.categories || data.data || [];
    } catch (error) {
      // Fallback: extraire les catégories des articles
      const articles = await this.getArticles();
      const categories = new Set<string>();
      categories.add("Tous les articles");

      articles.forEach((article) => {
        if (article.category) {
          categories.add(article.category);
        }
      });

      return Array.from(categories);
    }
  }

  /**
   * Normalise un article venant de l'API
   */
  private normalizeArticle(data: any): Article {
    return {
      slug: data.slug,
      title: data.title,
      date: data.date,
      category: data.category,
      excerpt: data.excerpt,
      author: data.author,
      authorTitle: data.authorTitle || data.author_title,
      authorImage: data.authorImage || data.author_image,
      image: data.image,
      tags: data.tags || [],
      readTime: data.readTime || data.read_time,
      published: data.published !== false,
      content: data.content,
      status: data.status,
    };
  }

  /**
   * Recherche d'articles par tag
   */
  async getArticlesByTag(tag: string): Promise<Article[]> {
    const articles = await this.getArticles();
    return articles.filter((article) =>
      article.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()),
    );
  }

  /**
   * Recherche d'articles par catégorie
   */
  async getArticlesByCategory(category: string): Promise<Article[]> {
    const articles = await this.getArticles();

    if (category === "Tous les articles") {
      return articles;
    }

    return articles.filter((article) => article.category === category);
  }

  /**
   * Articles connexes (même catégorie ou tags similaires)
   */
  async getRelatedArticles(
    slug: string,
    limit: number = 3,
  ): Promise<Article[]> {
    const currentArticle = await this.getArticle(slug);

    if (!currentArticle) {
      return [];
    }

    const allArticles = await this.getArticles();

    // Filtrer l'article actuel
    const otherArticles = allArticles.filter(
      (article) => article.slug !== slug,
    );

    // Scorer chaque article
    const scoredArticles = otherArticles.map((article) => {
      let score = 0;

      // Même catégorie = +3 points
      if (article.category === currentArticle.category) {
        score += 3;
      }

      // Tags en commun = +1 point par tag
      const commonTags =
        article.tags?.filter((tag) => currentArticle.tags?.includes(tag)) || [];
      score += commonTags.length;

      return { article, score };
    });

    // Trier par score et retourner les meilleurs
    return scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ article }) => article);
  }
}
