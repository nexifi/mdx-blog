import React from "react";
import Head from "next/head";
import { Article } from "../types";

/**
 * Configuration SEO pour les meta tags
 */
export interface SEOConfig {
  /** URL de base du site */
  siteUrl: string;
  /** Nom du site */
  siteName: string;
  /** Twitter handle (ex: @monsite) */
  twitterHandle?: string;
  /** Image par défaut si l'article n'en a pas */
  defaultImage?: string;
  /** Chemin du blog */
  blogPath?: string;
  /** Langue */
  locale?: string;
  /** Suffixe pour le titre (ex: " | Mon Site") */
  titleSuffix?: string;
  /** Facebook App ID (optionnel) */
  facebookAppId?: string;
}

interface ArticleHeadProps {
  article: Article;
  config: SEOConfig;
  /** Ajouter noindex (pour les previews) */
  noIndex?: boolean;
}

/**
 * Composant Head avec tous les meta tags SEO pour un article
 * Inclut : meta description, canonical, Open Graph, Twitter Cards
 *
 * @example
 * ```tsx
 * <ArticleHead
 *   article={article}
 *   config={{
 *     siteUrl: "https://example.com",
 *     siteName: "Mon Site",
 *     twitterHandle: "@monsite",
 *     blogPath: "/blog"
 *   }}
 * />
 * ```
 */
export function ArticleHead({
  article,
  config,
  noIndex = false,
}: ArticleHeadProps) {
  const {
    siteUrl,
    siteName,
    twitterHandle,
    defaultImage,
    blogPath = "/blog",
    locale = "fr_FR",
    titleSuffix = "",
    facebookAppId,
  } = config;

  const canonicalUrl = `${siteUrl}${blogPath}/${article.slug}`;
  const pageTitle = `${article.title}${titleSuffix || ` | ${siteName}`}`;
  const description =
    article.excerpt || `Découvrez notre article : ${article.title}`;

  // Image avec fallback
  const imageUrl = article.image
    ? article.image.startsWith("http")
      ? article.image
      : `${siteUrl}${article.image}`
    : defaultImage
      ? defaultImage.startsWith("http")
        ? defaultImage
        : `${siteUrl}${defaultImage}`
      : null;

  // Date formatée pour les meta
  const publishedTime = formatISODate(article.date);

  return (
    <Head>
      {/* Meta de base */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={article.title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {imageUrl && (
        <>
          <meta property="og:image" content={imageUrl} />
          <meta property="og:image:width" content={String(article.imageWidth || 1200)} />
          <meta property="og:image:height" content={String(article.imageHeight || 630)} />
          <meta property="og:image:alt" content={article.title} />
        </>
      )}

      {/* Article specifics (Open Graph) */}
      <meta property="article:published_time" content={publishedTime} />
      <meta property="article:modified_time" content={publishedTime} />
      <meta property="article:section" content={article.category} />
      {article.tags?.map((tag) => (
        <meta property="article:tag" content={tag} key={tag} />
      ))}
      {article.author && (
        <meta property="article:author" content={article.author} />
      )}

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={article.title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}

      {/* Facebook App ID (optionnel) */}
      {facebookAppId && <meta property="fb:app_id" content={facebookAppId} />}

      {/* Autres meta utiles */}
      <meta name="author" content={article.author || siteName} />
      {article.tags && article.tags.length > 0 && (
        <meta name="keywords" content={article.tags.join(", ")} />
      )}

      {/* Preconnect pour les images externes */}
      {imageUrl && !imageUrl.startsWith(siteUrl) && (
        <link
          rel="preconnect"
          href={new URL(imageUrl).origin}
          crossOrigin="anonymous"
        />
      )}
    </Head>
  );
}

/**
 * Composant Head pour la page liste du blog
 */
export function BlogListHead({
  config,
  title = "Blog",
  description,
  page = 1,
}: {
  config: SEOConfig;
  title?: string;
  description?: string;
  page?: number;
}) {
  const {
    siteUrl,
    siteName,
    twitterHandle,
    defaultImage,
    blogPath = "/blog",
    locale = "fr_FR",
    titleSuffix = "",
  } = config;

  const canonicalUrl =
    page > 1 ? `${siteUrl}${blogPath}?page=${page}` : `${siteUrl}${blogPath}`;

  const pageTitle =
    page > 1
      ? `${title} - Page ${page}${titleSuffix || ` | ${siteName}`}`
      : `${title}${titleSuffix || ` | ${siteName}`}`;

  const metaDescription =
    description || `Découvrez tous nos articles sur ${siteName}`;

  const imageUrl = defaultImage
    ? defaultImage.startsWith("http")
      ? defaultImage
      : `${siteUrl}${defaultImage}`
    : null;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />

      {/* Pagination SEO */}
      {page > 1 && (
        <link
          rel="prev"
          href={
            page === 2
              ? `${siteUrl}${blogPath}`
              : `${siteUrl}${blogPath}?page=${page - 1}`
          }
        />
      )}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
    </Head>
  );
}

/**
 * Helper pour formater une date en ISO 8601
 */
function formatISODate(date: string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export default ArticleHead;
