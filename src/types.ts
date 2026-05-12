/**
 * Métadonnées d'un article
 */
export interface ArticleMetadata {
  title: string;
  date: string;
  /** Date de dernière modification (ISO 8601). Utilisé pour `dateModified` JSON-LD,
   *  `<meta property="article:modified_time">`, le `<lastmod>` sitemap et la mention
   *  visible "Mis à jour le". Fallback sur `date` si absent. */
  updatedAt?: string;
  category: string;
  excerpt?: string;
  author?: string;
  authorTitle?: string;
  authorImage?: string;
  /** URL absolue de la page auteur (ex: https://site.com/author/john) — utilisée dans le JSON-LD Person */
  authorUrl?: string;
  /** Liens sociaux/externe de l'auteur — alimente `sameAs` dans le schéma Person */
  authorSameAs?: string[];
  image?: string;
  /** Explicit image width (px) — used for OG meta and JSON-LD */
  imageWidth?: number;
  /** Explicit image height (px) — used for OG meta and JSON-LD */
  imageHeight?: number;
  /** Base64 blur placeholder for the hero/cover image */
  imageBlurDataURL?: string;
  tags?: string[];
  readTime?: number;
  published?: boolean;
  status?: string;
  /** FAQ explicite — si fourni, prend le pas sur l'extraction automatique depuis le contenu */
  faqs?: ArticleFAQ[];
  /** Étapes HowTo — si fourni, génère un JSON-LD HowTo */
  howToSteps?: ArticleHowToStep[];
}

/**
 * Une question/réponse FAQ. Génère une entrée `Question` dans `FAQPage` JSON-LD.
 */
export interface ArticleFAQ {
  question: string;
  answer: string;
}

/**
 * Une étape pour un schema HowTo.
 */
export interface ArticleHowToStep {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

/**
 * Article complet avec contenu
 */
export interface Article extends ArticleMetadata {
  slug: string;
  content?: string;
}

/**
 * Configuration de l'API
 */
export interface BlogApiConfig {
  /** Base URL of the API (default: https://api-growthos.nexifi.com) */
  baseUrl?: string;

  // Headers HTTP personnalisés (auth, etc.)
  headers?: Record<string, string>;

  // Endpoints personnalisés
  endpoints?: {
    articles?: string; // Default: '/articles'
    article?: string; // Default: '/articles/:slug'
    categories?: string; // Default: '/articles/categories'
  };

  // Options de cache avec SWR
  cache?: {
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    dedupingInterval?: number;
    focusThrottleInterval?: number;
  };

  // Transformation des données
  transform?: {
    articles?: (data: any) => Article[];
    article?: (data: any) => Article;
  };

  // Timeout for fetch requests in milliseconds (default: 10000)
  timeout?: number;
}

/**
 * Options de pagination
 */
export interface PaginationOptions {
  page?: number;
  perPage?: number;
  category?: string | null;
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
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

/**
 * Configuration de la source des articles (GitHub, API, Local)
 */
export interface ArticleSourceConfig {
  // Pour GitHub
  owner?: string;
  repo?: string;
  branch?: string;
  path?: string;
  token?: string;

  // Pour API
  headers?: Record<string, string>;

  // Pour Local
  directory?: string;
}

/**
 * Schema de validation pour ArticleMetadata
 * Note: Utilise une validation simple TypeScript au lieu de Zod
 */
/**
 * Validation errors collected during schema validation
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Schema de validation pour ArticleMetadata
 * - `parse()`: coerces data, filling defaults for missing fields
 * - `validate()`: returns errors for required missing fields without silent fallback
 */
export const ArticleMetadataSchema = {
  /** Coerce data with defaults (lenient) */
  parse: (data: any): ArticleMetadata => {
    return {
      title: data.title || "",
      date: data.date || new Date().toISOString(),
      updatedAt: data.updatedAt ?? data.dateModified ?? data.updated_at,
      category: data.category || "Guide",
      excerpt: data.excerpt,
      author: data.author,
      authorTitle: data.authorTitle,
      authorImage: data.authorImage,
      authorUrl: data.authorUrl,
      authorSameAs: data.authorSameAs,
      image: data.image,
      imageWidth: data.imageWidth,
      imageHeight: data.imageHeight,
      imageBlurDataURL: data.imageBlurDataURL,
      tags: data.tags,
      readTime: data.readTime,
      published: data.published !== false,
      status: data.status,
      faqs: data.faqs,
      howToSteps: data.howToSteps,
    };
  },

  /** Validate data strictly, returning errors for missing required fields */
  validate: (
    data: any,
  ): { valid: boolean; errors: ValidationError[]; data: ArticleMetadata } => {
    const errors: ValidationError[] = [];

    if (
      !data.title ||
      typeof data.title !== "string" ||
      data.title.trim() === ""
    ) {
      errors.push({
        field: "title",
        message: "title is required and must be a non-empty string",
      });
    }
    if (!data.date || typeof data.date !== "string") {
      errors.push({
        field: "date",
        message: "date is required (ISO string format)",
      });
    } else if (isNaN(new Date(data.date).getTime())) {
      errors.push({
        field: "date",
        message: "date must be a valid date string",
      });
    }
    if (!data.category || typeof data.category !== "string") {
      errors.push({ field: "category", message: "category is required" });
    }
    if (data.tags && !Array.isArray(data.tags)) {
      errors.push({
        field: "tags",
        message: "tags must be an array of strings",
      });
    }
    if (data.readTime !== undefined && typeof data.readTime !== "number") {
      errors.push({ field: "readTime", message: "readTime must be a number" });
    }

    return {
      valid: errors.length === 0,
      errors,
      data: ArticleMetadataSchema.parse(data),
    };
  },
};
