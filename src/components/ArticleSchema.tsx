import React from "react";
import { Article } from "../types";
import { safeJsonLd } from "../utils/security";

/**
 * Configuration pour les données structurées Schema.org
 */
export interface SchemaConfig {
  /** URL de base du site */
  siteUrl: string;
  /** Nom du site/organisation */
  siteName: string;
  /** Logo de l'organisation (URL) */
  logoUrl?: string;
  /** Chemin du blog (ex: /blog) */
  blogPath?: string;
  /** Langue par défaut */
  locale?: string;
  /** Type d'organisation */
  organizationType?: "Organization" | "LocalBusiness" | "Person";
  /** Label for "Home" breadcrumb (default: "Home") */
  homeLabel?: string;
  /** Label for "Blog" breadcrumb (default: "Blog") */
  blogLabel?: string;
  /** Label prefix for blog list description (default: "Discover all articles from") */
  discoverArticlesLabel?: string;
}

interface ArticleSchemaProps {
  article: Article;
  config: SchemaConfig;
}

/**
 * Génère les données structurées JSON-LD pour un article de blog
 * Inclut : BlogPosting, BreadcrumbList, Organization
 *
 * @example
 * ```tsx
 * <ArticleSchema
 *   article={article}
 *   config={{
 *     siteUrl: "https://example.com",
 *     siteName: "Mon Site",
 *     logoUrl: "https://example.com/logo.png",
 *     blogPath: "/blog"
 *   }}
 * />
 * ```
 */
export function ArticleSchema({ article, config }: ArticleSchemaProps) {
  const {
    siteUrl,
    siteName,
    logoUrl,
    blogPath = "/blog",
    locale = "fr-FR",
    organizationType = "Organization",
  } = config;

  const articleUrl = `${siteUrl}${blogPath}/${article.slug}`;
  const blogUrl = `${siteUrl}${blogPath}`;

  // Schema BlogPosting / Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${articleUrl}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    headline: article.title,
    description: article.excerpt || "",
    image: article.image
      ? {
          "@type": "ImageObject",
          url: article.image.startsWith("http")
            ? article.image
            : `${siteUrl}${article.image}`,
          width: article.imageWidth || 1200,
          height: article.imageHeight || 630,
        }
      : undefined,
    datePublished: formatDate(article.date),
    dateModified: formatDate(article.date), // Utiliser updatedAt si disponible
    author: {
      "@type": "Person",
      name: article.author || siteName,
      ...(article.authorImage && {
        image: article.authorImage.startsWith("http")
          ? article.authorImage
          : `${siteUrl}${article.authorImage}`,
      }),
    },
    publisher: {
      "@type": organizationType,
      name: siteName,
      ...(logoUrl && {
        logo: {
          "@type": "ImageObject",
          url: logoUrl.startsWith("http") ? logoUrl : `${siteUrl}${logoUrl}`,
          width: 600,
          height: 60,
        },
      }),
    },
    inLanguage: locale,
    articleSection: article.category,
    keywords: article.tags?.join(", ") || article.category,
    wordCount: article.content ? countWords(article.content) : undefined,
    ...(article.readTime && {
      timeRequired: `PT${article.readTime}M`,
    }),
  };

  // Schema BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: config.homeLabel ?? "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: config.blogLabel ?? "Blog",
        item: blogUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.category,
        item: `${blogUrl}?category=${encodeURIComponent(article.category)}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  // Schema WebPage
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": articleUrl,
    url: articleUrl,
    name: article.title,
    description: article.excerpt || "",
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      url: siteUrl,
      name: siteName,
      inLanguage: locale,
    },
    primaryImageOfPage: article.image
      ? {
          "@type": "ImageObject",
          url: article.image.startsWith("http")
            ? article.image
            : `${siteUrl}${article.image}`,
        }
      : undefined,
    breadcrumb: {
      "@id": `${articleUrl}#breadcrumb`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(webPageSchema),
        }}
      />
    </>
  );
}

/**
 * Génère le schema JSON-LD pour la page liste du blog
 */
export function BlogListSchema({
  config,
  articles,
}: {
  config: SchemaConfig;
  articles: Article[];
}) {
  const { siteUrl, siteName, blogPath = "/blog", locale = "fr-FR" } = config;
  const blogUrl = `${siteUrl}${blogPath}`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${blogUrl}#collection`,
    url: blogUrl,
    name: `Blog - ${siteName}`,
    description: `${config.discoverArticlesLabel ?? "Discover all articles from"} ${siteName}`,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      url: siteUrl,
      name: siteName,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.slice(0, 10).map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${blogUrl}/${article.slug}`,
        name: article.title,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd(collectionSchema),
      }}
    />
  );
}

/**
 * Helper pour formater une date en ISO 8601
 */
function formatDate(date: string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      // Essayer de parser des formats français comme "15 janvier 2024"
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Helper pour compter les mots d'un contenu
 */
function countWords(content: string): number {
  // Retirer les balises HTML/MDX
  const text = content.replace(/<[^>]*>/g, "").replace(/[#*`_\[\]]/g, "");
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

export default ArticleSchema;
