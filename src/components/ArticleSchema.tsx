import React from "react";
import { Article } from "../types";
import { safeJsonLd } from "../utils/security";
import {
  extractFAQsFromMarkdown,
  extractHowToFromMarkdown,
  countWords,
} from "../utils/seoExtract";

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
  /** Disable automatic FAQPage extraction from H2/H3 questions (default: false) */
  disableAutoFAQ?: boolean;
  /** Disable automatic HowTo extraction from "Étape N / Step N" headings (default: false) */
  disableAutoHowTo?: boolean;
}

interface ArticleSchemaProps {
  article: Article;
  config: SchemaConfig;
}

/**
 * Génère les données structurées JSON-LD pour un article de blog.
 *
 * Schémas émis :
 * - `BlogPosting` (avec `dateModified` issu de `article.updatedAt` si fourni)
 * - `BreadcrumbList`
 * - `WebPage`
 * - `FAQPage` (auto, si questions détectées dans le contenu ou `article.faqs` fourni)
 * - `HowTo` (auto, si étapes "Étape N / Step N" détectées ou `article.howToSteps` fourni)
 */
export function ArticleSchema({ article, config }: ArticleSchemaProps) {
  const {
    siteUrl,
    siteName,
    logoUrl,
    blogPath = "/blog",
    locale = "fr-FR",
    organizationType = "Organization",
    disableAutoFAQ = false,
    disableAutoHowTo = false,
  } = config;

  const baseUrl = siteUrl.replace(/\/$/, "");
  const articleUrl = `${baseUrl}${blogPath}/${article.slug}`;
  const blogUrl = `${baseUrl}${blogPath}`;

  const datePublished = formatDate(article.date);
  const dateModified = formatDate(article.updatedAt ?? article.date);

  // Schema BlogPosting / Article
  const articleSchema: Record<string, unknown> = {
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
            : `${baseUrl}${article.image}`,
          width: article.imageWidth || 1200,
          height: article.imageHeight || 630,
        }
      : undefined,
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: article.author || siteName,
      ...(article.authorUrl && { url: article.authorUrl }),
      ...(article.authorSameAs &&
        article.authorSameAs.length > 0 && { sameAs: article.authorSameAs }),
      ...(article.authorImage && {
        image: article.authorImage.startsWith("http")
          ? article.authorImage
          : `${baseUrl}${article.authorImage}`,
      }),
    },
    publisher: {
      "@type": organizationType,
      "@id": `${baseUrl}#organization`,
      name: siteName,
      ...(logoUrl && {
        logo: {
          "@type": "ImageObject",
          url: logoUrl.startsWith("http") ? logoUrl : `${baseUrl}${logoUrl}`,
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
    "@id": `${articleUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: config.homeLabel ?? "Home",
        item: baseUrl,
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
    datePublished,
    dateModified,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}#website`,
      url: baseUrl,
      name: siteName,
      inLanguage: locale,
    },
    primaryImageOfPage: article.image
      ? {
          "@type": "ImageObject",
          url: article.image.startsWith("http")
            ? article.image
            : `${baseUrl}${article.image}`,
        }
      : undefined,
    breadcrumb: {
      "@id": `${articleUrl}#breadcrumb`,
    },
  };

  // FAQPage (manual override > auto-extract)
  const faqs =
    article.faqs && article.faqs.length > 0
      ? article.faqs
      : disableAutoFAQ
        ? []
        : extractFAQsFromMarkdown(article.content);

  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${articleUrl}#faq`,
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  // HowTo (manual override > auto-extract)
  const howToSteps =
    article.howToSteps && article.howToSteps.length >= 2
      ? article.howToSteps
      : disableAutoHowTo
        ? []
        : extractHowToFromMarkdown(article.content);

  const howToSchema =
    howToSteps.length >= 2
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "@id": `${articleUrl}#howto`,
          name: article.title,
          ...(article.excerpt && { description: article.excerpt }),
          ...(article.readTime && { totalTime: `PT${article.readTime}M` }),
          step: howToSteps.map((step, idx) => ({
            "@type": "HowToStep",
            position: idx + 1,
            name: step.name,
            text: step.text,
            ...(step.url && { url: step.url }),
            ...(step.image && { image: step.image }),
          })),
        }
      : null;

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(faqSchema),
          }}
        />
      )}
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(howToSchema),
          }}
        />
      )}
    </>
  );
}

/**
 * Génère le schema JSON-LD pour la page liste du blog (`CollectionPage` + `Blog`).
 */
export function BlogListSchema({
  config,
  articles,
}: {
  config: SchemaConfig;
  articles: Article[];
}) {
  const { siteUrl, siteName, blogPath = "/blog", locale = "fr-FR" } = config;
  const baseUrl = siteUrl.replace(/\/$/, "");
  const blogUrl = `${baseUrl}${blogPath}`;

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
      "@id": `${baseUrl}#website`,
      url: baseUrl,
      name: siteName,
    },
    mainEntity: {
      "@type": "Blog",
      "@id": `${blogUrl}#blog`,
      name: `${siteName} — Blog`,
      url: blogUrl,
      inLanguage: locale,
      publisher: { "@id": `${baseUrl}#organization`, name: siteName },
      blogPost: articles
        .filter((a) => a.published !== false)
        .slice(0, 20)
        .map((article) => ({
          "@type": "BlogPosting",
          "@id": `${blogUrl}/${article.slug}#article`,
          headline: article.title,
          url: `${blogUrl}/${article.slug}`,
          datePublished: formatDate(article.date),
          dateModified: formatDate(article.updatedAt ?? article.date),
          ...(article.author && {
            author: { "@type": "Person", name: article.author },
          }),
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
      return new Date().toISOString();
    }
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export default ArticleSchema;
