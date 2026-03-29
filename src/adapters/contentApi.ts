/**
 * Adaptateur pour l'API Content Master avec authentification par clé API
 * Utilise les clés API (cm_live_* ou cm_test_*) côté serveur uniquement (API routes)
 */

import { Article } from "../types";
import { sanitizeSlug, fetchWithTimeout } from "../utils/security";

/** URL par défaut de l'API ContentMaster */
const API_BASE_URL = "https://api-growthos.nexifi.com";

export interface ContentAPIConfig {
  /** Clé API Content Master (format: cm_live_* ou cm_test_*) */
  apiKey: string;
  /** Base URL de l'API (défaut: API ContentMaster) */
  baseUrl?: string;
  /** Timeout for requests in milliseconds (default: 10000) */
  timeout?: number;
  /** Default author name when article has no author */
  defaultAuthor?: string;
}

/**
 * Valide le format de la clé API Content Master
 */
function validateApiKey(apiKey: string): boolean {
  return (
    apiKey.startsWith("cm_live_") ||
    apiKey.startsWith("cm_test_") ||
    apiKey.startsWith("ak_")
  );
}

/**
 * Adapter pour l'API Content Master
 * Utilise les clés API pour l'authentification (pas de session/token à gérer)
 *
 * WARNING: This adapter is server-side only. Do not import or instantiate
 * in client-side code — the API key would be exposed in the browser bundle.
 */
export class ContentAPIAdapter {
  private config: ContentAPIConfig;
  private _baseUrl: string;
  private _articlesUrl: string;

  constructor(config: ContentAPIConfig) {
    // Guard: prevent instantiation in browser environment
    if (typeof window !== "undefined") {
      throw new Error(
        "ContentAPIAdapter must only be used server-side (API routes, getServerSideProps, getStaticProps). " +
          "Instantiating it in the browser would expose your API key.",
      );
    }

    if (!config.apiKey) {
      throw new Error("ContentAPIAdapter requires apiKey");
    }

    if (!validateApiKey(config.apiKey)) {
      throw new Error(
        "Invalid API key format. Must start with 'cm_live_', 'cm_test_', or 'ak_'",
      );
    }

    this.config = {
      ...config,
      baseUrl: (config.baseUrl || API_BASE_URL).replace(/\/+$/, ""),
      timeout: config.timeout ?? 10000,
      defaultAuthor: config.defaultAuthor ?? "Author",
    };

    // If baseUrl already ends with /articles, extract it as the articles endpoint
    // so we don't duplicate /articles in the URL
    const base = this.config.baseUrl!;
    if (base.endsWith("/articles")) {
      this._articlesUrl = base;
      this._baseUrl = base.slice(0, -"/articles".length);
    } else {
      this._articlesUrl = `${base}/articles`;
      this._baseUrl = base;
    }
  }

  /**
   * Effectue une requête authentifiée vers l'API avec la clé API
   */
  private async authenticatedFetch(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const response = await fetchWithTimeout(
      `${this._baseUrl}${endpoint}`,
      {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          ...options.headers,
        },
      },
      this.config.timeout,
    );

    if (response.status === 401) {
      throw new Error(
        "Invalid or expired API key. Please check your Content Master API key.",
      );
    }

    return response;
  }

  /**
   * Récupère tous les articles depuis l'API distante
   * Filtre uniquement les articles publiés
   */
  async getAllArticles(): Promise<Article[]> {
    try {
      const response = await this.authenticatedFetch(
        `${this._articlesUrl.replace(this._baseUrl, "")}?limit=100`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }

      const data = await response.json();

      // L'API retourne { success, data: { items: [...] } } ou un tableau
      const articles = Array.isArray(data)
        ? data
        : data.data?.items || data.data || data.articles || [];

      // Filtrer uniquement les articles publiés, ready ou approved
      return articles.filter(
        (article: Article) =>
          article.status === "published" ||
          article.status === "ready" ||
          article.status === "approved",
      );
    } catch (error) {
      console.error(
        "Error fetching articles from content API:",
        (error as Error).message,
      );
      throw error;
    }
  }

  /**
   * Récupère un article spécifique par son ID ou slug
   */
  async getArticleBySlug(slug: string): Promise<Article | null> {
    try {
      const safeSlug = sanitizeSlug(slug);
      const response = await this.authenticatedFetch(
        `${this._articlesUrl.replace(this._baseUrl, "")}/${safeSlug}`,
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error(
        "Error fetching article from content API:",
        (error as Error).message,
      );
      return null;
    }
  }

  /**
   * Transforme les données de l'API distante au format attendu par le package
   */
  transformArticle(article: any): Article {
    return ContentAPIAdapter.transformArticleWithDefaults(
      article,
      this.config.defaultAuthor,
    );
  }

  /**
   * Static version for backwards compatibility.
   * Uses a generic fallback author name.
   */
  static transformArticle(article: any): Article {
    return ContentAPIAdapter.transformArticleWithDefaults(article);
  }

  /**
   * Met à jour le statut d'un article sur l'API
   */
  async updateArticleStatus(articleId: string, status: string): Promise<void> {
    const response = await this.authenticatedFetch(
      `${this._articlesUrl.replace(this._baseUrl, "")}/${articleId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update article ${articleId}: ${response.statusText}`,
      );
    }
  }

  private static transformArticleWithDefaults(
    article: any,
    defaultAuthor: string = "Author",
  ): Article {
    // Générer un slug lisible à partir du titre (ou fallback sur l'ID)
    const slug = article.title
      ? article.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : article.id;

    // Extraire la catégorie depuis les tags ou mettre une valeur par défaut
    const category = article.tags?.[0] || "Article";

    // Créer un excerpt depuis le contenu si non fourni
    let excerpt = article.excerpt || article.metaDescription || "";
    if (!excerpt && article.content) {
      excerpt =
        article.content.substring(0, 200).replace(/<[^>]*>/g, "") + "...";
    }

    return {
      slug,
      title: article.title,
      excerpt,
      content: article.content || "",
      category,
      date:
        article.publishedAt || article.createdAt || new Date().toISOString(),
      image: article.featuredImage || undefined,
      author: article.author || defaultAuthor,
      tags: article.tags || [],
      status: article.status,
    };
  }
}
