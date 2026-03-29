import { Article } from "../types";
import { escapeXml } from "./xml";

/**
 * Configuration pour la génération du sitemap
 */
export interface SitemapConfig {
  /** URL de base du site */
  siteUrl: string;
  /** Chemin du blog */
  blogPath?: string;
  /** Fréquence de mise à jour par défaut */
  defaultChangeFreq?: ChangeFrequency;
  /** Priorité par défaut (0.0 à 1.0) */
  defaultPriority?: number;
}

export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFrequency;
  priority?: number;
  images?: SitemapImage[];
}

export interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
}

/**
 * Génère un sitemap XML pour les articles du blog
 *
 * @example
 * ```typescript
 * // Dans une API route Next.js: pages/api/sitemap.xml.ts
 * import { generateSitemap } from '@nexifi/mdx-blog';
 *
 * export default async function handler(req, res) {
 *   const articles = await getArticles();
 *   const sitemap = generateSitemap(articles, {
 *     siteUrl: 'https://example.com',
 *     blogPath: '/blog'
 *   });
 *
 *   res.setHeader('Content-Type', 'application/xml');
 *   res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
 *   res.write(sitemap);
 *   res.end();
 * }
 * ```
 */
export function generateSitemap(
  articles: Article[],
  config: SitemapConfig,
): string {
  const {
    siteUrl,
    blogPath = "/blog",
    defaultChangeFreq = "weekly",
    defaultPriority = 0.7,
  } = config;

  const baseUrl = siteUrl.replace(/\/$/, "");
  const blogUrl = `${baseUrl}${blogPath}`;

  // Entrées du sitemap
  const entries: SitemapEntry[] = [
    // Page principale du blog
    {
      loc: blogUrl,
      lastmod: new Date().toISOString().split("T")[0],
      changefreq: "daily",
      priority: 0.9,
    },
    // Articles
    ...articles
      .filter((article) => article.published !== false)
      .map((article) => ({
        loc: `${blogUrl}/${article.slug}`,
        lastmod: formatSitemapDate(article.date),
        changefreq: defaultChangeFreq,
        priority: defaultPriority,
        images: article.image
          ? [
              {
                loc: article.image.startsWith("http")
                  ? article.image
                  : `${baseUrl}${article.image}`,
                title: article.title,
                caption: article.excerpt,
              },
            ]
          : undefined,
      })),
  ];

  return buildSitemapXML(entries);
}

/**
 * Génère un sitemap XML à partir d'entrées personnalisées
 */
export function buildSitemapXML(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      let url = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>`;

      if (entry.lastmod) {
        url += `\n    <lastmod>${entry.lastmod}</lastmod>`;
      }

      if (entry.changefreq) {
        url += `\n    <changefreq>${entry.changefreq}</changefreq>`;
      }

      if (entry.priority !== undefined) {
        url += `\n    <priority>${entry.priority.toFixed(1)}</priority>`;
      }

      // Images (extension Google Image Sitemap)
      if (entry.images && entry.images.length > 0) {
        entry.images.forEach((image) => {
          url += `\n    <image:image>`;
          url += `\n      <image:loc>${escapeXml(image.loc)}</image:loc>`;
          if (image.title) {
            url += `\n      <image:title>${escapeXml(image.title)}</image:title>`;
          }
          if (image.caption) {
            url += `\n      <image:caption>${escapeXml(image.caption)}</image:caption>`;
          }
          url += `\n    </image:image>`;
        });
      }

      url += `\n  </url>`;
      return url;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}

/**
 * Génère un index de sitemap pour les grands sites
 */
export function generateSitemapIndex(
  sitemaps: { loc: string; lastmod?: string }[],
  siteUrl: string,
): string {
  const baseUrl = siteUrl.replace(/\/$/, "");

  const sitemapEntries = sitemaps
    .map((sitemap) => {
      const loc = sitemap.loc.startsWith("http")
        ? sitemap.loc
        : `${baseUrl}${sitemap.loc}`;

      let entry = `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>`;
      if (sitemap.lastmod) {
        entry += `\n    <lastmod>${sitemap.lastmod}</lastmod>`;
      }
      entry += `\n  </sitemap>`;
      return entry;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}

/**
 * Helper pour la configuration de next-sitemap
 * Retourne les entrées d'articles pour additionalPaths
 *
 * @example
 * ```javascript
 * // next-sitemap.config.js
 * const { getArticleSitemapEntries } = require('@nexifi/mdx-blog');
 *
 * module.exports = {
 *   siteUrl: 'https://example.com',
 *   generateRobotsTxt: true,
 *   additionalPaths: async (config) => {
 *     const articles = await fetchArticles();
 *     return getArticleSitemapEntries(articles, '/blog');
 *   }
 * }
 * ```
 */
export function getArticleSitemapEntries(
  articles: Article[],
  blogPath: string = "/blog",
): Array<{
  loc: string;
  lastmod: string;
  changefreq: ChangeFrequency;
  priority: number;
}> {
  return articles
    .filter((article) => article.published !== false)
    .map((article) => ({
      loc: `${blogPath}/${article.slug}`,
      lastmod: formatSitemapDate(article.date),
      changefreq: "weekly" as ChangeFrequency,
      priority: 0.7,
    }));
}

/**
 * Génère le contenu robots.txt avec référence au sitemap
 */
export function generateRobotsTxt(
  siteUrl: string,
  options: {
    sitemapPath?: string;
    disallowPaths?: string[];
    allowPaths?: string[];
    crawlDelay?: number;
  } = {},
): string {
  const {
    sitemapPath = "/sitemap.xml",
    disallowPaths = [],
    allowPaths = [],
    crawlDelay,
  } = options;

  const baseUrl = siteUrl.replace(/\/$/, "");

  let content = `# robots.txt generated by @nexifi/mdx-blog
User-agent: *
`;

  // Allow paths
  allowPaths.forEach((path) => {
    content += `Allow: ${path}\n`;
  });

  // Disallow paths
  disallowPaths.forEach((path) => {
    content += `Disallow: ${path}\n`;
  });

  // Crawl delay
  if (crawlDelay) {
    content += `Crawl-delay: ${crawlDelay}\n`;
  }

  // Sitemap
  content += `\nSitemap: ${baseUrl}${sitemapPath}\n`;

  // LLMs.txt (structured info for AI/LLM crawlers)
  content += `\n# LLMs.txt - Structured information for AI\n`;
  content += `# https://llmstxt.org\n`;
  content += `# llms.txt: ${baseUrl}/llms.txt\n`;
  content += `# llms-full.txt: ${baseUrl}/llms-full.txt\n`;

  return content;
}

/**
 * Helper for XML date formatting (YYYY-MM-DD)
 */
function formatSitemapDate(date: string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split("T")[0];
    }
    return d.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

export default {
  generateSitemap,
  buildSitemapXML,
  generateSitemapIndex,
  getArticleSitemapEntries,
  generateRobotsTxt,
};
